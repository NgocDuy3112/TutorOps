import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "./AuthLayout";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
  onSuccess: () => void;
};

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const isLogin = mode === "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "login" : "register";
    const response = await fetch(`${API}/auth/${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, rememberMe }),
    });

    setLoading(false);

    if (response.ok) {
      onSuccess();
      return;
    }

    setError(
      isLogin
        ? "Email hoặc mật khẩu không đúng."
        : "Không thể tạo tài khoản. Email có thể đã được sử dụng.",
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-1 flex-col">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            required
            type="password"
            minLength={8}
            maxLength={64}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="size-4 accent-indigo-600"
          />
          Ghi nhớ đăng nhập
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      <div className="safe-bottom mt-auto space-y-3 pb-2 pt-8">
        <Button disabled={loading} className="min-h-12 w-full rounded-2xl">
          {loading
            ? isLogin
              ? "Đang đăng nhập..."
              : "Đang tạo..."
            : isLogin
              ? "Đăng nhập"
              : "Tạo tài khoản"}
        </Button>

        <GoogleButton />

        <p className="text-center text-base text-muted-foreground">
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
          <Link
            to={isLogin ? "/signup" : "/login"}
            className="font-medium text-primary"
          >
            {isLogin ? "Đăng ký" : "Đăng nhập"}
          </Link>
        </p>
      </div>
    </form>
  );
}
