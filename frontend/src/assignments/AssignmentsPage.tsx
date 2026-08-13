import { useEffect, useState } from "react";
import { FileText, Loader2, Pencil, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  studentCount: number;
  classNames?: string[];
  students: { id: string; name: string; status: string }[];
};

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/assignments`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Không thể tải bài tập.");
      setAssignments(await response.json());
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
  }, []);

  return (
    <MobileShell>
      <PageHeader
        title="Bài tập"
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="min-h-11 rounded-2xl"
              onClick={() => navigate("/assignments/new")}
            >
              <Plus size={16} />
              Tạo bài
            </Button>
            <UserAvatar />
          </div>
        }
      />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && (
          <Card className="mt-5 border-red-100 bg-red-50">
            <CardContent
              role="alert"
              className="flex flex-col gap-3 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>{error}</span>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 bg-white"
                onClick={() => void load()}
              >
                Tải lại
              </Button>
            </CardContent>
          </Card>
        )}
        {loading ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải...
          </p>
        ) : !error && assignments.length === 0 ? (
          <Card className="mt-5 border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Không có dữ liệu.</p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => navigate("/assignments/new")}
              >
                <Plus size={16} />
                Tạo bài
              </Button>
            </CardContent>
          </Card>
        ) : !error ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onEdit={() => navigate(`/assignments/${assignment.id}/edit`)}
                onInbox={() =>
                  navigate(`/assignments/${assignment.id}/submissions`)
                }
              />
            ))}
          </div>
        ) : null}
      </main>
    </MobileShell>
  );
}

function AssignmentCard({
  assignment,
  onEdit,
  onInbox,
}: {
  assignment: Assignment;
  onEdit: () => void;
  onInbox: () => void;
}) {
  async function createLink() {
    const response = await fetch(
      `${API}/assignments/${assignment.id}/submission-link`,
      { method: "POST", credentials: "include" },
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
                ? `Deadline: ${new Date(assignment.dueAt).toLocaleDateString("vi-VN")}`
                : "Không có deadline"}
            </p>
            <p className="mt-3 truncate text-sm font-medium text-primary">
              {(assignment.classNames ?? []).length
                ? assignment.classNames!.join(", ")
                : "Chưa có lớp"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-2xl"
            aria-label="Sửa bài tập"
            onClick={onEdit}
          >
            <Pencil size={16} />
          </Button>
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
            onClick={() => void createLink()}
          >
            Tạo link nộp bài
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
