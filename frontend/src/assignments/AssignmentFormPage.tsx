import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Search,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";
import { toLocalDateTimeInput } from "../lib/format";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  classNames: string[];
  classIds?: string[];
  students: { id: string; name: string; status: string }[];
};
type TutorClass = { id: string; name: string; studentCount: number };

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function AssignmentFormPage() {
  const { assignmentId } = useParams();
  const editing = Boolean(assignmentId);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [classIds, setClassIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [classSearch, setClassSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [classesResponse, assignmentsResponse] = await Promise.all([
          fetch(`${API}/classes`, { credentials: "include" }),
          editing
            ? fetch(`${API}/assignments`, { credentials: "include" })
            : Promise.resolve(null),
        ]);
        if (!classesResponse.ok) throw new Error("Không thể tải lớp.");
        const allClasses: TutorClass[] = await classesResponse.json();
        setClasses(allClasses);
        if (assignmentsResponse) {
          if (!assignmentsResponse.ok)
            throw new Error("Không thể tải bài tập.");
          const assignments: Assignment[] = await assignmentsResponse.json();
          const assignment = assignments.find(
            (item) => item.id === assignmentId,
          );
          if (!assignment) throw new Error("Không tìm thấy bài tập.");
          setTitle(assignment.title);
          setDescription(assignment.description ?? "");
          setDueAt(
            assignment.dueAt
              ? toLocalDateTimeInput(new Date(assignment.dueAt))
              : "",
          );
          setClassIds(assignment.classIds ?? []);
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Có lỗi xảy ra.",
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [assignmentId, editing]);

  const searchTerm = classSearch.trim().toLocaleLowerCase("vi");
  const visibleClasses = classes.filter((item) =>
    item.name.toLocaleLowerCase("vi").includes(searchTerm),
  );

  function toggleClass(id: string) {
    setClassIds((current) =>
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
    if (!title.trim()) return setError("Nhập tên bài tập.");
    if (classIds.length === 0) return setError("Chọn ít nhất một lớp.");
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
        return setError("Không thể upload file.");
      }
      fileIds.push((await uploadResponse.json()).id);
    }
    const response = await fetch(
      editing ? `${API}/assignments/${assignmentId}` : `${API}/assignments`,
      {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          dueAt: dueAt || null,
          studentIds: [],
          classIds,
          ...(editing ? {} : { fileIds }),
        }),
      },
    );
    setSaving(false);
    if (response.ok) navigate("/assignments");
    else setError("Không thể lưu bài tập. Vui lòng thử lại.");
  }

  return (
    <MobileShell>
      <PageHeader
        title={editing ? "Sửa bài tập" : "Tạo bài tập"}
        action={<UserAvatar />}
      />
      <main className="mx-auto max-w-3xl px-4 py-5 sm:py-8">
        <Button
          asChild
          variant="link"
          className="mb-4 h-auto p-0 text-muted-foreground"
        >
          <Link to="/assignments">
            <ArrowLeft size={16} /> Quay lại bài tập
          </Link>
        </Button>
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} /> Đang tải...
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Card className="rounded-3xl border-slate-200 shadow-sm">
              <CardHeader className="p-5 pb-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText size={20} /> Thông tin bài tập
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <Label htmlFor="assignment-title">Tên bài</Label>
                  <Input
                    id="assignment-title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Deadline</Label>
                  <DatePicker
                    value={dueAt ? new Date(dueAt) : null}
                    onChange={(date) => setDueAt(toLocalDateTimeInput(date))}
                    min={new Date()}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="assignment-description">Mô tả</Label>
                  <Textarea
                    id="assignment-description"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                {!editing && (
                  <div className="space-y-2">
                    <Label>File đề bài</Label>
                    <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-slate-50 p-4 text-sm font-medium text-slate-700 hover:bg-slate-100">
                      <Upload className="mb-2 text-primary" size={20} />
                      Chọn file
                      <Input
                        className="sr-only"
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/heic"
                        multiple
                        onChange={selectFiles}
                      />
                    </label>
                    {files.map((file) => (
                      <p
                        key={`${file.name}-${file.lastModified}`}
                        className="min-w-0 max-w-full truncate rounded-xl bg-muted px-3 py-2 text-sm"
                      >
                        {file.name}
                      </p>
                    ))}
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-bold">
                      <Users size={18} className="text-primary" /> Chọn lớp
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {classIds.length} chọn
                    </span>
                  </div>
                  <div className="relative mb-3">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={17}
                    />
                    <Input
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      className="pl-10"
                      placeholder="Tìm lớp"
                    />
                  </div>
                  <div className="max-h-[50dvh] space-y-2 overflow-y-auto rounded-2xl border p-2">
                    {visibleClasses.map((item) => {
                      const selected = classIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleClass(item.id)}
                          aria-pressed={selected}
                          className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors ${selected ? "bg-primary text-primary-foreground" : "hover:bg-slate-50"}`}
                        >
                          <span
                            className={`grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${selected ? "bg-white/15" : "bg-violet-50 text-primary"}`}
                          >
                            {item.name.slice(0, 2).toLocaleUpperCase("vi")}
                          </span>
                          <span className="min-w-0 flex-1">
                            <strong className="block truncate text-sm">
                              {item.name}
                            </strong>
                            <small
                              className={
                                selected
                                  ? "text-primary-foreground/75"
                                  : "text-muted-foreground"
                              }
                            >
                              {item.studentCount} học sinh
                            </small>
                          </span>
                        </button>
                      );
                    })}
                    {visibleClasses.length === 0 && (
                      <p className="p-4 text-center text-sm text-muted-foreground">
                        Không tìm thấy lớp.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="safe-bottom sticky bottom-0 -mx-4 border-t bg-white/95 p-4 backdrop-blur sm:mx-0 sm:rounded-3xl sm:border">
              {error && (
                <p
                  role="alert"
                  className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}
              <Button
                disabled={saving}
                className="min-h-12 w-full rounded-2xl sm:w-auto sm:px-8"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                {saving
                  ? "Đang lưu..."
                  : editing
                    ? "Lưu thay đổi"
                    : "Tạo bài tập"}
              </Button>
            </div>
          </form>
        )}
      </main>
    </MobileShell>
  );
}
