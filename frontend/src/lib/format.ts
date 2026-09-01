export function formatVnd(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString("vi-VN")} ₫`;
}

// Serialise a Date into the local wall-clock string ("YYYY-MM-DDTHH:mm") that a
// datetime-local input expects. Uses local get* parts so no UTC shift happens;
// toISOString().slice() would move the time by the timezone offset (e.g. -7h in VN).
export function toLocalDateTimeInput(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Local calendar date ("YYYY-MM-DD"), same rationale as above.
export function toLocalDateInput(date: Date | null | undefined): string {
  return toLocalDateTimeInput(date).slice(0, 10);
}

export function parseVnd(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(date: Date) {
  return `Tháng ${date.getMonth() + 1} / ${date.getFullYear()}`;
}

// Deadline label like "12h00, 29/07" (24h local time).
export function formatDeadline(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}h${pad(date.getMinutes())}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}
