// Service Worker for GuineaManager PWA
// Pure JavaScript - no TypeScript

const CACHE_NAME = 'guineamanager-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json'
];

// Install event
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[ServiceWorker] Caching essential assets');
      return cache.addAll(PRECACHE_ASSETS).catch(function(err) {
        console.log('[ServiceWorker] Cache error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(cacheName) {
            return cacheName !== CACHE_NAME;
          })
          .map(function(cacheName) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // For navigation, try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(function() {
          return caches.match(request).then(function(cachedResponse) {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // For static assets, cache first
  event.respondWith(
    caches.match(request).then(function(cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request)
        .then(function(response) {
          if (response.ok) {
            var responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(function() {
          return new Response('Offline', { status: 503 });
        });
    })
  );
});
