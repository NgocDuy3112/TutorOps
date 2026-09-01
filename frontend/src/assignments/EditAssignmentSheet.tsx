import { FormEvent, useEffect, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
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

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  classNames?: string[];
  classIds?: string[];
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
    assignment.dueAt ? toLocalDateTimeInput(new Date(assignment.dueAt)) : "",
  );
  const [classIds, setClassIds] = useState<string[]>(assignment.classIds ?? []);
  const [classSearch, setClassSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTitle(assignment.title);
    setDescription(assignment.description ?? "");
    setDueAt(
      assignment.dueAt ? toLocalDateTimeInput(new Date(assignment.dueAt)) : "",
    );
    setClassIds(assignment.classIds ?? []);
    setLoaded(false);
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
          setLoaded(true);
        }
      } catch {
        setLoaded(true);
      }
    }
    void loadClasses();
  }, []);

  const searchTerm = classSearch.trim().toLocaleLowerCase("vi");
  const visibleClasses = classes
    .filter((item) => item.name.toLocaleLowerCase("vi").includes(searchTerm))
    .sort((a, b) => {
      const aSelected = classIds.includes(a.id);
      const bSelected = classIds.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.name.localeCompare(b.name, "vi");
    });

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
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Chọn lớp</Label>
                {classIds.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {classIds.length} chọn
                  </span>
                )}
              </div>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />
                <Input
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  className="pl-9"
                  placeholder="Tìm lớp..."
                  autoFocus={false}
                />
              </div>
              <div className="max-h-[35dvh] space-y-1.5 overflow-y-auto">
                {!loaded ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Đang tải...
                  </p>
                ) : visibleClasses.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {classes.length === 0
                      ? "Chưa có lớp nào."
                      : "Không tìm thấy lớp."}
                  </p>
                ) : (
                  visibleClasses.map((item) => {
                    const selected = classIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleClass(item.id)}
                        className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors ${
                          selected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-lg text-[10px] font-bold ${
                            selected
                              ? "bg-primary text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.name.slice(0, 2).toLocaleUpperCase("vi")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {item.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.studentCount} học sinh
                          </span>
                        </span>
                        {selected && (
                          <Check size={16} className="text-primary" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
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
