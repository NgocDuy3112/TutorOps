import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatVnd, parseVnd } from "../lib/format";

type TutorClass = {
  id: string;
  name: string;
  defaultPriceVnd: number | null;
  note: string | null;
};

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function EditClassSheet({
  classItem,
  onClose,
  onSaved,
}: {
  classItem: TutorClass;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: classItem.name,
    defaultPriceVnd:
      classItem.defaultPriceVnd == null ? "" : String(classItem.defaultPriceVnd),
    note: classItem.note ?? "",
  });

  useEffect(() => {
    setForm({
      name: classItem.name,
      defaultPriceVnd:
        classItem.defaultPriceVnd == null
          ? ""
          : String(classItem.defaultPriceVnd),
      note: classItem.note ?? "",
    });
  }, [classItem]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(`${API}/classes/${classItem.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: form.name,
        defaultPriceVnd: form.defaultPriceVnd
          ? parseVnd(form.defaultPriceVnd)
          : null,
        note: form.note || null,
      }),
    });
    setSaving(false);
    if (response.ok) onSaved();
    else setError("Không thể lưu lớp.");
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sửa lớp</SheetTitle>
          <SheetDescription>
            Cập nhật thông tin lớp {classItem.name}.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sheet-class-name">Tên lớp</Label>
            <Input
              id="sheet-class-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sheet-class-price">
              Giá mặc định (tối đa 10 tỷ ₫)
            </Label>
            <Input
              id="sheet-class-price"
              inputMode="numeric"
              max={10_000_000_000}
              value={form.defaultPriceVnd}
              onChange={(e) =>
                setForm({
                  ...form,
                  defaultPriceVnd: e.target.value
                    ? formatVnd(parseVnd(e.target.value)).replace(" ₫", "")
                    : "",
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sheet-class-note">Ghi chú</Label>
            <Input
              id="sheet-class-note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
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
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-12 flex-1 rounded-2xl"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button disabled={saving} className="min-h-12 flex-1 rounded-2xl">
              {saving && <Loader2 className="animate-spin" size={16} />}
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
