const VER = "1794945957";
const CACHE = "blade-next-" + VER;
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./version.json",
  "./icon.svg",
  "./src/main.js",
  "./src/layout.js",
  "./src/terrain.js",
  "./src/font.js",
  "./src/art.js",
  "./src/sim.js",
  "./src/draw.js",
  "./src/realm.js"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("blade-next-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
    return res;
  }).catch(() => caches.match(e.request)));
});
