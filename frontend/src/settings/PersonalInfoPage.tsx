import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ImageUp, Loader2, Pencil, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileShell } from "../layout/MobileShell";
import { API } from "../lib/api";
type Profile = {
  fullName: string;
  email: string;
  phone: string;
  paymentQrUrl?: string | null;
};

export function PersonalInfoPage() {
  const [profile, setProfile] = useState<Profile>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrMessage, setQrMessage] = useState("");
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/auth/me`)
      .then((r) => r.json())
      .then(setProfile);
  }, []);

  async function uploadQr(file: File) {
    setUploadingQr(true);
    setQrMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${API}/auth/payment-qr`, {
        method: "POST",
        body,
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setProfile((current) => ({ ...current, paymentQrUrl: data.paymentQrUrl }));
      setQrMessage("Đã cập nhật mã QR");
    } catch {
      setQrMessage("Không thể tải ảnh QR. Chỉ nhận PNG/JPG.");
    } finally {
      setUploadingQr(false);
      if (qrInputRef.current) qrInputRef.current.value = "";
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const response = await fetch(`${API}/auth/profile`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
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
                <Label htmlFor="phone">Số điện thoại (10 chữ số)</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="^0\d{9}$"
                  maxLength={10}
                  placeholder="0912345678"
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

        <Card className="mt-4 rounded-2xl">
          <CardHeader className="p-5 pb-0">
            <h2 className="text-lg font-bold">Mã QR thanh toán</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ảnh QR từ app ngân hàng của bạn, hiện trên phiếu tổng kết gửi phụ huynh.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-4">
              {profile.paymentQrUrl ? (
                <img
                  alt="Mã QR thanh toán"
                  className="h-24 w-24 rounded-lg border object-contain"
                  src={profile.paymentQrUrl}
                />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-lg border border-dashed text-xs text-muted-foreground">
                  Chưa có
                </div>
              )}
              <div>
                <input
                  ref={qrInputRef}
                  accept="image/png,image/jpeg"
                  className="hidden"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadQr(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={uploadingQr}
                  onClick={() => qrInputRef.current?.click()}
                >
                  {uploadingQr ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <ImageUp size={16} />
                  )}
                  {profile.paymentQrUrl ? "Đổi ảnh QR" : "Tải ảnh QR"}
                </Button>
                {qrMessage && (
                  <p className="mt-2 text-sm text-muted-foreground">{qrMessage}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </MobileShell>
  );
}
