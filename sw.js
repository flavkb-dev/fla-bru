// Guarda o app no celular para abrir rápido e sem internet.
// Ao mudar o código, aumente o número da versão abaixo para os celulares baixarem a novidade.
const VERSION = "fla-bru-v1";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Firebase (dados e login) nunca passa pelo cache
  if (/googleapis\.com$|firebaseio\.com$/.test(url.hostname) && !url.hostname.startsWith("fonts.")) return;
  const sameOrigin = url.origin === location.origin;
  const cacheable = sameOrigin || url.hostname === "www.gstatic.com" || url.hostname.startsWith("fonts.");
  if (!cacheable) return;
  // Arquivos do app: tenta a internet primeiro (pega atualizações), cai no cache se estiver offline
  if (sameOrigin) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  // Bibliotecas e fontes: cache primeiro
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })));
});
