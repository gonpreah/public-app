/* Brand From the Heart's service worker: opens offline on weak classroom internet.
   - The app shell (HTML, JS, CSS, manifest, icons): network first, the precached copy when the
     network fails or is too slow (SLOW_MS), and every good answer refreshes the cache.
   - Google Fonts: stale-while-revalidate, so Khmer fonts keep working offline.
   - Brand logos (upload.wikimedia.org, google.com/s2/favicons): cache first, at most LOGO_MAX.
   - Never cached: /.netlify/functions/*, anything not GET, other cross-origin requests.
   Bump SHELL whenever PRECACHE changes. */
const SHELL = 'bfh-shell-v1';
const FONTS = 'bfh-fonts-v1';
const LOGOS = 'bfh-logos-v1';
const LOGO_MAX = 60;
const FONT_MAX = 80;
const SLOW_MS = 4000;
const PRECACHE = [
  './',
  'index.html',
  'app.css',
  'i18n.js',
  'palettes.js',
  'fonts.js',
  'brands.js',
  'quiz.js',
  'questions.js',
  'brand.js',
  'pwa.js',
  'app.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL)
    .then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  const keep = [SHELL, FONTS, LOGOS];
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith('bfh-') && !keep.includes(k)).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function trim(name, max) {
  const c = await caches.open(name);
  const ks = await c.keys();
  for (let i = 0; i < ks.length - max; i++) await c.delete(ks[i]);
}

function usable(r) { return r && (r.ok || r.type === 'opaque'); }

async function shellFirst(req, isNav) {
  const c = await caches.open(SHELL);
  const key = isNav ? new URL(req.url).pathname : req;
  const cached = async () => (await c.match(key, { ignoreSearch: true }))
    || (isNav ? (await c.match('./')) || (await c.match('index.html')) : undefined);
  const net = fetch(req).then((r) => {
    if (r && r.ok && r.type === 'basic') c.put(key, r.clone()).catch(() => {});
    return r;
  });
  net.catch(() => {});
  /* On a slow line, show the cached copy after SLOW_MS; the network answer still refreshes the cache. */
  const slow = new Promise((res) => setTimeout(() => cached().then((r) => r && res(r)), SLOW_MS));
  try {
    return await Promise.race([net, slow]);
  } catch (e) {
    const r = await cached();
    if (r) return r;
    throw e;
  }
}

async function staleWhileRevalidate(req) {
  const c = await caches.open(FONTS);
  const hit = await c.match(req);
  const net = fetch(req).then((r) => {
    if (usable(r)) c.put(req, r.clone()).then(() => trim(FONTS, FONT_MAX)).catch(() => {});
    return r;
  }).catch(() => hit);
  return hit || net;
}

async function cacheFirst(req) {
  const c = await caches.open(LOGOS);
  const hit = await c.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (usable(r)) c.put(req, r.clone()).then(() => trim(LOGOS, LOGO_MAX)).catch(() => {});
  return r;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/.netlify/')) return;
    if (url.pathname.endsWith('/sw.js')) return;
    e.respondWith(shellFirst(req, req.mode === 'navigate'));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(staleWhileRevalidate(req));
    return;
  }
  if (url.hostname === 'upload.wikimedia.org' || ((url.hostname === 'www.google.com' || url.hostname === 'google.com') && url.pathname.startsWith('/s2/favicons'))) {
    e.respondWith(cacheFirst(req));
  }
});
