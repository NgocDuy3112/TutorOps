import type {
  TeachingSessionDto,
  UpdateTeachingSessionDto,
} from "./sessions.dto";
import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";

@Injectable()
export class SessionsRepository {
  async studentOwned(teacherId: string, studentId: string) {
    const query = `
      SELECT id
      FROM students
      WHERE id = $1
        AND teacher_id = $2
        AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [studentId, teacherId]);
    return (result.rowCount ?? 0) > 0;
  }

  async list(studentId: string) {
    const query = `
      SELECT
        id,
        student_id AS "studentId",
        taught_at AS "taughtAt",
        price_vnd AS "priceVnd",
        note,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM teaching_sessions
      WHERE student_id = $1
        AND deleted_at IS NULL
      ORDER BY taught_at DESC
    `;
    return (await pool.query(query, [studentId])).rows;
  }

  async listForTeacher(teacherId: string) {
    const query = `
      SELECT
        ts.id,
        ts.student_id AS "studentId",
        s.name AS "studentName",
        ts.taught_at AS "taughtAt",
        ts.price_vnd AS "priceVnd",
        ts.note,
        ts.created_at AS "createdAt",
        ts.updated_at AS "updatedAt"
      FROM teaching_sessions AS ts
      INNER JOIN students AS s ON s.id = ts.student_id
      WHERE s.teacher_id = $1
        AND s.deleted_at IS NULL
        AND ts.deleted_at IS NULL
      ORDER BY ts.taught_at DESC
    `;
    return (await pool.query(query, [teacherId])).rows;
  }

  async create(studentId: string, input: TeachingSessionDto) {
    const query = `
      INSERT INTO teaching_sessions (
        student_id,
        taught_at,
        price_vnd,
        note
      )
      SELECT $1, $2, COALESCE($3, default_price_vnd), $4
      FROM students
      WHERE id = $1
      RETURNING *
    `;
    return (
      await pool.query(query, [
        studentId,
        input.taughtAt,
        input.priceVnd ?? null,
        input.note ?? null,
      ])
    ).rows[0];
  }

  async update(teacherId: string, id: string, input: UpdateTeachingSessionDto) {
    const query = `
      UPDATE teaching_sessions AS ts
      SET
        taught_at = COALESCE($1, ts.taught_at),
        price_vnd = COALESCE($2, ts.price_vnd),
        note = COALESCE($3, ts.note),
        updated_at = now()
      FROM students AS s
      WHERE ts.id = $4
        AND ts.student_id = s.id
        AND ts.deleted_at IS NULL
        AND s.teacher_id = $5
        AND s.deleted_at IS NULL
      RETURNING ts.*
    `;
    return (
      await pool.query(query, [
        input.taughtAt,
        input.priceVnd,
        input.note,
        id,
        teacherId,
      ])
    ).rows[0];
  }

  async softDelete(teacherId: string, id: string) {
    const query = `
      UPDATE teaching_sessions AS ts
      SET deleted_at = now(), updated_at = now()
      FROM students AS s
      WHERE ts.id = $1
        AND ts.student_id = s.id
        AND ts.deleted_at IS NULL
        AND s.teacher_id = $2
        AND s.deleted_at IS NULL
    `;
    const result = await pool.query(query, [id, teacherId]);
    return (result.rowCount ?? 0) > 0;
  }
}
