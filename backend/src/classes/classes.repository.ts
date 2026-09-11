import type {
  ClassScheduleSlotDto,
  CreateClassDto,
  UpdateClassDto,
} from "./classes.dto";
import { Injectable } from "@nestjs/common";
import { ConflictError } from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import { pool } from "../db/client";

/** Postgres unique_violation — thrown when a class name is already taken. */
const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === UNIQUE_VIOLATION;
}

const CLASS_COLUMNS = `
  id,
  name,
  subject,
  default_price_vnd AS "defaultPriceVnd",
  pricing_mode AS "pricingMode",
  auto_schedule AS "autoSchedule",
  note,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

@Injectable()
export class ClassesRepository {
  async list(teacherId: string) {
    const query = `
      SELECT
        c.id,
        c.name,
        c.subject,
        c.default_price_vnd AS "defaultPriceVnd",
        c.pricing_mode AS "pricingMode",
        c.auto_schedule AS "autoSchedule",
        c.note,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        COALESCE(COUNT(cs.student_id)::int, 0) AS "studentCount",
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'name', s.name, 'parentPhone', s.parent_phone)
            ORDER BY s.name
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS students,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'weekday', cs2.weekday,
                'startTime', to_char(cs2.start_time, 'HH24:MI'),
                'endTime', to_char(cs2.end_time, 'HH24:MI')
              )
              ORDER BY cs2.weekday, cs2.start_time
            )
            FROM class_schedules AS cs2
            WHERE cs2.class_id = c.id
          ),
          '[]'::json
        ) AS schedules
      FROM classes AS c
      LEFT JOIN class_students AS cs ON cs.class_id = c.id
      LEFT JOIN students AS s ON s.id = cs.student_id AND s.deleted_at IS NULL
      WHERE c.teacher_id = $1
        AND c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.name
    `;
    return (await pool.query(query, [teacherId])).rows;
  }

  async create(teacherId: string, input: CreateClassDto) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query(
        `
        INSERT INTO classes (
          teacher_id, name, subject, default_price_vnd, pricing_mode,
          auto_schedule, note
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING ${CLASS_COLUMNS}
        `,
        [
          teacherId,
          input.name.trim(),
          input.subject?.trim() || null,
          input.defaultPriceVnd ?? null,
          input.pricingMode ?? "per_session",
          input.autoSchedule ?? false,
          input.note ?? null,
        ],
      );
      const created = inserted.rows[0];
      await this.replaceSchedules(client, created.id, teacherId, input.schedules ?? []);
      await client.query("COMMIT");
      return { ...created, schedules: input.schedules ?? [] };
    } catch (error) {
      await client.query("ROLLBACK");
      if (isUniqueViolation(error))
        throw new ConflictError(ErrorCodes.CLASS_NAME_EXISTS);
      throw error;
    } finally {
      client.release();
    }
  }

  // Full replace for fields the edit UI owns (name, price, pricing mode,
  // schedule, note): the UI always sends them, and null means "cleared".
  // COALESCE here would silently keep the old value, making fields impossible
  // to clear. `subject` is not edited by any UI yet, so it stays COALESCE.
  async update(teacherId: string, id: string, input: UpdateClassDto) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await client.query(
        `
        UPDATE classes
        SET
          name = $1,
          subject = COALESCE($2, subject),
          default_price_vnd = $3,
          pricing_mode = $4,
          auto_schedule = $5,
          note = $6,
          updated_at = now()
        WHERE id = $7
          AND teacher_id = $8
          AND deleted_at IS NULL
        RETURNING ${CLASS_COLUMNS}
        `,
        [
          input.name.trim(),
          input.subject?.trim(),
          input.defaultPriceVnd ?? null,
          input.pricingMode ?? "per_session",
          input.autoSchedule ?? false,
          input.note ?? null,
          id,
          teacherId,
        ],
      );
      if (updated.rowCount === 0) {
        await client.query("ROLLBACK");
        return undefined;
      }
      await this.replaceSchedules(client, id, teacherId, input.schedules ?? []);
      await client.query("COMMIT");
      return { ...updated.rows[0], schedules: input.schedules ?? [] };
    } catch (error) {
      await client.query("ROLLBACK");
      if (isUniqueViolation(error))
        throw new ConflictError(ErrorCodes.CLASS_NAME_EXISTS);
      throw error;
    } finally {
      client.release();
    }
  }

  private async replaceSchedules(
    client: import("pg").PoolClient,
    classId: string,
    teacherId: string,
    slots: ClassScheduleSlotDto[],
  ) {
    await client.query(
      `DELETE FROM class_schedules WHERE class_id = $1 AND teacher_id = $2`,
      [classId, teacherId],
    );
    for (const slot of slots) {
      await client.query(
        `
        INSERT INTO class_schedules (class_id, teacher_id, weekday, start_time, end_time)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
        `,
        [classId, teacherId, slot.weekday, slot.startTime, slot.endTime],
      );
    }
  }

  async softDelete(teacherId: string, id: string) {
    const query = `
      UPDATE classes
      SET deleted_at = now(), updated_at = now()
      WHERE id = $1
        AND teacher_id = $2
        AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id, teacherId]);
    return (result.rowCount ?? 0) > 0;
  }

  async addStudent(teacherId: string, classId: string, studentId: string) {
    const query = `
      INSERT INTO class_students (teacher_id, class_id, student_id)
      SELECT $1, c.id, s.id
      FROM classes AS c
      INNER JOIN students AS s ON s.teacher_id = c.teacher_id
      WHERE c.id = $2
        AND s.id = $3
        AND c.teacher_id = $1
        AND c.deleted_at IS NULL
        AND s.deleted_at IS NULL
      ON CONFLICT DO NOTHING
      RETURNING class_id AS "classId", student_id AS "studentId"
    `;
    return (await pool.query(query, [teacherId, classId, studentId])).rows[0];
  }

  async removeStudent(teacherId: string, classId: string, studentId: string) {
    const query = `
      DELETE FROM class_students
      WHERE teacher_id = $1
        AND class_id = $2
        AND student_id = $3
    `;
    const result = await pool.query(query, [teacherId, classId, studentId]);
    return (result.rowCount ?? 0) > 0;
  }
}
