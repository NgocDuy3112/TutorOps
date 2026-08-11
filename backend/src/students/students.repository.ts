import type { CreateStudentDto, UpdateStudentDto } from "./students.dto";
import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";

@Injectable()
export class StudentsRepository {
  async list(teacherId: string) {
    const query = `
      SELECT
        id,
        name,
        parent_name AS "parentName",
        parent_phone AS "parentPhone",
        default_price_vnd AS "defaultPriceVnd",
        submission_mode AS "submissionMode",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'subject', c.subject) ORDER BY c.name)
            FROM class_students cs
            INNER JOIN classes c ON c.id = cs.class_id
            WHERE cs.student_id = students.id
              AND c.deleted_at IS NULL
          ),
          '[]'::json
        ) AS classes
      FROM students
      WHERE teacher_id = $1
        AND deleted_at IS NULL
      ORDER BY name
    `;
    const { rows } = await pool.query(query, [teacherId]);
    return rows;
  }

  async findOwned(teacherId: string, id: string) {
    const query = `
      SELECT id
      FROM students
      WHERE id = $1
        AND teacher_id = $2
        AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id, teacherId]);
    return (result.rowCount ?? 0) > 0;
  }

  async create(teacherId: string, input: CreateStudentDto) {
    const query = `
      INSERT INTO students (
        teacher_id,
        name,
        parent_name,
        parent_phone,
        default_price_vnd,
        submission_mode
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [
      teacherId,
      input.name.trim(),
      input.parentName ?? null,
      input.parentPhone ?? null,
      input.defaultPriceVnd ?? 0,
      input.submissionMode ?? "self_submit",
    ]);
    return result.rows[0];
  }

  async update(teacherId: string, id: string, input: CreateStudentDto) {
    const query = `
      UPDATE students
      SET
        name = COALESCE($1, name),
        parent_name = COALESCE($2, parent_name),
        parent_phone = COALESCE($3, parent_phone),
        default_price_vnd = COALESCE($4, default_price_vnd),
        submission_mode = COALESCE($5, submission_mode),
        updated_at = now()
      WHERE id = $6
        AND teacher_id = $7
        AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await pool.query(query, [
      input.name?.trim(),
      input.parentName,
      input.parentPhone,
      input.defaultPriceVnd,
      input.submissionMode,
      id,
      teacherId,
    ]);
    return result.rows[0];
  }

  async softDelete(teacherId: string, id: string) {
    const query = `
      UPDATE students
      SET deleted_at = now(), updated_at = now()
      WHERE id = $1
        AND teacher_id = $2
        AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await pool.query(query, [id, teacherId]);
    return (result.rowCount ?? 0) > 0;
  }
}
