import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { BookOpenCheck, CreditCard, Loader2, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatVnd } from "../lib/format";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
type Report = {
  student: { name: string };
  sessions: { taughtAt: string; priceVnd: number; note: string | null }[];
  assignments: {
    title: string;
    dueAt: string | null;
    status: string;
    submittedAt: string | null;
    reviewNote: string | null;
    reviewedAt: string | null;
  }[];
  payments: { amountVnd: number; paidAt: string; status: string }[];
};

export function ParentReportPage() {
  const { token = "" } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/public/parents?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setReport)
      .catch(() => setError("Link không hợp lệ hoặc đã bị thu hồi."));
  }, [token]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <Card className="border-red-100 bg-red-50">
          <CardContent role="alert" className="p-5 text-sm text-red-700">
            {error}
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-sm text-muted-foreground">
        <Loader2 className="mr-2 animate-spin" size={17} />
        Đang tải báo cáo...
      </main>
    );
  }

  const totalDue = report.sessions.reduce(
    (sum, item) => sum + Number(item.priceVnd),
    0,
  );
  const totalPaid = report.payments
    .filter((item) => item.status === "confirmed")
    .reduce((sum, item) => sum + Number(item.amountVnd), 0);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
            TutorOps · Báo cáo phụ huynh
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Tiến độ của {report.student.name}
          </h1>
          <p className="mt-2 text-primary-foreground/80">
            Thông tin chỉ đọc, được cập nhật theo dữ liệu giáo viên.
          </p>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Summary
            icon={<BookOpenCheck size={18} />}
            label="Buổi đã học"
            value={`${report.sessions.length}`}
          />
          <Summary
            icon={<Wallet size={18} />}
            label="Tổng học phí"
            value={formatVnd(totalDue)}
          />
          <Summary
            icon={<CreditCard size={18} />}
            label="Còn lại"
            value={formatVnd(Math.max(totalDue - totalPaid, 0))}
          />
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ReportCard title="Bài tập">
            <div className="space-y-3">
              {report.assignments.length === 0 ? (
                <Empty />
              ) : (
                report.assignments.map((item) => (
                  <div
                    className="rounded-xl bg-muted p-4"
                    key={`${item.title}-${item.dueAt}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <strong>{item.title}</strong>
                      <span className="shrink-0 text-xs font-semibold text-emerald-700">
                        Đã chấm
                      </span>
                    </div>
                    {item.reviewedAt && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Ngày chấm: {new Date(item.reviewedAt).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                    {item.reviewNote && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nhận xét: {item.reviewNote}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </ReportCard>

          <ReportCard title="Lịch sử học phí">
            <div className="space-y-3">
              {report.payments.length === 0 ? (
                <Empty />
              ) : (
                report.payments.map((item) => (
                  <div
                    className="flex justify-between rounded-xl bg-muted p-4 text-sm"
                    key={`${item.paidAt}-${item.amountVnd}`}
                  >
                    <span>
                      {new Date(item.paidAt).toLocaleDateString("vi-VN")}
                    </span>
                    <strong>{formatVnd(item.amountVnd)}</strong>
                  </div>
                ))
              )}
            </div>
          </ReportCard>
        </div>

        <ReportCard title="Buổi học gần đây" className="mt-4">
          <div className="space-y-3">
            {report.sessions.length === 0 ? (
              <Empty />
            ) : (
              report.sessions.slice(0, 10).map((item) => (
                <div
                  className="flex justify-between gap-4 border-b pb-3 text-sm last:border-0"
                  key={`${item.taughtAt}-${item.priceVnd}`}
                >
                  <div>
                    <strong>
                      {new Date(item.taughtAt).toLocaleDateString("vi-VN")}
                    </strong>
                    {item.note && (
                      <p className="text-muted-foreground">{item.note}</p>
                    )}
                  </div>
                  <span>{formatVnd(item.priceVnd)}</span>
                </div>
              ))
            )}
          </div>
        </ReportCard>
      </div>
    </main>
  );
}

function Summary({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <span className="mb-3 grid size-8 place-items-center rounded-lg bg-indigo-50 text-primary">
          {icon}
        </span>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ReportCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="p-5 pb-0">
        <h2 className="text-lg font-bold">{title}</h2>
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
}
