import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
type State = "loading" | "enabled" | "disabled" | "unsupported" | "error";

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

  useEffect(() => {
    void loadState();
  }, []);

  async function loadState() {
    if (!supported()) {
      setState("unsupported");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setState("disabled");
        return;
      }
      const response = await fetch(`${API}/notifications/subscriptions`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error();
      const body = await response.json() as { subscriptions: { endpoint: string }[] };
      setState(body.subscriptions.some((item) => item.endpoint === subscription.endpoint) ? "enabled" : "disabled");
    } catch {
      setState("error");
    }
  }

  async function enable() {
    setState("loading");
    try {
      const keyResponse = await fetch(`${API}/notifications/public-key`, { credentials: "include" });
      const { publicKey } = await keyResponse.json();
      if (!publicKey || (await Notification.requestPermission()) !== "granted") throw new Error();
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(publicKey),
      });
      const response = await fetch(`${API}/notifications/subscriptions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...subscription.toJSON(), userAgent: navigator.userAgent }),
      });
      if (!response.ok) throw new Error();
      setState("enabled");
    } catch {
      setState("error");
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
          credentials: "include",
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok) throw new Error();
        await subscription.unsubscribe();
      }
      setState("disabled");
    } catch {
      setState("error");
    }
  }

  return (
    <Switch
      checked={state === "enabled"}
      disabled={state === "loading" || state === "unsupported"}
      aria-label="Thông báo đẩy"
      onCheckedChange={(checked) => void (checked ? enable() : disable())}
    />
  );
}
