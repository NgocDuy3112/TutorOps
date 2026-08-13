import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { DesktopShell } from "./DesktopShell";
import { navigationItems } from "./navigation";

type MobileShellProps = {
  children: ReactNode;
};

export function MobileShell({ children }: MobileShellProps) {
  return (
    <>
      <div className="motion-page min-h-screen bg-slate-50 pb-20 text-slate-900 sm:hidden">
        {children}
        <TeacherBottomNavigation />
      </div>
      <DesktopShell>{children}</DesktopShell>
    </>
  );
}

function TeacherBottomNavigation() {
  const { pathname } = useLocation();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 px-1 py-2 backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
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
