/* Golden Test Charts：不是名人或真實個資，而是為回歸測試設計的合成盤。
   每張盤刻意突出一種結構，確保解讀引擎不只對單一使用者命盤有效。 */
var GOLDEN_CHART_SPECS = [
  { id: 'fire_angular', label: '火象＋角宮強', asc: 0, mc: 9, signShift: 0, houseShift: 0, overrides: { Sun:[0,1], Moon:[4,7], Mars:[0,10], Jupiter:[8,9] } },
  { id: 'earth_saturn_career', label: '土象＋土星事業結構', asc: 9, mc: 6, signShift: 9, houseShift: 3, overrides: { Sun:[9,10], Mercury:[5,10], Saturn:[9,10], Venus:[1,6] } },
  { id: 'air_uranus_network', label: '風象＋天王星人際網絡', asc: 10, mc: 7, signShift: 2, houseShift: 6, overrides: { Sun:[10,11], Mercury:[2,11], Uranus:[10,1], Jupiter:[6,9] } },
  { id: 'water_lunar_home', label: '水象＋月亮家庭軸', asc: 3, mc: 0, signShift: 3, houseShift: 9, overrides: { Moon:[3,4], Sun:[11,4], Neptune:[11,12], Venus:[7,7] } },
  { id: 'tenth_house_stellium', label: '群星第十宮', asc: 6, mc: 3, signShift: 6, houseShift: 2, overrides: { Sun:[9,10], Mercury:[10,10], Venus:[11,10], Mars:[0,10], Saturn:[9,10] } },
  { id: 'twelfth_house_stellium', label: '群星第十二宮', asc: 11, mc: 8, signShift: 11, houseShift: 4, overrides: { Sun:[11,12], Moon:[0,12], Mercury:[10,12], Neptune:[11,12], Pluto:[7,12] } },
  { id: 'relationship_axis', label: '第七宮關係軸強', asc: 9, mc: 6, signShift: 4, houseShift: 7, overrides: { Moon:[4,7], Venus:[6,7], Jupiter:[4,7], Mars:[5,8] } },
  { id: 'second_eighth_resources', label: '第二／八宮資源軸', asc: 1, mc: 10, signShift: 1, houseShift: 1, overrides: { Venus:[1,2], Saturn:[9,2], Pluto:[7,8], Jupiter:[8,8] } },
  { id: 'fifth_house_creative', label: '第五宮創作表現', asc: 4, mc: 1, signShift: 4, houseShift: 5, overrides: { Sun:[4,5], Venus:[6,5], Mars:[0,5], Neptune:[11,5] } },
  { id: 'sixth_house_routine', label: '第六宮工作健康節奏', asc: 5, mc: 2, signShift: 5, houseShift: 8, overrides: { Sun:[5,6], Mercury:[5,6], Mars:[9,6], Saturn:[1,6] } },
  { id: 'ninth_house_learning', label: '第九宮學習跨域', asc: 8, mc: 5, signShift: 8, houseShift: 10, overrides: { Mercury:[2,9], Jupiter:[8,9], Uranus:[10,9], Sun:[8,9] } },
  { id: 'fixed_tension', label: '固定星座＋張力相位', asc: 7, mc: 4, signShift: 7, houseShift: 11, overrides: { Sun:[4,1], Moon:[10,7], Venus:[1,4], Mars:[7,10], Saturn:[10,7] } },
];

var GOLDEN_PLANET_KEYS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];

function goldenNorm(value, size) { return ((value % size) + size) % size; }
function goldenBuildChart(spec) {
  var planets = {}, points = {}, aspects = [];
  GOLDEN_PLANET_KEYS.forEach(function (key, index) {
    var pair = spec.overrides[key] || [goldenNorm(index * 2 + spec.signShift, 12), goldenNorm(index + spec.houseShift, 12) + 1];
    var deg = 2 + ((index * 7 + spec.signShift) % 25);
    planets[key] = { sign: pair[0], house: pair[1], deg: deg, lon: pair[0] * 30 + deg, retro: key === 'Saturn' || (index + spec.signShift) % 5 === 0 };
  });
  var pointKeys = ['Node','SNode','Lilith','Chiron','Fortune','Vertex'];
  pointKeys.forEach(function (key, index) {
    var sign = goldenNorm(spec.signShift + index * 2 + 1, 12), house = goldenNorm(spec.houseShift + index * 3, 12) + 1;
    points[key] = { sign: sign, house: house, deg: 12 + index, lon: sign * 30 + 12 + index, retro: key === 'Node' || key === 'SNode' };
  });
  for (var i = 0; i < GOLDEN_PLANET_KEYS.length; i++) {
    for (var j = i + 1; j < GOLDEN_PLANET_KEYS.length; j++) {
      var a = planets[GOLDEN_PLANET_KEYS[i]].lon, b = planets[GOLDEN_PLANET_KEYS[j]].lon;
      var diff = Math.abs(a - b); if (diff > 180) diff = 360 - diff;
      var types = [[0,'conjunction',8],[60,'sextile',4],[90,'square',6],[120,'trine',6],[180,'opposition',8]];
      var best = null;
      types.forEach(function (row) { var orb = Math.abs(diff-row[0]); if (orb <= row[2] && (!best || orb < best.orb)) best = { type:row[1], orb:orb }; });
      if (best) aspects.push({ a:GOLDEN_PLANET_KEYS[i], b:GOLDEN_PLANET_KEYS[j], type:best.type, orb:best.orb });
    }
  }
  var asc = spec.asc * 30 + 12, houseCusps = [];
  for (var h = 0; h < 12; h++) houseCusps.push(goldenNorm(asc + h * 30, 360));
  return { fixtureId:spec.id, fixtureLabel:spec.label, asc:asc, mc:spec.mc*30+8, ascSign:spec.asc, mcSign:spec.mc, houseSystem:'whole', houseCusps:houseCusps, planets:planets, points:points, aspects:aspects };
}

var GOLDEN_TEST_CHARTS = GOLDEN_CHART_SPECS.map(goldenBuildChart);

if (typeof module !== 'undefined') module.exports = { GOLDEN_CHART_SPECS:GOLDEN_CHART_SPECS, GOLDEN_TEST_CHARTS:GOLDEN_TEST_CHARTS };

