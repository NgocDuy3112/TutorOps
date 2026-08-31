import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

declare const __APP_VERSION__: string;

export function VersionBanner() {
  const [show, setShow] = useState(false);

  const check = useCallback(async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const { version } = (await res.json()) as { version: string };
      setShow(version !== __APP_VERSION__);
    } catch {
      // Version endpoint unreachable — keep current state.
    }
  }, []);

  useEffect(() => {
    void check();
    function onVisibility() {
      if (document.visibilityState === "visible") void check();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, [check]);

  if (!show) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-linear-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm text-white shadow-lg"
    >
      <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
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
