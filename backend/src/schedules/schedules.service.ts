import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { AppLogger } from "../common/app-logger";
import { pool } from "../db/client";

// App serves Vietnamese tutors; schedule slots are VN wall-clock (UTC+7, no DST).
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const GENERATE_DAYS_AHEAD = 7;
const RUN_INTERVAL_MS = 6 * 60 * 60 * 1000;

type SlotRow = {
  classId: string;
  pricingMode: "per_session" | "per_hour" | "per_month";
  classPrice: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
  studentId: string;
};

/**
 * Auto-generates teaching sessions from fixed weekly class schedules
 * (classes.auto_schedule = true). Idempotent: a partial unique index on
 * (class_id, student_id, taught_at) makes re-runs no-ops, and soft-deleted
 * sessions free their slot so a cancelled lesson is re-created next run.
 */
@Injectable()
export class SchedulesService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly logger: AppLogger) {}

  onModuleInit() {
    // Small delay so bootstrap (DB/Redis connect) settles first.
    this.timer = setInterval(() => void this.generateUpcoming(), RUN_INTERVAL_MS);
    setTimeout(() => void this.generateUpcoming(), 5_000).unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async generateUpcoming(): Promise<number> {
    try {
      const slots = await pool.query<SlotRow>(
        `
        SELECT
          c.id AS "classId",
          c.pricing_mode AS "pricingMode",
          c.default_price_vnd AS "classPrice",
          cs.weekday,
          to_char(cs.start_time, 'HH24:MI') AS "startTime",
          to_char(cs.end_time, 'HH24:MI') AS "endTime",
          cst.student_id AS "studentId"
        FROM classes AS c
        INNER JOIN class_schedules AS cs ON cs.class_id = c.id
        INNER JOIN class_students AS cst ON cst.class_id = c.id
        WHERE c.auto_schedule = true
          AND c.deleted_at IS NULL
        `,
      );
      let created = 0;
      for (const row of slots.rows) {
        for (const occurrence of this.upcomingOccurrences(row)) {
          const result = await pool.query(
            `
            INSERT INTO teaching_sessions (
              student_id, class_id, taught_at, ends_at, price_vnd
            )
            SELECT
              $1, $2, $3, $4,
              CASE c.pricing_mode
                WHEN 'per_month' THEN 0
                WHEN 'per_hour' THEN ROUND(
                  COALESCE(c.default_price_vnd, 0)
                  * EXTRACT(EPOCH FROM ($4::timestamptz - $3::timestamptz)) / 3600.0
                )::bigint
                ELSE COALESCE(c.default_price_vnd, 0)
              END
            FROM classes AS c
            WHERE c.id = $2
            ON CONFLICT (class_id, student_id, taught_at)
              WHERE class_id IS NOT NULL AND deleted_at IS NULL
            DO NOTHING
            `,
            [
              row.studentId,
              row.classId,
              new Date(occurrence.startUtcMs),
              new Date(occurrence.endUtcMs),
            ],
          );
          created += result.rowCount ?? 0;
        }
      }
      if (created > 0)
        this.logger.log(`Auto-generated ${created} teaching sessions`);
      return created;
    } catch (error) {
      this.logger.error(
        `Schedule generation failed: ${error instanceof Error ? error.message : error}`,
      );
      return 0;
    }
  }

  private upcomingOccurrences(row: SlotRow): { startUtcMs: number; endUtcMs: number }[] {
    const nowVn = new Date(Date.now() + VN_OFFSET_MS);
    const occurrences: { startUtcMs: number; endUtcMs: number }[] = [];
    for (let offset = 0; offset <= GENERATE_DAYS_AHEAD; offset++) {
      const vnDay = new Date(
        Date.UTC(
          nowVn.getUTCFullYear(),
          nowVn.getUTCMonth(),
          nowVn.getUTCDate() + offset,
        ),
      );
      if (vnDay.getUTCDay() !== row.weekday) continue;
      const startUtcMs =
        vnDay.getTime() + parseHm(row.startTime) - VN_OFFSET_MS;
      const endUtcMs = vnDay.getTime() + parseHm(row.endTime) - VN_OFFSET_MS;
      // Only future slots; past ones are the teacher's job to log manually.
      if (startUtcMs <= Date.now()) continue;
      occurrences.push({ startUtcMs, endUtcMs });
    }
    return occurrences;
  }
}

function parseHm(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours ?? 0) * 3_600_000 + (minutes ?? 0) * 60_000;
}
