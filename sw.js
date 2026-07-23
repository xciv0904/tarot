/* Mystic Deck service worker — 卡牌圖片快取優先,頁面網路優先 */
const CACHE = 'mystic-v4';
const CORE = ['./', './index.html', './manifest.json', './assets/favicon.png', './assets/icon-192.png', './assets/icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).catch(function () {}));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.indexOf('/assets/') !== -1) {
    // 靜態資產:快取優先,背景補快取
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(e.request).then(function (r) {
        return r || fetch(e.request).then(function (res) {
          if (res.ok) c.put(e.request, res.clone());
          return res;
        });
      });
    }));
  } else {
    // 頁面:網路優先,離線時回退快取
    e.respondWith(fetch(e.request).then(function (res) {
      var clone = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (cached) {
        return cached || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined);
      });
    }));
  }
});
