import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { FilesModule } from "../files/files.module";
import { GoogleCalendarModule } from "../google-calendar/google-calendar.module";

@Module({
  imports: [FilesModule, GoogleCalendarModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService],
})
export class AuthModule {}
