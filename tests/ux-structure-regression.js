#!/usr/bin/env node
/* UX／狀態／無障礙結構回歸測試。
 *
 * 這一支不檢查文案寫得好不好（那是 reading-copy-quality / astro-copy-quality 的
 * 工作），而是把「2026-08 全站 UX 更新」修掉的那幾類結構性缺陷變成可執行的斷言，
 * 避免之後改版時被無聲地改回去。每一條斷言都對應一個實際發生過的問題。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const failures = [];
const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok: !!ok });
  if (!ok) failures.push(name + (detail ? '：' + detail : ''));
}

const html = read('index.html');
const app = read('js/app.js');
const astro = read('js/data/astro-advanced.js');
const charts = read('js/data/astro-charts.js');
const runtime = app + astro + charts;

/* ---------- 1. 語意結構與地標 ---------- */
check('index.html 提供 <main> 地標作為畫面容器', /<main id="view"/.test(html));
check('index.html 底部導覽使用 <nav> 並具備名稱', /<nav id="nav"[^>]*aria-label=/.test(html));
check('index.html 提供跳至主要內容連結', /class="skip-link"/.test(html) && /href="#view"/.test(html));
check('每個主要畫面都有 h2 主標題（首頁／占卜／牌典／歷史／星盤）',
  (app.match(/<h2 /g) || []).length >= 4 && /<h2[^>]*>個人星盤<\/h2>/.test(astro),
  '目前 app.js h2 數量＝' + (app.match(/<h2 /g) || []).length);
check('人生主題分析區塊使用 h3／h4 建立階層',
  /<h3[^>]*>人生主題分析<\/h3>/.test(astro) && /<h4/.test(astro));

/* ---------- 2. 錯誤／狀態回饋不得依賴 alert() ---------- */
/* 註解裡提到 alert() 是說明性文字，不算違規；先把註解去掉再統計。 */
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const alertCalls = (stripComments(astro).match(/(^|[^.\w])alert\(/gm) || []).length;
check('星盤流程不再使用 alert() 作為錯誤處理', alertCalls === 0, '仍有 ' + alertCalls + ' 處');
check('提供頁內狀態訊息元件（含 role=alert）',
  /function renderAstroNotice/.test(astro) && /function astroSetNotice/.test(astro) && /'alert'/.test(astro));
check('狀態訊息同時具備圖示與文字前綴，不只靠顏色',
  /md-status__icon/.test(astro) && /'錯誤：'/.test(astro) && /'完成：'/.test(astro));
check('loading／error／empty 狀態樣式集中在設計 token 層',
  /\.md-status--error/.test(html) && /\.md-status--success/.test(html) && /\.md-status--info/.test(html));

/* ---------- 3. 命盤身分與狀態一致性（P0） ---------- */
check('結果頁顯示目前命盤身分（日期／時間／地點／時區／宮位制／黃道）',
  /function renderChartIdentityBar/.test(astro) &&
  /時區 <b>/.test(astro) && /宮位制 <b>/.test(astro) && /黃道 <b>/.test(astro));
check('身分列在所有星盤子分頁之前輸出', /h \+= renderChartIdentityBar\(\);/.test(astro));
check('技術診斷資訊只在 development mode 顯示',
  /natalTopicDevelopmentMode\(\)\) \{\s*\n\s*h \+= '<div style="margin-top:6px;font:400 9px/.test(astro));
check('主題結果快取鍵包含 chartFingerprint／promptVersion／knowledgeVersion',
  /chartFingerprint === natalChartFingerprint\(chart/.test(astro) &&
  /promptVersion === NATAL_TOPIC_PROMPT_VERSION/.test(astro) &&
  /knowledgeVersion === NATAL_TOPIC_KNOWLEDGE_VERSION/.test(astro));
check('命盤改變時不顯示殘留結果，並明確告知使用者', /星盤資料已經改變/.test(astro));
check('尚未產生分析時有明確空狀態', /還沒有分析結果/.test(astro));
check('生成星盤具備重複點擊防護', /if \(state\.astroGenerating\) return;/.test(astro));
check('出生資料變動的四個入口都會清掉舊的主題分析結果',
  (astro.match(/resetNatalTopicAnalysisForChartChange\(\)/g) || []).length >= 5);

/* ---------- 4. 一般／專業模式 ---------- */
check('切換閱讀深度不重新分析，只重畫',
  /function natalTopicSetExplanationMode/.test(astro) &&
  !/natalTopicSetExplanationMode[\s\S]{0,400}analyzeNatalTopic/.test(astro));
check('切換閱讀深度會還原捲動位置，不跳回頁首',
  /natalTopicSetExplanationMode[\s\S]{0,500}window\.scrollTo\(0, y\)/.test(astro));
check('展開中的「為什麼這樣說？」由 state 保存，重畫後不會塌回去',
  /state\.natalTopicExpanded\[a\.questionId\]/.test(astro) &&
  /ontoggle="natalTopicSetExpanded/.test(astro) &&
  /function natalTopicSetExpanded/.test(astro));
check('模式切換控制具備群組名稱與目前狀態文字',
  /role="group" aria-label="閱讀深度"/.test(astro) && /目前：'/.test(astro));

/* ---------- 5. 可信度：三種內容必須在 UI 上可區分 ---------- */
check('提供排盤資料／綜合判斷／解讀文字三種內容徽章',
  /md-kind--fact/.test(html) && /md-kind--rule/.test(html) && /md-kind--reading/.test(html));
check('主題結果頁一次性說明解讀性質，而非每張卡片重複免責聲明',
  /描述的是本命傾向，不是計算出來的事件或近期預測/.test(astro));

/* ---------- 6. 出生資料輸入 ---------- */
check('送出前顯示資料確認摘要', /請確認以下資料/.test(astro));
check('確認摘要顯示時區', /時區 ' \+ esc\(cfCity \? cfCity\.tz/.test(astro));
check('未知出生時間會說明哪些結果受影響，而非給出假精確結論',
  /不會給出看似精確卻沒有依據的答案/.test(astro));
check('計算中的按鈕標示 aria-busy', /aria-busy="' \+ generating/.test(astro));
check('計算失敗時明確保證已輸入資料仍在', /你剛剛輸入的出生資料都還在/.test(astro));

/* ---------- 7. 設計 token ---------- */
const tokenBlock = (html.match(/:root\{[\s\S]*?\}/) || [''])[0];
const requiredTokens = ['--bg','--text','--text-muted','--brand','--brand-bright','--success','--warning','--danger',
  '--border','--fs-body','--lh-body','--sp-4','--radius-md','--shadow-card','--control-h','--motion-base','--measure'];
const missing = requiredTokens.filter(t => tokenBlock.indexOf(t + ':') === -1);
check('設計 token 覆蓋色彩／字級／間距／圓角／陰影／控制項高度／動畫時間', missing.length === 0, '缺少 ' + missing.join('、'));

/* ---------- 8. 對比與「不只用顏色」 ---------- */
const faintText = runtime.match(/color:rgba\(240,233,216,\.[0-4]\d?\)/g) || [];
check('沒有低於 AA 對比門檻的正文灰字（alpha < .5）', faintText.length === 0,
  '仍有 ' + faintText.length + ' 處');
check('內文連結不只靠顏色辨識（帶底線）', /#view a\{text-decoration:underline/.test(html));
check('底部導覽以 aria-current 標示目前頁面', /aria-current="page"/.test(app));

/* ---------- 9. 手機：觸控目標與水平溢出 ---------- */
check('表格／圖片／輸入框有防溢出約束',
  /#view table\{max-width:100%/.test(html) && /#view img,#view svg,#view video\{max-width:100%\}/.test(html));
check('iOS 聚焦不會因字級過小而放大整頁造成水平捲動',
  /-webkit-touch-callout/.test(html) && /font-size:16px/.test(html));
check('固定底部導覽有 safe-area 內距，且內容區保留對應底部空間',
  /padding-bottom:env\(safe-area-inset-bottom\)/.test(html) &&
  /padding-bottom:calc\(90px \+ env\(safe-area-inset-bottom\)\)/.test(html));
check('生成星盤主要按鈕達到 44px 觸控目標', /min-height:var\(--control-h\)/.test(astro));

/* ---------- 9.5 首頁背景影片不得寫死在 HTML ---------- */
/* 那支影片 13.5MB，原本是靜態的 <video autoplay>。非首頁時雖然有 display:none，
   但 display:none 不會阻止下載——等於任何人一進站、不論停在哪個分頁，都在背景
   吃掉 13.5MB。它是純裝飾（灰階、透明度 .44、pointer-events:none）。 */
check('首頁背景影片沒有寫死在靜態 HTML 裡', !/<video[^>]*home-ambient-video/.test(html));
check('保留給影片的插槽存在', /id="home-ambient-slot"/.test(html));
check('影片改為條件式注入', /function maybeInjectHomeAmbient/.test(html) && /function shouldLoadHomeAmbient/.test(html));
check('省流量模式、2G／低頻寬、減少動態效果時完全不載入影片',
  /conn\.saveData/.test(html) && /effectiveType/.test(html) && /downlink/.test(html)
  && html.indexOf("matchMedia('(prefers-reduced-motion: reduce)').matches) return false") !== -1);
check('影片優先權低於實際內容（排在牌義之後的 idle callback）',
  /kickAmbient/.test(html) && /timeout: 4000/.test(html));
check('回到首頁時才注入，且只注入一次',
  /maybeInjectHomeAmbient\(\);/.test(app) && /homeAmbientInjected/.test(html));

/* ---------- 9.6 所有耗時運算都要有重複點擊防護 ---------- */
['astroGenerate', 'synGenerate'].forEach(function (fn) {
  var body = (astro.split('function ' + fn)[1] || '').slice(0, 700);
  check(fn + '() 有重入防護', /if \(state\.(astro|syn)Generating\) return;/.test(body));
});
check('natalTopicGenerate() 有重入防護', /if \(state\.natalTopicGenerating\) return;/.test(astro));
check('城市搜尋輸入有長度上限', /aria-label="搜尋出生城市" type="text" maxlength="40"/.test(astro));

/* ---------- 9.7 出生地搜尋不得被異體字卡死 ---------- */
/* 「臺北」查無結果——清單存的是「台北市」，但「臺」才是身分證上的官方用字。
   搜尋不到出生地等於整個星盤流程直接中斷，而使用者不會知道問題只是一個異體字。 */
check('城市搜尋有字面正規化', /function normalizeCityQuery/.test(astro));
check('查無城市時提供可執行的替代做法', /同一時區內最近的大城市/.test(astro));

/* ---------- 9.8 複製給 AI 之後要有下一步 ---------- */
check('提供貼上目的地指引', /function renderAiPasteHint/.test(app));
/* 先前這條是用按鈕的字面文字比對，於是漏掉了占卜結果那一顆——它的標籤是
   `state.copied ? '已複製！' : '複製給 AI 解讀'` 動態組出來的，字面對不上。
   改成比對 onclick 的函式名，任何 xxxCopyForAI() 都會被納入檢查。 */
check('每一顆「複製給 AI」按鈕後面都接上指引', (function () {
  var missing = [];
  [['app.js', app], ['astro-advanced.js', astro]].forEach(function (pair) {
    var lines = pair[1].split('\n');
    lines.forEach(function (line, i) {
      if (!/onclick="[a-zA-Z]*[Cc]opyForAI\(\)"/.test(line)) return;
      if (!/renderAiPasteHint\(\)/.test(lines.slice(i + 1, i + 6).join('\n'))) {
        missing.push(pair[0] + ':' + (i + 1));
      }
    });
  });
  if (missing.length) console.log('   缺少指引的按鈕：' + missing.join('、'));
  return missing.length === 0;
})());
check('複製按鈕數量符合預期（10 顆，塔羅與星盤都有）', (function () {
  var n = (app.match(/onclick="[a-zA-Z]*[Cc]opyForAI\(\)"/g) || []).length
        + (astro.match(/onclick="[a-zA-Z]*[Cc]opyForAI\(\)"/g) || []).length;
  return n === 10;
})());
check('外部連結一律 noopener noreferrer', !/target="_blank"(?![^>]*rel="noopener noreferrer")/.test(app + astro));
check('明確聲明本站不會自行送出資料', /不會自行傳送任何資料/.test(app));

/* ---------- 9.9 首頁主入口是「抽一張牌」 ---------- */
/* 今日一牌是系統依日期指定的、被動的一張牌；使用者要的是「現在就抽一張」。
   後者原本埋在折疊的「其他功能」裡，前者佔著首頁最大的版面。已經對調。 */
check('首頁主入口包含「抽一張牌」', /onclick="quickDraw\(\)"/.test(app));
check('抽牌入口只出現一次，沒有重複的目的地',
  (app.match(/onclick="quickDraw\(\)"/g) || []).length === 1,
  '出現 ' + (app.match(/onclick="quickDraw\(\)"/g) || []).length + ' 次');
check('今日一牌區塊已從首頁移除', !/daily-card-block/.test(app));
check('今日一牌的相關程式碼一併清乾淨，沒有留下死碼',
  !/function toggleDailyFlip|function dailyFullMeaning|function homeDailyGuide|var dailyCard/.test(app));
check('新手導覽第一項指向實際存在的按鈕',
  /首頁「抽一張牌」/.test(app) && !/首頁「今天需要一點指引」/.test(app));
check('牌面比例常數保留供其他版面推導', /var CARD_ART_RATIO = 0\.6/.test(app));

/* ---------- 10. 動態偏好 ---------- */
check('尊重 prefers-reduced-motion，並停用首頁背景影片',
  /prefers-reduced-motion/.test(html) && /\.home-ambient-video\{display:none!important\}/.test(html));

/* ---------- 11. 執行期健全性：身分列與通知在無 DOM 環境下可求值 ---------- */
function element() {
  return { innerHTML:'', style:{}, classList:{add(){},remove(){}}, addEventListener(){}, setAttribute(){},
           appendChild(){}, querySelector(){return null;}, querySelectorAll(){return [];} };
}
function loadRuntimeContext() {
  const elements = {};
  const c = { console, setTimeout, clearTimeout, URL, Intl, Date, Math, JSON, Promise };
  c.window = c; c.navigator = {}; c.localStorage = { getItem(){return null;}, setItem(){}, removeItem(){} };
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
const c = loadRuntimeContext();

check('沒有命盤時身分列輸出空字串，不會誤畫出空殼', c.renderChartIdentityBar() === '');

/* 異體字、全形空白、前後空白都必須能找到同一個城市 */
['臺北', '台北', ' 台北 ', '臺北巿', 'TAIPEI'].forEach(function (q) {
  check('城市搜尋「' + q + '」找得到台北市',
    c.filterCityList(q).some(function (city) { return city.zh === '台北市'; }));
});
check('沒有訊息時 renderAstroNotice() 輸出空字串', c.renderAstroNotice() === '');

c.astroSetNotice('error', '測試訊息');
const noticeHtml = c.renderAstroNotice();
check('錯誤訊息使用 role="alert" 讓輔助技術可讀取', /role="alert"/.test(noticeHtml));
check('錯誤訊息帶文字前綴而非只有顏色', noticeHtml.indexOf('錯誤：') !== -1);
check('狀態訊息的關閉按鈕有 accessible name', /aria-label="關閉這則訊息"/.test(noticeHtml));
c.astroSetNotice(null, '');

/* 用 Golden Chart 當作 activeChart，確認身分列真的反映 state 而不是輸入框現值 */
c.state.astroResult = c.GOLDEN_TEST_CHARTS[0];
c.state.astroY = '1990'; c.state.astroM = '5'; c.state.astroD = '20';
c.state.astroH = '14'; c.state.astroMin = '30';
c.state.astroUnknownTime = false;
c.state.astroCityUsed = { zh: '台北', tz: 'Asia/Taipei' };
c.state.astroHouseSystem = 'placidus';
const bar = c.renderChartIdentityBar();
check('身分列顯示完整出生資料', /1990 年 5 月 20 日/.test(bar) && /14:30/.test(bar) && /台北/.test(bar));
check('身分列顯示時區與宮位制', /Asia\/Taipei/.test(bar) && /普拉西德制/.test(bar));
check('正式站不顯示 chartFingerprint 等技術資訊', bar.indexOf('chartFingerprint') === -1);

const idA = c.astroActiveChartIdentity();
c.state.astroUnknownTime = true;
const barUnknown = c.renderChartIdentityBar();
check('未知出生時間時身分列明確標示，且不宣稱有上升／宮位',
  /出生時間未提供/.test(barUnknown) && /未提供（以當日 12:00 估算）/.test(barUnknown));
const idB = c.astroActiveChartIdentity();
check('unknownTime 改變會產生不同的 chartFingerprint（避免跨狀態共用快取）',
  idA.fingerprint !== idB.fingerprint);

c.state.astroUnknownTime = false;
c.state.astroResult = c.GOLDEN_TEST_CHARTS[1];
const idC = c.astroActiveChartIdentity();
check('不同命盤產生不同的 chartFingerprint', idA.fingerprint !== idC.fingerprint);

/* ---------- 輸出 ---------- */
const passed = checks.filter(x => x.ok).length;
/* ---------- Service Worker 快取分層 ----------
   牌圖曾經跟程式共用同一個版本化快取，而 activate 會刪掉所有非當前版本的快取——
   等於每次改程式就把 228 張圖全部清掉。清空後整批重抓時，assets 分支又沒有
   catch，任何一張逾時就直接變成網路錯誤破圖。 */
{
  const sw = read('sw.js');
  check('圖片使用獨立、不隨版本改動的快取', /ASSET_CACHE\s*=\s*'mystic-assets-/.test(sw));
  check('改版時不刪圖片快取', sw.indexOf("k !== CACHE && k !== ASSET_CACHE") !== -1);
  check('assets 分支從 ASSET_CACHE 讀', /caches\.open\(ASSET_CACHE\)/.test(sw));
  check('assets 抓取失敗有 catch，不會直接變成網路錯誤',
    /pull\(\)[\s\S]{0,200}\.catch\(/.test(sw));
  const app = read('js/app.js');
  check('牌圖破圖時退回牌名方塊', app.indexOf('onerror="cardImgFallback(this)"') !== -1);
  check('cardImgFallback 有定義', /function cardImgFallback\(/.test(app));
  check('沒有呼叫點的 reassignImages 已移除', app.indexOf('function reassignImages') === -1);
}

/* ---------- 綜合觀察的核心結論要給得出答案 ---------- */
{
  const adv = read('js/data/astro-advanced.js');
  check('結論不再以「兩個來源合不合」開頭', adv.indexOf('COMBINED_AGREE_LEAD_POOL = {') === -1);
  check('結論末尾說明這兩層怎麼用',
    adv.indexOf('可以直接照「目前狀態」那一句安排眼前') !== -1
    && adv.indexOf('留給更長的規劃') !== -1);
}

/* ---------- 上架前審查：破壞性操作、資料保全、錯誤邊界 ---------- */
{
  const app = read('js/app.js');
  const adv = read('js/data/astro-advanced.js');
  const html = read('index.html');

  /* browser confirm() 一旦被抑制或丟例外，原本的 try/catch 會吞掉它，
     程式繼續往下走——確認框沒出現，資料照樣被刪。 */
  /* 註解裡會提到 confirm()（正是在解釋為什麼不用它），先把註解拿掉再數。 */
  const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const realConfirm = (src) => (stripComments(src).match(/[^a-zA-Z_.]confirm\(/g) || []).length;
  check('js 不再使用 browser confirm()', realConfirm(app) === 0 && realConfirm(adv) === 0,
    'app ' + realConfirm(app) + ' / adv ' + realConfirm(adv));
  ['astroChartDelete', 'astroReset', 'xiuDeleteSavedPartner'].forEach(fn => {
    const at = adv.indexOf('function ' + fn);
    check(fn + ' 第一次點擊只上膛不執行',
      at !== -1 && /isArmed\(/.test(adv.slice(at, at + 400)));
  });
  check('清除所有紀錄改為畫面內兩段式確認',
    app.indexOf('function askClearAllData') !== -1 && app.indexOf('renderClearDataBlock') !== -1);

  /* 沒有帳號、沒有伺服器，localStorage 是唯一的家。 */
  check('提供匯出備份', app.indexOf('function exportAllData') !== -1);
  check('提供從備份還原', app.indexOf('function importAllData') !== -1);
  check('匯入只接受白名單內的 key',
    /APP_STORAGE_KEYS\.indexOf\(k\) === -1/.test(app));
  check('匯入會檢查檔案格式', app.indexOf("parsed.format !== 'mystic-deck-backup'") !== -1);

  /* 畫面是 innerHTML 一次寫進去的，render 丟例外＝空白畫面且毫無訊息。 */
  check('有全域錯誤邊界', /addEventListener\('error'/.test(html) && /unhandledrejection/.test(html));
  check('錯誤邊界提供重新載入', html.indexOf('fatal-reload') !== -1);
  check('錯誤邊界不攔資源載入失敗', /if \(!e \|\| !e\.error\) return;/.test(html));
  check('錯誤邊界把 exception 與 stack 保留在 console',
    /console\.error\(error\)/.test(html) && /console\.error\(error\.stack\)/.test(html));

  check('有 Content-Security-Policy', html.indexOf('Content-Security-Policy') !== -1);
  check('CSP 禁止 object 與 frame 嵌入',
    /object-src 'none'/.test(html) && /frame-ancestors 'none'/.test(html));
}

console.log('# UX 結構回歸測試');
console.log('');
console.log('- 檢查項目：' + checks.length);
console.log('- 通過：' + passed);
console.log('- 失敗：' + failures.length);
if (failures.length) {
  console.log('');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('');
console.log('全部通過。');
