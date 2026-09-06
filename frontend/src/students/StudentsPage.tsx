import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus, Search, UserRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { Fab } from "@/components/Fab";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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

  return (
    <MobileShell>
      <PageHeader title="Học sinh" action={<UserAvatar />} />
      <Fab onClick={() => navigate("/students/new")} label="Thêm học sinh" />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="relative mb-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm học sinh"
            aria-label="Tìm học sinh"
            className="min-h-11 rounded-2xl bg-white pl-9"
          />
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

        {!loading && (
          <StudentsGrid
            students={students.filter((student) =>
              student.name
                .toLocaleLowerCase("vi")
                .includes(search.trim().toLocaleLowerCase("vi")),
            )}
            onAdd={() => navigate("/students/new")}
          />
        )}
      </main>
    </MobileShell>
  );
}

function StudentsGrid({
  students,
  onAdd,
}: {
  students: Student[];
  onAdd: () => void;
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
        <StudentCard key={student.id} student={student} />
      ))}
    </div>
  );
}

function StudentCard({ student }: { student: Student }) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
      <CardContent className="p-4">
        <Link
          to={`/students/${student.id}`}
          className="flex items-start gap-3"
          aria-label={`Xem hồ sơ ${student.name}`}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-primary">
            <UserRound size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block truncate font-bold hover:text-primary">
              {student.name}
            </span>
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
        </Link>
      </CardContent>
    </Card>
  );
}
