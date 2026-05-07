/* Minimal SkinX service worker: offline fallback + runtime cache for static assets. */
const BUILD = new URLSearchParams(self.location.search).get("v") || "1";
const CACHE = `skinx-${BUILD}`;
const OFFLINE_URL = "/welcome";
const PRECACHE = ["/welcome", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        await cache.addAll(PRECACHE);
      } catch (_) {}
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Claim clients FIRST so pages switch to new SW before old cache is gone.
      // Deleting old caches first causes ChunkLoadError: page still has old HTML
      // referencing old chunk hashes, but cache is already wiped.
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never intercept the SW script or manifest — browser must always fetch these fresh.
  if (url.pathname === "/sw.js" || url.pathname === "/manifest.webmanifest") return;

  // Network-first for navigation
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const net = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, net.clone()).catch(() => {});
          return net;
        } catch (_) {
          const cache = await caches.open(CACHE);
          const cached = await cache.match(req);
          return cached || (await cache.match(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
    return;
  }

  // JS/CSS chunks: network-first (change every build — cache-first causes 404 after deploy)
  if (
    url.pathname.startsWith("/_next/static/chunks/") ||
    url.pathname.startsWith("/_next/static/css/")
  ) {
    event.respondWith(
      (async () => {
        try {
          const net = await fetch(req);
          if (net.ok) {
            const cache = await caches.open(CACHE);
            cache.put(req, net.clone()).catch(() => {});
          }
          return net;
        } catch (_) {
          const cache = await caches.open(CACHE);
          const cached = await cache.match(req);
          // Do NOT return Response.error() — it triggers "Response served by SW is an error".
          // Instead fall back to a real network fetch so the browser sees the real error
          // and ChunkLoadError fires, which can be caught and trigger a page reload.
          return cached ?? fetch(req.clone());
        }
      })(),
    );
    return;
  }

  // Cache-first for truly static assets (fonts, icons, media — never change)
  if (url.pathname.startsWith("/_next/static/media/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/splashes/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const net = await fetch(req);
          if (net.ok) cache.put(req, net.clone()).catch(() => {});
          return net;
        } catch (_) {
          return Response.error();
        }
      })(),
    );
  }
});
