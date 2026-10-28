const VERSION = 'lumar-inspecao-v1';
self.addEventListener('install', event => { event.waitUntil(caches.open(VERSION).then(cache => cache.add('/painel/mobile')).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin || new URL(request.url).pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate' && new URL(request.url).pathname === '/painel/mobile') {
    event.respondWith(fetch(request).then(response => { if (response.ok) { const copy = response.clone(); caches.open(VERSION).then(cache => cache.put(request, copy)); } return response; }).catch(() => caches.match('/painel/mobile')));
    return;
  }
  if (new URL(request.url).pathname.startsWith('/_next/static/')) event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => { if (response.ok) { const copy = response.clone(); caches.open(VERSION).then(cache => cache.put(request, copy)); } return response; })));
});
