import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";

type Student = {
  id: string;
  name: string;
  parentName: string | null;
  parentPhone: string | null;
};
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function StudentFormPage() {
  const { studentId } = useParams();
  const editing = Boolean(studentId);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    parentName: "",
    parentPhone: "",
  });

  useEffect(() => {
    if (!editing) return;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`${API}/students`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Không thể tải học sinh.");
        const students: Student[] = await response.json();
        const student = students.find((item) => item.id === studentId);
        if (!student) throw new Error("Không tìm thấy học sinh.");
        setForm({
          name: student.name,
          parentName: student.parentName ?? "",
          parentPhone: student.parentPhone ?? "",
        });
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
  }, [studentId, editing]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(
      editing ? `${API}/students/${studentId}` : `${API}/students`,
      {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      },
    );
    setSaving(false);
    if (response.ok) navigate("/students");
    else setError("Không thể lưu học sinh.");
  }

  return (
    <MobileShell>
      <PageHeader
        title={editing ? "Sửa học sinh" : "Thêm học sinh"}
        action={<UserAvatar />}
      />
      <main className="mx-auto max-w-3xl px-4 py-5 sm:py-8">
        <Button
          asChild
          variant="link"
          className="mb-4 h-auto p-0 text-muted-foreground"
        >
          <Link to="/students">
            <ArrowLeft size={16} /> Quay lại học sinh
          </Link>
        </Button>
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} /> Đang tải...
          </p>
        ) : (
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserRound size={20} /> Hồ sơ liên hệ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="student-name">Tên học sinh</Label>
                  <Input
                    id="student-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parent-name">Tên phụ huynh</Label>
                  <Input
                    id="parent-name"
                    value={form.parentName}
                    onChange={(e) =>
                      setForm({ ...form, parentName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parent-phone">Số điện thoại</Label>
                  <Input
                    id="parent-phone"
                    value={form.parentPhone}
                    onChange={(e) =>
                      setForm({ ...form, parentPhone: e.target.value })
                    }
                  />
                </div>
                {error && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}
                <Button
                  disabled={saving}
                  className="min-h-12 w-full rounded-2xl sm:w-auto sm:px-8"
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  {saving ? "Đang lưu..." : "Lưu học sinh"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </MobileShell>
  );
}
