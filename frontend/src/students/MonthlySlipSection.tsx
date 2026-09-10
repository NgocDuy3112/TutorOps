import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Save } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { monthKey, recentMonthOptions } from "../lib/format";
import { Toast } from "../components/Toast";
import { API } from "../lib/api";
import { MonthlySlipCard, type SlipData } from "./MonthlySlipCard";

export function MonthlySlipSection({ studentId }: { studentId: string }) {
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [slip, setSlip] = useState<SlipData | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState("");
  const slipRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API}/students/${studentId}/slip?month=${month}`,
      );
      if (!response.ok) throw new Error("Không thể tải phiếu tổng kết.");
      const data: SlipData = await response.json();
      setSlip(data);
      setComment(data.comment);
    } catch (requestError) {
      setSlip(null);
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setLoading(false);
    }
  }, [studentId, month]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveComment() {
    setSaving(true);
    try {
      const response = await fetch(
        `${API}/students/${studentId}/monthly-notes`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ month, comment }),
        },
      );
      if (!response.ok) throw new Error("Không thể lưu nhận xét.");
      await load();
      setToast("Đã lưu nhận xét");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function exportPng() {
    if (!slipRef.current || !slip) return;
    setExporting(true);
    try {
      // The QR is an auth-protected cross-origin image: <img> renders it fine
      // but html-to-image re-fetches it without credentials and fails. Inline
      // it as a data URL first, restore the original src afterwards.
      const qr = slipRef.current.querySelector<HTMLImageElement>(
        "img[alt='Mã QR chuyển khoản']",
      );
      let originalSrc: string | null = null;
      if (qr && !qr.src.startsWith("data:")) {
        const response = await fetch(qr.src, { credentials: "include" });
        if (!response.ok) throw new Error("Không thể tải mã QR.");
        originalSrc = qr.src;
        const blob = await response.blob();
        qr.src = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Không thể đọc mã QR."));
          reader.readAsDataURL(blob);
        });
      }
      try {
        const dataUrl = await toPng(slipRef.current, {
          pixelRatio: 2,
          // Interactive controls (month filter, comment editor) live inside
          // the card but must not appear in the exported image.
          filter: (node) =>
            !(node instanceof HTMLElement && node.dataset.noexport === "true"),
          // Let the library inline any remaining resources with the session
          // cookie instead of an anonymous fetch.
          fetchRequestInit: { credentials: "include" },
        });
        const link = document.createElement("a");
        link.download = `phieu-tong-ket-${slip.student.name}-${month}.png`;
        link.href = dataUrl;
        link.click();
        setToast("Đã tải ảnh phiếu tổng kết");
      } finally {
        if (qr && originalSrc) qr.src = originalSrc;
      }
    } catch {
      setError("Không thể xuất ảnh phiếu. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải phiếu...
          </div>
        ) : slip ? (
          <>
            <MonthlySlipCard
              ref={slipRef}
              slip={{ ...slip, comment }}
              headerAction={
                <div data-noexport className="shrink-0">
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger
                      className="min-h-10 w-fit gap-1 rounded-xl border-primary-foreground/30 bg-white/15 px-3 py-1.5 text-sm text-primary-foreground hover:bg-white/25 [&>span]:whitespace-nowrap"
                      aria-label="Chọn tháng"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {recentMonthOptions(monthKey(new Date()), 12).map(
                        (option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              }
              footer={
                <div
                  data-noexport
                  className="space-y-1.5 border-t bg-slate-50/60 px-5 py-4"
                >
                  <Label htmlFor="slip-comment">Nhận xét của giáo viên</Label>
                  <Textarea
                    id="slip-comment"
                    rows={3}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Nhận xét chung về tiến độ của học sinh trong tháng..."
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={exportPng}
                      disabled={exporting}
                      className="min-h-11"
                    >
                      {exporting ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Download size={16} />
                      )}
                      Tải ảnh phiếu
                    </Button>
                    <Button
                      onClick={saveComment}
                      disabled={saving}
                      className="min-h-11"
                    >
                      {saving ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Save size={16} />
                      )}
                      Lưu nhận xét
                    </Button>
                  </div>
                </div>
              }
            />
          </>
        ) : null}
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </section>
  );
}
