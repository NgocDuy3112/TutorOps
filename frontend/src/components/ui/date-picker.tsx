import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(date: Date | null) {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hour}:${minute}`;
}

type DatePickerProps = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  min?: Date;
  placeholder?: string;
  className?: string;
};

export function DatePicker({
  value,
  onChange,
  min,
  placeholder = "Chọn ngày giờ",
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ?? new Date());
  const [hour, setHour] = useState(value?.getHours() ?? new Date().getHours());
  const [minute, setMinute] = useState(value?.getMinutes() ?? 0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setViewDate(value);
      setHour(value.getHours());
      setMinute(value.getMinutes());
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const todayKey = dateKey(today);
  const selectedKey = value ? dateKey(value) : "";

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  function selectDay(day: number) {
    const selected = new Date(year, month, day, hour, minute);
    if (min && selected < min) return;
    setViewDate(selected);
    onChange(selected);
    setOpen(false);
  }

  function selectTime(newHour: number, newMinute: number) {
    setHour(newHour);
    setMinute(newMinute);
    if (value) {
      const updated = new Date(value);
      updated.setHours(newHour, newMinute);
      onChange(updated);
    }
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-input bg-background px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <CalendarDays size={18} className="shrink-0 text-muted-foreground" />
        <span className={value ? "" : "text-muted-foreground"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border bg-white p-4 shadow-lg sm:left-0 sm:right-auto sm:w-[340px]">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="grid size-9 place-items-center rounded-xl hover:bg-slate-100"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="grid size-9 place-items-center rounded-xl hover:bg-slate-100"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const key = dateKey(new Date(year, month, day));
              const isSelected = key === selectedKey;
              const isToday = key === todayKey;
              const isPast = min
                ? new Date(year, month, day) < new Date(min.getFullYear(), min.getMonth(), min.getDate())
                : false;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  disabled={isPast}
                  className={cn(
                    "grid size-9 place-items-center rounded-xl text-sm font-medium transition-colors",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && isToday && "bg-primary/10 text-primary font-bold",
                    !isSelected && !isPast && "hover:bg-slate-100",
                    isPast && "text-muted-foreground/40 cursor-not-allowed",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 border-t pt-3">
            <Clock size={16} className="text-muted-foreground" />
            <select
              value={hour}
              onChange={(e) => selectTime(Number(e.target.value), minute)}
              className="min-h-9 rounded-xl border bg-white px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, "0")}
                </option>
              ))}
            </select>
            <span className="text-sm font-bold">:</span>
            <select
              value={minute}
              onChange={(e) => selectTime(hour, Number(e.target.value))}
              className="min-h-9 rounded-xl border bg-white px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
