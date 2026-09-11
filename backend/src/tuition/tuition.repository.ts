import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";
import type { TuitionClassRow } from "./tuition.dto";

// App serves Vietnamese tutors (VND, vi-VN); month boundaries follow VN local time.
const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

const UNCATEGORIZED_NAME = "Chưa phân lớp";

@Injectable()
export class TuitionRepository {
  async listByMonth(
    teacherId: string,
    month: string,
  ): Promise<TuitionClassRow[]> {
    const result = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        COALESCE(t.due, 0) + COALESCE(m.monthly_due, 0) AS due,
        COALESCE(p.paid, 0) AS paid,
        COALESCE(t.session_count, 0) AS "sessionCount"
      FROM classes AS c
      LEFT JOIN (
        SELECT
          ts.class_id,
          -- per_month classes are billed as a flat fee below, not per session
          COALESCE(SUM(ts.price_vnd) FILTER (
            WHERE c.pricing_mode IS DISTINCT FROM 'per_month'
          ), 0) AS due,
          COUNT(*)::int AS session_count
        FROM teaching_sessions AS ts
        INNER JOIN classes AS c ON c.id = ts.class_id
        WHERE c.teacher_id = $3
          AND c.deleted_at IS NULL
          AND ts.deleted_at IS NULL
          AND ts.status = 'taught'
          AND to_char(ts.taught_at AT TIME ZONE $2, 'YYYY-MM') = $1
        GROUP BY ts.class_id
      ) AS t ON t.class_id = c.id
      LEFT JOIN (
        -- per_month: one flat fee per class that had >= 1 session this month
        SELECT class_id, SUM(fee) AS monthly_due
        FROM (
          SELECT DISTINCT ts.class_id, c.default_price_vnd AS fee
          FROM teaching_sessions AS ts
          INNER JOIN classes AS c ON c.id = ts.class_id
          WHERE c.pricing_mode = 'per_month'
            AND c.deleted_at IS NULL
            AND ts.deleted_at IS NULL
            AND ts.status = 'taught'
            AND to_char(ts.taught_at AT TIME ZONE $2, 'YYYY-MM') = $1
        ) AS distinct_classes
        GROUP BY class_id
      ) AS m ON m.class_id = c.id
      LEFT JOIN (
        SELECT
          class_id,
          SUM(amount_vnd) AS paid
        FROM payments
        WHERE status = 'confirmed'
          AND applies_to_month = $1
        GROUP BY class_id
      ) AS p ON p.class_id = c.id
      WHERE c.teacher_id = $3
        AND c.deleted_at IS NULL
      ORDER BY c.name
      `,
      [month, APP_TIMEZONE, teacherId],
    );
    const rows: TuitionClassRow[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      due: Number(row.due),
      paid: Number(row.paid),
      balance: Number(row.due) - Number(row.paid),
      sessionCount: Number(row.sessionCount),
    }));

    // Legacy payments recorded before class-based tuition have no class.
    // Surface them as an uncategorized row so the money is never lost.
    // Scoped to the tutor via the payment's student (legacy rows carry
    // student_id as a trace).
    const legacy = await pool.query(
      `
      SELECT COALESCE(SUM(p.amount_vnd), 0) AS paid
      FROM payments p
      JOIN students s ON s.id = p.student_id AND s.teacher_id = $2
      WHERE p.class_id IS NULL
        AND p.status = 'confirmed'
        AND p.applies_to_month = $1
      `,
      [month, teacherId],
    );
    const legacyPaid = Number(legacy.rows[0].paid);
    if (legacyPaid > 0) {
      rows.push({
        id: null,
        name: UNCATEGORIZED_NAME,
        due: 0,
        paid: legacyPaid,
        balance: -legacyPaid,
        sessionCount: 0,
      });
    }
    return rows;
  }
}
