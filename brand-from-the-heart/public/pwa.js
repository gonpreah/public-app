/* Install to the home screen and work on weak internet.
   window.BFH_PWA = { canInstall, install(), isStandalone, online }; a 'bfh-pwa' event on
   document whenever canInstall or online changes. Registers sw.js (https or localhost only) and,
   when a new version takes over, reloads once — but never while someone is typing. */
(function () {
  let deferred = null;
  const mq = window.matchMedia ? window.matchMedia('(display-mode: standalone)') : null;
  const P = window.BFH_PWA = {
    canInstall: false,
    isStandalone: !!((mq && mq.matches) || navigator.standalone),
    online: navigator.onLine !== false,
    install: function () {
      if (!deferred) return Promise.resolve('unavailable');
      const d = deferred;
      deferred = null;
      d.prompt();
      return d.userChoice.then(function (c) {
        P.canInstall = false;
        emit();
        return c && c.outcome;
      }, function () { P.canInstall = false; emit(); return 'dismissed'; });
    }
  };
  function emit() {
    try { document.dispatchEvent(new CustomEvent('bfh-pwa', { detail: { canInstall: P.canInstall, online: P.online, isStandalone: P.isStandalone } })); } catch (e) {}
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    P.canInstall = true;
    emit();
  });
  window.addEventListener('appinstalled', function () {
    deferred = null;
    P.canInstall = false;
    P.isStandalone = true;
    emit();
  });
  if (mq && mq.addEventListener) mq.addEventListener('change', function () { P.isStandalone = mq.matches || !!navigator.standalone; emit(); });
  function setOnline(v) { if (P.online !== v) { P.online = v; emit(); } }
  window.addEventListener('online', function () { setOnline(true); });
  window.addEventListener('offline', function () { setOnline(false); });

  const secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!('serviceWorker' in navigator) || !secure) return;

  function typing() {
    const a = document.activeElement;
    return !!(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable));
  }
  let reloaded = false;
  function reloadSoon() {
    if (reloaded) return;
    if (typing()) {
      document.addEventListener('focusout', function later() {
        setTimeout(function () { if (!typing()) { document.removeEventListener('focusout', later); reloadSoon(); } }, 300);
      });
      return;
    }
    reloaded = true;
    location.reload();
  }
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (hadController) reloadSoon();
  });
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update().catch(function () {}); });
    }).catch(function () {});
  });
})();
