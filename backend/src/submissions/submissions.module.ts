import { Module } from "@nestjs/common";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";
import { AccessModule } from "../access/access.module";
import { FilesModule } from "../files/files.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [AccessModule, FilesModule, NotificationsModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
})
export class SubmissionsModule {}
