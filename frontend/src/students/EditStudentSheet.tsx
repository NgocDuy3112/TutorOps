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

type Student = {
  id: string;
  name: string;
  parentName: string | null;
  parentPhone: string | null;
};

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function EditStudentSheet({
  student,
  onClose,
  onSaved,
}: {
  student: Student;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: student.name,
    parentName: student.parentName ?? "",
    parentPhone: student.parentPhone ?? "",
  });

  useEffect(() => {
    setForm({
      name: student.name,
      parentName: student.parentName ?? "",
      parentPhone: student.parentPhone ?? "",
    });
  }, [student]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(`${API}/students/${student.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (response.ok) onSaved();
    else setError("Không thể lưu học sinh.");
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sửa học sinh</SheetTitle>
          <SheetDescription>
            Cập nhật thông tin liên hệ của {student.name}.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sheet-student-name">Tên học sinh</Label>
            <Input
              id="sheet-student-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sheet-parent-name">Tên phụ huynh</Label>
            <Input
              id="sheet-parent-name"
              value={form.parentName}
              onChange={(e) =>
                setForm({ ...form, parentName: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sheet-parent-phone">Số điện thoại (10 chữ số)</Label>
            <Input
              id="sheet-parent-phone"
              type="tel"
              inputMode="numeric"
              pattern="^0\d{9}$"
              maxLength={10}
              placeholder="0912345678"
              value={form.parentPhone}
              onChange={(e) =>
                setForm({ ...form, parentPhone: e.target.value })
              }
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
            <Button
              disabled={saving}
              className="min-h-12 flex-1 rounded-2xl"
            >
              {saving && <Loader2 className="animate-spin" size={16} />}
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
