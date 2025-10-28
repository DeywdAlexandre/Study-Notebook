const CACHE_NAME = 'pokerace-cache-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/index.tsx'
];

// Install event: open cache and add all core files to it
self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all pages under its scope.
  );
});

// Fetch event: stale-while-revalidate strategy
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Return response from cache if available.
        // Then, fetch from network to update cache.
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // If we got a valid response, update the cache.
          if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            console.error('Service Worker failed to fetch:', err);
            // Don't rethrow, just log. If we have a cached response, we'll use it.
        });

        // Return the cached response immediately if it exists,
        // otherwise wait for the network response.
        return response || fetchPromise;
      });
    })
  );
});