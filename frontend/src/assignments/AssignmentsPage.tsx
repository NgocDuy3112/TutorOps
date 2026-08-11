import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ClipboardPlus, FileText, Loader2, Pencil, Plus, Search, Users } from "lucide-react";
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
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  studentCount: number;
  students: { id: string; name: string; status: string }[];
};

type Student = { id: string; name: string };
type TutorClass = { id: string; name: string; subject: string | null; studentCount: number };
type Lesson = { id: string; title: string };

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/assignments`, { credentials: "include" });
      if (!response.ok) throw new Error("Không thể tải bài tập.");
      setAssignments(await response.json());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <MobileShell>
      <PageHeader
        title="Bài tập"
        action={<div className="flex items-center gap-2"><Button type="button" size="sm" className="min-h-11 rounded-2xl" onClick={() => setShowForm(true)}><Plus size={16} />Tạo bài</Button><UserAvatar /></div>}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && <Card className="mt-5 border-red-100 bg-red-50"><CardContent role="alert" className="flex flex-col gap-3 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><Button type="button" variant="outline" className="min-h-11 bg-white" onClick={() => void load()}>Tải lại</Button></CardContent></Card>}
        {loading ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải...
          </p>
        ) : !error && assignments.length === 0 ? (
          <Card className="mt-5 border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Chưa có bài tập.</p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                <Plus size={16} />
                Tạo bài
              </Button>
            </CardContent>
          </Card>
        ) : !error ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} onEdit={() => { setEditing(assignment); setShowForm(true); }} />
            ))}
          </div>
        ) : null}
      </main>

      <AssignmentForm
        open={showForm}
        assignment={editing}
        onOpenChange={(open) => { setShowForm(open); if (!open) setEditing(null); }}
        onSaved={() => {
          setShowForm(false);
          setEditing(null);
          void load();
        }}
      />
    </MobileShell>
  );
}

function AssignmentCard({ assignment, onEdit }: { assignment: Assignment; onEdit: () => void }) {
  async function createLink() { const response = await fetch(`${API}/assignments/${assignment.id}/submission-link`, { method: "POST", credentials: "include" }); if (!response.ok) return; const { token } = await response.json(); const link = `${window.location.origin}/assignment-submit/${token}`; await navigator.clipboard.writeText(link); alert("Đã sao chép link nộp bài chung."); }
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
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
        <div className="mt-4 grid grid-cols-2 gap-2"><Button type="button" variant="outline" className="min-h-11 rounded-2xl" onClick={onEdit}><Pencil size={16} />Sửa</Button><Button type="button" className="min-h-11 rounded-2xl" onClick={() => void createLink()}>Link nộp bài</Button></div>
      </CardContent>
    </Card>
  );
}

function AssignmentForm({
  open,
  assignment,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  assignment: Assignment | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonId, setLessonId] = useState("none");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");

  useEffect(() => {
    if (assignment) {
      setLessonId("none");
      setTitle(assignment.title);
      setDescription(assignment.description ?? "");
      setDueAt(assignment.dueAt ? new Date(assignment.dueAt).toISOString().slice(0, 16) : "");
      setStudentIds(assignment.students.map((student) => student.id));
      setClassIds([]);
      setFiles([]);
    } else {
      setLessonId("none"); setTitle(""); setDescription(""); setDueAt(""); setStudentIds([]); setClassIds([]); setFiles([]);
    }
  }, [assignment, open]);

  useEffect(() => {
    fetch(`${API}/students`, { credentials: "include" })
      .then((response) => response.json())
      .then(setStudents);
    fetch(`${API}/classes`, { credentials: "include" })
      .then((response) => response.json())
      .then(setClasses);
    fetch(`${API}/lessons`, { credentials: "include" })
      .then((response) => response.json())
      .then(setLessons);
  }, []);

  function toggleClass(id: string) {
    setClassIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

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
    if (studentIds.length === 0 && classIds.length === 0) {
      setError("Chọn ít nhất một lớp hoặc học sinh để giao bài.");
      return;
    }
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

    const response = await fetch(assignment ? `${API}/assignments/${assignment.id}` : `${API}/assignments`, {
      method: assignment ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title,
        description,
        lessonId: lessonId === "none" ? null : lessonId,
        dueAt: dueAt || null,
        studentIds,
        ...(assignment ? {} : { classIds, fileIds }),
      }),
    });
    setSaving(false);
    if (response.ok) {
      onSaved();
      return;
    }
    setError("Không thể tạo bài tập. Vui lòng kiểm tra thông tin rồi thử lại.");
  }

  const searchTerm = recipientSearch.trim().toLocaleLowerCase("vi");
  const visibleClasses = classes.filter((item) => item.name.toLocaleLowerCase("vi").includes(searchTerm));
  const visibleStudents = students.filter((student) => student.name.toLocaleLowerCase("vi").includes(searchTerm));
  const recipientCount = classIds.length + studentIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{assignment ? "Sửa bài tập" : "Tạo bài tập"}</DialogTitle>
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

          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Người nhận {recipientCount > 0 ? `(${recipientCount} lựa chọn)` : ""}</legend>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
              <Input value={recipientSearch} onChange={(event) => setRecipientSearch(event.target.value)} className="pl-10" placeholder="Tìm lớp hoặc học sinh" aria-label="Tìm lớp hoặc học sinh" />
            </div>
            <details className="rounded-2xl border" open={recipientCount === 0}>
              <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-medium">Giao cho lớp ({classIds.length} đã chọn)</summary>
              <div className="max-h-52 space-y-2 overflow-y-auto border-t p-2">
                {visibleClasses.map((item) => <label key={item.id} className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-2 text-sm hover:bg-muted"><span className="flex items-center gap-3"><input type="checkbox" checked={classIds.includes(item.id)} onChange={() => toggleClass(item.id)} className="size-4 accent-indigo-600" /><span><strong className="block">{item.name}</strong><small className="text-muted-foreground">{item.subject || "Chưa có môn"}</small></span></span><small className="text-muted-foreground">{item.studentCount} HS</small></label>)}
                {visibleClasses.length === 0 && <p className="p-2 text-sm text-muted-foreground">Không tìm thấy lớp.</p>}
              </div>
            </details>
            <details className="rounded-2xl border">
              <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-medium">Giao thêm học sinh lẻ ({studentIds.length} đã chọn)</summary>
              <div className="max-h-52 space-y-1 overflow-y-auto border-t p-2">
                {visibleStudents.map((student) => <label key={student.id} className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm hover:bg-muted"><input type="checkbox" checked={studentIds.includes(student.id)} onChange={() => toggleStudent(student.id)} className="size-4 accent-indigo-600" />{student.name}</label>)}
                {visibleStudents.length === 0 && <p className="p-2 text-sm text-muted-foreground">Không tìm thấy học sinh.</p>}
              </div>
            </details>
          </fieldset>

          <Button disabled={saving} className="w-full">
            {saving && <Loader2 className="animate-spin" size={16} />}
            {saving ? "Đang lưu..." : assignment ? "Lưu thay đổi" : "Tạo bài tập"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
