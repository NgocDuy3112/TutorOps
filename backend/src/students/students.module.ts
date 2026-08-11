import { Module } from "@nestjs/common";
import { StudentsController } from "./students.controller";
import { StudentsService } from "./students.service";
import { StudentsRepository } from "./students.repository";
import { AuthGuard } from "../auth/auth.guard";
import { AuthRepository } from "../auth/auth.repository";
import { AccessModule } from "../access/access.module";

@Module({
  imports: [AccessModule],
  controllers: [StudentsController],
  providers: [StudentsService, StudentsRepository, AuthGuard, AuthRepository],
})
export class StudentsModule {}
