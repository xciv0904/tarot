'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '../..');
function element() { return {innerHTML:'', style:{}, classList:{add(){},remove(){}}, addEventListener(){}, setAttribute(){}, appendChild(){}, querySelector(){return null;}, querySelectorAll(){return [];}}; }
function runtime(overrides = {}) {
  const c = {console, setTimeout, clearTimeout, URL, Intl, Date, Math, JSON, Promise};
  c.window = c; c.navigator = {}; c.location = {hostname:'localhost', search:''};
  c.localStorage = {getItem(){return null;}, setItem(){}};
  const elements = {};
  c.document = {head:element(), body:element(), documentElement:element(), getElementById(id){return elements[id] || (elements[id] = element());}, querySelector(){return null;}, querySelectorAll(){return [];}, addEventListener(){}, createElement:element};
  vm.createContext(c);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const astrologyFiles = vm.runInNewContext(html.match(/var ASTROLOGY_DATA_FILES = (\[[\s\S]*?\]);/)[1]);
  const eager = [...html.matchAll(/<script defer src="([^"]+)"/g)].map(m => m[1]);
  ['assets/vendor/astronomy-engine-2.1.19.min.js', ...eager, ...astrologyFiles].forEach(url => {
    const file = url.split('?')[0];
    vm.runInContext(overrides[file] || fs.readFileSync(path.join(root, file), 'utf8'), c, {filename:file});
  });
  c.ensureAstrologyBodyKeys();
  return c;
}
// Arbitrary fictitious births; every longitude, house and aspect is computed by
// the unchanged production ephemeris. These are not hand-assigned placements.
const births = [
  ['spring-action',1991,3,25,8,10], ['winter-structure',1985,1,15,15,20],
  ['summer-information',2000,6,8,5,30], ['summer-care',1994,7,8,12,40],
  ['autumn-depth',1997,11,4,22,50], ['autumn-design',1988,10,15,18,0],
];
const ids = ['career-work-type','career-work-env','career-core-skill'];
function charts(c) { return births.map(([id,...args]) => ({id, chart:c.computeNatalChart(...args,25.033,121.5654,'Asia/Taipei','placidus')})); }
function visible(answer) { return {questionId:answer.questionId, headline:answer.headline, summary:answer.summary, details:answer.details, caution:answer.caution, primary:answer.primaryEvidence, semanticScores:answer.semanticProfile && answer.semanticProfile.scores}; }
module.exports = {runtime, births, charts, ids, visible, root};
