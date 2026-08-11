import { type ReactNode } from "react";
import {
  ChevronRight,
  Info,
  KeyRound,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MobileShell } from "../layout/MobileShell";
import { PageHeader } from "../layout/PageHeader";
import { PushNotificationSetup } from "../notifications/PushNotificationSetup";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function SettingsPage() {
  async function logout() {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/login";
  }

  return (
    <MobileShell>
      <PageHeader
        maxWidth="3xl"
        title="Cá nhân"
      />
      <main className="mx-auto max-w-3xl px-4 py-5">
        <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm shadow-slate-200/70">
          <SettingsLink
            to="/settings/profile"
            icon={<UserRound size={19} />}
            title="Thông tin cá nhân"
            description="Họ tên, số điện thoại, email"
          />
          <SettingsLink
            to="/settings/password"
            icon={<KeyRound size={19} />}
            title="Đổi mật khẩu"
            description="Cập nhật mật khẩu đăng nhập"
          />
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="grid size-9 place-items-center rounded-lg bg-indigo-50 text-primary">
              <Settings size={19} />
            </span>
            <span className="flex-1">
              <strong className="block text-sm">Thông báo</strong>
              <small className="text-xs text-muted-foreground">
                Nhận cập nhật từ TutorOps
              </small>
            </span>
            <PushNotificationSetup />
          </div>
        </Card>

        <Button
          type="button"
          variant="ghost"
          onClick={() => void logout()}
          className="mt-4 w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut size={17} />
          Đăng xuất
        </Button>
        <p className="mt-5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Info size={13} />
          Quản lý tài khoản TutorOps
        </p>
      </main>
    </MobileShell>
  );
}

function SettingsLink({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 transition-colors hover:bg-accent"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-indigo-50 text-primary">
        {icon}
      </span>
      <span className="flex-1">
        <strong className="block text-sm">{title}</strong>
        <small className="text-xs text-muted-foreground">{description}</small>
      </span>
      <ChevronRight size={18} className="text-muted-foreground" />
    </Link>
  );
}
