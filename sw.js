/* Mystic Deck service worker — 卡牌圖片快取優先,頁面網路優先 */
const CACHE = 'mystic-v44';
/* astrology-*.js 現在改成使用者切到「星盤」分頁時才動態載入（見 index.html 的
   ensureAstrologyDataLoaded），但還是放進 CORE 一起預先快取——這樣使用者第一次
   點進星盤分頁時，資料是從快取秒讀，不需要額外等網路。 */
/* 星盤運算引擎也一起預先快取——原本沒放進來，等於「星盤資料檔都在快取、但算盤的
   引擎不在」，離線時點進星盤分頁仍然算不出結果，前面預先快取那幾支資料檔就白做了。 */
const CORE = ['./', './index.html', './js/data/card-images.js', './js/data/reading-data.js', './js/data/reading-interpretation.js', './js/data/reading-rich-data.js', './js/data/astrology-core-data.js', './js/data/astrology-points-data.js', './js/data/astrology-placement-templates.js', './js/data/astrology-aspect-data.js', './js/data/astrology-natal-topics-data.js', './js/data/astrology-knowledge-layer.js', './js/data/astrology-knowledge-dataset.js', './js/app.js', './js/data/astro-charts.js', './js/data/astro-advanced.js', './assets/vendor/astronomy-engine-2.1.19.min.js', './manifest.json', './assets/favicon.png', './assets/icon-192.png', './assets/icon-512.png'];
self.addEventListener('install', function (e) {
  /* 逐一快取，不用 cache.addAll()。addAll() 是全有全無：只要清單裡有任何一個檔案
     取不到（改名、暫時 404、網路不穩），整批都不會寫入，而外層的 catch 會把錯誤吞掉，
     結果是離線功能整個失效卻毫無徵兆。改成逐一處理後，單一檔案失敗只影響它自己。 */
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (url) {
      return c.add(url).catch(function () { /* 單一資源失敗不影響其餘預先快取 */ });
    }));
  }).catch(function () {}));
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
      /* 只把成功的回應寫進快取。原本無條件 put()，一旦遇到 404／500 或 GitHub Pages
         部署中途的錯誤頁，這個壞掉的回應就會被存起來，之後離線時還會被當成正常內容
         回放，等於把一次暫時性的錯誤變成長期故障。 */
      if (res && res.ok && res.type === 'basic') {
        var clone = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (cached) {
        return cached || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined);
      });
    }));
  }
});
