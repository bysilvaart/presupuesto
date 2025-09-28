const CACHE_VERSION = 'v2025-09-28';
const CACHE_PREFIX = 'presupuesto-cache-';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const BASE_SCOPE = self.registration.scope;
const BASE_PATH = new URL('./', BASE_SCOPE).pathname;

const PRECACHE_URLS = [
  new URL('./', BASE_SCOPE).pathname,
  new URL('./index.html', BASE_SCOPE).pathname,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestURL = new URL(event.request.url);
  const isSameOrigin = requestURL.origin === self.location.origin;
  const isInScope = requestURL.pathname.startsWith(BASE_PATH);

  if (!isSameOrigin || !isInScope) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        return cachedResponse ?? Promise.reject(error);
      }
    })
  );
});
