import type {
  TeachingSessionDto,
  UpdateTeachingSessionDto,
} from "./sessions.dto";
import { Injectable } from "@nestjs/common";
import {
  BadRequestError,
  NotFoundError,
} from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import { SessionsRepository } from "./sessions.repository";

/** FR3.4: cho phép lệch clock 5 phút */
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

@Injectable()
export class SessionsService {
  constructor(private readonly repository: SessionsRepository) {}
  async list(teacherId: string, studentId: string) {
    await this.assertOwner(teacherId, studentId);
    return this.repository.list(studentId);
  }
  async listForTeacher(teacherId: string) {
    return this.repository.listForTeacher(teacherId);
  }
  async create(
    teacherId: string,
    studentId: string,
    input: TeachingSessionDto,
  ) {
    await this.assertOwner(teacherId, studentId);
    if (!input.taughtAt)
      throw new BadRequestError(ErrorCodes.INVALID_TEACHING_SESSION);
    this.assertNotFuture(input.taughtAt);
    return this.repository.create(studentId, input);
  }
  async update(teacherId: string, id: string, input: UpdateTeachingSessionDto) {
    if (input.taughtAt) this.assertNotFuture(input.taughtAt);
    const session = await this.repository.update(teacherId, id, input);
    if (!session) throw new NotFoundError(ErrorCodes.SESSION_NOT_FOUND);
    return session;
  }
  private assertNotFuture(taughtAt: string) {
    if (new Date(taughtAt).getTime() > Date.now() + MAX_CLOCK_SKEW_MS)
      throw new BadRequestError(ErrorCodes.FUTURE_SESSION_NOT_ALLOWED);
  }
  async remove(teacherId: string, id: string) {
    if (!(await this.repository.softDelete(teacherId, id)))
      throw new NotFoundError(ErrorCodes.SESSION_NOT_FOUND);
    return { ok: true };
  }
  private async assertOwner(teacherId: string, studentId: string) {
    if (!(await this.repository.studentOwned(teacherId, studentId)))
      throw new NotFoundError(ErrorCodes.STUDENT_NOT_FOUND);
  }
}
