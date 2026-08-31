import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";
import type { TuitionStudentRow } from "./tuition.dto";

// App serves Vietnamese tutors (VND, vi-VN); month boundaries follow VN local time.
const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

@Injectable()
export class TuitionRepository {
  async listByMonth(
    teacherId: string,
    month: string,
  ): Promise<TuitionStudentRow[]> {
    const result = await pool.query(
      `
      SELECT
        s.id,
        s.name,
        COALESCE(t.due, 0) AS due,
        COALESCE(p.paid, 0) AS paid,
        COALESCE(t.session_count, 0) AS "sessionCount"
      FROM students AS s
      LEFT JOIN (
        SELECT
          student_id,
          SUM(price_vnd) AS due,
          COUNT(*)::int AS session_count
        FROM teaching_sessions
        WHERE deleted_at IS NULL
          AND to_char(taught_at AT TIME ZONE $2, 'YYYY-MM') = $1
        GROUP BY student_id
      ) AS t ON t.student_id = s.id
      LEFT JOIN (
        SELECT
          student_id,
          SUM(amount_vnd) AS paid
        FROM payments
        WHERE status = 'confirmed'
          AND to_char(paid_at AT TIME ZONE $2, 'YYYY-MM') = $1
        GROUP BY student_id
      ) AS p ON p.student_id = s.id
      WHERE s.teacher_id = $3
        AND s.deleted_at IS NULL
      ORDER BY s.name
      `,
      [month, APP_TIMEZONE, teacherId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      due: Number(row.due),
      paid: Number(row.paid),
      balance: Number(row.due) - Number(row.paid),
      sessionCount: Number(row.sessionCount),
    }));
  }
}
