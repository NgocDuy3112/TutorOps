import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";

@Injectable()
export class NotificationsRepository {
  async activeSubscriptions(userId: string) {
    const result = await pool.query(
      `SELECT endpoint, user_agent AS "userAgent", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM push_subscriptions
       WHERE user_id = $1 AND revoked_at IS NULL
       ORDER BY updated_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async revoke(userId: string, endpoint: string) {
    await pool.query(
      `UPDATE push_subscriptions
       SET revoked_at = now(), updated_at = now()
       WHERE user_id = $1 AND endpoint = $2`,
      [userId, endpoint],
    );
  }
}
