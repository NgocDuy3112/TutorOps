import { useEffect, useMemo, useState } from "react";
import {
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { formatMonthLabel, formatVnd, monthKey } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";
import { PaymentDialog } from "../payments/PaymentDialog";
import { API } from "../lib/api";

type TuitionStudent = {
  id: string;
  name: string;
  due: number;
  paid: number;
  balance: number;
  sessionCount: number;
};
type TuitionTotals = {
  totalDue: number;
  totalPaid: number;
  balance: number;
  debtCount: number;
  sessionCount: number;
};
type TuitionResponse = {
  month: string;
  totals: TuitionTotals;
  students: TuitionStudent[];
};
type Filter = "all" | "debt" | "paid";

export function TuitionPage() {
  const [month, setMonth] = useState(() => new Date());
  const [data, setData] = useState<TuitionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState<TuitionStudent | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  async function load(target: Date) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API}/tuition?month=${monthKey(target)}`,
      );
      if (!response.ok) throw new Error("Không thể tải học phí.");
      setData((await response.json()) as TuitionResponse);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(month);
  }, [month]);

  function shiftMonth(deltaMonths: number) {
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + deltaMonths, 1),
    );
  }

  const rows = data?.students ?? [];
  const totals = data?.totals;
  const paidCount = rows.length - (totals?.debtCount ?? 0);

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      filter === "all" ||
      (filter === "debt" ? row.balance > 0 : row.balance <= 0),
    );
  }, [rows, filter]);

  return (
    <MobileShell>
      <PageHeader title="Học phí" action={<UserAvatar />} />
      <main className="mx-auto max-w-4xl px-4 py-5 sm:py-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Tháng trước"
              className="size-11 shrink-0 rounded-2xl"
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeft size={18} />
            </Button>
            <p className="text-lg font-black tracking-tight text-slate-950">
              {formatMonthLabel(month)}
            </p>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Tháng sau"
              className="size-11 shrink-0 rounded-2xl"
              onClick={() => shiftMonth(1)}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Tổng tiền
            </p>
            <p className="text-xl font-black tracking-tight text-slate-950">
              {formatVnd(totals?.totalDue ?? 0)}
            </p>
          </div>
        </section>

        {loading && (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải học phí...
          </p>
        )}
        {!loading && error && (
          <Card className="mt-4 border-red-100 bg-red-50">
            <CardContent
              role="alert"
              className="flex flex-col gap-3 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>{error}</span>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 bg-white"
                onClick={() => void load(month)}
              >
                Tải lại
              </Button>
            </CardContent>
          </Card>
        )}
        {!loading && !error && data && (
          <div className="mt-4 space-y-4">
            {rows.length > 0 && (
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
                  count={totals?.debtCount ?? 0}
                />
                <FilterButton
                  active={filter === "paid"}
                  onClick={() => setFilter("paid")}
                  label="Đã đủ"
                  count={paidCount}
                />
              </div>
            )}

            {rows.length === 0 ? (
              <EmptyState
                icon={<CalendarX2 size={28} />}
                title="Tháng này chưa có buổi dạy nào"
                description="Ghi nhận buổi dạy trong tháng để hệ thống tự tính học phí. Bạn có thể ghi nhận thanh toán khi nhận tiền từ phụ huynh."
              />
            ) : filteredRows.length === 0 ? (
              <EmptyState
                icon={<SearchX size={28} />}
                title="Không tìm thấy"
                description="Thử thay đổi từ khóa tìm hoặc bộ lọc để xem kết quả khác."
              />
            ) : (
              <div className="space-y-2">
                {filteredRows.map((row) => (
                  <TuitionRowCard
                    key={row.id}
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
        student={paying ? { id: paying.id, name: paying.name } : null}
        balance={paying?.balance ?? 0}
        onOpenChange={(open) => !open && setPaying(null)}
        onSaved={() => {
          setPaying(null);
          void load(month);
        }}
      />
    </MobileShell>
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

function TuitionRowCard({
  row,
  onPay,
}: {
  row: TuitionStudent;
  onPay: () => void;
}) {
  const noActivity = row.sessionCount === 0 && row.paid <= 0;
  const settled = !noActivity && row.balance <= 0;
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold ${
            noActivity
              ? "bg-slate-100 text-slate-500"
              : settled
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
          }`}
          aria-hidden
        >
          {row.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold">{row.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {noActivity
              ? "Chưa có buổi dạy trong tháng"
              : `Đã dạy ${row.sessionCount} buổi`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {noActivity ? (
            <p className="text-sm font-semibold text-muted-foreground">—</p>
          ) : (
            <p
              className={`text-base font-black ${settled ? "text-emerald-700" : "text-amber-700"}`}
            >
              {formatVnd(settled ? row.paid : row.balance)}
            </p>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          className="min-h-11 shrink-0 rounded-2xl px-4"
          onClick={onPay}
        >
          Thu
        </Button>
      </CardContent>
    </Card>
  );
}
