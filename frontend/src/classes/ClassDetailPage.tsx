import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Coins,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserMinus,
  Users,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { formatDeadline, formatVnd } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";
import { EditAssignmentSheet } from "../assignments/EditAssignmentSheet";
import { EditClassSheet } from "./EditClassSheet";
import type { Student, TutorClass } from "./ClassesPage";
import { API } from "../lib/api";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  classNames?: string[];
  classIds?: string[];
  students: { id: string; name: string; status: string }[];
};

export function ClassDetailPage() {
  const { classId = "" } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<TutorClass | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingClass, setEditingClass] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);
  const [deletingClassBusy, setDeletingClassBusy] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState<Assignment | null>(null);

  const classAssignments = useMemo(
    () => assignments.filter((a) => (a.classIds ?? []).includes(classId)),
    [assignments, classId],
  );

  async function load() {
    setLoading(true);
    try {
      const [classes, studentsResponse, assignmentsResponse] = await Promise.all([
        fetch(`${API}/classes`),
        fetch(`${API}/students`),
        fetch(`${API}/assignments`),
      ]);
      if (!classes.ok || !studentsResponse.ok || !assignmentsResponse.ok)
        throw new Error("Không thể tải lớp.");
      const all: TutorClass[] = await classes.json();
      setItem(all.find((x) => x.id === classId) ?? null);
      setStudents(await studentsResponse.json());
      setAssignments(await assignmentsResponse.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [classId]);
  const available = useMemo(
    () =>
      students.filter(
        (s) =>
          !item?.students.some((x) => x.id === s.id) &&
          s.name
            .toLocaleLowerCase("vi")
            .includes(search.toLocaleLowerCase("vi")),
      ),
    [students, item, search],
  );
  const [removing, setRemoving] = useState<Student | null>(null);

  async function removeStudent() {
    if (!removing) return;
    const response = await fetch(
      `${API}/classes/${classId}/students/${removing.id}`,
      { method: "DELETE" },
    );
    if (response.ok) void load();
    setRemoving(null);
  }

  async function addStudent(student: Student) {
    const response = await fetch(
      `${API}/classes/${classId}/students/${student.id}`,
      { method: "POST" },
    );
    if (response.ok) void load();
  }
  async function deleteClass() {
    if (!item) return;
    setDeletingClassBusy(true);
    try {
      const response = await fetch(`${API}/classes/${classId}`, {
        method: "DELETE",
      });
      if (!response.ok)
        throw new Error("Không thể xóa lớp. Vui lòng thử lại.");
      navigate("/classes");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
      setDeletingClass(false);
    } finally {
      setDeletingClassBusy(false);
    }
  }

  async function deleteAssignment() {
    if (!deleting) return;
    const response = await fetch(`${API}/assignments/${deleting.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError("Không thể xóa bài tập. Vui lòng thử lại.");
    } else {
      setAssignments((current) => current.filter((a) => a.id !== deleting.id));
      setDeleting(null);
    }
  }

  return (
    <MobileShell>
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Button asChild variant="link" className="h-auto p-0 text-primary">
            <Link to="/classes">
              <ArrowLeft size={16} />
              Lớp
            </Link>
          </Button>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold">
                {item?.name || "Lớp"}
              </h1>
              {item?.defaultPriceVnd != null && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Coins size={13} className="shrink-0" />
                  {formatVnd(item.defaultPriceVnd)}/buổi
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="min-h-11 rounded-2xl"
                onClick={() => navigate(`/assignments/new?classId=${classId}`)}
              >
                <Plus size={16} />
                Tạo bài
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="min-h-10 min-w-10 rounded-2xl"
                aria-label="Sửa lớp"
                onClick={() => setEditingClass(true)}
              >
                <Pencil size={15} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="min-h-10 min-w-10 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700"
                aria-label="Xóa lớp"
                onClick={() => setDeletingClass(true)}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {loading ? (
          <p className="flex gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải...
          </p>
        ) : error ? (
          <Card className="border-red-100 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">
              {error}
            </CardContent>
          </Card>
        ) : !item ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Không tìm thấy lớp.
            </CardContent>
          </Card>
        ) : (
          <>
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold">
                  <ClipboardList size={18} className="text-primary" />
                  Bài tập ({classAssignments.length})
                </h2>
              </div>
              <div className="space-y-2">
                {classAssignments.length ? (
                  classAssignments.map((assignment) => (
                    <ClassAssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onInbox={() =>
                        navigate(`/assignments/${assignment.id}/submissions`)
                      }
                      onEdit={() => setEditing(assignment)}
                      onDelete={() => setDeleting(assignment)}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={<FileText size={24} />}
                    title="Chưa có bài tập"
                    description="Giao bài tập cho lớp này với deadline rõ ràng."
                    action={
                      <Button
                        className="min-h-11 rounded-2xl"
                        onClick={() =>
                          navigate(`/assignments/new?classId=${classId}`)
                        }
                      >
                        <Plus size={16} />
                        Tạo bài tập
                      </Button>
                    }
                  />
                )}
              </div>
            </section>
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold">
                  <Users size={18} className="text-primary" />
                  Học sinh ({item.students.length})
                </h2>
              </div>
              <div className="space-y-2">
                {item.students.length ? (
                  item.students.map((s) => (
                    <Card key={s.id}>
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <strong className="block truncate">{s.name}</strong>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {s.parentPhone || "Chưa có SĐT"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="text-red-600"
                          aria-label={`Bỏ ${s.name} khỏi lớp`}
                          onClick={() => setRemoving(s)}
                        >
                          <UserMinus size={17} />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <EmptyState
                    icon={<UserPlus size={24} />}
                    title="Lớp chưa có học sinh"
                    description="Tìm học sinh bên dưới để thêm vào lớp."
                  />
                )}
              </div>
            </section>
            <section>
              <h2 className="mb-3 font-bold">Thêm học sinh</h2>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm học sinh"
                aria-label="Tìm học sinh"
              />
              <div className="mt-3 space-y-2">
                {available.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm shadow-slate-100 transition-colors hover:bg-slate-50"
                    aria-label={`Thêm ${s.name} vào lớp`}
                    onClick={() => void addStudent(s)}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-sm font-bold text-primary">
                      {s.name.slice(0, 2).toLocaleUpperCase("vi")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate">{s.name}</strong>
                      <small className="text-muted-foreground">
                        {s.parentPhone || "Chưa có SĐT"}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <Dialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bỏ học sinh khỏi lớp?</DialogTitle>
            <DialogDescription>
              {removing?.name} sẽ không còn trong lớp này. Học sinh vẫn được giữ trong hệ thống.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoving(null)}>Hủy</Button>
            <Button type="button" variant="destructive" onClick={() => void removeStudent()}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa bài tập?</DialogTitle>
            <DialogDescription>
              Bài “{deleting?.title}” sẽ được ẩn khỏi danh sách.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void deleteAssignment()}
            >
              Xóa bài
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={deletingClass}
        onOpenChange={(open) => !open && !deletingClassBusy && setDeletingClass(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa lớp?</DialogTitle>
            <DialogDescription>
              Lớp {item?.name} sẽ bị ẩn khỏi danh sách. Học sinh và dữ liệu liên
              quan vẫn được giữ.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deletingClassBusy}
              onClick={() => setDeletingClass(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletingClassBusy}
              onClick={() => void deleteClass()}
            >
              {deletingClassBusy && <Loader2 className="animate-spin" size={16} />}
              Xóa lớp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {editing && (
        <EditAssignmentSheet
          assignment={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
      {item && editingClass && (
        <EditClassSheet
          classItem={item}
          onClose={() => setEditingClass(false)}
          onSaved={() => {
            setEditingClass(false);
            void load();
          }}
        />
      )}
    </MobileShell>
  );
}

function ClassAssignmentCard({
  assignment,
  onInbox,
  onEdit,
  onDelete,
}: {
  assignment: Assignment;
  onInbox: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const submitted = assignment.students.filter(
    (student) => student.status === "submitted",
  ).length;
  const multiClass = (assignment.classNames?.length ?? 0) > 1;

  async function copyLink() {
    const response = await fetch(
      `${API}/assignments/${assignment.id}/submission-link`,
      { method: "POST" },
    );
    if (!response.ok) return;
    const { token } = await response.json();
    const link = `${window.location.origin}/assignment-submit/${token}`;
    await navigator.clipboard.writeText(link);
    alert("Đã sao chép link nộp bài chung.");
  }

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-primary">
            <FileText size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-bold">{assignment.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {assignment.dueAt
                ? `Deadline: ${formatDeadline(assignment.dueAt)}`
                : "Không có deadline"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                Nộp {submitted}/{assignment.students.length}
              </span>
              {multiClass && (
                <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-medium text-primary">
                  {assignment.classNames!.length} lớp
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="min-h-10 min-w-10 rounded-2xl"
              aria-label="Sửa bài tập"
              onClick={onEdit}
            >
              <Pencil size={15} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="min-h-10 min-w-10 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700"
              aria-label="Xóa bài tập"
              onClick={onDelete}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-2xl"
            onClick={onInbox}
          >
            Xem bài làm
          </Button>
          <Button
            type="button"
            className="min-h-11 rounded-2xl"
            onClick={() => void copyLink()}
          >
            Tạo link nộp bài
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
