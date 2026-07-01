const CACHE_NAME = 'hoa-surf-v3';

// Files to cache for offline shell
const SHELL_ASSETS = [
  '/hoa-surf-insights/',
  '/hoa-surf-insights/index.html',
  '/hoa-surf-insights/hoa-surf-insights-logo.png',
  '/hoa-surf-insights/manifest.json'
];

// Install: cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - App shell (HTML, logo, manifest) → network first, fallback to cache
// - External API calls (forecast data) → network first, no cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isShell = url.origin === self.location.origin;

  if (isShell) {
    // Network-first for local assets — ensures fresh HTML on every deploy
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Update cache with fresh version
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))  // fallback to cache if offline
    );
  } else {
    // Network-first for external API calls
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
