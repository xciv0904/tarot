#!/usr/bin/env node
/* 多命盤管理回歸測試。
 *
 * 這一支的重點是「舊使用者的資料不能弄丟」。改動的是 localStorage 格式，
 * 而使用者本機那筆 tl_astro_profile 是他唯一的出生資料備份——遷移只要錯一次，
 * 使用者就得重打，而且不會知道為什麼。
 *
 * 每個情境都用獨立的 localStorage 快照建立乾淨的執行環境，避免互相污染。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const failures = [];
const checks = [];
function check(name, ok, detail) {
  checks.push(name);
  if (!ok) failures.push(name + (detail ? '：' + detail : ''));
}

function element() {
  return { innerHTML:'', style:{}, value:'', classList:{add(){},remove(){}}, addEventListener(){},
           setAttribute(){}, appendChild(){}, removeChild(){}, click(){},
           querySelector(){return null;}, querySelectorAll(){return [];} };
}
function makeRuntime(store) {
  const elements = {};
  const c = { console, setTimeout: (fn) => fn(), clearTimeout, URL, Intl, Date, Math, JSON, Promise };
  c.window = c; c.navigator = {}; c.location = { hostname: 'example.com', search: '' };
  c.scrollTo = () => {}; c.confirm = () => true;
  c.localStorage = {
    _d: Object.assign({}, store),
    getItem(k) { return this._d[k] === undefined ? null : this._d[k]; },
    setItem(k, v) { this._d[k] = v; },
    removeItem(k) { delete this._d[k]; },
  };
  c.document = { head:element(), body:element(), documentElement:element(),
    getElementById(id) { return elements[id] || (elements[id] = element()); },
    querySelector(){return null;}, querySelectorAll(){return [];}, addEventListener(){}, createElement:element };
  vm.createContext(c);
  vm.runInContext(read('assets/vendor/astronomy-engine-2.1.19.min.js'), c, { filename: 'astronomy' });
  ['js/data/astrology-core-data.js','js/data/astrology-points-data.js','js/data/astrology-placement-templates.js',
   'js/data/astrology-aspect-data.js','js/data/astrology-knowledge-layer.js','js/data/astrology-knowledge-dataset.js',
   'js/data/astrology-natal-topics-data.js','js/data/card-images.js','js/data/reading-data.js',
   'js/data/reading-interpretation.js','js/data/reading-rich-data.js','js/app.js',
   'js/data/astro-charts.js','js/data/astro-advanced.js','tests/golden-charts.js']
    .forEach(f => vm.runInContext(read(f), c, { filename: f }));
  c.ensureAstrologyBodyKeys();
  /* 引擎已經同步載進 context，不需要真的走動態 script 載入。 */
  c.ensureAstronomyLoaded = () => Promise.resolve(c.Astronomy);
  return c;
}
async function generate(c, y, cityIdx, houseSystem) {
  c.state.astroY = y; c.state.astroM = '5'; c.state.astroD = '20';
  c.state.astroH = '14'; c.state.astroMin = '30';
  c.state.astroUnknownTime = false; c.state.astroCityIdx = cityIdx;
  if (houseSystem) c.state.astroHouseSystem = houseSystem;
  await c.astroGenerate();
}

(async function run() {
  /* --- 1. 舊使用者遷移：這是整組改動裡風險最高的一步 --- */
  const legacyProfile = { y:'1990', m:'5', d:'20', h:'14', min:'30', unknownTime:false, cityIdx:0, houseSystem:'whole' };
  let c = makeRuntime({ tl_astro_profile: JSON.stringify(legacyProfile) });
  check('舊 tl_astro_profile 會被遷移成命盤清單', c.astroChartsLoad() === true);
  check('遷移後恰好一張命盤', (c.state.astroCharts || []).length === 1,
    '實際 ' + (c.state.astroCharts || []).length);
  const migrated = c.state.astroCharts[0] || {};
  ['y','m','d','h','min'].forEach(function (f) {
    check('遷移保留欄位 ' + f, migrated[f] === legacyProfile[f], migrated[f] + ' ≠ ' + legacyProfile[f]);
  });
  check('遷移保留宮位制', migrated.houseSystem === 'whole');
  check('遷移保留出生地索引', migrated.cityIdx === 0);
  check('遷移後仍保留舊 key（保有回退能力）', !!c.localStorage.getItem('tl_astro_profile'));
  check('遷移後寫入新 key', !!c.localStorage.getItem('tl_astro_charts'));
  check('遷移後有啟用中的命盤', !!c.astroActiveChartRecord());

  /* --- 2. 全新使用者 --- */
  c = makeRuntime({});
  check('全新使用者載入時沒有命盤', c.astroChartsLoad() === false);

  /* --- 3. 建立多張、切換 --- */
  c = makeRuntime({});
  await generate(c, '1990', 0);
  c.astroChartStartNew(); await generate(c, '1985', 1);
  c.astroChartStartNew(); await generate(c, '2000', 2);
  check('可以保存三張命盤', c.state.astroCharts.length === 3, '實際 ' + c.state.astroCharts.length);
  const fpBefore = c.natalChartFingerprint(c.state.astroResult, false);
  await c.astroChartSwitch(c.state.astroCharts[0].id);
  check('切換後 chartFingerprint 改變',
    c.natalChartFingerprint(c.state.astroResult, false) !== fpBefore);
  check('切換後輸入欄位同步到該盤', c.state.astroY === '1990', '實際 ' + c.state.astroY);
  check('切換後 astroCityUsed 同步', !!c.state.astroCityUsed);

  /* --- 4. 同一組出生資料不得產生第二張 --- */
  const countBefore = c.state.astroCharts.length;
  c.astroChartStartNew();
  await generate(c, '1990', 0);
  check('相同出生資料不會重複建立', c.state.astroCharts.length === countBefore,
    countBefore + ' → ' + c.state.astroCharts.length);

  /* --- 5. 修改既有盤（換宮位制）是更新不是新增 --- */
  await generate(c, '1990', 0, 'whole');
  check('換宮位制是就地更新', c.state.astroCharts.length === countBefore,
    '變成 ' + c.state.astroCharts.length + ' 張');

  /* --- 6. 換盤必須清掉上一張的主題分析 --- */
  c.state.natalTopicResult = { topicId: 'love' };
  await c.astroChartSwitch(c.state.astroCharts[1].id);
  check('切換命盤會清空主題分析，不留殘影', c.state.natalTopicResult === null);

  /* --- 7. 刪除 ---
     刪除是兩段式的：第一次點擊只把這張盤「上膛」，畫面上長出確認區塊，
     第二次點擊才真的刪。單次點擊不得刪掉任何東西。 */
  const deletedId = c.state.astroActiveId;
  const beforeCount = c.state.astroCharts.length;
  await c.astroChartDelete(deletedId);
  check('第一次點刪除不會真的刪掉', c.state.astroCharts.length === beforeCount);
  check('第一次點刪除會顯示確認區塊', c.state.armedAction === 'chart:' + deletedId);
  await c.astroChartDelete(deletedId);
  check('刪除後不在清單中', !c.state.astroCharts.some(x => x.id === deletedId));
  check('刪除後解除上膛', !c.state.armedAction);
  check('刪掉使用中的盤後會自動接手另一張',
    !!c.state.astroActiveId && !!c.state.astroResult);

  /* --- 8. 持久化 --- */
  const snapshot = { tl_astro_charts: c.localStorage.getItem('tl_astro_charts') };
  const reopened = makeRuntime(snapshot);
  reopened.astroChartsLoad();
  check('關閉再開啟後命盤數量一致',
    reopened.state.astroCharts.length === c.state.astroCharts.length);
  check('關閉再開啟後 activeId 還原',
    reopened.state.astroActiveId === c.state.astroActiveId);

  /* --- 9. 損壞資料不得讓星盤功能整個掛掉 --- */
  const broken = makeRuntime({ tl_astro_charts: '{{{ 壞掉的 JSON' });
  check('損壞的 JSON 安全降級', broken.astroChartsLoad() === false);
  const dangling = makeRuntime({ tl_astro_charts: JSON.stringify({
    version: 1, activeId: '不存在的 id',
    charts: [{ id: 'x', name: 'A', y: '1990', m: '5', d: '20', h: '1', min: '2', cityIdx: 0 }],
  }) });
  dangling.astroChartsLoad();
  check('activeId 指向不存在的命盤時自動修正', dangling.state.astroActiveId === 'x');

  /* --- 10. 命名長度與空白 --- */
  c.astroChartRename(c.state.astroActiveId, '   我的　　命盤   ');
  const renamed = c.astroActiveChartRecord();
  check('重新命名會清掉前後與重複空白', renamed.name === '我的 命盤', '實際「' + renamed.name + '」');
  c.astroChartRename(c.state.astroActiveId, 'x'.repeat(60));
  check('命盤名稱長度受限', c.astroActiveChartRecord().name.length <= 20);

  /* --- 11. 清除所有資料要連命盤清單一起清 --- */
  check('APP_STORAGE_KEYS 包含 tl_astro_charts',
    (c.APP_STORAGE_KEYS || []).indexOf('tl_astro_charts') !== -1);

  console.log('# 多命盤回歸測試');
  console.log('');
  console.log('- 檢查項目：' + checks.length);
  console.log('- 失敗：' + failures.length);
  if (failures.length) {
    console.log('');
    failures.forEach(f => console.log('  ✗ ' + f));
    process.exit(1);
  }
  console.log('');
  console.log('全部通過。');
})();
