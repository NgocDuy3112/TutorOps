import type { CreateClassDto, UpdateClassDto } from "./classes.dto";
import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";

@Injectable()
export class ClassesRepository {
  async list(teacherId: string) {
    const query = `
      SELECT
        c.id,
        c.name,
        c.subject,
        c.default_price_vnd AS "defaultPriceVnd",
        c.note,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        COALESCE(COUNT(cs.student_id)::int, 0) AS "studentCount",
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'name', s.name, 'parentPhone', s.parent_phone)
            ORDER BY s.name
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS students
      FROM classes AS c
      LEFT JOIN class_students AS cs ON cs.class_id = c.id
      LEFT JOIN students AS s ON s.id = cs.student_id AND s.deleted_at IS NULL
      WHERE c.teacher_id = $1
        AND c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.name
    `;
    return (await pool.query(query, [teacherId])).rows;
  }

  async create(teacherId: string, input: CreateClassDto) {
    const query = `
      INSERT INTO classes (teacher_id, name, subject, default_price_vnd, note)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        name,
        subject,
        default_price_vnd AS "defaultPriceVnd",
        note,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;
    return (
      await pool.query(query, [
        teacherId,
        input.name.trim(),
        input.subject?.trim() || null,
        input.defaultPriceVnd ?? null,
        input.note ?? null,
      ])
    ).rows[0];
  }

  async update(teacherId: string, id: string, input: UpdateClassDto) {
    const query = `
      UPDATE classes
      SET
        name = COALESCE($1, name),
        subject = COALESCE($2, subject),
        default_price_vnd = COALESCE($3, default_price_vnd),
        note = COALESCE($4, note),
        updated_at = now()
      WHERE id = $5
        AND teacher_id = $6
        AND deleted_at IS NULL
      RETURNING
        id,
        name,
        subject,
        default_price_vnd AS "defaultPriceVnd",
        note,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;
    return (
      await pool.query(query, [
        input.name?.trim(),
        input.subject?.trim(),
        input.defaultPriceVnd,
        input.note,
        id,
        teacherId,
      ])
    ).rows[0];
  }

  async softDelete(teacherId: string, id: string) {
    const query = `
      UPDATE classes
      SET deleted_at = now(), updated_at = now()
      WHERE id = $1
        AND teacher_id = $2
        AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id, teacherId]);
    return (result.rowCount ?? 0) > 0;
  }

  async addStudent(teacherId: string, classId: string, studentId: string) {
    const query = `
      INSERT INTO class_students (teacher_id, class_id, student_id)
      SELECT $1, c.id, s.id
      FROM classes AS c
      INNER JOIN students AS s ON s.teacher_id = c.teacher_id
      WHERE c.id = $2
        AND s.id = $3
        AND c.teacher_id = $1
        AND c.deleted_at IS NULL
        AND s.deleted_at IS NULL
      ON CONFLICT DO NOTHING
      RETURNING class_id AS "classId", student_id AS "studentId"
    `;
    return (await pool.query(query, [teacherId, classId, studentId])).rows[0];
  }

  async removeStudent(teacherId: string, classId: string, studentId: string) {
    const query = `
      DELETE FROM class_students
      WHERE teacher_id = $1
        AND class_id = $2
        AND student_id = $3
    `;
    const result = await pool.query(query, [teacherId, classId, studentId]);
    return (result.rowCount ?? 0) > 0;
  }
}
