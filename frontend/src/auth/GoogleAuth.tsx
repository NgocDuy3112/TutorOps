import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { API } from "../lib/api";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

type GoogleCredentialResponse = { credential: string };

type GooglePromptNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
};

type GoogleAccountId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  prompt: (listener?: (notification: GooglePromptNotification) => void) => void;
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
 * Google sign-in entry point. Tapping the button attempts Google One Tap
 * (native account chooser). One Tap is browser-controlled and can be
 * suppressed (cooldown, dismissed earlier, FedCM denial) — the prompt
 * notification tells us when that happens and we fall back to the classic
 * OAuth redirect so the button never dead-ends.
 */
export function GoogleButton({ onSuccess }: GoogleButtonProps) {
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const handleClick = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) return redirectToGoogle();

    try {
      await loadGoogleIdentity();
    } catch {
      return redirectToGoogle();
    }
    if (!window.google?.accounts.id) return redirectToGoogle();

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        const res = await fetch(`${API}/auth/google/onetap`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        if (res.ok) {
          onSuccessRef.current();
          return;
        }
        // One Tap exchange failed — fall back to the redirect flow.
        redirectToGoogle();
      },
    });

    let redirected = false;
    const fallback = () => {
      if (redirected) return;
      redirected = true;
      redirectToGoogle();
    };
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment())
        fallback();
    });
  }, []);

  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-12 w-full rounded-2xl"
      onClick={() => void handleClick()}
    >
      <GoogleIcon />
      <span>Tiếp tục với Google</span>
    </Button>
  );
}
