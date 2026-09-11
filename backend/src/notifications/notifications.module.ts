import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { AuthCoreModule } from "../auth/auth-core.module";
import { NotificationsRepository } from "./notifications.repository";
import { VersionModule } from "../version/version.module";

@Module({
  imports: [AuthCoreModule, VersionModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository],
  exports: [NotificationsService],
})
export class NotificationsModule {}
