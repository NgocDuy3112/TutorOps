import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function VersionBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`${API}/version`, { cache: "no-store" });
        if (!res.ok) return;
        const { version } = await res.json();
        if (!cancelled && version !== __APP_VERSION__) {
          setShow(true);
        }
      } catch {
      }
    }

    check();
    document.addEventListener("visibilitychange", check);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm text-white shadow-lg">
      <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
      <span className="font-medium">Có bản cập nhật mới.</span>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 rounded-full bg-white/20 px-3 text-xs font-semibold text-white hover:bg-white/30"
        onClick={() => window.location.reload()}
      >
        Tải lại
      </Button>
    </div>
  );
}
