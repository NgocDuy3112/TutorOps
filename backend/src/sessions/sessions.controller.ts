import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { SessionsService } from "./sessions.service";
import {
  ConfirmSlotDto,
  TeachingSessionDto,
  UpdateTeachingSessionDto,
} from "./sessions.dto";

@Controller()
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get("sessions")
  listForTeacher(@Req() request: AuthenticatedRequest) {
    return this.sessions.listForTeacher(request.user.id);
  }

  @Get("students/:studentId/sessions")
  list(
    @Req() request: AuthenticatedRequest,
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
  ) {
    return this.sessions.list(request.user.id, studentId);
  }

  @Post("students/:studentId/sessions")
  create(
    @Req() request: AuthenticatedRequest,
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
    @Body() body: TeachingSessionDto,
  ) {
    return this.sessions.create(request.user.id, studentId, body);
  }

  @Post("classes/:classId/sessions/confirm-slot")
  confirmSlot(
    @Req() request: AuthenticatedRequest,
    @Param("classId", new ParseUUIDPipe()) classId: string,
    @Body() body: ConfirmSlotDto,
  ) {
    return this.sessions.confirmSlot(request.user.id, classId, body);
  }

  @Patch("sessions/:id")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: UpdateTeachingSessionDto,
  ) {
    return this.sessions.update(request.user.id, id, body);
  }

  @Delete("sessions/:id")
  remove(
    @Req() request: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.sessions.remove(request.user.id, id);
  }
}
