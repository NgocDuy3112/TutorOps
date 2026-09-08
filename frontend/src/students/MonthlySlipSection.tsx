import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Save } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { API } from "../lib/api";
import { MonthlySlipCard, type SlipData } from "./MonthlySlipCard";

export function MonthlySlipSection({ studentId }: { studentId: string }) {
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [slip, setSlip] = useState<SlipData | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
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
      const dataUrl = await toPng(slipRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `phieu-tong-ket-${slip.student.name}-${month}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setError("Không thể xuất ảnh phiếu. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex-row items-center justify-between gap-3 p-5 pb-0">
        <CardTitle className="text-lg">Phiếu tổng kết tháng</CardTitle>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-40" aria-label="Chọn tháng">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {recentMonthOptions(monthKey(new Date()), 12).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải phiếu...
          </div>
        ) : slip ? (
          <>
            <MonthlySlipCard ref={slipRef} slip={{ ...slip, comment }} />
            <div className="space-y-1.5">
              <Label htmlFor="slip-comment">Nhận xét của giáo viên</Label>
              <Textarea
                id="slip-comment"
                rows={3}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Nhận xét chung về tiến độ của học sinh trong tháng..."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveComment} disabled={saving} className="min-h-11">
                {saving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                Lưu nhận xét
              </Button>
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
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
