#!/usr/bin/env node
/* 占卜精靈 Step 3 的資訊架構回歸測試。
 *
 * 原本選完牌陣後連續攤開三個大型區塊：主問題、面向多選（最多 3 個）、自由輸入。
 * 三者都有價值，但只有主問題是必要的——它驅動 cardSubtopicReading() 與
 * readingSchemaFor()；另外兩個只進 AI 提示詞。使用者因此覺得被反覆追問。
 *
 * 這一支守住：只有一個必要決策、其餘漸進式揭露、題庫一題都沒少、
 * 而且 primaryQuestion／selectedFocusAreas／customContext 三份資料仍分開保存。
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
           setAttribute(){}, appendChild(){}, querySelector(){return null;}, querySelectorAll(){return [];} };
}
const elements = {};
const c = { console, setTimeout, clearTimeout, URL, Intl, Date, Math, JSON, Promise };
c.window = c; c.navigator = {}; c.scrollTo = () => {};
c.localStorage = { getItem(){return null;}, setItem(){}, removeItem(){} };
c.location = { hostname: 'example.com', search: '' };
c.document = { head:element(), body:element(), documentElement:element(),
  getElementById(id){ return elements[id] || (elements[id] = element()); },
  querySelector(){return null;}, querySelectorAll(){return [];}, addEventListener(){}, createElement:element };
vm.createContext(c);
['js/data/card-images.js','js/data/reading-data.js','js/data/reading-interpretation.js','js/app.js']
  .forEach(f => vm.runInContext(read(f), c, { filename: f }));
const G = vm.runInContext('({topicQuestionConfig, SUBTOPICS, CATEGORIES})', c);

function step3(cat, opts) {
  c.state.tab = 'reading'; c.state.deck = 'tarot';
  c.state.category = cat; c.state.spread = 'three-time'; c.state.wizardStep = 3;
  c.state.subtopic = (opts && opts.subtopic) || '';
  c.state.wizFocusOpen = !!(opts && opts.focusOpen);
  c.state.wizContextOpen = !!(opts && opts.contextOpen);
  c.state.wizFocusSel = (opts && opts.sel) || {};
  c.state.question = (opts && opts.question) || '';
  c.state.wizFocusExpanded = {};
  return c.renderReading();
}
const plain = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

/* ---------- 1. 只有一個必要決策 ---------- */
const cats = G.CATEGORIES.map(x => x.key).filter(k => G.topicQuestionConfig[k]);
cats.forEach(cat => {
  const html = step3(cat);
  const t = plain(html);
  check(cat + '：預設不展開「想特別看哪些部分」', t.indexOf('想特別看哪些部分') === -1);
  check(cat + '：預設不展開自由輸入', t.indexOf('寫下你的情況') === -1);
  check(cat + '：主要按鈕是開始解讀', t.indexOf('開始解讀') !== -1);
  check(cat + '：明講兩項都是選填', t.indexOf('都是選填') !== -1);
  check(cat + '：提供聚焦入口', t.indexOf('想讓解讀更聚焦') !== -1);
  check(cat + '：提供補充情況入口', t.indexOf('有具體情況想補充') !== -1);
  /* 不得把網站內部分類當成視覺層級。注意有些分組標題（例如「家庭關係」）同時也是
     SUBTOPICS 裡使用者真正要選的題目名稱，那是合理的；這裡只檢查面向選擇區本身
     不再印分組標題——展開後應該是攤平的單一清單。 */
  const focusOpenHtml = step3(cat, { focusOpen: true });
  const focusSection = focusOpenHtml.slice(focusOpenHtml.indexOf('想特別看哪些部分'));
  (G.topicQuestionConfig[cat].focusGroups || []).forEach(g => {
    check(cat + '：面向選擇區不再印內部分組標題「' + g.title + '」',
      focusSection.indexOf('>' + g.title + '<') === -1);
  });
});

/* ---------- 2. 漸進式揭露真的有內容 ---------- */
const openedFocus = plain(step3('love', { focusOpen: true }));
check('展開後出現面向選擇', openedFocus.indexOf('想特別看哪些部分') !== -1);
check('展開後標示選填與上限', openedFocus.indexOf('選填') !== -1 && openedFocus.indexOf('/ 3') !== -1);
const openedCtx = plain(step3('love', { contextOpen: true }));
check('展開後出現自由輸入', openedCtx.indexOf('寫下你的情況') !== -1);
/* placeholder 現在由 category + primary 決定（見 wizPlaceholder），不再是寫死一句。
   這裡改為驗證它確實隨主問題改變，而且不是空的。 */
check('自由輸入的 placeholder 隨主問題改變', (function () {
  const a = step3('love', { contextOpen: true, subtopic: 'partner-type' });
  const b = step3('love', { contextOpen: true, subtopic: 'reunion' });
  const grab = (h) => (h.match(/id="question-input"[^>]*placeholder="([^"]*)"/) || [])[1] || '';
  const pa = grab(a), pb = grab(b);
  return !!pa && !!pb && pa !== pb;
})());
check('範例不看起來像另一組必選題（最多 3 個）',
  (step3('love', { contextOpen: true }).match(/onclick="wizChip\(/g) || []).length <= 3);

/* ---------- 3. 初始只顯示少量選項，其餘在「更多面向」 ---------- */
cats.forEach(cat => {
  const html = step3(cat, { focusOpen: true });
  const shown = (html.match(/onclick="wizToggleFocus\(/g) || []).length;
  check(cat + '：初始顯示的面向不超過 5 個', shown <= 5, '顯示 ' + shown + ' 個');
});

/* ---------- 4. 題庫一題都沒少 ---------- */
cats.forEach(cat => {
  const cfg = G.topicQuestionConfig[cat];
  const all = [];
  (cfg.focusGroups || []).forEach(g => g.options.forEach(o => { if (all.indexOf(o) === -1) all.push(o); }));
  c.state.category = cat; c.state.spread = 'three-time'; c.state.subtopic = '';
  c.state.wizFocusSel = {};
  const nowGroups = c.focusGroupsForNow(cat, cfg);
  const nowOpts = [];
  nowGroups.forEach(g => g.options.forEach(o => { if (nowOpts.indexOf(o) === -1) nowOpts.push(o); }));
  const followUp = c.focusFollowUpOptions(cat);
  const covered = new Set(nowOpts.concat(followUp));
  const missing = all.filter(o => !covered.has(o));
  check(cat + '：所有面向題目仍存在於系統內（解讀前或延伸探索）',
    missing.length === 0, missing.slice(0, 3).join('、'));
});

/* ---------- 5. 自我成長類移到結果後 ---------- */
const loveSelf = (G.topicQuestionConfig.love.focusGroups || [])
  .filter(g => g.key === 'self')[0];
check('love 的自我成長分組存在', !!loveSelf);
if (loveSelf) {
  c.state.category = 'love'; c.state.spread = 'three-time'; c.state.subtopic = '';
  const nowGroups = c.focusGroupsForNow('love', G.topicQuestionConfig.love);
  check('自我成長分組不出現在解讀前',
    !nowGroups.some(g => g.key === 'self'));
  const follow = c.focusFollowUpOptions('love');
  loveSelf.options.forEach(o => {
    check('自我成長題目「' + o.slice(0, 12) + '」移到延伸探索', follow.indexOf(o) !== -1);
  });
}

/* ---------- 6. 結果頁的延伸探索 ---------- */
c.state.category = 'love'; c.state.wizFocusSel = {};
const followHtml = c.renderReadingFollowUp();
check('結果頁提供延伸探索', followHtml.indexOf('還想繼續了解') !== -1);
check('延伸探索最多 5 題',
  (followHtml.match(/onclick="readingFollowUpStart\(/g) || []).length <= 5);
check('明講需要重新抽牌，不讓人以為沿用原本的牌',
  followHtml.indexOf('需要重新抽一次牌') !== -1);
check('延伸探索的觸控目標達 44px', /min-height:44px/.test(followHtml));

/* 點下去會帶進問題並回到設定，且清掉上一次的牌。 */
c.state.drawn = [{}, {}, {}]; c.state.phase = 'result';
c.readingFollowUpStart(0);
check('延伸探索會清掉上一次抽的牌', c.state.drawn.length === 0);
check('延伸探索會把問題帶進自由輸入', !!c.state.question);
check('延伸探索會回到問題設定步驟', c.state.wizardStep === 3 && c.state.phase === 'setup');

/* ---------- 7. 資料結構不得被 UI 合併 ---------- */
const app = read('js/app.js');
check('主問題仍存在獨立欄位 state.subtopic', /state\.subtopic/.test(app));
check('面向仍存在獨立欄位 state.wizFocusSel', /state\.wizFocusSel/.test(app));
check('自由輸入仍存在獨立欄位 state.question', /state\.question/.test(app));
/* AI 提示詞必須拿到三份資料。 */
const copyFn = app.slice(app.indexOf('function copyForAI()'), app.indexOf('function copyForAI()') + 6000);
check('AI 提示詞讀得到主問題', /readingSchemaFor\(state\.category, state\.subtopic\)/.test(copyFn));
check('AI 提示詞讀得到已選面向', /state\.wizFocusSel\[state\.category\]/.test(copyFn));
check('AI 提示詞讀得到自由輸入', /state\.question/.test(copyFn));
/* 欄位在 payload 化時改名：想深入了解的面向 → 優先補充的面向、
   使用者的具體問題 → 使用者補充的現實背景。三者仍各自成段。 */
check('三者沒有被合併成同一個字串',
  /優先補充的面向/.test(copyFn) && /使用者補充的現實背景/.test(copyFn)
  && /主要問題（這次最需要回答的）/.test(copyFn));

/* ---------- 8. 選擇狀態 ---------- */
/* 面向清單已改由 taxonomy 決定，標籤跟著換；用該主問題實際會出現的第一個面向來測。 */
const selLabel = '對方可能的個性';
const selHtml = step3('love', { subtopic: 'partner-type', focusOpen: true, sel: { love: [selLabel] } });
check('已選項目有勾號而不只有顏色', selHtml.indexOf('✓ ' + selLabel) !== -1);
check('已選項目 aria-pressed 為 true', /aria-pressed="true"/.test(selHtml));
check('顯示已選數量', plain(selHtml).indexOf('已選 1 / 3') !== -1);
/* 選滿 3 個之後，其他項目仍然可讀、不整片變灰。 */
const fullSel = step3('love', { subtopic: 'partner-type', focusOpen: true,
  sel: { love: ['對方可能的個性', '對方給人的外在感覺', '對方可能的生活或工作狀態'] } });
check('選滿 3 個後其他項目仍可點擊', (fullSel.match(/onclick="wizToggleFocus\(/g) || []).length >= 4);
check('選滿 3 個後未選項目沒有被 disabled', !/disabled[^>]*wizToggleFocus/.test(fullSel));

console.log('# 占卜精靈流程回歸測試');
console.log('');
console.log('- 檢查項目：' + checks.length);
console.log('- 失敗：' + failures.length);
if (failures.length) {
  console.log('');
  failures.slice(0, 12).forEach(f => console.log('  ✗ ' + f));
  if (failures.length > 12) console.log('  …共 ' + failures.length + ' 項');
  process.exit(1);
}
console.log('');
console.log('全部通過。');
