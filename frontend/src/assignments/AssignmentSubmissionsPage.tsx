import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileShell } from "../layout/MobileShell";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
type FileItem = { id: string; name: string; mimeType: string };
type Submission = {
  id: string;
  submittedAt: string;
  viewedAt: string | null;
  downloadedAt: string | null;
  files: FileItem[];
};
type Assignment = { id: string; title: string };

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
      setAssignment(
        assignments.find((item) => item.id === assignmentId) ?? null,
      );
      setItems(await submissionsResponse.json());
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [assignmentId]);

  async function mark(submissionId: string, status: "viewed" | "downloaded") {
    const response = await fetch(
      `${API}/assignments/${assignmentId}/dropbox-submissions/${submissionId}/${status}`,
      { method: "PATCH", credentials: "include" },
    );
    if (!response.ok) return;
    setItems((current) =>
      current.map((item) =>
        item.id === submissionId
          ? {
              ...item,
              [status === "viewed" ? "viewedAt" : "downloadedAt"]:
                new Date().toISOString(),
            }
          : item,
      ),
    );
  }
  async function download(submissionId: string, fileId: string) {
    const response = await fetch(
      `${API}/assignments/${assignmentId}/dropbox-files/${fileId}/url`,
      { credentials: "include" },
    );
    if (!response.ok) return;
    const { url } = await response.json();
    await mark(submissionId, "downloaded");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <MobileShell>
      <header className="overflow-hidden border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Button asChild variant="link" className="h-auto p-0 text-primary">
            <Link to="/assignments">
              <ArrowLeft size={16} />
              Bài tập
            </Link>
          </Button>
          <h1 className="mt-3 truncate text-2xl font-bold">
            {assignment?.title || "Bài đã nộp"}
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl overflow-hidden px-4 py-6">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải...
          </p>
        ) : error ? (
          <Card className="border-red-100 bg-red-50">
            <CardContent role="alert" className="p-4 text-sm text-red-700">
              {error}
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Không có dữ liệu.
            </CardContent>
          </Card>
        ) : (
          <div className="min-w-0 space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="w-full min-w-0 overflow-hidden rounded-3xl border bg-white p-3 shadow-sm shadow-slate-100 sm:p-4"
              >
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <time className="min-w-0 truncate text-sm font-semibold">
                    {new Date(item.submittedAt).toLocaleString("vi-VN")}
                  </time>
                  <button
                    type="button"
                    aria-pressed={Boolean(item.viewedAt)}
                    className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors ${item.viewedAt ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    onClick={() => void mark(item.id, "viewed")}
                  >
                    <Check size={14} />
                    <span className="hidden sm:inline">
                      {item.viewedAt ? "Đã xem" : "Xem"}
                    </span>
                  </button>
                </div>
                <div className="mt-3 grid min-w-0 gap-2 overflow-hidden sm:grid-cols-2">
                  {item.files.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      className="flex min-h-14 w-full min-w-0 items-center gap-2 overflow-hidden rounded-2xl bg-slate-50 p-2.5 text-left transition-colors hover:bg-slate-100"
                      onClick={() => void download(item.id, file.id)}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white text-primary">
                        <FileText size={17} />
                      </span>
                      <span className="min-w-0 flex-1 overflow-hidden">
                        <span className="block w-full truncate text-sm font-medium">
                          {shortFileName(file.name)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {fileExtension(file.name).toUpperCase() || "FILE"}
                        </span>
                      </span>
                      <Download
                        size={18}
                        className="shrink-0 text-muted-foreground"
                      />
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </MobileShell>
  );
}
