import type {
  TeachingSessionDto,
  UpdateTeachingSessionDto,
} from "./sessions.dto";
import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";

@Injectable()
export class SessionsRepository {
  async studentOwned(teacherId: string, studentId: string) {
    const query = `
      SELECT id
      FROM students
      WHERE id = $1
        AND teacher_id = $2
        AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [studentId, teacherId]);
    return (result.rowCount ?? 0) > 0;
  }

  async list(studentId: string) {
    const query = `
      SELECT
        ts.id,
        ts.student_id AS "studentId",
        ts.class_id AS "classId",
        c.name AS "className",
        ts.taught_at AS "taughtAt",
        ts.ends_at AS "endsAt",
        ts.price_vnd AS "priceVnd",
        ts.status,
        ts.note,
        ts.created_at AS "createdAt",
        ts.updated_at AS "updatedAt"
      FROM teaching_sessions AS ts
      LEFT JOIN classes AS c ON c.id = ts.class_id
      WHERE ts.student_id = $1
        AND ts.deleted_at IS NULL
      ORDER BY ts.taught_at DESC
    `;
    return (await pool.query(query, [studentId])).rows;
  }

  async listForTeacher(teacherId: string) {
    const query = `
      SELECT
        ts.id,
        ts.student_id AS "studentId",
        s.name AS "studentName",
        ts.taught_at AS "taughtAt",
        ts.price_vnd AS "priceVnd",
        ts.status,
        ts.note,
        ts.created_at AS "createdAt",
        ts.updated_at AS "updatedAt"
      FROM teaching_sessions AS ts
      INNER JOIN students AS s ON s.id = ts.student_id
      WHERE s.teacher_id = $1
        AND s.deleted_at IS NULL
        AND ts.deleted_at IS NULL
      ORDER BY ts.taught_at DESC
    `;
    return (await pool.query(query, [teacherId])).rows;
  }

  // Resolve which class governs pricing for a new session: explicit classId if
  // given (must contain the student), else the student's only class, else none.
  async resolvePricing(studentId: string, classId?: string) {
    let resolvedClassId = classId ?? null;
    if (!resolvedClassId) {
      const owned = await pool.query(
        `
        SELECT c.id
        FROM class_students AS cs
        INNER JOIN classes AS c ON c.id = cs.class_id AND c.deleted_at IS NULL
        WHERE cs.student_id = $1
        `,
        [studentId],
      );
      resolvedClassId = owned.rows.length === 1 ? owned.rows[0].id : null;
    }
    if (!resolvedClassId) {
      const student = await pool.query(
        `SELECT default_price_vnd FROM students WHERE id = $1`,
        [studentId],
      );
      return {
        classId: null,
        pricingMode: "per_session" as const,
        classPrice: null,
        studentDefaultPrice: Number(student.rows[0]?.default_price_vnd ?? 0),
      };
    }
    const result = await pool.query(
      `
      SELECT
        c.id,
        c.pricing_mode AS "pricingMode",
        c.default_price_vnd AS "classPrice",
        s.default_price_vnd AS "studentDefaultPrice"
      FROM classes AS c
      INNER JOIN students AS s ON s.id = $2
      INNER JOIN class_students AS cs ON cs.class_id = c.id AND cs.student_id = $2
      WHERE c.id = $1
        AND c.deleted_at IS NULL
        AND s.deleted_at IS NULL
      `,
      [resolvedClassId, studentId],
    );
    if (result.rows.length === 0) {
      // Class does not contain this student — fall back to student default.
      const student = await pool.query(
        `SELECT default_price_vnd FROM students WHERE id = $1`,
        [studentId],
      );
      return {
        classId: null,
        pricingMode: "per_session" as const,
        classPrice: null,
        studentDefaultPrice: Number(student.rows[0]?.default_price_vnd ?? 0),
      };
    }
    const row = result.rows[0];
    return {
      classId: row.id,
      pricingMode: row.pricingMode,
      classPrice: row.classPrice == null ? null : Number(row.classPrice),
      studentDefaultPrice: Number(row.studentDefaultPrice ?? 0),
    };
  }

  async create(studentId: string, input: TeachingSessionDto) {
    const query = `
      INSERT INTO teaching_sessions (
        student_id,
        class_id,
        taught_at,
        ends_at,
        price_vnd,
        note,
        status
      )
      SELECT $1, $5, $2, $6, COALESCE($3, default_price_vnd), $4, $7
      FROM students
      WHERE id = $1
      RETURNING *
    `;
    return (
      await pool.query(query, [
        studentId,
        input.taughtAt,
        input.priceVnd ?? null,
        input.note ?? null,
        input.classId ?? null,
        input.endsAt ?? null,
        input.status ?? "unconfirmed",
      ])
    ).rows[0];
  }

  async update(teacherId: string, id: string, input: UpdateTeachingSessionDto) {
    const query = `
      UPDATE teaching_sessions AS ts
      SET
        taught_at = COALESCE($1, ts.taught_at),
        ends_at = $6,
        price_vnd = COALESCE($2, ts.price_vnd),
        note = COALESCE($3, ts.note),
        status = COALESCE($7, ts.status),
        updated_at = now()
      FROM students AS s
      WHERE ts.id = $4
        AND ts.student_id = s.id
        AND ts.deleted_at IS NULL
        AND s.teacher_id = $5
        AND s.deleted_at IS NULL
      RETURNING ts.*
    `;
    return (
      await pool.query(query, [
        input.taughtAt,
        input.priceVnd,
        input.note,
        id,
        teacherId,
        input.endsAt ?? null,
        input.status ?? null,
      ])
    ).rows[0];
  }

  async softDelete(teacherId: string, id: string) {
    const query = `
      UPDATE teaching_sessions AS ts
      SET deleted_at = now(), updated_at = now()
      FROM students AS s
      WHERE ts.id = $1
        AND ts.student_id = s.id
        AND ts.deleted_at IS NULL
        AND s.teacher_id = $2
        AND s.deleted_at IS NULL
    `;
    const result = await pool.query(query, [id, teacherId]);
    return (result.rowCount ?? 0) > 0;
  }
}
