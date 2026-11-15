// Hors ligne : réseau d'abord (mises à jour immédiates), cache si pas de connexion.
const CACHE = 'b1pro-v7';
const FILES = ['./', 'index.html', 'styles.css', 'data.js', 'pack1.js', 'pack2.js', 'pack3.js', 'pack4.js', 'pack5.js', 'ai.js', 'app.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png',
  'img/hero.jpg', 'img/m1.jpg', 'img/m2.jpg', 'img/m3.jpg', 'img/m4.jpg', 'img/m5.jpg', 'img/m6.jpg', 'img/cards.jpg', 'img/verbs.jpg'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(c =>
    fetch(e.request).then(r => { if (r.ok && new URL(e.request.url).origin === location.origin) c.put(e.request, r.clone()); return r; })
      .catch(() => c.match(e.request, { ignoreSearch: true }))
  ));
});
