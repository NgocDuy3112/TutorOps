import { FormEvent, useEffect, useState } from "react";
import { BookOpen, Loader2, Pencil, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";

type Student = { id: string; name: string; parentPhone: string | null };
type TutorClass = { id: string; name: string; subject: string | null; defaultPriceVnd: number | null; note: string | null; studentCount: number; students: Student[] };
type ClassFormValues = { name: string; subject: string; defaultPriceVnd: string; note: string };

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const emptyClass = (): TutorClass => ({ id: "", name: "", subject: "", defaultPriceVnd: null, note: "", studentCount: 0, students: [] });

export function ClassesPage() {
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [editing, setEditing] = useState<TutorClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [classesResponse, studentsResponse] = await Promise.all([
        fetch(`${API}/classes`, { credentials: "include" }),
        fetch(`${API}/students`, { credentials: "include" }),
      ]);
      if (!classesResponse.ok || !studentsResponse.ok) throw new Error("Không thể tải dữ liệu.");
      setClasses(await classesResponse.json());
      setStudents(await studentsResponse.json());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  async function toggleStudent(tutorClass: TutorClass, student: Student) {
    const assigned = tutorClass.students.some((item) => item.id === student.id);
    const response = await fetch(`${API}/classes/${tutorClass.id}/students/${student.id}`, {
      method: assigned ? "DELETE" : "POST",
      credentials: "include",
    });
    if (response.ok) void loadData();
  }

  return (
    <MobileShell>
      <PageHeader
        title="Lớp"
        action={<div className="flex items-center gap-2"><Button type="button" size="sm" className="min-h-11 rounded-2xl" onClick={() => setEditing(emptyClass())}><Plus size={16} />Tạo lớp</Button><UserAvatar /></div>}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && <Card className="mb-4 border-amber-200 bg-amber-50"><CardContent className="p-4 text-sm text-amber-800">{error}</CardContent></Card>}
        {loading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={17} />Đang tải...</p>}
        {!loading && classes.length === 0 && <Card className="border-dashed"><CardContent className="p-10 text-center"><p className="text-sm text-muted-foreground">Chưa có lớp.</p><Button className="mt-3" size="sm" onClick={() => setEditing(emptyClass())}><Plus size={16} />Tạo lớp </Button></CardContent></Card>}
        {!loading && classes.length > 0 && (
          <div className="grid gap-3 lg:grid-cols-2">
            {classes.map((item) => (
              <Card key={item.id} className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
                <CardContent className="p-4">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-primary"><BookOpen size={20} /></span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.subject || "Chưa có môn"}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Users size={14} />{item.studentCount} học sinh</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-2xl" onClick={() => setEditing(item)}><Pencil size={15} />Sửa</Button>
                  </div>
                  <div className="space-y-2">
                    {students.map((student) => {
                      const assigned = item.students.some((classStudent) => classStudent.id === student.id);
                      return (
                        <label key={student.id} className="flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm">
                          <input type="checkbox" checked={assigned} onChange={() => void toggleStudent(item, student)} className="size-4 accent-indigo-600" />
                          <span className="min-w-0"><strong className="block truncate">{student.name}</strong><small className="text-muted-foreground">{student.parentPhone || "Chưa có SĐT"}</small></span>
                        </label>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <ClassForm tutorClass={editing} onOpenChange={(open) => !open && setEditing(null)} onSaved={() => { setEditing(null); void loadData(); }} />
    </MobileShell>
  );
}

function ClassForm({ tutorClass, onOpenChange, onSaved }: { tutorClass: TutorClass | null; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const [form, setForm] = useState<ClassFormValues>({ name: "", subject: "", defaultPriceVnd: "", note: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!tutorClass) return; setForm({ name: tutorClass.name, subject: tutorClass.subject ?? "", defaultPriceVnd: tutorClass.defaultPriceVnd == null ? "" : String(tutorClass.defaultPriceVnd), note: tutorClass.note ?? "" }); }, [tutorClass]);
  function updateField<Key extends keyof ClassFormValues>(key: Key, value: ClassFormValues[Key]) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!tutorClass) return; setSaving(true);
    const url = tutorClass.id ? `${API}/classes/${tutorClass.id}` : `${API}/classes`;
    const method = tutorClass.id ? "PATCH" : "POST";
    const response = await fetch(url, { method, headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify({ name: form.name, subject: form.subject || null, defaultPriceVnd: form.defaultPriceVnd ? Number(form.defaultPriceVnd) : null, note: form.note || null }) });
    setSaving(false); if (response.ok) onSaved();
  }
  return <Dialog open={Boolean(tutorClass)} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{tutorClass?.id ? "Sửa lớp" : "Tạo lớp"}</DialogTitle><DialogDescription>Tạo lớp theo môn hoặc nhóm học.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="class-name">Tên lớp</Label><Input id="class-name" required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Toán 11" /></div><div className="space-y-1.5"><Label htmlFor="class-subject">Môn</Label><Input id="class-subject" value={form.subject} onChange={(event) => updateField("subject", event.target.value)} placeholder="Toán" /></div><div className="space-y-1.5"><Label htmlFor="class-price">Giá mặc định</Label><Input id="class-price" type="number" min="0" value={form.defaultPriceVnd} onChange={(event) => updateField("defaultPriceVnd", event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="class-note">Ghi chú</Label><Input id="class-note" value={form.note} onChange={(event) => updateField("note", event.target.value)} /></div><Button disabled={saving} className="w-full">{saving && <Loader2 className="animate-spin" size={16} />}{saving ? "Đang lưu..." : "Lưu lớp"}</Button></form></DialogContent></Dialog>;
}
