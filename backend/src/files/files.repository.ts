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
}
