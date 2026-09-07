import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";
import type {
  DashboardCalendarDto,
  DashboardOverviewDto,
} from "./dashboard.dto";

// App serves Vietnamese tutors (VND, vi-VN); month boundaries follow VN local time.
const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

function vnMonthKey(offsetMonths = 0): string {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths, 1),
  );
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function vnTodayKey(): string {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

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

  // Glanceable summary for the Overview tab: KPIs (with last-month deltas),
  // today's sessions, imminent assignment deadlines, and top debtors.
  async overview(teacherId: string): Promise<DashboardOverviewDto> {
    const thisMonth = vnMonthKey(0);
    const lastMonth = vnMonthKey(-1);
    const today = vnTodayKey();
    const client = await pool.connect();
    try {
      const classCountQuery = `
        SELECT COUNT(*)::int AS count
        FROM classes
        WHERE teacher_id = $1 AND deleted_at IS NULL
      `;
      const sessionsQuery = `
        SELECT
          COUNT(*) FILTER (
            WHERE to_char(ts.taught_at AT TIME ZONE $2, 'YYYY-MM') = $3
          )::int AS "thisMonth",
          COUNT(*) FILTER (
            WHERE to_char(ts.taught_at AT TIME ZONE $2, 'YYYY-MM') = $4
          )::int AS "lastMonth"
        FROM teaching_sessions AS ts
        INNER JOIN students AS s ON s.id = ts.student_id
        WHERE s.teacher_id = $1
          AND s.deleted_at IS NULL
          AND ts.deleted_at IS NULL
      `;
      const paidQuery = `
        SELECT
          COALESCE(SUM(amount_vnd) FILTER (WHERE applies_to_month = $2), 0) AS "thisMonth",
          COALESCE(SUM(amount_vnd) FILTER (WHERE applies_to_month = $3), 0) AS "lastMonth"
        FROM payments AS p
        INNER JOIN students AS s ON s.id = p.student_id
        WHERE s.teacher_id = $1
          AND s.deleted_at IS NULL
          AND p.status = 'confirmed'
      `;
      // Same due logic as the tuition report: session prices plus one flat fee
      // per per_month class that had >= 1 session in the month.
      const debtQuery = `
        WITH due AS (
          SELECT
            ts.student_id,
            COALESCE(SUM(ts.price_vnd) FILTER (
              WHERE c.pricing_mode IS DISTINCT FROM 'per_month'
            ), 0)
              + COALESCE((
                SELECT SUM(fee)
                FROM (
                  SELECT DISTINCT ts2.student_id, c2.id, c2.default_price_vnd AS fee
                  FROM teaching_sessions AS ts2
                  INNER JOIN classes AS c2 ON c2.id = ts2.class_id
                  WHERE c2.pricing_mode = 'per_month'
                    AND c2.deleted_at IS NULL
                    AND ts2.deleted_at IS NULL
                    AND ts2.student_id = ts.student_id
                    AND to_char(ts2.taught_at AT TIME ZONE $2, 'YYYY-MM') = $3
                ) AS d
              ), 0) AS due
          FROM teaching_sessions AS ts
          LEFT JOIN classes AS c ON c.id = ts.class_id
          WHERE ts.deleted_at IS NULL
            AND to_char(ts.taught_at AT TIME ZONE $2, 'YYYY-MM') = $3
          GROUP BY ts.student_id
        )
        SELECT
          COALESCE(SUM(GREATEST(due - paid, 0)), 0) AS outstanding,
          COUNT(*) FILTER (WHERE due - paid > 0)::int AS "debtCount"
        FROM (
          SELECT
            s.id,
            COALESCE(d.due, 0) AS due,
            COALESCE(p.paid, 0) AS paid
          FROM students AS s
          LEFT JOIN due AS d ON d.student_id = s.id
          LEFT JOIN (
            SELECT student_id, SUM(amount_vnd) AS paid
            FROM payments
            WHERE status = 'confirmed' AND applies_to_month = $3
            GROUP BY student_id
          ) AS p ON p.student_id = s.id
          WHERE s.teacher_id = $1 AND s.deleted_at IS NULL
        ) AS per_student
      `;
      const topDebtorsQuery = `
        SELECT
          s.id,
          s.name,
          GREATEST(COALESCE(d.due, 0) - COALESCE(p.paid, 0), 0) AS balance
        FROM students AS s
        LEFT JOIN (
          SELECT
            ts.student_id,
            COALESCE(SUM(ts.price_vnd) FILTER (
              WHERE c.pricing_mode IS DISTINCT FROM 'per_month'
            ), 0) AS due
          FROM teaching_sessions AS ts
          LEFT JOIN classes AS c ON c.id = ts.class_id
          WHERE ts.deleted_at IS NULL
            AND to_char(ts.taught_at AT TIME ZONE $2, 'YYYY-MM') = $3
          GROUP BY ts.student_id
        ) AS d ON d.student_id = s.id
        LEFT JOIN (
          SELECT student_id, SUM(amount_vnd) AS paid
          FROM payments
          WHERE status = 'confirmed' AND applies_to_month = $3
          GROUP BY student_id
        ) AS p ON p.student_id = s.id
        WHERE s.teacher_id = $1
          AND s.deleted_at IS NULL
          AND COALESCE(d.due, 0) - COALESCE(p.paid, 0) > 0
        ORDER BY balance DESC
        LIMIT 3
      `;
      const todaySessionsQuery = `
        SELECT
          ts.id,
          ts.student_id AS "studentId",
          s.name AS "studentName",
          ts.taught_at AS "taughtAt",
          ts.ends_at AS "endsAt",
          ts.price_vnd AS "priceVnd"
        FROM teaching_sessions AS ts
        INNER JOIN students AS s ON s.id = ts.student_id
        WHERE s.teacher_id = $1
          AND s.deleted_at IS NULL
          AND ts.deleted_at IS NULL
          AND to_char(ts.taught_at AT TIME ZONE $2, 'YYYY-MM-DD') = $3
        ORDER BY ts.taught_at
      `;
      const deadlinesQuery = `
        SELECT
          a.id,
          a.title,
          a.due_at AS "dueAt",
          COUNT(sa.id)::int AS "studentCount"
        FROM assignments AS a
        LEFT JOIN student_assignments AS sa ON sa.assignment_id = a.id
        WHERE a.teacher_id = $1
          AND a.deleted_at IS NULL
          AND a.due_at IS NOT NULL
          AND a.due_at >= now()
          AND a.due_at <= now() + interval '3 days'
        GROUP BY a.id
        ORDER BY a.due_at
        LIMIT 5
      `;
      const [
        classCount,
        sessions,
        paid,
        debt,
        topDebtors,
        todaySessions,
        deadlines,
      ] = await Promise.all([
        client.query(classCountQuery, [teacherId]),
        client.query(sessionsQuery, [teacherId, APP_TIMEZONE, thisMonth, lastMonth]),
        client.query(paidQuery, [teacherId, thisMonth, lastMonth]),
        client.query(debtQuery, [teacherId, APP_TIMEZONE, thisMonth]),
        client.query(topDebtorsQuery, [teacherId, APP_TIMEZONE, thisMonth]),
        client.query(todaySessionsQuery, [teacherId, APP_TIMEZONE, today]),
        client.query(deadlinesQuery, [teacherId]),
      ]);
      return {
        classCount: Number(classCount.rows[0].count),
        sessionsThisMonth: Number(sessions.rows[0].thisMonth),
        sessionsLastMonth: Number(sessions.rows[0].lastMonth),
        paidThisMonth: Number(paid.rows[0].thisMonth),
        paidLastMonth: Number(paid.rows[0].lastMonth),
        outstanding: Number(debt.rows[0].outstanding),
        debtCount: Number(debt.rows[0].debtCount),
        todaySessions: todaySessions.rows,
        upcomingDeadlines: deadlines.rows,
        topDebtors: topDebtors.rows.map((row) => ({
          id: row.id,
          name: row.name,
          balance: Number(row.balance),
        })),
      };
    } finally {
      client.release();
    }
  }
}
