import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { BadRequestError } from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import { PaymentsService } from "./payments.service";
import {
  AssignPaymentClassDto,
  CreatePaymentDto,
  UpdatePaymentDto,
} from "./payments.dto";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

@Controller("classes/:classId/payments")
@UseGuards(AuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Get() list(
    @Req() req: AuthenticatedRequest,
    @Param("classId", new ParseUUIDPipe()) id: string,
  ) {
    return this.payments.list(req.user.id, id);
  }
  @Post() create(
    @Req() req: AuthenticatedRequest,
    @Param("classId") id: string,
    @Body() body: CreatePaymentDto,
  ) {
    return this.payments.create(req.user.id, id, body);
  }
  @Patch(":paymentId")
  update(
    @Req() req: AuthenticatedRequest,
    @Param("classId", new ParseUUIDPipe()) classId: string,
    @Param("paymentId", new ParseUUIDPipe()) paymentId: string,
    @Body() body: UpdatePaymentDto,
  ) {
    return this.payments.update(req.user.id, classId, paymentId, body);
  }
  @Delete(":paymentId")
  remove(
    @Req() req: AuthenticatedRequest,
    @Param("classId", new ParseUUIDPipe()) classId: string,
    @Param("paymentId", new ParseUUIDPipe()) paymentId: string,
  ) {
    return this.payments.remove(req.user.id, classId, paymentId);
  }
}

// Root-level routes for payments that have no class context yet (legacy rows).
@Controller("payments")
@UseGuards(AuthGuard)
export class PaymentsLegacyController {
  constructor(private readonly payments: PaymentsService) {}
  @Get("legacy")
  listLegacy(
    @Req() req: AuthenticatedRequest,
    @Query("month") month?: string,
  ) {
    if (month && !MONTH_PATTERN.test(month))
      throw new BadRequestError(ErrorCodes.MONTH_MUST_BE_YYYY_MM);
    return this.payments.legacyList(req.user.id, month);
  }
  @Post(":paymentId/assign-class")
  assignClass(
    @Req() req: AuthenticatedRequest,
    @Param("paymentId", new ParseUUIDPipe()) paymentId: string,
    @Body() body: AssignPaymentClassDto,
  ) {
    return this.payments.assignClass(req.user.id, paymentId, body);
  }
}
