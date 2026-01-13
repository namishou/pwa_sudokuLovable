const CACHE_NAME = 'ai-numpre-v3';
const BASE_PATH = '/pwa_sudokuLovable/';
const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + '404.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'pwa-192x192.png',
  BASE_PATH + 'pwa-512x512.png',
  BASE_PATH + 'favicon.ico'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Handle navigation requests (HTML pages) - always serve index.html for SPA
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(BASE_PATH + 'index.html').then((response) => {
        return response || fetch(BASE_PATH + 'index.html');
      }).catch(() => {
        return caches.match(BASE_PATH + 'index.html');
      })
    );
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        return caches.match(BASE_PATH + 'index.html');
      })
  );
});
