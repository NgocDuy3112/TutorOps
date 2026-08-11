import { FormEvent, useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "../layout/MobileShell";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function ChangePasswordPage() {
  const [values, setValues] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(`${API}/auth/password`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });
    setMessage(
      response.ok ? "Đã đổi mật khẩu" : "Mật khẩu hiện tại không đúng",
    );
    if (response.ok) setValues({ currentPassword: "", newPassword: "" });
  }

  return (
    <MobileShell>
      <main className="mx-auto max-w-2xl px-4 py-5">
        <Button
          asChild
          variant="link"
          className="h-auto p-0 text-muted-foreground"
        >
          <Link to="/settings">
            <ArrowLeft size={17} />
            Cá nhân
          </Link>
        </Button>
        <Card className="mt-5 rounded-2xl">
          <CardHeader className="flex-row items-center gap-2 p-5 pb-0">
            <KeyRound className="text-primary" size={20} />
            <div>
              <h1 className="text-xl font-bold">Đổi mật khẩu</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Dùng mật khẩu dài và khó đoán.
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Input
                  id="currentPassword"
                  required
                  type="password"
                  value={values.currentPassword}
                  onChange={(event) =>
                    setValues({
                      ...values,
                      currentPassword: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  required
                  minLength={8}
                  type="password"
                  value={values.newPassword}
                  onChange={(event) =>
                    setValues({ ...values, newPassword: event.target.value })
                  }
                />
              </div>
              <Button>Cập nhật mật khẩu</Button>
              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </MobileShell>
  );
}
