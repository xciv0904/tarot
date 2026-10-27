#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const h = require('./helpers/natal-career-runtime.cjs');
const c = h.runtime();
vm.runInContext(fs.readFileSync(path.join(h.root,'tests/golden-charts.js'),'utf8'),c);
const baselinePath = path.join(__dirname,'snapshots/natal-topic-baseline.json');
const baselineText = fs.readFileSync(baselinePath,'utf8');
const baseline = JSON.parse(baselineText);
// User-approved review artifact records exactly which 36 career cases changed.
const reviewed = JSON.parse(fs.readFileSync(path.join(__dirname,'reports/natal-career-golden-diff.json'),'utf8'));
assert.strictEqual(reviewed.changes.length,36);
const changes = [];
let preserved = 0;
for (const chart of c.GOLDEN_TEST_CHARTS) {
  for (const [topicId,questions] of Object.entries(c.NATAL_TOPIC_QUESTIONS)) {
    for (let start = 0; start < questions.length; start += 3) {
      const result = c.analyzeNatalTopic(chart,topicId,questions.slice(start,start+3).map(q=>q.id),false);
      for (const answer of result.answers) {
        const current = JSON.parse(JSON.stringify({chartId:chart.fixtureId,topicId,questionId:answer.questionId,headline:answer.headline,summary:answer.summary,details:answer.details.map(d=>({label:d.label,text:d.text})),caution:answer.caution||'',primary:answer.primaryEvidence ? answer.primaryEvidence.canonicalKey : null,qualityFlags:result.qualityFlags.filter(flag=>String(flag.note||'').includes(answer.questionId))}));
        const old = baseline.cases.find(row=>row.chartId===current.chartId && row.questionId===current.questionId);
        assert(old,'既有題目仍存在');
        if (h.ids.includes(answer.questionId)) {
          assert.strictEqual(answer.contractStatus,'pass');
          assert.strictEqual(current.qualityFlags.length,0,'職涯答案無品質警告');
          assert.deepStrictEqual(current,old,'已核准的職涯快照必須穩定：'+chart.fixtureId+'/'+answer.questionId);
          const approved = reviewed.changes.find(change=>change.after.chartId===current.chartId && change.after.questionId===current.questionId);
          assert(approved,'職涯案例必須出現在已核准差異');
          assert.deepStrictEqual(current,approved.after,'不得偏離使用者已檢閱的職涯結果');
          assert.notDeepStrictEqual(approved.before,current,'確實修正原先的職涯結果');
          changes.push(approved);
        } else {
          assert.deepStrictEqual(current,old,'不在本次範圍的答案必須逐字保留：'+chart.fixtureId+'/'+answer.questionId);
          preserved++;
        }
      }
    }
  }
}
assert.strictEqual(preserved,612);
assert.strictEqual(changes.length,36);
assert.strictEqual(fs.readFileSync(baselinePath,'utf8'),baselineText,'未更新原始快照');

console.log('Natal career compatibility: 612/612 protected answers byte-identical; 36 approved career answers match the reviewed changes and updated snapshot; tests never rewrite snapshots.');
