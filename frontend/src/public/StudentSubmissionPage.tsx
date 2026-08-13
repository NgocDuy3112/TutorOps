import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  FileUp,
  ImageIcon,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
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

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const maxFiles = 10;
const maxFileSize = 20 * 1024 * 1024;
const acceptedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  status: string;
  submittedAt: string | null;
};

type SelectedFile = {
  file: File;
  previewUrl: string | null;
};

const formatBytes = (value: number) => {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.ceil(value / 1024)}KB`;
};

export function StudentSubmissionPage() {
  const { token = "" } = useParams();
  const [name, setName] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");

  async function loadAssignments() {
    setLoading(true);
    setError("");
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
  }

  useEffect(() => {
    void loadAssignments();
  }, [token]);

  useEffect(() => {
    return () => {
      files.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [files]);

  const pendingCount = useMemo(
    () =>
      assignments.filter((assignment) => assignment.status !== "submitted")
        .length,
    [assignments],
  );

  function openSubmission(assignment: Assignment) {
    setSelected(assignment);
    setFiles([]);
    setMessage("");
    setError("");
    setUploadError("");
  }

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files ?? []);
    const next: SelectedFile[] = [];
    const errors: string[] = [];

    for (const file of incoming) {
      if (files.length + next.length >= maxFiles) {
        errors.push(`Tối đa ${maxFiles} file.`);
        break;
      }
      if (!acceptedTypes.includes(file.type)) {
        errors.push(`${file.name}: định dạng chưa hỗ trợ.`);
        continue;
      }
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: lớn hơn 20MB.`);
        continue;
      }
      next.push({
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      });
    }

    setFiles((current) => [...current, ...next]);
    setUploadError([...new Set(errors)].join(" "));
    setMessage("");
    event.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((current) => {
      const item = current[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected || files.length === 0) return;
    setSending(true);
    setError("");
    setUploadError("");
    setMessage("");
    const data = new FormData();
    files.forEach((item) => data.append("files", item.file));
    const response = await fetch(
      `${API}/public/submissions?token=${encodeURIComponent(token)}&assignmentId=${selected.id}`,
      { method: "POST", body: data },
    );
    setSending(false);
    if (!response.ok) {
      setUploadError("Không thể nộp bài. Kiểm tra mạng hoặc file rồi thử lại.");
      return;
    }
    setMessage("Đã nộp bài thành công.");
    files.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
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
    <main className="min-h-dvh bg-slate-50 px-4 py-6 text-slate-900 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <header className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
            TutorOps
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Bài tập của {name || "học sinh"}
          </h1>
          <p className="mt-2 text-primary-foreground/80">
            Còn {pendingCount} bài cần nộp. Chụp ảnh hoặc chọn file bài làm.
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
            <CardContent
              role="alert"
              className="space-y-3 p-4 text-sm text-red-700"
            >
              <p>{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 bg-white"
                onClick={() => void loadAssignments()}
              >
                <RotateCcw size={15} />
                Tải lại
              </Button>
            </CardContent>
          </Card>
        )}
        {!loading && !error && (
          <section className="mt-6 space-y-3">
            <h2 className="text-lg font-bold">Bài tập đang giao</h2>
            {assignments.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Không có dữ liệu.
                </CardContent>
              </Card>
            )}
            {assignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {assignment.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${assignment.status === "submitted" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                    >
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
                      onClick={() => openSubmission(assignment)}
                      className="mt-4 min-h-11 w-full rounded-2xl"
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
              Chụp ảnh bài làm hoặc chọn file đã có trong máy.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed bg-slate-50 p-4 text-center text-sm font-semibold text-slate-700">
                <Camera className="mb-2 text-primary" size={24} />
                Chụp ảnh
                <Input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={selectFiles}
                />
              </label>
              <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed bg-slate-50 p-4 text-center text-sm font-semibold text-slate-700">
                <FileUp className="mb-2 text-primary" size={24} />
                Chọn file
                <Input
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                  multiple
                  onChange={selectFiles}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Tối đa 10 file, 20MB mỗi file. Hỗ trợ ảnh và PDF.
            </p>

            {uploadError && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {uploadError}
              </p>
            )}

            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">
                  Đã chọn {files.length} file
                </p>
                <div className="grid gap-2">
                  {files.map((item, index) => (
                    <div
                      key={`${item.file.name}-${index}`}
                      className="flex items-center gap-3 rounded-2xl border bg-white p-2"
                    >
                      <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100">
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt="Preview bài làm"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon
                            size={20}
                            className="text-muted-foreground"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(item.file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => removeFile(index)}
                        aria-label="Bỏ file"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              disabled={sending || files.length === 0}
              className="min-h-12 w-full rounded-2xl"
            >
              {sending && <Loader2 className="animate-spin" size={16} />}
              {sending ? "Đang tải lên..." : "Xác nhận nộp bài"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
