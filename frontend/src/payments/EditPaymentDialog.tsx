import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatVnd, formatMonthLabel, parseVnd, recentMonthOptions } from "../lib/format";
import { API } from "../lib/api";

type PaymentRecord = {
  id: string;
  amountVnd: number;
  paidAt: string;
  appliesToMonth: string;
  status: string;
  note: string | null;
};

type EditPaymentDialogProps = {
  student: { id: string; name: string } | null;
  /** Viewed tuition month ("YYYY-MM") so the month dropdown centres on it. */
  month: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function EditPaymentDialog({
  student,
  month,
  onOpenChange,
  onSaved,
}: EditPaymentDialogProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [selected, setSelected] = useState<PaymentRecord | null>(null);
  const [amountVnd, setAmountVnd] = useState("");
  const [appliesToMonth, setAppliesToMonth] = useState(month);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (studentId: string) => {
    setLoading(true);
    setListError("");
    try {
      const response = await fetch(`${API}/students/${studentId}/payments`);
      if (!response.ok) throw new Error("Không thể tải khoản đã nhận.");
      const body = (await response.json()) as { payments: PaymentRecord[] };
      setPayments(body.payments);
    } catch (requestError) {
      setListError(
        requestError instanceof Error
          ? requestError.message
          : "Có lỗi xảy ra.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!student) {
      setSelected(null);
      return;
    }
    void load(student.id);
  }, [student, load]);

  function pick(record: PaymentRecord) {
    setSelected(record);
    setAmountVnd(formatVnd(record.amountVnd).replace(" ₫", ""));
    setAppliesToMonth(record.appliesToMonth);
    setNote(record.note ?? "");
    setConfirmDelete(false);
    setError("");
  }

  async function remove() {
    if (!student || !selected) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(
        `${API}/students/${student.id}/payments/${selected.id}`,
        { method: "DELETE" },
      );
      if (!response.ok)
        throw new Error("Không thể xoá khoản thu. Vui lòng thử lại.");
      setSelected(null);
      await load(student.id);
      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!student || !selected) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `${API}/students/${student.id}/payments/${selected.id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            amountVnd: parseVnd(amountVnd),
            appliesToMonth,
            note: note.trim() || undefined,
          }),
        },
      );
      if (!response.ok)
        throw new Error("Không thể cập nhật khoản thu. Vui lòng thử lại.");
      setSelected(null);
      await load(student.id);
      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(student)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Khoản đã nhận từ {student?.name}</DialogTitle>
          <DialogDescription>
            Chọn khoản để sửa tháng học phí áp dụng, số tiền hoặc ghi chú.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={16} />
            Đang tải...
          </p>
        )}
        {!loading && listError && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {listError}
          </p>
        )}
        {!loading && !listError && payments.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Chưa có khoản nào được ghi nhận.
          </p>
        )}

        {!selected && !loading && !listError && payments.length > 0 && (
          <div className="space-y-2">
            {payments.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => pick(record)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-bold">
                    {formatVnd(record.amountVnd)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMonthLabel(monthKeyToDate(record.appliesToMonth))}
                    {record.note ? ` · ${record.note}` : ""}
                  </p>
                </div>
                <Pencil size={15} className="shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {selected && (
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-payment-amount">Số tiền đã nhận</Label>
              <Input
                id="edit-payment-amount"
                required
                min="1"
                max={10_000_000_000}
                inputMode="numeric"
                value={amountVnd}
                onChange={(event) => {
                  const value = event.target.value;
                  setAmountVnd(
                    value ? formatVnd(parseVnd(value)).replace(" ₫", "") : "",
                  );
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-payment-month">
                Áp dụng cho tháng học phí
              </Label>
              <Select value={appliesToMonth} onValueChange={setAppliesToMonth}>
                <SelectTrigger id="edit-payment-month" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recentMonthOptions(month).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-payment-note">Ghi chú</Label>
              <Textarea
                id="edit-payment-note"
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ví dụ: Chuyển khoản tháng 8"
              />
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {confirmDelete ? (
              <div className="rounded-2xl bg-red-50 p-3">
                <p className="text-sm font-semibold text-red-700">
                  Xoá khoản {formatVnd(selected.amountVnd)}? Report học phí sẽ
                  tính lại ngay.
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 flex-1 rounded-2xl bg-white"
                    disabled={deleting}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Giữ lại
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="min-h-11 flex-1 rounded-2xl"
                    disabled={deleting}
                    onClick={() => void remove()}
                  >
                    {deleting && <Loader2 className="animate-spin" size={16} />}
                    {deleting ? "Đang xoá..." : "Xoá hẳn"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 w-full rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={16} />
                Xoá khoản thu
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-12 flex-1 rounded-2xl"
                onClick={() => setSelected(null)}
              >
                Quay lại
              </Button>
              <Button
                disabled={saving}
                className="min-h-12 flex-1 rounded-2xl"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function monthKeyToDate(key: string): Date {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, 1);
}
