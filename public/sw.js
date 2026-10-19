// Minimalny service worker: nic nie buforuje poza ekranem offline.
// Strony gry i sesje zawsze idą do serwera; gdy nie ma sieci, pokazujemy /offline zamiast pustej strony.
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open("pm-offline-v1").then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(async () => (await caches.match(OFFLINE_URL)) ?? Response.error()),
  );
});
