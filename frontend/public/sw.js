self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {
    title: "TutorOps",
    body: "Bạn có thông báo mới.",
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/google-icon.png",
      // Collapse repeated notifications instead of stacking.
      tag: data.tag ?? "tutorops",
      renotify: true,
      data: { url: data.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    (async () => {
      // Focus an already-open app window (PWA on iOS) instead of
      // opening a duplicate browser tab.
      const clientList = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus();
          client.postMessage({ type: "navigate", url });
          return;
        }
      }
      await clients.openWindow(url);
    })(),
  );
});
