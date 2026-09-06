import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";
import { formatVnd, parseVnd } from "../lib/format";
import { API } from "../lib/api";

type TutorClass = {
  id: string;
  name: string;
  defaultPriceVnd: number | null;
  note: string | null;
};

export function ClassFormPage() {
  const { classId } = useParams();
  const editing = Boolean(classId);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", defaultPriceVnd: "", note: "" });

  useEffect(() => {
    if (!editing) return;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`${API}/classes`, {
        });
        if (!response.ok) throw new Error("Không thể tải lớp.");
        const classes: TutorClass[] = await response.json();
        const item = classes.find((classItem) => classItem.id === classId);
        if (!item) throw new Error("Không tìm thấy lớp.");
        setForm({
          name: item.name,
          defaultPriceVnd:
            item.defaultPriceVnd == null ? "" : String(item.defaultPriceVnd),
          note: item.note ?? "",
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
  }, [classId, editing]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(
      editing ? `${API}/classes/${classId}` : `${API}/classes`,
      {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          defaultPriceVnd: form.defaultPriceVnd
            ? parseVnd(form.defaultPriceVnd)
            : null,
          note: form.note || null,
        }),
      },
    );
    setSaving(false);
    if (response.ok) navigate("/classes");
    else setError("Không thể lưu lớp.");
  }

  return (
    <MobileShell>
      <PageHeader
        title={editing ? "Sửa lớp" : "Tạo lớp"}
        action={<UserAvatar />}
      />
      <main className="mx-auto max-w-3xl px-4 py-5 sm:py-8">
        <Button
          asChild
          variant="link"
          className="mb-4 h-auto p-0 text-muted-foreground"
        >
          <Link to="/classes">
            <ArrowLeft size={16} /> Quay lại lớp
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
                <BookOpen size={20} /> Thông tin lớp
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="class-name">Tên lớp</Label>
                  <Input
                    id="class-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="class-price">Giá mặc định</Label>
                  <Input
                    id="class-price"
                    inputMode="numeric"
                    max={10_000_000_000}
                    value={form.defaultPriceVnd}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        defaultPriceVnd: e.target.value
                          ? formatVnd(parseVnd(e.target.value)).replace(
                              " ₫",
                              "",
                            )
                          : "",
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="class-note">Ghi chú</Label>
                  <Input
                    id="class-note"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
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
                  {saving ? "Đang lưu..." : "Lưu lớp"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </MobileShell>
  );
}
