/*
 * Self-unregistering stub. The previous service worker cached the algoprep
 * Pyodide and task JSON; both are gone. Visitors who installed the old SW
 * still have it registered, so this stub clears its caches, unregisters
 * itself, and reloads any open pages so they fetch the live site.
 *
 * Once telemetry / time confirms no clients hit this anymore, the file and
 * its registration in main.js can be removed entirely.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll();
    clients.forEach(c => c.navigate(c.url));
  })());
});
