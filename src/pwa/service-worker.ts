/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE_NAME = 'presupuesto-cache-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest'];

const openQueueDB = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('budget-db', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('offlineQueue')) {
        db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

const queueStore = async (request: Request) => {
  const clone = request.clone();
  const body = await clone.json().catch(() => null);
  if (!body) return;
  const db = await openQueueDB();
  const tx = db.transaction('offlineQueue', 'readwrite');
  tx.objectStore('offlineQueue').add({
    type: body.type ?? 'movimiento',
    payload: body,
    status: 'pending',
    createdAt: Date.now()
  });
  tx.oncomplete = () => db.close();
  tx.onerror = () => db.close();
};

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => sw.skipWaiting())
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve(true);
        })
      )
    )
  );
  sw.clients.claim();
});

sw.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        await queueStore(request.clone());
        return new Response(JSON.stringify({ queued: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 202
        });
      })
    );
    return;
  }

  const url = new URL(request.url);
  if (url.origin === sw.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});

sw.addEventListener('message', (event) => {
  if (event.data?.type === 'FLUSH_QUEUE') {
    openQueueDB()
      .then((db) => {
        const tx = db.transaction('offlineQueue', 'readwrite');
        const store = tx.objectStore('offlineQueue');
        const request = store.getAll();
        request.onsuccess = () => {
          const items = request.result as Array<{ id?: number }>;
          items.forEach((item) => {
            if (typeof item.id !== 'number') return;
            store.put({ ...item, status: 'synced' }, item.id);
          });
        };
        tx.oncomplete = () => db.close();
      })
      .catch((error) => console.error('Error al limpiar cola', error));
  }
});

sw.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    sw.clients.matchAll({ type: 'window' }).then((clients) => {
      const client = clients.find((c) => 'focus' in c);
      if (client) {
        return client.focus();
      }
      return sw.clients.openWindow('/suscripciones');
    })
  );
});

// @ts-expect-error: push no implementado aún
sw.addEventListener('push', (event) => {
  // TODO: manejar mensajes push (requiere backend)
  const data = event.data?.json() ?? { title: 'Recordatorio de suscripción' };
  event.waitUntil(
    sw.registration.showNotification(data.title, {
      body: data.body ?? 'Revisa tus próximas renovaciones',
      icon: '/icons/icon-192.png'
    })
  );
});
