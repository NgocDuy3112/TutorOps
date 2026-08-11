import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, LogOut, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatVnd } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";
import { MarkTaughtSheet } from "../students/MarkTaughtSheet";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type Student = { id: string; name: string; defaultPriceVnd: number };
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

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sameMonth = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();

const formatMoney = formatVnd;

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

const deadlineBorderColor = (dueAt: string) => {
  const due = new Date(dueAt).getTime();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  if (due < now - oneDay) return "border-red-500";
  if (due < now) return "border-orange-500";
  if (due - now <= oneDay) return "border-amber-400";
  return "border-emerald-500";
};

export function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [choosingStudent, setChoosingStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingSession, setEditingSession] = useState<TeachingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [studentsResponse, sessionsResponse, assignmentsResponse] = await Promise.all([
        fetch(`${API}/students`, { credentials: "include" }),
        fetch(`${API}/sessions`, { credentials: "include" }),
        fetch(`${API}/assignments`, { credentials: "include" }),
      ]);
      if (!studentsResponse.ok || !sessionsResponse.ok || !assignmentsResponse.ok) {
        throw new Error("Không thể tải dashboard.");
      }
      setStudents(await studentsResponse.json());
      setSessions(await sessionsResponse.json());
      setAssignments(await assignmentsResponse.json());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function logout() {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

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
  const selectedAssignments = assignmentsByDate.get(dateKey(selectedDate)) ?? [];
  const selectedTotal = selectedSessions.reduce((sum, session) => sum + session.priceVnd, 0);
  const selectedGroups = useMemo(() => {
    const grouped = new Map<string, StudentDayGroup>();
    const ensureGroup = (studentId: string, studentName: string) => {
      const existing = grouped.get(studentId);
      if (existing) return existing;
      const created: StudentDayGroup = { studentId, studentName, sessions: [], assignments: [] };
      grouped.set(studentId, created);
      return created;
    };

    for (const session of selectedSessions) {
      ensureGroup(session.studentId, session.studentName).sessions.push(session);
    }
    for (const assignment of selectedAssignments) {
      for (const student of assignment.students ?? []) {
        ensureGroup(student.id, student.name).assignments.push(assignment);
      }
      if ((assignment.students ?? []).length === 0) {
        ensureGroup(`assignment-${assignment.id}`, "Chưa gán học sinh").assignments.push(assignment);
      }
    }

    return [...grouped.values()].sort((left, right) => left.studentName.localeCompare(right.studentName, "vi"));
  }, [selectedAssignments, selectedSessions]);
  const selectedLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(selectedDate);
  const monthLabel = new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(month);

  function moveMonth(direction: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  return (
    <MobileShell>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">TutorOps</p>
            <h1 className="mt-1 text-xl font-bold">Tổng quan</h1>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => void logout()} aria-label="Đăng xuất">
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-5 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        <section className="lg:col-span-2">
          <p className="text-sm text-muted-foreground">Dashboard calendar-first</p>
          <h2 className="mt-1 text-2xl font-bold">Lịch dạy tháng</h2>
        </section>

        <Card className="rounded-2xl">
          <CardHeader className="space-y-4 border-b p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-primary" size={21} />
                <h3 className="font-bold capitalize">{monthLabel}</h3>
              </div>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="icon" onClick={() => moveMonth(-1)} aria-label="Tháng trước">
                  <ChevronLeft size={17} />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => moveMonth(1)} aria-label="Tháng sau">
                  <ChevronRight size={17} />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Chọn ngày để xem buổi dạy và deadline bài tập.
            </p>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {loading ? (
              <CalendarSkeleton />
            ) : (
              <div className="grid grid-cols-7 gap-1 text-center">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                  <div key={day} className="py-2 text-xs font-bold text-muted-foreground">{day}</div>
                ))}
                {calendarDays.map((day) => {
                  const key = dateKey(day);
                  const hasSessions = (sessionsByDate.get(key)?.length ?? 0) > 0;
                  const dayAssignments = assignmentsByDate.get(key) ?? [];
                  const selected = key === dateKey(selectedDate);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-12 rounded-xl border p-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary sm:min-h-16 ${
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-transparent hover:bg-accent"
                      } ${sameMonth(day, month) ? "" : "text-muted-foreground opacity-45"}`}
                      aria-pressed={selected}
                    >
                      <span className="block font-semibold">{day.getDate()}</span>
                      <span className="mt-1 flex justify-center gap-1">
                        {hasSessions && (
                          <span className={`block size-1.5 rounded-full ${selected ? "bg-white" : "bg-violet-600"}`} />
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

        <Card className="rounded-2xl">
          <CardHeader className="space-y-4 border-b p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm capitalize text-muted-foreground">{selectedLabel}</p>
                <h3 className="mt-1 text-xl font-bold">{formatMoney(selectedTotal)}</h3>
              </div>
              <Button type="button" size="sm" onClick={() => setChoosingStudent(true)} className="min-h-11 shrink-0">
                <Plus size={16} />
                Buổi dạy
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-violet-600" /> Buổi dạy</span>
              <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> Deadline còn hạn</span>
              <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-red-500" /> Trễ hạn</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <DayPanelSkeleton />
            ) : selectedGroups.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-medium text-slate-700">Ngày này còn trống.</p>
                <p className="mt-1 text-sm text-muted-foreground">Thêm buổi dạy cho ngày đã chọn nếu cần.</p>
                <Button type="button" size="sm" className="mt-4 min-h-11" onClick={() => setChoosingStudent(true)}>
                  <Plus size={16} />
                  Ghi nhận buổi dạy
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {selectedGroups.map((group) => {
                  const groupTotal = group.sessions.reduce((sum, session) => sum + session.priceVnd, 0);
                  return (
                    <section key={group.studentId} className="p-4 sm:p-5">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-slate-800">{group.studentName}</h4>
                          <p className="text-xs text-muted-foreground">
                            {group.sessions.length} buổi dạy · {group.assignments.length} deadline
                          </p>
                        </div>
                        {groupTotal > 0 && <p className="shrink-0 text-sm font-bold">{formatMoney(groupTotal)}</p>}
                      </div>

                      <div className="space-y-3">
                        {group.sessions.map((session) => (
                          <article key={session.id} className="rounded-2xl border border-violet-100 bg-violet-50/40 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 border-l-4 border-violet-600 pl-3">
                                <h5 className="text-sm font-semibold">Buổi dạy</h5>
                                <p className="text-xs text-muted-foreground">
                                  {new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(session.taughtAt))}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <p className="text-sm font-bold">{formatMoney(session.priceVnd)}</p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  aria-label="Sửa buổi dạy"
                                  className="min-h-11"
                                  onClick={() => {
                                    setEditingSession(session);
                                    setSelectedStudent({ id: session.studentId, name: group.studentName, defaultPriceVnd: session.priceVnd });
                                  }}
                                >
                                  <Pencil size={15} />
                                  Sửa
                                </Button>
                              </div>
                            </div>
                            {session.note && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{session.note}</p>}
                          </article>
                        ))}

                        {group.assignments.map((assignment) => (
                          <article key={assignment.id} className={`border-l-4 pl-3 ${deadlineBorderColor(assignment.dueAt!)}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h5 className="text-sm font-semibold">{assignment.title}</h5>
                                <p className={`text-xs font-medium ${deadlineTextColor(assignment.dueAt!)}`}>
                                  Deadline {new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(assignment.dueAt!))}
                                </p>
                              </div>
                              <p className="shrink-0 text-xs text-muted-foreground">Bài tập</p>
                            </div>
                            {assignment.description && <p className="mt-2 text-sm text-muted-foreground">{assignment.description}</p>}
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50 lg:col-span-2">
            <CardContent className="flex flex-col gap-3 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button type="button" variant="outline" size="sm" className="min-h-11 bg-white" onClick={() => void loadDashboard()}>
                Tải lại
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={choosingStudent} onOpenChange={setChoosingStudent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chọn học sinh</DialogTitle>
            <DialogDescription>Chọn học sinh trước khi ghi nhận buổi dạy.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  setChoosingStudent(false);
                  setSelectedStudent(student);
                }}
                className="rounded-xl border p-3 text-left transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <strong className="block text-sm">{student.name}</strong>
                <span className="text-xs text-muted-foreground">{formatMoney(student.defaultPriceVnd)} / buổi</span>
              </button>
            ))}
            {students.length === 0 && <p className="text-sm text-muted-foreground">Chưa có học sinh.</p>}
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
          <div key={`day-${index}`} className="min-h-12 rounded-xl bg-slate-100 sm:min-h-16" />
        ))}
      </div>
    </div>
  );
}

function DayPanelSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={`group-${index}`} className="space-y-3 rounded-2xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-3 w-36 rounded bg-slate-100" />
            </div>
            <div className="h-4 w-20 rounded bg-slate-200" />
          </div>
          <div className="h-16 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
