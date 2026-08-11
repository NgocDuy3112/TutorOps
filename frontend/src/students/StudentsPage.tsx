import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Pencil, Plus, Trash2, UserRound } from "lucide-react";
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
import { formatVnd } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";

type Student = {
  id: string;
  name: string;
  parentName: string | null;
  parentPhone: string | null;
  defaultPriceVnd: number;
};

type StudentFormValues = {
  name: string;
  parentName: string;
  parentPhone: string;
  defaultPriceVnd: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStudents() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/students`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Không thể tải dữ liệu.");
      setStudents(await response.json());
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  async function removeStudent(id: string) {
    if (!confirm("Xóa học sinh này?")) return;
    const response = await fetch(`${API}/students/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) {
      setStudents((current) => current.filter((student) => student.id !== id));
    }
  }

  return (
    <MobileShell>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              TutorOps
            </p>
            <h1 className="text-xl font-bold">Học sinh</h1>
          </div>
          <Button size="sm" onClick={() => setEditing(emptyStudent())}>
            <Plus size={16} />
            Thêm
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Danh sách học sinh</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý thông tin liên hệ và giá mặc định mỗi buổi.
          </p>
        </div>

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
        {!loading && students.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <p className="text-sm text-muted-foreground">Chưa có học sinh.</p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => setEditing(emptyStudent())}
              >
                <Plus size={16} />
                Thêm học sinh đầu tiên
              </Button>
            </CardContent>
          </Card>
        )}
        {!loading && students.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onEdit={() => setEditing(student)}
                onDelete={() => void removeStudent(student.id)}
              />
            ))}
          </div>
        )}
      </main>
      <StudentForm
        student={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void loadStudents();
        }}
      />
    </MobileShell>
  );
}

function StudentCard({
  student,
  onEdit,
  onDelete,
}: {
  student: Student;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-primary">
            <UserRound size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <Link
              to={`/students/${student.id}`}
              className="truncate font-bold hover:text-primary"
            >
              {student.name}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {student.parentName || "Chưa có tên phụ huynh"}
            </p>
            <p className="mt-3 text-sm font-semibold">
              {formatVnd(student.defaultPriceVnd)}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                / buổi
              </span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
          >
            <Pencil size={15} />
            Sửa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onDelete}
          >
            <Trash2 size={15} />
            Xóa
          </Button>
        </div>
      </CardContent>
    </Card>
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
    defaultPriceVnd: "0",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!student) return;
    setForm({
      name: student.name,
      parentName: student.parentName ?? "",
      parentPhone: student.parentPhone ?? "",
      defaultPriceVnd: String(student.defaultPriceVnd),
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
        defaultPriceVnd: Number(form.defaultPriceVnd),
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
          <DialogDescription>
            Nhập thông tin liên hệ và giá mặc định mỗi buổi.
          </DialogDescription>
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
          <div className="space-y-1.5">
            <Label htmlFor="default-price">Giá mặc định</Label>
            <Input
              id="default-price"
              type="number"
              min="0"
              value={form.defaultPriceVnd}
              onChange={(event) =>
                updateField("defaultPriceVnd", event.target.value)
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
