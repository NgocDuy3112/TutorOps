import { Module } from "@nestjs/common";
import { AuthCoreModule } from "../auth/auth-core.module";
import { GoogleCalendarModule } from "../google-calendar/google-calendar.module";
import { ClassesController } from "./classes.controller";
import { ClassesRepository } from "./classes.repository";
import { ClassesService } from "./classes.service";

@Module({
  imports: [AuthCoreModule, GoogleCalendarModule],
  controllers: [ClassesController],
  providers: [ClassesService, ClassesRepository],
})
export class ClassesModule {}
