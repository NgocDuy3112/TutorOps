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
        COALESCE(t.due, 0) + COALESCE(m.monthly_due, 0) AS due,
        COALESCE(p.paid, 0) AS paid,
        COALESCE(t.session_count, 0) AS "sessionCount"
      FROM students AS s
      LEFT JOIN (
        SELECT
          ts.student_id,
          -- per_month classes are billed as a flat fee below, not per session
          COALESCE(SUM(ts.price_vnd) FILTER (
            WHERE c.pricing_mode IS DISTINCT FROM 'per_month'
          ), 0) AS due,
          COUNT(*)::int AS session_count
        FROM teaching_sessions AS ts
        LEFT JOIN classes AS c ON c.id = ts.class_id
        WHERE ts.deleted_at IS NULL
          AND to_char(ts.taught_at AT TIME ZONE $2, 'YYYY-MM') = $1
        GROUP BY ts.student_id
      ) AS t ON t.student_id = s.id
      LEFT JOIN (
        -- per_month: one flat fee per class that had >= 1 session this month
        SELECT student_id, SUM(fee) AS monthly_due
        FROM (
          SELECT DISTINCT ts.student_id, c.id, c.default_price_vnd AS fee
          FROM teaching_sessions AS ts
          INNER JOIN classes AS c ON c.id = ts.class_id
          WHERE c.pricing_mode = 'per_month'
            AND c.deleted_at IS NULL
            AND ts.deleted_at IS NULL
            AND to_char(ts.taught_at AT TIME ZONE $2, 'YYYY-MM') = $1
        ) AS distinct_classes
        GROUP BY student_id
      ) AS m ON m.student_id = s.id
      LEFT JOIN (
        SELECT
          student_id,
          SUM(amount_vnd) AS paid
        FROM payments
        WHERE status = 'confirmed'
          AND applies_to_month = $1
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
