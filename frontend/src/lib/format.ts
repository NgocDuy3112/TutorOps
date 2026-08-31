export function formatVnd(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString("vi-VN")} ₫`;
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
