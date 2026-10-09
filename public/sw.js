const CACHE_NAME = 'bonifatus-offline-v1'
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Navigation preload lets the browser issue the page request itself, as a genuine
      // document navigation (Sec-Fetch-Dest: document). A request re-issued from here via
      // fetch() is not one, so the server would not persist the locale cookie for it.
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable()
      }
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    })()
  )
  self.clients.claim()
})

// The worker exists only to show the offline page when a navigation fails.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return

  event.respondWith(
    (async () => {
      try {
        const preloaded = await event.preloadResponse
        if (preloaded) return preloaded
        return await fetch(event.request)
      } catch {
        return caches.match(OFFLINE_URL)
      }
    })()
  )
})
