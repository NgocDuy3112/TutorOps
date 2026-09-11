import { Module } from "@nestjs/common";
import { StudentsController } from "./students.controller";
import { StudentsService } from "./students.service";
import { StudentsRepository } from "./students.repository";
import { AccessModule } from "../access/access.module";
import { AuthCoreModule } from "../auth/auth-core.module";

@Module({
  imports: [AuthCoreModule, AccessModule],
  controllers: [StudentsController],
  providers: [StudentsService, StudentsRepository],
})
export class StudentsModule {}
