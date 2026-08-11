import { Injectable, UnauthorizedException } from "@nestjs/common";
import crypto from "node:crypto";
import { pool } from "../db/client";

@Injectable()
export class AccessService {
  private hash(value: string) {
    return crypto.createHash("sha256").update(value).digest("hex");
  }

  async create(studentId: string, tokenType: "student" | "parent") {
    const token = crypto.randomBytes(32).toString("base64url");
    await pool.query(
      `INSERT INTO access_tokens (student_id, token_type, token_hash) VALUES ($1, $2, $3)`,
      [studentId, tokenType, this.hash(token)],
    );
    return token;
  }

  async authenticate(token: string, tokenType: "student" | "parent") {
    const result = await pool.query(
      `
      SELECT at.student_id AS "studentId", s.teacher_id AS "teacherId", s.name,
             s.submission_mode AS "submissionMode"
      FROM access_tokens at JOIN students s ON s.id = at.student_id
      WHERE at.token_hash = $1 AND at.token_type = $2 AND at.revoked_at IS NULL
        AND (at.expires_at IS NULL OR at.expires_at > now()) AND s.deleted_at IS NULL
    `,
      [this.hash(token), tokenType],
    );
    const access = result.rows[0];
    if (!access) throw new UnauthorizedException("invalid_access_token");
    await pool.query(
      `UPDATE access_tokens SET last_used_at = now() WHERE token_hash = $1`,
      [this.hash(token)],
    );
    return access;
  }

  async regenerate(
    teacherId: string,
    studentId: string,
    tokenType: "student" | "parent",
  ) {
    const owned = await pool.query(
      `SELECT id FROM students WHERE id = $1 AND teacher_id = $2 AND deleted_at IS NULL`,
      [studentId, teacherId],
    );
    if (!owned.rowCount) return null;
    await pool.query(
      `UPDATE access_tokens SET revoked_at = now() WHERE student_id = $1 AND token_type = $2 AND revoked_at IS NULL`,
      [studentId, tokenType],
    );
    return this.create(studentId, tokenType);
  }
}
