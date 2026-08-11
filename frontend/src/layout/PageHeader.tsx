import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  maxWidth?: "3xl" | "6xl";
};

const maxWidthClass = {
  "3xl": "max-w-3xl",
  "6xl": "max-w-6xl",
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  maxWidth = "6xl",
}: PageHeaderProps) {
  return (
    <header className="bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur">
      <div
        className={`mx-auto flex ${maxWidthClass[maxWidth]} items-center justify-between gap-4 px-4 py-4`}
      >
        <div className="min-w-0">
          {eyebrow && <p className="text-sm text-muted-foreground">{eyebrow}</p>}
          <h1 className="mt-0.5 truncate text-2xl font-bold">{title}</h1>
          {description && (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
