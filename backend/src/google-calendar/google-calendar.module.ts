import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { GoogleCalendarRepository } from "./google-calendar.repository";
import { GoogleCalendarService } from "./google-calendar.service";

@Module({
  imports: [CommonModule],
  providers: [GoogleCalendarService, GoogleCalendarRepository],
  exports: [GoogleCalendarService, GoogleCalendarRepository],
})
export class GoogleCalendarModule {}
