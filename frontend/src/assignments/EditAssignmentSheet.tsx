import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toLocalDateTimeInput } from "../lib/format";
import { API } from "../lib/api";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  classNames?: string[];
  classIds?: string[];
};

export function EditAssignmentSheet({
  assignment,
  onClose,
  onSaved,
}: {
  assignment: Assignment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description ?? "");
  const [dueAt, setDueAt] = useState(
    assignment.dueAt ? toLocalDateTimeInput(new Date(assignment.dueAt)) : "",
  );

  useEffect(() => {
    setTitle(assignment.title);
    setDescription(assignment.description ?? "");
    setDueAt(
      assignment.dueAt ? toLocalDateTimeInput(new Date(assignment.dueAt)) : "",
    );
  }, [assignment]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return setError("Nhập tên bài tập.");
    setSaving(true);
    setError("");
    const response = await fetch(`${API}/assignments/${assignment.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        studentIds: [],
        // Class membership is managed from the class detail page; editing
        // keeps the assignment's existing classes untouched.
        classIds: assignment.classIds ?? [],
      }),
    });
    setSaving(false);
    if (response.ok) onSaved();
    else setError("Không thể lưu bài tập.");
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sửa bài tập</SheetTitle>
        </SheetHeader>

        <form onSubmit={submit} className="flex h-full flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto pb-4">
            <div className="space-y-2">
              <Label htmlFor="sheet-title">Tên bài</Label>
              <Input
                id="sheet-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus={false}
              />
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <DatePicker
                value={dueAt ? new Date(dueAt) : null}
                onChange={(date) => setDueAt(toLocalDateTimeInput(date))}
                min={new Date()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheet-desc">Mô tả</Label>
              <Textarea
                id="sheet-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tùy chọn"
                autoFocus={false}
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
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
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
