import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { SchedulesService } from "./schedules.service";

@Module({
  imports: [CommonModule],
  providers: [SchedulesService],
})
export class SchedulesModule {}
