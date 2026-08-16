import type {
  CreateAssignmentDto,
  ReviewDropboxSubmissionDto,
  UpdateAssignmentDto,
} from "./assignments.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { AssignmentsRepository } from "./assignments.repository";
import { StorageService } from "../storage/storage.service";

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
    if (!input.title?.trim()) throw new Error("invalid_assignment");
    return this.repository.create(teacherId, input);
  }
  async update(teacherId: string, id: string, input: UpdateAssignmentDto) {
    if (!input.title?.trim()) throw new Error("invalid_assignment");
    const assignment = await this.repository.update(teacherId, id, input);
    if (!assignment) throw new NotFoundException("assignment_not_found");
    return assignment;
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
      throw new NotFoundException("submission_not_found");
    return { ok: true };
  }
  async reviewDropboxSubmission(
    teacherId: string,
    assignmentId: string,
    submissionId: string,
    input: ReviewDropboxSubmissionDto,
  ) {
    const submission = await this.repository.reviewDropboxSubmission(
      teacherId,
      assignmentId,
      submissionId,
      input,
    );
    if (!submission) throw new NotFoundException("submission_or_student_not_found");
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
    if (!file) throw new NotFoundException("file_not_found");
    return { url: await this.storage.getDownloadUrl(file.storageKey) };
  }
  async remove(teacherId: string, id: string) {
    if (!(await this.repository.softDelete(teacherId, id)))
      throw new NotFoundException("assignment_not_found");
    return { ok: true };
  }
}
