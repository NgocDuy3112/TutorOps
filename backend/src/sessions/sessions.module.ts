import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthRepository } from "../auth/auth.repository";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";
import { SessionsRepository } from "./sessions.repository";

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, SessionsRepository, AuthGuard, AuthRepository],
})
export class SessionsModule {}
