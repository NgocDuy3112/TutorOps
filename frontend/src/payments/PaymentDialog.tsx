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
import { cropReceiptImage, compressReceiptImage } from "../lib/image";
import { ReceiptCropDialog } from "./ReceiptCropDialog";
import type { Area } from "react-easy-crop";
import { API } from "../lib/api";

type PaymentDialogProps = {
  student: { id: string; name: string } | null;
  balance: number;
  /** Month being viewed in tuition report ("YYYY-MM") — default for appliesToMonth. */
  month: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function PaymentDialog({
  student,
  balance,
  month,
  onOpenChange,
  onSaved,
}: PaymentDialogProps) {
  const [amountVnd, setAmountVnd] = useState("");
  const [appliesToMonth, setAppliesToMonth] = useState(month);
  const [note, setNote] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [cropSource, setCropSource] = useState<{ file: File; url: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!student) return;
    setAmountVnd(balance > 0 ? formatVnd(balance).replace(" ₫", "") : "");
    setAppliesToMonth(month);
    setNote("");
    setOcrError("");
    setCropSource((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    setError("");
  }, [student, balance]);

  async function readReceipt(file: File) {
    setOcrLoading(true);
    setOcrError("");
    setOcrSuccess(false);
    try {
      const compressedFile = await compressReceiptImage(file);
      const formData = new FormData();
      formData.append("file", compressedFile);
      const response = await fetch(`${API}/ocr/receipt`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Không thể đọc biên lai.");
      const parsed = await response.json() as {
        amountVnd: number | null;
        paidAt: string | null;
        note: string | null;
      };
      if (parsed.amountVnd != null) setAmountVnd(formatVnd(parsed.amountVnd).replace(" ₫", ""));
      if (parsed.note) setNote(parsed.note);
      setOcrSuccess(true);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === "image_too_large") {
        setCropSource({ file, url: URL.createObjectURL(file) });
      } else {
        setOcrError(requestError instanceof Error ? requestError.message : "Không thể đọc biên lai.");
        setOcrSuccess(false);
      }
    } finally {
      setOcrLoading(false);
    }
  }

  async function handleCropped(area: Area) {
    if (!cropSource) return;
    const file = cropSource.file;
    URL.revokeObjectURL(cropSource.url);
    setCropSource(null);
    await readReceipt(await cropReceiptImage(file, area));
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
      <Dialog open={Boolean(student)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
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
            {ocrLoading && <p className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-700">Đang tối ưu ảnh và đọc biên lai...</p>}
            {ocrSuccess && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Đã điền dữ liệu từ biên lai. Vui lòng kiểm tra trước khi xác nhận.</p>}
            {ocrError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{ocrError}</p>}
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <Button disabled={saving || ocrLoading} className="min-h-12 w-full rounded-2xl">
            {saving && <Loader2 className="animate-spin" size={16} />}
            {saving ? "Đang lưu..." : "Xác nhận đã nhận tiền"}
          </Button>
        </form>
      </DialogContent>
      </Dialog>
      <ReceiptCropDialog
        imageUrl={cropSource?.url ?? null}
        onOpenChange={(open) => {
          if (!open && cropSource) {
            URL.revokeObjectURL(cropSource.url);
            setCropSource(null);
          }
        }}
        onCropped={(area) => void handleCropped(area)}
      />
    </>
  );
}
