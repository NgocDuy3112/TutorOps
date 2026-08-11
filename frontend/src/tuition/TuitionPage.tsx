import { useEffect, useState } from "react";
import { Loader2, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatVnd } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";
import { PaymentDialog } from "../payments/PaymentDialog";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type Student = { id: string; name: string };
type PaymentSummary = { totalDue: number; totalPaid: number; balance: number };
type TuitionRow = { student: Student; summary: PaymentSummary };

export function TuitionPage() {
  const [rows, setRows] = useState<TuitionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState<TuitionRow | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const studentsResponse = await fetch(`${API}/students`, { credentials: "include" });
      if (!studentsResponse.ok) throw new Error("Không thể tải học phí.");
      const students: Student[] = await studentsResponse.json();
      const summaries = await Promise.all(
        students.map(async (student) => {
          const response = await fetch(`${API}/students/${student.id}/payments`, { credentials: "include" });
          if (!response.ok) throw new Error("Không thể tải công nợ.");
          return { student, summary: (await response.json()) as PaymentSummary };
        }),
      );
      setRows(summaries.sort((left, right) => right.summary.balance - left.summary.balance));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);
  const totalDue = rows.reduce((sum, row) => sum + Number(row.summary.totalDue), 0);
  const totalPaid = rows.reduce((sum, row) => sum + Number(row.summary.totalPaid), 0);
  const balance = totalDue - totalPaid;

  return (
    <MobileShell>
      <PageHeader title="Học phí" action={<UserAvatar />} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {loading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={17} />Đang tải học phí...</p>}
        {error && <Card className="border-red-100 bg-red-50"><CardContent role="alert" className="flex flex-col gap-3 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><Button type="button" variant="outline" className="min-h-11 bg-white" onClick={() => void load()}>Tải lại</Button></CardContent></Card>}
        {!loading && !error && <div className="space-y-4">
          <Card className="rounded-3xl bg-primary text-primary-foreground shadow-sm shadow-violet-200/60"><CardContent className="grid gap-4 p-5 sm:grid-cols-3"><Summary label="Cần thu" value={formatVnd(totalDue)} /><Summary label="Đã thu" value={formatVnd(totalPaid)} /><Summary label="Còn lại" value={formatVnd(balance)} /></CardContent></Card>
          {rows.length === 0 ? <Card className="border-dashed"><CardContent className="p-10 text-center text-sm text-muted-foreground">Chưa có học sinh.</CardContent></Card> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.map((row) => <Card key={row.student.id} className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70"><CardContent className="p-4"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-primary"><Wallet size={20} /></span><div className="min-w-0 flex-1"><h2 className="truncate font-bold">{row.student.name}</h2><p className="mt-2 text-xs text-muted-foreground">Cần thu {formatVnd(row.summary.totalDue)} · Đã thu {formatVnd(row.summary.totalPaid)}</p><p className={`mt-2 text-lg font-bold ${row.summary.balance > 0 ? "text-amber-700" : "text-emerald-700"}`}>{row.summary.balance > 0 ? `Còn nợ ${formatVnd(row.summary.balance)}` : row.summary.balance < 0 ? `Đóng dư ${formatVnd(-row.summary.balance)}` : "Đã đóng đủ"}</p></div></div><Button type="button" className="mt-4 min-h-11 w-full rounded-2xl" onClick={() => setPaying(row)}><Plus size={16} />Ghi nhận thanh toán</Button></CardContent></Card>)}</div>}
        </div>}
      </main>
      <PaymentDialog student={paying?.student ?? null} balance={paying?.summary.balance ?? 0} onOpenChange={(open) => !open && setPaying(null)} onSaved={() => { setPaying(null); void load(); }} />
    </MobileShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div><p className="text-sm text-primary-foreground/75">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>;
}
