import type {
  ConfirmSlotDto,
  TeachingSessionDto,
  UpdateTeachingSessionDto,
} from "./sessions.dto";
import { Injectable } from "@nestjs/common";
import {
  BadRequestError,
  NotFoundError,
} from "../common/app-exception";
import { ErrorCodes } from "../common/error-codes";
import { SessionsRepository } from "./sessions.repository";

/** FR3.4: cho phép lệch clock 5 phút */
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

@Injectable()
export class SessionsService {
  constructor(private readonly repository: SessionsRepository) {}
  async list(teacherId: string, studentId: string) {
    await this.assertOwner(teacherId, studentId);
    return this.repository.list(studentId);
  }
  async listForTeacher(teacherId: string) {
    return this.repository.listForTeacher(teacherId);
  }
  async create(
    teacherId: string,
    studentId: string,
    input: TeachingSessionDto,
  ) {
    await this.assertOwner(teacherId, studentId);
    if (!input.taughtAt)
      throw new BadRequestError(ErrorCodes.INVALID_TEACHING_SESSION);
    this.assertNotFuture(input.taughtAt);
    if (input.endsAt) {
      if (new Date(input.endsAt).getTime() <= new Date(input.taughtAt).getTime())
        throw new BadRequestError(ErrorCodes.INVALID_TEACHING_SESSION);
    }
    const pricing = await this.repository.resolvePricing(studentId, input.classId);
    const priceVnd = this.computePrice(pricing, input);
    return this.repository.create(studentId, {
      ...input,
      classId: pricing.classId,
      priceVnd,
    });
  }

  // Price depends on the class pricing mode:
  // - per_session: manual price, else class default, else 0
  // - per_hour: hourly rate x duration (needs endsAt), manual override wins
  // - per_month: fixed monthly fee charged by the tuition report; sessions cost 0
  private computePrice(
    pricing: {
      classId: string | null;
      pricingMode: "per_session" | "per_hour" | "per_month";
      classPrice: number | null;
    },
    input: TeachingSessionDto,
  ): number {
    if (input.priceVnd != null) return input.priceVnd;
    if (pricing.pricingMode === "per_month") return 0;
    if (pricing.pricingMode === "per_hour") {
      if (!input.endsAt || pricing.classPrice == null) return 0;
      const hours =
        (new Date(input.endsAt).getTime() - new Date(input.taughtAt).getTime()) /
        3_600_000;
      return Math.round(pricing.classPrice * Math.max(hours, 0));
    }
    return pricing.classPrice ?? 0;
  }
  async update(teacherId: string, id: string, input: UpdateTeachingSessionDto) {
    if (input.taughtAt) this.assertNotFuture(input.taughtAt);
    const session = await this.repository.update(teacherId, id, input);
    if (!session) throw new NotFoundError(ErrorCodes.SESSION_NOT_FOUND);
    return session;
  }
  private assertNotFuture(taughtAt: string) {
    if (new Date(taughtAt).getTime() > Date.now() + MAX_CLOCK_SKEW_MS)
      throw new BadRequestError(ErrorCodes.FUTURE_SESSION_NOT_ALLOWED);
  }
  async remove(teacherId: string, id: string) {
    if (!(await this.repository.softDelete(teacherId, id)))
      throw new NotFoundError(ErrorCodes.SESSION_NOT_FOUND);
    return { ok: true };
  }

  // Confirms a fixed-schedule slot: materializes one taught session per
  // enrolled student for every schedule slot matching that weekday. Slot
  // times/prices come from the class (server-side source of truth).
  async confirmSlot(teacherId: string, classId: string, input: ConfirmSlotDto) {
    const pricing = await this.repository.classOwned(teacherId, classId);
    if (!pricing) throw new NotFoundError(ErrorCodes.CLASS_NOT_FOUND);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date))
      throw new BadRequestError(ErrorCodes.INVALID_TEACHING_SESSION);
    const [year, month, day] = input.date.split("-").map(Number);
    const dayUtcMs = Date.UTC(year, month - 1, day);
    const weekday = new Date(dayUtcMs).getUTCDay();

    const slots = await this.repository.classSlots(classId, weekday);
    if (slots.length === 0)
      throw new BadRequestError(ErrorCodes.SLOT_NOT_FOUND);

    const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
    const studentIds = await this.repository.classStudentIds(classId);
    let created = 0;
    for (const slot of slots) {
      const startUtcMs = dayUtcMs + parseHm(slot.startTime) - VN_OFFSET_MS;
      const endUtcMs = dayUtcMs + parseHm(slot.endTime) - VN_OFFSET_MS;
      const taughtAt = new Date(startUtcMs).toISOString();
      const endsAt = new Date(endUtcMs).toISOString();
      this.assertNotFuture(taughtAt);
      const priceVnd = this.computePrice(
        { ...pricing, classId },
        {
          taughtAt,
          endsAt,
          priceVnd: undefined,
        },
      );
      for (const studentId of studentIds) {
        if (
          await this.repository.insertConfirmed(
            studentId,
            classId,
            taughtAt,
            endsAt,
            priceVnd,
          )
        )
          created += 1;
      }
    }
    return { created };
  }
  private async assertOwner(teacherId: string, studentId: string) {
    if (!(await this.repository.studentOwned(teacherId, studentId)))
      throw new NotFoundError(ErrorCodes.STUDENT_NOT_FOUND);
  }
}

function parseHm(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours * 60 + minutes) * 60_000;
}
