#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const h = require('./helpers/natal-career-runtime.cjs');
const c = h.runtime();
const clone = value => JSON.parse(JSON.stringify(value));
const serial = value => JSON.stringify(value);
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
let checks = 0;
const ok = (condition, message) => { assert(condition,message); checks++; };
const near = (actual, expected, message) => ok(Math.abs(actual - expected) <= .002, message + ': ' + actual + ' vs ' + expected);
const view = answer => ({headline:answer.headline, summary:answer.summary, details:answer.details, caution:answer.caution});
const before = JSON.parse(fs.readFileSync(path.join(__dirname,'reports/natal-career-before.json'),'utf8'));
const reports = [];
for (const {id,chart} of h.charts(c)) {
  const original = serial(chart);
  freeze(chart);
  const p = c.NatalCareerAnalysis.profile(chart,false);
  const result = c.analyzeNatalTopic(chart,'career',h.ids,false);
  ok(serial(chart) === original,'分析不得更動計算後的命盤');
  ok(p.taskScores.length >= 12 && p.skillScores.length >= 10,'候選職能／優勢範圍');
  ok(p.environment.length === 6,'環境涵蓋六軸');
  ok(p.taskScores[0].score - p.taskScores.at(-1).score > 1,'分數具有實際區辨範圍');
  ok(result.qualityFlags.length === 0,'題目契約／內容品質：' + id + ' ' + serial(result.qualityFlags));
  const known = new Map(p.sources.map(source => [source.canonicalKey,source]));
  for (const source of p.sources) {
    if (source.planetKey) {
      ok(source.sign === chart.planets[source.planetKey].sign && source.house === chart.planets[source.planetKey].house,'來源落座落宮與實際命盤一致');
    } else if (source.aspect) {
      ok(chart.aspects.some(a => serial(a) === serial(source.aspect)),'相位必須來自原始排盤');
    } else {
      ok([chart.mc,...[10,6,2].map(house => chart.houseCusps[house-1])].some(lon => Math.floor(lon/30) === source.sign),'MC／宮頭來源有效');
    }
  }
  for (const [channel,scores] of [['task',p.taskScores],['environment',p.environment],['skill',p.skillScores]]) {
    const signatures = new Set();
    for (const score of scores) {
      const weights = score.definition[2];
      signatures.add(serial(weights));
      ok(Object.values(weights).some(w => w > 0) && Object.values(weights).some(w => w < 0),'每個候選都有支持與降低適配條件');
      near(score.score,score.contributions.reduce((sum,item) => sum + item.value,0),'總分可由來源重建');
      near(score.score,score.terms.reduce((sum,item) => sum + item.value,0),'總分可由特徵乘係數重建');
      for (const item of score.contributions) {
        const source = known.get(item.evidenceKey);
        ok(!!source,'推薦分數能追到實際來源');
        const expected = Object.keys(weights).reduce((sum,key) => sum + (source.vectors[channel][key] || 0) * weights[key],0);
        near(item.value,expected,'每筆加減分等於特徵乘候選係數');
      }
    }
    ok(signatures.size === scores.length,'各候選使用不同條件');
  }
  const again = c.analyzeNatalTopic(chart,'career',h.ids,false);
  ok(serial(result.answers.map(view)) === serial(again.answers.map(view)),'同盤同題穩定');
  for (const answer of result.answers) {
    const single = c.analyzeNatalTopic(chart,'career',[answer.questionId],false).answers[0];
    ok(serial(view(single)) === serial(view(answer)),'單題與三題合併一致，不因輪替主導來源改答案');
    ok(answer.contractStatus === 'pass','每題有獨立語意契約');
    const channel = answer.questionId === h.ids[0] ? 'task' : answer.questionId === h.ids[1] ? 'environment' : 'skill';
    ok(answer.debug.careerAnalysis.channel === channel,'診斷顯示這一題實際使用的評分通道');
    ok(answer.debug.careerAnalysis.sources.every(source => source.vector && Object.keys(source.vector).length),'診斷保留每筆來源的實際向量');
    const html = c.renderNatalTopicQuestionCard(answer);
    ok(answer.details.every(detail => html.includes(c.esc(detail.text))),'所有必要內容都在現有兩個 UI 分項顯示');
  }
  const [tasks,env,skill] = result.answers;
  ok(tasks.careerRecommendations.every((item,index,all) => !index || all[index-1].score >= item.score),'推薦按實際分數排序');
  ok(tasks.careerRecommendations.every(item => item.contributions.some(x => x.value > 0)),'推薦有正向命盤依據');
  ok(/依據/.test(tasks.details[0].text) && /較強傾向/.test(tasks.details[0].text),'任務顯示配置與理由');
  for (const axis of p.environment) ok(env.details.some(detail => detail.text.includes(axis.label) && detail.text.includes(axis.preference)),'環境六軸可見：' + axis.id);
  ok(/不適應/.test(env.caution) || p.environment.every(axis => axis.mixed),'環境呈現可能不適應條件');
  ok(/主要優勢/.test(skill.details[0].label) && /次要|並列/.test(skill.details[1].label) && /盲點/.test(skill.details[1].label),'主要／次要優勢及盲點分開');
  ok(new Set(result.answers.map(answer => answer.headline)).size === 3,'三題回答不同面向');
  const reordered = clone(chart); reordered.aspects.reverse();
  ok(serial(c.NatalCareerAnalysis.profile(reordered,false)) === serial(p),'相位陣列排序不影響計算或來源追蹤');
  const irrelevant = clone(chart);
  irrelevant.fixtureLabel = '只改顯示名稱'; irrelevant.chartId = 'another-id'; irrelevant.points.Node.lon += 13;
  irrelevant.points.Chiron = {lon:123,sign:4,house:2};
  ok(serial(c.NatalCareerAnalysis.profile(irrelevant,false)) === serial(p),'無關本命點、名稱與 ID 不改職涯結果');
  ok(serial(c.analyzeNatalTopic(irrelevant,'career',h.ids,false).answers.map(view)) === serial(result.answers.map(view)),'無關資料不改可見結果');
  // Valid astronomical counterfactual: same fictitious day/place, six hours later.
  const birth = h.births.find(row => row[0] === id);
  const changedTime = birth.slice(1); changedTime[3] = (changedTime[3] + 6) % 24;
  const changed = c.computeNatalChart(...changedTime,25.033,121.5654,'Asia/Taipei','placidus');
  const changedProfile = c.NatalCareerAnalysis.profile(changed,false);
  ok(serial(p.vectors) !== serial(changedProfile.vectors),'改變時刻及職涯宮頭後，特徵實際改變');
  ok(p.taskScores.some(item => Math.abs(item.score - changedProfile.taskScores.find(other => other.id === item.id).score) > .1),'職涯配置變動會改變候選適配分數');
  const unknown = c.NatalCareerAnalysis.profile(chart,true);
  const fakeHouses = clone(chart); fakeHouses.mc = 0; fakeHouses.asc = 0; fakeHouses.houseCusps = Array(12).fill(0);
  Object.values(fakeHouses.planets).forEach(planet => { planet.house = 10; });
  ok(serial(unknown) === serial(c.NatalCareerAnalysis.profile(fakeHouses,true)),'未知時間不讀 MC／宮位／宮主星');
  ok(unknown.sources.every(s => !/axis:/.test(s.canonicalKey) && !s.sourceRoles.some(role => /宮/.test(role))),'未知時間未偷偷使用宮位');
  c.state.astroUnknownTime = true;
  ok(serial(p) === serial(c.NatalCareerAnalysis.profile(chart,false)),'函式不受其他 UI 命盤未知時間狀態污染');
  c.state.astroUnknownTime = false;
  reports.push({id, birth:birth.slice(1), chart:clone(chart), fingerprint:result.chartFingerprint, before:before.cases.find(row => row.id === id).answers.map(answer => ({questionId:answer.questionId,headline:answer.headline,details:answer.details})), after:result.answers.map(view), profile:clone(p)});
}
for (const {id,chart} of h.charts(c).filter(row => !Object.values(row.chart.planets).some(planet => planet.house === 10))) {
  const emptyHouse = c.analyzeNatalTopic(chart,'career',h.ids,false);
  ok(emptyHouse.answers.every(answer => answer.contractStatus === 'pass' && !answer.careerCoverage),'十宮空宮仍由 MC 與宮主星分析，沒有降級成缺資料：'+id);
}
// Isolated rule counterfactuals supplement the six real computed charts.
const action = c.NatalCareerAnalysis.profile({planets:{Mars:{sign:0,house:10}},aspects:[]},true);
const structure = c.NatalCareerAnalysis.profile({planets:{Mars:{sign:9,house:10}},aspects:[]},true);
ok(action.vectors.task.initiative > structure.vectors.task.initiative,'火星牡羊比摩羯強調即時啟動');
ok(structure.vectors.task.order > action.vectors.task.order,'火星摩羯比牡羊強調結構');
const market = p => p.taskScores.find(score => score.id === 'market').score;
const craft = p => p.taskScores.find(score => score.id === 'craft').score;
ok(market(action) > market(structure) && craft(structure) > craft(action),'同一變動對不同候選造成不同適配變化');
const chart = h.charts(c)[0].chart;
const noAspects = clone(chart); noAspects.aspects = [];
const tight = clone(noAspects); tight.aspects = [{a:'Mercury',b:'Saturn',type:'trine',orb:0}];
const wide = clone(noAspects); wide.aspects = [{a:'Mercury',b:'Saturn',type:'trine',orb:5.5}];
const square = clone(noAspects); square.aspects = [{a:'Mercury',b:'Saturn',type:'square',orb:0}];
const intrinsicPrecision = value => c.NatalCareerAnalysis.profile(value,false).vectors.skill.precision;
ok(intrinsicPrecision(tight) > intrinsicPrecision(wide),'緊密支持相位比寬相位影響大');
ok(intrinsicPrecision(square) < intrinsicPrecision(noAspects),'張力相位有整合成本而非只加分');
const duplicate = clone(tight); duplicate.aspects.push(clone(tight.aspects[0]));
ok(serial(c.NatalCareerAnalysis.profile(duplicate,false)) === serial(c.NatalCareerAnalysis.profile(tight,false)),'相位不重複計分');
const unavailable = c.analyzeNatalTopic({planets:{},points:{},aspects:[],houseCusps:[]},'career',h.ids,true);
ok(unavailable.answers.every(answer => answer.contractStatus === 'pass' && answer.careerCoverage === 'exploration' && answer.details.length === 2 && !answer.careerRecommendations),'完全沒有配置時給可執行的探索方法，不塞個人化推薦或阻擋畫面');
ok(!c.renderNatalTopicResult(unavailable).includes('描述的是本命傾向'),'零配置的探索方法不會被包裝成本命結論');
ok(unavailable.qualityFlags.length === 0,'未接上配置的探索內容也遵守三題分工與品質契約');
for (const answer of unavailable.answers) {
  ok(!/無法形成可靠|沒有足夠線索|資料不足/.test(JSON.stringify(view(answer))),'缺資料仍有建設性的下一步');
  ok(answer.details.every(detail => c.renderNatalTopicQuestionCard(answer).includes(c.esc(detail.text))),'探索方法在現有 UI 可見');
}
const partial = c.analyzeNatalTopic({planets:{Mercury:{sign:5,house:6,lon:165}},points:{},aspects:[],houseCusps:[]},'career',h.ids,true);
ok(partial.qualityFlags.length === 0,'部分配置不重複提醒或觸發阻擋');
for (const answer of partial.answers) {
  ok(answer.contractStatus === 'pass' && answer.careerCoverage === 'partial','一條可用配置仍提供有依據的暫定答案');
  ok(/水星/.test(answer.caution) && /試做|試試|驗證/.test(answer.headline),'指出已知配置與可驗證的探索方向');
  ok(answer.details.length === 2 && !/無法形成可靠|沒有足夠線索/.test(answer.headline),'部分資料不擋住分析');
}
ok(partial.answers[0].careerRecommendations.length === 1,'少量依據不擴張成多項肯定職涯結論');
for (const key of ['Sun','Mercury','Venus','Mars','Saturn']) for (let sign = 0; sign < 12; sign++) {
  const one = c.analyzeNatalTopic({planets:{[key]:{sign,lon:sign*30+15}},points:{},aspects:[],houseCusps:[]},'career',h.ids,true);
  ok(one.answers.every(answer => answer.contractStatus === 'pass' && answer.careerCoverage === 'partial' && answer.details.length === 2) && one.qualityFlags.length === 0,'單一已知行星落座可完成三題，沒有被通用契約擋回空白：'+key+'/'+sign);
}
const cuspChange = clone(chart); cuspChange.houseCusps[5] += 31;
ok(c.natalChartFingerprint(chart,false) !== c.natalChartFingerprint(cuspChange,false),'指紋包括宮頭依賴');
ok(c.natalChartFingerprint(tight,false) !== c.natalChartFingerprint(noAspects,false),'指紋包括相位依賴');
ok(c.analyzeNatalTopic(chart,'career',[h.ids[0]],false).analysisKey !== c.analyzeNatalTopic(chart,'career',[h.ids[1]],false).analysisKey,'analysisKey 區分不同問題集合');
ok(new Set(reports.map(row => serial(row.profile.vectors))).size === 6,'六張有效命盤產生不同特徵；不要求六種不同文字');
const report = {version:c.NatalCareerAnalysis.version, checks, fixtures:6, cases:reports};
fs.writeFileSync(path.join(__dirname,'reports/natal-career-after.json'),JSON.stringify(report,null,2)+'\n');
console.log('Natal career analysis: ' + checks + ' assertions passed, six production-calculated charts; deterministic, traceable, signed scoring, six environment axes, perturbations, unknown time, visible UI.');
