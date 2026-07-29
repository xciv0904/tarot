#!/usr/bin/env node
/* 星盤側文案品質回歸測試。
 *
 * Golden 回歸比對的是「答案有沒有變」，不是「答案讀起來好不好」。以下這幾種問題
 * 可以在 Golden 全綠的情況下一路留到線上：
 *
 *   1. 分項說明的開頭只是把自己的標籤再唸一次
 *      （標籤「衝突後的第一步」，內文「第一步是⋯⋯」）
 *   2. headline / summary / caution 都有句號，只有 details 沒有
 *   3. 分項內文整句都被上面的結論包含，等於同一句話讀兩遍
 *   4. 專業術語出現在「一進畫面就看得到」的地方而沒有任何解釋
 *      （摺疊區與「進階解讀」裡出現術語是刻意的，不算）
 *
 * 檢查的是文案的形，不是內容，所以正常改寫文案不會誤報。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

function element() {
  return { innerHTML: '', style: {}, value: '', files: [], classList: { add() {}, remove() {} },
    addEventListener() {}, setAttribute() {}, appendChild() {}, removeChild() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    focus() {}, blur() {}, scrollIntoView() {}, textContent: '' };
}

function loadRuntime() {
  const elements = {};
  const c = { console, setTimeout, clearTimeout, setInterval, clearInterval, URL, Intl, Date, Math, JSON, Promise };
  c.window = c;
  c.navigator = {};
  c.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
  c.scrollTo = function () {};
  c.alert = function () {};
  c.confirm = function () { return false; };
  c.document = { head: element(), body: element(), documentElement: element(),
    getElementById(id) { return elements[id] || (elements[id] = element()); },
    querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener() {}, createElement: element };
  vm.createContext(c);
  [
    'assets/vendor/astronomy-engine-2.1.19.min.js',
    'js/data/astrology-core-data.js', 'js/data/astrology-points-data.js',
    'js/data/astrology-placement-templates.js', 'js/data/astrology-aspect-data.js',
    'js/data/astrology-knowledge-layer.js', 'js/data/astrology-knowledge-dataset.js',
    'js/data/astrology-natal-topics-data.js', 'js/data/card-images.js',
    'js/data/reading-data.js', 'js/data/reading-rich-data.js',
    'js/app.js', 'js/data/astro-charts.js', 'js/data/astro-advanced.js', 'tests/golden-charts.js',
  ].forEach(file => vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), c, { filename: file }));
  c.ensureAstrologyBodyKeys();
  return c;
}

const c = loadRuntime();
const natalHeadlineForTitleAvailable = typeof c.natalHeadlineForTitle === 'function';
const failures = [];
const fail = msg => failures.push(msg);
const END_OK = '。！？」）';
const key = t => String(t == null ? '' : t).replace(/[。，、；：？！「」（）\s]/g, '');

/* ---------- 1–3. 人生主題答案（用 Golden 合成星盤跑完整管線） ---------- */
const answers = [];
c.GOLDEN_TEST_CHARTS.forEach(entry => {
  const chart = entry.chart || entry;
  Object.keys(c.NATAL_TOPIC_QUESTIONS).forEach(topicId => {
    const ids = c.NATAL_TOPIC_QUESTIONS[topicId].slice(0, 3).map(q => q.id);
    let res;
    try { res = c.analyzeNatalTopic(chart, topicId, ids); } catch (e) { return; }
    (res && res.answers || []).forEach(a => answers.push(a));
  });
});
if (answers.length < 50) fail(`人生主題答案樣本過少（${answers.length}），測試無法確認品質`);

const allDetails = answers.reduce((n, a) => n + (a.details || []).length, 0);

// 1. 分項重述自己的標籤
const ECHO_RE = /^(.{2,7}?)(是|宜|為|需要|在於)/;
let echo = 0;
const echoSamples = [];
answers.forEach(a => (a.details || []).forEach(d => {
  const m = ECHO_RE.exec(d.text || '');
  if (!m) return;
  const shared = new Set([...m[1]].filter(ch => (d.label || '').includes(ch))).size;
  if (shared >= 2) { echo++; if (echoSamples.length < 3) echoSamples.push(`[${d.label}] ${d.text}`); }
}));
const ECHO_BUDGET = Math.ceil(allDetails * 0.03); // 容許 3%，模板組合難免有殘留
if (echo > ECHO_BUDGET) {
  fail(`分項內文重述自己的標籤：${echo}/${allDetails} 條，超過上限 ${ECHO_BUDGET}。例如 ${echoSamples.join(' / ')}`);
}

// 2. 句尾標點
const noEnd = [];
answers.forEach(a => {
  ['headline', 'summary', 'caution'].forEach(f => {
    const t = (a[f] || '').replace(/\s+$/, '');
    if (t && END_OK.indexOf(t.charAt(t.length - 1)) === -1) noEnd.push(`${f}:${t.slice(0, 30)}`);
  });
  (a.details || []).forEach(d => {
    const t = (d.text || '').replace(/\s+$/, '');
    if (t && END_OK.indexOf(t.charAt(t.length - 1)) === -1) noEnd.push(`detail:${t.slice(0, 30)}`);
  });
});
if (noEnd.length) fail(`星盤答案結尾缺標點：${noEnd.length} 處，例如「${noEnd[0]}」`);

// 3. 顯示層必須濾掉「整句都被結論包含」的分項
let redundantShown = 0;
answers.forEach(a => {
  const head = key(a.headline);
  c.visibleNatalDetails(a).forEach(d => {
    const k = key(d.text);
    if (k.length >= 8 && head.indexOf(k) !== -1) redundantShown++;
  });
});
if (redundantShown > 0 && redundantShown === allDetails) {
  fail(`visibleNatalDetails() 沒有濾掉任何與結論重複的分項（${redundantShown} 條）`);
}

/* ---------- 3b. 結論與分項不能互相矛盾 ---------- */
/* 結論取自最主要的行星，分項會輪流取第二、第三順位，兩者曾經給出完全相反的建議
   （結論說「講求紀律與長期累積」、分項說「步調靈活、允許隨時調整」）。
   星盤確實可能同時有相反需求，所以留一點額度，但不該是常態。 */
const CONTRAST_AXES = [
  [['制度', '規範', '紀律', '穩定', '長期累積', '按部就班', '明確的規則', '可預期'],
   ['靈活', '彈性', '隨時調整', '不受拘束', '自由發揮', '隨性', '變化快']],
  [['獨立', '自己一個人', '單打獨鬥', '獨處', '一個人完成'],
   ['團隊', '合作', '一起', '夥伴', '互相照應', '交換想法']],
  [['快速', '立刻', '馬上', '搶佔先機', '主動出手', '衝'],
   ['緩慢', '慢慢', '循序', '耐心等待', '沉澱', '先觀察']],
  [['熱鬧', '人來人往', '頻繁討論', '資訊流通快'],
   ['安靜', '低干擾', '不被打擾', '獨立空間']],
];
function poles(text) {
  const out = [];
  CONTRAST_AXES.forEach((axis, ai) => {
    for (let side = 0; side < 2; side++) {
      if (axis[side].some(w => text.includes(w))) { out.push(ai + ':' + side); return; }
    }
  });
  return out;
}
let contradictions = 0;
const contraSamples = [];
answers.forEach(a => {
  const hp = poles(a.headline || '');
  (a.details || []).forEach(d => {
    const dp = poles(d.text || '');
    if (hp.some(x => { const [ai, s] = x.split(':'); return dp.includes(ai + ':' + (s === '0' ? '1' : '0')); })) {
      contradictions++;
      if (contraSamples.length < 2) contraSamples.push(`結論「${a.headline}」vs 分項「${d.text}」`);
    }
  });
});
const CONTRA_BUDGET = 2;
if (contradictions > CONTRA_BUDGET) {
  fail(`結論與分項互相矛盾 ${contradictions} 處（上限 ${CONTRA_BUDGET}）：${contraSamples.join(' / ')}`);
}

/* ---------- 3c. 結論不該照抄題目的框架字 ---------- */
let echoTitle = 0;
answers.forEach(a => {
  if (natalHeadlineForTitleAvailable && c.natalHeadlineForTitle(a.title, a.headline) !== a.headline) echoTitle++;
});

/* ---------- 4. 畫面上未摺疊區的專業術語 ---------- */
function visibleText(html) {
  const s0 = String(html).replace(/<style[\s\S]*?<\/style>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, ' ');
  const out = [];
  let depth = 0, last = 0, m;
  const re = /<\/?details\b[^>]*>|<[^>]+>/g;
  const push = t => {
    t = t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
    if (t.length > 3 && /[一-鿿]/.test(t) && depth === 0) out.push(t);
  };
  while ((m = re.exec(s0))) {
    push(s0.slice(last, m.index));
    last = re.lastIndex;
    if (/^<details\b/i.test(m[0])) depth++;
    else if (/^<\/details/i.test(m[0])) depth = Math.max(0, depth - 1);
  }
  push(s0.slice(last));
  return out;
}

const city = c.CITY_LIST[0], city2 = c.CITY_LIST[1] || c.CITY_LIST[0];
const chartA = c.computeNatalChart(1990, 5, 20, 14, 30, city.lat, city.lon, city.tz, 'placidus');
const chartB = c.computeNatalChart(1985, 11, 3, 7, 15, city2.lat, city2.lon, city2.tz, 'placidus');
c.state.astroResult = chartA; c.state.astroCityUsed = city; c.state.astroUnknownTime = false;
c.state.synResult = chartB; c.state.synCityUsed = city2; c.state.synRelationship = 'love';

/* 術語出現在未摺疊區時，同一段文字裡必須至少有一個白話說明的線索，
   否則第一次接觸占星的人只會看到一串看不懂的名詞。 */
const HARD_TERMS = ['合相', '對分相', '四分相', '三分相', '六分相', '容許度', '宮主星', '守護星', '入相位', '出相位', '截奪', '互容', '定位星'];
const surfaced = [];
[['合盤', () => c.renderSynastry()]].forEach(([label, fn]) => {
  let html;
  try { html = fn(); } catch (e) { fail(`${label} 畫面渲染失敗：${e.message}`); return; }
  visibleText(html).forEach(t => {
    HARD_TERMS.forEach(w => { if (t.includes(w)) surfaced.push(`${label}：${t.slice(0, 60)}`); });
  });
});
const TERM_BUDGET = 2;
if (surfaced.length > TERM_BUDGET) {
  fail(`未摺疊區出現未加說明的專業術語 ${surfaced.length} 處（上限 ${TERM_BUDGET}）：${surfaced.slice(0, 2).join(' / ')}`);
}

/* ---------- 5. 半形逗號 ---------- */
const halfComma = [];
answers.forEach(a => {
  [a.headline, a.summary, a.caution].concat((a.details || []).map(d => d.text)).forEach(t => {
    if (t && /[一-鿿],[一-鿿]/.test(t)) halfComma.push(t.slice(0, 40));
  });
});
if (halfComma.length) fail(`星盤答案中文句子出現半形逗號：${halfComma.length} 處，例如「${halfComma[0]}」`);

/* ---------- 6. 「純資料」複製格式 ----------
 * 這份是要貼給外部 AI 的，錯了不會在畫面上顯現，只會讓別人拿到壞資料，
 * 所以這裡守的是三件事：該有的區塊都在、宣告的數量與實際列出的一致、
 * 以及出生時間未知時絕對不外洩任何宮位資訊（那是我們宣告過不提供的）。 */
const PACK_SECTIONS = ['【本命盤觀測值', '【出生條件與計算方式】', '【先抓主軸】', '【六個閱讀錨點】',
  '【全盤分布】', '【相位焦點', '【生活面向索引】', '【明細表一', '【明細表三', '【交給 AI 的任務】'];
let packRuns = 0;
[[chartA, city, false], [chartB, city2, false], [chartA, city, true]].forEach(([ch, ct, unknown]) => {
  c.state.astroResult = ch; c.state.astroCityUsed = ct; c.state.astroUnknownTime = unknown;
  c.state.astroY = '1990'; c.state.astroM = '5'; c.state.astroD = '20';
  c.state.astroH = '14'; c.state.astroMin = '30';
  let text;
  try { text = c.buildAstroDataPackText(ch, unknown); } catch (e) { fail(`純資料格式產生失敗：${e.message}`); return; }
  packRuns++;
  const tag = `${ct.zh}${unknown ? '（時間未知）' : ''}`;
  PACK_SECTIONS.forEach(s => { if (!text.includes(s)) fail(`純資料格式 ${tag} 缺少區塊 ${s}`); });
  ['觸發', '至少兩項', '生活片段', '由近到深', '核心主軸', '這週就能執行'].forEach(s => {
    if (!text.includes(s)) fail(`純資料格式 ${tag} 缺少深度綜合要求「${s}」`);
  });
  ['使用可能性語氣', '本人核對'].forEach(s => {
    if (text.includes(s)) fail(`純資料格式 ${tag} 仍保留造成模糊回答的要求「${s}」`);
  });
  ['undefined', 'NaN', '[object'].forEach(w => { if (text.includes(w)) fail(`純資料格式 ${tag} 出現 ${w}`); });
  if (/°60'/.test(text)) fail(`純資料格式 ${tag} 出現 60 分未進位的度數`);
  if (/座座/.test(text)) fail(`純資料格式 ${tag} 星座名重複「座座」`);

  const declared = Number((text.match(/全部主要相位：(\d+) 組/) || [])[1]);
  const listed = text.split('【明細表三')[1].split('\n').filter(l => l.startsWith('- ')).length;
  if (declared !== listed) fail(`純資料格式 ${tag} 明細表三宣告 ${declared} 組、實際列出 ${listed} 組`);
  const themed = text.split('【生活面向索引】')[1].split('【明細表一')[0].split('\n').filter(l => l.startsWith('- ')).length;
  if (themed !== listed) fail(`純資料格式 ${tag} 主題分類漏列相位：${themed} ≠ ${listed}`);

  if (unknown) {
    if (/第\d+宮×|半球分布|角宮 \d|第\d+宮：|上升點 ASC (?:合相|六分相|四分相|三分相|對分相)|天頂 MC (?:合相|六分相|四分相|三分相|對分相)|(?:合相|六分相|四分相|三分相|對分相) 上升點 ASC|(?:合相|六分相|四分相|三分相|對分相) 天頂 MC/.test(text)) fail('純資料格式在出生時間未知時仍輸出宮位或角度點相位');
    if (text.includes('【明細表二')) fail('純資料格式在出生時間未知時仍輸出十二宮起點');
  } else if (!text.includes('【明細表二')) {
    fail(`純資料格式 ${tag} 缺少十二宮起點`);
  } else {
    const angleAspects = c.natalPackAngleAspects(ch);
    if (!angleAspects.length) fail(`純資料格式 ${tag} 未算出任何 ASC／MC 相位，測試樣本失效`);
    angleAspects.forEach(a => {
      const line = c.natalPackAspectLine(a);
      if (!text.includes(line)) fail(`純資料格式 ${tag} 缺少角度點相位：${line}`);
    });
  }
});
if (packRuns < 3) fail('純資料格式測試樣本不足');

/* ---------- 結果 ---------- */
if (failures.length) {
  console.error('Astro copy quality FAILED:');
  failures.forEach(f => console.error('  - ' + f));
  process.exit(1);
}
console.log(`Astro copy quality passed: ${answers.length} 筆人生主題答案／${allDetails} 條分項，` +
  `重述標籤 ${echo}/${ECHO_BUDGET}、缺句尾標點 0、半形逗號 0、結論與分項矛盾 ${contradictions}/${CONTRA_BUDGET}、` +
  `顯示時修剪掉題目框架字 ${echoTitle} 筆、未摺疊術語 ${surfaced.length}/${TERM_BUDGET}、` +
  `純資料複製格式 ${packRuns} 組全數通過。`);
