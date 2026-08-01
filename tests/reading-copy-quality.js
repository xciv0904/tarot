#!/usr/bin/env node
/* 牌卡解讀文案品質回歸測試。
 *
 * Golden 回歸只涵蓋星盤的人生主題答案，牌卡側（塔羅／雷諾曼的子問題解讀、單張牌欄位、
 * 綜合解讀）長期沒有任何自動檢查，所以以下這幾種問題可以一路留到線上：
 *
 *   1. 中文句子裡混用半形逗號（曾有 720 處）
 *   2. 有的句子有句號、有的沒有，同一個面板上下兩行標點不一致（曾佔輸出的 63%）
 *   3. 同一個欄位反覆吐出同一句罐頭話，抽十次牌看到十次一樣的結尾
 *   4. 「還在醞釀」「保持彈性」「難以用單一詞彙概括」這類說了等於沒說的填充句
 *
 * 這支測試會實際跑一遍所有分類 × 子問題 × 多組抽牌組合，對產生出來的文字做檢查。
 * 它檢查的是「文案的形」而不是「文案的內容」，所以正常改寫文案不會讓它誤報。
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
    'js/data/astrology-core-data.js', 'js/data/astrology-points-data.js',
    'js/data/astrology-placement-templates.js', 'js/data/astrology-aspect-data.js',
    'js/data/astrology-knowledge-layer.js', 'js/data/astrology-knowledge-dataset.js',
    'js/data/astrology-natal-topics-data.js', 'js/data/card-images.js',
    'js/data/reading-data.js', 'js/data/reading-interpretation.js', 'js/data/reading-rich-data.js', 'js/app.js',
  ].forEach(file => vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), c, { filename: file }));
  /* TAROT／LENORMAND 等是 const 宣告，不會掛到 context 物件上，要在 context 裡取出來。 */
  vm.runInContext(
    'window.__T=TAROT;window.__L=LENORMAND;window.__TS=TAROT_SPREADS;window.__LS=LENORMAND_SPREADS;' +
    'window.__SUB=SUBTOPICS;window.__CAT=CATEGORIES;window.__ORDER=SUBTOPIC_FIELD_ORDER;', c);
  return c;
}

const c = loadRuntime();

/* 決策入口與是／否判讀屬於公開互動，避免日後改推薦清單時意外消失。 */
if (!c.__TS.yesno || c.__TS.yesno.positions.length !== 3) {
  throw new Error('是／否牌陣必須存在且固定為三張牌。');
}
for (const key of ['fork', 'yesno']) {
  if (vm.runInContext(`RECOMMENDATIONS.decision.indexOf('${key}')`, c) === -1) {
    throw new Error(`決策入口缺少 ${key} 牌陣。`);
  }
}
const yesNoCases = [
  { reversed: [false, false, false], expected: '明顯偏向「是」' },
  { reversed: [false, false, true], expected: '目前偏向「是」' },
  { reversed: [false, true, true], expected: '目前偏向「否」' },
  { reversed: [true, true, true], expected: '明顯偏向「否」' },
];
yesNoCases.forEach(test => {
  c.state.drawn = test.reversed.map(reversed => ({ reversed }));
  const actual = c.yesNoVerdict(c.state.drawn).label;
  if (actual !== test.expected) throw new Error(`是／否判讀錯誤：預期 ${test.expected}，實際 ${actual}`);
});

/* ---------- 產生語料 ---------- */
function drawSet(deck, spreadKey, seed) {
  const sp = deck === 'tarot' ? c.__TS[spreadKey] : c.__LS[spreadKey];
  const pool = deck === 'tarot' ? c.__T : c.__L;
  const drawn = [];
  for (let i = 0; i < sp.positions.length; i++) {
    const idx = (seed * 31 + i * 17) % pool.length;
    drawn.push({ card: pool[idx], reversed: deck === 'tarot' && ((seed + i) % 2 === 0), pos: sp.positions[i], flipped: true });
  }
  return drawn;
}

const corpus = [];
for (const deck of ['tarot', 'lenormand']) {
  for (const cat of c.__CAT.map(x => x.key)) {
    const subs = (c.__SUB[cat] || []).filter(s => s.modes.indexOf('cards') !== -1);
    for (const s of subs) {
      for (let seed = 1; seed <= 8; seed++) {
        const drawn = drawSet(deck, 'three-time', seed);
        c.state.deck = deck; c.state.category = cat; c.state.subtopic = s.key;
        c.state.drawn = drawn; c.state.readingMode = 'cards';
        const r = c.cardSubtopicReading(cat, s.key, drawn);
        if (!r || !r.available) continue;
        for (const f of c.__ORDER) if (r[f]) corpus.push({ src: 'subtopic', deck, cat, sub: s.key, field: f, text: String(r[f]) });
        corpus.push({ src: 'overall', deck, cat, sub: s.key, field: 'overall', text: String(c.overallReading()) });
      }
    }
  }
}
for (const deck of ['tarot', 'lenormand']) {
  const pool = deck === 'tarot' ? c.__T : c.__L;
  const isTarot = deck === 'tarot';
  pool.forEach(card => {
    [true, false].forEach(rev => {
      const d = { card, reversed: isTarot && rev, pos: { zh: '現在', en: 'Present' }, flipped: true };
      c.state.deck = deck; c.state.category = 'general';
      const fns = { core: 'cardCoreMeaning', now: 'cardPosText', blind: 'cardBlindSpot', action: 'cardAction', remind: 'cardReminder' };
      for (const k in fns) corpus.push({ src: 'card', deck, cat: 'general', sub: card.id || ('l' + card.n), field: k, text: String(c[fns[k]](d, isTarot)) });
    });
  });
}

/* ---------- 檢查 ---------- */
const CJK = '[一-鿿]';
const HALF_COMMA = new RegExp(CJK + ',' + CJK);
const BAD_PUNCT = /。[，、；]|。。|，。|；。/;
const END_OK = '。！？」）';
/* 說了等於沒說的填充語，以及玄學但無法驗證的形容詞。
   要新增詞彙時請一併確認現有文案沒有正當用法。 */
const FILLER_WORDS = [
  '順其自然', '保持彈性', '保持平常心', '再觀察一段時間', '暫時沒有絕對的定論',
  '尚未完全明朗', '還在醞釀', '各有一些', '難以用單一詞彙', '不落於一般常規',
  '象徵意義大於', '水到渠成', '三言兩語', '命定般',
];
const FILLER_BUDGET = 6;      // 全語料允許的總出現次數
const FIELD_TOP_SHARE = 0.30; // 單一句子在同一欄位中的占比上限
/* 自我成長／心理學圈的行話。一般使用者第一次看到不一定知道在講什麼，
   已全站改寫成「底線」「分寸」「你我不分」這類日常說法，這裡防止它們回流。 */
const JARGON_WORDS = ['界線', '內在小孩', '課題分離', '情緒勒索', '投射', '自我覺察'];

const failures = [];
function fail(msg) { failures.push(msg); }

// 1. 半形逗號
const halfComma = corpus.filter(o => HALF_COMMA.test(o.text));
if (halfComma.length) fail(`中文句子裡出現半形逗號：${halfComma.length} 筆，例如「${halfComma[0].text.slice(0, 40)}」`);

// 2. 句尾標點
const noEnd = corpus.filter(o => { const t = o.text.replace(/\s+$/, ''); return t && END_OK.indexOf(t.charAt(t.length - 1)) === -1; });
if (noEnd.length) fail(`輸出結尾沒有標點：${noEnd.length} 筆，例如 [${noEnd[0].field}]「${noEnd[0].text.slice(0, 40)}」`);

// 3. 標點組合錯誤
const badPunct = corpus.filter(o => BAD_PUNCT.test(o.text));
if (badPunct.length) fail(`出現「。，」這類錯誤標點組合：${badPunct.length} 筆，例如「${badPunct[0].text.slice(0, 50)}」`);

// 4. 填充語
let fillerTotal = 0;
const fillerHits = {};
corpus.forEach(o => FILLER_WORDS.forEach(w => {
  const n = o.text.split(w).length - 1;
  if (n) { fillerTotal += n; fillerHits[w] = (fillerHits[w] || 0) + n; }
}));
if (fillerTotal > FILLER_BUDGET) {
  fail(`籠統填充語出現 ${fillerTotal} 次，超過上限 ${FILLER_BUDGET}：${JSON.stringify(fillerHits)}`);
}

// 4b. 心理學行話
const jargonHits = {};
corpus.forEach(o => JARGON_WORDS.forEach(w => {
  const n = o.text.split(w).length - 1;
  if (n) jargonHits[w] = (jargonHits[w] || 0) + n;
}));
if (Object.keys(jargonHits).length) {
  fail(`出現需要改成白話的行話：${JSON.stringify(jargonHits)}`);
}

// 5. 單一句子在同一欄位的占比
const byField = {};
corpus.forEach(o => { if (o.src === 'subtopic') { (byField[o.field] = byField[o.field] || {})[o.text] = (byField[o.field][o.text] || 0) + 1; } });
Object.keys(byField).forEach(f => {
  if (f === 'caveat') return; // 免責聲明本來就該每次都一樣
  const counts = byField[f];
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (n / total > FIELD_TOP_SHARE) {
    fail(`${f} 欄位有 ${(n / total * 100).toFixed(0)}% 都是同一句（上限 ${FIELD_TOP_SHARE * 100}%）：「${top.slice(0, 40)}」`);
  }
});

// 6. 綜合解讀的結尾不能永遠一樣
const tails = {};
corpus.filter(o => o.field === 'overall').forEach(o => {
  const t = o.text.split('整體而言，').pop();
  tails[t] = (tails[t] || 0) + 1;
});
const tailTotal = Object.values(tails).reduce((a, b) => a + b, 0);
const topTail = Object.entries(tails).sort((a, b) => b[1] - a[1])[0];
if (tailTotal && topTail[1] / tailTotal > 0.15) {
  fail(`綜合解讀有 ${(topTail[1] / tailTotal * 100).toFixed(0)}% 用同一句收尾：「${topTail[0].slice(0, 40)}」`);
}

// 7. 不能出現未替換的樣板變數或空字串
const leaks = corpus.filter(o => /\{kw\}|\{meaning\}|undefined|NaN|\[object Object\]/.test(o.text) || !o.text.trim());
if (leaks.length) fail(`輸出含未替換樣板或空值：${leaks.length} 筆，例如「${leaks[0].text.slice(0, 50)}」`);

/* ---------- 結果 ---------- */
if (failures.length) {
  console.error('Reading copy quality FAILED:');
  failures.forEach(f => console.error('  - ' + f));
  process.exit(1);
}
console.log(`Reading copy quality passed: ${corpus.length} 段解讀輸出，` +
  `半形逗號 0、缺句尾標點 0、標點錯誤 0、填充語 ${fillerTotal}/${FILLER_BUDGET}、行話 0、` +
  `結尾句最高占比 ${(topTail[1] / tailTotal * 100).toFixed(0)}%。`);
