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
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { StudentsService } from "./students.service";
import { CreateStudentDto, UpdateStudentDto } from "./students.dto";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("students")
@Controller("students")
@UseGuards(AuthGuard)
export class StudentsController {
  constructor(private readonly students: StudentsService) {}
  @Get() list(@Req() req: AuthenticatedRequest) {
    return this.students.list(req.user.id);
  }
  @Post() create(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateStudentDto,
  ) {
    return this.students.create(req.user.id, body);
  }
  @Patch(":id") update(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: UpdateStudentDto,
  ) {
    return this.students.update(req.user.id, id, body);
  }
  @Delete(":id") remove(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.students.remove(req.user.id, id);
  }
}
