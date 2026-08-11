import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthRepository } from "../auth/auth.repository";
import { AssignmentsController } from "./assignments.controller";
import { AssignmentsService } from "./assignments.service";
import { AssignmentsRepository } from "./assignments.repository";

@Module({
  controllers: [AssignmentsController],
  providers: [
    AssignmentsService,
    AssignmentsRepository,
    AuthGuard,
    AuthRepository,
  ],
})
export class AssignmentsModule {}
