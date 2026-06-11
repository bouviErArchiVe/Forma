/** Forma PWA — shell precache, network-first app, cache-first static assets. */
const CACHE_SHELL = 'forma-shell-v8'
const CACHE_ASSETS = 'forma-assets-v8'

const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_SHELL).then((cache) =>
      cache.addAll(SHELL_URLS).catch(() => {
        /* icon PNG may be missing in dev; shell still usable */
        return cache.addAll(['/', '/index.html', '/manifest.json', '/favicon.svg'])
      }),
    ),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_SHELL && k !== CACHE_ASSETS)
          .map((k) => caches.delete(k)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

function isNavigation(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('accept')?.includes('text/html'))
  )
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/assets/') ||
    /\.(js|css|woff2|png|svg|webp|wasm|mjs)$/i.test(pathname)
  )
}

function isShellPath(pathname) {
  return SHELL_URLS.includes(pathname) || pathname === '/'
}

/** Network-first for HTML / SPA navigation; offline → cached index.html. */
async function networkFirstApp(request) {
  const cache = await caches.open(CACHE_SHELL)
  try {
    const res = await fetch(request)
    if (res.ok && isNavigation(request)) {
      cache.put('/index.html', res.clone())
    }
    return res
  } catch {
    const fallback =
      (await cache.match('/index.html')) ||
      (await cache.match(request)) ||
      (await cache.match('/'))
    if (fallback) return fallback
    return Response.error()
  }
}

/** Cache-first for hashed build assets and fonts. */
async function cacheFirstAsset(request) {
  const cache = await caches.open(CACHE_ASSETS)
  const cached = await cache.match(request)
  if (cached) {
    fetch(request)
      .then((res) => {
        if (res.ok) cache.put(request, res.clone())
      })
      .catch(() => {})
    return cached
  }
  const res = await fetch(request)
  if (res.ok) cache.put(request, res.clone())
  return res
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== self.location.origin) return

  if (isNavigation(e.request) || (!isStaticAsset(url.pathname) && !isShellPath(url.pathname))) {
    e.respondWith(networkFirstApp(e.request))
    return
  }

  if (isStaticAsset(url.pathname)) {
    e.respondWith(cacheFirstAsset(e.request))
    return
  }

  if (isShellPath(url.pathname)) {
    e.respondWith(networkFirstApp(e.request))
  }
})
