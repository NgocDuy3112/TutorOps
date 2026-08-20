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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatVnd, parseVnd } from "../lib/format";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type PaymentDialogProps = {
  student: { id: string; name: string } | null;
  balance: number;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function PaymentDialog({
  student,
  balance,
  onOpenChange,
  onSaved,
}: PaymentDialogProps) {
  const [amountVnd, setAmountVnd] = useState("");
  const [paidAt, setPaidAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!student) return;
    setAmountVnd(balance > 0 ? formatVnd(balance).replace(" ₫", "") : "");
    setPaidAt(new Date().toISOString().slice(0, 10));
    setNote("");
    setOcrText("");
    setOcrError("");
    setError("");
  }, [student, balance]);

  async function readReceipt(file: File) {
    setOcrLoading(true);
    setOcrError("");
    setOcrText("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API}/ocr/receipt`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) throw new Error("Không thể đọc biên lai.");
      const result = await response.json() as { text: string };
      setOcrText(result.text);
    } catch (requestError) {
      setOcrError(requestError instanceof Error ? requestError.message : "Không thể đọc biên lai.");
    } finally {
      setOcrLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!student) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API}/students/${student.id}/payments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amountVnd: parseVnd(amountVnd),
          paidAt: new Date(`${paidAt}T12:00:00`).toISOString(),
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
    <Dialog open={Boolean(student)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ghi nhận thanh toán</DialogTitle>
          <DialogDescription>
            Ghi nhận khoản đã nhận từ {student?.name}. Hệ thống cập nhật công nợ
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
            <Label htmlFor="payment-date">Ngày nhận</Label>
            <Input
              id="payment-date"
              required
              type="date"
              value={paidAt}
              onChange={(event) => setPaidAt(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receipt-image">Upload biên lai chuyển khoản</Label>
            <Input
              id="receipt-image"
              type="file"
              accept="image/jpeg,image/png,image/heic"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void readReceipt(file);
              }}
            />
            {ocrLoading && <p className="text-sm text-muted-foreground">Đang đọc biên lai...</p>}
            {ocrError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{ocrError}</p>}
            {ocrText && <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-700">{ocrText}</pre>}
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
  );
}
