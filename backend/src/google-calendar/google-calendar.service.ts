import { Injectable } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";
import { AppLogger } from "../common/app-logger";
import { pool } from "../db/client";
import {
  GoogleCalendarRepository,
} from "./google-calendar.repository";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const APP_TIMEZONE = "Asia/Ho_Chi_Minh";
// BYDAY values for RRULE — 0=SU … 6=SA (same as class_schedules.weekday).
const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

const GCAL_SYNC_ENABLED = false;

/**
 * Push direction of the Google Calendar integration: every fixed-schedule
 * slot of an auto-scheduled class becomes ONE recurring event on the
 * teacher's primary calendar. Sync is a stateless reconcile — desired =
 * class_schedules rows, actual = GCal events found via privateExtended
 * Property — so no local event-id bookkeeping is needed.
 */
@Injectable()
export class GoogleCalendarService {
  constructor(
    private readonly repository: GoogleCalendarRepository,
    private readonly logger: AppLogger,
  ) {}

  async isConnected(userId: string) {
    return Boolean(await this.repository.findToken(userId));
  }

  async disconnect(userId: string) {
    // v1: events already pushed stay on Google Calendar.
    await this.repository.deleteToken(userId);
    return { ok: true };
  }

  /** Reconciles all auto_schedule classes of the teacher with their events. */
  async syncTeacher(userId: string): Promise<{ created: number; deleted: number }> {
    if (!GCAL_SYNC_ENABLED) return { created: 0, deleted: 0 };
    const token = await this.repository.findToken(userId);
    if (!token) return { created: 0, deleted: 0 };
    const accessToken = await this.accessToken(userId, token.refreshToken);
    if (!accessToken) return { created: 0, deleted: 0 };

    const classes = await pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM classes
       WHERE teacher_id = $1 AND auto_schedule = true AND deleted_at IS NULL`,
      [userId],
    );

    // Desired slot keys per class.
    const desired: { key: string; classId: string; className: string; slot: { weekday: number; startTime: string; endTime: string } }[] = [];
    for (const klass of classes.rows) {
      const slots = await pool.query<{ weekday: number; startTime: string; endTime: string }>(
        `SELECT weekday, to_char(start_time, 'HH24:MI') AS "startTime",
                to_char(end_time, 'HH24:MI') AS "endTime"
         FROM class_schedules WHERE class_id = $1 ORDER BY weekday`,
        [klass.id],
      );
      for (const slot of slots.rows) {
        desired.push({
          key: `${slot.weekday}-${slot.startTime}-${slot.endTime}`,
          classId: klass.id,
          className: klass.name,
          slot,
        });
      }
    }

    // Actual: all TutorOps events on this user's primary calendar.
    const listed = (await (
      await this.gcal(
        accessToken,
        `/calendars/primary/events?maxResults=250&showDeleted=false&privateExtendedProperty=tutoropsUser%3A${userId}`,
      )
    ).json()) as {
      items?: {
        id: string;
        status: string;
        extendedProperties?: { private?: Record<string, string> };
      }[];
    };
    const actual = new Map<string, { id: string }>();
    for (const item of listed.items ?? []) {
      if (item.status === "cancelled") continue;
      const slotKey = item.extendedProperties?.private?.tutoropsSlot;
      const ownerClass = item.extendedProperties?.private?.tutoropsClass;
      if (slotKey && ownerClass) actual.set(`${ownerClass}|${slotKey}`, { id: item.id });
    }

    let created = 0;
    let deleted = 0;
    const desiredKeys = new Set(desired.map((item) => `${item.classId}|${item.key}`));
    // Delete events that no longer map to a desired slot.
    for (const [fullKey, event] of actual) {
      if (!desiredKeys.has(fullKey)) {
        await this.gcal(accessToken, `/calendars/primary/events/${event.id}`, {
          method: "DELETE",
        }).catch(() => {});
        deleted += 1;
        actual.delete(fullKey);
      }
    }
    // Create events for new slots.
    for (const item of desired) {
      const fullKey = `${item.classId}|${item.key}`;
      if (actual.has(fullKey)) continue;
      const start = this.nextOccurrenceIso(item.slot.weekday, item.slot.startTime);
      await this.gcal(accessToken, "/calendars/primary/events", {
        method: "POST",
        body: JSON.stringify({
          summary: `Dạy: ${item.className}`,
          start: { dateTime: start, timeZone: APP_TIMEZONE },
          end: { dateTime: this.nextOccurrenceIso(item.slot.weekday, item.slot.endTime), timeZone: APP_TIMEZONE },
          recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[item.slot.weekday]}`],
          extendedProperties: {
            private: {
              tutoropsUser: userId,
              tutoropsClass: item.classId,
              tutoropsSlot: item.key,
            },
          },
        }),
      });
      created += 1;
    }
    if (created || deleted)
      this.logger.log(`Google Calendar sync: +${created} / -${deleted} events`);
    return { created, deleted };
  }

  /** Refreshes (and persists) the access token; null when revoked. */
  private async accessToken(userId: string, refreshToken: string) {
    try {
      const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );
      client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await client.refreshAccessToken();
      if (!credentials.access_token) return null;
      await this.repository.saveAccessToken(
        userId,
        credentials.access_token,
        credentials.expiry_date != null
          ? new Date(credentials.expiry_date)
          : new Date(Date.now() + 3600_000),
      );
      return credentials.access_token;
    } catch (error) {
      this.logger.error(
        `Google Calendar token refresh failed: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  private async gcal(
    accessToken: string,
    path: string,
    init?: RequestInit,
  ) {
    return fetch(`${CALENDAR_API}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  }

  /** Next date (VN calendar) whose weekday matches, as wall-clock ISO minus
   *  timezone — Google stores it with timeZone so wall-clock is correct. */
  private nextOccurrenceIso(weekday: number, hhmm: string): string {
    const nowVn = new Date(Date.now() + 7 * 60 * 60 * 1000);
    for (let offset = 0; offset < 7; offset++) {
      const day = new Date(
        Date.UTC(
          nowVn.getUTCFullYear(),
          nowVn.getUTCMonth(),
          nowVn.getUTCDate() + offset,
        ),
      );
      if (day.getUTCDay() !== weekday) continue;
      const [hours, minutes] = hhmm.split(":").map(Number);
      day.setUTCHours(hours, minutes, 0, 0);
      // Return VN wall clock (strip the UTC suffix so Google applies the
      // declared timeZone instead of re-reading an offset).
      return day.toISOString().replace("Z", "").slice(0, 19);
    }
    // Unreachable: weekday always matches within 7 days.
    throw new Error("no occurrence");
  }
}
