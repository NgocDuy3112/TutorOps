type SubmissionInput = { fileIds: string[] };
import { Injectable } from "@nestjs/common";
import {
  BadRequestError,
  NotFoundError,
} from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import { pool } from "../db/client";
import { AccessService } from "../access/access.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly access: AccessService,
    private readonly notifications: NotificationsService,
  ) {}
  async create(token: string, assignmentId: string, input: SubmissionInput) {
    const identity = await this.access.authenticate(token, "student");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const link = await client.query(
        `SELECT sa.id FROM student_assignments sa JOIN assignments a ON a.id = sa.assignment_id WHERE sa.student_id = $1 AND sa.assignment_id = $2 AND a.deleted_at IS NULL FOR UPDATE`,
        [identity.studentId, assignmentId],
      );
      if (!link.rowCount)
        throw new NotFoundError(ErrorCodes.ASSIGNMENT_NOT_FOUND);
      const attempt = await client.query(
        `SELECT COALESCE(MAX(attempt_no), 0) + 1 AS attempt FROM submissions WHERE student_assignment_id = $1`,
        [link.rows[0].id],
      );
      const submission = (
        await client.query(
          `INSERT INTO submissions (student_assignment_id, submitted_by, attempt_no) VALUES ($1, 'student', $2) RETURNING id, submitted_at AS "submittedAt", attempt_no AS "attemptNo"`,
          [link.rows[0].id, attempt.rows[0].attempt],
        )
      ).rows[0];
      for (const fileId of input.fileIds ?? []) {
        const file = await client.query(
          `SELECT id FROM files WHERE id = $1 AND deleted_at IS NULL`,
          [fileId],
        );
        if (!file.rowCount)
          throw new BadRequestError(ErrorCodes.FILE_NOT_FOUND);
        await client.query(
          `INSERT INTO submission_files (submission_id, file_id) VALUES ($1, $2)`,
          [submission.id, fileId],
        );
      }
      await client.query(
        `UPDATE student_assignments SET status = 'submitted', submitted_at = now(), updated_at = now() WHERE id = $1`,
        [link.rows[0].id],
      );
      await client.query("COMMIT");
      void this.notifications.sendToUser(identity.teacherId, {
        title: "Bài tập mới được nộp",
        body: `${identity.name} đã nộp bài tập`,
        url: "/assignments",
      });
      return submission;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
