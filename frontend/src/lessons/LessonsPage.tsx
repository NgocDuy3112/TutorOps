import { FormEvent, useEffect, useState } from "react";
import { BookOpen, Loader2, Plus } from "lucide-react";
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

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
};

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [open, setOpen] = useState(false);

  async function load() {
    const response = await fetch(`${API}/lessons`, { credentials: "include" });
    setLessons(await response.json());
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <MobileShell>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              TutorOps
            </p>
            <h1 className="text-xl font-bold">Bài học</h1>
          </div>
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            <Plus size={16} />
            Tạo bài học
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="text-2xl font-bold">Thư viện bài học</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lưu tài liệu và nội dung có thể tái sử dụng khi giao bài.
        </p>
        {lessons.length === 0 ? (
          <Card className="mt-5 border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Chưa có bài học.</p>
              <Button className="mt-3" size="sm" onClick={() => setOpen(true)}>
                <Plus size={16} />
                Tạo bài học đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson) => (
              <Card key={lesson.id} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-primary">
                      <BookOpen size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold">{lesson.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {lesson.description || "Chưa có mô tả"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <LessonForm
        open={open}
        onOpenChange={setOpen}
        onSaved={() => {
          setOpen(false);
          void load();
        }}
      />
    </MobileShell>
  );
}

function LessonForm({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    let fileId: string | undefined;

    if (file) {
      const form = new FormData();
      form.append("file", file);
      const upload = await fetch(`${API}/files`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!upload.ok) {
        setSaving(false);
        return;
      }
      fileId = (await upload.json()).id;
    }

    const response = await fetch(`${API}/lessons`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title, description }),
    });

    if (response.ok && fileId) {
      const lesson = await response.json();
      await fetch(`${API}/lessons/${lesson.id}/files`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fileId }),
      });
    }

    setSaving(false);
    if (response.ok) onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo bài học</DialogTitle>
          <DialogDescription>
            Lưu nội dung hoặc tài liệu để tái sử dụng.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lesson-title">Tên bài học</Label>
            <Input
              id="lesson-title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lesson-description">Mô tả</Label>
            <Textarea
              id="lesson-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lesson-file">Tài liệu</Label>
            <Input
              id="lesson-file"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <Button disabled={saving} className="w-full">
            {saving && <Loader2 className="animate-spin" size={16} />}
            {saving ? "Đang lưu..." : "Lưu bài học"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
