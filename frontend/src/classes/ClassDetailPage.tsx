import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, UserMinus, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { MobileShell } from "../layout/MobileShell";
import type { Student, TutorClass } from "./ClassesPage";
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export function ClassDetailPage() {
  const { classId = "" } = useParams();
  const [item, setItem] = useState<TutorClass | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    try {
      const [classes, studentsResponse] = await Promise.all([
        fetch(`${API}/classes`, { credentials: "include" }),
        fetch(`${API}/students`, { credentials: "include" }),
      ]);
      if (!classes.ok || !studentsResponse.ok)
        throw new Error("Không thể tải lớp.");
      const all: TutorClass[] = await classes.json();
      setItem(all.find((x) => x.id === classId) ?? null);
      setStudents(await studentsResponse.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [classId]);
  const available = useMemo(
    () =>
      students.filter(
        (s) =>
          !item?.students.some((x) => x.id === s.id) &&
          s.name
            .toLocaleLowerCase("vi")
            .includes(search.toLocaleLowerCase("vi")),
      ),
    [students, item, search],
  );
  const [removing, setRemoving] = useState<Student | null>(null);

  async function removeStudent() {
    if (!removing) return;
    const response = await fetch(
      `${API}/classes/${classId}/students/${removing.id}`,
      { method: "DELETE", credentials: "include" },
    );
    if (response.ok) void load();
    setRemoving(null);
  }

  async function addStudent(student: Student) {
    const response = await fetch(
      `${API}/classes/${classId}/students/${student.id}`,
      { method: "POST", credentials: "include" },
    );
    if (response.ok) void load();
  }
  return (
    <MobileShell>
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Button asChild variant="link" className="h-auto p-0 text-primary">
            <Link to="/classes">
              <ArrowLeft size={16} />
              Lớp
            </Link>
          </Button>
          <h1 className="mt-3 truncate text-2xl font-bold">
            {item?.name || "Lớp"}
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {loading ? (
          <p className="flex gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải...
          </p>
        ) : error ? (
          <Card className="border-red-100 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">
              {error}
            </CardContent>
          </Card>
        ) : !item ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Không tìm thấy lớp.
            </CardContent>
          </Card>
        ) : (
          <>
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold">
                  <Users size={18} className="text-primary" />
                  Học sinh ({item.students.length})
                </h2>
              </div>
              <div className="space-y-2">
                {item.students.length ? (
                  item.students.map((s) => (
                    <Card key={s.id}>
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <strong className="block truncate">{s.name}</strong>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {s.parentPhone || "Chưa có SĐT"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="text-red-600"
                          aria-label={`Bỏ ${s.name} khỏi lớp`}
                          onClick={() => setRemoving(s)}
                        >
                          <UserMinus size={17} />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <EmptyState
                    icon={<UserPlus size={24} />}
                    title="Lớp chưa có học sinh"
                    description="Tìm học sinh bên dưới để thêm vào lớp."
                  />
                )}
              </div>
            </section>
            <section>
              <h2 className="mb-3 font-bold">Thêm học sinh</h2>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm học sinh"
                aria-label="Tìm học sinh"
              />
              <div className="mt-3 space-y-2">
                {available.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm shadow-slate-100 transition-colors hover:bg-slate-50"
                    aria-label={`Thêm ${s.name} vào lớp`}
                    onClick={() => void addStudent(s)}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-sm font-bold text-primary">
                      {s.name.slice(0, 2).toLocaleUpperCase("vi")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate">{s.name}</strong>
                      <small className="text-muted-foreground">
                        {s.parentPhone || "Chưa có SĐT"}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <Dialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bỏ học sinh khỏi lớp?</DialogTitle>
            <DialogDescription>
              {removing?.name} sẽ không còn trong lớp này. Học sinh vẫn được giữ trong hệ thống.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoving(null)}>Hủy</Button>
            <Button type="button" variant="destructive" onClick={() => void removeStudent()}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}
