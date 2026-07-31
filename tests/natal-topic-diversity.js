#!/usr/bin/env node
/* 六張刻意拉開結構的合成盤，驗證同一題不會只換占星名稱後輸出同一結論。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const REPORT = path.join(__dirname, 'reports', 'natal-topic-diversity.md');

function element() { return { innerHTML:'', style:{}, classList:{add(){},remove(){}}, addEventListener(){}, setAttribute(){}, appendChild(){}, querySelector(){return null;}, querySelectorAll(){return [];} }; }
function loadRuntime() {
  const elements = {};
  const c = { console, setTimeout, clearTimeout, URL, Intl, Date, Math, JSON, Promise };
  c.window = c; c.location = {hostname:'localhost',search:''}; c.navigator = {};
  c.localStorage = { getItem(){return null;}, setItem(){}, removeItem(){} };
  c.document = { head:element(), body:element(), documentElement:element(), getElementById(id){return elements[id]||(elements[id]=element());}, querySelector(){return null;}, querySelectorAll(){return [];}, addEventListener(){}, createElement:element };
  vm.createContext(c);
  [
    'js/data/astrology-core-data.js','js/data/astrology-points-data.js','js/data/astrology-placement-templates.js',
    'js/data/astrology-aspect-data.js','js/data/astrology-knowledge-layer.js','js/data/astrology-knowledge-dataset.js',
    'js/data/astrology-natal-topics-data.js','js/data/card-images.js','js/data/reading-data.js','js/data/reading-rich-data.js',
    'js/app.js','js/data/astro-charts.js','js/data/astro-advanced.js','tests/golden-charts.js'
  ].forEach(file => vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'), c, {filename:file}));
  c.ensureAstrologyBodyKeys();
  return c;
}
function grams(text) {
  const value = String(text || '').replace(/[，。！？、；：「」『』（）\s]/g,'');
  const out = new Set();
  for (let i=0; i<value.length-2; i++) out.add(value.slice(i,i+3));
  return out;
}
function overlap(a,b) {
  const ga=grams(a), gb=grams(b);
  if (!ga.size || !gb.size) return 0;
  let same=0; ga.forEach(x=>{if(gb.has(x)) same++;});
  return same / Math.min(ga.size,gb.size);
}
const c = loadRuntime();
const specs = [
  { id:'venus_libra_7', label:'金星／天秤／第7宮主導', asc:0, mc:3, signShift:1, houseShift:1, overrides:{ Sun:[6,10], Moon:[6,7], Mercury:[6,3], Venus:[6,7], Mars:[6,5], Saturn:[2,3], Uranus:[8,9], Pluto:[10,11] } },
  { id:'saturn_capricorn_7', label:'土星／摩羯／第7宮主導', asc:3, mc:6, signShift:4, houseShift:4, overrides:{ Sun:[9,10], Moon:[9,4], Mercury:[9,3], Venus:[9,7], Mars:[9,6], Saturn:[9,7], Uranus:[11,12], Pluto:[1,2] } },
  { id:'uranus_aquarius_5', label:'天王星／水瓶／第5宮主導', asc:4, mc:7, signShift:7, houseShift:7, overrides:{ Sun:[10,1], Moon:[10,11], Mercury:[10,3], Venus:[10,7], Mars:[10,5], Uranus:[10,5], Saturn:[0,1], Pluto:[2,3] } },
  { id:'moon_cancer_4', label:'月亮／巨蟹／第4宮主導', asc:9, mc:0, signShift:10, houseShift:10, overrides:{ Sun:[3,10], Moon:[3,4], Mercury:[3,3], Venus:[3,7], Mars:[3,6], Saturn:[3,4], Uranus:[1,2], Pluto:[11,12] } },
  { id:'pluto_scorpio_8', label:'冥王星／天蠍／第8宮主導', asc:1, mc:4, signShift:2, houseShift:2, overrides:{ Sun:[7,10], Moon:[7,4], Mercury:[7,3], Venus:[7,7], Mars:[7,8], Saturn:[7,6], Uranus:[3,4], Pluto:[7,8] } },
  { id:'mercury_gemini_9', label:'水星／雙子／第9宮主導', asc:8, mc:11, signShift:5, houseShift:5, overrides:{ Sun:[2,10], Moon:[2,4], Mercury:[2,9], Venus:[2,7], Mars:[2,3], Jupiter:[2,11], Saturn:[2,6], Uranus:[6,7], Neptune:[2,4], Pluto:[9,11] } },
];
const charts = specs.map(c.goldenBuildChart);
const fingerprints = charts.map(chart=>c.natalChartFingerprint(chart,false));
if (new Set(fingerprints).size !== charts.length) throw new Error('不同合成盤產生相同 chartFingerprint');
c.state.natalTopicResult = {topicId:'love'};
c.state.natalTopicExpanded = {x:true};
c.resetNatalTopicAnalysisForChartChange();
if (c.state.natalTopicResult !== null || Object.keys(c.state.natalTopicExpanded).length) throw new Error('換盤時沒有清除舊的 topic analysis state');
const cards = [
  ['love','love-strength','感情'],
  ['social','social-strength','人際'],
  ['career','career-core-skill','工作'],
  ['family','family-role','家庭'],
  ['social','social-first-impression','第一印象'],
];
const rows = [];
cards.forEach(([topic,questionId,label]) => {
  const outputs = charts.map((chart,index) => {
    const result = c.analyzeNatalTopic(chart,topic,[questionId],false);
    if (!result.analysisKey.includes(result.chartFingerprint) || !result.analysisKey.includes(result.promptVersion) || !result.analysisKey.includes(result.knowledgeVersion)) throw new Error('analysisKey 缺少命盤或版本資訊');
    const answer = result.answers[0];
    return {
      chart:specs[index].label, label, headline:answer.headline, blindspot:answer.caution || '',
      semanticKey:answer.semanticKey || '', dominant:answer.semanticProfile && answer.semanticProfile.dominant && answer.semanticProfile.dominant.key,
      indicators:(answer.ranked||[]).slice(0,3).map(e=>`${e.placement} [${e.weight}/${e.selectionScore}]`).join('；'),
      fallback:(answer.debug && answer.debug.fallbackUsed || []).map(x=>x.reason).join('；') || '無',
    };
  });
  const identical = outputs.filter((x,i)=>outputs.findIndex(y=>y.headline===x.headline)!==i);
  if (identical.length) throw new Error(label + '有完全相同主結論：' + identical.map(x=>x.chart + ' [' + x.semanticKey + '] ' + x.headline).join('｜'));
  const uniqueSemantic = new Set(outputs.map(x=>x.semanticKey));
  if (uniqueSemantic.size < 3) throw new Error(label + '語義分化不足，六張盤只有 ' + uniqueSemantic.size + ' 種 semantic key');
  for (let i=0;i<outputs.length;i++) for(let j=i+1;j<outputs.length;j++) {
    const rate=overlap(outputs[i].headline,outputs[j].headline);
    if (rate>.88) throw new Error(`${label}文字重複率過高：${outputs[i].chart} / ${outputs[j].chart} = ${Math.round(rate*100)}%`);
  }
  rows.push(...outputs);
});

const fallbackChart = JSON.parse(JSON.stringify(charts[0]));
Object.keys(fallbackChart.planets).forEach(key=>{ if (fallbackChart.planets[key].house === 11) fallbackChart.planets[key].house = 12; });
const fallbackProbe = c.analyzeNatalTopic(fallbackChart,'social',['social-group-role'],false).answers[0];
if (!(fallbackProbe.debug && fallbackProbe.debug.fallbackUsed && fallbackProbe.debug.fallbackUsed.length)) {
  throw new Error('空宮 fallback 沒有記錄 fallbackUsed/source/reason');
}

const lines = [
  '# Natal Topic Diversity Comparison','',
  '- Synthetic charts: 6',
  '- Compared cards: 感情、人際、工作、家庭、第一印象',
  '- Failure threshold: identical headline, fewer than 3 semantic keys, or pairwise trigram overlap above 88%','',
];
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname,'snapshots','natal-topic-baseline.json'),'utf8'));
const beforeAfterIds = ['fire_angular','earth_saturn_career','water_lunar_home'];
lines.push('## 三張既有測試盤：修改前後','');
beforeAfterIds.forEach(chartId => {
  const chart = c.GOLDEN_TEST_CHARTS.find(x=>x.fixtureId===chartId);
  lines.push('### '+chart.fixtureLabel,'');
  cards.forEach(([topic,questionId,label]) => {
    const before = baseline.cases.find(x=>x.chartId===chartId && x.topicId===topic && x.questionId===questionId);
    const after = c.analyzeNatalTopic(chart,topic,[questionId],false).answers[0];
    lines.push('- '+label+'修改前：'+(before ? before.headline : '基準無資料'));
    lines.push('- '+label+'修改後：'+after.headline);
  });
  lines.push('');
});
cards.forEach(([, ,label]) => {
  lines.push('## '+label,'');
  rows.filter(x=>x.label===label).forEach(x => {
    lines.push('### '+x.chart,'', '- 主結論：'+x.headline, '- 留意：'+x.blindspot, '- 中間語義：'+x.semanticKey+'（主導 '+x.dominant+'）', '- 前三指標：'+x.indicators, '- fallback：'+x.fallback,'');
  });
});
fs.mkdirSync(path.dirname(REPORT),{recursive:true});
fs.writeFileSync(REPORT,lines.join('\n')+'\n');
console.log('Natal topic diversity: 6 charts × 5 cards passed');
console.log('Report:',path.relative(ROOT,REPORT));
