const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/data/reading-data.js'), 'utf8');
const sandbox = {
  console,
  IMG: {},
  tarotImg: () => '',
  lenImg: () => ''
};
vm.createContext(sandbox);
vm.runInContext(source + '\nthis.__presets = SPREAD_QUESTION_PRESETS; this.__concrete = CONCRETE_QUESTION_EXAMPLES; this.__subtopics = SUBTOPICS; this.__recs = RECOMMENDATIONS; this.__lenRecs = LEN_RECOMMENDATIONS; this.__topicCfg = topicQuestionConfig; this.__spreadFocus = SPREAD_FOCUS_GROUPS; this.__subtopicFocus = SUBTOPIC_FOCUS_GROUPS;', sandbox);

const presets = sandbox.__presets;
const concreteExamples = sandbox.__concrete;
const subtopics = sandbox.__subtopics;
const recommendations = sandbox.__recs;
const lenormandRecommendations = sandbox.__lenRecs;
const topicCfg = sandbox.__topicCfg;
const spreadFocus = sandbox.__spreadFocus;
const subtopicFocus = sandbox.__subtopicFocus;
const errors = [];

function validateRecommendations(recommendationSet, deckName) {
Object.keys(recommendationSet).forEach((category) => {
  const categoryPresets = presets[category];
  if (!categoryPresets || !categoryPresets.default) {
    errors.push(`${category}: missing default question preset`);
    return;
  }
  recommendationSet[category].forEach((spread) => {
    const preset = categoryPresets[spread] || categoryPresets.default;
    const concreteByCategory = concreteExamples[category] || {};
    const examples = concreteByCategory[spread] || concreteByCategory.default || preset.examples;
    if (!examples || examples.length < 5) {
      errors.push(`${deckName} ${category}/${spread}: needs at least 5 concrete examples`);
    }
    const validKeys = new Set((subtopics[category] || []).map((item) => item.key));
    (preset.subtopics || []).forEach((key) => {
      if (!validKeys.has(key)) errors.push(`${deckName} ${category}/${spread}: unknown subtopic ${key}`);
    });
    const labels = (subtopics[category] || [])
      .filter((item) => (preset.subtopics || []).indexOf(item.key) !== -1)
      .map((item) => item.zh.replace(/[？?，、與及或的\s]/g, ''));
    (examples || []).forEach((example) => {
      const normalized = example.replace(/[？?，、與及或的\s]/g, '');
      labels.forEach((label) => {
        if (normalized === label || normalized === `我${label}`) {
          errors.push(`${deckName} ${category}/${spread}: example merely repeats subtopic "${example}"`);
        }
      });
    });
  });
});
}
validateRecommendations(recommendations, 'tarot');
validateRecommendations(lenormandRecommendations, 'lenormand');

const forbidden = {
  peach: /交往中|復合|前任|曖昧對象/,
  crush: /交往中|復合|前任|新的感情機會/,
  relationship: /目前單身|新對象|桃花/,
  fork: /整體運勢|單一問題/
};
Object.keys(forbidden).forEach((spread) => {
  Object.keys(presets).forEach((category) => {
    const preset = presets[category][spread];
    if (!preset) return;
    const text = (preset.examples || []).join(' ');
    if (forbidden[spread].test(text)) errors.push(`${category}/${spread}: mismatched wording "${text}"`);
  });
});

/* ---------- 面向選項的重複與對應表檢查 ----------
   「你最想知道什麼？」下拉與「想深入了解的面向」是兩套獨立機制，很容易不小心
   問到同一件事——實際發生過「未來可能遇到什麼類型的人」兩邊都出現，使用者等於
   同一題答兩次。同一組裡也曾有只是換句話說的選項（「我們是否適合穩定交往」
   ／「這段關係能否走向承諾」），選起來只會混淆。 */
const focusKeysByCat = {};
Object.keys(topicCfg).forEach((category) => {
  const groups = topicCfg[category].focusGroups || [];
  const keys = groups.map((g) => g.key);
  focusKeysByCat[category] = keys;
  keys.forEach((k) => { if (!k) errors.push(`${category}: focusGroup 缺少 key`); });
  if (new Set(keys).size !== keys.length) errors.push(`${category}: focusGroup key 重複`);

  const all = [];
  groups.forEach((g) => all.push(...g.options));
  // 1. 與下拉子問題逐字相同
  const subZh = (subtopics[category] || []).map((x) => x.zh);
  all.filter((o) => subZh.includes(o)).forEach((o) => {
    errors.push(`${category}: 面向「${o}」與「你最想知道什麼」的選項重複`);
  });
  // 2. 同分類內意思雷同（相鄰二字重疊率）
  const grams = (t) => {
    const x = t.replace(/[，、？。\s]/g, '');
    const out = new Set();
    for (let k = 0; k < x.length - 1; k++) out.add(x.slice(k, k + 2));
    return out;
  };
  for (let a = 0; a < all.length; a++) {
    for (let b = a + 1; b < all.length; b++) {
      const A = grams(all[a]); const B = grams(all[b]);
      if (!A.size || !B.size) continue;
      let shared = 0; A.forEach((g) => { if (B.has(g)) shared++; });
      const ratio = shared / Math.min(A.size, B.size);
      if (ratio >= 0.55) errors.push(`${category}: 面向「${all[a]}」與「${all[b]}」意思過於接近（${ratio.toFixed(2)}）`);
    }
  }
});
// 3. 兩份過濾對應表不能指到不存在的 key
[['SPREAD_FOCUS_GROUPS', spreadFocus], ['SUBTOPIC_FOCUS_GROUPS', subtopicFocus]].forEach(([name, table]) => {
  Object.keys(table || {}).forEach((category) => {
    Object.keys(table[category]).forEach((k) => {
      table[category][k].forEach((groupKey) => {
        if (!(focusKeysByCat[category] || []).includes(groupKey)) {
          errors.push(`${name}.${category}.${k} 指到不存在的分組 key「${groupKey}」`);
        }
      });
    });
  });
});
// 4. SUBTOPIC_FOCUS_GROUPS 的鍵必須是真的存在的子問題
Object.keys(subtopicFocus || {}).forEach((category) => {
  const keys = (subtopics[category] || []).map((x) => x.key);
  Object.keys(subtopicFocus[category]).forEach((k) => {
    if (!keys.includes(k)) errors.push(`SUBTOPIC_FOCUS_GROUPS.${category} 有不存在的子問題「${k}」`);
  });
});

if (errors.length) {
  console.error(`Reading question alignment failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const tarotChecked = Object.keys(recommendations).reduce((sum, category) => sum + recommendations[category].length, 0);
const lenormandChecked = Object.keys(lenormandRecommendations).reduce((sum, category) => sum + lenormandRecommendations[category].length, 0);
const focusTotal = Object.keys(topicCfg).reduce((n, cat) => n + (topicCfg[cat].focusGroups || []).reduce((m, g) => m + g.options.length, 0), 0);
console.log(`Reading question alignment passed: ${tarotChecked} tarot + ${lenormandChecked} lenormand spread/category pairs, ` +
  `${focusTotal} focus options checked for overlap.`);
