/**
 * Temple 365 PWA - Service Worker
 *
 * CRITICAL FIX (Phase 4 Patch): Use relative paths for subfolder hosting
 * All paths start with './' instead of '/' to work when hosted in subfolders
 */

const CACHE_NAME = 'temple365-v1';

// App shell resources (RELATIVE PATHS)
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './css/grid.css',
  './css/keyboard.css',
  './js/config.js',
  './js/firebase-init.js',
  './js/api.js',
  './js/app.js',
  './js/grid.js',
  './js/modal.js',
  './js/celebration.js',
  './js/keyboard.js'
];

/**
 * Install event - cache app shell
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(APP_SHELL);
    })
  );

  // Force activation immediately
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all clients immediately
  return self.clients.claim();
});

/**
 * Fetch event - network first, fallback to cache
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }

          // For navigation requests, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }

          return new Response('Offline - resource not cached', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
