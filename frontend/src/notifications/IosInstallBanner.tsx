import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { isIosBrowserNotStandalone } from "@/lib/platform";

const DISMISS_KEY = "tutorops.ios_install_banner_dismissed";

/**
 * Persistent banner shown on iOS Safari (regular tab, PWA not installed).
 * Web Push only works inside an installed PWA on iOS, so guide the user
 * through Add to Home Screen before they try enabling notifications.
 */
export function IosInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIosBrowserNotStandalone()) return;
    if (window.localStorage.getItem(DISMISS_KEY)) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-24 z-30 rounded-2xl border border-indigo-100 bg-white p-4 shadow-lg shadow-slate-300/50 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-sm"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-primary">
          <Bell size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            Nhận thông báo trên iPhone
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Nhấn nút Chia sẻ → “Thêm vào Màn hình chính”, sau đó mở app từ icon
            và bật thông báo trong Cài đặt.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Đóng hướng dẫn"
          className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
