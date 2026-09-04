import type { CreatePaymentDto, UpdatePaymentDto } from "./payments.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { pool } from "../db/client";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class PaymentsService {
  constructor(private readonly notifications: NotificationsService) {}
  async list(teacherId: string, studentId: string) {
    const owned = await this.owned(teacherId, studentId);
    if (!owned) throw new NotFoundException("student_not_found");
    const [payments, totals] = await Promise.all([
      pool.query(
        `SELECT id, amount_vnd AS "amountVnd", paid_at AS "paidAt", applies_to_month AS "appliesToMonth", status, note FROM payments WHERE student_id = $1 ORDER BY paid_at DESC`,
        [studentId],
      ),
      pool.query(
        `SELECT
          COALESCE((SELECT SUM(price_vnd) FROM teaching_sessions WHERE student_id = $1 AND deleted_at IS NULL), 0) AS "totalDue",
          COALESCE((SELECT SUM(amount_vnd) FROM payments WHERE student_id = $1 AND status = 'confirmed'), 0) AS "totalPaid",
          (SELECT COUNT(*)::int FROM teaching_sessions WHERE student_id = $1 AND deleted_at IS NULL) AS "sessionCount"`,
        [studentId],
      ),
    ]);
    const totalDue = Number(totals.rows[0].totalDue),
      totalPaid = Number(totals.rows[0].totalPaid),
      sessionCount = Number(totals.rows[0].sessionCount ?? 0);
    return {
      payments: payments.rows,
      totalDue,
      totalPaid,
      balance: totalDue - totalPaid,
      sessionCount,
    };
  }
  async create(teacherId: string, studentId: string, input: CreatePaymentDto) {
    if (!(await this.owned(teacherId, studentId)))
      throw new NotFoundException("student_not_found");
    const result = await pool.query(
      `INSERT INTO payments (student_id, amount_vnd, paid_at, applies_to_month, status, note) VALUES ($1, $2, now(), $3, 'confirmed', $4) RETURNING id, amount_vnd AS "amountVnd", paid_at AS "paidAt", applies_to_month AS "appliesToMonth", status, note`,
      [
        studentId,
        input.amountVnd,
        input.appliesToMonth ?? currentMonth(),
        input.note ?? null,
      ],
    );
    void this.notifications.sendToUser(teacherId, {
      title: "Đã ghi nhận học phí",
      body: `Đã ghi nhận ${Number(input.amountVnd).toLocaleString("vi-VN")} ₫`,
      url: `/students/${studentId}`,
    });
    return result.rows[0];
  }
  async update(
    teacherId: string,
    studentId: string,
    paymentId: string,
    input: UpdatePaymentDto,
  ) {
    const result = await pool.query(
      `UPDATE payments SET amount_vnd = $4, applies_to_month = $5, note = $6
       WHERE id = $1 AND student_id = $2 AND status = 'confirmed'
         AND EXISTS (
           SELECT 1 FROM students
           WHERE students.id = $2 AND students.teacher_id = $3 AND students.deleted_at IS NULL
         )
       RETURNING id, amount_vnd AS "amountVnd", paid_at AS "paidAt", applies_to_month AS "appliesToMonth", status, note`,
      [
        paymentId,
        studentId,
        teacherId,
        input.amountVnd,
        input.appliesToMonth,
        input.note ?? null,
      ],
    );
    if (result.rowCount === 0) throw new NotFoundException("payment_not_found");
    return result.rows[0];
  }
  async remove(teacherId: string, studentId: string, paymentId: string) {
    const result = await pool.query(
      `DELETE FROM payments
       WHERE id = $1 AND student_id = $2 AND status = 'confirmed'
         AND EXISTS (
           SELECT 1 FROM students
           WHERE students.id = $2 AND students.teacher_id = $3 AND students.deleted_at IS NULL
         )`,
      [paymentId, studentId, teacherId],
    );
    if (result.rowCount === 0) throw new NotFoundException("payment_not_found");
    return { ok: true };
  }
  private async owned(teacherId: string, studentId: string) {
    const result = await pool.query(
      `SELECT 1 FROM students WHERE id = $1 AND teacher_id = $2 AND deleted_at IS NULL`,
      [studentId, teacherId],
    );
    return Boolean(result.rowCount);
  }
}

function currentMonth(): string {
  // VN local time (UTC+7), no DST — fixed offset is safe.
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}
