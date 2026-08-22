import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { AuthGuard } from "../auth/auth.guard";
import { AuthRepository } from "../auth/auth.repository";
import { NotificationsRepository } from "./notifications.repository";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, AuthGuard, AuthRepository],
  exports: [NotificationsService],
})
export class NotificationsModule {}
