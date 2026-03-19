// VidPull Service Worker v1
const CACHE = 'vidpull-v1';
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;

  // Never cache API calls
  if (request.url.includes('/api/')) return;

  // Cache-first for static assets
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(request, clone));
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// Handle share target (shared URLs auto-fill input)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname === '/' && url.searchParams.has('url')) {
    e.respondWith(
      caches.match('/index.html').then(r => r || fetch('/index.html'))
    );
  }
});
