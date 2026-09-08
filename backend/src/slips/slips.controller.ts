import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { BadRequestError } from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import { SlipsService } from "./slips.service";
import { UpsertMonthlyNoteDto } from "./slips.dto";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

@ApiTags("slips")
@Controller("students")
@UseGuards(AuthGuard)
export class SlipsController {
  constructor(private readonly slips: SlipsService) {}

  @Get(":id/slip")
  getSlip(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Query("month") month: string,
  ) {
    if (!MONTH_PATTERN.test(month ?? ""))
      throw new BadRequestError(ErrorCodes.MONTH_MUST_BE_YYYY_MM);
    return this.slips.getSlip(req.user.id, id, month);
  }

  @Put(":id/monthly-notes")
  upsertNote(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: UpsertMonthlyNoteDto,
  ) {
    return this.slips.upsertNote(req.user.id, id, body);
  }
}
