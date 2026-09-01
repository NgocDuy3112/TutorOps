import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";

@Injectable()
export class AuthRepository {
  async findProfile(userId: string) {
    return (
      await pool.query(
        'SELECT id, email, role, full_name AS "fullName", phone FROM users WHERE id = $1 AND deleted_at IS NULL',
        [userId],
      )
    ).rows[0];
  }

  async updateProfile(
    userId: string,
    fullName: string | undefined,
    phone: string | undefined,
  ) {
    return (
      await pool.query(
        'UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), updated_at = now() WHERE id = $3 AND deleted_at IS NULL RETURNING id, email, role, full_name AS "fullName", phone',
        [fullName ?? null, phone ?? null, userId],
      )
    ).rows[0];
  }

  async findPasswordHash(userId: string) {
    return (
      await pool.query(
        'SELECT password_hash AS "passwordHash" FROM users WHERE id = $1 AND deleted_at IS NULL',
        [userId],
      )
    ).rows[0];
  }

  async updatePassword(userId: string, passwordHash: string) {
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2 AND deleted_at IS NULL",
      [passwordHash, userId],
    );
  }

  async createUser(email: string, passwordHash: string) {
    const query = `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, role
    `;
    return (await pool.query(query, [email, passwordHash])).rows[0];
  }

  async findByEmail(email: string) {
    const query = `
      SELECT id, email, role, password_hash
      FROM users
      WHERE email = $1
        AND deleted_at IS NULL
    `;
    return (await pool.query(query, [email])).rows[0];
  }

  async findOrCreateGoogleUser(
    email: string,
    providerAccountId: string,
    fullName?: string,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const linkedQuery = `
        SELECT u.id, u.email, u.role
        FROM oauth_accounts AS oa
        JOIN users AS u ON u.id = oa.user_id
        WHERE oa.provider = 'google'
          AND oa.provider_account_id = $1
          AND u.deleted_at IS NULL
      `;
      const linked = await client.query(linkedQuery, [providerAccountId]);
      let user = linked.rows[0];

      if (!user) {
        const existingQuery = `
          SELECT id, email, role
          FROM users
          WHERE email = $1
            AND deleted_at IS NULL
        `;
        const existing = await client.query(existingQuery, [email]);
        const createQuery = `
          INSERT INTO users (email, role)
          VALUES ($1, 'teacher')
          RETURNING id, email, role
        `;
        user =
          existing.rows[0] ??
          (await client.query(createQuery, [email])).rows[0];

        if (fullName?.trim()) {
          await client.query(
            `UPDATE users SET full_name = COALESCE(NULLIF(full_name, ''), $1), updated_at = now() WHERE id = $2`,
            [fullName.trim(), user.id],
          );
        }

        const linkQuery = `
          INSERT INTO oauth_accounts (user_id, provider, provider_account_id)
          VALUES ($1, 'google', $2)
          ON CONFLICT DO NOTHING
        `;
        await client.query(linkQuery, [user.id, providerAccountId]);
      }

      if (fullName?.trim()) {
        await client.query(
          `UPDATE users SET full_name = COALESCE(NULLIF(full_name, ''), $1), updated_at = now() WHERE id = $2`,
          [fullName.trim(), user.id],
        );
      }
      await client.query("COMMIT");
      return user;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async createSession(
    userId: string,
    tokenHash: string,
    ttl: number,
  ) {
    const query = `
      INSERT INTO sessions (user_id, token_hash, expires_at)
      VALUES ($1, $2, now() + ($3 * interval '1 second'))
    `;
    await pool.query(query, [userId, tokenHash, ttl]);
  }

  async revokeSession(tokenHash: string) {
    const query = `
      UPDATE sessions
      SET revoked_at = now()
      WHERE token_hash = $1
        AND revoked_at IS NULL
    `;
    await pool.query(query, [tokenHash]);
  }

  async findActiveSession(tokenHash: string) {
    const query = `
      SELECT u.id, u.email, u.role
      FROM sessions AS s
      JOIN users AS u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND u.deleted_at IS NULL
    `;
    return (await pool.query(query, [tokenHash])).rows[0];
  }
}
