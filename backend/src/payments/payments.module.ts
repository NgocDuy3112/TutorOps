import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { AuthGuard } from "../auth/auth.guard";
import { AuthRepository } from "../auth/auth.repository";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, AuthGuard, AuthRepository],
})
export class PaymentsModule {}
