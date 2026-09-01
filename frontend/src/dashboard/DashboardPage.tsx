import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMonthLabel, formatVnd } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";
import { UserAvatar } from "../layout/UserAvatar";
import { MarkTaughtSheet } from "../students/MarkTaughtSheet";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type Teacher = { id: string; email: string; fullName: string | null };
type Student = { id: string; name: string; defaultPriceVnd: number };
type TutorClass = {
  id: string;
  name: string;
  defaultPriceVnd: number | null;
  students: Student[];
};
type TeachingSession = {
  id: string;
  studentId: string;
  studentName: string;
  taughtAt: string;
  priceVnd: number;
  note: string | null;
};
type AssignmentStudent = { id: string; name: string; status: string };
type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  studentCount: number;
  students: AssignmentStudent[];
};
type StudentDayGroup = {
  studentId: string;
  studentName: string;
  sessions: TeachingSession[];
  assignments: Assignment[];
};
type DashboardCalendar = {
  teacher: Teacher;
  students: Student[];
  sessions: TeachingSession[];
  assignments: Assignment[];
};

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sameMonth = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth();

const deadlineColor = (dueAt: string) => {
  const due = new Date(dueAt).getTime();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  if (due < now - oneDay) return "bg-red-500";
  if (due < now) return "bg-orange-500";
  if (due - now <= oneDay) return "bg-amber-400";
  return "bg-emerald-500";
};

const deadlineTextColor = (dueAt: string) => {
  const due = new Date(dueAt).getTime();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  if (due < now - oneDay) return "text-red-600";
  if (due < now) return "text-orange-600";
  if (due - now <= oneDay) return "text-amber-600";
  return "text-emerald-600";
};

export function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [choosingStudent, setChoosingStudent] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TutorClass | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [editingSession, setEditingSession] = useState<TeachingSession | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/dashboard/calendar`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Không thể tải dashboard.");
      const data: DashboardCalendar = await response.json();
      setStudents(data.students);
      setSessions(data.sessions);
      const classesResponse = await fetch(`${API}/classes`, {
        credentials: "include",
      });
      if (classesResponse.ok) setClasses(await classesResponse.json());
      setAssignments(data.assignments);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const sessionsByDate = useMemo(() => {
    const grouped = new Map<string, TeachingSession[]>();
    for (const session of sessions) {
      const key = dateKey(new Date(session.taughtAt));
      grouped.set(key, [...(grouped.get(key) ?? []), session]);
    }
    return grouped;
  }, [sessions]);

  const assignmentsByDate = useMemo(() => {
    const grouped = new Map<string, Assignment[]>();
    for (const assignment of assignments) {
      if (!assignment.dueAt) continue;
      const key = dateKey(new Date(assignment.dueAt));
      grouped.set(key, [...(grouped.get(key) ?? []), assignment]);
    }
    return grouped;
  }, [assignments]);

  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);

  const selectedSessions = sessionsByDate.get(dateKey(selectedDate)) ?? [];
  const selectedAssignments =
    assignmentsByDate.get(dateKey(selectedDate)) ?? [];
  const selectedTotal = selectedSessions.reduce(
    (sum, session) => sum + Number(session.priceVnd),
    0,
  );
  const selectedGroups = useMemo(
    () => groupAgenda(selectedSessions, selectedAssignments),
    [selectedAssignments, selectedSessions],
  );
  const selectedLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(selectedDate);

  function shiftMonth(deltaMonths: number) {
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + deltaMonths, 1),
    );
  }

  function openAgenda(day: Date) {
    setSelectedDate(day);
    setAgendaOpen(true);
  }

  function startCreateSession() {
    setAgendaOpen(false);
    setSelectedClass(null);
    setChoosingStudent(true);
  }

  async function chooseStudent(student: Student) {
    if (!selectedClass) return;
    setCreatingSession(true);
    const taughtAt = new Date(selectedDate);
    taughtAt.setHours(new Date().getHours(), new Date().getMinutes(), 0, 0);
    try {
      const response = await fetch(`${API}/students/${student.id}/sessions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          taughtAt: taughtAt.toISOString(),
          priceVnd:
            selectedClass.defaultPriceVnd == null
              ? undefined
              : Number(selectedClass.defaultPriceVnd),
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        setError(detail || "Không thể ghi nhận buổi học. Vui lòng thử lại.");
        return;
      }
      setChoosingStudent(false);
      setSelectedClass(null);
      setSelectedStudent(null);
      void loadDashboard();
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setCreatingSession(false);
    }
  }

  function startEditSession(session: TeachingSession, studentName: string) {
    setAgendaOpen(false);
    setEditingSession(session);
    setSelectedStudent({
      id: session.studentId,
      name: studentName,
      defaultPriceVnd: session.priceVnd,
    });
  }

  return (
    <MobileShell>
      <header className="bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <UserAvatar />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5">
        <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
          <CardHeader className="space-y-3 border-b border-slate-100 p-4">
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Tháng trước"
                className="size-11 shrink-0 rounded-2xl"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft size={18} />
              </Button>
              <p className="text-lg font-black tracking-tight text-slate-950">
                {formatMonthLabel(month)}
              </p>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Tháng sau"
                className="size-11 shrink-0 rounded-2xl"
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {loading ? (
              <CalendarSkeleton />
            ) : (
              <div className="grid grid-cols-7 gap-1 text-center">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                  <div
                    key={day}
                    className="py-2 text-xs font-bold text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
                {calendarDays.map((day) => {
                  const key = dateKey(day);
                  const hasSessions =
                    (sessionsByDate.get(key)?.length ?? 0) > 0;
                  const dayAssignments = assignmentsByDate.get(key) ?? [];
                  const selected = key === dateKey(selectedDate);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => openAgenda(day)}
                      className={`min-h-12 rounded-2xl border p-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary sm:min-h-14 ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-violet-200"
                          : "border-transparent hover:bg-slate-100"
                      } ${sameMonth(day, month) ? "" : "text-muted-foreground opacity-40"}`}
                      aria-pressed={selected}
                    >
                      <span className="block font-semibold">
                        {day.getDate()}
                      </span>
                      <span className="mt-1 flex justify-center gap-1">
                        {hasSessions && (
                          <span
                            className={`block size-1.5 rounded-full ${selected ? "bg-white" : "bg-violet-600"}`}
                          />
                        )}
                        {dayAssignments.slice(0, 2).map((assignment) => (
                          <span
                            key={assignment.id}
                            className={`block size-1.5 rounded-full ${deadlineColor(assignment.dueAt!)}`}
                          />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="mt-4 border-red-200 bg-red-50">
            <CardContent className="flex flex-col gap-3 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 bg-white"
                onClick={() => void loadDashboard()}
              >
                Tải lại
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <DayAgendaDialog
        open={agendaOpen}
        onOpenChange={setAgendaOpen}
        selectedLabel={selectedLabel}
        selectedTotal={selectedTotal}
        groups={selectedGroups}
        onCreate={startCreateSession}
        onEdit={startEditSession}
      />

      <Dialog
        open={choosingStudent}
        onOpenChange={(open) => {
          setChoosingStudent(open);
          if (!open) setSelectedClass(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chọn lớp và học sinh</DialogTitle>
            <DialogDescription>
              Chọn lớp, danh sách học sinh sẽ hiện ngay bên dưới.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <div className="max-h-[65dvh] space-y-3 overflow-y-auto">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Lớp</h3>
              {classes.map((tutorClass) => {
                const active = selectedClass?.id === tutorClass.id;
                return (
                  <button
                    key={tutorClass.id}
                    type="button"
                    onClick={() => setSelectedClass(tutorClass)}
                    className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${active ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
                  >
                    <strong className="min-w-0 truncate text-sm">
                      {tutorClass.name}
                    </strong>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {tutorClass.students.length} học sinh
                    </span>
                  </button>
                );
              })}
              {classes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Không có dữ liệu.
                </p>
              )}
            </section>
            {selectedClass && (
              <section className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">
                    Học sinh · {selectedClass.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {selectedClass.students.length} học sinh
                  </span>
                </div>
                {selectedClass.students.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    disabled={creatingSession}
                    onClick={() => void chooseStudent(student)}
                    className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                  >
                    <strong className="min-w-0 truncate text-sm">
                      {student.name}
                    </strong>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      {creatingSession && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      {selectedClass.defaultPriceVnd != null
                        ? formatVnd(selectedClass.defaultPriceVnd)
                        : "Chưa đặt giá"}
                    </span>
                  </button>
                ))}
                {selectedClass.students.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Không có dữ liệu.
                  </p>
                )}
              </section>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedStudent && (
        <MarkTaughtSheet
          student={selectedStudent}
          session={editingSession}
          initialDate={selectedDate}
          onClose={() => {
            setSelectedStudent(null);
            setEditingSession(null);
          }}
          onSaved={() => {
            setSelectedStudent(null);
            setEditingSession(null);
            void loadDashboard();
          }}
        />
      )}
    </MobileShell>
  );
}

function groupAgenda(sessions: TeachingSession[], assignments: Assignment[]) {
  const grouped = new Map<string, StudentDayGroup>();
  const ensureGroup = (studentId: string, studentName: string) => {
    const existing = grouped.get(studentId);
    if (existing) return existing;
    const created: StudentDayGroup = {
      studentId,
      studentName,
      sessions: [],
      assignments: [],
    };
    grouped.set(studentId, created);
    return created;
  };

  for (const session of sessions) {
    ensureGroup(session.studentId, session.studentName).sessions.push(session);
  }
  for (const assignment of assignments) {
    for (const student of assignment.students ?? []) {
      ensureGroup(student.id, student.name).assignments.push(assignment);
    }
    if ((assignment.students ?? []).length === 0) {
      ensureGroup(
        `assignment-${assignment.id}`,
        "Chưa gán học sinh",
      ).assignments.push(assignment);
    }
  }

  return [...grouped.values()].sort((left, right) =>
    left.studentName.localeCompare(right.studentName, "vi"),
  );
}

function DayAgendaDialog({
  open,
  onOpenChange,
  selectedLabel,
  selectedTotal,
  groups,
  onCreate,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLabel: string;
  selectedTotal: number;
  groups: StudentDayGroup[];
  onCreate: () => void;
  onEdit: (session: TeachingSession, studentName: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">{selectedLabel}</DialogTitle>
          <DialogDescription>
            Tổng tiền: {formatVnd(selectedTotal)}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65dvh] space-y-3 overflow-y-auto pr-1">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-violet-50 text-primary">
                <CalendarOff size={24} />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-700">
                Chưa có hoạt động nào
              </p>
              <p className="mt-1 max-w-55 text-xs text-muted-foreground">
                Bấm nút bên dưới để ghi nhận buổi dạy trong ngày này.
              </p>
            </div>
          ) : (
            groups.map((group) => {
              const groupTotal = group.sessions.reduce(
                (sum, session) => sum + Number(session.priceVnd),
                0,
              );
              return (
                <section
                  key={group.studentId}
                  className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate font-bold text-slate-800">
                        {group.studentName}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {group.sessions.length} buổi dạy ·{" "}
                        {group.assignments.length} deadline
                      </p>
                    </div>
                    {groupTotal > 0 && (
                      <p className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">
                        {formatVnd(groupTotal)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    {group.sessions.map((session) => (
                      <article
                        key={session.id}
                        className="rounded-2xl bg-violet-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-violet-600 text-white">
                              <GraduationCap size={17} />
                            </span>
                            <div className="min-w-0">
                              <h5 className="text-sm font-semibold">
                                Buổi dạy
                              </h5>
                              <p className="text-xs text-muted-foreground">
                                {new Intl.DateTimeFormat("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).format(new Date(session.taughtAt))}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <p className="text-sm font-bold">
                              {formatVnd(session.priceVnd)}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="min-h-11"
                              onClick={() => onEdit(session, group.studentName)}
                            >
                              <Pencil size={15} />
                              Sửa
                            </Button>
                          </div>
                        </div>
                        {session.note && (
                          <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm text-slate-700">
                            {session.note}
                          </p>
                        )}
                      </article>
                    ))}

                    {group.assignments.map((assignment) => (
                      <article
                        key={assignment.id}
                        className="rounded-2xl bg-slate-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 gap-3">
                            <span
                              className={`grid size-9 shrink-0 place-items-center rounded-full text-white ${deadlineColor(assignment.dueAt!)}`}
                            >
                              <BookOpenCheck size={17} />
                            </span>
                            <div className="min-w-0">
                              <h5 className="truncate text-sm font-semibold">
                                {assignment.title}
                              </h5>
                              <p
                                className={`text-xs font-medium ${deadlineTextColor(assignment.dueAt!)}`}
                              >
                                Deadline{" "}
                                {new Intl.DateTimeFormat("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).format(new Date(assignment.dueAt!))}
                              </p>
                            </div>
                          </div>
                          <p className="shrink-0 rounded-full bg-white px-2 py-1 text-xs text-muted-foreground">
                            Bài tập
                          </p>
                        </div>
                        {assignment.description && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {assignment.description}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>

        <Button
          type="button"
          className="min-h-11 w-full rounded-2xl"
          onClick={onCreate}
        >
          <Plus size={16} />
          Ghi nhận buổi dạy
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function CalendarSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={`weekday-${index}`} className="py-2">
            <div className="mx-auto h-3 w-6 rounded bg-slate-200" />
          </div>
        ))}
        {Array.from({ length: 42 }, (_, index) => (
          <div
            key={`day-${index}`}
            className="min-h-12 rounded-xl bg-slate-100 sm:min-h-14"
          />
        ))}
      </div>
    </div>
  );
}
