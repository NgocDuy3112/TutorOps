import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarCheck,
  Loader2,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { formatVnd } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";
import { EditStudentSheet } from "./EditStudentSheet";
import { MarkTaughtSheet } from "./MarkTaughtSheet";
import { MonthlySlipSection } from "./MonthlySlipSection";
import { API } from "../lib/api";

type Student = {
  id: string;
  name: string;
  parentName: string | null;
  parentPhone: string | null;
  defaultPriceVnd: number;
  classes?: { pricingMode?: string }[];
};
type Session = {
  id: string;
  taughtAt: string;
  priceVnd: number;
  note: string | null;
};
type Assignment = {
  id: string;
  title: string;
  dueAt: string | null;
  students: { id: string; status: string }[];
};

export function StudentProfilePage({ studentId }: { studentId: string }) {
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [studentsResponse, sessionsResponse, assignmentsResponse] =
        await Promise.all([
          fetch(`${API}/students`),
          fetch(`${API}/students/${studentId}/sessions`, {
          }),
          fetch(`${API}/assignments`),
        ]);
      if (!studentsResponse.ok || !sessionsResponse.ok || !assignmentsResponse.ok)
        throw new Error("Không thể tải hồ sơ học sinh.");
      const students: Student[] = await studentsResponse.json();
      setStudent(students.find((item) => item.id === studentId) ?? null);
      setSessions(await sessionsResponse.json());
      setAssignments(await assignmentsResponse.json());
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [studentId]);

  async function deleteStudent() {
    if (!student) return;
    setDeleting(true);
    try {
      const response = await fetch(`${API}/students/${student.id}`, {
        method: "DELETE",
      });
      if (!response.ok)
        throw new Error("Không thể xóa học sinh. Vui lòng thử lại.");
      navigate("/students");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading)
    return (
      <MobileShell>
        <p className="p-6 text-sm text-muted-foreground">Đang tải...</p>
      </MobileShell>
    );

  if (!student)
    return (
      <MobileShell>
        <p className="p-6 text-sm text-red-600">
          {error || "Không tìm thấy học sinh."}
        </p>
      </MobileShell>
    );

  const studentAssignments = assignments.filter((assignment) =>
    assignment.students.some((item) => item.id === studentId),
  );
  const recentSessions = sessions.slice(0, 5);
  const recentAssignments = studentAssignments.slice(0, 5);
  const pendingCount = studentAssignments.filter((a) =>
    a.students.some((s) => s.id === studentId && s.status === "pending"),
  ).length;

  return (
    <MobileShell>
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Button asChild variant="link" className="h-auto p-0 text-primary">
            <Link to="/students">
              <ArrowLeft size={16} />
              Học sinh
            </Link>
          </Button>
          <h1 className="mt-3 text-2xl font-bold">{student.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hồ sơ học sinh</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-5">
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="flex-row items-center justify-between p-5 pb-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound size={20} className="text-primary" />
              Thông tin
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-2xl"
                onClick={() => setShowEditForm(true)}
              >
                <Pencil size={15} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="min-h-10 min-w-10 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700"
                aria-label="Xóa học sinh"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <dl className="space-y-3 text-sm">
              <Row label="Phụ huynh" value={student.parentName || "Chưa cập nhật"} />
              <Row label="Điện thoại" value={student.parentPhone || "Chưa cập nhật"} />
            </dl>
          </CardContent>
        </Card>

        <MonthlySlipSection studentId={studentId} />

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="flex-row items-center justify-between p-5 pb-0">
            <CardTitle className="text-lg">Buổi đã dạy ({sessions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có buổi dạy nào.</p>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(item.taughtAt).toLocaleDateString("vi-VN")}
                      </p>
                      {item.note && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.note}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-bold">{formatVnd(item.priceVnd)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="flex-row items-center justify-between p-5 pb-0">
            <CardTitle className="text-lg">
              Bài tập ({studentAssignments.length})
              {pendingCount > 0 && (
                <span className="ml-2 text-sm font-normal text-amber-600">
                  {pendingCount} chờ nộp
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {recentAssignments.length === 0 ? (
              <EmptyState
                icon={<BookOpenCheck size={24} />}
                title="Chưa có bài tập"
                description="Bài tập sẽ hiển thị ở đây khi giáo viên giao."
              />
            ) : (
              <div className="space-y-2">
                {recentAssignments.map((item) => {
                  const studentStatus = item.students.find(
                    (s) => s.id === studentId,
                  )?.status;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.dueAt
                            ? `Hạn: ${new Date(item.dueAt).toLocaleDateString("vi-VN")}`
                            : "Không có hạn"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          studentStatus === "submitted" || studentStatus === "reviewed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {studentStatus === "submitted"
                          ? "Đã nộp"
                          : studentStatus === "reviewed"
                            ? "Đã chấm"
                            : "Chờ nộp"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {showEditForm && (
        <EditStudentSheet
          student={student}
          onClose={() => setShowEditForm(false)}
          onSaved={() => {
            setShowEditForm(false);
            void load();
          }}
        />
      )}
      {showSessionForm && (
        <MarkTaughtSheet
          student={student}
          onClose={() => setShowSessionForm(false)}
          onSaved={() => {
            setShowSessionForm(false);
            void load();
          }}
        />
      )}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={(open) => !open && !deleting && setShowDeleteConfirm(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa học sinh?</DialogTitle>
            <DialogDescription>
              Hành động này sẽ ẩn học sinh {student?.name} khỏi danh sách. Dữ
              liệu liên quan vẫn được giữ. Bạn có chắc muốn xóa?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setShowDeleteConfirm(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void deleteStudent()}
            >
              {deleting && <Loader2 className="animate-spin" size={16} />}
              Xóa học sinh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
