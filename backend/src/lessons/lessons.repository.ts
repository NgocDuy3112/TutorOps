import type { CreateLessonDto, UpdateLessonDto } from "./lessons.dto";
import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";

@Injectable()
export class LessonsRepository {
  async list(teacherId: string) {
    const query = `
      SELECT id, title, description,
        created_at AS "createdAt", updated_at AS "updatedAt"
      FROM lessons
      WHERE teacher_id = $1 AND deleted_at IS NULL
      ORDER BY updated_at DESC
    `;
    return (await pool.query(query, [teacherId])).rows;
  }

  async create(teacherId: string, input: CreateLessonDto) {
    const query = `
      INSERT INTO lessons (teacher_id, title, description)
      VALUES ($1, $2, $3)
      RETURNING id, title, description,
        created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    return (
      await pool.query(query, [
        teacherId,
        input.title.trim(),
        input.description ?? null,
      ])
    ).rows[0];
  }

  async update(teacherId: string, id: string, input: UpdateLessonDto) {
    const query = `
      UPDATE lessons
      SET title = COALESCE($1, title),
        description = COALESCE($2, description),
        updated_at = now()
      WHERE id = $3 AND teacher_id = $4 AND deleted_at IS NULL
      RETURNING id, title, description,
        created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    return (
      await pool.query(query, [
        input.title?.trim(),
        input.description,
        id,
        teacherId,
      ])
    ).rows[0];
  }

  async softDelete(teacherId: string, id: string) {
    const query = `
      UPDATE lessons
      SET deleted_at = now(), updated_at = now()
      WHERE id = $1 AND teacher_id = $2 AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id, teacherId]);
    return (result.rowCount ?? 0) > 0;
  }

  async attachFile(teacherId: string, lessonId: string, fileId: string) {
    const query = `
      INSERT INTO lesson_files (lesson_id, file_id)
      SELECT l.id, f.id
      FROM lessons AS l
      JOIN files AS f ON f.id = $3 AND f.created_by = $1 AND f.deleted_at IS NULL
      WHERE l.id = $2 AND l.teacher_id = $1 AND l.deleted_at IS NULL
      ON CONFLICT DO NOTHING
      RETURNING lesson_id AS "lessonId", file_id AS "fileId"
    `;
    return (await pool.query(query, [teacherId, lessonId, fileId])).rows[0];
  }
}
