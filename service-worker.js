const CACHE = 'tasks-v1';
const TTL = 3600_000;               // 1h

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
