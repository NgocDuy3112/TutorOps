import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-xl rounded-3xl">
        <CardContent className="p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            TutorOps
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-base text-muted-foreground">{description}</p>
          {children}
        </CardContent>
      </Card>
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
      onClick={() => void login()}
      className="mt-4 w-full"
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
