import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { formatVnd, parseVnd, recentMonthOptions } from "../lib/format";
import { API } from "../lib/api";

type PaymentDialogProps = {
  klass: { id: string; name: string } | null;
  balance: number;
  /** Month being viewed in tuition report ("YYYY-MM") — default for appliesToMonth. */
  month: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function PaymentDialog({
  klass,
  balance,
  month,
  onOpenChange,
  onSaved,
}: PaymentDialogProps) {
  const [amountVnd, setAmountVnd] = useState("");
  const [appliesToMonth, setAppliesToMonth] = useState(month);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!klass) return;
    setAmountVnd(balance > 0 ? formatVnd(balance).replace(" ₫", "") : "");
    setAppliesToMonth(month);
    setNote("");
    setError("");
  }, [klass, balance]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!klass) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API}/classes/${klass.id}/payments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amountVnd: parseVnd(amountVnd),
          appliesToMonth,
          note: note.trim() || undefined,
        }),
      });
      if (!response.ok)
        throw new Error("Không thể ghi nhận thanh toán. Vui lòng thử lại.");
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
    <>
      <Dialog open={Boolean(klass)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ghi nhận thanh toán</DialogTitle>
          <DialogDescription>
            Ghi nhận khoản đã nhận cho lớp {klass?.name}. Hệ thống cập nhật công nợ
            ngay sau khi lưu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payment-amount">Số tiền đã nhận</Label>
            <Input
              id="payment-amount"
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
            <Label htmlFor="payment-month">Áp dụng cho tháng học phí</Label>
            <Select value={appliesToMonth} onValueChange={setAppliesToMonth}>
              <SelectTrigger id="payment-month" className="w-full">
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
            <Label htmlFor="payment-note">Ghi chú</Label>
            <Textarea
              id="payment-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ví dụ: Chuyển khoản tháng 8"
            />
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <Button disabled={saving} className="min-h-12 w-full rounded-2xl">
            {saving && <Loader2 className="animate-spin" size={16} />}
            {saving ? "Đang lưu..." : "Xác nhận đã nhận tiền"}
          </Button>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
