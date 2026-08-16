import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Download, FileText, Loader2, Pencil, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileShell } from "../layout/MobileShell";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
type FileItem = { id: string; name: string; mimeType: string };
type Student = { id: string; name: string; status: string };
type Submission = {
  id: string;
  submittedAt: string;
  viewedAt: string | null;
  downloadedAt: string | null;
  score: number | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  student: { id: string; name: string } | null;
  files: FileItem[];
};
type Assignment = { id: string; title: string; students: Student[] };

function fileExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function shortFileName(name: string) {
  const extension = fileExtension(name);
  const base = extension ? name.slice(0, -(extension.length + 1)) : name;
  if (base.length <= 8) return name;
  return `${base.slice(0, 8)}${extension ? `.${extension}` : ""}`;
}

export function AssignmentSubmissionsPage() {
  const { assignmentId = "" } = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [items, setItems] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [studentId, setStudentId] = useState("");
  const [score, setScore] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [assignmentsResponse, submissionsResponse] = await Promise.all([
        fetch(`${API}/assignments`, { credentials: "include" }),
        fetch(`${API}/assignments/${assignmentId}/dropbox-submissions`, {
          credentials: "include",
        }),
      ]);
      if (!assignmentsResponse.ok || !submissionsResponse.ok)
        throw new Error("Không thể tải bài nộp.");
      const assignments: Assignment[] = await assignmentsResponse.json();
      setAssignment(assignments.find((item) => item.id === assignmentId) ?? null);
      setItems(await submissionsResponse.json());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [assignmentId]);

  function openReview(item: Submission) {
    setSelected(item);
    setStudentId(item.student?.id ?? "");
    setScore(item.score == null ? "" : String(item.score));
    setReviewNote(item.reviewNote ?? "");
    setReviewError("");
  }

  async function mark(submissionId: string, status: "viewed" | "downloaded") {
    const response = await fetch(
      `${API}/assignments/${assignmentId}/dropbox-submissions/${submissionId}/${status}`,
      { method: "PATCH", credentials: "include" },
    );
    if (!response.ok) return;
    setItems((current) => current.map((item) => item.id === submissionId
      ? { ...item, [status === "viewed" ? "viewedAt" : "downloadedAt"]: new Date().toISOString() }
      : item));
  }

  async function download(submissionId: string, fileId: string) {
    const response = await fetch(`${API}/assignments/${assignmentId}/dropbox-files/${fileId}/url`, {
      credentials: "include",
    });
    if (!response.ok) return;
    const { url } = await response.json();
    await mark(submissionId, "downloaded");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function submitReview(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setReviewError("");
    const response = await fetch(
      `${API}/assignments/${assignmentId}/dropbox-submissions/${selected.id}/review`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ studentId, score: Number(score), reviewNote }),
      },
    );
    if (!response.ok) {
      setSaving(false);
      setReviewError("Không thể lưu điểm. Kiểm tra học sinh và điểm số.");
      return;
    }
    const reviewed = await response.json();
    const student = assignment?.students.find((item) => item.id === studentId) ?? null;
    setItems((current) => current.map((item) => item.id === selected.id
      ? { ...item, ...reviewed, student: student ? { id: student.id, name: student.name } : null }
      : item));
    setSaving(false);
    setSelected(null);
  }

  return (
    <MobileShell>
      <header className="overflow-hidden border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Button asChild variant="link" className="h-auto p-0 text-primary">
            <Link to="/assignments"><ArrowLeft size={16} />Bài tập</Link>
          </Button>
          <h1 className="mt-3 truncate text-2xl font-bold">{assignment?.title || "Bài đã nộp"}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl overflow-hidden px-4 py-6">
        {loading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={17} />Đang tải...</p>
          : error ? <Card className="border-red-100 bg-red-50"><CardContent role="alert" className="p-4 text-sm text-red-700">{error}</CardContent></Card>
          : items.length === 0 ? <Card className="border-dashed"><CardContent className="p-10 text-center text-sm text-muted-foreground">Không có dữ liệu.</CardContent></Card>
          : <div className="min-w-0 space-y-3">{items.map((item) => (
            <article key={item.id} className="w-full min-w-0 overflow-hidden rounded-3xl border bg-white p-3 shadow-sm shadow-slate-100 sm:p-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{item.student?.name ?? "Chưa gán học sinh"}</p><time className="mt-1 block text-xs text-muted-foreground">Nộp {new Date(item.submittedAt).toLocaleString("vi-VN")}</time></div>
                <Button type="button" size="sm" className="min-h-11 shrink-0 rounded-xl" onClick={() => openReview(item)}>
                  {item.reviewedAt ? <Pencil size={16} /> : <Star size={16} />}{item.reviewedAt ? "Sửa điểm" : "Chấm bài"}
                </Button>
              </div>
              {item.reviewedAt && <div className="mt-3 rounded-2xl bg-violet-50 p-3 text-sm text-violet-950"><p className="font-bold">Điểm: {item.score}/10</p>{item.reviewNote && <p className="mt-1 text-violet-800">{item.reviewNote}</p>}</div>}
              <div className="mt-3 grid min-w-0 gap-2 overflow-hidden sm:grid-cols-2">{item.files.map((file) => (
                <button key={file.id} type="button" className="flex min-h-14 w-full min-w-0 items-center gap-2 overflow-hidden rounded-2xl bg-slate-50 p-2.5 text-left transition-colors hover:bg-slate-100" onClick={() => void download(item.id, file.id)}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white text-primary"><FileText size={17} /></span><span className="min-w-0 flex-1 overflow-hidden"><span className="block w-full truncate text-sm font-medium">{shortFileName(file.name)}</span><span className="block text-xs text-muted-foreground">{fileExtension(file.name).toUpperCase() || "FILE"}</span></span><Download size={18} className="shrink-0 text-muted-foreground" />
                </button>))}</div>
              {!item.viewedAt && <button type="button" className="mt-3 flex min-h-11 items-center gap-1.5 text-xs font-bold text-slate-600" onClick={() => void mark(item.id, "viewed")}><Check size={14} />Đánh dấu đã xem</button>}
            </article>))}</div>}
      </main>
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selected?.reviewedAt ? "Sửa điểm bài làm" : "Chấm bài"}</DialogTitle><DialogDescription>Gán bài cho học sinh, nhập điểm và nhận xét.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void submitReview(event)}>
            <div className="space-y-1.5"><Label htmlFor="studentId">Học sinh</Label><select id="studentId" required value={studentId} onChange={(event) => setStudentId(event.target.value)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Chọn học sinh</option>{assignment?.students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></div>
            <div className="space-y-1.5"><Label htmlFor="score">Điểm</Label><Input id="score" required type="number" min="0" max="10" step="0.25" inputMode="decimal" value={score} onChange={(event) => setScore(event.target.value)} placeholder="Ví dụ: 8.5" /></div>
            <div className="space-y-1.5"><Label htmlFor="reviewNote">Nhận xét</Label><Textarea id="reviewNote" rows={4} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Tùy chọn" /></div>
            {reviewError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{reviewError}</p>}
            <Button className="min-h-12 w-full rounded-xl" disabled={saving}>{saving && <Loader2 className="animate-spin" size={16} />}{saving ? "Đang lưu..." : "Lưu điểm"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}
