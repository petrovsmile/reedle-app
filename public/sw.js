const CACHE_NAME = 'reedle-pwa-__BUILD_HASH__';
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('reedle-pwa-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
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
