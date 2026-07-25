#!/usr/bin/env node
/* 12 張 Golden Charts × 56 題的批次回歸測試。
   --update 會更新基準快照與品質報告；一般執行則比對既有快照。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT = path.join(__dirname, 'snapshots', 'natal-topic-baseline.json');
const REPORT_JSON = path.join(__dirname, 'reports', 'natal-topic-quality.json');
const REPORT_MD = path.join(__dirname, 'reports', 'natal-topic-quality.md');

function element() { return { innerHTML:'', style:{}, classList:{add(){},remove(){}}, addEventListener(){}, setAttribute(){}, appendChild(){}, querySelector(){return null;}, querySelectorAll(){return [];} }; }
function loadRuntime() {
  const elements = {};
  const c = { console, setTimeout, clearTimeout, URL, Intl, Date, Math, JSON, Promise };
  c.window = c; c.navigator = {}; c.localStorage = { getItem(){return null;}, setItem(){} };
  c.document = { head:element(), body:element(), documentElement:element(), getElementById(id){return elements[id]||(elements[id]=element());}, querySelector(){return null;}, querySelectorAll(){return [];}, addEventListener(){}, createElement:element };
  vm.createContext(c);
  [
    'js/data/astrology-core-data.js','js/data/astrology-points-data.js','js/data/astrology-placement-templates.js',
    'js/data/astrology-aspect-data.js','js/data/astrology-knowledge-layer.js','js/data/astrology-knowledge-dataset.js',
    'js/data/astrology-natal-topics-data.js','js/data/card-images.js','js/data/reading-data.js','js/app.js','tests/golden-charts.js'
  ].forEach(file => vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'), c, {filename:file}));
  c.ensureAstrologyBodyKeys();
  return c;
}
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,16); }
function plain(value) { return JSON.parse(JSON.stringify(value)); }
function ensureDir(file) { fs.mkdirSync(path.dirname(file), {recursive:true}); }

const c = loadRuntime();
const questionCount = Object.values(c.NATAL_TOPIC_QUESTIONS).reduce((n, qs) => n + qs.length, 0);
if (questionCount !== 56) throw new Error('Question Library 題數改變：預期 56，實際 ' + questionCount);
if (c.GOLDEN_TEST_CHARTS.length < 12) throw new Error('Golden Charts 少於 12 張');

const coverage = { questionFocusTotal:0, mapped:0, generalFallback:[], categoryTotal:0, planetCategoryExpected:0, planetCategoryPresent:0 };
Object.values(c.NATAL_TOPIC_QUESTIONS).forEach(qs => qs.forEach(q => {
  coverage.questionFocusTotal++;
  const category = c.QUESTIONFOCUS_HOUSE_CATEGORY[q.questionFocus];
  if (category) coverage.mapped++; else coverage.generalFallback.push(q.questionFocus);
}));
const categories = [...new Set(Object.values(c.QUESTIONFOCUS_HOUSE_CATEGORY))];
coverage.categoryTotal = categories.length;
coverage.planetCategoryExpected = c.GOLDEN_PLANET_KEYS.length * categories.length;
c.GOLDEN_PLANET_KEYS.forEach(p => categories.forEach(cat => { if (c.PLANET_TOPIC_KNOWLEDGE[p] && c.PLANET_TOPIC_KNOWLEDGE[p][cat]) coverage.planetCategoryPresent++; }));

const forbidden = /角宮位置|角宮對分|canonicalKey|sourceRoles|evidenceBias|代表性較高|權重/;
const cases = [];
let flags = 0, forbiddenLeaks = 0, emptyAnswers = 0, undefinedLeaks = 0;
const flagBreakdown = {};
const focusedFailures = [];
c.GOLDEN_TEST_CHARTS.forEach(chart => {
  Object.entries(c.NATAL_TOPIC_QUESTIONS).forEach(([topicId, questions]) => {
    /* 正式 UI 每次最多選 3 題；按相同契約分批覆蓋完整 56 題，避免把 6-8 題
       硬塞進一次呼叫而產生正式產品永遠不會出現的 primary-evidence 警告。 */
    for (let start = 0; start < questions.length; start += 3) {
      const batch = questions.slice(start, start + 3);
      const result = c.analyzeNatalTopic(chart, topicId, batch.map(q=>q.id), false);
      flags += result.qualityFlags.length;
      result.qualityFlags.forEach(flag => { flagBreakdown[flag.check || 'unknown'] = (flagBreakdown[flag.check || 'unknown'] || 0) + 1; });
      result.answers.forEach(answer => {
      const text = [answer.headline,answer.summary].concat((answer.details||[]).map(d=>d.text),[answer.caution||'']).join(' ');
      if (forbidden.test(text)) forbiddenLeaks++;
      if (!answer.headline || !answer.summary) emptyAnswers++;
      if (/undefined|NaN/.test(text)) undefinedLeaks++;
      cases.push({
        chartId:chart.fixtureId, topicId, questionId:answer.questionId,
        headline:answer.headline, summary:answer.summary,
        details:(answer.details||[]).map(d=>({label:d.label,text:d.text})), caution:answer.caution||'',
        primary:answer.primaryEvidence ? answer.primaryEvidence.canonicalKey : null,
        qualityFlags:plain(result.qualityFlags.filter(f => String(f.note||'').indexOf(answer.questionId)!==-1)),
      });
      if (answer.questionId === 'love-meet-scene') {
        const hasVenue = /工作|活動|聚會|圈|社團|旅行|進修|講座|場合|場域|往來|合作|興趣|朋友|家庭/.test(text);
        if (!hasVenue) focusedFailures.push(chart.fixtureId + ': love-meet-scene 沒有具體場合');
      }
      if (answer.questionId === 'family-core-lesson') {
        const detailTexts = (answer.details||[]).map(d=>d.text);
        if (detailTexts.length < 2 || detailTexts[0] === detailTexts[1]) focusedFailures.push(chart.fixtureId + ': family-core-lesson 兩個細節重複');
        if (!/表達|確認|責任|範圍|對話|分工|討論|說清楚|尊重|冷靜|縮小|承諾|感受|事實/.test(detailTexts[1]||'')) focusedFailures.push(chart.fixtureId + ': family-core-lesson 缺少可練習的相處方式');
      }
      if (answer.questionId === 'health-lifestyle-fit') {
        if (!/生活步調/.test((answer.details||[]).map(d=>d.label).join('')) || !/判斷適不適合/.test((answer.details||[]).map(d=>d.label).join(''))) focusedFailures.push(chart.fixtureId + ': health-lifestyle-fit 缺少步調或適配判斷');
        if (!/固定|規律|時間|節奏|作息|運動|休息|行程|專注/.test(text)) focusedFailures.push(chart.fixtureId + ': health-lifestyle-fit 缺少具體習慣');
      }
      });
    }
  });
});
const snapshot = { schemaVersion:1, chartCount:c.GOLDEN_TEST_CHARTS.length, questionCount, caseCount:cases.length, cases };
const report = {
  generatedAt:new Date().toISOString(), chartCount:c.GOLDEN_TEST_CHARTS.length, questionCount, caseCount:cases.length,
  coverage, quality:{validatorFlags:flags, flagBreakdown, forbiddenLeaks, emptyAnswers, undefinedLeaks, focusedFailures},
  baselineHash:hash(snapshot), charts:plain(c.GOLDEN_CHART_SPECS.map(x=>({id:x.id,label:x.label}))),
};
const markdown = [
  '# Natal Topic Golden Regression Report','',
  `- Golden charts: ${report.chartCount}`,
  `- Questions per chart: ${report.questionCount}`,
  `- Total generated answers: ${report.caseCount}`,
  `- QuestionFocus mapping: ${coverage.mapped}/${coverage.questionFocusTotal} (${Math.round(coverage.mapped/coverage.questionFocusTotal*100)}%)`,
  `- Planet × category knowledge coverage: ${coverage.planetCategoryPresent}/${coverage.planetCategoryExpected} (${Math.round(coverage.planetCategoryPresent/coverage.planetCategoryExpected*100)}%)`,
  `- General fallback questionFocus: ${coverage.generalFallback.length}`,
  `- Validator flags: ${flags}`,
  ...Object.keys(flagBreakdown).sort().map(key=>`  - ${key}: ${flagBreakdown[key]}`),
  `- Forbidden technical-term leaks: ${forbiddenLeaks}`,
  `- Empty answers: ${emptyAnswers}`,
  `- undefined/NaN leaks: ${undefinedLeaks}`,
  `- Focused scenario failures: ${focusedFailures.length}`,
  `- Baseline hash: ${report.baselineHash}`,'',
  '## Golden charts','',
  ...report.charts.map(x=>`- \`${x.id}\`: ${x.label}`),''
].join('\n');

if (process.argv.includes('--update')) {
  ensureDir(SNAPSHOT); ensureDir(REPORT_JSON);
  fs.writeFileSync(SNAPSHOT, JSON.stringify(snapshot,null,2)+'\n');
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(REPORT_MD, markdown+'\n');
  console.log('Updated snapshot:', path.relative(ROOT,SNAPSHOT));
} else {
  if (!fs.existsSync(SNAPSHOT)) throw new Error('缺少基準快照；先執行 npm run test:golden:update');
  const baseline = JSON.parse(fs.readFileSync(SNAPSHOT,'utf8'));
  if (JSON.stringify(baseline) !== JSON.stringify(snapshot)) {
    console.error('Golden snapshot changed. Current hash:', report.baselineHash, 'Baseline hash:', hash(baseline));
    process.exitCode = 1;
  }
}
console.log(markdown);
if (coverage.generalFallback.length || coverage.planetCategoryPresent !== coverage.planetCategoryExpected || forbiddenLeaks || emptyAnswers || undefinedLeaks || focusedFailures.length) {
  if (focusedFailures.length) console.error(focusedFailures.join('\n'));
  process.exitCode = 1;
}
