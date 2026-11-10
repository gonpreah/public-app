/* GonPreah's service worker: network first, always — a push to main is live at
   once — with the kept copy only when the network fails or takes over 4 s.
   Same-origin GETs only: the API (a POST) and Google are never touched.
   Bump SHELL when PRECACHE changes. library-km.js (large, Khmer summaries) is not in it:
   it is fetched the first time someone reads in Khmer, and kept from then on. */
var SHELL = 'gpa-shell-v6', NET_WAIT_MS = 4000;
var PRECACHE = ['/', 'index.html', 'app.css', 'app.js', 'logo.js', 'km.js', 'km-app.js', 'personality.js', 'gpstrengths.js', 'library-app.js', 'learn.js', 'library.js', 'khmer-vocab.js', 'khmer-grammar.js', 'devotions.js', 'apest.js', 'deeper-types.js', 'deeper-strengths.js', 'qrcode.js', 'spheres.js', 'manifest.json',
  'fonts/kantumruy-latin.woff2', 'fonts/kantumruy-khmer.woff2', 'fonts/kantumruy-latin-ext.woff2', 'fonts/koulen-latin.woff2', 'fonts/koulen-khmer.woff2', 'icon-180.png', 'icon-512.png'];
self.addEventListener('install', function(e){ e.waitUntil(caches.open(SHELL).then(function(c){ return c.addAll(PRECACHE).catch(function(){}); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== SHELL; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/.netlify/') === 0) return;
  e.respondWith(new Promise(function(resolve){
    var done = false, finish = function(res){ if (!done && res) { done = true; resolve(res); } };
    var net = fetch(r).then(function(res){ if (res && res.ok) { var cp = res.clone(); caches.open(SHELL).then(function(c){ c.put(r, cp); }); } finish(res); return res; })
      .catch(function(){ caches.match(r, { ignoreSearch: true }).then(function(m){ finish(m || Response.error()); }); });
    setTimeout(function(){ caches.match(r, { ignoreSearch: true }).then(function(m){ if (m) finish(m); }); }, NET_WAIT_MS);
  }));
});

/* Reminders (web push, copied from the Impact app): the server sends { title, body, tag, url },
   encrypted to this phone; one notification, replacing the last with the same tag. Tapping it
   opens the app, or brings an open copy to the front. */
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'GonPreah', {
    body: d.body || '', tag: d.tag || 'gpa-reminder', renotify: true,
    icon: 'icon-512.png', badge: 'icon-180.png', data: { url: d.url || '/' }
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || '/', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]) return list[i].focus(); }
    return self.clients.openWindow(url);
  }));
});
