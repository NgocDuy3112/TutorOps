export type TuitionClassRow = {
  id: string | null;
  name: string;
  due: number;
  paid: number;
  balance: number;
  sessionCount: number;
};

export type TuitionTotals = {
  totalDue: number;
  totalPaid: number;
  balance: number;
  debtCount: number;
  sessionCount: number;
};

export type TuitionReportDto = {
  month: string;
  totals: TuitionTotals;
  classes: TuitionClassRow[];
};
