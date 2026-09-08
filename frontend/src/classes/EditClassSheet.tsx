import { FormEvent, useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatVnd, parseVnd } from "../lib/format";
import { API } from "../lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScheduleEditor, type ScheduleSlot } from "./ScheduleEditor";
import { VENUE_OPTIONS } from "./venue";

const PRICING_MODE_OPTIONS = [
  { value: "per_session", label: "Theo buổi", priceLabel: "Giá mỗi buổi" },
  { value: "per_hour", label: "Theo giờ", priceLabel: "Giá mỗi giờ" },
  { value: "per_month", label: "Theo tháng", priceLabel: "Phí cố định / tháng" },
] as const;

type PricingMode = (typeof PRICING_MODE_OPTIONS)[number]["value"];

type Student = { id: string; name: string; parentPhone: string | null };
type TutorClass = {
  id: string;
  name: string;
  defaultPriceVnd: number | null;
  pricingMode?: PricingMode;
  autoSchedule?: boolean;
  schedules?: ScheduleSlot[];
  venue?: string | null;
  note: string | null;
  students: Student[];
};

export function EditClassSheet({
  classItem,
  onClose,
  onSaved,
  onDeleted,
}: {
  classItem: TutorClass;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState(classItem.name);
  const [defaultPriceVnd, setDefaultPriceVnd] = useState(
    classItem.defaultPriceVnd == null ? "" : String(classItem.defaultPriceVnd),
  );
  const [note, setNote] = useState(classItem.note ?? "");
  const [pricingMode, setPricingMode] = useState<PricingMode>(
    classItem.pricingMode ?? "per_session",
  );
  const [autoSchedule, setAutoSchedule] = useState(
    classItem.autoSchedule ?? false,
  );
  const [schedules, setSchedules] = useState<ScheduleSlot[]>(
    classItem.schedules ?? [],
  );
  const [venue, setVenue] = useState(classItem.venue ?? "");

  useEffect(() => {
    setName(classItem.name);
    setDefaultPriceVnd(
      classItem.defaultPriceVnd == null ? "" : String(classItem.defaultPriceVnd),
    );
    setNote(classItem.note ?? "");
    setPricingMode(classItem.pricingMode ?? "per_session");
    setAutoSchedule(classItem.autoSchedule ?? false);
    setSchedules(classItem.schedules ?? []);
    setVenue(classItem.venue ?? "");
  }, [classItem]);

  async function submitInfo(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("Nhập tên lớp.");
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API}/classes/${classItem.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          defaultPriceVnd: defaultPriceVnd ? parseVnd(defaultPriceVnd) : null,
          pricingMode,
          autoSchedule: schedules.length > 0 ? autoSchedule : false,
          schedules,
          venue: venue || null,
          note: note || null,
        }),
      });
      if (!response.ok) throw new Error("Không thể lưu lớp.");
      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`${API}/classes/${classItem.id}`, {
        method: "DELETE",
      });
      if (!response.ok)
        throw new Error("Không thể xóa lớp. Vui lòng thử lại.");
      onDeleted();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sửa lớp</SheetTitle>
        </SheetHeader>

        <div className="flex h-full flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto pb-4">
            <form id="edit-class-info-form" onSubmit={submitInfo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sheet-class-name">Tên lớp</Label>
                <Input
                  id="sheet-class-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus={false}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sheet-class-pricing">Cách tính học phí</Label>
                <Select
                  value={pricingMode}
                  onValueChange={(value) => setPricingMode(value as PricingMode)}
                >
                  <SelectTrigger id="sheet-class-pricing" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_MODE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sheet-class-price">
                  {
                    PRICING_MODE_OPTIONS.find(
                      (option) => option.value === pricingMode,
                    )?.priceLabel
                  }
                </Label>
                <Input
                  id="sheet-class-price"
                  inputMode="numeric"
                  max={10_000_000_000}
                  value={defaultPriceVnd}
                  onChange={(e) =>
                    setDefaultPriceVnd(
                      e.target.value
                        ? formatVnd(parseVnd(e.target.value)).replace(" ₫", "")
                        : "",
                    )
                  }
                  autoFocus={false}
                />
              </div>
              <div className="space-y-2">
                <Label>Lịch dạy cố định</Label>
                <ScheduleEditor slots={schedules} onChange={setSchedules} />
                {schedules.length > 0 && (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Tự động tạo buổi dạy
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Hệ thống tự tạo buổi theo lịch trên, bạn chỉ cần xoá nếu
                        nghỉ.
                      </p>
                    </div>
                    <Switch
                      checked={autoSchedule}
                      onCheckedChange={setAutoSchedule}
                      aria-label="Tự động tạo buổi dạy"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sheet-class-venue">Nơi dạy</Label>
                <Select value={venue} onValueChange={setVenue}>
                  <SelectTrigger id="sheet-class-venue" className="w-full">
                    <SelectValue placeholder="Tùy chọn" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENUE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sheet-class-note">Ghi chú</Label>
                <Input
                  id="sheet-class-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tùy chọn"
                  autoFocus={false}
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
              {confirmDelete ? (
                <div className="rounded-2xl bg-red-50 p-3">
                  <p className="text-sm font-semibold text-red-700">
                    Xoá lớp "{classItem.name}"? Học sinh và dữ liệu liên quan
                    vẫn được giữ.
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
                  Xoá lớp
                </Button>
              )}
            </form>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-2xl"
              onClick={onClose}
            >
              Đóng
            </Button>
            <Button
              type="submit"
              form="edit-class-info-form"
              disabled={saving}
              className="min-h-11 rounded-2xl"
            >
              {saving && <Loader2 className="animate-spin" size={16} />}
              {saving ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
