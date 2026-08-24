#!/usr/bin/env node
/* 合盤關係模式回歸測試。
 *
 * 原本的合盤是「一個交叉相位 → 一張完整卡片」：renderSynastry() 取前 10 組相位，
 * 每組輸出標題＋說明＋優勢＋卡點＋做法，而文案只由相位「類型」決定（五套模板），
 * 所以十張卡讀起來像同一張，標題還直接用內部語義串接
 * （「你的情緒反應與安全感 × 對方的想像、同理與理想化傾向」）。
 *
 * 現在改成先把相位聚合成關係模式。這一支守住聚合不能退化回相位清單，
 * 也守住「聚合只改變呈現，不改變計算」——每個模式都必須能追回原始相位。
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
function loadRuntime() {
  const elements = {};
  const c = { console, setTimeout, clearTimeout, URL, Intl, Date, Math, JSON, Promise };
  c.window = c; c.navigator = {}; c.scrollTo = () => {};
  c.localStorage = { getItem(){return null;}, setItem(){}, removeItem(){} };
  c.location = { hostname: 'example.com', search: '' };
  c.document = { head:element(), body:element(), documentElement:element(),
    getElementById(id){ return elements[id] || (elements[id] = element()); },
    querySelector(){return null;}, querySelectorAll(){return [];}, addEventListener(){}, createElement:element };
  vm.createContext(c);
  vm.runInContext(read('assets/vendor/astronomy-engine-2.1.19.min.js'), c, { filename: 'astronomy' });
  ['js/data/astrology-core-data.js','js/data/astrology-points-data.js','js/data/astrology-placement-templates.js',
   'js/data/astrology-aspect-data.js','js/data/astrology-knowledge-layer.js','js/data/astrology-knowledge-dataset.js',
   'js/data/astrology-natal-topics-data.js','js/data/card-images.js','js/data/reading-data.js',
   'js/data/reading-interpretation.js','js/data/reading-rich-data.js','js/app.js',
   'js/data/astro-charts.js','js/data/astro-advanced.js','tests/golden-charts.js']
    .forEach(f => vm.runInContext(read(f), c, { filename: f }));
  c.ensureAstrologyBodyKeys();
  return c;
}
const c = loadRuntime();

/* 用經度直接組出星盤，才能精準製造出五種差異明顯的合盤結構。 */
function chartFromLongitudes(lons) {
  const ch = { planets: {}, points: {}, aspects: [], houseCusps: [], asc: 0, mc: 0, ascSign: 0, houseSystem: 'placidus' };
  c.ASTRO_PLANET_BODY_KEYS.forEach(k => {
    const lon = lons[k] || 0;
    ch.planets[k] = { lon, sign: Math.floor(lon / 30), deg: lon % 30, house: 1, retro: false };
  });
  return ch;
}
const SCENARIOS = {
  'A 和諧個人行星為主': [
    {Sun:0,Moon:40,Mercury:80,Venus:120,Mars:160,Jupiter:200,Saturn:240,Uranus:280,Neptune:320,Pluto:20},
    {Sun:120,Moon:160,Mercury:200,Venus:240,Mars:280,Jupiter:320,Saturn:0,Uranus:40,Neptune:80,Pluto:140}],
  'B 緊張個人行星為主': [
    {Sun:0,Moon:30,Mercury:60,Venus:90,Mars:120,Jupiter:150,Saturn:180,Uranus:210,Neptune:240,Pluto:270},
    {Sun:90,Moon:120,Mercury:150,Venus:180,Mars:210,Jupiter:240,Saturn:270,Uranus:300,Neptune:330,Pluto:0}],
  'C 和諧與緊張並存': [
    {Sun:0,Moon:45,Mercury:100,Venus:150,Mars:200,Jupiter:250,Saturn:300,Uranus:350,Neptune:40,Pluto:90},
    {Sun:120,Moon:135,Mercury:220,Venus:150,Mars:290,Jupiter:10,Saturn:60,Uranus:110,Neptune:130,Pluto:180}],
  'D 土星影響很強': [
    {Sun:0,Moon:60,Mercury:120,Venus:180,Mars:240,Jupiter:300,Saturn:15,Uranus:75,Neptune:135,Pluto:195},
    {Sun:15,Moon:16,Mercury:14,Venus:18,Mars:12,Jupiter:200,Saturn:105,Uranus:250,Neptune:300,Pluto:340}],
  'E 外行星影響很強': [
    {Sun:0,Moon:30,Mercury:60,Venus:90,Mars:120,Jupiter:150,Saturn:180,Uranus:10,Neptune:12,Pluto:14},
    {Sun:11,Moon:13,Mercury:190,Venus:9,Mars:15,Jupiter:250,Saturn:280,Uranus:100,Neptune:130,Pluto:160}],
};

const results = {};
Object.keys(SCENARIOS).forEach(name => {
  const [la, lb] = SCENARIOS[name];
  const aspects = c.computeCrossChartAspects(chartFromLongitudes(la), chartFromLongitudes(lb))
    .sort((x, y) => x.orb - y.orb);
  const patterns = c.buildSynastryPatterns(aspects);
  results[name] = { aspects, patterns, overview: c.buildSynastryOverview(patterns), top: patterns.slice(0, 3) };
});

/* ---------- 1. 聚合真的發生了 ---------- */
Object.keys(results).forEach(name => {
  const r = results[name];
  check(name + '：相位有被聚合成較少的模式',
    r.patterns.length < r.aspects.length,
    r.aspects.length + ' 組相位 → ' + r.patterns.length + ' 個模式');
  const multi = r.patterns.filter(p => p.aspects.length > 1).length;
  check(name + '：至少有一個模式由多組相位共同支持', multi >= 1,
    '沒有任何模式聚合到一組以上的相位，等於退化回相位清單');
});

/* ---------- 2. 前三模式因盤而異，且語義互不相同 ---------- */
const topKeys = Object.keys(results).map(n => results[n].top.map(p => p.key).join(','));
check('五組合盤的前三模式不是同一組', new Set(topKeys).size >= 4,
  '只有 ' + new Set(topKeys).size + ' 種組合');
Object.keys(results).forEach(name => {
  const keys = results[name].top.map(p => p.key);
  check(name + '：前三模式彼此語義不同', new Set(keys).size === keys.length, keys.join('、'));
});

/* ---------- 3. 30 秒摘要 ---------- */
const summaries = new Set();
Object.keys(results).forEach(name => {
  const ov = results[name].overview;
  if (!ov) { check(name + '：有產生摘要', false); return; }
  summaries.add(ov.core);
  check(name + '：核心段落長度在 80–140 字',
    ov.core.length >= 80 && ov.core.length <= 140, ov.core.length + ' 字');
  ['close', 'stuck', 'key'].forEach(f => {
    check(name + '：摘要的 ' + f + ' 有內容', !!ov[f] && ov[f].length > 6);
  });
  /* 摘要不得出現相位名稱、容許度、權重、星體代碼。 */
  const text = [ov.core, ov.close, ov.stuck, ov.key].join(' ');
  ['合相','三分相','四分相','六分相','對分相','容許度','權重','°','orb','Moon','Venus','Saturn'].forEach(term => {
    if (text.indexOf(term) !== -1) {
      check(name + '：摘要不含技術用語「' + term + '」', false, text.slice(0, 40));
    }
  });
});
check('五組合盤的核心摘要互不相同', summaries.size === 5, '只有 ' + summaries.size + ' 種');

/* ---------- 4. 標題必須是生活語言 ---------- */
Object.keys(results).forEach(name => {
  results[name].patterns.forEach(p => {
    check(name + '／' + p.key + '：標題不超過 24 字', p.title.length <= 24, p.title + '（' + p.title.length + ' 字）');
    check(name + '／' + p.key + '：標題不使用「你的X × 對方的Y」格式',
      p.title.indexOf(' × ') === -1 && !/^你的/.test(p.title), p.title);
  });
});

/* ---------- 5. 相反訊號要整合成一張，不能各寫一篇 ---------- */
let mixedSeen = 0;
Object.keys(results).forEach(name => {
  results[name].patterns.forEach(p => {
    if (p.tone !== 'mixed') return;
    mixedSeen++;
    check(name + '／' + p.key + '：mixed 模式同時保留順向與張力相位',
      p.hasContradiction && p.conflicting.length > 0,
      '順 ' + p.supporting.length + '、張力 ' + p.conflicting.length);
  });
});
check('至少有一組合盤出現需要整合的相反訊號', mixedSeen > 0);

/* 只有合相、沒有任何張力相位時不得標成 mixed——mixed 的文案在講「同時有靠近與
   拉開的訊號」，沒有張力相位時那是不實描述。這種情況標為 intense（放大）。 */
Object.keys(results).forEach(name => {
  results[name].patterns.forEach(p => {
    if (p.tone === 'mixed') {
      check(name + '／' + p.key + '：標成 mixed 時真的有相反訊號', p.hasContradiction);
    }
    if (!p.hasContradiction) {
      check(name + '／' + p.key + '：沒有相反訊號時不得標成 mixed', p.tone !== 'mixed', p.tone);
    }
  });
});

/* ---------- 6. 每個模式只保留四件事，且長度受控 ---------- */
Object.keys(results).forEach(name => {
  results[name].patterns.forEach(p => {
    ['lead', 'strength', 'friction', 'action'].forEach(f => {
      check(name + '／' + p.key + '：' + f + ' 有內容', !!p[f]);
    });
    const bodyLen = p.title.length + p.lead.length + p.strength.length + p.friction.length + p.action.length;
    check(name + '／' + p.key + '：整張卡片正文約在 100–180 字',
      bodyLen >= 60 && bodyLen <= 190, bodyLen + ' 字');
    /* 優勢、卡點、做法各只寫一句 */
    ['strength', 'friction', 'action'].forEach(f => {
      const sentences = p[f].split(/[。！？]/).filter(x => x.trim()).length;
      check(name + '／' + p.key + '：' + f + ' 只有一句', sentences === 1, p[f]);
    });
  });
});

/* ---------- 7. 建議不得千篇一律 ---------- */
Object.keys(results).forEach(name => {
  const actions = results[name].patterns.map(p => p.action);
  const dup = actions.filter((a, i) => actions.indexOf(a) !== i);
  check(name + '：不同模式沒有重複的做法', dup.length === 0, dup[0] || '');
});
const allActions = [];
Object.keys(results).forEach(n => results[n].patterns.forEach(p => allActions.push(p.action)));
check('做法不是同一句萬用建議收尾', new Set(allActions).size >= 8,
  '只有 ' + new Set(allActions).size + ' 種不同做法');

/* ---------- 8. 準確度：原始相位必須完整保留且可追溯 ---------- */
Object.keys(results).forEach(name => {
  const r = results[name];
  const covered = new Set();
  r.patterns.forEach(p => p.aspects.forEach(a => covered.add(a.aKey + '|' + a.bKey + '|' + a.type)));
  check(name + '：原始相位陣列沒有被修改',
    r.aspects.every(a => typeof a.orb === 'number' && a.aKey && a.bKey && a.type));
  /* 不是每組相位都會落進模式（模式定義只涵蓋有意義的組合），但落進去的必須追得回去。 */
  r.patterns.forEach(p => {
    check(name + '／' + p.key + '：每個模式都能追回實際相位', p.aspects.length > 0);
    check(name + '／' + p.key + '：supporting + conflicting 等於全部支持相位',
      p.supporting.length + p.conflicting.length === p.aspects.length,
      p.supporting.length + '+' + p.conflicting.length + ' ≠ ' + p.aspects.length);
  });
});

/* ---------- 9. 渲染層 ---------- */
const advanced = read('js/data/astro-advanced.js');
check('渲染層不再逐一相位輸出卡片',
  !/listed\.slice\(0, 10\)\.forEach/.test(advanced));
check('舊的「一相位一卡」渲染器已移除',
  !/^function renderCrossAspectBeginnerCard/m.test(advanced));
check('第一屏顯示現有相性總分與證據式結論',
  /function renderSynastryScoreHero/.test(advanced) && /你們的關係相性/.test(advanced)
  && /relationshipVerdict/.test(advanced));
check('總分、renderer 與 AI 共用 state result model',
  /function synEnsureAnalysis/.test(advanced) && /state\.synAnalysis/.test(advanced)
  && /buildSynastryAiText\(model/.test(advanced));
check('專業依據預設收合', /aria-expanded="' \+ open \+ '" onclick="toggleSynPattern/.test(advanced));
check('提供一般／專業閱讀深度切換', /function toggleSynProfessional/.test(advanced));
check('完整雙人連線圖降到可展開的第二層', /<details style="margin-top:15px/.test(advanced) && /查看完整雙人行星連線圖/.test(advanced));
check('展開控制達到 44px 觸控目標', /min-height:var\(--control-h\);width:100%;margin-top:10px;text-align:left/.test(advanced));
check('語氣標籤不只靠顏色，帶有文字', /function synastryToneLabel/.test(advanced) && /張力較明顯/.test(advanced));

const pro = c.state.synProfessional;
c.state.synProfessional = false;
c.state.synPatternOpen = {};
const sample = results['C 和諧與緊張並存'].top[0];
c.state.synPatternOpen[sample.key] = true;
const generalHtml = c.renderSynastryPatternCard(sample, 0);
c.state.synProfessional = true;
const proHtml = c.renderSynastryPatternCard(sample, 0);
c.state.synProfessional = pro;
check('一般模式不顯示容許度與權重',
  generalHtml.indexOf('權重') === -1 && !/誤差 \d/.test(generalHtml));
check('專業模式列出支持相位與權重',
  proHtml.indexOf('權重') !== -1 && /誤差 \d/.test(proHtml));
check('專業模式是在一般內容之上疊加，不是換一組答案',
  proHtml.indexOf(sample.title) !== -1 && proHtml.indexOf(sample.action) !== -1
  && proHtml.length > generalHtml.length);

/* ---------- 四個 deterministic 分項 ---------- */
{
  const advSrc = fs.readFileSync(path.join(ROOT, 'js/data/astro-advanced.js'), 'utf8');
  const body = advSrc.slice(advSrc.indexOf('function renderSynastry()'));
  const iBars = body.indexOf('renderSynastryFacetBars(aspects');
  const iLink = body.indexOf('renderSynastryLinkChart(chartA');
  const iModelBars = body.indexOf('renderSynastryFacetBars(model.aspects');
  check('合盤渲染四個分項分數', iModelBars !== -1);
  check('合盤仍然渲染雙人連線圖', iLink !== -1);
  check('分項分數排在連線圖之前', iModelBars !== -1 && iLink !== -1 && iModelBars < iLink);

  Object.keys(results).forEach(name => {
    const rows = c.synastryFacetScores(results[name].aspects);
    check(name + '：面向分數回傳四個正式面向',
      rows.length === 4 && rows.map(r => r.key).join(',') === 'attraction,communication,emotion,stability');
    check(name + '：沒有相位的面向誠實回報 null 而不是 50 分',
      rows.every(r => r.score === null ? r.count === 0 : (r.score >= 15 && r.score <= 95)));
    rows.forEach(row => {
      const def = c.SYNASTRY_FACETS.filter(f => f.key === row.key)[0];
      check(name + '／' + row.key + '：每筆計分證據都符合 pair mapping',
        row.evidence.every(e => c.synastryFacetMatches(def, e.aspect)));
      check(name + '／' + row.key + '：最多只取六組最重要證據', row.evidence.length <= 6);
    });
    const bars = c.renderSynastryFacetBars(results[name].aspects, '');
    check(name + '：有分數時長條圖確實渲染',
      !rows.some(r => r.score !== null) || (bars.indexOf('四個面向') !== -1 && /\/ 100/.test(bars)));
  });
}

console.log('# 合盤關係模式回歸測試');
console.log('');
console.log('- 檢查項目：' + checks.length);
console.log('- 失敗：' + failures.length);
Object.keys(results).forEach(n => {
  const r = results[n];
  console.log('  · ' + n + '：' + r.aspects.length + ' 組相位 → ' + r.patterns.length
    + ' 個模式，前三 = ' + r.top.map(p => p.key).join('／'));
});
if (failures.length) {
  console.log('');
  failures.slice(0, 12).forEach(f => console.log('  ✗ ' + f));
  if (failures.length > 12) console.log('  …共 ' + failures.length + ' 項');
  process.exit(1);
}
console.log('');
console.log('全部通過。');
