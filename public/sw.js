// Service Worker for Teacher Portal PWA
const cacheName = 'shams-teacher-v1';
const urlsToCache = [
  '/teacher/',
  '/teacher/attendance',
  '/teacher/schedule',
  '/teacher/results',
  '/teacher/reports',
  '/',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== cacheName) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API and external requests for now
  if (request.url.includes('/api/') || request.url.includes('clerk')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response
        const responseClone = response.clone();

        // Cache the new response
        if (request.method === 'GET' && response.status === 200) {
          caches.open(cacheName).then((cache) => {
            cache.put(request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        // Return cached version if network fails
        return caches.match(request).then((response) => {
          return response || new Response('Offline - Page not cached', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
      })
  );
});

// Handle push notifications (optional)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'New notification from Shams Teacher Portal',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    tag: 'shams-notification',
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Shams Teacher Portal', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if window is already open
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if not found
      if (clients.openWindow) {
        return clients.openWindow('/teacher');
      }
    })
  );
});
