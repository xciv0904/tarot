#!/usr/bin/env node
/* 戀愛／伴侶合盤 Golden：固定星體經度，所有相位與分數都由正式 engine 計算。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const failures = [], checks = [];
function check(name, ok, detail) { checks.push(name); if (!ok) failures.push(name + (detail ? '：' + detail : '')); }
function element() { return { innerHTML:'', style:{}, value:'', classList:{add(){},remove(){}}, addEventListener(){}, setAttribute(){}, appendChild(){}, querySelector(){return null;}, querySelectorAll(){return [];} }; }
function runtime() {
  const elements = {}, c = { console, setTimeout, clearTimeout, URL, Intl, Date, Math, JSON, Promise };
  c.window = c; c.navigator = {}; c.scrollTo = () => {};
  c.localStorage = { getItem(){return null;}, setItem(){}, removeItem(){} };
  c.location = { hostname:'example.com', search:'' };
  c.document = { head:element(), body:element(), documentElement:element(),
    getElementById(id){ return elements[id] || (elements[id] = element()); }, querySelector(){return null;}, querySelectorAll(){return [];}, addEventListener(){}, createElement:element };
  vm.createContext(c);
  vm.runInContext(read('assets/vendor/astronomy-engine-2.1.19.min.js'), c, {filename:'astronomy'});
  ['js/data/astrology-core-data.js','js/data/astrology-points-data.js','js/data/astrology-placement-templates.js',
   'js/data/astrology-aspect-data.js','js/data/astrology-knowledge-layer.js','js/data/astrology-knowledge-dataset.js',
   'js/data/astrology-natal-topics-data.js','js/data/card-images.js','js/data/reading-data.js','js/data/reading-interpretation.js',
   'js/data/reading-rich-data.js','js/app.js','js/data/astro-charts.js','js/data/astro-advanced.js']
    .forEach(f => vm.runInContext(read(f), c, {filename:f}));
  c.ensureAstrologyBodyKeys(); return c;
}
const c = runtime();
function chart(lons, ascSign) {
  const ch = { planets:{}, points:{}, aspects:[], houseCusps:[], asc:ascSign * 30 + 15, mc:0, ascSign, houseSystem:'placidus' };
  c.ASTRO_PLANET_BODY_KEYS.forEach(k => { const lon = lons[k]; ch.planets[k] = { lon, sign:Math.floor(lon / 30), deg:lon % 30, house:1, retro:false }; });
  return ch;
}

/* A：摩羯上升、處女太陽、獅子月亮。B：巨蟹太陽、巨蟹月亮，出生時間未知。
   其餘經度固定，讓正式 computeCrossChartAspects() 產生一組可重現的實際 cross-aspects。 */
const chartA = chart({Sun:165,Moon:135,Mercury:201.3,Venus:208.6,Mars:52.5,Jupiter:268.9,Saturn:310,Uranus:73.1,Neptune:75.5,Pluto:203.3}, 9);
const chartB = chart({Sun:105,Moon:116,Mercury:227.5,Venus:119.9,Mars:252.3,Jupiter:289.4,Saturn:118.3,Uranus:10.8,Neptune:61.3,Pluto:349.1}, 0);
const model = c.buildSynastryResultModel(chartA, chartB, false, true, 'love');
const fixedNow = new Date('2026-08-25T00:00:00.000Z');
const timeline = c.buildSynastryTimeline(chartA, chartB, false, true, fixedNow);
const prompt = c.buildSynastryAiText(model, timeline);

check('案例身分：A 摩羯上升／處女太陽／獅子月亮', chartA.ascSign === 9 && chartA.planets.Sun.sign === 5 && chartA.planets.Moon.sign === 4);
check('案例身分：B 巨蟹太陽／巨蟹月亮', chartB.planets.Sun.sign === 3 && chartB.planets.Moon.sign === 3);
check('既有 compatibility score 固定為 52', model.score === 52, '實際 ' + model.score);
check('四個分項全部存在', model.subscores.length === 4 && model.subscores.map(x => x.key).join(',') === 'attraction,communication,emotion,stability');
check('分項不是隨機值', JSON.stringify(model.subscores.map(x => x.score)) === JSON.stringify(c.synastryFacetScores(model.aspects).map(x => x.score)));
model.subscores.forEach(row => check(row.zh + ' 的每筆證據都命中正式 pair mapping', row.evidence.every(e => c.synastryFacetMatches(c.SYNASTRY_FACETS.filter(f => f.key === row.key)[0], e.aspect))));

const schemaKeys = ['relationshipVerdict','attraction','whatWorks','conflictPattern','hiddenRisk','longTermPotential','actionAdvice'];
check('AI output schema 七欄完整', schemaKeys.every(k => prompt.indexOf(k + '：') !== -1));
check('AI 不得重算分數或日期', /不得修改、重算或創造日期/.test(prompt));
check('舊寬泛 prompt 已移除', prompt.indexOf('分析彼此的默契、互動優勢與需要磨合的課題') === -1);
check('未知時間限制進入 AI prompt', /禁止使用：上升 ASC、天頂 MC／天底 IC、宮位/.test(prompt)
  && /出生時間未知一方的月亮精確相位/.test(prompt));
check('未知時間者的月亮精確相位在總分前排除', model.aspects.every(a => a.bKey !== 'Moon')
  && model.rawAspects.some(a => a.bKey === 'Moon'));
check('未知時間者的月亮不進時間線 evidence', timeline.recent.concat(timeline.mid).every(w => w.evidence.every(e => !(e.owner === 'B' && e.targetKey === 'Moon'))));
check('近期窗口來自實際行運', timeline.recent.length > 0 && timeline.recent.every(w => w.evidence.length > 0 && w.evidence.every(e => typeof e.aspect.orb === 'number')));
check('中期窗口來自實際行運', timeline.mid.length > 0 && timeline.mid.every(w => w.evidence.length > 0 && w.evidence.every(e => typeof e.aspect.orb === 'number')));

c.state.astroResult = chartA; c.state.synResult = chartB;
c.state.astroUnknownTime = false; c.state.synUnknownTime = true;
c.state.synRelationship = 'love'; c.state.synTimelineTab = 'base'; c.state.synAnalysis = null; c.state.synTimeline = null;
const baseHtml = c.renderSynastry();
check('結果頁第一屏先顯示 52 / 100', baseHtml.indexOf('你們的關係相性') !== -1 && baseHtml.indexOf('>52<') !== -1
  && baseHtml.indexOf('你們的關係相性') < baseHtml.indexOf('>本人<'));
['心動與吸引','溝通默契','情緒相處','長期穩定'].forEach(label => check('結果頁顯示分項「' + label + '」', baseHtml.indexOf(label) !== -1));
['你們為什麼會互相吸引？','相處起來最順的地方','最容易吵起來的地方','這段關係最大的隱患','如果真的交往，走長久容易嗎？','如果想讓關係更順'].forEach(label => check('結果頁顯示 section「' + label + '」', baseHtml.indexOf(label) !== -1));
check('出生時間限制在結果頁可見', baseHtml.indexOf('對方出生時間未知，因此不使用對方上升、宮位') !== -1);
['recent','mid','long'].forEach(tab => {
  c.state.synTimelineTab = tab;
  const html = c.renderSynastry();
  check(tab + ' 頁籤可 render 且不進全域 fallback', html.length > 500 && html.indexOf('這個畫面出了點問題') === -1);
});

const renderedText = schemaKeys.map(k => model.analysis[k].body.join(' ')).join(' ');
check('關係判讀能直接回答合不合', /相性|磨合|靠近|卡住/.test(model.analysis.relationshipVerdict.body[0]));
check('衝突循環包含雙方反應', /一方/.test(model.analysis.conflictPattern.body[0]) && /(另一方|對方)/.test(model.analysis.conflictPattern.body[0]));
check('行動建議不是抽象口號', model.analysis.actionAdvice.body.every(x => !/^(多溝通|互相理解|給彼此空間|需要找到平衡)/.test(x)));
['需要彼此理解','需要多溝通','彼此具有互補性','既有挑戰也有機會','存在成長空間','需要找到平衡','容易產生摩擦','價值觀有所不同','關係具有潛力'].forEach(term => {
  check('anti-vagueness：不單獨輸出「' + term + '」', renderedText.indexOf(term) === -1);
});

console.log('# 兩人關係 Golden Test');
console.log('');
console.log('- 案例：戀愛／伴侶；A 摩羯上升、處女太陽、獅子月亮；B 出生時間未知、巨蟹太陽、巨蟹月亮');
console.log('- Compatibility：' + model.score);
console.log('- Subscores：' + model.subscores.map(x => x.zh + ' ' + (x.score == null ? '資料不足' : x.score)).join('／'));
console.log('- relationshipVerdict：' + model.analysis.relationshipVerdict.body.join(' '));
console.log('- attraction：' + model.analysis.attraction.body.join(' '));
console.log('- whatWorks：' + model.analysis.whatWorks.body.join(' '));
console.log('- conflictPattern：' + model.analysis.conflictPattern.body.join(' '));
console.log('- hiddenRisk：' + model.analysis.hiddenRisk.body.join(' '));
console.log('- longTermPotential：' + model.analysis.longTermPotential.body.join(' '));
console.log('- actionAdvice：' + model.analysis.actionAdvice.body.join('／'));
console.log('- Timeline：近期 ' + timeline.recent.length + ' 個窗口；中期 ' + timeline.mid.length + ' 個窗口');
console.log('- 檢查項目：' + checks.length);
console.log('- 失敗：' + failures.length);
if (failures.length) { failures.forEach(x => console.log('  ✗ ' + x)); process.exit(1); }
console.log(''); console.log('全部通過。');
