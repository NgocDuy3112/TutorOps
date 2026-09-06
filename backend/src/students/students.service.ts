import type { CreateStudentDto, UpdateStudentDto } from "./students.dto";
import { Injectable } from "@nestjs/common";
import { NotFoundError } from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import { StudentsRepository } from "./students.repository";
import { AccessService } from "../access/access.service";

@Injectable()
export class StudentsService {
  constructor(
    private readonly repository: StudentsRepository,
    private readonly access: AccessService,
  ) {}
  list(teacherId: string) {
    return this.repository.list(teacherId);
  }
  async create(teacherId: string, input: CreateStudentDto) {
    const student = await this.repository.create(teacherId, input);
    const [studentToken, parentToken] = await Promise.all([
      this.access.create(student.id, "student"),
      this.access.create(student.id, "parent"),
    ]);
    return { ...student, studentToken, parentToken };
  }
  async update(teacherId: string, id: string, input: CreateStudentDto) {
    const student = await this.repository.update(teacherId, id, input);
    if (!student) throw new NotFoundError(ErrorCodes.STUDENT_NOT_FOUND);
    return student;
  }
  async remove(teacherId: string, id: string) {
    if (!(await this.repository.softDelete(teacherId, id)))
      throw new NotFoundError(ErrorCodes.STUDENT_NOT_FOUND);
    return { ok: true };
  }
}
