import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";

// App serves Vietnamese tutors (VND, vi-VN); month boundaries follow VN local
// time — same convention as tuition.repository.ts.
const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

export type SlipRow = {
  studentName: string;
  month: string;
  sessions: {
    id: string;
    taughtAt: string;
    priceVnd: number;
    note: string | null;
    className: string | null;
  }[];
  sessionCount: number;
  due: number;
  paid: number;
  assignments: {
    title: string;
    dueAt: string | null;
    status: string;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewNote: string | null;
  }[];
  comment: string;
  paymentQrKey: string | null;
};

@Injectable()
export class SlipsRepository {
  async ownsStudent(teacherId: string, studentId: string) {
    const result = await pool.query(
      `SELECT id FROM students
       WHERE id = $1 AND teacher_id = $2 AND deleted_at IS NULL`,
      [studentId, teacherId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async findSlip(
    teacherId: string,
    studentId: string,
    month: string,
  ): Promise<SlipRow | null> {
    const student = await pool.query(
      `SELECT name FROM students
       WHERE id = $1 AND teacher_id = $2 AND deleted_at IS NULL`,
      [studentId, teacherId],
    );
    if (!student.rowCount) return null;

    const [sessions, perSession, perMonth, payments, assignments, note, qr] =
      await Promise.all([
        pool.query(
          `SELECT ts.id, ts.taught_at AS "taughtAt", ts.price_vnd AS "priceVnd",
                  ts.note, c.name AS "className"
           FROM teaching_sessions ts
           LEFT JOIN classes c ON c.id = ts.class_id
           WHERE ts.student_id = $1 AND ts.deleted_at IS NULL
             AND to_char(ts.taught_at AT TIME ZONE $2, 'YYYY-MM') = $3
           ORDER BY ts.taught_at`,
          [studentId, APP_TIMEZONE, month],
        ),
        // Per-session billing: sum of session prices, excluding per_month
        // classes (those are billed as a flat fee below) — mirrors tuition.
        pool.query(
          `SELECT COALESCE(SUM(ts.price_vnd) FILTER (
              WHERE c.pricing_mode IS DISTINCT FROM 'per_month'
            ), 0) AS due,
            COUNT(*)::int AS session_count
           FROM teaching_sessions ts
           LEFT JOIN classes c ON c.id = ts.class_id
           WHERE ts.student_id = $1 AND ts.deleted_at IS NULL
             AND to_char(ts.taught_at AT TIME ZONE $2, 'YYYY-MM') = $3`,
          [studentId, APP_TIMEZONE, month],
        ),
        pool.query(
          `SELECT COALESCE(SUM(fee), 0) AS due
           FROM (
             SELECT DISTINCT ts.student_id, c.default_price_vnd AS fee
             FROM teaching_sessions ts
             INNER JOIN classes c ON c.id = ts.class_id
             WHERE c.pricing_mode = 'per_month' AND c.deleted_at IS NULL
               AND ts.deleted_at IS NULL AND ts.student_id = $1
               AND to_char(ts.taught_at AT TIME ZONE $2, 'YYYY-MM') = $3
           ) AS distinct_classes`,
          [studentId, APP_TIMEZONE, month],
        ),
        pool.query(
          `SELECT amount_vnd AS "amountVnd", paid_at AS "paidAt"
           FROM payments p
           WHERE p.status = 'confirmed' AND p.applies_to_month = $2
             AND (
               p.student_id = $1
               OR p.class_id IN (
                 SELECT cs.class_id FROM class_students cs
                 INNER JOIN classes c ON c.id = cs.class_id AND c.deleted_at IS NULL
                 WHERE cs.student_id = $1
               )
             )
           ORDER BY paid_at`,
          [studentId, month],
        ),
        pool.query(
          `SELECT a.title, a.due_at AS "dueAt", sa.status,
                  sa.submitted_at AS "submittedAt", sa.reviewed_at AS "reviewedAt",
                  sa.review_note AS "reviewNote"
           FROM student_assignments sa
           JOIN assignments a ON a.id = sa.assignment_id
           WHERE sa.student_id = $1 AND a.deleted_at IS NULL
             AND a.due_at IS NOT NULL
             AND to_char(a.due_at AT TIME ZONE $2, 'YYYY-MM') = $3
           ORDER BY a.due_at`,
          [studentId, APP_TIMEZONE, month],
        ),
        pool.query(
          `SELECT comment FROM monthly_notes WHERE student_id = $1 AND month = $2`,
          [studentId, month],
        ),
        pool.query(
          `SELECT f.storage_key AS "storageKey"
           FROM users u JOIN files f ON f.id = u.payment_qr_file_id
           WHERE u.id = $1 AND f.deleted_at IS NULL`,
          [teacherId],
        ),
      ]);

    const due =
      Number(perSession.rows[0].due) + Number(perMonth.rows[0]?.due ?? 0);

    return {
      studentName: student.rows[0].name,
      month,
      sessions: sessions.rows,
      sessionCount: Number(perSession.rows[0].session_count),
      due,
      paid: payments.rows.reduce((sum, row) => sum + Number(row.amountVnd), 0),
      assignments: assignments.rows,
      comment: note.rows[0]?.comment ?? "",
      paymentQrKey: qr.rows[0]?.storageKey ?? null,
    };
  }

  async upsertNote(studentId: string, month: string, comment: string) {
    await pool.query(
      `INSERT INTO monthly_notes (student_id, month, comment)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, month)
       DO UPDATE SET comment = $3, updated_at = now()`,
      [studentId, month, comment],
    );
  }

  async setPaymentQrFile(userId: string, fileId: string) {
    await pool.query(
      `UPDATE users SET payment_qr_file_id = $1, updated_at = now() WHERE id = $2`,
      [fileId, userId],
    );
  }
}
