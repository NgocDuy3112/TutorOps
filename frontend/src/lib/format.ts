export function formatVnd(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString("vi-VN")} ₫`;
}
