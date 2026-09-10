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
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      shape?: string;
      logo_alignment?: string;
      width?: number;
    },
  ) => void;
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
  const buttonRef = useRef<HTMLDivElement>(null);
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
      setError("Không đăng nhập được bằng Google. Thử lại nhé.");
    },
    [onOpenChange],
  );

  // One Tap prompt() is browser-controlled and may be suppressed
  // (cooldown / FedCM rules), so the sheet also renders Google's official
  // button. Clicking it opens the native account chooser (FedCM on Chrome
  // slides up from the bottom on mobile) and returns the ID token straight
  // to our callback — no full-page redirect involved.
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
        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "pill",
            logo_alignment: "center",
            width: buttonRef.current.clientWidth,
          });
        }
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
              ? "Chọn tài khoản Google trong cửa sổ vừa hiện."
              : "Chọn tài khoản Google để tiếp tục."}
          </SheetDescription>
        </SheetHeader>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Google renders its own button here — full width via the width
            option measured from this container. */}
        <div ref={buttonRef} className="mt-4 min-h-12 w-full" />
      </SheetContent>
    </Sheet>
  );
}
