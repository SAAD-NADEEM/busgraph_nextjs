// Bus Graph PWA Service Worker
const CACHE_NAME = "busgraph-v1";
const TILE_CACHE_NAME = "busgraph-map-tiles-v1";
const MAX_TILE_CACHE_ITEMS = 2000; // Cap tile cache to ~200MB

// App shell files to pre-cache
const APP_SHELL = ["/", "/manifest.json"];

// ─── Install: Pre-cache app shell ───
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: Clean up old caches ───
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== TILE_CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Helpers ───
function isMapTileRequest(url) {
  return (
    url.hostname.includes("mapbox.com") &&
    (url.pathname.includes("/tiles/") ||
      url.pathname.includes("/styles/") ||
      url.pathname.includes("/fonts/") ||
      url.pathname.includes("/sprites/"))
  );
}

function isNavigationRequest(event) {
  return event.request.mode === "navigate";
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    // Delete oldest entries (FIFO)
    const deleteCount = keys.length - maxItems;
    await Promise.all(keys.slice(0, deleteCount).map((key) => cache.delete(key)));
  }
}

// ─── Fetch: Network-first for pages, Cache-first for tiles ───
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Strategy 1: Map tiles → Cache-first, then network (stale-while-revalidate)
  if (isMapTileRequest(url)) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        
        // Fetch fresh in background regardless
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
              trimCache(TILE_CACHE_NAME, MAX_TILE_CACHE_ITEMS);
            }
            return response;
          })
          .catch(() => cached); // If network fails, fall back to cached

        // Return cached immediately if available, otherwise wait for network
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Strategy 2: Navigation requests → Network-first, fallback to cache
  if (isNavigationRequest(event)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest page
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Strategy 3: Other assets (JS, CSS, images) → Stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }
});

// ─── Listen for messages from the app ───
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
