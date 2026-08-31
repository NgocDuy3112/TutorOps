import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-violet-50 text-primary">
        {icon}
      </span>
      <h3 className="mt-4 text-base font-bold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
