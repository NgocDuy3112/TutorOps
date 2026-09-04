import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Pencil, Plus, Trash2, UserRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";
import { EditStudentSheet } from "./EditStudentSheet";
import { API } from "../lib/api";

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

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const studentsResponse = await fetch(`${API}/students`);
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
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="min-h-11 rounded-2xl"
              onClick={() => navigate("/students/new")}
            >
              <Plus size={16} />
              Thêm
            </Button>
            <UserAvatar />
          </div>
        }
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
            onAdd={() => navigate("/students/new")}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        )}
      </main>

      <DeleteStudentDialog
        student={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && void removeStudent(deleting.id)}
      />
      {editing && (
        <EditStudentSheet
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void loadData();
          }}
        />
      )}
    </MobileShell>
  );
}

function StudentsGrid({
  students,
  onAdd,
  onEdit,
  onDelete,
}: {
  students: Student[];
  onAdd: () => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}) {
  if (students.length === 0) {
    return (
      <EmptyState
        icon={<UserPlus size={28} />}
        title="Chưa có học sinh"
        description="Thêm học sinh để bắt đầu quản lý lớp học, ghi nhận buổi dạy và theo dõi học phí."
        action={
          <Button className="min-h-11 rounded-2xl" onClick={onAdd}>
            <Plus size={16} />
            Thêm học sinh
          </Button>
        }
      />
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
        />
      ))}
    </div>
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
    <Card className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
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
              {student.parentPhone || "Chưa có SĐT liên hệ"}
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
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="icon"
              className="min-h-10 min-w-10 rounded-2xl"
              onClick={onEdit}
              aria-label="Sửa học sinh"
            >
              <Pencil size={15} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="min-h-10 min-w-10 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onDelete}
              aria-label="Xóa học sinh"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
