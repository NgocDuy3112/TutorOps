import type { CreateLessonDto, UpdateLessonDto } from "./lessons.dto";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { LessonsRepository } from "./lessons.repository";

@Injectable()
export class LessonsService {
  constructor(private readonly repository: LessonsRepository) {}

  list(teacherId: string) {
    return this.repository.list(teacherId);
  }

  create(teacherId: string, input: CreateLessonDto) {
    if (!input.title?.trim()) throw new BadRequestException("invalid_lesson");
    return this.repository.create(teacherId, input);
  }

  async update(teacherId: string, id: string, input: UpdateLessonDto) {
    const lesson = await this.repository.update(teacherId, id, input);
    if (!lesson) throw new NotFoundException("lesson_not_found");
    return lesson;
  }

  async remove(teacherId: string, id: string) {
    if (!(await this.repository.softDelete(teacherId, id))) {
      throw new NotFoundException("lesson_not_found");
    }
    return { ok: true };
  }

  async attachFile(teacherId: string, lessonId: string, fileId: string) {
    const link = await this.repository.attachFile(teacherId, lessonId, fileId);
    if (!link) throw new NotFoundException("lesson_or_file_not_found");
    return link;
  }
}
