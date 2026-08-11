import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { Link } from "react-router-dom";
import { Copy, Link2, Loader2, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";

type StudentClass = {
  id: string;
  name: string;
  subject: string | null;
};

type Student = {
  id: string;
  name: string;
  parentName: string | null;
  parentPhone: string | null;
  defaultPriceVnd: number;
  classes?: StudentClass[];
};

type StudentFormValues = {
  name: string;
  parentName: string;
  parentPhone: string;
};

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const emptyStudent = (): Student => ({
  id: "",
  name: "",
  parentName: "",
  parentPhone: "",
  defaultPriceVnd: 0,
});

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [sharing, setSharing] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const studentsResponse = await fetch(`${API}/students`, {
        credentials: "include",
      });
      if (!studentsResponse.ok) throw new Error("Không thể tải dữ liệu.");
      setStudents(await studentsResponse.json());
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function removeStudent(id: string) {
    const response = await fetch(`${API}/students/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) {
      setStudents((current) => current.filter((student) => student.id !== id));
      setDeleting(null);
    }
  }

  return (
    <MobileShell>
      <PageHeader
        title="Học sinh"
        action={<div className="flex items-center gap-2"><Button type="button" size="sm" className="min-h-11 rounded-2xl" onClick={() => setEditing(emptyStudent())}><Plus size={16} />Thêm</Button><UserAvatar /></div>}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && (
          <Card className="mb-4 border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-sm text-amber-800">
              {error}
            </CardContent>
          </Card>
        )}

        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải...
          </p>
        )}

        {!loading && (
          <StudentsGrid
            students={students}
            onAdd={() => setEditing(emptyStudent())}
            onEdit={setEditing}
            onDelete={setDeleting}
            onShare={setSharing}
          />
        )}
      </main>

      <DeleteStudentDialog
        student={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && void removeStudent(deleting.id)}
      />
      <SubmissionLinkDialog student={sharing} onOpenChange={(open) => !open && setSharing(null)} />
      <StudentForm
        student={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void loadData();
        }}
      />
    </MobileShell>
  );
}

function StudentsGrid({
  students,
  onAdd,
  onEdit,
  onDelete,
  onShare,
}: {
  students: Student[];
  onAdd: () => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onShare: (student: Student) => void;
}) {
  if (students.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-10 text-center">
          <p className="text-sm text-muted-foreground">Chưa có học sinh.</p>
          <Button className="mt-3" size="sm" onClick={onAdd}>
            <Plus size={16} />
            Thêm học sinh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          onEdit={() => onEdit(student)}
          onDelete={() => onDelete(student)}
          onShare={() => onShare(student)}
        />
      ))}
    </div>
  );
}

function StudentCard({
  student,
  onEdit,
  onDelete,
  onShare,
}: {
  student: Student;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const startX = useRef(0);
  const [revealed, setRevealed] = useState(false);

  function onPointerDown(event: PointerEvent) {
    startX.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent) {
    const deltaX = event.clientX - startX.current;
    if (deltaX < -48) setRevealed(true);
    if (deltaX > 32) setRevealed(false);
  }

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <button
        type="button"
        className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-red-600 text-white"
        onClick={onDelete}
        aria-label="Xóa học sinh"
      >
        <Trash2 size={18} />
        <span className="ml-1 text-sm font-semibold">Xóa</span>
      </button>
      <Card
        className={`relative rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70 transition-transform duration-200 ${
          revealed ? "-translate-x-24" : "translate-x-0"
        }`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-primary">
              <UserRound size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <Link
                to={`/students/${student.id}`}
                className="block truncate font-bold hover:text-primary"
              >
                {student.name}
              </Link>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {student.parentPhone || "Chưa có số điện thoại phụ huynh"}
              </p>
              {(student.classes ?? []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {student.classes!.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full bg-violet-50 px-2 py-1 text-xs font-medium text-primary"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-2">
            <Button type="button" variant="outline" size="icon" className="rounded-2xl" onClick={onShare} aria-label="Tạo link nộp bài"><Link2 size={16} /></Button>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 rounded-2xl"
              onClick={onEdit}
            >
              <Pencil size={15} />
              Sửa
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SubmissionLinkDialog({ student, onOpenChange }: { student: Student | null; onOpenChange: (open: boolean) => void }) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setLink(""); setError(""); }, [student]);
  async function createLink() {
    if (!student) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API}/students/${student.id}/access-tokens/student`, { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error("Không thể tạo link nộp bài.");
      const { token } = await response.json();
      setLink(`${window.location.origin}/submit/${token}`);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Có lỗi xảy ra."); }
    finally { setLoading(false); }
  }
  async function copyLink() { if (link) await navigator.clipboard.writeText(link); }
  return <Dialog open={Boolean(student)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Link nộp bài</DialogTitle><DialogDescription>Tạo link riêng cho {student?.name}. Link cũ sẽ bị vô hiệu sau khi tạo link mới.</DialogDescription></DialogHeader>{link ? <div className="space-y-3"><Input readOnly value={link} aria-label="Link nộp bài" /><Button type="button" className="min-h-11 w-full" onClick={() => void copyLink()}><Copy size={16} />Sao chép link</Button><Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => void createLink()}>Tạo link mới</Button></div> : <div className="space-y-3">{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Button type="button" disabled={loading} className="min-h-11 w-full" onClick={() => void createLink()}>{loading && <Loader2 className="animate-spin" size={16} />}{loading ? "Đang tạo..." : "Tạo link nộp bài"}</Button></div>}</DialogContent></Dialog>;
}

function DeleteStudentDialog({
  student,
  onOpenChange,
  onConfirm,
}: {
  student: Student | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(student)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa học sinh?</DialogTitle>
          <DialogDescription>
            Hành động này sẽ ẩn học sinh {student?.name}. Bạn có chắc muốn xóa?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="min-h-11 bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
          >
            <Trash2 size={16} />
            Xóa học sinh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StudentForm({
  student,
  onOpenChange,
  onSaved,
}: {
  student: Student | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<StudentFormValues>({
    name: "",
    parentName: "",
    parentPhone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!student) return;
    setForm({
      name: student.name,
      parentName: student.parentName ?? "",
      parentPhone: student.parentPhone ?? "",
    });
  }, [student]);

  function updateField<Key extends keyof StudentFormValues>(
    key: Key,
    value: StudentFormValues[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!student) return;
    setSaving(true);

    const url = student.id
      ? `${API}/students/${student.id}`
      : `${API}/students`;
    const method = student.id ? "PATCH" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: form.name,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
      }),
    });

    setSaving(false);
    if (response.ok) onSaved();
  }

  return (
    <Dialog open={Boolean(student)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {student?.id ? "Sửa học sinh" : "Thêm học sinh"}
          </DialogTitle>
          <DialogDescription>Nhập thông tin liên hệ.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="student-name">Tên học sinh</Label>
            <Input
              id="student-name"
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parent-name">Tên phụ huynh</Label>
            <Input
              id="parent-name"
              value={form.parentName}
              onChange={(event) =>
                updateField("parentName", event.target.value)
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parent-phone">Số điện thoại</Label>
            <Input
              id="parent-phone"
              value={form.parentPhone}
              onChange={(event) =>
                updateField("parentPhone", event.target.value)
              }
            />
          </div>
          <Button disabled={saving} className="w-full">
            {saving && <Loader2 className="animate-spin" size={16} />}
            {saving ? "Đang lưu..." : "Lưu học sinh"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
