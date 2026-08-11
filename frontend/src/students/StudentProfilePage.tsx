import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarCheck, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatVnd } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";
import { PaymentDialog } from "../payments/PaymentDialog";
import { MarkTaughtSheet } from "./MarkTaughtSheet";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
type Student = { id: string; name: string; parentName: string | null; parentPhone: string | null; defaultPriceVnd: number };
type Session = { id: string; taughtAt: string; priceVnd: number; note: string | null };
type Assignment = { id: string; title: string; dueAt: string | null; students: { id: string; status: string }[] };
type Payment = { id: string; amountVnd: number; paidAt: string; note: string | null };
type PaymentData = { payments: Payment[]; totalDue: number; totalPaid: number; balance: number };
type Tab = "overview" | "sessions" | "assignments" | "tuition";

export function StudentProfilePage({ studentId }: { studentId: string }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [studentsResponse, sessionsResponse, assignmentsResponse, paymentsResponse] = await Promise.all([
        fetch(`${API}/students`, { credentials: "include" }), fetch(`${API}/students/${studentId}/sessions`, { credentials: "include" }), fetch(`${API}/assignments`, { credentials: "include" }), fetch(`${API}/students/${studentId}/payments`, { credentials: "include" }),
      ]);
      if (![studentsResponse, sessionsResponse, assignmentsResponse, paymentsResponse].every((response) => response.ok)) throw new Error("Không thể tải hồ sơ học sinh.");
      const students: Student[] = await studentsResponse.json();
      setStudent(students.find((item) => item.id === studentId) ?? null);
      setSessions(await sessionsResponse.json()); setAssignments(await assignmentsResponse.json()); setPaymentData(await paymentsResponse.json());
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Có lỗi xảy ra."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [studentId]);
  if (loading) return <p className="p-6 text-sm text-muted-foreground">Đang tải...</p>;
  if (!student) return <p className="p-6 text-sm text-red-600">{error || "Không tìm thấy học sinh."}</p>;
  const studentAssignments = assignments.filter((assignment) => assignment.students.some((item) => item.id === studentId));
  const totalSessions = sessions.reduce((sum, item) => sum + Number(item.priceVnd), 0);

  return <MobileShell><header className="border-b bg-white"><div className="mx-auto max-w-3xl px-4 py-4"><Button asChild variant="link" className="h-auto p-0 text-primary"><Link to="/students"><ArrowLeft size={16} />Học sinh</Link></Button><h1 className="mt-3 text-2xl font-bold">{student.name}</h1><p className="mt-1 text-sm text-muted-foreground">Hồ sơ học sinh</p></div></header><main className="mx-auto max-w-3xl px-4 py-5"><ProfileTabs activeTab={tab} onChange={setTab} />{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{tab === "overview" && <section className="space-y-4 pt-5"><Button type="button" onClick={() => setShowSessionForm(true)} className="min-h-12 w-full justify-start rounded-xl px-4 text-left"><span className="grid size-9 place-items-center rounded-lg bg-white/15"><CalendarCheck size={19} /></span><span className="flex-1"><span className="block text-sm font-bold">Đã dạy hôm nay</span><span className="mt-0.5 block text-xs text-primary-foreground/80">Tự lấy giá mặc định của học sinh</span></span></Button><InfoCard student={student} /><Card><CardContent className="p-4"><h2 className="font-bold">Tổng tiền buổi đã dạy</h2><p className="mt-3 text-2xl font-bold text-amber-600">{formatVnd(totalSessions)}</p><p className="mt-1 text-sm text-muted-foreground">Công nợ hiện tại: {formatVnd(paymentData?.balance ?? 0)}</p></CardContent></Card></section>}{tab === "sessions" && <SessionsTab sessions={sessions} />}{tab === "assignments" && <AssignmentsTab assignments={studentAssignments} />}{tab === "tuition" && <TuitionTab data={paymentData} onRecord={() => setShowPaymentForm(true)} />}</main>{showSessionForm && <MarkTaughtSheet student={student} onClose={() => setShowSessionForm(false)} onSaved={() => { setShowSessionForm(false); void load(); }} />}<PaymentDialog student={showPaymentForm ? student : null} balance={paymentData?.balance ?? 0} onOpenChange={(open) => !open && setShowPaymentForm(false)} onSaved={() => { setShowPaymentForm(false); void load(); }} /></MobileShell>;
}

function ProfileTabs({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) { const tabs: { key: Tab; label: string }[] = [{ key: "overview", label: "Tổng quan" }, { key: "sessions", label: "Buổi dạy" }, { key: "assignments", label: "Bài tập" }, { key: "tuition", label: "Học phí" }]; return <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 sm:grid-cols-4">{tabs.map((item) => <Button key={item.key} type="button" variant={activeTab === item.key ? "secondary" : "ghost"} size="sm" className="min-h-11" onClick={() => onChange(item.key)}>{item.label}</Button>)}</div>; }
function InfoCard({ student }: { student: Student }) { return <Card><CardHeader className="p-4 pb-0"><h2 className="flex items-center gap-2 font-bold"><UserRound size={18} className="text-primary" />Thông tin liên hệ</h2></CardHeader><CardContent className="p-4"><dl className="space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Phụ huynh</dt><dd className="text-right font-medium">{student.parentName || "Chưa cập nhật"}</dd></div><div className="flex justify-between gap-4"><dt className="flex items-center gap-1 text-muted-foreground"><Phone size={14} />Điện thoại</dt><dd className="text-right font-medium">{student.parentPhone || "Chưa cập nhật"}</dd></div></dl></CardContent></Card>; }
function SessionsTab({ sessions }: { sessions: Session[] }) { return <section className="space-y-3 pt-4">{sessions.length === 0 ? <Empty text="Chưa có buổi dạy." /> : sessions.map((item) => <Card key={item.id}><CardContent className="flex justify-between gap-3 p-4 text-sm"><div><strong>{new Date(item.taughtAt).toLocaleString("vi-VN")}</strong><p className="mt-1 text-muted-foreground">{item.note || "Buổi dạy"}</p></div><strong>{formatVnd(item.priceVnd)}</strong></CardContent></Card>)}</section>; }
function AssignmentsTab({ assignments }: { assignments: Assignment[] }) { return <section className="space-y-3 pt-4">{assignments.length === 0 ? <Empty text="Chưa giao bài tập cho học sinh này." /> : assignments.map((item) => { const status = item.students.find((student) => student.id)?.status; return <Card key={item.id}><CardContent className="p-4"><div className="flex justify-between gap-3"><strong>{item.title}</strong><span className="text-sm font-medium text-primary">{status === "submitted" ? "Đã nộp" : "Chờ nộp"}</span></div><p className="mt-1 text-sm text-muted-foreground">{item.dueAt ? `Hạn: ${new Date(item.dueAt).toLocaleString("vi-VN")}` : "Không có hạn nộp"}</p></CardContent></Card>; })}</section>; }
function TuitionTab({ data, onRecord }: { data: PaymentData | null; onRecord: () => void }) { return <section className="space-y-4 pt-4"><Card className="bg-primary text-primary-foreground"><CardContent className="grid gap-3 p-5 sm:grid-cols-3"><div><p className="text-sm text-primary-foreground/75">Cần thu</p><strong>{formatVnd(data?.totalDue ?? 0)}</strong></div><div><p className="text-sm text-primary-foreground/75">Đã thu</p><strong>{formatVnd(data?.totalPaid ?? 0)}</strong></div><div><p className="text-sm text-primary-foreground/75">Còn lại</p><strong>{formatVnd(data?.balance ?? 0)}</strong></div></CardContent></Card><Button type="button" className="min-h-11 w-full" onClick={onRecord}>Ghi nhận thanh toán</Button><h2 className="font-bold">Giao dịch</h2>{data?.payments.length ? data.payments.map((item) => <Card key={item.id}><CardContent className="flex justify-between gap-3 p-4 text-sm"><div><strong>{new Date(item.paidAt).toLocaleDateString("vi-VN")}</strong>{item.note && <p className="mt-1 text-muted-foreground">{item.note}</p>}</div><strong>{formatVnd(item.amountVnd)}</strong></CardContent></Card>) : <Empty text="Chưa có giao dịch." />}</section>; }
function Empty({ text }: { text: string }) { return <Card className="border-dashed"><CardContent className="p-8 text-center text-sm text-muted-foreground">{text}</CardContent></Card>; }
