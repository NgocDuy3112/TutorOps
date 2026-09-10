import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ScheduleSlot = {
  weekday: number;
  startTime: string;
  endTime: string;
};

const WEEKDAYS = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

/**
 * Editor for fixed weekly schedule slots (weekday + start/end VN local time).
 * Controlled component: parent owns the slot list.
 */
export function ScheduleEditor({
  slots,
  onChange,
}: {
  slots: ScheduleSlot[];
  onChange: (slots: ScheduleSlot[]) => void;
}) {
  function update(index: number, patch: Partial<ScheduleSlot>) {
    onChange(slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  }

  function remove(index: number) {
    onChange(slots.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {slots.map((slot, index) => (
        <div
          key={index}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5"
        >
          <Select
            value={String(slot.weekday)}
            onValueChange={(value) => update(index, { weekday: Number(value) })}
          >
            <SelectTrigger className="min-h-9 w-30 shrink-0 rounded-lg px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((label, weekday) => (
                <SelectItem key={weekday} value={String(weekday)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="time"
            value={slot.startTime}
            onChange={(event) => update(index, { startTime: event.target.value })}
            aria-label="Giờ bắt đầu"
            className="min-h-9 min-w-0 flex-1 rounded-lg px-2 text-xs [&::-webkit-calendar-picker-indicator]:hidden"
          />
          <span aria-hidden className="shrink-0 text-xs text-muted-foreground">
            –
          </span>
          <Input
            type="time"
            value={slot.endTime}
            onChange={(event) => update(index, { endTime: event.target.value })}
            aria-label="Giờ kết thúc"
            className="min-h-9 min-w-0 flex-1 rounded-lg px-2 text-xs [&::-webkit-calendar-picker-indicator]:hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-9 min-w-9 shrink-0 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Xoá khung giờ"
            onClick={() => remove(index)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="min-h-9 w-full rounded-xl text-sm"
        onClick={() => onChange([...slots, { weekday: 1, startTime: "18:00", endTime: "19:30" }])}
      >
        <Plus size={14} />
        Thêm khung giờ
      </Button>
    </div>
  );
}
