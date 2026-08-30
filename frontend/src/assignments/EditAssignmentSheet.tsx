import { FormEvent, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  classNames?: string[];
};
type TutorClass = { id: string; name: string; studentCount: number };

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description ?? "");
  const [dueAt, setDueAt] = useState(
    assignment.dueAt
      ? new Date(assignment.dueAt).toISOString().slice(0, 16)
      : "",
  );
  const [classIds, setClassIds] = useState<string[]>([]);
  const [classSearch, setClassSearch] = useState("");

  useEffect(() => {
    setTitle(assignment.title);
    setDescription(assignment.description ?? "");
    setDueAt(
      assignment.dueAt
        ? new Date(assignment.dueAt).toISOString().slice(0, 16)
        : "",
    );
  }, [assignment]);

  useEffect(() => {
    async function loadClasses() {
      try {
        const response = await fetch(`${API}/classes`, {
          credentials: "include",
        });
        if (response.ok) {
          const allClasses: TutorClass[] = await response.json();
          setClasses(allClasses);
          const matchedClassIds = allClasses
            .filter((c) => (assignment.classNames ?? []).includes(c.name))
            .map((c) => c.id);
          setClassIds(matchedClassIds);
        }
      } catch {
        // ignore
      }
    }
    void loadClasses();
  }, [assignment]);

  const searchTerm = classSearch.trim().toLocaleLowerCase("vi");
  const visibleClasses = classes.filter((item) =>
    item.name.toLocaleLowerCase("vi").includes(searchTerm),
  );

  function toggleClass(id: string) {
    setClassIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return setError("Nhập tên bài tập.");
    if (classIds.length === 0) return setError("Chọn ít nhất một lớp.");
    setSaving(true);
    setError("");
    const response = await fetch(`${API}/assignments/${assignment.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title,
        description,
        dueAt: dueAt || null,
        studentIds: [],
        classIds,
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
          <SheetDescription>
            Cập nhật thông tin bài tập "{assignment.title}".
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sheet-assignment-title">Tên bài</Label>
            <Input
              id="sheet-assignment-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sheet-assignment-due-at">Deadline</Label>
            <Input
              id="sheet-assignment-due-at"
              type="datetime-local"
              className="w-full max-w-full"
              min={new Date().toISOString().slice(0, 16)}
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sheet-assignment-description">Mô tả</Label>
            <Textarea
              id="sheet-assignment-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="border-t pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Chọn lớp</h3>
              <span className="text-xs text-muted-foreground">
                {classIds.length} chọn
              </span>
            </div>
            <div className="relative mb-3">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={15}
              />
              <Input
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                className="pl-9"
                placeholder="Tìm lớp"
              />
            </div>
            <div className="max-h-[30dvh] space-y-1.5 overflow-y-auto rounded-2xl border p-2">
              {visibleClasses.map((item) => {
                const selected = classIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleClass(item.id)}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors ${selected ? "bg-primary text-primary-foreground" : "hover:bg-slate-50"}`}
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${selected ? "bg-white/15" : "bg-violet-50 text-primary"}`}
                    >
                      {item.name.slice(0, 2).toLocaleUpperCase("vi")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate">{item.name}</strong>
                      <small
                        className={
                          selected
                            ? "text-primary-foreground/75"
                            : "text-muted-foreground"
                        }
                      >
                        {item.studentCount} học sinh
                      </small>
                    </span>
                  </button>
                );
              })}
              {visibleClasses.length === 0 && (
                <p className="p-3 text-center text-sm text-muted-foreground">
                  Không tìm thấy lớp.
                </p>
              )}
            </div>
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
