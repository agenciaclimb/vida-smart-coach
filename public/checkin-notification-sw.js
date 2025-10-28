self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.target || '/dashboard?tab=dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const matchingClient = clientList.find((client) => client.url.includes('/dashboard'));

        if (matchingClient) {
          matchingClient.focus();
          matchingClient.postMessage({ type: 'FOCUS_CHECKIN', source: 'checkin-notification' });
          return;
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }

        return undefined;
      })
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
