import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ClipboardPlus, FileText, Loader2, Plus, Users } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MobileShell } from "../layout/MobileShell";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  studentCount: number;
};

type Student = { id: string; name: string };
type Lesson = { id: string; title: string };

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const response = await fetch(`${API}/assignments`, {
      credentials: "include",
    });
    setAssignments(await response.json());
    setLoading(false);
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
            <h1 className="text-xl font-bold">Bài tập</h1>
          </div>
          <Button type="button" size="sm" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Tạo bài
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <section>
          <h2 className="text-2xl font-bold">Danh sách bài tập</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Giao bài cho học sinh và theo dõi số lượng được giao.
          </p>
        </section>

        {loading ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải...
          </p>
        ) : assignments.length === 0 ? (
          <Card className="mt-5 border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Chưa có bài tập.</p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                <Plus size={16} />
                Tạo bài đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        )}
      </main>

      <AssignmentForm
        open={showForm}
        onOpenChange={setShowForm}
        onSaved={() => {
          setShowForm(false);
          void load();
        }}
      />
    </MobileShell>
  );
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-primary">
            <FileText size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-bold">{assignment.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {assignment.dueAt
                ? `Deadline: ${new Date(assignment.dueAt).toLocaleDateString("vi-VN")}`
                : "Không có deadline"}
            </p>
            <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
              <Users size={15} />
              {assignment.studentCount} học sinh
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignmentForm({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonId, setLessonId] = useState("none");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/students`, { credentials: "include" })
      .then((response) => response.json())
      .then(setStudents);
    fetch(`${API}/lessons`, { credentials: "include" })
      .then((response) => response.json())
      .then(setLessons);
  }, []);

  function toggleStudent(id: string) {
    setStudentIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const fileIds: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await fetch(`${API}/files`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!uploadResponse.ok) {
        setSaving(false);
        setError("Không thể upload file. Kiểm tra định dạng và dung lượng.");
        return;
      }
      const uploaded = await uploadResponse.json();
      fileIds.push(uploaded.id);
    }

    const response = await fetch(`${API}/assignments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title,
        description,
        lessonId: lessonId === "none" ? null : lessonId,
        dueAt: dueAt || null,
        studentIds,
        fileIds,
      }),
    });
    setSaving(false);
    if (response.ok) onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo bài tập</DialogTitle>
          <DialogDescription>
            Nhập nội dung bài, chọn học sinh và đính kèm tài liệu nếu cần.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="assignment-title">Tên bài</Label>
            <Input
              id="assignment-title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assignment-description">Mô tả</Label>
            <Textarea
              id="assignment-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Bài học liên quan</Label>
              <Select value={lessonId} onValueChange={setLessonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Không chọn bài học" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn bài học</SelectItem>
                  {lessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assignment-due-at">Deadline</Label>
              <Input
                id="assignment-due-at"
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assignment-files">File đề bài</Label>
            <Input
              id="assignment-files"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/heic"
              multiple
              onChange={selectFiles}
            />
            <p className="text-xs text-muted-foreground">
              Tối đa 20MB mỗi file.
            </p>
          </div>

          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((file) => (
                <li
                  key={`${file.name}-${file.lastModified}`}
                  className="rounded-lg bg-muted px-3 py-2 text-sm"
                >
                  {file.name}
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <fieldset>
            <legend className="text-sm font-medium">Giao cho học sinh</legend>
            <div className="mt-2 space-y-2">
              {students.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={studentIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    className="size-4 accent-indigo-600"
                  />
                  {student.name}
                </label>
              ))}
            </div>
          </fieldset>

          <Button disabled={saving} className="w-full">
            {saving && <Loader2 className="animate-spin" size={16} />}
            {saving ? "Đang lưu..." : "Tạo bài tập"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
