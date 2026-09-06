import { FormEvent, useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatVnd, parseVnd, toLocalDateTimeInput } from "../lib/format";
import { API } from "../lib/api";

type Student = {
  id: string;
  defaultPriceVnd: number;
  classes?: { pricingMode?: string }[];
};
type TeachingSession = {
  id: string;
  studentId: string;
  taughtAt: string;
  endsAt?: string | null;
  priceVnd: number;
  note: string | null;
};

// Pricing mode of the student's class when they belong to exactly one;
// mixed/none falls back to manual per-session pricing.
function effectiveMode(student: Student): string {
  const classes = student.classes ?? [];
  return classes.length === 1 ? (classes[0].pricingMode ?? "per_session") : "per_session";
}

export function MarkTaughtSheet({
  student,
  session,
  initialDate,
  onClose,
  onSaved,
}: {
  student: Student;
  session?: TeachingSession | null;
  initialDate?: Date;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [taughtAt, setTaughtAt] = useState(() =>
    toLocalDateTimeInput(
      session ? new Date(session.taughtAt) : (initialDate ?? new Date()),
    ),
  );
  const [priceVnd, setPriceVnd] = useState(() =>
    session?.priceVnd == null ? "" : String(session.priceVnd),
  );
  const mode = effectiveMode(student);
  const [endTime, setEndTime] = useState(() =>
    session?.endsAt
      ? new Date(session.endsAt).toTimeString().slice(0, 5)
      : "",
  );
  const [note, setNote] = useState(session?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(session);

  useEffect(() => {
    setTaughtAt(
      toLocalDateTimeInput(
        session ? new Date(session.taughtAt) : (initialDate ?? new Date()),
      ),
    );
    setPriceVnd(session?.priceVnd == null ? "" : String(session.priceVnd));
    setEndTime(
      session?.endsAt ? new Date(session.endsAt).toTimeString().slice(0, 5) : "",
    );
    setNote(session?.note ?? "");
  }, [initialDate, session]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const taughtDate = new Date(taughtAt);
    if (taughtDate.getTime() > Date.now() + 5 * 60 * 1000) {
      return setError("Không thể ghi nhận buổi dạy cho ngày tương lai.");
    }
    let endsAtIso: string | undefined;
    if (mode === "per_hour") {
      if (!endTime) return setError("Nhập giờ kết thúc buổi học.");
      const [hours, minutes] = endTime.split(":").map(Number);
      const endDate = new Date(taughtDate);
      endDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
      if (endDate.getTime() <= taughtDate.getTime()) {
        return setError("Giờ kết thúc phải sau giờ bắt đầu.");
      }
      endsAtIso = endDate.toISOString();
    }
    setSaving(true);
    const response = await fetch(
      editing
        ? `${API}/sessions/${session!.id}`
        : `${API}/students/${student.id}/sessions`,
      {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taughtAt: taughtDate.toISOString(),
          endsAt: endsAtIso,
          priceVnd: priceVnd ? parseVnd(priceVnd) : undefined,
          note,
        }),
      },
    );
    setSaving(false);
    if (response.ok) return onSaved();
    setError(
      response.status === 400
        ? "Không thể ghi nhận buổi dạy cho ngày tương lai."
        : "Không thể lưu buổi dạy. Vui lòng thử lại.",
    );
  }

  const [confirmDelete, setConfirmDelete] = useState(false);

  async function remove() {
    if (!session) return;
    setDeleting(true);
    const response = await fetch(`${API}/sessions/${session.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    setConfirmDelete(false);
    if (response.ok) onSaved();
  }

  return (
    <>
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Sửa buổi dạy" : "Ghi nhận buổi dạy"}
          </DialogTitle>
          <DialogDescription>
            Chọn thời gian, giá buổi học và ghi chú nếu có.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Thời gian</Label>
            <DatePicker
              value={taughtAt ? new Date(taughtAt) : null}
              onChange={(date) => setTaughtAt(toLocalDateTimeInput(date))}
              max={new Date()}
            />
          </div>
          {mode === "per_hour" && (
            <div className="space-y-1.5">
              <Label htmlFor="endTime">Giờ kết thúc</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Học phí tự tính theo giờ từ lớp của học sinh.
              </p>
            </div>
          )}
          {mode === "per_month" ? (
            <p className="rounded-2xl bg-violet-50 p-3 text-sm text-primary">
              Lớp này tính học phí theo tháng — buổi dạy không cộng tiền.
            </p>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="priceVnd">Tiền buổi học</Label>
              <Input
                id="priceVnd"
                inputMode="numeric"
                value={priceVnd}
                onChange={(event) => {
                  const value = event.target.value;
                  setPriceVnd(
                    value ? formatVnd(parseVnd(value)).replace(" ₫", "") : "",
                  );
                }}
                placeholder={formatVnd(student.defaultPriceVnd)}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea
              id="note"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Tùy chọn"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            {editing && (
              <Button
                type="button"
                variant="outline"
                disabled={saving || deleting}
                onClick={() => setConfirmDelete(true)}
                className="min-h-11 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
              >
                {deleting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
                Xóa
              </Button>
            )}
            <Button disabled={saving || deleting} className="min-h-11 flex-1">
              {saving && <Loader2 className="animate-spin" size={16} />}
              {saving
                ? "Đang lưu..."
                : editing
                  ? "Lưu thay đổi"
                  : "Xác nhận đã dạy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa buổi dạy?</DialogTitle>
          <DialogDescription>
            Buổi dạy này sẽ bị xóa khỏi danh sách. Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>Hủy</Button>
          <Button type="button" variant="destructive" disabled={deleting} onClick={() => void remove()}>
            {deleting && <Loader2 className="animate-spin" size={16} />}
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
