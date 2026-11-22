/* Lordship offline: the app shell and its hashed assets are kept once seen; pages try the network first.
   API calls always go to the network. Slides are kept by the page itself (Cache "ls-slides"). Bump SHELL to reset. */
const SHELL = 'ls-shell-v1';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(['/', '/manifest.json', '/icon.svg'])).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ls-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/.netlify/')) return;
  if (u.pathname.startsWith('/assets/')) {           // hashed: never change, keep forever
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { const c = r.clone(); if (r.ok) caches.open(SHELL).then(x => x.put(e.request, c)); return r; })));
    return;
  }
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); if (r.ok) caches.open(SHELL).then(x => x.put(e.request.mode === 'navigate' ? '/' : e.request, c)); return r; })
    .catch(() => caches.match(e.request.mode === 'navigate' ? '/' : e.request).then(hit => hit || caches.match('/'))));
});
