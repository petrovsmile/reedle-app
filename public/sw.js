const CACHE_NAME = 'reedle-pwa-__BUILD_HASH__';
const CACHE_ENABLED = '__PWA_CACHE_ENABLED__' === 'true';
const BASE_PATH = '__PUBLIC_PATH__';
const APP_SHELL = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.webmanifest',
  BASE_PATH + 'icons/icon-192.png',
  BASE_PATH + 'icons/icon-512.png',
  BASE_PATH + 'fonts/fonts.css',
  BASE_PATH + 'fonts/libre-baskerville-400-latin.woff2',
  BASE_PATH + 'fonts/libre-baskerville-400-latin-ext.woff2',
  __APP_SHELL_ASSETS__
];

class WebNotificationReceiptQueue {
  constructor() {
    this.flushing = null;
  }

  async transaction(mode, operation) {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('reedle-notification-events', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('receipts', { keyPath: 'key' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction('receipts', mode);
        const request = operation(transaction.objectStore('receipts'));
        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } finally {
      database.close();
    }
  }

  async save(receipt) {
    if (!receipt || !receipt.notification_id || !receipt.receipt_token ||
        !['delivered', 'opened'].includes(receipt.event)) return;
    const entry = {
      notification_id: String(receipt.notification_id),
      receipt_token: receipt.receipt_token,
      event: receipt.event,
      key: receipt.notification_id + ':' + receipt.event
    };
    await this.transaction('readwrite', store => store.put(entry));
    if (self.registration.sync) {
      try { await self.registration.sync.register('reedle-notification-events'); } catch (_) {}
    }
  }

  async record(data, event) {
    if (!data || !data.notification_id || !data.receipt_token) return;
    await this.save({ notification_id: data.notification_id, receipt_token: data.receipt_token, event });
    await this.flush();
  }

  flush() {
    if (!this.flushing) {
      this.flushing = this.sendPending().catch(() => {}).finally(() => { this.flushing = null; });
    }
    return this.flushing;
  }

  async sendPending() {
    const pending = await this.transaction('readonly', store => store.getAll());
    for (const receipt of pending) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch('/api/v2/notifications/' + encodeURIComponent(receipt.notification_id) + '/events', {
          method: 'POST', credentials: 'omit', signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(receipt)
        });
        if (!response.ok && ![400, 401, 404, 422].includes(response.status)) break;
        await this.transaction('readwrite', store => store.delete(receipt.key));
      } catch (_) {
        break;
      } finally {
        clearTimeout(timeout);
      }
    }
    if ((await this.transaction('readonly', store => store.getAll())).length) {
      if (self.registration.sync) await self.registration.sync.register('reedle-notification-events');
      throw new Error('Notification events are waiting for connectivity');
    }
  }
}

const notification_receipts = new WebNotificationReceiptQueue();

self.addEventListener('sync', event => {
  if (event.tag === 'reedle-notification-events') event.waitUntil(notification_receipts.sendPending());
});

self.addEventListener('install', (event) => {
  if (!CACHE_ENABLED) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REEDLE_NOTIFICATION_EVENT') {
    event.waitUntil(notification_receipts.save(event.data.receipt).then(() => {
      if (event.ports && event.ports[0]) event.ports[0].postMessage({ saved: true });
      return notification_receipts.flush();
    }).catch(() => {
      if (event.ports && event.ports[0]) event.ports[0].postMessage({ saved: false });
    }));
  }
  if (event.data && event.data.type === 'REEDLE_RETRY_NOTIFICATION_EVENTS') event.waitUntil(notification_receipts.flush());
  if (event.data && event.data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('reedle-pwa-') && (!CACHE_ENABLED || cacheName !== CACHE_NAME))
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
      .then(() => notification_receipts.flush())
  );
});

self.addEventListener('fetch', (event) => {
  // Development assets and API requests must reach webpack/the server directly.
  if (!CACHE_ENABLED) return;
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' ||
      requestUrl.origin !== self.location.origin ||
      !requestUrl.pathname.startsWith(BASE_PATH)) {
    return;
  }

  if (event.request.mode === 'navigate' || requestUrl.pathname === BASE_PATH + 'index.html') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          const copy = response.clone();
          if (response.ok) event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(BASE_PATH, copy)));
          return response;
        })
        .catch(() => caches.open(CACHE_NAME).then((cache) => cache.match(BASE_PATH)))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => cache.match(event.request))
      .then((cachedResponse) => cachedResponse || fetch(event.request).then((response) => {
        const requestUrl = new URL(event.request.url);

        if (
          response.ok &&
          requestUrl.origin === self.location.origin &&
          requestUrl.pathname.startsWith(BASE_PATH)
        ) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        }

        return response;
      }))
  );
});

self.addEventListener('push', (event) => {
  var payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { body: event.data ? event.data.text() : '' };
  }

  var data = payload.data || {};
  var title = payload.title || 'Reedle';
  var options = {
    body: payload.body || payload.message || '',
    icon: BASE_PATH + 'icons/icon-192.png',
    badge: BASE_PATH + 'icons/icon-192.png',
    tag: data.notification_id || payload.notification_id || 'reedle-reminder',
    renotify: false,
    data: data
  };

  event.waitUntil(Promise.all([
    self.registration.showNotification(title, options).then(() => notification_receipts.record(data, 'delivered')),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        var client_url = new URL(client.url);
        if (client_url.origin !== self.location.origin ||
            !(client_url.pathname === BASE_PATH.replace(/\/$/, '') || client_url.pathname.startsWith(BASE_PATH))) return;
        client.postMessage({
          type: 'REEDLE_NOTIFICATION_RECEIVED',
          notification: { title: title, body: options.body },
          data: data
        });
      });
    })
  ]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  var data = event.notification.data || {};
  var targetPath = BASE_PATH;
  if (data.action === 'reader' && data.book_id) {
    targetPath += 'books/' + encodeURIComponent(data.book_id) + '/reader';
  } else if (data.action === 'book' && data.book_id) {
    targetPath += 'books/' + encodeURIComponent(data.book_id);
  } else if (data.action === 'article' && data.article_code) {
    targetPath += 'blog/' + encodeURIComponent(data.article_code);
  } else if (data.action === 'subscription') {
    targetPath += 'subscription';

  }
  var targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    Promise.all([notification_receipts.record(data, 'opened'),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      var appClient = clients.find((client) => {
        try {
          var clientUrl = new URL(client.url);
          return clientUrl.origin === self.location.origin && (clientUrl.pathname === BASE_PATH.replace(/\/$/, '') || clientUrl.pathname.startsWith(BASE_PATH));
        } catch (_) {
          return false;
        }
      });

      if (appClient) {
        appClient.postMessage({ type: 'REEDLE_NOTIFICATION_OPENED', data: data });
        return appClient.focus();
      }
      return self.clients.openWindow(targetUrl);
    })])
  );
});
