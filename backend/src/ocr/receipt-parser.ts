export type ParsedReceipt = {
  amountVnd: number | null;
  paidAt: string | null;
  note: string | null;
};

export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const amountVnd = parseAmount(lines);
  const paidAt = parsePaidAt(lines);
  const note = parseNote(lines);
  return { amountVnd, paidAt, note };
}

function parseAmount(lines: string[]) {
  for (const line of lines) {
    const match = line.match(/([\d][\d.,]*)\s*(?:VND|VNĐ|đ|₫|d)/i);
    if (!match) continue;
    const digits = match[1].replace(/[.,]/g, "");
    const amount = Number(digits);
    if (Number.isSafeInteger(amount) && amount > 0) return amount;
  }
  return null;
}

function parsePaidAt(lines: string[]) {
  for (const line of lines) {
    const match = line.match(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!match) continue;
    const [, hour, minute, day, month, year] = match;
    const date = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:00+07:00`);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

function parseNote(lines: string[]) {
  const line = lines.find((item) => {
    const normalized = item.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return normalized.includes("chuyen tien") && !normalized.includes("chuyen tien thanh cong");
  });
  return line ?? null;
}
