import { Injectable, NotFoundException } from "@nestjs/common";
import { ErrorCodes } from "../common/error-codes";
import { StorageService } from "../storage/storage.service";
import { SlipsRepository } from "./slips.repository";
import type { UpsertMonthlyNoteDto } from "./slips.dto";

@Injectable()
export class SlipsService {
  constructor(
    private readonly repository: SlipsRepository,
    private readonly storage: StorageService,
  ) {}

  async getSlip(teacherId: string, studentId: string, month: string) {
    const slip = await this.repository.findSlip(teacherId, studentId, month);
    if (!slip) throw new NotFoundException(ErrorCodes.STUDENT_NOT_FOUND);
    return {
      student: { name: slip.studentName },
      month: slip.month,
      sessions: slip.sessions,
      sessionCount: slip.sessionCount,
      due: slip.due,
      paid: slip.paid,
      balance: Math.max(slip.due - slip.paid, 0),
      assignments: slip.assignments,
      comment: slip.comment,
      // Same-origin URL — presigned S3 URLs are cross-origin and get blocked
      // by CORS when the PNG export re-fetches the QR image.
      paymentQrUrl: slip.paymentQrFileId
        ? `/files/${slip.paymentQrFileId}/raw`
        : null,
      generatedAt: new Date().toISOString(),
    };
  }

  async upsertNote(teacherId: string, studentId: string, input: UpsertMonthlyNoteDto) {
    if (!(await this.repository.ownsStudent(teacherId, studentId)))
      throw new NotFoundException(ErrorCodes.STUDENT_NOT_FOUND);
    await this.repository.upsertNote(studentId, input.month, input.comment ?? "");
    return { ok: true };
  }

  async setPaymentQr(userId: string, fileId: string) {
    await this.repository.setPaymentQrFile(userId, fileId);
  }
}
