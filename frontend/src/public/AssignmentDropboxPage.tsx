import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Download, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type AssignmentFile = {
  id: string;
  name: string;
  mimeType: string;
  url: string;
};
type AssignmentInfo = {
  title: string;
  description: string | null;
  dueAt: string | null;
  files: AssignmentFile[];
};

export function AssignmentDropboxPage({ token }: { token: string }) {
  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/public/assignment-dropbox?token=${encodeURIComponent(token)}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setAssignment)
      .catch(() => setError("Link không hợp lệ hoặc đã thu hồi."));
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!files.length) return;
    setSaving(true);
    setError("");
    const data = new FormData();
    files.forEach((file) => data.append("files", file));
    const response = await fetch(
      `${API}/public/submissions/dropbox?token=${encodeURIComponent(token)}`,
      { method: "POST", body: data },
    );
    setSaving(false);
    if (response.ok) {
      setFiles([]);
      setMessage("Đã nộp bài. Nhớ ghi tên trên bài làm.");
    } else setError("Không thể nộp bài. Thử lại sau.");
  }

  return (
    <main className="min-h-dvh bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-lg">
        <Card className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <p className="text-sm font-semibold text-primary">TutorOps</p>
            <div>
              <h1 className="text-2xl font-bold">
                {assignment?.title || "Nộp bài tập"}
              </h1>
              {assignment?.dueAt && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Hạn: {new Date(assignment.dueAt).toLocaleString("vi-VN")}
                </p>
              )}
            </div>
            {assignment?.description && (
              <p className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                {assignment.description}
              </p>
            )}
            {assignment?.files?.length ? (
              <section>
                <h2 className="mb-2 text-sm font-bold">File bài tập</h2>
                <div className="space-y-2">
                  {assignment.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-14 min-w-0 items-center gap-2 rounded-2xl bg-slate-50 p-2.5 text-left transition-colors hover:bg-slate-100"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white text-primary">
                        <FileText size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block max-w-full truncate text-sm font-medium">
                          {shortFileName(file.name)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {fileExtension(file.name).toUpperCase() || "FILE"}
                        </span>
                      </span>
                      <Download
                        size={17}
                        className="shrink-0 text-muted-foreground"
                      />
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Ghi rõ họ tên trên bài làm trước khi nộp.
            </p>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="text-sm text-emerald-700">
                {message}
              </p>
            )}
            <form onSubmit={submit} className="space-y-4">
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-slate-50 p-4 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100">
                <Upload className="mb-2 text-primary" size={22} />
                Chọn bài làm để nộp
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFiles(Array.from(event.target.files ?? []))
                  }
                />
              </label>
              {files.map((file) => (
                <p
                  key={`${file.name}-${file.lastModified}`}
                  className="truncate rounded-xl bg-muted px-3 py-2 text-sm"
                >
                  {shortFileName(file.name)}
                </p>
              ))}
              <Button
                disabled={saving || !files.length}
                className="min-h-12 w-full rounded-2xl"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Upload />}
                {saving ? "Đang nộp..." : "Nộp bài"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function fileExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function shortFileName(name: string) {
  const extension = fileExtension(name);
  const base = extension ? name.slice(0, -(extension.length + 1)) : name;
  if (base.length <= 18) return name;
  return `${base.slice(0, 8)}...${base.slice(-6)}${extension ? `.${extension}` : ""}`;
}
