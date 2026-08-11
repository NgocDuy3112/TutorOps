import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/http.types";
import { CreateLessonDto, UpdateLessonDto, AttachLessonFileDto } from "./lessons.dto";
import { LessonsService } from "./lessons.service";

@Controller("lessons")
@UseGuards(AuthGuard)
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}
  @Get() list(@Req() request: AuthenticatedRequest) { return this.lessons.list(request.user.id); }
  @Post() create(@Req() request: AuthenticatedRequest, @Body() body: CreateLessonDto) { return this.lessons.create(request.user.id, body); }
  @Patch(":id") update(@Req() request: AuthenticatedRequest, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: UpdateLessonDto) { return this.lessons.update(request.user.id, id, body); }
  @Delete(":id") remove(@Req() request: AuthenticatedRequest, @Param("id", new ParseUUIDPipe()) id: string) { return this.lessons.remove(request.user.id, id); }
  @Post(":id/files") attachFile(@Req() request: AuthenticatedRequest, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: AttachLessonFileDto) { return this.lessons.attachFile(request.user.id, id, body.fileId); }
}
