import type { CreatePaymentDto, UpdatePaymentDto } from "./payments.dto";
import { Injectable } from "@nestjs/common";
import { NotFoundError } from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import { pool } from "../db/client";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class PaymentsService {
  constructor(private readonly notifications: NotificationsService) {}
  // Tuition is per class: due comes from the class's sessions (per_session /
  // per_hour) plus the per_month flat fee, paid from class-scoped payments.
  async list(teacherId: string, classId: string) {
    const owned = await this.owned(teacherId, classId);
    if (!owned) throw new NotFoundError(ErrorCodes.CLASS_NOT_FOUND);
    const [payments, totals] = await Promise.all([
      pool.query(
        `SELECT id, amount_vnd AS "amountVnd", paid_at AS "paidAt", applies_to_month AS "appliesToMonth", status, note FROM payments WHERE class_id = $1 ORDER BY paid_at DESC`,
        [classId],
      ),
      pool.query(
        `SELECT
          COALESCE((SELECT SUM(ts.price_vnd) FROM teaching_sessions ts
            LEFT JOIN classes c ON c.id = ts.class_id
            WHERE ts.class_id = $1 AND ts.deleted_at IS NULL
              AND c.pricing_mode IS DISTINCT FROM 'per_month'), 0) AS "totalDue",
          COALESCE((SELECT SUM(amount_vnd) FROM payments WHERE class_id = $1 AND status = 'confirmed'), 0) AS "totalPaid",
          (SELECT COUNT(*)::int FROM teaching_sessions WHERE class_id = $1 AND deleted_at IS NULL) AS "sessionCount"`,
        [classId],
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
  async create(teacherId: string, classId: string, input: CreatePaymentDto) {
    if (!(await this.owned(teacherId, classId)))
      throw new NotFoundError(ErrorCodes.CLASS_NOT_FOUND);
    const result = await pool.query(
      `INSERT INTO payments (class_id, amount_vnd, paid_at, applies_to_month, status, note) VALUES ($1, $2, now(), $3, 'confirmed', $4) RETURNING id, amount_vnd AS "amountVnd", paid_at AS "paidAt", applies_to_month AS "appliesToMonth", status, note`,
      [
        classId,
        input.amountVnd,
        input.appliesToMonth ?? currentMonth(),
        input.note ?? null,
      ],
    );
    void this.notifications.sendToUser(teacherId, {
      title: "Đã ghi nhận học phí",
      body: `Đã ghi nhận ${Number(input.amountVnd).toLocaleString("vi-VN")} ₫`,
      url: `/classes/${classId}`,
    });
    return result.rows[0];
  }
  async update(
    teacherId: string,
    classId: string,
    paymentId: string,
    input: UpdatePaymentDto,
  ) {
    const result = await pool.query(
      `UPDATE payments SET amount_vnd = $4, applies_to_month = $5, note = $6
       WHERE id = $1 AND class_id = $2 AND status = 'confirmed'
         AND EXISTS (
           SELECT 1 FROM classes
           WHERE classes.id = $2 AND classes.teacher_id = $3 AND classes.deleted_at IS NULL
         )
       RETURNING id, amount_vnd AS "amountVnd", paid_at AS "paidAt", applies_to_month AS "appliesToMonth", status, note`,
      [
        paymentId,
        classId,
        teacherId,
        input.amountVnd,
        input.appliesToMonth,
        input.note ?? null,
      ],
    );
    if (result.rowCount === 0)
      throw new NotFoundError(ErrorCodes.PAYMENT_NOT_FOUND);
    return result.rows[0];
  }
  async remove(teacherId: string, classId: string, paymentId: string) {
    const result = await pool.query(
      `DELETE FROM payments
       WHERE id = $1 AND class_id = $2 AND status = 'confirmed'
         AND EXISTS (
           SELECT 1 FROM classes
           WHERE classes.id = $2 AND classes.teacher_id = $3 AND classes.deleted_at IS NULL
         )`,
      [paymentId, classId, teacherId],
    );
    if (result.rowCount === 0)
      throw new NotFoundError(ErrorCodes.PAYMENT_NOT_FOUND);
    return { ok: true };
  }
  private async owned(teacherId: string, classId: string) {
    const result = await pool.query(
      `SELECT 1 FROM classes WHERE id = $1 AND teacher_id = $2 AND deleted_at IS NULL`,
      [classId, teacherId],
    );
    return Boolean(result.rowCount);
  }
}

function currentMonth(): string {
  // VN local time (UTC+7), no DST — fixed offset is safe.
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}
