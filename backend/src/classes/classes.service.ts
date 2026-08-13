import type { CreateClassDto, UpdateClassDto } from "./classes.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ClassesRepository } from "./classes.repository";

@Injectable()
export class ClassesService {
  constructor(private readonly repository: ClassesRepository) {}

  list(teacherId: string) {
    return this.repository.list(teacherId);
  }

  create(teacherId: string, input: CreateClassDto) {
    return this.repository.create(teacherId, input);
  }

  async update(teacherId: string, id: string, input: UpdateClassDto) {
    const record = await this.repository.update(teacherId, id, input);
    if (!record) throw new NotFoundException("class_not_found");
    return record;
  }

  async remove(teacherId: string, id: string) {
    if (!(await this.repository.softDelete(teacherId, id))) {
      throw new NotFoundException("class_not_found");
    }
    return { ok: true };
  }

  async addStudent(teacherId: string, classId: string, studentId: string) {
    const link = await this.repository.addStudent(
      teacherId,
      classId,
      studentId,
    );
    if (!link) throw new NotFoundException("class_or_student_not_found");
    return link;
  }

  async removeStudent(teacherId: string, classId: string, studentId: string) {
    if (!(await this.repository.removeStudent(teacherId, classId, studentId))) {
      throw new NotFoundException("class_student_not_found");
    }
    return { ok: true };
  }
}
