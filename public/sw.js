// Cache-clearing service worker
// Deployed when @serwist/next is disabled (Turbopack incompatibility).
// This SW immediately clears all caches and unregisters itself so the app
// works without stale assets after redeployments.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request))
})
