#!/usr/bin/env node
/* 畫面渲染煙霧測試。
 *
 * 這個專案的 UI 全部是 JS 字串拼出來的，沒有任何模板引擎會幫忙檢查標籤是否閉合。
 * 過去只要某個分支少寫一個 </div>，畫面就會在特定狀態下整段錯位，而 npm test
 * 完全看不出來（既有測試只驗證文字內容，不碰渲染函式）。
 *
 * 這裡把每個主要畫面與狀態真的渲染一次，然後檢查結構層級的硬性條件：
 * 標籤平衡、標題階層、按鈕可及名稱、details/summary 配對、固定寬度、
 * 一般／專業模式的一致性，以及 AI 複製內容不因畫面簡化而缺漏。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

function element() {
  return { innerHTML:'', style:{}, classList:{add(){},remove(){}}, addEventListener(){}, setAttribute(){},
           appendChild(){}, querySelector(){return null;}, querySelectorAll(){return [];}, focus(){}, blur(){} };
}
function loadRuntime() {
  const elements = {};
  const c = { console, setTimeout, clearTimeout, URL, Intl, Date, Math, JSON, Promise };
  c.window = c; c.navigator = {}; c.scrollTo = () => {}; c.pageYOffset = 0;
  c.localStorage = { getItem(){return null;}, setItem(){}, removeItem(){} };
  c.location = { hostname: 'example.com', search: '' };
  c.document = { head:element(), body:element(), documentElement:element(),
    getElementById(id){ return elements[id] || (elements[id] = element()); },
    querySelector(){return null;}, querySelectorAll(){return [];}, addEventListener(){}, createElement:element };
  vm.createContext(c);
  ['js/data/astrology-core-data.js','js/data/astrology-points-data.js','js/data/astrology-placement-templates.js',
   'js/data/astrology-aspect-data.js','js/data/astrology-knowledge-layer.js','js/data/astrology-knowledge-dataset.js',
   'js/data/astrology-natal-topics-data.js','js/data/card-images.js','js/data/reading-data.js',
   'js/data/reading-interpretation.js','js/data/reading-rich-data.js','js/app.js',
   'js/data/astro-charts.js','js/data/astro-advanced.js','tests/golden-charts.js']
    .forEach(f => vm.runInContext(read(f), c, { filename: f }));
  c.ensureAstrologyBodyKeys();
  return c;
}

/* HTML 與內嵌 SVG 混在同一串字串裡，兩邊的空元素集合要一起列。 */
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr',
                      'path','circle','rect','line','polygon','polyline','use','stop','ellipse','fegaussianblur']);
function tagBalanceErrors(html) {
  const stack = [], errs = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(html))) {
    const close = m[1] === '/', tag = m[2].toLowerCase(), self = m[4] === '/';
    if (VOID.has(tag) || self) continue;
    if (!close) { stack.push(tag); continue; }
    if (!stack.length) { errs.push('多餘的 </' + tag + '>'); continue; }
    const top = stack.pop();
    if (top !== tag) errs.push('</' + tag + '> 對不上 <' + top + '>');
  }
  if (stack.length) errs.push('未關閉：' + stack.join('、'));
  return errs;
}
function headingLevels(html) { return (html.match(/<h([1-6])\b/g) || []).map(x => Number(x.slice(2))); }
function unnamedButtons(html) {
  const bad = [];
  const re = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;
  let m;
  while ((m = re.exec(html))) {
    const text = m[2].replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, '').trim();
    if (!text && !/aria-label=/.test(m[1]) && !/aria-labelledby=/.test(m[1])) bad.push(m[2].slice(0, 50));
  }
  return bad;
}
function overWideFixedWidths(html) {
  const out = [];
  const re = /(?:^|[;"])width:(\d{3,})px/g;
  let m;
  /* 最窄支援到 320px，扣掉左右 20px 內距後可用寬度是 280px；
     任何寫死超過 320px 的寬度都會在小螢幕造成水平捲動。 */
  while ((m = re.exec(html))) if (Number(m[1]) > 320) out.push(m[1] + 'px');
  return [...new Set(out)];
}

const c = loadRuntime();
const failures = [];
function fail(screen, msg) { failures.push(screen + '：' + msg); }

function snapshot(name) {
  let html;
  try { html = c.render && false ? '' : renderCurrent(); }
  catch (e) { fail(name, '渲染時丟出例外 ' + e.message); return null; }
  return { name, html };
}
function renderCurrent() {
  if (c.state.tab === 'home') return c.renderHome();
  if (c.state.tab === 'reading') return c.renderReading();
  if (c.state.tab === 'astro') return c.renderAstro();
  if (c.state.tab === 'library') return c.renderLibrary();
  if (c.state.tab === 'history') return c.renderHistory();
  return c.renderMore();
}

const screens = [];
function capture(name) {
  const s = snapshot(name);
  if (s) screens.push(s);
}

c.state.tab = 'home'; capture('首頁');
c.state.tab = 'reading'; capture('占卜・設定');
c.state.tab = 'library'; capture('牌典');
c.state.tab = 'history'; capture('歷史・空狀態');
c.state.tab = 'more'; capture('更多');

c.state.tab = 'astro'; c.state.astroResult = null; capture('星盤・出生資料輸入');
c.state.astroY = '1990'; c.state.astroM = '5'; c.state.astroD = '20';
c.state.astroH = '14'; c.state.astroMin = '30';
c.state.astroCityIdx = 0; c.state.astroCityUsed = c.CITY_LIST[0];
c.state.astroResult = c.GOLDEN_TEST_CHARTS[0];
c.state.astroUnknownTime = false; c.state.astroView = 'chart';
capture('星盤・結果總覽');
c.state.astroUnknownTime = true; capture('星盤・結果（出生時間未知）');
c.state.astroUnknownTime = false;

c.state.astroView = 'natalTopic'; c.state.natalTopicCat = null;
capture('人生主題・尚未選主題');

const topicQuestions = c.NATAL_TOPIC_QUESTIONS.love.slice(0, 2).map(q => q.id);
c.state.natalTopicCat = 'love';
c.state.natalTopicQSel = { love: topicQuestions };
c.state.natalTopicResult = c.analyzeNatalTopic(c.GOLDEN_TEST_CHARTS[0], 'love', topicQuestions, false);

c.state.natalTopicProfessional = false; capture('人生主題・一般模式');
const generalHtml = screens[screens.length - 1].html;
const generalCopy = grabCopyText();
c.state.natalTopicProfessional = true; capture('人生主題・專業模式');
const professionalHtml = screens[screens.length - 1].html;
const professionalCopy = grabCopyText();
c.state.natalTopicProfessional = false;

c.state.astroNotice = { kind: 'error', text: '測試用錯誤訊息' };
capture('星盤・錯誤狀態');
c.state.astroNotice = null;

/* 換成另一張盤但不重新分析：畫面必須擋掉殘留結果 */
c.state.astroResult = c.GOLDEN_TEST_CHARTS[1];
capture('人生主題・換盤後');
const afterSwitchHtml = screens[screens.length - 1].html;

function grabCopyText() {
  /* natalTopicCopyForAI() 會呼叫剪貼簿 API；這裡只借用它組字串的那段邏輯，
     用一個假的 clipboard 攔截輸出。 */
  let captured = '';
  c.navigator.clipboard = { writeText(t) { captured = t; return Promise.resolve(); } };
  try { c.natalTopicCopyForAI(); } catch (e) { captured = 'ERROR ' + e.message; }
  delete c.navigator.clipboard;
  return captured;
}

/* ---------- 逐畫面結構檢查 ---------- */
screens.forEach(({ name, html }) => {
  if (typeof html !== 'string' || !html.length) { fail(name, '沒有輸出任何內容'); return; }
  tagBalanceErrors(html).forEach(e => fail(name, 'HTML 標籤不平衡 — ' + e));
  unnamedButtons(html).forEach(b => fail(name, '按鈕缺少可及名稱（無文字也無 aria-label）：' + b));
  const d = (html.match(/<details\b/g) || []).length - (html.match(/<summary\b/g) || []).length;
  if (d !== 0) fail(name, '<details> 與 <summary> 數量不符（差 ' + d + '）');
  const wide = overWideFixedWidths(html);
  if (wide.length) fail(name, '寫死超過 320px 的寬度，小螢幕會水平溢出：' + wide.join('、'));
  const hs = headingLevels(html);
  for (let i = 1; i < hs.length; i++) {
    if (hs[i] - hs[i - 1] > 1) { fail(name, '標題階層跳級 h' + hs[i - 1] + ' → h' + hs[i]); break; }
  }
  if (hs.length && hs[0] > 2) fail(name, '畫面第一個標題是 h' + hs[0] + '，應該從 h2 開始');
});

/* ---------- 一般／專業模式一致性 ---------- */
const answerTexts = c.state.natalTopicResult.answers.map(a => a.headline);
answerTexts.forEach(t => {
  const plain = t.replace(/[<>&]/g, '');
  if (generalHtml.indexOf(plain) === -1) fail('人生主題・一般模式', '缺少結論文字：' + t.slice(0, 20));
  if (professionalHtml.indexOf(plain) === -1) fail('人生主題・專業模式', '缺少結論文字：' + t.slice(0, 20));
});
if (professionalHtml.length <= generalHtml.length) {
  fail('一般／專業模式', '專業模式應該是在一般內容之上「疊加」證據，而不是換一組內容');
}
if (professionalHtml.indexOf('主要占星指標') === -1) fail('專業模式', '沒有列出可追查的占星指標');
if (generalHtml.indexOf('主要占星指標') !== -1) fail('一般模式', '一般模式不應直接展示專業指標區塊');
if (generalHtml.indexOf('權重 ') !== -1) fail('一般模式', '權重數字不應出現在一般模式');

/* ---------- AI 複製不得因畫面簡化而缺漏 ---------- */
if (generalCopy !== professionalCopy) fail('AI 複製', '一般／專業模式複製出的內容不一致，代表複製受畫面顯示狀態影響');
['【主題總覽】', '占星依據：', '解讀限制：'].forEach(k => {
  if (generalCopy.indexOf(k) === -1) fail('AI 複製', '缺少區段「' + k + '」');
});
if (generalCopy.indexOf('權重 ') === -1) fail('AI 複製', '複製內容缺少權重等專業依據');

/* ---------- 換盤後不得殘留 ---------- */
if (afterSwitchHtml.indexOf('主題總覽') !== -1) fail('換盤', '換成另一張命盤後仍顯示上一張盤的分析結果');
if (afterSwitchHtml.indexOf('星盤資料已經改變') === -1) fail('換盤', '擋下殘留結果時沒有告訴使用者發生什麼事');

/* ---------- 命盤總覽的可讀性（2026-08 使用者回報） ---------- */
/* 回報一：「最明顯的三組性格互動」三行讀起來像同一句話講三次，而且看不出
   自己實際上會做什麼。原因是它用的是通用相位文案（每種相位只有 2 句 lead，
   而且只講「合不合得來」）。這裡檢查兩件事：句子必須互不重複，而且不能
   只是形容詞。 */
const overviewCharts = c.GOLDEN_TEST_CHARTS.map((chart, i) => ({ chart, label: c.GOLDEN_CHART_SPECS[i].label }));
const stripTags = (h) => h.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]*>/g, '');
/* 這幾句是舊版通用文案的招牌句型：只宣告兩股能量處得來，沒有任何行為描述。 */
const EMPTY_AFFIRMATIONS = ['天生合拍', '幾乎沒有阻力', '幾乎不用刻意練習', '搭配得很自然'];

c.state.astroUnknownTime = false;
overviewCharts.forEach(({ chart, label }) => {
  const quick = c.renderAstroQuickSummary(chart);
  const block = (quick.match(/最明顯的三組性格互動[\s\S]*?<details/) || [''])[0];
  if (!block) return;
  const body = stripTags(block);

  EMPTY_AFFIRMATIONS.forEach(phrase => {
    if (body.includes(phrase)) {
      fail('命盤總覽・' + label, '三組性格互動又出現只講「合不合得來」的空泛句「' + phrase + '」，缺少實際行為描述');
    }
  });

  /* 每一行的句子主體（「你會…」那句）必須互不相同。相同代表又退化成換句話說。 */
  const sentences = body.split('\n').map(x => x.trim()).filter(x => x.startsWith('你會'));
  if (sentences.length) {
    const dup = sentences.filter((x, i) => sentences.indexOf(x) !== i);
    if (dup.length) fail('命盤總覽・' + label, '三組性格互動出現一字不差的重複句：' + dup[0].slice(0, 30));
    /* 上限抓 50：目前最長 45 字。這條守的是「別再把落點（哪一宮、哪個星座）
       塞回摘要」——那樣做會讓每句回到 60 字以上、連續兩組引號。 */
    const tooLong = sentences.filter(x => x.length > 50);
    if (tooLong.length) fail('命盤總覽・' + label, '摘要句過長（' + tooLong[0].length + ' 字），摘要區應該保持精簡：' + tooLong[0].slice(0, 30));
  }
});

/* 回報二：「別人怎麼認識你」讀起來答非所問——描述的是內在決策歷程，
   但標題承諾的是別人怎麼看你，而且沒有講出這段讀的是星盤上的哪個點。 */
const angleBlock = c.renderAngleAndHouseBeginner(c.GOLDEN_TEST_CHARTS[0]);
if (!/第一印象（上升/.test(angleBlock)) {
  fail('別人眼中的你', '「第一印象」沒有點名上升星座，使用者無從判斷這段的依據');
}
if (!/工作與公開場合（天頂/.test(angleBlock)) {
  fail('別人眼中的你', '「工作與公開場合」沒有點名天頂星座');
}
if (angleBlock.indexOf('不一定等於你私下相處的樣子') === -1) {
  fail('別人眼中的你', '沒有說明上升描述的是對外反應方式而非私下的自己——這是這段被讀成「答非所問」的主因');
}
if (!/十二宮各自對應一塊生活領域/.test(angleBlock)) {
  fail('別人眼中的你', '宮位分布沒有向新手解釋「宮」是什麼，也沒說明顆數代表關注度而非好壞');
}
/* 出生時間未知時整段不得出現，否則等於給出假精確的上升與宮位結論。 */
c.state.astroUnknownTime = true;
if (c.renderAngleAndHouseBeginner(c.GOLDEN_TEST_CHARTS[0]) !== '') {
  fail('別人眼中的你', '出生時間未知時仍輸出上升／天頂／宮位內容');
}
c.state.astroUnknownTime = false;

/* ---------- 輸出 ---------- */
console.log('# 畫面渲染煙霧測試');
console.log('');
console.log('- 渲染畫面／狀態：' + screens.length);
screens.forEach(s => console.log('  · ' + s.name + '（' + s.html.length + ' 字元，標題 ' + (headingLevels(s.html).join('/') || '無') + '）'));
console.log('- 失敗：' + failures.length);
if (failures.length) {
  console.log('');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('');
console.log('全部通過。');
