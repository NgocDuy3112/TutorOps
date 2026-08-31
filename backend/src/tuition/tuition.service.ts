import { Injectable } from "@nestjs/common";
import { TuitionRepository } from "./tuition.repository";
import type { TuitionReportDto, TuitionTotals } from "./tuition.dto";

@Injectable()
export class TuitionService {
  constructor(private readonly repository: TuitionRepository) {}

  async report(teacherId: string, month: string): Promise<TuitionReportDto> {
    const students = await this.repository.listByMonth(teacherId, month);
    const totals = students.reduce<TuitionTotals>(
      (acc, row) => ({
        totalDue: acc.totalDue + row.due,
        totalPaid: acc.totalPaid + row.paid,
        balance: acc.balance + row.balance,
        debtCount: acc.debtCount + (row.balance > 0 ? 1 : 0),
        sessionCount: acc.sessionCount + row.sessionCount,
      }),
      { totalDue: 0, totalPaid: 0, balance: 0, debtCount: 0, sessionCount: 0 },
    );
    return { month, totals, students };
  }
}
