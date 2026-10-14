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

const failures=[]; let checks=0;
function check(ok,message){checks++;if(!ok)failures.push(message);}
const plans=vm.runInContext('READING_QUESTION_PLANS',c);
for(const deck of ['tarot','lenormand']){
 const cards=deck==='tarot'?c.__T:c.__L;
 for(const [category,questions] of Object.entries(plans)){
  for(const card of cards){
   for(const reversed of (deck==='tarot'?[false,true]:[false])){
    const distinct=[];
    for(const key of Object.keys(questions)){
     const d={card,reversed,pos:{zh:'現況',en:'Present'},flipped:true};
     Object.assign(c.state,{deck,category,subtopic:key,drawn:[d],spread:'single',readingMode:'cards'});
     const x=c.questionProjection(d,category,key);
     const result=c.cardSubtopicReading(category,key,[d]);
     check(x&&x.answer&&x.action&&x.condition,`${deck}/${card.id||card.n}/${key}: missing projection`);
     check(result&&result.typed&&result.typed.available,`${deck}/${key}: missing typed result`);
     if(!result||!result.typed)continue;
     const typed=result.typed;
     check(!/undefined|NaN|\[object Object\]/.test(JSON.stringify(typed)),`${deck}/${key}: placeholder`);
     check(typed.evidence.length===1&&!typed.cardRelationship,`${deck}/${key}: invented evidence or pair`);
     for(const [type,section] of Object.entries(typed.sections)){
      check(typed.schema.allowedContentTypes.includes(type),`${deck}/${key}: disallowed ${type}`);
      check(c.validateReadingContent(type,section.text).valid,`${deck}/${card.id||card.n}/${key}: invalid ${type}`);
     }
     check(c.cardPosText(d,false)!==c.projectedQuestionCardText({...d,pos:{zh:'建議',en:'Advice'}},category,key,'advice'),`${deck}/${key}: role ignored`);
     distinct.push(x.answer);
    }
    check(new Set(distinct).size===distinct.length,`${deck}/${card.id||card.n}/${category}: repeated answer across questions`);
   }
  }
 }
}
// Full decks must provide card-specific checks in the priority categories.
for(const category of ['career','family','study','wealth','decision']){
 for(const key of Object.keys(plans[category])){
  const answers=c.__L.map(card=>c.questionProjection({card,reversed:false},category,key).answer);
  check(new Set(answers).size>=35,`Lenormand ${key}: collapses individual card mechanisms`);
 }
}
const original=c.__LS['three-issue'].positions;
const positions=c.questionDrawPositions(original,'decision','dc-ab','lenormand');
check(!/選項/.test(original[0].zh),'spread positions mutated');
const ab=positions.map((pos,i)=>({card:c.__L[[5,17,24][i]],pos,reversed:false,flipped:true}));
Object.assign(c.state,{deck:'lenormand',category:'decision',subtopic:'dc-ab',drawn:ab,spread:'three-issue',readingMode:'cards'});
const comparison=c.cardSubtopicReading('decision','dc-ab',ab).typed;
check(/A 優先核對/.test(comparison.primaryAnswer)&&/B 優先核對/.test(comparison.primaryAnswer),'A/B comparison missing');
check(comparison.evidence.length===3,'A/B lost real evidence');
check(c.overallReading().includes(comparison.primaryAnswer),'summary bypasses question planner');
check(c.renderReading().includes(comparison.primaryAnswer),'result UI bypasses question planner');
c.state.wizardStep=4;c.state.phase='setup';
check(!c.renderReading().includes('未填寫，將以通用方式解讀'),'confirmation loses selected question');
c.state.phase='result';
c.copyForAI();check(c.__copied().includes(comparison.primaryAnswer),'export bypasses decision planner');
check(c.lenPairs(ab).every(pair=>/需要核對|要求一起確認/.test(pair.text)),'pairs bypass question planner');
check(c.analyzeSpread(ab,true).length===0,'coarse score contradicts named question');
check(!c.buildPlannedQuestionReading('career','industry-fit',[],c.posRole),'empty cards fabricate reading');
// Lazy-rich failure still has meaningful authored data.
const rich=c.__T[0].rich;c.__T[0].rich=null;
check(!!c.questionProjection({card:c.__T[0],reversed:true},'study','exam-application').answer,'lazy data fallback blank');c.__T[0].rich=rich;
if(failures.length){console.error(`Question planner FAILED (${failures.length})`);console.error(failures.slice(0,60).join('\n'));process.exit(1);}
console.log(`Question planner passed: ${checks} checks, 36 questions, all 78 Tarot cards upright/reversed and 36 Lenormand cards.`);
