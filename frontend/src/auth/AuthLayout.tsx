import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

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

export function GoogleButton() {
  async function login() {
    const api = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
    const response = await fetch(`${api}/auth/google`);
    const { url } = await response.json();
    window.location.href = url;
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-12 w-full rounded-2xl"
      onClick={() => void login()}
    >
      <img
        src="/google-icon.png"
        alt=""
        aria-hidden="true"
        className="h-5 w-5"
      />
      <span>Tiếp tục với Google</span>
    </Button>
  );
}
