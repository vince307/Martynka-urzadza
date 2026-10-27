// Served at /sw.js on the old domain (martynka-urzadza.pl). Browsers that
// installed the PWA there fetch it as the service worker update; it removes
// the old worker and its caches, then reloads the open tabs, which now hit the
// permanent redirect to the new address.
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
            await self.registration.unregister();
            const clients = await self.clients.matchAll({ type: 'window' });
            for (const client of clients) {
                client.navigate(client.url);
            }
        })(),
    );
});
