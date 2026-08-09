#!/usr/bin/env node
/* 牌典知識層回歸測試。
 *
 * 原本的數字公式是從單張牌義倒推回去的：
 *   3：初步成果／合作　　← 合作只是錢幣三的表現
 *   5：衝突／損失　　　　← 損失只是錢幣五的表現
 *   8：專注／行動　　　　← 行動只是權杖八的表現
 *   9：獨自滿足／焦慮　　← 焦慮只是寶劍九的表現
 * 最明顯的證據是 3 那一列自己標了「例外：寶劍三＝心碎」——需要標例外，
 * 就代表這個定義本身不成立。
 *
 * 這一支守住三件事：數字定義不得再被單張牌義綁架、每個階段都要能推導到四個花色、
 * 以及 Progressive Disclosure 不得退化成一次攤開的文字牆。
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
/* reading-data.js 用 const 宣告，不會掛到 VM 的全域物件上，要另外取出來。 */
const G = vm.runInContext(
  '({TAROT, NUMBER_FORMULA_DATA, SUIT_DOMAIN_DATA, COURT_ROLE_DATA, CONFUSE_DATA, LIBRARY_DRILLS,'
  + ' MAJOR_JOURNEY_DATA, MAJOR_COLUMN_DATA, MAJOR_STAGE_DATA})', c);

const SUITS = ['wands', 'cups', 'swords', 'pentacles'];

/* ---------- 1. 數字不得再被單張牌義綁架 ---------- */
/* 這些詞是特定花色在該階段的長相，不是階段本身的定義。 */
const CARD_DERIVED = ['合作', '損失', '等待', '行動', '焦慮', '給予', '心碎', '匱乏'];
check('數字階段共 10 個', G.NUMBER_FORMULA_DATA.length === 10);
G.NUMBER_FORMULA_DATA.forEach(d => {
  CARD_DERIVED.forEach(word => {
    check('數字 ' + d.label + ' 的階段名稱不使用單張牌義「' + word + '」',
      d.name.indexOf(word) === -1, d.name);
    check('數字 ' + d.label + ' 的一句記憶不使用單張牌義「' + word + '」',
      d.memory.indexOf(word) === -1, d.memory);
  });
  /* 舊資料靠「例外：…」來補破網，那是定義錯誤的訊號。 */
  const joined = [d.name, d.memory, d.concept, d.question].join(' ');
  check('數字 ' + d.label + ' 不需要用「例外」來補定義', joined.indexOf('例外') === -1, joined.slice(0, 40));
});

/* ---------- 2. 每個階段都要能推導到四個花色 ---------- */
G.NUMBER_FORMULA_DATA.forEach(d => {
  ['question','concept','why','positive','shadow','ask','myth','memory'].forEach(f => {
    check('數字 ' + d.label + ' 有 ' + f, !!d[f] && String(d[f]).length > 4);
  });
  /* 階段名稱刻意短（開始／互動／成形…），只要求非空。 */
  check('數字 ' + d.label + ' 有階段名稱', !!d.name && d.name.length >= 2);
  check('數字 ' + d.label + ' 有 3 個好記憶的關鍵字',
    Array.isArray(d.keywords) && d.keywords.length === 3, JSON.stringify(d.keywords));
  SUITS.forEach(s => {
    check('數字 ' + d.label + ' 有 ' + s + ' 的推導', !!d.suits[s] && d.suits[s].length > 8);
    /* 推導句要寫成「因為…所以…」的形式，看得到中間的邏輯，而不只是結果關鍵字。 */
    check('數字 ' + d.label + ' 的 ' + s + ' 推導帶有因果連接詞',
      /因此|所以|因為/.test(d.suits[s]), d.suits[s]);
  });
  /* 四個花色的說明必須互不相同，否則等於沒有分化。 */
  const texts = SUITS.map(s => d.suits[s]);
  check('數字 ' + d.label + ' 的四花色說明互不相同', new Set(texts).size === 4);
});
/* 常見誤區必須真的點名被過度簡化的說法。 */
const myths = G.NUMBER_FORMULA_DATA.map(d => d.myth).join(' ');
['合作', '損失', '行動', '焦慮', '給予', '等待'].forEach(w => {
  check('常見誤區有處理「' + w + '」這個過度簡化', myths.indexOf(w) !== -1);
});

/* ---------- 3. 花色模型 ---------- */
check('花色共 4 個', G.SUIT_DOMAIN_DATA.length === 4);
G.SUIT_DOMAIN_DATA.forEach(d => {
  ['coreQuestion','domain','healthy','excess','lack','love','work','money','advice'].forEach(f => {
    check('花色 ' + d.title + ' 有 ' + f, !!d[f] && String(d[f]).length > 3);
  });
  /* 元素是單字（火／水／風／土）。 */
  check('花色 ' + d.title + ' 有元素', !!d.element && d.element.length >= 1);
  check('花色 ' + d.title + ' 保留好記憶的關鍵字',
    Array.isArray(d.tags) && d.tags.length >= 3);
  /* 感情、工作、金錢不得套用同一句話。 */
  check('花色 ' + d.title + ' 的感情／工作／金錢說明互不相同',
    new Set([d.love, d.work, d.money]).size === 3);
});

/* ---------- 4. 宮廷角色模型 ---------- */
check('宮廷共 4 個位階', G.COURT_ROLE_DATA.length === 4);
const MODELS = { page: '認識', knight: '追求', queen: '內化', king: '運用' };
G.COURT_ROLE_DATA.forEach(d => {
  ['model','desc','asPerson','asState','asAdvice','love','work','shadow'].forEach(f => {
    check('宮廷 ' + d.title + ' 有 ' + f, !!d[f] && String(d[f]).length > 4);
  });
  check('宮廷 ' + d.title + ' 的角色模型符合學習曲線',
    d.model.indexOf(MODELS[d.rank]) !== -1, d.model);
  check('宮廷 ' + d.title + ' 保留好記憶的關鍵字',
    Array.isArray(d.keywords) && d.keywords.length === 3);
  SUITS.forEach(s => check('宮廷 ' + d.title + ' 有 ' + s + ' 的表現', !!d.suits[s]));
  check('宮廷 ' + d.title + ' 的四花色表現互不相同',
    new Set(SUITS.map(s => d.suits[s])).size === 4);
});

/* ---------- 5. 易混淆 ---------- */
check('易混淆至少 14 組（原本 10 組）', G.CONFUSE_DATA.length >= 14, '目前 ' + G.CONFUSE_DATA.length + ' 組');
const decides = new Set();
G.CONFUSE_DATA.forEach((g, i) => {
  check('易混淆第 ' + (i + 1) + ' 組有共同點', !!g.common);
  check('易混淆第 ' + (i + 1) + ' 組有判斷問題', !!g.decide && g.decide.length > 8);
  decides.add(g.decide);
  check('易混淆第 ' + (i + 1) + ' 組至少比較兩張牌', g.cards.length >= 2);
  g.cards.forEach(cc => {
    check('易混淆牌 id ' + cc.id + ' 存在於牌庫', !!G.TAROT.find(x => x.id === cc.id));
    check('易混淆牌 ' + cc.id + ' 有第一人稱立場句', !!cc.stance && cc.stance.length > 5);
    check('易混淆牌 ' + cc.id + ' 有差異說明', !!cc.diff && cc.diff.length > 5);
    check('易混淆牌 ' + cc.id + ' 有「什麼情況比較像它」', !!cc.when && cc.when.length > 5);
  });
  /* 同一組裡兩張牌的立場必須真的不同。 */
  const stances = g.cards.map(x => x.stance);
  check('易混淆第 ' + (i + 1) + ' 組的立場句互不相同', new Set(stances).size === stances.length);
});
check('判斷問題不是同一句複製到所有組', decides.size === G.CONFUSE_DATA.length);

/* ---------- 5.5 大阿爾克那旅程 ---------- */
/* 大牌沒有「數字 × 花色」可推導，改用兩個真實存在於牌陣結構裡的骨架：
   三階段旅程，以及把 1–21 排成三列七行後的直行對應（1魔術師／8力量／15惡魔
   都在講怎麼駕馭力量）。愚人 0 在整條路之外，不屬於任何一行。 */
const majors = G.TAROT.filter(x => x.arcana === 'major');
check('大阿爾克那共 22 張', majors.length === 22);
check('22 張大牌都有旅程資料',
  majors.every(m => !!G.MAJOR_JOURNEY_DATA[m.id]),
  majors.filter(m => !G.MAJOR_JOURNEY_DATA[m.id]).map(m => m.id).join('、'));
check('三個階段', G.MAJOR_STAGE_DATA.length === 3);
check('七組直行對應', G.MAJOR_COLUMN_DATA.length === 7);

const inColumns = new Set();
G.MAJOR_COLUMN_DATA.forEach(col => {
  check('第 ' + col.col + ' 組有共同課題', !!col.theme && col.theme.length > 4);
  check('第 ' + col.col + ' 組恰好三張牌（三個層次）', col.ids.length === 3, col.ids.join('、'));
  col.ids.forEach(id => {
    check('直行牌 ' + id + ' 存在', !!G.TAROT.find(x => x.id === id));
    check('直行牌 ' + id + ' 沒有重複出現在其他組', !inColumns.has(id));
    inColumns.add(id);
  });
  /* 同一組的三張必須分屬三個不同階段，否則那不是「三種層次」。 */
  const stages = col.ids.map(id => (G.MAJOR_JOURNEY_DATA[id] || {}).stage);
  check('第 ' + col.col + ' 組的三張分屬三個階段', new Set(stages).size === 3, stages.join('、'));
});
check('直行對應涵蓋 1–21 共 21 張', inColumns.size === 21, '實際 ' + inColumns.size);
check('愚人不屬於任何一行（它在整條路之外）',
  !inColumns.has('m0') && G.MAJOR_JOURNEY_DATA.m0.col === null);

const majorThemes = new Set(G.MAJOR_COLUMN_DATA.map(x => x.theme));
check('七組課題互不相同', majorThemes.size === 7);

Object.keys(G.MAJOR_JOURNEY_DATA).forEach(id => {
  const j = G.MAJOR_JOURNEY_DATA[id];
  const card = G.TAROT.find(x => x.id === id);
  const label = card ? card.nameZh : id;
  ['role', 'lesson', 'shadow', 'love', 'work', 'advice', 'ask'].forEach(f => {
    check('大牌 ' + label + ' 有 ' + f, !!j[f] && String(j[f]).length > 4);
  });
  check('大牌 ' + label + ' 的感情／工作說明不同', j.love !== j.work);
  if (id !== 'm0') {
    check('大牌 ' + label + ' 有所屬階段', !!j.stage);
    check('大牌 ' + label + ' 有所屬直行', typeof j.col === 'number');
  }
});
/* numberEcho 只寫在對應站得住腳的地方（1–10）。硬替 11–21 套數字會製造
   看起來精確、實際牽強的關聯，寧可不寫。 */
const echoed = Object.keys(G.MAJOR_JOURNEY_DATA).filter(id => G.MAJOR_JOURNEY_DATA[id].numberEcho);
check('數字呼應只寫在 1–10 這幾張', echoed.length === 10, echoed.join('、'));
check('11–21 沒有硬套數字呼應',
  ['m11','m12','m13','m14','m15','m16','m17','m18','m19','m20','m21']
    .every(id => !G.MAJOR_JOURNEY_DATA[id].numberEcho));
/* 每張牌的課題與提問都必須是自己的，不能複製同一句。 */
const lessons = Object.keys(G.MAJOR_JOURNEY_DATA).map(id => G.MAJOR_JOURNEY_DATA[id].lesson);
check('22 張的課題互不相同', new Set(lessons).size === lessons.length);
const asks = Object.keys(G.MAJOR_JOURNEY_DATA).map(id => G.MAJOR_JOURNEY_DATA[id].ask);
check('22 張的自問問題互不相同', new Set(asks).size === asks.length);

/* ---------- 6. Progressive Disclosure ---------- */
c.state.mnOpen = true;
function renderTab(tab, expanded, learn) {
  c.state.mnTab = tab;
  c.state.mnExpanded = expanded || {};
  c.state.mnLearnMode = !!learn;
  c.state.mnDrillOpen = {};
  return c.renderMnemonic();
}
[['suit', 'suit:wands', '關注領域'],
 ['number', 'num:3', '常見誤區'],
 ['court', 'court:page', '陰影面'],
 ['major', 'maj:m8', '這張牌的課題'],
 ['confuse', 'cf:0', '判斷問題']].forEach(row => {
  const collapsed = renderTab(row[0], {});
  const opened = renderTab(row[0], { [row[1]]: true });
  check(row[0] + ' 分頁收合時不輸出深入內容', collapsed.indexOf(row[2]) === -1,
    '收合狀態就已經出現「' + row[2] + '」');
  check(row[0] + ' 分頁展開後才出現深入內容', opened.indexOf(row[2]) !== -1);
  check(row[0] + ' 分頁展開會明顯增加內容', opened.length > collapsed.length + 300,
    '只多了 ' + (opened.length - collapsed.length) + ' 字元');
  check(row[0] + ' 分頁的展開控制達到 44px 觸控目標',
    /min-height:44px;width:100%/.test(collapsed));
});

/* 列表層仍要看得到好記憶的關鍵字。 */
const numCollapsed = renderTab('number', {});
G.NUMBER_FORMULA_DATA.forEach(d => {
  check('數字 ' + d.label + ' 的關鍵字在收合狀態就看得到',
    d.keywords.every(k => numCollapsed.indexOf(k) !== -1));
});

/* ---------- 7. 推牌公式與學習模式 ---------- */
check('數字分頁最上方有完整推牌公式',
  numCollapsed.indexOf('一張小阿爾克那怎麼讀？') !== -1);
['數字', '花色', '正逆位', '問題情境'].forEach(part => {
  check('推牌公式包含「' + part + '」這一層', numCollapsed.indexOf(part) !== -1);
});
check('公式頁明講不取代單張牌的傳統牌義',
  numCollapsed.indexOf('不取代單張牌的傳統牌義') !== -1);

const general = renderTab('number', {}, false);
const learning = renderTab('number', {}, true);
check('一般模式不顯示推導練習', general.indexOf('自己試著解牌') === -1);
check('學習模式顯示推導練習', learning.indexOf('自己試著解牌') !== -1);
check('學習模式是在一般內容之上疊加', learning.length > general.length);
check('推導練習不做計分或積分',
  !/得分|分數|連續答對|排行|積分/.test(learning));
check('推導練習的答案預設收合', learning.indexOf('展開答案') !== -1);

/* 練習題目必須真的對應到存在的牌，且答案來自同一份知識資料。 */
G.LIBRARY_DRILLS.forEach(d => {
  const card = c.libraryDrillCard(d.num, d.suit);
  check('練習題 ' + d.num + '/' + d.suit + ' 對應到實際存在的牌', !!card, JSON.stringify(d));
  if (card) {
    const numDef = G.NUMBER_FORMULA_DATA.filter(x => x.num === d.num)[0];
    check('練習題 ' + card.nameZh + ' 的答案來自數字公式同一份資料',
      !!numDef && !!numDef.suits[d.suit]);
  }
});

/* ---------- 8. 一般與學習模式不得產生矛盾牌義 ---------- */
/* 兩種模式都從 NUMBER_FORMULA_DATA／SUIT_DOMAIN_DATA 取值，
   這裡確認學習模式沒有另外寫一份說法。 */
const app = read('js/app.js');
check('學習模式沒有另一份平行的數字定義',
  (app.match(/var NUMBER_FORMULA_DATA/g) || []).length === 1);
check('學習模式沒有另一份平行的花色定義',
  (app.match(/var SUIT_DOMAIN_DATA/g) || []).length === 1);

console.log('# 牌典知識層回歸測試');
console.log('');
console.log('- 檢查項目：' + checks.length);
console.log('- 失敗：' + failures.length);
console.log('- 大牌 ' + Object.keys(G.MAJOR_JOURNEY_DATA).length + ' 張、' + G.MAJOR_STAGE_DATA.length
  + ' 階段、' + G.MAJOR_COLUMN_DATA.length + ' 組直行對應');
console.log('- 數字階段 ' + G.NUMBER_FORMULA_DATA.length + '、花色 ' + G.SUIT_DOMAIN_DATA.length
  + '、宮廷 ' + G.COURT_ROLE_DATA.length + '、易混淆 ' + G.CONFUSE_DATA.length + ' 組（'
  + G.CONFUSE_DATA.reduce((n, g) => n + g.cards.length, 0) + ' 張牌）');
if (failures.length) {
  console.log('');
  failures.slice(0, 12).forEach(f => console.log('  ✗ ' + f));
  if (failures.length > 12) console.log('  …共 ' + failures.length + ' 項');
  process.exit(1);
}
console.log('');
console.log('全部通過。');
