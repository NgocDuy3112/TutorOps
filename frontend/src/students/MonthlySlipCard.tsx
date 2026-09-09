import { forwardRef, type ReactNode } from "react";
import { formatVnd, formatMonthLabel } from "../lib/format";

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

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
}

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
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Buổi học trong tháng ({slip.sessionCount})
            </h3>
            {slip.sessions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Chưa có buổi học nào.</p>
            ) : (
              <>
                <ul className="mt-2 space-y-1.5">
                  {slip.sessions.map((session) => (
                    <li
                      className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2 text-sm"
                      key={session.id}
                    >
                      <span className="font-medium">
                        {formatDate(session.taughtAt)}
                        {session.className ? ` · ${session.className}` : ""}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatVnd(session.priceVnd)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm">
                  <span className="font-semibold">Tổng học phí</span>
                  <span className="font-bold text-primary">{formatVnd(slip.due)}</span>
                </div>
              </>
            )}
          </section>

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

          <section className="flex items-center gap-4 rounded-xl border border-dashed p-4">
            {slip.paymentQrUrl ? (
              <img
                alt="Mã QR chuyển khoản"
                className="h-28 w-28 shrink-0 rounded-lg object-contain"
                src={slip.paymentQrUrl}
              />
            ) : (
              <div className="grid h-28 w-28 shrink-0 place-items-center rounded-lg bg-muted text-xs text-muted-foreground">
                Chưa có QR
              </div>
            )}
            <div className="min-w-0 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Chuyển khoản
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {slip.paymentQrUrl
                  ? `Quét mã QR để chuyển khoản, điền số tiền ${formatVnd(slip.balance)} như trên phiếu.`
                  : "Chưa đặt mã QR. Thêm trong Cài đặt để hiện tại đây."}
              </p>
            </div>
          </section>
        </div>
        {footer}
      </div>
    );
  },
);
