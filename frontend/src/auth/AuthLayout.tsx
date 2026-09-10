import { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-xl flex-col">
        <section className="pt-8 sm:pt-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            TutorOps
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-base text-muted-foreground">
              {description}
            </p>
          )}
        </section>
        {children}
      </div>
    </main>
  );
}
