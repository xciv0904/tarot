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
vm.runInContext(source + '\nthis.__presets = SPREAD_QUESTION_PRESETS; this.__subtopics = SUBTOPICS; this.__recs = RECOMMENDATIONS; this.__lenRecs = LEN_RECOMMENDATIONS;', sandbox);

const presets = sandbox.__presets;
const subtopics = sandbox.__subtopics;
const recommendations = sandbox.__recs;
const lenormandRecommendations = sandbox.__lenRecs;
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
    if (!preset.examples || preset.examples.length < 3) {
      errors.push(`${deckName} ${category}/${spread}: needs at least 3 examples`);
    }
    const validKeys = new Set((subtopics[category] || []).map((item) => item.key));
    (preset.subtopics || []).forEach((key) => {
      if (!validKeys.has(key)) errors.push(`${deckName} ${category}/${spread}: unknown subtopic ${key}`);
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

if (errors.length) {
  console.error(`Reading question alignment failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const tarotChecked = Object.keys(recommendations).reduce((sum, category) => sum + recommendations[category].length, 0);
const lenormandChecked = Object.keys(lenormandRecommendations).reduce((sum, category) => sum + lenormandRecommendations[category].length, 0);
console.log(`Reading question alignment passed: ${tarotChecked} tarot + ${lenormandChecked} lenormand spread/category pairs checked.`);
