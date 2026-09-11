import type { CreateClassDto, UpdateClassDto } from "./classes.dto";
import { Injectable } from "@nestjs/common";
import { NotFoundError } from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import { GoogleCalendarService } from "../google-calendar/google-calendar.service";
import { ClassesRepository } from "./classes.repository";

@Injectable()
export class ClassesService {
  constructor(
    private readonly repository: ClassesRepository,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

  list(teacherId: string) {
    return this.repository.list(teacherId);
  }

  create(teacherId: string, input: CreateClassDto) {
    return this.repository.create(teacherId, input);
  }

  async update(teacherId: string, id: string, input: UpdateClassDto) {
    const record = await this.repository.update(teacherId, id, input);
    if (!record) throw new NotFoundError(ErrorCodes.CLASS_NOT_FOUND);
    // Push the new schedule shape to Google Calendar (no-op when not
    // connected). Awaited so the user's calendar is current when the
    // sheet closes.
    await this.googleCalendar
      .syncTeacher(teacherId)
      .catch(() => undefined);
    return record;
  }

  async remove(teacherId: string, id: string) {
    if (!(await this.repository.softDelete(teacherId, id))) {
      throw new NotFoundError(ErrorCodes.CLASS_NOT_FOUND);
    }
    // Sync BEFORE the row disappears would delete its events; after the
    // delete the events are already orphaned in the reconcile diff — run
    // after so the removed class's events get cleaned up.
    await this.googleCalendar
      .syncTeacher(teacherId)
      .catch(() => undefined);
    return { ok: true };
  }

  async addStudent(teacherId: string, classId: string, studentId: string) {
    const link = await this.repository.addStudent(
      teacherId,
      classId,
      studentId,
    );
    if (!link) throw new NotFoundError(ErrorCodes.CLASS_OR_STUDENT_NOT_FOUND);
    return link;
  }

  async removeStudent(teacherId: string, classId: string, studentId: string) {
    if (!(await this.repository.removeStudent(teacherId, classId, studentId))) {
      throw new NotFoundError(ErrorCodes.CLASS_STUDENT_NOT_FOUND);
    }
    return { ok: true };
  }
}
