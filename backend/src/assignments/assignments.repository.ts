import type {
  CreateAssignmentDto,
  ReviewDropboxSubmissionDto,
  UpdateAssignmentDto,
} from "./assignments.dto";
import { Injectable } from "@nestjs/common";
import { pool } from "../db/client";

@Injectable()
export class AssignmentsRepository {
  async list(teacherId: string) {
    const query = `
      SELECT
        a.id,
        a.title,
        a.description,
        a.due_at AS "dueAt",
        a.created_at AS "createdAt",
        COUNT(sa.id)::int AS "studentCount",
        COALESCE(
          json_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL AND c.deleted_at IS NULL),
          '[]'::json
        ) AS "classNames",
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
      LEFT JOIN class_students AS cs ON cs.student_id = s.id AND cs.teacher_id = a.teacher_id AND cs.class_id IN (SELECT id FROM classes WHERE deleted_at IS NULL)
      LEFT JOIN classes AS c ON c.id = cs.class_id AND c.deleted_at IS NULL
      WHERE a.teacher_id = $1
        AND a.deleted_at IS NULL
      GROUP BY a.id
      ORDER BY a.due_at NULLS LAST, a.created_at DESC
    `;
    return (await pool.query(query, [teacherId])).rows;
  }

  async create(teacherId: string, input: CreateAssignmentDto) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const assignmentQuery = `
        INSERT INTO assignments (teacher_id, title, description, lesson_id, due_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          title,
          description,
          due_at AS "dueAt",
          created_at AS "createdAt"
      `;
      const assignment = (
        await client.query(assignmentQuery, [
          teacherId,
          input.title.trim(),
          input.description ?? null,
          input.lessonId ?? null,
          input.dueAt ?? null,
        ])
      ).rows[0];

      const linkQuery = `
        INSERT INTO student_assignments (assignment_id, student_id, teacher_id)
        SELECT $1, id, teacher_id
        FROM students
        WHERE id = $2
          AND teacher_id = $3
          AND deleted_at IS NULL
        ON CONFLICT DO NOTHING
      `;
      for (const studentId of input.studentIds ?? []) {
        await client.query(linkQuery, [assignment.id, studentId, teacherId]);
      }

      const classLinkQuery = `
        INSERT INTO student_assignments (assignment_id, student_id, teacher_id)
        SELECT $1, cs.student_id, cs.teacher_id
        FROM class_students AS cs
        INNER JOIN classes AS c ON c.id = cs.class_id
        INNER JOIN students AS s ON s.id = cs.student_id
        WHERE cs.class_id = $2
          AND cs.teacher_id = $3
          AND c.deleted_at IS NULL
          AND s.deleted_at IS NULL
        ON CONFLICT DO NOTHING
      `;
      for (const classId of input.classIds ?? []) {
        await client.query(classLinkQuery, [assignment.id, classId, teacherId]);
      }

      const fileQuery = `
        INSERT INTO assignment_files (assignment_id, file_id)
        SELECT $1, id
        FROM files
        WHERE id = $2
          AND created_by = $3
          AND deleted_at IS NULL
        ON CONFLICT DO NOTHING
      `;
      for (const fileId of input.fileIds ?? []) {
        await client.query(fileQuery, [assignment.id, fileId, teacherId]);
      }

      await client.query("COMMIT");
      return assignment;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async update(teacherId: string, id: string, input: UpdateAssignmentDto) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const assignment = await client.query(
        `UPDATE assignments SET title = $1, description = $2, lesson_id = $3, due_at = $4, updated_at = now() WHERE id = $5 AND teacher_id = $6 AND deleted_at IS NULL RETURNING id`,
        [
          input.title.trim(),
          input.description ?? null,
          input.lessonId ?? null,
          input.dueAt ?? null,
          id,
          teacherId,
        ],
      );
      if (!assignment.rowCount) {
        await client.query("ROLLBACK");
        return null;
      }
      await client.query(
        `DELETE FROM student_assignments WHERE assignment_id = $1 AND teacher_id = $2`,
        [id, teacherId],
      );
      const linkQuery = `INSERT INTO student_assignments (assignment_id, student_id, teacher_id) SELECT $1, id, teacher_id FROM students WHERE id = $2 AND teacher_id = $3 AND deleted_at IS NULL ON CONFLICT DO NOTHING`;
      for (const studentId of input.studentIds) {
        await client.query(linkQuery, [id, studentId, teacherId]);
      }
      const classLinkQuery = `INSERT INTO student_assignments (assignment_id, student_id, teacher_id) SELECT $1, cs.student_id, cs.teacher_id FROM class_students AS cs INNER JOIN classes AS c ON c.id = cs.class_id INNER JOIN students AS s ON s.id = cs.student_id WHERE cs.class_id = $2 AND cs.teacher_id = $3 AND c.deleted_at IS NULL AND s.deleted_at IS NULL ON CONFLICT DO NOTHING`;
      for (const classId of input.classIds ?? []) {
        await client.query(classLinkQuery, [id, classId, teacherId]);
      }
      await client.query("COMMIT");
      return { id };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async dropboxSubmissions(teacherId: string, assignmentId: string) {
    const result = await pool.query(
      `SELECT ds.id, ds.submitted_at AS "submittedAt", ds.viewed_at AS "viewedAt", ds.downloaded_at AS "downloadedAt", ds.score::float AS score, ds.review_note AS "reviewNote", ds.reviewed_at AS "reviewedAt", CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('id', s.id, 'name', s.name) END AS student, COALESCE(json_agg(json_build_object('id', f.id, 'name', f.original_name, 'mimeType', f.mime_type, 'storageKey', f.storage_key) ORDER BY f.created_at) FILTER (WHERE f.id IS NOT NULL), '[]'::json) AS files FROM assignment_dropbox_submissions ds JOIN assignments a ON a.id = ds.assignment_id LEFT JOIN students s ON s.id = ds.student_id AND s.deleted_at IS NULL LEFT JOIN assignment_dropbox_submission_files dsf ON dsf.submission_id = ds.id LEFT JOIN files f ON f.id = dsf.file_id AND f.deleted_at IS NULL WHERE ds.assignment_id = $1 AND a.teacher_id = $2 AND a.deleted_at IS NULL GROUP BY ds.id, s.id ORDER BY ds.submitted_at DESC`,
      [assignmentId, teacherId],
    );
    return result.rows;
  }

  async markDropboxSubmission(
    teacherId: string,
    assignmentId: string,
    submissionId: string,
    field: "viewed_at" | "downloaded_at",
  ) {
    const result = await pool.query(
      `UPDATE assignment_dropbox_submissions ds SET ${field} = now() FROM assignments a WHERE ds.id = $1 AND ds.assignment_id = $2 AND a.id = ds.assignment_id AND a.teacher_id = $3 AND a.deleted_at IS NULL RETURNING ds.id`,
      [submissionId, assignmentId, teacherId],
    );
    return Boolean(result.rowCount);
  }

  async reviewDropboxSubmission(
    teacherId: string,
    assignmentId: string,
    submissionId: string,
    input: ReviewDropboxSubmissionDto,
  ) {
    const result = await pool.query(
      `WITH reviewed AS (
         UPDATE assignment_dropbox_submissions ds
         SET student_id = $4, score = $5, review_note = $6, reviewed_at = now()
         FROM assignments a
         JOIN student_assignments sa
           ON sa.assignment_id = a.id AND sa.teacher_id = a.teacher_id
         JOIN students s ON s.id = sa.student_id AND s.deleted_at IS NULL
         WHERE ds.id = $1
           AND ds.assignment_id = $2
           AND a.id = ds.assignment_id
           AND a.teacher_id = $3
           AND a.deleted_at IS NULL
           AND sa.student_id = $4
         RETURNING ds.id, ds.student_id, ds.score, ds.review_note, ds.reviewed_at
       ), updated_assignment AS (
         UPDATE student_assignments sa
         SET status = 'reviewed', reviewed_by = $3, reviewed_at = r.reviewed_at,
             review_note = r.review_note, updated_at = now()
         FROM reviewed r
         WHERE sa.assignment_id = $2 AND sa.student_id = r.student_id
         RETURNING r.id
       )
       SELECT r.id, r.student_id AS "studentId", r.score::float AS score,
         r.review_note AS "reviewNote", r.reviewed_at AS "reviewedAt"
       FROM reviewed r`,
      [
        submissionId,
        assignmentId,
        teacherId,
        input.studentId,
        input.score,
        input.reviewNote?.trim() || null,
      ],
    );
    return result.rows[0] ?? null;
  }

  async fileDownload(teacherId: string, assignmentId: string, fileId: string) {
    const result = await pool.query(
      `SELECT f.storage_key AS "storageKey" FROM files f JOIN assignment_dropbox_submission_files dsf ON dsf.file_id = f.id JOIN assignment_dropbox_submissions ds ON ds.id = dsf.submission_id JOIN assignments a ON a.id = ds.assignment_id WHERE f.id = $1 AND ds.assignment_id = $2 AND a.teacher_id = $3 AND a.deleted_at IS NULL AND f.deleted_at IS NULL`,
      [fileId, assignmentId, teacherId],
    );
    return result.rows[0] ?? null;
  }

  async softDelete(teacherId: string, id: string) {
    const query = `
      UPDATE assignments
      SET deleted_at = now(), updated_at = now()
      WHERE id = $1
        AND teacher_id = $2
        AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id, teacherId]);
    return (result.rowCount ?? 0) > 0;
  }
}
