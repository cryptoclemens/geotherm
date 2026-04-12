// Cache-clearing service worker
// Deployed when @serwist/next is disabled (Turbopack incompatibility).
// This SW immediately clears all caches, force-reloads all open windows,
// and unregisters itself so the app works without stale assets after redeployments.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(windowClients => {
        // Force-reload all open tabs so they load fresh from network (no broken cache)
        windowClients.forEach(client => client.navigate(client.url))
      })
      .then(() => self.registration.unregister())
  )
})
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request))
})
