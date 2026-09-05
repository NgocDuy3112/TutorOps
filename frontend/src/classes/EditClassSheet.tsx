import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Search, UserMinus, UserPlus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatVnd, parseVnd } from "../lib/format";
import { cn } from "@/lib/utils";
import { API } from "../lib/api";

type Student = { id: string; name: string; parentPhone: string | null };
type TutorClass = {
  id: string;
  name: string;
  defaultPriceVnd: number | null;
  note: string | null;
  students: Student[];
};

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
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [name, setName] = useState(classItem.name);
  const [defaultPriceVnd, setDefaultPriceVnd] = useState(
    classItem.defaultPriceVnd == null ? "" : String(classItem.defaultPriceVnd),
  );
  const [note, setNote] = useState(classItem.note ?? "");
  const [studentIds, setStudentIds] = useState<string[]>(
    classItem.students.map((s) => s.id),
  );
  const [studentSearch, setStudentSearch] = useState("");
  const [changing, setChanging] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Student | null>(null);

  useEffect(() => {
    setName(classItem.name);
    setDefaultPriceVnd(
      classItem.defaultPriceVnd == null ? "" : String(classItem.defaultPriceVnd),
    );
    setNote(classItem.note ?? "");
    setStudentIds(classItem.students.map((s) => s.id));
  }, [classItem]);

  useEffect(() => {
    async function loadStudents() {
      try {
        const response = await fetch(`${API}/students`, {
        });
        if (response.ok) setAllStudents(await response.json());
      } catch {
      }
    }
    void loadStudents();
  }, []);

  const currentStudents = useMemo(
    () => allStudents.filter((s) => studentIds.includes(s.id)),
    [allStudents, studentIds],
  );

  const availableStudents = useMemo(() => {
    const term = studentSearch.trim().toLocaleLowerCase("vi");
    return allStudents.filter(
      (s) =>
        !studentIds.includes(s.id) &&
        s.name.toLocaleLowerCase("vi").includes(term),
    );
  }, [allStudents, studentIds, studentSearch]);

  async function addStudent(studentId: string) {
    setChanging(studentId);
    const response = await fetch(
      `${API}/classes/${classItem.id}/students/${studentId}`,
      { method: "POST" },
    );
    if (response.ok) {
      setStudentIds((current) => [...current, studentId]);
    }
    setChanging(null);
  }

  async function removeStudent() {
    if (!removing) return;
    setChanging(removing.id);
    const response = await fetch(
      `${API}/classes/${classItem.id}/students/${removing.id}`,
      { method: "DELETE" },
    );
    if (response.ok) {
      setStudentIds((current) => current.filter((id) => id !== removing.id));
    }
    setChanging(null);
    setRemoving(null);
  }

  async function submitInfo(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("Nhập tên lớp.");
    setSaving(true);
    setError("");
    const response = await fetch(`${API}/classes/${classItem.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        defaultPriceVnd: defaultPriceVnd ? parseVnd(defaultPriceVnd) : null,
        note: note || null,
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
                <Label htmlFor="sheet-class-price">
                  Giá mặc định
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
            </form>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">
                Học sinh ({currentStudents.length})
              </h3>
              {currentStudents.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  Chưa có học sinh nào.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {currentStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-xs font-bold text-primary">
                        {student.name.slice(0, 2).toLocaleUpperCase("vi")}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {student.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRemoving(student)}
                        disabled={changing === student.id}
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label={`Bỏ ${student.name}`}
                      >
                        {changing === student.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <UserMinus size={16} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  Thêm học sinh
                </h3>
                {availableStudents.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {availableStudents.length}
                  </span>
                )}
              </div>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9"
                  placeholder="Tìm học sinh..."
                  autoFocus={false}
                />
              </div>
              <div className="max-h-[25dvh] overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                {availableStudents.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                      <UsersRound size={18} />
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {allStudents.length === 0
                        ? "Chưa có học sinh nào."
                        : "Không tìm thấy học sinh."}
                    </p>
                  </div>
                ) : (
                  availableStudents.map((student, index) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => void addStudent(student.id)}
                      disabled={changing === student.id}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:opacity-60",
                        index > 0 && "border-t border-slate-100",
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                        {student.name.slice(0, 2).toLocaleUpperCase("vi")}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {student.name}
                      </span>
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg text-primary transition-colors">
                        {changing === student.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <UserPlus size={16} />
                        )}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>
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
      <Dialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bỏ học sinh khỏi lớp?</DialogTitle>
            <DialogDescription>
              {removing?.name} sẽ không còn trong lớp "{classItem.name}". Học sinh vẫn được giữ trong hệ thống.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoving(null)}>Hủy</Button>
            <Button type="button" variant="destructive" onClick={() => void removeStudent()}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
