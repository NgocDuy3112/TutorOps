import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { API } from "../lib/api";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

type GoogleCredentialResponse = { credential: string };

type GoogleAccountId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  prompt: () => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountId } };
  }
}

/** Load the Google Identity Services script once per page load. */
let gsiPromise: Promise<void> | null = null;

function loadGoogleIdentity(): Promise<void> {
  gsiPromise ??= new Promise((resolve, reject) => {
    if (window.google?.accounts.id) return resolve();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gsiPromise = null;
      reject(new Error("Không tải được Google Identity Services."));
    };
    document.head.appendChild(script);
  });
  return gsiPromise;
}

function redirectToGoogle() {
  void (async () => {
    const response = await fetch(`${API}/auth/google`);
    const { url } = await response.json();
    window.location.href = url;
  })();
}

function GoogleIcon() {
  return (
    <img
      src="/google-icon.png"
      alt=""
      aria-hidden="true"
      className="h-5 w-5"
    />
  );
}

type GoogleButtonProps = { onSuccess: () => void };

/**
 * Responsive Google sign-in entry point.
 * Desktop keeps the direct OAuth redirect button; on mobile the button
 * opens a bottom sheet that attempts Google One Tap and falls back to
 * the redirect flow.
 */
export function GoogleButton({ onSuccess }: GoogleButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="hidden min-h-12 w-full rounded-2xl md:inline-flex"
        onClick={redirectToGoogle}
      >
        <GoogleIcon />
        <span>Tiếp tục với Google</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        className="min-h-12 w-full rounded-2xl md:hidden"
        onClick={() => setOpen(true)}
      >
        <GoogleIcon />
        <span>Tiếp tục với Google</span>
      </Button>

      <GoogleAuthSheet
        open={open}
        onOpenChange={setOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}

type GoogleAuthSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

function GoogleAuthSheet({
  open,
  onOpenChange,
  onSuccess,
}: GoogleAuthSheetProps) {
  const [error, setError] = useState("");
  const [prompted, setPrompted] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      setError("");
      const res = await fetch(`${API}/auth/google/onetap`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      if (res.ok) {
        onOpenChange(false);
        onSuccessRef.current();
        return;
      }
      setError("Không đăng nhập được bằng Google. Thử lại hoặc dùng nút bên dưới.");
    },
    [onOpenChange],
  );

  // One Tap can only be triggered by the browser — calling prompt() when
  // the sheet opens is best-effort; the redirect button below is the
  // guaranteed fallback when the prompt is suppressed or dismissed.
  useEffect(() => {
    if (!open) {
      setPrompted(false);
      return;
    }
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !window.google?.accounts.id) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => void handleCredential(response),
        });
        window.google.accounts.id.prompt();
        setPrompted(true);
      })
      .catch(() => setError("Không tải được Google Sign-In."));
    return () => {
      cancelled = true;
    };
  }, [open, handleCredential]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Đăng nhập với Google</SheetTitle>
          <SheetDescription>
            {prompted
              ? "Chọn tài khoản Google trong cửa sổ vừa hiện. Nếu không thấy, bấm nút bên dưới."
              : "Tiếp tục bằng tài khoản Google của bạn."}
          </SheetDescription>
        </SheetHeader>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          className="mt-4 min-h-12 w-full rounded-2xl"
          onClick={redirectToGoogle}
        >
          <GoogleIcon />
          <span>Tiếp tục với Google</span>
        </Button>
      </SheetContent>
    </Sheet>
  );
}
