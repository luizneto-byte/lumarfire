/* Lumar Fire — cache dedicado ao módulo de inspeção móvel.
 * Não armazena APIs, credenciais ou respostas de login. */
const VERSION = 'lumar-inspecao-v3-qr';
const APP = '/painel/mobile';
const STATIC = [
  '/lumar-fire-logo.png',
  '/inspecao-manifest.webmanifest',
];
const appUrl = url => new URL(url, self.location.origin);
const appPage = response => response.ok && appUrl(response.url).pathname === APP &&
  (response.headers.get('content-type') || '').includes('text/html');

async function cacheAssetsFromHtml(html) {
  // O primeiro carregamento acontece antes de o service worker controlar a aba.
  // Copiamos os bundles citados no HTML inicial para permitir reabertura offline.
  const matches = [...html.matchAll(/(?:src|href)=["'](\/_next\/static\/[^"']+)["']/g)];
  const paths = [...new Set(matches.map(m => m[1].replace(/&amp;/g, '&')))];
  const cache = await caches.open(VERSION);
  await Promise.allSettled(paths.map(async path => {
    const req = new Request(path, { credentials: 'same-origin' });
    const response = await fetch(req);
    if (response.ok) await cache.put(req, response);
  }));
}

async function precache() {
  const cache = await caches.open(VERSION);
  await Promise.allSettled(STATIC.map(url => cache.add(url)));
  try {
    const response = await fetch(APP, { credentials: 'same-origin', cache: 'no-store' });
    if (!appPage(response)) return; // nunca salvar /login redirecionado
    await cache.put(APP, response.clone());
    await cacheAssetsFromHtml(await response.text());
  } catch { /* uma visita online posterior poderá preencher o cache */ }
}

self.addEventListener('install', event => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('lumar-inspecao-') && k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  // QR Codes já impressos: se a conexão falhar na rota original,
  // abrir o módulo offline com o identificador do equipamento.
  // O fallback usa exatamente a URL original, sem modificar etiquetas.
  if (req.mode === 'navigate' && /^\/painel\/inspecionar\/(extintor|mangueira)\/[0-9a-f-]{36}\/?$/i.test(url.pathname)) {
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch {
        const saved = await caches.match(APP);
        if (!saved) return Response.error();
        const target = new URL(APP, self.location.origin);
        target.searchParams.set('qr', url.pathname);
        return Response.redirect(target.toString(), 302);
      }
    })());
    return;
  }
  if (req.mode === 'navigate' && url.pathname === APP) {
    event.respondWith((async () => {
      try {
        const response = await fetch(req);
        if (appPage(response)) {
          await (await caches.open(VERSION)).put(APP, response.clone());
          event.waitUntil(cacheAssetsFromHtml(await response.clone().text()));
        }
        return response;
      } catch {
        return (await caches.match(APP)) || Response.error();
      }
    })());
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || STATIC.includes(url.pathname)) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const response = await fetch(req);
      if (response.ok) await (await caches.open(VERSION)).put(req, response.clone());
      return response;
    })());
  }
});
