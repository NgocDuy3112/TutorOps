import { BadRequestException, Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { TuitionService } from "./tuition.service";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

@Controller("tuition")
@UseGuards(AuthGuard)
export class TuitionController {
  constructor(private readonly tuition: TuitionService) {}

  @Get()
  report(@Req() req: AuthenticatedRequest, @Query("month") month?: string) {
    const target = month ?? currentMonth();
    if (!MONTH_PATTERN.test(target)) {
      throw new BadRequestException("month_must_be_yyyy_mm");
    }
    return this.tuition.report(req.user.id, target);
  }
}

function currentMonth(): string {
  // VN local time (UTC+7), no DST — fixed offset is safe.
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}
