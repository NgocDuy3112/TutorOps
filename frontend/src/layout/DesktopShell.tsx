import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { navigationItems } from "./navigation";

type DesktopShellProps = {
  children: ReactNode;
};

export function DesktopShell({ children }: DesktopShellProps) {
  return (
    <div className="hidden min-h-screen bg-slate-50 text-slate-900 sm:flex">
      <DesktopSidebar />
      <div className="motion-page min-w-0 flex-1">{children}</div>
    </div>
  );
}

function DesktopSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-slate-200 bg-white/90 px-4 py-5 shadow-sm shadow-slate-200/60 backdrop-blur">
      <div className="px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          TutorOps
        </p>
        <h1 className="mt-2 text-xl font-bold">Teacher workspace</h1>
      </div>

      <nav className="mt-8 space-y-2">
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
                "flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-violet-50 text-primary"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
