import { forwardRef, type ReactNode } from "react";
import { formatVnd, formatMonthLabel } from "../lib/format";
import { apiUrl } from "../lib/api";

export type SlipData = {
  student: { name: string };
  month: string;
  sessions: { id: string; taughtAt: string; priceVnd: number; note: string | null; className: string | null }[];
  sessionCount: number;
  due: number;
  paid: number;
  balance: number;
  assignments: {
    title: string;
    dueAt: string | null;
    status: string;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewNote: string | null;
  }[];
  comment: string;
  paymentQrUrl: string | null;
  generatedAt: string;
};

export const MonthlySlipCard = forwardRef<
  HTMLDivElement,
  { slip: SlipData; headerAction?: ReactNode; footer?: ReactNode }
>(function MonthlySlipCard({ slip, headerAction, footer }, ref) {
  const taughtDays = new Set(
    slip.sessions.map((session) =>
      Number(
        new Date(session.taughtAt)
          .toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })
          .slice(8),
      ),
    ),
  );
  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border bg-white text-slate-900"
    >
      <header className="flex items-start justify-between gap-3 bg-primary px-5 py-4 text-primary-foreground">
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{slip.student.name}</h2>
          <p className="text-sm text-primary-foreground/80">
            {formatMonthLabel(new Date(`${slip.month}-01T00:00:00`))}
          </p>
        </div>
        {headerAction}
      </header>

        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-5 gap-3">
            <section
              aria-label={`Lịch các buổi dạy trong ${formatMonthLabel(new Date(`${slip.month}-01T00:00:00`))}`}
              className="col-span-3 p-2.5"
            >
              <div className="grid grid-cols-7 gap-y-1 text-center text-[9px] font-semibold text-slate-400">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
                  <span key={label} className="whitespace-nowrap">{label}</span>
                ))}
                {Array.from({
                  length: (new Date(`${slip.month}-01T00:00:00`).getDay() + 6) % 7,
                }).map((_, index) => (
                  <span key={`blank-${index}`} aria-hidden />
                ))}
                {Array.from(
                  {
                    length: new Date(
                      Number(slip.month.slice(0, 4)),
                      Number(slip.month.slice(5, 7)),
                      0,
                    ).getDate(),
                  },
                  (_, index) => index + 1,
                ).map((day) => {
                  const taught = taughtDays.has(day);
                  return (
                    <span
                      key={day}
                      className={`mx-auto grid size-6 place-items-center rounded-full text-[10px] ${
                        taught
                          ? "bg-primary font-bold text-primary-foreground"
                          : "text-slate-600"
                      }`}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
              <p className="mt-2 text-center text-xs font-semibold text-primary/80">
                Đã dạy {slip.sessions.length}/{slip.sessionCount} buổi
              </p>
            </section>

            <section className="col-span-2 flex flex-col items-center justify-center gap-1 p-3 text-center">
              {slip.paymentQrUrl ? (
                <img
                  alt="Mã QR chuyển khoản"
                  className="size-28 rounded-xl object-contain shadow-sm"
                  src={apiUrl(slip.paymentQrUrl)}
                />
              ) : (
                <div className="grid size-28 place-items-center rounded-xl bg-muted text-[11px] text-muted-foreground">
                  Chưa có QR
                </div>
              )}
              <p className="text-[10px] leading-snug text-muted-foreground">
                {slip.paymentQrUrl
                  ? "Quét mã để chuyển học phí"
                  : "Chưa đặt mã QR — thêm trong Cài đặt."}
              </p>
              <p className="whitespace-nowrap text-2xl font-black text-primary">
                {formatVnd(slip.due).replace(" ₫", "₫")}
              </p>
            </section>
          </div>

          {slip.comment.trim() && (
            <section className="rounded-2xl border border-primary/15 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">
                Nhận xét của giáo viên
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm italic leading-relaxed text-slate-800">
                <span
                  aria-hidden
                  className="mr-1 align-top text-xl font-black leading-none text-primary/40"
                >
                  “
                </span>
                {slip.comment}
                <span
                  aria-hidden
                  className="ml-0.5 align-top text-xl font-black leading-none text-primary/40"
                >
                  ”
                </span>
              </p>
            </section>
          )}
        </div>
        {footer}
      </div>
    );
  },
);
