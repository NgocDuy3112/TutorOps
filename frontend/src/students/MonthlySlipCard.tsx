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

/**
 * Phiếu tổng kết tháng — render tĩnh để xuất ảnh PNG (html-to-image).
 * Chỉ dùng token màu sẵn có, không style động.
 *
 * `headerAction` / `footer` host interactive controls (month filter, comment
 * editor). They render inside the card but must be marked `data-noexport`
 * by the caller — the PNG export filter strips them.
 */
export const MonthlySlipCard = forwardRef<
  HTMLDivElement,
  { slip: SlipData; headerAction?: ReactNode; footer?: ReactNode }
>(function MonthlySlipCard({ slip, headerAction, footer }, ref) {
  // Day-of-month of each session, resolved in VN local time so the calendar
  // highlights the day the student actually attended.
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
          {/* Money first: total is the headline, calendar is the proof. */}
          <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
                Tổng học phí
              </p>
              <p className="text-xs text-primary/70">
                {slip.sessionCount > 0
                  ? `Đã dạy ${slip.sessionCount} buổi`
                  : "Chưa có buổi học"}
              </p>
            </div>
            <p className="shrink-0 text-xl font-black text-primary">
              {formatVnd(slip.due)}
            </p>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {/* Mini month calendar — teaching days filled purple. */}
            <section
              aria-label={`Lịch các buổi dạy trong ${formatMonthLabel(new Date(`${slip.month}-01T00:00:00`))}`}
              className="col-span-3 rounded-xl border border-slate-100 p-2.5"
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
            </section>

            {/* QR cell */}
            <section className="col-span-2 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed p-3 text-center">
              {slip.paymentQrUrl ? (
                <img
                  alt="Mã QR chuyển khoản"
                  className="size-20 rounded-lg object-contain"
                  src={apiUrl(slip.paymentQrUrl)}
                />
              ) : (
                <div className="grid size-20 place-items-center rounded-lg bg-muted text-[11px] text-muted-foreground">
                  Chưa có QR
                </div>
              )}
              <p className="text-[10px] leading-snug text-muted-foreground">
                {slip.paymentQrUrl
                  ? `Quét mã để chuyển khoản, điền ${formatVnd(slip.balance)}.`
                  : "Chưa đặt mã QR — thêm trong Cài đặt."}
              </p>
            </section>
          </div>

          {slip.comment.trim() && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nhận xét của giáo viên
              </h3>
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm">
                {slip.comment}
              </p>
            </section>
          )}
        </div>
        {footer}
      </div>
    );
  },
);
