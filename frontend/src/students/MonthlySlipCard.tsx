import { forwardRef } from "react";
import { BookOpenCheck, CheckCircle2, Clock, Wallet } from "lucide-react";
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

const ASSIGNMENT_STATUS: Record<string, { label: string; className: string }> = {
  assigned: { label: "Chưa nộp", className: "text-amber-700" },
  submitted: { label: "Đã nộp", className: "text-blue-700" },
  reviewed: { label: "Đã chấm", className: "text-emerald-700" },
};

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
}

/**
 * Phiếu tổng kết tháng — render tĩnh để xuất ảnh PNG (html-to-image).
 * Chỉ dùng token màu sẵn có, không style động.
 */
export const MonthlySlipCard = forwardRef<HTMLDivElement, { slip: SlipData }>(
  function MonthlySlipCard({ slip }, ref) {
    const reviewed = slip.assignments.filter((a) => a.status === "reviewed").length;

    return (
      <div
        ref={ref}
        className="overflow-hidden rounded-2xl border bg-white text-slate-900"
      >
        <header className="bg-primary px-5 py-4 text-primary-foreground">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-foreground/70">
            TutorOps · Phiếu tổng kết
          </p>
          <h2 className="mt-1 text-lg font-bold">
            {slip.student.name} · {formatMonthLabel(new Date(`${slip.month}-01T00:00:00`))}
          </h2>
        </header>

        <section className="grid grid-cols-3 divide-x divide-border border-b bg-muted/50">
          <Summary icon={<BookOpenCheck size={15} />} label="Buổi đã học" value={`${slip.sessionCount}`} />
          <Summary icon={<Wallet size={15} />} label="Học phí" value={formatVnd(slip.due)} />
          <Summary
            icon={<CheckCircle2 size={15} />}
            label="Còn lại"
            value={formatVnd(slip.balance)}
            highlight
          />
        </section>

        <div className="space-y-4 px-5 py-4">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Buổi học trong tháng
            </h3>
            {slip.sessions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Chưa có buổi học nào.</p>
            ) : (
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
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tiến độ bài tập ({reviewed}/{slip.assignments.length} đã chấm)
            </h3>
            {slip.assignments.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Không có bài tập nào trong tháng.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {slip.assignments.map((assignment) => {
                  const status = ASSIGNMENT_STATUS[assignment.status] ?? {
                    label: assignment.status,
                    className: "text-muted-foreground",
                  };
                  return (
                    <li
                      className="flex items-start justify-between gap-3 rounded-lg bg-muted px-3 py-2 text-sm"
                      key={`${assignment.title}-${assignment.dueAt}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{assignment.title}</span>
                        {assignment.dueAt && (
                          <span className="text-xs text-muted-foreground">
                            Hạn: {formatDate(assignment.dueAt)}
                          </span>
                        )}
                      </span>
                      <span className={`shrink-0 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
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
                Học phí còn lại
              </p>
              <p className="text-xl font-bold text-primary">{formatVnd(slip.balance)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Quét mã QR để chuyển khoản, điền số tiền như trên phiếu.
              </p>
            </div>
          </section>

          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock size={12} />
            Xuất lúc {new Date(slip.generatedAt).toLocaleString("vi-VN")}
          </p>
        </div>
      </div>
    );
  },
);

function Summary({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-3 py-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <p
        className={`mt-1 truncate text-sm font-bold sm:text-base ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
