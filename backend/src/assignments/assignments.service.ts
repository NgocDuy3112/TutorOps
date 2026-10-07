import type {
  CreateAssignmentDto,
  ReviewDropboxSubmissionDto,
  UpdateAssignmentDto,
} from "./assignments.dto";
import { Injectable } from "@nestjs/common";
import {
  BadRequestError,
  NotFoundError,
} from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import { AssignmentsRepository } from "./assignments.repository";
import { StorageService } from "../storage/storage.service";

/** FR4.6: cho phép lệch clock 5 phút */
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly repository: AssignmentsRepository,
    private readonly storage: StorageService,
  ) {}
  list(teacherId: string) {
    return this.repository.list(teacherId);
  }
  create(teacherId: string, input: CreateAssignmentDto) {
    if (!input.title?.trim())
      throw new BadRequestError(ErrorCodes.INVALID_ASSIGNMENT);
    this.assertValidTargets(input.studentIds, input.classIds);
    this.assertFutureDeadline(input.dueAt);
    return this.repository.create(teacherId, input);
  }
  async update(teacherId: string, id: string, input: UpdateAssignmentDto) {
    if (!input.title?.trim())
      throw new BadRequestError(ErrorCodes.INVALID_ASSIGNMENT);
    this.assertValidTargets(input.studentIds, input.classIds);
    this.assertFutureDeadline(input.dueAt ?? undefined);
    const assignment = await this.repository.update(teacherId, id, input);
    if (!assignment) throw new NotFoundError(ErrorCodes.ASSIGNMENT_NOT_FOUND);
    return assignment;
  }
  /** FR4.7: phải gán ít nhất 1 lớp hoặc 1 học sinh */
  private assertValidTargets(
    studentIds?: string[],
    classIds?: string[],
  ) {
    if (!(studentIds?.length ?? 0) && !(classIds?.length ?? 0))
      throw new BadRequestError(ErrorCodes.ASSIGNMENT_TARGET_REQUIRED);
  }
  /** FR4.6: deadline không được ở quá khứ */
  private assertFutureDeadline(dueAt?: string | null) {
    if (dueAt && new Date(dueAt).getTime() < Date.now() - MAX_CLOCK_SKEW_MS)
      throw new BadRequestError(ErrorCodes.PAST_DEADLINE_NOT_ALLOWED);
  }
  async dropboxSubmissions(teacherId: string, assignmentId: string) {
    return this.repository.dropboxSubmissions(teacherId, assignmentId);
  }
  async markDropboxSubmission(
    teacherId: string,
    assignmentId: string,
    submissionId: string,
    status: "viewed" | "downloaded",
  ) {
    if (
      !(await this.repository.markDropboxSubmission(
        teacherId,
        assignmentId,
        submissionId,
        status === "viewed" ? "viewed_at" : "downloaded_at",
      ))
    )
      throw new NotFoundError(ErrorCodes.SUBMISSION_NOT_FOUND);
    return { ok: true };
  }
  async reviewDropboxSubmission(
    teacherId: string,
    assignmentId: string,
    submissionId: string,
    input: ReviewDropboxSubmissionDto,
  ) {
    // FR4.4: điểm 0–10, bước 0.25
    if (Math.round(input.score * 4) !== input.score * 4)
      throw new BadRequestError(ErrorCodes.INVALID_SCORE_STEP);
    const submission = await this.repository.reviewDropboxSubmission(
      teacherId,
      assignmentId,
      submissionId,
      input,
    );
    if (!submission) throw new NotFoundError(ErrorCodes.SUBMISSION_OR_STUDENT_NOT_FOUND);
    return submission;
  }
  async dropboxFileUrl(
    teacherId: string,
    assignmentId: string,
    fileId: string,
  ) {
    const file = await this.repository.fileDownload(
      teacherId,
      assignmentId,
      fileId,
    );
    if (!file) throw new NotFoundError(ErrorCodes.FILE_NOT_FOUND);
    return { url: await this.storage.getDownloadUrl(file.storageKey) };
  }
  async remove(teacherId: string, id: string) {
    if (!(await this.repository.softDelete(teacherId, id)))
      throw new NotFoundError(ErrorCodes.ASSIGNMENT_NOT_FOUND);
    return { ok: true };
  }
}
