export function formatVnd(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString("vi-VN")} ₫`;
}

export function parseVnd(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}
