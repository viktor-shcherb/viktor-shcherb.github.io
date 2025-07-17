importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const CACHE = 'tasks-v1';
const TTL = 3600_000;               // 1h

self.__WB_DISABLE_DEV_LOGS = true;
self.skipWaiting();
self.clientsClaim();

workbox.precaching.precacheAndRoute([
  {url: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js', revision: null}
]);

workbox.routing.registerRoute(
  ({url}) => url.origin === 'https://cdn.jsdelivr.net' && url.pathname.startsWith('/pyodide/'),
  new workbox.strategies.StaleWhileRevalidate({cacheName: 'pyodide-cache'})
);

self.addEventListener('fetch', event => {
  const {request} = event;
  if (!request.url.includes('/algoprep/') || !request.url.endsWith('.json')) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);

    // Serve cached copy if < 1 h old
    if (cached) {
      const ts = +cached.headers.get('sw-fetched-at');
      if (Date.now() - ts < TTL) return cached;
    }

    // Otherwise go to network and refresh cache
    const res  = await fetch(request, {cache: 'no-store'});
    if (res.ok) {
      const headers = new Headers(res.headers);
      headers.set('sw-fetched-at', Date.now());
      const copy = new Response(await res.clone().blob(), {
        status:     res.status,
        statusText: res.statusText,
        headers
      });
      cache.put(request, copy);
    }
    return res;
  })());
});
