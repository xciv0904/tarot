#!/usr/bin/env node
/* 「人生階段變化」完整資料契約與 renderer 回歸。
 *
 * 這支測試刻意用真實 Astronomy Engine 從出生資料排盤，再跑：
 * natal chart → secondary progression → cross aspects → transform → renderer。
 * 只拿合成 chart 直接呼叫文案 helper，抓不到缺少 runtime function 這類整合錯誤。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const checks = [];
const failures = [];
function check(name, ok, detail) {
  checks.push(name);
  if (!ok) failures.push(name + (detail ? '：' + detail : ''));
}
function element() {
  return { innerHTML:'', style:{}, value:'', files:[], textContent:'',
    classList:{add(){},remove(){}}, addEventListener(){}, setAttribute(){},
    appendChild(){}, removeChild(){}, querySelector(){return null;},
    querySelectorAll(){return [];}, focus(){}, blur(){}, click(){} };
}
function makeRuntime(store) {
  const elements = {};
  const c = { console, setTimeout: fn => fn(), clearTimeout, URL, Intl, Date, Math, JSON, Promise };
  c.window = c; c.navigator = {}; c.scrollTo = () => {}; c.pageYOffset = 0;
  c.location = { hostname:'example.com', search:'' };
  c.localStorage = {
    _d:Object.assign({}, store),
    getItem(k){ return this._d[k] === undefined ? null : this._d[k]; },
    setItem(k,v){ this._d[k] = v; }, removeItem(k){ delete this._d[k]; },
  };
  c.document = { head:element(), body:element(), documentElement:element(),
    getElementById(id){ return elements[id] || (elements[id] = element()); },
    querySelector(){return null;}, querySelectorAll(){return [];},
    addEventListener(){}, createElement:element };
  vm.createContext(c);
  vm.runInContext(read('assets/vendor/astronomy-engine-2.1.19.min.js'), c, { filename:'astronomy' });
  [
    'js/data/astrology-core-data.js','js/data/astrology-points-data.js',
    'js/data/astrology-placement-templates.js','js/data/astrology-aspect-data.js',
    'js/data/astrology-knowledge-layer.js','js/data/astrology-knowledge-dataset.js',
    'js/data/astrology-natal-topics-data.js','js/data/card-images.js',
    'js/data/reading-data.js','js/data/reading-interpretation.js',
    'js/data/reading-rich-data.js','js/app.js','js/data/astro-charts.js',
    'js/data/astro-advanced.js'
  ].forEach(file => vm.runInContext(read(file), c, { filename:file }));
  c.ensureAstrologyBodyKeys();
  c.ensureAstronomyLoaded = () => Promise.resolve(c.Astronomy);
  return c;
}

const TEST_RECORD = {
  id:'life-stage-20020904', name:'人生階段回歸',
  y:'2002', m:'9', d:'4', h:'14', min:'11', unknownTime:false,
  cityIdx:1, houseSystem:'placidus', createdAt:'2026-08-25T00:00:00.000Z',
};
function progressionHtml(c) {
  c.state.tab = 'astro';
  c.state.astroView = 'progression';
  c.state.astroTabsMoreOpen = true;
  c.state.progYears = 1;
  c.state.progExpandedYear = 0;
  return c.renderAstro();
}
function validProgressionRow(row) {
  return row && row.startDate instanceof Date && !isNaN(row.startDate.getTime())
    && row.endDate instanceof Date && !isNaN(row.endDate.getTime())
    && row.prog && row.prog.targetDate instanceof Date
    && row.prog.planets && row.prog.planets.Sun && row.prog.planets.Moon
    && Array.isArray(row.aspects)
    && row.aspects.every(a => a && a.aKey && a.bKey && a.type && Number.isFinite(a.orb));
}

(async function run() {
  /* Case A：指定出生資料，從排盤一路跑到 DOM 字串。 */
  const c = makeRuntime({});
  const city = c.CITY_LIST[TEST_RECORD.cityIdx];
  const chart = c.computeNatalChart(2002, 9, 4, 14, 11, city.lat, city.lon, city.tz, 'placidus');
  c.state.astroY='2002'; c.state.astroM='9'; c.state.astroD='4';
  c.state.astroH='14'; c.state.astroMin='11'; c.state.astroUnknownTime=false;
  c.state.astroCityIdx=1; c.state.astroCityUsed=city;
  c.state.astroHouseSystem='placidus'; c.state.astroResult=chart;
  const rows = c.buildProgressionYears(chart, city, 1);
  check('Case A timezone 保留為 Asia/Taipei', city.tz === 'Asia/Taipei');
  check('Case A 14:11 正確換成 06:11Z', chart.utcDate.toISOString() === '2002-09-04T06:11:00.000Z', chart.utcDate.toISOString());
  check('Case A Placidus 契約保留', chart.houseSystem === 'placidus', chart.houseSystem);
  check('Case A 推運年度資料契約完整', rows.length === 1 && validProgressionRow(rows[0]));
  const htmlA = progressionHtml(c);
  check('Case A 人生階段成功 render', htmlA.includes('二次推運 Secondary Progression'));
  check('Case A 專業相位由新 helper render', htmlA.includes('查看推運相位、容許度與專業解讀'));
  check('Case A 沒有 undefined / NaN / Invalid Date', !/undefined|NaN|Invalid Date/.test(htmlA));

  /* Case B：出生時間是 optional data；未知時仍可 render，且不使用月亮交叉相位。 */
  c.state.astroUnknownTime = true;
  c.state.astroCityUsed = null;
  let htmlB = '';
  try { htmlB = progressionHtml(c); } catch (e) { check('Case B 缺少 optional data 不 crash', false, e.stack); }
  if (htmlB) {
    check('Case B 缺少 optional data 不 crash', htmlB.includes('出生時間未知'));
    check('Case B 不輸出 undefined / NaN', !/undefined|NaN|Invalid Date/.test(htmlB));
  }
  check('Case B 不完整的 optional 專業資訊安全省略',
    c.progressionAspectTechnicalText({aKey:'Sun',bKey:'Venus',type:'trine',orb:null}) === '');

  /* Case C：模擬關頁後只留下 localStorage，再由 saved chart 還原並進入推運。 */
  const saved = JSON.stringify({ version:1, activeId:TEST_RECORD.id, charts:[TEST_RECORD] });
  const reopened = makeRuntime({ tl_astro_charts:saved });
  check('Case C saved chart 清單可讀取', reopened.astroChartsLoad() === true);
  await reopened.astroApplyChartRecord(reopened.astroActiveChartRecord());
  const htmlC = progressionHtml(reopened);
  check('Case C 重載保存命盤後成功 render', htmlC.includes('二次推運 Secondary Progression'));
  check('Case C 保存資料保留日期時間地點',
    reopened.state.astroY === '2002' && reopened.state.astroH === '14'
      && reopened.state.astroMin === '11' && reopened.state.astroCityUsed.zh === '新北市');

  /* Case D：重複切換不能依賴第一次 render 留下的暫存狀態。 */
  reopened.state.astroView='chart'; const chart1=reopened.renderAstro();
  reopened.state.astroView='progression'; const prog1=reopened.renderAstro();
  reopened.state.astroView='chart'; const chart2=reopened.renderAstro();
  reopened.state.astroView='progression'; const prog2=reopened.renderAstro();
  check('Case D 認識自己可重複 render', chart1.includes('三分鐘看懂你的星盤') && chart2.includes('三分鐘看懂你的星盤'));
  check('Case D 人生階段可重複 render', prog1.includes('二次推運 Secondary Progression') && prog2.includes('二次推運 Secondary Progression'));

  /* Case E 的純 renderer 守門；真實 390x844 viewport 另由瀏覽器 smoke 驗證。 */
  const fixedWidths = [...prog2.matchAll(/(?:^|[;" ])width:(\d{3,})px/g)].map(m => Number(m[1])).filter(n => n > 320);
  check('Case E 320px 手機寬度沒有固定寬元素溢出', fixedWidths.length === 0, fixedWidths.join(','));

  console.log('# 人生階段變化回歸測試');
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
