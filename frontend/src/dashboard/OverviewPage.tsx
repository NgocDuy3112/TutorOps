import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Loader2,
  UserRound,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { formatVnd } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";
import { API } from "../lib/api";

type TodaySession = {
  id: string;
  studentId: string;
  studentName: string;
  taughtAt: string;
  endsAt: string | null;
  priceVnd: number;
};

type Deadline = {
  id: string;
  title: string;
  dueAt: string;
  studentCount: number;
};

type Debtor = { id: string; name: string; balance: number };

type Overview = {
  classCount: number;
  sessionsThisMonth: number;
  sessionsLastMonth: number;
  paidThisMonth: number;
  paidLastMonth: number;
  outstanding: number;
  debtCount: number;
  todaySessions: TodaySession[];
  upcomingDeadlines: Deadline[];
  topDebtors: Debtor[];
};

export function OverviewPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/dashboard/overview`);
      if (!response.ok) {
        // Surface the server's error message (e.g. SQL/code errors from the
        // exception filter) so failures are diagnosable from the UI.
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(body?.message || "Không thể tải tổng quan.");
      }
      setData(await response.json());
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <MobileShell>
      <PageHeader title="Tổng quan" action={<UserAvatar />} />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:py-6">
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải...
          </p>
        )}
        {!loading && error && (
          <Card className="border-red-100 bg-red-50">
            <CardContent
              role="alert"
              className="flex flex-col gap-3 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>{error}</span>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 bg-white"
                onClick={() => void load()}
              >
                Tải lại
              </Button>
            </CardContent>
          </Card>
        )}
        {!loading && !error && data && (
          <>
            <section
              aria-label="Chỉ số tháng này"
              className="grid grid-cols-2 gap-3"
            >
              <KpiCard
                icon={<BookOpen size={16} />}
                label="Lớp đang dạy"
                value={String(data.classCount)}
                to="/classes"
              />
              <KpiCard
                icon={<CalendarCheck size={16} />}
                label="Buổi dạy tháng này"
                value={String(data.sessionsThisMonth)}
                delta={delta(data.sessionsThisMonth, data.sessionsLastMonth)}
                to="/schedule"
              />
              <KpiCard
                icon={<Wallet size={16} />}
                label="Đã thu tháng này"
                value={formatVnd(data.paidThisMonth)}
                delta={delta(data.paidThisMonth, data.paidLastMonth)}
                to="/tuition"
              />
              <KpiCard
                icon={<UserRound size={16} />}
                label="Còn nợ"
                value={formatVnd(data.outstanding)}
                sub={`${data.debtCount} học sinh`}
                to="/tuition"
              />
            </section>

            <OverviewSection title="Hôm nay" icon={<CalendarCheck size={18} />}>
              {data.todaySessions.length === 0 ? (
                <p className="rounded-2xl bg-white p-4 text-sm text-muted-foreground">
                  Không có buổi dạy nào hôm nay.
                </p>
              ) : (
                data.todaySessions.map((session) => (
                  <Link
                    key={session.id}
                    to={`/students/${session.studentId}`}
                    className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm shadow-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <span className="w-14 shrink-0 text-sm font-black text-primary">
                      {formatTime(session.taughtAt)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {session.studentName}
                    </span>
                    <ArrowRight size={15} className="shrink-0 text-muted-foreground" />
                  </Link>
                ))
              )}
            </OverviewSection>

            <OverviewSection title="Sắp đến hạn" icon={<ClipboardList size={18} />}>
              {data.upcomingDeadlines.length === 0 ? (
                <p className="rounded-2xl bg-white p-4 text-sm text-muted-foreground">
                  Không có bài tập nào đến hạn trong 3 ngày tới.
                </p>
              ) : (
                data.upcomingDeadlines.map((deadline) => (
                  <Link
                    key={deadline.id}
                    to={`/assignments/${deadline.id}/submissions`}
                    className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm shadow-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {deadline.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {deadline.studentCount} học sinh
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-xs font-bold ${deadlineTextColor(deadline.dueAt)}`}
                    >
                      {formatDeadlineShort(deadline.dueAt)}
                    </span>
                  </Link>
                ))
              )}
            </OverviewSection>

            <OverviewSection title="Nợ phí nhiều nhất" icon={<Wallet size={18} />}>
              {data.topDebtors.length === 0 ? (
                <p className="rounded-2xl bg-white p-4 text-sm text-muted-foreground">
                  Học sinh đều đã thanh toán tháng này.
                </p>
              ) : (
                <>
                  {data.topDebtors.map((debtor) => (
                    <Link
                      key={debtor.id}
                      to="/tuition"
                      className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm shadow-slate-100 transition-colors hover:bg-slate-50"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-50 text-xs font-bold text-amber-700">
                        {debtor.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {debtor.name}
                      </span>
                      <span className="shrink-0 text-sm font-black text-amber-700">
                        {formatVnd(debtor.balance)}
                      </span>
                    </Link>
                  ))}
                  <Button
                    asChild
                    variant="outline"
                    className="min-h-11 w-full rounded-2xl"
                  >
                    <Link to="/tuition">Xem học phí</Link>
                  </Button>
                </>
              )}
            </OverviewSection>
          </>
        )}
      </main>
    </MobileShell>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  delta,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  to: string;
}) {
  return (
    <Link to={to} className="block">
      <Card className="h-full rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70 transition-colors hover:border-primary/40">
        <CardContent className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span className="text-primary">{icon}</span>
            {label}
          </p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black tracking-tight text-slate-950">
              {value}
            </span>
            {delta != null && <DeltaBadge delta={delta} />}
          </p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-bold ${
        up ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {up ? (
        <ArrowUpRight size={13} aria-hidden />
      ) : (
        <ArrowDownRight size={13} aria-hidden />
      )}
      {Math.abs(delta)}%
    </span>
  );
}

function OverviewSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-bold text-slate-800">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function delta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function formatTime(value: string): string {
  return new Date(value).toTimeString().slice(0, 5);
}

function formatDeadlineShort(value: string): string {
  const due = new Date(value);
  const days = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "Hôm nay";
  return `Còn ${days} ngày`;
}

function deadlineTextColor(dueAt: string): string {
  const due = new Date(dueAt).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (due - Date.now() < oneDay) return "text-red-600";
  if (due - Date.now() < 3 * oneDay) return "text-amber-600";
  return "text-muted-foreground";
}
