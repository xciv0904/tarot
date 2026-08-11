#!/usr/bin/env node
/* 命盤主題分析的「句子完整性」測試。
 *
 * 起因：使用者在健康主題看到
 *     「壓力多半在無法感受氣氛。」
 * 每個字都還在，句子卻沒有謂語——框架是「在⋯時累積」，「時累積」被切掉了。
 *
 * 兩個獨立的成因，這支測試各釘一邊：
 *   A. 資料：ASTRO_PLANET_SEMANTIC_DATASET 的槽位值必須是短片語。
 *      Neptune 曾經六個槽位全是帶內部逗號的完整句子（例如
 *      need = '安靜思考、保留想像空間，也獲得情感回應'），嵌進
 *      '壓力來源是缺少{need}' 之後變成「缺少 A、B，也 C」——否定沒有分配到
 *      第三項，語意剛好相反。
 *   B. 顯示：compactNatalHeadline() 縮短標題時不得切在成對框架中間。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

const failures = [];
const checks = [];
function check(name, ok, extra) {
  checks.push(name);
  if (!ok) failures.push(name + (extra ? '　→ ' + extra : ''));
}

function element() {
  return { innerHTML: '', style: {}, classList: { add() {}, remove() {} },
    addEventListener() {}, setAttribute() {}, appendChild() {}, querySelector() { return null; },
    querySelectorAll() { return []; }, focus() {}, remove() {}, getBoundingClientRect() { return {}; } };
}
function loadRuntime() {
  const elements = {};
  const c = { console, setTimeout, clearTimeout, URL, Intl, Date, Math, JSON, Promise };
  c.window = c; c.navigator = {}; c.localStorage = { getItem() { return null; }, setItem() {} };
  c.document = { head: element(), body: element(), documentElement: element(),
    getElementById(id) { return elements[id] || (elements[id] = element()); },
    querySelector() { return null; }, querySelectorAll() { return []; },
    createElement() { return element(); }, addEventListener() {} };
  vm.createContext(c);
  [
    'js/data/astrology-core-data.js', 'js/data/astrology-points-data.js',
    'js/data/astrology-placement-templates.js', 'js/data/astrology-aspect-data.js',
    'js/data/astrology-knowledge-layer.js', 'js/data/astrology-knowledge-dataset.js',
    'js/data/astrology-natal-topics-data.js', 'js/data/card-images.js',
    'js/data/reading-data.js', 'js/data/reading-interpretation.js',
    'js/data/astro-charts.js', 'js/data/astro-advanced.js',
  ].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), c, { filename: f }));
  return c;
}
const c = loadRuntime();

/* ==========================================================================
   A. 語義槽位必須是短片語，不是完整句子
   ========================================================================== */
const DATASET = c.ASTRO_PLANET_SEMANTIC_DATASET;
const SLOTS = ['drive', 'gift', 'need', 'risk', 'pace', 'social'];
const planets = Object.keys(DATASET);

check('語義資料集有 10 顆行星', planets.length === 10, '實際 ' + planets.length);

planets.forEach(pk => {
  SLOTS.forEach(slot => {
    const v = String(DATASET[pk][slot] || '');
    check(pk + '.' + slot + ' 有值', !!v);
    /* 逗號會讓槽位變成多個子句。所有嵌入它的句型都是「單一片語」的框架，
       多子句一進去就會產生「缺少 A、B，也 C」這種否定沒分配到的句子。 */
    check(pk + '.' + slot + ' 不含逗號', v.indexOf('，') === -1 && v.indexOf(',') === -1, v);
    /* 「、並」是 compactNatalHeadline 的切點之一，出現在槽位裡會讓縮短
       邏輯切進槽位內部而不是框架邊界。 */
    check(pk + '.' + slot + ' 不含「、並」切點', v.indexOf('、並') === -1, v);
    check(pk + '.' + slot + ' 不含句號', v.indexOf('。') === -1, v);
    check(pk + '.' + slot + ' 不以連接詞結尾', !/(且|與|並|或|的|是|在|為|再|也)$/.test(v), v);
  });
});

/* 槽位長度要跟同一槽位的其他行星在同一個量級。pace 中位數 5 字時，
   出現一個 13 字的 pace 就代表它其實寫成了句子而不是節奏形容。 */
SLOTS.forEach(slot => {
  const lens = planets.map(pk => [...String(DATASET[pk][slot])].length).sort((a, b) => a - b);
  const median = lens[Math.floor(lens.length / 2)];
  planets.forEach(pk => {
    const n = [...String(DATASET[pk][slot])].length;
    check(pk + '.' + slot + ' 長度未偏離同槽位中位數兩倍', n <= median * 2 + 2,
      n + ' 字，中位 ' + median + '：' + DATASET[pk][slot]);
  });
});

/* ==========================================================================
   B. 合成出來的句子不得出現語意相反或斷裂
   ========================================================================== */
const KNOW = c.PLANET_TOPIC_KNOWLEDGE;
const topics = Object.keys(c.ASTRO_TOPIC_SEMANTIC_DATASET);
let generated = 0;
const broken = [];
planets.forEach(pk => {
  topics.forEach(tk => {
    const entry = KNOW[pk] && KNOW[pk][tk];
    if (!entry || !entry.meanings) return;
    const lines = []
      .concat(entry.meanings.headline || [], entry.meanings.summary || [],
        entry.meanings.details || [], entry.meanings.caution || []);
    lines.forEach(line => {
      generated++;
      const s = String(line);
      /* 否定詞的受詞列表被「，也／，還」續接：否定沒有分配到最後一項，
         「缺少安靜思考、保留想像空間，也獲得情感回應」實際上在說「有獲得回應」。
         只認「也／還」——「，又必須面對⋯」是另起一個有自己謂語的條件子句，
         那是正確的中文，不能一起抓。 */
      if (/(缺少|無法|不能|不足|沒有)[^。；，]{0,24}，(也|還)/.test(s)) {
        broken.push(pk + '×' + tk + ' 否定未分配：' + s);
      }
      if (/[，、；]{2,}|。。|，。/.test(s)) broken.push(pk + '×' + tk + ' 疊標點：' + s);
      if (/[，、]$/.test(s.replace(/。$/, ''))) broken.push(pk + '×' + tk + ' 以標點結尾：' + s);
      if (/\{[a-z]+\}/.test(s)) broken.push(pk + '×' + tk + ' 槽位未填：' + s);
    });
  });
});
/* 這支測試有沒有牙齒：把 Neptune 換回出事當時的舊值，A 段與 B 段都必須抓到。
   只在記憶體中改，不動檔案。 */
{
  const BROKEN_NEPTUNE = {
    drive: '先感受氣氛，再用創作或同理回應', gift: '觀察細微情緒，並把感受轉成文字或作品',
    need: '安靜思考、保留想像空間，也獲得情感回應', risk: '把猜測當成事實，或替別人承擔過多情緒',
    pace: '先觀察氣氛，再慢慢整理成話', social: '先聽懂對方的感受，再用溫和方式回應',
  };
  const commaHits = SLOTS.filter(k => BROKEN_NEPTUNE[k].indexOf('，') !== -1).length;
  check('舊的 Neptune 值會被 A 段的逗號規則抓到', commaHits === 6, String(commaHits));
  const badDetail = '壓力來源是缺少' + BROKEN_NEPTUNE.need;
  check('舊的 Neptune 值會被 B 段的否定規則抓到',
    /(缺少|無法|不能|不足|沒有)[^。；，]{0,24}，(也|還)/.test(badDetail), badDetail);
  const badPace = [...BROKEN_NEPTUNE.pace].length;
  const paceLens = planets.map(pk => [...String(DATASET[pk].pace)].length).sort((a, b) => a - b);
  check('舊的 Neptune pace 會被長度規則抓到',
    badPace > paceLens[Math.floor(paceLens.length / 2)] * 2 + 2, String(badPace));
}

check('合成句數量足夠（10 行星 × ' + topics.length + ' 主題）', generated > 1000, String(generated));
check('沒有語意相反或斷裂的合成句', broken.length === 0, broken.slice(0, 5).join(' ｜ '));

/* ==========================================================================
   C. 縮短標題不得切在成對框架中間
   ========================================================================== */
check('natalCutKeepsFrame 存在', typeof c.natalCutKeepsFrame === 'function');
if (typeof c.natalCutKeepsFrame === 'function') {
  const full = '壓力多半在無法感受氣氛並用創作或同理回應時累積';
  check('「在⋯時」被切開時判定為壞切點',
    c.natalCutKeepsFrame('壓力多半在無法感受氣氛', full) === false);
  check('切點保留了完整框架時判定為好切點',
    c.natalCutKeepsFrame(full, full) === true);
  check('「因⋯而」被切開時判定為壞切點',
    c.natalCutKeepsFrame('進度容易因反覆確認', '進度容易因反覆確認而延後') === false);
  check('框架開頭與結尾都在切點前時可以切',
    c.natalCutKeepsFrame('壓力在忙碌時累積', '壓力在忙碌時累積，也會影響睡眠') === true);
  check('沒有框架時不受影響',
    c.natalCutKeepsFrame('溝通偏向直接明確', '溝通偏向直接明確，再視情況調整') === true);
}

/* 端到端：使用者實際回報的那一句，經過縮短之後必須仍然是完整句子。 */
if (typeof c.compactNatalHeadline === 'function') {
  const reported = c.compactNatalHeadline('壓力多半在無法感受氣氛並用創作或同理回應時累積。', 'stress_response', null);
  check('回報的那一句不再被截成「壓力多半在無法感受氣氛。」',
    reported !== '壓力多半在無法感受氣氛。', reported);
  check('縮短後仍保留「在⋯時」的結尾', /時[^。]*。$/.test(reported) || reported.indexOf('在') === -1, reported);

  /* 掃過所有主題的 headline，確認縮短之後沒有留下半個框架。 */
  const cut = [];
  planets.forEach(pk => topics.forEach(tk => {
    const e = KNOW[pk] && KNOW[pk][tk];
    if (!e || !e.meanings || !e.meanings.headline.length) return;
    const src = e.meanings.headline[0];
    const out = c.compactNatalHeadline(src, 'overview', null);
    const body = String(out).replace(/。$/, '');
    const srcBody = String(src).replace(/。$/, '');
    if (srcBody.indexOf(body) === 0 && !c.natalCutKeepsFrame(body, srcBody)) {
      cut.push(pk + '×' + tk + '：' + src + ' → ' + out);
    }
  }));
  check('沒有任何主題標題被切在框架中間', cut.length === 0, cut.slice(0, 4).join(' ｜ '));
}

console.log('# 命盤句子完整性測試');
console.log('');
console.log('- 檢查項目：' + checks.length);
console.log('- 合成句：' + generated);
console.log('- 失敗：' + failures.length);
if (failures.length) {
  console.log('');
  failures.slice(0, 15).forEach(f => console.log('  ✗ ' + f));
  if (failures.length > 15) console.log('  …共 ' + failures.length + ' 項');
  process.exit(1);
}
console.log('');
console.log('全部通過。');
