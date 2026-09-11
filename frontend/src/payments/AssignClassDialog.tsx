import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatVnd, formatMonthLabel } from "../lib/format";
import { API } from "../lib/api";

/** "YYYY-MM" → Date for month labels (same convention as `monthKey`). */
function monthToDate(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

type LegacyPayment = {
  id: string;
  amountVnd: number;
  paidAt: string;
  appliesToMonth: string;
  note: string | null;
  studentName: string | null;
};

type ClassOption = { id: string; name: string };

type AssignClassDialogProps = {
  /** Non-null opens the dialog (legacy "Chưa phân lớp" row was tapped). */
  legacy: { name: string } | null;
  /** Viewed tuition month ("YYYY-MM") — legacy payments are filtered to it. */
  month: string;
  onOpenChange: (open: boolean) => void;
  onSaved: (className: string) => void;
};

export function AssignClassDialog({
  legacy,
  month,
  onOpenChange,
  onSaved,
}: AssignClassDialogProps) {
  const [payments, setPayments] = useState<LegacyPayment[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classByPayment, setClassByPayment] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [paymentsResponse, classesResponse] = await Promise.all([
        fetch(`${API}/payments/legacy?month=${month}`),
        fetch(`${API}/classes`),
      ]);
      if (!paymentsResponse.ok)
        throw new Error("Không thể tải khoản thu cũ.");
      if (!classesResponse.ok)
        throw new Error("Không thể tải danh sách lớp.");
      const paymentBody = (await paymentsResponse.json()) as {
        payments: LegacyPayment[];
      };
      setPayments(paymentBody.payments);
      setClasses(
        (await classesResponse.json()) as ClassOption[],
      );
      setClassByPayment({});
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    if (!legacy) return;
    void load();
  }, [legacy, load]);

  async function assign(payment: LegacyPayment) {
    const classId = classByPayment[payment.id];
    if (!classId) return;
    setAssigningId(payment.id);
    setError("");
    try {
      const response = await fetch(
        `${API}/payments/${payment.id}/assign-class`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ classId }),
        },
      );
      if (response.status === 409)
        throw new Error("Khoản thu này đã được gán vào lớp khác.");
      if (!response.ok)
        throw new Error("Không thể gán khoản thu. Vui lòng thử lại.");
      setPayments((current) => current.filter((item) => item.id !== payment.id));
      onSaved(
        classes.find((option) => option.id === classId)?.name ?? "",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Có lỗi xảy ra.",
      );
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <Dialog open={Boolean(legacy)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gán khoản thu vào lớp</DialogTitle>
          <DialogDescription>
            Các khoản thu cũ chưa thuộc lớp nào. Chọn lớp để tính vào học phí của
            lớp đó — mỗi khoản chỉ gán được một lần.
          </DialogDescription>
        </DialogHeader>
        {loading && (
          <p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={16} />
            Đang tải...
          </p>
        )}
        {!loading && error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {!loading && !error && payments.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            Không còn khoản thu cũ nào cho {formatMonthLabel(monthToDate(month))}.
          </p>
        )}
        {!loading && payments.length > 0 && (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {formatVnd(payment.amountVnd)}
                    {payment.studentName && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {payment.studentName}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Áp dụng {formatMonthLabel(monthToDate(payment.appliesToMonth))}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Select
                    value={classByPayment[payment.id] ?? ""}
                    onValueChange={(value) =>
                      setClassByPayment((current) => ({
                        ...current,
                        [payment.id]: value,
                      }))
                    }
                  >
                    <SelectTrigger
                      aria-label={`Chọn lớp cho khoản của ${payment.studentName ?? "học sinh"}`}
                      className="min-h-11 w-full rounded-2xl sm:w-40"
                    >
                      <SelectValue placeholder="Chọn lớp" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    className="min-h-11 rounded-2xl px-3 text-xs font-bold"
                    disabled={!classByPayment[payment.id] || assigningId != null}
                    aria-label={`Gán khoản của ${payment.studentName ?? "học sinh"} vào lớp`}
                    onClick={() => void assign(payment)}
                  >
                    {assigningId === payment.id ? (
                      <Loader2 className="animate-spin" size={15} />
                    ) : (
                      "Gán"
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
