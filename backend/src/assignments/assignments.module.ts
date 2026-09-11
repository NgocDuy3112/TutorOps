import { Module } from "@nestjs/common";
import { AuthCoreModule } from "../auth/auth-core.module";
import { AssignmentsController } from "./assignments.controller";
import { AssignmentsService } from "./assignments.service";
import { AssignmentsRepository } from "./assignments.repository";

@Module({
  imports: [AuthCoreModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, AssignmentsRepository],
})
export class AssignmentsModule {}
