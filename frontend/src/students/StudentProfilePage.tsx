import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Phone,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatVnd } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";
import { MarkTaughtSheet } from "./MarkTaughtSheet";

type Student = {
  id: string;
  name: string;
  parentName: string | null;
  parentPhone: string | null;
  defaultPriceVnd: number;
};

type Session = {
  id: string;
  taughtAt: string;
  priceVnd: number;
  note: string | null;
};

type Tab = "overview" | "sessions";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function StudentProfilePage({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [studentsResponse, sessionsResponse] = await Promise.all([
        fetch(`${API}/students`, { credentials: "include" }),
        fetch(`${API}/students/${studentId}/sessions`, {
          credentials: "include",
        }),
      ]);
      const students = await studentsResponse.json();
      const sessionsBody = await sessionsResponse.json();
      setStudent(
        students.find((item: Student) => item.id === studentId) ?? null,
      );
      setSessions(sessionsBody);
      setLoading(false);
    }
    void load();
  }, [studentId]);

  if (loading)
    return <p className="p-6 text-sm text-muted-foreground">Đang tải...</p>;
  if (!student)
    return <p className="p-6 text-sm text-red-600">Không tìm thấy học sinh.</p>;

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
      <main className="mx-auto max-w-3xl px-4 py-5">
        <ProfileTabs activeTab={tab} onChange={setTab} />
        {tab === "overview" && (
          <OverviewTab
            student={student}
            sessions={sessions}
            onMarkTaught={() => setShowSessionForm(true)}
          />
        )}
        {tab === "sessions" && <SessionsTab sessions={sessions} />}
      </main>
      {showSessionForm && (
        <MarkTaughtSheet
          student={student}
          onClose={() => setShowSessionForm(false)}
          onSaved={() => {
            setShowSessionForm(false);
            window.location.reload();
          }}
        />
      )}
    </MobileShell>
  );
}

function ProfileTabs({
  activeTab,
  onChange,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Tổng quan" },
    { key: "sessions", label: "Buổi dạy" },
  ];

  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
      {tabs.map((tab) => (
        <Button
          key={tab.key}
          type="button"
          variant={activeTab === tab.key ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}

function OverviewTab({
  student,
  sessions,
  onMarkTaught,
}: {
  student: Student;
  sessions: Session[];
  onMarkTaught: () => void;
}) {
  const total = sessions.reduce(
    (sum, session) => sum + Number(session.priceVnd),
    0,
  );

  return (
    <div className="space-y-4 pt-5">
      <Button
        type="button"
        onClick={onMarkTaught}
        className="h-auto w-full justify-start rounded-xl px-4 py-3 text-left"
      >
        <span className="grid size-9 place-items-center rounded-lg bg-white/15">
          <CalendarCheck size={19} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold">Đã dạy hôm nay</span>
          <span className="mt-0.5 block text-xs text-primary-foreground/80">
            Tự lấy giá mặc định của học sinh
          </span>
        </span>
        <ChevronRight size={18} />
      </Button>

      <Card>
        <CardHeader className="p-4 pb-0">
          <h2 className="flex items-center gap-2 font-bold">
            <UserRound size={18} className="text-primary" />
            Thông tin liên hệ
          </h2>
        </CardHeader>
        <CardContent className="p-4">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Phụ huynh</dt>
              <dd className="text-right font-medium">
                {student.parentName || "Chưa cập nhật"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="flex items-center gap-1 text-muted-foreground">
                <Phone size={14} />
                Điện thoại
              </dt>
              <dd className="text-right font-medium">
                {student.parentPhone || "Chưa cập nhật"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between p-4 pb-0">
          <h2 className="font-bold">Buổi học gần đây</h2>
        </CardHeader>
        <CardContent className="p-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có buổi học.</p>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 3).map((session) => (
                <div
                  key={session.id}
                  className="flex justify-between border-b pb-3 text-sm last:border-0 last:pb-0"
                >
                  <span>
                    {new Date(session.taughtAt).toLocaleDateString("vi-VN")}
                  </span>
                  <strong>{formatVnd(session.priceVnd)}</strong>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-bold">Tổng tiền buổi đã dạy</h2>
          <p className="mt-3 text-2xl font-bold text-amber-600">
            {formatVnd(total)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Chưa bao gồm các khoản đã thu
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SessionsTab({ sessions }: { sessions: Session[] }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const monthStart = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1,
  );
  const firstCell = new Date(monthStart);
  firstCell.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7));
  const days = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(firstCell);
    date.setDate(firstCell.getDate() + index);
    return date;
  });
  const sessionDates = new Set(
    sessions.map((session) => new Date(session.taughtAt).toDateString()),
  );
  const selectedSessions = sessions.filter(
    (session) =>
      new Date(session.taughtAt).toDateString() === selectedDate.toDateString(),
  );
  const selectedTotal = selectedSessions.reduce(
    (sum, session) => sum + Number(session.priceVnd),
    0,
  );

  function moveMonth(direction: -1 | 1) {
    setSelectedDate(
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + direction,
        1,
      ),
    );
  }

  return (
    <section className="space-y-4 pt-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => moveMonth(-1)}
            >
              ‹
            </Button>
            <div className="text-center">
              <h2 className="flex items-center justify-center gap-2 font-bold">
                <CalendarDays size={18} className="text-primary" />
                {selectedDate.toLocaleDateString("vi-VN", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Chọn ngày để xem buổi đã dạy
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => moveMonth(1)}
            >
              ›
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-muted-foreground">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {days.map((date) => {
              const isCurrentMonth =
                date.getMonth() === selectedDate.getMonth();
              const isSelected =
                date.toDateString() === selectedDate.toDateString();
              const hasSession = sessionDates.has(date.toDateString());
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`relative aspect-square rounded-xl text-sm font-semibold transition ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isCurrentMonth
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground/40"
                  }`}
                >
                  {date.getDate()}
                  {hasSession && (
                    <span
                      className={`absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${
                        isSelected ? "bg-white" : "bg-emerald-500"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-0">
          <h3 className="font-bold">
            {selectedDate.toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>
          <p className="text-xs text-muted-foreground">
            {selectedSessions.length} buổi ·{" "}
            {formatVnd(selectedTotal)}
          </p>
        </CardHeader>
        <CardContent className="p-4">
          {selectedSessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có buổi dạy trong ngày này.
            </p>
          ) : (
            <div className="space-y-4">
              {selectedSessions.map((session, index) => (
                <article key={session.id} className="relative flex gap-3 pl-5">
                  <span className="absolute left-0 top-1 size-3 rounded-full bg-primary ring-4 ring-indigo-50" />
                  {index < selectedSessions.length - 1 && (
                    <span className="absolute bottom-0 left-[5px] top-5 w-px bg-indigo-100" />
                  )}
                  <div className="flex-1 rounded-xl bg-muted p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">
                          {new Date(session.taughtAt).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {session.note || "Buổi dạy"}
                        </p>
                      </div>
                      <strong className="whitespace-nowrap text-sm">
                        {formatVnd(session.priceVnd)}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
