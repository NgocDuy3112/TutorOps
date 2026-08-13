import type { PushSubscriptionDto } from "./notifications.dto";
import { Injectable, BadRequestException } from "@nestjs/common";
import webpush from "web-push";
import { pool } from "../db/client";

@Injectable()
export class NotificationsService {
  constructor() {
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
  async subscribe(userId: string, input: PushSubscriptionDto) {
    if (!input?.endpoint || !input?.keys?.p256dh || !input?.keys?.auth)
      throw new BadRequestException("invalid_push_subscription");
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
    await pool.query(
      `UPDATE push_subscriptions SET revoked_at = now(), updated_at = now() WHERE user_id = $1 AND endpoint = $2`,
      [userId, endpoint],
    );
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
