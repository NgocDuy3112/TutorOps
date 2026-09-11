import { Module } from "@nestjs/common";
import {
  PaymentsController,
  PaymentsLegacyController,
} from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { AuthCoreModule } from "../auth/auth-core.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [AuthCoreModule, NotificationsModule],
  controllers: [PaymentsController, PaymentsLegacyController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
