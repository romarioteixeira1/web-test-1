/**
 * EcoControl service worker. A template: the build (pwaServiceWorker in
 * vite.config.ts) fills in VERSION and PRECACHE below and writes it to /sw.js.
 *
 * - The app shell and the build's files are cached at install, so the app opens offline.
 * - Screens (navigations) try the network first and fall back to the cached shell.
 * - /api/* is never cached: business data always comes from the server.
 * - A new version waits until the page asks it to take over (the "Atualizar" banner).
 */
const VERSION = '__VERSION__'
const PRECACHE = __PRECACHE__
const APP_CACHE = `ecocontrol-app-${VERSION}`
const FONT_CACHE = 'ecocontrol-fonts'
const SHELL = '/'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(PRECACHE)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== APP_CACHE && key !== FONT_CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/')) return
    if (request.mode === 'navigate') {
      event.respondWith(networkFirstShell(request))
      return
    }
    event.respondWith(cacheFirst(request))
    return
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE))
  }
})

/** Every screen is the same index.html, so keep the latest copy as the offline shell. */
async function networkFirstShell(request) {
  const cache = await caches.open(APP_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(SHELL, response.clone())
    return response
  } catch {
    return (await cache.match(SHELL)) ?? Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(APP_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) await cache.put(request, response.clone())
  return response
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
      return response
    })
    .catch(() => cached)
  return cached ?? network
}
