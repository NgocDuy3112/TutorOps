self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {
    title: "TutorOps",
    body: "Bạn có thông báo mới.",
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/google-icon.png",
      data: { url: data.url ?? "/" },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? "/"));
});
