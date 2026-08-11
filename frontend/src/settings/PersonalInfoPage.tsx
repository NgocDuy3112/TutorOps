import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Pencil, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "../layout/MobileShell";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
type Profile = { fullName: string; email: string; phone: string };

export function PersonalInfoPage() {
  const [profile, setProfile] = useState<Profile>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((r) => r.json())
      .then(setProfile);
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(`${API}/auth/profile`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        fullName: profile.fullName,
        phone: profile.phone,
      }),
    });
    if (response.ok) {
      setEditing(false);
      setMessage("Đã lưu thay đổi");
    }
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
          <CardHeader className="flex-row items-start justify-between gap-4 p-5 pb-0">
            <div>
              <h1 className="text-xl font-bold">Thông tin cá nhân</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Thông tin tài khoản của bạn
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil size={16} />
              Sửa
            </Button>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Họ tên</Label>
                <Input
                  id="fullName"
                  required
                  value={profile.fullName}
                  readOnly={!editing}
                  onChange={(event) =>
                    setProfile({ ...profile, fullName: event.target.value })
                  }
                  className={!editing ? "border-transparent bg-muted" : ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  readOnly={!editing}
                  onChange={(event) =>
                    setProfile({ ...profile, phone: event.target.value })
                  }
                  className={!editing ? "border-transparent bg-muted" : ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email}
                  readOnly
                  className="bg-muted"
                />
              </div>
              {editing && (
                <div className="flex gap-2">
                  <Button>
                    <Save size={16} />
                    Lưu
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditing(false)}
                  >
                    Hủy
                  </Button>
                </div>
              )}
              {message && <p className="text-sm text-emerald-600">{message}</p>}
            </form>
          </CardContent>
        </Card>
      </main>
    </MobileShell>
  );
}
