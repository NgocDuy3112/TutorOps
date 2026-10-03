
export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isAppleTouch =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
  return isAppleTouch;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean })
    .standalone;
  return mq || iosStandalone === true;
}

export function isIosBrowserNotStandalone(): boolean {
  return isIos() && !isStandalone();
}
