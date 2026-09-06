import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Coins,
  Loader2,
  Plus,
  User,
  BookOpenCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Fab } from "@/components/Fab";
import { FilterChips } from "@/components/FilterChips";
import { formatVnd } from "../lib/format";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { UserAvatar } from "../layout/UserAvatar";
import { venueLabel, VENUE_OPTIONS } from "./venue";
import { API } from "../lib/api";

export type Student = { id: string; name: string; parentPhone: string | null };
export type ScheduleSlot = { weekday: number; startTime: string; endTime: string };
export type TutorClass = {
  id: string;
  name: string;
  subject: string | null;
  defaultPriceVnd: number | null;
  pricingMode?: "per_session" | "per_hour" | "per_month";
  autoSchedule?: boolean;
  schedules?: ScheduleSlot[];
  venue?: string | null;
  note: string | null;
  studentCount: number;
  students: Student[];
};

export function ClassesPage() {
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [venueFilter, setVenueFilter] = useState("all");
  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/classes`, {
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

  const venueCounts = new Map<string, number>();
  for (const item of classes) {
    const key = item.venue ?? "none";
    venueCounts.set(key, (venueCounts.get(key) ?? 0) + 1);
  }
  const venueFilterOptions = [
    { value: "all", label: "Tất cả", count: classes.length },
    ...VENUE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
      count: venueCounts.get(option.value) ?? 0,
    })),
    ...(venueCounts.get("none")
      ? [{ value: "none", label: "Chưa phân loại", count: venueCounts.get("none")! }]
      : []),
  ].filter((option) => option.value === "all" || (option.count ?? 0) > 0);

  const filteredClasses =
    venueFilter === "all"
      ? classes
      : classes.filter(
          (item) => (item.venue ?? "none") === venueFilter,
        );

  return (
    <MobileShell>
      <PageHeader title="Lớp" action={<UserAvatar />} />
      <Fab onClick={() => navigate("/classes/new")} label="Tạo lớp" />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {classes.length > 0 && (
          <div className="mb-4">
            <FilterChips
              ariaLabel="Lọc theo nơi dạy"
              options={venueFilterOptions}
              value={venueFilter}
              onChange={setVenueFilter}
            />
          </div>
        )}
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
        ) : filteredClasses.length === 0 ? (
          <EmptyState
            icon={<BookOpenCheck size={28} />}
            title="Không tìm thấy"
            description="Thử chọn nhóm nơi dạy khác."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((item) => (
              <ClassCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </MobileShell>
  );
}


function ClassCard({ item }: { item: TutorClass }) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
      <CardContent className="p-4">
        <Link to={`/classes/${item.id}`} className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-primary">
            <BookOpen size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-bold hover:text-primary">
              {item.name}
            </h2>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <User size={13} className="shrink-0" />
              {item.studentCount}
              {item.defaultPriceVnd != null && (
                <>
                  <span aria-hidden="true">·</span>
                  <Coins size={13} className="shrink-0" />
                  {formatVnd(item.defaultPriceVnd)}
                  {item.pricingMode === "per_hour"
                    ? "/giờ"
                    : item.pricingMode === "per_month"
                      ? "/tháng"
                      : "/buổi"}
                </>
              )}
              {venueLabel(item.venue) && (
                <>
                  <span aria-hidden="true">·</span>
                  {venueLabel(item.venue)}
                </>
              )}
            </p>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
