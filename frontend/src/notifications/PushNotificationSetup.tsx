import { useEffect, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { isIosBrowserNotStandalone } from "@/lib/platform";
import { API } from "../lib/api";
type State =
  | "loading"
  | "enabled"
  | "disabled"
  | "unsupported"
  | "ios-browser"
  | "blocked"
  | "error";

function decodeKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function supported() {
  return "serviceWorker" in navigator && "PushManager" in window && window.isSecureContext;
}

export function PushNotificationSetup() {
  const [state, setState] = useState<State>("loading");
  const [errorDetail, setErrorDetail] = useState("");
  // Preloaded at page load so enable() can call requestPermission() and
  // subscribe() back-to-back inside the user gesture — WebKit (iOS)
  // requires both to run with fresh user activation.
  const publicKeyRef = useRef<string | null>(null);

  function fail(scope: string, error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[push] ${scope} failed:`, error);
    setErrorDetail(`${scope}: ${detail}`);
    setState("error");
  }

  useEffect(() => {
    void loadState();
  }, []);

  async function fetchPublicKey(): Promise<string | null> {
    if (publicKeyRef.current) return publicKeyRef.current;
    const keyResponse = await fetch(`${API}/notifications/public-key`);
    const { publicKey } = await keyResponse.json();
    if (publicKey) publicKeyRef.current = publicKey as string;
    return publicKeyRef.current;
  }

  async function loadState() {
    if (isIosBrowserNotStandalone()) {
      setState("ios-browser");
      return;
    }
    if (!supported()) {
      setState("unsupported");
      return;
    }
    // Preload the VAPID key — non-fatal if it fails, enable() retries.
    await fetchPublicKey().catch(() => undefined);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setState("disabled");
        return;
      }
      const response = await fetch(`${API}/notifications/subscriptions`, {
      });
      if (!response.ok) throw new Error();
      const body = await response.json() as { subscriptions: { endpoint: string }[] };
      if (body.subscriptions.some((item) => item.endpoint === subscription.endpoint)) {
        setState("enabled");
        return;
      }
      // iOS periodically revokes subscriptions server-side while the local
      // one is still valid — re-register instead of asking the user again.
      const saved = await fetch(`${API}/notifications/subscriptions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...subscription.toJSON(), userAgent: navigator.userAgent }),
      });
      setState(saved.ok ? "enabled" : "disabled");
    } catch (error) {
      fail("load", error);
    }
  }

  async function enable() {
    setState("loading");
    setErrorDetail("");
    try {
      // WebKit (iOS) requires requestPermission() to run synchronously
      // inside the user gesture — any await before it loses the gesture
      // and the permission dialog never appears. Ask first, fetch after.
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setState("blocked");
        return;
      }
      if (permission !== "granted") throw new Error("permission_default");
      const publicKey = await fetchPublicKey();
      if (!publicKey) throw new Error("missing_vapid_public_key");
      publicKeyRef.current = publicKey;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(publicKey),
      });
      const response = await fetch(`${API}/notifications/subscriptions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...subscription.toJSON(), userAgent: navigator.userAgent }),
      });
      if (!response.ok) throw new Error(`save_failed_${response.status}`);
      setState("enabled");
    } catch (error) {
      fail("enable", error);
    }
  }

  async function disable() {
    setState("loading");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch(`${API}/notifications/subscriptions`, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok) throw new Error();
        await subscription.unsubscribe();
      }
      setState("disabled");
    } catch (error) {
      fail("disable", error);
    }
  }

  if (state === "ios-browser") {
    return (
      <small className="max-w-48 text-right text-xs text-amber-600">
        Cài app vào Màn hình chính để bật thông báo
      </small>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Switch
        checked={state === "enabled"}
        disabled={state === "loading" || state === "unsupported"}
        aria-label="Thông báo đẩy"
        onCheckedChange={(checked) => void (checked ? enable() : disable())}
      />
      {state === "blocked" && (
        <small className="max-w-48 text-right text-xs text-amber-600">
          Đã bị chặn — bật lại trong Cài đặt iOS, mục Thông báo
        </small>
      )}
      {state === "error" && (
        <small className="max-w-56 text-right text-xs text-red-600">
          Có lỗi, thử bật lại
          {errorDetail ? ` (${errorDetail})` : null}
        </small>
      )}
    </div>
  );
}
