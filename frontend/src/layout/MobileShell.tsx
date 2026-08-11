import { ReactNode, type ComponentType } from "react";
import { Link, useLocation } from "react-router-dom";
import { ClipboardList, Home, Settings, Users } from "lucide-react";

type MobileShellProps = {
  children: ReactNode;
};

type NavigationItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

const navigationItems: NavigationItem[] = [
  { href: "/", label: "Tổng quan", icon: Home },
  { href: "/students", label: "Học sinh", icon: Users },
  { href: "/assignments", label: "Bài tập", icon: ClipboardList },
  { href: "/settings", label: "Cá nhân", icon: Settings },
];

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900 sm:pb-0">
      {children}
      <TeacherBottomNavigation />
    </div>
  );
}

function TeacherBottomNavigation() {
  const { pathname } = useLocation();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 px-1 py-2 backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex min-h-12 flex-col items-center justify-center rounded-xl px-1 text-[11px] font-medium",
                isActive
                  ? "text-indigo-600"
                  : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              <item.icon
                size={28}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
