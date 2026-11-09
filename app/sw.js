// KASSA telefon (bulud) rejimi: proqram faylları telefonda saxlanır, internetsiz də açılır.
// Səhifə: əvvəlcə internetdən (yeni versiya), olmasa yaddaşdan. Digər fayllar: yaddaşdan, arxada yenilənir.
const C = "kassa-v1";
const FILES = ["./", "index.html", "kassa.svg", "manifest.webmanifest", "fonts/notosans-latin.woff2", "fonts/notosans-latin-ext.woff2"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // Google (bulud) sorğularına toxunma
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put("index.html", cp)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
