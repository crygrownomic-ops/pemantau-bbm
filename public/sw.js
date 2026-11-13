/* FleetOps 360 — service worker
 * Strategi:
 *  - Data API tidak pernah di-cache (privasi & akurasi).
 *  - Halaman navigasi: network-first, offline fallback.
 *  - Aset statis: stale-while-revalidate.
 */

const VERSION = 'fleetops-v1'
const STATIC_CACHE = `${VERSION}-static`
const OFFLINE_URL = '/offline'

const PRECACHE = [
  OFFLINE_URL,
  '/favicon.ico',
  '/icon.svg',
  '/apple-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      await cache.addAll(PRECACHE).catch(() => undefined)
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    /\.(?:css|js|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf)$/i.test(url.pathname)
  )
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request)
  } catch {
    const cached = await caches.match(OFFLINE_URL)
    if (cached) return cached
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Offline</title><body style="font-family:system-ui;padding:40px"><h1>Anda sedang offline</h1><p>Buka kembali aplikasi saat koneksi tersedia.</p></body>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
    )
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => undefined)

  return cached || (await network) || new Response('', { status: 504 })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Jangan pernah menyimpan respons API / data sensitif.
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request))
  }
})
