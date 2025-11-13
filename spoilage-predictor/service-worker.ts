

/// <reference lib="webworker" />

// Fix: Explicitly declare `self` as `ServiceWorkerGlobalScope` to provide the correct
// type context for service worker-specific properties like `skipWaiting` and `clients`.
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'spoilage-predictor-v2.4';
const URLS_TO_CACHE = [
  '/spoilage-predictor/',
  '/spoilage-predictor/index.html',
  '/spoilage-predictor/manifest.json',
  '/spoilage-predictor/icons/icon-192.png',
  '/spoilage-predictor/icons/icon-512.png',
  '/spoilage-predictor/icons/icon-192.svg',
  '/spoilage-predictor/icons/icon-512.svg',
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

export {};