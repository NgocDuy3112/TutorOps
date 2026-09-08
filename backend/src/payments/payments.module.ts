import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { AuthCoreModule } from "../auth/auth-core.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [AuthCoreModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
