import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Check,
  Loader2,
  Pencil,
  Plus,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMonthLabel, formatVnd } from "../lib/format";
import { Toast } from "../components/Toast";
import { MobileShell } from "../layout/MobileShell";
import { UserAvatar } from "../layout/UserAvatar";
import { MarkTaughtSheet } from "../students/MarkTaughtSheet";
import { API } from "../lib/api";

type Teacher = { id: string; email: string; fullName: string | null };
type Student = {
  id: string;
  name: string;
  classes?: { pricingMode?: string }[];
};
type TutorClass = {
  id: string;
  name: string;
  defaultPriceVnd: number | null;
  autoSchedule?: boolean;
  schedules?: { weekday: number; startTime: string; endTime: string }[];
  students: Student[];
};
type SessionStatus = "unconfirmed" | "taught" | "cancelled";
type TeachingSession = {
  id: string;
  studentId: string;
  studentName: string;
  classId: string | null;
  className: string | null;
  taughtAt: string;
  priceVnd: number;
  status: SessionStatus;
  note: string | null;
};
type StudentDayGroup = {
  studentId: string;
  studentName: string;
  sessions: TeachingSession[];
};
// Fixed-schedule slot drawn on the calendar for a future date — not in the
// DB until the teacher confirms it ("Xác nhận đã dạy" creates real sessions).
type VirtualSlot = {
  classId: string;
  className: string;
  startTime: string;
  endTime: string;
  priceVnd: number;
  studentCount: number;
};
type DashboardCalendar = {
  teacher: Teacher;
  students: Student[];
  sessions: TeachingSession[];
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

export function SchedulePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
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
  const [confirmingSlot, setConfirmingSlot] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/dashboard/calendar`, {
      });
      if (!response.ok) throw new Error("Không thể tải dashboard.");
      const data: DashboardCalendar = await response.json();
      setStudents(data.students);
      setSessions(data.sessions);
      const classesResponse = await fetch(`${API}/classes`, {
      });
      if (classesResponse.ok) setClasses(await classesResponse.json());
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
  const todaySessions = sessionsByDate.get(dateKey(new Date())) ?? [];
  const selectedGroups = useMemo(
    () => groupAgenda(selectedSessions),
    [selectedSessions],
  );
  const selectedVirtual = useMemo(
    () => virtualSlotsForDate(selectedDate, classes, sessions),
    [selectedDate, classes, sessions],
  );
  const selectedLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(selectedDate);

  // Confirms a fixed-schedule slot: backend creates one taught session per
  // enrolled student at the slot time. The virtual dot disappears as soon as
  // the day has a real session for that class.
  async function confirmSlot(classId: string, date: Date) {
    setConfirmingSlot(classId);
    try {
      const response = await fetch(
        `${API}/classes/${classId}/sessions/confirm-slot`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ date: dateKey(date) }),
        },
      );
      if (!response.ok) {
        const detail = await response.text();
        setError(friendlyError(detail, "Không thể xác nhận buổi dạy. Vui lòng thử lại."));
        return;
      }
      setToast("Đã xác nhận buổi dạy — học phí đã được tính");
      await loadDashboard();
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setConfirmingSlot(null);
    }
  }

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
    // Default to the class's fixed slot for this weekday; fall back to the
    // current clock time only for classes without a matching schedule.
    const slot = selectedClass.schedules?.find(
      (item) => item.weekday === selectedDate.getDay(),
    );
    if (slot) {
      const [hour, minute] = slot.startTime.split(":").map(Number);
      taughtAt.setHours(hour, minute, 0, 0);
    } else {
      taughtAt.setHours(new Date().getHours(), new Date().getMinutes(), 0, 0);
    }
    try {
      const response = await fetch(`${API}/students/${student.id}/sessions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taughtAt: taughtAt.toISOString(),
          // Pin the class explicitly — students in multiple classes would
          // otherwise produce a class-less session that tuition can't see.
          classId: selectedClass.id,
          priceVnd:
            selectedClass.defaultPriceVnd == null
              ? undefined
              : Number(selectedClass.defaultPriceVnd),
          // Recording from the calendar = the lesson happened.
          status: "taught",
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        setError(friendlyError(detail, "Không thể ghi nhận buổi học. Vui lòng thử lại."));
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
    });
  }

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">Lịch dạy</h1>
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
                    (sessionsByDate.get(key)?.length ?? 0) > 0 ||
                    virtualSlotsForDate(day, classes, sessions).length > 0;
                  const selected = key === dateKey(selectedDate);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => openAgenda(day)}
                      className={`relative min-h-9 rounded-xl border p-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary sm:min-h-10 ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-violet-200"
                          : "border-transparent hover:bg-slate-100"
                      } ${sameMonth(day, month) ? "" : "text-muted-foreground opacity-40"}`}
                      aria-pressed={selected}
                    >
                      <span className="block font-semibold">
                        {day.getDate()}
                      </span>
                      {hasSessions && (
                        <span
                          aria-hidden
                          className={`absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${selected ? "bg-white" : "bg-violet-600"}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4 rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
          <CardHeader className="flex-row items-center justify-between border-b border-slate-100 p-4 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck size={18} className="text-primary" />
              Hôm nay
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {todaySessions.length} buổi
            </span>
          </CardHeader>
          <CardContent className="p-3">
            {todaySessions.length === 0 ? (
              <p className="p-2 text-center text-sm text-muted-foreground">
                Không có buổi dạy nào hôm nay.
              </p>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {todaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex min-h-12 items-center gap-3 rounded-xl px-2 transition-colors hover:bg-slate-50"
                  >
                    <span className="w-14 shrink-0 text-sm font-black text-primary">
                      {new Intl.DateTimeFormat("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(session.taughtAt))}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {session.studentName}
                    </span>
                    {session.status !== "unconfirmed" && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[session.status].className}`}
                      >
                        {STATUS_BADGE[session.status].label}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-9"
                      onClick={() =>
                        startEditSession(session, session.studentName)
                      }
                    >
                      <Pencil size={14} />
                      Sửa
                    </Button>
                  </div>
                ))}
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
        slotDate={selectedDate}
        groups={selectedGroups}
        virtualSlots={selectedVirtual}
        confirmingSlot={confirmingSlot}
        onConfirmSlot={(classId) => void confirmSlot(classId, selectedDate)}
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
          onSaved={(message) => {
            setSelectedStudent(null);
            setEditingSession(null);
            setToast(message);
            void loadDashboard();
          }}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </MobileShell>
  );
}

// Backend errors arrive as `{statusCode, message: "<code>"}` JSON — turn
// known codes into Vietnamese, fall back to the raw text otherwise.
const FRIENDLY_ERRORS: Record<string, string> = {
  future_session_not_allowed:
    "Buổi này chưa đến giờ — quay lại xác nhận sau khi dạy xong nhé.",
  slot_not_found: "Lớp không có lịch dạy trong ngày này.",
};

function friendlyError(detail: string, fallback: string) {
  try {
    const code = JSON.parse(detail).message as string | undefined;
    if (code && FRIENDLY_ERRORS[code]) return FRIENDLY_ERRORS[code];
  } catch {
    // plain text error — keep as-is
  }
  return detail || fallback;
}

function groupAgenda(sessions: TeachingSession[]) {
  const grouped = new Map<string, StudentDayGroup>();
  for (const session of sessions) {
    const existing = grouped.get(session.studentId);
    if (existing) {
      existing.sessions.push(session);
      continue;
    }
    grouped.set(session.studentId, {
      studentId: session.studentId,
      studentName: session.studentName,
      sessions: [session],
    });
  }
  return [...grouped.values()].sort((left, right) =>
    left.studentName.localeCompare(right.studentName, "vi"),
  );
}

// Draws fixed-schedule slots as virtual agenda entries for a date. Only
// future dates (and today) — past lessons are recorded manually if needed.
// Hidden for a class that already has any real session that day (including
// cancelled ones — recording a change replaces the virtual slot).
function virtualSlotsForDate(
  date: Date,
  classes: TutorClass[],
  sessions: TeachingSession[],
): VirtualSlot[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return [];
  const weekday = date.getDay();
  const key = dateKey(date);
  const classesWithSession = new Set(
    sessions
      .filter(
        (session) =>
          session.classId && dateKey(new Date(session.taughtAt)) === key,
      )
      .map((session) => session.classId as string),
  );
  const slots: VirtualSlot[] = [];
  for (const klass of classes) {
    if (!klass.autoSchedule || classesWithSession.has(klass.id)) continue;
    for (const slot of klass.schedules ?? []) {
      if (slot.weekday !== weekday) continue;
      slots.push({
        classId: klass.id,
        className: klass.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        priceVnd: klass.defaultPriceVnd ?? 0,
        studentCount: klass.students.length,
      });
    }
  }
  return slots.sort((left, right) =>
    left.startTime.localeCompare(right.startTime),
  );
}

const STATUS_BADGE: Record<SessionStatus, { label: string; className: string }> = {
  unconfirmed: {
    label: "Chưa xác nhận",
    className: "bg-slate-100 text-slate-600",
  },
  taught: {
    label: "Đã dạy",
    className: "bg-emerald-100 text-emerald-700",
  },
  cancelled: {
    label: "Không dạy",
    className: "bg-rose-100 text-rose-700",
  },
};

function DayAgendaDialog({
  open,
  onOpenChange,
  selectedLabel,
  slotDate,
  groups,
  virtualSlots,
  confirmingSlot,
  onConfirmSlot,
  onCreate,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLabel: string;
  slotDate: Date;
  groups: StudentDayGroup[];
  virtualSlots: VirtualSlot[];
  confirmingSlot: string | null;
  onConfirmSlot: (classId: string) => void;
  onCreate: () => void;
  onEdit: (session: TeachingSession, studentName: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">{selectedLabel}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[65dvh] space-y-3 overflow-y-auto pr-1">
          {groups.length === 0 && virtualSlots.length === 0 ? (
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
            <>
              {virtualSlots.map((slot) => (
                <VirtualSlotCard
                  key={slot.classId}
                  slot={slot}
                  // Confirm only allowed once the scheduled time has arrived
                  // (same 5-minute clock-skew allowance as the backend).
                  canConfirm={
                    new Date(`${dateKey(slotDate)}T${slot.startTime}:00`) <=
                    new Date(Date.now() + 5 * 60_000)
                  }
                  busy={confirmingSlot === slot.classId}
                  onConfirm={() => onConfirmSlot(slot.classId)}
                />
              ))}
              {groups.map((group) => {
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
                        {group.sessions.length} buổi dạy
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
                      <SessionCard
                        key={session.id}
                        session={session}
                        onEdit={() => onEdit(session, group.studentName)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
            </>
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

function VirtualSlotCard({
  slot,
  canConfirm,
  busy,
  onConfirm,
}: {
  slot: VirtualSlot;
  canConfirm: boolean;
  busy: boolean;
  onConfirm: () => void;
}) {
  return (
    <article className="rounded-2xl border border-dashed border-violet-300 bg-violet-50/50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-800">
            {slot.className}
          </p>
          <p className="text-xs text-muted-foreground">
            {slot.startTime}–{slot.endTime} · {slot.studentCount} học sinh
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            aria-hidden
            className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700"
          >
            Dự kiến
          </span>
          <Button
            type="button"
            size="sm"
            className="min-h-11 rounded-xl"
            disabled={busy || !canConfirm}
            onClick={onConfirm}
          >
            {busy ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <Check size={15} />
            )}
            {canConfirm ? "Đã dạy" : "Chưa đến giờ"}
          </Button>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {slot.priceVnd > 0
          ? `Tự động tính ${formatVnd(slot.priceVnd)}/buổi cho từng học sinh khi xác nhận`
          : "Chưa đặt giá lớp — xác nhận sẽ tạo buổi 0 ₫"}
      </p>
    </article>
  );
}

function SessionCard({
  session,
  onEdit,
}: {
  session: TeachingSession;
  onEdit: () => void;
}) {
  const cancelled = session.status === "cancelled";
  const taught = session.status === "taught";

  return (
    <article
      className={`rounded-2xl border p-3 transition-colors ${
        cancelled
          ? "border-rose-100 bg-rose-50/60"
          : taught
            ? "border-emerald-100 bg-emerald-50/60"
            : "border-slate-100 bg-violet-50"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-sm font-bold ${cancelled ? "text-slate-500 line-through" : ""}`}
          >
            {new Intl.DateTimeFormat("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(session.taughtAt))}
          </p>
          <p className="text-xs text-muted-foreground">
            {STATUS_BADGE[session.status].label}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p
            className={`text-sm font-bold ${cancelled ? "text-slate-400 line-through" : ""}`}
          >
            {formatVnd(session.priceVnd)}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={onEdit}
          >
            <Pencil size={15} />
            Sửa
          </Button>
        </div>
      </div>

      {session.note && (
        <p className="mt-2 rounded-xl bg-white/70 p-2.5 text-sm text-slate-700">
          {session.note}
        </p>
      )}
    </article>
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
