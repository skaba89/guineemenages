/// <reference lib="webworker" />

const CACHE_NAME = 'guineamanager-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache essential assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching essential assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests (they should always go to network)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ 
            error: 'offline', 
            message: 'Vous êtes hors ligne. Veuillez vérifier votre connexion.' 
          }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: 503 
          }
        );
      })
    );
    return;
  }

  // For navigation requests (pages), use network-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the new version
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If offline, try cache first
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page if not in cache
            return caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update cache in background
        event.waitUntil(
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response);
              });
            }
          }).catch(() => {
            // Ignore fetch errors for background update
          })
        );
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline placeholder for images
          if (request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#f3f4f6" width="200" height="200"/><text x="50%" y="50%" fill="#9ca3af" text-anchor="middle" dy=".3em">Hors ligne</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-invoices') {
    event.waitUntil(syncInvoices());
  }
  if (event.tag === 'sync-payroll') {
    event.waitUntil(syncPayroll());
  }
});

async function syncInvoices() {
  try {
    const db = await openIndexedDB();
    const pendingInvoices = await getPendingData(db, 'pending-invoices');
    
    for (const invoice of pendingInvoices) {
      try {
        const response = await fetch('/api/factures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoice.data),
        });
        
        if (response.ok) {
          await removePendingData(db, 'pending-invoices', invoice.id);
          
          // Notify user
          self.registration.showNotification('Facture synchronisée', {
            body: `La facture ${invoice.data.numero} a été synchronisée avec succès.`,
            icon: '/icons/icon-192x192.png',
          });
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync invoice:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync invoices error:', error);
  }
}

async function syncPayroll() {
  try {
    const db = await openIndexedDB();
    const pendingPayroll = await getPendingData(db, 'pending-payroll');
    
    for (const payroll of pendingPayroll) {
      try {
        const response = await fetch('/api/paie/bulletins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payroll.data),
        });
        
        if (response.ok) {
          await removePendingData(db, 'pending-payroll', payroll.id);
          
          self.registration.showNotification('Paie synchronisée', {
            body: 'Les bulletins de paie ont été synchronisés.',
            icon: '/icons/icon-192x192.png',
          });
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync payroll:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync payroll error:', error);
  }
}

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GuineaManagerOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pending-invoices')) {
        db.createObjectStore('pending-invoices', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-payroll')) {
        db.createObjectStore('pending-payroll', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingData(db: IDBDatabase, storeName: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removePendingData(db: IDBDatabase, storeName: string, id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notifications
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Export for TypeScript
declare const self: ServiceWorkerGlobalScope;
interface ExtendableEvent extends Event {
  waitUntil(fn: Promise<any>): void;
}
interface FetchEvent extends Event {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}
interface SyncEvent extends Event {
  tag: string;
  waitUntil(fn: Promise<any>): void;
}
interface PushEvent extends Event {
  data: PushMessageData | null;
}
interface NotificationEvent extends Event {
  notification: Notification;
  waitUntil(fn: Promise<any>): void;
}
