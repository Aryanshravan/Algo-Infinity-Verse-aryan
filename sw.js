// Service Worker for Offline WASM Code Execution & Playground
const CACHE_NAME = 'algo-wasm-v1';
const WASM_ASSETS = [
  '/',
  '/Playground/playground.html',
  '/Playground/playground.css',
  '/Playground/playground.js',
  '/modules/wasm-executor.js',
  '/modules/code-executor.js',
  '/styles.css',
  '/theme.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return Promise.all(
          WASM_ASSETS.map((url) =>
            cache.add(url).catch((err) => console.warn(`SW cache pre-fetch failed for ${url}:`, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Cache-first for Pyodide CDN & local WASM assets
  if (
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.pathname.includes('/modules/wasm-executor.js')
  ) {
    e.respondWith(
      caches
        .match(e.request)
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(e.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
            }
            return networkResponse;
          });
        })
        .catch(() => fetch(e.request))
    );
    return;
  }

  // Network-first with Cache fallback for general pages
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && e.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
