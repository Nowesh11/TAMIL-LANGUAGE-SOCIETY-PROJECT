// Service Worker for Tamil Language Society
const CACHE_NAME = 'tamil-society-v4';
const urlsToCache = [
  // Core pages
  '/',
  
  // JavaScript files
  '/js/notification-manager.js',
  '/js/enhanced-cart.js'
];

// Note: /favicon.ico is removed from precache because it might be served from a different location in dev vs prod, 
// or might return 404/redirect which fails cache.add. We'll let runtime caching handle it.

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Attempt to cache each file individually to prevent one failure from breaking everything
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
          )
        );
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});