import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto, UpdatePaymentDto } from "./payments.dto";

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
  @Patch(":paymentId")
  update(
    @Req() req: AuthenticatedRequest,
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
    @Param("paymentId", new ParseUUIDPipe()) paymentId: string,
    @Body() body: UpdatePaymentDto,
  ) {
    return this.payments.update(req.user.id, studentId, paymentId, body);
  }
}
