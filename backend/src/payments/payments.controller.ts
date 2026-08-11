import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./payments.dto";
import { ParseUUIDPipe } from "@nestjs/common";

@Controller("students/:studentId/payments")
@UseGuards(AuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Get() list(
    @Req() req: AuthenticatedRequest,
    @Param("studentId", new ParseUUIDPipe()) id: string,
  ) {
    return this.payments.list(req.user.id, id);
  }
  @Post() create(
    @Req() req: AuthenticatedRequest,
    @Param("studentId") id: string,
    @Body() body: CreatePaymentDto,
  ) {
    return this.payments.create(req.user.id, id, body);
  }
}
