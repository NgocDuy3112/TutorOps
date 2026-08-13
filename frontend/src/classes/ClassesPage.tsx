import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Loader2, Pencil, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";

export type Student = { id: string; name: string; parentPhone: string | null };
export type TutorClass = {
  id: string;
  name: string;
  subject: string | null;
  defaultPriceVnd: number | null;
  note: string | null;
  studentCount: number;
  students: Student[];
};
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function ClassesPage() {
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/classes`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Không thể tải lớp.");
      setClasses(await response.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
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
        title="Lớp"
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-2xl"
              onClick={() => navigate("/classes/new")}
            >
              <Plus size={16} />
              Tạo lớp
            </Button>
            <UserAvatar />
          </div>
        }
      />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && (
          <Card className="mb-4 border-red-100 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">
              {error}
            </CardContent>
          </Card>
        )}
        {loading ? (
          <p className="flex gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={17} />
            Đang tải...
          </p>
        ) : classes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <p className="text-sm text-muted-foreground">Không có dữ liệu.</p>
              <Button className="mt-3" onClick={() => navigate("/classes/new")}>
                <Plus size={16} />
                Tạo lớp
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((item) => (
              <ClassCard
                key={item.id}
                item={item}
                onEdit={() => navigate(`/classes/${item.id}/edit`)}
              />
            ))}
          </div>
        )}
      </main>
    </MobileShell>
  );
}
function ClassCard({ item, onEdit }: { item: TutorClass; onEdit: () => void }) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-primary">
            <BookOpen size={20} />
          </span>
          <Link to={`/classes/${item.id}`} className="min-w-0 flex-1">
            <h2 className="truncate font-bold hover:text-primary">
              {item.name}
            </h2>
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <Users size={15} />
              {item.studentCount} học sinh
            </p>
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-2xl"
            onClick={onEdit}
          >
            <Pencil size={15} />
            Sửa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
