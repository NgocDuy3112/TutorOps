import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";

export type CalendarTokenRow = {
  userId: string;
  refreshToken: string;
  accessToken: string | null;
  tokenExpiry: Date | null;
};

@Injectable()
export class GoogleCalendarRepository {
  async findToken(userId: string): Promise<CalendarTokenRow | null> {
    const result = await pool.query(
      `SELECT user_id AS "userId", refresh_token AS "refreshToken",
              access_token AS "accessToken",
              token_expiry AS "tokenExpiry"
       FROM google_calendar_tokens
       WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async upsertTokens(
    userId: string,
    input: {
      refreshToken: string;
      accessToken: string | null;
      tokenExpiry: Date | null;
    },
  ) {
    await pool.query(
      `INSERT INTO google_calendar_tokens
         (user_id, refresh_token, access_token, token_expiry, connected_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (user_id) DO UPDATE
         SET refresh_token = EXCLUDED.refresh_token,
             access_token = EXCLUDED.access_token,
             token_expiry = EXCLUDED.token_expiry,
             connected_at = now()`,
      [userId, input.refreshToken, input.accessToken, input.tokenExpiry],
    );
  }

  async deleteToken(userId: string) {
    await pool.query(
      `DELETE FROM google_calendar_tokens WHERE user_id = $1`,
      [userId],
    );
  }

  async saveAccessToken(userId: string, accessToken: string, expiry: Date) {
    await pool.query(
      `UPDATE google_calendar_tokens
       SET access_token = $2, token_expiry = $3
       WHERE user_id = $1`,
      [userId, accessToken, expiry],
    );
  }
}
