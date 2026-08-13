import type { CreatePaymentDto } from "./payments.dto";
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
        `SELECT id, amount_vnd AS "amountVnd", paid_at AS "paidAt", status, note FROM payments WHERE student_id = $1 ORDER BY paid_at DESC`,
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
      `INSERT INTO payments (student_id, amount_vnd, paid_at, status, note) VALUES ($1, $2, $3, 'confirmed', $4) RETURNING id, amount_vnd AS "amountVnd", paid_at AS "paidAt", status, note`,
      [
        studentId,
        input.amountVnd,
        input.paidAt ?? new Date(),
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
  private async owned(teacherId: string, studentId: string) {
    const result = await pool.query(
      `SELECT 1 FROM students WHERE id = $1 AND teacher_id = $2 AND deleted_at IS NULL`,
      [studentId, teacherId],
    );
    return Boolean(result.rowCount);
  }
}
