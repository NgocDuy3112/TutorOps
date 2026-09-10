import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toast({
    message,
    onClose,
    duration = 4000,
}: {
    message: string;
    onClose: () => void;
    duration?: number;
}) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    return (
        <div
            role="status"
            className={cn(
                "fixed inset-x-4 bottom-24 z-40 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/30 sm:inset-x-auto sm:right-6 sm:max-w-sm",
            )}
        >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={15} />
            </span>
            <span className="min-w-0 flex-1 leading-snug">{message}</span>
        </div>
    );
}
