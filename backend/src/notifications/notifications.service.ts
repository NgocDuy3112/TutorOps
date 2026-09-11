import type { PushSubscriptionDto } from "./notifications.dto";
import {
  Injectable,
  type OnApplicationBootstrap,
} from "@nestjs/common";
import { BadRequestError } from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import webpush from "web-push";
import { pool } from "../db/client";
import { NotificationsRepository } from "./notifications.repository";
import { VersionService } from "../version/version.service";

const ANNOUNCED_VERSION_KEY = "announced_version";

@Injectable()
export class NotificationsService implements OnApplicationBootstrap {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly version: VersionService,
  ) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (publicKey && privateKey)
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || "mailto:admin@example.com",
        publicKey,
        privateKey,
      );
  }
  publicKey() {
    return process.env.VAPID_PUBLIC_KEY ?? null;
  }

  // Replaces the old update banner: when the backend boots with a version
  // that was never announced before, every push subscriber gets one notice.
  // Flag is written before sending so a redeploy never spams subscribers.
  async announceUpdateIfNew() {
    const version = this.version.get();
    if (!version || version === "0.0.0") return;
    const existing = await pool.query(
      `SELECT value FROM system_flags WHERE key = $1`,
      [ANNOUNCED_VERSION_KEY],
    );
    if (existing.rows[0]?.value === version) return;
    await pool.query(
      `INSERT INTO system_flags (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [ANNOUNCED_VERSION_KEY, version],
    );
    const subscribers = await pool.query(
      `SELECT DISTINCT user_id FROM push_subscriptions WHERE revoked_at IS NULL`,
    );
    await Promise.all(
      subscribers.rows.map((row) =>
        this.sendToUser(row.user_id, {
          title: "TutorOps có bản cập nhật mới",
          body: `Phiên bản ${version} vừa được phát hành. Tải lại app để dùng bản mới nhất.`,
          url: "/",
        }),
      ),
    );
  }

  onApplicationBootstrap() {
    void this.announceUpdateIfNew().catch(() => {
      // Announcing is best-effort: a fresh DB without the migration or a
      // transient DB hiccup must not block app startup.
    });
  }
  async listActiveSubscriptions(userId: string) {
    return this.repository.activeSubscriptions(userId);
  }

  async subscribe(userId: string, input: PushSubscriptionDto) {
    if (!input?.endpoint || !input?.keys?.p256dh || !input?.keys?.auth)
      throw new BadRequestError(ErrorCodes.INVALID_PUSH_SUBSCRIPTION);
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, revoked_at) VALUES ($1, $2, $3, $4, $5, NULL) ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_agent = EXCLUDED.user_agent, revoked_at = NULL, updated_at = now()`,
      [
        userId,
        input.endpoint,
        input.keys.p256dh,
        input.keys.auth,
        input.userAgent ?? null,
      ],
    );
    return { ok: true };
  }
  async unsubscribe(userId: string, endpoint: string) {
    await this.repository.revoke(userId, endpoint);
    return { ok: true };
  }
  async sendToUser(
    userId: string,
    payload: { title: string; body: string; url?: string },
  ) {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
    const result = await pool.query(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );
    await Promise.all(
      result.rows.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            JSON.stringify(payload),
          );
        } catch (error: unknown) {
          if (
            error instanceof Error &&
            "statusCode" in error &&
            (error.statusCode === 404 || error.statusCode === 410)
          )
            await pool.query(
              `UPDATE push_subscriptions SET revoked_at = now(), updated_at = now() WHERE endpoint = $1`,
              [subscription.endpoint],
            );
        }
      }),
    );
  }
}
