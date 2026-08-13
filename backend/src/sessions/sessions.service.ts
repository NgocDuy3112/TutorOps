import type {
  TeachingSessionDto,
  UpdateTeachingSessionDto,
} from "./sessions.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { SessionsRepository } from "./sessions.repository";

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
    return this.repository.create(studentId, input);
  }
  async update(teacherId: string, id: string, input: UpdateTeachingSessionDto) {
    const session = await this.repository.update(teacherId, id, input);
    if (!session) throw new NotFoundException("session_not_found");
    return session;
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
