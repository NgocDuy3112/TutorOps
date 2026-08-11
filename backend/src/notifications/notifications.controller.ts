import { Body, Controller, Delete, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedRequest } from "../auth/http.types";
import { NotificationsService } from "./notifications.service";
import { PushSubscriptionDto, UnsubscribeDto } from "./notifications.dto";

@ApiTags("notifications")
@Controller("notifications")
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get("public-key") publicKey() { return { publicKey: this.notifications.publicKey() }; }
  @Post("subscriptions") subscribe(@Req() req: AuthenticatedRequest, @Body() body: PushSubscriptionDto) { return this.notifications.subscribe(req.user.id, body); }
  @Delete("subscriptions") unsubscribe(@Req() req: AuthenticatedRequest, @Body() body: UnsubscribeDto) { return this.notifications.unsubscribe(req.user.id, body.endpoint); }
}
