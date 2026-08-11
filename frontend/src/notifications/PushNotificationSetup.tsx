import { useState } from "react";
import { Switch } from "@/components/ui/switch";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function decodeKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export function PushNotificationSetup() {
  const [state, setState] = useState<
    "idle" | "enabled" | "unsupported" | "error"
  >("idle");

  async function enable() {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !window.isSecureContext
    ) {
      setState("unsupported");
      return;
    }

    try {
      const keyResponse = await fetch(`${API}/notifications/public-key`, {
        credentials: "include",
      });
      const { publicKey } = await keyResponse.json();
      if (!publicKey) {
        setState("error");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      if ((await Notification.requestPermission()) !== "granted") {
        setState("error");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(publicKey),
      });
      const response = await fetch(`${API}/notifications/subscriptions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });
      setState(response.ok ? "enabled" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <Switch
      checked={state === "enabled"}
      disabled={state === "enabled" || state === "unsupported"}
      aria-label="Thông báo đẩy"
      onCheckedChange={() => void enable()}
    />
  );
}
