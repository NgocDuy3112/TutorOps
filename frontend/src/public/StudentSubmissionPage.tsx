import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
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

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  status: string;
  submittedAt: string | null;
};

export function StudentSubmissionPage() {
  const { token = "" } = useParams();
  const [name, setName] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/public/students?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((body) => {
        setName(body.student.name);
        setAssignments(body.assignments);
      })
      .catch(() => setError("Link không hợp lệ hoặc đã bị thu hồi."))
      .finally(() => setLoading(false));
  }, [token]);

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []).slice(0, 10));
    setMessage("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected || files.length === 0) return;
    setSending(true);
    setError("");
    setMessage("");
    const data = new FormData();
    files.forEach((file) => data.append("files", file));
    const response = await fetch(
      `${API}/public/submissions?token=${encodeURIComponent(token)}&assignmentId=${selected.id}`,
      { method: "POST", body: data },
    );
    setSending(false);
    if (!response.ok) {
      setError("Không thể nộp bài. Kiểm tra file rồi thử lại.");
      return;
    }
    setMessage("Đã nộp bài thành công.");
    setFiles([]);
    setSelected(null);
    setAssignments((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              status: "submitted",
              submittedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <header className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
            TutorOps
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Bài tập của {name || "học sinh"}
          </h1>
          <p className="mt-2 text-primary-foreground/80">
            Chọn bài tập, chụp ảnh bài làm, rồi nộp bài.
          </p>
        </header>

        {loading && (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải bài tập...
          </p>
        )}
        {error && (
          <Card className="mt-6 border-red-100 bg-red-50">
            <CardContent role="alert" className="p-4 text-sm text-red-700">
              {error}
            </CardContent>
          </Card>
        )}
        {!loading && !error && (
          <section className="mt-6 space-y-3">
            <h2 className="text-lg font-bold">Bài tập đang giao</h2>
            {assignments.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Chưa có bài tập.
                </CardContent>
              </Card>
            )}
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {assignment.description}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                      {assignment.status === "submitted" ? "Đã nộp" : "Chờ nộp"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {assignment.dueAt
                      ? `Hạn: ${new Date(assignment.dueAt).toLocaleString("vi-VN")}`
                      : "Không có hạn nộp"}
                  </p>
                  {assignment.status !== "submitted" && (
                    <Button
                      onClick={() => {
                        setSelected(assignment);
                        setMessage("");
                        setError("");
                      }}
                      className="mt-4 w-full"
                    >
                      <FileUp size={16} />
                      Nộp bài
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>
        )}
        {message && (
          <Card className="mt-5 border-emerald-100 bg-emerald-50">
            <CardContent
              role="status"
              className="flex items-center gap-2 p-4 text-sm text-emerald-700"
            >
              <CheckCircle2 size={17} />
              {message}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nộp: {selected?.title}</DialogTitle>
            <DialogDescription>
              Chụp ảnh bài làm hoặc chọn ảnh đã có trong máy.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="submission-files">Ảnh bài làm</Label>
              <Input
                id="submission-files"
                required
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={selectFiles}
              />
              <p className="text-xs text-muted-foreground">
                Tối đa 10 file, 20MB mỗi file.
              </p>
            </div>
            {files.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Đã chọn {files.length} file
              </p>
            )}
            <Button disabled={sending || files.length === 0} className="w-full">
              {sending && <Loader2 className="animate-spin" size={16} />}
              {sending ? "Đang tải lên..." : "Xác nhận nộp bài"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
