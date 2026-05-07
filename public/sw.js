/* SkinX service worker — passthrough mode.
   Clears all stale caches on install, never intercepts fetches.
   All requests go directly to the network. */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// No fetch handler — browser handles all requests natively.
