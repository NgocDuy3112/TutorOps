import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AssignmentsService } from "./assignments.service";
import { CreateAssignmentDto, UpdateAssignmentDto } from "./assignments.dto";
import { ParseUUIDPipe } from "@nestjs/common";

@Controller("assignments")
@UseGuards(AuthGuard)
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.assignments.list(request.user.id);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: CreateAssignmentDto) {
    return this.assignments.create(request.user.id, body);
  }

  @Patch(":id")
  update(@Req() request: AuthenticatedRequest, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: UpdateAssignmentDto) {
    return this.assignments.update(request.user.id, id, body);
  }

  @Delete(":id")
  remove(@Req() request: AuthenticatedRequest, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.assignments.remove(request.user.id, id);
  }
}
