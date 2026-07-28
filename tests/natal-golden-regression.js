#!/usr/bin/env node
/* 12 張 Golden Charts × 54 題的批次回歸測試。
   --update 會更新基準快照與品質報告；一般執行則比對既有快照。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT = path.join(__dirname, 'snapshots', 'natal-topic-baseline.json');
const REPORT_JSON = path.join(__dirname, 'reports', 'natal-topic-quality.json');
const REPORT_MD = path.join(__dirname, 'reports', 'natal-topic-quality.md');
const HUMAN_REVIEW_MD = path.join(__dirname, 'reports', 'natal-topic-human-review.md');

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
    'js/data/astrology-natal-topics-data.js','js/data/card-images.js','js/data/reading-data.js','js/data/reading-rich-data.js','js/app.js','js/data/astro-advanced.js','tests/golden-charts.js'
  ].forEach(file => vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'), c, {filename:file}));
  c.ensureAstrologyBodyKeys();
  return c;
}
function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,16); }
function plain(value) { return JSON.parse(JSON.stringify(value)); }
function ensureDir(file) { fs.mkdirSync(path.dirname(file), {recursive:true}); }

const c = loadRuntime();
const questionCount = Object.values(c.NATAL_TOPIC_QUESTIONS).reduce((n, qs) => n + qs.length, 0);
if (questionCount !== 54) throw new Error('Question Library 題數改變：預期 54，實際 ' + questionCount);
if (c.GOLDEN_TEST_CHARTS.length < 12) throw new Error('Golden Charts 少於 12 張');
const allQuestions = Object.values(c.NATAL_TOPIC_QUESTIONS).flat();
const duplicateValues = (values) => values.filter((value,index) => values.indexOf(value) !== index);
const duplicateIds = [...new Set(duplicateValues(allQuestions.map(q => q.id)))];
const duplicateTitles = [...new Set(duplicateValues(allQuestions.map(q => q.title.replace(/[？?]/g,'').trim())))];
const duplicateFocuses = [...new Set(duplicateValues(allQuestions.map(q => q.questionFocus)))];
const duplicateTargetSignatures = [...new Set(duplicateValues(allQuestions.map(q => (q.answerTargets||[]).slice().sort().join('|'))))].filter(Boolean);
if (duplicateIds.length) throw new Error('Question Library 有重複 id：' + duplicateIds.join(', '));
if (duplicateTitles.length) throw new Error('Question Library 有重複題目：' + duplicateTitles.join(', '));
if (duplicateFocuses.length) throw new Error('Question Library 有重複 questionFocus：' + duplicateFocuses.join(', '));
if (duplicateTargetSignatures.length) throw new Error('Question Library 有完全相同的 answerTargets：' + duplicateTargetSignatures.join(' / '));
const removedDuplicateIds = ['love-longterm-value','career-monetize','family-core-lesson','health-emotion-body','health-rest-rhythm','social-attract-friend','general-standout-energy'];
const retainedIds = new Set(allQuestions.map(q => q.id));
const accidentallyRetained = removedDuplicateIds.filter(id => retainedIds.has(id));
if (accidentallyRetained.length) throw new Error('已合併的重複題目再次出現：' + accidentallyRetained.join(', '));

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
const visibleContentFailures = [];
function normalizeVisibleText(text) {
  return String(text||'').replace(/[，。！？、；：「」『』（）\s]/g,'').replace(/^(你|你的|比較|較容易|通常)/,'');
}
c.GOLDEN_TEST_CHARTS.forEach(chart => {
  Object.entries(c.NATAL_TOPIC_QUESTIONS).forEach(([topicId, questions]) => {
    /* 正式 UI 每次最多選 3 題；按相同契約分批覆蓋完整題庫，避免把 6-9 題
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
      const visibleSlots = [answer.headline,answer.summary].concat((answer.details||[]).map(d=>d.text)).filter(Boolean);
      const normalizedSlots = visibleSlots.map(normalizeVisibleText);
      if (normalizedSlots.some((value,index)=>value && normalizedSlots.indexOf(value)!==index)) {
        visibleContentFailures.push(chart.fixtureId + ': ' + answer.questionId + ' 有完全重複的可見內容');
      }
      if (/比較選項、考慮各方立場再決定|對這個主題具有較高代表性|感覺感覺|這個需要|這件事/.test(text)) {
        visibleContentFailures.push(chart.fixtureId + ': ' + answer.questionId + ' 含空泛或破碎句型');
      }
      if (/這項配置的影響比較細微|單一配置看不出明顯差異|訊號較弱|搭配其他線索一起看|關係態度偏向|自主程度需符合|合作節奏偏向|重新取得.+感|可保留的資源是|練習的重點不是壓抑/.test(text)) {
        visibleContentFailures.push(chart.fixtureId + ': ' + answer.questionId + ' 含意義不明或只替抽象欄位加標籤的句子');
      }
      if (answer.questionId === 'love-partner-type' && !/個性|自信|情緒|好奇|有禮|行動|樂觀|成熟|獨立|溫柔|感情深/.test(text)) {
        focusedFailures.push(chart.fixtureId + ': love-partner-type 沒有具體描述對象個性');
      }
      if (answer.questionId === 'career-work-mode' && !/受僱|接案|自由工作|創業|合夥|專案|正職|副業|顧問/.test(text)) {
        focusedFailures.push(chart.fixtureId + ': career-work-mode 沒有回答就業、自由工作或創業');
      }
      if (answer.questionId === 'family-origin-impact' && !/習慣|家庭|很早|期待|互動/.test(text)) {
        focusedFailures.push(chart.fixtureId + ': family-origin-impact 沒有描述原生家庭留下的慣性');
      }
      if (answer.questionId === 'family-inner-safety' && !/先做|每天|固定|寫|走路|運動|整理|說出|時間|作息/.test(text)) {
        focusedFailures.push(chart.fixtureId + ': family-inner-safety 沒有提供可執行的安定方法');
      }
      if (answer.questionId === 'general-inner-tension' && !/一方面|另一方面|先|接著/.test(text)) {
        focusedFailures.push(chart.fixtureId + ': general-inner-tension 沒有說明兩股力量與整合順序');
      }
      if (answer.questionFocus === 'suitable_roles' && !/角色|工作|職能|領導|溝通|分析|服務|創作|決策|執行|管理|研究|教學|品牌|公關|危機/.test(text)) {
        visibleContentFailures.push(chart.fixtureId + ': career-work-type 沒有回答工作角色或職能');
      }
      if (answer.questionFocus === 'suitable_environment' && !/環境|場域|團隊|氛圍|步調|制度|交流|作業/.test(text)) {
        visibleContentFailures.push(chart.fixtureId + ': career-work-env 沒有回答工作環境');
      }
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
      if (answer.questionId === 'health-lifestyle-fit') {
        if (!/生活步調/.test((answer.details||[]).map(d=>d.label).join('')) || !/判斷適不適合/.test((answer.details||[]).map(d=>d.label).join(''))) focusedFailures.push(chart.fixtureId + ': health-lifestyle-fit 缺少步調或適配判斷');
        if (!/固定|規律|時間|節奏|作息|運動|休息|行程|專注/.test(text)) focusedFailures.push(chart.fixtureId + ': health-lifestyle-fit 缺少具體習慣');
      }
      if (answer.questionId === 'love-conflict-repair' && !/第一步|修復|溝通|信任|感受|責任|對話/.test(text)) {
        focusedFailures.push(chart.fixtureId + ': love-conflict-repair 沒有回答關係修復');
      }
      if (answer.questionId === 'health-energy-drain' && !/情境|環境|負荷|消耗|耗能|缺少/.test(text)) {
        focusedFailures.push(chart.fixtureId + ': health-energy-drain 沒有回答耗能情境');
      }
      if (answer.questionId === 'study-mastery-evidence' && !/成果|證明|掌握|判斷標準|驗證/.test(text)) {
        focusedFailures.push(chart.fixtureId + ': study-mastery-evidence 沒有回答成果驗證');
      }
      if (answer.questionId === 'study-knowledge-application' && !/應用|用出來|行動|作品|輸出|實際/.test(text)) {
        focusedFailures.push(chart.fixtureId + ': study-knowledge-application 沒有回答知識應用');
      }
      if (answer.questionId === 'general-decision-basis' && !/判斷|原則|適合|訊號|選擇/.test(text)) {
        focusedFailures.push(chart.fixtureId + ': general-decision-basis 沒有回答重大選擇的依據');
      }
      });
    }
  });
});
const snapshot = { schemaVersion:1, chartCount:c.GOLDEN_TEST_CHARTS.length, questionCount, caseCount:cases.length, cases };
const report = {
  generatedAt:new Date().toISOString(), chartCount:c.GOLDEN_TEST_CHARTS.length, questionCount, caseCount:cases.length,
  coverage, quality:{validatorFlags:flags, flagBreakdown, forbiddenLeaks, emptyAnswers, undefinedLeaks, focusedFailures, visibleContentFailures},
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
  `- Visible content failures: ${visibleContentFailures.length}`,
  `- Baseline hash: ${report.baselineHash}`,'',
  '## Golden charts','',
  ...report.charts.map(x=>`- \`${x.id}\`: ${x.label}`),''
].join('\n');
const reviewChartId = c.GOLDEN_TEST_CHARTS[0].fixtureId;
const questionById = new Map(allQuestions.map(q => [q.id,q]));
const topicLabels = { love:'愛情', career:'事業', family:'家庭', health:'健康', wealth:'財運', social:'人際', study:'學習', general:'綜合' };
const reviewLines = ['# 人生主題分析人工閱讀稿','',`測試命盤：${reviewChartId}`,'','此檔案用來逐題人工檢查正文是否直接、具體且沒有區塊重複。',''];
Object.keys(c.NATAL_TOPIC_QUESTIONS).forEach(topicId => {
  reviewLines.push('## ' + (topicLabels[topicId] || topicId),'');
  cases.filter(x => x.chartId === reviewChartId && x.topicId === topicId).forEach(x => {
    const q = questionById.get(x.questionId);
    reviewLines.push('### ' + (q ? q.title : x.questionId),'',x.headline,'',x.summary,'');
    x.details.forEach(d => reviewLines.push('- **' + d.label + '**：' + d.text));
    if (x.caution) reviewLines.push('- **留意**：' + x.caution);
    reviewLines.push('');
  });
});
const humanReviewMarkdown = reviewLines.join('\n');

if (process.argv.includes('--update')) {
  ensureDir(SNAPSHOT); ensureDir(REPORT_JSON); ensureDir(HUMAN_REVIEW_MD);
  fs.writeFileSync(SNAPSHOT, JSON.stringify(snapshot,null,2)+'\n');
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(REPORT_MD, markdown+'\n');
  fs.writeFileSync(HUMAN_REVIEW_MD, humanReviewMarkdown+'\n');
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
if (coverage.generalFallback.length || coverage.planetCategoryPresent !== coverage.planetCategoryExpected || forbiddenLeaks || emptyAnswers || undefinedLeaks || focusedFailures.length || visibleContentFailures.length) {
  if (focusedFailures.length) console.error(focusedFailures.join('\n'));
  if (visibleContentFailures.length) console.error(visibleContentFailures.join('\n'));
  process.exitCode = 1;
}
