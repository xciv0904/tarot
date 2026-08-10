#!/usr/bin/env node
/* 結果頁延伸區塊的互動回歸測試。
 *
 * 原本這一區是一排大卡片、右側只有「›」，點一下就直接清空牌面跳回問題設定。
 * 從 affordance 看完全像「展開看內容」，實際卻是離開目前解讀並要求重新抽牌，
 * 誤觸成本高到只是想看看題目的人會突然掉進新的占卜流程。
 *
 * 這一支守住：需要重新抽牌的操作絕不能被單次點擊觸發，而且不需要重新抽牌的
 * 內容必須跟需要重新抽牌的問題分成兩區。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const failures = [];
const checks = [];
function check(name, ok, detail) { checks.push(name); if (!ok) failures.push(name + (detail ? '：' + detail : '')); }
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
['js/data/card-images.js','js/data/reading-data.js','js/data/reading-interpretation.js','js/data/reading-rich-data.js','js/app.js']
  .forEach(f => vm.runInContext(read(f), c, { filename: f }));
const G = vm.runInContext('({TAROT, CATEGORIES, SUBTOPICS, QUESTION_TAXONOMY, FOCUS_AREA_REGISTRY})', c);

function setupResult(cat, sub, sel) {
  c.state.tab = 'reading'; c.state.deck = 'tarot';
  c.state.category = cat; c.state.spread = 'three-time';
  c.state.subtopic = sub || ''; c.state.question = '';
  c.state.wizFocusSel = sel || {};
  c.state.phase = 'result';
  c.state.readingDetailOpen = ''; c.state.followUpSelected = '';
  c.state.followUpMoreOpen = false; c.state.previousReading = null;
  c.state.drawn = [0, 1, 2].map(i => ({ card: G.TAROT[i], pos: { zh: '位置' + i, en: 'P' + i }, reversed: i === 2 }));
  return c.renderReadingFollowUp();
}
const firstQuestionId = (html) => {
  const m = [...html.matchAll(/selectFollowUpQuestion\('([^']+)'\)/g)];
  return m.length ? m[0][1] : null;
};

/* ---------- 兩區分離 ---------- */
const html = setupResult('love', 'partner-type', { love: ['對方可能的個性'] });
check('A 區：想再看懂這次的牌', html.indexOf('想再看懂這次的牌') !== -1);
check('A 區明講不需要重新抽牌', html.indexOf('不需要重新抽牌') !== -1);
check('B 區：想換一個問題繼續', html.indexOf('想換一個問題繼續') !== -1);
check('B 區明講需要重新抽牌', html.indexOf('下面都是新的問題，需要重新抽牌') !== -1);
check('B 區說明目前解讀會保留', html.indexOf('不會被覆蓋') !== -1);
check('每題標示新問題與代價', html.indexOf('新問題・需要重新抽牌') !== -1);
check('右側不是單獨的箭頭', html.indexOf('>›<') === -1);

/* ---------- CASE 5／7：不得單次點擊就開新占卜 ---------- */
check('CASE5 未選取前畫面上沒有任何 confirm 入口',
  html.indexOf('confirmFollowUpQuestion') === -1);
check('CASE5 卡片本身的 handler 只是選取',
  /onclick="selectFollowUpQuestion\('[^']+'\)"/.test(html));
const app = read('js/app.js');
check('CASE7 開始新占卜只能由 confirmFollowUpQuestion 觸發',
  (app.match(/onclick="confirmFollowUpQuestion/g) || []).length === 1);
check('沒有使用 browser confirm()',
  !/function confirmFollowUpQuestion[\s\S]{0,600}confirm\(/.test(app));
check('沒有使用 modal', !/followUpModal|showModal/.test(app));

/* ---------- CASE 1／2：選取與取消 ---------- */
const qid = firstQuestionId(html);
check('B 區有可選的新問題', !!qid);
c.selectFollowUpQuestion(qid);
const opened = c.renderReadingFollowUp();
check('CASE1 選取後仍在結果頁', c.state.phase === 'result');
check('CASE1 選取後牌沒有被清掉', c.state.drawn.length === 3);
check('CASE1 顯示明確代價說明', opened.indexOf('需要重新抽牌。剛才那幾張牌仍然只回答上一個問題') !== -1);
check('CASE1 主要 CTA 直說代價', opened.indexOf('用這題開始新占卜') !== -1);
check('CASE1 沒有使用模糊 CTA',
  ['>繼續<', '>查看<', '>下一步<', '>了解更多<'].every(x => opened.indexOf(x) === -1));
check('CASE1 有取消', opened.indexOf('取消') !== -1);
check('CASE1 一次只展開一題', (opened.match(/用這題開始新占卜/g) || []).length === 1);
c.selectFollowUpQuestion(qid);
check('CASE2 取消後仍在結果頁且牌還在',
  c.state.phase === 'result' && c.state.drawn.length === 3);

/* ---------- CASE 3：確認才進入新流程，且保留原解讀 ---------- */
c.selectFollowUpQuestion(qid);
c.confirmFollowUpQuestion(qid);
check('CASE3 進入新的問題設定', c.state.phase === 'setup' && c.state.wizardStep === 3);
check('CASE3 新流程沒有沿用舊牌', c.state.drawn.length === 0);
check('CASE3 原解讀完整快照', !!c.state.previousReading && c.state.previousReading.drawn.length === 3);
check('CASE3 沒有自動選好面向', (c.state.wizFocusSel[c.state.category] || []).length === 0);
check('CASE3 問題已帶入', !!c.state.question);
check('CASE3 沒有沿用舊的主問題', c.state.subtopic === '');
const wizardHtml = c.renderReading();
check('CASE3 新流程可見返回上一個解讀', wizardHtml.indexOf('回到上一個解讀') !== -1);

/* ---------- CASE 4：返回 ---------- */
c.returnToPreviousReading();
check('CASE4 返回後回到結果頁', c.state.phase === 'result');
check('CASE4 返回後牌面完整', c.state.drawn.length === 3);
check('CASE4 返回後主問題恢復', c.state.subtopic === 'partner-type');
check('CASE4 返回後面向恢復', (c.state.wizFocusSel.love || []).length === 1);

/* ---------- CASE 6：A 類可直接查看 ---------- */
setupResult('love', 'partner-type', {});
const details = c.readingDetailQuestions();
check('CASE6 A 類都不需要重新抽牌', details.every(d => d.requiresNewDraw === false));
check('CASE6 A 類有內容可展開', details.length >= 2);
details.forEach(d => {
  check('CASE6 A 類「' + d.label + '」能從現有牌面產生答案',
    typeof d.answer === 'function' && String(d.answer()).length > 5);
});
c.toggleReadingDetail(details[0].id);
const detailOpen = c.renderReadingFollowUp();
check('CASE6 展開後直接看到答案', detailOpen.length > html.length - 2000);
check('CASE6 展開細節不會離開結果頁', c.state.phase === 'result' && c.state.drawn.length === 3);

/* ---------- CASE 8：語意去重 ---------- */
setupResult('love', 'partner-type', { love: ['我該怎麼守住自己的底線'] });
check('CASE8 已選過的面向不再被推薦',
  !c.readingNewQuestions().some(q => q.label === '我該怎麼守住自己的底線'));
setupResult('love', 'lv-self', {});
const answered = c.readingAnsweredSemanticKeys();
check('CASE8 已回答的語意 key 有被收集', Object.keys(answered).length > 0);

/* ---------- CASE 9：九大類一致 ---------- */
G.CATEGORIES.forEach(cat => {
  const subs = G.SUBTOPICS[cat.key] || [];
  const sub = subs.length ? subs[0].key : '';
  const h = setupResult(cat.key, sub, {});
  const news = c.readingNewQuestions();
  check(cat.key + '：A 區存在', h.indexOf('想再看懂這次的牌') !== -1);
  if (news.length) {
    check(cat.key + '：B 區標示新問題', h.indexOf('新問題・需要重新抽牌') !== -1);
    check(cat.key + '：B 區未展開時沒有 confirm 入口', h.indexOf('confirmFollowUpQuestion') === -1);
    check(cat.key + '：預設最多顯示 3 題',
      (h.match(/selectFollowUpQuestion\('/g) || []).length <= 3);
  }
});

/* ---------- 推薦不是固定模板 ---------- */
const sets = {};
G.CATEGORIES.forEach(cat => {
  const subs = G.SUBTOPICS[cat.key] || [];
  if (!subs.length) return;
  setupResult(cat.key, subs[0].key, {});
  sets[cat.key] = c.readingNewQuestions().slice(0, 3).map(q => q.label).join('|');
});
check('不同分類的推薦不相同', new Set(Object.values(sets)).size >= 6,
  '只有 ' + new Set(Object.values(sets)).size + ' 種');

console.log('# 結果頁延伸互動回歸測試');
console.log('');
console.log('- 檢查項目：' + checks.length);
console.log('- 失敗：' + failures.length);
if (failures.length) {
  console.log('');
  failures.slice(0, 12).forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('');
console.log('全部通過。');
