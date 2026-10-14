#!/usr/bin/env node
/* Question/answer semantics and Golden Test Spreads for Tarot readings. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

function element() {
  return { innerHTML:'', style:{}, value:'', files:[], classList:{add(){},remove(){}}, addEventListener(){}, setAttribute(){}, appendChild(){}, removeChild(){}, querySelector(){return null;}, querySelectorAll(){return [];}, focus(){}, blur(){}, scrollIntoView(){}, textContent:'' };
}
function loadRuntime() {
  const elements = {}; let copied = '';
  const c = { console, setTimeout, clearTimeout, setInterval, clearInterval, URL, Intl, Date, Math, JSON, Promise };
  c.window = c; c.navigator = { clipboard:{ writeText(text){ copied = text; return Promise.resolve(); } } };
  c.localStorage = { getItem(){return null;}, setItem(){}, removeItem(){} };
  c.scrollTo = function(){}; c.alert = function(){}; c.confirm = function(){return false;};
  c.document = { head:element(), body:element(), documentElement:element(), getElementById(id){return elements[id] || (elements[id]=element());}, querySelector(){return null;}, querySelectorAll(){return [];}, addEventListener(){}, createElement:element };
  vm.createContext(c);
  ['js/data/astrology-core-data.js','js/data/astrology-points-data.js','js/data/astrology-placement-templates.js','js/data/astrology-aspect-data.js','js/data/astrology-knowledge-layer.js','js/data/astrology-knowledge-dataset.js','js/data/astrology-natal-topics-data.js','js/data/card-images.js','js/data/reading-data.js','js/data/reading-interpretation.js','js/data/reading-question-planner.js','js/data/reading-rich-data.js','js/app.js'].forEach(file => vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),c,{filename:file}));
  vm.runInContext('window.__T=TAROT;window.__L=LENORMAND;window.__TS=TAROT_SPREADS;window.__LS=LENORMAND_SPREADS;window.__LQS=LENORMAND_QUESTION_SPREADS;window.__SUB=SUBTOPICS;window.__SCHEMAS=READING_QUESTION_SCHEMAS;',c);
  c.__copied = () => copied;
  return c;
}
const c = loadRuntime();
const failures = [];
function fail(message){ failures.push(message); }
function card(id){ const found=c.__T.find(x=>x.id===id); if(!found) throw new Error('Unknown card '+id); return found; }
function draw(spread, ids, reversed){
  const positions=c.__TS[spread].positions;
  return ids.map((id,i)=>({card:card(id),reversed:!!reversed[i],pos:positions[i],flipped:true}));
}

/* Every public question must carry a complete contract; no category-only routing. */
Object.keys(c.__SUB).forEach(category => (c.__SUB[category]||[]).forEach(question => {
  const missing=['questionId','intent','questionFocus','answerTarget','allowedContentTypes','excludedContentTypes','requiredFields'].filter(key => !question[key] || (Array.isArray(question[key]) && !question[key].length));
  if(missing.length) fail(`${category}/${question.key} 缺少 ${missing.join('、')}`);
}));

/* Generate every card-supported question, not just the named fixtures. */
Object.keys(c.__SUB).forEach(category => (c.__SUB[category]||[]).filter(question => question.modes.includes('cards')).forEach((question,index) => {
  const rank=n=>n===1?'A':String(n);
  const ids=['wands-'+rank((index%9)+1),'cups-'+rank(((index+2)%9)+1),'swords-'+rank(((index+4)%9)+1)];
  const drawn=draw('three-time',ids,[index%2,0,(index+1)%2]);
  c.state.deck='tarot'; c.state.category=category; c.state.subtopic=question.key; c.state.spread='three-time'; c.state.drawn=drawn; c.state.readingMode='cards';
  const result=c.cardSubtopicReading(category,question.key,drawn);
  if(!result || !result.available || !result.typed || !result.typed.available){ fail(`${category}/${question.key} 無法產生具名答案`); return; }
  Object.keys(result.typed.sections).forEach(contentType => {
    if(!question.allowedContentTypes.includes(contentType)) fail(`${category}/${question.key} 輸出未允許的 ${contentType}`);
    if(question.excludedContentTypes.includes(contentType)) fail(`${category}/${question.key} 輸出已排除的 ${contentType}`);
    const check=c.validateReadingContent(contentType,result.typed.sections[contentType].text);
    if(!check.valid) fail(`${category}/${question.key} 的 ${contentType} 未通過語意驗證`);
  });
}));

/* 同一份問題契約也必須真的走完雷諾曼抽牌與具名答案，不能只有推薦畫面連動。 */
let lenormandQuestionCount = 0;
Object.keys(c.__SUB).forEach(category => (c.__SUB[category]||[]).filter(question => question.modes.includes('cards')).forEach((question,index) => {
  const recommendations=(c.__LQS[category]||{})[question.key]||[];
  const spread=recommendations.find(key=>key!=='grand'&&c.__LS[key]);
  if(!spread){ fail(`lenormand ${category}/${question.key} 沒有可執行的推薦牌陣`); return; }
  const positions=c.__LS[spread].positions;
  const drawn=positions.map((pos,i)=>({card:c.__L[(index*5+i)%c.__L.length],reversed:false,pos,flipped:true}));
  c.state.deck='lenormand'; c.state.category=category; c.state.subtopic=question.key; c.state.spread=spread; c.state.drawn=drawn; c.state.readingMode='cards';
  const result=c.cardSubtopicReading(category,question.key,drawn);
  if(!result||!result.available||!result.typed||!result.typed.available){ fail(`lenormand ${category}/${question.key} 無法產生具名答案`); return; }
  if(result.typed.evidence.length<Math.min(3,drawn.length)) fail(`lenormand ${category}/${question.key} 牌面依據不足`);
  if(drawn.length>1&&!result.typed.cardRelationship) fail(`lenormand ${category}/${question.key} 沒有組牌整合`);
  lenormandQuestionCount++;
}));

const semanticCases = {
  meeting_context:{ pass:['在固定進修課程中認識。','透過工作合作或共同專案接觸。','由共同朋友在聚會中介紹。','在旅行或跨文化活動中開始交談。'], fail:['雙方會重視公平。','對方比較成熟穩重。','你容易先觀察。','關係需要直接溝通。'] },
  interaction_style:{ pass:['發生分歧時，雙方傾向先協調。','初期互動比較客氣。','雙方會留意彼此是否受到尊重。'], fail:['在課程或講座中認識。','朋友聚會可能是主要場合。','透過共同專案開始接觸。'] },
  partner_appearance:{ pass:['第一印象較冷靜，穿著偏簡潔俐落。','表情較克制，外在風格不過度張揚。'], fail:['對方重視承諾。','對方遇到問題會理性溝通。','對方個性成熟可靠。'] },
  suitable_roles:{ pass:['客戶成功專員。','活動企劃。','內容編輯。','專案協調。','教育訓練相關工作。'], fail:['適合自由發揮的工作。','適合公平的環境。','適合與人互動。'] }
};

/* Full deck: the same symbol must serve different answer targets. */
for (const lenCard of c.__L) {
  const drawn=[{card:lenCard,reversed:false,pos:{zh:'指引',en:'Guidance'},flipped:true}];
  Object.assign(c.state,{deck:'lenormand',category:'love',spread:'single',drawn,readingMode:'cards'});
  c.state.subtopic='partner-profile';
  const looks=c.cardSubtopicReading('love','partner-profile',drawn).typed;
  const lookText=c.cardPosText(drawn[0],false);
  if(!looks.available || !looks.sections.partner_appearance || looks.sections.partner_traits) fail(`雷諾曼 ${lenCard.n} 外貌題混入個性或缺少外在描述`);
  if(/狡詐|騙子|人品不好|不忠|一定是/.test(looks.primaryAnswer)) fail(`雷諾曼 ${lenCard.n} 外貌題誤判人品`);
  if(looks.cardRelationship) fail(`雷諾曼 ${lenCard.n} 單張捏造組合`);
  c.state.subtopic='marriage-longterm';
  const quality=c.cardSubtopicReading('love','marriage-longterm',drawn).typed;
  if(!quality.available || !quality.sections.longterm_relationship || !quality.action) fail(`雷諾曼 ${lenCard.n} 相處題缺少答案與觀察做法`);
  if(lookText===c.cardPosText(drawn[0],false)) fail(`雷諾曼 ${lenCard.n} 換問題未改變逐張解讀`);
  if(/娃娃臉|穿搭|肩背|身形/.test(quality.primaryAnswer)) fail(`雷諾曼 ${lenCard.n} 相處題混入外貌`);
}
const lenDraw = ns => ns.map((n,i)=>({card:c.__L.find(x=>x.n===n),reversed:false,pos:{zh:'位置'+i,en:'P'+i},flipped:true}));
const contrasting=lenDraw([7,14,34,15,25]);
Object.assign(c.state,{deck:'lenormand',category:'love',spread:'line5',drawn:contrasting,subtopic:'partner-profile'});
const contrastingLooks=c.cardSubtopicReading('love','partner-profile',contrasting).typed;
if(!/外在|風格/.test(contrastingLooks.primaryAnswer) || /人品不好|不忠|騙子/.test(contrastingLooks.primaryAnswer)) fail('蛇、狐狸、魚、熊、戒指的外貌組合被判成人品');
if(contrastingLooks.evidence.length!==5) fail('組合解讀遺漏實際抽到的牌');
c.state.subtopic='marriage-longterm';
const contrastingQuality=c.cardSubtopicReading('love','marriage-longterm',contrasting).typed;
if(!/放慢投入|優先確認/.test(contrastingQuality.primaryAnswer) || !/承諾/.test(contrastingQuality.primaryAnswer)) fail('相處品質未整合需要核對與承諾兩種訊號');
c.state.subtopic='partner-profile';
const childBear=c.cardSubtopicReading('love','partner-profile',lenDraw([13,15])).typed;
if(!/不同面向/.test(childBear.cardRelationship)) fail('孩子與熊的外貌組合未解釋可並存的特徵');
const grid=lenDraw([1,2,13,15,5,7,25,18,35]);
c.state.spread='box9'; c.state.drawn=grid;
const gridPairs=c.lenPairs(grid);
if(gridPairs.some(p=>p.label==='孩子 ＋ 熊')) fail('九宮格跨行的非相鄰牌被組成一對');
if(!gridPairs.some(p=>p.label==='幸運草 ＋ 樹')) fail('九宮格漏掉中央的垂直相鄰牌');

/* Category audit repairs: actions must answer what to do, not restate status. */
['tarot','lenormand'].forEach(deck=>{
  const drawn=deck==='tarot'?draw('three-time',['cups-2','swords-9','pentacles-6'],[0,0,0]):lenDraw([13,7,25]);
  Object.assign(c.state,{deck,category:'career',subtopic:'career-timing',drawn,spread:'three-time'});
  const career=c.cardSubtopicReading('career','career-timing',drawn).typed;
  if(/關係接下來|感情|伴侶|心房/.test(career.primaryAnswer)) fail(`${deck} 事業題混用愛情結論`);
  c.state.category='health'; c.state.subtopic='daily-balance';
  const health=c.cardSubtopicReading('health','daily-balance',drawn);
  if(!/先調整|安排|減少|記錄/.test(health.typed.primaryAnswer)) fail(`${deck} 健康調整題沒有回答可採取的做法`);
  c.state.category='wealth'; c.state.subtopic='cashflow-risk';
  const wealth=c.cardSubtopicReading('wealth','cashflow-risk',drawn).typed;
  if(!wealth.sections.financial_state) fail(`${deck} 收支現況題遺漏現況欄位`);
});
Object.keys(semanticCases).forEach(type => {
  semanticCases[type].pass.forEach(text => { if(!c.validateReadingContent(type,text).valid) fail(`${type} 誤擋合格句：${text}`); });
  semanticCases[type].fail.forEach(text => { if(c.validateReadingContent(type,text).valid) fail(`${type} 誤收錯配句：${text}`); });
});

/* 16 named Golden Test Spreads cover the acceptance categories. */
const GOLDEN_SPREADS = [
  {id:'all-upright',cat:'general',sub:'overall-theme',spread:'three-time',cards:['m1','cups-2','pentacles-10'],rev:[0,0,0]},
  {id:'mixed-orientation',cat:'general',sub:'hidden-blindspot',spread:'three-issue',cards:['m18','swords-8','m19'],rev:[0,1,0]},
  {id:'meeting-context',cat:'love',sub:'meet-scene',spread:'three-time',cards:['swords-3','pentacles-3','cups-2'],rev:[1,0,0],required:'meeting_context'},
  {id:'partner-traits',cat:'love',sub:'partner-type',spread:'relationship',cards:['wands-6','cups-King','pentacles-2','swords-5','cups-10'],rev:[0,0,1,0,0],required:'partner_traits'},
  {id:'partner-appearance',cat:'love',sub:'partner-profile',spread:'relationship',cards:['cups-3','swords-Queen','pentacles-6','m9','wands-4'],rev:[0,0,0,1,0],required:'partner_appearance'},
  {id:'relationship-development',cat:'love',sub:'pace-pattern',spread:'three-time',cards:['cups-5','m14','wands-2'],rev:[1,0,0],required:'relationship_development'},
  {id:'counterpart-attitude',cat:'love',sub:'crush',spread:'relationship',cards:['cups-Page','swords-2','cups-6','m18','wands-8'],rev:[0,1,0,0,0],required:'counterpart_attitude'},
  {id:'suitable-roles',cat:'career',sub:'industry-fit',spread:'three-issue',cards:['wands-3','swords-King','pentacles-8'],rev:[0,0,0],required:'suitable_roles'},
  {id:'suitable-environment',cat:'career',sub:'work-style-fit',spread:'three-issue',cards:['pentacles-4','cups-3','swords-6'],rev:[0,0,1],required:'suitable_environment'},
  {id:'money-source',cat:'wealth',sub:'opportunity-source',spread:'three-issue',cards:['pentacles-A','wands-3','pentacles-6'],rev:[0,0,0],required:'money_source'},
  {id:'financial-advice',cat:'wealth',sub:'risk-approach',spread:'three-issue',cards:['m15','pentacles-4','swords-Queen'],rev:[0,1,0],required:'financial_advice'},
  {id:'choice',cat:'general',sub:'priority-focus',spread:'fork',cards:['m2','wands-6','swords-5','cups-9','pentacles-3','m18','m19'],rev:[0,0,1,0,0,1,0]},
  {id:'future-trend',cat:'career',sub:'career-timing',spread:'timeline',cards:['pentacles-2','wands-8','m21'],rev:[1,0,0]},
  {id:'family-interaction',cat:'family',sub:'family-relations',spread:'three-issue',cards:['cups-6','swords-5','m14'],rev:[0,1,0]},
  {id:'study-method',cat:'study',sub:'major-fit',spread:'three-issue',cards:['swords-Page','pentacles-8','m1'],rev:[0,0,0]},
  {id:'contradictory-result',cat:'social',sub:'ally-conflict',spread:'three-time',cards:['cups-3','swords-7','m19'],rev:[0,1,1]}
];

const directAnswers = {};
GOLDEN_SPREADS.forEach(fixture => {
  const drawn=draw(fixture.spread,fixture.cards,fixture.rev);
  c.state.deck='tarot'; c.state.category=fixture.cat; c.state.subtopic=fixture.sub; c.state.spread=fixture.spread; c.state.drawn=drawn; c.state.readingMode='cards'; c.state.question='測試問題：'+fixture.id; c.state.target=''; c.state.wizFocusSel={};
  const result=c.cardSubtopicReading(fixture.cat,fixture.sub,drawn);
  if(!result || !result.available || !result.typed || !result.typed.available){ fail(`${fixture.id} 沒有 typed result`); return; }
  if(fixture.required && !result.typed.sections[fixture.required]) fail(`${fixture.id} 缺少 ${fixture.required}`);
  if(drawn.length>1 && !result.typed.cardRelationship) fail(`${fixture.id} 沒有多牌整合`);
  if(result.typed.evidence.length<Math.min(3,drawn.length)) fail(`${fixture.id} 牌面依據不足`);
  const html=c.renderSubtopicResultPanel((c.__SUB[fixture.cat]||[]).find(x=>x.key===fixture.sub),result,'直接回答這個問題');
  if(!/直接回答/.test(html) || !/為什麼這樣判斷/.test(html)) fail(`${fixture.id} 網站一般版缺少直接答案或專業摺疊區`);
  c.copyForAI(); const copied=c.__copied();
  if(!copied.includes('使用者補充的現實背景') || !copied.includes('牌面依據：') || !copied.includes('繁體中文與文風規則')) fail(`${fixture.id} 複製資料包缺少問題、依據或文風規則`);
  const generatedPart=copied.split('【繁體中文與文風規則】')[0];
  if(c.readingStyleFlags(generatedPart).length) fail(`${fixture.id} 複製資料包的生成內容仍有 AI 味旗標：${c.readingStyleFlags(generatedPart).join(',')}`);
  directAnswers[fixture.id]=result.typed.primaryAnswer;
});

/* A mixed total must still give a direction from the development card.
   These two spreads have the same neutral bucket but opposite outcome cards. */
const mixedAnswers = [false, true].map(reversed => {
  const drawn = draw('three-time', ['cups-2', 'swords-2', 'cups-A'], [0, 1, reversed]);
  c.state.deck = 'tarot'; c.state.category = 'love'; c.state.subtopic = 'pace-pattern';
  c.state.spread = 'three-time'; c.state.drawn = drawn; c.state.readingMode = 'cards';
  if (c.loveToneBucket(drawn, true) !== 'neutral') fail('中性方向案例沒有保留相同的整體語氣');
  const result = c.cardSubtopicReading('love', 'pace-pattern', drawn);
  const answer = result.typed.primaryAnswer;
  const expected = c.refineReadingCopy(card('cups-A').rich.ctx.love[reversed ? 1 : 0]);
  if (!answer.includes(expected)) fail('關係結論沒有使用發展牌的實際正逆位牌義');
  if (/好壞都有|不上不下|有好的部分，也有需要注意/.test(answer)) fail('關係結論仍然只說好壞並存');
  const html = c.renderSubtopicResultPanel(c.__SUB.love.find(x => x.key === 'pace-pattern'), result);
  if (html.indexOf('下一步可以做什麼') > html.indexOf('牌與牌怎麼互相影響')) fail('下一步仍然埋在組牌解釋後面');
  return answer;
});
if (mixedAnswers[0] === mixedAnswers[1]) fail('同為中性語氣的相反發展牌得到相同結論');

/* 抽牌動畫的「宇宙正在替你解答」是產品儀式感，依產品要求保留；
   去 AI 味與白話規則只限制實際解讀內容。 */
c.state.phase='focus'; c.state.deck='tarot'; c.state.spread='single'; c.state.drawn=[];
const focusScreen=c.renderReading();
if(!focusScreen.includes('宇宙正在替你解答')) fail('抽牌動畫遺失應保留的儀式感文字');
const plainSpreadAnalysis=c.analyzeSpread(draw('three-time',['swords-3','pentacles-3','cups-2'],[1,0,0]),true).join('\n');
if(c.traditionalChineseStyleFlags(plainSpreadAnalysis).length) fail('整副牌分析仍有難懂的專業或神祕說法');

/* Same cards must answer different questions differently. */
const sameCards=draw('three-time',['swords-Page','pentacles-3','cups-2'],[0,0,0]);
const scene=c.cardSubtopicReading('love','meet-scene',sameCards).typed.primaryAnswer;
const traits=c.cardSubtopicReading('love','partner-type',sameCards).typed.primaryAnswer;
if(scene===traits) fail('同一組牌換題目後直接答案沒有改變');

/* 沒有選預設子題時，自由輸入的二選一與是非題也要在第一句回答。 */
c.state.subtopic='';
c.state.drawn=sameCards; c.state.category='love'; c.state.question='這是穩定期還是關係正在疏遠？';
const eitherOrAnswer=c.overallReading();
if(!/直接回答：/.test(eitherOrAnswer) || !/(穩定期|關係正在疏遠)/.test(eitherOrAnswer)) fail('自由輸入的二選一題沒有直接回答');
c.state.question='這段關係會不會繼續？';
if(!/直接回答：(?:目前偏向|目前條件不足)/.test(c.overallReading())) fail('自由輸入的是非題沒有直接回答');

/* Same card in obstacle and advice positions must be reframed by its position. */
const repeated=card('m1');
const obstacle=c.cardPosText({card:repeated,reversed:false,pos:{zh:'阻礙',en:'Obstacle'}},true);
const advice=c.cardPosText({card:repeated,reversed:false,pos:{zh:'建議',en:'Advice'}},true);
if(obstacle===advice || !/阻力/.test(obstacle) || !/建議/.test(advice)) fail('同一張牌在不同牌位沒有改變解讀');

if(failures.length){ console.error(`Reading semantic regression FAILED (${failures.length})`); failures.forEach(x=>console.error('- '+x)); process.exit(1); }
console.log(`Reading semantic regression passed: ${GOLDEN_SPREADS.length} Tarot Golden Test Spreads, ${lenormandQuestionCount} Lenormand question paths, ${Object.keys(semanticCases).length} answerTarget validators, all question contracts complete.`);
