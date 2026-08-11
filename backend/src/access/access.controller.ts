import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AccessService } from "./access.service";
import { pool } from "../db/client";

@Controller()
export class AccessController {
  constructor(private readonly access: AccessService) {}

  @Post("students/:id/access-tokens/:type")
  @UseGuards(AuthGuard)
  async regenerate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("type") type: "student" | "parent",
  ) {
    if (!["student", "parent"].includes(type))
      throw new UnauthorizedException("invalid_token_type");
    const token = await this.access.regenerate(req.user.id, id, type);
    if (!token) throw new UnauthorizedException("student_not_found");
    return { token };
  }

  @Get("public/students")
  async student(@Query("token") token: string) {
    const access = await this.access.authenticate(token, "student");
    const assignments = await pool.query(
      `
      SELECT sa.id, a.title, a.description, a.due_at AS "dueAt", sa.status,
             sa.assigned_at AS "assignedAt", sa.submitted_at AS "submittedAt"
      FROM student_assignments sa JOIN assignments a ON a.id = sa.assignment_id
      WHERE sa.student_id = $1 AND a.deleted_at IS NULL ORDER BY a.due_at NULLS LAST
    `,
      [access.studentId],
    );
    return { student: access, assignments: assignments.rows };
  }

  @Get("public/parents")
  async parent(@Query("token") token: string) {
    const access = await this.access.authenticate(token, "parent");
    const [sessions, payments, assignments] = await Promise.all([
      pool.query(
        `SELECT taught_at AS "taughtAt", price_vnd AS "priceVnd", note FROM teaching_sessions WHERE student_id = $1 AND deleted_at IS NULL ORDER BY taught_at DESC`,
        [access.studentId],
      ),
      pool.query(
        `SELECT amount_vnd AS "amountVnd", paid_at AS "paidAt", status FROM payments WHERE student_id = $1 ORDER BY paid_at DESC`,
        [access.studentId],
      ),
      pool.query(
        `SELECT a.title, a.due_at AS "dueAt", sa.status, sa.submitted_at AS "submittedAt" FROM student_assignments sa JOIN assignments a ON a.id = sa.assignment_id WHERE sa.student_id = $1 AND a.deleted_at IS NULL ORDER BY a.due_at NULLS LAST`,
        [access.studentId],
      ),
    ]);
    return {
      student: { id: access.studentId, name: access.name },
      sessions: sessions.rows,
      payments: payments.rows,
      assignments: assignments.rows,
    };
  }
}
