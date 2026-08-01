#!/usr/bin/env node
/* 全題庫主題分析稽核。每次執行都從 NATAL_TOPIC_QUESTIONS 讀取實際題數，
   不維護另一份容易過期的手寫清單。報告涵蓋每題資料設定、三張結構不同命盤的
   輸出差異、fallback、可讀性、去重與占星依據。正式驗收固定取五張
   結構不同的 Golden Charts；目前直接覆蓋全部十二張，共 54 × 12 = 648 份答案。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const REPORT_JSON = path.join(__dirname, 'reports', 'topic-audit-report.json');
const REPORT_MD = path.join(__dirname, 'reports', 'topic-audit-report.md');

function element() {
  return { innerHTML:'', style:{}, classList:{add(){},remove(){}}, addEventListener(){},
    setAttribute(){}, appendChild(){}, querySelector(){return null;}, querySelectorAll(){return [];} };
}
function loadRuntime() {
  const elements = {};
  const c = { console, setTimeout, clearTimeout, URL, Intl, Date, Math, JSON, Promise };
  c.window = c; c.location = { hostname:'localhost', search:'' }; c.navigator = {};
  c.localStorage = { getItem(){return null;}, setItem(){}, removeItem(){} };
  c.document = { head:element(), body:element(), documentElement:element(),
    getElementById(id){return elements[id]||(elements[id]=element());},
    querySelector(){return null;}, querySelectorAll(){return [];},
    addEventListener(){}, createElement:element };
  vm.createContext(c);
  [
    'js/data/astrology-core-data.js','js/data/astrology-points-data.js',
    'js/data/astrology-placement-templates.js','js/data/astrology-aspect-data.js',
    'js/data/astrology-knowledge-layer.js','js/data/astrology-knowledge-dataset.js',
    'js/data/astrology-natal-topics-data.js','js/data/card-images.js',
    'js/data/reading-data.js','js/data/reading-interpretation.js','js/data/reading-rich-data.js','js/app.js',
    'js/data/astro-charts.js','js/data/astro-advanced.js','tests/golden-charts.js',
  ].forEach(file => vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'), c, {filename:file}));
  c.ensureAstrologyBodyKeys();
  return c;
}
function plain(value) { return JSON.parse(JSON.stringify(value)); }
function textKey(value) { return String(value||'').replace(/[，。！？、；：「」『』（）\s]/g,''); }
function grams(value) {
  const s=textKey(value), out=new Set();
  if (s.length < 3) { if (s) out.add(s); return out; }
  for(let i=0;i<s.length-2;i++) out.add(s.slice(i,i+3));
  return out;
}
function similarity(a,b) {
  const ga=grams(a), gb=grams(b);
  if (!ga.size || !gb.size) return 0;
  let same=0; ga.forEach(x=>{if(gb.has(x)) same++;});
  return same / Math.min(ga.size,gb.size);
}
function sentences(text) { return String(text||'').split(/[。！？]/).map(x=>x.trim()).filter(Boolean); }
function maxSentenceLength(text) { return Math.max(0,...sentences(text).map(x=>[...x].length)); }
function ratio(n,d) { return d ? Math.round(n/d*1000)/1000 : 0; }

const c = loadRuntime();
const chartSamples = c.GOLDEN_TEST_CHARTS.slice(0, 12);
const questions = [];
Object.entries(c.NATAL_TOPIC_QUESTIONS).forEach(([topicId, list]) => {
  list.forEach(q=>questions.push({topicId,q}));
});
const banned = [
  '核心動力是','主要資源是','補上第二步','需要重新運用','表達節奏流動',
  '對方感受到的是','卡點常是','遇到需要「','先辨認模式，再選擇不同回應',
  '用可檢查的行動節點取代懷疑','用可檢查的行動節點取代反覆自我懷疑',
];
const abstractWords = ['能量','傾向','模式','課題','需求','價值','方向','平衡','安全感','資源','動力','特質'];
const outputsByQuestion = {};
const outputsByChart = {};

questions.forEach(({topicId,q}) => {
  outputsByQuestion[q.id] = [];
  chartSamples.forEach(chart => {
    const answer = c.analyzeNatalTopic(chart, topicId, [q.id], false).answers[0];
    outputsByQuestion[q.id].push(answer);
    (outputsByChart[chart.fixtureId] || (outputsByChart[chart.fixtureId]=[])).push(answer);
  });
});

const records = questions.map(({topicId,q}) => {
  const answers=outputsByQuestion[q.id], errors=[], warnings=[];
  const contract=q.contract || c.NATAL_QUESTION_CONTRACTS[q.id];
  const category=c.QUESTIONFOCUS_HOUSE_CATEGORY[q.questionFocus] || '';
  const semanticDef=category && c.ASTRO_TOPIC_SEMANTIC_DATASET[category];
  const allText=answers.map(a=>[a.headline,a.summary].concat((a.details||[]).map(d=>d.text),[a.caution||'']).join('')).join('');
  let maxCrossChart=0;
  for(let i=0;i<answers.length;i++) for(let j=i+1;j<answers.length;j++) {
    if(answers[i].contractStatus==='insufficient'||answers[j].contractStatus==='insufficient') continue;
    maxCrossChart=Math.max(maxCrossChart,similarity(answers[i].headline,answers[j].headline));
  }
  const unsafeFallbacks=answers.filter(a=>a.primaryEvidence && a.primaryEvidence.fallbackUsed
    && a.primaryEvidence.fallbackSource !== 'houseRuler').length;
  const fallbacks=answers.filter(a=>a.primaryEvidence && a.primaryEvidence.fallbackUsed).length;
  const fallbackRatio=ratio(fallbacks,answers.length);
  const abstractCount=abstractWords.reduce((sum,w)=>sum+(allText.split(w).length-1),0);
  const abstractDensity=ratio(abstractCount,Math.max(1,[...allText].length));
  const longSentence=Math.max(...answers.map(a=>maxSentenceLength([a.headline,a.summary].concat((a.details||[]).map(d=>d.text),[a.caution||'']).join('。'))));
  const longestHeadline=Math.max(...answers.map(a=>[...String(a.headline||'')].length));
  const titleDetailRisk=Math.max(0,...answers.flatMap(a=>(a.details||[]).map(d=>similarity(q.title,d.label))));
  const headlineDetailRisk=Math.max(0,...answers.flatMap(a=>(a.details||[]).map(d=>similarity(a.headline,d.text))));
  const semanticKeys=[...new Set(answers.map(a=>a.semanticKey || (a.debug && a.debug.dominantDimension && a.debug.dominantDimension.key) || category).filter(Boolean))];
  const primaryKeys=[...new Set(answers.map(a=>a.primaryEvidence && a.primaryEvidence.canonicalKey).filter(Boolean))];
  const uniqueHeadlines=[...new Set(answers.map(a=>textKey(a.headline)))];

  if (!q.intent || !q.questionFocus || !(q.answerTargets||[]).length || !(q.detailLabels||[]).length) errors.push('題目缺少 intent、questionFocus、answerTargets 或 detailLabels');
  if (!contract || !contract.answerTarget || !(contract.requiredAnswerElements||[]).length
      || !(contract.allowedContentTypes||[]).length || !(contract.requiredEvidenceTypes||[]).length
      || !(contract.forbiddenPhrases||[]).length || !contract.goodAnswerExample || !(contract.badAnswerExamples||[]).length) errors.push('Question Contract 欄位不完整');
  if (!category || !semanticDef) errors.push('questionFocus 沒有專屬 knowledge projection');
  if (q.fieldOverride && !answers.every(a=>a.debug && a.debug.fieldOverrideApplied.length)) errors.push('fieldOverride 未進入內容規劃器');
  if (!answers.every(a=>a.debug && a.debug.answerTargetsApplied.length === q.answerTargets.length)) errors.push('answerTargets 未進入內容規劃器');
  if (!answers.every(a=>a.debug && a.debug.excludedTargetsApplied.length === q.excludedTargets.length)) errors.push('excludedTargets 未進入內容規劃器');
  if (!answers.every(a=>a.answerTarget === contract.answerTarget)) errors.push('answerTarget 未實際控制答案');
  if (!answers.every(a=>a.contractStatus === 'pass' || a.contractStatus === 'insufficient')) errors.push('答案未經 Question Contract 驗證');
  if (!answers.filter(a=>a.contractStatus==='pass').every(a=>(a.sectionOrder||[]).every(key=>a.sectionsByType&&a.sectionsByType[key]))) errors.push('Renderer 仍依賴未命名的陣列位置');
  if (titleDetailRisk >= .62) errors.push('大標題與分項標籤語意重複');
  if (longestHeadline > 30) errors.push('大標題超過 30 字');
  if (headlineDetailRisk >= .45) errors.push('大標題與小標題回答高度重複');
  const renderedAnswers=answers.filter(a=>a.contractStatus!=='insufficient');
  const renderedHeadlines=[...new Set(renderedAnswers.map(a=>textKey(a.headline)))];
  if (renderedAnswers.length > 1 && renderedHeadlines.length === 1 && primaryKeys.length > 1) errors.push('不同命盤更換主導指標後，主結論仍相同');
  else if (maxCrossChart >= .82) warnings.push('其中兩張測試盤的主結論較接近，原因是主導語義或落座相同');
  if (unsafeFallbacks >= 2) errors.push('多數測試盤落入無法追溯的通用 fallback');
  else if (fallbackRatio > 0) warnings.push('部分測試盤由空宮改採可追溯的宮主星資料');
  banned.forEach(term=>{if(allText.includes(term)) errors.push('出現禁用句型：'+term);});
  if (longSentence > 64) errors.push('存在超過 64 字的句子');
  else if (longSentence > 48) warnings.push('存在 49–64 字的句子');
  if (abstractDensity > .028) warnings.push('抽象名詞密度偏高');
  if (!answers.every(a=>a.primaryEvidence && (a.primaryEvidence.semanticSupport || a.primaryEvidence.reason))) errors.push('占星依據沒有指出正文支持關係');
  if (semanticKeys.length < 2 && primaryKeys.length > 1) warnings.push('不同命盤的中間語義維度變化較少');
  if (renderedAnswers.length > 1 && renderedHeadlines.length < 2) errors.push('不同命盤產生相同主句');
  const insufficientCount=answers.filter(a=>a.contractStatus==='insufficient').length;
  if (insufficientCount) warnings.push(`${insufficientCount}/${answers.length} 份答案未通過契約，已阻擋原文並顯示資料不足`);

  return {
    category:topicId,
    topicId,
    questionId:q.id,
    questionTitle:q.title,
    intent:q.intent,
    questionFocus:q.questionFocus,
    answerTarget:contract.answerTarget,
    answerTargets:plain(q.answerTargets||[]),
    requiredAnswerElements:plain(contract.requiredAnswerElements||[]),
    allowedContentTypes:plain(contract.allowedContentTypes||[]),
    excludedContentTypes:plain(contract.excludedContentTypes||[]),
    requiredEvidenceTypes:plain(contract.requiredEvidenceTypes||[]),
    forbiddenPhrases:plain(contract.forbiddenPhrases||[]),
    goodAnswerExample:contract.goodAnswerExample,
    badAnswerExamples:plain(contract.badAnswerExamples||[]),
    selectedKnowledgeSources:answers.map(a=>(a.ranked||[]).slice(0,3).map(e=>({
      key:e.canonicalKey, placement:e.placement, weight:e.weight,
      effectiveWeight:e.selectionScore == null ? e.weight : e.selectionScore,
    }))),
    rendererTemplate:'question-direct-answer-v1',
    title:q.title,
    subtitle:null,
    detailLabels:plain(q.detailLabels||[]),
    fallbackPath:answers.map(a=>(a.debug&&a.debug.fallbackUsed)||[]),
    semanticKeys,
    duplicateRisk:{titleDetail:Math.round(titleDetailRisk*100)/100,headlineDetail:Math.round(headlineDetailRisk*100)/100,crossChart:Math.round(maxCrossChart*100)/100},
    abstractionRisk:{density:abstractDensity,longestSentence:longSentence,longestHeadline},
    personalizationRisk:{distinctPrimarySources:primaryKeys.length,distinctHeadlines:uniqueHeadlines.length,fallbackRatio},
    outputSamples:answers.map((a,index)=>({
      chartId:chartSamples[index].fixtureId,
      headline:a.headline,
      details:(a.details||[]).map(d=>({label:d.label,text:d.text})),
      caution:a.caution||'',
      primary:a.primaryEvidence&&a.primaryEvidence.canonicalKey,
      answerTarget:a.answerTarget,
      contractStatus:a.contractStatus,
      contractErrors:plain(a.contractErrors||[]),
      sectionKeys:plain(a.sectionOrder||[]),
    })),
    warnings,
    failures:errors,
    result:errors.length?'FAIL':warnings.length?'WARNING':'PASS',
  };
});

/* 使用者實際會一次勾選多題；批次中的 usedPrimaryKeys／去重上下文，曾把
   「外型」「相處」「修復」重新替換成同一個通用行為。除了逐題測試，再把
   感情題整批產生一次，確保最後潤飾不會破壞題型語義。 */
const loveQuestionIds=(c.NATAL_TOPIC_QUESTIONS.love||[]).map(q=>q.id);
const strictLoveIds=['love-attract-type','love-appearance-vibe','love-relationship-style','love-conflict-repair'];
chartSamples.forEach(chart=>{
  const batch=c.analyzeNatalTopic(chart,'love',loveQuestionIds,false).answers||[];
  strictLoveIds.forEach(id=>{
    const answer=batch.find(a=>a.questionId===id);
    const record=records.find(r=>r.questionId===id);
    if(!answer||answer.contractStatus!=='pass') {
      const message='整批產生感情題時，答案未通過題型語義契約';
      if(record&&!record.failures.includes(message)) record.failures.push(message);
      if(record) record.result='FAIL';
    }
  });
  const wrong='會先表明立場，也願意在眾人面前承擔結果';
  batch.filter(a=>strictLoveIds.includes(a.questionId)).forEach(answer=>{
    const body=[answer.headline,answer.summary].concat((answer.details||[]).map(d=>d.text)).join('');
    if(!body.includes(wrong)) return;
    const record=records.find(r=>r.questionId===answer.questionId);
    const message='題型答案退回跨題共用行為句';
    if(record&&!record.failures.includes(message)) record.failures.push(message);
    if(record) record.result='FAIL';
  });
});

/* 同一張盤不同題目仍不可只換標題。只把高度近似記到兩題的 audit record。 */
Object.values(outputsByChart).forEach(answers => {
  for(let i=0;i<answers.length;i++) for(let j=i+1;j<answers.length;j++) {
    if(answers[i].contractStatus==='insufficient'||answers[j].contractStatus==='insufficient') continue;
    const score=similarity(answers[i].headline,answers[j].headline);
    if(score<.94) continue;
    [answers[i].questionId,answers[j].questionId].forEach(id=>{
      const r=records.find(x=>x.questionId===id);
      const message='同一命盤與其他題目的主句高度相同';
      if(!r.failures.includes(message)) r.failures.push(message);
      r.result='FAIL';
    });
  }
});

const templates={};
Object.entries(c.ASTRO_TOPIC_SEMANTIC_DATASET).forEach(([key,value])=>{
  ['phrase','summary','detail','caution'].forEach(slot=>{
    const template=value[slot]||'';
    if(!template)return;
    const signature=slot+'|'+template;
    (templates[signature]||(templates[signature]=[])).push(key);
  });
});
const sharedTemplates=Object.entries(templates).filter(([,keys])=>keys.length>=3).map(([signature,keys])=>({
  slot:signature.split('|')[0], template:signature.slice(signature.indexOf('|')+1),
  usedBy:keys, risk:/\{(gift|need|risk|drive|pace|social)\}/.test(signature)?'句型共用，結論由語義欄位決定':'可能固定核心結論',
}));
const counts={PASS:0,WARNING:0,FAIL:0}; records.forEach(r=>counts[r.result]++);
const acceptanceMatrix=records.map(r=>({
  questionId:r.questionId,
  question:r.questionTitle,
  answerTarget:r.answerTarget,
  mustAnswer:r.allowedContentTypes,
  forbidden:r.excludedContentTypes.concat(r.forbiddenPhrases),
  actualOutput:r.outputSamples.map(s=>`${s.chartId}：${s.headline}`),
  direct:r.outputSamples.every(s=>s.contractStatus==='pass'||s.contractStatus==='insufficient'),
  easy:r.abstractionRisk.longestSentence<=64&&!r.failures.some(x=>/術語|抽象/.test(x)),
  duplicate:r.duplicateRisk.crossChart>=.82,
  pass:r.result!=='FAIL',
}));
const report={
  questionCount:records.length,
  chartCount:chartSamples.length,
  chartIds:chartSamples.map(x=>x.fixtureId),
  counts,
  sharedTemplates,
  acceptanceMatrix,
  records,
};
fs.mkdirSync(path.dirname(REPORT_JSON),{recursive:true});
fs.writeFileSync(REPORT_JSON,JSON.stringify(report,null,2)+'\n');
const md=[
  '# 西洋占星本命盤主題分析：全題庫稽核','',
  `- 實際題數：${records.length}`,
  `- 每題測試命盤：${chartSamples.length}`,
  `- PASS：${counts.PASS}`,
  `- WARNING：${counts.WARNING}`,
  `- FAIL：${counts.FAIL}`,'',
  `- 實際輸出總數：${records.length*chartSamples.length}`,'',
  '## 被三題以上共用的模板','',
  ...(sharedTemplates.length?sharedTemplates.map(t=>`- ${t.slot}：${t.template}（${t.usedBy.join('、')}）— ${t.risk}`):['- 無']),
  '',
  '## 完整題庫','',
  ...records.flatMap(r=>[
    `### ${r.questionTitle}（${r.questionId}）— ${r.result}`,'',
    `- category / topicId：${r.category} / ${r.topicId}`,
    `- intent / questionFocus：${r.intent} / ${r.questionFocus}`,
    `- answerTarget：${r.answerTarget}`,
    `- answerTargets：${r.answerTargets.join('、')}`,
    `- detailLabels：${r.detailLabels.join('、')}`,
    `- semanticKeys：${r.semanticKeys.join('、')||'無'}`,
    `- fallback：${Math.round(r.personalizationRisk.fallbackRatio*100)}%`,
    `- 重複風險：title/detail ${r.duplicateRisk.titleDetail}；headline/detail ${r.duplicateRisk.headlineDetail}；跨命盤 ${r.duplicateRisk.crossChart}`,
    ...(r.failures.length?[`- FAIL：${r.failures.join('；')}`]:[]),
    ...(r.warnings.length?[`- WARNING：${r.warnings.join('；')}`]:[]),'',
  ]),
];
fs.writeFileSync(REPORT_MD,md.join('\n')+'\n');
console.log(`Natal topic audit: ${records.length} questions × ${chartSamples.length} charts — PASS ${counts.PASS}, WARNING ${counts.WARNING}, FAIL ${counts.FAIL}`);
console.log('Reports:',path.relative(ROOT,REPORT_JSON),',',path.relative(ROOT,REPORT_MD));
if(counts.FAIL) process.exitCode=1;
