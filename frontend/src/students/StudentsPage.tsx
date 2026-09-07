import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  Filter,
  Loader2,
  Plus,
  Search,
  UserRound,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { Fab } from "@/components/Fab";
import { cn } from "@/lib/utils";
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
  const [classFilter, setClassFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

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

  // Class filter options derive from the students' own class memberships.
  const classCounts = new Map<string, { name: string; count: number }>();
  for (const student of students) {
    for (const item of student.classes ?? []) {
      const entry = classCounts.get(item.id);
      classCounts.set(item.id, {
        name: item.name,
        count: (entry?.count ?? 0) + 1,
      });
    }
  }
  const unassignedCount = students.filter(
    (student) => (student.classes ?? []).length === 0,
  ).length;
  const classFilterOptions = [
    { value: "all", label: "Tất cả", count: students.length },
    ...[...classCounts.entries()]
      .sort((a, b) => a[1].name.localeCompare(b[1].name, "vi"))
      .map(([id, entry]) => ({
        value: id,
        label: entry.name,
        count: entry.count,
      })),
    ...(unassignedCount > 0
      ? [{ value: "none", label: "Chưa có lớp", count: unassignedCount }]
      : []),
  ];

  const filteredStudents = students.filter((student) => {
    const matchesClass =
      classFilter === "all" ||
      (classFilter === "none"
        ? (student.classes ?? []).length === 0
        : (student.classes ?? []).some((item) => item.id === classFilter));
    const matchesSearch = student.name
      .toLocaleLowerCase("vi")
      .includes(search.trim().toLocaleLowerCase("vi"));
    return matchesClass && matchesSearch;
  });
  const activeFilterLabel =
    classFilterOptions.find((option) => option.value === classFilter)?.label ?? "";

  return (
    <MobileShell>
      <PageHeader title="Học sinh" action={<UserAvatar />} />
      <Fab onClick={() => navigate("/students/new")} label="Thêm học sinh" />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Lọc theo lớp"
            aria-expanded={filterOpen}
            className={cn(
              "relative min-h-11 min-w-11 shrink-0 rounded-2xl",
              classFilter !== "all" &&
                "border-primary bg-primary/10 text-primary",
              filterOpen && "border-primary text-primary",
            )}
            onClick={() => setFilterOpen((open) => !open)}
          >
            <Filter size={17} />
            {classFilter !== "all" && (
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary"
              />
            )}
          </Button>
        </div>
        {filterOpen && students.length > 0 && (
          <div
            role="listbox"
            aria-label="Lọc theo lớp"
            className="mb-4 space-y-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
          >
            {classFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={classFilter === option.value}
                onClick={() => {
                  setClassFilter(option.value);
                  setFilterOpen(false);
                }}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded-xl p-2.5 text-left text-sm font-semibold transition-colors",
                  classFilter === option.value
                    ? "bg-primary/10 text-primary"
                    : "text-slate-700 hover:bg-slate-50",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.count != null && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {option.count}
                  </span>
                )}
                {classFilter === option.value && <Check size={16} />}
              </button>
            ))}
          </div>
        )}
        {classFilter !== "all" && (
          <button
            type="button"
            onClick={() => setClassFilter("all")}
            className="mb-4 flex min-h-9 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-xs font-semibold text-primary"
            aria-label="Bỏ bộ lọc lớp"
          >
            Lớp: {activeFilterLabel}
            <span aria-hidden>✕</span>
          </button>
        )}
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
            students={filteredStudents}
            onAdd={() => navigate("/students/new")}
            hasAnyStudents={students.length > 0}
          />
        )}
      </main>
    </MobileShell>
  );
}

function StudentsGrid({
  students,
  onAdd,
  hasAnyStudents,
}: {
  students: Student[];
  onAdd: () => void;
  hasAnyStudents: boolean;
}) {
  if (students.length === 0) {
    return hasAnyStudents ? (
      <EmptyState
        icon={<UserRound size={28} />}
        title="Không tìm thấy"
        description="Thử đổi từ khóa tìm kiếm hoặc bộ lọc lớp."
      />
    ) : (
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
