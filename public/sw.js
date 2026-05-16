/* Smart Advisor service worker.
 *
 * Deliberately conservative: the app is auth-gated and content is highly
 * dynamic (AI recommendations), so we never cache HTML documents or API
 * responses. We only cache hashed static assets and serve an offline
 * fallback page when a navigation fails with no network.
 *
 * Bump CACHE_VERSION whenever this file's caching logic changes so old
 * caches are purged on activate.
 */
const CACHE_VERSION = "v1";
const STATIC_CACHE = `sa-static-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GETs. Cross-origin (Deezer audio, TMDB images,
  // Supabase) and non-GET requests pass straight through to the network.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API routes or auth — always hit the network.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  // Page navigations: network-first, fall back to the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        return (
          (await cache.match(OFFLINE_URL)) ||
          new Response("", { status: 503, statusText: "Offline" })
        );
      }),
    );
    return;
  }

  // Hashed build assets and static files: stale-while-revalidate.
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:js|css|woff2?|png|jpe?g|svg|webp|gif|ico)$/.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});

// Allow the page to trigger an immediate SW update.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
