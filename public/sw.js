
const CACHE_NAME = 'cargovaluator-cache-v2';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v2';

// App Shell files
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/globals.css'
];

// Install service worker and cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching shell assets');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
        .map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event handler
self.addEventListener('fetch', event => {
  // For navigation requests (HTML pages), use a network-first strategy.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If the network is available, cache the response and return it.
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If the network fails, try to serve the main page from the cache.
          return caches.match('/'); 
        })
    );
    return;
  }

  // For other requests (CSS, JS, images), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request).then(cacheRes => {
      return cacheRes || fetch(event.request).then(fetchRes => {
        return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          // Check if the request is for a chrome-extension, if so, don't cache it
          if (event.request.url.startsWith('chrome-extension://')) {
            return fetchRes;
          }
          cache.put(event.request.url, fetchRes.clone());
          return fetchRes;
        });
      });
    }).catch(() => {
        // If an asset is not in the cache and network is unavailable, 
        // there's not much we can do. This part can be enhanced with a fallback image/page.
    })
  );
});
