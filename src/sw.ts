/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

interface PeriodicSyncEvent extends ExtendableEvent {
  readonly tag: string;
}

interface StoredReminder {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  dueTime: string;
  reminderMinutes: string;
  triggerAt: number;
  completed: boolean;
  notified: boolean;
}

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const navigationHandler = createHandlerBoundToURL(`${import.meta.env.BASE_URL}index.html`);
registerRoute(new NavigationRoute(navigationHandler));

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-cache' })
);

function openReminderDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('taskflow-db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('reminders')) {
        db.createObjectStore('reminders', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function checkStoredRemindersInSW(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await openReminderDb();
    const tx = db.transaction('reminders', 'readwrite');
    const store = tx.objectStore('reminders');
    const allItems = await new Promise<StoredReminder[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as StoredReminder[]) || []);
      req.onerror = () => reject(req.error);
    });

    const now = Date.now();
    const maxPastWindowMs = 12 * 60 * 60 * 1000;
    const iconUrl = `${import.meta.env.BASE_URL}icons/icon-192.png`;

    for (const item of allItems) {
      if (item.completed || item.notified) continue;
      if (now >= item.triggerAt && now - item.triggerAt <= maxPastWindowMs) {
        item.notified = true;
        store.put(item);
        await self.registration.showNotification(`📌 ${item.title}`, {
          body: `${item.category} · Початок о ${item.dueTime}`,
          icon: iconUrl,
          badge: iconUrl,
          tag: `task-${item.id}`,
          data: { url: import.meta.env.BASE_URL },
        });
      }
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore IDB/Notification errors in SW background wakeups
  }
}

// Handle standard Web Push payloads when connected to a push server / VAPID
self.addEventListener('push', (event) => {
  const iconUrl = `${import.meta.env.BASE_URL}icons/icon-192.png`;
  let payload = {
    title: 'TaskFlow · Нагадування',
    body: 'Час перевірити заплановану задачу!',
    url: import.meta.env.BASE_URL,
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: iconUrl,
      badge: iconUrl,
      tag: 'taskflow-push',
      data: { url: payload.url },
    })
  );
});

// Chromium Periodic Background Sync (for installed Android/Desktop PWAs)
self.addEventListener('periodicsync' as unknown as keyof ServiceWorkerGlobalScopeEventMap, (event) => {
  const syncEvent = event as unknown as PeriodicSyncEvent;
  if (syncEvent.tag === 'check-task-reminders') {
    syncEvent.waitUntil(checkStoredRemindersInSW());
  }
});

// Focus or open the app when clicking a notification
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
