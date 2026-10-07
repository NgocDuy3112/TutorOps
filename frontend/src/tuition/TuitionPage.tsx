import { useEffect, useMemo, useState } from "react";
import {
  Book,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Pencil,
  Search,
  SearchX,
  Trash2,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
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
      if (ids.length > 0) {
        toast.success(
          `Đã xoá ${ids.length} khoản đã nhận tháng ${targetMonth}`,
        );
      } else {
        toast("Không có khoản nào trong tháng để xoá");
      }
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
      <main className="mx-auto max-w-4xl px-4 py-5 sm:py-6 lg:max-w-6xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 lg:grid lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:items-center lg:gap-6">
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
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-6">
            <KpiBlock
              label="Khoản cần thu"
              value={formatVnd(totals?.totalDue ?? 0)}
              sub={`${rows.length} lớp`}
              tone="slate"
            />
            <KpiBlock
              label="Khoản đã thu"
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
          <Alert className="mt-4" variant="destructive">
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 bg-white"
                onClick={() => void load(month)}
              >
                Tải lại
              </Button>
            </AlertDescription>
          </Alert>
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
                  <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Lọc tình trạng học phí"
                        className={cn(
                          "relative min-h-11 min-w-11 shrink-0 rounded-2xl",
                          filter !== "all" &&
                            "border-primary bg-primary/10 text-primary",
                          filterOpen && "border-primary text-primary",
                        )}
                      >
                        <Filter size={17} />
                        {filter !== "all" && (
                          <span
                            aria-hidden
                            className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary"
                          />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuRadioGroup
                        value={filter}
                        onValueChange={(value) => setFilter(value as Filter)}
                      >
                        {filterOptions.map((option) => (
                          <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {option.label}
                            </span>
                            {option.count != null && (
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {option.count}
                              </span>
                            )}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {filter !== "all" && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFilter("all")}
                    className="flex min-h-9 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-xs font-semibold text-primary"
                    aria-label="Bỏ bộ lọc"
                  >
                    {activeFilterLabel}
                    <X aria-hidden size={14} />
                  </Button>
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
        onSaved={(className) => {
          toast.success(`Đã gán khoản thu vào lớp ${className}`);
          void load(month);
        }}
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
    <AlertDialog open={Boolean(klass)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá khoản đã nhận?</AlertDialogTitle>
          <AlertDialogDescription>
            Xoá các khoản đã nhận của lớp {klass?.name} áp dụng cho tháng này. Lớp
            sẽ quay lại trạng thái Khoản chưa thu. Bạn có chắc muốn xoá?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
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
            variant="destructive"
            className="min-h-11"
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
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
  const legacy = row.id == null;
  const noActivity = !legacy && row.sessionCount === 0 && row.paid <= 0;
  const settled = !noActivity && row.balance <= 0;
  const amount = noActivity ? "—" : formatVnd(settled ? row.paid : row.balance);
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full ${
            legacy || noActivity
              ? "bg-slate-100 text-slate-500"
              : settled
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
          }`}
          aria-hidden
        >
          <Book size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-base font-black ${
              noActivity
                ? "text-muted-foreground"
                : settled
                  ? "text-emerald-700"
                  : "text-amber-700"
            }`}
          >
            {amount}
          </p>
          <p className="truncate text-sm font-semibold text-slate-700">
            {row.name}
          </p>
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
