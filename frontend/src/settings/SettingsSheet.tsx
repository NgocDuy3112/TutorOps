import { type ReactNode, useState } from "react";
import {
  Bell,
  ChevronRight,
  Info,
  KeyRound,
  Loader2,
  LogOut,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PushNotificationSetup } from "../notifications/PushNotificationSetup";
import { API } from "../lib/api";

/**
 * Sidebar "Cá nhân" mở từ avatar trên mọi page header.
 * Thay thế trang /settings cũ — các route con (profile, password) vẫn giữ.
 */
export function SettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch(`${API}/auth/logout`, { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Cá nhân</SheetTitle>
        </SheetHeader>

        <div className="flex min-h-full flex-col">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SettingsLink
              to="/settings/profile"
              icon={<UserRound size={18} />}
              title="Thông tin cá nhân"
              description="Họ tên, số điện thoại, email"
              onNavigate={() => onOpenChange(false)}
            />
            <SettingsLink
              to="/settings/password"
              icon={<KeyRound size={18} />}
              title="Đổi mật khẩu"
              description="Cập nhật mật khẩu đăng nhập"
              onNavigate={() => onOpenChange(false)}
            />
            <div className="flex items-center gap-3 border-t border-slate-100 px-3 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-primary">
                <Bell size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm">Thông báo</strong>
                <small className="text-xs text-muted-foreground">
                  Nhận cập nhật từ TutorOps
                </small>
              </span>
              <PushNotificationSetup />
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            disabled={loggingOut}
            onClick={() => void logout()}
            className="mt-4 w-full text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {loggingOut && <Loader2 size={16} className="animate-spin" />}
            <LogOut size={16} />
            Đăng xuất
          </Button>

          <p className="mt-6 flex items-center justify-center gap-1 pb-2 text-xs text-muted-foreground">
            <Info size={13} />
            Quản lý tài khoản TutorOps
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SettingsLink({
  to,
  icon,
  title,
  description,
  onNavigate,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="flex items-center gap-3 border-b border-slate-100 px-3 py-3.5 transition-colors last:border-b-0 hover:bg-accent"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm">{title}</strong>
        <small className="text-xs text-muted-foreground">{description}</small>
      </span>
      <ChevronRight size={17} className="shrink-0 text-muted-foreground" />
    </Link>
  );
}
