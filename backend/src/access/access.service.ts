import { Injectable } from "@nestjs/common";
import { UnauthorizedError } from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import crypto from "node:crypto";
import { pool } from "../db/client";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class AccessService {
  constructor(private readonly storage: StorageService) {}

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

  async createAssignmentLink(teacherId: string, assignmentId: string) {
    const owned = await pool.query(
      `SELECT id FROM assignments WHERE id = $1 AND teacher_id = $2 AND deleted_at IS NULL`,
      [assignmentId, teacherId],
    );
    if (!owned.rowCount) return null;
    await pool.query(
      `UPDATE assignment_submission_links SET revoked_at = now() WHERE assignment_id = $1 AND revoked_at IS NULL`,
      [assignmentId],
    );
    const token = crypto.randomBytes(32).toString("base64url");
    await pool.query(
      `INSERT INTO assignment_submission_links (assignment_id, token_hash) VALUES ($1, $2)`,
      [assignmentId, this.hash(token)],
    );
    return token;
  }

  async authenticateAssignmentLink(token: string) {
    const result = await pool.query(
      `SELECT a.id AS "assignmentId", a.title, a.description, a.due_at AS "dueAt" FROM assignment_submission_links l JOIN assignments a ON a.id = l.assignment_id WHERE l.token_hash = $1 AND l.revoked_at IS NULL AND a.deleted_at IS NULL`,
      [this.hash(token)],
    );
    if (!result.rowCount)
      throw new UnauthorizedError(ErrorCodes.INVALID_ACCESS_TOKEN);
    const assignment = result.rows[0];
    const files = await pool.query(
      `SELECT f.id, f.original_name AS name, f.mime_type AS "mimeType", f.storage_key AS "storageKey" FROM assignment_files af JOIN files f ON f.id = af.file_id WHERE af.assignment_id = $1 AND f.deleted_at IS NULL ORDER BY f.created_at`,
      [assignment.assignmentId],
    );
    return {
      ...assignment,
      files: await Promise.all(
        files.rows.map(async (file) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          url: await this.storage.getDownloadUrl(file.storageKey),
        })),
      ),
    };
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
    if (!access) throw new UnauthorizedError(ErrorCodes.INVALID_ACCESS_TOKEN);
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
