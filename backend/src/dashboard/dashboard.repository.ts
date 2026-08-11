import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";
import type { DashboardCalendarDto } from "./dashboard.dto";

@Injectable()
export class DashboardRepository {
  async calendar(teacherId: string): Promise<DashboardCalendarDto> {
    const client = await pool.connect();
    try {
      const teacherQuery = `
        SELECT
          id,
          email,
          full_name AS "fullName"
        FROM users
        WHERE id = $1
          AND deleted_at IS NULL
      `;

      const studentsQuery = `
        SELECT
          id,
          name,
          default_price_vnd AS "defaultPriceVnd"
        FROM students
        WHERE teacher_id = $1
          AND deleted_at IS NULL
        ORDER BY name
      `;

      const sessionsQuery = `
        SELECT
          ts.id,
          ts.student_id AS "studentId",
          s.name AS "studentName",
          ts.taught_at AS "taughtAt",
          ts.price_vnd AS "priceVnd",
          ts.note
        FROM teaching_sessions AS ts
        INNER JOIN students AS s ON s.id = ts.student_id
        WHERE s.teacher_id = $1
          AND s.deleted_at IS NULL
          AND ts.deleted_at IS NULL
        ORDER BY ts.taught_at DESC
      `;

      const assignmentsQuery = `
        SELECT
          a.id,
          a.title,
          a.description,
          a.due_at AS "dueAt",
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

      const [teacher, students, sessions, assignments] = await Promise.all([
        client.query(teacherQuery, [teacherId]),
        client.query(studentsQuery, [teacherId]),
        client.query(sessionsQuery, [teacherId]),
        client.query(assignmentsQuery, [teacherId]),
      ]);

      return {
        teacher: teacher.rows[0],
        students: students.rows,
        sessions: sessions.rows,
        assignments: assignments.rows,
      };
    } finally {
      client.release();
    }
  }
}
