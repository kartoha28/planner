/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

// Precache all Vite build assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Offline SPA fallback
const navigationHandler = createHandlerBoundToURL(`${import.meta.env.BASE_URL}index.html`);
registerRoute(new NavigationRoute(navigationHandler));

// Cache Google Fonts stylesheets & font files for full offline support
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-cache' })
);

// Focus or open the app when the user clicks a local task notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || import.meta.env.BASE_URL;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
