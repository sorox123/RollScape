// Service Worker for offline support and caching
const CACHE_NAME = 'rollscape-v1';
const OFFLINE_URL = '/offline';

// Assets to cache on install
const STATIC_CACHE = [
  '/',
  '/offline',
  '/manifest.json',
  '/globals.css',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip WebSocket connections
  if (event.request.url.includes('/ws/')) {
    return;
  }

  // Skip API calls (always go to network)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline - API unavailable' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // Network first, fallback to cache for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-dice-rolls') {
    event.waitUntil(syncDiceRolls());
  } else if (event.tag === 'sync-chat-messages') {
    event.waitUntil(syncChatMessages());
  } else if (event.tag === 'sync-character-updates') {
    event.waitUntil(syncCharacterUpdates());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'RollScape';
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Helper functions for background sync
async function syncDiceRolls() {
  try {
    // Get pending dice rolls from IndexedDB
    const db = await openDB();
    const rolls = await getPendingRolls(db);
    
    // Send to server
    for (const roll of rolls) {
      await fetch('/api/dice/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roll),
      });
    }
    
    // Clear pending rolls
    await clearPendingRolls(db);
  } catch (error) {
    console.error('[Service Worker] Sync dice rolls failed:', error);
    throw error;
  }
}

async function syncChatMessages() {
  try {
    const db = await openDB();
    const messages = await getPendingMessages(db);
    
    for (const message of messages) {
      await fetch('/api/messages/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
    }
    
    await clearPendingMessages(db);
  } catch (error) {
    console.error('[Service Worker] Sync messages failed:', error);
    throw error;
  }
}

async function syncCharacterUpdates() {
  try {
    const db = await openDB();
    const updates = await getPendingCharacterUpdates(db);
    
    for (const update of updates) {
      await fetch(`/api/characters/${update.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update.data),
      });
    }
    
    await clearPendingCharacterUpdates(db);
  } catch (error) {
    console.error('[Service Worker] Sync character updates failed:', error);
    throw error;
  }
}

// IndexedDB helpers (simplified)
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RollScapeDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingRolls')) {
        db.createObjectStore('pendingRolls', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pendingCharacterUpdates')) {
        db.createObjectStore('pendingCharacterUpdates', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingRolls(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingRolls'], 'readonly');
    const store = transaction.objectStore('pendingRolls');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getPendingMessages(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingMessages'], 'readonly');
    const store = transaction.objectStore('pendingMessages');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getPendingCharacterUpdates(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingCharacterUpdates'], 'readonly');
    const store = transaction.objectStore('pendingCharacterUpdates');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function clearPendingRolls(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingRolls'], 'readwrite');
    const store = transaction.objectStore('pendingRolls');
    const request = store.clear();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function clearPendingMessages(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingMessages'], 'readwrite');
    const store = transaction.objectStore('pendingMessages');
    const request = store.clear();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function clearPendingCharacterUpdates(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingCharacterUpdates'], 'readwrite');
    const store = transaction.objectStore('pendingCharacterUpdates');
    const request = store.clear();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
