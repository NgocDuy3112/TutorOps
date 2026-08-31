import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Plus, Search, Wallet, Receipt, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { formatVnd } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";
import { PaymentDialog } from "../payments/PaymentDialog";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type Student = { id: string; name: string };
type PaymentSummary = {
  totalDue: number;
  totalPaid: number;
  balance: number;
  sessionCount: number;
};
type TuitionRow = { student: Student; summary: PaymentSummary };
type Filter = "all" | "debt" | "paid";

export function TuitionPage() {
  const [rows, setRows] = useState<TuitionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState<TuitionRow | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const studentsResponse = await fetch(`${API}/students`, {
        credentials: "include",
      });
      if (!studentsResponse.ok) throw new Error("Không thể tải học phí.");
      const students: Student[] = await studentsResponse.json();
      const summaries = await Promise.all(
        students.map(async (student) => {
          const response = await fetch(
            `${API}/students/${student.id}/payments`,
            { credentials: "include" },
          );
          if (!response.ok) throw new Error("Không thể tải công nợ.");
          return {
            student,
            summary: (await response.json()) as PaymentSummary,
          };
        }),
      );
      setRows(
        summaries.sort(
          (left, right) => right.summary.balance - left.summary.balance,
        ),
      );
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

  const totalDue = rows.reduce(
    (sum, row) => sum + Number(row.summary.totalDue),
    0,
  );
  const totalPaid = rows.reduce(
    (sum, row) => sum + Number(row.summary.totalPaid),
    0,
  );
  const balance = totalDue - totalPaid;
  const debtCount = rows.filter((row) => row.summary.balance > 0).length;
  const paidCount = rows.filter((row) => row.summary.balance <= 0).length;

  const filteredRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi");
    return rows.filter((row) => {
      const matchesSearch =
        !term || row.student.name.toLocaleLowerCase("vi").includes(term);
      const matchesFilter =
        filter === "all" ||
        (filter === "debt"
          ? row.summary.balance > 0
          : row.summary.balance <= 0);
      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filter]);

  return (
    <MobileShell>
      <PageHeader title="Học phí" action={<UserAvatar />} />
      <main className="mx-auto max-w-6xl px-4 py-5 sm:py-6">
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải học phí...
          </p>
        )}
        {error && (
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
        {!loading && !error && (
          <div className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Còn cần thu</p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                    {formatVnd(balance)}
                  </p>
                </div>
                <span className="grid size-11 place-items-center rounded-2xl bg-violet-50 text-primary">
                  <Wallet size={21} />
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Metric label="Tổng cần thu" value={formatVnd(totalDue)} />
                <Metric label="Tổng đã thu" value={formatVnd(totalPaid)} />
              </div>
            </section>

            <section className="space-y-3">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={17}
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="bg-white pl-10"
                  placeholder="Tìm học sinh"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <FilterButton
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                  label="Tất cả"
                  count={rows.length}
                />
                <FilterButton
                  active={filter === "debt"}
                  onClick={() => setFilter("debt")}
                  label="Còn nợ"
                  count={debtCount}
                />
                <FilterButton
                  active={filter === "paid"}
                  onClick={() => setFilter("paid")}
                  label="Đã đủ"
                  count={paidCount}
                />
              </div>
            </section>

            {rows.length === 0 ? (
              <EmptyState
                icon={<Receipt size={28} />}
                title="Chưa có học phí"
                description="Thêm học sinh và ghi nhận buổi dạy để hệ thống tự tính học phí. Bạn có thể ghi nhận thanh toán khi nhận tiền từ phụ huynh."
              />
            ) : filteredRows.length === 0 ? (
              <EmptyState
                icon={<SearchX size={28} />}
                title="Không tìm thấy"
                description="Thử thay đổi từ khóa tìm hoặc bộ lọc để xem kết quả khác."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRows.map((row) => (
                  <TuitionCard
                    key={row.student.id}
                    row={row}
                    onPay={() => setPaying(row)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <PaymentDialog
        student={paying?.student ?? null}
        balance={paying?.summary.balance ?? 0}
        onOpenChange={(open) => !open && setPaying(null)}
        onSaved={() => {
          setPaying(null);
          void load();
        }}
      />
    </MobileShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-bold">{value}</p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-2xl border px-3 text-sm font-semibold transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "bg-white text-slate-700"}`}
    >
      {label}{" "}
      <span
        className={
          active ? "text-primary-foreground/75" : "text-muted-foreground"
        }
      >
        {count}
      </span>
    </button>
  );
}

function TuitionCard({ row, onPay }: { row: TuitionRow; onPay: () => void }) {
  const paidEnough = row.summary.balance <= 0;
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span
            className={`grid size-11 shrink-0 place-items-center rounded-2xl ${paidEnough ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
          >
            {paidEnough ? <CheckCircle2 size={21} /> : <Wallet size={21} />}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-bold">{row.student.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.summary.sessionCount} buổi dạy
            </p>
            <p
              className={`mt-3 text-xl font-black ${paidEnough ? "text-emerald-700" : "text-amber-700"}`}
            >
              {formatVnd(
                paidEnough ? row.summary.totalPaid : row.summary.balance,
              )}
            </p>
            <p
              className={`text-xs font-semibold ${paidEnough ? "text-emerald-700" : "text-muted-foreground"}`}
            >
              {paidEnough ? "Đã thu" : "Còn cần thu"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="mt-4 min-h-11 w-full rounded-2xl"
          onClick={onPay}
        >
          <Plus size={16} />
          Ghi nhận thanh toán
        </Button>
      </CardContent>
    </Card>
  );
}
