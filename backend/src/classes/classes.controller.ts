import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CreateClassDto, UpdateClassDto } from "./classes.dto";
import { ClassesService } from "./classes.service";

@Controller("classes")
@UseGuards(AuthGuard)
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.classes.list(request.user.id);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: CreateClassDto) {
    return this.classes.create(request.user.id, body);
  }

  @Patch(":id")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: UpdateClassDto,
  ) {
    return this.classes.update(request.user.id, id, body);
  }

  @Delete(":id")
  remove(@Req() request: AuthenticatedRequest, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.classes.remove(request.user.id, id);
  }

  @Post(":id/students/:studentId")
  addStudent(
    @Req() request: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
  ) {
    return this.classes.addStudent(request.user.id, id, studentId);
  }

  @Delete(":id/students/:studentId")
  removeStudent(
    @Req() request: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
  ) {
    return this.classes.removeStudent(request.user.id, id, studentId);
  }
}
