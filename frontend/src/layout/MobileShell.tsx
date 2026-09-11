import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { navigationItems } from "./navigation";

type MobileShellProps = {
  children: ReactNode;
};

export function MobileShell({ children }: MobileShellProps) {
  // ONE copy of `children`. Previously this shell rendered children twice
  // (mobile copy + DesktopShell copy) and toggled them with CSS. That
  // duplicated every id on the page (e.g. EditClassSheet's
  // `form#edit-class-info-form`), so a `<Button form=...>` outside the form
  // submitted the FIRST matching form — the hidden copy's stale state — and
  // silently dropped edits. Never render children more than once.
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 sm:flex">
      <DesktopSidebar />
      {/* Nav must be a sibling of the motion-page container: the page-in
          animation leaves a transform on it, which would turn it into the
          containing block for position:fixed and make the nav scroll away. */}
      <div className="motion-page min-h-screen min-w-0 flex-1 pb-20 sm:pb-0">
        {children}
      </div>
      <TeacherBottomNavigation />
    </div>
  );
}

function DesktopSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden sticky top-0 h-screen w-64 shrink-0 border-r border-slate-200 bg-white/90 px-4 py-5 shadow-sm shadow-slate-200/60 backdrop-blur sm:block">
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

function TeacherBottomNavigation() {
  const { pathname } = useLocation();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 px-1 py-2 backdrop-blur sm:hidden">
      {/* auto-cols-fr: one equal column per item, adapts when tabs are added/removed */}
      <div className="mx-auto grid max-w-lg grid-flow-col auto-cols-fr">
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
