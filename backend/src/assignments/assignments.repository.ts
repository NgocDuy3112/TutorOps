import type { CreateAssignmentDto } from "./assignments.dto";
import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";

@Injectable()
export class AssignmentsRepository {
  async list(teacherId: string) {
    const query = `
      SELECT
        a.id,
        a.title,
        a.description,
        a.due_at AS "dueAt",
        a.created_at AS "createdAt",
        COUNT(sa.id)::int AS "studentCount",
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'name', s.name,
              'status', sa.status
            )
            ORDER BY s.name
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS students
      FROM assignments AS a
      LEFT JOIN student_assignments AS sa ON sa.assignment_id = a.id
      LEFT JOIN students AS s ON s.id = sa.student_id AND s.deleted_at IS NULL
      WHERE a.teacher_id = $1
        AND a.deleted_at IS NULL
      GROUP BY a.id
      ORDER BY a.due_at NULLS LAST, a.created_at DESC
    `;
    return (await pool.query(query, [teacherId])).rows;
  }

  async create(teacherId: string, input: CreateAssignmentDto) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const assignmentQuery = `
        INSERT INTO assignments (teacher_id, title, description, lesson_id, due_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          title,
          description,
          due_at AS "dueAt",
          created_at AS "createdAt"
      `;
      const assignment = (
        await client.query(assignmentQuery, [
          teacherId,
          input.title.trim(),
          input.description ?? null,
          input.lessonId ?? null,
          input.dueAt ?? null,
        ])
      ).rows[0];

      const linkQuery = `
        INSERT INTO student_assignments (assignment_id, student_id, teacher_id)
        SELECT $1, id, teacher_id
        FROM students
        WHERE id = $2
          AND teacher_id = $3
          AND deleted_at IS NULL
      `;
      for (const studentId of input.studentIds ?? []) {
        await client.query(linkQuery, [assignment.id, studentId, teacherId]);
      }

      const fileQuery = `
        INSERT INTO assignment_files (assignment_id, file_id)
        SELECT $1, id
        FROM files
        WHERE id = $2
          AND created_by = $3
          AND deleted_at IS NULL
        ON CONFLICT DO NOTHING
      `;
      for (const fileId of input.fileIds ?? []) {
        await client.query(fileQuery, [assignment.id, fileId, teacherId]);
      }

      await client.query("COMMIT");
      return assignment;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async softDelete(teacherId: string, id: string) {
    const query = `
      UPDATE assignments
      SET deleted_at = now(), updated_at = now()
      WHERE id = $1
        AND teacher_id = $2
        AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id, teacherId]);
    return (result.rowCount ?? 0) > 0;
  }
}
