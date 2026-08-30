import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Loader2, Pencil, Plus, Trash2, Users, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { formatVnd } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";
import { EditClassSheet } from "./EditClassSheet";

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
  const [editing, setEditing] = useState<TutorClass | null>(null);
  const [deleting, setDeleting] = useState<TutorClass | null>(null);
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
          <EmptyState
            icon={<BookOpenCheck size={28} />}
            title="Chưa có lớp nào"
            description="Tạo lớp để nhóm học sinh lại, đặt đơn giá mặc định và quản lý dễ dàng hơn."
            action={
              <Button className="min-h-11 rounded-2xl" onClick={() => navigate("/classes/new")}>
                <Plus size={16} />
                Tạo lớp
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((item) => (
              <ClassCard
                key={item.id}
                item={item}
                onEdit={() => setEditing(item)}
                onDelete={() => setDeleting(item)}
              />
            ))}
          </div>
        )}
      </main>
      {editing && (
        <EditClassSheet
          classItem={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
      <DeleteClassDialog
        classItem={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const response = await fetch(`${API}/classes/${deleting.id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (response.ok) {
            setClasses((current) => current.filter((c) => c.id !== deleting.id));
          }
          setDeleting(null);
        }}
      />
    </MobileShell>
  );
}
function ClassCard({
  item,
  onEdit,
  onDelete,
}: {
  item: TutorClass;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
            <p className="mt-1 text-sm text-muted-foreground">
              {item.studentCount} học sinh
              {item.defaultPriceVnd != null && (
                <> · {formatVnd(item.defaultPriceVnd)}/buổi</>
              )}
            </p>
            {item.note && (
              <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
            )}
          </Link>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="icon"
              className="min-h-10 min-w-10 rounded-2xl"
              onClick={onEdit}
              aria-label="Sửa lớp"
            >
              <Pencil size={15} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="min-h-10 min-w-10 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onDelete}
              aria-label="Xóa lớp"
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeleteClassDialog({
  classItem,
  onOpenChange,
  onConfirm,
}: {
  classItem: TutorClass | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(classItem)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa lớp?</DialogTitle>
          <DialogDescription>
            Lớp {classItem?.name} sẽ bị ẩn khỏi danh sách. Học sinh và dữ liệu liên quan vẫn được giữ.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="min-h-11 bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
          >
            <Trash2 size={16} />
            Xóa lớp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
