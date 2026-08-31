/**
 * Platform detection helpers for PWA / push notification support.
 *
 * iOS Safari only supports Web Push inside an installed PWA
 * (added to Home Screen, iOS 16.4+). In a regular browser tab the
 * PushManager exists but subscribing always fails, so we must detect
 * this case and guide the user to install the app first.
 */

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as Macintosh — check for touch support.
  const isAppleTouch =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
  return isAppleTouch;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari exposes navigator.standalone when launched from Home Screen.
  const iosStandalone = (navigator as Navigator & { standalone?: boolean })
    .standalone;
  return mq || iosStandalone === true;
}

/**
 * True when running on iOS inside a regular browser tab (not installed
 * as a PWA). Web Push is unavailable in this context.
 */
export function isIosBrowserNotStandalone(): boolean {
  return isIos() && !isStandalone();
}
