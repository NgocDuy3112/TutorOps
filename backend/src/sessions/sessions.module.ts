import { Module } from "@nestjs/common";
import { AuthCoreModule } from "../auth/auth-core.module";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";
import { SessionsRepository } from "./sessions.repository";

@Module({
  imports: [AuthCoreModule],
  providers: [SessionsService, SessionsRepository],
})
export class SessionsModule {}
