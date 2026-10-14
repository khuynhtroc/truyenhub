// Service Worker for DocTruyen.vip PWA
const CACHE_NAME = "doctruyen-v1";
const OFFLINE_URL = "/";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/tu-truyen",
  "/kham-pha",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Let browser handle API and dynamic Supabase requests normally
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.hostname.includes("supabase.co")) {
    return;
  }

  // Network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful static/page responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        return caches.match(OFFLINE_URL);
      })
  );
});
