#!/usr/bin/env node
/* Relationship Timing numerical and contract regression. Fixtures are
 * synthetic; no personal birth profile is stored in this repository. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const failures = [], checks = [];
function check(name, ok, detail) { checks.push(name); if (!ok) failures.push(name + (detail ? '：' + detail : '')); }
function element() { return {innerHTML:'',style:{},value:'',classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},appendChild(){},querySelector(){return null;},querySelectorAll(){return [];}}; }
function runtime() {
  const elements = {}, c = {console,setTimeout,clearTimeout,URL,Intl,Date,Math,JSON,Promise};
  c.window=c; c.navigator={}; c.scrollTo=()=>{}; c.localStorage={getItem(){return null;},setItem(){},removeItem(){}};
  c.location={hostname:'example.com',search:''};
  c.document={head:element(),body:element(),documentElement:element(),getElementById(id){return elements[id]||(elements[id]=element());},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){},createElement:element};
  vm.createContext(c);
  vm.runInContext(read('assets/vendor/astronomy-engine-2.1.19.min.js'),c,{filename:'astronomy'});
  ['js/data/astrology-core-data.js','js/data/astrology-points-data.js','js/data/astrology-placement-templates.js','js/data/astrology-aspect-data.js','js/data/astrology-knowledge-layer.js','js/data/astrology-knowledge-dataset.js','js/data/astrology-natal-topics-data.js','js/data/card-images.js','js/data/reading-data.js','js/data/reading-interpretation.js','js/data/reading-rich-data.js','js/app.js','js/data/astro-charts.js','js/data/relationship-timing.js','js/data/astro-advanced.js'].forEach(f=>vm.runInContext(read(f),c,{filename:f}));
  c.ensureAstrologyBodyKeys(); return c;
}
const c = runtime(), engine = c.RelationshipTimingEngine, fixed = new Date('2026-08-25T00:00:00.000Z');

/* Fixed ephemeris values freeze the Astronomy Engine inputs consumed by the
   timing layer. Tolerance is 1e-6 degree, far tighter than any timing orb. */
const expected = {Mercury:149.079602302,Venus:197.296551446,Mars:98.918785820,Jupiter:132.213477731,Saturn:14.040050871,Uranus:65.576877030,Neptune:3.833619154,Pluto:303.645389722};
Object.keys(expected).forEach(planet => {
  const actual = engine._test.bodyLongitude(planet, fixed);
  check(planet + ' 固定星曆經度', Math.abs(actual - expected[planet]) < 1e-6, actual.toFixed(9));
});

const localUtc = c.zonedTimeToUtc(2001,2,3,4,5,0,'Asia/Taipei');
check('Asia/Taipei 本地時間轉 UTC', localUtc.toISOString() === '2001-02-02T20:05:00.000Z', localUtc.toISOString());

function chart(lon) {
  const planets={}; c.ASTRO_PLANET_BODY_KEYS.forEach(k=>planets[k]={lon,sign:Math.floor(lon/30),deg:lon%30,house:1,retro:false});
  return {planets,points:{},aspects:[],houseCusps:[],asc:0,mc:0,ascSign:0,houseSystem:'placidus'};
}
/* Synthetic 12° charts create a real Saturn retrograde/direct multi-hit during
   the fixed interval, while keeping the fixture unrelated to a real person. */
const synAsp=[{aKey:'Venus',bKey:'Sun',type:'square',orb:.4}];
const saturnEvents = engine._test.individualEventsForPlanet('Saturn',chart(12),chart(12),
  {unknownTime:false},{unknownTime:false},synAsp,fixed,new Date('2027-06-01T00:00:00.000Z'));
const hits = saturnEvents.filter(e=>e.natalPerson==='A'&&e.natalPoint==='Venus'&&e.aspect==='conjunction');
check('精確相位有進入／峰值／離開日期', hits.length >= 2 && hits.every(e=>Date.parse(e.startDate)<Date.parse(e.peakDate)&&Date.parse(e.peakDate)<Date.parse(e.endDate)));
check('精確日經過數值 refinement', hits.every(e=>e.exactOrb < .02), hits.map(e=>e.exactOrb).join(','));
check('applying / separating 都有記錄', hits.every(e=>e.applying===true&&e.separating===true));
check('逆行狀態由經度日差判斷', hits.some(e=>e.retrograde) && hits.some(e=>!e.retrograde));
const cycles = engine._test.assignCycles(saturnEvents);
const repeated = cycles.find(x=>x.natalPerson==='A'&&x.natalPoint==='Venus'&&x.transitPlanet==='Saturn'&&x.aspect==='conjunction');
check('逆行重複命中歸入同一 Transit Cycle', repeated && repeated.hitCount >= 2, repeated && repeated.hitCount);

const moonRange = engine.moonRangeForLocalDay({unknownTime:true,y:1992,m:7,d:10,tz:'Asia/Taipei'});
const moonSpan = c.astroAngleDiff(moonRange.startLon,moonRange.endLon);
check('未知時間月亮計算當地整日位置範圍', moonRange.samples.length===5 && moonSpan > 10 && moonSpan < 16, moonSpan);
const middleMoon = moonRange.samples[2].lon;
check('月亮只在部分出生時間成立標 LOW', engine.moonAspectConfidence(middleMoon,0,1.2,moonRange)==='LOW');
check('月亮整日皆成立才標 HIGH', engine.moonAspectConfidence(middleMoon,0,20,moonRange)==='HIGH');
check('缺少出生日資料標 UNAVAILABLE', engine.moonRangeForLocalDay({unknownTime:true}).confidence==='UNAVAILABLE');

const relPlain = engine._test.synastryActivation('A','Venus',[]).multiplier;
const relLinked = engine._test.synastryActivation('A','Venus',synAsp).multiplier;
check('重要 Synastry endpoint 提高 relationship relevance', relLinked > relPlain, relLinked);
const baseStrength = engine.eventStrength({transitWeight:.9,targetWeight:1,aspectWeight:.9,exactOrb:.1,orbLimit:2,relationshipContextWeight:1,sharedMultiplier:1});
const sharedStrength = engine.eventStrength({transitWeight:.9,targetWeight:1,aspectWeight:.9,exactOrb:.1,orbLimit:2,relationshipContextWeight:1,sharedMultiplier:1.25});
check('Shared Activation multiplier 提高事件強度', sharedStrength > baseStrength, baseStrength+' -> '+sharedStrength);

const allShared = engine._test.sharedActivations(saturnEvents);
check('同時命中 A/B 敏感點形成 Shared Activation', allShared.length>0 && allShared.every(x=>x.personAEvents.length&&x.personBEvents.length));
function sharedFixture(person, startDate, peakDate, endDate, point) {
  return {id:'fixture-'+person, natalPerson:person, coreEligible:true, strength:80,
    startDate,peakDate,endDate,transitPlanet:'Saturn',natalPoint:point,aspect:'conjunction',
    speedClass:'medium',category:'commitment',themes:['commitment','definition'],
    themeScores:{commitment:1,definition:.9},relationshipRelevance:1.2,
    relatedSynastryEvidence:[],confidence:'HIGH'};
}
const boundedShared = engine._test.sharedActivations([
  sharedFixture('A','2026-08-01T00:00:00.000Z','2026-09-15T00:00:00.000Z','2027-03-01T00:00:00.000Z','Venus'),
  sharedFixture('B','2026-09-01T00:00:00.000Z','2026-09-20T00:00:00.000Z','2026-10-01T00:00:00.000Z','Saturn'),
])[0];
check('共同窗口取雙方實際重疊，不取兩段行運聯集', boundedShared
  && Date.parse(boundedShared.startDate) >= Date.parse('2026-09-01T00:00:00.000Z')
  && Date.parse(boundedShared.endDate) <= Date.parse('2026-10-01T00:00:00.000Z'),
  boundedShared && boundedShared.startDate+'–'+boundedShared.endDate);
check('單一共同窗口不會被拉成半年', boundedShared
  && (Date.parse(boundedShared.endDate)-Date.parse(boundedShared.startDate))/86400000 <= 60);
check('事件 schema 完整', hits.every(e=>['id','startDate','peakDate','endDate','transitPlanet','natalPerson','natalPoint','aspect','exactOrb','applying','separating','category','strength','relationshipRelevance','cycleId','evidence','confidence'].every(k=>Object.prototype.hasOwnProperty.call(e,k))));
check('timing evidence 不含 ASC／宮位／角度', saturnEvents.every(e=>!/(ASC|DSC|MC|IC|house|angle)/.test(JSON.stringify(e))));

console.log('# Relationship Timing Engine Numerical QA');
console.log('- 固定時間：2026-08-25T00:00:00Z');
console.log('- Saturn □/☌ synthetic target hits：' + hits.map(e=>e.peakDate.slice(0,10)+' '+(e.retrograde?'R':'D')).join('、'));
console.log('- 月亮整日移動：' + moonSpan.toFixed(4) + '°');
console.log('- 檢查項目：' + checks.length);
console.log('- 失敗：' + failures.length);
if (failures.length) { failures.forEach(x=>console.log('  ✗ '+x)); process.exit(1); }
console.log('全部通過。');
