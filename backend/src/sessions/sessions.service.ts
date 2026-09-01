import type {
  TeachingSessionDto,
  UpdateTeachingSessionDto,
} from "./sessions.dto";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
    if (!input.taughtAt) throw new Error("invalid_teaching_session");
    this.assertNotFuture(input.taughtAt);
    return this.repository.create(studentId, input);
  }
  async update(teacherId: string, id: string, input: UpdateTeachingSessionDto) {
    if (input.taughtAt) this.assertNotFuture(input.taughtAt);
    const session = await this.repository.update(teacherId, id, input);
    if (!session) throw new NotFoundException("session_not_found");
    return session;
  }
  private assertNotFuture(taughtAt: string) {
    if (new Date(taughtAt).getTime() > Date.now() + MAX_CLOCK_SKEW_MS)
      throw new BadRequestException("future_session_not_allowed");
  }
  async remove(teacherId: string, id: string) {
    if (!(await this.repository.softDelete(teacherId, id)))
      throw new NotFoundException("session_not_found");
    return { ok: true };
  }
  private async assertOwner(teacherId: string, studentId: string) {
    if (!(await this.repository.studentOwned(teacherId, studentId)))
      throw new NotFoundException("student_not_found");
  }
}
