import { useEffect, useMemo, useState } from "react";
import {
  CalendarX2,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Pencil,
  Search,
  SearchX,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { formatMonthLabel, formatVnd, monthKey } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";
import { PaymentDialog } from "../payments/PaymentDialog";
import { EditPaymentDialog } from "../payments/EditPaymentDialog";
import { AssignClassDialog } from "../payments/AssignClassDialog";
import { API } from "../lib/api";

type TuitionClass = {
  id: string | null;
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
  classes: TuitionClass[];
};
type Filter = "all" | "debt" | "paid";

export function TuitionPage() {
  const [month, setMonth] = useState(() => new Date());
  const [data, setData] = useState<TuitionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState<TuitionClass | null>(null);
  const [editing, setEditing] = useState<TuitionClass | null>(null);
  const [deleting, setDeleting] = useState<TuitionClass | null>(null);
  const [assigningLegacy, setAssigningLegacy] = useState<TuitionClass | null>(
    null,
  );
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");

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

  async function deleteMonthPayments() {
    if (!deleting?.id) return;
    setDeletingBusy(true);
    try {
      const listResponse = await fetch(
        `${API}/classes/${deleting.id}/payments`,
      );
      if (!listResponse.ok)
        throw new Error("Không thể tải khoản đã nhận.");
      const body = (await listResponse.json()) as {
        payments: { id: string; appliesToMonth: string }[];
      };
      const targetMonth = monthKey(month);
      const ids = body.payments
        .filter((record) => record.appliesToMonth === targetMonth)
        .map((record) => record.id);
      for (const id of ids) {
        const response = await fetch(
          `${API}/classes/${deleting.id}/payments/${id}`,
          { method: "DELETE" },
        );
        if (!response.ok)
          throw new Error("Không thể xoá khoản thu. Vui lòng thử lại.");
      }
      setDeleting(null);
      await load(month);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
      setDeleting(null);
    } finally {
      setDeletingBusy(false);
    }
  }

  const rows = data?.classes ?? [];
  const totals = data?.totals;
  const paidCount = rows.length - (totals?.debtCount ?? 0);

  const filterOptions = [
    { value: "all", label: "Tất cả", count: rows.length },
    { value: "debt", label: "Khoản chưa thu", count: totals?.debtCount ?? 0 },
    { value: "paid", label: "Đã đủ", count: paidCount },
  ];
  const activeFilterLabel =
    filterOptions.find((option) => option.value === filter)?.label ?? "";

  const filteredRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi");
    return rows.filter(
      (row) =>
        (filter === "all" ||
          (filter === "debt" ? row.balance > 0 : row.balance <= 0)) &&
        (!term || row.name.toLocaleLowerCase("vi").includes(term)),
    );
  }, [rows, filter, search]);

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
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
            <KpiBlock
              label="Phải thu"
              value={formatVnd(totals?.totalDue ?? 0)}
              sub={`${rows.length} lớp`}
              tone="slate"
            />
            <KpiBlock
              label="Đã thu"
              value={formatVnd(totals?.totalPaid ?? 0)}
              sub={`${paidCount} lớp`}
              tone="emerald"
            />
            <KpiBlock
              label="Khoản chưa thu"
              value={formatVnd(totals?.balance ?? 0)}
              sub={`${totals?.debtCount ?? 0} lớp`}
              tone="amber"
            />
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
              <>
                <div className="flex items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Tìm lớp"
                      aria-label="Tìm lớp"
                      className="min-h-11 rounded-2xl bg-white pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Lọc tình trạng học phí"
                    aria-expanded={filterOpen}
                    className={cn(
                      "relative min-h-11 min-w-11 shrink-0 rounded-2xl",
                      filter !== "all" &&
                        "border-primary bg-primary/10 text-primary",
                      filterOpen && "border-primary text-primary",
                    )}
                    onClick={() => setFilterOpen((open) => !open)}
                  >
                    <Filter size={17} />
                    {filter !== "all" && (
                      <span
                        aria-hidden
                        className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary"
                      />
                    )}
                  </Button>
                </div>
                {filterOpen && (
                  <>
                    {/* Click-away layer: transparent, below the panel */}
                    <div
                      aria-hidden
                      className="fixed inset-0 z-20"
                      onClick={() => setFilterOpen(false)}
                    />
                    <div
                      role="listbox"
                      aria-label="Lọc tình trạng học phí"
                      className="absolute right-4 top-44 z-30 w-36 space-y-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-200/80"
                    >
                      {filterOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={filter === option.value}
                          onClick={() => {
                            setFilter(option.value as Filter);
                            setFilterOpen(false);
                          }}
                          className={cn(
                            "flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[13px] font-semibold transition-colors",
                            filter === option.value
                              ? "bg-primary/10 text-primary"
                              : "text-slate-700 hover:bg-slate-50",
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {option.label}
                          </span>
                          {option.count != null && (
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {option.count}
                            </span>
                          )}
                          {filter === option.value && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {filter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="flex min-h-9 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-xs font-semibold text-primary"
                    aria-label="Bỏ bộ lọc"
                  >
                    {activeFilterLabel}
                    <span aria-hidden>✕</span>
                  </button>
                )}
              </>
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
                    key={row.id ?? "legacy"}
                    row={row}
                    onPay={() => setPaying(row)}
                    onEdit={() => setEditing(row)}
                    onDelete={() => setDeleting(row)}
                    onAssign={() => setAssigningLegacy(row)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <DeleteMonthPaymentsDialog
        klass={deleting}
        busy={deletingBusy}
        onOpenChange={(open) => !open && !deletingBusy && setDeleting(null)}
        onConfirm={() => void deleteMonthPayments()}
      />
      <EditPaymentDialog
        klass={editing?.id ? { id: editing.id, name: editing.name } : null}
        month={monthKey(month)}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={() => void load(month)}
      />
      <PaymentDialog
        klass={paying?.id ? { id: paying.id, name: paying.name } : null}
        balance={paying?.balance ?? 0}
        month={monthKey(month)}
        onOpenChange={(open) => !open && setPaying(null)}
        onSaved={() => {
          setPaying(null);
          void load(month);
        }}
      />
      <AssignClassDialog
        legacy={assigningLegacy}
        month={monthKey(month)}
        onOpenChange={(open) => !open && setAssigningLegacy(null)}
        onSaved={() => void load(month)}
      />
    </MobileShell>
  );
}

function DeleteMonthPaymentsDialog({
  klass,
  busy,
  onOpenChange,
  onConfirm,
}: {
  klass: TuitionClass | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(klass)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xoá khoản đã nhận?</DialogTitle>
          <DialogDescription>
            Xoá các khoản đã nhận của lớp {klass?.name} áp dụng cho tháng này. Lớp
            sẽ quay lại trạng thái Khoản chưa thu. Bạn có chắc muốn xoá?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="min-h-11 bg-red-600 hover:bg-red-700"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Trash2 size={16} />
            )}
            Xoá khoản
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KpiBlock({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "slate" | "emerald" | "amber";
}) {
  const valueColor =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-slate-950";
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-black tracking-tight sm:text-base",
          valueColor,
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function TuitionRowCard({
  row,
  onPay,
  onEdit,
  onDelete,
  onAssign,
}: {
  row: TuitionClass;
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
}) {
  // Legacy payments recorded before class-based tuition have no class —
  // shown read-only so the money stays visible but cannot be re-recorded.
  const legacy = row.id == null;
  const noActivity = !legacy && row.sessionCount === 0 && row.paid <= 0;
  const settled = !noActivity && row.balance <= 0;
  // Paid beyond due (e.g. money assigned to a class that did not teach this
  // month) — the amount is real, but "settled" alone would look confusing.
  const overpaid = !legacy && row.balance < 0;
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold ${
            legacy
              ? "bg-slate-100 text-slate-500"
              : noActivity
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
            {legacy
              ? "Khoản thu cũ trước khi quy về lớp"
              : overpaid
                ? `Đã trả thừa ${formatVnd(row.paid - row.due)}`
                : noActivity
                  ? "Chưa có buổi dạy"
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
        {legacy && (
          <Button
            type="button"
            aria-label="Gán khoản thu cũ vào lớp"
            className="min-h-10 shrink-0 rounded-2xl px-3 text-xs font-bold"
            onClick={onAssign}
          >
            Gán lớp
          </Button>
        )}
        {!legacy && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={`Sửa khoản đã nhận của lớp ${row.name}`}
              className="min-h-10 min-w-10 rounded-2xl"
              onClick={onEdit}
            >
              <Pencil size={15} />
            </Button>
            {settled ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label={`Xoá khoản đã nhận trong tháng của lớp ${row.name}`}
                className="min-h-10 min-w-10 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={onDelete}
              >
                <Trash2 size={15} />
              </Button>
            ) : (
              <Button
                type="button"
                aria-label={`Ghi nhận thanh toán cho lớp ${row.name}`}
                className="min-h-10 rounded-2xl px-3 text-xs font-bold"
                onClick={onPay}
              >
                Nhận tiền
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
