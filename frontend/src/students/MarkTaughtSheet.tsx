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
import { formatVnd, parseVnd } from "../lib/format";

type Student = { id: string; defaultPriceVnd: number };
type TeachingSession = {
  id: string;
  studentId: string;
  taughtAt: string;
  priceVnd: number;
  note: string | null;
};
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const toDateTimeLocal = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

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
    toDateTimeLocal(
      session ? new Date(session.taughtAt) : (initialDate ?? new Date()),
    ),
  );
  const [priceVnd, setPriceVnd] = useState(() =>
    session?.priceVnd == null ? "" : String(session.priceVnd),
  );
  const [note, setNote] = useState(session?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const editing = Boolean(session);

  useEffect(() => {
    setTaughtAt(
      toDateTimeLocal(
        session ? new Date(session.taughtAt) : (initialDate ?? new Date()),
      ),
    );
    setPriceVnd(session?.priceVnd == null ? "" : String(session.priceVnd));
    setNote(session?.note ?? "");
  }, [initialDate, session]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(
      editing
        ? `${API}/sessions/${session!.id}`
        : `${API}/students/${student.id}/sessions`,
      {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          taughtAt: new Date(taughtAt).toISOString(),
          priceVnd: priceVnd ? parseVnd(priceVnd) : undefined,
          note,
        }),
      },
    );
    setSaving(false);
    if (response.ok) onSaved();
  }

  const [confirmDelete, setConfirmDelete] = useState(false);

  async function remove() {
    if (!session) return;
    setDeleting(true);
    const response = await fetch(`${API}/sessions/${session.id}`, {
      method: "DELETE",
      credentials: "include",
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
              onChange={(date) => setTaughtAt(date ? date.toISOString().slice(0, 16) : "")}
              min={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
            />
          </div>
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
