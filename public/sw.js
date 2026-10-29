/*
 * Us Two's service worker: it only shows nudges. Nothing is cached, so the
 * app always loads fresh from the network. The payload is a NudgeMessage
 * (src/lib/nudges/messages.ts): { title, body, url, tag }.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let message;
  try {
    message = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      tag: message.tag,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: message.url },
    }),
  );
});

/** Only a path on this site is opened, whatever the payload says. */
function targetUrl(data) {
  const url = new URL(typeof data?.url === 'string' ? data.url : '/us', self.location.origin);
  return url.origin === self.location.origin ? url.href : new URL('/us', self.location.origin).href;
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = targetUrl(event.notification.data);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (open) {
        await open.focus();
        await open.navigate(url);
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
