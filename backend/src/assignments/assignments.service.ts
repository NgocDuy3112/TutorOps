import type { CreateAssignmentDto, UpdateAssignmentDto } from "./assignments.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { AssignmentsRepository } from "./assignments.repository";

@Injectable()
export class AssignmentsService {
  constructor(private readonly repository: AssignmentsRepository) {}
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
  async remove(teacherId: string, id: string) {
    if (!(await this.repository.softDelete(teacherId, id)))
      throw new NotFoundException("assignment_not_found");
    return { ok: true };
  }
}
