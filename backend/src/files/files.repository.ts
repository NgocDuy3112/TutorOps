import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";

@Injectable()
export class FilesRepository {
  async create(input: {
    storageKey: string;
    originalName: string;
    mimeType: string;
    extension: string | null;
    sizeBytes: number;
    createdBy: string | null;
  }) {
    const query = `
      INSERT INTO files (storage_key, original_name, mime_type, extension, size_bytes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, storage_key AS "storageKey", original_name AS "originalName", mime_type AS "mimeType", size_bytes AS "sizeBytes"
    `;
    return (
      await pool.query(query, [
        input.storageKey,
        input.originalName,
        input.mimeType,
        input.extension,
        input.sizeBytes,
        input.createdBy,
      ])
    ).rows[0];
  }

  async findById(id: string) {
    const query = `
      SELECT id, storage_key AS "storageKey", original_name AS "originalName",
             mime_type AS "mimeType", created_by AS "createdBy"
      FROM files
      WHERE id = $1 AND deleted_at IS NULL
    `;
    return (await pool.query(query, [id])).rows[0] ?? null;
  }

  async softDelete(id: string) {
    const query = `
      UPDATE files
      SET deleted_at = now()
      WHERE id = $1 AND deleted_at IS NULL
    `;
    return (await pool.query(query, [id])).rowCount === 1;
  }

  /** Row is deletable only when no junction table still references it. */
  async countReferences(id: string) {
    const result = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM assignment_files WHERE file_id = $1)
       + (SELECT COUNT(*) FROM submission_files WHERE file_id = $1)
       + (SELECT COUNT(*) FROM lesson_files WHERE file_id = $1)
       + (SELECT COUNT(*) FROM session_files WHERE file_id = $1)
       AS refs`,
      [id],
    );
    return Number(result.rows[0].refs);
  }

  async hardDelete(id: string) {
    return (await pool.query(
      `DELETE FROM files WHERE id = $1`,
      [id],
    )).rowCount === 1;
  }
}
