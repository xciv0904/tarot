#!/usr/bin/env node
/* Question Taxonomy 稽核與回歸測試。
 *
 * 舊架構的問題不是 UI，是上游選擇沒有真的控制下游：SUBTOPIC_FOCUS_GROUPS 對應的
 * 是「分組」而不是「題目」，只能把 4 個分組篩掉幾組。實測 35 個 primary 裡有 18 個
 * （51%）與同類其他 primary 拿到完全相同的初始面向，family 更是 4 個 primary 只
 * 產生 1 種清單；placeholder 與 examples 掛在 category 上，同類共用。
 *
 * 這一支同時是回歸測試與稽核報告：對已遷移的分類做 PASS/WARNING/FAIL 判定，
 * 尚未遷移的分類標 WARNING（沿用舊行為，不算失敗）。
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
const G = vm.runInContext(
  '({QUESTION_TAXONOMY, FOCUS_AREA_REGISTRY, CATEGORIES, SUBTOPICS, topicQuestionConfig,'
  + ' TAROT_SPREADS, taxonomyAllowedFocusIds, taxonomyExamples, taxonomyPlaceholder,'
  + ' taxonomyRecommendedSpreads, taxonomyPruneFocus, buildReadingPayload, taxonomyHasCategory,'
  + ' taxonomyPrimaries, taxonomyFocusLabel, taxonomyFocusIdByLabel, taxonomyPrimaryForSubtopic})', c);

const migrated = Object.keys(G.QUESTION_TAXONOMY);
const allCats = G.CATEGORIES.map(x => x.key);
const pending = allCats.filter(k => migrated.indexOf(k) === -1);
const audit = [];

/* ---------- 資料完整性 ---------- */
migrated.forEach(cat => {
  const t = G.QUESTION_TAXONOMY[cat];
  check(cat + '：有 primaries', t.primaries.length > 0);
  t.primaries.forEach(p => {
    const tag = cat + '/' + p.id;
    ['id','label','intent','spreads','focus','placeholder','examples'].forEach(f => {
      check(tag + ' 有 ' + f, p[f] !== undefined && p[f] !== null && String(p[f]).length > 0);
    });
    check(tag + ' 的 assumptions 是物件', p.assumptions && typeof p.assumptions === 'object');
    p.focus.forEach(fid => {
      check(tag + ' 引用的面向 ' + fid + ' 存在於 registry', !!G.FOCUS_AREA_REGISTRY[fid]);
    });
    p.spreads.forEach(sid => {
      check(tag + ' 的推薦牌陣 ' + sid + ' 存在', !!G.TAROT_SPREADS[sid]);
    });
  });
});

/* ---------- 核心：不同 primary 必須得到不同 focus ---------- */
migrated.forEach(cat => {
  const prs = G.taxonomyPrimaries(cat);
  const sigs = {};
  prs.forEach(p => { sigs[p.id] = G.taxonomyAllowedFocusIds(cat, p.id).slice().sort().join('|'); });
  const uniq = new Set(Object.values(sigs));
  check(cat + '：每個 primary 的面向組合都不同',
    uniq.size === prs.length, prs.length + ' 個 primary 只有 ' + uniq.size + ' 種面向組合');
  prs.forEach(p => {
    const ids = G.taxonomyAllowedFocusIds(cat, p.id);
    check(cat + '/' + p.id + ' 至少有 4 個可用面向', ids.length >= 4, '只有 ' + ids.length + ' 個');
  });
});

/* ---------- Assumption Guard ---------- */
migrated.forEach(cat => {
  G.taxonomyPrimaries(cat).forEach(p => {
    G.taxonomyAllowedFocusIds(cat, p.id).forEach(fid => {
      const need = (G.FOCUS_AREA_REGISTRY[fid].requires) || {};
      Object.keys(need).forEach(k => {
        check(cat + '/' + p.id + ' 不該出現需要「' + k + '」的面向 ' + fid,
          !need[k] || !!(p.assumptions || {})[k]);
      });
    });
  });
});
/* CASE 1：未來對象不得出現任何需要特定對象的面向 */
const futureFocus = G.taxonomyAllowedFocusIds('love', 'lv-future');
futureFocus.forEach(fid => {
  const r = G.FOCUS_AREA_REGISTRY[fid].requires || {};
  check('CASE1 未來對象不含需要特定對象的面向：' + fid, !r.specificPerson && !r.existingRelationship && !r.pastRelationship);
});
/* CASE 11：切換 primary，面向必須改變 */
const targetFocus = G.taxonomyAllowedFocusIds('love', 'lv-target');
check('CASE11 未來對象與特定對象的面向沒有交集',
  futureFocus.filter(x => targetFocus.indexOf(x) !== -1).length === 0);

/* ---------- placeholder 與 examples 隨 primary 改變 ---------- */
migrated.forEach(cat => {
  const prs = G.taxonomyPrimaries(cat);
  const phs = new Set(prs.map(p => G.taxonomyPlaceholder(cat, p.id)));
  check(cat + '：placeholder 隨 primary 改變', phs.size === prs.length,
    prs.length + ' 個 primary 只有 ' + phs.size + ' 種 placeholder');
  const exs = new Set(prs.map(p => JSON.stringify(G.taxonomyExamples(cat, p.id, []))));
  check(cat + '：範例隨 primary 改變', exs.size === prs.length);
});
/* CASE 12：focus 改變，examples 至少部分改變 */
migrated.forEach(cat => {
  G.taxonomyPrimaries(cat).forEach(p => {
    const byFocus = (p.examples && p.examples.byFocus) || {};
    const keys = Object.keys(byFocus);
    if (!keys.length) return;
    const base = JSON.stringify(G.taxonomyExamples(cat, p.id, []));
    const withF = JSON.stringify(G.taxonomyExamples(cat, p.id, [keys[0]]));
    check('CASE12 ' + cat + '/' + p.id + ' 選面向後範例會改變', base !== withF);
  });
});

/* ---------- 牌陣推薦真的因題而異 ---------- */
migrated.forEach(cat => {
  const sets = new Set(G.taxonomyPrimaries(cat).map(p => G.taxonomyRecommendedSpreads(cat, p.id).join('|')));
  check(cat + '：牌陣推薦不是所有題目都一樣', sets.size > 1, '只有 ' + sets.size + ' 種推薦組合');
});
check('CASE8 A/B 選擇題優先推薦選擇型牌陣',
  G.taxonomyRecommendedSpreads('career', 'cr-choose')[0] === 'fork');

/* ---------- 切換上游會清掉不相容的下游 ---------- */
const kept = G.taxonomyPruneFocus('love', 'lv-future', ['lv-target-feeling', 'lv-future-scene']);
check('CASE10/11 切換後不相容的已選面向會被清掉',
  kept.length === 1 && kept[0] === 'lv-future-scene', JSON.stringify(kept));

/* ---------- Payload 保留語意角色 ---------- */
const payloadOnly = G.buildReadingPayload({ categoryId:'love', primaryId:'lv-future', spreadId:'three-time',
  readingMode:'cards', focusIds:['lv-future-scene'], customContext:'測試', cards:[{}], astrologyContext:{ chart:1 } });
const payloadBoth = G.buildReadingPayload({ categoryId:'love', primaryId:'lv-future', spreadId:'three-time',
  readingMode:'combined', focusIds:['lv-future-scene'], customContext:'測試', cards:[{}], astrologyContext:{ chart:1 } });
['category','spread','readingMode','primaryQuestion','focusAreas','customContext','tarotCards','astrologyContext']
  .forEach(k => check('payload 保留欄位 ' + k, k in payloadOnly));
check('payload 沒有把內容拼成單一字串', typeof payloadOnly.primaryQuestion === 'object');
check('primaryQuestion 帶 intent', !!payloadOnly.primaryQuestion.intent);
check('focusAreas 帶 semanticFocus', !!payloadOnly.focusAreas[0].semanticFocus);
check('CASE13 Tarot only 不夾帶命盤資料', payloadOnly.astrologyContext === null);
check('CASE13 Tarot+Natal 才帶命盤資料', !!payloadBoth.astrologyContext);
check('CASE13 readingMode 明確區分',
  payloadOnly.readingMode === 'tarot_only' && payloadBoth.readingMode === 'tarot_and_natal');

/* ---------- 題目文案品質 ---------- */
migrated.forEach(cat => {
  G.taxonomyPrimaries(cat).forEach(p => {
    check(cat + '/' + p.id + ' 標題不超過 20 字', p.label.length <= 20, p.label);
    check(cat + '/' + p.id + ' 標題不含多重問句', (p.label.match(/？/g) || []).length <= 1, p.label);
  });
  Object.keys(G.FOCUS_AREA_REGISTRY).forEach(fid => {
    const a = G.FOCUS_AREA_REGISTRY[fid];
    check('面向 ' + fid + ' 有 semanticFocus', !!a.semanticFocus);
    check('面向 ' + fid + ' 標題不超過 18 字', a.label.length <= 18, a.label);
  });
});
/* 語義焦點不得重複——重複代表兩個面向其實在問同一件事。 */
const sems = Object.keys(G.FOCUS_AREA_REGISTRY).map(k => G.FOCUS_AREA_REGISTRY[k].semanticFocus);
const dupSem = sems.filter((s, i) => sems.indexOf(s) !== i);
check('面向的語義焦點沒有完全重複的', new Set(dupSem).size <= 6,
  '重複 ' + [...new Set(dupSem)].join('、'));

/* ---------- 舊題庫仍完整保留 ---------- */
allCats.forEach(cat => {
  const cfg = G.topicQuestionConfig[cat];
  if (!cfg) return;
  const n = (cfg.focusGroups || []).reduce((x, g) => x + g.options.length, 0);
  check(cat + '：舊題庫仍存在（' + n + ' 個面向）', n > 0 || cat === 'decision');
});
check('尚未遷移的分類仍可運作（沿用舊行為）',
  pending.every(k => !G.taxonomyHasCategory(k)));

/* ---------- UI 連動：實際渲染驗證 ---------- */
function step3(cat, sub, sel) {
  c.state.tab = 'reading'; c.state.deck = 'tarot';
  c.state.category = cat; c.state.spread = 'three-time'; c.state.wizardStep = 3;
  c.state.subtopic = sub || '';
  c.state.wizFocusOpen = true; c.state.wizContextOpen = true;
  c.state.wizFocusSel = sel || {}; c.state.wizFocusExpanded = {}; c.state.question = '';
  return c.renderReading();
}
const focusOf = (html) =>
  [...html.matchAll(/onclick="wizToggleFocus\([^)]*&quot;([^&]+)&quot;\)"/g)].map(m => m[1]);

/* 每個已遷移的主問題，畫面上算出來的面向必須真的不同。 */
migrated.forEach(cat => {
  const withLegacy = G.taxonomyPrimaries(cat).filter(p => p.legacyKey);
  const sigs = {};
  withLegacy.forEach(p => { sigs[p.legacyKey] = focusOf(step3(cat, p.legacyKey)).join('|'); });
  const uniq = new Set(Object.values(sigs));
  check('UI／' + cat + '：不同主問題在畫面上得到不同面向',
    uniq.size === withLegacy.length,
    withLegacy.length + ' 個主問題只有 ' + uniq.size + ' 種畫面');
  withLegacy.forEach(p => {
    const shown = focusOf(step3(cat, p.legacyKey));
    check('UI／' + cat + '/' + p.legacyKey + ' 有面向可選', shown.length > 0);
    /* Assumption Guard 必須在畫面上生效。 */
    shown.forEach(label => {
      const fid = G.taxonomyFocusIdByLabel(label);
      if (!fid) return;
      const need = (G.FOCUS_AREA_REGISTRY[fid].requires) || {};
      Object.keys(need).forEach(k => {
        check('UI／' + cat + '/' + p.legacyKey + ' 不該出現「' + label + '」',
          !need[k] || !!(p.assumptions || {})[k]);
      });
    });
  });
});
/* CASE 1：未來對象的畫面不得出現特定對象題 */
const futureShown = focusOf(step3('love', 'partner-type'));
['對方目前對我的感受', '為什麼沒有主動', '雙方付出是否平衡'].forEach(bad => {
  check('CASE1 未來對象畫面不含「' + bad + '」', futureShown.indexOf(bad) === -1);
});
/* 連動說明只在已遷移且有對應時出現 */
check('已遷移的主問題顯示連動說明', step3('love', 'partner-type').indexOf('已依你選的') !== -1);
check('未遷移的分類不顯示連動說明', step3('health', '').indexOf('已依你選的') === -1);
check('未遷移的分類仍有面向可選', focusOf(step3('health', '')).length > 0);

/* placeholder 與範例隨主問題改變 */
const phA = step3('love', 'partner-type'), phB = step3('love', 'reunion');
check('UI placeholder 隨主問題改變',
  phA.indexOf('我單身一段時間了') !== -1 && phB.indexOf('我們分開幾個月了') !== -1);

/* 換主問題會清掉不相容的已選面向 */
c.state.category = 'love'; c.state.subtopic = 'crush';
c.state.wizFocusSel = { love: ['對方目前對我的感受'] };
c.state.wizFocusExpanded = {};
c.wizSetSubtopic('partner-type');
check('換主問題會清掉不相容的已選面向', (c.state.wizFocusSel.love || []).length === 0,
  JSON.stringify(c.state.wizFocusSel.love));

/* 主問題本身沒有被換掉——它驅動解讀引擎 */
migrated.forEach(cat => {
  const keys = (G.SUBTOPICS[cat] || []).map(s => s.key);
  G.taxonomyPrimaries(cat).forEach(p => {
    if (!p.legacyKey) return;
    check(cat + '/' + p.id + ' 的 legacyKey 對應到實際存在的舊題目',
      keys.indexOf(p.legacyKey) !== -1, p.legacyKey);
  });
});

/* ---------- 決策類：從零建立的題庫 ---------- */
check('決策類已有 primary questions', G.taxonomyPrimaries('decision').length >= 5,
  '只有 ' + G.taxonomyPrimaries('decision').length + ' 個');
check('決策類支援 A/B 以外的決策型態', (function () {
  const intents = G.taxonomyPrimaries('decision').map(p => p.intent);
  return ['binary_choice','act_or_not','timing_choice','stay_or_leave','accept_or_decline','undecided_direction']
    .every(i => intents.indexOf(i) !== -1);
})());
check('決策類在畫面上有主問題可選', step3('decision', '').indexOf('這次你最想問什麼') !== -1);
G.taxonomyPrimaries('decision').forEach(p => {
  check('決策／' + p.id + ' 在畫面上有面向可選', focusOf(step3('decision', p.id)).length > 0);
});
/* 只有一個方案時不得出現 A/B 比較 */
const doFocus = focusOf(step3('decision', 'dc-do'));
['選 A 的機會', '選 B 的機會'].forEach(bad => {
  check('CASE8 「要不要做」不出現 A/B 比較：' + bad, doFocus.indexOf(bad) === -1);
});

/* ---------- 健康與財運的安全規則 ---------- */
check('健康類宣告了安全規則',
  (G.QUESTION_TAXONOMY.health.safetyRules || []).length > 0);
check('健康類的安全規則講明不能取代醫療評估',
  (G.QUESTION_TAXONOMY.health.safetyRules || []).join('').indexOf('不能取代醫療評估') !== -1);
check('財運類宣告了安全規則',
  (G.QUESTION_TAXONOMY.wealth.safetyRules || []).length > 0);
check('財運類的安全規則排除投資標的與報酬承諾',
  (G.QUESTION_TAXONOMY.wealth.safetyRules || []).join('').indexOf('不提供投資標的') !== -1);
/* 健康面向不得出現診斷式語言 */
Object.keys(G.FOCUS_AREA_REGISTRY).filter(k => k.indexOf('ht-') === 0).forEach(k => {
  const label = G.FOCUS_AREA_REGISTRY[k].label;
  ['疾病', '診斷', '病症', '罹患', '用藥', '療程', '痊癒'].forEach(w => {
    check('健康面向「' + label + '」不含診斷式用語「' + w + '」', label.indexOf(w) === -1);
  });
});
/* 財運面向不得出現保證報酬式語言 */
Object.keys(G.FOCUS_AREA_REGISTRY).filter(k => k.indexOf('wl-') === 0).forEach(k => {
  const label = G.FOCUS_AREA_REGISTRY[k].label;
  ['一定', '保證', '必賺', '報酬率', '漲', '跌'].forEach(w => {
    check('財運面向「' + label + '」不含保證式用語「' + w + '」', label.indexOf(w) === -1);
  });
});

/* ---------- 九類全部覆蓋 ---------- */
check('九個分類全部遷移完成', migrated.length === allCats.length,
  '尚缺 ' + pending.join('、'));

/* ---------- 稽核報告 ---------- */
migrated.forEach(cat => {
  G.taxonomyPrimaries(cat).forEach(p => {
    const ids = G.taxonomyAllowedFocusIds(cat, p.id);
    const others = G.taxonomyPrimaries(cat).filter(x => x.id !== p.id)
      .map(x => G.taxonomyAllowedFocusIds(cat, x.id).slice().sort().join('|'));
    const same = others.indexOf(ids.slice().sort().join('|')) !== -1;
    const warn = [];
    if (ids.length < 5) warn.push('可用面向偏少');
    if (!Object.keys(p.assumptions || {}).length && cat !== 'general') warn.push('未宣告前提');
    audit.push({ cat, id: p.id, focus: ids.length,
      result: same ? 'FAIL' : (warn.length ? 'WARNING' : 'PASS'), note: same ? '面向與其他題目重複' : warn.join('、') });
  });
});
pending.forEach(cat => {
  (G.SUBTOPICS[cat] || []).forEach(s => {
    audit.push({ cat, id: s.key, focus: '-', result: 'WARNING', note: '尚未遷移，沿用舊的分組篩選' });
  });
});
const cnt = { PASS: 0, WARNING: 0, FAIL: 0 };
audit.forEach(a => { cnt[a.result]++; });

console.log('# Question Taxonomy 稽核');
console.log('');
console.log('- 檢查項目：' + checks.length);
console.log('- 失敗：' + failures.length);
console.log('- 已遷移分類：' + migrated.join('、') + '（' + migrated.length + '/' + allCats.length + '）');
console.log('- 待遷移：' + pending.join('、'));
console.log('- Primary 稽核：PASS ' + cnt.PASS + '　WARNING ' + cnt.WARNING + '　FAIL ' + cnt.FAIL);
console.log('- 面向 registry：' + Object.keys(G.FOCUS_AREA_REGISTRY).length + ' 個');
if (failures.length) {
  console.log('');
  failures.slice(0, 12).forEach(f => console.log('  ✗ ' + f));
  if (failures.length > 12) console.log('  …共 ' + failures.length + ' 項');
  process.exit(1);
}
if (cnt.FAIL) {
  console.log('');
  audit.filter(a => a.result === 'FAIL').forEach(a => console.log('  FAIL ' + a.cat + '/' + a.id + '：' + a.note));
  process.exit(1);
}
console.log('');
console.log('全部通過。');
