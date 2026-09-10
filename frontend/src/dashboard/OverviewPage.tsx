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
                label="Lớp"
                value={String(data.classCount)}
                to="/classes"
              />
              <KpiCard
                icon={<CalendarCheck size={16} />}
                label="Buổi dạy"
                value={String(data.sessionsThisMonth)}
                delta={delta(data.sessionsThisMonth, data.sessionsLastMonth)}
                to="/schedule"
              />
              <KpiCard
                icon={<Wallet size={16} />}
                label="Khoản đã thu"
                value={formatVnd(data.paidThisMonth)}
                delta={delta(data.paidThisMonth, data.paidLastMonth)}
                to="/tuition"
              />
              <KpiCard
                icon={<UserRound size={16} />}
                label="Khoản chưa thu"
                value={formatVnd(data.outstanding)}
                sub={`${data.debtCount} học sinh`}
                to="/tuition"
              />
            </section>

            <OverviewSection
              title="Hôm nay"
              icon={<CalendarCheck size={18} className="text-primary" />}
              count={data.todaySessions.length}
              countLabel="buổi"
            >
              {data.todaySessions.length === 0 ? (
                <SectionEmpty
                  icon={<CalendarCheck size={20} />}
                  text="Không có buổi dạy nào hôm nay"
                />
              ) : (
                data.todaySessions.map((session) => (
                  <Link
                    key={session.id}
                    to={`/students/${session.studentId}`}
                    className="flex min-h-12 items-center gap-3 rounded-xl px-2 transition-colors hover:bg-slate-50"
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

            <OverviewSection
              title="Sắp đến hạn"
              icon={<ClipboardList size={18} className="text-primary" />}
              count={data.upcomingDeadlines.length}
              countLabel="bài tập"
            >
              {data.upcomingDeadlines.length === 0 ? (
                <SectionEmpty
                  icon={<ClipboardList size={20} />}
                  text="Không có bài tập đến hạn trong 3 ngày tới"
                />
              ) : (
                data.upcomingDeadlines.map((deadline) => (
                  <Link
                    key={deadline.id}
                    to={`/assignments/${deadline.id}/submissions`}
                    className="flex min-h-12 items-center gap-3 rounded-xl px-2 transition-colors hover:bg-slate-50"
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
      <Card className="h-full rounded-3xl border-slate-200 bg-white shadow-sm shadow-slate-200/70 transition-colors hover:border-primary/40">
        <CardContent className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </span>
            {label}
          </p>
          <p className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-slate-950">
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

function SectionEmpty({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-white/60 px-6 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-400">
        {icon}
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
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
  count,
  countLabel,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  countLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
      <CardHeader className="flex-row items-center justify-between border-b border-slate-100 p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {count} {countLabel}
        </span>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-1">{children}</div>
      </CardContent>
    </Card>
  );
}

function delta(current: number, previous: number): number | null {
  // Hide deltas that carry no signal: both months empty, or nothing to
  // compare against (previous = 0 would show a misleading ±100%).
  if (previous <= 0 || (current === 0 && previous === 0)) return null;
  if (current === 0) return -100;
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
