// Cache app shell + dữ liệu hướng dẫn để dùng offline; ảnh HDSD cache dần khi đã xem.
const V = "vf8-v8";
const SHELL = ["./", "index.html", "style.css", "app.js", "topics.js", "errors.js", "data/manual.json", "data/summaries.json", "data/figs.json", "data/errors.json", "manifest.webmanifest", "icons/logo.png", "img/interior.jpg", "menu.js", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const same = new URL(r.url).origin === location.origin;
  if (same) { // mạng trước để luôn có bản mới, rơi về cache khi offline
    e.respondWith(fetch(r, {cache: "no-cache"}).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })
      .catch(() => caches.match(r, {ignoreSearch: true})));
  } else if (r.destination === "image") { // ảnh của VinFast: cache-first
    e.respondWith(caches.match(r).then(h => h || fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })));
  }
});
