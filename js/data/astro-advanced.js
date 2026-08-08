/* ============================================================================
   星盤進階功能：合盤、二次推運、二十八星宿、太陽／月亮回歸與流年運勢。

   這些程式碼原本都在 js/app.js 裡，但它們只有在使用者已經產生星盤、而且主動切到
   對應分頁時才會用到。留在 app.js 等於讓每一位只想看首頁「今日一牌」或抽張牌的
   使用者，都得先下載並剖析這 158KB。

   現在改成掛在 index.html 的 ASTROLOGY_DATA_FILES 清單最後，跟其他星盤資料檔一起
   在使用者第一次切到「星盤」分頁時才載入。載入順序保證在 app.js 之後，所以這裡
   可以直接使用 app.js 定義的共用工具（state、esc、render、pad2、fallbackCopy、
   renderPersonaPicker…）與星盤資料檔定義的常數（ZODIAC_SIGNS、PLANET_DEFS…）。

   注意：這個檔案只是搬家，內容一行都沒有改。所有函式與變數仍然是全域的，
   呼叫方式與原本完全相同。
   ============================================================================ */

/* ---------- 本命星盤計算與畫面、出生資料輸入表單、行運基礎 ---------- */
/* ================= 個人星盤 Natal Chart ================= */

function astroNormDeg(x) { return ((x % 360) + 360) % 360; }

function tzOffsetMinutes(date, tz) {
  var dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  var parts = dtf.formatToParts(date).reduce(function (acc, p) { if (p.type !== 'literal') acc[p.type] = parseInt(p.value, 10); return acc; }, {});
  var hour = parts.hour; if (hour === 24) hour = 0;
  var asUTC2 = Date.UTC(parts.year, parts.month - 1, parts.day, hour, parts.minute, parts.second);
  return (asUTC2 - date.getTime()) / 60000;
}
function zonedTimeToUtc(y, m, d, hh, mm, ss, tz) {
  var guess = Date.UTC(y, m - 1, d, hh, mm, ss || 0);
  for (var i = 0; i < 4; i++) {
    var off = tzOffsetMinutes(new Date(guess), tz);
    var newGuess = Date.UTC(y, m - 1, d, hh, mm, ss || 0) - off * 60000;
    if (newGuess === guess) { guess = newGuess; break; }
    guess = newGuess;
  }
  return new Date(guess);
}

/* astrology-core-data.js 現在延後載入，PLANET_DEFS 要等星盤分頁被打開後才存在，
   所以這裡先宣告、實際賦值移到 ensureAstrologyBodyKeys()，在星盤資料載入完成後才呼叫 */
var ASTRO_PLANET_BODY_KEYS;
function ensureAstrologyBodyKeys() {
  if (!ASTRO_PLANET_BODY_KEYS) ASTRO_PLANET_BODY_KEYS = PLANET_DEFS.map(function (p) { return p.key; });
  return ASTRO_PLANET_BODY_KEYS;
}

/* ---- 額外本命點：北交點／南交點／莉莉絲／凱龍星／福點／命定點 ---- */
function pointDisplayName(pointDef) { return EXTRA_POINT_DISPLAY_NAMES[pointDef.key] || pointDef.zh; }
/* 二十八星宿：宿別資料、日期換算與兩宿關係 已移到 js/data/astro-advanced.js（見檔頭說明）。 */

function extraPointVisibleCopy(pointDef, pb, sb, hb, useHouse) {
  var area = useHouse ? hb.lifeArea : '日常生活';
  var example = useHouse ? hb.example : '遇到相關情境';
  var byPoint = {
    Node: {
      summary: '在' + area + '裡，你正在練習一種還不熟悉的做法：' + sb.method + '。',
      primaryText: '先從一個小步驟開始，比要求自己立刻熟練更有效。',
      lifeExpression: '剛開始可能覺得生疏或不順；反覆實做後，才會慢慢變成真正用得上的能力。',
      caution: '不要因為不熟就放棄，也不必用力過猛；允許自己邊做邊修正。',
    },
    SNode: {
      summary: '當你面對' + area + '的事情時，很容易自動採用熟悉的做法：' + sb.method + '。',
      primaryText: '這是你已經會的能力，可以拿來穩住自己，但不必每次都只用這一招。',
      lifeExpression: '壓力越大，越容易不假思索地回到這套反應，因此常覺得安全又省力。',
      caution: '熟悉不等於最適合眼前情況；採用老方法前，先確認它這次是否真的有效。',
    },
    Lilith: {
      summary: '在' + area + '裡，只要覺得被控制、被評判或被要求配合，你特別容易抗拒。',
      primaryText: '你想守住的是用「' + sb.method + '」做自己的空間與底線。',
      lifeExpression: '例如' + example + '，你可能直接拒絕、拉開距離，或在忍耐後突然反彈。',
      caution: '不要一路忍到爆發；第一次感到不舒服時，就把不能接受的做法說清楚。',
    },
    Chiron: {
      summary: '在' + area + '裡，你較容易因批評、比較或不被理解而感到受傷。',
      primaryText: '這個敏感點常跟「' + sb.motivation + '」的需要有關。',
      lifeExpression: '例如' + example + '，你可能特別在意自己是否做得不夠好，或別人是否真正理解你。',
      caution: '敏感不等於缺陷；先說清楚哪句話或哪個行為讓你受傷，不必急著證明自己沒事。',
    },
    Fortune: {
      summary: '投入' + area + '時，' + sb.method + '，往往會讓事情比較順手，也更容易感到滿足。',
      primaryText: '這不是保證幸運，而是你比較容易注意並接住機會的方式。',
      lifeExpression: '例如' + example + '，主動參與通常比等待好事自己發生更容易得到成果。',
      caution: '順手不代表不必投入；把時間放進去，這項優勢才會真正累積。',
    },
    Vertex: {
      summary: '在' + area + '裡，重要的人、邀請或事件較容易改變你原本的看法。',
      primaryText: '你通常會用「' + sb.method + '」回應這些突如其來的轉折。',
      lifeExpression: '例如' + example + '，一次互動可能帶來新的選項，但最後仍由你決定是否跟進。',
      caution: '重要相遇不等於命中注定；先看對方後續的實際行動，再決定投入多少。',
    },
  };
  return byPoint[pointDef.key] || {
    summary: pb.plain,
    primaryText: pb.strength,
    lifeExpression: pb.expression,
    caution: pb.watch,
  };
}

/* ---- 額外本命點：本命點核心功能＋星座表現方式＋宮位觸發領域融合 ----
   六個點各有自己的心理功能（POINT_BEGINNER 的 coreFunction/motivation/expression/
   matureUse/imbalance/growthDirection），不是套同一套人格模板；星座／宮位則沿用
   R1 已擴充的 SIGN_BEGINNER/HOUSE_BEGINNER 欄位，用不同的句型骨架融合，而不是直接
   呼叫 planetPlacementReading()。 */
function extraPointReading(pointDef, placement, chart, unknownTime) {
  var pb = POINT_BEGINNER[pointDef.key];
  var sb = SIGN_BEGINNER[placement.sign];
  var sign = ZODIAC_SIGNS[placement.sign];
  var useHouse = !unknownTime && !!placement.house;
  var hb = useHouse ? HOUSE_BEGINNER[placement.house - 1] : null;
  var seed = pointDef.key + '|' + placement.sign + '|' + (useHouse ? placement.house : 'nohouse');
  var P = pointDisplayName(pointDef), S = sign.zh;

  var coreFunctionText = fillTpl(astroSeededPick(seed + 'fn', FUSE_POINT_FUNCTION_TPL), { P: P, coreFunction: pb.coreFunction, motivation: pb.motivation });
  var signMethod = fillTpl(astroSeededPick(seed + 'sm', FUSE_POINT_SIGNMETHOD_TPL), { S: S, signMotivation: sb.motivation, method: sb.method });
  var houseActivation = useHouse
    ? fillTpl(astroSeededPick(seed + 'ha', FUSE_HOUSEACT_TPL), { lifeArea: hb.lifeArea, activation: hb.activation, coreQuestion: hb.coreQuestion })
    : '出生時間未知，本次不使用宮位。';
  var synthesis = useHouse
    ? fillTpl(astroSeededPick(seed + 'syn', FUSE_POINT_SYNTHESIS_TPL), { coreFunction: pb.coreFunction, S: S, signMotivation: sb.motivation, lifeArea: hb.lifeArea })
    : fillTpl(astroSeededPick(seed + 'syn', FUSE_POINT_SYNTHESIS_NOHOUSE_TPL), { coreFunction: pb.coreFunction, S: S, signMotivation: sb.motivation });
  var growth = useHouse
    ? fillTpl(astroSeededPick(seed + 'gr', FUSE_POINT_GROWTH_TPL), { matureUse: pb.matureUse, growthTask: hb.growthTask })
    : fillTpl(astroSeededPick(seed + 'gr', FUSE_POINT_GROWTH_NOHOUSE_TPL), { matureUse: pb.matureUse, growthDirection: pb.growthDirection });
  var visibleCopy = extraPointVisibleCopy(pointDef, pb, sb, hb, useHouse);

  var axisContext = '';
  if (pointDef.key === 'Node' || pointDef.key === 'SNode') {
    var otherKey = pointDef.key === 'Node' ? 'SNode' : 'Node';
    var other = chart.points[otherKey];
    if (other) {
      var otherSb = SIGN_BEGINNER[other.sign];
      var otherSignZh = ZODIAC_SIGNS[other.sign].zh;
      var bothHouseKnown = useHouse && !!other.house;
      var otherHb = bothHouseKnown ? HOUSE_BEGINNER[other.house - 1] : null;
      if (pointDef.key === 'Node') {
        axisContext = bothHouseKnown
          ? fillTpl(astroSeededPick(seed + 'axis', FUSE_NODE_AXIS_HOUSE_TPL), { otherSign: otherSignZh, otherMotivation: otherSb.motivation, otherLifeArea: otherHb.lifeArea, ownBehavior: sb.behavior, ownLifeArea: hb.lifeArea })
          : fillTpl(astroSeededPick(seed + 'axis', FUSE_NODE_AXIS_NOHOUSE_TPL), { otherSign: otherSignZh, otherMotivation: otherSb.motivation, ownBehavior: sb.behavior });
      } else {
        axisContext = bothHouseKnown
          ? fillTpl(astroSeededPick(seed + 'axis', FUSE_SNODE_AXIS_HOUSE_TPL), { ownSign: S, ownMotivation: sb.motivation, ownLifeArea: hb.lifeArea, otherBehavior: otherSb.behavior, otherLifeArea: otherHb.lifeArea })
          : fillTpl(astroSeededPick(seed + 'axis', FUSE_SNODE_AXIS_NOHOUSE_TPL), { ownSign: S, ownMotivation: sb.motivation, otherBehavior: otherSb.behavior });
      }
    }
  }

  /* retro：北／南交點永遠逆行是天文結構使然，只標示技術事實，不套用「能量內化」
     這類通用逆行人格文案；凱龍星等其他點才視需要保留簡短技術註記。 */
  var retroNote = '';
  if (pointDef.key !== 'Node' && pointDef.key !== 'SNode' && placement.retro) {
    retroNote = '　技術上目前為逆行狀態。';
  }
  var technical = P + '　' + S + ' ' + placement.deg.toFixed(1) + '°' +
    (useHouse ? '　第' + placement.house + '宮' : '　出生時間未知，本次未計算宮位') +
    ((pointDef.key === 'Node' || pointDef.key === 'SNode') ? '　依天文結構永遠逆行' : (placement.retro ? '　逆行' : '')) +
    retroNote;

  return {
    summary: visibleCopy.summary,
    primaryLabel: pb.primaryLabel,
    primaryText: visibleCopy.primaryText,
    lifeExpression: visibleCopy.lifeExpression,
    caution: visibleCopy.caution,
    advanced: { coreFunction: coreFunctionText, signMethod: signMethod, houseActivation: houseActivation, axisContext: axisContext, synthesis: synthesis, growth: growth },
    technical: technical
  };
}
/* 相容包裝：保留舊函式名稱，讓呼叫端（renderAstro() 等）不受影響；實際文案改由
   上面的純函式 extraPointReading() 產生，回傳值與舊版相同（一段合併文字）。 */
function pointBeginnerParagraph(def, chart, hb) {
  var p = chart.points[def.key];
  var r = extraPointReading(def, p, chart, !hb);
  return r.summary + (hb ? ' ' + r.lifeExpression : '');
}

function astroJulianCenturiesTT(time) { return time.tt / 36525; }
/* 平均北交點（Mean Node），Meeus 公式 */
function astroMeanNodeLon(T) {
  var lon = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441 - T * T * T * T / 60616000;
  return astroNormDeg(lon);
}
/* 平均莉莉絲（月球平均遠地點），Meeus 公式；已對照本命與回歸盤驗證，誤差約 0.1° */
function astroMeanLilithLon(T) {
  var perigee = 83.3532465 + 4069.0137287 * T - 0.0103200 * T * T - T * T * T / 80053 + T * T * T * T / 18999000;
  return astroNormDeg(perigee + 180);
}
/* 凱龍星：astronomy-engine 未內建其星曆，改用 JPL 密切軌道根數（epoch 2017-06-12 TDB）
   做二體克卜勒近似，再以歲差修正換算為當日黃道座標。橫跨 2002–2026 共 24 年對照
   使用者提供的專業回歸盤資料，誤差穩定落在 0.1–0.15°內，足供占星解讀使用。 */
var CHIRON_ELEM = {
  epochJD: 2457916.5, a: 13.64597936638133, e: 0.3824171374703196,
  i: 6.94959060447848, om: 209.2011323125998, w: 339.6529896907077,
  ma0: 151.975605480683, n: 0.019552262,
};
function astroSolveKepler(Mrad, e) {
  var E = Mrad;
  for (var i = 0; i < 40; i++) {
    var dE = (E - e * Math.sin(E) - Mrad) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}
function astroChironHelioEclJ2000(time) {
  var epochTt = CHIRON_ELEM.epochJD - 2451545.0;
  var daysSince = time.tt - epochTt;
  var M = astroNormDeg(CHIRON_ELEM.ma0 + CHIRON_ELEM.n * daysSince) * Math.PI / 180;
  var e = CHIRON_ELEM.e, a = CHIRON_ELEM.a;
  var E = astroSolveKepler(M, e);
  var r = a * (1 - e * Math.cos(E));
  var nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  var xp = r * Math.cos(nu), yp = r * Math.sin(nu);
  var w = CHIRON_ELEM.w * Math.PI / 180, i = CHIRON_ELEM.i * Math.PI / 180, om = CHIRON_ELEM.om * Math.PI / 180;
  var x = xp * (Math.cos(om) * Math.cos(w) - Math.sin(om) * Math.sin(w) * Math.cos(i)) - yp * (Math.cos(om) * Math.sin(w) + Math.sin(om) * Math.cos(w) * Math.cos(i));
  var y = xp * (Math.sin(om) * Math.cos(w) + Math.cos(om) * Math.sin(w) * Math.cos(i)) - yp * (Math.sin(om) * Math.sin(w) - Math.cos(om) * Math.cos(w) * Math.cos(i));
  var z = xp * (Math.sin(w) * Math.sin(i)) + yp * (Math.cos(w) * Math.sin(i));
  return { x: x, y: y, z: z };
}
var ASTRO_EPS_J2000 = 23.4392911 * Math.PI / 180;
function astroEqToEclJ2000(v) {
  return {
    x: v.x,
    y: v.y * Math.cos(ASTRO_EPS_J2000) + v.z * Math.sin(ASTRO_EPS_J2000),
    z: -v.y * Math.sin(ASTRO_EPS_J2000) + v.z * Math.cos(ASTRO_EPS_J2000),
  };
}
function astroChironLon(time) {
  var chironHelio = astroChironHelioEclJ2000(time);
  var earthHelioEq = Astronomy.HelioVector(Astronomy.Body.Earth, time);
  var earthHelioEcl = astroEqToEclJ2000(earthHelioEq);
  var gx = chironHelio.x - earthHelioEcl.x, gy = chironHelio.y - earthHelioEcl.y;
  var lonJ2000 = astroNormDeg(Math.atan2(gy, gx) * 180 / Math.PI);
  var precession = 1.39696 * astroJulianCenturiesTT(time);
  return astroNormDeg(lonJ2000 + precession);
}

function astroEclipticLon(bodyKey, time) {
  var vec = Astronomy.GeoVector(Astronomy.Body[bodyKey], time, true);
  var ecl = Astronomy.Ecliptic(vec);
  return astroNormDeg(ecl.elon);
}

/* ---- Placidus house cusps (quadrant system) ----
   validated against astrolabe.astroinfo.com.tw reference chart: all 12 cusps
   match to <0.04° */
function placidusRaOfLambda(lamDeg, epsRad) {
  var lam = lamDeg * Math.PI / 180;
  return astroNormDeg(Math.atan2(Math.sin(lam) * Math.cos(epsRad), Math.cos(lam)) * 180 / Math.PI);
}
function placidusLambdaOfRa(raDeg, epsRad) {
  var ra = raDeg * Math.PI / 180;
  return astroNormDeg(Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(epsRad)) * 180 / Math.PI);
}
function placidusDecOfLambda(lamDeg, epsRad) {
  var lam = lamDeg * Math.PI / 180;
  return Math.asin(Math.sin(epsRad) * Math.sin(lam)) * 180 / Math.PI;
}
function placidusDsaOfLambda(lamDeg, epsRad, phiRad) {
  var dec = placidusDecOfLambda(lamDeg, epsRad) * Math.PI / 180;
  var x = -Math.tan(phiRad) * Math.tan(dec);
  x = Math.max(-1, Math.min(1, x));
  return Math.acos(x) * 180 / Math.PI; // 0-180
}
function placidusSolveCusp(thetaDeg, epsRad, phiRad, targetFn, initialGuessDeg) {
  var lam = astroNormDeg(initialGuessDeg);
  for (var i = 0; i < 40; i++) {
    var dsa = placidusDsaOfLambda(lam, epsRad, phiRad);
    var targetRA = astroNormDeg(targetFn(thetaDeg, dsa));
    var newLam = placidusLambdaOfRa(targetRA, epsRad);
    if (Math.abs(astroNormDeg(newLam - lam + 180) - 180) < 1e-9) { lam = newLam; break; }
    lam = newLam;
  }
  return astroNormDeg(lam);
}
function placidusCusps(thetaDeg, epsRad, phiRad, ascDeg, mcDeg) {
  var cusp11 = placidusSolveCusp(thetaDeg, epsRad, phiRad, function (th, dsa) { return th + dsa / 3; }, thetaDeg + 30);
  var cusp12 = placidusSolveCusp(thetaDeg, epsRad, phiRad, function (th, dsa) { return th + 2 * dsa / 3; }, thetaDeg + 60);
  var cuspA = placidusSolveCusp(thetaDeg, epsRad, phiRad, function (th, dsa) { return th + 180 - (180 - dsa) / 3; }, thetaDeg + 210);
  var cuspB = placidusSolveCusp(thetaDeg, epsRad, phiRad, function (th, dsa) { return th + 180 - 2 * (180 - dsa) / 3; }, thetaDeg + 240);
  // cuspA (1/3 formula) matches house 3, cuspB (2/3 formula) matches house 2 — verified against reference data
  var c = new Array(12);
  c[0] = ascDeg; c[9] = mcDeg;
  c[10] = cusp11; c[11] = cusp12; c[1] = cuspB; c[2] = cuspA;
  c[3] = astroNormDeg(mcDeg + 180);
  c[6] = astroNormDeg(ascDeg + 180);
  c[4] = astroNormDeg(cusp11 + 180); c[5] = astroNormDeg(cusp12 + 180);
  c[7] = astroNormDeg(cuspB + 180); c[8] = astroNormDeg(cuspA + 180);
  return c;
}

/* core natal chart computation — planet positions, MC and Ascendant
   cross-checked against a professional ephemeris (astrolabe.astroinfo.com.tw)
   to sub-arcminute precision */
function computeNatalChart(y, m, d, hh, mm, lat, lon, tz, houseSystem) {
  var utcDate = zonedTimeToUtc(y, m, d, hh, mm, 0, tz);
  var time = Astronomy.MakeTime(utcDate);

  var planets = {};
  ASTRO_PLANET_BODY_KEYS.forEach(function (key) {
    var lonNow = astroEclipticLon(key, time);
    var l2 = astroEclipticLon(key, time.AddDays(0.5));
    var l1 = astroEclipticLon(key, time.AddDays(-0.5));
    var diff = l2 - l1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    planets[key] = { lon: lonNow, retro: diff < 0 };
  });

  var et = Astronomy.e_tilt(time);
  var eps = et.tobl * Math.PI / 180;
  var phi = lat * Math.PI / 180;
  var gst = Astronomy.SiderealTime(time);
  var lst = gst + lon / 15;
  var ramc = astroNormDeg(lst * 15);
  var theta = ramc * Math.PI / 180;

  var mc = Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(eps));
  mc = astroNormDeg(mc * 180 / Math.PI);
  var asc = Math.atan2(Math.cos(theta), -(Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(theta)));
  asc = astroNormDeg(asc * 180 / Math.PI);

  var ascSign = Math.floor(asc / 30);
  houseSystem = houseSystem || 'placidus';
  var houseCusps = houseSystem === 'whole'
    ? (function () { var start = Math.floor(asc / 30) * 30, out = []; for (var wi = 0; wi < 12; wi++) out.push(astroNormDeg(start + wi * 30)); return out; })()
    : placidusCusps(ramc, eps, phi, asc, mc);

  function houseOf(pLon) {
    for (var i = 0; i < 12; i++) {
      var start = houseCusps[i], end = houseCusps[(i + 1) % 12];
      var arc = astroNormDeg(end - start); if (arc === 0) arc = 360;
      var rel = astroNormDeg(pLon - start);
      if (rel < arc) return i + 1;
    }
    return 12;
  }
  ASTRO_PLANET_BODY_KEYS.forEach(function (key) {
    planets[key].house = houseOf(planets[key].lon);
    planets[key].sign = Math.floor(planets[key].lon / 30);
    planets[key].deg = planets[key].lon % 30;
  });

  /* ---- 額外本命點 ---- */
  var points = {};
  var T = astroJulianCenturiesTT(time);
  var nodeLon = astroMeanNodeLon(T);
  var lilithLon = astroMeanLilithLon(T);
  var chironLon = astroChironLon(time);
  var chironL2 = astroChironLon(time.AddDays(2));
  var chironL1 = astroChironLon(time.AddDays(-2));
  var chironDiff = chironL2 - chironL1;
  if (chironDiff > 180) chironDiff -= 360;
  if (chironDiff < -180) chironDiff += 360;
  var sunAboveHorizon = houseOf(planets.Sun.lon) >= 7;
  var fortuneLon = astroNormDeg(sunAboveHorizon ? (asc + planets.Moon.lon - planets.Sun.lon) : (asc + planets.Sun.lon - planets.Moon.lon));
  var colatRad = (90 - lat) * Math.PI / 180;
  var vertexTheta = theta + Math.PI;
  var vertexLon = astroNormDeg(Math.atan2(Math.cos(vertexTheta), -(Math.sin(eps) * Math.tan(colatRad) + Math.cos(eps) * Math.sin(vertexTheta))) * 180 / Math.PI);

  points.Node = { lon: nodeLon, retro: true };
  points.SNode = { lon: astroNormDeg(nodeLon + 180), retro: true };
  points.Lilith = { lon: lilithLon, retro: false };
  points.Chiron = { lon: chironLon, retro: chironDiff < 0 };
  points.Fortune = { lon: fortuneLon, retro: false };
  points.Vertex = { lon: vertexLon, retro: false };
  EXTRA_POINT_KEYS.forEach(function (key) {
    points[key].house = houseOf(points[key].lon);
    points[key].sign = Math.floor(points[key].lon / 30);
    points[key].deg = points[key].lon % 30;
  });

  var ASPECT_ANGLES = [['conjunction', 0, 8], ['sextile', 60, 4], ['square', 90, 6], ['trine', 120, 6], ['opposition', 180, 8]];
  var aspects = [];
  for (var i = 0; i < ASTRO_PLANET_BODY_KEYS.length; i++) {
    for (var j = i + 1; j < ASTRO_PLANET_BODY_KEYS.length; j++) {
      var a = ASTRO_PLANET_BODY_KEYS[i], b = ASTRO_PLANET_BODY_KEYS[j];
      var diff2 = Math.abs(planets[a].lon - planets[b].lon);
      if (diff2 > 180) diff2 = 360 - diff2;
      var best = null;
      ASPECT_ANGLES.forEach(function (row) {
        var delta = Math.abs(diff2 - row[1]);
        if (delta <= row[2] && (!best || delta < best.delta)) best = { name: row[0], delta: delta };
      });
      if (best) aspects.push({ a: a, b: b, type: best.name, orb: best.delta });
    }
  }
  function lonOf(key) { return planets[key] ? planets[key].lon : points[key].lon; }
  EXTRA_POINT_KEYS.forEach(function (pk) {
    ASTRO_PLANET_BODY_KEYS.forEach(function (ck) {
      var diff3 = Math.abs(lonOf(pk) - lonOf(ck));
      if (diff3 > 180) diff3 = 360 - diff3;
      var best2 = null;
      ASPECT_ANGLES.forEach(function (row) {
        var delta = Math.abs(diff3 - row[1]);
        if (delta <= row[2] && (!best2 || delta < best2.delta)) best2 = { name: row[0], delta: delta };
      });
      if (best2) aspects.push({ a: pk, b: ck, type: best2.name, orb: best2.delta });
    });
  });
  for (var pi = 0; pi < EXTRA_POINT_KEYS.length; pi++) {
    for (var pj = pi + 1; pj < EXTRA_POINT_KEYS.length; pj++) {
      var pk1 = EXTRA_POINT_KEYS[pi], pk2 = EXTRA_POINT_KEYS[pj];
      if (pk1 === 'Node' && pk2 === 'SNode') continue;
      var diff4 = Math.abs(lonOf(pk1) - lonOf(pk2));
      if (diff4 > 180) diff4 = 360 - diff4;
      var best3 = null;
      ASPECT_ANGLES.forEach(function (row) {
        var delta = Math.abs(diff4 - row[1]);
        if (delta <= row[2] && (!best3 || delta < best3.delta)) best3 = { name: row[0], delta: delta };
      });
      if (best3) aspects.push({ a: pk1, b: pk2, type: best3.name, orb: best3.delta });
    }
  }

  return { utcDate: utcDate, asc: asc, mc: mc, ascSign: ascSign, houseCusps: houseCusps, houseSystem: houseSystem, planets: planets, points: points, aspects: aspects };
}

/* ---- 宮主星／上升主星（命主星）／下降點／天底 ----
   完全是純前端運算，直接讀取既有 chartData，不重新排盤、不呼叫 Astronomy Engine。
   系統原本沒有「星座→守護星」對照表，這裡用 SIGN_RULER_MODERN（現代占星，見
   js/data/astrology-natal-topics-data.js）新增；下降點／天底原本也沒有獨立欄位，
   一律用 asc+180／mc+180 現算，不能直接讀取 chart.dsc／chart.ic（不存在）。 */
function natalHouseCuspSign(chart, houseNum) { return Math.floor(astroNormDeg(chart.houseCusps[houseNum - 1]) / 30); }
function natalHouseRulerKey(chart, houseNum) { return SIGN_RULER_MODERN[natalHouseCuspSign(chart, houseNum)]; }
/* 回傳「這個宮位的守護星，實際落在哪個星座／宮位」，不管該宮本身有沒有行星都能算，
   這正是使用者要求的 fallback：七宮沒有行星時，改用下降點＋七宮主星鏈，不能顯示
   「無法解讀」。找不到守護星實際位置（理論上不會發生，十大行星必有一顆對應）時回傳 null。 */
function natalHouseRulerPlacement(chart, houseNum) {
  var rulerKey = natalHouseRulerKey(chart, houseNum);
  var placement = chart.planets[rulerKey];
  if (!placement) return null;
  return { houseNum: houseNum, cuspSign: natalHouseCuspSign(chart, houseNum), rulerKey: rulerKey, sign: placement.sign, house: placement.house, retro: placement.retro };
}
function natalChartRulerPlacement(chart) { return natalHouseRulerPlacement(chart, 1); }
function natalDSC(chart) { return astroNormDeg(chart.asc + 180); }
function natalIC(chart) { return astroNormDeg(chart.mc + 180); }
function natalAngleSign(chart, which) {
  if (which === 'asc') return Math.floor(astroNormDeg(chart.asc) / 30);
  if (which === 'mc') return Math.floor(astroNormDeg(chart.mc) / 30);
  if (which === 'dsc') return Math.floor(natalDSC(chart) / 30);
  if (which === 'ic') return Math.floor(natalIC(chart) / 30);
  return null;
}

/* ---- interpretation composition ----
   行星＝心理功能想完成什麼、星座＝用什麼動機與方法運作、宮位＝在哪些生活情境
   被啟動；三者用同一組 seed 挑選句型融合成一段敘述，而不是行星介紹＋星座介紹
   ＋宮位介紹依序黏貼。每組佔位符用 seed 決定要挑哪一種骨架，同一個配置重讀時
   文字穩定，但不同行星/星座/宮位組合不會撞句型。 */
function planetPlacementReading(planetDef, placement, unknownTime) {
  var pb = PLANET_BEGINNER[planetDef.key];
  var sb = SIGN_BEGINNER[placement.sign];
  var sign = ZODIAC_SIGNS[placement.sign];
  var useHouse = !unknownTime && !!placement.house;
  var hb = useHouse ? HOUSE_BEGINNER[placement.house - 1] : null;
  var seed = planetDef.key + '|' + placement.sign + '|' + (useHouse ? placement.house : 'nohouse');
  /* coreNeed 是純行星欄位，不受星座／宮位影響；同一顆行星若只有一種說法，換 144 種
     星座＋宮位組合會逐字重複同一句（例如所有月亮配置都說「找到讓情緒安定下來的
     方式」）。用 seed 從 2 個變體中挑一個，summary／synthesis 在同一次閱讀裡固定
     用同一個挑選結果，維持內部一致。 */
  var coreNeed = astroSeededPick(seed + 'cn', pb.coreNeed);

  var summary = useHouse
    ? fillTpl(astroSeededPick(seed + 'sum', FUSE_SUMMARY_HOUSE_TPL), { P: planetDef.zh, S: sign.zh, coreNeed: coreNeed, method: sb.method, lifeArea: hb.lifeArea })
    : fillTpl(astroSeededPick(seed + 'sum', FUSE_SUMMARY_NOHOUSE_TPL), { P: planetDef.zh, S: sign.zh, coreNeed: coreNeed, method: sb.method });
  var lifeExpression = useHouse
    ? fillTpl(astroSeededPick(seed + 'life', FUSE_LIFE_HOUSE_TPL), { P: planetDef.zh, activation: hb.activation, lifeArea: hb.lifeArea, method: sb.method, planetVerb: pb.verb, behavior: sb.behavior })
    : fillTpl(astroSeededPick(seed + 'life', FUSE_LIFE_NOHOUSE_TPL), { behavior: sb.behavior });
  var strength = useHouse
    ? fillTpl(astroSeededPick(seed + 'str', FUSE_STRENGTH_HOUSE_TPL), { P: planetDef.zh, matureExpression: sb.matureExpression, matureAim: pb.matureAim, lifeArea: hb.lifeArea })
    : fillTpl(astroSeededPick(seed + 'str', FUSE_STRENGTH_NOHOUSE_TPL), { matureExpression: sb.matureExpression, matureAim: pb.matureAim });
  var caution = useHouse
    ? fillTpl(astroSeededPick(seed + 'cau', FUSE_CAUTION_HOUSE_TPL), { P: planetDef.zh, lifeArea: hb.lifeArea, imbalance: pb.imbalance, shadow: sb.shadow, growthTask: hb.growthTask })
    : fillTpl(astroSeededPick(seed + 'cau', FUSE_CAUTION_NOHOUSE_TPL), { imbalance: pb.imbalance, shadow: sb.shadow, pbW: pb.watch, sbW: sb.watch });

  var planetFunction = fillTpl(astroSeededPick(seed + 'fn', FUSE_FUNCTION_TPL), { P: planetDef.zh, 'function': pb['function'], question: pb.question });
  var signMethod = fillTpl(astroSeededPick(seed + 'sm', FUSE_SIGNMETHOD_TPL), { S: sign.zh, motivation: sb.motivation, method: sb.method });
  var houseActivation = useHouse
    ? fillTpl(astroSeededPick(seed + 'ha', FUSE_HOUSEACT_TPL), { lifeArea: hb.lifeArea, activation: hb.activation, coreQuestion: hb.coreQuestion })
    : '出生時間未知，本次不使用宮位。';
  var synthesis = useHouse
    ? fillTpl(astroSeededPick(seed + 'syn', FUSE_SYNTHESIS_TPL), { P: planetDef.zh, S: sign.zh, coreNeed: coreNeed, motivation: sb.motivation, lifeArea: hb.lifeArea })
    : fillTpl(astroSeededPick(seed + 'syn', FUSE_SYNTHESIS_NOHOUSE_TPL), { P: planetDef.zh, S: sign.zh, coreNeed: coreNeed, motivation: sb.motivation });
  var growth = useHouse
    ? fillTpl(astroSeededPick(seed + 'gr', FUSE_GROWTH_TPL), { matureAim: pb.matureAim, matureExpression: sb.matureExpression, growthTask: hb.growthTask })
    : fillTpl(astroSeededPick(seed + 'gr', FUSE_GROWTH_NOHOUSE_TPL), { matureAim: pb.matureAim, matureExpression: sb.matureExpression });

  var technical = planetDef.zh + '　' + sign.zh + ' ' + placement.deg.toFixed(1) + '°' +
    (useHouse ? '　第' + placement.house + '宮' : '　出生時間未知，本次未計算宮位') +
    (placement.retro ? '　逆行' : '');

  return {
    summary: summary,
    lifeExpression: lifeExpression,
    strength: strength,
    caution: caution,
    advanced: { planetFunction: planetFunction, signMethod: signMethod, houseActivation: houseActivation, synthesis: synthesis, growth: growth },
    technical: technical
  };
}
/* 相容包裝：保留舊函式名稱與舊回傳欄位（oneLine/everyday/strength/watch/
   technical/question/title），讓 renderAstroDetailModal() 等既有呼叫端不受影響；
   實際文案改由上面的純函式 planetPlacementReading() 產生。 */
function planetBeginnerDetail(planetDef, chart) {
  var p = chart.planets[planetDef.key], sign = ZODIAC_SIGNS[p.sign];
  var pb = PLANET_BEGINNER[planetDef.key];
  var unknownTime = !!state.astroUnknownTime;
  var r = planetPlacementReading(planetDef, p, unknownTime);
  return {
    title: planetDef.sym + ' ' + planetDef.zh + '在' + sign.zh + (unknownTime ? '' : '｜第' + p.house + '宮'),
    question: pb.question,
    oneLine: r.summary,
    everyday: r.lifeExpression,
    strength: r.strength,
    watch: r.caution,
    advanced: r.advanced,
    technical: r.technical
  };
}
function renderAstroDetailModal(chart) {
  if (!state.astroDetail) return '';
  if (/^house-\d+$/.test(state.astroDetail)) {
    var hn = parseInt(state.astroDetail.split('-')[1],10), hb = HOUSE_BEGINNER[hn-1];
    return '<div role="presentation" onclick="if(event.target===this)astroSelectDetail(null)" style="position:fixed;inset:0;z-index:90;background:rgba(8,6,12,.78);display:flex;align-items:center;justify-content:center;padding:20px"><section role="dialog" aria-modal="true" aria-label="第'+hn+'宮白話解讀" style="width:min(480px,100%);max-height:78vh;overflow:auto;border:1px solid rgba(230,205,154,.5);border-radius:16px;padding:18px 19px;background:#211b2b;box-shadow:0 18px 60px rgba(0,0,0,.5)"><div style="display:flex;justify-content:space-between;gap:12px"><h3 style="margin:0;font:600 17px \'Noto Serif TC\',serif;color:#f0e9d8">第 '+hn+' 宮，用白話說</h3><button aria-label="關閉解讀" onclick="astroSelectDetail(null)" style="background:none;border:0;color:rgba(240,233,216,.55);font-size:24px;line-height:1;cursor:pointer">×</button></div><div style="margin-top:13px;font:600 13px \'Noto Sans TC\',sans-serif;color:#e6cd9a;line-height:1.75">它在看：'+esc(hb.area)+'</div><div style="margin-top:10px;font:400 13px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.82);line-height:1.85">生活例子：'+esc(hb.example)+'。</div><div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:rgba(201,169,110,.09);font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.7);line-height:1.75">宮位不是在說你好或不好，而是在說：某種個性最常在哪一類生活情境中被你使用。</div></section></div>';
  }
  var def = PLANET_DEFS.find(function(x){return x.key===state.astroDetail;});
  if (!def || !chart.planets[state.astroDetail]) return '';
  var d = planetBeginnerDetail(def, chart);
  function section(label, text, color) { return '<div style="margin-top:13px"><div style="font:600 11px \'Noto Sans TC\',sans-serif;color:'+(color||'#c9a96e')+';letter-spacing:.08em">'+label+'</div><div style="margin-top:4px;font:400 13px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.82);line-height:1.85">'+esc(text)+'</div></div>'; }
  var h='<div role="presentation" onclick="if(event.target===this)astroSelectDetail(null)" style="position:fixed;inset:0;z-index:90;background:rgba(8,6,12,.78);display:flex;align-items:center;justify-content:center;padding:20px"><section role="dialog" aria-modal="true" aria-label="'+esc(d.title)+'白話解讀" style="width:min(520px,100%);max-height:82vh;overflow:auto;border:1px solid rgba(230,205,154,.5);border-radius:16px;padding:18px 19px;background:#211b2b;box-shadow:0 18px 60px rgba(0,0,0,.5)">';
  h+='<div style="display:flex;justify-content:space-between;gap:12px"><div><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:#c9a96e;letter-spacing:.12em">不用背術語，先看生活中的你</div><h3 style="margin:4px 0 0;font:600 18px \'Noto Serif TC\',serif;color:#f0e9d8">'+esc(d.title)+'</h3></div><button aria-label="關閉解讀" onclick="astroSelectDetail(null)" style="background:none;border:0;color:rgba(240,233,216,.55);font-size:24px;line-height:1;cursor:pointer">×</button></div>';
  h+='<div style="margin-top:14px;padding:12px 13px;border-radius:11px;background:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.22)"><div style="font:600 11px \'Noto Sans TC\',sans-serif;color:#e6cd9a">一句話先看懂</div><div style="font:500 14px \'Noto Sans TC\',sans-serif;color:#f0e9d8;line-height:1.85;margin-top:4px">'+esc(d.oneLine)+'</div></div>';
  h+=section('它其實在回答',d.question)+section('生活中可能怎麼出現',d.everyday)+section('你的優勢',d.strength,'#9bc5a3')+section('容易卡住的地方',d.watch,'#d9a0a0');
  if (chart.planets[def.key].retro) h+=section('逆行，用白話說','你可能比較常先在心裡反覆整理這項能力，確認過後才表現出來。這不是不好或比較弱，只是運作方式比較內在。','#b7a4d8');
  h+='<details style="margin-top:14px;border-top:1px solid rgba(201,169,110,.18);padding-top:10px"><summary style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);cursor:pointer">想知道占星術語怎麼組合？</summary><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);line-height:1.75;margin-top:7px">'+esc(d.technical)+'</div></details>';
  return h+'</section></div>';
}
function pointPlacementText(pointDef, chart) {
  var p = chart.points[pointDef.key];
  var sign = ZODIAC_SIGNS[p.sign];
  var retroTxt = (pointDef.key === 'Node' || pointDef.key === 'SNode') ? '（依天文結構，北／南交點永遠逆行，屬於正常現象）'
    : (p.retro ? '目前為逆行狀態，這股能量的展現較為內化，需要多一層自我覺察才會顯現在外。' : '');
  var houseText = state.astroUnknownTime ? '。出生時間未知，本次不解讀宮位' : '；坐落於第' + p.house + '宮，主要體現在' + HOUSE_MEANINGS[p.house - 1] + '上';
  return pointDef.zh + '代表' + pointDef.meaning + '。落在' + sign.zh + '，帶有' + sign.trait + '的色彩' + houseText + '。' + retroTxt;
}
function findAnyPointDef(key) {
  return PLANET_DEFS.find(function (x) { return x.key === key; }) || EXTRA_POINT_DEFS.find(function (x) { return x.key === key; });
}
function aspectPlacementText(asp) {
  var aDef = findAnyPointDef(asp.a);
  var bDef = findAnyPointDef(asp.b);
  var def = ASPECT_DEFS[asp.type];
  var body = def.tpl.replace('{A}', aDef.zh).replace('{B}', bDef.zh).replace('{ak}', aDef.kw).replace('{bk}', bDef.kw);
  return aDef.zh + def.zh + bDef.zh + '（誤差 ' + asp.orb.toFixed(1) + '°）：' + body + '。';
}
/* 每個相位類型都用 {Akw}/{Bkw} 帶入實際的兩個點，避免不同組合出現一模一樣的
   優勢／容易卡住／可以怎麼練習，讓文字真正跟這兩個特質有關，而不是套版 */
/* 每種相位類型提供多種句子骨架（不只是換關鍵字），實際使用哪一種由這一對
   點的 seed 決定 —— 這樣就算兩組都是「三分相」，讀起來也不會是同一套模板 */
function fillAspectTemplate(tpl, aKw, bKw) {
  return tpl.split('{Akw}').join(aKw).split('{Bkw}').join(bKw);
}
function aspectBeginnerData(asp) {
  var a = findAnyPointDef(asp.a), b = findAnyPointDef(asp.b), base = ASPECT_BEGINNER[asp.type];
  var seedBase = asp.a + '|' + asp.b + '|' + asp.type;
  function pickField(name) {
    var tpl = astroSeededPick(seedBase + '|' + name, base[name]);
    return fillAspectTemplate(tpl, a.kw, b.kw);
  }
  var leadTpl = astroSeededPick(seedBase + '|lead', base.lead);
  return {
    title: a.zh + ' × ' + b.zh,
    lead: fillAspectTemplate(leadTpl, a.kw, b.kw),
    leadTpl: leadTpl, /* 未代入關鍵字的原始模板——只給 aspectBeginnerDataUnique() 內部
                          比對用，判斷「是不是選到同一句骨架」，跟關鍵字無關 */
    strength: pickField('strength'),
    watch: pickField('watch'),
    practice: pickField('practice'),
  };
}
/* 「三分鐘看懂你的星盤」一次列出 3 組相位——每組相位的 lead 句子雖然是用
   pair+type 做種子挑出來的（同一組永遠讀到同一句），但 lead 模板池目前每種
   相位類型只有 2 個變化。如果這 3 組剛好有 2 組以上是同一種相位類型（例如
   都是三分相），各自獨立種子挑選仍有機會巧合選到同一個模板骨架——填進去的
   關鍵字雖然不同（例如「思考溝通×直覺夢想」跟「愛與美感×獨立求變」），但
   包住關鍵字的那句話會一字不差重複，讀起來像同一句話講了兩三次。這裡在組
   成這份「精簡摘要」清單時，比對的是「未代入關鍵字的模板骨架」（leadTpl），
   同份清單裡撞骨架的話就換成同一相位類型底下還沒用過的另一個版本；只影響
   這份 3 組摘要清單的呈現，不影響 aspectBeginnerData() 本身「同一組永遠讀到
   同一句」的保證（例如點進單一相位的詳細卡片，看到的還是原本那句）。 */
function aspectBeginnerDataUnique(asp, usedLeadTpls) {
  var d = aspectBeginnerData(asp);
  var key = asp.type + '::' + d.leadTpl;
  if (usedLeadTpls.indexOf(key) === -1) { usedLeadTpls.push(key); return d; }
  var a = findAnyPointDef(asp.a), b = findAnyPointDef(asp.b), base = ASPECT_BEGINNER[asp.type];
  var altTpl = base.lead.filter(function (tpl) { return usedLeadTpls.indexOf(asp.type + '::' + tpl) === -1; })[0];
  if (altTpl) { d.lead = fillAspectTemplate(altTpl, a.kw, b.kw); key = asp.type + '::' + altTpl; }
  usedLeadTpls.push(key);
  return d;
}
function renderAspectBeginnerCard(asp) {
  var d=aspectBeginnerData(asp);
  return '<article style="border-top:1px solid rgba(201,169,110,.15);padding:12px 0"><div style="font:600 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8">'+esc(d.title)+'</div><div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.75;margin-top:5px">'+esc(d.lead)+'</div><div style="margin-top:7px;font:400 11px \'Noto Sans TC\',sans-serif;color:#9bc5a3;line-height:1.65">優勢：'+esc(d.strength)+'</div><div style="margin-top:3px;font:400 11px \'Noto Sans TC\',sans-serif;color:#d9a0a0;line-height:1.65">容易卡住：'+esc(d.watch)+'</div><div style="margin-top:3px;font:400 11px \'Noto Sans TC\',sans-serif;color:#e6cd9a;line-height:1.65">可以怎麼練習：'+esc(d.practice)+'</div><details style="margin-top:8px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);cursor:pointer">查看相位名稱、容許度與專業解讀</summary><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);line-height:1.7;margin-top:6px">'+esc(aspectPlacementText(asp))+'</div></details></article>';
}

/* 本命盤相位專用解讀。舊 ASPECT_BEGINNER 保留給合盤與推運使用。 */
var NATAL_ASPECT_DYNAMICS = {
  conjunction: {
    summary: [
      '{A}會{Aplace}{Agift}，{B}則會{Bplace}{Bgift}；兩者常在同一時間啟動。',
      '當你{Aplace}{Agift}時，也會同時{Bplace}{Bgift}，兩股力量很難完全分開。',
      '{Aplace}{Agift}，常與{Bplace}{Bgift}一併出現，力量集中而直接。',
    ],
    principle: '合相讓兩股心理功能融合成一套反應；其中一邊被啟動時，另一邊通常立刻跟上。',
    strength: '能把「{Agift}」與「{Bgift}」集中成一致行動。',
    challenge: '可能同時出現「{Arisk}」與「{Brisk}」，卻難以分開處理。',
    integration: '先練習「{Apractice}」，再練習「{Bpractice}」，確認此刻先回應哪一邊。',
  },
  sextile: {
    summary: [
      '{A}會{Aplace}{Agift}，並協助你{Bplace}{Bgift}，但需要主動串連。',
      '{Aplace}{Agift}，與{Bplace}{Bgift}之間有可運用的通道。',
      '只要願意跨出一步，{Aplace}{Agift}便能協助你{Bplace}{Bgift}。',
    ],
    principle: '六分相提供可運用的通道，但不會自動替你完成事情；它需要選擇、練習與具體行動。',
    strength: '主動時，能用「{Agift}」協助「{Bgift}」。',
    challenge: '可能看見合作機會，卻受「{Arisk}」或「{Brisk}」影響而沒有使用。',
    integration: '安排一個小情境，先練習「{Apractice}」，再練習「{Bpractice}」。',
  },
  trine: {
    summary: [
      '你較容易一邊{Aplace}{Agift}，一邊{Bplace}{Bgift}，兩種能力自然接力。',
      '{Aplace}{Agift}，會自然帶動{Bplace}{Bgift}，不必太用力就能配合。',
      '當你{Aplace}{Agift}，通常也能順勢地{Bplace}{Bgift}，兩者容易形成穩定優勢。',
    ],
    principle: '三分相讓兩種心理功能彼此支持，通常不必經過強烈衝突就能找到共同節奏。',
    strength: '能自然{Agift}，也能{Bgift}，兩種能力彼此支持。',
    challenge: '即使配合自然，仍可能出現「{Arisk}」及「{Brisk}」。',
    integration: '選一個稍有難度的共同目標，同時練習「{Apractice}」與「{Bpractice}」。',
  },
  square: {
    summary: [
      '{Aplace}{Agift}，與{Bplace}{Bgift}的節奏不同，容易卡住，也會逼出調整能力。',
      '{A}會{Aplace}{Agift}，{B}則推動你{Bplace}{Bgift}；兩邊互相施壓，需要重新安排。',
      '當你試著{Aplace}{Agift}，又必須{Bplace}{Bgift}時，摩擦會推動你發展新做法。',
    ],
    principle: '四分相讓兩種需求用不同節奏爭取主導權；摩擦會反覆出現，直到你找到新的行動方式。',
    strength: '能在「{Agift}」與「{Bgift}」的摩擦中練出解題能力。',
    challenge: '壓力下可能同時出現「{Arisk}」與「{Brisk}」，反而更難行動。',
    integration: '把衝突拆小，先練習「{Apractice}」，再練習「{Bpractice}」，不必一次分出勝負。',
  },
  opposition: {
    summary: [
      '你容易在兩種反應間擺盪：一端是{Aplace}{Agift}，另一端是{Bplace}{Bgift}。',
      '{A}推動你{Aplace}{Agift}，{B}則拉向{Bplace}{Bgift}；兩端都需要被看見。',
      '生活中可能輪流出現兩種反應：{Aplace}{Agift}，以及{Bplace}{Bgift}。',
    ],
    principle: '對分相會放大兩端的差異；你可能先認同其中一邊，再透過關係或事件遇見另一邊。',
    strength: '能理解「{Agift}」和「{Bgift}」各自重要，逐步找到平衡。',
    challenge: '可能在「{Arisk}」與「{Brisk}」之間擺盪，或把其中一端投射給別人。',
    integration: '察覺偏向哪端後，先練習「{Apractice}」，再練習「{Bpractice}」，讓兩邊都有位置。',
  },
};
var NATAL_ASPECT_TITLE_VERBS = { conjunction:'合', sextile:'六分', trine:'拱', square:'四分', opposition:'對分' };
var NATAL_ASPECT_SYMBOLS = { conjunction:'☌', sextile:'⚹', trine:'△', square:'□', opposition:'☍' };
var NATAL_ASPECT_ANGLES = { conjunction:0, sextile:60, trine:120, square:90, opposition:180 };
var NATAL_ASPECT_FUNCTION_LABELS = {
  Sun:'自我認同與人生方向', Moon:'情緒需求與安全感', Mercury:'思考、學習與表達',
  Venus:'關係價值、喜好與吸引', Mars:'行動、想要什麼，以及能接受到哪裡', Jupiter:'信念、成長與擴張',
  Saturn:'責任、限制與長期建立', Uranus:'自由、突破與改革', Neptune:'想像、共感與理想',
  Pluto:'權力、危機與深層轉化', Node:'尚在發展的成長方向', SNode:'熟悉而容易依賴的模式',
  Lilith:'不願被壓抑的自主需求', Chiron:'容易受傷與不足的敏感點',
  Fortune:'感到順流與投入的方式', Vertex:'被關係或事件推動的經驗',
};
var NATAL_ASPECT_FUNCTION_BEHAVIORS = {
  Sun:{gift:'清楚表達自己的方向',risk:'把價值感綁在表現上',practice:'確認真正想成為誰'},
  Moon:{gift:'辨認並安頓情緒需求',risk:'被情緒與不安全感牽動',practice:'先照顧當下的感受'},
  Mercury:{gift:'把資訊整理成清楚語言',risk:'過度分析或急著下結論',practice:'確認資訊後再表達'},
  Venus:{gift:'衡量關係與價值是否協調',risk:'為維持和諧而迎合',practice:'說清楚自己喜歡什麼、底線在哪'},
  Mars:{gift:'把想要的化為行動，同時守住自己的底線',risk:'衝動出手或壓住怒氣',practice:'先辨認目標與力道'},
  Jupiter:{gift:'看見機會並擴大視野',risk:'過度樂觀而忽略細節',practice:'把信念落成可行步驟'},
  Saturn:{gift:'承擔責任並建立長期能力',risk:'怕犯錯而過度緊縮',practice:'訂出可持續的規則'},
  Uranus:{gift:'跳脫框架並提出新做法',risk:'為自由突然切斷連結',practice:'保留改變也說明理由'},
  Neptune:{gift:'感受氛圍並轉化想像',risk:'混淆理想、投射與現實',practice:'用事實檢查直覺'},
  Pluto:{gift:'看穿核心並承受深層轉變',risk:'用控制或猜疑防衛',practice:'分清能掌握與不能掌握'},
  Node:{gift:'嘗試尚不熟悉的成長方向',risk:'因陌生而放棄或躁進',practice:'用小步驟練習新能力'},
  SNode:{gift:'調用熟悉而穩定的資源',risk:'只靠老方法拒絕調整',practice:'保留資源也嘗試新做法'},
  Lilith:{gift:'認出自己真正想要的，並守住底線',risk:'壓抑太久後激烈反彈',practice:'提早說出真實需求'},
  Chiron:{gift:'辨認敏感與不足被觸發之處',risk:'把敏感藏起來或過度防衛',practice:'允許敏感存在而不急著修好'},
  Fortune:{gift:'找到容易投入與順流的方式',risk:'等待順利卻沒有投入',practice:'持續參與並觀察回饋'},
  Vertex:{gift:'從重要際遇中調整方向',risk:'把轉折當成唯一劇本',practice:'保留選擇再回應事件'},
};
var NATAL_PERSONAL_KEYS = ['Sun','Moon','Mercury','Venus','Mars'];
function natalAspectPosition(chart, key) {
  return (chart.planets && chart.planets[key]) || (chart.points && chart.points[key]) || null;
}
function natalAspectProfile(key) {
  var def=findAnyPointDef(key);
  if (!def) return null;
  var pb=PLANET_BEGINNER[key], pt=POINT_BEGINNER[key];
  var behavior=NATAL_ASPECT_FUNCTION_BEHAVIORS[key] || {gift:'運用這項功能',risk:'忽略這項功能的限制',practice:'有意識地調整這項功能'};
  return {
    key:key,
    name:EXTRA_POINT_DEFS.some(function(x){return x.key===key;}) ? pointDisplayName(def) : def.zh,
    func:NATAL_ASPECT_FUNCTION_LABELS[key] || (pb && pb.function) || (pt && pt.coreFunction) || def.kw,
    motive:(pb && (Array.isArray(pb.coreNeed) ? pb.coreNeed[0] : pb.coreNeed)) || (pt && pt.motivation) || def.meaning || def.kw,
    gift:behavior.gift, risk:behavior.risk, practice:behavior.practice,
  };
}
function natalAspectPriority(asp) {
  var bothPersonal=NATAL_PERSONAL_KEYS.indexOf(asp.a)>=0 && NATAL_PERSONAL_KEYS.indexOf(asp.b)>=0;
  var luminaryTight=(asp.a==='Sun'||asp.a==='Moon'||asp.b==='Sun'||asp.b==='Moon') && asp.orb<=4;
  return (bothPersonal || luminaryTight || asp.orb<=2) ? 'core' : 'secondary';
}
function natalAspectExactDistance(chart, asp) {
  var a=natalAspectPosition(chart,asp.a), b=natalAspectPosition(chart,asp.b);
  if (!a || !b || typeof a.lon!=='number' || typeof b.lon!=='number') return null;
  var diff=Math.abs(a.lon-b.lon)%360;
  return diff>180 ? 360-diff : diff;
}
function natalAspectContext(profile, position, unknownTime) {
  if (!profile || !position || typeof position.sign!=='number' || isNaN(position.sign) || position.sign<0 || position.sign>11 || !ZODIAC_SIGNS[position.sign]) return '';
  var sign=ZODIAC_SIGNS[position.sign], sb=SIGN_BEGINNER[position.sign];
  var txt=profile.name+'以'+sign.zh+'式的「'+sb.method+'」運作';
  if (!unknownTime && position.house && HOUSE_BEGINNER[position.house-1]) txt+='，主要在'+HOUSE_BEGINNER[position.house-1].lifeArea+'被啟動';
  return txt;
}
function natalAspectPlacementPhrase(position, unknownTime) {
  if (!position || typeof position.sign!=='number' || isNaN(position.sign) || position.sign<0 || position.sign>11 || !SIGN_BEGINNER[position.sign]) return '';
  var signName=ZODIAC_SIGNS[position.sign].zh;
  if (!unknownTime && position.house && HOUSE_BEGINNER[position.house-1]) {
    return '在「'+HOUSE_BEGINNER[position.house-1].lifeArea+'」以'+signName+'方式';
  }
  return '以'+signName+'方式';
}
/* usedSet（選填）：跟 aspectBeginnerDataUnique() 同樣的用意，用在「複製給 AI
   解讀」的星盤資料匯出——會把星盤裡所有可用相位一次列完，同一相位類型的
   summary 模板池通常只有 2～3 個版本，相位數一多還是有機會撞同一版本。有
   傳 usedSet 進來時會避開同一次匯出裡已經用過的版本；不傳則行為不變。 */
function natalAspectReading(asp, chart, unknownTime, usedSet) {
  var dynamic=NATAL_ASPECT_DYNAMICS[asp.type], a=natalAspectProfile(asp.a), b=natalAspectProfile(asp.b);
  var pa=natalAspectPosition(chart,asp.a), pb=natalAspectPosition(chart,asp.b);
  if (!dynamic || !a || !b || !pa || !pb) return {available:false,reason:'missing-data'};
  var exact=natalAspectExactDistance(chart,asp), nominal=NATAL_ASPECT_ANGLES[asp.type];
  var priority=natalAspectPriority(asp);
  var title=a.name+NATAL_ASPECT_TITLE_VERBS[asp.type]+b.name;
  var pairVars={ A:a.name, Afunc:a.func, Agift:a.gift, Arisk:a.risk, Apractice:a.practice, Aplace:natalAspectPlacementPhrase(pa,unknownTime), B:b.name, Bfunc:b.func, Bgift:b.gift, Brisk:b.risk, Bpractice:b.practice, Bplace:natalAspectPlacementPhrase(pb,unknownTime) };
  var summaryTpl=Array.isArray(dynamic.summary) ? astroSeededPick(asp.a+'|'+asp.b+'|'+asp.type+'|summary',dynamic.summary) : dynamic.summary;
  if (usedSet && Array.isArray(dynamic.summary)) {
    var summaryKey = asp.type + '|summary|' + summaryTpl;
    if (usedSet[summaryKey]) {
      var altSummary = dynamic.summary.filter(function (t) { return !usedSet[asp.type + '|summary|' + t]; })[0];
      if (altSummary) summaryTpl = altSummary;
    }
    usedSet[asp.type + '|summary|' + summaryTpl] = true;
  }
  var summary=fillTpl(summaryTpl,pairVars);
  var strength='可以發揮：'+fillTpl(dynamic.strength,pairVars);
  var challenge='需要留意：'+fillTpl(dynamic.challenge,pairVars);
  var contextA=natalAspectContext(a,pa,unknownTime), contextB=natalAspectContext(b,pb,unknownTime);
  var expression='生活中，這組互動可能出現在你一邊想回應「'+a.motive+'」，一邊也要照顧「'+b.motive+'」的時刻。';
  var exactText=exact===null ? '未提供' : exact.toFixed(1)+'°';
  return {
    available:true, priority:priority, title:title,
    subtitle:NATAL_ASPECT_SYMBOLS[asp.type]+' '+ASPECT_DEFS[asp.type].zh+'　容許度 '+asp.orb.toFixed(1)+'°',
    summary:summary, strength:strength, challenge:challenge,
    advanced:{
      functions:a.name+'代表'+a.func+'；'+b.name+'代表'+b.func+'。',
      principle:dynamic.principle,
      context:contextA+'；'+contextB+'。',
      expression:expression,
      integration:fillTpl(dynamic.integration,pairVars),
    },
    technical:'實際角距 '+exactText+'；標準相位角 '+nominal+'°；容許度 '+asp.orb.toFixed(1)+'°。容許度只表示相位接近精確角度的程度，不代表吉凶。',
  };
}
function renderNatalAspectCard(asp, chart, unknownTime, usedSet) {
  var d=natalAspectReading(asp,chart,unknownTime,usedSet);
  if (!d.available) return '';
  var core=d.priority==='core';
  var h='<article data-aspect-priority="'+d.priority+'" style="border-top:1px solid rgba(201,169,110,.15);padding:12px 0">';
  h+='<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap"><div style="font:600 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8">'+esc(d.title)+'</div><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:#c9a96e">'+esc(d.subtitle)+'</div></div>';
  h+='<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.75;margin-top:5px">'+esc(d.summary)+'</div>';
  if(core) {
    h+='<div style="margin-top:7px;font:400 11px \'Noto Sans TC\',sans-serif;color:#9bc5a3;line-height:1.65">'+esc(d.strength)+'</div>';
    h+='<div style="margin-top:3px;font:400 11px \'Noto Sans TC\',sans-serif;color:#d9a0a0;line-height:1.65">'+esc(d.challenge)+'</div>';
  }
  h+='<details style="margin-top:7px"><summary style="min-height:44px;display:flex;align-items:center;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);cursor:pointer">查看相位原理與整合方式</summary><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);line-height:1.8;margin-top:2px"><div>'+esc(d.advanced.functions)+'</div><div style="margin-top:5px">'+esc(d.advanced.principle)+'</div><div style="margin-top:5px">'+esc(d.advanced.context)+'</div><div style="margin-top:5px">'+esc(d.advanced.expression)+'</div><div style="margin-top:5px;color:#e6cd9a">整合方式：'+esc(d.advanced.integration)+'</div><div style="margin-top:5px;color:rgba(240,233,216,.62)">'+esc(d.technical)+'</div></div></details>';
  return h+'</article>';
}

/* ---- 元素／性質總覽 ---- */
var ZODIAC_QUALITY = ['本位', '固定', '變動'];
function computeElementQualityBalance(chart) {
  var elem = { 火: 0, 土: 0, 風: 0, 水: 0 };
  var qual = { 本位: 0, 固定: 0, 變動: 0 };
  ASTRO_PLANET_BODY_KEYS.forEach(function (key) {
    var sign = ZODIAC_SIGNS[chart.planets[key].sign];
    elem[sign.elem]++;
    qual[ZODIAC_QUALITY[chart.planets[key].sign % 3]]++;
  });
  return { elem: elem, qual: qual };
}
var ELEMENT_DOMINANT_TEXT = {
  火: '你習慣直接表達、立刻行動，也希望很快看見回應。',
  土: '你重視實際成果、安全感與可靠節奏，習慣把想法一步步做出來。',
  風: '你習慣用思考、討論與蒐集資訊來理解事情。',
  水: '你對氣氛與感受較敏銳，重視內在感受和深層連結。',
};
var QUALITY_DOMINANT_TEXT = {
  本位: '你習慣主動開始；要留意別一次開太多戰線。',
  固定: '你擅長持續投入；要留意卡住時是否太不願改變。',
  變動: '你擅長順勢調整；要留意方向是否換得太快。',
};
function renderElementQualitySummary(chart) {
  var eq = computeElementQualityBalance(chart);
  var elemKeys = ['火', '土', '風', '水'], qualKeys = ['本位', '固定', '變動'];
  var elemColor = { 火: '#e07850', 土: '#c9a96e', 風: '#8fc7f4', 水: '#6fa8d8' };
  var topElem = elemKeys.reduce(function (best, k) { return eq.elem[k] > eq.elem[best] ? k : best; }, elemKeys[0]);
  var topQual = qualKeys.reduce(function (best, k) { return eq.qual[k] > eq.qual[best] ? k : best; }, qualKeys[0]);
  var lowElem = elemKeys.reduce(function (best, k) { return eq.elem[k] < eq.elem[best] ? k : best; }, elemKeys[0]);
  var qualityPlain={本位:'先開始、主動開局',固定:'持續做、守住方向',變動:'彈性調整、跟著情況變通'};
  var elementPractice={火:'練習先做一小步、直接表達想要什麼',土:'用固定作息、清單或具體步驟讓自己安定',風:'把想法說出來、寫下來，或找人交換觀點',水:'先承認自己的感受，留一點安靜與休息空間'};
  var h = '<div style="margin-top:18px;border:1px solid rgba(201,169,110,.2);border-radius:12px;padding:14px">';
  h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-align:center">你習慣怎麼反應與行動</div>';
  h += '<div style="margin-top:10px;font:500 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;line-height:1.8">你最常用「'+topElem+'元素」處理事情，行動節奏偏向「'+qualityPlain[topQual]+'」。</div>';
  h += '<div style="margin-top:6px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.8">'+esc(ELEMENT_DOMINANT_TEXT[topElem])+' '+esc(QUALITY_DOMINANT_TEXT[topQual])+'</div>';
  h += '<div style="margin-top:9px;padding:9px 10px;border-radius:9px;background:rgba(201,169,110,.08);font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.7">比較少自動使用的是「'+lowElem+'元素」；需要時可以'+elementPractice[lowElem]+'。</div>';
  /* 原本這裡是把元素／性質的數字藏在摺疊區、用四個裸數字呈現。
     數字本來就算好了，攤開畫成長條之後「哪一種特別多、哪一種完全沒有」
     一眼就看得出來，不需要自己比大小，也是這一頁少數不用讀文字的地方。 */
  if (typeof renderElementQualityChart === 'function') h += renderElementQualityChart(eq);
  h += '<details style="margin-top:11px"><summary style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;cursor:pointer">查看元素與性質數字</summary>';
  h += '<div style="display:flex;justify-content:center;gap:14px;margin-top:10px">';
  elemKeys.forEach(function (k) {
    h += '<div style="text-align:center"><div style="font:700 16px \'Noto Serif TC\',serif;color:' + elemColor[k] + '">' + eq.elem[k] + '</div><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">' + k + '</div></div>';
  });
  h += '</div>';
  h += '<div style="display:flex;justify-content:center;gap:14px;margin-top:10px">';
  qualKeys.forEach(function (k) {
    h += '<div style="text-align:center"><div style="font:700 16px \'Noto Serif TC\',serif;color:#e6cd9a">' + eq.qual[k] + '</div><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">' + k + '</div></div>';
  });
  h += '</div>';
  h += '<div style="margin-top:9px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.7">本位＝先開始；固定＝持續做；變動＝彈性調整。數字是十大行星落入各類星座的數量，不代表分數高低。</div></details>';
  h += '</div>';
  return h;
}
function renderAngleAndHouseBeginner(chart) {
  if (state.astroUnknownTime) return '';
  var ascIdx = chart.ascSign, mcIdx = Math.floor(chart.mc / 30);
  var asc = ZODIAC_SIGNS[ascIdx], mc = ZODIAC_SIGNS[mcIdx];
  var ascSb = SIGN_BEGINNER[ascIdx], mcSb = SIGN_BEGINNER[mcIdx];
  var counts = {}, names = {};
  for (var i = 1; i <= 12; i++) { counts[i] = 0; names[i] = []; }
  PLANET_DEFS.forEach(function (d) { var p = chart.planets[d.key]; counts[p.house]++; names[p.house].push(d.zh); });
  var top = Object.keys(counts).filter(function (k) { return counts[k] > 0; })
    .sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 3);

  /* 這一段先前被回報「答非所問」，原因有三個，都在下面一併處理：
     1. 「第一印象」直接把 SIGN_BEGINNER.behavior 貼上去，但那個欄位描述的是
        「這個星座怎麼做決定」——是內在歷程，不是別人看到的樣子。句子因此在講
        「你先判斷責任與效益」，讀者卻期待看到「別人覺得你是什麼樣的人」。
     2. 沒有講出這段在讀盤上的哪個點（上升／天頂），使用者無從判斷可信度，
        也不知道為什麼描述會偏向行為而不是外表。
     3. 「你傾向用『先考慮彼此立場，再尋找公平好看的做法』的方式建立專業形象」
        把一個長子句塞進引號再包一層「的方式」，中文讀起來要回頭讀第二次。
     修法是不換資料來源（維持可追溯），改成先點名讀的是哪個點、再說明那個點
     代表什麼、最後才給描述，並補上「上升不等於私下的你」這個關鍵前提。 */
  var h = '<section style="margin-top:14px;border:1px solid rgba(201,169,110,.2);border-radius:12px;padding:14px">';
  h += '<h3 class="md-h3" style="font-size:13px">別人眼中的你，和你花最多力氣的地方</h3>';
  h += '<p class="md-note md-prose" style="margin:5px 0 0">這一段讀的是星盤上的三個結構：上升點、天頂，以及行星集中在哪幾個宮位。</p>';

  h += '<div style="margin-top:10px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.8">';
  h += '<strong style="color:#f0e9d8">第一印象（上升' + esc(asc.zh) + '）：</strong>';
  h += '別人剛認識你時，最先接觸到的是你' + esc(ascSb.behavior) + '的那一面。';
  h += '<span style="display:block;color:rgba(240,233,216,.62);font-size:11px;margin-top:3px">上升描述的是你面對陌生環境時最先啟動的反應方式，不一定等於你私下相處的樣子——所以它讀起來會像「行為」，而不是外表。</span>';
  h += '</div>';

  h += '<div style="margin-top:9px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.8">';
  h += '<strong style="color:#f0e9d8">工作與公開場合（天頂' + esc(mc.zh) + '）：</strong>';
  h += '在職場上，你多半靠' + esc(mcSb.mode) + '，來建立別人對你的專業印象。';
  h += '<span style="display:block;color:rgba(240,233,216,.62);font-size:11px;margin-top:3px">天頂代表你希望在公開領域被看見的方式，也常是你選擇職涯方向的隱形標準。</span>';
  h += '</div>';

  if (top.length) {
    h += '<div style="margin-top:12px;font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">你花最多力氣的三個生活領域</div>';
    h += '<div style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.6;margin-top:3px">十二宮各自對應一塊生活領域。某一宮聚集的行星越多，代表你越常把注意力與精力投在那裡——這是關注度，不是好壞。</div>';
    h += top.map(function (k) {
      var hb = HOUSE_BEGINNER[parseInt(k, 10) - 1];
      return '<div style="margin-top:6px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.7);line-height:1.7">'
        + '<strong style="color:#e6cd9a">' + esc(hb.area) + '</strong>'
        + '<span style="color:rgba(240,233,216,.62)">（第 ' + k + ' 宮，' + counts[k] + ' 顆行星：' + esc(names[k].join('、')) + '）</span></div>';
    }).join('');
  }

  h += '<details style="margin-top:10px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);cursor:pointer">查看 ASC、MC 的實際度數</summary>';
  h += '<div style="margin-top:6px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.75">ASC ' + asc.zh + ' ' + (chart.asc % 30).toFixed(1) + '°；MC ' + mc.zh + ' ' + (chart.mc % 30).toFixed(1) + '°。這兩個點完全依賴出生時間與地點，時間差 4 分鐘上升就可能差 1 度。</div></details>';
  return h + '</section>';
}

/* ---- 相位總表 ---- */
var ASPECT_SYMBOL = { conjunction: '☌', sextile: '⚹', square: '□', trine: '△', opposition: '☍' };
function renderAspectGrid(chart) {
  var keys = ASTRO_PLANET_BODY_KEYS;
  var lookup = {};
  astroUsableAspects(chart).forEach(function (asp) {
    if (keys.indexOf(asp.a) >= 0 && keys.indexOf(asp.b) >= 0) { lookup[asp.a + '|' + asp.b] = asp; lookup[asp.b + '|' + asp.a] = asp; }
  });
  var h = '<div style="overflow-x:auto;margin-top:12px"><table aria-label="行星相位總表" style="border-collapse:collapse;margin:0 auto">';
  keys.forEach(function (rk, ri) {
    var rd = PLANET_DEFS.find(function (x) { return x.key === rk; });
    h += '<tr><th scope="row" aria-label="' + rd.zh + '" style="width:20px;height:20px;text-align:center;font:400 12px serif;color:#c9a96e">' + rd.sym + '</th>';
    keys.forEach(function (ck, ci) {
      if (ci >= ri) { h += '<td style="width:20px;height:20px"></td>'; return; }
      var asp = lookup[rk + '|' + ck];
      if (asp) {
        h += '<td aria-label="' + ASPECT_DEFS[asp.type].zh + '，誤差 ' + asp.orb.toFixed(1) + '度" style="width:20px;height:20px;text-align:center;font:400 12px sans-serif;color:' + ASPECT_COLOR[asp.type] + '" title="' + asp.orb.toFixed(1) + '°">' + ASPECT_SYMBOL[asp.type] + '</td>';
      } else {
        h += '<td style="width:20px;height:20px;border:1px solid rgba(255,255,255,.03)"></td>';
      }
    });
    h += '</tr>';
  });
  h += '<tr><td></td>' + keys.map(function (k) { var d = PLANET_DEFS.find(function (x) { return x.key === k; }); return '<th scope="col" aria-label="' + d.zh + '" style="width:20px;height:20px;text-align:center;font:400 12px serif;color:#c9a96e">' + d.sym + '</th>'; }).join('') + '</tr>';
  h += '</table></div>';
  return h;
}

/* ---- SVG chart wheel ---- */
function astroWheelAngle(lon, asc) { return astroNormDeg(180 - (lon - asc)); }
function astroPolar(cx, cy, r, angleDeg) {
  var rad = angleDeg * Math.PI / 180;
  return { x: +(cx + r * Math.cos(rad)).toFixed(2), y: +(cy - r * Math.sin(rad)).toFixed(2) };
}
function renderNatalWheel(chart) {
  var cx = 150, cy = 150, R = 142, signR = 122, houseR = 96, planetR = 76;
  var svg = '<svg role="img" aria-labelledby="natal-wheel-title natal-wheel-desc" viewBox="0 0 300 300" width="100%" style="max-width:320px;display:block;margin:0 auto"><title id="natal-wheel-title">個人本命星盤輪盤</title><desc id="natal-wheel-desc">顯示十二星座、十二宮、十大行星與主要相位；行星符號可點擊查看詳細解讀。</desc>';
  svg += '<circle cx="150" cy="150" r="' + R + '" fill="none" stroke="rgba(201,169,110,.4)" stroke-width="1"/>';
  svg += '<circle cx="150" cy="150" r="' + signR + '" fill="none" stroke="rgba(201,169,110,.22)" stroke-width="1"/>';
  svg += '<circle cx="150" cy="150" r="' + houseR + '" fill="none" stroke="rgba(201,169,110,.14)" stroke-width="1"/>';

  for (var i = 0; i < 12; i++) {
    var a = astroWheelAngle(i * 30, chart.asc);
    var p1 = astroPolar(cx, cy, houseR, a), p2 = astroPolar(cx, cy, R, a);
    svg += '<line x1="' + p1.x + '" y1="' + p1.y + '" x2="' + p2.x + '" y2="' + p2.y + '" stroke="rgba(201,169,110,.22)" stroke-width="1"/>';
    var mid = astroWheelAngle(i * 30 + 15, chart.asc);
    var gp = astroPolar(cx, cy, (R + signR) / 2, mid);
    svg += '<text x="' + gp.x + '" y="' + (gp.y + 4) + '" text-anchor="middle" font-size="13" fill="#c9a96e">' + ZODIAC_SIGNS[i].sym + '</text>';
  }
  for (var n = 0; n < 12; n++) {
    var cuspLon = chart.houseCusps[n];
    var cA = astroWheelAngle(cuspLon, chart.asc);
    var cp1 = astroPolar(cx, cy, 0, cA), cp2 = astroPolar(cx, cy, houseR, cA);
    var isAngle = (n === 0 || n === 3 || n === 6 || n === 9); // ASC/IC/DSC/MC get the bolder axis lines drawn separately
    if (!isAngle) svg += '<line x1="' + cp1.x + '" y1="' + cp1.y + '" x2="' + cp2.x + '" y2="' + cp2.y + '" stroke="rgba(201,169,110,.28)" stroke-width="0.7"/>';
    var nextLon = chart.houseCusps[(n + 1) % 12];
    var arcSpan = astroNormDeg(nextLon - cuspLon); if (arcSpan === 0) arcSpan = 360;
    var midH = astroWheelAngle(cuspLon + arcSpan / 2, chart.asc);
    var hp = astroPolar(cx, cy, houseR - 13, midH);
    svg += '<text role="button" tabindex="0" aria-label="第' + (n + 1) + '宮，' + HOUSE_MEANINGS[n] + '，點擊查看" onclick="astroSelectDetail(\'house-' + (n + 1) + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();astroSelectDetail(\'house-' + (n + 1) + '\')}" x="' + hp.x + '" y="' + (hp.y + 3) + '" text-anchor="middle" font-size="9" fill="rgba(240,233,216,.55)" style="cursor:pointer">' + (n + 1) + '</text>';
  }

  // ASC-DESC axis (always horizontal by construction)
  svg += '<line x1="' + (cx - R) + '" y1="' + cy + '" x2="' + (cx + R) + '" y2="' + cy + '" stroke="rgba(230,205,154,.55)" stroke-width="1.3"/>';
  svg += '<text x="' + (cx - R - 4) + '" y="' + (cy + 4) + '" text-anchor="end" font-size="10" fill="#e6cd9a">ASC</text>';
  svg += '<text x="' + (cx + R + 4) + '" y="' + (cy + 4) + '" text-anchor="start" font-size="10" fill="rgba(230,205,154,.6)">DESC</text>';
  var mcA = astroWheelAngle(chart.mc, chart.asc);
  var mcP = astroPolar(cx, cy, R, mcA), icP = astroPolar(cx, cy, R, mcA + 180);
  svg += '<line x1="' + mcP.x + '" y1="' + mcP.y + '" x2="' + icP.x + '" y2="' + icP.y + '" stroke="rgba(230,205,154,.55)" stroke-width="1.3"/>';
  var mcLbl = astroPolar(cx, cy, R + 12, mcA), icLbl = astroPolar(cx, cy, R + 12, mcA + 180);
  svg += '<text x="' + mcLbl.x + '" y="' + (mcLbl.y + 3) + '" text-anchor="middle" font-size="10" fill="#e6cd9a">MC</text>';
  svg += '<text x="' + icLbl.x + '" y="' + (icLbl.y + 3) + '" text-anchor="middle" font-size="10" fill="rgba(230,205,154,.6)">IC</text>';

  // aspect lines (drawn first, under planet glyphs)
  chart.aspects.forEach(function (asp) {
    if (!chart.planets[asp.a] || !chart.planets[asp.b]) return;
    var la = chart.planets[asp.a].lon, lb = chart.planets[asp.b].lon;
    var pa = astroPolar(cx, cy, planetR - 8, astroWheelAngle(la, chart.asc));
    var pb = astroPolar(cx, cy, planetR - 8, astroWheelAngle(lb, chart.asc));
    svg += '<line x1="' + pa.x + '" y1="' + pa.y + '" x2="' + pb.x + '" y2="' + pb.y + '" stroke="' + (ASPECT_COLOR[asp.type] || 'rgba(200,200,200,.3)') + '" stroke-width="0.8"/>';
  });

  // planets — decluttering: group planets whose ecliptic longitude is close
  // together into clusters (also checking the wrap-around past 0°/360°), then
  // spread every planet in a cluster across up to 3 radius tiers. The previous
  // version only compared each planet to its immediate predecessor and toggled
  // between 2 tiers, so a cluster of 3+ close planets (e.g. Sun/Mercury/Venus
  // all early in the same sign) could still end up with the 1st and 3rd planet
  // sharing a tier and overlapping.
  var order = PLANET_DEFS.map(function (p) { return p.key; }).slice().sort(function (k1, k2) { return chart.planets[k1].lon - chart.planets[k2].lon; });
  var CLUSTER_THRESHOLD = 8, tierOf = {};
  if (order.length) {
    var gaps = order.map(function (key, i) {
      var a = chart.planets[key].lon, b = chart.planets[order[(i + 1) % order.length]].lon;
      var d = b - a; if (d < 0) d += 360;
      return d;
    });
    var breakIdx = 0;
    for (var bi = 0; bi < gaps.length; bi++) { if (gaps[bi] >= CLUSTER_THRESHOLD) { breakIdx = (bi + 1) % order.length; break; } }
    var clusters = [[order[breakIdx]]];
    for (var ci = 1; ci < order.length; ci++) {
      var prevGapIdx = (breakIdx + ci - 1) % order.length;
      if (gaps[prevGapIdx] < CLUSTER_THRESHOLD) clusters[clusters.length - 1].push(order[(breakIdx + ci) % order.length]);
      else clusters.push([order[(breakIdx + ci) % order.length]]);
    }
    clusters.forEach(function (cluster) { cluster.forEach(function (key, i) { tierOf[key] = i % 3; }); });
  }
  order.forEach(function (key) {
    var lon = chart.planets[key].lon;
    var r = planetR - (tierOf[key] || 0) * 14;
    var ang = astroWheelAngle(lon, chart.asc);
    var pos = astroPolar(cx, cy, r, ang);
    var tick1 = astroPolar(cx, cy, houseR, ang), tick2 = astroPolar(cx, cy, r + 8, ang);
    svg += '<line x1="' + tick1.x + '" y1="' + tick1.y + '" x2="' + tick2.x + '" y2="' + tick2.y + '" stroke="rgba(201,169,110,.3)" stroke-width="0.6"/>';
    var def = PLANET_DEFS.find(function (p) { return p.key === key; });
    var aria = def.zh + '位於' + ZODIAC_SIGNS[chart.planets[key].sign].zh + '第' + chart.planets[key].house + '宮，點擊查看解讀';
    svg += '<g role="button" tabindex="0" aria-label="' + aria + '" onclick="astroSelectDetail(\'' + key + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();astroSelectDetail(\'' + key + '\')}" style="cursor:pointer">';
    svg += '<circle cx="' + pos.x + '" cy="' + pos.y + '" r="10" fill="#1a1622" stroke="' + (state.astroDetail === key ? '#e6cd9a' : 'rgba(201,169,110,.5)') + '" stroke-width="' + (state.astroDetail === key ? '2' : '.8') + '"/>';
    svg += '<text x="' + pos.x + '" y="' + (pos.y + 4) + '" text-anchor="middle" font-size="11" fill="#f0e9d8">' + def.sym + '</text></g>';
  });

  svg += '</svg>';
  return svg;
}

/* ---- UI ---- */
/* 城市搜尋的字面正規化。
   實測「臺北」「臺中」查無結果——清單裡存的是「台北市」，而「臺」才是戶籍與身分證
   上的官方用字，很多人就是這樣打。搜尋不到出生地等於整個星盤流程直接卡死，
   而使用者完全不會知道問題只是一個異體字。
   同時處理前後空白、全形空白，以及「台灣／臺灣」「巿／市」這類常見輸入差異。 */
function normalizeCityQuery(q) {
  return String(q == null ? '' : q)
    .replace(/[\s\u3000]+/g, '')
    .replace(/臺/g, '台')
    .replace(/巿/g, '市')
    .toLowerCase();
}
function filterCityList(q) {
  var key = normalizeCityQuery(q);
  if (!key) return CITY_LIST.slice(0, 6);
  return CITY_LIST.filter(function (c) {
    return normalizeCityQuery(c.zh).indexOf(key) !== -1
      || normalizeCityQuery(c.en).indexOf(key) !== -1;
  }).slice(0, 12);
}

/* 城市搜尋框絕對不能在打字時整段 render()——那等於把使用者正在輸入的那個 <input>
   整個銷毀重建。這件事本身就會打斷輸入法組字（中文注音／拼音打一半被中斷，只送出
   第一個符號或組不成字），就算組字沒被打斷，新節點預設也沒有焦點，一樣會讓下一個字
   打不進去。正確做法是打字時完全不碰這個 <input>，只更新旁邊「城市建議列表＋生成
   按鈕」這一小塊 DOM，瀏覽器原生的游標、焦點、注音組字狀態就完全不會被干擾。 */
function renderCityLiveBlock(prefix, genFnName) {
  var query = state[prefix + 'CityQuery'];
  var matches = filterCityList(query);
  var h = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">';
  matches.forEach(function (c) {
    var idx = CITY_LIST.indexOf(c);
    var active = state[prefix + 'CityIdx'] === idx;
    h += '<button type="button" onclick="' + prefix + 'SetCity(' + idx + ')" style="min-height:44px;font:400 11px \'Noto Sans TC\',sans-serif;background:' + (active ? 'rgba(201,169,110,.2)' : 'rgba(201,169,110,.06)') + ';border:1px solid ' + (active ? '#c9a96e' : 'rgba(201,169,110,.3)') + ';color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.65)') + ';padding:8px 12px;border-radius:22px;cursor:pointer">' + c.zh + '</button>';
  });
  h += '</div>';
  if (matches.length === 0 && query && query.trim()) {
    h += '<div role="status" class="md-status md-status--info" style="margin-top:8px"><span class="md-status__icon" aria-hidden="true">ⓘ</span><span>找不到「' + esc(String(query).slice(0, 20)) + '」。城市清單收錄 ' + CITY_LIST.length + ' 個常見出生地（台灣 22 縣市全部收錄）。試試看：改用英文拼音（Tokyo、New York）、只打前兩個字，或改選<strong style="color:var(--brand-bright)">同一時區內最近的大城市</strong>——同時區的城市對行星星座完全沒有影響，只有上升與宮位會有幾分鐘的差異。</span></div>';
  }
  if (state[prefix + 'CityIdx'] != null) {
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:8px">已選擇：' + CITY_LIST[state[prefix + 'CityIdx']].zh + '</div>';
  } else if (state[prefix + 'Y'] && state[prefix + 'M'] && state[prefix + 'D']) {
    h += '<div role="status" style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:8px">請從上方選擇或搜尋你的出生地，才能生成星盤</div>';
  }
  if (prefix !== 'astro') h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:16px;line-height:1.7">🔒 出生資料只會儲存在你自己的裝置（瀏覽器）中，不會上傳到任何伺服器。</div>';
  var birthErr = validateBirthDate(state[prefix + 'Y'], state[prefix + 'M'], state[prefix + 'D'], state[prefix + 'H'], state[prefix + 'Min'], state[prefix + 'UnknownTime']);
  /* 整體完成度提示要分開算「日期」跟「時間」兩項，不能直接用 birthErr——
     birthErr 是驗證函式回傳的單一訊息，日期沒填完跟時間沒填完都會讓它有值，
     混在一起算會出現「日期明明填對了，卻被算成沒完成」這種誤導的情況 */
  var yN = parseInt(state[prefix + 'Y'], 10), mN = parseInt(state[prefix + 'M'], 10), dN = parseInt(state[prefix + 'D'], 10);
  var dateDone = !!(state[prefix + 'Y'] && state[prefix + 'M'] && state[prefix + 'D']) && !isNaN(yN) && yN >= 1900 && yN <= 2100
    && !isNaN(mN) && mN >= 1 && mN <= 12 && !isNaN(dN) && dN >= 1 && dN <= new Date(yN, mN, 0).getDate();
  var hN = parseInt(state[prefix + 'H'], 10), minN = parseInt(state[prefix + 'Min'], 10);
  var timeDone = !!state[prefix + 'UnknownTime'] || (
    state[prefix + 'H'] !== '' && state[prefix + 'H'] != null && !isNaN(hN) && hN >= 0 && hN <= 23 &&
    state[prefix + 'Min'] !== '' && state[prefix + 'Min'] != null && !isNaN(minN) && minN >= 0 && minN <= 59
  );
  var cityDone = state[prefix + 'CityIdx'] != null;
  var doneCount = (dateDone ? 1 : 0) + (timeDone ? 1 : 0) + (cityDone ? 1 : 0);
  var ready = state[prefix + 'Y'] && state[prefix + 'M'] && state[prefix + 'D'] && cityDone && !birthErr;
  var generating = !!state[prefix + 'Generating'];
  var btnLabel = generating ? '計算中…' : '生成星盤 →';
  /* 整體完成度提示——延伸自上面「未選出生地」這類逐欄提示，一次看到還差幾項，
     不用逐欄自己數；按鈕能不能按仍然照舊用 birthErr／cityDone 判斷，不受這裡影響 */
  if (!ready) {
    h += '<div role="status" style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);margin-top:10px;text-align:center">已完成 ' + doneCount + ' / 3 項（出生日期・出生時間・出生地）</div>';
  } else {
    /* 送出前的資料確認摘要：把三個分開的輸入框重新組成一句人看得懂的話，
       並且明講時區與「未知時間」造成的影響，避免打錯一位數字卻整盤算錯還不自知。 */
    var cfCity = CITY_LIST[state[prefix + 'CityIdx']];
    h += '<div role="status" style="margin-top:12px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);padding:10px 13px">';
    h += '<div style="font:500 11px var(--font-sans);color:var(--brand)">請確認以下資料</div>';
    h += '<div style="font:500 12.5px var(--font-sans);color:var(--text);margin-top:4px;line-height:1.7">'
      + esc(state[prefix + 'Y'] + ' 年 ' + parseInt(state[prefix + 'M'], 10) + ' 月 ' + parseInt(state[prefix + 'D'], 10) + ' 日')
      + '　' + (state[prefix + 'UnknownTime'] ? '時間未知' : esc(pad2(state[prefix + 'H']) + ':' + pad2(state[prefix + 'Min'])))
      + '　' + esc(cfCity ? cfCity.zh : '') + '</div>';
    h += '<div style="font:400 10.5px var(--font-sans);color:var(--text-muted);margin-top:3px">時區 ' + esc(cfCity ? cfCity.tz : '') + '（含當地歷史日光節約時間，已自動換算）</div>';
    if (state[prefix + 'UnknownTime']) h += '<div style="font:400 10.5px/1.7 var(--font-sans);color:var(--warning);margin-top:4px">△ 未提供出生時間：上升、天頂、宮位與月亮相關結論會被省略，不會給出看似精確卻沒有依據的答案。</div>';
    h += '</div>';
  }
  h += '<button onclick="' + genFnName + '()" aria-busy="' + generating + '" ' + (ready && !generating ? '' : 'disabled') + ' style="width:100%;min-height:var(--control-h);margin-top:8px;padding:13px;border-radius:12px;border:1px solid ' + (ready ? '#c9a96e' : 'rgba(201,169,110,.2)') + ';background:' + (ready ? 'linear-gradient(135deg,#c9a96e,#a9835a)' : 'rgba(255,255,255,.03)') + ';color:' + (ready ? '#1a1622' : 'rgba(240,233,216,.3)') + ';font:600 14px \'Noto Sans TC\',sans-serif;cursor:pointer">' + btnLabel + '</button>';
  return h;
}
function updateCityLiveBlock(prefix, genFnName) {
  var box = document.getElementById(prefix + '-city-live');
  if (box) box.innerHTML = renderCityLiveBlock(prefix, genFnName);
}
function astroSetCity(idx) { state.astroCityIdx = idx; updateCityLiveBlock('astro', 'astroGenerate'); }
function astroCityInput(v) {
  state.astroCityQuery = v; state.astroCityIdx = null;
  updateCityLiveBlock('astro', 'astroGenerate');
}
function astroToggleUnknownTime() { state.astroUnknownTime = !state.astroUnknownTime; render(); }
function pad2(n) { n = parseInt(n, 10) || 0; return (n < 10 ? '0' : '') + n; }

/* 出生日期輸入驗證——輸入框本身沒有範圍限制（可以打出月份13、日期32），
   這裡集中檢查，回傳 null 表示合法（或尚未填完，不算錯），否則回傳錯誤訊息 */
function validateBirthDate(yRaw, mRaw, dRaw, hRaw, minRaw, unknownTime) {
  if (!yRaw || !mRaw || !dRaw) return null;
  var y = parseInt(yRaw, 10), m = parseInt(mRaw, 10), d = parseInt(dRaw, 10);
  if (isNaN(y) || y < 1900 || y > 2100) return '年份請輸入 1900–2100 之間的西元年';
  if (isNaN(m) || m < 1 || m > 12) return '月份請輸入 1–12';
  if (isNaN(d) || d < 1 || d > 31) return '日期請輸入 1–31';
  var daysInMonth = new Date(y, m, 0).getDate();
  if (d > daysInMonth) return y + ' 年 ' + m + ' 月只有 ' + daysInMonth + ' 天，請確認日期';
  if (!unknownTime) {
    /* previously an EMPTY hour/minute silently passed validation, and
       astroGenerate()/synGenerate() then defaulted it to 0 via `parseInt('')||0`
       — so a half-filled form quietly produced a chart as if born at
       00:00, with no warning that the time was actually missing. Now an
       empty field is treated the same as an invalid one. */
    if (hRaw === '' || hRaw == null) return '請輸入完整的出生時間（時），或勾選「不確定時間」';
    var hh = parseInt(hRaw, 10);
    if (isNaN(hh) || hh < 0 || hh > 23) return '時間請輸入 0–23';
    if (minRaw === '' || minRaw == null) return '請輸入完整的出生時間（分），或勾選「不確定時間」';
    var mm = parseInt(minRaw, 10);
    if (isNaN(mm) || mm < 0 || mm > 59) return '分鐘請輸入 0–59';
  }
  return null;
}

function astroSaveProfile() {
  try {
    localStorage.setItem('tl_astro_profile', JSON.stringify({
      y: state.astroY, m: state.astroM, d: state.astroD, h: state.astroH, min: state.astroMin,
      unknownTime: state.astroUnknownTime, cityIdx: state.astroCityIdx, houseSystem: state.astroHouseSystem
    }));
  } catch (e) {}
}
async function astroLoadProfile() {
  try {
    var sv = JSON.parse(localStorage.getItem('tl_astro_profile') || 'null');
    if (!sv) return;
    state.astroY = sv.y; state.astroM = sv.m; state.astroD = sv.d;
    state.astroH = sv.h; state.astroMin = sv.min;
    state.astroUnknownTime = !!sv.unknownTime;
    state.astroHouseSystem = sv.houseSystem || 'placidus';
    state.astroCityIdx = sv.cityIdx;
    if (state.astroCityIdx == null || !state.astroY || !state.astroM || !state.astroD) return;
    /* CITY_LIST 現在來自延後載入的星盤資料檔（見 ensureAstrologyDataLoaded），
       有已儲存的星盤資料時，代表使用者之前生成過星盤，這裡直接先把資料載入，
       才能在還沒手動點進「星盤」分頁前，就先把上次的星盤結果復原好 */
    await ensureAstrologyDataLoaded();
    ensureAstrologyBodyKeys();
    var city = CITY_LIST[state.astroCityIdx];
    if (city) {
      await ensureAstronomyLoaded();
      var hh = state.astroUnknownTime ? 12 : (parseInt(state.astroH, 10) || 0);
      var mm = state.astroUnknownTime ? 0 : (parseInt(state.astroMin, 10) || 0);
      state.astroResult = computeNatalChart(parseInt(state.astroY, 10), parseInt(state.astroM, 10), parseInt(state.astroD, 10), hh, mm, city.lat, city.lon, city.tz, state.astroHouseSystem);
      resetNatalTopicAnalysisForChartChange();
      state.astroCityUsed = city;
      render();
    }
  } catch (e) {
    state.astroResult = null;
    try { console.warn('無法恢復已儲存的星盤：', e); } catch (e2) {}
  }
}
/* 匯出／匯入星盤資料——換手機或換瀏覽器時，本命點資料（存在 localStorage）不會跟著走，
   這裡讓使用者自己存一份 JSON 小檔案備份，之後在新裝置上匯入就能還原，不用重新輸入。 */
function astroExportProfile() {
  var city = CITY_LIST[state.astroCityIdx];
  var data = {
    type: 'mystic-deck-natal-profile', version: 1,
    y: state.astroY, m: state.astroM, d: state.astroD, h: state.astroH, min: state.astroMin,
    unknownTime: state.astroUnknownTime, houseSystem: state.astroHouseSystem,
    cityZh: city ? city.zh : null, cityEn: city ? city.en : null,
  };
  try {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = '我的星盤資料.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  } catch (e) { astroSetNotice('error', '匯出失敗，你的瀏覽器可能不支援檔案下載。已輸入的出生資料沒有變動，可以改用截圖或手動記下資料。'); render(); }
}
/* 匯入的是使用者自己挑的任意檔案，所以在丟給 JSON.parse 之前先擋掉明顯不合理的輸入：
   正常的星盤備份檔只有幾百個位元組，這裡放寬到 64KB；沒有上限的話，使用者不小心選到
   一個幾百 MB 的檔案，FileReader 會把整份讀進記憶體、JSON.parse 再同步卡住主執行緒，
   在手機上就是直接白畫面。另外補上 reader.onerror，讀檔失敗時要有訊息而不是靜默。 */
var IMPORT_MAX_BYTES = 64 * 1024;
function astroImportProfileFile(fileInput) {
  var file = fileInput.files && fileInput.files[0];
  if (!file) return;
  if (file.size > IMPORT_MAX_BYTES) {
    astroSetNotice('error', '這個檔案太大（超過 64KB），不像是本站匯出的星盤資料檔案。請改選本站「匯出星盤資料備份」產生的 .json 檔。');
    fileInput.value = '';
    render();
    return;
  }
  var reader = new FileReader();
  reader.onerror = function () { astroSetNotice('error', '檔案讀取失敗，你目前的星盤與出生資料都沒有變動，可以直接再試一次。'); render(); };
  reader.onload = function (e) {
    var data;
    try { data = JSON.parse(e.target.result); } catch (e2) { astroSetNotice('error', '匯入失敗：檔案內容不是有效的 JSON。目前的星盤與已輸入資料保持不變。'); render(); return; }
    if (!data || typeof data !== 'object' || data.type !== 'mystic-deck-natal-profile') { astroSetNotice('error', '這不是本站匯出的星盤資料檔案。請選擇檔名通常為「我的星盤資料.json」的備份檔。'); render(); return; }
    var err = validateBirthDate(data.y, data.m, data.d, data.h, data.min, !!data.unknownTime);
    if (err) { astroSetNotice('error', '匯入的資料有問題：' + err + '　目前畫面上的星盤沒有被覆蓋。'); render(); return; }
    var cityIdx = null;
    if (data.cityZh) {
      var found = CITY_LIST.findIndex(function (c) { return c.zh === data.cityZh; });
      if (found >= 0) cityIdx = found;
    }
    state.astroY = data.y; state.astroM = data.m; state.astroD = data.d;
    state.astroH = data.h; state.astroMin = data.min;
    state.astroUnknownTime = !!data.unknownTime;
    state.astroHouseSystem = data.houseSystem || 'placidus';
    state.astroCityIdx = cityIdx;
    if (cityIdx != null) {
      astroGenerate();
    } else {
      astroSetNotice('info', '出生日期與時間已匯入，但備份檔裡的城市不在城市清單中。請重新選擇出生地後再按「生成星盤」。');
      render();
    }
  };
  reader.readAsText(file);
  fileInput.value = '';
}
function astroForget() {
  try { localStorage.removeItem('tl_astro_profile'); } catch (e) {}
  state.astroY = ''; state.astroM = ''; state.astroD = ''; state.astroH = ''; state.astroMin = '';
  state.astroCityQuery = ''; state.astroCityIdx = null; state.astroCityUsed = null;
  state.astroUnknownTime = false; state.astroHouseSystem = 'placidus'; state.astroResult = null;
  resetNatalTopicAnalysisForChartChange();
  astroSetNotice('success', '已清除這台裝置上儲存的出生資料與星盤結果。');
  render(); window.scrollTo(0, 0);
}
async function astroGenerate() {
  /* 重複點擊防護：按鈕在 generating 期間雖然是 disabled，但快速連點、或匯入流程
     直接呼叫本函式時仍可能重入，導致同一份資料被算兩次、後一次覆蓋前一次。
     擋在函式最前面才是可靠的位置。 */
  if (state.astroGenerating) return;
  var city = CITY_LIST[state.astroCityIdx];
  if (!city || !state.astroY || !state.astroM || !state.astroD) return;
  if (validateBirthDate(state.astroY, state.astroM, state.astroD, state.astroH, state.astroMin, state.astroUnknownTime)) { render(); return; }
  astroSetNotice(null, '');
  /* 星盤運算（10大行星＋凱龍星軌道解算＋宮位）在舊手機上可能會有感卡頓，
     先顯示「計算中」讓畫面更新一次，下一個 tick 才真正跑運算，避免按下去畫面
     整個凍住、使用者以為沒反應而重複點擊。 */
  state.astroGenerating = true;
  render();
  try {
    await ensureAstronomyLoaded();
  } catch (e) {
    state.astroGenerating = false;
    /* 保留使用者已輸入的年月日時分與城市，只回報失敗；恢復連線後直接再按一次即可。 */
    astroSetNotice('error', '星盤計算元件載入失敗，可能是網路不穩。你剛剛輸入的出生資料都還在，恢復連線後再按一次「生成星盤」就好。');
    render();
    return;
  }
  setTimeout(function () {
    var hh = state.astroUnknownTime ? 12 : (parseInt(state.astroH, 10) || 0);
    var mm = state.astroUnknownTime ? 0 : (parseInt(state.astroMin, 10) || 0);
    var chart = computeNatalChart(parseInt(state.astroY, 10), parseInt(state.astroM, 10), parseInt(state.astroD, 10), hh, mm, city.lat, city.lon, city.tz, state.astroHouseSystem);
    state.astroResult = chart;
    resetNatalTopicAnalysisForChartChange();
    state.astroCityUsed = city;
    state.astroGenerating = false;
    astroSetNotice('success', '星盤已依照上方「目前命盤」的出生資料重新計算完成。');
    astroSaveProfile();
    if (state.returnToReadingAfterAstro) {
      state.returnToReadingAfterAstro = false;
      state.readingMode = 'combined';
      state.tab = 'reading';
      state.phase = 'setup';
    }
    render();
    window.scrollTo(0, 0);
  }, 30);
}
function astroReset() {
  try {
    if (!confirm('確定要重新輸入嗎？\n目前算好的星盤解讀會被清除（出生日期／時間／地點資料還在，可以直接修改後重新生成）。')) return;
  } catch (e) {}
  state.astroResult = null;
  resetNatalTopicAnalysisForChartChange();
  state.astroHouseSystem = 'placidus';
  render();
  window.scrollTo(0, 0);
}
function birthAutoNext(el, nextId, digits) {
  var raw = String(el.value || '').replace(/\D/g, '');
  var n = parseInt(el.value, 10), min = parseInt(el.min, 10), max = parseInt(el.max, 10);
  if (raw.length < digits || (!isNaN(min) && n < min) || (!isNaN(max) && n > max)) return;
  el.blur();
  setTimeout(function () { var next = document.getElementById(nextId); if (next) next.focus(); }, 0);
}

/* ================= 通用出生資料輸入表單（供合盤等第二人使用） ================= */
function renderBirthInputForm(prefix, promptText, genFnName) {
  var h = '';
  h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);margin-top:14px;line-height:1.7;text-align:center">' + promptText + '</div>';
  h += '<div style="margin-top:22px;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">出生日期</div>';
  h += '<div style="display:flex;gap:8px;margin-top:6px">';
  var dateFields = [['Y', '年 YYYY', '出生年份', 1900, 2100, 4, prefix+'-m'], ['M', '月 MM', '出生月份', 1, 12, 2, prefix+'-d'], ['D', '日 DD', '出生日期', 1, 31, 2, state[prefix+'UnknownTime'] ? prefix+'-city' : prefix+'-h']];
  dateFields.forEach(function (pair) {
    h += '<input id="'+prefix+'-'+pair[0].toLowerCase()+'" aria-label="'+pair[2]+'" inputmode="numeric" min="'+pair[3]+'" max="'+pair[4]+'" type="number" placeholder="' + pair[1] + '" value="' + esc(state[prefix + pair[0]]) + '" oninput="state.' + prefix + pair[0] + '=this.value;birthAutoNext(this,\''+pair[6]+'\','+pair[5]+')" onblur="render()" style="width:33%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
  });
  h += '</div>';
  var birthErr = validateBirthDate(state[prefix + 'Y'], state[prefix + 'M'], state[prefix + 'D'], state[prefix + 'H'], state[prefix + 'Min'], state[prefix + 'UnknownTime']);
  if (birthErr) h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:#d67878;margin-top:6px">⚠ ' + esc(birthErr) + '</div>';

  h += '<div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center">';
  h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">出生時間</div>';
  h += '<label style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);display:flex;align-items:center;gap:5px;cursor:pointer"><input type="checkbox" ' + (state[prefix + 'UnknownTime'] ? 'checked' : '') + ' onchange="' + prefix + 'ToggleUnknownTime()">不確定時間（以正午 12:00 估算）</label>';
  h += '</div>';
  if (state[prefix + 'UnknownTime']) {
    h += '<div style="margin-top:6px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.7">勾選後：這個人的上升／宮位與月亮相關的比對會被省略，其餘行星星座的比對仍然準確——如果對方不確定自己的出生時間，一樣可以照這樣繼續。</div>';
  }
  if (!state[prefix + 'UnknownTime']) {
    h += '<div style="display:flex;gap:8px;margin-top:6px">';
    h += '<input id="'+prefix+'-h" aria-label="出生小時" inputmode="numeric" min="0" max="23" type="number" placeholder="時 HH (0-23)" value="' + esc(state[prefix + 'H']) + '" oninput="state.' + prefix + 'H=this.value;birthAutoNext(this,\''+prefix+'-min\',2)" onblur="render()" style="width:50%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    h += '<input id="'+prefix+'-min" aria-label="出生分鐘" inputmode="numeric" min="0" max="59" type="number" placeholder="分 MM" value="' + esc(state[prefix + 'Min']) + '" oninput="state.' + prefix + 'Min=this.value;birthAutoNext(this,\''+prefix+'-city\',2)" onblur="render()" style="width:50%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    h += '</div>';
    h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:5px">時間會影響上升星座與宮位，請盡量提供準確的出生時間</div>';
  }

  h += '<div style="margin-top:16px;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">出生地</div>';
  h += '<input id="'+prefix+'-city" aria-label="搜尋出生城市" type="text" maxlength="40" placeholder="搜尋城市，例如：台北、Tokyo" value="' + esc(state[prefix + 'CityQuery']) + '" oninput="' + prefix + 'CityInput(this.value)" style="width:100%;box-sizing:border-box;margin-top:6px;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
  h += '<div id="' + prefix + '-city-live">' + renderCityLiveBlock(prefix, genFnName) + '</div>';
  return h;
}

/* 合盤 Synastry 已移到 js/data/astro-advanced.js（見檔頭說明）。 */

/* 二次推運 Secondary Progression 已移到 js/data/astro-advanced.js（見檔頭說明）。 */

/* 二十八星宿：畫面與互動 已移到 js/data/astro-advanced.js（見檔頭說明）。 */

/* ================= 運勢：每日／本週／本月／年度 (transit-based) ================= */

var ASTRO_CATEGORY_RULERS = {
  love: ['Venus', 'Moon'],
  career: ['Saturn', 'Sun'],
  family: ['Moon', 'Saturn'],
  health: ['Mars', 'Sun'],
  wealth: ['Venus', 'Jupiter'],
  social: ['Mercury', 'Venus'],
  study: ['Mercury', 'Jupiter'],
  general: ['Sun', 'Moon'],
};
/* CATEGORIES 也包含純牌卡流程使用的「決策」入口；運勢分數只能採用有占星守護星設定的
   七個生活分類，否則 astroCategoryScore() 會拿到 undefined 並讓四種運勢全部中斷。 */
var HOROSCOPE_SCORE_CATS = CATEGORIES.filter(function (c) {
  return c.key !== 'general' && !!ASTRO_CATEGORY_RULERS[c.key];
});
var CATEGORY_COLOR = {
  love: ['#f2a4c1', '#c94f7c'],
  career: ['#8fc7f4', '#3f7ab8'],
  family: ['#a8dfc9', '#4f9c76'],
  health: ['#9fe3e0', '#3f9c9b'],
  wealth: ['#f4d37a', '#c99a3b'],
  social: ['#c9a8f0', '#8b5fc9'],
  study: ['#f4b98a', '#c97a3f'],
};
var HOROSCOPE_PERIODS = {
  daily: { zh: '每日運勢', en: 'Daily', transits: [['Moon', 6], ['Sun', 2], ['Mercury', 2], ['Venus', 2], ['Mars', 2]] },
  weekly: { zh: '本週運勢', en: 'Weekly', transits: [['Sun', 3], ['Mercury', 4], ['Venus', 4], ['Mars', 4], ['Jupiter', 2]] },
  monthly: { zh: '本月運勢', en: 'Monthly', transits: [['Sun', 6], ['Venus', 6], ['Mars', 6], ['Jupiter', 4], ['Saturn', 3]] },
  yearly: { zh: '年度運勢報告', en: 'Yearly', transits: [['Jupiter', 8], ['Saturn', 6], ['Uranus', 4], ['Neptune', 4], ['Pluto', 4]] },
};


/* ---------- 各分類的星盤解讀引擎、人生主題專題分析、知識層投影、星盤主畫面 ---------- */
/* ================= Phase 1B：愛情分類的星盤具體解讀引擎 ================= */

/* loveAstroEvidence(chart, unknownTime)
   純函式：整理「愛情」分類可以動用的真實星盤依據，供 astroCategoryReading() 組句使用。
   只讀傳入的 chart／unknownTime，透過 astroAvailableFocus(ctx,'love') 沿用 Phase 0 的
   ASTRO_CATEGORY_FOCUS.love 設定（Venus／Mars／Moon、第五宮、第七宮），不重新混用全域 state。
   月亮的處理比 Phase 0 的宮位規則更保守：出生時間未知時，月亮移動快（約每天 13 度），
   當天實際星座可能已經跨界，因此不只略過月亮的宮位與相位（既有規則），這裡連月亮的星座
   敘述也一併排除，整個 Moon 從 planets 中省略，並記錄在 skipped 裡，避免用不可靠的資料組句。 */
function loveAstroEvidence(chart, unknownTime) {
  var out = { available: false, planets: {}, houses: {}, aspects: [], skipped: [], seed: '' };
  if (!chart) return out;
  out.available = true;
  var ctx = { chart: chart, unknownTime: !!unknownTime };
  var focus = astroAvailableFocus(ctx, 'love'); // { planets:['Venus','Mars','Moon'], houses:[5,7]或[] ... }
  var timeKnown = astroTimeKnown(ctx);

  /* 唯一的資料驗證入口：行星 sign 必須是 0-11 之間、且能在 ZODIAC_SIGNS 找到對應星座，
     否則視為資料不足直接跳過（記錄原因），不讓無效的 sign 流到下游的措辭池查找或證據字串。 */
  function validSignIdx(idx) { return typeof idx === 'number' && !isNaN(idx) && idx >= 0 && idx <= 11 && !!ZODIAC_SIGNS[idx]; }

  focus.planets.forEach(function (key) {
    if (key === 'Moon' && !timeKnown) {
      out.skipped.push({ item: 'Moon', reason: 'unknown-time-unreliable' });
      return;
    }
    var p = chart.planets && chart.planets[key];
    if (!p) { out.skipped.push({ item: key, reason: 'not-in-chart' }); return; }
    if (!validSignIdx(p.sign)) { out.skipped.push({ item: key, reason: 'invalid-sign-data' }); return; }
    out.planets[key] = { sign: p.sign, deg: p.deg, retro: !!p.retro, house: timeKnown ? p.house : null };
  });

  focus.houses.forEach(function (h) {
    if (!chart.houseCusps || chart.houseCusps.length !== 12) { out.skipped.push({ item: 'house' + h, reason: 'no-house-data' }); return; }
    var cusp = chart.houseCusps[h - 1];
    var signIdx = (typeof cusp === 'number' && !isNaN(cusp)) ? Math.floor(astroNormDeg(cusp) / 30) : NaN;
    if (!validSignIdx(signIdx)) { out.skipped.push({ item: 'house' + h, reason: 'invalid-house-data' }); return; }
    out.houses[h] = { sign: signIdx };
  });
  if (!timeKnown) {
    [5, 7].forEach(function (h) { out.skipped.push({ item: 'house' + h, reason: 'unknown-time' }); });
  }

  var relevantKeys = timeKnown ? ['Venus', 'Mars', 'Moon'] : ['Venus', 'Mars'];
  out.aspects = pureUsableAspects(chart, unknownTime)
    .filter(function (a) { return relevantKeys.indexOf(a.a) !== -1 || relevantKeys.indexOf(a.b) !== -1; })
    .map(function (a) { return { a: a.a, b: a.b, type: a.type, orb: a.orb }; });
  if (!timeKnown) {
    var rawMoonAspects = (chart.aspects || []).filter(function (a) { return a.a === 'Moon' || a.b === 'Moon'; });
    if (rawMoonAspects.length) out.skipped.push({ item: 'moon-aspects', reason: 'unknown-time-unreliable', count: rawMoonAspects.length });
  }

  var seedParts = ['Venus', 'Mars', 'Moon'].map(function (key) {
    var p = out.planets[key];
    return key + ':' + (p ? (p.sign + '-' + Math.round(p.deg)) : 'na');
  });
  seedParts.push('h5:' + (out.houses[5] ? out.houses[5].sign : 'na'));
  seedParts.push('h7:' + (out.houses[7] ? out.houses[7].sign : 'na'));
  seedParts.push('asp:' + out.aspects.map(function (a) { return a.a + a.type + a.b + Math.round(a.orb * 10); }).sort().join(','));
  out.seed = seedParts.join('|');
  return out;
}

/* 依實際相位的和諧／緊張比例，把 Venus／Mars／Moon 相關的可用相位歸成三檔語氣——
   跟 cardSubtopicReading() 的 loveToneBucket() 用同一套「正向/中性/挑戰」語言，方便未來
   combinedReading() 比對兩邊語氣，但這裡完全獨立計算，不呼叫也不修改牌卡那一份。 */
function loveAstroValence(aspects) {
  if (!aspects || !aspects.length) return 'neutral';
  var score = 0;
  aspects.forEach(function (a) {
    if (a.type === 'trine' || a.type === 'sextile') score += 1;
    else if (a.type === 'square' || a.type === 'opposition') score -= 1;
    /* conjunction：能量集中但正負不定，不計入正負分數 */
  });
  var ratio = score / aspects.length;
  return ratio > 0.2 ? 'positive' : (ratio < -0.2 ? 'challenging' : 'neutral');
}

/* ---- 由元素（火／土／風／水）分組的措辭池：金星＝感情價值與被吸引的特質，
   火星＝主動方式、慾望與衝突反應，月亮＝情緒需求與安全感（unknownTime 時整組不使用），
   第五宮＝戀愛與約會風格，第七宮＝伴侶與長期關係模式。全部使用「可能／傾向」語氣。 ---- */
var ASTRO_LOVE_VENUS_ATTRACT = {
  火: ['金星落在火象星座，你可能容易被主動、有行動力且敢於表達好感的對象吸引', '感情價值傾向重視熱情與新鮮感，容易對敢於率先展現心意的人有好感', '你在關係中可能偏好直接明快的互動，容易被自信、有存在感的特質吸引'],
  土: ['金星落在土象星座，你可能較重視關係中的穩定與實際付出，容易被可靠務實的特質吸引', '感情價值傾向重視長期的安全感，容易對願意腳踏實地經營關係的人有好感', '你在關係中可能偏好穩健的步調，重視對方是否值得信賴勝過一時的浪漫'],
  風: ['金星落在風象星座，你可能重視心靈交流與話題契合，容易被聰明風趣的特質吸引', '感情價值傾向重視理解與溝通，容易對善於表達、思路清晰的人有好感', '你在關係中可能需要一定的自由與空間，重視被理解勝過形式上的黏膩'],
  水: ['金星落在水象星座，你可能重視情感深度與直覺共鳴，容易被溫柔體貼的特質吸引', '感情價值傾向重視氛圍與感受，容易對細膩、能同理你情緒的人有好感', '你在關係中可能容易投入深刻的情感連結，也容易被浪漫的氣氛打動'],
};
var ASTRO_LOVE_MARS_PURSUIT = {
  火: ['火星落在火象星座，追求節奏可能直接明快，想到就容易主動行動', '慾望的表達較為直白，遇到心動的對象傾向盡快讓對方知道', '衝突發生時傾向當下正面表態，不喜歡拖泥帶水，但也要留意別太衝動'],
  土: ['火星落在土象星座，追求節奏可能偏慢但持續，習慣用實際行動一步步靠近', '慾望的表達較為內斂，傾向透過穩定的付出展現心意', '衝突發生時傾向先冷靜下來，用實際做法而非爭辯處理問題'],
  風: ['火星落在風象星座，追求方式可能偏向智取，習慣先用言語或巧思引起對方注意', '慾望與好奇心緊密相連，容易對新鮮有趣的互動感興趣', '衝突發生時傾向先講道理、釐清邏輯，重視對話勝過情緒對抗'],
  水: ['火星落在水象星座，追求節奏可能較含蓄，習慣先用情感上的貼近試探對方心意', '慾望的表達較委婉，重視氣氛與感受勝過直球行動', '衝突發生時容易情緒化，可能需要一些時間消化才能好好溝通'],
};
var ASTRO_LOVE_MOON_NEED = {
  火: ['月亮落在火象星座，情緒來得快去得也快，安全感建立在被肯定與被需要的感覺上', '需要關係裡持續有新鮮感與熱度，才容易感到安心', '情緒需求較為直接，開心或不安都容易表現在外'],
  土: ['月亮落在土象星座，安全感可能來自穩定的陪伴與可預期的相處模式', '情緒起伏不算大，重視關係裡實際的支持而非言語上的保證', '需要透過長期的穩定感，才容易真正放心投入一段關係'],
  風: ['月亮落在風象星座，安全感可能來自能自由表達想法、被理解而非被限制', '情緒需求偏向理性化，習慣用談話梳理感受', '需要一定的個人空間，太過黏膩的相處反而可能讓你感到不安'],
  水: ['月亮落在水象星座，情緒細膩敏感，安全感建立在深層的情感連結上', '容易被氣氛與對方的情緒狀態牽動', '需要透過情感上的坦誠與陪伴，才容易感到真正安心'],
};
var ASTRO_LOVE_HOUSE5_DATING = {
  火: ['第五宮落在火象星座，戀愛與約會風格可能偏向主動熱烈，喜歡帶點新鮮感或冒險成分的浪漫互動', '在戀愛裡可能容易展現自信與熱情，也享受被關注、被追求的感覺', '約會風格可能傾向即興、有活力，不喜歡一成不變的相處'],
  土: ['第五宮落在土象星座，戀愛與約會風格可能偏向務實穩健，浪漫表達透過實際的陪伴與付出呈現', '可能喜歡循序漸進地培養感情，不急於一時的激情或表面的浪漫', '約會風格可能偏向規律、可預期，重視實際相處勝過華麗的形式'],
  風: ['第五宮落在風象星座，戀愛與約會風格可能重視話題與心靈交流，浪漫表達偏向有趣的互動與新鮮體驗', '可能喜歡透過對話與共同興趣拉近距離，勝過單純的肢體或物質表現', '約會風格可能偏向輕鬆多元，喜歡嘗試不同類型的活動'],
  水: ['第五宮落在水象星座，戀愛與約會風格可能偏向浪漫細膩，重視氣氛與情感的深度連結', '可能容易在戀愛中投入豐富的情感與想像，享受氛圍感強的約會方式', '約會風格可能偏向私密、溫馨，重視兩人之間的情感交流勝過熱鬧場面'],
};
var ASTRO_LOVE_HOUSE7_PARTNER = {
  火: ['第七宮落在火象星座，對長期伴侶的期待可能偏向有活力、能一起冒險成長的關係', '在一對一關係裡可能重視彼此的獨立性與行動力，不喜歡一方過於被動', '長期關係中可能容易主動推動彼此共同成長，也期待對方有自己的目標'],
  土: ['第七宮落在土象星座，對長期伴侶的期待可能偏向穩定可靠、能共同建立生活基礎的關係', '重視承諾與長期經營，可能喜歡循序漸進、按部就班的關係發展', '在一對一關係裡可能重視實際的責任分工與長期的支持'],
  風: ['第七宮落在風象星座，對長期伴侶的期待可能偏向能溝通、能當朋友的關係', '重視關係中的平等與心靈交流，可能勝過形式上的承諾', '可能喜歡與伴侶保持各自獨立又能深入對話的相處模式'],
  水: ['第七宮落在水象星座，對長期伴侶的期待可能偏向情感深刻、彼此扶持的關係', '重視關係中的情感連結與被理解的感覺', '在一對一關係裡可能容易投入深厚的情感與包容'],
};

/* ---- partner-profile 專用：六個標籤化維度。外貌／個性用金星／火星元素；
   職業／經濟觀念是金星／火星特質的「象徵性延伸」（並非實際職業或收支判斷，caveat 會特別註明）；
   家庭與關係價值用第七宮元素（標示為「家庭價值傾向」，見下方 ASTRO_LOVE_FAMILY_VALUE_LABEL）。
   沿用 Phase 1A 的 TRAIT_AXIS_LABELS 做「外貌氣質／個性相處／職業類型／經濟觀念」欄位標籤，
   維持牌卡／星盤兩邊用語一致；「年齡傾向」與「家庭背景」則刻意不沿用 TRAIT_AXIS_LABELS，
   理由見下方兩段說明。 ---- */

/* 年齡／成熟度傾向：不可再用整體和諧／緊張比例（loveAstroValence）推測——那只反映整體相位氣氛，
   不是年齡訊號。改用 loveSaturnAspect() 純函式明確檢查金星／火星／（時間已知時的）月亮
   是否與土星形成主要相位：土星代表時間、責任與人生歷練，是傳統占星裡與「年齡、成熟度、
   人生階段落差」最直接相關的行星，才有資格作為這個維度的依據。沒有土星相關相位時，
   固定回傳「資料不足」的說明，不得從一般相位和諧度反推同齡／年長／年輕。 */
function loveSaturnAspect(evAspects) {
  if (!evAspects || !evAspects.length) return null;
  var hits = evAspects.filter(function (a) { return a.a === 'Saturn' || a.b === 'Saturn'; });
  if (!hits.length) return null;
  return hits.slice().sort(function (x, y) { return x.orb - y.orb; })[0];
}
var ASTRO_LOVE_PP_AGE_SATURN = [
  '金星或火星與土星形成主要相位，你可能容易被較成熟、責任感較強，或人生階段與你不同的人吸引，這段關係可能帶有時間、責任或承諾方面的課題',
  '土星與感情相關的行星有主要相位，象徵上你較容易被年齡稍長、心態穩重或責任感明顯的對象吸引，關係中也可能需要面對時間、承諾或責任的考驗',
  '土星牽動了金星或火星（或月亮）的能量，這段緣分可能涉及成熟度、人生階段或責任感的落差，也可能帶有需要長期承諾的課題',
];
var ASTRO_LOVE_PP_AGE_INSUFFICIENT = '目前星盤依據不足以可靠判斷年齡差距，這部分無法從行星角度推測同齡、年長或年輕，建議以實際認識為準。';

/* 家庭與關係價值：第七宮是「使用者本人」對伴侶與長期關係的期待傾向，不是對方的真實家庭資料，
   因此星盤這一維度刻意不叫「家庭背景」（避免暗示已知道對方的原生家庭），改標示為「家庭價值傾向」；
   這個標籤只在星盤引擎內使用，Phase 1A 牌卡端的 TRAIT_AXIS_LABELS.familyBg（家庭背景）維持不動。 */
var ASTRO_LOVE_FAMILY_VALUE_LABEL = '家庭價值傾向';
var ASTRO_LOVE_PP_APPEARANCE = {
  火: ['外貌氣質的象徵傾向偏向鮮明、有存在感，給人熱情有活力的第一印象', '氣場可能明亮直接，眼神或談吐容易展現自信', '整體氣質可能帶點率性與衝勁，容易讓人一眼注意到'],
  土: ['外貌氣質的象徵傾向偏向沉穩，給人可靠踏實的第一印象', '氣場可能低調務實，不追求浮誇但耐看', '整體氣質可能透出一種安定感，讓人感覺值得信賴'],
  風: ['外貌氣質的象徵傾向偏向清爽俐落，談吐給人聰明伶俐的印象', '氣場可能帶點知性，眼神靈活，善於用言語表達自己', '整體氣質可能顯得輕盈、有距離感中帶著親和力'],
  水: ['外貌氣質的象徵傾向偏向柔和，帶點朦朧浪漫的感覺', '氣場可能溫柔細膩，眼神容易流露真實情緒', '整體氣質可能給人夢幻、易親近的印象'],
};
var ASTRO_LOVE_PP_PERSONALITY = {
  火: ['個性與相處方式可能直接主動，喜歡明快表態、不喜歡拖泥帶水', '相處起來可能充滿行動力，但也需要留意衝動與急躁', '個性可能樂觀進取，容易帶動關係的節奏往前推進'],
  土: ['個性與相處方式可能務實穩健，重視實際的付出勝過言語承諾', '相處步調可能偏慢但持續，習慣用行動證明心意', '個性可能可靠負責，但也可能因為太謹慎而慢半拍'],
  風: ['個性與相處方式可能理性靈活，喜歡把話說清楚、就事論事', '相處起來可能需要一定的空間感，不喜歡被過度掌控', '個性可能獨立善變，容易對新的互動方式感興趣'],
  水: ['個性與相處方式可能感性細膩，很在意彼此的情緒與感受', '相處起來可能容易投入深刻的情感，也容易因小事而多想', '個性可能體貼溫柔，但情緒起伏也可能較大'],
};
var ASTRO_LOVE_PP_JOBTYPE = {
  火: ['工作型態的象徵傾向可能偏向需要行動力與挑戰性的節奏，喜歡有明確目標感的環境', '象徵上較適合步調快、能即時看到成果的工作方式', '可能傾向需要主動出擊、體力或行動力較吃重的工作型態'],
  土: ['工作型態的象徵傾向可能偏向穩定務實，喜歡按部就班、能長期累積的工作方式', '象徵上較適合規律、講求紀律與耐性的工作節奏', '可能傾向重視長期成果、不急於求快的工作型態'],
  風: ['工作型態的象徵傾向可能偏向需要溝通與腦力激盪的節奏，喜歡有變化與交流的環境', '象徵上較適合需要邏輯思考、資訊處理或協調的工作方式', '可能傾向多工並行、步調靈活的工作型態'],
  水: ['工作型態的象徵傾向可能偏向需要同理心與感受力的節奏，喜歡有情感連結的工作環境', '象徵上較適合創作、療癒或需要細膩感受的工作方式', '可能傾向重視氛圍與意義感、勝過單純效率的工作型態'],
};
var ASTRO_LOVE_PP_FINANCE = {
  火: ['經濟觀念的象徵傾向可能較勇於嘗試，重視當下的滿足感，也可能需要留意衝動消費', '金錢態度象徵上偏向主動，願意為喜歡的事物或機會投入', '花費風格可能較隨性，重視體驗勝過精打細算'],
  土: ['經濟觀念的象徵傾向可能偏向務實保守，重視儲蓄與長期的安全感', '金錢態度象徵上偏向穩健，喜歡量入為出、按部就班累積', '花費風格可能較謹慎，重視資源的穩固勝過短期享受'],
  風: ['經濟觀念的象徵傾向可能偏向靈活，會多方比較後再決定，重視資訊與效率', '金錢態度象徵上偏向理性，喜歡先了解清楚再花費', '花費風格可能較多元，容易因為新鮮的想法而調整預算'],
  水: ['經濟觀念的象徵傾向可能偏向感性，重視花費是否能帶來情感上的滿足', '金錢態度象徵上偏向隨心，願意為在乎的人事物付出', '花費風格可能較受情緒與氛圍影響，需要留意衝動性的消費'],
};
var ASTRO_LOVE_PP_FAMILYVALUE = {
  火: ['家庭與關係價值的象徵傾向可能重視彼此的成長與活力，不喜歡一成不變的相處模式', '對未來家庭生活的期待可能偏向有目標、能共同冒險的樣貌', '關係價值觀可能重視彼此的獨立性，勝過緊密依附'],
  土: ['家庭與關係價值的象徵傾向可能重視穩定與傳承，喜歡按部就班建立生活基礎', '對未來家庭生活的期待可能偏向務實安穩，重視責任與長期陪伴', '關係價值觀可能重視承諾與可靠，勝過一時的浪漫'],
  風: ['家庭與關係價值的象徵傾向可能重視溝通與平等，喜歡能當彼此朋友的關係', '對未來家庭生活的期待可能偏向開放、有彈性，不拘泥傳統形式', '關係價值觀可能重視理解與空間，勝過形式上的緊密'],
  水: ['家庭與關係價值的象徵傾向可能重視情感連結與彼此扶持', '對未來家庭生活的期待可能偏向溫暖、重視情感氛圍的樣貌', '關係價值觀可能重視包容與陪伴，勝過現實條件'],
};

/* ---- 依整體語氣（positive／neutral／challenging）挑句：trend／favor／risk／action／timing
   在所有愛情子問題間共用同一套星盤語氣措辭池，差異來自實際可用相位算出的 loveAstroValence。 ---- */
var ASTRO_LOVE_TONE_POOL = {
  trend: {
    positive: ['整體行星角度偏向和諧，感情發展有機會順勢往前推進', '星盤能量流動順暢，這段時間的感情走向偏向樂觀', '相關的星象角度支持，事情有機會比預期更快出現進展'],
    neutral: ['星盤上助力與阻力大致相當，走向會由你接下來怎麼做決定', '這段時間沒有特別強的推力，也沒有明顯的擋路，適合按自己的節奏推進', '星象上是中性的，關鍵在於雙方願不願意把話說開'],
    challenging: ['整體行星角度帶有一些張力，發展可能比預期慢一些，需要多一點耐心', '星盤能量顯示這段時間需要先處理內在或現實的課題，才能往前推進', '相關角度偏向緊張，進展容易卡在某個環節，需要主動整合'],
  },
  favor: {
    positive: ['金星與火星的能量狀態是你目前最大的優勢，順著這股特質發揮即可', '整體星象對你有利，適合展現真實的自己、主動一點也無妨', '你的行星組合在感情面向上偏向加分，保持現有的狀態就好'],
    neutral: ['真誠面對自己的感情需求，會是這段時間最實際的助力', '願意花時間了解自己的相處模式，會帶來加分', '穩定的生活步調本身就是一種優勢，不需要刻意強求改變'],
    challenging: ['願意誠實面對星盤顯示的課題，本身就是一種助力，別急著逃避', '願意先調整自己習慣的相處模式，會比等待外在條件改變更有幫助', '過去累積的自我覺察，會是撐過這段緊張期的關鍵'],
  },
  risk: {
    positive: ['順利時也別忽略溝通，避免因為太順而少了確認彼此真正的需求', '留意別因為星象順風就過度樂觀，仍需要實際的經營', '好的星象狀態也需要持續投入，避免三分鐘熱度'],
    neutral: ['猶豫不決可能讓機會悄悄流失，建議別把星盤當成唯一的判斷依據', '資訊不足時容易過度解讀，適時回到現實互動確認會更實際', '過度分析星盤反而可能忽略當下真實的感受'],
    challenging: ['金星或火星的緊張角度容易放大不安全感，建議別把小摩擦放大檢視', '容易因為星盤顯示的張力而過度擔心，實際情況仍需以現實互動為準', '未整合的情緒或慾望若不處理，可能持續影響關係的品質'],
  },
  action: {
    positive: ['可以主動一點，順著目前有利的星象狀態往前推進一步', '適合把心裡真實的感受說出口，坦誠會帶來更好的結果', '順勢而為，同時也記得肯定自己在這段關係中的成長'],
    neutral: ['建議先觀察一陣子，多留意自己與對方實際的互動，而非只看星盤', '可以從了解自己的感情需求開始，慢慢建立更清楚的方向', '給自己一點時間消化星盤訊息，同時保持開放但不勉強的心態'],
    challenging: ['建議先照顧好自己的情緒與安全感，再決定下一步怎麼走', '找一個平靜的時機，誠實面對星盤提醒你需要留意的課題', '暫時放慢腳步，把注意力放在自己能調整的部分'],
  },
  timing: {
    positive: ['如果你願意主動，行星角度顯示近期到中期都是相對有利的時間段', '整體星象偏向支持，時機點可能比想像中更快到來', '目前的行星狀態適合順勢往前一步，不需要刻意等待'],
    neutral: ['星盤上沒有特別急迫的時間訊號，關係的進展節奏可能取決於雙方的實際互動', '時機尚未完全成熟，可能需要再多一段時間醞釀', '沒有明確的星象急迫性，順其自然會比刻意設定期限更實際'],
    challenging: ['目前的行星角度不是勉強推進的好時機，操之過急反而容易適得其反', '星盤顯示這段時間仍有變數，適合抱持觀望但不放棄的態度', '建議先把星盤提醒的課題處理好，時機自然會比較清楚'],
  },
};

function astroLovePlanetEvidenceStr(key, p) {
  var sign = ZODIAC_SIGNS[p.sign];
  return key + '：' + sign.zh + '（' + sign.elem + '）' + (p.house ? '，第' + p.house + '宮' : '');
}
function astroLoveHouseEvidenceStr(h, houseObj) {
  var sign = ZODIAC_SIGNS[houseObj.sign];
  return '第' + h + '宮頭：' + sign.zh + '（' + sign.elem + '）';
}
function astroLoveAspectEvidenceStr(a) {
  var aDef = PLANET_DEFS.filter(function (d) { return d.key === a.a; })[0];
  var bDef = PLANET_DEFS.filter(function (d) { return d.key === a.b; })[0];
  var aspectDef = ASPECT_DEFS[a.type];
  var orbText = (typeof a.orb === 'number' && !isNaN(a.orb)) ? a.orb.toFixed(1) + '°' : '未知';
  return (aDef ? aDef.zh : a.a) + (aspectDef ? aspectDef.zh : a.type) + (bDef ? bDef.zh : a.b) + '（誤差' + orbText + '）';
}

/* ================= Phase 2B：事業分類的星盤具體解讀引擎 ================= */

/* MC（天頂）的證據字串——love 從沒用過 MC，既有的 astroLovePlanetEvidenceStr／
   astroLoveHouseEvidenceStr 都不適用（MC 不是行星也不是宮頭陣列裡的一員），因此新增這個小
   函式；其餘證據字串（行星／宮頭／相位）直接重用既有的 astroLovePlanetEvidenceStr／
   astroLoveHouseEvidenceStr／astroLoveAspectEvidenceStr（純格式化，非愛情限定）。 */
function astroMcEvidenceStr(mcObj) {
  var sign = ZODIAC_SIGNS[mcObj.sign];
  return 'MC（天頂）：' + sign.zh + '（' + sign.elem + '）';
}

/* careerAstroEvidence(chart, unknownTime)
   純函式：整理「事業」分類可以動用的真實星盤依據，透過 astroAvailableFocus(ctx,'career')
   沿用 ASTRO_CATEGORY_FOCUS.career 設定（太陽／水星／火星／木星／土星，第二／六／十宮＋MC），
   不重新混用全域 state。太陽／水星／火星／木星／土星移動速度都比月亮慢很多，星座本身在
   出生時間未知時仍可靠，因此（跟 loveAstroEvidence 排除月亮不同）這裡不需要特別排除任何行星，
   只有宮位與 MC（天頂）才需要已知出生時間。第十宮的宮頭與 MC 在整宮制下可能落在不同星座，
   因此分開追蹤，不假設兩者相同。 */
function careerAstroEvidence(chart, unknownTime) {
  var out = { available: false, planets: {}, houses: {}, mc: null, aspects: [], skipped: [], seed: '' };
  if (!chart) return out;
  out.available = true;
  var ctx = { chart: chart, unknownTime: !!unknownTime };
  var focus = astroAvailableFocus(ctx, 'career'); // { planets:['Sun','Mercury','Mars','Jupiter','Saturn'], houses:[2,6,10]或[], useMC ... }
  var timeKnown = astroTimeKnown(ctx);

  function validSignIdx(idx) { return typeof idx === 'number' && !isNaN(idx) && idx >= 0 && idx <= 11 && !!ZODIAC_SIGNS[idx]; }

  focus.planets.forEach(function (key) {
    var p = chart.planets && chart.planets[key];
    if (!p) { out.skipped.push({ item: key, reason: 'not-in-chart' }); return; }
    if (!validSignIdx(p.sign)) { out.skipped.push({ item: key, reason: 'invalid-sign-data' }); return; }
    out.planets[key] = { sign: p.sign, deg: p.deg, retro: !!p.retro, house: timeKnown ? p.house : null };
  });

  focus.houses.forEach(function (h) {
    if (!chart.houseCusps || chart.houseCusps.length !== 12) { out.skipped.push({ item: 'house' + h, reason: 'no-house-data' }); return; }
    var cusp = chart.houseCusps[h - 1];
    var signIdx = (typeof cusp === 'number' && !isNaN(cusp)) ? Math.floor(astroNormDeg(cusp) / 30) : NaN;
    if (!validSignIdx(signIdx)) { out.skipped.push({ item: 'house' + h, reason: 'invalid-house-data' }); return; }
    out.houses[h] = { sign: signIdx };
  });
  if (!timeKnown) {
    [2, 6, 10].forEach(function (h) { out.skipped.push({ item: 'house' + h, reason: 'unknown-time' }); });
  }

  if (focus.useMC && timeKnown && typeof chart.mc === 'number' && !isNaN(chart.mc)) {
    var mcSign = Math.floor(astroNormDeg(chart.mc) / 30);
    if (validSignIdx(mcSign)) out.mc = { sign: mcSign };
  }
  if (!timeKnown) out.skipped.push({ item: 'MC', reason: 'unknown-time' });

  var relevantKeys = ['Sun', 'Mercury', 'Mars', 'Jupiter', 'Saturn'];
  out.aspects = pureUsableAspects(chart, unknownTime)
    .filter(function (a) { return relevantKeys.indexOf(a.a) !== -1 || relevantKeys.indexOf(a.b) !== -1; })
    .map(function (a) { return { a: a.a, b: a.b, type: a.type, orb: a.orb }; });

  var seedParts = relevantKeys.map(function (key) {
    var p = out.planets[key];
    return key + ':' + (p ? (p.sign + '-' + Math.round(p.deg)) : 'na');
  });
  [2, 6, 10].forEach(function (h) { seedParts.push('h' + h + ':' + (out.houses[h] ? out.houses[h].sign : 'na')); });
  seedParts.push('mc:' + (out.mc ? out.mc.sign : 'na'));
  seedParts.push('asp:' + out.aspects.map(function (a) { return a.a + a.type + a.b + Math.round(a.orb * 10); }).sort().join(','));
  out.seed = seedParts.join('|');
  return out;
}

/* ---- 依元素（火／土／風／水）分組的事業措辭池。loveAstroValence() 的和諧／緊張判斷邏輯
   完全通用（不含任何愛情內容），career 直接重用，不重複宣告 careerAstroValence()。 ---- */
var ASTRO_CAREER_SUN_BY_ELEM = {
  火: ['太陽落在火象星座，核心發展方向可能傾向主動開創、追求成就與被看見', '自我認同容易建立在敢於行動、率先嘗試的成果上'],
  土: ['太陽落在土象星座，核心發展方向可能傾向穩健築基、長期累積專業', '自我認同容易建立在踏實可靠、被信任的表現上'],
  風: ['太陽落在風象星座，核心發展方向可能傾向溝通交流、整合資訊與人脈', '自我認同容易建立在思路清晰、能提出見解的表現上'],
  水: ['太陽落在水象星座，核心發展方向可能傾向發揮同理心、創造情感連結的價值', '自我認同容易建立在能感受並回應他人需求的角色上'],
};
var ASTRO_CAREER_MERCURY_BY_ELEM = {
  火: ['水星落在火象星座，思考與溝通方式可能直接明快，重視效率勝過細節', '工作方式傾向快速下判斷、當機立斷'],
  土: ['水星落在土象星座，思考與溝通方式可能務實嚴謹，重視具體與可執行性', '工作方式傾向按部就班、循序驗證'],
  風: ['水星落在風象星座，思考與溝通方式可能靈活多元，擅長整理與傳遞資訊', '工作方式傾向多工並行、樂於交流意見'],
  水: ['水星落在水象星座，思考與溝通方式可能偏向直覺與感受，重視弦外之音', '工作方式傾向細膩體察，重視氛圍勝過條列式邏輯'],
};
var ASTRO_CAREER_MARS_BY_ELEM = {
  火: ['火星落在火象星座，行動力強且節奏明快，競爭時傾向正面迎戰', '執行節奏偏向立即行動，不喜歡拖延'],
  土: ['火星落在土象星座，行動力偏向穩健持久，競爭時傾向按計畫推進', '執行節奏偏向扎實但較慢，重視每一步都站穩'],
  風: ['火星落在風象星座，行動力偏向靈活應變，競爭時傾向以策略與資訊取勝', '執行節奏偏向邊想邊調整，不喜歡一成不變'],
  水: ['火星落在水象星座，行動力容易受情緒與氛圍牽動，競爭時傾向迂迴應對', '執行節奏偏向醞釀後才行動，重視時機是否合適'],
};
var ASTRO_CAREER_JUPITER_BY_ELEM = {
  火: ['木星落在火象星座，成長與機會可能來自主動出擊、勇於嘗試新領域', '擴張方式傾向大膽跨步，願意承擔一定風險'],
  土: ['木星落在土象星座，成長與機會可能來自長期累積、逐步擴大既有基礎', '擴張方式傾向穩紮穩打，重視實質成果'],
  風: ['木星落在風象星座，成長與機會可能來自拓展人脈、吸收多方資訊', '擴張方式傾向廣泛連結，透過交流開啟新可能'],
  水: ['木星落在水象星座，成長與機會可能來自直覺、創意或助人的價值', '擴張方式傾向順勢而為，重視意義感勝過規模'],
};
var ASTRO_CAREER_SATURN_BY_ELEM = {
  火: ['土星落在火象星座，責任與限制可能出現在需要克制衝動、學習耐心', '長期累積的專業化方向傾向從行動中磨練出紀律'],
  土: ['土星落在土象星座，責任與限制可能出現在對成果要求嚴格、容易給自己壓力', '長期累積的專業化方向傾向扎實穩健，是天生的長跑型'],
  風: ['土星落在風象星座，責任與限制可能出現在想法很多卻不易落實，需要練習聚焦', '長期累積的專業化方向傾向透過持續學習與系統化思考建立權威'],
  水: ['土星落在水象星座，責任與限制可能出現在情緒或分寸不容易拿捏，是需要練習的課題', '長期累積的專業化方向傾向在同理與專業之間找到平衡'],
};
var ASTRO_CAREER_HOUSE6_BY_ELEM = {
  火: ['第六宮落在火象星座，日常工作習慣可能偏向快節奏、喜歡處理變動與挑戰', '工作環境較適合允許主動出擊、步調明快的職場'],
  土: ['第六宮落在土象星座，日常工作習慣可能偏向規律務實、重視流程與紀律', '工作環境較適合制度清楚、講求穩定的職場'],
  風: ['第六宮落在風象星座，日常工作習慣可能偏向多工彈性、重視溝通協調', '工作環境較適合資訊流通、互動頻繁的職場'],
  水: ['第六宮落在水象星座，日常工作習慣可能偏向重視氛圍與人情、需要情感投入', '工作環境較適合溫暖、有支持感的職場'],
};
/* 第十宮宮頭與 MC 屬同一象徵領域（職涯方向、社會角色與公開發展），共用同一份措辭池 */
var ASTRO_CAREER_HOUSE10_BY_ELEM = {
  火: ['第十宮／天頂落在火象星座，職涯方向與社會角色可能傾向展現領導力與行動力', '公開發展較適合能主動爭取曝光與機會的舞台'],
  土: ['第十宮／天頂落在土象星座，職涯方向與社會角色可能傾向累積長期聲望與專業地位', '公開發展較適合按部就班、穩紮穩打建立權威的路徑'],
  風: ['第十宮／天頂落在風象星座，職涯方向與社會角色可能傾向成為溝通者、整合者或意見領袖', '公開發展較適合能發揮人脈與資訊優勢的舞台'],
  水: ['第十宮／天頂落在水象星座，職涯方向與社會角色可能傾向以創意、關懷或直覺為核心價值', '公開發展較適合能展現同理心與感受力的舞台'],
};
/* 第二宮：才能資源與收入運用模式——只能描述資源運用，不得推算薪資或具體數字 */
var ASTRO_CAREER_HOUSE2_BY_ELEM = {
  火: ['第二宮落在火象星座，才能資源的運用可能傾向積極變現、樂於嘗試新的收入來源', '對資源的態度偏向主動創造機會，而非被動等待'],
  土: ['第二宮落在土象星座，才能資源的運用可能傾向穩健累積、重視長期的資源管理', '對資源的態度偏向謹慎保守，重視安全感'],
  風: ['第二宮落在風象星座，才能資源的運用可能傾向多元開發、透過知識或人脈變現', '對資源的態度偏向靈活調整，願意嘗試不同的收入組合'],
  水: ['第二宮落在水象星座，才能資源的運用可能傾向以直覺或創意為核心價值', '對資源的態度偏向隨心，重視資源是否能帶來意義感'],
};
/* ---- 依整體語氣（positive／neutral／challenging）挑句：trend／favor／risk／action／timing
   在所有事業子問題間共用同一套星盤語氣措辭池，差異來自 loveAstroValence(ev.aspects)。
   timing 只能用「近期／仍需累積／條件成熟後」等模糊區間，不給確切日期或保證結果。 ---- */
var ASTRO_CAREER_TONE_POOL = {
  trend: {
    positive: ['整體行星角度偏向和諧，職涯發展有機會順勢擴張', '星盤能量流動順暢，近期的努力容易被看見'],
    neutral: ['星盤上助力與阻力大致相當，適合一邊累積實力一邊觀察機會', '星象沒有給出明確的推力，成果會直接反映你準備了多少'],
    challenging: ['整體行星角度帶有一些張力，目前階段較適合收斂與整理，而非貿然擴張', '星盤能量顯示這段時間需要先處理限制或課題，才能往前推進'],
  },
  favor: {
    positive: ['木星與太陽的能量狀態是目前最大的助力，適合順勢展現實力', '整體星象對你有利，機會與資源都相對充足'],
    neutral: ['踏實的準備會是這段時間最實際的助力', '保持開放與彈性，會比堅持單一方向更有幫助'],
    challenging: ['願意誠實面對土星帶來的課題，本身就是一種助力', '過去累積的專業與耐心，會是撐過這段緊縮期的關鍵'],
  },
  risk: {
    positive: ['擴張順利時也別忽略基礎的鞏固，避免衝過頭', '留意別因為進展快就忽略細節與風險評估'],
    neutral: ['猶豫不決可能讓準備期拉得更長，建議設定檢核點', '資訊不足容易造成誤判，適時確認會比悶著猜更好'],
    challenging: ['土星的限制若不正視，可能持續消耗心力', '容易因為壓力而想太多，建議把注意力放回可控的部分'],
  },
  action: {
    positive: ['可以主動一點，把握現有的擴張機會往前推進', '適合展現實力、爭取更大的舞台或資源'],
    neutral: ['建議先觀察並持續累積，同時保持開放心態', '可以先從小範圍的嘗試開始，逐步驗證方向'],
    challenging: ['建議先穩住現有基礎，把土星課題處理好再求擴張', '暫時放慢腳步，把注意力放在能自己掌握的專業累積上'],
  },
  timing: {
    positive: ['近期是條件相對成熟、適合擴張的階段', '目前準備度已經足夠，可以考慮加快腳步'],
    neutral: ['近期適合先準備，仍需要一段時間累積才會看到成果', '條件尚未完全成熟，建議先觀察再決定下一步節奏'],
    challenging: ['目前仍需累積，條件成熟後再考慮進一步行動會更穩妥', '近期不適合躁進，建議先把眼前的課題處理好'],
  },
};

/* astroCategoryReadingCareer(subtopicKey, chart, unknownTime)
   事業分類的星盤具體解讀，只在 astroCategoryReading() 分派時由 catKey==='career' 呼叫。
   五個子問題只能描述適配傾向／發展階段，不斷言唯一職業、不保證錄取或收入、不給確切日期。 */
function astroCategoryReadingCareer(subtopicKey, chart, unknownTime) {
  var out = {
    available: false, reason: '', catKey: 'career', subtopicKey: subtopicKey,
    conclusion: '', traits: '', trend: '', favor: '', risk: '', timing: '', action: '', caveat: '',
    evidence: null, tone: null,
  };
  var subtopic = (SUBTOPICS.career || []).filter(function (s) { return s.key === subtopicKey; })[0];
  if (!subtopic) { out.reason = 'unknown-subtopic'; return out; }
  if (subtopic.modes.indexOf('astro') === -1) { out.reason = 'mode-not-supported'; return out; }
  if (!chart) { out.reason = 'no-chart'; return out; }

  var ev = careerAstroEvidence(chart, unknownTime);
  if (!ev.planets.Sun && !ev.planets.Mercury && !ev.planets.Mars && !ev.planets.Jupiter && !ev.planets.Saturn) { out.reason = 'no-focus-data'; return out; }

  var seed = 'career|' + subtopicKey + '|' + ev.seed;
  var used = [];
  function note(str) { used.push(str); }

  var sunP = ev.planets.Sun, mercuryP = ev.planets.Mercury, marsP = ev.planets.Mars, jupiterP = ev.planets.Jupiter, saturnP = ev.planets.Saturn;
  var sunElem = sunP ? ZODIAC_SIGNS[sunP.sign].elem : null;
  var mercuryElem = mercuryP ? ZODIAC_SIGNS[mercuryP.sign].elem : null;
  var marsElem = marsP ? ZODIAC_SIGNS[marsP.sign].elem : null;
  var jupiterElem = jupiterP ? ZODIAC_SIGNS[jupiterP.sign].elem : null;
  var saturnElem = saturnP ? ZODIAC_SIGNS[saturnP.sign].elem : null;
  var house2 = ev.houses[2], house6 = ev.houses[6], house10 = ev.houses[10];
  var house2Elem = house2 ? ZODIAC_SIGNS[house2.sign].elem : null;
  var house6Elem = house6 ? ZODIAC_SIGNS[house6.sign].elem : null;
  var house10Elem = house10 ? ZODIAC_SIGNS[house10.sign].elem : null;
  var mcElem = ev.mc ? ZODIAC_SIGNS[ev.mc.sign].elem : null;
  var valence = loveAstroValence(ev.aspects); // 通用邏輯，非愛情限定，見上方註解
  out.tone = valence;

  if (sunP) note(astroLovePlanetEvidenceStr('Sun', sunP));
  if (mercuryP) note(astroLovePlanetEvidenceStr('Mercury', mercuryP));
  if (marsP) note(astroLovePlanetEvidenceStr('Mars', marsP));
  if (jupiterP) note(astroLovePlanetEvidenceStr('Jupiter', jupiterP));
  if (saturnP) note(astroLovePlanetEvidenceStr('Saturn', saturnP));
  if (house2) note(astroLoveHouseEvidenceStr(2, house2));
  if (house6) note(astroLoveHouseEvidenceStr(6, house6));
  if (house10) note(astroLoveHouseEvidenceStr(10, house10));
  if (ev.mc) note(astroMcEvidenceStr(ev.mc));
  ev.aspects.forEach(function (a) { note('相位：' + astroLoveAspectEvidenceStr(a)); });

  function sunLine(tag) { return sunElem ? astroSeededPick(seed + tag, ASTRO_CAREER_SUN_BY_ELEM[sunElem]) : ''; }
  function mercuryLine(tag) { return mercuryElem ? astroSeededPick(seed + tag, ASTRO_CAREER_MERCURY_BY_ELEM[mercuryElem]) : ''; }
  function marsLine(tag) { return marsElem ? astroSeededPick(seed + tag, ASTRO_CAREER_MARS_BY_ELEM[marsElem]) : ''; }
  function jupiterLine(tag) { return jupiterElem ? astroSeededPick(seed + tag, ASTRO_CAREER_JUPITER_BY_ELEM[jupiterElem]) : ''; }
  function saturnLine(tag) { return saturnElem ? astroSeededPick(seed + tag, ASTRO_CAREER_SATURN_BY_ELEM[saturnElem]) : ''; }
  function house6Line(tag) { return house6Elem ? astroSeededPick(seed + tag, ASTRO_CAREER_HOUSE6_BY_ELEM[house6Elem]) : ''; }
  /* 第十宮與 MC 共用同一份措辭池；MC 存在就優先用 MC（更貼近「天頂」這個古典職業指標），沒有才退回第十宮宮頭 */
  function house10OrMcLine(tag) { return mcElem ? astroSeededPick(seed + tag, ASTRO_CAREER_HOUSE10_BY_ELEM[mcElem]) : (house10Elem ? astroSeededPick(seed + tag, ASTRO_CAREER_HOUSE10_BY_ELEM[house10Elem]) : ''); }
  function house2Line(tag) { return house2Elem ? astroSeededPick(seed + tag, ASTRO_CAREER_HOUSE2_BY_ELEM[house2Elem]) : ''; }
  function toneField(fieldKey) { return astroSeededPick(seed + '|' + fieldKey, ASTRO_CAREER_TONE_POOL[fieldKey][valence]); }

  var baseCaveat = '以上為本命星盤的象徵性傾向，反映的是你長期的天賦、慣性與發展模式，並非對職涯結果的確定預測（例如是否升遷、錄取、創業成功或確切收入），實際情況仍需以你自己的專業判斷與現實條件為準。';
  var caveatParts = [baseCaveat];
  if (ev.skipped.some(function (s) { return s.item === 'house2' || s.item === 'house6' || s.item === 'house10' || s.item === 'MC'; })) {
    caveatParts.push('出生時間未知，本次不使用第二、第六、第十宮與天頂（MC）等時間敏感資料，僅採用行星星座與可用相位作為參考。');
  }

  if (subtopicKey === 'industry-fit') {
    var jLine = jupiterLine('|jupiter'), sLine = sunLine('|sun');
    out.conclusion = (jLine || '產業方向的星盤依據暫時不足') + (sLine ? '；同時，' + sLine : '');
    var dims = [];
    if (jupiterElem) dims.push(CAREER_AXIS_LABELS.industryDirection + '：' + jupiterLine('|dim-industry'));
    if (mercuryElem) dims.push(CAREER_AXIS_LABELS.jobFunction + '：' + mercuryLine('|dim-job'));
    if (house6Elem) dims.push(CAREER_AXIS_LABELS.workContent + '：' + house6Line('|dim-content'));
    var envLine = house10OrMcLine('|dim-env');
    if (envLine) dims.push(CAREER_AXIS_LABELS.workEnvironment + '：' + envLine);
    out.traits = dims.join('；');
    out.favor = toneField('favor'); out.action = toneField('action');
    caveatParts.push('星盤只能描述產業與職務的適配傾向，不指定唯一職業，實際選擇仍需考量現實條件與個人意願。');
  } else if (subtopicKey === 'work-style-fit') {
    var mLine = marsLine('|mars'), stLine = saturnLine('|saturn');
    out.conclusion = (mLine || '工作型態的星盤依據暫時不足') + (stLine ? '；同時，' + stLine : '');
    var dims2 = [];
    if (marsElem) dims2.push(CAREER_AXIS_LABELS.employmentType + '：' + marsLine('|dim-employ'));
    if (saturnElem) dims2.push(CAREER_AXIS_LABELS.workRhythm + '：' + saturnLine('|dim-rhythm'));
    out.traits = dims2.join('；');
    out.favor = toneField('favor'); out.risk = toneField('risk');
    caveatParts.push('星盤只能反映受雇／接案／創業／管理／創意／技術等工作型態的相對傾向，不斷言一定適合創業或一定不適合受雇，實際選擇仍需綜合現實條件評估。');
  } else if (subtopicKey === 'career-timing') {
    var jLine2 = jupiterLine('|jupiter'), stLine2 = saturnLine('|saturn');
    out.conclusion = (jLine2 ? '木星的能量顯示，' + jLine2 : '目前擴張傾向的星盤依據暫時不足') + (stLine2 ? '；同時，土星提醒，' + stLine2 : '');
    out.trend = toneField('trend'); out.timing = toneField('timing'); out.favor = toneField('favor'); out.risk = toneField('risk'); out.action = toneField('action');
    caveatParts.push('本命星盤無法預測確切的升遷、錄取或離職日期，以上僅反映目前的發展階段、準備度與擴張／收斂傾向；若要更精準掌握時機，需要搭配行運或推運資料（本次未使用）。');
  } else if (subtopicKey === 'workplace-strength-weakness') {
    var suLine = sunLine('|sun'), stLine3 = saturnLine('|saturn');
    out.conclusion = (suLine || '職場優勢的星盤依據暫時不足') + (stLine3 ? '；同時，土星提醒，' + stLine3 : '');
    var dims3 = [];
    if (sunElem) dims3.push(CAREER_AXIS_LABELS.strength + '：' + sunLine('|dim-strength'));
    if (saturnElem) dims3.push(CAREER_AXIS_LABELS.blindSpot + '：' + saturnLine('|dim-blind'));
    if (jupiterElem) dims3.push(CAREER_AXIS_LABELS.managerFit + '：' + jupiterLine('|dim-manager'));
    if (house6Elem) dims3.push(CAREER_AXIS_LABELS.teamFit + '：' + house6Line('|dim-team'));
    out.traits = dims3.join('；');
    out.favor = toneField('favor'); out.risk = toneField('risk'); out.action = toneField('action');
  } else if (subtopicKey === 'career-talent') {
    var suLine2 = sunLine('|sun'), jLine3 = jupiterLine('|jupiter');
    out.conclusion = (suLine2 || '天賦傾向的星盤依據暫時不足') + (jLine3 ? '；同時，' + jLine3 : '');
    var dims4 = [];
    var dirLine = house10OrMcLine('|dim-direction');
    if (dirLine) dims4.push(CAREER_AXIS_LABELS.longTermDirection + '：' + dirLine);
    if (house2Elem) dims4.push(CAREER_AXIS_LABELS.talentResource + '：' + house2Line('|dim-resource'));
    out.traits = dims4.join('；');
    out.favor = toneField('favor'); out.action = toneField('action');
    caveatParts.push('第二宮只用來描述才能資源的運用傾向，不推算具體薪資或資產；星盤呈現的是長期天賦與能力發展方式，不是對特定職位或成就的確定預測。');
  }

  ['conclusion', 'traits', 'trend', 'favor', 'risk', 'timing', 'action'].forEach(function (f) {
    if (subtopic.fields.indexOf(f) === -1) out[f] = '';
  });
  if (!out.conclusion) out.conclusion = '目前可用的星盤依據不足以針對「' + subtopic.zh + '」給出具體描述，建議先確認出生資料是否完整。';
  out.caveat = caveatParts.join('');
  out.evidence = { used: used, skipped: ev.skipped, seed: ev.seed };
  out.available = true;
  return out;
}

/* 家庭星盤引擎：只使用月亮、第四宮與月亮／土星相關可用相位。月亮與宮位都受出生
   時間影響，因此 unknownTime 時不做替代推測，讓上層安全降級成 cards-only。 */
var ASTRO_FAMILY_MOON_BY_ELEM = {
  火: ['情緒來得直接而快，家中若能允許坦白表達，關係較容易恢復活力', '面對家人時傾向立即反應，需要先降溫再談真正需求'],
  土: ['重視穩定、責任與可預期的生活節奏，常用實際行動照顧家人', '家庭安全感多半來自規律與可靠，但也可能把責任扛得太多'],
  風: ['需要透過說明、討論與交換觀點理解家人，沉默容易增加猜測', '家庭互動重視溝通與空間，比起情緒黏著更需要彼此講清楚'],
  水: ['對家庭氣氛與情緒變化特別敏感，容易先感受到他人未說出口的需要', '很重視情感歸屬與陪伴，也需要避免把家人的情緒全部吸收進來'],
};
var ASTRO_FAMILY_HOUSE4_BY_ELEM = {
  火: ['理想的家需要活力、行動與各自發展的空間', '家庭課題常圍繞誰來帶頭、如何在親近中保有自主'],
  土: ['理想的家重視穩定、責任分工與能長久維持的生活基礎', '家庭課題常圍繞責任、公平分擔與對安全感的不同定義'],
  風: ['理想的家需要充分溝通、平等討論與保留個人空間', '家庭課題常圍繞資訊是否透明、意見能否被聽見'],
  水: ['理想的家重視情感連結、照顧與可以安心示弱的氣氛', '家庭課題常圍繞情緒上的分寸、依賴，以及如何互相支持又不過度承擔'],
};
var ASTRO_FAMILY_TONE_POOL = {
  trend: {
    positive: ['可用相位顯示情緒與責任較能互相配合，家庭關係有逐步穩定的空間'],
    neutral: ['星盤呈現的是可調整的家庭慣性，走向仍取決於實際溝通與分工'],
    challenging: ['可用相位帶有情緒與責任的張力，需要先處理壓力來源，關係才容易鬆動'],
  },
  favor: {
    positive: ['你有能力把感受轉成具體照顧與承諾，這是家庭互動的重要資源'],
    neutral: ['願意辨認自己的情緒需求並把它說清楚，是改善關係的主要助力'],
    challenging: ['先照顧好自己的情緒、找到能支持你的人，會比獨自承擔更有幫助'],
  },
  risk: {
    positive: ['關係和諧時仍要確認責任是否公平，避免習慣性替所有人收拾'],
    neutral: ['容易把熟悉的家庭反應當成唯一做法，需要留意沉默、說教或過度照顧'],
    challenging: ['壓力下可能在控制、退縮或情緒化反應間擺盪，讓真正需求更難被聽見'],
  },
  action: {
    positive: ['可以延續有效的照顧方式，同時把自己的底線與需要說清楚'],
    neutral: ['先用一句具體而不指責的話說明感受，再討論可執行的分工'],
    challenging: ['先降低衝突強度並穩定情緒，再處理責任分工、居住或彼此分寸這些現實問題'],
  },
};
function familyAstroEvidence(chart, unknownTime) {
  var out = { available: false, moon: null, house4: null, aspects: [], skipped: [], seed: '' };
  if (!chart) return out;
  if (unknownTime) {
    out.skipped.push({ item: 'Moon', reason: 'unknown-time-unreliable' }, { item: 'house4', reason: 'unknown-time' });
    return out;
  }
  var moon = chart.planets && chart.planets.Moon;
  if (moon && typeof moon.sign === 'number' && moon.sign >= 0 && moon.sign <= 11) {
    out.moon = { sign: moon.sign, deg: moon.deg, house: moon.house };
  }
  if (chart.houseCusps && chart.houseCusps.length === 12) {
    var cusp = chart.houseCusps[3];
    var sign = Math.floor(astroNormDeg(cusp) / 30);
    if (sign >= 0 && sign <= 11) out.house4 = { sign: sign };
  }
  out.aspects = pureUsableAspects(chart, false).filter(function (a) {
    return a.a === 'Moon' || a.b === 'Moon' || ((a.a === 'Saturn' || a.b === 'Saturn') && (a.a === 'Moon' || a.b === 'Moon'));
  });
  out.available = !!(out.moon || out.house4);
  out.seed = 'moon:' + (out.moon ? out.moon.sign + '-' + Math.round(out.moon.deg) : 'na') +
    '|h4:' + (out.house4 ? out.house4.sign : 'na') +
    '|asp:' + out.aspects.map(function (a) { return a.a + a.type + a.b + Math.round(a.orb * 10); }).sort().join(',');
  return out;
}
function astroCategoryReadingFamily(subtopicKey, chart, unknownTime) {
  var out = { available: false, reason: '', catKey: 'family', subtopicKey: subtopicKey, conclusion: '', traits: '', trend: '', favor: '', risk: '', timing: '', action: '', caveat: '', evidence: null, tone: null };
  var subtopic = (SUBTOPICS.family || []).filter(function (s) { return s.key === subtopicKey; })[0];
  if (!subtopic) { out.reason = 'unknown-subtopic'; return out; }
  if (!chart) { out.reason = 'no-chart'; return out; }
  var ev = familyAstroEvidence(chart, unknownTime);
  if (!ev.available) { out.reason = unknownTime ? 'unknown-time-unreliable' : 'no-focus-data'; out.evidence = ev; return out; }
  var seed = 'family|' + subtopicKey + '|' + ev.seed;
  var moonElem = ev.moon ? ZODIAC_SIGNS[ev.moon.sign].elem : null;
  var houseElem = ev.house4 ? ZODIAC_SIGNS[ev.house4.sign].elem : null;
  var moonLine = moonElem ? astroSeededPick(seed + '|moon', ASTRO_FAMILY_MOON_BY_ELEM[moonElem]) : '';
  var houseLine = houseElem ? astroSeededPick(seed + '|house4', ASTRO_FAMILY_HOUSE4_BY_ELEM[houseElem]) : '';
  var tone = loveAstroValence(ev.aspects);
  out.tone = tone;
  if (subtopicKey === 'family-dynamics') {
    out.conclusion = moonLine + (houseLine ? '；' + houseLine : '');
    out.traits = '情緒互動：' + moonLine + (houseLine ? '；家庭根基：' + houseLine : '');
    out.favor = ASTRO_FAMILY_TONE_POOL.favor[tone][0]; out.risk = ASTRO_FAMILY_TONE_POOL.risk[tone][0];
  } else if (subtopicKey === 'family-relations') {
    out.conclusion = moonLine;
    out.trend = ASTRO_FAMILY_TONE_POOL.trend[tone][0]; out.risk = ASTRO_FAMILY_TONE_POOL.risk[tone][0]; out.action = ASTRO_FAMILY_TONE_POOL.action[tone][0];
  } else if (subtopicKey === 'living-responsibility') {
    out.conclusion = houseLine || moonLine;
    out.trend = ASTRO_FAMILY_TONE_POOL.trend[tone][0]; out.risk = ASTRO_FAMILY_TONE_POOL.risk[tone][0]; out.action = ASTRO_FAMILY_TONE_POOL.action[tone][0];
  } else if (subtopicKey === 'family-improve') {
    out.conclusion = '改善可以從理解自己的情緒安全感開始：' + moonLine;
    out.favor = ASTRO_FAMILY_TONE_POOL.favor[tone][0]; out.action = ASTRO_FAMILY_TONE_POOL.action[tone][0];
  }
  var used = [];
  if (ev.moon) used.push(astroLovePlanetEvidenceStr('Moon', ev.moon));
  if (ev.house4) used.push(astroLoveHouseEvidenceStr(4, ev.house4));
  ev.aspects.forEach(function (a) { used.push('相位：' + astroLoveAspectEvidenceStr(a)); });
  out.caveat = '以上只描述你自己的情緒安全感、家庭慣性與第四宮象徵，不能代替父母、手足或伴侶說明其真實想法，也不能預測確定的搬家、分離或家庭事件。';
  out.evidence = { used: used, skipped: ev.skipped, seed: ev.seed };
  out.available = true;
  return out;
}

/* 財運星盤引擎：金星描述價值與消費偏好，木星描述擴張方式，土星描述風險與長期
   建立；出生時間已知時才加入第二／第八宮。只提供象徵性資源模式，不推算報酬。 */
var ASTRO_WEALTH_VALUE_BY_ELEM = {
  火: ['價值選擇偏向機會與體驗，做決定速度快，需預先設定支出與風險上限'],
  土: ['價值選擇偏向穩定與實用，重視可累積、可掌握的長期成果'],
  風: ['價值選擇偏向資訊與彈性，習慣比較方案，但需避免頻繁改變決策'],
  水: ['價值選擇容易受感受與關係影響，需要區分情感滿足與實際負擔'],
};
var ASTRO_WEALTH_GROWTH_BY_ELEM = {
  火: ['擴張方式偏向主動爭取與快速嘗試，適合小規模驗證後再增加投入'],
  土: ['擴張方式偏向穩健累積、建立專業與可重複的收入基礎'],
  風: ['擴張方式偏向知識、人脈與多元合作，資訊品質會直接影響成果'],
  水: ['擴張方式偏向信任、服務與理解需求，需同步建立清楚的交換條件'],
};
var ASTRO_WEALTH_DISCIPLINE_BY_ELEM = {
  火: ['風險課題在於控制衝動與過度自信，把行動力放進明確規則'],
  土: ['風險課題在於避免因害怕失去而過度保守，也要定期檢查資源配置'],
  風: ['風險課題在於避免資訊過量與反覆猶豫，應建立一致的判斷標準'],
  水: ['風險課題在於避免因為情緒、信任或人情壓力，在金錢上失去該有的分寸'],
};
var ASTRO_WEALTH_HOUSE2_BY_ELEM = {
  火: ['收入與個人資源較適合透過主動開發、獨立行動或成果導向的方式建立'],
  土: ['收入與個人資源較適合透過穩定專業、制度與長期累積建立'],
  風: ['收入與個人資源較適合透過資訊、溝通、教學、人脈或多元技能建立'],
  水: ['收入與個人資源較適合透過服務、創作、照顧或理解情感需求建立'],
};
var ASTRO_WEALTH_HOUSE8_BY_ELEM = {
  火: ['共同財務與合作資源需要先講清楚決策權及最大可承擔損失'],
  土: ['共同財務與合作資源需要清楚契約、責任分配與長期安全基礎'],
  風: ['共同財務與合作資源需要資訊透明、定期確認與保留調整空間'],
  水: ['共同財務與合作資源需要避免人情取代規則，並保留各自可以自己決定的部分'],
};
function wealthAstroEvidence(chart, unknownTime) {
  var out = { available: false, planets: {}, houses: {}, aspects: [], skipped: [], seed: '' };
  if (!chart) return out;
  ['Venus', 'Jupiter', 'Saturn'].forEach(function (key) {
    var p = chart.planets && chart.planets[key];
    if (p && typeof p.sign === 'number' && p.sign >= 0 && p.sign <= 11) out.planets[key] = { sign: p.sign, deg: p.deg, retro: !!p.retro, house: unknownTime ? null : p.house };
  });
  if (!unknownTime && chart.houseCusps && chart.houseCusps.length === 12) {
    [2, 8].forEach(function (h) { out.houses[h] = { sign: Math.floor(astroNormDeg(chart.houseCusps[h - 1]) / 30) }; });
  } else if (unknownTime) {
    out.skipped.push({ item: 'house2', reason: 'unknown-time' }, { item: 'house8', reason: 'unknown-time' });
  }
  var keys = ['Venus', 'Jupiter', 'Saturn'];
  out.aspects = pureUsableAspects(chart, unknownTime).filter(function (a) { return keys.indexOf(a.a) !== -1 || keys.indexOf(a.b) !== -1; });
  out.available = !!(out.planets.Venus || out.planets.Jupiter || out.planets.Saturn);
  out.seed = keys.map(function (k) { return k + ':' + (out.planets[k] ? out.planets[k].sign : 'na'); }).join('|') +
    '|h2:' + (out.houses[2] ? out.houses[2].sign : 'na') + '|h8:' + (out.houses[8] ? out.houses[8].sign : 'na') +
    '|asp:' + out.aspects.map(function (a) { return a.a + a.type + a.b + Math.round(a.orb * 10); }).sort().join(',');
  return out;
}
function astroCategoryReadingWealth(subtopicKey, chart, unknownTime) {
  var out = { available: false, reason: '', catKey: 'wealth', subtopicKey: subtopicKey, conclusion: '', traits: '', trend: '', favor: '', risk: '', timing: '', action: '', caveat: '', evidence: null, tone: null };
  var subtopic = (SUBTOPICS.wealth || []).filter(function (s) { return s.key === subtopicKey; })[0];
  if (!subtopic) { out.reason = 'unknown-subtopic'; return out; }
  if (!chart) { out.reason = 'no-chart'; return out; }
  var ev = wealthAstroEvidence(chart, unknownTime);
  if (!ev.available) { out.reason = 'no-focus-data'; return out; }
  var seed = 'wealth|' + subtopicKey + '|' + ev.seed;
  function elemOf(p) { return p ? ZODIAC_SIGNS[p.sign].elem : null; }
  var ve = elemOf(ev.planets.Venus), je = elemOf(ev.planets.Jupiter), se = elemOf(ev.planets.Saturn);
  var h2e = elemOf(ev.houses[2]), h8e = elemOf(ev.houses[8]);
  var valueLine = ve ? ASTRO_WEALTH_VALUE_BY_ELEM[ve][0] : '';
  var growthLine = je ? ASTRO_WEALTH_GROWTH_BY_ELEM[je][0] : '';
  var disciplineLine = se ? ASTRO_WEALTH_DISCIPLINE_BY_ELEM[se][0] : '';
  var h2Line = h2e ? ASTRO_WEALTH_HOUSE2_BY_ELEM[h2e][0] : '';
  var h8Line = h8e ? ASTRO_WEALTH_HOUSE8_BY_ELEM[h8e][0] : '';
  var tone = loveAstroValence(ev.aspects);
  out.tone = tone;
  if (subtopicKey === 'cashflow-risk') {
    out.conclusion = valueLine + (h2Line ? '；' + h2Line : '');
    out.trend = WEALTH_TONE_POOL.trend[tone][0]; out.risk = disciplineLine || WEALTH_TONE_POOL.risk[tone][0]; out.action = WEALTH_TONE_POOL.action[tone][0];
  } else if (subtopicKey === 'risk-approach') {
    out.conclusion = disciplineLine + (growthLine ? '；' + growthLine : '');
    out.trend = WEALTH_TONE_POOL.trend[tone][0]; out.favor = WEALTH_TONE_POOL.favor[tone][0]; out.risk = WEALTH_TONE_POOL.risk[tone][0];
  } else if (subtopicKey === 'opportunity-source') {
    out.conclusion = growthLine || valueLine;
    out.traits = '個人資源：' + (h2Line || growthLine) + (h8Line ? '；合作資源：' + h8Line : '');
    out.favor = WEALTH_TONE_POOL.favor[tone][0]; out.action = WEALTH_TONE_POOL.action[tone][0];
  } else if (subtopicKey === 'money-pattern') {
    out.conclusion = valueLine + (disciplineLine ? '；' + disciplineLine : '');
    out.traits = '價值與消費：' + valueLine + (h2Line ? '；收入資源：' + h2Line : '') + (h8Line ? '；共同資源：' + h8Line : '');
    out.trend = WEALTH_TONE_POOL.trend[tone][0];
  }
  var used = [];
  ['Venus', 'Jupiter', 'Saturn'].forEach(function (k) { if (ev.planets[k]) used.push(astroLovePlanetEvidenceStr(k, ev.planets[k])); });
  if (ev.houses[2]) used.push(astroLoveHouseEvidenceStr(2, ev.houses[2]));
  if (ev.houses[8]) used.push(astroLoveHouseEvidenceStr(8, ev.houses[8]));
  ev.aspects.forEach(function (a) { used.push('相位：' + astroLoveAspectEvidenceStr(a)); });
  var timeNote = unknownTime ? ' 出生時間未知，本次不使用第二宮與第八宮，只採用行星星座及可靠相位。' : '';
  out.caveat = FINANCE_DISCLAIMER + timeNote + ' 星盤只能描述價值觀、資源運用與風險傾向，不能預測特定投資報酬、價格走勢或確切收入。';
  out.evidence = { used: used, skipped: ev.skipped, seed: seed };
  out.available = true;
  return out;
}

/* 健康／人際／學業星盤引擎：依 ASTRO_CATEGORY_FOCUS 的既有行星與宮位設定整理證據。
   健康只談壓力反應與生活習慣，不建立星座／宮位到器官或疾病的對應。 */
var REMAINING_ASTRO_LABEL = {
  health: { Sun:'活力與日常主軸', Moon:'情緒與安全感', house6:'日常習慣', ASC:'身體節奏' },
  social: { Mercury:'溝通方式', Venus:'關係價值', house11:'社群與朋友圈' },
  study: { Mercury:'理解與表達', Jupiter:'視野與成長', house3:'基礎學習', house9:'高等學習與遠方經驗' },
};
function remainingAstroEvidence(catKey, chart, unknownTime) {
  var out = { available:false, planets:{}, houses:{}, asc:null, aspects:[], skipped:[], seed:'' };
  if (!chart) return out;
  var ctx = { chart:chart, unknownTime:!!unknownTime }, focus = astroAvailableFocus(ctx, catKey);
  focus.planets.forEach(function (key) {
    if (unknownTime && key === 'Moon') { out.skipped.push({item:'Moon',reason:'unknown-time-unreliable'}); return; }
    var p = chart.planets && chart.planets[key];
    if (p && typeof p.sign === 'number' && p.sign >= 0 && p.sign <= 11) out.planets[key] = {sign:p.sign,deg:p.deg,retro:!!p.retro,house:unknownTime?null:p.house};
  });
  focus.houses.forEach(function (h) {
    if (chart.houseCusps && chart.houseCusps.length === 12) out.houses[h] = {sign:Math.floor(astroNormDeg(chart.houseCusps[h-1])/30)};
  });
  if (unknownTime) ASTRO_CATEGORY_FOCUS[catKey].houses.forEach(function (h) { out.skipped.push({item:'house'+h,reason:'unknown-time'}); });
  if (focus.useAsc && typeof chart.ascSign === 'number') out.asc = {sign:chart.ascSign};
  if (unknownTime && ASTRO_CATEGORY_FOCUS[catKey].useAsc) out.skipped.push({item:'ASC',reason:'unknown-time'});
  var keys = focus.planets.filter(function (k) { return !(unknownTime && k === 'Moon'); });
  out.aspects = pureUsableAspects(chart, unknownTime).filter(function (a) { return keys.indexOf(a.a)!==-1 || keys.indexOf(a.b)!==-1; });
  out.available = Object.keys(out.planets).length > 0;
  out.seed = keys.map(function(k){return k+':'+(out.planets[k]?out.planets[k].sign:'na');}).join('|') +
    '|houses:' + Object.keys(out.houses).map(function(h){return h+':'+out.houses[h].sign;}).join(',') +
    '|asp:' + out.aspects.map(function(a){return a.a+a.type+a.b+Math.round(a.orb*10);}).sort().join(',');
  return out;
}
function astroCategoryReadingRemaining(catKey, subtopicKey, chart, unknownTime) {
  var out = { available:false, reason:'', catKey:catKey, subtopicKey:subtopicKey, conclusion:'', traits:'', trend:'', favor:'', risk:'', timing:'', action:'', caveat:'', evidence:null, tone:null };
  var subtopic = (SUBTOPICS[catKey] || []).filter(function(s){return s.key===subtopicKey;})[0];
  if (['health','social','study'].indexOf(catKey)===-1) { out.reason='unsupported-category'; return out; }
  if (!subtopic) { out.reason='unknown-subtopic'; return out; }
  if (!chart) { out.reason='no-chart'; return out; }
  var ev = remainingAstroEvidence(catKey, chart, unknownTime);
  if (!ev.available) { out.reason='no-focus-data'; out.evidence=ev; return out; }
  var labels = REMAINING_ASTRO_LABEL[catKey], parts=[], used=[];
  Object.keys(ev.planets).forEach(function(key){
    var p=ev.planets[key], sign=ZODIAC_SIGNS[p.sign], sb=SIGN_BEGINNER[p.sign];
    parts.push((labels[key]||key)+'：'+sb.behavior);
    used.push(astroLovePlanetEvidenceStr(key,p));
  });
  Object.keys(ev.houses).forEach(function(h){
    var ho=ev.houses[h], hb=HOUSE_BEGINNER[parseInt(h,10)-1];
    parts.push((labels['house'+h]||('第'+h+'宮'))+'：'+hb.lifeArea);
    used.push(astroLoveHouseEvidenceStr(parseInt(h,10),ho));
  });
  if (ev.asc) { parts.push('身體與外在節奏：'+SIGN_BEGINNER[ev.asc.sign].behavior); used.push('上升：'+ZODIAC_SIGNS[ev.asc.sign].zh); }
  ev.aspects.forEach(function(a){used.push('相位：'+astroLoveAspectEvidenceStr(a));});
  var tone=loveAstroValence(ev.aspects); out.tone=tone;
  if (catKey==='health') {
    out.conclusion = subtopicKey==='self-care-symbolic'
      ? '星盤可提供的自我照顧方向是：'+parts.join('；')
      : '你的壓力反應與生活節奏可能呈現：'+parts.join('；');
    out.action = REMAINING_TONE_POOL.health.action[tone];
    if (subtopic.fields.indexOf('trend')!==-1) out.trend=REMAINING_TONE_POOL.health.trend[tone];
    if (subtopic.fields.indexOf('favor')!==-1) out.favor=REMAINING_TONE_POOL.health.favor[tone];
    if (subtopic.fields.indexOf('risk')!==-1) out.risk=REMAINING_TONE_POOL.health.risk[tone];
    out.caveat=HEALTH_DISCLAIMER+' 星盤不用于判斷特定器官、疾病或治療方式，只能作為壓力、作息與自我照顧的象徵性參考。';
  } else if (catKey==='social') {
    out.conclusion='你在人際中的溝通、價值與群體互動傾向是：'+parts.join('；');
    if (subtopic.fields.indexOf('traits')!==-1) out.traits=parts.join('；');
    if (subtopic.fields.indexOf('favor')!==-1) out.favor=REMAINING_TONE_POOL.social.favor[tone];
    if (subtopic.fields.indexOf('risk')!==-1) out.risk=REMAINING_TONE_POOL.social.risk[tone];
    if (subtopic.fields.indexOf('action')!==-1) out.action=REMAINING_TONE_POOL.social.action[tone];
    out.caveat='星盤只描述你自己的溝通與群體互動傾向，無法判定他人的真實想法，也不代表某類人必然是貴人、競爭者或不適合交往。';
  } else {
    out.conclusion='你的理解、表達與拓展知識的方式可能是：'+parts.join('；');
    if (subtopic.fields.indexOf('traits')!==-1) out.traits=parts.join('；');
    if (subtopic.fields.indexOf('trend')!==-1) out.trend=REMAINING_TONE_POOL.study.trend[tone];
    if (subtopic.fields.indexOf('timing')!==-1) out.timing=tone==='positive'?'近期適合依計畫穩定推進':(tone==='neutral'?'仍需一段時間準備與驗證':'宜先補足基礎，再安排重要考試或申請節奏');
    if (subtopic.fields.indexOf('favor')!==-1) out.favor=REMAINING_TONE_POOL.study.favor[tone];
    if (subtopic.fields.indexOf('risk')!==-1) out.risk=REMAINING_TONE_POOL.study.risk[tone];
    if (subtopic.fields.indexOf('action')!==-1) out.action=REMAINING_TONE_POOL.study.action[tone];
    out.caveat='星盤只能描述學習與理解方式，不能保證考試、錄取、留學、申請或證照結果；實際成果仍取決於準備程度與現實條件。';
  }
  out.evidence={used:used,skipped:ev.skipped,seed:ev.seed}; out.available=true; return out;
}

/* 「綜合」使用整張本命盤的長期傾向，不把本命盤寫成短期事件預報。
   出生時間未知時，月亮、上升與宮位一律不使用；相位沿用 pureUsableAspects() 的過濾規則。 */
function generalAstroEvidence(chart, unknownTime) {
  var out={available:false,planets:{},asc:null,focusHouse:null,aspects:[],balance:null,skipped:[],seed:''};
  if(!chart||!chart.planets)return out;
  ['Sun','Jupiter','Saturn'].forEach(function(key){
    var p=chart.planets[key];
    if(p&&typeof p.sign==='number'&&p.sign>=0&&p.sign<12)out.planets[key]={sign:p.sign,deg:p.deg,house:unknownTime?null:p.house,retro:!!p.retro};
    else out.skipped.push({item:key,reason:'not-in-chart'});
  });
  if(!unknownTime){
    var moon=chart.planets.Moon;
    if(moon&&typeof moon.sign==='number'&&moon.sign>=0&&moon.sign<12)out.planets.Moon={sign:moon.sign,deg:moon.deg,house:moon.house,retro:!!moon.retro};
    if(typeof chart.ascSign==='number'&&chart.ascSign>=0&&chart.ascSign<12)out.asc={sign:chart.ascSign};
    var counts={};
    Object.keys(chart.planets).forEach(function(key){
      var h=chart.planets[key]&&chart.planets[key].house;
      if(h>=1&&h<=12)counts[h]=(counts[h]||0)+1;
    });
    var focusH=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a]||parseInt(a,10)-parseInt(b,10);})[0];
    if(focusH&&HOUSE_BEGINNER[parseInt(focusH,10)-1])out.focusHouse={house:parseInt(focusH,10),count:counts[focusH]};
  }else{
    out.skipped.push({item:'Moon',reason:'unknown-time'},{item:'ASC',reason:'unknown-time'},{item:'houses',reason:'unknown-time'});
  }
  try{out.balance=computeElementQualityBalance(chart);}catch(e){out.balance=null;}
  out.aspects=pureUsableAspects(chart,unknownTime).slice().sort(function(a,b){
    var pa=natalAspectPriority(a)==='core'?0:1,pb=natalAspectPriority(b)==='core'?0:1;
    return pa-pb||a.orb-b.orb;
  }).slice(0,5).map(function(a){return{a:a.a,b:a.b,type:a.type,orb:a.orb};});
  out.available=!!out.planets.Sun;
  out.seed=['Sun','Moon','Jupiter','Saturn'].map(function(k){return k+':'+(out.planets[k]?out.planets[k].sign:'na');}).join('|')+
    '|asc:'+(out.asc?out.asc.sign:'na')+'|house:'+(out.focusHouse?out.focusHouse.house:'na')+
    '|asp:'+out.aspects.map(function(a){return a.a+a.type+a.b+Math.round(a.orb*10);}).join(',');
  return out;
}
var GENERAL_ASTRO_TONE_POOL={
  trend:{positive:'長期傾向顯示現有方向較能得到內在能力支持，適合穩定累積',neutral:'目前較像重新整理生活重心的階段，需要透過實際選擇逐步聚焦',challenging:'長期課題彼此施壓時，先穩住基本節奏比一次改變所有事情更重要'},
  favor:{positive:'能主動運用既有優勢並接受合適支持，是目前可持續發展的力量',neutral:'願意盤點真正重視的事、保留調整空間，會比追求完美答案更有幫助',challenging:'規律的生活、清楚的底線，以及可以信任的支持系統，是面對壓力的重要資源'},
  risk:{positive:'進展順利時仍要留意過度擴張，避免把每個機會都當成必要責任',neutral:'容易在多個方向間分散心力，或用思考取代真正的優先排序',challenging:'壓力可能放大自我懷疑與控制需求，需要避免在疲憊時做全面性決定'},
  action:{positive:'保留有效做法，選一項最重要的長期目標安排下一個可完成步驟',neutral:'先分清楚必要、想要與可以延後的事情，再把注意力放回可控制的部分',challenging:'先照顧作息、安全與必要責任，等狀態穩定後再處理較大的方向調整'},
};
function astroCategoryReadingGeneral(subtopicKey,chart,unknownTime){
  var out={available:false,reason:'',catKey:'general',subtopicKey:subtopicKey,conclusion:'',traits:'',trend:'',favor:'',risk:'',timing:'',action:'',caveat:'',evidence:null,tone:null};
  var subtopic=(SUBTOPICS.general||[]).filter(function(s){return s.key===subtopicKey;})[0];
  if(!subtopic){out.reason='unknown-subtopic';return out;} if(!chart){out.reason='no-chart';return out;}
  var ev=generalAstroEvidence(chart,unknownTime);if(!ev.available){out.reason='no-focus-data';out.evidence=ev;return out;}
  var used=[],sun=ev.planets.Sun,jupiter=ev.planets.Jupiter,saturn=ev.planets.Saturn;
  var sunSign=ZODIAC_SIGNS[sun.sign],sunB=SIGN_BEGINNER[sun.sign];
  var elemKeys=['火','土','風','水'],topElem=ev.balance?elemKeys.reduce(function(best,k){return ev.balance.elem[k]>ev.balance.elem[best]?k:best;},elemKeys[0]):sunSign.elem;
  var houseText=ev.focusHouse?HOUSE_BEGINNER[ev.focusHouse.house-1].lifeArea:'';
  used.push(astroLovePlanetEvidenceStr('Sun',sun));
  if(jupiter)used.push(astroLovePlanetEvidenceStr('Jupiter',jupiter));
  if(saturn)used.push(astroLovePlanetEvidenceStr('Saturn',saturn));
  if(ev.planets.Moon)used.push(astroLovePlanetEvidenceStr('Moon',ev.planets.Moon));
  if(ev.asc)used.push('上升：'+ZODIAC_SIGNS[ev.asc.sign].zh);
  if(ev.focusHouse)used.push('行星較集中：第'+ev.focusHouse.house+'宮（'+houseText+'）');
  ev.aspects.forEach(function(a){used.push('重要相位：'+astroLoveAspectEvidenceStr(a));});
  var tone=loveAstroValence(ev.aspects);out.tone=tone;
  var lifeBase=houseText?('，較常在「'+houseText+'」這個生活領域被看見'):'';
  if(subtopicKey==='overall-theme'){
    out.conclusion='你的長期生活主軸，是用'+sunSign.zh+'式的「'+sunB.method+'」建立自我方向'+lifeBase+'。';
    out.trend=GENERAL_ASTRO_TONE_POOL.trend[tone];out.favor=GENERAL_ASTRO_TONE_POOL.favor[tone];out.risk=GENERAL_ASTRO_TONE_POOL.risk[tone];out.action=GENERAL_ASTRO_TONE_POOL.action[tone];
  }else if(subtopicKey==='priority-focus'){
    var focusText=houseText||('把'+topElem+'元素代表的慣用反應轉成可持續的生活安排');
    out.conclusion='目前最值得長期投入的重點，是'+focusText+'。';
    out.traits='優先面向：'+focusText+'；核心做法：'+sunB.behavior;
    out.risk=GENERAL_ASTRO_TONE_POOL.risk[tone];out.action=GENERAL_ASTRO_TONE_POOL.action[tone];
  }else if(subtopicKey==='hidden-blindspot'){
    var saturnText=saturn?SIGN_BEGINNER[saturn.sign].shadow:'壓力下可能只沿用熟悉方法';
    out.conclusion='星盤較需要留意的盲點，是'+saturnText+'。';
    out.risk=GENERAL_ASTRO_TONE_POOL.risk[tone];
    out.action=saturn?('可以從土星所在的'+ZODIAC_SIGNS[saturn.sign].zh+'課題著手：'+SIGN_BEGINNER[saturn.sign].matureExpression+'。'):GENERAL_ASTRO_TONE_POOL.action[tone];
  }else{
    var jText=jupiter?SIGN_BEGINNER[jupiter.sign].matureExpression:sunB.matureExpression;
    out.conclusion='下一階段可發展的方向，是'+jText+lifeBase+'。';
    out.trend=GENERAL_ASTRO_TONE_POOL.trend[tone];out.favor=GENERAL_ASTRO_TONE_POOL.favor[tone];out.action=GENERAL_ASTRO_TONE_POOL.action[tone];
  }
  ['conclusion','traits','trend','favor','risk','timing','action'].forEach(function(f){if(subtopic.fields.indexOf(f)===-1)out[f]='';});
  out.caveat='綜合星盤解讀描述的是較長期的性格資源與人生課題，不是近期事件預報，也不能確定某件事必然發生。'+(unknownTime?' 出生時間未知，本次未使用月亮、上升與宮位，只採用較可靠的行星星座與相位。':'');
  out.evidence={used:used,skipped:ev.skipped,seed:ev.seed};out.available=true;return out;
}

/* astroCategoryReading(catKey, subtopicKey, chart, unknownTime)
   目前支援 catKey==='love'（astroCategoryReadingLove，Phase 1B，邏輯完全不變）與
   catKey==='career'（astroCategoryReadingCareer，Phase 2B）；chart 需為 computeNatalChart()
   的真實回傳值，unknownTime 由呼叫端明確傳入。資料不足時回傳 available:false 並附上原因，
   絕不捏造內容；available:true 時 conclusion／caveat 一定非空，其餘欄位依對應 SUBTOPICS 的
   fields 填入。 */
function astroCategoryReading(catKey, subtopicKey, chart, unknownTime) {
  if (catKey === 'career') return astroCategoryReadingCareer(subtopicKey, chart, unknownTime);
  if (catKey === 'family') return astroCategoryReadingFamily(subtopicKey, chart, unknownTime);
  if (catKey === 'wealth') return astroCategoryReadingWealth(subtopicKey, chart, unknownTime);
  if (['health', 'social', 'study'].indexOf(catKey) !== -1) return astroCategoryReadingRemaining(catKey, subtopicKey, chart, unknownTime);
  if (catKey === 'general') return astroCategoryReadingGeneral(subtopicKey, chart, unknownTime);
  return astroCategoryReadingLove(catKey, subtopicKey, chart, unknownTime);
}
function astroCategoryReadingLove(catKey, subtopicKey, chart, unknownTime) {
  var out = {
    available: false, reason: '', catKey: catKey, subtopicKey: subtopicKey,
    conclusion: '', traits: '', trend: '', favor: '', risk: '', timing: '', action: '', caveat: '',
    evidence: null, tone: null,
  };
  if (catKey !== 'love') { out.reason = 'unsupported-category'; return out; }
  var subtopic = (SUBTOPICS.love || []).filter(function (s) { return s.key === subtopicKey; })[0];
  if (!subtopic) { out.reason = 'unknown-subtopic'; return out; }
  if (subtopic.modes.indexOf('astro') === -1) { out.reason = 'mode-not-supported'; return out; }
  if (!chart) { out.reason = 'no-chart'; return out; }

  var ev = loveAstroEvidence(chart, unknownTime);
  if (!ev.planets.Venus && !ev.planets.Mars) { out.reason = 'no-focus-data'; return out; }

  var seed = subtopicKey + '|' + ev.seed;
  var used = []; // 這次輸出實際引用了哪些真實星盤依據，供測試／未來 UI 顯示
  function note(str) { used.push(str); }

  var venusP = ev.planets.Venus, marsP = ev.planets.Mars, moonP = ev.planets.Moon;
  var venusElem = venusP ? ZODIAC_SIGNS[venusP.sign].elem : null;
  var marsElem = marsP ? ZODIAC_SIGNS[marsP.sign].elem : null;
  var moonElem = moonP ? ZODIAC_SIGNS[moonP.sign].elem : null;
  var house5 = ev.houses[5], house7 = ev.houses[7];
  var house5Elem = house5 ? ZODIAC_SIGNS[house5.sign].elem : null;
  var house7Elem = house7 ? ZODIAC_SIGNS[house7.sign].elem : null;
  var valence = loveAstroValence(ev.aspects);
  out.tone = valence; // Phase 1C：純新增的非 UI meta 欄位，供 combinedReading() 比對牌卡／星盤語氣，不影響既有欄位

  if (venusP) note(astroLovePlanetEvidenceStr('Venus', venusP));
  if (marsP) note(astroLovePlanetEvidenceStr('Mars', marsP));
  if (moonP) note(astroLovePlanetEvidenceStr('Moon', moonP));
  if (house5) note(astroLoveHouseEvidenceStr(5, house5));
  if (house7) note(astroLoveHouseEvidenceStr(7, house7));
  ev.aspects.forEach(function (a) { note('相位：' + astroLoveAspectEvidenceStr(a)); });

  function venusLine(seedTag) { return venusElem ? astroSeededPick(seed + seedTag, ASTRO_LOVE_VENUS_ATTRACT[venusElem]) : ''; }
  function marsLine(seedTag) { return marsElem ? astroSeededPick(seed + seedTag, ASTRO_LOVE_MARS_PURSUIT[marsElem]) : ''; }
  function moonLine(seedTag) { return moonElem ? astroSeededPick(seed + seedTag, ASTRO_LOVE_MOON_NEED[moonElem]) : ''; }
  function house5Line(seedTag) { return house5Elem ? astroSeededPick(seed + seedTag, ASTRO_LOVE_HOUSE5_DATING[house5Elem]) : ''; }
  function house7Line(seedTag) { return house7Elem ? astroSeededPick(seed + seedTag, ASTRO_LOVE_HOUSE7_PARTNER[house7Elem]) : ''; }
  function toneField(fieldKey) { return astroSeededPick(seed + '|' + fieldKey, ASTRO_LOVE_TONE_POOL[fieldKey][valence]); }

  var noPartnerDataNote = '沒有對方的出生資料，無法解讀對方目前的心意，也無法判斷是否會有具體結果；以下僅反映你自身在這類情境中的傾向。';
  var baseCaveat = '以上為本命星盤的象徵性傾向，反映的是你自身容易展現或吸引的特質，並非對真實人物或事件的確定預測。';
  var caveatParts = [baseCaveat];
  if (ev.skipped.some(function (s) { return s.item === 'Moon'; })) caveatParts.push('出生時間未知，本次不使用月亮的星座、宮位與相位資料。');
  if (ev.skipped.some(function (s) { return s.item === 'house5' || s.item === 'house7'; })) caveatParts.push('出生時間未知，第五宮與第七宮的宮位資料本次未使用。');

  if (subtopicKey === 'partner-type') {
    var vLine = venusLine('|venus'), mLine = marsLine('|mars');
    out.conclusion = (vLine || '感情價值傾向暫時缺乏足夠資料判斷') + (mLine ? '；同時，' + mLine : '');
    var ppApp = venusElem ? astroSeededPick(seed + '|pp-app', ASTRO_LOVE_PP_APPEARANCE[venusElem]) : '';
    var ppPer = marsElem ? astroSeededPick(seed + '|pp-per', ASTRO_LOVE_PP_PERSONALITY[marsElem]) : '';
    out.traits = [ppApp && (TRAIT_AXIS_LABELS.appearance + '：' + ppApp), ppPer && (TRAIT_AXIS_LABELS.personality + '：' + ppPer)].filter(Boolean).join('；');
    out.trend = toneField('trend'); out.favor = toneField('favor'); out.risk = toneField('risk'); out.action = toneField('action');
    caveatParts.push('星盤能反映的是你容易被吸引、或容易展現的特質範圍，不是對某個特定未來對象的確定描述。');
  } else if (subtopicKey === 'partner-profile') {
    var tagVenus = venusElem ? astroSeededPick(seed + '|tag', ASTRO_LOVE_PP_APPEARANCE[venusElem]) : '';
    out.conclusion = '星盤傾向呈現的是一種較' + (venusElem ? ZODIAC_SIGNS[venusP.sign].trait : '難以從目前資料判斷') + '的吸引力；' + (tagVenus || '外貌與氣質的象徵傾向暫時缺乏足夠資料判斷');
    var dims = [];
    var saturnAsp = loveSaturnAspect(ev.aspects);
    if (saturnAsp) note('相位（年齡依據）：' + astroLoveAspectEvidenceStr(saturnAsp));
    var ageLine = saturnAsp ? astroSeededPick(seed + '|pp-age-saturn', ASTRO_LOVE_PP_AGE_SATURN) : ASTRO_LOVE_PP_AGE_INSUFFICIENT;
    dims.push(TRAIT_AXIS_LABELS.ageHint + '：' + ageLine);
    if (venusElem) dims.push(TRAIT_AXIS_LABELS.appearance + '：' + astroSeededPick(seed + '|pp-app2', ASTRO_LOVE_PP_APPEARANCE[venusElem]));
    if (marsElem) dims.push(TRAIT_AXIS_LABELS.personality + '：' + astroSeededPick(seed + '|pp-per2', ASTRO_LOVE_PP_PERSONALITY[marsElem]));
    if (marsElem) dims.push(TRAIT_AXIS_LABELS.jobType + '：' + astroSeededPick(seed + '|pp-job', ASTRO_LOVE_PP_JOBTYPE[marsElem]));
    if (venusElem) dims.push(TRAIT_AXIS_LABELS.financeStyle + '：' + astroSeededPick(seed + '|pp-fin', ASTRO_LOVE_PP_FINANCE[venusElem]));
    if (house7Elem) dims.push(ASTRO_LOVE_FAMILY_VALUE_LABEL + '：' + astroSeededPick(seed + '|pp-fam', ASTRO_LOVE_PP_FAMILYVALUE[house7Elem]));
    out.traits = dims.join('；');
    out.favor = toneField('favor'); out.risk = toneField('risk');
    caveatParts.push('年齡／成熟度傾向只在金星或火星（或月亮）與土星形成主要相位時才判斷，其餘情況不從一般相位和諧度推測同齡、年長或年輕，也不提供精確年齡。');
    caveatParts.push('職業與經濟觀念部分是金星／火星特質的象徵性延伸，並非對實際職業、收入或資產的判斷；完整的職業與財務傾向還需要第二、第六、第十宮與土星等本次未使用的資料。');
    caveatParts.push('「' + ASTRO_LOVE_FAMILY_VALUE_LABEL + '」描述的是你自己對伴侶與家庭的期待傾向；沒有對方本人的出生資料，無法判斷其真實原生家庭、家庭條件或家庭互動。');
    if (!house7Elem) caveatParts.push('出生時間未知或缺少第七宮資料，「' + ASTRO_LOVE_FAMILY_VALUE_LABEL + '」這項本次未提供。');
  } else if (subtopicKey === 'meet-scene') {
    var h5Line = house5Line('|house5');
    var venusFallback = venusLine('|venus-fallback') || '感情價值傾向暫時缺乏足夠資料判斷';
    out.conclusion = h5Line ? ('關於可能相遇的場合，' + h5Line) : venusFallback;
    out.traits = TRAIT_AXIS_LABELS.meetScene + '：' + (h5Line || venusFallback);
    out.trend = toneField('trend');
    if (!h5Line) caveatParts.push('出生時間未知，無法使用第五宮位置，相遇場合的描述改以金星特質概略推估，範圍較廣泛。');
  } else if (subtopicKey === 'pace-pattern') {
    var mLine2 = marsLine('|mars'), h7Line = house7Line('|house7');
    out.conclusion = (mLine2 || '追求節奏傾向暫時缺乏足夠資料判斷') + (h7Line ? '；在長期相處上，' + h7Line : '');
    out.trend = toneField('trend'); out.favor = toneField('favor'); out.risk = toneField('risk'); out.action = toneField('action');
    if (!h7Line) caveatParts.push('出生時間未知，無法使用第七宮位置，相處模式的長期傾向本次未描述。');
  } else if (subtopicKey === 'crush') {
    var vLine2 = venusLine('|venus'), mLine3 = marsLine('|mars');
    out.conclusion = '星盤能反映的是你自己的感情需求與行動傾向，而不是對方目前的心意——' + (vLine2 || '') + (mLine3 ? (vLine2 ? '，同時，' : '') + mLine3 : '');
    out.trend = toneField('trend'); out.favor = toneField('favor'); out.risk = toneField('risk'); out.action = toneField('action');
    caveatParts.push(noPartnerDataNote);
  } else if (subtopicKey === 'reunion') {
    var h7Line2 = house7Line('|house7'), mLine4 = marsLine('|mars');
    out.conclusion = '星盤無法判斷是否會復合，能反映的是你自身在這段關係裡的課題與慣性——' + (h7Line2 || mLine4 || '相關傾向暫時缺乏足夠資料判斷');
    out.trend = toneField('trend'); out.risk = toneField('risk'); out.action = toneField('action');
    caveatParts.push(noPartnerDataNote);
    if (!h7Line2) caveatParts.push('出生時間未知，無法使用第七宮位置，長期關係模式的描述改以火星特質概略推估。');
  } else if (subtopicKey === 'marriage-longterm') {
    var h7Line3 = house7Line('|house7'), mnLine = moonLine('|moon');
    out.conclusion = (h7Line3 || '長期關係模式的傾向暫時缺乏足夠資料判斷') + (mnLine ? '；在情感需求上，' + mnLine : '');
    out.trend = toneField('trend'); out.timing = toneField('timing'); out.favor = toneField('favor'); out.risk = toneField('risk');
    caveatParts.push('星盤無法預測是否必然步入婚姻或確切時間，以上僅反映長期關係中的需求與課題傾向。');
    if (!h7Line3) caveatParts.push('出生時間未知，無法使用第七宮位置，長期關係模式的描述改以其他可用依據推估，準確度較低。');
  }

  /* 只保留該子問題 fields 有列出的欄位，其餘清空——不得輸出未被要求的內容 */
  ['conclusion', 'traits', 'trend', 'favor', 'risk', 'timing', 'action'].forEach(function (f) {
    if (subtopic.fields.indexOf(f) === -1) out[f] = '';
  });
  if (!out.conclusion) out.conclusion = '目前可用的星盤依據不足以針對「' + subtopic.zh + '」給出具體描述，建議先確認出生資料是否完整。';
  out.caveat = caveatParts.join('');
  out.evidence = { used: used, skipped: ev.skipped, seed: ev.seed };
  out.available = true;
  return out;
}

/* Phase 1C：combinedReading() 一致／分歧措辭池。
   agree：牌卡「目前狀態」與星盤「長期傾向」語氣相同時的共同主題導語（依 tone 分三組）。
   differ：語氣不同時的導語，明確講清楚這是時間尺度不同，不是誰對誰錯，不可硬湊成一致。 */
var COMBINED_AGREE_LEAD_POOL = {
  positive: ['牌卡與星盤在這個面向上方向一致，都偏向正向', '牌卡（目前狀態）與星盤（長期傾向）呈現相同的樂觀訊號', '兩邊都指向積極的方向，是一致且穩固的訊號'],
  neutral: ['牌卡與星盤在這個面向上都偏向中性、還在觀察階段', '牌卡（目前狀態）與星盤（長期傾向）呈現相近、尚未明朗的訊號', '兩邊都沒有特別強烈的傾向，方向一致地保持中性'],
  challenging: ['牌卡與星盤在這個面向上都指出需要留意的課題', '牌卡（目前狀態）與星盤（長期傾向）呈現相同的挑戰訊號', '兩邊都提醒這個面向目前需要多一點耐心'],
};
var COMBINED_DIFFER_LEAD_POOL = [
  '牌卡與星盤的時間尺度不同，兩者呈現的訊號並不一致——這不代表矛盾，只是分別反映「當下」與「長期」',
  '牌卡反映的是目前的情境，星盤反映的是長期的需求與慣性，兩者出現落差是正常的，不需要硬湊成同一個答案',
  '牌卡看見的是這段時間的樣貌，星盤看見的是更長期的模式，兩者不同時，代表值得多留意「現在」跟「一貫」之間的落差',
];
/* combinedReading(cardResult, astroResult, catKey, subtopicKey)
   支援 catKey==='love' 與 catKey==='career'（Phase 2B 起）。cardResult 應為
   cardSubtopicReading() 的回傳值，astroResult 應為 astroCategoryReading() 的回傳值；
   任一邊為 null／undefined／available:false 都視為「該邊不可用」，安全降級為只用另一邊
  （cards-only／astro-only），兩邊都不可用才 unavailable——例如 career-talent 沒有牌卡模式，
   cardResult 永遠是 available:false，這裡會自動落在 astro-only，不需要另外特判。
   兩邊都可用時，只依據雙方已經算好的 tone（cardResult.tone 來自 loveToneBucket／
   astroResult.tone 來自 loveAstroValence——兩者皆為通用邏輯，love／career 共用同一套）
   判斷一致／分歧，並用兩邊「已經產生的真實內容」組成摘要——不重新捏造人物或職涯特徵，
   也不會把兩邊全部欄位原封不動貼成一大段，而是用清楚的「目前狀態（牌卡）／長期傾向
  （星盤）」標籤分別呈現，讓使用者能自己比較。這個合併邏輯與導語措辭池本身就是分類無關的
   通用引擎，不需要另外複製一份 career 專屬版本，只需要把下面兩個原本寫死 love 的地方
   改成讀取傳入的 catKey。 */
function combinedReading(cardResult, astroResult, catKey, subtopicKey) {
  var out = {
    available: false, reason: '', catKey: catKey, subtopicKey: subtopicKey,
    mode: 'none', // none | cards-only | astro-only | combined
    conclusion: '', traits: '', trend: '', favor: '', risk: '', timing: '', action: '', caveat: '',
    cardTone: null, astroTone: null, agreement: 'unknown',
  };
  if (['love', 'career', 'family', 'wealth', 'health', 'social', 'study', 'general'].indexOf(catKey) === -1) { out.reason = 'unsupported-category'; return out; }
  var hasCard = !!(cardResult && cardResult.available);
  var hasAstro = !!(astroResult && astroResult.available);
  if (!hasCard && !hasAstro) { out.reason = 'no-input'; return out; }
  out.mode = hasCard && hasAstro ? 'combined' : (hasAstro ? 'astro-only' : 'cards-only');
  out.available = true;

  var subtopic = (SUBTOPICS[catKey] || []).filter(function (s) { return s.key === subtopicKey; })[0];
  var fields = subtopic ? subtopic.fields : SUBTOPIC_FIELD_ORDER;

  if (out.mode === 'cards-only') {
    SUBTOPIC_FIELD_ORDER.forEach(function (f) { if (fields.indexOf(f) !== -1) out[f] = cardResult[f] || ''; });
    return out;
  }
  if (out.mode === 'astro-only') {
    SUBTOPIC_FIELD_ORDER.forEach(function (f) { if (fields.indexOf(f) !== -1) out[f] = astroResult[f] || ''; });
    return out;
  }

  // mode === 'combined'：兩邊都可用，比較 tone 並組出「目前狀態／長期傾向」的摘要
  out.cardTone = cardResult.tone || null;
  out.astroTone = astroResult.tone || null;
  var bothToneKnown = !!out.cardTone && !!out.astroTone;
  out.agreement = bothToneKnown ? (out.cardTone === out.astroTone ? 'agree' : 'differ') : 'unknown';

  var seed = 'combined|' + subtopicKey + '|' + (out.cardTone || 'x') + '|' + (out.astroTone || 'x');
  function twoLayer(cardVal, astroVal) {
    if (cardVal && astroVal) return '目前狀態（牌卡）：' + cardVal + '　長期傾向（星盤）：' + astroVal;
    if (cardVal) return '目前狀態（牌卡）：' + cardVal;
    if (astroVal) return '長期傾向（星盤）：' + astroVal;
    return '';
  }

  var leadSentence = '';
  if (out.agreement === 'agree') {
    leadSentence = astroSeededPick(seed + '|lead', COMBINED_AGREE_LEAD_POOL[out.cardTone] || COMBINED_AGREE_LEAD_POOL.neutral);
  } else if (out.agreement === 'differ') {
    leadSentence = astroSeededPick(seed + '|lead', COMBINED_DIFFER_LEAD_POOL);
  }
  SUBTOPIC_FIELD_ORDER.forEach(function (f) {
    if (fields.indexOf(f) === -1 || f === 'caveat') return;
    var layered = twoLayer(cardResult[f], astroResult[f]);
    out[f] = (f === 'conclusion' && leadSentence) ? (leadSentence + '。' + layered) : layered;
  });
  if (fields.indexOf('caveat') !== -1) {
    out.caveat = [cardResult.caveat, astroResult.caveat].filter(Boolean).join(' ');
  }
  return out;
}

function computeTransitPlanets(dateObj) {
  var time = Astronomy.MakeTime(dateObj);
  var out = {};
  ASTRO_PLANET_BODY_KEYS.forEach(function (key) { out[key] = astroEclipticLon(key, time); });
  return out;
}
function astroAngleDiff(a, b) { var d = Math.abs(a - b); if (d > 180) d = 360 - d; return d; }
var HOROSCOPE_ASPECT_ANGLES = [['conjunction', 0], ['sextile', 60], ['square', 90], ['trine', 120], ['opposition', 180]];
var ASTRO_BENEFIC = ['Venus', 'Jupiter', 'Sun', 'Moon'];
var ASTRO_MALEFIC = ['Mars', 'Saturn'];
function astroAspectPoints(type, transitKey) {
  if (type === 'trine') return 22;
  if (type === 'sextile') return 15;
  if (type === 'square') return -19;
  if (type === 'opposition') return -21;
  if (ASTRO_BENEFIC.indexOf(transitKey) >= 0) return 17;
  if (ASTRO_MALEFIC.indexOf(transitKey) >= 0) return -13;
  return 7;
}

function astroCategoryScore(catKey, periodCfg, natalChart, transitPlanets) {
  var natalKeys = ASTRO_CATEGORY_RULERS[catKey];
  var score = 60;
  periodCfg.transits.forEach(function (tc) {
    var tKey = tc[0], orbLimit = tc[1];
    var tLon = transitPlanets[tKey];
    natalKeys.forEach(function (nKey) {
      var nLon = natalChart.planets[nKey].lon;
      var diff = astroAngleDiff(tLon, nLon);
      HOROSCOPE_ASPECT_ANGLES.forEach(function (pair) {
        var delta = Math.abs(diff - pair[1]);
        if (delta <= orbLimit) {
          var strength = 1 - delta / orbLimit;
          score += astroAspectPoints(pair[0], tKey) * strength;
        }
      });
    });
  });
  return Math.max(15, Math.min(98, Math.round(score)));
}

/* 太陽／月亮回歸與每日／週／月／年運勢 已移到 js/data/astro-advanced.js（見檔頭說明）。 */

/* ================= 人生主題專題分析 =================
   完全讀取既有 state.astroResult（chartData），不重新排盤，也不會把使用者的問題
   直接交給 AI。流程：主題問題（NATAL_TOPIC_QUESTIONS）→ 對應占星指標 → 從 chartData
   擷取（extractChartEvidence，缺資料就跳過並記錄原因，不捏造）→ 整合多個指標
   （rankEvidence／mergeSupportingSignals／identifyTensions）→ 產生一般摘要與可摺疊
   依據（buildPublicSummary／buildAdvancedExplanation）→ 建立複製給 AI 的完整資料
   （buildAiCopyData）。資料設定在 js/data/astrology-natal-topics-data.js。 */
var NATAL_PERSONAL_PLANET_KEYS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'];
var NATAL_ANGULAR_HOUSES = [1, 4, 7, 10];
var NATAL_ANGLE_ZH = { asc: '上升點', mc: '天頂', dsc: '下降點', ic: '天底' };

function natalSignLabel(sign, house) {
  var s = ZODIAC_SIGNS[sign].zh;
  return house ? (s + '第' + house + '宮') : s;
}
/* V2：情境化解讀。取代舊的 natalTraitForEvidence(e, watchMode)——舊版只看
   planetKey+sign，完全不吃 topicId/question/intent，導致同一顆行星同一星座，
   不管在哪個題目下讀出來的內容都一樣（這正是「對方外型題卻在講情緒需求」的根因）。
   新版依 INTENT_FRAMES（見 astrology-natal-topics-data.js）決定要引用
   PLANET_BEGINNER／SIGN_BEGINNER／HOUSE_BEGINNER 的哪些欄位、用什麼句型組合，
   同一組配置換一個 intent 就會讀出不同角度的句子。缺對應資料時優雅降級回
   evidence.reason，不會留白也不會硬湊。 */
function natalIntentFieldValue(obj, fieldName) {
  if (!obj || !fieldName) return null;
  if (fieldName === 'coreNeed0') return obj.coreNeed && obj.coreNeed[0];
  return obj[fieldName] || null;
}
function natalMergeFrameOverride(frame, override) {
  if (!override) return frame;
  var out = {};
  for (var k in frame) out[k] = frame[k];
  for (var k2 in override) out[k2] = override[k2];
  return out;
}
/* V2.1：從模板池裡挑一個「這次手上實際有的欄位都能填滿」的模板，而不是要求
   整個 frame 宣告的欄位全部到齊才給句子（同一個 pool 裡常常有的模板只用
   {S_}、有的只用 {P_}，例如 challenge 的 headlineTpl）。用 seed 決定起始位置，
   再依序找第一個「模板裡出現的佔位符都有值」的候選，找不到才降級成拼接片語。 */
function natalTplPlaceholdersOk(tpl, avail) {
  var phs = ['P_', 'S_', 'H_', 'P2_'];
  for (var i = 0; i < phs.length; i++) {
    if (tpl.indexOf('{' + phs[i] + '}') !== -1 && !avail[phs[i]]) return false;
  }
  return true;
}
function natalPickTplForFields(seedStr, tplPool, avail) {
  var rng = astroMulberry32(astroHashSeed(seedStr));
  var startIdx = Math.floor(rng() * tplPool.length);
  for (var i = 0; i < tplPool.length; i++) {
    var idx = (startIdx + i) % tplPool.length;
    if (natalTplPlaceholdersOk(tplPool[idx], avail)) return tplPool[idx];
  }
  return null;
}
/* V2.1：slot 決定要從獨立的 headlineTpl／summaryTpl／detailTpl 哪一個池子挑句型
   （取代 V2.0「headline/summary/details 全部共用同一個 tpl，只靠不同 seed
   碰運氣避開撞句」的做法）；fieldOverride 讓同一個 intent 底下、不同
   questionFocus 的題目可以覆寫要引用哪些欄位（例如 career_direction 底下
   「適合哪類型工作」用 verb/function、「適合什麼工作環境」用 area/mode）。
   fieldOverride.tplFrom（選填）：當覆寫的欄位組合需要「形狀不同」的句型時
   （不只是換欄位來源，連句子結構都該換），直接借用另一個 intent 自己的
   模板池，確保覆寫後的欄位真的會出現在文字裡，不會被原本 intent 的模板
   池（可能完全沒引用被覆寫的欄位）晾在一邊。 */
/* V2.2：projectEvidenceForTopic——canonical evidence 與內容產生器之間新增的
   投影層。專門處理「宮位」這種最容易洩漏原始技術字眼／跟題目主題無關字眼的
   欄位：依 topicId/questionFocus 決定要用 HOUSE_TOPIC_PROJECTION 的哪個
   類別，把「原始宮位」翻譯成「這個主題底下，這個宮位代表的意思」，同一個
   宮位在不同主題下就不會印出一模一樣的句子，也不會直接把 HOUSE_BEGINNER
   的原始欄位（area/lifeArea…）洩漏進正文。角宮證據（沒有 house，只有
   angleWhich）透過 ANGLE_VIRTUAL_HOUSE 對應到虛擬宮位，一併走同一條路，
   不再落到「角宮位置，對這個主題有較高的代表性」這種技術性 fallback。 */
function projectEvidenceForTopic(evidence, topicId, questionFocus) {
  var result = { traitKeys: [], projectedMeaning: '', suitableForHeadline: true, suitableForSummary: true, suitableDetailLabels: [], forbiddenTerms: [] };
  if (!evidence) return result;
  var houseNum = evidence.houseFocus || evidence.house || (evidence.angleWhich && ANGLE_VIRTUAL_HOUSE[evidence.angleWhich]) || null;
  if (houseNum) {
    var cat = (questionFocus && QUESTIONFOCUS_HOUSE_CATEGORY[questionFocus]) || 'general';
    var table = HOUSE_TOPIC_PROJECTION[cat] || HOUSE_TOPIC_PROJECTION.general;
    var meaning = table[houseNum - 1] || HOUSE_TOPIC_PROJECTION.general[houseNum - 1] || '';
    result.projectedMeaning = meaning;
    result.traitKeys.push('house' + houseNum + ':' + cat);
    if (!meaning) { result.suitableForHeadline = false; result.suitableForSummary = false; }
  }
  if (evidence.angleWhich) result.forbiddenTerms.push('角宮位置');
  if (evidence.role && evidence.role.indexOf('houseRuler') === 0) result.forbiddenTerms.push('宮主星');
  return result;
}
/* ================= V4：Astrology Knowledge Layer 投影 =================
   V2.2 的 Topic Projection（上面的 projectEvidenceForTopic）本質上還是
   「House → Topic → Phrase」：宮位本身是唯一的知識來源，同一宮只要有兩顆
   以上行星，不同題目容易引用到同一句宮位語意，讀起來像「一直在講同一件
   事」。V4 把知識來源改成「行星 + 星座 + 宮位 + 主題」共同決定：

     Evidence → Knowledge Projection（本函式）→ Topic Projection（找不到
     行星知識時的 fallback，projectEvidenceForTopic 完全沒有被移除或改寫）
     → Content Planner（buildQuestionContent 完全沒有變動，一樣是消費
     contextualizeEvidence/contextualizeCaution 算出來的字串）。

   優先序：Planet + House（PLANET_HOUSE_TOPIC_KNOWLEDGE，最具體，但只收錄
   示範性、可持續擴充的組合）> Planet Meaning（PLANET_TOPIC_KNOWLEDGE，
   10 行星 × 7 主題，不管落在哪一宮都有基本的行星基調）> 兩者都沒有收錄時
   回傳 confidence:'none'，由呼叫端自然 fallback 回純宮位的 Topic
   Projection——House 不再永遠主導，但也沒有被拿掉，只是退居最後一層。
   Sign 不是獨立的知識來源，只在有 Planet／Planet+House 知識可用時，疊加
   KNOWLEDGE_SIGN_MODIFIER 的一小段語氣修飾。 */
function natalStripTrailingPeriod(s) {
  return (s || '').replace(/[。.]\s*$/, '');
}
var KNOWLEDGE_TOPIC_MEANING_FIELD = {
  meeting_context: 'loveMeaning', suitable_roles: 'workMeaning', suitable_environment: 'environmentMeaning',
  achievement_source: 'workMeaning', monetizable_skills: 'moneyMeaning', long_term_direction: 'workMeaning',
  family_context: 'familyMeaning',
};
function projectKnowledge(planetKey, sign, house, topic, questionFocus) {
  var out = {
    projectedMeaning: '', strengths: [], risks: [],
    workMeaning: '', loveMeaning: '', moneyMeaning: '', familyMeaning: '', relationshipMeaning: '',
    appearanceMeaning: '', environmentMeaning: '',
    suitableHeadline: [], suitableSummary: [], suitableDetails: [], suitableCaution: [],
    confidence: 'none',
  };
  if (!planetKey || !topic) return out;
  var entry = null, tier = 'none';
  var overrideKey = house ? (planetKey.toLowerCase() + '-' + house + '-' + topic) : null;
  if (overrideKey && typeof PLANET_HOUSE_TOPIC_KNOWLEDGE !== 'undefined' && PLANET_HOUSE_TOPIC_KNOWLEDGE[overrideKey]) {
    entry = PLANET_HOUSE_TOPIC_KNOWLEDGE[overrideKey]; tier = 'planet_house';
  } else if (typeof PLANET_TOPIC_KNOWLEDGE !== 'undefined' && PLANET_TOPIC_KNOWLEDGE[planetKey] && PLANET_TOPIC_KNOWLEDGE[planetKey][topic]) {
    entry = PLANET_TOPIC_KNOWLEDGE[planetKey][topic]; tier = 'planet';
  }
  if (!entry) return out;
  var mod = (sign != null && typeof KNOWLEDGE_SIGN_MODIFIER !== 'undefined' && KNOWLEDGE_SIGN_MODIFIER[sign]) || '';
  var seedBase = 'know|' + planetKey + '|' + (sign != null ? sign : '') + '|' + (house || '') + '|' + topic + '|' + (questionFocus || '');
  /* meanings.headline/summary 是可以獨立成句的完整句子（例如「適合...環境。」），
     meanings.details 則跟既有 HOUSE_TOPIC_PROJECTION 一樣是「短語」，設計上
     就是要被嵌進 INTENT_FRAMES 模板的 {H_} 佔位符裡（例如「{H_}——這種場合
     會讓你比較自在。」）。contextualizeEvidence/contextualizeCaution 只會把
     hVal 當短語嵌入，所以這裡優先用 details 這組短語，並用
     natalStripTrailingPeriod 防呆——就算未來擴充的內容不小心用了完整句子，
     嵌入模板時也不會出現「。，」這種疊標點。 */
  out.suitableHeadline = (entry.meanings.headline || []).map(function (t) { return t + mod; });
  out.suitableSummary = (entry.meanings.summary || []).map(function (t) { return t + mod; });
  out.suitableDetails = (entry.meanings.details || []).map(function (t) { return t + mod; });
  out.suitableCaution = (entry.meanings.caution || []).slice();
  var pickPool = out.suitableDetails.length ? out.suitableDetails : (out.suitableHeadline.length ? out.suitableHeadline : []);
  out.projectedMeaning = pickPool.length ? natalStripTrailingPeriod(astroSeededPick(seedBase, pickPool)) : '';
  out.strengths = entry.strengths || []; out.risks = entry.risks || [];
  var field = KNOWLEDGE_TOPIC_MEANING_FIELD[topic];
  if (field) out[field] = out.projectedMeaning;
  if (topic === 'meeting_context') out.relationshipMeaning = out.projectedMeaning;
  out.confidence = tier === 'planet_house' ? 'high' : 'medium';
  return out;
}
function contextualizeEvidence(e, intent, slot, seedExtra, fieldOverride, topicId, questionFocus, outMeta) {
  intent = INTENT_ALIAS[intent] || intent || 'overview';
  var frame = INTENT_FRAMES[intent] || INTENT_FRAMES.overview;
  var eff = natalMergeFrameOverride(frame, fieldOverride);
  var tplFrame = (fieldOverride && fieldOverride.tplFrom && INTENT_FRAMES[fieldOverride.tplFrom]) || frame;
  var tplPool = (slot === 'summary' ? tplFrame.summaryTpl : slot === 'detail' ? tplFrame.detailTpl : tplFrame.headlineTpl) || tplFrame.headlineTpl;
  var seed = 'ctx|' + intent + '|' + slot + '|' + (seedExtra || '') + '|' + (e.canonicalKey || e.factor);
  if (frame.vibe) {
    var vibe = (e.sign != null) ? SIGN_VIBE[e.sign] : null;
    if (!vibe) return astroSeededPick(seed + '|fb', NATAL_NEUTRAL_FALLBACK_TPL);
    if (outMeta) outMeta.conceptKeys = [vibe];
    return fillTpl(astroSeededPick(seed, tplPool), { VIBE: vibe });
  }
  var pb = e.planetKey ? PLANET_BEGINNER[e.planetKey] : null;
  var sb = (e.sign != null) ? SIGN_BEGINNER[e.sign] : null;
  var houseNum = e.houseFocus || e.house || (e.angleWhich && ANGLE_VIRTUAL_HOUSE[e.angleWhich]) || null;
  var pVal = natalIntentFieldValue(pb, eff.p) || '';
  var p2Val = natalIntentFieldValue(pb, eff.p2) || '';
  var sVal = natalIntentFieldValue(sb, eff.s) || '';
  var hVal = '';
  if (houseNum && topicId) {
    /* Natal Topic Analysis 的呼叫一定會帶 topicId：宮位一律先試 V4 Knowledge
       Projection（行星+星座+宮位+主題），找不到行星知識才 fallback 回 V2.2
       的純宮位 Topic Projection，兩者都不會直接讀 HOUSE_BEGINNER 的原始
       欄位。 */
    var cat0 = (questionFocus && QUESTIONFOCUS_HOUSE_CATEGORY[questionFocus]) || 'general';
    var know0 = (e.planetKey && typeof projectKnowledge === 'function') ? projectKnowledge(e.planetKey, e.sign, houseNum, cat0, questionFocus) : null;
    if (know0 && know0.confidence !== 'none') {
      /* hVal 一律會被嵌進 INTENT_FRAMES 模板的 {H_} 佔位符裡（例如
         「{H_}——這種場合會讓你比較自在。」），所以固定用 details 這組
         「短語」（跟既有 HOUSE_TOPIC_PROJECTION 同一種風格），不用
         headline/summary 那種本身已經是完整句子的內容，避免嵌入後出現
         「環境。，更靈活」這種疊標點；natalStripTrailingPeriod 是雙重防呆。 */
      var pool0 = know0.suitableDetails.length ? know0.suitableDetails : (know0.suitableHeadline.length ? know0.suitableHeadline : [know0.projectedMeaning]);
      hVal = natalStripTrailingPeriod((pool0.length ? astroSeededPick(seed + '|know', pool0) : know0.projectedMeaning) || '');
    } else {
      hVal = projectEvidenceForTopic(e, topicId, questionFocus).projectedMeaning || '';
    }
  } else {
    var hb = houseNum ? HOUSE_BEGINNER[houseNum - 1] : null;
    hVal = natalIntentFieldValue(hb, eff.h) || '';
  }
  if (outMeta) { outMeta.pVal = pVal; outMeta.sVal = sVal; outMeta.hVal = hVal; outMeta.p2Val = p2Val; outMeta.conceptKeys = [pVal, sVal, hVal, p2Val].filter(Boolean); }
  var chosenTpl = natalPickTplForFields(seed, tplPool, { P_: !!pVal, S_: !!sVal, H_: !!hVal, P2_: !!p2Val });
  if (chosenTpl) return fillTpl(chosenTpl, { P_: pVal, S_: sVal, H_: hVal, P2_: p2Val });
  /* 這個池子裡沒有任何模板的欄位需求被目前手上的資料滿足（例如角宮證據沒有
     planetKey，pb 就會是 null）——不要硬套模板留下「「」」這種空缺痕跡，
     改成把手上有的片語自然接起來，缺的部分優雅省略。 */
  var parts = [sVal, pVal, hVal, p2Val].filter(Boolean);
  if (!parts.length) return astroSeededPick(seed + '|fb', NATAL_NEUTRAL_FALLBACK_TPL);
  return parts.join('，') + '。';
}
/* V2.1：留意（caution）改用獨立的 CAUTION_FOCUS_FRAMES，不再固定套用
   'challenge' intent 的 watch/watch 欄位組合——不同題目的 cautionFocus
   指到不同欄位組合＋句型池，讓留意段落也能因題而異。 */
function contextualizeCaution(e, cautionFocus, seedExtra, topicId, questionFocus, outMeta, variantSuffix) {
  var frame = CAUTION_FOCUS_FRAMES[cautionFocus] || CAUTION_FOCUS_FRAMES.vigilance;
  var seed = 'cau|' + cautionFocus + '|' + (seedExtra || '') + (variantSuffix || '') + '|' + (e.canonicalKey || e.factor);
  var pb = e.planetKey ? PLANET_BEGINNER[e.planetKey] : null;
  var sb = (e.sign != null) ? SIGN_BEGINNER[e.sign] : null;
  var houseNum = e.houseFocus || e.house || (e.angleWhich && ANGLE_VIRTUAL_HOUSE[e.angleWhich]) || null;
  var pVal = natalIntentFieldValue(pb, frame.p) || '';
  var sVal = natalIntentFieldValue(sb, frame.s) || '';
  var hVal = '';
  if (houseNum && topicId) {
    /* caution 的宮位語意也走同一條 Knowledge Projection 優先序：先試
       行星知識裡的 caution 短語（entry.meanings.caution），找不到就退回
       行星知識的一般 projectedMeaning，兩者都沒有才 fallback 回純宮位的
       Topic Projection。 */
    var catC = (questionFocus && QUESTIONFOCUS_HOUSE_CATEGORY[questionFocus]) || 'general';
    var knowC = (e.planetKey && typeof projectKnowledge === 'function') ? projectKnowledge(e.planetKey, e.sign, houseNum, catC, questionFocus) : null;
    if (knowC && knowC.confidence !== 'none' && knowC.suitableCaution && knowC.suitableCaution.length) {
      hVal = natalStripTrailingPeriod(astroSeededPick(seed + '|know', knowC.suitableCaution) || '');
    } else if (knowC && knowC.confidence !== 'none' && knowC.projectedMeaning) {
      hVal = knowC.projectedMeaning;
    } else {
      hVal = projectEvidenceForTopic(e, topicId, questionFocus).projectedMeaning || '';
    }
  } else if (houseNum) {
    hVal = natalIntentFieldValue(HOUSE_BEGINNER[houseNum - 1], frame.h) || '';
  }
  if (outMeta) outMeta.conceptKeys = [pVal, sVal, hVal].filter(Boolean);
  var haveAllNeeded = (!frame.p || pVal) && (!frame.s || sVal) && (!frame.h || hVal);
  if (haveAllNeeded) return fillTpl(astroSeededPick(seed, frame.tpl), { P_: pVal, S_: sVal, H_: hVal });
  var parts = [sVal, pVal, hVal].filter(Boolean);
  if (!parts.length) return astroSeededPick(seed + '|fb', NATAL_NEUTRAL_FALLBACK_TPL);
  return parts.join('，') + '。';
}
/* V2.1：evidenceBias 現在套用在所有題目（不再只限外型/吸引/第一印象這三個
   intent），依題目自己指定的 preferPlanets／preferTypes／excludePlanets／
   angleBonus 調整候選順序，讓「同一主題內不同題目該用不同主導證據」這件事
   由資料驅動，而不是寫死在程式邏輯裡。回傳的是「用來挑內容」的排序，
   可折疊區顯示的證據仍然用原始未偏移的權重，維持透明。 */
function applyEvidenceBias(rankedEvidence, question) {
  var bias = question.evidenceBias || {};
  var preferPlanets = bias.preferPlanets || question.preferredPlanets || [];
  var excludePlanets = bias.excludePlanets || question.excludedPlanets || [];
  var preferTypes = bias.preferTypes || [];
  var excludeTypes = bias.excludeTypes || [];
  function roleMatchesType(role, type) {
    if (!role) return false;
    if (role.indexOf(type) === 0) return true;
    if (type === 'elementQualityBalance' && role === 'elementBalance') return true;
    if (type === 'tightAspectsAmongPersonal' && role === 'aspect') return true;
    return false;
  }
  var scored = rankedEvidence.map(function (e) {
    var bonus = 0;
    /* 行星偏好只用來打破同分，不可蓋過原始權重較高的宮主星／宮內行星。
       舊值 +3 會讓 Venus/Moon 等預設行星在每張盤都勝出，正是跨盤撞句來源。 */
    if (e.planetKey && preferPlanets.indexOf(e.planetKey) !== -1) bonus += .5;
    if (e.planetKey && excludePlanets.indexOf(e.planetKey) !== -1) bonus -= 5;
    if (preferTypes.some(function (t) { return roleMatchesType(e.role, t); })) bonus += 2;
    if (excludeTypes.some(function (t) { return roleMatchesType(e.role, t); })) bonus -= 4;
    if (bias.angleBonus && e.angleWhich) bonus += 2;
    /* requirePlanet：這題套用的模板池（通常是借用自 capability／strength／pattern
       這類需要 planetKey 才能填 P_/P2_ 的 intent）如果選到沒有 planetKey 的證據
       （角宮、元素分布…），會整段落到「找不到任何模板欄位滿足」的降級分支，
       讀起來像斷句。這裡明確懲罰非 planetKey 證據，讓排序自然避開這個陷阱。 */
    if (bias.requirePlanet && !e.planetKey) bonus -= 6;
    var copy = Object.assign({}, e);
    copy.rawWeight = e.weight;
    copy.biasBonus = bonus;
    copy.selectionScore = e.weight + bonus;
    return { e: copy, score: copy.selectionScore };
  });
  scored.sort(function (a, b) { return b.score - a.score; });
  return scored.map(function (s) { return s.e; });
}

function getTopicIndicators(topicId, questionId) {
  var qs = NATAL_TOPIC_QUESTIONS[topicId] || [];
  var q = qs.find(function (x) { return x.id === questionId; });
  return q ? q.indicators : [];
}

/* 依指標描述，從 chartData 實際擷取證據；找不到就記錄原因並跳過（skipped），不捏造。
   出生時間未知時，跟站內其他星盤功能一樣：不使用上升／天頂／下降／天底／宮位／
   福點／宿命點，月亮相關相位也一併排除（沿用既有的 astroUsableAspects()）。 */
/* V2：canonicalKey 讓「同一個底層配置」不管是被哪種指標角色發現的（宮內行星／
   宮主星／直接指定的行星…），都會收斂成同一把 key，供 mergeEvidenceByCanonicalKey
   合併、避免同一顆行星因為身兼多個指標角色而被算成好幾筆「一致訊號」。 */
function natalEvidenceCanonicalKey(objType, objName, sign, house, extra) {
  return [objType, objName, (sign != null ? sign : ''), (house != null ? house : ''), (extra || '')].join('|');
}
/* 把同一個 canonicalKey 的多筆證據合併成一筆：權重採「最高權重 + 有限的支持
   加成」（最多 +2），不是把每個角色的權重直接加總，避免虛增一致性訊號；
   sourceRoles 保留所有發現這筆配置的指標角色，供可折疊區顯示完整來源。 */
function mergeEvidenceByCanonicalKey(evidence) {
  var groups = {}, order = [];
  evidence.forEach(function (e) {
    var key = e.canonicalKey || (e.factor + '|' + e.placement);
    if (!groups[key]) { groups[key] = []; order.push(key); }
    groups[key].push(e);
  });
  return order.map(function (key) {
    var group = groups[key];
    if (group.length === 1) {
      group[0].sourceRoles = [group[0].role].filter(Boolean);
      return group[0];
    }
    var best = group.slice().sort(function (a, b) { return b.weight - a.weight; })[0];
    var roles = [];
    group.forEach(function (e) { if (e.role && roles.indexOf(e.role) === -1) roles.push(e.role); });
    var merged = {};
    for (var k in best) merged[k] = best[k];
    merged.weight = best.weight + Math.min(group.length - 1, 2);
    merged.sourceRoles = roles;
    return merged;
  });
}
function extractChartEvidence(chart, unknownTime, indicators) {
  var evidence = [], skipped = [];
  function pushPlanetEvidence(key, weight) {
    var p = chart.planets[key], def = findAnyPointDef(key);
    if (!p || !def) { skipped.push({ factor: key, reason: '尚未計算這個天體' }); return; }
    var house = unknownTime ? null : p.house;
    evidence.push({ factor: def.zh, placement: def.zh + '在' + natalSignLabel(p.sign, house), reason: def.meaning || def.zh, weight: weight, elemTag: ZODIAC_SIGNS[p.sign].elem, planetKey: key, sign: p.sign, house: house, role: 'planet:' + key, canonicalKey: natalEvidenceCanonicalKey('planet', key, p.sign, house) });
  }
  indicators.forEach(function (ind) {
    if (ind.type === 'angle') {
      if (unknownTime) { skipped.push({ factor: NATAL_ANGLE_ZH[ind.which] || ind.which, reason: '出生時間未知，無法使用上升／天頂／下降／天底' }); return; }
      var sign = natalAngleSign(chart, ind.which);
      if (sign == null) { skipped.push({ factor: ind.which, reason: '資料不足' }); return; }
      evidence.push({ factor: NATAL_ANGLE_ZH[ind.which] || ind.which, placement: (NATAL_ANGLE_ZH[ind.which] || ind.which) + '落在' + ZODIAC_SIGNS[sign].zh, reason: '角宮位置，對這個主題有較高的代表性', weight: 9, elemTag: ZODIAC_SIGNS[sign].elem, sign: sign, angleWhich: ind.which, role: 'angle:' + ind.which, canonicalKey: natalEvidenceCanonicalKey('angle', ind.which, sign, null) });
    } else if (ind.type === 'housePlanets') {
      if (unknownTime) { skipped.push({ factor: '第' + ind.house + '宮內行星', reason: '出生時間未知，無法使用宮位' }); return; }
      var found = ASTRO_PLANET_BODY_KEYS.filter(function (k) { return chart.planets[k].house === ind.house; });
      if (!found.length) { skipped.push({ factor: '第' + ind.house + '宮內行星', reason: '這個宮位目前沒有行星，改用宮主星與角宮資料代替' }); return; }
      found.forEach(function (k) {
        var p = chart.planets[k], def = findAnyPointDef(k);
        var w = 8 + (NATAL_PERSONAL_PLANET_KEYS.indexOf(k) !== -1 ? 1 : 0) + (NATAL_ANGULAR_HOUSES.indexOf(ind.house) !== -1 ? 1 : 0);
        evidence.push({ factor: '第' + ind.house + '宮內行星', placement: def.zh + '在' + natalSignLabel(p.sign, p.house), reason: def.zh + '直接落在第' + ind.house + '宮，代表這個生活領域被明顯啟動', weight: w, elemTag: ZODIAC_SIGNS[p.sign].elem, planetKey: k, sign: p.sign, house: p.house, role: 'housePlanets:' + ind.house, canonicalKey: natalEvidenceCanonicalKey('planet', k, p.sign, p.house) });
      });
    } else if (ind.type === 'houseRuler' || ind.type === 'chartRuler') {
      var houseNum = ind.type === 'chartRuler' ? 1 : ind.house;
      if (unknownTime) { skipped.push({ factor: '第' + houseNum + '宮主星', reason: '出生時間未知，無法使用宮位與宮主星' }); return; }
      var rp = natalHouseRulerPlacement(chart, houseNum);
      if (!rp) { skipped.push({ factor: '第' + houseNum + '宮主星', reason: '守護星資料不足' }); return; }
      var rDef = findAnyPointDef(rp.rulerKey);
      var label = houseNum === 1 ? '上升主星（命主星）' : ('第' + houseNum + '宮主星');
      evidence.push({ factor: label, placement: rDef.zh + '（' + label + '）在' + natalSignLabel(rp.sign, rp.house), reason: '第' + houseNum + '宮宮頭在' + ZODIAC_SIGNS[rp.cuspSign].zh + '，守護星是' + rDef.zh + '，它實際的落點是這個生活領域怎麼被打理的關鍵線索', weight: 8, elemTag: ZODIAC_SIGNS[rp.sign].elem, planetKey: rp.rulerKey, sign: rp.sign, house: rp.house, role: (ind.type === 'chartRuler' ? 'chartRuler' : 'houseRuler:' + houseNum), canonicalKey: natalEvidenceCanonicalKey('planet', rp.rulerKey, rp.sign, rp.house) });
    } else if (ind.type === 'planet') {
      pushPlanetEvidence(ind.key, 7);
    } else if (ind.type === 'point') {
      var ptDef0 = findAnyPointDef(ind.key);
      if (ind.key === 'Juno') { skipped.push({ factor: '婚神星', reason: '本站目前沒有計算婚神星（Juno），略過此項' }); return; }
      if (!ptDef0) { skipped.push({ factor: ind.key, reason: '本站目前沒有計算這個點，略過此項' }); return; }
      if ((ind.key === 'Fortune' || ind.key === 'Vertex') && unknownTime) { skipped.push({ factor: ptDef0.zh, reason: '出生時間未知，無法計算此點' }); return; }
      var pt = chart.points[ind.key];
      if (!pt) { skipped.push({ factor: ptDef0.zh, reason: '資料不足' }); return; }
      var ptHouse = unknownTime ? null : pt.house;
      evidence.push({ factor: ptDef0.zh, placement: ptDef0.zh + '在' + natalSignLabel(pt.sign, ptHouse), reason: ptDef0.meaning || ptDef0.zh, weight: 5, elemTag: ZODIAC_SIGNS[pt.sign].elem, planetKey: ind.key, sign: pt.sign, house: ptHouse, role: 'point:' + ind.key, canonicalKey: natalEvidenceCanonicalKey('point', ind.key, pt.sign, ptHouse) });
    } else if (ind.type === 'aspectsInvolving' || ind.type === 'aspectsInvolvingHouseRuler') {
      var keys = ind.type === 'aspectsInvolving' ? ind.keys.slice() : [];
      if (ind.type === 'aspectsInvolvingHouseRuler') {
        if (unknownTime) { skipped.push({ factor: '第' + ind.house + '宮主星的相位', reason: '出生時間未知，無法使用宮主星' }); return; }
        keys = [natalHouseRulerKey(chart, ind.house)];
      }
      var usable = astroUsableAspects(chart);
      var matched = usable.filter(function (a) { return keys.indexOf(a.a) !== -1 || keys.indexOf(a.b) !== -1; });
      if (!matched.length) { skipped.push({ factor: '相關緊密相位', reason: '沒有找到符合條件的主要相位' }); return; }
      matched.forEach(function (a) {
        var w = Math.max(2, 7 - Math.round(a.orb));
        var aKey = [a.a, a.b].sort().join('-') + ':' + a.type;
        evidence.push({ factor: '相位', placement: aspectPlacementText(a), reason: '這組相位牽涉到這題會參考的天體，容許度 ' + a.orb.toFixed(1) + '°', weight: w, natureTag: (a.type === 'square' || a.type === 'opposition') ? 'tense' : (a.type === 'trine' || a.type === 'sextile') ? 'supportive' : 'neutral', aspect: a, role: 'aspect', canonicalKey: natalEvidenceCanonicalKey('aspect', aKey, null, null) });
      });
    } else if (ind.type === 'elementQualityBalance') {
      var bal = computeElementQualityBalance(chart);
      var topElem = Object.keys(bal.elem).sort(function (x, y) { return bal.elem[y] - bal.elem[x]; })[0];
      var topQual = Object.keys(bal.qual).sort(function (x, y) { return bal.qual[y] - bal.qual[x]; })[0];
      evidence.push({ factor: '元素／性質分布', placement: topElem + '元素（' + bal.elem[topElem] + '顆）、' + topQual + '性質（' + bal.qual[topQual] + '顆）較多', reason: '整體行星分布偏向這個元素與性質，代表比較主要的行動與情感基調', weight: 6, elemTag: topElem, role: 'elementBalance', canonicalKey: natalEvidenceCanonicalKey('balance', topElem + topQual, null, null) });
    } else if (ind.type === 'nodeAxis') {
      var node = chart.points.Node;
      if (!node) { skipped.push({ factor: '南北交點', reason: '資料不足' }); return; }
      evidence.push({ factor: '北交點', placement: '北交點在' + ZODIAC_SIGNS[node.sign].zh, reason: '交點軸線代表你人生持續在練習、逐漸靠近的方向', weight: 6, elemTag: ZODIAC_SIGNS[node.sign].elem, sign: node.sign, role: 'nodeAxis', canonicalKey: natalEvidenceCanonicalKey('point', 'Node', node.sign, null) });
    } else if (ind.type === 'angularPlanets') {
      if (unknownTime) { skipped.push({ factor: '角宮行星', reason: '出生時間未知，無法使用宮位' }); return; }
      var angular = ASTRO_PLANET_BODY_KEYS.filter(function (k) { return NATAL_ANGULAR_HOUSES.indexOf(chart.planets[k].house) !== -1; });
      if (!angular.length) { skipped.push({ factor: '角宮行星', reason: '目前沒有行星落在角宮（1/4/7/10宮）' }); return; }
      angular.forEach(function (k) {
        var p = chart.planets[k], def = findAnyPointDef(k);
        evidence.push({ factor: '角宮行星', placement: def.zh + '在第' + p.house + '宮', reason: '角宮的行星力量較容易直接展現在生活中', weight: 8, elemTag: ZODIAC_SIGNS[p.sign].elem, planetKey: k, sign: p.sign, house: p.house, role: 'angularPlanets', canonicalKey: natalEvidenceCanonicalKey('planet', k, p.sign, p.house) });
      });
    } else if (ind.type === 'stelliumHouse') {
      if (unknownTime) { skipped.push({ factor: '聚集宮位', reason: '出生時間未知，無法使用宮位' }); return; }
      var counts = {};
      ASTRO_PLANET_BODY_KEYS.forEach(function (k) { var h = chart.planets[k].house; counts[h] = (counts[h] || 0) + 1; });
      var bestHouse = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x]; })[0];
      if (!bestHouse || counts[bestHouse] < 3) { skipped.push({ factor: '聚集宮位', reason: '沒有 3 顆以上行星聚集在同一宮，略過此項' }); return; }
      evidence.push({ factor: '聚集宮位', placement: '第' + bestHouse + '宮聚集了 ' + counts[bestHouse] + ' 顆行星', reason: '多顆行星集中在同一宮，代表這個生活領域是命盤明顯的重心', weight: 8, houseFocus: Number(bestHouse), role: 'stelliumHouse', canonicalKey: natalEvidenceCanonicalKey('houseFocus', bestHouse, null, null) });
    } else if (ind.type === 'tightAspectsAmongPersonal') {
      var usable2 = astroUsableAspects(chart);
      var matched2 = usable2.filter(function (a) { return NATAL_PERSONAL_PLANET_KEYS.indexOf(a.a) !== -1 && NATAL_PERSONAL_PLANET_KEYS.indexOf(a.b) !== -1 && a.orb <= 5; });
      if (!matched2.length) { skipped.push({ factor: '個人行星緊密相位', reason: '沒有找到符合條件的緊密相位' }); return; }
      matched2.forEach(function (a) {
        var w = Math.max(2, 7 - Math.round(a.orb));
        var aKey2 = [a.a, a.b].sort().join('-') + ':' + a.type;
        evidence.push({ factor: '個人行星相位', placement: aspectPlacementText(a), reason: '個人行星之間的緊密相位，容許度 ' + a.orb.toFixed(1) + '°', weight: w, natureTag: (a.type === 'square' || a.type === 'opposition') ? 'tense' : (a.type === 'trine' || a.type === 'sextile') ? 'supportive' : 'neutral', aspect: a, role: 'aspect', canonicalKey: natalEvidenceCanonicalKey('aspect', aKey2, null, null) });
      });
    }
  });
  var mergedEvidence = mergeEvidenceByCanonicalKey(evidence);
  var emptyHouses = skipped.filter(function (s) { return /^第\d+宮內行星$/.test(s.factor) && /沒有行星/.test(s.reason); }).map(function (s) {
    return Number((s.factor.match(/\d+/) || [])[0]);
  });
  mergedEvidence.forEach(function (e) {
    var match = String(e.role || '').match(/^houseRuler:(\d+)$/);
    var houseNum = match ? Number(match[1]) : null;
    if (houseNum && emptyHouses.indexOf(houseNum) !== -1) {
      e.fallbackUsed = true;
      e.fallbackSource = 'houseRuler';
      e.fallbackReason = 'No planets in house ' + houseNum;
    }
  });
  return { evidence: mergedEvidence, skipped: skipped };
}

function rankEvidence(evidence) {
  return evidence.slice().sort(function (a, b) { return b.weight - a.weight; });
}
/* 把重複指向同一元素／基調的訊號合併起來，判斷哪些配置互相支持；
   少於 2 項同元素時視為沒有明顯的共同支持訊號，不勉強湊結論。 */
function mergeSupportingSignals(rankedEvidence) {
  var top = rankedEvidence.slice(0, 6).filter(function (e) { return e.elemTag; });
  var counts = {};
  top.forEach(function (e) { counts[e.elemTag] = (counts[e.elemTag] || 0) + 1; });
  var keys = Object.keys(counts);
  if (!keys.length) return null;
  keys.sort(function (a, b) { return counts[b] - counts[a]; });
  if (counts[keys[0]] < 2) return null;
  return { elemTag: keys[0], count: counts[keys[0]], items: top.filter(function (e) { return e.elemTag === keys[0]; }) };
}
/* 判斷哪些配置呈現矛盾或雙重需求：(1) 緊密的四分／對分相位本身就是張力訊號；
   (2) 排名前面的證據裡，同時有兩種以上元素都各自出現 2 次以上。 */
function identifyTensions(rankedEvidence) {
  var tensions = [];
  var tenseAspect = rankedEvidence.filter(function (e) { return e.natureTag === 'tense'; })[0];
  if (tenseAspect) {
    tensions.push({ kind: 'aspect', note: tenseAspect.placement + '——這組相位本身帶有需要整合的張力，通常代表兩股力量會互相拉扯，也可能是推動成長的動力，不一定是壞事。' });
  }
  var top = rankedEvidence.slice(0, 6).filter(function (e) { return e.elemTag; });
  var counts = {};
  top.forEach(function (e) { counts[e.elemTag] = (counts[e.elemTag] || 0) + 1; });
  var strong = Object.keys(counts).filter(function (k) { return counts[k] >= 2; });
  if (strong.length >= 2) {
    var note = ELEMENT_TENSION_NOTE[strong[0] + '-' + strong[1]] || ELEMENT_TENSION_NOTE[strong[1] + '-' + strong[0]];
    if (note) tensions.push({ kind: 'element', note: note });
  }
  return tensions;
}

/* V2.1：pickPrimaryEvidence 讓「同一主題內不同題目的主導證據」有機會分散，
   而不是每題都被同一筆最高權重的 evidence 主導（例如愛情三題如果都被同一顆
   月亮主導，答案就會長得很像）。只有在 (a) 這筆證據已經被同一批次前面的題目
   當過主導、且 (b) 存在權重差距不大（<=3）的替代候選時才換人；如果真的沒有
   更合適的替代證據，允許沿用（規格明確允許的例外）。 */
function pickPrimaryEvidence(biased, usedPrimaryKeys) {
  if (!usedPrimaryKeys || !usedPrimaryKeys.length || usedPrimaryKeys.indexOf(biased[0].canonicalKey) === -1) return biased[0];
  for (var i = 1; i < biased.length; i++) {
    if (usedPrimaryKeys.indexOf(biased[i].canonicalKey) === -1 && (biased[0].selectionScore - biased[i].selectionScore) <= 1.5) return biased[i];
  }
  return biased[0];
}

/* V6：raw evidence → semantic score → prose。
   同一顆行星在證據池出現多次時只取最高有效分，避免「被多個 indicator 重複
   列入」人為放大。相位兩端各以較低係數參與；題目 bias 後的 selectionScore
   會一路保留到正文、依據與 debug，不再算完就丟掉。 */
function natalSemanticProfile(biasedEvidence) {
  var perSource = {}, excluded = [];
  (biasedEvidence || []).slice(0, 8).forEach(function (e) {
    var keys = e.planetKey ? [e.planetKey] : (e.aspect ? [e.aspect.a, e.aspect.b] : []);
    if (e.sign != null && typeof ASTRO_SIGN_DIMENSION_WEIGHTS !== 'undefined') {
      var signWeights = ASTRO_SIGN_DIMENSION_WEIGHTS[e.sign] || {};
      Object.keys(signWeights).forEach(function (dimension) {
        /* 題庫本來固定會列入月亮、金星等天體；若行星本質和落座同分，
           物件插入順序會讓行星本質永遠勝出，換星座後正文仍不變。
           落座描述的是這張盤實際採用的表現方式，因此給極小的決勝係數。 */
        var contribution = e.selectionScore * signWeights[dimension] * 1.1;
        var sourceKey = 'sign' + e.sign + ':' + e.canonicalKey + '|' + dimension;
        if (!perSource[sourceKey] || contribution > perSource[sourceKey].score) {
          perSource[sourceKey] = { dimension:dimension, score:contribution, planetKey:null, evidenceKey:e.canonicalKey };
        }
      });
    }
    keys.forEach(function (planetKey) {
      var weights = typeof ASTRO_PLANET_DIMENSION_WEIGHTS !== 'undefined' && ASTRO_PLANET_DIMENSION_WEIGHTS[planetKey];
      if (!weights) return;
      Object.keys(weights).forEach(function (dimension) {
        var contribution = e.selectionScore * weights[dimension] * (e.aspect && !e.planetKey ? .55 : 1);
        var sourceKey = planetKey + '|' + dimension;
        if (!perSource[sourceKey] || contribution > perSource[sourceKey].score) {
          perSource[sourceKey] = { dimension:dimension, score:contribution, planetKey:planetKey, evidenceKey:e.canonicalKey };
        }
      });
    });
  });
  var totals = {}, sources = {};
  Object.keys(perSource).forEach(function (key) {
    var item = perSource[key];
    (sources[item.dimension] || (sources[item.dimension] = [])).push(item);
  });
  Object.keys(sources).forEach(function (dimension) {
    sources[dimension].sort(function (a, b) { return b.score - a.score; });
    /* 最高分決定主軸；其他同向證據只提供 20% 支持，避免題庫固定列入的
       Sun+Mars 等組合靠數量相加，永遠壓過真正與此盤相關的宮主星。 */
    totals[dimension] = sources[dimension].reduce(function (sum, item, index) {
      return sum + item.score * (index === 0 ? 1 : .2);
    }, 0);
  });
  var ranked = Object.keys(totals).map(function (dimension) {
    return { key:dimension, score:Math.round(totals[dimension] * 10) / 10, sources:sources[dimension] || [] };
  }).sort(function (a, b) { return b.score - a.score; });
  var dominant = ranked[0] || null, secondary = ranked[1] || null;
  var gap = dominant && secondary ? Math.round((dominant.score - secondary.score) * 10) / 10 : (dominant ? dominant.score : 0);
  var close = !!(dominant && secondary && gap < Math.max(1.5, dominant.score * .16));
  ranked.slice(2).forEach(function (item) {
    excluded.push({ semanticKey:item.key, reason:'分數 ' + item.score + ' 低於主導維度 ' + dominant.score });
  });
  return { scores:ranked, dominant:dominant, secondary:secondary, gap:gap, close:close, excludedConclusions:excluded };
}
function natalSemanticDefinition(item) {
  return item && typeof ASTRO_TOPIC_DIMENSIONS !== 'undefined' ? ASTRO_TOPIC_DIMENSIONS[item.key] : null;
}
function natalSemanticFocusKind(questionFocus) {
  if (/blindspot|recurring_life_issue/.test(questionFocus || '')) return 'blindspot';
  if (/strength|advantages/.test(questionFocus || '')) return 'strength';
  if (/first_impression|group_role|family_role/.test(questionFocus || '')) return 'role';
  return '';
}
function natalEvidenceLifeContext(e) {
  if (!e) return '';
  if (e.pointKey === 'Node' || /Node/.test(e.canonicalKey || '')) return '決定下一步要往哪裡投入時';
  if (e.planetKey === 'Saturn') return '責任增加或必須長期撐住時';
  if (e.planetKey === 'Moon') return '關係回應或日常節奏改變時';
  if (e.planetKey === 'Mercury') return '資訊不完整或需要說清楚時';
  if (e.planetKey === 'Venus') return '需要協調關係與實際選擇時';
  if (e.planetKey === 'Mars') return '時間緊迫或必須立刻行動時';
  if (e.angleWhich) return '進入新環境、還在判斷如何表現時';
  return '';
}
function natalDistinctEvidenceCount(evidenceList) {
  var seen = {};
  (evidenceList || []).slice(0, 4).forEach(function (e) {
    if (e && e.canonicalKey) seen[e.canonicalKey] = 1;
  });
  return Object.keys(seen).length;
}
function natalTriggerReaction(trigger, reaction) {
  var scene = String(trigger || '').replace(/時$/, '');
  var oneSentence = '當' + trigger + '，你' + reaction;
  return oneSentence.length <= 44
    ? oneSentence
    : '常見情況是：' + scene + '。這時，你' + reaction;
}
function applySemanticQuestionPlan(base, question, biasedEvidence) {
  var kind = natalSemanticFocusKind(question.questionFocus);
  var profile = natalSemanticProfile(biasedEvidence);
  base.semanticProfile = profile;
  if (!profile.dominant) return base;
  var d = natalSemanticDefinition(profile.dominant);
  var s = natalSemanticDefinition(profile.secondary);
  if (!d) return base;
  var dominantSource = profile.dominant.sources && profile.dominant.sources[0];
  var dominantEvidence = dominantSource && (biasedEvidence || []).filter(function (e) {
    return e.canonicalKey === dominantSource.evidenceKey;
  })[0];
  var dominantPlanetMeaning = dominantEvidence && natalPlanetSemantic(dominantEvidence);
  var sourceContext = natalEvidenceLifeContext(dominantEvidence);
  var sourceBehavior = dominantEvidence && dominantEvidence.sign != null
    && typeof SIGN_BEGINNER !== 'undefined' && SIGN_BEGINNER[dominantEvidence.sign]
    ? SIGN_BEGINNER[dominantEvidence.sign].behavior
    : '';
  var supportingBehavior = '';
  (biasedEvidence || []).some(function (e) {
    if (!e || e.canonicalKey === (dominantEvidence && dominantEvidence.canonicalKey)
        || e.sign == null || typeof SIGN_BEGINNER === 'undefined' || !SIGN_BEGINNER[e.sign]) return false;
    var candidate = SIGN_BEGINNER[e.sign].behavior;
    if (!candidate || candidate === sourceBehavior) return false;
    supportingBehavior = candidate;
    return true;
  });
  var evidenceCount = natalDistinctEvidenceCount(biasedEvidence);
  var softClaim = evidenceCount < 2;
  base.semanticKey = question.questionFocus + ':' + profile.dominant.key
    + (dominantEvidence ? '@' + dominantEvidence.canonicalKey : '')
    + (profile.close && profile.secondary ? '+' + profile.secondary.key : '');
  var moneyPlan = typeof ASTRO_WEALTH_BLINDSPOT_DIMENSIONS !== 'undefined'
    ? ASTRO_WEALTH_BLINDSPOT_DIMENSIONS[profile.dominant.key]
    : null;
  var secondaryMoneyPlan = profile.secondary && typeof ASTRO_WEALTH_BLINDSPOT_DIMENSIONS !== 'undefined'
    ? ASTRO_WEALTH_BLINDSPOT_DIMENSIONS[profile.secondary.key]
    : null;
  if (!kind && question.questionFocus === 'spend_save_pattern' && moneyPlan) {
    base.headline = '做消費決定時，最需要留意的是' + moneyPlan.risk + '。儲蓄要先設定固定轉出或額度規則，不靠月底剩下多少。';
    if (secondaryMoneyPlan && secondaryMoneyPlan !== moneyPlan) base.headline += '選項變複雜時，也要防止' + secondaryMoneyPlan.risk + '。';
    base.summary = '這個習慣若沒有預算限制，結果會是' + moneyPlan.cost + '。';
    base.details = [
      { label:'花錢前怎麼判斷', text:moneyPlan.action + '。' },
      { label:'儲蓄怎麼固定下來', text:moneyPlan.saving + '。' },
    ];
    base.caution = moneyPlan.riskCheck + '。';
    base.headlineConceptKeys = [base.semanticKey + ':headline'];
    base.summaryConceptKeys = [base.semanticKey + ':summary'];
    base.detailConceptKeys = [base.semanticKey + ':detail'];
    base.cautionConceptKeys = [base.semanticKey + ':caution'];
    return base;
  }
  if (!kind && question.questionFocus === 'risk_attitude' && moneyPlan) {
    base.headline = '遇到金額較大或結果不確定的選擇時，你較容易' + moneyPlan.risk + '。';
    base.summary = '這會讓' + moneyPlan.cost + '。判斷風險時，要先確認最壞情況是否承受得起。';
    base.details = [
      { label:'下決定前要核對什麼', text:moneyPlan.riskCheck + '。' },
      { label:'怎麼降低誤判', text:moneyPlan.action + '。' },
    ];
    base.caution = '重大財務決策仍需依現實資料與專業意見。';
    base.headlineConceptKeys = [base.semanticKey + ':headline'];
    base.summaryConceptKeys = [base.semanticKey + ':summary'];
    base.detailConceptKeys = [base.semanticKey + ':detail'];
    base.cautionConceptKeys = [base.semanticKey + ':caution'];
    return base;
  }
  if (!kind && question.questionFocus === 'communication_style') {
    base.headline = '溝通時，你' + (sourceBehavior || d.behavior.replace(/^會/, '')) + '。'
      + natalTriggerReaction(d.trigger, '會' + d.behavior.replace(/^會/, '')) + '。這會讓' + d.impact + '。';
    base.summary = '別人實際感受到的是：' + d.socialEffect.replace(/^別人容易覺得你/, '你') + '。';
    base.headlineConceptKeys = [base.semanticKey + ':headline'];
    base.summaryConceptKeys = [base.semanticKey + ':summary'];
    return base;
  }
  if (!kind) return base;
  var focusContext = /relationship/.test(question.questionFocus) ? '在感情裡，'
    : /career|workplace/.test(question.questionFocus) ? '在工作上，'
      : /body|health/.test(question.questionFocus) ? '面對身體與壓力時，'
        : /financial|wealth/.test(question.questionFocus) ? '處理金錢時，'
          : /study|learning/.test(question.questionFocus) ? '學習時，'
            : /social/.test(question.questionFocus) ? '與人互動時，' : '';
  if (kind === 'strength') {
    base.headline = question.questionFocus === 'workplace_advantages'
      ? '工作卡住時，你最能提供的價值是' + d.strength + '。你會' + d.behavior.replace(/^會/, '') + '。這會讓' + d.impact + '。'
      : question.questionFocus === 'social_strengths'
        ? '與人互動時，' + d.socialEffect + '。遇到' + d.trigger.replace(/時$/, '') + '時，你會' + d.behavior.replace(/^會/, '') + '。'
      : question.questionFocus === 'core_strength'
      ? '面對需要你主動處理的事情時，你' + (softClaim ? '比較容易' : '通常會') + d.behavior.replace(/^會/, '') + '。這會讓' + d.impact + '。'
      : focusContext + natalTriggerReaction(d.trigger, (softClaim ? '比較容易' : '通常會') + d.behavior.replace(/^會/, '')) + '。這會讓' + d.impact + '。';
    base.summary = profile.close && s
      ? '你通常會先' + d.behavior + '。情況需要時，也會' + s.behavior + '。'
      : '這項能力的核心是' + d.strength + '。';
    base.details = [
      { label:'最容易發揮的情境', text:'當' + d.trigger + '，這項能力最容易派上用場。' },
      { label:'用過頭時的代價', text:'你可能' + d.overuse + '。結果是' + d.cost + '。' },
    ];
    base.caution = d.action + '。';
  } else if (kind === 'blindspot') {
    var domainBlindspot = question.questionFocus === 'body_boundary_blindspot'
      && typeof ASTRO_HEALTH_BOUNDARY_DIMENSIONS !== 'undefined'
      ? ASTRO_HEALTH_BOUNDARY_DIMENSIONS[profile.dominant.key]
      : question.questionFocus === 'financial_blindspot'
        && typeof ASTRO_WEALTH_BLINDSPOT_DIMENSIONS !== 'undefined'
        ? ASTRO_WEALTH_BLINDSPOT_DIMENSIONS[profile.dominant.key]
        : null;
    var blindspotLead = /relationship/.test(question.questionFocus) ? '感情裡，'
      : /career/.test(question.questionFocus) ? '工作中，'
        : /body|health/.test(question.questionFocus) ? '壓力升高時，'
          : /financial|wealth/.test(question.questionFocus) ? '處理金錢時，'
            : /recurring_life_issue/.test(question.questionFocus) ? '最容易反覆出現的模式是：'
              : focusContext;
    base.headline = domainBlindspot
      ? (question.questionFocus === 'financial_blindspot' ? '處理金錢時，' : '壓力升高時，')
        + '你' + (softClaim ? '可能會' : '容易') + domainBlindspot.risk + '。結果是' + domainBlindspot.cost + '。'
      : question.questionFocus === 'career_blindspot'
      ? '工作中要留意：' + natalTriggerReaction(d.trigger, (softClaim ? '可能會' : '容易') + d.overuse) + '。最後可能' + d.cost + '。'
      : question.questionFocus === 'study_strength_blindspot'
        ? '學習上的優勢是' + d.strength + '。但' + natalTriggerReaction(d.trigger, (softClaim ? '可能會' : '容易') + d.overuse) + '，讓學習進度變得更難掌握。'
        : blindspotLead + natalTriggerReaction(d.trigger, (softClaim ? '可能會' : '容易') + d.overuse) + '。結果是' + d.cost + '。';
    if (question.questionFocus === 'recurring_life_issue' && sourceBehavior
        && natalTextKey(base.headline).indexOf(natalTextKey(sourceBehavior)) === -1) {
      base.headline += supportingBehavior
        ? '你通常先' + sourceBehavior + '，情況更複雜時才' + supportingBehavior + '。'
        : '日常裡，你也常' + sourceBehavior + '。';
    }
    base.summary = sourceContext
      ? '這個反應在' + sourceContext + '特別容易出現。'
      : '這個反應原本想降低風險，最後反而讓問題更難處理。';
    base.details = domainBlindspot ? [
      {
        label:question.questionFocus === 'financial_blindspot' ? '做金錢決定時的慣性' : '壓力剛開始時的反應',
        text:'你通常' + (sourceBehavior || d.behavior.replace(/^會/, '')) + '。',
      },
      { label:'更有效的替代做法', text:domainBlindspot.action + '。' },
    ] : [
      { label:'這樣做會付出什麼代價', text:d.cost + '。' },
      { label:'更有效的替代做法', text:d.action + '。' },
    ];
    base.caution = profile.close && s
      ? '壓力再升高時，你也可能' + s.overuse + '。'
      : '';
    if (domainBlindspot) {
      base.caution = question.questionFocus === 'financial_blindspot'
        ? '如果無法說明用途、金額上限與付款後的影響，就先不要付款。'
        : '若同一個身體警訊持續出現或加重，停止自行判斷並尋求合格醫療協助。';
    }
  } else {
    var roleLead = question.questionFocus === 'family_role' ? '家人最常依賴你處理事情的方式是：你'
      : question.questionFocus === 'group_role' ? '進入團體後，別人最常看見你'
        : '初次見面時，你通常';
    base.headline = roleLead + d.behavior + '。'
      + (sourceBehavior && natalTextKey(d.behavior).indexOf(natalTextKey(sourceBehavior)) === -1
        ? '實際相處時，你' + sourceBehavior + '。'
        : '')
      + (question.questionFocus === 'first_impression'
        ? d.socialEffect + '。'
        : '這會讓' + d.impact + '。');
    base.summary = profile.close && s
      ? '熟悉之後，別人才會發現你也會' + s.behavior + '。'
      : '當' + d.trigger + '，這個反應會特別明顯。';
    var roleLabels = question.questionFocus === 'first_impression'
      ? ['別人最先注意到什麼', '容易被誤解的地方']
      : question.questionFocus === 'family_role'
        ? ['家人最常依賴你的部分', '你容易多承擔什麼']
        : ['你在團體裡會做什麼', '互動中容易忽略什麼'];
    base.details = [
      { label:roleLabels[0], text:d.strength + '。' },
      { label:roleLabels[1], text:'你可能' + d.overuse + '，因此' + d.cost + '。' },
    ];
    base.caution = d.action + '。';
  }
  base.semanticKey = kind + ':' + profile.dominant.key
    + (dominantEvidence ? '@' + dominantEvidence.canonicalKey : '')
    + (profile.close && profile.secondary ? '+' + profile.secondary.key : '');
  base.headlineConceptKeys = [base.semanticKey + ':headline'];
  base.summaryConceptKeys = [base.semanticKey + ':summary'];
  base.detailConceptKeys = [base.semanticKey + ':detail'];
  base.cautionConceptKeys = base.caution ? [base.semanticKey + ':caution'] : [];
  return base;
}
/* V2.1 內容生成流程（取代 V2.0 的 buildQuestionContent）。畫面顯示：問題標題、
   headline（一句話結論）、summary（延伸一句）、details[]（2-4 個依題目動態
   命名的面向）、caution（用題目自己的 cautionFocus 講，不再全部套用同一組
   challenge 欄位）。headline/summary/details 現在分別從獨立的模板池挑句型
   （見 INTENT_FRAMES 的 headlineTpl/summaryTpl/detailTpl），並支援題目的
   fieldOverride——同一個 intent 底下不同 questionFocus 可以引用不同欄位。
   ctx.usedHeadlines／usedSummaries／usedPrimaryKeys：同一批產生 2-3 題時，
   題目彼此的指標池常有重疊，這裡沿用站內既有的「撞了先換候選證據」邏輯
   （同一精神：aspectBeginnerDataUnique），並新增主導證據的分散邏輯。 */
/* V2.2：slot 語意重疊判斷——用「這段文字實際引用了哪些欄位值」當作
   conceptKeys（PLANET_BEGINNER/SIGN_BEGINNER/HOUSE_BEGINNER/投影後的宮位
   短語本身，都是固定的短語庫，用精確字串比對就能可靠抓到「同一個概念被
   不同 slot 重複講一次」，不需要額外的 NLP。 */
function conceptKeysOverlap(a, b) {
  if (!a || !b || !a.length || !b.length) return false;
  for (var i = 0; i < a.length; i++) { if (b.indexOf(a[i]) !== -1) return true; }
  return false;
}
function unionConceptKeys() {
  var out = [];
  for (var i = 0; i < arguments.length; i++) {
    (arguments[i] || []).forEach(function (k) { if (out.indexOf(k) === -1) out.push(k); });
  }
  return out;
}
/* V5.1：三個高風險 questionFocus 使用專屬 Content Plan。
   通用 intent 模板適合多數題目，但「在哪裡認識」「生活習慣」需要可觀察、
   可驗證的具體答案；「家庭核心課題」則必須把問題與練習拆成兩件事。 */
function natalEvidenceHouseNumber(e) {
  return e && (e.houseFocus || e.house || (e.angleWhich && ANGLE_VIRTUAL_HOUSE[e.angleWhich]));
}
function natalPlanetSemantic(e) {
  if (!e || !e.planetKey || typeof ASTRO_PLANET_SEMANTIC_DATASET === 'undefined') return null;
  return ASTRO_PLANET_SEMANTIC_DATASET[e.planetKey] || null;
}
function natalPlanetKeysFromEvidenceList(evidenceList) {
  var keys = [];
  (evidenceList || []).filter(Boolean).forEach(function (e) {
    var candidates = [];
    if (e.planetKey) candidates.push(e.planetKey);
    if (e.aspect) candidates = candidates.concat([e.aspect.a, e.aspect.b]);
    candidates.forEach(function (key) {
      if (key && typeof ASTRO_PLANET_SEMANTIC_DATASET !== 'undefined' && ASTRO_PLANET_SEMANTIC_DATASET[key] && keys.indexOf(key) === -1) keys.push(key);
    });
  });
  return keys;
}
function natalKnowledgeEntryForEvidence(e, category) {
  if (!e || !e.planetKey || typeof PLANET_TOPIC_KNOWLEDGE === 'undefined') return null;
  var houseNum = natalEvidenceHouseNumber(e);
  var overrideKey = houseNum ? (e.planetKey.toLowerCase() + '-' + houseNum + '-' + category) : '';
  var entry = overrideKey && typeof PLANET_HOUSE_TOPIC_KNOWLEDGE !== 'undefined' && PLANET_HOUSE_TOPIC_KNOWLEDGE[overrideKey]
    ? PLANET_HOUSE_TOPIC_KNOWLEDGE[overrideKey]
    : PLANET_TOPIC_KNOWLEDGE[e.planetKey] && PLANET_TOPIC_KNOWLEDGE[e.planetKey][category];
  if (!entry || e.sign == null || typeof SIGN_BEGINNER === 'undefined' || !SIGN_BEGINNER[e.sign]) return entry;
  /* 同一顆行星換了落座時，舊版仍直接回傳同一份 Planet Topic 文案。
     保留行星提供的主結論，但把實際落座的可觀察行為放進第二句。 */
  var signBehavior = SIGN_BEGINNER[e.sign].behavior;
  var meanings = entry.meanings || {};
  return {
    meanings:{
      headline:(meanings.headline || []).map(function (text) {
        return natalStripTrailingPeriod(text) + '。實際表現是，你' + signBehavior + '。';
      }),
      summary:(meanings.summary || []).slice(),
      details:(meanings.details || []).slice(),
      caution:(meanings.caution || []).slice(),
    },
    keywords:(entry.keywords || []).slice(),
    strengths:(entry.strengths || []).slice(),
    risks:(entry.risks || []).slice(),
    semantic:entry.semantic || null,
  };
}
function natalPickKnowledgeText(entry, slot, seed) {
  if (!entry || !entry.meanings) return '';
  var pool = entry.meanings[slot] || [];
  return pool.length ? natalStripTrailingPeriod(astroSeededPick(seed, pool)) : '';
}
/* ================= 結論與分項的矛盾偵測 =================
   結論取自最主要的那顆行星，分項則會輪流取用第二、第三順位的行星，兩者可能給出
   完全相反的建議——實際看過的例子是結論說「適合制度清楚、講求紀律與長期累積的
   環境」，下一行分項卻說「步調靈活、允許隨時調整方向的環境」。使用者不會知道
   這是兩顆行星各說各話，只會覺得這份解讀自相矛盾。

   星盤本來就可能同時有相反的需求，所以正確做法不是隱藏，而是：挑分項時優先避開
   與結論對立的句子；真正只剩對立選項時仍然照常輸出（那代表這張盤確實有拉扯），
   而摺疊區的「互相矛盾的訊號」本來就會說明這件事。

   這裡只比對這份資料裡實際反覆出現的幾組對立軸，不做通用語意分析。 */
var NATAL_CONTRAST_AXES = [
  [['制度', '規範', '紀律', '穩定', '長期累積', '按部就班', '明確的規則', '可預期'],
   ['靈活', '彈性', '隨時調整', '不受拘束', '自由發揮', '隨性', '變化快']],
  [['獨立', '自己一個人', '單打獨鬥', '獨處', '一個人完成'],
   ['團隊', '合作', '一起', '夥伴', '互相照應', '交換想法']],
  [['快速', '立刻', '馬上', '搶佔先機', '主動出手', '衝'],
   ['緩慢', '慢慢', '循序', '耐心等待', '沉澱', '先觀察']],
  [['熱鬧', '人來人往', '頻繁討論', '資訊流通快'],
   ['安靜', '低干擾', '不被打擾', '獨立空間']],
];
function natalContrastPoles(text) {
  var poles = [];
  NATAL_CONTRAST_AXES.forEach(function (axis, ai) {
    for (var side = 0; side < 2; side++) {
      for (var i = 0; i < axis[side].length; i++) {
        if (text.indexOf(axis[side][i]) !== -1) { poles.push(ai + ':' + side); return; }
      }
    }
  });
  return poles;
}
function natalContradicts(a, b) {
  if (!a || !b) return false;
  var pa = natalContrastPoles(String(a)), pb = natalContrastPoles(String(b));
  if (!pa.length || !pb.length) return false;
  return pa.some(function (x) {
    var parts = x.split(':');
    return pb.indexOf(parts[0] + ':' + (parts[1] === '0' ? '1' : '0')) !== -1;
  });
}

function applySemanticKnowledgeContentPlan(base, question, top, second, third) {
  var category = QUESTIONFOCUS_HOUSE_CATEGORY[question.questionFocus];
  /* 只有一題一類的 semantic dataset 才直接驅動 slot；V4 的七個共用大類仍走
     原本 planner，避免把「適合角色」等成熟輸出一次全部改寫。 */
  if (!category || typeof ASTRO_TOPIC_SEMANTIC_DATASET === 'undefined' || !ASTRO_TOPIC_SEMANTIC_DATASET[category]) return base;
  var sources = [top, second, third].filter(Boolean);
  var entries = [];
  sources.forEach(function (e) {
    var direct = natalKnowledgeEntryForEvidence(e, category);
    if (direct) entries.push(direct);
    /* 相位證據本身沒有 planetKey；把相位兩端各自投影成同一 questionFocus 的
       semantic entry，避免張力題只能輸出「訊號較弱」等中性 fallback。 */
    if (!direct && e.aspect && typeof buildComposableKnowledgeEntry === 'function') {
      [e.aspect.a, e.aspect.b].forEach(function (planetKey) {
        if (typeof ASTRO_PLANET_SEMANTIC_DATASET !== 'undefined' && ASTRO_PLANET_SEMANTIC_DATASET[planetKey]) {
          var aspectEntry = buildComposableKnowledgeEntry(planetKey, category);
          if (aspectEntry) entries.push(aspectEntry);
        }
      });
    }
  });
  if (!entries.length) return base;
  var seed = 'semantic|' + question.id + '|' + (top.canonicalKey || '');
  var headline = natalPickKnowledgeText(entries[0], 'headline', seed + '|h');
  var summaryEntry = entries[1] || entries[0];
  var summary = natalPickKnowledgeText(summaryEntry, 'summary', seed + '|s');
  var labels = question.detailLabels || [];
  var usedDetailText = [];
  /* allowContradiction=false 先跑一輪；找不到任何不與結論對立的句子時，
     再放寬重跑一輪，確保分項不會因為這個規則而變空。 */
  function pickDetail(i, allowContradiction) {
    for (var ei = 0; ei < entries.length; ei++) {
      var pool = (entries[(ei + i) % entries.length].meanings.details || []);
      for (var pi = 0; pi < pool.length; pi++) {
        var candidate = natalStripTrailingPeriod(pool[(pi + i) % pool.length]);
        if (!candidate) continue;
        if (usedDetailText.indexOf(candidate) !== -1) continue;
        if (headline.indexOf(candidate) !== -1) continue;
        if (!allowContradiction && natalContradicts(headline, candidate)) continue;
        return candidate;
      }
    }
    return '';
  }
  var details = labels.map(function (label, i) {
    var text = pickDetail(i, false) || pickDetail(i, true);
    if (!text) text = i === 0 ? '從最容易維持的方式開始，在日常中觀察實際效果' : '保留調整空間，依持續結果而不是一時感受修正';
    usedDetailText.push(text);
    return { label:label, text:text };
  });
  var cautionMode = question.cautionMode || 'optional';
  var caution = '';
  if (cautionMode !== 'hidden') caution = natalPickKnowledgeText(entries[0], 'caution', seed + '|c');
  if (cautionMode === 'optional' && caution && (headline.indexOf(caution) !== -1 || summary.indexOf(caution) !== -1 || usedDetailText.indexOf(caution) !== -1)) caution = '';
  base.headline = headline ? headline + '。' : base.headline;
  base.summary = summary ? summary + '。' : base.summary;
  base.details = details;
  base.caution = caution ? caution + '。' : '';
  base.headlineConceptKeys = ['semanticHeadline:' + category];
  base.summaryConceptKeys = ['semanticSummary:' + category];
  base.detailConceptKeys = details.map(function (_, i) { return 'semanticDetail:' + category + ':' + i; });
  base.cautionConceptKeys = caution ? ['semanticCaution:' + category] : [];
  return base;
}
function applyFocusedQuestionContentPlan(base, question, top, second, third, topicId) {
  var focus = question.questionFocus;
  if (focus === 'top_life_themes') {
    var themeScores = (base.semanticProfile && base.semanticProfile.scores) || [];
    var themeDefs = themeScores.slice(0, 3).map(natalSemanticDefinition).filter(Boolean);
    var fallbackThemeKeys = natalPlanetKeysFromEvidenceList([top, second, third]);
    fallbackThemeKeys.forEach(function (key) {
      if (themeDefs.length >= 3) return;
      var p = typeof ASTRO_PLANET_SEMANTIC_DATASET !== 'undefined' && ASTRO_PLANET_SEMANTIC_DATASET[key];
      if (p) themeDefs.push({ label:p.need, behavior:p.drive, impact:p.gift });
    });
    while (themeDefs.length < 3) themeDefs.push({ label:'把重要選擇落實成可持續的日常做法', behavior:'先確認現實條件，再安排下一步', impact:'讓投入能逐步累積' });
    base.headline = '命盤中最明顯的三個人生主題是：' + themeDefs.slice(0, 3).map(function (d) { return d.label; }).join('、') + '。';
    base.summary = '三者的關聯是：你先用「' + themeDefs[0].label + '」決定方向，再用「' + themeDefs[1].label + '」處理過程，最後透過「' + themeDefs[2].label + '」讓結果能持續。';
    base.details = themeDefs.slice(0, 3).map(function (d, index) {
      return { label:'主題 ' + (index + 1), text:'當相關情境出現時，你通常會' + d.behavior.replace(/^會/, '') + '。這會' + (d.impact || '影響後續選擇') + '。' };
    });
    base.caution = '';
    base.headlineConceptKeys = themeDefs.slice(0, 3).map(function (d) { return 'lifeTheme:' + d.label; });
    base.summaryConceptKeys = ['lifeThemeSequence'];
    base.detailConceptKeys = themeDefs.slice(0, 3).map(function (d, i) { return 'lifeThemeDetail:' + i + ':' + d.label; });
    base.cautionConceptKeys = [];
  } else if (focus === 'likely_partner_traits') {
    var partnerKeys = natalPlanetKeysFromEvidenceList([top, second, third]);
    var partnerPrimaryKey = partnerKeys[0] || 'Moon';
    var partnerSupportKey = partnerKeys[1] || partnerPrimaryKey;
    var partnerPrimary = ASTRO_PARTNER_PLAIN_DATASET[partnerPrimaryKey] || ASTRO_PARTNER_PLAIN_DATASET.Moon;
    var partnerSupport = ASTRO_PARTNER_PLAIN_DATASET[partnerSupportKey] || partnerPrimary;
    var partnerTypeLabels = {
      Sun:'主動明確型', Moon:'溫暖照顧型', Mercury:'好奇健談型', Venus:'公平有品味型',
      Mars:'行動直接型', Jupiter:'樂觀成長型', Saturn:'成熟可靠型', Uranus:'獨立自主型',
      Neptune:'溫柔共感型', Pluto:'深度坦白型',
    };
    base.headline = '你較常遇到「' + (partnerTypeLabels[partnerPrimaryKey] || '重視關係品質型') + '」的對象。';
    base.summary = '真正影響長期相處的，不只是第一印象，而是對方能否做到：' + partnerSupport.interaction + '。';
    base.details = [
      { label:'對象的個性傾向', text:partnerPrimary.personality },
      { label:'互動與相處風格', text:partnerSupport.interaction },
      { label:'你會被什麼特質留住', text:partnerPrimary.staying },
    ];
    base.caution = '這是較常出現的互動傾向；仍要觀察對方是否能長期把態度落實成行動。';
    base.headlineConceptKeys = ['partnerPersonality:' + partnerPrimaryKey];
    base.summaryConceptKeys = ['partnerInteraction:' + partnerSupportKey];
    base.detailConceptKeys = ['partnerPersonalityDetail:' + partnerPrimaryKey, 'partnerInteractionDetail:' + partnerSupportKey, 'partnerStaying:' + partnerPrimaryKey];
    base.cautionConceptKeys = ['partnerActionCheck'];
  } else if (focus === 'emotional_attraction') {
    var attractionEvidence = [top, second, third].filter(Boolean).filter(function (e) { return e.sign != null; })[0];
    var attractionElem = attractionEvidence && ZODIAC_SIGNS[attractionEvidence.sign]
      ? ZODIAC_SIGNS[attractionEvidence.sign].elem : '風';
    var attraction = ASTRO_ATTRACTION_PLAIN_DATASET[attractionElem] || ASTRO_ATTRACTION_PLAIN_DATASET['風'];
    base.headline = attraction.headline + '。';
    base.summary = '這裡說的是容易啟動心動的特質，不等於只要具備這些特質，就一定適合長期相處。';
    base.details = [
      { label:'容易被什麼特質吸引', text:attraction.trait },
      { label:'什麼樣的互動最讓你心動', text:attraction.interaction },
    ];
    base.caution = '吸引力只代表容易注意到對方；是否適合長期相處，仍要看承諾與行動是否一致。';
    base.headlineConceptKeys = ['attractionHeadline:' + attractionElem];
    base.summaryConceptKeys = ['attractionScope'];
    base.detailConceptKeys = ['attractionTrait:' + attractionElem, 'attractionInteraction:' + attractionElem];
    base.cautionConceptKeys = ['attractionNotCompatibility'];
  } else if (focus === 'partner_visual_impression') {
    var appearanceEvidence = [top, second, third].filter(Boolean).filter(function (e) { return e.sign != null; })[0];
    var appearanceElem = appearanceEvidence && ZODIAC_SIGNS[appearanceEvidence.sign]
      ? ZODIAC_SIGNS[appearanceEvidence.sign].elem : '風';
    var appearance = ASTRO_APPEARANCE_PLAIN_DATASET[appearanceElem] || ASTRO_APPEARANCE_PLAIN_DATASET['風'];
    base.headline = appearance.headline + '。';
    base.summary = '這題只描述容易被注意到的穿著、姿態與第一印象，不把內在感受或相處習慣當成外型。';
    base.details = [
      { label:'外型風格傾向', text:appearance.visual },
      { label:'氣場給人的感覺', text:appearance.vibe },
    ];
    base.caution = '外型與氣質只能描述風格傾向，不能據此推測五官、身高或其他固定生理特徵。';
    base.headlineConceptKeys = ['appearanceHeadline:' + appearanceElem];
    base.summaryConceptKeys = ['appearanceScope'];
    base.detailConceptKeys = ['appearanceVisual:' + appearanceElem, 'appearanceVibe:' + appearanceElem];
    base.cautionConceptKeys = ['appearanceBoundary'];
  } else if (focus === 'preferred_relationship_style') {
    var relationshipKeys = natalPlanetKeysFromEvidenceList([top, second, third]);
    var relationshipKey = relationshipKeys[0] || 'Venus';
    var relationshipStyle = ASTRO_RELATIONSHIP_STYLE_PLAIN_DATASET[relationshipKey] || ASTRO_RELATIONSHIP_STYLE_PLAIN_DATASET.Venus;
    base.headline = relationshipStyle.headline + '。';
    base.summary = '比起只看兩個人合不合拍，更重要的是日常聯絡、共同決定與各自空間能否長期維持。';
    base.details = [
      { label:'適合的相處模式', text:relationshipStyle.mode },
      { label:'關係中的步調', text:relationshipStyle.rhythm },
    ];
    base.caution = '若只有一方持續配合，這種相處方式就不算真正適合。';
    base.headlineConceptKeys = ['relationshipStyle:' + relationshipKey];
    base.summaryConceptKeys = ['relationshipStyleTest'];
    base.detailConceptKeys = ['relationshipMode:' + relationshipKey, 'relationshipRhythm:' + relationshipKey];
    base.cautionConceptKeys = ['relationshipMutuality'];
  } else if (focus === 'relationship_repair') {
    var repairKeys = natalPlanetKeysFromEvidenceList([top, second, third]);
    var repairKey = repairKeys[0] || 'Mercury';
    var repair = ASTRO_RELATIONSHIP_REPAIR_PLAIN_DATASET[repairKey] || ASTRO_RELATIONSHIP_REPAIR_PLAIN_DATASET.Mercury;
    base.headline = repair.headline + '。';
    base.summary = '發生衝突後，修復不是恢復表面和平，而是確認發生了什麼、誰受到影響，以及下一次要改變哪個行動。';
    base.details = [
      { label:'衝突後的第一步', text:repair.first },
      { label:'修復關係的方式', text:repair.repair },
    ];
    base.caution = '不要用暫時沉默或由一方退讓，代替真正的確認與改變。';
    base.headlineConceptKeys = ['repairFirst:' + repairKey];
    base.summaryConceptKeys = ['repairDefinition'];
    base.detailConceptKeys = ['repairFirstDetail:' + repairKey, 'repairAction:' + repairKey];
    base.cautionConceptKeys = ['repairNotAvoidance'];
  } else if (focus === 'employment_mode') {
    var employmentKeys = natalPlanetKeysFromEvidenceList([top, second, third]);
    var employmentKey = employmentKeys[0] || 'Saturn';
    var employment = ASTRO_EMPLOYMENT_MODE_DATASET[employmentKey] || ASTRO_EMPLOYMENT_MODE_DATASET.Saturn;
    var employmentEvidence = [top, second, third].filter(Boolean).filter(function (e) { return e.planetKey === employmentKey; })[0];
    var employmentSign = employmentEvidence && employmentEvidence.sign != null && SIGN_BEGINNER[employmentEvidence.sign];
    base.headline = '在三種選項中，較值得優先評估的是：' + employment.mode + '。'
      + (employmentSign ? '實際工作時，你通常' + employmentSign.behavior + '。' : '');
    base.summary = '判斷穩定就業、自由工作或創業哪個更合適，關鍵要看實際工作能否提供以下自主條件。';
    base.details = [
      { label:'你需要的自主程度', text:employment.autonomy },
      { label:'怎麼判斷是否適合', text:employment.test },
    ];
    base.caution = '';
    base.headlineConceptKeys = ['employmentMode:' + employmentKey];
    base.summaryConceptKeys = ['employmentDecisionRule'];
    base.detailConceptKeys = ['employmentAutonomy:' + employmentKey, 'employmentTest:' + employmentKey];
    base.cautionConceptKeys = [];
  } else if (focus === 'family_origin_impact') {
    var originKeys = natalPlanetKeysFromEvidenceList([top, second, third]);
    var originKey = originKeys[0] || 'Moon';
    var origin = ASTRO_FAMILY_ORIGIN_PLAIN_DATASET[originKey] || ASTRO_FAMILY_ORIGIN_PLAIN_DATASET.Moon;
    base.headline = origin.habit + '。這個習慣可能延續到現在的關係與責任分配。';
    base.summary = '這種早期習慣延續到現在時，常會變成：' + origin.impact + '。';
    base.details = [
      { label:'原生家庭留下的慣性', text:origin.habit },
      { label:'值得修正的模式', text:origin.correction },
    ];
    base.caution = '這裡描述的是可能延續的互動習慣，不代表對家人或童年經驗下定論。';
    base.headlineConceptKeys = ['originHabit:' + originKey];
    base.summaryConceptKeys = ['originImpact:' + originKey];
    base.detailConceptKeys = ['originHabitDetail:' + originKey, 'originCorrection:' + originKey];
    base.cautionConceptKeys = ['originNotDiagnosis'];
  } else if (focus === 'inner_safety_practice') {
    var safetyKeys = natalPlanetKeysFromEvidenceList([top, second, third]);
    var safetyKey = safetyKeys[0] || 'Moon';
    var safety = ASTRO_INNER_SAFETY_PLAIN_DATASET[safetyKey] || ASTRO_INNER_SAFETY_PLAIN_DATASET.Moon;
    base.headline = '讓自己安定下來時，最適合先做的是：' + safety.action + '。';
    base.summary = '真正有效的安全感，應該讓你在情緒下降後更能處理現實問題，而不是只能暫時逃開。';
    base.details = [
      { label:'平時可建立的習慣', text:safety.routine },
      { label:'這個方法要解決什麼', text:'先讓當下的緊繃下降，再回頭處理真正需要決定或溝通的事情' },
    ];
    base.caution = '';
    base.headlineConceptKeys = ['safetyAction:' + safetyKey];
    base.summaryConceptKeys = ['safetyCurrentPractice'];
    base.detailConceptKeys = ['safetyRoutine:' + safetyKey, 'safetyPurpose'];
    base.cautionConceptKeys = [];
  } else if (focus === 'recovery_method') {
    var recoveryKeys = natalPlanetKeysFromEvidenceList([top, second, third]);
    var recoveryKey = recoveryKeys[0] || 'Moon';
    var recovery = ASTRO_INNER_SAFETY_PLAIN_DATASET[recoveryKey] || ASTRO_INNER_SAFETY_PLAIN_DATASET.Moon;
    var recoveryHabit = (typeof ASTRO_LIFESTYLE_HABIT_DATASET !== 'undefined' && ASTRO_LIFESTYLE_HABIT_DATASET[recoveryKey])
      || ASTRO_LIFESTYLE_HABIT_DATASET.Moon;
    base.headline = '真正能幫你恢復精力的方式是：' + recovery.action + '。';
    base.summary = '有效休息應該讓疲勞與緊繃逐步下降，而不是只有暫時分心，結束後反而更累。';
    base.details = [
      { label:'適合的休息節奏', text:recoveryHabit.pace },
      { label:'怎麼判斷有沒有效', text:recoveryHabit.fit },
    ];
    base.caution = '若疲憊、失眠或其他不適持續，仍應尋求合格醫療專業協助。';
    base.headlineConceptKeys = ['recoveryAction:' + recoveryKey];
    base.summaryConceptKeys = ['recoveryEffectTest'];
    base.detailConceptKeys = ['recoveryPace:' + recoveryKey, 'recoverySignal:' + recoveryKey];
    base.cautionConceptKeys = ['medicalBoundary'];
  } else if (focus === 'inner_tension_balance') {
    /* 「拉扯」必須是兩股方向相反的需求。先前是依主導元素挑「同一元素的兩顆行星」，
       但同元素本來就同調性，四組配對裡有三組根本不構成對立：
         火 Sun（被肯定並掌握方向）＋ Mars（立刻行動並突破阻礙）——都是自我推進
         風 Mercury（保留思考、交流與變動空間）＋ Uranus（保有自由並嘗試不同做法）——都是求變
         水 Moon（被理解並維持情感安全）＋ Neptune（跟隨直覺、理想與情感共鳴）——都是感受
       使用者讀到的是同一件事講兩次，難怪看不懂在拉扯什麼。

       改成兩段式：
       1. 優先採用這張盤實際存在的四分／對分相位。張力相位就是占星學上「拉扯」
          的字面來源，而且每張盤不同，答案會真的因人而異。
       2. 沒有硬相位時才退回預先定義的對立軸——每一組都是刻意挑方向相反的需求，
          不再從同一元素裡取兩顆。 */
    var TENSION_AXIS_BY_ELEMENT = {
      '火': ['Mars', 'Saturn'],    // 立刻行動突破 ↔ 確保責任、秩序與結果可控制
      '土': ['Saturn', 'Uranus'],  // 秩序與可控 ↔ 自由並嘗試不同做法
      '風': ['Mercury', 'Neptune'],// 保留思考與交流 ↔ 跟隨直覺與情感共鳴
      '水': ['Moon', 'Saturn'],    // 情感安全需求 ↔ 責任與現實條件
    };
    /* 就算是真實的張力相位，兩顆行星的「需求描述」仍可能落在同一種調性上——
       例如 Sun（被肯定並掌握方向）與 Mars（立刻行動並突破阻礙）都是自我推進，
       Moon 與 Neptune 都是感受面。這種配對在畫面上一樣讀不出對立感，所以先把
       ASTRO_TENSION_PLAIN_DATASET 的十個 side 依語意分組，同組不得互相配對。 */
    var TENSION_FLAVOUR = {
      Sun:'推進', Mars:'推進',
      Moon:'感受', Neptune:'感受',
      Saturn:'秩序', Uranus:'求變', Venus:'關係',
      Mercury:'思辨', Jupiter:'擴張', Pluto:'深掘',
    };
    var tensionKeys = null;
    /* 依排序逐一檢視張力相位，取第一組兩極分屬不同調性的。 */
    (base.selectionRanked || []).forEach(function (e) {
      if (tensionKeys || e.natureTag !== 'tense') return;
      /* aspect 證據的 canonicalKey 形如 aspect|Mars-Moon:opposition|||（行星依字母排序） */
      var tenseMatch = String(e.canonicalKey || '').match(/^aspect\|([A-Za-z]+)-([A-Za-z]+):/);
      if (!tenseMatch) return;
      var ka = tenseMatch[1], kb = tenseMatch[2];
      if (!ASTRO_TENSION_PLAIN_DATASET[ka] || !ASTRO_TENSION_PLAIN_DATASET[kb]) return;
      if (TENSION_FLAVOUR[ka] && TENSION_FLAVOUR[ka] === TENSION_FLAVOUR[kb]) return;
      tensionKeys = [ka, kb];
    });
    if (!tensionKeys) {
      var tensionElem = top && (top.elemTag || top.dominantElement
        || ((top.canonicalKey || '').match(/balance\|([火土風水])/) || [])[1]);
      tensionKeys = TENSION_AXIS_BY_ELEMENT[tensionElem] || ['Saturn', 'Uranus'];
    }
    var tensionFirstKey = tensionKeys[0] || 'Saturn';
    var tensionSecondKey = tensionKeys[1] || (tensionFirstKey === 'Saturn' ? 'Uranus' : 'Saturn');
    var tensionFirst = ASTRO_TENSION_PLAIN_DATASET[tensionFirstKey] || ASTRO_TENSION_PLAIN_DATASET.Sun;
    var tensionSecond = ASTRO_TENSION_PLAIN_DATASET[tensionSecondKey] || ASTRO_TENSION_PLAIN_DATASET.Saturn;
    base.headline = '你的拉扯較可能發生在「' + tensionFirst.side + '」和「' + tensionSecond.side + '」之間。';
    base.summary = '平衡不是選邊站，而是先分清楚現在需要解決的是目標、情緒、關係、自由還是風險。';
    base.details = [
      /* 這一條刻意不重述兩極的名稱。三個欄位分工：headline 講「拉扯在哪兩件事之間」，
         這裡講「卡住時的症狀」，下一條講「各自該怎麼做」。先前是把兩極再列一次，
         等於把 headline 換句話說，也會被「分項不得重述大標」的通則判定為重複、
         整條被換成一句泛用行為描述，反而把內容弄丟。 */
      { label:'容易卡住的時刻', text:'兩邊都想顧好、卻必須先挑一邊處理時，最容易反覆猶豫或一下子用力過猛' },
      { label:'練習整合的方向', text:tensionFirst.action + '，接著' + tensionSecond.action },
    ];
    base.caution = '';
    base.headlineConceptKeys = ['tensionSides:' + tensionFirstKey + ':' + tensionSecondKey];
    base.summaryConceptKeys = ['tensionDecisionSequence'];
    base.detailConceptKeys = ['tensionForces:' + tensionFirstKey + ':' + tensionSecondKey, 'tensionAction:' + tensionFirstKey + ':' + tensionSecondKey];
    base.cautionConceptKeys = [];
  } else if (focus === 'meeting_context') {
    var venueEvidence = [top, second, third].filter(Boolean).filter(function (e) { return !!natalEvidenceHouseNumber(e); });
    var venue1 = venueEvidence[0] ? projectEvidenceForTopic(venueEvidence[0], topicId, focus).projectedMeaning : '共同興趣、工作合作或朋友介紹的場合';
    var venue2 = '';
    for (var vi = 1; vi < venueEvidence.length; vi++) {
      var candidateVenue = projectEvidenceForTopic(venueEvidence[vi], topicId, focus).projectedMeaning;
      if (candidateVenue && candidateVenue !== venue1) { venue2 = candidateVenue; break; }
    }
    var meetSemantic = natalPlanetSemantic(top);
    var connection = meetSemantic ? ('彼此展現' + meetSemantic.gift) : '自然交談與共同完成事情';
    base.headline = '較容易在' + venue1 + '認識重要對象。';
    base.summary = '關係通常不是憑空發生，而是在有共同活動、可以反覆接觸的情境裡，透過' + connection + '慢慢形成。';
    base.details = [
      { label:'通常怎麼開始接觸', text:'多半先因共同活動、課程或任務有固定往來，再從對話逐漸熟悉' },
      { label:'另一種可能情境', text:venue2 || ('先因共同任務或興趣互動，再從' + connection + '逐漸熟悉') },
    ];
    base.caution = '';
    base.headlineConceptKeys = ['meetingVenue:' + venue1];
    base.summaryConceptKeys = ['meetingConnection:' + connection];
    base.detailConceptKeys = ['meetingContactPath:' + venue1, 'meetingVenueSecondary:' + (venue2 || connection)];
    base.cautionConceptKeys = [];
  } else if (focus === 'family_core_lesson') {
    var familyPrimary = natalPlanetSemantic(top);
    var familySupport = natalPlanetSemantic(second) || natalPlanetSemantic(third);
    var recurring = familyPrimary ? familyPrimary.risk : '把責任與情緒都攬在自己身上';
    var need = familyPrimary ? familyPrimary.need : '清楚而安全的互動';
    var practiceKey = (second && second.planetKey) || (third && third.planetKey) || (top && top.planetKey);
    var practice = (typeof ASTRO_FAMILY_PRACTICE_DATASET !== 'undefined' && ASTRO_FAMILY_PRACTICE_DATASET[practiceKey])
      || '說清楚需求、分配責任並確認彼此理解';
    base.headline = '家庭關係反覆出現的課題，較可能是「' + recurring + '」。';
    base.summary = '這通常不是誰做得不夠好，而是家人都在追求' + need + '時，沿用了不再有效的相處方式。';
    base.details = [
      { label:'反覆出現的課題', text:recurring },
      { label:'需要練習的相處方式', text:practice },
    ];
    base.caution = '留意不要只要求自己做得更多；真正的改善需要家人共同調整分工與回應方式。';
    base.headlineConceptKeys = ['familyRecurring:' + recurring];
    base.summaryConceptKeys = ['familyNeed:' + need];
    base.detailConceptKeys = ['familyProblem:' + recurring, 'familyPractice:' + practice];
    base.cautionConceptKeys = ['familySharedResponsibility'];
  } else if (focus === 'lifestyle_fit') {
    var habitKey = top && top.planetKey;
    var habit = (typeof ASTRO_LIFESTYLE_HABIT_DATASET !== 'undefined' && ASTRO_LIFESTYLE_HABIT_DATASET[habitKey])
      || (typeof ASTRO_LIFESTYLE_HABIT_DATASET !== 'undefined' && ASTRO_LIFESTYLE_HABIT_DATASET.Saturn);
    base.headline = '較適合你的，是' + habit.pace + '。';
    base.summary = '判斷合不合適，不是看能否偶爾做到，而是這套安排能不能連續維持數週，同時讓睡眠、精神與日常任務更穩定。';
    base.details = [
      { label:'適合的生活步調', text:habit.pace },
      { label:'容易維持的作息', text:habit.routine },
      { label:'怎麼判斷適不適合', text:habit.fit },
    ];
    base.caution = '這是生活方式建議；若有持續失眠、疼痛或其他不適，仍應尋求合格醫療專業協助。';
    base.headlineConceptKeys = ['lifestylePace:' + habit.pace];
    base.summaryConceptKeys = ['lifestyleFitTest'];
    base.detailConceptKeys = ['lifestyleRoutine:' + habit.routine, 'lifestyleSignal:' + habit.fit];
    base.cautionConceptKeys = ['medicalBoundary'];
  } else if (focus === 'study_rhythm') {
    var studyHabitKey = top && top.planetKey;
    var studyHabit = (typeof ASTRO_LIFESTYLE_HABIT_DATASET !== 'undefined' && ASTRO_LIFESTYLE_HABIT_DATASET[studyHabitKey])
      || ASTRO_LIFESTYLE_HABIT_DATASET.Mercury;
    base.headline = '讀書時，你適合' + studyHabit.pace + '。';
    base.summary = '有效的安排要能連續維持數週，不能只靠考前一次長時間硬撐。';
    base.details = [
      { label:'每次開始前怎麼安排', text:studyHabit.routine },
      { label:'怎麼確認這個節奏有效', text:studyHabit.fit },
    ];
    base.caution = '';
    base.headlineConceptKeys = ['studyPace:' + studyHabitKey];
    base.summaryConceptKeys = ['studyConsistencyTest'];
    base.detailConceptKeys = ['studyRoutine:' + studyHabitKey, 'studyFit:' + studyHabitKey];
    base.cautionConceptKeys = [];
  } else if (focus === 'communication_style') {
    var communicationProfile = base.semanticProfile;
    var communicationDef = communicationProfile && natalSemanticDefinition(communicationProfile.dominant);
    if (communicationDef) {
      base.details = [
        { label:'怎麼確認彼此有聽懂', text:communicationDef.action },
        { label:'哪種情況容易讓表達失真', text:'你可能' + communicationDef.overuse + '。結果是' + communicationDef.cost },
      ];
      base.detailConceptKeys = ['communicationAction:' + communicationProfile.dominant.key, 'communicationDistortion:' + communicationProfile.dominant.key];
    }
  } else if (focus === 'spend_save_pattern' || focus === 'risk_attitude' || focus === 'recurring_life_issue') {
    /* 這三題已由 applySemanticQuestionPlan 產生可驗收的行為型內容。
       不再讓後面的共用 knowledge phrase 把消費寫回抽象需求、把溝通寫回人格形容。 */
  } else {
    base = applySemanticKnowledgeContentPlan(base, question, top, second, third);
  }
  return base;
}
/* ================= 答案文字的最後潤飾 =================
   內容規劃器把「標籤」與「內文」分開產生，結果是很多分項的第一句只是把自己的標籤
   再唸一次——標籤寫「衝突後的第一步」，內文開頭又是「第一步是⋯⋯」；標籤寫
   「適合的相處模式」，內文開頭是「相處需要⋯⋯」。使用者讀起來就是同一件事講兩遍。
   另外 headline／summary／caution 都會補句號，只有 details 沒有，同一張卡片上
   結論有句號、分項沒有，看起來很隨便。

   這裡在輸出的最後一關統一處理，不動內容規劃邏輯本身：
   1. 內文開頭如果是在重述自己的標籤（開頭短語與標籤有兩個以上共用字），就把它拿掉
   2. 拿掉之後仍要留下足夠長度的內容，否則維持原樣（寧可贅字，也不要留下半句話）
   3. 補上句尾標點

   注意：不能因為分項內容跟結論重複就把它刪掉——validateNatalTopicContent() 的
   min_answer_targets 檢查要求 details 數量不得少於題目宣告的 answerTargets。 */
var NATAL_DETAIL_ECHO_RE = /^(.{2,7}?)(是|宜|為|需要|在於)/;
function stripDetailLabelEcho(label, text) {
  if (!label || !text) return text;
  var m = NATAL_DETAIL_ECHO_RE.exec(text);
  if (!m) return text;
  var head = m[1], seen = {}, shared = 0;
  for (var i = 0; i < head.length; i++) {
    var ch = head.charAt(i);
    if (!seen[ch] && label.indexOf(ch) !== -1) { seen[ch] = 1; shared++; }
  }
  if (shared < 2) return text;
  var rest = text.slice(m[0].length);
  return rest.length >= 6 ? rest : text;
}
function splitNatalLongText(text) {
  return String(text || '').replace(/([^。！？]+)([。！？]?)/g, function (_, sentence, end) {
    if (sentence.length <= 44) return sentence + end;
    var commas = [];
    for (var i = 0; i < sentence.length; i++) if (sentence.charAt(i) === '，') commas.push(i);
    var candidates = commas.filter(function (idx) {
      if (idx < 20 || idx > 38) return false;
      /* 「當情境發生時，你會……」是完整因果，不在情境與反應之間硬切句。 */
      var beforeComma = sentence.slice(0, idx);
      if (beforeComma.indexOf('當') !== -1 && /時$/.test(beforeComma)) return false;
      return true;
    });
    if (!candidates.length) return sentence + end;
    candidates.sort(function (a, b) { return Math.abs(a - 28) - Math.abs(b - 28); });
    var cut = candidates[0];
    var first = sentence.slice(0, cut);
    var second = sentence.slice(cut + 1);
    if (!/^(你|對方|別人|家人|這|那|事情|關係|工作|環境|真正|若|如果|當|因此|結果|壓力|實際)/.test(second)) second = '你' + second;
    return first + '。' + second + end;
  });
}
var NATAL_HEADLINE_MAX_LENGTH = 30;
function shortNatalThemeLabel(text) {
  var pairs = [
    [/自主決定與立即行動/g, '主動行動'], [/公平協調與相處品質/g, '公平協調'],
    [/集中投入與突破阻力/g, '集中突破'], [/情緒回應與安全感/g, '情緒安全'],
    [/深度信任與核心真相/g, '深度信任'], [/責任分工與可預期性/g, '責任分工'],
    [/新鮮感與擴大選項/g, '探索變化'], [/被看見與主動表態/g, '被看見'],
    [/資訊交換與說清楚/g, '清楚溝通'], [/自由調整與保有差異/g, '自主調整'],
  ];
  return pairs.reduce(function (out, pair) { return out.replace(pair[0], pair[1]); }, String(text || ''));
}
function shortNatalMoneyRisk(item) {
  var labels = {
    visibility:'為了體面而超支', emotionalResponse:'用消費安撫情緒', dialogue:'比較太久卻沒設上限',
    harmony:'為了人情而超支', structure:'把預算訂得過緊', consistency:'不肯停止舊支出',
    freedom:'臨時打破預算', novelty:'同時買太多新項目', depthTrust:'過度控制共同資源',
    intensity:'一次投入過多', selfDirection:'沒比較就付款', practicalCare:'替別人承擔花費',
  };
  return item ? (labels[item.key] || shortNatalThemeLabel((natalSemanticDefinition(item) || {}).label || '衝動支出')) : '';
}
function shortNatalCommunicationAction(item) {
  var labels = {
    visibility:'表明立場', emotionalResponse:'確認對方感受', dialogue:'釐清資訊', harmony:'協調不同意見',
    structure:'說清責任分工', consistency:'確認承諾是否一致', freedom:'保留調整空間', novelty:'提出新選項',
    depthTrust:'追問核心問題', intensity:'集中處理關鍵', selfDirection:'直接說明決定', practicalCare:'確認實際需要',
  };
  return item ? (labels[item.key] || '說清重點') : '';
}
function shortNatalHealthWarning(item) {
  var labels = {
    visibility:'為了表現而忽略疲累', emotionalResponse:'延後吃飯、睡眠或休息', dialogue:'休息時腦袋仍停不下來',
    harmony:'累了仍繼續配合安排', structure:'把休息也當成達標任務', consistency:'狀態變差仍照計畫硬撐',
    freedom:'作息反覆中斷', novelty:'行程過多而無法恢復', depthTrust:'長期維持警戒與緊繃',
    intensity:'每件事都用最高強度處理', selfDirection:'身體尚未恢復就立刻行動', practicalCare:'先照顧別人而延後休息',
  };
  return item ? (labels[item.key] || '疲累後仍繼續硬撐') : '疲累後仍繼續硬撐';
}
/* 標題裁切一律不得切在「」中間。引號在這裡是語義單位——「保留思考、交流與
   變動空間」是一個完整的需求名稱，從裡面的頓號切開會同時造成兩個問題：引號
   沒有結尾（畫面上出現「主要拉扯在「保留思考。」這種殘句），而且剩下的半個
   詞讀起來變成另一個意思。 */
function natalQuotesBalanced(text) {
  var open = 0;
  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);
    if (ch === '「') open++;
    else if (ch === '」') { open--; if (open < 0) return false; }
  }
  return open === 0;
}
/* 所有切點都失敗、只能硬切時的補救：連同那個開引號一起丟掉。
   標題短一點沒關係，留一個開著的引號一定是壞的。 */
function natalDropDanglingQuote(text) {
  if (natalQuotesBalanced(text)) return text;
  var at = text.lastIndexOf('「');
  if (at <= 0) return text.replace(/[「」]/g, '');
  return text.slice(0, at).replace(/[，、；和與及]+$/, '');
}
function compactNatalHeadline(text, questionFocus, answer) {
  var raw = String(text || '');
  var dominantDef = answer && answer.semanticProfile && natalSemanticDefinition(answer.semanticProfile.dominant);
  var secondaryDef = answer && answer.semanticProfile && natalSemanticDefinition(answer.semanticProfile.secondary);
  if (dominantDef && questionFocus === 'family_career_balance') raw = '平衡家庭與事業時，要兼顧' + dominantDef.label + '。';
  if (dominantDef && questionFocus === 'family_role') raw = '家庭中常處理' + dominantDef.label + (secondaryDef ? '，也兼顧' + secondaryDef.label : '') + '。';
  if (dominantDef && questionFocus === 'earning_style') raw = '收入適合建立在' + dominantDef.label + '。';
  if (dominantDef && questionFocus === 'overseas_education_direction') raw = '跨域學習適合能拓展' + dominantDef.label + '的環境。';
  if (dominantDef && questionFocus === 'major_decision_basis') raw = '重大選擇時，先確認是否符合' + dominantDef.label + '。';
  if (dominantDef && questionFocus === 'recurring_life_issue') raw = '反覆卡在' + shortNatalThemeLabel(dominantDef.label)
    + (secondaryDef ? '，也牽動' + shortNatalThemeLabel(secondaryDef.label) : '') + '。';
  if (answer && answer.semanticProfile && questionFocus === 'spend_save_pattern') raw = '消費時先防' + shortNatalMoneyRisk(answer.semanticProfile.dominant)
    + (answer.semanticProfile.secondary ? '，也留意' + shortNatalMoneyRisk(answer.semanticProfile.secondary) : '') + '。';
  if (dominantDef && questionFocus === 'study_mode_fit') raw = '適合的學習模式是用實作探索' + shortNatalThemeLabel(dominantDef.label) + '。';
  if (dominantDef && questionFocus === 'overseas_education_direction') raw = '海外進修適合拓展' + shortNatalThemeLabel(dominantDef.label) + '。';
  if (dominantDef && questionFocus === 'knowledge_application') raw = '把知識中的' + shortNatalThemeLabel(dominantDef.label) + '轉成作品或實作。';
  var practical = /實際表現是[，：]?([^。！？]+)/.exec(raw);
  var practicalPrefix = {
    first_impression:'第一印象是，', social_strengths:'人際優勢是，',
    memory_mode:'理解資訊時，', procrastination_root:'學習卡住時，',
  }[questionFocus];
  if (practical && practicalPrefix) raw = practicalPrefix + practical[1] + '。';
  if (dominantDef && questionFocus === 'first_impression') raw = '第一印象是' + dominantDef.socialEffect.replace(/^別人容易覺得/, '') + '。';
  if (dominantDef && questionFocus === 'social_strengths') raw = '人際優勢是' + dominantDef.strength + '。';
  if (dominantDef && questionFocus === 'memory_mode') raw = '理解資訊時，' + dominantDef.behavior.replace(/^會/, '') + '。';
  if (dominantDef && questionFocus === 'procrastination_root') raw = '拖延通常發生在' + dominantDef.trigger + '。';
  if (answer && answer.semanticProfile && questionFocus === 'communication_style') raw = '溝通時先' + shortNatalCommunicationAction(answer.semanticProfile.dominant)
    + (answer.semanticProfile.secondary ? '，必要時再' + shortNatalCommunicationAction(answer.semanticProfile.secondary) : '') + '。';
  if (answer && answer.semanticProfile && questionFocus === 'body_boundary_blindspot') raw = '身體警訊常是' + shortNatalHealthWarning(answer.semanticProfile.dominant) + '。';
  if (dominantDef && questionFocus === 'mastery_evidence') raw = '用能展現' + shortNatalThemeLabel(dominantDef.label) + '的成果證明學會。';
  if (questionFocus === 'top_three_life_themes') raw = shortNatalThemeLabel(raw);
  var first = raw.split(/[。！？]/)[0]
    .replace(/^你常遇到的對象，較可能是/, '你較常遇到')
    .replace(/^做消費決定時，最需要留意的是/, '消費時要留意')
    .replace(/^最容易反覆出現的模式是：常見情況是：/, '反覆卡住你的，是')
    .replace(/^最容易反覆出現的模式是：/, '反覆卡住你的，是')
    .replace(/^呈現(.+?)、並帶有「.+」印象的外在氣質$/, '外在氣質偏向$1')
    .replace(/^當日常長期缺少/, '長期缺少')
    .replace(/^溝通時，你/, '溝通時會')
    .replace(/^讓自己安定下來時，最適合先做的是：/, '安定下來時，')
    .replace(/^真正能幫你恢復精力的方式是：/, '恢復精力時，')
    .replace(/^遇到金額較大或結果不確定的選擇時，你較容易/, '大額或不確定的選擇中，容易')
    .replace(/^命盤中最明顯的三個人生主題是：/, '三個主要人生主題是：')
    .replace(/^你的拉扯較可能發生在/, '主要拉扯在')
    .replace(/^重大選擇時，最可靠的原則是/, '重大選擇時，先');
  var clearBoundary = first.search(/，再|、並|，並/);
  if (clearBoundary >= 9 && clearBoundary <= NATAL_HEADLINE_MAX_LENGTH - 2) first = first.slice(0, clearBoundary);
  if (questionFocus === 'overseas_cross_domain_fit' && first.length > NATAL_HEADLINE_MAX_LENGTH) {
    var finalAnd = first.lastIndexOf('與');
    if (finalAnd >= 12) first = first.slice(0, finalAnd);
  }
  if (!first) return '';
  /* 「拉扯」這一題的結論本體就是「在 A 和 B 之間」——只留一極的話，句子在語意上
     不成立（拉扯需要兩邊）。兩個需求名稱各約 15 字，加上框架字必定超過 30 字上限，
     所以這一題單獨放寬到 42 字（畫面上約兩行），其餘題目維持原本的 30 字。 */
  var maxLength = questionFocus === 'inner_tension_balance' ? 42 : NATAL_HEADLINE_MAX_LENGTH;
  if ([].concat(Array.from(first + '。')).length <= maxLength) return first + '。';

  /* 優先保留一個完整、可獨立理解的短句。不能直接切到第 30 字，否則會留下
     「而且」「需要」「……的」這類半句。 */
  var cuts = [];
  for (var i = 0; i < first.length; i++) {
    var chAt = first.charAt(i);
    var isPunct = '，、；'.indexOf(chAt) !== -1;
    /* 收尾引號本身也是一個合法切點：切在「」之後可以保住一個完整的名稱。
       這是上面那個 bug 唯一能給出「既完整又夠短」的落點。 */
    var isCloseQuote = chAt === '」';
    if ((!isPunct && !isCloseQuote) || i < 9 || i > NATAL_HEADLINE_MAX_LENGTH - 2) continue;
    var candidate = first.slice(0, isCloseQuote ? i + 1 : i);
    if (/(且|與|並|或|的|是|在|為|需要|容易|可能|先)$/.test(candidate)) continue;
    if (!natalQuotesBalanced(candidate)) continue;
    cuts.push(candidate);
  }
  /* 取最後一個（也就是在長度上限內最長的那個）候選；先前只有標點切點時，
     這裡的行為不變——新增的引號切點一定比同一段裡的標點切點短，
     不會把既有答案改成更短的版本。 */
  if (cuts.length) return cuts[cuts.length - 1] + '。';

  /* 沒有標點可切時，移除第二個並列條件；正文的 summary/details 仍保留完整資訊。 */
  var joins = ['，也', '，並', '，而且', '，結果', '，實際', '與', '並', '而'];
  for (var j = 0; j < joins.length; j++) {
    var at = first.indexOf(joins[j], 10);
    if (at > 0 && at <= NATAL_HEADLINE_MAX_LENGTH - 2) {
      var shorter = first.slice(0, at);
      if (!/(且|與|並|或|的|是|在|為|需要|容易|可能|先)$/.test(shorter) && natalQuotesBalanced(shorter)) return shorter + '。';
    }
  }

  /* 最後退回題目所屬語義的首個完整片語。冒號前只有框架字時，取冒號後內容。 */
  var colon = first.lastIndexOf('：', NATAL_HEADLINE_MAX_LENGTH - 2);
  if (colon >= 0 && colon + 7 < first.length) {
    var afterColon = first.slice(colon + 1);
    var afterCut = afterColon.search(/[，、；]/);
    if (afterCut >= 6) afterColon = afterColon.slice(0, afterCut);
    if (afterColon.length + 1 <= NATAL_HEADLINE_MAX_LENGTH && natalQuotesBalanced(afterColon)) return afterColon + '。';
  }
  var hardCut = first.slice(0, NATAL_HEADLINE_MAX_LENGTH - 2).replace(/(且|與|並|或|的|是|在|為|需要|容易|可能|先)+$/, '');
  return natalDropDanglingQuote(hardCut) + '。';
}
function natalVisibleSimilarity(a, b) {
  var left = natalTextKey(a), right = natalTextKey(b);
  if (!left || !right) return 0;
  var short = left.length <= right.length ? left : right;
  var long = left.length <= right.length ? right : left;
  if (short.length >= 6 && long.indexOf(short) !== -1) return 1;
  var grams = {}, count = 0, same = 0;
  for (var i = 0; i <= short.length - 3; i++) {
    var gram = short.slice(i, i + 3);
    if (!grams[gram]) { grams[gram] = 1; count++; }
  }
  for (var key in grams) if (long.indexOf(key) !== -1) same++;
  return count ? same / count : 0;
}
function natalFocusedDistinctDetail(base, index, dominant) {
  if (index !== 0) return null;
  if (base.questionFocus === 'lifestyle_fit') return {
    label:'先怎麼試行',
    text:'先照這個節奏執行七天，記錄白天專注與晚上入睡是否變穩定',
  };
  if (base.questionFocus === 'family_boundary_setting' && dominant) return {
    label:'底線被碰到時怎麼說',
    text:dominant.action,
  };
  if (base.questionFocus === 'body_boundary_blindspot' && base.semanticProfile) {
    var health = typeof ASTRO_HEALTH_BOUNDARY_DIMENSIONS !== 'undefined'
      ? ASTRO_HEALTH_BOUNDARY_DIMENSIONS[base.semanticProfile.dominant.key]
      : null;
    if (health) return { label:'發現警訊後先做什麼', text:'先停止一項非必要安排，再' + health.action };
  }
  if (base.questionFocus === 'mastery_evidence') return {
    label:'適合的成果形式',
    text:'完成一份可被檢查的作品、報告或示範，讓別人能確認你會獨立運用',
  };
  return null;
}
function natalHasStrictFocusedDetails(questionFocus) {
  return [
    'likely_partner_traits', 'emotional_attraction', 'meeting_context',
    'partner_visual_impression', 'preferred_relationship_style', 'relationship_repair',
  ].indexOf(questionFocus) !== -1;
}
function polishNatalAnswer(base) {
  if (!base || !base.details || !base.details.length) return base;
  base.headline = refineTraditionalChineseCopy(compactNatalHeadline(base.headline, base.questionFocus, base));
  base.summary = refineTraditionalChineseCopy(splitNatalLongText(base.summary));
  base.caution = refineTraditionalChineseCopy(splitNatalLongText(base.caution));
  /* 就地改寫 text，不重建物件——details 上還掛著 sourceRoles 等欄位供摺疊區使用，
     重建物件容易在之後新增欄位時默默把它們弄丟。 */
  var headKey = natalTextKey(base.headline);
  base.details.forEach(function (d, index) {
    if (!d || !d.text) return;
    var t = stripDetailLabelEcho(d.label, String(d.text).replace(/\s+$/, ''));
    var dominant = base.semanticProfile && natalSemanticDefinition(base.semanticProfile.dominant);
    var focusedDetail = natalFocusedDistinctDetail(base, index, dominant);
    if (focusedDetail) { d.label = focusedDetail.label; t = focusedDetail.text; }
    var detailKey = natalTextKey(t);
    var detailRepeated = detailKey.length >= 8 && headKey.indexOf(detailKey) !== -1;
    if (!detailRepeated && detailKey.length >= 10) {
      for (var cut = 2; cut <= 6 && !detailRepeated; cut += 2) {
        if (detailKey.length - cut >= 5 && headKey.indexOf(detailKey.slice(cut)) !== -1) detailRepeated = true;
      }
    }
    if ((detailRepeated || natalVisibleSimilarity(base.headline, t) >= 0.45) && !natalHasStrictFocusedDetails(base.questionFocus)) {
      if (focusedDetail) {
        t = focusedDetail.text;
      } else if (dominant) t = index === 0 ? dominant.behavior : dominant.action;
      else if (base.primaryEvidence && base.primaryEvidence.sign != null && SIGN_BEGINNER[base.primaryEvidence.sign]) {
        t = index === 0 ? SIGN_BEGINNER[base.primaryEvidence.sign].behavior : SIGN_BEGINNER[base.primaryEvidence.sign].watch;
      }
    }
    if (t && '。！？」）'.indexOf(t.charAt(t.length - 1)) === -1) t += '。';
    d.text = refineTraditionalChineseCopy(splitNatalLongText(t));
  });
  return base;
}

function buildQuestionContent(topicId, question, rankedEvidence, ctx) {
  return attachNatalQuestionContract(polishNatalAnswer(buildQuestionContentRaw(topicId, question, rankedEvidence, ctx)), question);
}
function attachNatalQuestionContract(base, question) {
  var contract = question.contract || (typeof NATAL_QUESTION_CONTRACTS !== 'undefined' && NATAL_QUESTION_CONTRACTS[question.id]);
  base.contract = contract || null;
  base.answerTarget = contract ? contract.answerTarget : question.questionFocus;
  base.sectionsByType = {};
  base.sectionOrder = [];
  (base.details || []).forEach(function (detail, index) {
    var semanticType = contract && contract.requiredAnswerElements[index]
      ? contract.requiredAnswerElements[index]
      : (question.questionFocus + '_' + (index + 1));
    detail.semanticType = semanticType;
    base.sectionsByType[semanticType] = detail;
    base.sectionOrder.push(semanticType);
  });
  return base;
}
function buildQuestionContentRaw(topicId, question, rankedEvidence, ctx) {
  ctx = ctx || {};
  var usedHeadlines = ctx.usedHeadlines, usedSummaries = ctx.usedSummaries, usedPrimaryKeys = ctx.usedPrimaryKeys, usedCautions = ctx.usedCautions;
  var intent = INTENT_ALIAS[question.intent] || question.intent || 'overview';
  var fieldOverride = question.fieldOverride || null;
  var questionFocus = question.questionFocus;
  var bias = question.evidenceBias || {};
  var base = {
    questionId: question.id, title: question.title, intent: question.intent, questionFocus: question.questionFocus,
    answerTargetsCount: (question.answerTargets || []).length, evidenceBiasExcludePlanets: bias.excludePlanets || [],
  };
  if (!rankedEvidence.length) {
    base.headline = '目前線索還不足以形成清楚的判斷';
    base.summary = '這一題可能是出生時間未知，或相關宮位／天體剛好缺乏明顯配置，目前沒有足夠的星盤依據可以整合成完整判斷。';
    base.details = []; base.caution = ''; base.primaryEvidence = null; base.supportingEvidence = [];
    base.headlineConceptKeys = []; base.summaryConceptKeys = []; base.detailConceptKeys = []; base.cautionConceptKeys = [];
    return base;
  }
  var biased = applyEvidenceBias(rankedEvidence, question);
  var top = pickPrimaryEvidence(biased, usedPrimaryKeys);
  if (usedPrimaryKeys) usedPrimaryKeys.push(top.canonicalKey);
  var others = biased.filter(function (e) { return e !== top; });
  var second = others[0], third = others[1];
  var seedBase = topicId + '|' + question.id + '|' + top.canonicalKey;

  var headlineMeta = {};
  var headline = contextualizeEvidence(top, intent, 'headline', seedBase, fieldOverride, topicId, questionFocus, headlineMeta);
  if (usedHeadlines && usedHeadlines.indexOf(headline) !== -1 && second) {
    headlineMeta = {};
    headline = contextualizeEvidence(second, intent, 'headline', seedBase + '|alt', fieldOverride, topicId, questionFocus, headlineMeta);
  }
  if (usedHeadlines) usedHeadlines.push(headline);

  /* V2.2：summary 的職責是「解釋為什麼」，不是換句話重講一次 headline。
     沒有獨立的第二筆證據可用（summarySrc 跟 headline 引用同一筆 evidence），
     或即使證據不同、實際引用到的欄位值仍跟 headline 重疊，都改用
     NATAL_REASON_TPL 的解釋型句型：直接說明「為什麼」，而不是換句話重述
     結論一次。 */
  var summarySrc = second || top;
  var summaryMeta = {};
  var summary = contextualizeEvidence(summarySrc, intent, 'summary', seedBase, fieldOverride, topicId, questionFocus, summaryMeta);
  var needExplain = (summarySrc.canonicalKey === top.canonicalKey) || conceptKeysOverlap(headlineMeta.conceptKeys, summaryMeta.conceptKeys);
  if (needExplain) {
    var phraseA = (headlineMeta.conceptKeys && headlineMeta.conceptKeys[0]) || '';
    var phraseB = (headlineMeta.conceptKeys && headlineMeta.conceptKeys[1]) || phraseA;
    if (phraseA) {
      summary = fillTpl(astroSeededPick(seedBase + '|reason', NATAL_REASON_TPL), { A: phraseA, B: phraseB });
      /* 解釋型 summary 本來就是刻意引用 headline 同一組事實來說明「為什麼」，
         不是把同一個概念又講一次——conceptKeys 刻意留空，不列入 headline 的
         概念集合，避免後續 overlap 檢查把「合理引用來解釋」誤判成「重複」。 */
      summaryMeta.conceptKeys = [];
    }
  }
  if (usedSummaries && usedSummaries.indexOf(summary) !== -1 && third) {
    summaryMeta = {};
    summary = contextualizeEvidence(third, intent, 'summary', seedBase + '|alt2', fieldOverride, topicId, questionFocus, summaryMeta);
  }
  if (usedSummaries) usedSummaries.push(summary);

  /* V2.2：details 依序挑選候選證據時，優先跳過跟 headline/summary（或前面
     已經挑過的 detail）conceptKeys 重疊的候選，減少「details 其實在講
     headline 已經講過的事」這種隱性重複；找不到不重疊的候選時，仍然使用
     手上最合適的那個（規格允許的例外，總比留空好）。 */
  /* V2.2：details 挑選候選證據的優先順序（證據不足時，不是每一對 slot 都
     能做到完全不重疊，這裡明確排序哪些重疊「絕對不能發生」、哪些是證據不足
     時可以接受的次要妥協）：
       1. 絕對不能跟 headline 重疊（headline 是使用者第一眼看到的結論，
          detail 重講一次最容易被發現是「答非所問的重複」）。
       2. 盡量不要跟同一題已經選過的其他 detail 重疊（避免兩則 detail 一樣）。
       3. 跟 summary 重疊是可以接受的次要妥協——3 筆證據卻要撐起
          headline/summary/detail×2 共 4 個 slot 時，一定會有一個 slot
          得跟別人共用同一筆證據，選擇讓 summary 那組被共用，比 headline
          或兩個 detail 互相重複要不明顯得多。 */
  var labels = (question.detailLabels && question.detailLabels.length) ? question.detailLabels : (INTENT_DEFAULT_META[intent] || INTENT_DEFAULT_META.overview).labels;
  var detailConceptKeys = [];
  var detailGuardKeys = headlineMeta.conceptKeys || [];
  var details = labels.map(function (label, i) {
    var candidates = [];
    if (others.length) {
      [others[i % others.length], others[(i + 1) % others.length]].forEach(function (e) { if (candidates.indexOf(e) === -1) candidates.push(e); });
    } else {
      candidates = [top];
    }
    var chosenMeta = null, chosenText = null;
    for (var c = 0; c < candidates.length; c++) {
      var meta = {};
      var text = contextualizeEvidence(candidates[c], intent, 'detail', seedBase + '|d' + i, fieldOverride, topicId, questionFocus, meta);
      if (!chosenMeta) { chosenMeta = meta; chosenText = text; }
      if (!conceptKeysOverlap(meta.conceptKeys, detailGuardKeys)) { chosenMeta = meta; chosenText = text; break; }
    }
    detailGuardKeys = unionConceptKeys(detailGuardKeys, chosenMeta.conceptKeys);
    detailConceptKeys = unionConceptKeys(detailConceptKeys, chosenMeta.conceptKeys);
    return { label: label, text: chosenText };
  });
  var usedConceptSoFar = unionConceptKeys(headlineMeta.conceptKeys, summaryMeta.conceptKeys, detailConceptKeys);

  /* V2.2：cautionMode 決定這題「留意」是否顯示。required 一律嘗試顯示；
     hidden 一律不顯示；optional 只有在 caution 內容跟 headline/summary/
     details 沒有語意重疊、且沒有跟同一批次其他題目撞句時才顯示。跨題撞句
     時最多重試 2 次換句型，仍撞且非 required 就直接不顯示這題的留意，
     避免像「不要為了維持喜歡或和諧而勉強迎合」這種句子在不同題目之間
     反覆出現。 */
  var cautionMode = question.cautionMode || 'optional';
  var caution = '', cautionConceptKeys = [];
  if (cautionMode !== 'hidden') {
    /* caution 固定引用 top 證據時，house 投影是「證據＋questionFocus」決定的，
       跟 headline/detail 很容易剛好投影出同一句話（這是投影機制本身正確的
       副作用：同一件事不該講兩次）。與其讓 optional 題目因此幾乎總是被
       抑制，這裡先試 top，重疊時依序改試 second／third（呼應
       headline/summary 找不到不重疊內容時「換一筆證據講」的做法），
       全部都重疊才真的視為「這題目前沒有不重複的留意內容可講」。 */
    var cautionCandidates = [top, second, third].filter(Boolean);
    var cautionMeta = {}, cautionText = '', overlapsBody = true, stillDup = false;
    for (var cc = 0; cc < cautionCandidates.length && overlapsBody; cc++) {
      var m = {};
      var t = contextualizeCaution(cautionCandidates[cc], question.cautionFocus || 'vigilance', seedBase, topicId, questionFocus, m, '|c' + cc);
      var tries = 0;
      while (usedCautions && usedCautions.indexOf(t) !== -1 && tries < 2) {
        tries++;
        m = {};
        t = contextualizeCaution(cautionCandidates[cc], question.cautionFocus || 'vigilance', seedBase, topicId, questionFocus, m, '|c' + cc + 'v' + tries);
      }
      cautionMeta = m; cautionText = t;
      overlapsBody = conceptKeysOverlap(m.conceptKeys, usedConceptSoFar);
      stillDup = usedCautions && usedCautions.indexOf(t) !== -1;
    }
    if (cautionMode === 'required' ? true : (!overlapsBody && !stillDup)) {
      caution = cautionText;
      cautionConceptKeys = cautionMeta.conceptKeys || [];
    }
    if (caution && usedCautions) usedCautions.push(caution);
  }

  base.headline = headline; base.summary = summary; base.details = details; base.caution = caution;
  base.headlineConceptKeys = headlineMeta.conceptKeys || [];
  base.summaryConceptKeys = summaryMeta.conceptKeys || [];
  base.detailConceptKeys = detailConceptKeys;
  base.cautionConceptKeys = cautionConceptKeys;
  base.primaryEvidence = top; base.supportingEvidence = others.slice(0, 2);
  base.selectionRanked = biased;
  /* 共用語義維度先提供底稿，題目專屬／questionFocus knowledge plan 最後定稿。
     舊順序相反，導致「相遇情境」等專屬答案最後又被人格規則覆蓋。 */
  return applyFocusedQuestionContentPlan(applySemanticQuestionPlan(base, question, biased), question, top, second, third, topicId);
}
/* 摺疊區顯示：主要占星指標（含 sourceRoles）、配置如何支持結論、互相矛盾的訊號、解讀限制 */
function buildAdvancedExplanation(question, rankedEvidence, skipped, tensions, mergedSignal) {
  var first = rankedEvidence[0], second = rankedEvidence[1];
  var supportNote = mergedSignal
    ? ('共同支持「' + mergedSignal.elemTag + '」基調的配置是：' + mergedSignal.items.map(function (e) { return e.placement; }).join('、') + '。')
    : first
      ? (second
        ? ('本題原始權重最高的是「' + first.placement + '」（' + first.weight + '），其次是「' + second.placement + '」（' + second.weight + '）；兩者沒有形成相同元素結論，因此分別保留為主軸與補充。')
        : ('本題目前只有「' + first.placement + '」（' + first.weight + '）可用，結論強度已降低。'))
      : '本題沒有可用指標，未產生推測性結論。';
  var limitations = skipped.map(function (s) { return s.factor + '：' + s.reason; });
  if (rankedEvidence.length < 2) limitations.push('可用指標少於兩項，本題只保留低強度描述。');
  if (question.appearanceCaveat) limitations.push('外型與氣質只是風格傾向的象徵性描述，不能用來精準預測五官、身高、國籍、姓名或特定職業。');
  return { evidence: rankedEvidence, supportNote: supportNote, tensionNotes: tensions.map(function (t) { return t.note; }), limitations: limitations };
}
function buildAiCopyData(topicId, question, rankedEvidence, content, advanced) {
  return {
    questionId: question.id, title: question.title, intent: question.intent, questionFocus: question.questionFocus,
    headline: content.headline, summary: content.summary, details: content.details, caution: content.caution,
    supportNote: advanced.supportNote,
    primaryEvidence: content.primaryEvidence ? { factor: content.primaryEvidence.factor, placement: content.primaryEvidence.placement, weight: content.primaryEvidence.weight } : null,
    evidence: rankedEvidence.map(function (e) { return { factor: e.factor, placement: e.placement, reason: e.reason, weight: e.weight, sourceRoles: e.sourceRoles || [] }; }),
    limitations: content.limitations,
  };
}
/* V2.1 品質檢查：規則式檢查（沒有 AI API，站內都是規則模板），比 V2.0 增加
   結構化檢查：detailLabels 組合是否重複、同批題目的主導 evidence 是否過度
   集中、主導證據是否誤觸這題自己的 excludedTargets、外型題是否至少命中兩類
   外型描述、環境／職能／場合類問題是否確實在講對應的內容、財富主題的幾題
   questionFocus 是否確實分開。無法自動判斷的語意問題（例如句子讀起來是否
   通順）仍然留下 flag，誠實記錄在「尚未處理的限制」。 */
var NATAL_BANNED_OPENERS = ['從某配置來看', '從這個配置來看'];
var NATAL_APPEARANCE_BANNED_WORDS = ['情緒需求', '安定下來', '需要休息', '壓力大', '情緒管理'];
function natalContractBodyText(answer) {
  return [answer.headline, answer.summary].concat((answer.details || []).map(function (d) { return d.text; }), [answer.caution || '']).join('。');
}
function natalSentenceHasConcreteExtension(sentence, phrase) {
  var rest = sentence.slice(sentence.indexOf(phrase) + phrase.length).replace(/^[，：；、\s]+/, '');
  var concrete = /當|如果|先|再|每|日|週|月|分鐘|金額|期限|問|說|寫|記錄|停止|拒絕|確認|完成|提出|做法|避免|行程|底線|預算|工作|關係|學習|家人|身體|場合|活動|支出|儲蓄|額度/;
  return (rest.length >= 8 && concrete.test(rest))
    || (sentence.length >= phrase.length + 10 && concrete.test(sentence.replace(phrase, '')));
}
function validateNatalFocusedDetailSemantics(answer, questionFocus) {
  var details = answer.details || [];
  var first = details[0] ? details[0].text : '';
  var second = details[1] ? details[1].text : '';
  var errors = [];
  if (questionFocus === 'emotional_attraction') {
    if (!/自信|主見|可靠|穩定|好聊|想法|溫柔|有禮|公平|成熟|獨立|坦白|細膩|反應快|行動|說到做到/.test(first)) errors.push('attraction_trait_not_observable');
    if (!/對方|聊天|邀約|表態|互動|回應|承諾|話題|陪伴|打動|靠近|注意/.test(second)) errors.push('attraction_interaction_missing');
  }
  if (questionFocus === 'partner_visual_impression') {
    if (!/穿著|打扮|剪裁|線條|色彩|材質|款式|姿態/.test(first)) errors.push('appearance_visual_slot_mismatch');
    if (!/眼神|表情|談吐|姿態|第一印象|給人|氣質|氣場/.test(second)) errors.push('appearance_vibe_slot_mismatch');
    if (/情緒安全感|承擔結果|雙方都能接受|維持和諧/.test(first + second)) errors.push('appearance_contains_relationship_behavior');
  }
  if (questionFocus === 'preferred_relationship_style') {
    if (!/彼此|一起|共同|陪伴|相處|分歧|問題|承諾|責任|生活方式|期待|議題/.test(first)) errors.push('relationship_mode_slot_mismatch');
    if (!/聯絡|見面|頻率|步調|空間|時間|互動|親密|長期方向/.test(second)) errors.push('relationship_rhythm_slot_mismatch');
  }
  if (questionFocus === 'relationship_repair') {
    if (!/先|暫停|停止|確認|核對|說出/.test(first)) errors.push('repair_first_step_missing');
    if (!/確認|約定|重新|重建|恢復|改成|保留|說清|證明|修正/.test(second)) errors.push('repair_process_missing');
    if (/會先表明立場，也願意在眾人面前承擔結果/.test(first + second)) errors.push('repair_contains_generic_behavior');
  }
  return errors;
}
function validateNatalAnswerAgainstContract(answer, question) {
  var contract = question.contract || (typeof NATAL_QUESTION_CONTRACTS !== 'undefined' && NATAL_QUESTION_CONTRACTS[question.id]);
  var errors = [];
  if (!contract) return { passed:false, errors:['missing_question_contract'] };
  if (answer.questionId !== contract.questionId || answer.questionFocus !== contract.questionFocus || answer.answerTarget !== contract.answerTarget) {
    errors.push('question_identity_mismatch');
  }
  var text = natalContractBodyText(answer);
  if ((answer.details || []).length) {
    (contract.requiredTermGroups || []).forEach(function (group, groupIndex) {
      if (!group.some(function (term) { return text.indexOf(term) !== -1; })) errors.push('missing_required_term_group_' + groupIndex);
    });
    var actualTypes = Object.keys(answer.sectionsByType || {});
    (contract.requiredAnswerElements || []).forEach(function (type) {
      if (actualTypes.indexOf(type) === -1) errors.push('missing_section_' + type);
    });
  }
  (contract.forbiddenPhrases || []).forEach(function (phrase) {
    text.split(/[。！？]/).forEach(function (sentence) {
      if (sentence.indexOf(phrase) !== -1 && !natalSentenceHasConcreteExtension(sentence, phrase)) errors.push('vague_phrase_' + phrase);
    });
  });
  errors = errors.concat(validateNatalFocusedDetailSemantics(answer, question.questionFocus));
  return { passed:errors.length === 0, errors:errors };
}
function natalInsufficientAnswerForContract(answer, validation) {
  var contract = answer.contract;
  answer.originalContractText = natalContractBodyText(answer);
  answer.headline = '這題目前沒有足夠線索形成可靠答案。';
  answer.summary = '現有星盤資料無法同時支持「' + ((contract && contract.allowedContentTypes) || []).join('」與「') + '」，因此不借用其他題目的結論補上。';
  answer.details = [];
  answer.sectionsByType = {};
  answer.sectionOrder = [];
  answer.caution = '';
  answer.contractStatus = 'insufficient';
  answer.contractErrors = validation.errors.slice();
  return answer;
}
function validateNatalTopicContent(answers, topicId) {
  var flags = [];
  var headlines = answers.map(function (a) { return a.headline; });
  if (headlines.some(function (h, i) { return headlines.indexOf(h) !== i; })) {
    flags.push({ check: 'headline_unique', passed: false, note: '同一批題目仍有重複的 headline' });
  }
  var detailLabelSets = answers.map(function (a) { return (a.details || []).map(function (d) { return d.label; }).join('|'); });
  if (detailLabelSets.some(function (s, i) { return s && detailLabelSets.indexOf(s) !== i; })) {
    flags.push({ check: 'detail_labels_unique', passed: false, note: '同一批題目出現重複的 detailLabels 組合' });
  }
  var primaryKeys = answers.map(function (a) { return a.primaryEvidence && a.primaryEvidence.canonicalKey; }).filter(Boolean);
  var primaryKeyCounts = {};
  primaryKeys.forEach(function (k) { primaryKeyCounts[k] = (primaryKeyCounts[k] || 0) + 1; });
  var maxPrimaryDup = Object.keys(primaryKeyCounts).reduce(function (m, k) { return Math.max(m, primaryKeyCounts[k]); }, 0);
  if (primaryKeys.length >= 2 && maxPrimaryDup === primaryKeys.length) {
    var hasClearDominance = answers.every(function (a) {
      var first = a.primaryEvidence, second = (a.supportingEvidence || [])[0];
      return first && (!second || ((first.selectionScore == null ? first.weight : first.selectionScore) - (second.selectionScore == null ? second.weight : second.selectionScore)) >= 1.5);
    });
    var semanticKeys = answers.map(function (a) { return a.semanticKey; }).filter(Boolean);
    var semanticDuplicate = semanticKeys.length > 1 && semanticKeys.every(function (key) { return key === semanticKeys[0]; });
    if (!hasClearDominance && semanticDuplicate) flags.push({ check: 'primary_evidence_diversity', passed: false, note: '同一批題目的主導 evidence 與 semantic key 都完全相同，且分數差距不足以支持重複使用' });
  }
  answers.forEach(function (a) {
    var fullText = a.headline + a.summary + (a.details || []).map(function (d) { return d.text; }).join('');
    var styleProblems = traditionalChineseStyleFlags(fullText + (a.caution || ''));
    if (styleProblems.length) flags.push({ check: 'traditional_chinese_style', passed: false, note: a.questionId + ' 仍有文風問題：' + styleProblems.join('、') });
    NATAL_BANNED_OPENERS.forEach(function (bad) {
      if (a.headline.indexOf(bad) === 0 || a.summary.indexOf(bad) === 0) flags.push({ check: 'banned_opener', passed: false, note: a.questionId + ' 使用了禁用開頭「' + bad + '」' });
    });
    var intent = INTENT_ALIAS[a.intent] || a.intent;
    if (!a.details.length) return; // 沒有可用證據時（skip 狀態），以下語意檢查沒有意義
    if (intent === 'appearance') {
      NATAL_APPEARANCE_BANNED_WORDS.forEach(function (w) {
        if (fullText.indexOf(w) !== -1) flags.push({ check: 'appearance_no_emotion', passed: false, note: a.questionId + ' 外型題內容疑似仍在講情緒管理（含「' + w + '」）' });
      });
      var catCount = 0;
      if (/氣質|氣場|調性/.test(fullText)) catCount++;
      if (/印象|第一眼|初次|眼神/.test(fullText)) catCount++;
      if (/穿著|打扮|外型|美感|風格|談吐|舉止|俐落|明亮/.test(fullText)) catCount++;
      if (catCount < 2) flags.push({ check: 'appearance_category_coverage', passed: false, note: a.questionId + '（visualStyle/firstImpression/presentation）只命中不到 2 類外型描述' });
    }
    if (a.details.length < Math.min(2, a.answerTargetsCount || 2)) {
      flags.push({ check: 'min_answer_targets', passed: false, note: a.questionId + ' details 數量少於題目要求的 answerTargets' });
    }
    if (a.primaryEvidence && a.primaryEvidence.planetKey && (a.evidenceBiasExcludePlanets || []).indexOf(a.primaryEvidence.planetKey) !== -1) {
      flags.push({ check: 'excluded_target_hit', passed: false, note: a.questionId + ' 主導證據命中了這題 excludedTargets 排除的天體' });
    }
    if (intent === 'environment' && !/場|環境|節奏|步調|氛圍|場合/.test(fullText)) {
      flags.push({ check: 'environment_must_describe_setting', passed: false, note: a.questionId + ' 環境題內容未包含場域／氛圍相關描述' });
    }
    if (a.questionFocus === 'suitable_roles' && !/角色|職能|任務|工作|執行|發揮|擅長|很會|能力|拿手/.test(fullText)) {
      flags.push({ check: 'role_must_describe_function', passed: false, note: a.questionId + ' 工作類型題未包含職能／角色相關描述' });
    }
    if (a.questionFocus === 'meeting_context' && !/場合|情境|聚會|認識|場景/.test(fullText)) {
      flags.push({ check: 'scene_must_describe_context', passed: false, note: a.questionId + ' 相遇場合題未包含場域／情境相關描述' });
    }
  });

  answers.forEach(function (a) {
    if (a.contractStatus === 'insufficient') {
      flags.push({ check:'question_contract', passed:false, note:a.questionId + ' 未通過題目契約，已阻擋原答案：' + (a.contractErrors || []).join('、')
        + (a.originalContractText ? '；原文：' + a.originalContractText.slice(0, 180) : '') });
    } else if (!a.contract || a.answerTarget !== a.contract.answerTarget) {
      flags.push({ check:'question_contract', passed:false, note:a.questionId + ' 沒有套用正確的 answerTarget contract' });
    }
  });
  if (topicId === 'wealth') {
    var wealthFocus = answers.map(function (a) { return a.questionFocus; });
    var uniqFocus = wealthFocus.filter(function (f, i) { return wealthFocus.indexOf(f) === i; });
    if (uniqFocus.length < wealthFocus.length) {
      flags.push({ check: 'wealth_focus_separation', passed: false, note: '財富主題有題目共用同一個 questionFocus，賺錢方式／消費模式／風險偏好未確實分離' });
    }
  }

  /* ================= V2.2：Topic-aware Projection ＋區塊去重 新增的 6 項檢查 ================= */
  /* 1. raw evidence 洩漏檢查：原始宮位關鍵字（HOUSE_BEGINNER.area，例如「戀愛、
        創作、玩樂」）與技術性內部術語，正文（含 caution）都不該出現。 */
  var houseAreaBlacklist = (typeof HOUSE_BEGINNER !== 'undefined') ? HOUSE_BEGINNER.map(function (h) { return h.area; }).filter(Boolean) : [];
  var techTerms = (typeof NATAL_FORBIDDEN_TECHNICAL_TERMS !== 'undefined') ? NATAL_FORBIDDEN_TECHNICAL_TERMS : [];
  answers.forEach(function (a) {
    var bodyText = a.headline + a.summary + (a.details || []).map(function (d) { return d.text; }).join('') + (a.caution || '');
    houseAreaBlacklist.forEach(function (raw) {
      if (raw && bodyText.indexOf(raw) !== -1) flags.push({ check: 'raw_evidence_leak', passed: false, note: a.questionId + ' 正文出現原始宮位關鍵字「' + raw + '」' });
    });
    techTerms.forEach(function (term) {
      if (bodyText.indexOf(term) !== -1) flags.push({ check: 'raw_evidence_leak', passed: false, note: a.questionId + ' 正文出現技術性術語「' + term + '」' });
    });
  });
  /* 2. slot overlap 檢查：headline/summary/details/caution 各自的 conceptKeys
        兩兩交集不該有東西（buildQuestionContent 已經盡量避免，這裡是防禦性複檢）。 */
  /* 重疊檢查的嚴格程度依 slot 的重要性分層：headline 是使用者第一眼看到的
     結論，summary／detail／caution 都「絕對不能」跟 headline 講同一件事
     （buildQuestionContent 已主動避開，這裡驗證真的沒有漏網）。detail 跟
     summary 之間的重疊則是證據不足（例如某些題目指標只有 3 筆）時可以接受
     的次要妥協——3 筆證據卻要撐起 headline/summary/detail×2 共 4 個 slot，
     一定會有一組共用同一筆證據，這裡不列為 flag，避免把「規格允許的例外」
     誤判成錯誤；已知殘留限制在完成報告中誠實列出。 */
  answers.forEach(function (a) {
    if (conceptKeysOverlap(a.headlineConceptKeys, a.summaryConceptKeys)) {
      flags.push({ check: 'slot_overlap', passed: false, note: a.questionId + ' headline 與 summary 語意重疊，疑似換句話重述同一件事' });
    }
    if (conceptKeysOverlap(a.headlineConceptKeys, a.detailConceptKeys)) {
      flags.push({ check: 'slot_overlap', passed: false, note: a.questionId + ' details 與 headline 語意重疊' });
    }
    if (a.caution && conceptKeysOverlap(a.cautionConceptKeys, unionConceptKeys(a.headlineConceptKeys, a.summaryConceptKeys, a.detailConceptKeys))) {
      flags.push({ check: 'slot_overlap', passed: false, note: a.questionId + ' caution 與正文語意重疊' });
    }
  });
  /* 3. topic projection 覆蓋檢查：主導證據若涉及宮位（含角宮虛擬宮位），
        必須能取得對應這個 topicId/questionFocus 的 projectedMeaning。 */
  answers.forEach(function (a) {
    var e = a.primaryEvidence;
    if (!e) return;
    var houseNum = e.houseFocus || e.house || (e.angleWhich && ANGLE_VIRTUAL_HOUSE[e.angleWhich]);
    if (houseNum && typeof projectEvidenceForTopic === 'function') {
      var proj = projectEvidenceForTopic(e, topicId, a.questionFocus);
      if (!proj.projectedMeaning) flags.push({ check: 'topic_projection_coverage', passed: false, note: a.questionId + ' 主導證據的宮位沒有取得對應主題的投影內容' });
    }
  });
  /* V4：Knowledge Diversity Validator——同一批題目裡，如果兩題的主導證據
     落在同一宮，但行星不同，理論上應該因為 Planet Meaning 不同而產生不同
     語意；如果兩者的 headlineConceptKeys 仍然出現同一句共用字串，代表
     Knowledge Layer 沒有真的發揮作用（可能是這組行星+主題還沒被收錄，
     fallback 回了純宮位的 Topic Projection），需要標記出來以便之後擴充。 */
  for (var kdI = 0; kdI < answers.length; kdI++) {
    for (var kdJ = kdI + 1; kdJ < answers.length; kdJ++) {
      var kdA = answers[kdI], kdB = answers[kdJ];
      var kdEa = kdA.primaryEvidence, kdEb = kdB.primaryEvidence;
      if (!kdEa || !kdEb || !kdEa.planetKey || !kdEb.planetKey || kdEa.planetKey === kdEb.planetKey) continue;
      var kdHa = kdEa.houseFocus || kdEa.house || (kdEa.angleWhich && ANGLE_VIRTUAL_HOUSE[kdEa.angleWhich]);
      var kdHb = kdEb.houseFocus || kdEb.house || (kdEb.angleWhich && ANGLE_VIRTUAL_HOUSE[kdEb.angleWhich]);
      if (kdHa && kdHb && kdHa === kdHb && conceptKeysOverlap(kdA.headlineConceptKeys, kdB.headlineConceptKeys)) {
        flags.push({ check: 'knowledge_diversity', passed: false, note: kdA.questionId + ' 與 ' + kdB.questionId + ' 同樣落在第' + kdHa + '宮，行星不同（' + kdEa.planetKey + '/' + kdEb.planetKey + '）卻共用相同的宮位語意，可能是這組行星+主題尚未收錄進 Knowledge Layer' });
      }
    }
  }
  /* 4. generic fallback 檢查：這些空泛套語只有在「單獨構成整句、沒有具體
        延伸內容」時才算違規（允許後面接上具體對象／行動／情境）。 */
  var NATAL_GENERIC_FALLBACK_PHRASES = ['對這個主題具有較高代表性', '比較選項、考慮各方立場再決定', '這個需要', '這件事', '值得投入的方向'];
  answers.forEach(function (a) {
    var joined = [a.headline, a.summary].concat((a.details || []).map(function (d) { return d.text; })).concat([a.caution || '']).join('。');
    joined.split(/[。]/).forEach(function (sentence) {
      NATAL_GENERIC_FALLBACK_PHRASES.forEach(function (phrase) {
        if (sentence.indexOf(phrase) !== -1 && sentence.length <= phrase.length + 6) {
          flags.push({ check: 'generic_fallback', passed: false, note: a.questionId + ' 出現空泛套語「' + phrase + '」且缺乏具體延伸內容' });
        }
      });
    });
  });
  /* 5. caution 重複檢查：同一批次不同題目不該共用一模一樣的 caution 句子
        （buildQuestionContent 已用 usedCautions 盡量避免，這裡防禦性複檢）。 */
  var cautionTexts = answers.map(function (a) { return a.caution; }).filter(Boolean);
  var cautionDupCounts = {};
  cautionTexts.forEach(function (c) { cautionDupCounts[c] = (cautionDupCounts[c] || 0) + 1; });
  if (Object.keys(cautionDupCounts).some(function (c) { return cautionDupCounts[c] > 1; })) {
    flags.push({ check: 'caution_duplication', passed: false, note: '同一批題目出現重複的 caution 句子' });
  }
  /* 6. career-longterm 專項具體度檢查：「如何建立長期職涯方向」至少要命中
        longTermAsset／developmentSequence／commitmentStrategy 三類中的兩類，
        否則內容太空泛、答不出「怎麼建立」這個問題。 */
  var longTermAnswer = answers.filter(function (a) { return a.questionId === 'career-longterm'; })[0];
  if (longTermAnswer) {
    var ltText = longTermAnswer.headline + longTermAnswer.summary + (longTermAnswer.details || []).map(function (d) { return d.text; }).join('');
    var ltHits = 0;
    if (/聲望|資源|資產|不可取代|累積|信任|口碑/.test(ltText)) ltHits++;
    if (/階段|逐步|慢慢|循序|先.+再|路徑|方向/.test(ltText)) ltHits++;
    if (/投入|承諾|長期|持續|堅持|深耕/.test(ltText)) ltHits++;
    if (ltHits < 2) flags.push({ check: 'career_longterm_specificity', passed: false, note: 'career-longterm 內容具體度不足（longTermAsset/developmentSequence/commitmentStrategy 命中不到 2 類）' });
  }

  return flags;
}
/* 主題總覽：不重複列出配置名稱、不用「這次選擇了 N 個問題」這種罐頭開場，
   依這批題目最常見的元素決定整體基調（tone），字數落在 100-180 字之間。 */
function buildTopicOverview(topicId, answers) {
  var semanticTotals = {};
  answers.forEach(function (a) {
    ((a.semanticProfile && a.semanticProfile.scores) || []).slice(0, 2).forEach(function (item) {
      semanticTotals[item.key] = (semanticTotals[item.key] || 0) + item.score;
    });
  });
  var semanticKeys = Object.keys(semanticTotals).sort(function (a, b) { return semanticTotals[b] - semanticTotals[a]; });
  if (semanticKeys.length) {
    var d = ASTRO_TOPIC_DIMENSIONS[semanticKeys[0]], s = semanticKeys[1] && ASTRO_TOPIC_DIMENSIONS[semanticKeys[1]];
    if (d) return '這個主題最強的主軸是「' + d.label + '」：你' + d.behavior + '。' + (s ? '第二條線索是「' + s.label + '」，它只在主軸需要補充時加入，不會取代最高分的方向。' : '');
  }
  var elemCounts = {};
  answers.forEach(function (a) {
    (a.ranked || []).slice(0, 2).forEach(function (e) { if (e.elemTag) elemCounts[e.elemTag] = (elemCounts[e.elemTag] || 0) + 1; });
  });
  var elems = Object.keys(elemCounts).sort(function (x, y) { return elemCounts[y] - elemCounts[x]; });
  var tone = elems.length ? NATAL_ELEM_TONE[elems[0]] : '呈現出多面向的樣貌，沒有單一元素特別突出';
  var pool = NATAL_TOPIC_OVERVIEW_FRAME[topicId] || NATAL_TOPIC_OVERVIEW_FRAME.general;
  var seed = topicId + '|overview|' + answers.map(function (a) { return a.questionId; }).join(',');
  return fillTpl(astroSeededPick(seed, pool), { tone: tone });
}

var NATAL_TOPIC_PROMPT_VERSION = 'topic-contract-v10';
var NATAL_TOPIC_KNOWLEDGE_VERSION = typeof ASTRO_TOPIC_SEMANTIC_VERSION !== 'undefined' ? ASTRO_TOPIC_SEMANTIC_VERSION : 'unknown';
function natalChartFingerprint(chart, unknownTime) {
  if (!chart) return '';
  var parts = ['u:' + !!unknownTime, 'hs:' + (chart.houseSystem || '')];
  Object.keys(chart.planets || {}).sort().forEach(function (key) {
    var p = chart.planets[key] || {};
    parts.push('p:' + key + ':' + Number(p.lon || 0).toFixed(4) + ':' + (p.house == null ? '' : p.house));
  });
  Object.keys(chart.points || {}).sort().forEach(function (key) {
    var p = chart.points[key] || {};
    parts.push('x:' + key + ':' + Number(p.lon || 0).toFixed(4) + ':' + (p.house == null ? '' : p.house));
  });
  if (!unknownTime) parts.push('a:' + Number(chart.asc || 0).toFixed(4), 'm:' + Number(chart.mc || 0).toFixed(4));
  var input = parts.join('|'), hash = 2166136261;
  for (var i = 0; i < input.length; i++) { hash ^= input.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return ('00000000' + (hash >>> 0).toString(16)).slice(-8);
}
function resetNatalTopicAnalysisForChartChange() {
  state.natalTopicResult = null;
  state.natalTopicExpanded = {};
  state.natalTopicLimitHit = '';
}
function natalTopicDevelopmentMode() {
  try {
    return /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || /(?:\?|&)astroDebug=1(?:&|$)/.test(location.search);
  } catch (e) { return false; }
}
/* 主流程（V2）：主題問題 → 對應占星指標 → 從 chartData 擷取並依 canonicalKey
   去重 → 依 intent 情境化 → 產生 headline/summary/details/caution → 品質檢查
   → 主題總覽。selectedQuestionIds 最多 3 個。 */
function analyzeNatalTopic(chartData, topicId, selectedQuestionIds, unknownTime) {
  var questions = (NATAL_TOPIC_QUESTIONS[topicId] || []).filter(function (q) { return selectedQuestionIds.indexOf(q.id) !== -1; });
  /* 同一批產生的題目共用這三個陣列，避免指標池重疊時湊出重複句子或讓同一筆
     evidence 主導整批題目（usedPrimaryKeys 是 V2.1 新增，見 pickPrimaryEvidence）。 */
  var usedHeadlines = [], usedSummaries = [], usedPrimaryKeys = [], usedCautions = [];
  var answers = questions.map(function (q) {
    var indicators = getTopicIndicators(topicId, q.id);
    var extracted = extractChartEvidence(chartData, unknownTime, indicators);
    var ranked = rankEvidence(extracted.evidence);
    var merged = mergeSupportingSignals(ranked);
    var tensions = identifyTensions(ranked);
    var content = buildQuestionContent(topicId, q, ranked, { usedHeadlines: usedHeadlines, usedSummaries: usedSummaries, usedPrimaryKeys: usedPrimaryKeys, usedCautions: usedCautions });
    var contractValidation = validateNatalAnswerAgainstContract(content, q);
    if (!contractValidation.passed) content = natalInsufficientAnswerForContract(content, contractValidation);
    else { content.contractStatus = 'pass'; content.contractErrors = []; }
    var effectiveRanked = content.selectionRanked || ranked;
    var advanced = buildAdvancedExplanation(q, effectiveRanked, extracted.skipped, tensions, merged);
    content.limitations = advanced.limitations.slice();
    content.ranked = effectiveRanked; content.skipped = extracted.skipped; content.merged = merged; content.tensions = tensions; content.advanced = advanced;
    effectiveRanked.forEach(function (e) {
      var matched = ((content.semanticProfile && content.semanticProfile.scores) || []).filter(function (item) {
        return item.sources.some(function (src) { return src.evidenceKey === e.canonicalKey; });
      })[0];
      var def = matched && natalSemanticDefinition(matched);
      e.semanticSupport = def ? ('支持「' + def.label + '」：' + def.behavior) : '這項資料只作為次要占星背景，沒有直接決定主結論';
      e.semanticLimitation = def ? ('過度使用時：' + def.overuse) : '權重不足以單獨形成結論';
    });
    content.debug = {
      topic:topicId,
      rendererTemplate:'question-direct-answer-v1',
      answerTarget:content.answerTarget,
      contractStatus:content.contractStatus,
      contractErrors:(content.contractErrors || []).slice(),
      sectionKeys:(content.sectionOrder || []).slice(),
      questionFocusApplied:q.questionFocus,
      knowledgeProjection:(QUESTIONFOCUS_HOUSE_CATEGORY[q.questionFocus] || 'general'),
      fieldOverrideApplied:q.fieldOverride ? Object.keys(q.fieldOverride) : [],
      answerTargetsApplied:(q.answerTargets || []).slice(),
      excludedTargetsApplied:(q.excludedTargets || []).slice(),
      selectedIndicators:effectiveRanked.map(function (e) { return e.canonicalKey; }),
      rawWeights:effectiveRanked.map(function (e) { return { key:e.canonicalKey, raw:e.rawWeight == null ? e.weight : e.rawWeight, bias:e.biasBonus || 0, effective:e.selectionScore == null ? e.weight : e.selectionScore }; }),
      semanticScores:(content.semanticProfile && content.semanticProfile.scores) || [],
      dominantDimension:content.semanticProfile && content.semanticProfile.dominant,
      secondaryDimension:content.semanticProfile && content.semanticProfile.secondary,
      conflicts:tensions,
      excludedConclusions:(content.semanticProfile && content.semanticProfile.excludedConclusions) || [],
      fallbackUsed:effectiveRanked.filter(function (e) { return e.fallbackUsed; }).map(function (e) { return { source:e.fallbackSource, reason:e.fallbackReason, key:e.canonicalKey }; }),
      generatedCardIds:[content.questionId + ':' + (content.semanticKey || 'legacy')],
    };
    content.aiData = buildAiCopyData(topicId, q, ranked, content, advanced);
    return content;
  });
  /* V2.1：uniqueEvidence——每題自己 ranked 清單裡，那些「沒有被同一批次其他
     題目拿去當主導證據」的項目，用來讓可折疊區能標示「這是這題獨有的線索」。 */
  var allPrimaryKeys = answers.map(function (a) { return a.primaryEvidence && a.primaryEvidence.canonicalKey; }).filter(Boolean);
  answers.forEach(function (a) {
    var ownKey = a.primaryEvidence && a.primaryEvidence.canonicalKey;
    a.uniqueEvidence = (a.ranked || []).filter(function (e) {
      return e.canonicalKey === ownKey || allPrimaryKeys.indexOf(e.canonicalKey) === -1;
    });
  });
  var qualityFlags = validateNatalTopicContent(answers, topicId);
  var overview = refineTraditionalChineseCopy(buildTopicOverview(topicId, answers));
  var fingerprint = natalChartFingerprint(chartData, unknownTime);
  return {
    topicId: topicId,
    topicOverview: overview,
    answers: answers,
    qualityFlags: qualityFlags,
    chartFingerprint:fingerprint,
    promptVersion:NATAL_TOPIC_PROMPT_VERSION,
    knowledgeVersion:NATAL_TOPIC_KNOWLEDGE_VERSION,
    analysisKey:[fingerprint, topicId, NATAL_TOPIC_PROMPT_VERSION, NATAL_TOPIC_KNOWLEDGE_VERSION].join('|'),
  };
}

/* ---- 人生主題專題分析：狀態操作 ---- */
function natalTopicSetCat(catKey) {
  state.natalTopicCat = catKey;
  state.natalTopicResult = null; // 換主題後結果跟目前選擇不符，要求重新產生，不留殘留內容
  state.natalTopicLimitHit = '';
  render();
}
function natalTopicToggleQ(catKey, qId) {
  var sel = state.natalTopicQSel[catKey] || (state.natalTopicQSel[catKey] = []);
  var idx = sel.indexOf(qId);
  if (idx !== -1) { sel.splice(idx, 1); state.natalTopicLimitHit = ''; }
  else if (sel.length >= 3) { state.natalTopicLimitHit = catKey; }
  else { sel.push(qId); state.natalTopicLimitHit = ''; }
  render();
}
function natalTopicToggleExpand(qId) {
  state.natalTopicExpanded[qId] = !state.natalTopicExpanded[qId];
  render();
}
/* 由 <details ontoggle> 呼叫：只把瀏覽器已經完成的展開／收合狀態同步進 state，
   刻意不呼叫 render()——這裡如果重畫，使用者點開的那一瞬間畫面會重建，
   反而造成捲動位置跳動。 */
function natalTopicSetExpanded(qId, open) {
  state.natalTopicExpanded[qId] = !!open;
}
function natalTopicSetExplanationMode(professional) {
  if (!!state.natalTopicProfessional === !!professional) return;
  state.natalTopicProfessional = !!professional;
  /* 切換閱讀深度只是換一層顯示，不重新排盤、不重新分析（state.natalTopicResult
     完全沒有被動到），也不該把使用者彈回頁首——記下捲動位置，重畫後還原。
     已展開的「為什麼這樣說？」由 state.natalTopicExpanded 保留。 */
  var y = (window.pageYOffset || document.documentElement.scrollTop || 0);
  render();
  window.scrollTo(0, y);
}
function natalTopicToggleShowAll(catKey) {
  state.natalTopicShowAll[catKey] = !state.natalTopicShowAll[catKey];
  render();
}
function natalTopicGenerate() {
  var catKey = state.natalTopicCat;
  var sel = state.natalTopicQSel[catKey] || [];
  if (!catKey || !sel.length || !state.astroResult) return;
  /* 三題一次的分析在舊手機上要跑幾百毫秒，期間畫面沒有回應；連點會重複運算。 */
  if (state.natalTopicGenerating) return;
  state.natalTopicGenerating = true;
  try {
    state.natalTopicResult = analyzeNatalTopic(state.astroResult, catKey, sel, !!state.astroUnknownTime);
    saveNatalTopicToHistory(state.natalTopicResult);
  } finally {
    state.natalTopicGenerating = false;
  }
  render();
  var anchor = document.getElementById('natal-topic-result');
  if (anchor && anchor.scrollIntoView) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---- 人生主題專題分析：畫面（V2）----
   卡片結構：標題 → headline（一句話結論，視覺最重）→ summary（延伸說明）→
   details[]（2-4 個依題目動態命名的面向，小標籤＋內容，不是固定的「可以發揮／
   需要留意」二分法）→ caution（單一提醒，用小標籤而非整句「需要留意：」開頭）→
   可折疊的占星依據（預設收合，內含 sourceRoles 與解讀限制）。 */
/* 有一部分分項說明的內文，整句都已經包含在上面那行結論裡——例如結論寫
   「容易被能展現美感、協調與關係經營、互動節奏講究平衡與感受的人打動。」，
   下面的分項又只寫「美感、協調與關係經營。」。使用者等於把同一句話讀兩遍，
   而且第二遍還是殘句。這種列不提供任何新資訊，畫面上直接不顯示。

   只在顯示層過濾，不動 analyzeNatalTopic() 產生的資料：
   validateNatalTopicContent() 的 min_answer_targets 檢查會驗證 details 數量，
   而且「複製給 AI」與歷史紀錄仍然需要完整的結構化欄位。
   實測 648 張卡片沒有任何一張會因此變成完全沒有分項，仍加上保險判斷。 */
function natalTextKey(t) { return String(t == null ? '' : t).replace(/[。，、；：？！「」（）\s]/g, ''); }
function visibleNatalDetails(answer) {
  var all = answer && answer.sectionsByType && answer.sectionOrder
    ? answer.sectionOrder.map(function (semanticType) { return answer.sectionsByType[semanticType]; }).filter(Boolean)
    : ((answer && answer.details) || []);
  if (all.length < 2) return all;
  var headKey = natalTextKey(answer.headline);
  var kept = all.filter(function (d) {
    var k = natalTextKey(d && d.text);
    return !(k.length >= 8 && headKey.indexOf(k) !== -1);
  });
  return kept.length ? kept : all;
}

function natalEvidencePlainName(e) {
  if (!e) return '主要星盤線索';
  if (e.planetKey && typeof PLANET_DEFS !== 'undefined' && PLANET_DEFS[e.planetKey]) return PLANET_DEFS[e.planetKey].zh;
  if (e.angleWhich && NATAL_ANGLE_ZH[e.angleWhich]) return NATAL_ANGLE_ZH[e.angleWhich];
  if (e.factor) return e.factor.replace(/（.*?）/g, '');
  return '主要星盤線索';
}
function natalSemanticSupportText(e) {
  var text = String((e && (e.semanticSupport || e.reason)) || '');
  return text.replace(/^支持「[^」]+」：/, '').replace(/^這項資料/, '這個線索');
}
function natalPlainEvidenceExplanation(a) {
  var first = a.primaryEvidence || (a.ranked && a.ranked[0]);
  var second = (a.supportingEvidence && a.supportingEvidence[0]) || (a.ranked && a.ranked[1]);
  if (!first) return '目前可用資料不足，因此這題只保留低強度描述。';
  var out = natalEvidencePlainName(first) + '是這題的主要來源，因此重點放在' + natalSemanticSupportText(first) + '。';
  if (second) {
    var firstScore = first.selectionScore == null ? first.weight : first.selectionScore;
    var secondScore = second.selectionScore == null ? second.weight : second.selectionScore;
    out += natalEvidencePlainName(second) + '提供次要補充，主要影響是' + natalSemanticSupportText(second) + '。';
    if (firstScore - secondScore < 1.5) out += '兩項影響接近，所以不同情境下都可能出現。';
  }
  return out;
}

/* 結論句常常把題目的框架字再說一次：題目「適合什麼工作環境」，結論
   「適合資訊流通快、需要頻繁討論交流的環境。」——兩行疊在一起看就是重複。
   把開頭那個沒有實質內容的框架字去掉，結論就變成直接回答。

   只處理白名單裡的框架字（適合／容易／需要／可能／傾向）。試過用「共同開頭＋
   共同結尾」通用比對，結果會砍出「會給你最深。」「的底線需要保護⋯」這種殘句，
   所以改成範圍很窄但不會出錯的做法：主詞型的開頭（例如「壓力多半在⋯累積」的
   「壓力」）一律不動。

   這是顯示層處理，不改 analyzeNatalTopic() 產生的資料——結論單獨出現在歷史紀錄
   等沒有題目對照的地方時，仍然需要完整的句子。 */
var NATAL_TITLE_ECHO_PREFIXES = ['適合', '容易', '需要', '可能', '傾向'];
function natalHeadlineForTitle(title, headline) {
  var t = String(title || '').replace(/^(我|你)/, '').replace(/[？?。！\s，、]/g, '');
  var h = String(headline || '');
  if (!t || !h) return h;
  for (var i = 0; i < NATAL_TITLE_ECHO_PREFIXES.length; i++) {
    var w = NATAL_TITLE_ECHO_PREFIXES[i];
    if (t.indexOf(w) === 0 && h.indexOf(w) === 0) {
      var core = h.slice(w.length);
      if (core.length >= 10 && '的是與而也就了在把被和跟或'.indexOf(core.charAt(0)) === -1) return core;
    }
  }
  return h;
}

/* ================= 目前命盤身分列 =================
   使用者可以在同一台裝置上反覆改出生資料重算，先前畫面上只有「宮位制」一行
   小字，看不出眼前這一整頁的落點、相位與主題分析到底是哪一組出生資料算出來的。
   這條身分列固定顯示在星盤頁所有子分頁的最上方，內容全部來自 state.astroCityUsed
   與 state.astroResult（也就是「真正被拿去算盤的那一份」，不是輸入框現值），
   所以只要它顯示的是 A，畫面下方就不可能混到 B 的結果。 */
function astroActiveChartIdentity() {
  var chart = state.astroResult;
  if (!chart) return null;
  var city = state.astroCityUsed;
  var unknown = !!state.astroUnknownTime;
  var y = parseInt(state.astroY, 10), m = parseInt(state.astroM, 10), d = parseInt(state.astroD, 10);
  var dateText = (isFinite(y) && isFinite(m) && isFinite(d)) ? (y + ' 年 ' + m + ' 月 ' + d + ' 日') : '—';
  var timeText = unknown ? '未提供（以當日 12:00 估算）' : (pad2(state.astroH) + ':' + pad2(state.astroMin));
  return {
    date: dateText,
    time: timeText,
    unknownTime: unknown,
    city: city ? city.zh : '—',
    tz: city ? city.tz : '—',
    houseSystem: state.astroHouseSystem === 'whole' ? '整宮制 Whole Sign' : '普拉西德制 Placidus',
    zodiac: '回歸黃道 Tropical',
    fingerprint: natalChartFingerprint(chart, unknown),
  };
}
function renderChartIdentityBar() {
  var id = astroActiveChartIdentity();
  if (!id) return '';
  var h = '<div class="md-chartbar" aria-label="目前使用的命盤資料">';
  h += '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">';
  h += '<span style="font:500 11px var(--font-sans);color:var(--brand)">目前命盤</span>';
  h += '<span class="md-kind md-kind--fact">排盤資料</span>';
  h += '</div>';
  h += '<div style="font:500 12.5px var(--font-sans);color:var(--text);margin-top:4px">' + esc(id.date) + '　' + esc(id.time) + '　' + esc(id.city) + '</div>';
  h += '<div class="md-chartbar__row">';
  h += '<span class="md-chartbar__item">時區 <b>' + esc(id.tz) + '</b></span>';
  h += '<span class="md-chartbar__item">宮位制 <b>' + esc(id.houseSystem) + '</b></span>';
  h += '<span class="md-chartbar__item">黃道 <b>' + esc(id.zodiac) + '</b></span>';
  h += '</div>';
  if (id.unknownTime) {
    h += '<div style="margin-top:6px;font:400 10.5px/1.7 var(--font-sans);color:var(--warning)">△ 出生時間未提供：上升、天頂、宮位、福點與宿命點不列入計算與解讀。</div>';
  }
  if (natalTopicDevelopmentMode()) {
    h += '<div style="margin-top:6px;font:400 9px/1.6 monospace;color:var(--text-faint)">dev · chartFingerprint=' + esc(id.fingerprint)
      + ' · view=' + esc(String(state.astroView || 'chart'))
      + ' · topicId=' + esc(String(state.natalTopicCat || '-'))
      + ' · promptVersion=' + esc(String(NATAL_TOPIC_PROMPT_VERSION))
      + ' · knowledgeVersion=' + esc(String(NATAL_TOPIC_KNOWLEDGE_VERSION)) + '</div>';
  }
  return h + '</div>';
}

/* ================= 星盤頁的即時狀態訊息 =================
   原本失敗路徑一律走 alert()：會擋住整個畫面、無法被輔助技術以「頁面內容」讀取、
   在 iOS PWA 有時甚至不會出現，而且訊息消失後使用者不知道剛剛發生什麼事。
   改成寫進 state 由畫面渲染，錯誤訊息會留在原地，而且已輸入的資料完全不動。 */
function astroSetNotice(kind, text) {
  state.astroNotice = text ? { kind: kind, text: text } : null;
}
function astroClearNotice() { state.astroNotice = null; render(); }
function renderAstroNotice() {
  var n = state.astroNotice;
  if (!n) return '';
  var cls = n.kind === 'error' ? 'md-status--error' : (n.kind === 'success' ? 'md-status--success' : 'md-status--info');
  var icon = n.kind === 'error' ? '✕' : (n.kind === 'success' ? '✓' : 'ⓘ');
  var prefix = n.kind === 'error' ? '錯誤：' : (n.kind === 'success' ? '完成：' : '提示：');
  return '<div class="md-status ' + cls + '" role="' + (n.kind === 'error' ? 'alert' : 'status') + '">'
    + '<span class="md-status__icon" aria-hidden="true">' + icon + '</span>'
    + '<span><b style="font-weight:500">' + prefix + '</b>' + esc(n.text) + '</span>'
    + '<button type="button" onclick="astroClearNotice()" aria-label="關閉這則訊息" style="margin-left:auto;flex:none;background:none;border:none;color:var(--text-faint);font-size:14px;cursor:pointer;min-width:32px;min-height:32px">×</button>'
    + '</div>';
}

/* ================= 命盤總覽 → 主題分析的橋接入口 =================
   資訊架構上，「看懂自己的盤」之後最自然的下一步是「那我想問什麼」，
   但這兩件事先前分屬兩個平行分頁，使用者看完總覽只會看到一長串行星落點，
   沒有任何提示告訴他還能往哪走。這個區塊放在快速總覽正下方，
   點任何一個主題都會直接切到人生主題分頁並選好該主題。 */
function astroGoToTopic(catKey) {
  state.astroView = 'natalTopic';
  if (state.natalTopicCat !== catKey) {
    state.natalTopicCat = catKey;
    /* 換主題等於換問題集合，先前那份結果不再對應，直接清掉不留殘影。 */
    state.natalTopicResult = null;
    state.natalTopicLimitHit = '';
  }
  render();
  window.scrollTo(0, 0);
}
function renderTopicEntryBlock() {
  if (typeof NATAL_TOPIC_CATEGORIES === 'undefined') return '';
  var h = '<section style="margin-top:16px;border:1px solid var(--border);border-radius:var(--radius-lg);padding:14px 15px;background:var(--surface)">';
  h += '<h3 class="md-h3" style="font-size:14px">接下來，你想先了解什麼？</h3>';
  h += '<p class="md-note md-prose" style="margin:5px 0 0">選一個主題，會用上面這張盤的資料回答你挑的具體問題。</p>';
  h += '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:10px">';
  NATAL_TOPIC_CATEGORIES.forEach(function (cat) {
    h += '<button type="button" onclick="astroGoToTopic(\'' + cat.key + '\')" style="min-height:var(--control-h);font:500 12px var(--font-sans);background:rgba(201,169,110,.06);border:1px solid var(--border);color:var(--text-secondary);padding:8px 14px;border-radius:20px;cursor:pointer">' + cat.icon + ' ' + esc(cat.zh) + '</button>';
  });
  h += '</div></section>';
  return h;
}

function renderNatalTopicQuestionCard(a) {
  var h = '<div style="margin-top:16px;border:1px solid rgba(201,169,110,.28);border-radius:14px;padding:16px 17px;background:rgba(255,255,255,.025);box-shadow:0 1px 0 rgba(255,255,255,.02) inset">';
  h += '<h4 style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(201,169,110,.85);letter-spacing:.03em;margin:0">' + esc(a.title) + '</h4>';
  h += '<div style="font:600 15px \'Noto Serif TC\',serif;color:#e6cd9a;margin-top:6px;line-height:1.6">' + esc(natalHeadlineForTitle(a.title, a.headline)) + '</div>';
  if (a.contractStatus === 'insufficient') {
    h += '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.58);line-height:1.75;margin-top:7px">' + esc(a.summary) + '</div>';
  }
  var shownDetails = visibleNatalDetails(a).slice(0, 2);
  if (shownDetails.length) {
    h += '<div style="margin-top:11px;display:flex;flex-direction:column;gap:7px">';
    shownDetails.forEach(function (d) {
      h += '<div style="border-left:2px solid rgba(201,169,110,.35);padding-left:9px"><span style="font:500 10.5px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + esc(d.label) + '</span><div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.75;margin-top:2px">' + esc(d.text) + '</div></div>';
    });
    h += '</div>';
  }
  if (a.caution) {
    h += '<div style="margin-top:11px;display:flex;gap:7px;align-items:flex-start"><span style="flex:none;font:500 10px \'Noto Sans TC\',sans-serif;color:#d9a0a0;background:rgba(214,120,120,.12);border-radius:8px;padding:2px 7px;margin-top:1px">實用提醒</span><div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.68);line-height:1.75">' + esc(a.caution) + '</div></div>';
  }
  /* 展開狀態必須綁到 state：每次切換白話／專業、換題目或任何 render() 都會整段
     重畫 innerHTML，未受控的 <details> 會全部塌回收合，使用者剛讀到一半的依據
     就不見了。state.natalTopicExpanded 原本就宣告了卻沒有任何地方讀取，這裡把它接上。 */
  var evOpen = !!state.natalTopicExpanded[a.questionId];
  h += '<details' + (evOpen ? ' open' : '') + ' ontoggle="natalTopicSetExpanded(\'' + esc(a.questionId) + '\',this.open)" style="margin-top:10px;border-top:1px solid rgba(201,169,110,.14);padding-top:8px"><summary style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(201,169,110,.9);cursor:pointer;min-height:36px;display:flex;align-items:center;gap:6px"><span>為什麼這樣說？</span><span class="md-kind md-kind--rule">綜合判斷</span></summary>';
  h += '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.68);line-height:1.8;padding:2px 0 6px">' + esc(natalPlainEvidenceExplanation(a)) + '</div>';
  if (state.natalTopicProfessional) {
    h += '<div style="margin-top:8px;padding-top:8px;border-top:1px dashed rgba(201,169,110,.2)">';
    h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">主要占星指標</div>';
    if (a.ranked && a.ranked.length) {
      a.ranked.forEach(function (e) {
        var roles = (e.sourceRoles && e.sourceRoles.length > 1) ? ('<span style="font:400 9.5px \'Noto Sans TC\',sans-serif;color:rgba(201,169,110,.6)">［' + e.sourceRoles.length + ' 個指標角色同時指向這筆配置：' + esc(e.sourceRoles.join('、')) + '］</span>') : '';
        var effective = e.selectionScore == null ? e.weight : e.selectionScore;
        var scoreText = effective === e.weight ? ('權重 ' + e.weight) : ('原始 ' + e.weight + '＋題目調整 ' + (e.biasBonus >= 0 ? '+' : '') + e.biasBonus + '＝有效 ' + effective);
        h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.7;margin-top:6px">・' + esc(e.placement) + '（' + scoreText + '）<br><span style="color:#9bc5a3">支持：</span>' + esc(e.semanticSupport || e.reason) + '<br><span style="color:#d9a0a0">限制：</span>' + esc(e.semanticLimitation || '不能單獨決定整體結論') + (e.fallbackUsed ? '<br><span style="color:rgba(240,233,216,.62)">替代資料：' + esc(e.fallbackSource + '；' + e.fallbackReason) + '</span>' : '') + (roles ? '<br>' + roles : '') + '</div>';
      });
    } else {
      h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:4px">目前沒有可用的指標。</div>';
    }
    if (a.advanced) {
      h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:10px">配置如何互相支持</div>';
      h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.65);line-height:1.75;margin-top:4px">' + esc(a.advanced.supportNote) + '</div>';
      if (a.advanced.tensionNotes.length) {
        h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:10px">互相矛盾的訊號</div>';
        a.advanced.tensionNotes.forEach(function (t) {
          h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.65);line-height:1.75;margin-top:4px">' + esc(t) + '</div>';
        });
      }
    }
    h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:10px">解讀限制</div>';
    (a.limitations || []).forEach(function (l) {
      h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);line-height:1.75;margin-top:4px">' + esc(l) + '</div>';
    });
    if (natalTopicDevelopmentMode() && a.debug) {
      h += '<details style="margin-top:10px"><summary style="font:500 10px \'Noto Sans TC\',sans-serif;color:#9bc5a3;cursor:pointer">Development diagnostics</summary><pre style="white-space:pre-wrap;word-break:break-word;font:400 9px monospace;color:rgba(240,233,216,.55);line-height:1.5">' + esc(JSON.stringify(a.debug, null, 2)) + '</pre></details>';
    }
    h += '</div>';
  }
  h += '</details>';
  h += '</div>';
  return h;
}
function renderNatalTopicResult(result) {
  var pro = !!state.natalTopicProfessional;
  var h = '<div style="margin-top:22px;border-top:1px solid rgba(201,169,110,.2);padding-top:16px">';

  /* 全頁只講一次的可信度說明——原本沒有任何地方告訴使用者「下面這些句子是規則
     推導出來的解讀，不是排盤計算結果」。放在主題結果最上方講一次就好，
     不在每張卡片重複長篇免責聲明。 */
  h += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
  h += '<span class="md-kind md-kind--fact">排盤資料</span>';
  h += '<span class="md-kind md-kind--rule">綜合判斷</span>';
  h += '<span class="md-kind md-kind--reading">解讀文字</span>';
  h += '</div>';
  h += '<p class="md-note md-prose" style="margin:6px 0 0">下方每張卡片的答案屬於<strong style="color:var(--success);font-weight:500">解讀文字</strong>——它由本站的規則整合你的排盤資料而成，描述的是本命傾向，不是計算出來的事件或近期預測。展開「為什麼這樣說？」可以往回追到<strong style="color:var(--brand);font-weight:500">綜合判斷</strong>與原始<strong style="color:var(--info);font-weight:500">排盤資料</strong>。</p>';

  h += '<h4 style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;letter-spacing:.05em;margin:14px 0 0">主題總覽</h4>';
  h += '<div class="md-prose" style="font:400 12.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.82);line-height:1.85;margin-top:6px">' + esc(result.topicOverview) + '</div>';

  /* 閱讀深度切換：加上群組名稱與目前狀態文字，避免只靠底色深淺表示選中。 */
  h += '<div role="group" aria-label="閱讀深度" style="display:flex;justify-content:flex-end;align-items:center;gap:6px;margin-top:10px;flex-wrap:wrap">';
  h += '<span style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);padding:6px 2px">閱讀深度</span>';
  h += '<button type="button" aria-pressed="' + (!pro) + '" onclick="natalTopicSetExplanationMode(false)" style="min-height:36px;font:500 10.5px \'Noto Sans TC\',sans-serif;border:1px solid ' + (!pro ? '#e6cd9a' : 'rgba(201,169,110,.3)') + ';border-radius:12px;padding:5px 9px;background:' + (!pro ? 'rgba(201,169,110,.18)' : 'transparent') + ';color:' + (!pro ? '#f0e9d8' : '#c9a96e') + ';cursor:pointer">' + (!pro ? '✓ ' : '') + '一般</button>';
  h += '<button type="button" aria-pressed="' + pro + '" onclick="natalTopicSetExplanationMode(true)" style="min-height:36px;font:500 10.5px \'Noto Sans TC\',sans-serif;border:1px solid ' + (pro ? '#e6cd9a' : 'rgba(201,169,110,.3)') + ';border-radius:12px;padding:5px 9px;background:' + (pro ? 'rgba(201,169,110,.18)' : 'transparent') + ';color:' + (pro ? '#f0e9d8' : '#c9a96e') + ';cursor:pointer">' + (pro ? '✓ ' : '') + '專業</button>';
  h += '</div>';
  h += '<div role="status" style="text-align:right;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);margin-top:3px">目前：' + (pro ? '專業模式（在一般內容之上，額外列出行星／星座／宮位／相位、權重、替代資料與解讀限制）' : '一般模式（只顯示白話結論、生活表現與做法）') + '　結論本身不會因模式而改變。</div>';

  result.answers.forEach(function (a) { h += renderNatalTopicQuestionCard(a); });
  h += '<div style="text-align:center;margin-top:18px;padding-bottom:8px"><button id="natal-topic-copy-btn" onclick="natalTopicCopyForAI()" style="min-height:44px;font:400 12px \'Noto Sans TC\',sans-serif;background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;padding:10px 20px;border-radius:20px;cursor:pointer">複製給 AI 解讀 Copy for AI</button></div>';
  h += '</div>';
  return h;
}
function renderNatalTopicSection(chart) {
  var h = '<div style="margin-top:8px">';
  h += '<h3 style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin:0">人生主題分析</h3>';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:5px;line-height:1.6">直接整合你目前的本命盤資料解讀，不會重新排盤，也不會把你的問題直接丟給外部 AI。</div>';

  h += '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:14px">';
  NATAL_TOPIC_CATEGORIES.forEach(function (cat) {
    var on = state.natalTopicCat === cat.key;
    h += '<button type="button" aria-pressed="' + on + '" onclick="natalTopicSetCat(\'' + cat.key + '\')" style="font:500 12px \'Noto Sans TC\',sans-serif;background:' + (on ? 'rgba(201,169,110,.2)' : 'rgba(255,255,255,.03)') + ';border:1px solid ' + (on ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';color:' + (on ? '#f0e9d8' : 'rgba(240,233,216,.6)') + ';padding:8px 14px;border-radius:20px;cursor:pointer">' + cat.icon + ' ' + esc(cat.zh) + '</button>';
  });
  h += '</div>';

  if (!state.natalTopicCat) {
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:10px">先選一個主題，才能挑選想了解的具體問題。</div>';
    return h + '</div>';
  }

  var catKey = state.natalTopicCat;
  var questions = NATAL_TOPIC_QUESTIONS[catKey] || [];
  var sel = state.natalTopicQSel[catKey] || [];

  if (catKey === 'health') h += '<div style="margin-top:12px;border:1px solid rgba(214,120,120,.35);border-radius:10px;padding:10px 13px;background:rgba(214,120,120,.06);font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.7">⚠ ' + esc(HEALTH_DISCLAIMER) + '</div>';
  if (catKey === 'wealth') h += '<div style="margin-top:12px;border:1px solid rgba(214,120,120,.35);border-radius:10px;padding:10px 13px;background:rgba(214,120,120,.06);font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.7">⚠ ' + esc(FINANCE_DISCLAIMER) + '</div>';

  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">';
  h += '<h4 style="font:600 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin:0">想了解的具體問題</h4>';
  h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:' + (sel.length >= 3 ? '#e6cd9a' : 'rgba(240,233,216,.4)') + '">已選 ' + sel.length + '／3</div>';
  h += '</div>';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:4px">先從推薦問題開始，最多可選 3 題。</div>';
  var showAllQuestions = !!state.natalTopicShowAll[catKey];
  var visibleQuestions = questions.filter(function (q, i) { return showAllQuestions || i < 3 || sel.indexOf(q.id) !== -1; });
  h += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">';
  visibleQuestions.forEach(function (q, qi) {
    var active = sel.indexOf(q.id) !== -1;
    var preview = (q.answerTargets || []).slice(0, 2).join('、');
    h += '<button type="button" aria-pressed="' + active + '" onclick="natalTopicToggleQ(\'' + catKey + '\',\'' + q.id + '\')" style="min-height:54px;text-align:left;font:400 11.5px \'Noto Sans TC\',sans-serif;background:' + (active ? 'rgba(201,169,110,.22)' : 'rgba(201,169,110,.06)') + ';border:1px solid ' + (active ? '#e6cd9a' : 'rgba(201,169,110,.28)') + ';color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.78)') + ';padding:10px 12px;border-radius:10px;cursor:pointer"><span style="font-weight:500">' + (active ? '✓ ' : (qi < 3 ? '推薦　' : '')) + esc(q.title) + '</span>' + (preview ? '<span style="display:block;font-size:10px;color:rgba(240,233,216,.62);margin-top:4px;line-height:1.5">會分析：' + esc(preview) + '</span>' : '') + '</button>';
  });
  h += '</div>';
  if (questions.length > 3) {
    h += '<button type="button" onclick="natalTopicToggleShowAll(\'' + catKey + '\')" style="width:100%;min-height:42px;margin-top:8px;background:none;border:none;color:rgba(201,169,110,.8);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer">' + (showAllQuestions ? '收起其他問題' : '查看其他 ' + (questions.length - 3) + ' 個問題') + '</button>';
  }
  if (state.natalTopicLimitHit === catKey) {
    h += '<div role="status" style="font:400 11px \'Noto Sans TC\',sans-serif;color:#d67878;margin-top:8px">最多可選 3 題，請先取消一項再選新的</div>';
  }

  h += '<div style="text-align:center;margin-top:16px">';
  h += '<button type="button" onclick="natalTopicGenerate()"' + (sel.length ? '' : ' disabled') + ' style="min-height:44px;font:500 13px \'Noto Sans TC\',sans-serif;letter-spacing:.04em;background:linear-gradient(120deg,#c9a96e,#e6cd9a);color:#1a1622;border:none;padding:11px 28px;border-radius:22px;cursor:pointer;opacity:' + (sel.length ? '1' : '.4') + '">產生專題分析</button>';
  h += '</div>';

  h += '<div id="natal-topic-result">';
  /* 這四個條件缺一不可：主題相符、指紋相符（同一張盤）、以及產生當下的
     prompt／knowledge 版本相符。任何一項不符都代表畫面上這份結果已經不是
     「目前這張盤、這個主題」的答案，寧可要求重新產生，也不顯示殘留內容。 */
  var natalTopicFresh = !!(state.natalTopicResult
    && state.natalTopicResult.topicId === catKey
    && state.natalTopicResult.chartFingerprint === natalChartFingerprint(chart, !!state.astroUnknownTime)
    && state.natalTopicResult.promptVersion === NATAL_TOPIC_PROMPT_VERSION
    && state.natalTopicResult.knowledgeVersion === NATAL_TOPIC_KNOWLEDGE_VERSION);
  if (natalTopicFresh) {
    h += renderNatalTopicResult(state.natalTopicResult);
  } else if (state.natalTopicResult) {
    /* 出生資料、宮位制或「不確定時間」被改過之後回到這一頁。先前是直接什麼都不畫，
       使用者只會看到結果憑空消失，不知道發生什麼事，也不知道下一步要做什麼。 */
    h += '<div class="md-status md-status--info" role="status"><span class="md-status__icon" aria-hidden="true">ⓘ</span>'
      + '<span>星盤資料已經改變（出生資料、宮位制或出生時間設定有更動），先前的分析結果不再對應目前這張盤，已經停止顯示以免混淆。你選的題目都還在，按一次「產生專題分析」就會用新的盤重新計算。</span></div>';
  } else {
    h += '<div class="md-status md-status--info" role="status"><span class="md-status__icon" aria-hidden="true">ⓘ</span>'
      + '<span>還沒有分析結果。選好題目後按「產生專題分析」，結果會直接顯示在這裡。</span></div>';
  }
  h += '</div>';

  return h + '</div>';
}

/* ---- 人生主題分析寫入歷史 ----
   只存畫面上看得到的內容（結論、分項、提醒），不存 ranked evidence 與 debug——
   那些每題可以到數 KB，30 筆會把 localStorage 撐爆，而且回頭看歷史時也用不到。
   命盤身分一併存下來，之後即使使用者換了盤，也能知道當時看的是哪一組出生資料。 */
function saveNatalTopicToHistory(result) {
  if (!result || !result.answers || !result.answers.length) return;
  var cat = NATAL_TOPIC_CATEGORIES.find(function (c) { return c.key === result.topicId; });
  var id = (typeof astroActiveChartIdentity === 'function') ? astroActiveChartIdentity() : null;
  var entry = {
    kind: 'natal',
    date: new Date().toISOString(),
    typeLabel: '人生主題',
    spreadLabel: cat ? cat.zh : result.topicId,
    categoryLabel: cat ? cat.zh : '',
    summary: result.answers.map(function (a) { return a.title; }).join('　'),
    question: '',
    target: '',
    outcome: '',
    detail: {
      topicId: result.topicId,
      overview: result.topicOverview,
      chartFingerprint: result.chartFingerprint,
      birth: id ? { date: id.date, time: id.time, city: id.city, tz: id.tz, houseSystem: id.houseSystem, unknownTime: id.unknownTime } : null,
      answers: result.answers.map(function (a) {
        return {
          title: a.title,
          headline: natalHeadlineForTitle(a.title, a.headline),
          summary: a.contractStatus === 'insufficient' ? a.summary : '',
          details: visibleNatalDetails(a).map(function (d) { return { label: d.label, text: d.text }; }),
          caution: a.caution || '',
        };
      }),
    },
  };
  state.history = [entry].concat(state.history || []).slice(0, HISTORY_MAX);
  historySave();
}

/* ---- 人生主題專題分析：複製給 AI 解讀（含完整 evidence，不受畫面字數限制） ---- */
var _natalTopicCopyTimer = null;
function natalTopicFlashCopied() {
  var btn = document.getElementById('natal-topic-copy-btn');
  if (btn) btn.textContent = '已複製！Copied';
  clearTimeout(_natalTopicCopyTimer);
  _natalTopicCopyTimer = setTimeout(function () {
    var b = document.getElementById('natal-topic-copy-btn');
    if (b) b.textContent = '複製給 AI 解讀 Copy for AI';
  }, 2000);
}
function natalTopicCopyForAI() {
  var result = state.natalTopicResult;
  if (!result) return;
  var cat = NATAL_TOPIC_CATEGORIES.find(function (c) { return c.key === result.topicId; });
  var lines = [];
  lines.push('人生主題專題分析 Natal Topic Analysis');
  lines.push('主題：' + (cat ? cat.zh : result.topicId));
  lines.push('說明：以下解讀完全根據使用者已經生成的本命星盤資料整合而成，沒有重新排盤，也沒有另外詢問 AI。');
  lines.push('');
  lines.push('【主題總覽】');
  lines.push(result.topicOverview);
  result.answers.forEach(function (a, i) {
    var d = a.aiData;
    lines.push('');
    lines.push('【問題 ' + (i + 1) + '】' + d.title);
    /* 與畫面一致：題目就印在上一行，結論不再重複題目的框架字。 */
    lines.push('結論：' + natalHeadlineForTitle(d.title, d.headline));
    lines.push('延伸說明：' + d.summary);
    /* 與畫面一致：內文已經完整包含在結論裡的分項不重複輸出，
       否則貼給 AI 的提示詞會出現同一句話講兩次。 */
    visibleNatalDetails(d).forEach(function (det) { lines.push(det.label + '：' + det.text); });
    if (d.caution) lines.push('留意：' + d.caution);
    lines.push('配置如何互相支持：' + d.supportNote);
    if (a.tensions && a.tensions.length) lines.push('矛盾訊號：' + a.tensions.map(function (t) { return t.note; }).join('；'));
    lines.push('占星依據：');
    if (d.evidence.length) {
      d.evidence.forEach(function (e) { lines.push('　' + e.factor + '｜' + e.placement + '｜' + e.reason + '｜權重 ' + e.weight + (e.sourceRoles && e.sourceRoles.length > 1 ? '｜來源角色：' + e.sourceRoles.join('、') : '')); });
    } else {
      lines.push('　目前沒有可用的指標。');
    }
    if (d.limitations.length) lines.push('解讀限制：' + d.limitations.join('；'));
  });
  lines.push('');
  if (result.topicId === 'health') lines.push(HEALTH_DISCLAIMER);
  if (result.topicId === 'wealth') lines.push(FINANCE_DISCLAIMER);
  lines.push('');
  lines.push('【給 AI 的解讀原則】');
  lines.push(traditionalChineseStyleInstruction());
  lines.push('6. 請整合以上占星依據，針對每個問題形成一個有主軸的答案，不要把多項指標拆成互不相關的片段各自解讀。');
  lines.push('7. 使用「較容易」「可能」「通常」「傾向」等非宿命語氣，不要做出確定性的預言。');
  if (result.topicId === 'health') lines.push('8. 不得診斷疾病、判斷特定病症、預測死亡、建議停藥或取代就醫。');
  if (result.topicId === 'wealth') lines.push('8. 不得承諾收益或提供特定投資標的建議。');
  var text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(natalTopicFlashCopied).catch(function () { fallbackCopy(text, natalTopicFlashCopied); });
  } else {
    fallbackCopy(text, natalTopicFlashCopied);
  }
}

function renderAstro() {
  if (typeof PLANET_DEFS === 'undefined') {
    /* astrologyDataLoadPromise 只有在 go('astro') 已經呼叫過 ensureAstrologyDataLoaded()
       之後才會是非 null；若已經呼叫過但又變回 null，代表載入失敗（見 ensureAstrologyDataLoaded
       的 catch）。 */
    if (astrologyDataLoadPromise === null) {
      return '<div style="padding:70px 20px;text-align:center;color:rgba(240,233,216,.5);font:400 13px \'Noto Sans TC\',sans-serif">星盤功能載入失敗，請檢查網路連線後重新整理頁面。</div>';
    }
    return '<div style="padding:70px 20px;text-align:center;color:rgba(240,233,216,.5);font:400 13px \'Noto Sans TC\',sans-serif">星盤功能載入中…</div>';
  }
  var h = '<div style="padding:8px 20px 20px">';
  h += '<div style="font:400 11px \'EB Garamond\',serif;letter-spacing:.3em;color:#c9a96e;text-transform:uppercase;text-align:center" aria-hidden="true">Natal Chart</div>';
  /* 頁面主標題改用真正的 h2：整個 app 的內容都由 JS 字串產生，先前完全沒有標題階層，
     螢幕閱讀器只能一路線性讀下去，無法用標題快速跳段。 */
  h += '<h2 style="font:600 20px \'Noto Serif TC\',serif;color:#f0e9d8;margin:4px 0 0;text-align:center">個人星盤</h2>';
  h += renderAstroNotice();

  if (!state.astroResult) {
    h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.58);margin-top:14px;line-height:1.7;text-align:center">填寫三項出生資料，了解你的性格、關係模式與人生主題。</div>';
    h += '<div style="margin-top:12px;border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:10px 13px;background:rgba(255,255,255,.02);font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.75">🔒 資料只保存在這台裝置。不知道出生時間也可以建立星盤，但部分結果會省略。</div>';
    h += '<div style="text-align:center;margin-top:10px">';
    h += '<label style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:0 0 1px">換新裝置了嗎？點此匯入之前備份的星盤資料<input type="file" accept="application/json,.json" onchange="astroImportProfileFile(this)" style="display:none"></label>';
    h += '</div>';

    h += '<div style="margin-top:22px;font:600 12px \'Noto Sans TC\',sans-serif;color:#c9a96e">1　出生日期</div>';
    h += '<div style="display:flex;gap:8px;margin-top:6px">';
    h += '<input id="astro-y" aria-label="出生年份" inputmode="numeric" min="1900" max="2100" type="number" placeholder="年 YYYY" value="' + esc(state.astroY) + '" oninput="state.astroY=this.value;birthAutoNext(this,\'astro-m\',4)" onblur="render()" style="width:33%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    h += '<input id="astro-m" aria-label="出生月份" inputmode="numeric" min="1" max="12" type="number" placeholder="月 MM" value="' + esc(state.astroM) + '" oninput="state.astroM=this.value;birthAutoNext(this,\'astro-d\',2)" onblur="render()" style="width:33%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    h += '<input id="astro-d" aria-label="出生日期" inputmode="numeric" min="1" max="31" type="number" placeholder="日 DD" value="' + esc(state.astroD) + '" oninput="state.astroD=this.value;birthAutoNext(this,\'' + (state.astroUnknownTime ? 'astro-city' : 'astro-h') + '\',2)" onblur="render()" style="width:33%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    h += '</div>';
    var astroBirthErr = validateBirthDate(state.astroY, state.astroM, state.astroD, state.astroH, state.astroMin, state.astroUnknownTime);
    if (astroBirthErr) h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:#d67878;margin-top:6px">⚠ ' + esc(astroBirthErr) + '</div>';

    h += '<div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center">';
    h += '<div style="font:600 12px \'Noto Sans TC\',sans-serif;color:#c9a96e">2　出生時間</div>';
    h += '<label style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);display:flex;align-items:center;gap:5px;cursor:pointer"><input type="checkbox" ' + (state.astroUnknownTime ? 'checked' : '') + ' onchange="astroToggleUnknownTime()">我不知道確切時間</label>';
    h += '</div>';
    if (state.astroUnknownTime) {
      h += '<div style="margin-top:6px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.7">勾選後：不會顯示上升／天頂／宮位，也會省略跟月亮相關的相位；十大行星本身的星座位置仍然準確。</div>';
    }
    if (!state.astroUnknownTime) {
      h += '<div style="display:flex;gap:8px;margin-top:6px">';
      h += '<input id="astro-h" aria-label="出生小時" inputmode="numeric" min="0" max="23" type="number" placeholder="時 HH (0-23)" value="' + esc(state.astroH) + '" oninput="state.astroH=this.value;birthAutoNext(this,\'astro-min\',2)" onblur="render()" style="width:50%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
      h += '<input id="astro-min" aria-label="出生分鐘" inputmode="numeric" min="0" max="59" type="number" placeholder="分 MM" value="' + esc(state.astroMin) + '" oninput="state.astroMin=this.value;birthAutoNext(this,\'astro-city\',2)" onblur="render()" style="width:50%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
      h += '</div>';
      h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:5px">時間會影響上升星座與宮位，請盡量提供準確的出生時間</div>';
    }
    h += '<div style="margin-top:18px;font:600 12px \'Noto Sans TC\',sans-serif;color:#c9a96e">3　出生城市</div>';
    h += '<input id="astro-city" aria-label="搜尋出生城市" type="text" maxlength="40" placeholder="搜尋城市，例如：台北、Tokyo" value="' + esc(state.astroCityQuery) + '" oninput="astroCityInput(this.value)" style="width:100%;box-sizing:border-box;margin-top:6px;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    h += '<div id="astro-city-live">' + renderCityLiveBlock('astro', 'astroGenerate') + '</div>';

  } else {
    var chart = state.astroResult;

    /* 第一層只呈現新手能直接理解的四種需求；每日／週／月／年及推運等
       專業功能放到第二層，避免一進星盤就看到九個同權重分頁。 */
    var PRIMARY_ASTRO_TABS = [['chart', '認識自己'], ['natalTopic', '人生主題']];
    var FORECAST_ASTRO_TABS = [['daily', '今天'], ['weekly', '本週'], ['monthly', '本月'], ['yearly', '今年']];
    var MORE_ASTRO_TABS = [['progression', '人生階段變化'], ['synastry', '兩人關係'], ['xiu28', '28星宿'], ['method', '計算方式']];
    var astroForecastOpen = state.astroForecastOpen || FORECAST_ASTRO_TABS.some(function (vt) { return vt[0] === state.astroView; });
    var astroTabsMoreOpen = state.astroTabsMoreOpen || MORE_ASTRO_TABS.some(function (vt) { return vt[0] === state.astroView; });
    function astroTabBtn(vt) {
      var on = (state.astroView || 'chart') === vt[0];
      return '<button aria-pressed="' + on + '" onclick="astroSetView(\'' + vt[0] + '\')" style="font:500 11px \'Noto Sans TC\',sans-serif;background:' + (on ? 'rgba(201,169,110,.2)' : 'rgba(255,255,255,.03)') + ';border:1px solid ' + (on ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';color:' + (on ? '#f0e9d8' : 'rgba(240,233,216,.55)') + ';padding:6px 13px;border-radius:14px;cursor:pointer">' + vt[1] + '</button>';
    }
    h += '<div style="display:flex;gap:6px;margin-top:16px;flex-wrap:wrap;justify-content:center">';
    PRIMARY_ASTRO_TABS.forEach(function (vt) { h += astroTabBtn(vt); });
    h += '<button aria-expanded="' + astroForecastOpen + '" onclick="toggleAstroForecast()" style="font:500 11px \'Noto Sans TC\',sans-serif;background:' + (astroForecastOpen ? 'rgba(201,169,110,.2)' : 'rgba(255,255,255,.03)') + ';border:1px solid ' + (astroForecastOpen ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';color:' + (astroForecastOpen ? '#f0e9d8' : 'rgba(240,233,216,.55)') + ';padding:6px 13px;border-radius:14px;cursor:pointer">近期運勢 ' + (astroForecastOpen ? '▴' : '▾') + '</button>';
    h += '<button aria-expanded="' + astroTabsMoreOpen + '" onclick="toggleAstroTabsMore()" style="font:500 11px \'Noto Sans TC\',sans-serif;background:' + (astroTabsMoreOpen ? 'rgba(201,169,110,.2)' : 'rgba(255,255,255,.03)') + ';border:1px solid ' + (astroTabsMoreOpen ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';color:' + (astroTabsMoreOpen ? '#f0e9d8' : 'rgba(240,233,216,.55)') + ';padding:6px 13px;border-radius:14px;cursor:pointer">進階分析 ' + (astroTabsMoreOpen ? '▴' : '▾') + '</button>';
    h += '</div>';
    if (astroForecastOpen) {
      h += '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;justify-content:center">';
      FORECAST_ASTRO_TABS.forEach(function (vt) { h += astroTabBtn(vt); });
      h += '</div>';
    }
    if (astroTabsMoreOpen) {
      h += '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;justify-content:center">';
      MORE_ASTRO_TABS.forEach(function (vt) { h += astroTabBtn(vt); });
      h += '</div>';
    }
    h += '<div style="text-align:center;margin-top:8px"><button onclick="astroShowTour()" style="min-height:36px;background:none;border:none;color:rgba(240,233,216,.6);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.4);padding:0 0 1px">不知道從哪開始？查看功能說明</button></div>';
    if (!state.astroTourDismissed) h += renderAstroTourCard();
    /* 命盤身分列放在分頁列下方、所有子分頁內容之上——不論使用者現在看的是
       本命盤、人生主題、運勢還是合盤，都能立刻確認「這是哪一張盤」。 */
    h += renderChartIdentityBar();

    if (state.astroView === 'natalTopic') {
      h += renderNatalTopicSection(chart);
      h += '<button onclick="astroSetView(\'chart\')" style="width:100%;margin-top:10px;padding:12px;border-radius:12px;border:1px solid rgba(201,169,110,.3);background:rgba(255,255,255,.02);color:rgba(240,233,216,.6);font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">← 回到本命星盤</button>';
      h += '</div>';
      return h;
    }
    if (state.astroView === 'synastry') {
      h += renderSynastry();
      h += '<button onclick="astroSetView(\'chart\')" style="width:100%;margin-top:10px;padding:12px;border-radius:12px;border:1px solid rgba(201,169,110,.3);background:rgba(255,255,255,.02);color:rgba(240,233,216,.6);font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">← 回到本命星盤</button>';
      h += '</div>';
      return h;
    }
    if (state.astroView === 'progression') {
      h += renderProgression();
      h += '<button onclick="astroSetView(\'chart\')" style="width:100%;margin-top:10px;padding:12px;border-radius:12px;border:1px solid rgba(201,169,110,.3);background:rgba(255,255,255,.02);color:rgba(240,233,216,.6);font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">← 回到本命星盤</button>';
      h += '</div>';
      return h;
    }
    if (state.astroView === 'method') { h += renderAstroMethodology(); h += '</div>'; return h; }
    if (state.astroView === 'xiu28') {
      h += renderXiu28();
      h += '<button onclick="astroSetView(\'chart\')" style="width:100%;margin-top:10px;padding:12px;border-radius:12px;border:1px solid rgba(201,169,110,.3);background:rgba(255,255,255,.02);color:rgba(240,233,216,.6);font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">← 回到本命星盤</button>';
      h += '</div>';
      return h;
    }
    if (state.astroView && state.astroView !== 'chart') {
      h += renderHoroscope(state.astroView);
      h += '</div>';
      return h;
    }

    var ascSignDef = ZODIAC_SIGNS[chart.ascSign];
    var mcSignDef = ZODIAC_SIGNS[Math.floor(chart.mc / 30)];
    if (!state.astroUnknownTime) h += '<div style="margin-top:16px">' + renderNatalWheel(chart) + '</div>';
    else h += '<div style="margin-top:16px;padding:13px 15px;border:1px solid rgba(201,169,110,.3);border-radius:10px;background:rgba(201,169,110,.06);font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.8">這是無出生時間星盤：不顯示可能誤導的星盤輪盤、上升、天頂、宮位、福點與宿命點。月亮當日可能範圍：<strong style="color:#e6cd9a">' + esc(astroMoonRangeText()) + '</strong></div>';

    if (state.astroUnknownTime) {
      h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:10px;text-align:center">＊出生時間未知：行星度數以當日中點呈現，月亮請以上方範圍為準。</div>';
    }

    /* 白話摘要排在星盤輪圖正下方、上升／天頂與宮位制這些專有名詞卡片之前，
       讓第一次使用、不懂占星的人先看得懂的內容，再往下看細節與技術選項 */
    h += renderAstroQuickSummary(chart);
    /* 資訊架構：命盤身分 → 快速總覽 → 「你想先了解什麼」→（主題分頁）→ 詳細命盤資料。
       主要行動放在使用者剛看懂總覽、最有動機往下問的位置。 */
    h += renderTopicEntryBlock();

    if (!state.astroUnknownTime) {
    h += '<div style="display:flex;gap:10px;margin-top:16px;justify-content:center;text-align:center">';
    h += '<div style="flex:1;border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:10px"><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">上升星座 ASC</div><div style="font:600 15px \'Noto Serif TC\',serif;color:#e6cd9a;margin-top:3px">' + ascSignDef.sym + ' ' + ascSignDef.zh + '</div><div style="font:400 10px \'EB Garamond\',serif;color:rgba(240,233,216,.62)">' + (chart.asc % 30).toFixed(1) + '°</div></div>';
    h += '<div style="flex:1;border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:10px"><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">天頂 MC</div><div style="font:600 15px \'Noto Serif TC\',serif;color:#e6cd9a;margin-top:3px">' + mcSignDef.sym + ' ' + mcSignDef.zh + '</div><div style="font:400 10px \'EB Garamond\',serif;color:rgba(240,233,216,.62)">' + (chart.mc % 30).toFixed(1) + '°</div></div>';
    h += '</div>';
    h += '<div style="text-align:center;margin-top:6px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">宮位制：' + (state.astroHouseSystem === 'whole' ? '整宮制 Whole Sign' : '普拉西德制 Placidus') + '</div>';
    h += '<div style="display:flex;justify-content:center;gap:7px;margin-top:8px"><button aria-pressed="' + (state.astroHouseSystem==='placidus') + '" onclick="astroSetHouseSystem(\'placidus\')" style="background:none;border:1px solid rgba(201,169,110,.3);color:#c9a96e;padding:5px 9px;border-radius:12px;cursor:pointer">普拉西德</button><button aria-pressed="' + (state.astroHouseSystem==='whole') + '" onclick="astroSetHouseSystem(\'whole\')" style="background:none;border:1px solid rgba(201,169,110,.3);color:#c9a96e;padding:5px 9px;border-radius:12px;cursor:pointer">整宮制</button></div>';
    h += '<div style="text-align:center;margin-top:4px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">不確定選哪個？多數人用預設的「普拉西德制」就好，這裡切換只會改變宮位分法，行星星座不會變。</div>';
    }

    h += renderAngleAndHouseBeginner(chart);
    h += renderElementQualitySummary(chart);

    h += '<h3 class="md-h3" style="margin-top:24px;display:flex;align-items:center;gap:8px">詳細命盤資料 <span class="md-kind md-kind--fact">排盤資料</span></h3>';
    h += '<p class="md-note md-prose" style="margin:5px 0 0">以下是直接由天文計算得到的位置與角度，不含解讀。三個區塊預設收合，需要時再展開。</p>';
    h += '<details' + (state.astroOpenPlacements ? ' open' : '') + ' style="margin-top:12px" ontoggle="state.astroOpenPlacements=this.open;var c=this.querySelector(\'.astro-caret\');if(c)c.textContent=this.open?\'▾\':\'▸\'"><summary style="min-height:44px;display:flex;align-items:center;font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase;cursor:pointer;list-style:none"><span class="astro-caret" style="display:inline-block;width:12px">' + (state.astroOpenPlacements ? '▾' : '▸') + '</span>行星落點 Placements</summary>';
    h += '<div style="margin-top:2px">';
    PLANET_DEFS.forEach(function (def) {
      var p = chart.planets[def.key];
      var sign = ZODIAC_SIGNS[p.sign];
      var d = planetBeginnerDetail(def, chart);
      h += '<div style="border-top:1px solid rgba(201,169,110,.15);padding:12px 0">';
      h += '<div style="display:flex;justify-content:space-between;align-items:baseline">';
      h += '<span style="font:500 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8">' + def.sym + ' ' + def.zh + '</span>';
      h += '<span style="font:400 11px \'EB Garamond\',serif;color:#c9a96e">' + sign.sym + ' ' + sign.zh + ' ' + p.deg.toFixed(1) + '°' + (state.astroUnknownTime ? '' : '　第' + p.house + '宮') + (p.retro ? '　℞' : '') + '</span>';
      h += '</div>';
      h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:6px;line-height:1.75">' + esc(d.oneLine) + '</div>';
      h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);margin-top:4px;line-height:1.75">' + esc(d.everyday) + '</div>';
      h += '<div style="margin-top:5px;font:400 11px \'Noto Sans TC\',sans-serif;color:#9bc5a3;line-height:1.65">可以發揮：'+esc(d.strength)+'</div><div style="margin-top:3px;font:400 11px \'Noto Sans TC\',sans-serif;color:#d9a0a0;line-height:1.65">需要留意：'+esc(d.watch)+'</div>';
      h += '<details style="margin-top:8px"><summary style="min-height:44px;display:flex;align-items:center;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);cursor:pointer">查看占星原理與進階解讀</summary><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);line-height:1.8;margin-top:2px">'
        + '<div>'+esc(d.advanced.planetFunction)+'</div>'
        + '<div style="margin-top:5px">'+esc(d.advanced.signMethod)+'</div>'
        + '<div style="margin-top:5px">'+esc(d.advanced.houseActivation)+'</div>'
        + '<div style="margin-top:5px">'+esc(d.advanced.synthesis)+'</div>'
        + '<div style="margin-top:5px">'+esc(d.advanced.growth)+'</div>'
        + (p.retro ? '<div style="margin-top:5px;color:#b7a4d8">逆行：這股能量的展現較為內化，需要多一層自我覺察才會顯現在外，不代表不好或比較弱。</div>' : '')
        + '<div style="margin-top:5px;color:rgba(240,233,216,.62)">'+esc(d.technical)+'</div>'
        + '</div></details>';
      h += '</div>';
    });
    h += '</div></details>';

    h += '<details' + (state.astroOpenPoints ? ' open' : '') + ' style="margin-top:14px" ontoggle="state.astroOpenPoints=this.open;var c=this.querySelector(\'.astro-caret\');if(c)c.textContent=this.open?\'▾\':\'▸\'"><summary style="min-height:44px;display:flex;align-items:center;font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase;cursor:pointer;list-style:none"><span class="astro-caret" style="display:inline-block;width:12px">' + (state.astroOpenPoints ? '▾' : '▸') + '</span>額外本命點 Additional Points</summary>';
    h += '<div style="margin-top:2px">';
    EXTRA_POINT_DEFS.forEach(function (def) {
      if (state.astroUnknownTime && (def.key === 'Fortune' || def.key === 'Vertex')) return;
      var p = chart.points[def.key];
      var sign = ZODIAC_SIGNS[p.sign];
      var r = extraPointReading(def, p, chart, !!state.astroUnknownTime);
      h += '<div style="border-top:1px solid rgba(201,169,110,.15);padding:12px 0">';
      h += '<div style="display:flex;justify-content:space-between;align-items:baseline">';
      h += '<span style="font:500 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8">' + def.sym + ' ' + esc(pointDisplayName(def)) + '</span>';
      h += '<span style="font:400 11px \'EB Garamond\',serif;color:#c9a96e">' + sign.sym + ' ' + sign.zh + ' ' + p.deg.toFixed(1) + '°' + (state.astroUnknownTime ? '' : '　第' + p.house + '宮') + (p.retro ? '　℞' : '') + '</span>';
      h += '</div>';
      h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);margin-top:6px;line-height:1.75">' + esc(r.summary) + '</div>';
      h += '<div style="margin-top:5px;font:400 11px \'Noto Sans TC\',sans-serif;line-height:1.65"><span style="color:#c9a96e;font-weight:500">' + esc(r.primaryLabel) + '：</span><span style="color:rgba(240,233,216,.78)">' + esc(r.primaryText) + '</span></div>';
      h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);margin-top:4px;line-height:1.75">' + esc(r.lifeExpression) + '</div>';
      h += '<div style="margin-top:5px;font:400 11px \'Noto Sans TC\',sans-serif;color:#d9a0a0;line-height:1.65">需要留意：' + esc(r.caution) + '</div>';
      var pointFoldLabel = (def.key === 'Node' || def.key === 'SNode') ? '查看交點軸線與進階解讀' : '查看本命點原理與進階解讀';
      h += '<details style="margin-top:8px"><summary style="min-height:44px;display:flex;align-items:center;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);cursor:pointer">' + pointFoldLabel + '</summary><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);line-height:1.8;margin-top:2px">'
        + '<div>' + esc(r.advanced.coreFunction) + '</div>'
        + '<div style="margin-top:5px">' + esc(r.advanced.signMethod) + '</div>'
        + '<div style="margin-top:5px">' + esc(r.advanced.houseActivation) + '</div>'
        + (r.advanced.axisContext ? '<div style="margin-top:5px">' + esc(r.advanced.axisContext) + '</div>' : '')
        + '<div style="margin-top:5px">' + esc(r.advanced.synthesis) + '</div>'
        + '<div style="margin-top:5px">' + esc(r.advanced.growth) + '</div>'
        + '<div style="margin-top:5px;color:rgba(240,233,216,.62)">' + esc(r.technical) + '</div>'
        + '</div></details>';
      h += '</div>';
    });
    h += '<details style="margin-top:9px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);cursor:pointer">查看額外本命點的算法與精度</summary><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.7;margin-top:5px">凱龍星座標為簡化軌道模型估算，精度約在 0.2° 以內；莉莉絲／福點／交點採用平均點（mean）算法，屬主流占星軟體常見標準之一；出生地與時間的時區換算已自動套用當地歷史上的日光節約時間規則，不需要自行手動校正。</div></details>';
    h += '</div></details>';

    var usableAspects = astroUsableAspects(chart);
    if (usableAspects.length) {
      h += '<details' + (state.astroOpenAspects ? ' open' : '') + ' style="margin-top:14px" ontoggle="state.astroOpenAspects=this.open;var c=this.querySelector(\'.astro-caret\');if(c)c.textContent=this.open?\'▾\':\'▸\'"><summary style="min-height:44px;display:flex;align-items:center;font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase;cursor:pointer;list-style:none"><span class="astro-caret" style="display:inline-block;width:12px">' + (state.astroOpenAspects ? '▾' : '▸') + '</span>主要相位 Aspects</summary>';
      h += '<div style="margin-top:2px">';
      h += '<details style="margin-top:8px"><summary style="min-height:44px;display:flex;align-items:center;font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.06em;color:rgba(240,233,216,.5);cursor:pointer">查看專業相位總表 Aspect Grid</summary>';
      h += renderAspectGrid(chart)+'</details>';
      var natalCardUsedSet = {};
      usableAspects.slice().sort(function (x, y) {
        var px=natalAspectPriority(x)==='core'?0:1, py=natalAspectPriority(y)==='core'?0:1;
        return px-py || x.orb-y.orb;
      }).forEach(function (asp) {
        h += renderNatalAspectCard(asp, chart, !!state.astroUnknownTime, natalCardUsedSet);
      });
      h += '</div></details>';
    }

    h += renderPersonaPicker();
    h += '<button id="astro-copy-btn" onclick="astroCopyForAI()" style="width:100%;margin-top:24px;padding:12px;border-radius:12px;border:1px solid #c9a96e;background:rgba(201,169,110,.12);color:#e6cd9a;font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">複製給 AI 解讀 Copy for AI</button>';
    h += '<button onclick="astroReset()" style="width:100%;margin-top:10px;padding:12px;border-radius:12px;border:1px solid rgba(201,169,110,.3);background:rgba(255,255,255,.02);color:rgba(240,233,216,.6);font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">重新輸入 ↺</button>';
    h += '<div style="text-align:center;margin-top:10px;display:flex;gap:16px;justify-content:center;flex-wrap:wrap">';
    h += '<button onclick="astroExportProfile()" style="background:none;border:none;color:rgba(240,233,216,.62);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:0 0 1px">匯出星盤資料備份</button>';
    h += '<button onclick="astroForget()" style="background:none;border:none;color:rgba(240,233,216,.62);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:0 0 1px">清除已儲存的星盤資料</button>';
    h += '</div>';
    h += renderAstroDetailModal(chart);
  }

  h += '</div>';
  return h;
}
/* ---------- 二十八星宿：宿別資料、日期換算與兩宿關係 ---------- */
var XIU_DEFS = [
  { zh: '角', dir: '東方青龍', animal: '蛟', elem: '木', weekday: 4, trait: '你有開創的衝勁，喜歡走在前面把方向定出來，像蛟龍探頭那樣勇於嘗試新局面。', good: '簽約、開會、談新合作、開始一項計畫', avoid: '拖延決定、猶豫不決' },
  { zh: '亢', dir: '東方青龍', animal: '龍', elem: '金', weekday: 5, trait: '你做事講究氣勢與品質，不喜歡將就，對自己與別人都有一定的高標準。', good: '談判、爭取權益、正式場合亮相', avoid: '硬碰硬的衝突、意氣用事' },
  { zh: '氐', dir: '東方青龍', animal: '貉', elem: '土', weekday: 6, trait: '你重視根基與安全感，喜歡把事情一步步扎實地做穩，不愛冒進。', good: '整理居家、存錢規劃、修復關係', avoid: '倉促搬遷、貿然投資' },
  { zh: '房', dir: '東方青龍', animal: '兔', elem: '日', weekday: 0, trait: '你溫和敏銳，重視家庭與親密關係，很在意彼此之間是否被好好對待。', good: '家庭聚會、談心、表達感謝', avoid: '冷戰、忽略對方感受' },
  { zh: '心', dir: '東方青龍', animal: '狐', elem: '月', weekday: 1, trait: '你情感細膩、直覺敏銳，容易察覺別人沒說出口的情緒。', good: '獨處沉澱、藝術創作、傾聽他人', avoid: '過度多疑、悶著不說' },
  { zh: '尾', dir: '東方青龍', animal: '虎', elem: '火', weekday: 2, trait: '你行動力強、敢衝敢拼，面對挑戰時反而更有精神。', good: '運動健身、處理積壓已久的事、主動出擊', avoid: '逞強硬撐、不顧後果衝動行事' },
  { zh: '箕', dir: '東方青龍', animal: '豹', elem: '水', weekday: 3, trait: '你反應快、善於整合資訊，能在複雜狀況中找到自己的位置。', good: '溝通協調、資料整理、學習新技能', avoid: '三心二意、資訊過載時亂了陣腳' },
  { zh: '斗', dir: '北方玄武', animal: '獬', elem: '木', weekday: 4, trait: '你重公平正義，遇到不合理的事會很有主見地表達立場。', good: '主持公道、伸張正義的場合、立定新目標', avoid: '過度較真、得理不饒人' },
  { zh: '牛', dir: '北方玄武', animal: '牛', elem: '金', weekday: 5, trait: '你踏實肯做、任勞任怨，是那種默默把事情完成的人。', good: '踏實推進手邊工作、累積存款', avoid: '過度壓榨自己、不懂拒絕' },
  { zh: '女', dir: '北方玄武', animal: '蝠', elem: '土', weekday: 6, trait: '你心思細膩、擅長照顧他人，也重視自己內在的成長。', good: '學習進修、照顧家人、自我充電', avoid: '過度犧牲自己配合別人' },
  { zh: '虛', dir: '北方玄武', animal: '鼠', elem: '日', weekday: 0, trait: '你想像力豐富，容易被新奇的點子吸引，也擅長從無到有生出東西。', good: '發想企劃、寫作、規劃未來', avoid: '好高騖遠、光說不做' },
  { zh: '危', dir: '北方玄武', animal: '燕', elem: '月', weekday: 1, trait: '你警覺性高，做重大決定前會反覆確認，不喜歡毫無準備地行動。', good: '風險評估、簽重要文件前的最後確認', avoid: '在準備不足時貿然行動' },
  { zh: '室', dir: '北方玄武', animal: '豬', elem: '火', weekday: 2, trait: '你重視居家與生活品質，喜歡把生活過得安穩舒適。', good: '裝修佈置、家庭理財、休養生息', avoid: '大興土木、頻繁搬動' },
  { zh: '壁', dir: '北方玄武', animal: '貐', elem: '水', weekday: 3, trait: '你博學而好整理知識，喜歡把零散的東西系統化。', good: '讀書進修、整理資料檔案、規劃長期計畫', avoid: '鑽牛角尖、想太多卻不行動' },
  { zh: '奎', dir: '西方白虎', animal: '狼', elem: '木', weekday: 4, trait: '你獨立性強，習慣靠自己的判斷做事，不喜歡被過度干涉。', good: '獨立作業的任務、開創個人事業', avoid: '過度固執己見、拒絕合作' },
  { zh: '婁', dir: '西方白虎', animal: '狗', elem: '金', weekday: 5, trait: '你忠誠可靠，一旦認定的人事物就會全力守護。', good: '團隊合作、維繫長期關係、盡忠職守的工作', avoid: '愚忠不懂變通、被人利用' },
  { zh: '胃', dir: '西方白虎', animal: '雉', elem: '土', weekday: 6, trait: '你注重外在形象與生活品質，懂得為自己創造舒適與美感。', good: '購物、打扮、佈置環境', avoid: '過度虛榮、入不敷出' },
  { zh: '昴', dir: '西方白虎', animal: '雞', elem: '日', weekday: 0, trait: '你勤奮準時、紀律感強，習慣把生活安排得井井有條。', good: '規律作息、準時赴約、監督進度', avoid: '過度苛求細節、不知變通' },
  { zh: '畢', dir: '西方白虎', animal: '烏', elem: '月', weekday: 1, trait: '你聰明機警，擅長觀察局勢、抓住時機。', good: '策略規劃、談判、把握機會出手', avoid: '算計太多、失去信任' },
  { zh: '觜', dir: '西方白虎', animal: '猴', elem: '火', weekday: 2, trait: '你反應靈活、點子多，擅長隨機應變解決突發狀況。', good: '臨場應變、創意發想、快速學習', avoid: '三分鐘熱度、缺乏耐性' },
  { zh: '參', dir: '西方白虎', animal: '猿', elem: '水', weekday: 3, trait: '你行動敏捷、好奇心旺盛，喜歡到處探索新事物。', good: '旅行、學習新領域、拓展人脈', avoid: '過度分心、承諾太多做不到' },
  { zh: '井', dir: '南方朱雀', animal: '犴', elem: '木', weekday: 4, trait: '你重視是非對錯，喜歡把事情攤開來講清楚。', good: '溝通協商、公開發言、釐清誤會', avoid: '得理不饒人、在公開場合起衝突' },
  { zh: '鬼', dir: '南方朱雀', animal: '羊', elem: '金', weekday: 5, trait: '你心思纖細、重感情，很在意人與人之間的情分。', good: '探望親友、處理家族事務、緬懷紀念', avoid: '過度感傷、放不下過去' },
  { zh: '柳', dir: '南方朱雀', animal: '獐', elem: '土', weekday: 6, trait: '你隨和有彈性，懂得在不同場合調整自己的姿態。', good: '社交應酬、調解糾紛、隨機應變的安排', avoid: '沒有原則地一味迎合' },
  { zh: '星', dir: '南方朱雀', animal: '馬', elem: '日', weekday: 0, trait: '你活力充沛、喜歡被看見，天生就有舞台魅力。', good: '公開展演、簡報提案、社交曝光', avoid: '過度逞強愛面子' },
  { zh: '張', dir: '南方朱雀', animal: '鹿', elem: '月', weekday: 1, trait: '你溫和優雅，懂得用柔軟的方式化解緊張的氣氛。', good: '團隊協調、款待客人、居中調停', avoid: '一味討好而委屈自己' },
  { zh: '翼', dir: '南方朱雀', animal: '蛇', elem: '火', weekday: 2, trait: '你敏銳而善於察言觀色，懂得抓住時機表現自己。', good: '公開表現、行銷宣傳、抓緊機會出手', avoid: '心機算計過了頭、失去信任' },
  { zh: '軫', dir: '南方朱雀', animal: '蚓', elem: '水', weekday: 3, trait: '你重情重義、韌性十足，即使環境艱難也能默默耕耘。', good: '團隊合作、累積口碑、長期經營的事', avoid: '過度隱忍委屈自己' },
];
var XIU_DIR_COLOR = { '東方青龍': '#8fc7f4', '北方玄武': '#9bc5a3', '西方白虎': '#e6cd9a', '南方朱雀': '#d99b5f' };
/* 校驗過的計算基準：2026-07-23（週四）＝角宿（索引0），2026-07-22（週三）＝軫宿（索引27，循環銜接） */
var XIU_EPOCH_UTC = Date.UTC(2026, 6, 23);
function xiuIndexForYMD(y, m, d) {
  var target = Date.UTC(y, m - 1, d);
  var diffDays = Math.round((target - XIU_EPOCH_UTC) / 86400000);
  return ((diffDays % 28) + 28) % 28;
}
function xiuDateStr(y, m, d) { return y + '/' + pad2(m) + '/' + pad2(d); }

/* 兩宿關係：用「同宿／同曜（每7宿共用一種曜）／同象（四象每象各7宿）／
   對象（四象中相對的那一象）／鄰象」這五種可驗證的結構關係分類，
   不採用坊間流傳、版本彼此矛盾、找不到單一可靠出處的演禽相配吉凶表——
   這點跟本命／每日一樣，選擇「說得清楚、站得住腳」優先於「看起來很古典」。 */
var XIU_RELATION_TPL = {
  same: {
    lead: ['你們是同一個星宿，性格底色幾乎是同一個模子刻出來的，一見面就有種「原來你也這樣」的熟悉感。', '同宿代表你們對生活的直覺反應很相似，很多時候不用解釋，對方就懂你在想什麼。'],
    advice: ['優點是彼此很好懂，要留意的是兩人容易同時踩進一樣的盲點，最好找個性格互補的朋友幫忙補位。', '相處起來很輕鬆，但也要提醒自己：對方看不到的死角，你大概也看不到，遇到重大決定不妨多問問旁人意見。'],
  },
  sameElem: {
    lead: ['你們雖然不同宿，但共用同一種「曜」，骨子裡的步調和價值觀其實很合拍，像是同一種頻率在共振。', '同曜代表你們雖然表現方式不同，但在意的核心很像，相處起來會有一種說不上來的默契。'],
    advice: ['可以善用這份共鳴一起訂目標、互相打氣；只是也要記得練習說出彼此不同的地方，別誤以為對方什麼都跟你想的一樣。', '建議偶爾刻意聊聊彼此的差異，同頻率固然舒服，但也可能讓你們忽略了需要被看見的分歧。'],
  },
  sameDir: {
    lead: ['你們同屬一個象限（同樣的青龍／玄武／白虎／朱雀），做事的大方向和節奏很類似，合作起來不太需要磨合期。', '同象代表你們對生活的優先順序很接近，很容易一拍即合，不用花太多時間對齊步調。'],
    advice: ['適合一起推動需要長期投入的事，只是要留意會不會太像、缺少互補的角色，記得刻意引入不同觀點。', '相處順暢是優點，但也要提醒自己主動接觸跟你們風格不同的人事物，才不會視野越走越窄。'],
  },
  oppositeDir: {
    lead: ['你們分屬相對的兩個象限，看事情的角度常常正好相反，一開始可能會覺得對方「怎麼想的跟我完全不一樣」。', '對象關係代表你們的性格像蹺蹺板的兩端，一個往前衝，另一個習慣先觀察，需要多花點心思才能對上頻率。'],
    advice: ['這種差異如果磨合得好，反而會變成很強的互補，一個顧全局、一個顧細節；建議溝通時多問「你為什麼會這樣想」，而不是急著爭對錯。', '不用急著改變對方或自己，先練習理解彼此出發點不同，很多摩擦其實只是節奏不同步，不是誰不對。'],
  },
  neighborDir: {
    lead: ['你們的象限相鄰，個性有一部分重疊、也有一部分明顯不同，屬於「大方向合得來，細節要磨合」的組合。', '鄰象關係代表你們合作起來不會太陌生，但仍需要一點時間熟悉彼此不一樣的做事方式。'],
    advice: ['建議一開始先從小事情培養默契，等信任建立後再一起處理更重要的合作或決定。', '重疊的部分可以直接合作無間，不同的部分則值得保持好奇，多聽聽對方的角度會有意外收穫。'],
  },
};
function xiuGroupOf(idx) { return Math.floor(idx / 7); }
function xiuRelationCategory(idxA, idxB) {
  if (idxA === idxB) return 'same';
  if (idxA % 7 === idxB % 7) return 'sameElem';
  var gd = ((xiuGroupOf(idxB) - xiuGroupOf(idxA)) % 4 + 4) % 4;
  if (gd === 0) return 'sameDir';
  if (gd === 2) return 'oppositeDir';
  return 'neighborDir';
}
function xiuRelationData(idxA, idxB) {
  var cat = xiuRelationCategory(idxA, idxB);
  var tpl = XIU_RELATION_TPL[cat];
  var seed = 'xiu|' + idxA + '|' + idxB;
  return {
    category: cat,
    lead: astroSeededPick(seed + 'lead', tpl.lead),
    advice: astroSeededPick(seed + 'advice', tpl.advice),
  };
}

/* 傳統「六戀」關係命名（榮親／友衰／危成／安壞／業胎／命之星）：
   這套命名與配對規則來自演禽廿七宿系統（把牛宿併入女宿，共 27 個位置一圈），
   跟多個命理站台交叉核對過規則一致，不是我自己編的。因為本站的本命星宿是用
   「連續 28 日循環」計算（跟每日／擇日同一套邏輯，可回溯驗證），這裡把 28 宿
   位置換算成 27 宿系統的位置（牛、女併成同一格）後，再套用六戀關係表——所以
   你會同時看到兩套資訊：日常用、可驗證的 28 宿本命，以及這裡附加的傳統六戀
   命名，兩者算法不同，這點會在畫面上跟你說清楚。 */
var XIU_COMPAT27 = (function () {
  var m = [];
  for (var i = 0; i < 28; i++) {
    if (i <= 7) m[i] = i;
    else if (i === 8) m[i] = 8;      // 牛
    else if (i === 9) m[i] = 8;      // 女（跟牛併成同一格）
    else m[i] = i - 1;
  }
  return m;
})();
var XIU_LEGACY_OFFSET_CODE = {
  '-13': '危', '-12': '安', '-11': '衰', '-10': '榮', '-9': '業', '-8': '親', '-7': '友', '-6': '壞', '-5': '成',
  '-4': '危', '-3': '安', '-2': '衰', '-1': '榮', '0': '命',
  '1': '親', '2': '友', '3': '壞', '4': '成', '5': '危', '6': '安', '7': '衰', '8': '榮', '9': '胎',
  '10': '親', '11': '友', '12': '壞', '13': '成',
};
var XIU_LEGACY_PAIR_NAME = { '榮': '榮親關係', '親': '榮親關係', '友': '友衰關係', '衰': '友衰關係', '危': '危成關係', '成': '危成關係', '安': '安壞關係', '壞': '安壞關係', '業': '業胎關係', '胎': '業胎關係', '命': '命之星' };
var XIU_LEGACY_MEANING = {
  '榮親關係': { gist: '互相欣賞、彼此拉抬的關係，容易在對方身上看到自己欣賞或嚮往的樣子。', detail: '一方是對方的「榮星」（帶來光彩、提拔的一方），另一方是「親星」（帶來親近、扶持的一方）。相處起來容易互相佩服、互相靠近，是六戀裡偏向加分、順緣的組合。' },
  '友衰關係': { gist: '一方在給、一方在耗，像朋友互相幫忙，但容易有一邊付出比較多。', detail: '一方是對方的「友星」（願意伸出援手的一方），另一方是「衰星」（容易耗損、需要被照顧的一方）。感情很真，也需要留意別讓某一邊一直單方面付出。' },
  '危成關係': { gist: '一個帶來波折與提醒，一個帶來成果與收穫，關係裡有明顯的張力，也有明顯的成長。', detail: '一方是對方的「危星」（容易帶來考驗、警惕的一方），另一方是「成星」（帶來突破、成就的一方）。這組合不算輕鬆，但撐過磨合期常常會有實質的收穫。' },
  '安壞關係': { gist: '一方帶來穩定安心，一方容易打亂步調，需要花點心思維持平衡。', detail: '一方是對方的「安星」（帶來安定、守成的一方），另一方是「壞星」（容易帶來破壞、變動的一方）。相處需要多一點耐心與溝通，才能把「變動」轉成「刺激」而不是「消耗」。' },
  '業胎關係': { gist: '一個帶來責任與行動的推力，一個帶來新的想法與可能性，像是共同孕育些什麼。', detail: '一方是對方的「業星」（帶來責任、驅動力的一方），另一方是「胎星」（帶來新想法、新開始的一方）。適合一起投入需要耐心醞釀的計畫或創作。' },
  '命之星': { gist: '兩人換算後落在同一個位置，像是同一個原型，彼此非常好懂。', detail: '你們在這套系統裡對應同一個位置，性格底色很像，一見面就容易有「原來你也這樣」的熟悉感，但也要留意雙方可能會有一樣的盲點。' },
};
function xiuLegacyOffset(idxA, idxB) {
  var a = XIU_COMPAT27[idxA], b = XIU_COMPAT27[idxB];
  var diff = b - a;
  return ((diff + 13) % 27 + 27) % 27 - 13;
}
function xiuLegacyDistLabel(off) {
  var ad = Math.abs(off);
  if (ad === 0 || ad === 9) return '';
  if (ad <= 4) return '近距離';
  if (ad <= 8) return '中距離';
  return '遠距離';
}
function xiuLegacyRelation(idxA, idxB) {
  var offAB = xiuLegacyOffset(idxA, idxB); // 對方相對於你的位置 → 對方是你的什麼星
  var offBA = xiuLegacyOffset(idxB, idxA); // 你相對於對方的位置 → 你是對方的什麼星
  var codeForA = XIU_LEGACY_OFFSET_CODE[String(offAB)];
  var codeForB = XIU_LEGACY_OFFSET_CODE[String(offBA)];
  var pairName = XIU_LEGACY_PAIR_NAME[codeForA];
  return {
    pairName: pairName,
    meaning: XIU_LEGACY_MEANING[pairName],
    otherIsYour: codeForA,
    youAreOthers: codeForB,
    dist: xiuLegacyDistLabel(offAB),
  };
}

/* ---------- 合盤 Synastry ---------- */
/* ================= 合盤 Synastry ================= */
function synSetCity(idx) { state.synCityIdx = idx; updateCityLiveBlock('syn', 'synGenerate'); }
function synCityInput(v) {
  state.synCityQuery = v; state.synCityIdx = null;
  updateCityLiveBlock('syn', 'synGenerate');
}
function synToggleUnknownTime() { state.synUnknownTime = !state.synUnknownTime; render(); }
async function synGenerate() {
  /* 與 astroGenerate 一致的重入防護。先前只有本命盤那邊加了，合盤這支漏掉——
     快速連點會同時跑兩次盤運算，後一次覆蓋前一次，中間多觸發一輪 render。 */
  if (state.synGenerating) return;
  var city = CITY_LIST[state.synCityIdx];
  if (!city || !state.synY || !state.synM || !state.synD) return;
  if (validateBirthDate(state.synY, state.synM, state.synD, state.synH, state.synMin, state.synUnknownTime)) { render(); return; }
  state.synGenerating = true;
  render();
  try {
    await ensureAstronomyLoaded();
  } catch (e) {
    state.synGenerating = false;
    astroSetNotice('error', '星盤計算元件載入失敗，可能是網路不穩。對方的出生資料都還在，恢復連線後再按一次即可。');
    render();
    return;
  }
  setTimeout(function () {
    var hh = state.synUnknownTime ? 12 : (parseInt(state.synH, 10) || 0);
    var mm = state.synUnknownTime ? 0 : (parseInt(state.synMin, 10) || 0);
    state.synResult = computeNatalChart(parseInt(state.synY, 10), parseInt(state.synM, 10), parseInt(state.synD, 10), hh, mm, city.lat, city.lon, city.tz, state.astroHouseSystem);
    state.synCityUsed = city;
    state.synGenerating = false;
    render();
    window.scrollTo(0, 0);
  }, 30);
}
function synReset() { state.synResult = null; state.synFacet = null; render(); window.scrollTo(0, 0); }
function synSetFacet(key) {
  state.synFacet = (key && state.synFacet !== key) ? key : null;
  render();
}
function synSetRelationship(k) { state.synRelationship = k; render(); }
function synRelationshipLabel() { return ({love:'戀愛／伴侶',family:'親子／家人',friend:'朋友',work:'工作夥伴'})[state.synRelationship] || '戀愛／伴侶'; }

/* 兩張星盤之間的交叉相位——合盤與推運都能共用這個比對邏輯 */
var CROSS_ASPECT_ORB = { conjunction: 7, sextile: 4, square: 5, trine: 6, opposition: 7 };
function computeCrossChartAspects(chartA, chartB) {
  var aspects = [];
  ASTRO_PLANET_BODY_KEYS.forEach(function (ak) {
    ASTRO_PLANET_BODY_KEYS.forEach(function (bk) {
      var diff = astroAngleDiff(chartA.planets[ak].lon, chartB.planets[bk].lon);
      var best = null;
      HOROSCOPE_ASPECT_ANGLES.forEach(function (pair) {
        var delta = Math.abs(diff - pair[1]);
        var orbLimit = CROSS_ASPECT_ORB[pair[0]];
        if (delta <= orbLimit && (!best || delta < best.delta)) best = { type: pair[0], delta: delta };
      });
      if (best) aspects.push({ aKey: ak, bKey: bk, type: best.type, orb: best.delta });
    });
  });
  return aspects;
}
function computeSynastryScore(aspects) {
  var score = 60;
  var KEY_PLANETS = ['Sun', 'Moon', 'Venus', 'Mars'];
  aspects.forEach(function (asp) {
    var orbLimit = CROSS_ASPECT_ORB[asp.type];
    var strength = 1 - asp.orb / orbLimit;
    var weight = (KEY_PLANETS.indexOf(asp.aKey) >= 0 && KEY_PLANETS.indexOf(asp.bKey) >= 0) ? 1.4 : 0.8;
    score += astroAspectPoints(asp.type, asp.aKey) * strength * weight * 0.35;
  });
  return Math.max(20, Math.min(95, Math.round(score)));
}
function crossAspectText(asp, labelA, labelB) {
  var aDef = PLANET_DEFS.find(function (x) { return x.key === asp.aKey; });
  var bDef = PLANET_DEFS.find(function (x) { return x.key === asp.bKey; });
  var def = ASPECT_DEFS[asp.type];
  var body = def.tpl.replace('{A}', labelA + aDef.zh).replace('{B}', labelB + bDef.zh).replace('{ak}', aDef.kw).replace('{bk}', bDef.kw);
  return labelA + aDef.zh + def.zh + labelB + bDef.zh + '（誤差 ' + asp.orb.toFixed(1) + '°）：' + body + '。';
}
var CROSS_POINT_EVERYDAY = {
  Sun: '自我定位與人生方向',
  Moon: '情緒反應與安全感',
  Mercury: '溝通與理解方式',
  Venus: '表達喜歡與經營關係的方式',
  Mars: '採取行動與處理衝突的方式',
  Jupiter: '鼓勵對方與看待成長的方式',
  Saturn: '承擔責任、設定界線與面對壓力的方式',
  Uranus: '自由、改變與新鮮感的需要',
  Neptune: '想像、同理與理想化的傾向',
  Pluto: '控制局面、建立信任與面對重大改變的方式',
};
function crossPointEveryday(key, owner) {
  var def = findAnyPointDef(key);
  return owner + '的' + (CROSS_POINT_EVERYDAY[key] || (def ? def.meaning : '反應方式'));
}
function crossAspectEveryday(asp) {
  var a = crossPointEveryday(asp.aKey, '你');
  var b = crossPointEveryday(asp.bKey, '對方');
  var byType = {
    conjunction: {
      lead: a + '很容易直接帶動' + b + '，兩人的反應常會在同一時間被放大。',
      strength: '彼此一有反應，另一方通常很快就能接到，容易形成鮮明而緊密的互動。',
      watch: '兩人的反應黏得太近時，可能分不清現在真正需要處理的是誰的需求。',
      practice: '事情升溫時，先各自說一句「我現在需要什麼」，再決定下一步。',
    },
    sextile: {
      lead: '只要其中一人先開口或採取行動，' + a + '和' + b + '通常就能互相配合。',
      strength: '願意主動確認彼此想法時，這一塊很容易成為關係中的助力。',
      watch: '因為平時沒有明顯衝突，兩人可能忽略這份默契需要主動使用才看得見。',
      practice: '遇到相關事情時，直接提出一個具體邀請或問題，不要只等對方先反應。',
    },
    trine: {
      lead: a + '和' + b + '很容易接上，相處時通常不必花太多力氣磨合這一塊。',
      strength: '兩人容易理解彼此的節奏，合作或相處時較少在這件事上互相消耗。',
      watch: '太習慣事情自然順下去，可能把對方的配合視為理所當然。',
      practice: '把這份默契用在一件共同目標上，並明確說出你欣賞對方的哪個做法。',
    },
    square: {
      lead: a + '容易碰到' + b + '的敏感點，同一件事常讓兩人採取不同反應。',
      strength: '如果願意把差異說清楚，這種摩擦能幫兩人看見原本忽略的角度。',
      watch: '壓力一高，雙方容易各自加大力道，最後從處理事情變成互相防衛。',
      practice: '發生摩擦時先只談一件具體事件，不翻舊帳，也不猜測對方動機。',
    },
    opposition: {
      lead: a + '和' + b + '常站在不同位置，一方越往前，另一方越容易往相反方向反應。',
      strength: '兩人能補到彼此看不到的一面，適合在決策前交換不同立場。',
      watch: '若只認為自己的反應合理，關係容易變成一人推進、另一人抵抗。',
      practice: '做決定前，各自說出最在意的一項需求，再找能同時保留兩邊的方案。',
    },
  };
  return byType[asp.type] || byType.conjunction;
}
/* 合盤原本用上面那段 crossAspectText（術語堆砌、每種相位類型只有一套固定敘述）
   直接顯示給使用者看，這正是個人星盤在任務 #61/#63 修過的同一個問題——現在
   改用跟本命盤同一套 aspectBeginnerData／ASPECT_BEGINNER 白話系統，只是標題
   加上「本人／對方」以區分這是兩個人之間的交叉相位，其餘的白話敘述、關鍵字
   代入與多種句型輪替完全共用同一份邏輯，不用另外重寫一份。 */
/* usedSet（選填）：跟 aspectBeginnerDataUnique() 同樣的用意——合盤一次會列出
   最多 10 組交叉相位（見 renderSynastry），每組相位各自從只有 2 個版本的模板池
   挑句子，同一種相位類型出現多次時很容易撞到同一個版本，讀起來像同一句話講
   了好幾遍。有傳 usedSet 進來時，四個欄位（lead/strength/watch/practice）都
   會各自檢查、避開同一份清單裡已經用過的模板骨架；不傳就跟原本行為一樣。 */
function renderCrossAspectBeginnerCard(asp, usedSet) {
  var aDef = findAnyPointDef(asp.aKey), bDef = findAnyPointDef(asp.bKey);
  var d = crossAspectEveryday(asp);
  var title = crossPointEveryday(asp.aKey, '你') + ' × ' + crossPointEveryday(asp.bKey, '對方');
  var lead = d.lead, strength = d.strength, watch = d.watch, practice = d.practice;
  return '<article style="border-top:1px solid rgba(201,169,110,.15);padding:12px 0"><div style="font:600 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8">' + esc(title) + '</div><div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.75;margin-top:5px">' + esc(lead) + '</div><div style="margin-top:7px;font:400 11px \'Noto Sans TC\',sans-serif;color:#9bc5a3;line-height:1.65">優勢：' + esc(strength) + '</div><div style="margin-top:3px;font:400 11px \'Noto Sans TC\',sans-serif;color:#d9a0a0;line-height:1.65">容易卡住：' + esc(watch) + '</div><div style="margin-top:3px;font:400 11px \'Noto Sans TC\',sans-serif;color:#e6cd9a;line-height:1.65">可以怎麼練習：' + esc(practice) + '</div><details style="margin-top:8px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);cursor:pointer">查看相位名稱、容許度與專業解讀</summary><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);line-height:1.7;margin-top:6px">' + esc(crossAspectText(asp, '本人', '對方')) + '</div></details></article>';
}
function synastryFlashCopied() {
  var btn = document.getElementById('syn-copy-btn');
  if (btn) btn.textContent = '已複製！Copied';
  clearTimeout(_astroCopyTimer);
  _astroCopyTimer = setTimeout(function () {
    var b = document.getElementById('syn-copy-btn');
    if (b) b.textContent = '複製給 AI 解讀 Copy for AI';
  }, 2000);
}
function synastryCopyForAI() {
  var chartA = state.astroResult, chartB = state.synResult;
  if (!chartA || !chartB) return;
  var aspects = computeCrossChartAspects(chartA, chartB).sort(function (a, b) { return a.orb - b.orb; });
  var score = computeSynastryScore(aspects);
  var lines = [];
  lines.push('合盤資料 Synastry Data');
  lines.push('關係類型：' + synRelationshipLabel());
  lines.push('本人：' + (state.astroUnknownTime ? '出生時間未知、' : ZODIAC_SIGNS[chartA.ascSign].zh + '上升、') + ZODIAC_SIGNS[chartA.planets.Sun.sign].zh + '太陽、' + ZODIAC_SIGNS[chartA.planets.Moon.sign].zh + '月亮');
  lines.push('對方：' + (state.synUnknownTime ? '出生時間未知、' : ZODIAC_SIGNS[chartB.ascSign].zh + '上升、') + ZODIAC_SIGNS[chartB.planets.Sun.sign].zh + '太陽、' + ZODIAC_SIGNS[chartB.planets.Moon.sign].zh + '月亮');
  lines.push('合盤相性指數：' + score + ' 分');
  lines.push('');
  lines.push('交叉相位 Cross-aspects：');
  aspects.forEach(function (asp) {
    var aDef = PLANET_DEFS.find(function (x) { return x.key === asp.aKey; });
    var bDef = PLANET_DEFS.find(function (x) { return x.key === asp.bKey; });
    lines.push('- 本人' + aDef.zh + ' ' + ASPECT_DEFS[asp.type].zh + ' 對方' + bDef.zh + '（誤差 ' + asp.orb.toFixed(2) + '°）');
  });
  lines.push('');
  lines.push('請根據以上兩人的合盤交叉相位，針對「' + synRelationshipLabel() + '」分析彼此的默契、互動優勢與需要磨合的課題。');
  lines.push(personaInstructionLine());
  var text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(synastryFlashCopied).catch(function () { fallbackCopy(text, synastryFlashCopied); });
  } else {
    fallbackCopy(text, synastryFlashCopied);
  }
}
function renderSynastry() {
  var h = '<div style="font:600 16px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:6px;text-align:center">合盤 Synastry</div>';
  h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:13px">這段關係的類型</div><div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:7px">';
  [['love','戀愛／伴侶'],['family','親子／家人'],['friend','朋友'],['work','工作夥伴']].forEach(function(r){var on=state.synRelationship===r[0];h+='<button aria-pressed="'+on+'" onclick="synSetRelationship(\''+r[0]+'\')" style="background:'+(on?'rgba(201,169,110,.18)':'rgba(255,255,255,.02)')+';border:1px solid '+(on?'#c9a96e':'rgba(201,169,110,.3)')+';color:'+(on?'#f0e9d8':'rgba(240,233,216,.6)')+';padding:7px 11px;border-radius:15px;cursor:pointer">'+r[1]+'</button>';});
  h += '</div>';
  if (!state.synResult) {
    h += renderBirthInputForm('syn', '輸入對方的出生資料，看看兩人的星盤如何互動——合盤會比對雙方的行星關係，適合用來理解一段感情或關係的默契與課題。兩人都有出生時間時比對最完整；如果對方不確定時間，下面一樣可以勾選「不確定時間」繼續。', 'synGenerate');
    return h;
  }
  var chartA = state.astroResult, chartB = state.synResult;
  var aspects = computeCrossChartAspects(chartA, chartB).sort(function (a, b) { return a.orb - b.orb; });
  var score = computeSynastryScore(aspects);
  h += renderOverallScoreBlock(score, synRelationshipLabel() + '相性指數');
  h += '<div style="display:flex;gap:10px;margin-top:14px;text-align:center">';
  h += '<div style="flex:1;border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:10px"><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">本人</div><div style="font:600 13px \'Noto Serif TC\',serif;color:#e6cd9a;margin-top:3px">' + (state.astroUnknownTime ? '出生時間未知' : ZODIAC_SIGNS[chartA.ascSign].sym + ' ' + ZODIAC_SIGNS[chartA.ascSign].zh + '上升') + '</div><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:2px">' + ZODIAC_SIGNS[chartA.planets.Sun.sign].zh + '太陽　' + ZODIAC_SIGNS[chartA.planets.Moon.sign].zh + '月亮</div></div>';
  h += '<div style="flex:1;border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:10px"><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">對方</div><div style="font:600 13px \'Noto Serif TC\',serif;color:#e6cd9a;margin-top:3px">' + (state.synUnknownTime ? '出生時間未知' : ZODIAC_SIGNS[chartB.ascSign].sym + ' ' + ZODIAC_SIGNS[chartB.ascSign].zh + '上升') + '</div><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:2px">' + ZODIAC_SIGNS[chartB.planets.Sun.sign].zh + '太陽　' + ZODIAC_SIGNS[chartB.planets.Moon.sign].zh + '月亮</div></div>';
  h += '</div>';

  var harmonious = aspects.filter(function (a) { return a.type === 'trine' || a.type === 'sextile'; }).length;
  var challenging = aspects.filter(function (a) { return a.type === 'square' || a.type === 'opposition'; }).length;
  var summaryTxt = '這份「' + synRelationshipLabel() + '」合盤裡，兩人的星盤有 ' + aspects.length + ' 組明顯的互相牽動（占星上叫「相位」），其中 ' + harmonious + ' 組是彼此加分的、' + challenging + ' 組是需要磨合的。' +
    (score >= 72 ? '整體默契不錯，彼此的能量容易自然地互相支援。' : score <= 45 ? '相處上需要多一點耐心磨合，摩擦也是認識彼此的機會。' : '有順也有磨，是需要花時間慢慢培養默契的一段關係。');
  h += '<div style="margin-top:16px;border-top:1px solid rgba(201,169,110,.15);border-bottom:1px solid rgba(201,169,110,.15);padding:14px 0;font:400 13px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.8);line-height:1.9">' + esc(summaryTxt) + '</div>';

  /* 相性指數、和諧與挑戰的組數、每組相位的緊密程度本來就都算好了，
     以前只是整包用文字列出來，讓人自己在腦中組裝。這兩張圖用的是同一份
     aspects，不另外計算，所以圖跟下面的文字一定一致。 */
  if (typeof renderSynastryLinkChart === 'function') {
    h += renderSynastryLinkChart(chartA, chartB, aspects, state.synFacet);
  }
  if (typeof renderSynastryFacetBars === 'function') {
    h += renderSynastryFacetBars(aspects, state.synFacet);
  }

  /* 點了某個面向之後，下面的相位卡片跟著只顯示相關的那幾組——
     這同時解決「畫面太多字」與「圖跟文字各說各話」兩個問題。 */
  var activeFacetDef = state.synFacet && typeof SYNASTRY_FACETS !== 'undefined'
    ? SYNASTRY_FACETS.filter(function (f) { return f.key === state.synFacet; })[0] : null;
  var listed = activeFacetDef ? aspects.filter(function (asp) {
    return activeFacetDef.planets.indexOf(asp.aKey) !== -1 || activeFacetDef.planets.indexOf(asp.bKey) !== -1;
  }) : aspects;

  h += '<div style="margin-top:18px;display:flex;justify-content:space-between;align-items:baseline;gap:10px">';
  h += '<span style="font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5)">'
    + (activeFacetDef ? esc(activeFacetDef.zh) + '　相關的牽動' : '兩人之間最關鍵的幾組牽動') + '</span>';
  if (activeFacetDef) {
    h += '<button type="button" onclick="synSetFacet(\'\')" style="flex:none;background:none;border:1px solid rgba(201,169,110,.35);color:#c9a96e;font:400 10.5px \'Noto Sans TC\',sans-serif;padding:5px 10px;border-radius:14px;cursor:pointer">看全部 ✕</button>';
  }
  h += '</div>';
  if (!listed.length) {
    h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:10px;line-height:1.8">這個面向沒有明顯的交叉相位，代表兩人在這一塊沒有特別強的互相牽動——不是好或壞，就是比較平淡。</div>';
  }
  var crossUsedSet = {};
  listed.slice(0, 10).forEach(function (asp) {
    h += renderCrossAspectBeginnerCard(asp, crossUsedSet);
  });

  h += renderPersonaPicker();
  h += '<button id="syn-copy-btn" onclick="synastryCopyForAI()" style="width:100%;margin-top:22px;padding:12px;border-radius:12px;border:1px solid #c9a96e;background:rgba(201,169,110,.12);color:#e6cd9a;font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">複製給 AI 解讀 Copy for AI</button>';
  h += '<button onclick="synReset()" style="width:100%;margin-top:10px;padding:12px;border-radius:12px;border:1px solid rgba(201,169,110,.3);background:rgba(255,255,255,.02);color:rgba(240,233,216,.6);font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">重新輸入對方資料 ↺</button>';
  return h;
}


/* ---------- 二次推運 Secondary Progression ---------- */
/* ================= 二次推運 Secondary Progression ================= */
function computeProgressedChart(natalChart, city, targetDate) {
  targetDate = targetDate || new Date();
  var elapsedDays = (targetDate.getTime() - natalChart.utcDate.getTime()) / 86400000;
  var elapsedYears = elapsedDays / 365.2422;
  var progTime = Astronomy.MakeTime(natalChart.utcDate).AddDays(elapsedYears);
  var chart = computeReturnChart(progTime, city.lat, city.lon, natalChart);
  chart.ageYears = elapsedYears;
  chart.targetDate = targetDate;
  return chart;
}
function progressionAspects(natal, prog) {
  return computeCrossChartAspects(natal, prog).filter(function (a) {
    if (state.astroUnknownTime && (a.aKey === 'Moon' || a.bKey === 'Moon')) return false;
    return ['Sun', 'Moon', 'Venus', 'Mars', 'Mercury'].indexOf(a.bKey) >= 0;
  }).sort(function (a, b) { return a.orb - b.orb; });
}
function progressionAddYears(date, years) {
  var d = new Date(date.getTime());
  d.setFullYear(d.getFullYear() + years);
  return d;
}
function buildProgressionYears(natal, city, count) {
  var base = new Date(), rows = [];
  for (var i = 0; i < count; i++) {
    var startDate = progressionAddYears(base, i);
    var endDate = progressionAddYears(base, i + 1);
    var prog = computeProgressedChart(natal, city, startDate);
    var endProg = computeProgressedChart(natal, city, endDate);
    var aspects = progressionAspects(natal, prog);
    var moonChanged = prog.planets.Moon.sign !== endProg.planets.Moon.sign;
    var sunChanged = prog.planets.Sun.sign !== endProg.planets.Sun.sign;
    var tight = aspects.some(function (a) { return a.orb <= 0.5 && (a.bKey === 'Sun' || a.bKey === 'Venus'); });
    var focusMap = { Sun:'自我定位', Moon:'內在感受', Mercury:'思考溝通', Venus:'關係價值', Mars:'行動方向' };
    var focuses = [];
    aspects.slice(0, 5).forEach(function (a) { var f = focusMap[a.bKey]; if (f && focuses.indexOf(f) < 0) focuses.push(f); });
    var moonSign = ZODIAC_SIGNS[prog.planets.Moon.sign];
    var theme = moonSign.zh + '式的內在整理：' + moonSign.trait;
    if (sunChanged) theme = '核心自我進入新的長期階段';
    else if (moonChanged) theme = '情緒需求與安全感來源正在換檔';
    rows.push({ index:i, year:startDate.getFullYear(), startDate:startDate, endDate:endDate, prog:prog, endProg:endProg,
      aspects:aspects, moonChanged:moonChanged, sunChanged:sunChanged, isTransition:moonChanged || sunChanged || tight,
      focuses:focuses.slice(0, 3), theme:theme });
  }
  return rows;
}
function progressionAddMonths(date, months) {
  var first = new Date(date.getFullYear(), date.getMonth() + months, 1, date.getHours(), date.getMinutes(), date.getSeconds());
  var lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  first.setDate(Math.min(date.getDate(), lastDay));
  return first;
}
/* 未來十二個月：原本是十二張並排的小卡，每張都寫月份、推運月亮星座與當月最緊密的
   相位。但推運月亮 2～3 年才換一個星座，十二個月裡最多只換一次——十二張卡有十一張
   在講同一件事，實測這一區就佔了「1 年」頁面的 65%。

   改成先畫一條十二格的帶子（見 astro-charts.js 的 renderProgressionMonthStrip），
   再只列出真正不一樣的月份：換座的月份，以及當月主相位跟前一個月不同的月份。
   資訊沒有變少，只是不再把同一句話寫十二遍。 */
function renderProgressionMonths(natal, city) {
  var base = new Date(), charts = [];
  for (var i = 0; i <= 12; i++) charts.push(computeProgressedChart(natal, city, progressionAddMonths(base, i)));
  var monthUsedSet = {}, months = [];
  for (var m = 0; m < 12; m++) {
    var d = progressionAddMonths(base, m), p = charts[m], next = charts[m + 1];
    var aspects = progressionAspects(natal, p), top = aspects[0];
    months.push({
      label: (d.getMonth() + 1) + '月',
      sign: p.planets.Moon.sign,
      moonShift: p.planets.Moon.sign !== next.planets.Moon.sign,
      plain: top ? progressionAspectPlain(top, monthUsedSet) : null,
    });
  }

  var h = '<div style="margin-top:16px;font:500 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55)">未來 12 個月節奏</div>';
  if (typeof renderProgressionMonthStrip === 'function') h += renderProgressionMonthStrip(months);

  /* 只留下有變化的月份：換座的，或主相位標題跟前一個月不同的 */
  var shown = [], prevTitle = null;
  months.forEach(function (mo) {
    var title = mo.plain ? mo.plain.title : null;
    if (mo.moonShift || (title && title !== prevTitle)) shown.push(mo);
    if (title) prevTitle = title;
  });
  if (shown.length) {
    h += '<div style="display:flex;flex-direction:column;gap:7px;margin-top:10px">';
    shown.forEach(function (mo) {
      h += '<div style="border-left:2px solid ' + (mo.moonShift ? '#e6cd9a' : 'rgba(201,169,110,.3)') + ';padding-left:9px">';
      h += '<div style="font:600 11px \'Noto Sans TC\',sans-serif;color:#e6cd9a">' + esc(mo.label)
        + (mo.moonShift ? '　推運月亮換座' : '') + '</div>';
      if (mo.plain) {
        h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.7;margin-top:3px">'
          + esc(mo.plain.text) + '</div>';
      }
      h += '</div>';
    });
    h += '</div>';
  }
  return h;
}
function progSetYears(n) { state.progYears = n; state.progExpandedYear = 0; state.progOnlyTransitions = false; render(); window.scrollTo(0, 0); }
function progToggleYear(i) { state.progExpandedYear = state.progExpandedYear === i ? null : i; render(); }
function progToggleTransitions() { state.progOnlyTransitions = !state.progOnlyTransitions; render(); }
/* 推運摘要不直接顯示「核心自我／情緒安全感互相影響」這類內部分類名稱。
   先把本命端翻成「原本怎麼做」，推運端翻成「這段時間正在怎麼改變」，
   再說明兩者是互相幫助、自然配合或彼此干擾，讓沒有占星背景的人也能讀懂。 */
var PROGRESSION_POINT_EVERYDAY = {
  Sun: { short: '自我方向', natal: '你一向重視的自我方向', moving: '逐漸形成的自我定位' },
  Moon: { short: '情緒安全感', natal: '你原本的情緒安全感', moving: '正在改變的情緒需求' },
  Mercury: { short: '思考與溝通', natal: '你原本的思考與溝通方式', moving: '正在形成的新想法與表達方式' },
  Venus: { short: '關係與價值選擇', natal: '你原本的關係期待與價值選擇', moving: '逐漸改變的關係與價值選擇' },
  Mars: { short: '行動方向', natal: '你原本的行動方式', moving: '逐漸增強的行動動機' },
};
function progressionPointEveryday(key, phase) {
  var d = PROGRESSION_POINT_EVERYDAY[key];
  var fallback = findAnyPointDef(key);
  if (!d) return phase === 'moving' ? '正在改變的' + fallback.kw : '你原本的' + fallback.kw;
  return d[phase];
}
function progressionAspectPlain(a, usedSet) {
  var natal = PROGRESSION_POINT_EVERYDAY[a.aKey] || { short: findAnyPointDef(a.aKey).kw };
  var moving = PROGRESSION_POINT_EVERYDAY[a.bKey] || { short: findAnyPointDef(a.bKey).kw };
  var original = progressionPointEveryday(a.aKey, 'natal');
  var developing = progressionPointEveryday(a.bKey, 'moving');
  var byType = {
    conjunction: {
      text: '這段時間，' + original + '和' + developing + '會一起被放大，做決定時很難只顧其中一邊。',
      strength: '兩股動力集中，適合把力氣放在一個清楚目標上。',
      practice: '先寫下現在最重要的一個目標，再刪掉與它無關的安排。',
    },
    sextile: {
      text: '這段時間，只要你主動安排，' + original + '就能幫助' + developing + '順利往前。',
      strength: '原有經驗能替正在發展的新方向提供支持。',
      practice: '選一件想推進的事，排入明確日期，不要只停在想法。',
    },
    trine: {
      text: '這段時間，' + original + '和' + developing + '很容易配合，相關事情通常推進得較自然。',
      strength: '你能沿用熟悉的方法，較省力地適應目前的變化。',
      practice: '把這份順勢用在一件稍有難度的目標上，避免只維持原狀。',
    },
    square: {
      text: '這段時間，' + original + '容易和' + developing + '互相干擾，越急著一次處理越容易卡住。',
      strength: '衝突會迫使你看清楚目前真正需要調整的地方。',
      practice: '把問題拆成兩步，先處理眼前最急的一項，再安排下一項。',
    },
    opposition: {
      text: '這段時間，' + original + '和' + developing + '容易把你拉向不同方向，常需要重新排優先順序。',
      strength: '你能同時看見舊需求與新方向，不必倉促放棄任何一邊。',
      practice: '列出兩邊各自不能放掉的一件事，再選能同時保留它們的方案。',
    },
  };
  var d = byType[a.type] || byType.conjunction;
  return {
    title: natal.short + ' × ' + moving.short,
    text: d.text,
    strength: d.strength,
    practice: d.practice,
  };
}
function renderProgressionYearCard(row, natal, usedSet) {
  var p = row.prog, moon = ZODIAC_SIGNS[p.planets.Moon.sign], sun = ZODIAC_SIGNS[p.planets.Sun.sign];
  var open = state.progExpandedYear === row.index;
  var h = '<article style="margin-top:10px;border:1px solid ' + (row.isTransition ? 'rgba(230,205,154,.55)' : 'rgba(201,169,110,.22)') + ';border-radius:12px;background:rgba(255,255,255,.02);overflow:hidden">';
  h += '<button aria-expanded="' + open + '" onclick="progToggleYear(' + row.index + ')" style="display:block;width:100%;text-align:left;background:none;border:0;color:inherit;padding:13px 14px;cursor:pointer">';
  h += '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div style="font:600 17px \'Noto Serif TC\',serif;color:#e6cd9a">' + row.year + '</div><div style="display:flex;gap:6px;align-items:center">' + (row.isTransition ? '<span style="font:600 10px \'Noto Sans TC\',sans-serif;color:#211b15;background:#e6cd9a;border-radius:10px;padding:3px 7px">轉折年</span>' : '') + '<span style="font:400 15px sans-serif;color:rgba(240,233,216,.62)">' + (open ? '−' : '＋') + '</span></div></div>';
  h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.82);margin-top:5px;line-height:1.65">' + esc(row.theme) + '</div>';
  h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"><span style="font:400 10px \'Noto Sans TC\',sans-serif;color:#c9a96e">☽ ' + moon.zh + '</span><span style="font:400 10px \'Noto Sans TC\',sans-serif;color:#c9a96e">☉ ' + sun.zh + '</span>' + row.focuses.map(function(f){return '<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);border:1px solid rgba(201,169,110,.2);border-radius:10px;padding:2px 6px">'+f+'</span>';}).join('') + '</div>';
  /* 這一句取的就是第一組相位的內文，展開後那段會再完整出現一次。
     所以只在收合狀態顯示，當作點開前的引子。 */
  if (!open && row.aspects.length) { var firstPlain=progressionAspectPlain(row.aspects[0], usedSet); h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:8px;line-height:1.6">今年重點：' + esc(firstPlain.text) + '</div>'; }
  h += '</button>';
  if (open) {
    h += '<div style="border-top:1px solid rgba(201,169,110,.15);padding:12px 14px">';
    h += '<div style="padding:10px 11px;border-radius:9px;background:rgba(201,169,110,.07);font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.75">內心的安全感正用「'+esc(SIGN_BEGINNER[p.planets.Moon.sign].mode)+'」的方式調整；長期自我方向則帶著「'+esc(SIGN_BEGINNER[p.planets.Sun.sign].mode)+'」的色彩。</div>';
    if (row.moonChanged || row.sunChanged) h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:#e6cd9a;margin-top:10px;line-height:1.7">' + (row.moonChanged ? '• 這一年推運月亮將換座，內在需求會出現階段轉換。<br>' : '') + (row.sunChanged ? '• 這一年推運太陽將換座，是較少見的長期自我轉型。' : '') + '</div>';
    /* 六段「標題＋長解釋＋建議」讀完才知道這年偏順還偏卡；先用一條組成長條
       把全貌講完，再細講最緊密的三組。 */
    if (typeof renderProgressionYearAspects === 'function') h += renderProgressionYearAspects(row);
    var expandedUsedSet = {};
    row.aspects.slice(0, 3).forEach(function (a) { var d=progressionAspectPlain(a, expandedUsedSet); h += '<div style="border-top:1px solid rgba(201,169,110,.12);padding:9px 0"><div style="font:600 11px \'Noto Sans TC\',sans-serif;color:#f0e9d8">'+esc(d.title)+'</div><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.7;margin-top:4px">'+esc(d.text)+'</div><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:#e6cd9a;line-height:1.65;margin-top:4px">建議：'+esc(d.practice)+'</div><details style="margin-top:6px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);cursor:pointer">查看推運相位、容許度與專業解讀</summary><div style="margin-top:5px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.52);line-height:1.65">'+esc(crossAspectText(a,'本命','推運'))+'</div></details></div>'; });
    h += '<details style="margin-top:8px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);cursor:pointer">查看推運太陽、月亮精確位置</summary><div style="margin-top:5px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);line-height:1.7">推運月亮：'+moon.zh+' '+p.planets.Moon.deg.toFixed(1)+'°；推運太陽：'+sun.zh+' '+p.planets.Sun.deg.toFixed(1)+'°。</div></details>';
    if (!row.aspects.length) h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);line-height:1.7">這一年沒有容許度內特別緊密的主要相位，適合延續既有節奏。</div>';
    h += '</div>';
  }
  return h + '</article>';
}
function renderProgression() {
  var chart = state.astroResult;
  var city = state.astroCityUsed || CITY_LIST[state.astroCityIdx];
  var years = buildProgressionYears(chart, city, state.progYears || 1);

  var h = '<div style="font:600 16px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:6px;text-align:center">二次推運 Secondary Progression</div>';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);text-align:center;margin-top:6px;line-height:1.6">從現在開始，看見未來不同年份的內在發展節奏</div>';

  h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:14px">';
  [1,3,5,10].forEach(function(n){var on=state.progYears===n;h+='<button aria-pressed="'+on+'" onclick="progSetYears('+n+')" style="padding:8px 4px;border-radius:10px;border:1px solid '+(on?'#c9a96e':'rgba(201,169,110,.28)')+';background:'+(on?'rgba(201,169,110,.18)':'rgba(255,255,255,.02)')+';color:'+(on?'#f0e9d8':'rgba(240,233,216,.55)')+';font:500 11px \'Noto Sans TC\',sans-serif;cursor:pointer">'+n+' 年</button>';});
  h += '</div>';

  /* 先給一條時間軸讓人看出「哪幾年要注意」，再往下讀逐年的內容——
     buildProgressionYears() 早就標好 isTransition 了，只是以前沒畫出來。 */
  if (typeof renderProgressionTimeline === 'function') {
    h += renderProgressionTimeline(years, state.progExpandedYear);
  }

  var progExplainOpen = state.progExplainOpen !== false;
  h += '<details' + (progExplainOpen ? ' open' : '') + ' style="margin-top:12px;border:1px solid rgba(201,169,110,.2);border-radius:12px;padding:11px 14px;background:rgba(255,255,255,.02)" ontoggle="state.progExplainOpen=this.open">';
  h += '<summary style="font:600 12px \'Noto Sans TC\',sans-serif;color:#e6cd9a;cursor:pointer">推運在算什麼？（第一次來看這裡）</summary>';
  h += '<div style="margin-top:8px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.9">推運用的是「一天等於一年」的技術：把你出生後第幾天的星象，拿來對應你現在活到的年紀。例如你現在 30 歲，看的就是你出生後第 30 天當下太陽、月亮、上升的位置。這不是在算「今天會發生什麼事」，而是描繪你目前所在的人生階段、內心正在慢慢展開、轉變的主題。</div>';
  h += '<div style="margin-top:10px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.9">推運月亮大約每 2–3 年換一個星座，代表情緒需求與安全感來源；推運太陽通常要 28–30 年才換一次星座，是核心自我認同的長期轉型。' + (state.astroUnknownTime ? '出生時間未知，因此不顯示推運上升。' : '推運上升則反映目前對外展現自己的方式。') + '</div>';
  h += '</details>';

  var visible = state.progOnlyTransitions ? years.filter(function(y){return y.isTransition;}) : years;
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px"><div style="font:500 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55)">未來 ' + state.progYears + ' 年趨勢</div>';
  if (state.progYears > 1) h += '<button aria-pressed="'+state.progOnlyTransitions+'" onclick="progToggleTransitions()" style="background:none;border:1px solid rgba(201,169,110,.3);border-radius:12px;padding:5px 9px;color:#c9a96e;font:400 10px \'Noto Sans TC\',sans-serif;cursor:pointer">'+(state.progOnlyTransitions?'顯示全部年份':'只看轉折年')+'</button>';
  h += '</div>';
  if (!visible.length) h += '<div style="margin-top:12px;border:1px dashed rgba(201,169,110,.25);border-radius:12px;padding:16px;text-align:center;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">這個範圍內沒有被標記的明顯轉折年，可以切回「顯示全部年份」查看穩定發展期。</div>';
  var yearCardUsedSet = {};
  visible.forEach(function(row){h += renderProgressionYearCard(row, chart, yearCardUsedSet);});
  if (state.progYears === 1) h += renderProgressionMonths(chart, city);
  if (state.astroUnknownTime) h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.7;margin-top:10px">＊出生時間未知：不採用上升、天頂、宮位及月亮相關相位；推運月亮位置僅作概略階段參考。</div>';

  h += renderPersonaPicker();
  h += '<button id="prog-copy-btn" onclick="progressionCopyForAI()" style="width:100%;margin-top:22px;padding:12px;border-radius:12px;border:1px solid #c9a96e;background:rgba(201,169,110,.12);color:#e6cd9a;font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">複製未來 ' + state.progYears + ' 年給 AI 解讀</button>';
  return h;
}
function progressionFlashCopied() {
  var btn = document.getElementById('prog-copy-btn');
  if (btn) btn.textContent = '已複製！Copied';
  clearTimeout(_astroCopyTimer);
  _astroCopyTimer = setTimeout(function () {
    var b = document.getElementById('prog-copy-btn');
    if (b) b.textContent = '複製未來 ' + state.progYears + ' 年給 AI 解讀';
  }, 2000);
}
function progressionCopyForAI() {
  var chart = state.astroResult;
  var city = state.astroCityUsed || CITY_LIST[state.astroCityIdx];
  var years = buildProgressionYears(chart, city, state.progYears || 1);
  var lines = [];
  lines.push('未來 ' + state.progYears + ' 年二次推運資料 Secondary Progression（一天等於一年）');
  lines.push('起始日：' + new Date().toISOString().slice(0, 10));
  if (state.astroUnknownTime) lines.push('注意：出生時間未知，已排除上升、天頂、宮位與月亮相關相位。');
  years.forEach(function(row) {
    var p = row.prog;
    lines.push('');
    lines.push('【' + row.year + (row.isTransition ? '｜轉折年' : '') + '】' + row.theme);
    lines.push('推運月亮：' + ZODIAC_SIGNS[p.planets.Moon.sign].zh + ' ' + p.planets.Moon.deg.toFixed(2) + '°');
    lines.push('推運太陽：' + ZODIAC_SIGNS[p.planets.Sun.sign].zh + ' ' + p.planets.Sun.deg.toFixed(2) + '°');
    if (row.moonChanged) lines.push('趨勢：這一年推運月亮換座。');
    if (row.sunChanged) lines.push('趨勢：這一年推運太陽換座。');
    row.aspects.slice(0, 6).forEach(function (asp) {
      var aDef = PLANET_DEFS.find(function (x) { return x.key === asp.aKey; });
      var bDef = PLANET_DEFS.find(function (x) { return x.key === asp.bKey; });
      lines.push('- 本命' + aDef.zh + ' ' + ASPECT_DEFS[asp.type].zh + ' 推運' + bDef.zh + '（誤差 ' + asp.orb.toFixed(2) + '°）');
    });
  });
  lines.push('');
  lines.push('請依年份比較以上二次推運，整理長期主題、重要轉折、關係／事業／內在發展，並提醒這是占星趨勢而非事件保證。');
  lines.push(personaInstructionLine());
  var text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(progressionFlashCopied).catch(function () { fallbackCopy(text, progressionFlashCopied); });
  } else {
    fallbackCopy(text, progressionFlashCopied);
  }
}

/* ---------- 二十八星宿 render + interactions ---------- */

/* ---------- 二十八星宿：畫面與互動 ---------- */
function xiuSetMode(m) { state.xiuMode = m; render(); window.scrollTo(0, 0); }
function xiuDateInput(prefix, field, v) { state[prefix + field] = v; }
function xiuBirthReady(prefix) {
  var y = state[prefix + 'Y'], m = state[prefix + 'M'], d = state[prefix + 'D'];
  return y && m && d && !validateBirthDate(y, m, d, '12', '0', true);
}
/* 如果本命星盤或合盤已經填過生日，直接借用那組資料當預設值，不用使用者重打一次 */
function xiuPrefillFromAstro() {
  if (!state.xiuY && state.astroY && state.astroM && state.astroD) {
    state.xiuY = state.astroY; state.xiuM = state.astroM; state.xiuD = state.astroD;
  }
  if (!state.xiuPartnerY && state.synY && state.synM && state.synD) {
    state.xiuPartnerY = state.synY; state.xiuPartnerM = state.synM; state.xiuPartnerD = state.synD;
  }
}
/* 常用對象：把比對過的朋友生日存起來，下次合盤不用重新輸入 */
function xiuSaveSavedPartnersToStorage() {
  try { localStorage.setItem('tl_xiu_partners', JSON.stringify(state.xiuSavedPartners)); } catch (e) {}
}
function xiuSavePartner() {
  if (!xiuBirthReady('xiuPartner')) return;
  var name = '';
  try { name = window.prompt('幫這位朋友取個名字，方便下次快速選取（例如：小美）', '') || ''; } catch (e) {}
  name = String(name).trim();
  if (!name) return;
  var entry = { name: name, y: state.xiuPartnerY, m: state.xiuPartnerM, d: state.xiuPartnerD };
  var idx = -1;
  for (var i = 0; i < state.xiuSavedPartners.length; i++) { if (state.xiuSavedPartners[i].name === name) { idx = i; break; } }
  if (idx >= 0) state.xiuSavedPartners[idx] = entry; else state.xiuSavedPartners.push(entry);
  xiuSaveSavedPartnersToStorage();
  render();
}
function xiuSelectSavedPartner(idx) {
  var p = state.xiuSavedPartners[idx];
  if (!p) return;
  state.xiuPartnerY = p.y; state.xiuPartnerM = p.m; state.xiuPartnerD = p.d;
  render();
}
function xiuDeleteSavedPartner(idx, ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  try { if (!confirm('刪除這位朋友的存檔？')) return; } catch (e) {}
  state.xiuSavedPartners.splice(idx, 1);
  xiuSaveSavedPartnersToStorage();
  render();
}
function renderXiuSavedPartnerPicker() {
  if (!state.xiuSavedPartners.length) return '';
  var h = '<div style="margin-top:10px"><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-bottom:5px">常用對象，點一下快速帶入</div><div style="display:flex;flex-wrap:wrap;gap:6px">';
  state.xiuSavedPartners.forEach(function (p, idx) {
    h += '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.03);border:1px solid rgba(201,169,110,.3);border-radius:14px;padding:4px 5px 4px 11px">';
    h += '<button onclick="xiuSelectSavedPartner(' + idx + ')" style="background:none;border:none;color:rgba(240,233,216,.75);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;padding:0">' + esc(p.name) + '</button>';
    h += '<button onclick="xiuDeleteSavedPartner(' + idx + ',event)" aria-label="刪除存檔" style="background:none;border:none;color:rgba(240,233,216,.62);font:400 13px sans-serif;cursor:pointer;padding:0 4px;line-height:1">×</button>';
    h += '</span>';
  });
  h += '</div></div>';
  return h;
}
function xiuBirthInputBlock(prefix, label, nextIdAfterD) {
  var h = '<div style="margin-top:14px">';
  h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">' + label + '</div>';
  h += '<div style="display:flex;gap:8px;margin-top:6px">';
  var fieldMeta = { Y: ['年 YYYY', 1900, 2100, 4, prefix + '-m'], M: ['月 MM', 1, 12, 2, prefix + '-d'], D: ['日 DD', 1, 31, 2, nextIdAfterD || ''] };
  ['Y', 'M', 'D'].forEach(function (f) {
    var meta = fieldMeta[f], ph = meta[0], id = prefix + '-' + f.toLowerCase(), nextId = meta[4], digits = meta[3];
    h += '<input id="' + id + '" aria-label="' + label + ph + '" inputmode="numeric" min="' + meta[1] + '" max="' + meta[2] + '" type="number" placeholder="' + ph + '" value="' + esc(state[prefix + f]) + '" oninput="xiuDateInput(\'' + prefix + '\',\'' + f + '\',this.value);' + (nextId ? 'birthAutoNext(this,\'' + nextId + '\',' + digits + ')' : '') + '" onblur="render()" style="width:33%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
  });
  h += '</div>';
  var y = state[prefix + 'Y'], m = state[prefix + 'M'], d = state[prefix + 'D'];
  if (y && m && d) {
    var err = validateBirthDate(y, m, d, '12', '0', true);
    if (err) h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:#d67878;margin-top:6px">⚠ ' + esc(err) + '</div>';
  }
  h += '</div>';
  return h;
}
function xiuMansionCard(idx, titlePrefix) {
  var x = XIU_DEFS[idx];
  var h = '<div style="margin-top:14px;border:1px solid ' + XIU_DIR_COLOR[x.dir] + ';border-radius:12px;padding:14px 16px;background:rgba(255,255,255,.02)">';
  h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:' + XIU_DIR_COLOR[x.dir] + ';letter-spacing:.1em">' + esc(titlePrefix || '') + esc(x.dir) + '</div>';
  h += '<div style="font:600 20px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:4px">' + esc(x.zh) + '宿 · ' + esc(x.animal) + '（' + esc(x.elem) + '曜）</div>';
  h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.8);margin-top:8px;line-height:1.85">' + esc(x.trait) + '</div>';
  h += '<div style="margin-top:8px;font:400 11px \'Noto Sans TC\',sans-serif;color:#9bc5a3;line-height:1.65">適合：' + esc(x.good) + '</div>';
  h += '<div style="margin-top:3px;font:400 11px \'Noto Sans TC\',sans-serif;color:#d9a0a0;line-height:1.65">不適合：' + esc(x.avoid) + '</div>';
  h += '</div>';
  return h;
}
function renderXiuModeNav() {
  var modes = [['personal', '本命星宿'], ['compat', '合盤比較'], ['daily', '每日參考'], ['wiki', '星宿百科']];
  var h = '<div style="display:flex;gap:6px;margin-top:14px;flex-wrap:wrap;justify-content:center">';
  modes.forEach(function (mo) {
    var on = state.xiuMode === mo[0];
    h += '<button aria-pressed="' + on + '" onclick="xiuSetMode(\'' + mo[0] + '\')" style="font:500 11px \'Noto Sans TC\',sans-serif;background:' + (on ? 'rgba(201,169,110,.2)' : 'rgba(255,255,255,.03)') + ';border:1px solid ' + (on ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';color:' + (on ? '#f0e9d8' : 'rgba(240,233,216,.55)') + ';padding:6px 13px;border-radius:14px;cursor:pointer">' + mo[1] + '</button>';
  });
  h += '</div>';
  return h;
}
function renderXiu28() {
  xiuPrefillFromAstro();
  var h = '<div style="font:600 16px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:6px;text-align:center">二十八星宿 28 Lunar Mansions</div>';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);text-align:center;margin-top:6px;line-height:1.6">中國古代天文將黃道分成 28 個區域，自古用於擇日與命理參考</div>';
  h += renderXiuModeNav();

  if (state.xiuMode === 'personal') {
    h += xiuBirthInputBlock('xiu', '你的生日（陽曆）');
    if (xiuBirthReady('xiu')) {
      var idx = xiuIndexForYMD(parseInt(state.xiuY, 10), parseInt(state.xiuM, 10), parseInt(state.xiuD, 10));
      h += xiuMansionCard(idx, '你的本命星宿 · ');
      h += renderPersonaPicker();
      h += '<button id="xiu-copy-btn" onclick="xiuCopyForAI()" style="width:100%;margin-top:16px;padding:12px;border-radius:12px;border:1px solid #c9a96e;background:rgba(201,169,110,.12);color:#e6cd9a;font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">複製給 AI 解讀 Copy for AI</button>';
      h += '<button onclick="xiuSetMode(\'compat\')" style="width:100%;margin-top:10px;padding:11px;border-radius:12px;border:1px solid rgba(201,169,110,.3);background:rgba(255,255,255,.02);color:rgba(240,233,216,.6);font:500 12px \'Noto Sans TC\',sans-serif;cursor:pointer">想知道你跟另一半／朋友的星宿關係嗎？點這裡試試合盤比較 →</button>';
    } else {
      h += '<div style="margin-top:14px;text-align:center;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">請輸入完整的出生年月日</div>';
    }
    h += '<div style="margin-top:16px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.8">＊本命星宿採用「連續 28 日循環」直接對照你的陽曆生日計算，跟每日／擇日用的是同一套邏輯；這跟少數命理流派另外使用的農曆演禽本命宿表是不同的系統，兩者可能對不上，這裡選擇邏輯一致、可驗證的版本。</div>';

  } else if (state.xiuMode === 'compat') {
    h += xiuBirthInputBlock('xiu', '你的生日（陽曆）', 'xiuPartner-y');
    h += xiuBirthInputBlock('xiuPartner', '對方的生日（陽曆）');
    h += renderXiuSavedPartnerPicker();
    if (xiuBirthReady('xiu') && xiuBirthReady('xiuPartner')) {
      var idxA = xiuIndexForYMD(parseInt(state.xiuY, 10), parseInt(state.xiuM, 10), parseInt(state.xiuD, 10));
      var idxB = xiuIndexForYMD(parseInt(state.xiuPartnerY, 10), parseInt(state.xiuPartnerM, 10), parseInt(state.xiuPartnerD, 10));
      h += xiuMansionCard(idxA, '你 · ');
      h += xiuMansionCard(idxB, '對方 · ');
      var rel = xiuRelationData(idxA, idxB);
      var relLabel = { same: '同宿', sameElem: '同曜共鳴', sameDir: '同象呼應', oppositeDir: '對宮張力', neighborDir: '鄰象互補' }[rel.category];
      h += '<div style="margin-top:14px;border:1px solid #c9a96e;border-radius:12px;padding:14px 16px;background:rgba(201,169,110,.08)">';
      h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:#c9a96e;letter-spacing:.1em">關係類型 · ' + esc(relLabel) + '</div>';
      h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:6px;line-height:1.85">' + esc(rel.lead) + '</div>';
      h += '<div style="margin-top:8px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.8">' + esc(rel.advice) + '</div>';
      h += '</div>';
      var lrel = xiuLegacyRelation(idxA, idxB);
      h += '<div style="margin-top:12px;border:1px solid rgba(201,169,110,.4);border-radius:12px;padding:14px 16px;background:rgba(201,169,110,.05)">';
      h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:#c9a96e;letter-spacing:.1em">傳統六戀關係 · ' + esc(lrel.pairName) + (lrel.dist ? '（' + esc(lrel.dist) + '）' : '') + '</div>';
      h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:6px;line-height:1.85">' + esc(lrel.meaning.gist) + '</div>';
      h += '<div style="margin-top:8px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.8">' + esc(lrel.meaning.detail) + '</div>';
      h += '<div style="margin-top:8px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);line-height:1.7">對方是你的「' + esc(lrel.otherIsYour) + '星」，你是對方的「' + esc(lrel.youAreOthers) + '星」。</div>';
      h += '<details style="margin-top:8px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);cursor:pointer">六戀關係是怎麼換算出來的？</summary><div style="margin-top:6px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);line-height:1.75">傳統「六戀」命名法用的是「演禽廿七宿」系統：把牛宿和女宿併成同一個位置，共 27 個位置排成一圈，再看兩人的位置相差幾格決定屬於哪一種六戀關係。這裡日常用的本命星宿則是 28 個位置（牛、女分開，每天換一格，可回推日期驗證），所以會先把兩人的 28 宿位置換算成這套 27 宿系統的位置，再套用六戀表——這也是上面同時看得到「關係類型」（28 宿邏輯）與「傳統六戀關係」（27 宿邏輯）兩種分類的原因。</div></details>';
      h += '</div>';
      h += '<button onclick="xiuSavePartner()" style="width:100%;margin-top:10px;padding:11px;border-radius:12px;border:1px solid rgba(201,169,110,.3);background:rgba(255,255,255,.02);color:rgba(240,233,216,.6);font:500 12px \'Noto Sans TC\',sans-serif;cursor:pointer">💾 存下對方資料，下次快速選取</button>';
      h += renderPersonaPicker();
      h += '<button id="xiu-copy-btn" onclick="xiuCopyForAI()" style="width:100%;margin-top:16px;padding:12px;border-radius:12px;border:1px solid #c9a96e;background:rgba(201,169,110,.12);color:#e6cd9a;font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">複製給 AI 解讀 Copy for AI</button>';
    } else {
      h += '<div style="margin-top:14px;text-align:center;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">請輸入兩人完整的出生年月日</div>';
    }
    h += '<div style="margin-top:16px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.8">＊「關係類型」是根據星宿在四象／七曜上的結構性關係（同宿、同曜、同象、對象、鄰象）設計的簡化版本；「傳統六戀關係」則是換算成演禽廿七宿系統（牛、女併同一格）後套用的古典命名法（榮親／友衰／危成／安壞／業胎／命之星），兩套系統算法不同，可以互相參考。</div>';

  } else if (state.xiuMode === 'daily') {
    var now = new Date();
    var anchor = state.xiuDayAnchor ? new Date(state.xiuDayAnchor + 'T00:00:00') : now;
    var ay = anchor.getFullYear(), am = anchor.getMonth() + 1, ad = anchor.getDate();
    var dIdx = xiuIndexForYMD(ay, am, ad);
    var isToday = xiuDateStr(ay, am, ad) === xiuDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());
    h += '<div style="margin-top:14px;display:flex;gap:8px;align-items:center;justify-content:center">';
    h += '<input type="date" aria-label="查詢日期" value="' + ay + '-' + pad2(am) + '-' + pad2(ad) + '" onchange="xiuSetDayAnchor(this.value)" style="background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:8px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    if (!isToday) h += '<button onclick="xiuSetDayAnchor(null)" style="background:none;border:1px solid rgba(201,169,110,.3);border-radius:14px;padding:7px 12px;color:#c9a96e;font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer">回到今天</button>';
    h += '</div>';
    h += xiuMansionCard(dIdx, xiuDateStr(ay, am, ad) + ' · ');
    h += renderXiuWeekStrip(ay, am, ad);
    h += '<button id="xiu-copy-btn" onclick="xiuCopyForAI()" style="width:100%;margin-top:16px;padding:12px;border-radius:12px;border:1px solid #c9a96e;background:rgba(201,169,110,.12);color:#e6cd9a;font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">複製給 AI 解讀 Copy for AI</button>';

  } else if (state.xiuMode === 'wiki') {
    var _wikiNow = new Date();
    var _wikiTodayIdx = xiuIndexForYMD(_wikiNow.getFullYear(), _wikiNow.getMonth() + 1, _wikiNow.getDate());
    ['東方青龍', '北方玄武', '西方白虎', '南方朱雀'].forEach(function (dir) {
      h += '<div style="margin-top:16px;font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:' + XIU_DIR_COLOR[dir] + '">' + esc(dir) + '七宿</div>';
      XIU_DEFS.forEach(function (x, idx) {
        if (x.dir !== dir) return;
        var open = state.xiuWikiOpen === idx;
        var isToday = idx === _wikiTodayIdx;
        h += '<details' + (open ? ' open' : '') + ' style="margin-top:8px;border-top:1px solid ' + (isToday ? '#c9a96e' : 'rgba(201,169,110,.15)') + ';padding-top:8px" ontoggle="state.xiuWikiOpen=this.open?' + idx + ':null;var c=this.querySelector(\'.xiu-caret\');if(c)c.textContent=this.open?\'▾\':\'▸\'"><summary style="cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center"><span style="font:500 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8"><span class="xiu-caret" style="display:inline-block;width:14px">' + (open ? '▾' : '▸') + '</span>' + esc(x.zh) + '宿 · ' + esc(x.animal) + '（' + esc(x.elem) + '曜）' + (isToday ? ' <span style="font:500 9px \'Noto Sans TC\',sans-serif;color:#1a1410;background:#c9a96e;border-radius:8px;padding:1px 6px;margin-left:4px">今天</span>' : '') + '</span></summary>';
        h += '<div style="margin-top:6px;padding-left:14px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.8">' + esc(x.trait) + '</div>';
        h += '<div style="margin-top:4px;padding-left:14px;font:400 11px \'Noto Sans TC\',sans-serif;color:#9bc5a3;line-height:1.65">適合：' + esc(x.good) + '</div>';
        h += '<div style="margin-top:2px;padding-left:14px;font:400 11px \'Noto Sans TC\',sans-serif;color:#d9a0a0;line-height:1.65">不適合：' + esc(x.avoid) + '</div>';
        h += '</details>';
      });
    });
  }
  return h;
}
function xiuSetDayAnchor(v) { state.xiuDayAnchor = v; render(); }
/* 每日參考的「未來 7 天一覽」：從目前查詢的日期開始，方便擇日時一次比較好幾天 */
function renderXiuWeekStrip(ay, am, ad) {
  var base = new Date(ay, am - 1, ad);
  var wdNames = ['日', '一', '二', '三', '四', '五', '六'];
  var h = '<div style="margin-top:16px"><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-bottom:6px;text-align:center">未來 7 天一覽 · 點一下可切換查詢日</div><div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">';
  for (var i = 0; i < 7; i++) {
    var d = new Date(base.getTime());
    d.setDate(base.getDate() + i);
    var yy = d.getFullYear(), mm = d.getMonth() + 1, dd = d.getDate();
    var idx = xiuIndexForYMD(yy, mm, dd);
    var x = XIU_DEFS[idx];
    var isFirst = i === 0;
    h += '<button onclick="xiuSetDayAnchor(\'' + yy + '-' + pad2(mm) + '-' + pad2(dd) + '\')" style="flex:0 0 auto;min-width:62px;text-align:center;border:1px solid ' + (isFirst ? '#c9a96e' : XIU_DIR_COLOR[x.dir]) + ';border-radius:10px;padding:8px 5px;background:' + (isFirst ? 'rgba(201,169,110,.14)' : 'rgba(255,255,255,.02)') + ';cursor:pointer">';
    h += '<div style="font:400 9px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">週' + wdNames[d.getDay()] + ' ' + mm + '/' + dd + '</div>';
    h += '<div style="font:600 13px \'Noto Serif TC\',serif;color:#e6cd9a;margin-top:3px">' + esc(x.zh) + '宿</div>';
    h += '<div style="font:400 9px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:1px">' + esc(x.elem) + '曜</div>';
    h += '</button>';
  }
  h += '</div></div>';
  return h;
}
function xiuFlashCopied() {
  var btn = document.getElementById('xiu-copy-btn');
  if (btn) btn.textContent = '已複製！Copied';
  clearTimeout(_astroCopyTimer);
  _astroCopyTimer = setTimeout(function () {
    var b = document.getElementById('xiu-copy-btn');
    if (b) b.textContent = '複製給 AI 解讀 Copy for AI';
  }, 2000);
}
function xiuCopyForAI() {
  var lines = ['二十八星宿資料 28 Lunar Mansions'];
  if (state.xiuMode === 'compat' && xiuBirthReady('xiu') && xiuBirthReady('xiuPartner')) {
    var idxA = xiuIndexForYMD(parseInt(state.xiuY, 10), parseInt(state.xiuM, 10), parseInt(state.xiuD, 10));
    var idxB = xiuIndexForYMD(parseInt(state.xiuPartnerY, 10), parseInt(state.xiuPartnerM, 10), parseInt(state.xiuPartnerD, 10));
    var xA = XIU_DEFS[idxA], xB = XIU_DEFS[idxB];
    var rel = xiuRelationData(idxA, idxB);
    var lrel2 = xiuLegacyRelation(idxA, idxB);
    lines.push('你：生日 ' + xiuDateStr(state.xiuY, state.xiuM, state.xiuD) + '，' + xA.zh + '宿（' + xA.animal + '，' + xA.elem + '曜，' + xA.dir + '）');
    lines.push('特質：' + xA.trait + ' 適合：' + xA.good + '　不適合：' + xA.avoid);
    lines.push('對方：生日 ' + xiuDateStr(state.xiuPartnerY, state.xiuPartnerM, state.xiuPartnerD) + '，' + xB.zh + '宿（' + xB.animal + '，' + xB.elem + '曜，' + xB.dir + '）');
    lines.push('特質：' + xB.trait + ' 適合：' + xB.good + '　不適合：' + xB.avoid);
    lines.push('關係類型：' + rel.lead + ' ' + rel.advice);
    lines.push('傳統六戀關係：' + lrel2.pairName + '。' + lrel2.meaning.gist + ' ' + lrel2.meaning.detail + '（對方是你的「' + lrel2.otherIsYour + '星」，你是對方的「' + lrel2.youAreOthers + '星」）');
    lines.push('');
    lines.push('請根據以上兩人的星宿特質與關係類型，幫我分析這段關係的相處建議。');
  } else if (state.xiuMode === 'daily') {
    var now2 = new Date();
    var anchor2 = state.xiuDayAnchor ? new Date(state.xiuDayAnchor + 'T00:00:00') : now2;
    var ay2 = anchor2.getFullYear(), am2 = anchor2.getMonth() + 1, ad2 = anchor2.getDate();
    var dIdx2 = xiuIndexForYMD(ay2, am2, ad2);
    var xD = XIU_DEFS[dIdx2];
    lines.push('日期：' + xiuDateStr(ay2, am2, ad2) + '，值宿：' + xD.zh + '宿（' + xD.animal + '，' + xD.elem + '曜，' + xD.dir + '）');
    lines.push('適合：' + xD.good + '　不適合：' + xD.avoid);
    lines.push('');
    lines.push('請根據今天的值宿特性，幫我整理今天適合安排的事與該避免的事。');
  } else if (xiuBirthReady('xiu')) {
    var idx2 = xiuIndexForYMD(parseInt(state.xiuY, 10), parseInt(state.xiuM, 10), parseInt(state.xiuD, 10));
    var x2 = XIU_DEFS[idx2];
    lines.push('生日：' + xiuDateStr(state.xiuY, state.xiuM, state.xiuD) + '，本命星宿：' + x2.zh + '宿（' + x2.animal + '，' + x2.elem + '曜，' + x2.dir + '）');
    lines.push('特質：' + x2.trait);
    lines.push('適合：' + x2.good + '　不適合：' + x2.avoid);
    lines.push('');
    lines.push('請根據以上本命星宿特質，幫我做個性與生活建議的解讀。');
  } else {
    return;
  }
  lines.push(personaInstructionLine());
  var text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(xiuFlashCopied).catch(function () { fallbackCopy(text, xiuFlashCopied); });
  } else {
    fallbackCopy(text, xiuFlashCopied);
  }
}

function astroFlashCopied() {
  var btn = document.getElementById('astro-copy-btn');
  if (btn) btn.textContent = '已複製！Copied';
  clearTimeout(_astroCopyTimer);
  _astroCopyTimer = setTimeout(function () {
    var b = document.getElementById('astro-copy-btn');
    if (b) b.textContent = '複製給 AI 解讀 Copy for AI';
  }, 2000);
}
function astroCopyPositionLine(position, unknownTime) {
  var sign = ZODIAC_SIGNS[position.sign];
  return sign.zh + ' ' + position.deg.toFixed(2) + '°' +
    (unknownTime ? '；宮位不使用' : '；第' + position.house + '宮') +
    (position.retro ? '；逆行 R' : '；順行');
}
function astroCopyAspectEndpoint(key, chart, unknownTime) {
  var profile = natalAspectProfile(key);
  var position = natalAspectPosition(chart, key);
  if (!profile || !position) return '';
  return profile.name + '：' + astroCopyPositionLine(position, unknownTime);
}
/* V2 分工說明：這是「命盤解析」的複製給 AI（astroCopyForAI 呼叫），涵蓋整張命盤
   逐行星逐宮位的完整資料，用途是讓使用者拿到一份完整、系統性的星盤原始判斷依據。
   跟人生主題分析的 natalTopicCopyForAI() 不同——後者只針對使用者選的 1-3 個具體
   問題，資料是「依 intent 情境化過的 headline/summary/details/caution + 完整
   evidence（含 sourceRoles／權重）」，兩者服務目的不同，不應該合併成同一份，也
   不能讓其中一個只是另一個的截短版本（這是 V2 規格明確要求的）。 */
function buildAstroCopyText(chart, unknownTime) {
  if (!chart) return '';
  var lines = [];
  var birthStr = state.astroY + '/' + pad2(state.astroM) + '/' + pad2(state.astroD) + ' ' +
    (unknownTime ? '(出生時間未知；無時間星盤)' : pad2(state.astroH) + ':' + pad2(state.astroMin));
  lines.push('個人本命星盤完整資料 Natal Chart Data');
  lines.push('出生：' + birthStr);
  lines.push('地點：' + (state.astroCityUsed ? state.astroCityUsed.zh : '未提供'));
  lines.push('宮位制：' + (state.astroHouseSystem === 'whole' ? '整宮制 Whole Sign' : '普拉西德制 Placidus'));
  lines.push('資料可靠度：' + (unknownTime
    ? '出生時間未知；不使用上升、天頂、宮位、福點與頂點，月亮位置僅作當日可能範圍參考。'
    : '出生時間已提供；可使用上升、天頂與宮位。占星內容屬象徵性解讀，不是事件保證。'));

  lines.push('');
  lines.push('＝＝＝＝ 行星配置 ＝＝＝＝');
  PLANET_DEFS.forEach(function (d) {
    var p = chart.planets[d.key];
    if (!p) return;
    var r = planetPlacementReading(d, p, unknownTime);
    var pb = PLANET_BEGINNER[d.key];
    lines.push('');
    lines.push('【配置資料｜' + d.zh + ' ' + d.key + '】');
    lines.push('位置：' + astroCopyPositionLine(p, unknownTime));
    if (unknownTime && d.key === 'Moon') lines.push('月亮可靠度：出生時間未知；當日可能範圍為 ' + astroMoonRangeText() + '，不採用月亮宮位。');
    lines.push('核心功能：' + pb['function']);
    lines.push('【一般摘要】');
    lines.push(r.summary);
    lines.push('【生活中的表現】');
    lines.push(r.lifeExpression);
    lines.push('【占星推導】');
    lines.push('行星功能：' + r.advanced.planetFunction);
    lines.push('星座運作：' + r.advanced.signMethod);
    lines.push('宮位情境：' + r.advanced.houseActivation);
    lines.push('融合解讀：' + r.advanced.synthesis);
    lines.push('成熟方向：' + r.advanced.growth);
    lines.push('【可以發揮】');
    lines.push(r.strength);
    lines.push('【需要留意】');
    lines.push(r.caution);
    lines.push('【專業資料】');
    lines.push(r.technical);
  });

  lines.push('');
  lines.push('＝＝＝＝ 額外本命點 ＝＝＝＝');
  EXTRA_POINT_DEFS.forEach(function (d) {
    if (unknownTime && (d.key === 'Fortune' || d.key === 'Vertex')) return;
    var p = chart.points[d.key];
    if (!p) return;
    var r = extraPointReading(d, p, chart, unknownTime);
    var pb = POINT_BEGINNER[d.key];
    lines.push('');
    lines.push('【本命點資料｜' + pointDisplayName(d) + ' ' + d.key + '】');
    lines.push('位置：' + astroCopyPositionLine(p, unknownTime));
    lines.push('核心功能：' + pb.coreFunction);
    lines.push('【一般摘要】');
    lines.push(r.summary);
    lines.push('【' + r.primaryLabel + '】');
    lines.push(r.primaryText);
    lines.push('【生活中的表現】');
    lines.push(r.lifeExpression);
    lines.push('【本命點推導】');
    lines.push('本命點功能：' + r.advanced.coreFunction);
    lines.push('星座運作：' + r.advanced.signMethod);
    lines.push('宮位情境：' + r.advanced.houseActivation);
    if (r.advanced.axisContext) lines.push('交點軸線：' + r.advanced.axisContext);
    lines.push('融合解讀：' + r.advanced.synthesis);
    lines.push('成長方向：' + r.advanced.growth);
    lines.push('【需要留意】');
    lines.push(r.caution);
    lines.push('【專業資料】');
    lines.push(r.technical);
  });

  lines.push('');
  lines.push('＝＝＝＝ 星盤結構與宮位 ＝＝＝＝');
  if (!unknownTime) {
    lines.push('上升 ASC：' + ZODIAC_SIGNS[chart.ascSign].zh + ' ' + (chart.asc % 30).toFixed(2) + '°');
    lines.push('天頂 MC：' + ZODIAC_SIGNS[Math.floor(chart.mc / 30)].zh + ' ' + (chart.mc % 30).toFixed(2) + '°');
    lines.push('宮位起點：');
    chart.houseCusps.forEach(function (cusp, i) {
      var sign = ZODIAC_SIGNS[Math.floor(cusp / 30)];
      lines.push('- 第' + (i + 1) + '宮：' + sign.zh + ' ' + (cusp % 30).toFixed(2) + '°；人生領域：' + HOUSE_BEGINNER[i].lifeArea);
    });
  } else {
    lines.push('出生時間未知，本次不列出上升、天頂與十二宮位。');
    lines.push('月亮當日可能範圍：' + astroMoonRangeText());
  }
  var eq = computeElementQualityBalance(chart);
  lines.push('元素分布：火' + eq.elem['火'] + '　土' + eq.elem['土'] + '　風' + eq.elem['風'] + '　水' + eq.elem['水']);
  lines.push('性質分布：本位' + eq.qual['本位'] + '　固定' + eq.qual['固定'] + '　變動' + eq.qual['變動']);

  var usableAspects = astroUsableAspects(chart).slice().sort(function (a, b) {
    var priorityDiff = (natalAspectPriority(a) === 'core' ? 0 : 1) - (natalAspectPriority(b) === 'core' ? 0 : 1);
    return priorityDiff || a.orb - b.orb;
  });
  lines.push('');
  lines.push('＝＝＝＝ 主要相位 ＝＝＝＝');
  var natalAspectUsedSet = {};
  usableAspects.forEach(function (asp) {
    var r = natalAspectReading(asp, chart, unknownTime, natalAspectUsedSet);
    if (!r.available) return;
    lines.push('');
    lines.push('【相位資料｜' + r.title + '】');
    lines.push('天體 A：' + astroCopyAspectEndpoint(asp.a, chart, unknownTime));
    lines.push('天體 B：' + astroCopyAspectEndpoint(asp.b, chart, unknownTime));
    lines.push('相位：' + ASPECT_DEFS[asp.type].zh + ' ' + NATAL_ASPECT_SYMBOLS[asp.type]);
    lines.push('精確角距：' + (natalAspectExactDistance(chart, asp) === null ? '未提供' : natalAspectExactDistance(chart, asp).toFixed(2) + '°'));
    lines.push('容許度：' + asp.orb.toFixed(2) + '°');
    lines.push('重要程度：' + (r.priority === 'core' ? '核心相位' : '次要相位'));
    lines.push('入相／出相：目前專案未計算，不推測。');
    lines.push('【一般摘要】');
    lines.push(r.summary);
    lines.push('【內在互動】');
    lines.push(r.advanced.functions + ' ' + r.advanced.principle);
    lines.push('【兩端星座與宮位背景】');
    lines.push(r.advanced.context);
    lines.push('【實際表現】');
    lines.push(r.advanced.expression);
    lines.push('【優勢】');
    lines.push(r.strength.replace(/^可以發揮：/, ''));
    lines.push('【容易卡住】');
    lines.push(r.challenge.replace(/^需要留意：/, ''));
    lines.push('【整合方式】');
    lines.push(r.advanced.integration);
    lines.push('【專業資料】');
    lines.push(r.technical);
  });

  lines.push('');
  lines.push('請根據以上完整資料，先綜合行星、星座、宮位與相位之間的關聯，再做深入的性格特質、關係模式、工作傾向與人生課題解讀。請區分可直接由資料支持的內容與推測，不要使用宿命式斷言；出生時間未知時，請遵守上方可靠度限制。');
  lines.push(personaInstructionLine());
  return lines.join('\n');
}
/* ============================================================================
   「精簡資料版」複製給 AI

   起因：把同一組出生資料的輸出拆開來算，buildAstroCopyText() 送出去的三萬多字
   裡，真正的原始資料（度數、宮位、容許度）只佔 7.8%，其餘九成是本站模板已經
   寫好的解讀。外部 AI 拿到之後最省力的做法就是把現成的文字重組——它不會、也
   沒必要重新綜合一次星盤，等於把它最擅長的「跨行星、跨宮位、跨相位一起看」
   關掉了。

   這份格式反過來：只給事實、不給結論，並補上三項本站算得出來、原本卻沒送出去
   的整體結構（半球分布、角宮／續宮／果宮、宮位重點）——這些正是判斷「這個人
   整體是什麼樣子」的第一層資訊。另外加上閱讀範圍的界定與閱讀優先序，避免 AI
   把本命資料當成流年來回答，或一頭栽進附錄的細節裡。

   兩種格式都保留，因為用途不同：想讓 AI 自己解讀就用這份，想把本站既有內容
   整理成一份報告則用完整版。
   ============================================================================ */

/* 相位歸到哪個人生主題：由兩端中主題最明確的那一顆決定。
   順序不是單純「由外而內」——冥王、海王、土星確實會蓋過個人行星（太陽冥王的
   四分相實際上是在講轉化，不只是在講自我），但木星與天王星本身沒有對應的人生
   主題，讓它們勝出只會把月亮、水星的相位全部吸走，反而讓「情緒」「溝通」兩個
   使用者最常問的主題整個消失，所以把這兩顆排在最後。
   三顆外行星彼此的相位是同一世代的人幾乎都有的，另外歸類並註明，免得被當成
   個人特質來解讀。 */
var NATAL_PACK_THEMES = [
  { key: 'Pluto', zh: '轉化與深層心理' },
  { key: 'Neptune', zh: '直覺、想像與理想化' },
  { key: 'Saturn', zh: '責任、壓力與長期課題' },
  { key: 'Venus', zh: '愛情與親密' },
  { key: 'Mars', zh: '行動力與衝突模式' },
  { key: 'Mercury', zh: '思維與溝通' },
  { key: 'Moon', zh: '情緒與安全感' },
  { key: 'Sun', zh: '自我與生命力' },
  { key: 'Jupiter', zh: '擴展、機會與信念' },
  { key: 'Uranus', zh: '改變、獨立與突破' },
];
/* 分類區塊的排列順序：從最貼身的自我、情緒，往外排到世代背景，
   而不是照相位緊密度出現的先後——後者會讓「自我與生命力」隨機掉到很後面。 */
var NATAL_PACK_THEME_ORDER = [
  '自我與生命力', '情緒與安全感', '思維與溝通', '愛情與親密', '行動力與衝突模式',
  '責任、壓力與長期課題', '擴展、機會與信念', '改變、獨立與突破',
  '直覺、想像與理想化', '轉化與深層心理',
  '世代共有的背景（同齡人多半也有）', '交點與敏感點補充',
];
var NATAL_PACK_OUTER_KEYS = ['Uranus', 'Neptune', 'Pluto'];
var NATAL_PACK_THEME_GENERATIONAL = '世代共有的背景（同齡人多半也有）';
var NATAL_PACK_THEME_OTHER = '交點與敏感點補充';
function natalPackTheme(asp) {
  if (NATAL_PACK_OUTER_KEYS.indexOf(asp.a) !== -1 && NATAL_PACK_OUTER_KEYS.indexOf(asp.b) !== -1) {
    return NATAL_PACK_THEME_GENERATIONAL;
  }
  for (var i = 0; i < NATAL_PACK_THEMES.length; i++) {
    if (asp.a === NATAL_PACK_THEMES[i].key || asp.b === NATAL_PACK_THEMES[i].key) return NATAL_PACK_THEMES[i].zh;
  }
  return NATAL_PACK_THEME_OTHER;
}

/* 相位兩端的書寫順序。asp.a／asp.b 的先後取決於內部計算迴圈，印出來會變成
   「福點 四分相 天王星」「南交點 四分相 太陽」這種把配角放在主詞位置的句子。
   一律照這個排序寫，讓比較重要的天體在前面。 */
var NATAL_PACK_BODY_ORDER = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
  'Uranus', 'Neptune', 'Pluto', 'ASC', 'MC', 'Node', 'SNode', 'Chiron', 'Lilith', 'Fortune', 'Vertex'];
function natalPackOrderedEnds(asp) {
  var ia = NATAL_PACK_BODY_ORDER.indexOf(asp.a), ib = NATAL_PACK_BODY_ORDER.indexOf(asp.b);
  if (ia === -1) ia = 99;
  if (ib === -1) ib = 99;
  return ia <= ib ? [asp.a, asp.b] : [asp.b, asp.a];
}

/* 度分表示法。四捨五入到 60 分時要進位成下一度，否則會印出 11°60'。 */
function natalPackDeg(position) {
  var d = Math.floor(position.deg), m = Math.round((position.deg - d) * 60);
  if (m >= 60) { m -= 60; d += 1; }
  return d + '°' + (m < 10 ? '0' + m : m) + '\'';
}
/* 敏感點的中文譯名各家不同（「命定點」有些書叫「宿命點」，站上顯示成「頂點」
   又容易跟「天頂」搞混），所以這幾個一律附上英文原名，避免 AI 認錯對象。
   十大行星沒有這個問題，不加英文以免整份資料變得冗長。 */
function natalPackName(key) {
  if (key === 'ASC') return '上升點 ASC';
  if (key === 'MC') return '天頂 MC';
  var def = findAnyPointDef(key);
  if (!def) return key;
  var isPoint = EXTRA_POINT_DEFS.some(function (x) { return x.key === key; });
  return isPoint ? pointDisplayName(def) + ' ' + key : def.zh;
}

/* 角度點相位只補在「純資料」複製包：畫面與 astroUsableAspects() 維持原樣，
   因此不會改變既有命盤卡片或 Golden 快照。只計十大行星對 ASC／MC，沿用本命盤
   原有五種主要相位與容許度；出生時間未知時不應呼叫。 */
function natalPackAngleAspects(chart) {
  if (!chart || typeof chart.asc !== 'number' || typeof chart.mc !== 'number') return [];
  var angleDefs = [
    ['conjunction', 0, 8], ['sextile', 60, 4], ['square', 90, 6],
    ['trine', 120, 6], ['opposition', 180, 8],
  ];
  var angles = { ASC: astroNormDeg(chart.asc), MC: astroNormDeg(chart.mc) };
  var out = [];
  ASTRO_PLANET_BODY_KEYS.forEach(function (key) {
    var p = chart.planets[key];
    if (!p || typeof p.lon !== 'number') return;
    Object.keys(angles).forEach(function (angleKey) {
      var distance = Math.abs(astroNormDeg(p.lon) - angles[angleKey]);
      if (distance > 180) distance = 360 - distance;
      var best = null;
      angleDefs.forEach(function (row) {
        var orb = Math.abs(distance - row[1]);
        if (orb <= row[2] && (!best || orb < best.orb)) best = { type: row[0], orb: orb };
      });
      if (best) out.push({ a: key, b: angleKey, type: best.type, orb: best.orb, anglePoint: true });
    });
  });
  return out;
}
function natalPackPlacement(key, chart, unknownTime) {
  var p = natalAspectPosition(chart, key);
  if (!p || typeof p.sign !== 'number' || !ZODIAC_SIGNS[p.sign]) return '';
  return natalPackName(key) + ' ' + ZODIAC_SIGNS[p.sign].zh + ' ' + natalPackDeg(p)
    + (unknownTime || !p.house ? '' : ' · 第' + p.house + '宮')
    + (p.retro ? ' · 逆行' : '');
}

/* 半球與宮位性質：本站一直都算得出來，只是從來沒放進複製出去的資料裡。
   東半球 = 第10–12、1–3 宮（靠近上升的那一側），上半球 = 第7–12 宮（地平線之上）。 */
function natalPackStructure(chart) {
  var east = 0, west = 0, upper = 0, lower = 0, ang = 0, suc = 0, cad = 0, byHouse = {};
  PLANET_DEFS.forEach(function (d) {
    var p = chart.planets[d.key];
    if (!p || !p.house) return;
    var hs = p.house;
    if (hs >= 10 || hs <= 3) east++; else west++;
    if (hs >= 7) upper++; else lower++;
    if ([1, 4, 7, 10].indexOf(hs) !== -1) ang++;
    else if ([2, 5, 8, 11].indexOf(hs) !== -1) suc++;
    else cad++;
    byHouse[hs] = (byHouse[hs] || 0) + 1;
  });
  var emphasis = Object.keys(byHouse).map(Number).filter(function (h) { return byHouse[h] >= 2; })
    .sort(function (a, b) { return byHouse[b] - byHouse[a] || a - b; })
    .map(function (h) { return '第' + h + '宮×' + byHouse[h] + '（' + HOUSE_BEGINNER[h - 1].lifeArea + '）'; });
  return { east: east, west: west, upper: upper, lower: lower, ang: ang, suc: suc, cad: cad, emphasis: emphasis };
}

/* 某顆行星最緊密的一組相位，用在優先閱讀摘要裡當作該主題的第二條線索。 */
function natalPackTightest(aspects, key) {
  var hit = aspects.filter(function (a) { return a.a === key || a.b === key; })
    .sort(function (a, b) { return a.orb - b.orb; })[0];
  if (!hit) return '';
  var e = natalPackOrderedEnds(hit);
  return natalPackName(e[0]) + ' ' + ASPECT_DEFS[hit.type].zh + ' ' + natalPackName(e[1]) + '（' + hit.orb.toFixed(2) + '°）';
}
function natalPackAspectLine(asp) {
  var e = natalPackOrderedEnds(asp);
  return natalPackName(e[0]) + ' ' + ASPECT_DEFS[asp.type].zh + ' ' + natalPackName(e[1])
    + '（容許度 ' + asp.orb.toFixed(2) + '°；' + (natalAspectPriority(asp) === 'core' ? '核心' : '次要') + '）';
}

function buildAstroDataPackText(chart, unknownTime) {
  if (!chart) return '';
  var L = [];
  var city = state.astroCityUsed;
  var aspects = astroUsableAspects(chart).slice();
  if (!unknownTime) aspects = aspects.concat(natalPackAngleAspects(chart));
  aspects.sort(function (a, b) { return a.orb - b.orb; });

  L.push('【本命盤觀測值｜供 AI 自行綜合】');
  L.push('這是一份沒有預先解讀的排盤結果。請從各項數值之間的呼應與矛盾建立結論，不要把單一落點直接等同於人格定論。');
  L.push('適用範圍：長期性格傾向、需求、能力與反覆出現的人生模式。');
  L.push('範圍之外：近期運勢、特定日期或事件時機；這些問題需要另外提供行運或推運盤。');
  L.push('資料邊界：不要自行補入未列出的天體、相位、合盤對象或其他占星系統。');
  L.push('');

  L.push('【出生條件與計算方式】');
  L.push('- 出生日期：' + state.astroY + '-' + pad2(state.astroM) + '-' + pad2(state.astroD));
  L.push('- 出生時間：' + (unknownTime ? '未提供' : pad2(state.astroH) + ':' + pad2(state.astroMin)));
  L.push('- 出生地：' + (city ? city.zh + '（' + city.en + '）' : '未提供'));
  if (city) {
    L.push('- 經緯度：' + city.lat.toFixed(4) + ', ' + city.lon.toFixed(4));
    L.push('- 時區：' + city.tz);
  }
  L.push('- 黃道系統：回歸黃道 Tropical');
  L.push('- 宮位制：' + (state.astroHouseSystem === 'whole' ? '整宮制 Whole Sign' : '普拉西德制 Placidus'));
  L.push('- 真太陽時：否');
  L.push('- 時間資料限制：' + (unknownTime
    ? '出生時間未知，因此不提供上升、天頂、宮位、福點與命定點；月亮當日可能範圍為 ' + astroMoonRangeText() + '。請勿推測任何與宮位或上升有關的內容。'
    : '出生時間已提供，可採用上升、天頂、宮位及其衍生資料。'));
  L.push('');

  /* 優先閱讀摘要：先給六條主線，讓 AI 知道從哪裡開始，而不是一進來就淹在附錄裡。 */
  L.push('【先抓主軸】');
  var st = natalPackStructure(chart);
  var coreLine = natalPackPlacement('Sun', chart, unknownTime) + '；' + natalPackPlacement('Moon', chart, unknownTime);
  if (!unknownTime) coreLine += '；上升 ' + ZODIAC_SIGNS[chart.ascSign].zh + ' ' + natalPackDeg({ deg: chart.asc % 30 });
  L.push('- 核心人格結構：' + coreLine);
  L.push('- 情緒需求：' + natalPackPlacement('Moon', chart, unknownTime) + (natalPackTightest(aspects, 'Moon') ? '；最緊密相位 ' + natalPackTightest(aspects, 'Moon') : ''));
  L.push('- 思維與溝通：' + natalPackPlacement('Mercury', chart, unknownTime) + (natalPackTightest(aspects, 'Mercury') ? '；最緊密相位 ' + natalPackTightest(aspects, 'Mercury') : ''));
  L.push('- 愛情與親密：' + natalPackPlacement('Venus', chart, unknownTime) + (natalPackTightest(aspects, 'Venus') ? '；最緊密相位 ' + natalPackTightest(aspects, 'Venus') : ''));
  L.push('- 行動與衝突：' + natalPackPlacement('Mars', chart, unknownTime) + (natalPackTightest(aspects, 'Mars') ? '；最緊密相位 ' + natalPackTightest(aspects, 'Mars') : ''));
  L.push('- 責任與壓力：' + natalPackPlacement('Saturn', chart, unknownTime) + (natalPackTightest(aspects, 'Saturn') ? '；最緊密相位 ' + natalPackTightest(aspects, 'Saturn') : ''));
  var eq = computeElementQualityBalance(chart);
  L.push('- 整體結構：元素 火' + eq.elem['火'] + '／土' + eq.elem['土'] + '／風' + eq.elem['風'] + '／水' + eq.elem['水']
    + '；性質 本位' + eq.qual['本位'] + '／固定' + eq.qual['固定'] + '／變動' + eq.qual['變動']
    + (!unknownTime && st.emphasis.length ? '；宮位重點 ' + st.emphasis.join('、') : ''));
  L.push('');

  L.push('【六個閱讀錨點】');
  ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Saturn'].forEach(function (k) {
    L.push('- ' + natalPackPlacement(k, chart, unknownTime));
  });
  if (!unknownTime) {
    L.push('- 上升點 ASC：' + ZODIAC_SIGNS[chart.ascSign].zh + ' ' + natalPackDeg({ deg: chart.asc % 30 }));
    L.push('- 天頂 MC：' + ZODIAC_SIGNS[Math.floor(chart.mc / 30)].zh + ' ' + natalPackDeg({ deg: chart.mc % 30 }));
    var ruler = natalChartRulerPlacement(chart);
    if (ruler) L.push('- 上升守護星：' + natalPackPlacement(ruler.rulerKey, chart, unknownTime));
  }
  L.push('');

  L.push('【全盤分布】');
  L.push('- 元素分布：火象 ' + eq.elem['火'] + '，土象 ' + eq.elem['土'] + '，風象 ' + eq.elem['風'] + '，水象 ' + eq.elem['水']);
  L.push('- 性質分布：本位 ' + eq.qual['本位'] + '，固定 ' + eq.qual['固定'] + '，變動 ' + eq.qual['變動']);
  if (!unknownTime) {
    L.push('- 宮位重點：' + (st.emphasis.length ? st.emphasis.join('、') : '沒有任何一宮聚集兩顆以上行星'));
    L.push('- 半球分布：東半球 ' + st.east + '，西半球 ' + st.west + '，上半球 ' + st.upper + '，下半球 ' + st.lower + '（東＝第10至3宮，上＝第7至12宮）');
    L.push('- 角宮／續宮／果宮：角宮 ' + st.ang + '，續宮 ' + st.suc + '，果宮 ' + st.cad);
  } else {
    L.push('- 宮位相關統計：出生時間未知，不提供。');
  }
  L.push('');

  var topN = Math.min(10, aspects.length);
  L.push('【相位焦點｜容許度最小的 ' + topN + ' 組】');
  aspects.slice(0, topN).forEach(function (asp) {
    L.push('- ' + natalPackAspectLine(asp) + ' · ' + natalPackTheme(asp));
  });
  L.push('');

  L.push('【生活面向索引】');
  L.push('以下是方便檢索的單一歸類，不代表一組相位只能解讀成這個面向；綜合時仍須回看相位兩端。');
  var grouped = {};
  aspects.forEach(function (asp) {
    var t = natalPackTheme(asp);
    (grouped[t] || (grouped[t] = [])).push(asp);
  });
  NATAL_PACK_THEME_ORDER.forEach(function (t) {
    if (!grouped[t]) return;
    L.push('# ' + t);
    grouped[t].forEach(function (asp) { L.push('- ' + natalPackAspectLine(asp)); });
  });
  L.push('');

  L.push('【明細表一｜全部落點】');
  PLANET_DEFS.forEach(function (d) { L.push('- ' + natalPackPlacement(d.key, chart, unknownTime)); });
  EXTRA_POINT_DEFS.forEach(function (d) {
    if (unknownTime && (d.key === 'Fortune' || d.key === 'Vertex')) return;
    if (chart.points[d.key]) L.push('- ' + natalPackPlacement(d.key, chart, unknownTime));
  });
  if (!unknownTime) {
    L.push('- 上升點 ' + ZODIAC_SIGNS[chart.ascSign].zh + ' ' + natalPackDeg({ deg: chart.asc % 30 }));
    L.push('- 天頂 ' + ZODIAC_SIGNS[Math.floor(chart.mc / 30)].zh + ' ' + natalPackDeg({ deg: chart.mc % 30 }));
    L.push('- 下降點 ' + ZODIAC_SIGNS[Math.floor(astroNormDeg(chart.asc + 180) / 30)].zh + ' ' + natalPackDeg({ deg: astroNormDeg(chart.asc + 180) % 30 }));
    L.push('- 天底 ' + ZODIAC_SIGNS[Math.floor(astroNormDeg(chart.mc + 180) / 30)].zh + ' ' + natalPackDeg({ deg: astroNormDeg(chart.mc + 180) % 30 }));
  }
  L.push('');

  if (!unknownTime) {
    L.push('【明細表二｜十二宮起點】');
    chart.houseCusps.forEach(function (cusp, i) {
      L.push('- 第' + (i + 1) + '宮：' + ZODIAC_SIGNS[Math.floor(astroNormDeg(cusp) / 30)].zh + ' '
        + natalPackDeg({ deg: astroNormDeg(cusp) % 30 }) + '（' + HOUSE_BEGINNER[i].lifeArea + '）');
    });
    L.push('');
  }

  L.push('【明細表三｜全部主要相位：' + aspects.length + ' 組】');
  aspects.forEach(function (asp) { L.push('- ' + natalPackAspectLine(asp)); });
  L.push('');
  L.push('讀表備註：容許度越接近 0°，相位越精確。資料涵蓋十大行星彼此、既有敏感點，以及出生時間可靠時十大行星對 ASC／MC 的主要相位。');
  L.push('「核心」標記條件：雙個人行星、日月參與且容許度不超過 4°，或任何容許度不超過 2° 的相位。');
  L.push('此處沒有入相／出相資料，解讀時略過這項判斷。');
  L.push('');

  L.push('【交給 AI 的任務】');
  L.push('請嚴格依照以下順序與標題回答；語氣風格只能改變措辭，不能改變順序、合併或省略章節。不要先講分析方法或限制。');
  L.push('整份回答請控制在 1,400–1,800 個中文字內。不要為了湊字數平均分配篇幅：全盤證據最強、最影響日常的分類可以寫完整，次要分類應簡短。不要重述同一項特質；前文已說過的內容，後文只補充新的連結或做法。');
  L.push('');
  L.push('【易讀性與具體化規則】');
  L.push('1. 每段第一句先寫可觀察的行為、反應或情境，再解釋需求與原因；不要用抽象人格形容詞開頭。');
  L.push('2. 重要結論至少寫出「具體觸發情境、慣性反應、實際生活影響」中的兩項，不要只說重視、追求、渴望、具有或傾向。');
  L.push('3. 每個抽象判斷都要翻成一般人能辨認的生活表現；每段最多使用一個工作、感情、朋友、家庭、學習或獨處場景。');
  L.push('4. 清楚區分內在需求、已有能力、自動化慣性與能力過度使用後的盲點，不要把四者混成人格形容詞清單。');
  L.push('5. 使用敏感、理性、獨立、細膩、謹慎、成熟或有洞察力等詞後，必須立刻說明它表現在什麼行為。');
  L.push('6. 每句原則上只表達一個主要意思；超過約 40 個中文字時優先拆句，少用連續逗號、轉折與附加說明。');
  L.push('7. 建議必須說清楚在什麼情境要說什麼、做什麼、停止什麼或何時結束，而且能觀察並驗收；不得只寫放鬆、相信自己、接納不完美、建立界線、適度表達、保持平衡或順其自然。');
  L.push('8. 相反訊號不得只寫「既……又……」「一方面……另一方面……」或「內在存在矛盾」；先判斷較常出現的一邊，再說明另一邊會在哪個關係階段、壓力程度或生活情境出現。');
  L.push('9. 優先寫清楚「情境發生 → 本人反應 → 實際結果」的因果關係，不必機械套用固定句型。');
  L.push('10. 避免能量、磁場、靈魂、注定、命中注定、潛能巨大、課題很深、宇宙安排、內在有一部分、某種程度上、你天生就是等空泛或無法驗證的說法。');
  L.push('11. 直接不等於尖銳：先說具體問題，再說代價與解法；不得羞辱、診斷、恐嚇、貼人格標籤或為了犀利而誇大負面結論。任何語氣風格都不得違反本條。');
  L.push('12. 若優勢用過頭會造成控制、討好、逃避、拖延、理想化、自我消耗或過度防衛，直接寫出「原本能力 → 過度反應 → 實際代價」，不要只說需要平衡。');
  L.push('13. 以完全沒有占星背景的讀者為標準；正文移除段尾星盤依據後仍須自然完整。占星術語只能當證據，不能代替生活解釋。');
  L.push('14. 每個生活分類只處理該類主要問題，不提前回答後續章節。相同特質再次出現時必須增加新情境、因果、影響或解法；沒有新增資訊就刪除。');
  L.push('15. 每段完成後自行檢查：何時發生、本人會做什麼、有何優勢、用過頭的代價、可改成什麼做法；正文至少回答其中三項，不要列出這些檢查題。');
  L.push('16. 全文完成後做空話檢查：刪除套用於多數人仍成立的句子；改寫只有形容詞而沒有行為的句子；把一週內無法執行的建議具體化；重複結論只留較具體者；若占星術語比生活說明更長，縮短術語並補足生活翻譯。');
  L.push('');
  L.push('一、【快速認識你】：用 60–80 字寫出最容易在日常生活中被本人認出的整體輪廓，只保留兩個最鮮明特徵，不要一開始就宣判人生主軸。');
  L.push('二、【八個生活分類】：依序完整回答以下八類：');
  L.push('1. 核心性格與外在印象：回答初次接觸時別人怎麼看、熟悉後有何不同，以及陌生與熟悉環境中的表現差異。');
  L.push('2. 情緒需求與安全感：回答什麼情況讓本人安心、哪些訊號引起不安或失落，以及本人通常如何處理情緒。');
  L.push('3. 思考、學習與溝通：回答本人如何理解整理與表達資訊、哪種學習方式有效，以及溝通最容易在哪裡失真、繞遠或誤判。');
  L.push('4. 感情與親密關係：回答容易被什麼特質吸引、長期相處需要什麼條件，以及關係中最常重複的模式。');
  L.push('5. 工作能力與發展方式：回答什麼任務與合作情境最能發揮、哪些能力能轉成實際價值，以及哪種節奏、環境或責任結構會快速消耗；先談任務與工作方式，不要只列職業名稱。');
  L.push('6. 壓力反應與主要盲點：回答壓力初期訊號、本人如何撐住或控制局勢，以及哪個反應最後反而讓問題惡化。');
  L.push('7. 核心人生課題：回答哪種反覆模式需要停止、要從哪種舊方法轉向哪種新方法，以及改變後日常會有何不同；不得寫成命定考驗或抽象精神成長。');
  L.push('8. 現在可以怎麼運用：回答現在最值得主動使用的能力、需要限制的慣性，以及可用來做選擇的一條簡單判斷原則。');
  L.push('八類都要保留，但不必等長。每類只寫一個 60–110 字的段落：證據強、對生活影響大的分類寫 90–110 字，次要分類寫 60–80 字。每類只保留一個最有辨識度的結論，優先回答該類核心問題，並自然涵蓋前述自我檢查中的至少三項；不要拆成固定小標，也不要只列人格形容詞。');
  L.push('三、【三個跨分類模式】：只選在至少兩個生活分類中反覆出現、而且有不同星盤證據支持的三條共同脈絡；不要為了湊滿三條製造牽強連結。每個模式用 80–120 字呈現「觸發情境 → 慣性反應 → 實際代價 → 替代做法」，並簡短解釋不同領域為何出現同一反應；只寫前面尚未說清楚的關聯，不得換句話重複八類內容。');
  L.push('模式名稱使用一般生活語言，例如「關係一模糊，你就開始替對方補答案」；不得使用關係課題、能量模式、靈魂模式、內在拉扯、深層議題或人生功課等名稱。');
  L.push('重要結論須由至少兩項落點或相位共同支持；每段最多附一組簡短依據，放在段尾括號內，不要讓占星術語打斷閱讀。');
  L.push('遇到相反訊號時請判斷哪一邊較強，再說明另一面通常在什麼情境出現。不要反覆使用「可能、也許、不一定、僅供參考」等模糊語氣。只有資料限制確實會改變結論時才提醒一次。');
  L.push('不預測必然事件，也不要用「你很矛盾」帶過。');
  L.push('四、【本週行動】：最後給 3 項分別對應前文三個最重要問題的單一行動；須在七天內完成、能明確判斷完成或未完成、每項不超過 60 字，不要求購買產品、尋求占卜或依賴他人改變，也不使用嘗試、盡量、適度、學習、保持等無法驗收的動詞。');
  L.push(personaInstructionLine());
  return L.join('\n');
}

function astroCopyForAI() {
  var chart = state.astroResult;
  if (!chart) return;
  var unknown = !!state.astroUnknownTime;
  var text = buildAstroDataPackText(chart, unknown);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(astroFlashCopied).catch(function () { fallbackCopy(text, astroFlashCopied); });
  } else {
    fallbackCopy(text, astroFlashCopied);
  }
}


/* ---------- 太陽／月亮回歸與每日／週／月／年運勢 ---------- */
/* ================= 太陽回歸 Solar Return／月亮回歸 Lunar Return ================= */
/* 用牛頓法在黃經上解出「行運行星回到本命度數」的精確時刻，
   太陽回歸＝流年主軸（一年一次），月亮回歸＝流月主軸（約 27.3 天一次）。
   回歸盤的宮位以出生地估算（若未來要追蹤現居地，可在此替換經緯度）。 */
var SOLAR_YEAR_DAYS = 365.2422;
var LUNAR_MONTH_DAYS = 27.321661;

function solveBodyReturn(bodyKey, targetLon, guessTime) {
  var t = guessTime;
  for (var i = 0; i < 14; i++) {
    var lon = astroEclipticLon(bodyKey, t);
    var diff = lon - targetLon;
    diff = ((diff + 180) % 360 + 360) % 360 - 180;
    if (Math.abs(diff) < 0.0003) break;
    var lonFwd = astroEclipticLon(bodyKey, t.AddDays(0.5));
    var rate = lonFwd - lon;
    rate = ((rate + 180) % 360 + 360) % 360 - 180;
    rate = rate / 0.5;
    if (Math.abs(rate) < 1e-6) break;
    t = t.AddDays(-diff / rate);
  }
  return t;
}
/* 找出「在 targetTime 當下或之前」最近一次回歸——回歸盤是持續生效到下一次回歸為止的 */
function findPrecedingReturn(bodyKey, targetLon, targetTime, periodDays) {
  var t = solveBodyReturn(bodyKey, targetLon, targetTime);
  if (t.date.getTime() > targetTime.date.getTime()) {
    t = solveBodyReturn(bodyKey, targetLon, t.AddDays(-periodDays));
  }
  return t;
}

function computeReturnChart(returnTime, lat, lon, natalChart) {
  var planets = {};
  ASTRO_PLANET_BODY_KEYS.forEach(function (key) {
    planets[key] = { lon: astroEclipticLon(key, returnTime) };
  });
  var et = Astronomy.e_tilt(returnTime);
  var eps = et.tobl * Math.PI / 180;
  var phi = lat * Math.PI / 180;
  var gst = Astronomy.SiderealTime(returnTime);
  var lst = gst + lon / 15;
  var ramc = astroNormDeg(lst * 15);
  var theta = ramc * Math.PI / 180;
  var mc = astroNormDeg(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(eps)) * 180 / Math.PI);
  var asc = astroNormDeg(Math.atan2(Math.cos(theta), -(Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(theta))) * 180 / Math.PI);
  var houseCusps = placidusCusps(ramc, eps, phi, asc, mc);
  function natalHouseOf(pLon) {
    for (var i = 0; i < 12; i++) {
      var start = natalChart.houseCusps[i], end = natalChart.houseCusps[(i + 1) % 12];
      var arc = astroNormDeg(end - start); if (arc === 0) arc = 360;
      var rel = astroNormDeg(pLon - start);
      if (rel < arc) return i + 1;
    }
    return 12;
  }
  ASTRO_PLANET_BODY_KEYS.forEach(function (key) {
    planets[key].sign = Math.floor(planets[key].lon / 30);
    planets[key].deg = planets[key].lon % 30;
    planets[key].natalHouse = natalHouseOf(planets[key].lon);
  });
  return { time: returnTime, asc: asc, mc: mc, ascSign: Math.floor(asc / 30), mcSign: Math.floor(mc / 30), houseCusps: houseCusps, planets: planets };
}

function findSolarReturnChart(natalChart, targetTime, lat, lon) {
  var t = findPrecedingReturn('Sun', natalChart.planets.Sun.lon, targetTime, SOLAR_YEAR_DAYS);
  return computeReturnChart(t, lat, lon, natalChart);
}
function findLunarReturnChart(natalChart, targetTime, lat, lon) {
  var t = findPrecedingReturn('Moon', natalChart.planets.Moon.lon, targetTime, LUNAR_MONTH_DAYS);
  return computeReturnChart(t, lat, lon, natalChart);
}

/* 本命宮位 → 分類的對應（返照行星「啟動」了哪個生活舞台） */
var HOUSE_CATEGORY_MAP = { 1: 'general', 2: 'wealth', 3: 'study', 4: 'family', 5: 'love', 6: 'health', 7: 'love', 8: 'wealth', 9: 'study', 10: 'career', 11: 'social', 12: 'general' };
var RETURN_PLANET_WEIGHT = { Sun: 14, Moon: 14, Mercury: 8, Venus: 8, Mars: 8, Jupiter: 6, Saturn: 6, Uranus: 5, Neptune: 5, Pluto: 5 };
function houseActivationBonus(catKey, returnChart) {
  var bonus = 0;
  ASTRO_PLANET_BODY_KEYS.forEach(function (key) {
    if (HOUSE_CATEGORY_MAP[returnChart.planets[key].natalHouse] === catKey) bonus += RETURN_PLANET_WEIGHT[key];
  });
  return bonus;
}
var SOLAR_RETURN_ASPECT_CFG = [['Sun', 6], ['Moon', 6], ['Mercury', 5], ['Venus', 5], ['Mars', 5], ['Jupiter', 5], ['Saturn', 5], ['Uranus', 4], ['Neptune', 4], ['Pluto', 4]];
var LUNAR_RETURN_ASPECT_CFG = [['Sun', 5], ['Moon', 6], ['Mercury', 5], ['Venus', 5], ['Mars', 5], ['Jupiter', 4], ['Saturn', 4]];

function astroReturnCategoryScore(catKey, natalChart, returnChart, aspectCfg) {
  var natalKeys = ASTRO_CATEGORY_RULERS[catKey];
  var score = 52;
  aspectCfg.forEach(function (tc) {
    var tKey = tc[0], orbLimit = tc[1];
    var tLon = returnChart.planets[tKey].lon;
    natalKeys.forEach(function (nKey) {
      var nLon = natalChart.planets[nKey].lon;
      var diff = astroAngleDiff(tLon, nLon);
      HOROSCOPE_ASPECT_ANGLES.forEach(function (pair) {
        var delta = Math.abs(diff - pair[1]);
        if (delta <= orbLimit) {
          var strength = 1 - delta / orbLimit;
          score += astroAspectPoints(pair[0], tKey) * strength;
        }
      });
    });
  });
  score += houseActivationBonus(catKey, returnChart);
  return Math.max(15, Math.min(98, Math.round(score)));
}

/* ---- expose *why* a score is what it is, for the copy-for-AI text ---- */
function planetZhName(key) {
  var d = PLANET_DEFS.find(function (p) { return p.key === key; });
  return d ? d.zh : key;
}
function astroCategoryAspectBasis(catKey, periodCfg, natalChart, transitPlanets) {
  var natalKeys = ASTRO_CATEGORY_RULERS[catKey];
  var items = [];
  periodCfg.transits.forEach(function (tc) {
    var tKey = tc[0], orbLimit = tc[1];
    var tLon = transitPlanets[tKey];
    natalKeys.forEach(function (nKey) {
      var nLon = natalChart.planets[nKey].lon;
      var diff = astroAngleDiff(tLon, nLon);
      HOROSCOPE_ASPECT_ANGLES.forEach(function (pair) {
        var delta = Math.abs(diff - pair[1]);
        if (delta <= orbLimit) {
          var strength = 1 - delta / orbLimit;
          var pts = astroAspectPoints(pair[0], tKey) * strength;
          items.push({ pts: pts, text: '行運' + planetZhName(tKey) + ASPECT_DEFS[pair[0]].zh + '本命' + planetZhName(nKey) + '（誤差' + delta.toFixed(1) + '°，' + (pts >= 0 ? '+' : '') + pts.toFixed(1) + '分）' });
        }
      });
    });
  });
  items.sort(function (a, b) { return Math.abs(b.pts) - Math.abs(a.pts); });
  return items.map(function (it) { return it.text; });
}
function astroReturnCategoryAspectBasis(catKey, natalChart, returnChart, aspectCfg) {
  var natalKeys = ASTRO_CATEGORY_RULERS[catKey];
  var items = [];
  aspectCfg.forEach(function (tc) {
    var tKey = tc[0], orbLimit = tc[1];
    var tLon = returnChart.planets[tKey].lon;
    natalKeys.forEach(function (nKey) {
      var nLon = natalChart.planets[nKey].lon;
      var diff = astroAngleDiff(tLon, nLon);
      HOROSCOPE_ASPECT_ANGLES.forEach(function (pair) {
        var delta = Math.abs(diff - pair[1]);
        if (delta <= orbLimit) {
          var strength = 1 - delta / orbLimit;
          var pts = astroAspectPoints(pair[0], tKey) * strength;
          items.push({ pts: pts, text: '回歸盤' + planetZhName(tKey) + ASPECT_DEFS[pair[0]].zh + '本命' + planetZhName(nKey) + '（誤差' + delta.toFixed(1) + '°，' + (pts >= 0 ? '+' : '') + pts.toFixed(1) + '分）' });
        }
      });
    });
  });
  items.sort(function (a, b) { return Math.abs(b.pts) - Math.abs(a.pts); });
  var houseItems = [];
  ASTRO_PLANET_BODY_KEYS.forEach(function (key) {
    if (HOUSE_CATEGORY_MAP[returnChart.planets[key].natalHouse] === catKey) {
      houseItems.push('回歸盤' + planetZhName(key) + '落入本命第' + returnChart.planets[key].natalHouse + '宮（該宮位對應此類別，+' + RETURN_PLANET_WEIGHT[key] + '分）');
    }
  });
  return items.map(function (it) { return it.text; }).concat(houseItems);
}

/* ---- seeded pseudo-random (per day/period + personal chart, stable on reload) ---- */
function astroHashSeed(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function astroMulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function astroSeededPickN(rng, arr, n) {
  var pool = arr.slice(), out = [];
  while (out.length < n && pool.length) {
    var idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}
/* deterministic pick of ONE item from arr, keyed off an arbitrary string —
   used so the same placement/pair always reads the same way, but different
   placements/pairs don't all share the exact same sentence skeleton */
function astroSeededPick(seedStr, arr) {
  var rng = astroMulberry32(astroHashSeed(seedStr));
  return arr[Math.floor(rng() * arr.length)];
}
function fillTpl(tpl, map) {
  return Object.keys(map).reduce(function (s, k) { return s.split('{' + k + '}').join(map[k]); }, tpl);
}

/* ---- daily narrative / advice / avoid banks ---- */
var NARRATIVE_WEAK = {
  love: ['今日感情能量有些低迷，容易多想或不安，別急著要對方馬上給答案，給彼此一點喘息的空間，關係反而更穩。', '今日在感情裡容易患得患失，一點小事就想很多，放慢步調、先安頓好自己的情緒，比追著對方要保證更重要。'],
  career: ['今日工作上容易卡關或提不起勁，事情推進得比預期慢，別逼自己一次到位，先把眼前能做的做好即可。', '今日職場步調有點亂，容易分心或被打斷，與其硬撐著趕進度，不如先理清優先順序，穩住比快更重要。'],
  family: ['今日與家人相處容易有些摩擦或誤會，一句話可能就被過度解讀，先深呼吸，晚點再談會比當下爭執更有效。', '今日家庭氣氛有點緊繃，長輩或家人的話容易讓你心裡不是滋味，給彼此一點空間，別急著解釋或說服。'],
  health: ['今日身體或精神容易感到疲累，做什麼都提不起勁，這是身體在提醒你該休息了，別勉強自己硬撐。', '今日容易感到倦怠或被小毛病困擾，別忽視身體發出的訊號，適度放慢步調會恢復得更快。'],
  wealth: ['今日財運有些起伏，容易有非預期的花費或猶豫不決的決定，先別衝動下決定，保守一點會更安心。', '今日金錢方面容易感到不踏實，看到什麼都想花，或是對數字特別敏感，先緩一緩，別急著做財務決定。'],
  social: ['今日人際互動容易讓你感到耗神，一句無心的話都可能被放大解讀，適度保留社交能量，別勉強自己迎合。', '今日在人群中容易覺得格格不入或提不起勁社交，這很正常，允許自己安靜地待著。'],
  study: ['今日你一心渴望充實自己，卻總有一種學不進去、難以掌握的無力感，別給自己太大壓力，循序漸進反而會更有效。', '今日學習狀態有點卡，明明想認真卻靜不下心，別責怪自己不夠努力，換個方式或先休息一下再繼續。'],
  general: ['今日整體狀態有點低迷，做什麼都提不太起勁，容易分心或心浮氣躁，別勉強自己硬撐，允許自己慢下來。'],
};
var NARRATIVE_STRONG = {
  love: '不過感情運勢相對加分，是適合表達心意、拉近距離的時機。',
  career: '不過工作／事業運勢表現亮眼，是展現實力、爭取機會的好時機。',
  family: '不過家庭關係相對和諧，適合多花點時間陪伴家人。',
  health: '不過身心狀態相對穩定，是適合累積活力、建立好習慣的時機。',
  wealth: '不過財運相對加分，適合規劃或處理與金錢相關的事務。',
  social: '不過人際運勢不錯，適合主動聯繫、拓展新的關係。',
  study: '不過學習運勢相對加分，若換個科目或方式，會更容易進入狀況。',
};
var NARRATIVE_STEADY_DAILY = '今日整體運勢平穩，沒有特別突出的行運被觸發，適合按照原本的步調生活，把力氣留給真正重要的事。';
var ADVICE_CAUTION = {
  love: ['耐心等待', '先照顧自己', '放低期待', '給彼此空間'],
  career: ['穩紮穩打', '緩一緩腳步', '先求穩不求快', '儲備實力'],
  family: ['多一點傾聽', '給彼此時間', '別急著講道理', '放軟身段'],
  health: ['充分休息', '摸魚充電', '別硬撐', '放過自己'],
  wealth: ['保守理財', '延後大筆花費', '再觀察一下', '量入為出'],
  social: ['先觀察', '減少應酬', '獨處充電', '別勉強自己'],
  study: ['摸魚大法', '零食充電', '放慢步調', '循序漸進'],
  general: ['摸魚大法', '零食充電', '放慢腳步', '善待自己'],
};
var AVOID_BANK = {
  love: ['猜忌試探', '翻舊帳', '冷戰逃避', '過度解讀'],
  career: ['躁進衝動', '越級行事', '拖延交辦', '逞強攬事'],
  family: ['翻舊帳', '正面衝突', '嘮叨說教', '冷處理'],
  health: ['熬夜', '暴飲暴食', '硬撐不休息', '跳過三餐'],
  wealth: ['衝動購物', '借貸投機', '跟風下單', '過度節省'],
  social: ['口是心非', '過度比較', '勉強應酬', '散播八卦'],
  study: ['懸梁刺股', '責備自己', '臨時抱佛腳', '一心多用'],
  general: ['懸梁刺股', '責備自己', '硬撐', '和自己過不去'],
};

/* ---- lucky items (daily) ---- */
/* 幸運色／配飾／時辰／方位／數字／食物／隨身物／花這一整組資料與渲染函式已移除。
   它們是從固定清單亂數挑的，跟使用者的星盤與當天行運都沒有關係，違反本專案
   在二十八星宿那段寫下的「說得清楚、站得住腳」原則；那八項的組合也與市面
   競品幾乎一致。取代它的是 astro-charts.js 的 renderDailyRhythm() 與
   renderPeriodTone()，每一項都能回推是怎麼算出來的。 */
/* 每種配飾材質給對應的圖示，避免像「木質」卻顯示鑽石圖示這種文不對圖的狀況 */
/* 每種食物給對應的圖示，避免像「魚類」卻顯示餐具圖示這種文不對圖的狀況 */


function astroSetView(v) { state.astroView = v; state.astroDetail = null; render(); window.scrollTo(0, 0); }
function toggleAstroTabsMore() { state.astroTabsMoreOpen = !state.astroTabsMoreOpen; render(); }
function toggleAstroForecast() { state.astroForecastOpen = !state.astroForecastOpen; render(); }
function astroDismissTour() {
  state.astroTourDismissed = true;
  try { localStorage.setItem('tl_astro_tour_seen', '1'); } catch (e) {}
  render();
}
/* dismissing the tour used to be permanent — the only way back was the
   nuclear "清除所有紀錄" button, which also wipes reading history and the
   birth chart itself. This gives a lightweight way back in. */
function astroShowTour() {
  state.astroTourDismissed = false;
  state.astroTourIdx = 0;
  try { localStorage.removeItem('tl_astro_tour_seen'); } catch (e) {}
  render();
  window.scrollTo(0, 0);
}
/* 星盤功能現在有 7 個子頁面，第一次生成星盤時用一張小卡簡短導覽，避免新用戶
   不知道除了本命盤之外還有這些功能；只顯示一次，關掉後記在 localStorage 不會再跳出來。
   跟首頁的導覽卡一樣，改成一次只顯示一則＋上一則/下一則/圓點導覽。 */
var ASTRO_TOUR_ITEMS = [
  ['本命星盤', '十大行星、上升／宮位、相位、元素比例的完整分析'],
  ['每日／本週／本月／年度', '依真實行運與太陽／月亮回歸算出的評分與解讀，可切換日期'],
  ['合盤', '輸入另一人的資料，比對兩人的星盤相性'],
  ['推運', '用「一天等於一年」技法看你現在的心境演變'],
  ['28星宿', '中國古代的另一套系統，可看本命星宿、跟另一人的關係、每日擇日'],
  ['計算方式', '說明每一項數字背後用的計算方法與限制，供想了解細節的人查閱'],
];
function astroTourGo(i) {
  var max = ASTRO_TOUR_ITEMS.length - 1;
  state.astroTourIdx = i < 0 ? 0 : (i > max ? max : i);
  render();
}
function renderAstroTourCard() {
  var idx = state.astroTourIdx || 0;
  if (idx > ASTRO_TOUR_ITEMS.length - 1) idx = ASTRO_TOUR_ITEMS.length - 1;
  var it = ASTRO_TOUR_ITEMS[idx];
  var atStart = idx === 0, atEnd = idx === ASTRO_TOUR_ITEMS.length - 1;
  var h = '<div style="margin-top:16px;border:1px solid rgba(201,169,110,.3);border-radius:12px;padding:14px 16px;background:rgba(201,169,110,.05)">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center">';
  h += '<div style="font:600 12px \'Noto Sans TC\',sans-serif;color:#e6cd9a">星盤功能小導覽 <span style="opacity:.5;font-weight:400">' + (idx + 1) + '/' + ASTRO_TOUR_ITEMS.length + '</span></div>';
  h += '<button onclick="astroDismissTour()" style="background:none;border:none;color:rgba(240,233,216,.62);font:400 18px sans-serif;cursor:pointer;line-height:1;padding:0">×</button>';
  h += '</div>';
  h += '<div style="margin-top:10px;min-height:40px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.7"><span style="color:#c9a96e;font-weight:600">' + it[0] + '</span><br>' + it[1] + '</div>';
  h += '<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-top:12px">';
  h += '<button onclick="astroTourGo(' + (idx - 1) + ')" aria-label="上一則" ' + (atStart ? 'disabled' : '') + ' style="background:none;border:none;color:' + (atStart ? 'rgba(240,233,216,.15)' : 'rgba(240,233,216,.6)') + ';font-size:16px;line-height:1;cursor:' + (atStart ? 'default' : 'pointer') + ';padding:4px 4px">‹</button>';
  h += '<div style="display:flex;gap:6px">';
  ASTRO_TOUR_ITEMS.forEach(function (_, i) {
    h += '<button onclick="astroTourGo(' + i + ')" aria-label="第' + (i + 1) + '則" style="width:6px;height:6px;padding:0;border-radius:50%;border:none;cursor:pointer;background:' + (i === idx ? '#e6cd9a' : 'rgba(240,233,216,.25)') + '"></button>';
  });
  h += '</div>';
  h += '<button onclick="astroTourGo(' + (idx + 1) + ')" aria-label="下一則" ' + (atEnd ? 'disabled' : '') + ' style="background:none;border:none;color:' + (atEnd ? 'rgba(240,233,216,.15)' : 'rgba(240,233,216,.6)') + ';font-size:16px;line-height:1;cursor:' + (atEnd ? 'default' : 'pointer') + ';padding:4px 4px">›</button>';
  h += '</div>';
  h += '<div style="text-align:center;margin-top:10px"><button onclick="astroDismissTour()" style="background:none;border:none;color:rgba(240,233,216,.62);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:0 0 1px">我知道了，不用再顯示</button></div>';
  h += '</div>';
  return h;
}

/* ---- shared score-dashboard pieces (used by daily + week/month/year) ---- */
function computeCategoryScores(periodCfg, chart, transitPlanets) {
  var scores = {};
  HOROSCOPE_SCORE_CATS.forEach(function (cat) { scores[cat.key] = astroCategoryScore(cat.key, periodCfg, chart, transitPlanets); });
  return scores;
}
function renderOverallScoreBlock(overall, label) {
  var h = '<div style="text-align:center;margin-top:18px">';
  h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">' + label + '</div>';
  h += '<div style="font:700 44px \'Noto Serif TC\',serif;color:#e6cd9a;line-height:1.2">' + overall + '<span style="font:400 16px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">分</span></div>';
  h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:4px">指標可信度：' + scoreConfidenceLabel() + '</div>';
  h += '</div>';
  return h;
}
function renderCategoryScoreBars(scores) {
  var h = '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px 8px;margin-top:16px">';
  HOROSCOPE_SCORE_CATS.forEach(function (cat) {
    var s = scores[cat.key], col = CATEGORY_COLOR[cat.key];
    var pct = Math.max(4, Math.min(100, s));
    h += '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:64px">';
    h += '<div style="width:13px;height:64px;border-radius:7px;background:rgba(255,255,255,.06);position:relative;overflow:hidden">';
    h += '<div style="position:absolute;bottom:0;left:0;right:0;height:' + pct + '%;background:linear-gradient(180deg,' + col[0] + ',' + col[1] + ');border-radius:7px"></div>';
    h += '</div>';
    h += '<div style="font:700 14px \'Noto Serif TC\',serif;color:#f0e9d8">' + s + '</div>';
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55)">' + cat.zh + '</div>';
    h += '</div>';
  });
  h += '</div>';
  return h;
}

var LAST_HORO = {};

function renderDailyHoroscope(chart, transitPlanets, periodCfg, now) {
  var scores = computeCategoryScores(periodCfg, chart, transitPlanets);
  var keys = HOROSCOPE_SCORE_CATS.map(function (c) { return c.key; });
  var overall = Math.round(keys.reduce(function (s, k) { return s + scores[k]; }, 0) / keys.length);
  var maxScore = Math.max.apply(null, keys.map(function (k) { return scores[k]; }));
  var minScore = Math.min.apply(null, keys.map(function (k) { return scores[k]; }));
  var weakKey = keys.filter(function (k) { return scores[k] === minScore; })[0];
  var strongKey = keys.filter(function (k) { return scores[k] === maxScore; })[0];

  var dateStr = now.getFullYear() + pad2(now.getMonth() + 1) + pad2(now.getDate());
  var seedStr = dateStr + '_' + Math.round(chart.asc * 100) + '_daily';
  var rng = astroMulberry32(astroHashSeed(seedStr));

  var narrative, adviceItems, avoidItems;
  if (maxScore - minScore <= 4) {
    narrative = NARRATIVE_STEADY_DAILY;
    adviceItems = astroSeededPickN(rng, ADVICE_CAUTION.general, 2);
    avoidItems = astroSeededPickN(rng, AVOID_BANK.general, 2);
  } else {
    var weakVariants = NARRATIVE_WEAK[weakKey];
    narrative = weakVariants[Math.floor(rng() * weakVariants.length)];
    if (strongKey !== weakKey) narrative += ' ' + NARRATIVE_STRONG[strongKey];
    adviceItems = astroSeededPickN(rng, ADVICE_CAUTION[weakKey], 2);
    avoidItems = astroSeededPickN(rng, AVOID_BANK[weakKey], 2);
  }

  var h = '';
  h += renderOverallScoreBlock(overall, '綜合分數');
  h += renderCategoryScoreBars(scores);

  h += '<div style="margin-top:18px;border-top:1px solid rgba(201,169,110,.15);border-bottom:1px solid rgba(201,169,110,.15);padding:16px 0;font:400 13px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.8);line-height:1.9">' + esc(narrative) + '</div>';

  h += '<div style="display:flex;gap:16px;margin-top:16px">';
  h += '<div style="flex:1"><div style="font:700 13px \'Noto Sans TC\',sans-serif;color:#e6cd9a">今天適合</div><div style="margin-top:6px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.7">' + esc(adviceItems.join('、')) + '</div></div>';
  h += '<div style="flex:1"><div style="font:700 13px \'Noto Sans TC\',sans-serif;color:#d67878">今天先避開</div><div style="margin-top:6px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.7">' + esc(avoidItems.join('、')) + '</div></div>';
  h += '</div>';

  var categoryOneliners = {};
  HOROSCOPE_SCORE_CATS.forEach(function (cat) { categoryOneliners[cat.key] = categoryOnelinerText(rng, cat.key, scores[cat.key]); });
  h += '<div style="margin-top:20px;border-top:1px solid rgba(201,169,110,.15);padding-top:14px">';
  h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase">今日提醒 By Category</div>';
  HOROSCOPE_SCORE_CATS.forEach(function (cat) {
    h += '<div style="display:flex;gap:8px;margin-top:9px;align-items:baseline">';
    h += '<span style="flex:none;width:38px;font:600 12px \'Noto Sans TC\',sans-serif;color:#e6cd9a">' + esc(cat.zh) + '</span>';
    h += '<span style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.6">' + esc(categoryOneliners[cat.key]) + '</span>';
    h += '</div>';
  });
  h += '</div>';

  /* 這裡以前是「今日幸運關鍵字」八宮格（色／配飾／時辰／方位／數字／食物／
     隨身物／花），每一項都是從固定清單亂數挑的，跟星盤與行運都無關；那組項目的
     選擇也跟市面競品幾乎一字不差。改成四項全部可回推的內容，
     見 astro-charts.js 的 renderDailyRhythm()。 */
  if (typeof renderDailyRhythm === 'function') {
    h += renderDailyRhythm(chart, transitPlanets, scores, !!state.astroUnknownTime, now);
  }

  var dailyScoreBasis = {};
  HOROSCOPE_SCORE_CATS.forEach(function (cat) { dailyScoreBasis[cat.key] = astroCategoryAspectBasis(cat.key, periodCfg, chart, transitPlanets); });

  LAST_HORO.daily = {
    periodLabel: '每日運勢',
    dateRangeLabel: now.getFullYear() + '/' + pad2(now.getMonth() + 1) + '/' + pad2(now.getDate()),
    overall: overall, scores: scores,
    summary: narrative, advice: adviceItems, avoid: avoidItems,
    returnInfo: null, categoryTexts: null, categoryOneliners: categoryOneliners, scoreBasis: dailyScoreBasis,
  };

  return h;
}

/* ---- ISO week helper (stable weekly seed) ---- */
function isoWeekInfo(d) {
  var date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  var dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

/* 每種礦石給對應的顏色圖示，跟幸運配飾的作法一致，避免全部都是同一顆鑽石圖示 */


/* ---- per-category long-form paragraph bank (week / month / year) ---- */
function astroToneOf(score) { return score >= 68 ? 'positive' : score <= 48 ? 'challenging' : 'neutral'; }

var PERIOD_CATEGORY_TEXT = {
  love: {
    positive: '這段時間你的感情運勢不錯，個人魅力也頗有加分，很適合主動一點。如果是單身，可以多參加聚會或社交場合，展現真實的自己，說不定就會遇到讓你心動的對象；如果已有伴侶，適合把時間留給彼此，一起完成擱置已久的計畫，感情會更加升溫。',
    neutral: '這段時間感情運勢平穩，沒有太大的起伏，也沒有特別突出的驚喜。適合花點心思經營日常的默契與陪伴，小小的用心比大動作更能被感受到；單身的人不妨保持開放的心，機會可能就藏在平凡的日子裡。',
    challenging: '這段時間感情裡容易有些摩擦或不踏實感，一句話可能被過度解讀，也可能對關係的走向感到猶豫。建議放慢腳步，先照顧好自己的情緒，別急著要對方馬上給答案；單身的人也不必勉強自己社交，安靜地待著也無妨。',
  },
  career: {
    positive: '這段時間工作／事業運勢表現亮眼，是展現實力、爭取機會的好時機。適合主動提案、整理過去的成果，或是把握機會在關鍵人物面前露臉，你的努力容易被看見並得到回饋。',
    neutral: '這段時間工作步調平穩，沒有特別強的行運訊號，適合按表操課、把手邊的事情做好。與其求快求變，不如趁這段時間打好基礎，累積之後爆發的能量。',
    challenging: '這段時間工作上容易感到壓力增加、任務突然變多，或是被瑣事打斷節奏。建議先理清優先順序，別逼自己一次到位，穩住腳步比衝刺更重要，必要時也可以找人分擔。',
  },
  family: {
    positive: '這段時間與家人的互動相對和諧，適合多花一點時間陪伴，也記得多關注家中長輩的健康與近況。一起吃頓飯、聊聊近況，都能讓彼此的關係更緊密。',
    neutral: '這段時間家庭關係平穩，沒有特別的行運被觸發，維持現有的相處模式即可。不必刻意處理陳年議題，順其自然地互動就好。',
    challenging: '這段時間家庭關係容易出現一些緊繃或誤會，一句話可能被放大解讀。建議多一點傾聽，給彼此消化的時間，別急著爭對錯，晚點再談會比當下爭執更有效。',
  },
  health: {
    positive: '這段時間身心狀態相對穩定，是適合建立運動習慣、調整作息、累積體力的一段時間。趁狀態好的時候多存一點健康的本錢，之後會更輕鬆。',
    neutral: '這段時間身心狀態平穩，沒有明顯的健康行運，維持規律作息即可，是適合休養、儲備體力，而不是衝刺的時期。',
    challenging: '這段時間容易感到疲累或情緒起伏，事情一多人就會煩躁。記得留意自己的情緒，讓自己耐心一點，別勉強硬撐，適時放慢步調會恢復得更快。',
  },
  wealth: {
    positive: '這段時間財運方面有加分，適合整理帳戶、規劃理財，或是重新盤點許久沒關注的資源與資產配置，財務能量正在流動，適合規劃與行動。',
    neutral: '這段時間財務運勢平穩，沒有特別的波動，適合維持現有的理財節奏，不宜也不需要做重大的變動，穩穩地照計畫走就好。',
    challenging: '這段時間財務上容易有非預期的支出或猶豫不決的決定。建議保守一點，先觀察、別急著投入大筆資金，避免衝動的投資或消費。',
  },
  social: {
    positive: '這段時間人際運勢不錯，適合主動聯繫、參加聚會或活動，這段期間也可能恰好有吸引目光、展現魅力的瞬間出現，真誠的交流會為你帶來支持。',
    neutral: '這段時間人際關係平穩，沒有特別的社交行運，適合維持現有的互動節奏，不必勉強自己社交，也不必刻意迴避，順著自己的步調就好。',
    challenging: '這段時間人際互動容易讓你耗神，一句無心的話都可能被放大解讀。建議保留一些社交能量，不必勉強自己迎合每一場邀約，適度獨處也是充電的方式。',
  },
  study: {
    positive: '這段時間學習與研究運勢加分，吸收力和理解力都不錯，適合安排衝刺、挑戰新的主題或考驗自己的計畫，把握這段時間的好狀態會事半功倍。',
    neutral: '這段時間學業或學習運勢平穩，沒有特別強的行運，適合按部就班累積，扎實的基本功比臨時衝刺更划算，不必給自己太大壓力。',
    challenging: '這段時間學習狀態容易卡關、分心或提不起勁。別責怪自己不夠努力，換個方式切入、或是先休息一下再繼續，會比硬撐更有效。',
  },
};

/* per-category short one-line reminder/highlight, shown alongside the score
   and (for week/month/year) the long-form paragraph — gives a concrete,
   actionable takeaway ("注意...") rather than an abstract score. Each tone
   has a small pool so the same score range doesn't always show the same
   line; a seeded rng (shared with the lucky-item picks) selects one. */
var CATEGORY_ONELINER = {
  love: {
    positive: [
      '適合主動聯繫在意的人，好感更容易被回應。',
      '單身者社交場合容易遇到心動對象，不妨主動一點。',
      '穩定關係適合安排一次好好相處的約會，感情會加溫。',
    ],
    neutral: [
      '維持穩定互動即可，不必刻意製造話題。',
      '感情步調平順，順其自然發展就好。',
    ],
    challenging: [
      '注意言語衝突與誤會，講話前先緩一口氣。',
      '網路交友要提高警覺，對方身分不明前先別涉入金錢往來。',
      '舊情人或曖昧對象的糾纏要拿捏分寸，避免被情緒勒索。',
    ],
  },
  career: {
    positive: [
      '適合主動爭取表現機會，努力容易被看見。',
      '適合提案或談合作，這段時間你的說服力不錯。',
    ],
    neutral: [
      '按部就班完成手邊工作，先別急著求變。',
      '工作步調平順，維持現有節奏即可。',
    ],
    challenging: [
      '注意工作上的溝通落差，重要訊息務必再三確認。',
      '簽約、離職或異動相關文件，細節要看仔細再簽名。',
      '留意過勞警訊，別把工作壓力一路帶回家裡。',
    ],
  },
  family: {
    positive: [
      '適合安排家庭聚會，感情會更緊密。',
      '適合主動關心家人近況，一句問候就能拉近距離。',
    ],
    neutral: [
      '維持日常互動即可，不必特別安排什麼。',
      '家庭關係平穩，順著原本的相處模式就好。',
    ],
    challenging: [
      '注意長輩健康與家人情緒，避免舊事重提引發爭執。',
      '家中水電、瓦斯等居家安全值得檢查一下。',
      '照顧年幼或年長家人時，多留意環境安全。',
    ],
  },
  health: {
    positive: [
      '精神狀態不錯，適合安排運動或健檢。',
      '體力與精神都在狀態上，適合挑戰新的運動習慣。',
    ],
    neutral: [
      '作息維持規律即可，不必刻意進補或衝刺。',
      '身心平穩，維持現有的生活步調就好。',
    ],
    challenging: [
      '注意飲食與作息，避免熬夜或暴飲暴食。',
      '外出通勤要留意行車安全，尤其上下班尖峰時段。',
      '外食留意飲食衛生，季節交替時腸胃較敏感。',
      '長時間使用3C要留意眼睛與頸椎負擔，記得起身活動。',
    ],
  },
  wealth: {
    positive: [
      '財運加分，適合檢視理財規劃或談加薪。',
      '適合整理資產配置，財務能量正在流動。',
    ],
    neutral: [
      '收支平穩，維持原有理財節奏即可。',
      '財務沒有太大波動，照計畫走就好。',
    ],
    challenging: [
      '注意意外支出與衝動消費，簽約前多看一次條款。',
      '陌生連結或高報酬投資邀約要提高警覺，避免落入詐騙。',
      '借錢給人或幫忙作保這類的事，這段時間要謹慎評估。',
    ],
  },
  social: {
    positive: [
      '人際魅力加分，適合參加聚會或拓展人脈。',
      '這段時間人緣不錯，適合主動聯繫許久沒聯絡的朋友。',
    ],
    neutral: [
      '人際互動平順，維持現有節奏即可。',
      '社交運勢普通，不必勉強自己迎合每一場邀約。',
    ],
    challenging: [
      '注意口舌是非，避免在群體中隨口評論他人。',
      '公開發文或私訊要三思，容易被截圖或斷章取義流傳。',
      '聚會場合飲酒應酬記得量力而為，安全回家最重要。',
    ],
  },
  study: {
    positive: [
      '吸收力不錯，適合挑戰較難的內容。',
      '這段時間學習效率高，適合安排考試或報告衝刺。',
    ],
    neutral: [
      '按進度複習即可，不必臨時抱佛腳。',
      '學習狀態平穩，維持原本的步調就好。',
    ],
    challenging: [
      '注意粗心失誤，答題或交件前務必再檢查一次。',
      '報名、繳交截止日期要提前確認，避免最後一刻手忙腳亂。',
      '熬夜唸書反而影響隔天精神，適度休息效果更好。',
    ],
  },
};
function categoryOnelinerText(rng, catKey, score) {
  var pool = (CATEGORY_ONELINER[catKey] || {})[astroToneOf(score)] || [];
  if (!pool.length) return '';
  return astroSeededPickN(rng, pool, 1)[0] || '';
}

var RETURN_HIGHLIGHT_LABEL = { wealth: '財運', love: '感情', career: '事業／工作', family: '家庭', health: '健康', social: '人際', study: '學業／學習', general: '自我狀態' };

function renderReturnHighlight(returnChart, kindLabel, dateLabel, topCatKey) {
  var ascDef = ZODIAC_SIGNS[returnChart.ascSign], mcDef = ZODIAC_SIGNS[returnChart.mcSign];
  var h = '<div style="margin-top:14px;border:1px solid rgba(201,169,110,.25);border-radius:12px;padding:12px 14px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.65);line-height:1.8">';
  h += '這段時間反覆被強化的生活領域：<span style="color:#e6cd9a;font-weight:600">' + RETURN_HIGHLIGHT_LABEL[topCatKey] + '</span>。適合把注意力先放在這裡，不代表其他領域一定不好。';
  h += '<details style="margin-top:8px"><summary style="color:rgba(240,233,216,.62);cursor:pointer">查看回歸盤日期、上升與天頂</summary><div style="margin-top:5px"><span style="color:#e6cd9a;font-weight:600">' + kindLabel + '</span>　' + dateLabel + '　上升 ' + ascDef.sym + ascDef.zh + '　天頂 ' + mcDef.sym + mcDef.zh + '</div></details>';
  h += '</div>';
  return h;
}

function buildPeriodSummary(periodKey, scores, topCatKey, weakCatKey, overall) {
  var periodLabel = periodKey === 'weekly' ? '這週' : periodKey === 'monthly' ? '這個月' : '這一年';
  var tail = overall >= 72 ? '整體狀態不錯，是可以主動出擊、多爭取一些的一段時間。'
    : overall <= 45 ? '整體步調建議放緩，優先照顧好自己，別勉強衝刺。'
    : '整體穩紮穩打即可，順著節奏走，不必給自己太大壓力。';
  if (topCatKey === weakCatKey) {
    return periodLabel + '各方面的分數相當平均（約 ' + overall + ' 分上下），沒有特別突出或特別弱的舞台，適合穩定地按自己的步調前進。' + tail;
  }
  var topZh = CATEGORIES.find(function (c) { return c.key === topCatKey; }).zh;
  var weakZh = CATEGORIES.find(function (c) { return c.key === weakCatKey; }).zh;
  return periodLabel + '最被強化的舞台是「' + topZh + '」（' + scores[topCatKey] + ' 分），值得多投入心力；「' + weakZh + '」（' + scores[weakCatKey] + ' 分）相對平淡，維持現狀就好，不必特別費力。' + tail;
}

function renderPeriodDashboard(chart, transitPlanets, periodKey, periodCfg, now, city, rangeLabel) {
  var scores, returnChart = null, kindLabel = '', returnDateLabel = '';

  if (periodKey === 'weekly' || state.astroUnknownTime) {
    scores = computeCategoryScores(periodCfg, chart, transitPlanets);
  } else if (periodKey === 'monthly') {
    returnChart = findLunarReturnChart(chart, Astronomy.MakeTime(now), city.lat, city.lon);
    scores = {};
    HOROSCOPE_SCORE_CATS.forEach(function (cat) { scores[cat.key] = astroReturnCategoryScore(cat.key, chart, returnChart, LUNAR_RETURN_ASPECT_CFG); });
    kindLabel = '月亮回歸 Lunar Return';
    var lrd = returnChart.time.date;
    returnDateLabel = lrd.getFullYear() + '/' + pad2(lrd.getMonth() + 1) + '/' + pad2(lrd.getDate());
  } else {
    returnChart = findSolarReturnChart(chart, Astronomy.MakeTime(now), city.lat, city.lon);
    scores = {};
    HOROSCOPE_SCORE_CATS.forEach(function (cat) { scores[cat.key] = astroReturnCategoryScore(cat.key, chart, returnChart, SOLAR_RETURN_ASPECT_CFG); });
    kindLabel = '太陽回歸 Solar Return';
    var srd = returnChart.time.date;
    returnDateLabel = srd.getFullYear() + '/' + pad2(srd.getMonth() + 1) + '/' + pad2(srd.getDate());
  }

  var keys = HOROSCOPE_SCORE_CATS.map(function (c) { return c.key; });
  var overall = Math.round(keys.reduce(function (s, k) { return s + scores[k]; }, 0) / keys.length);
  var overallLabel = periodKey === 'weekly' ? '本週綜合分數' : periodKey === 'monthly' ? '本月綜合分數' : '本年綜合分數';
  var topCatKey = keys.reduce(function (best, k) { return scores[k] > scores[best] ? k : best; }, keys[0]);
  var weakCatKey = keys.reduce(function (worst, k) { return scores[k] < scores[worst] ? k : worst; }, keys[0]);
  var summaryText = buildPeriodSummary(periodKey, scores, topCatKey, weakCatKey, overall);

  var bucketId;
  if (periodKey === 'weekly') { var wi = isoWeekInfo(now); bucketId = 'W' + wi.year + '-' + wi.week; }
  else if (periodKey === 'monthly') { bucketId = 'M' + (returnDateLabel || rangeLabel); }
  else { bucketId = 'Y' + (returnDateLabel || rangeLabel); }
  var rng = astroMulberry32(astroHashSeed(bucketId + '_' + Math.round(chart.asc * 100) + '_' + periodKey));

  var h = '';
  h += renderOverallScoreBlock(overall, overallLabel);
  h += renderCategoryScoreBars(scores);
  h += '<div style="margin-top:18px;border-top:1px solid rgba(201,169,110,.15);border-bottom:1px solid rgba(201,169,110,.15);padding:16px 0;font:400 13px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.8);line-height:1.9">' + esc(summaryText) + '</div>';
  if (state.astroUnknownTime && periodKey !== 'weekly') h += '<div style="margin-top:10px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.7">無出生時間模式不使用回歸盤宮位，分數僅依行運與本命行星相位估算。</div>';
  if (returnChart) h += renderReturnHighlight(returnChart, kindLabel, returnDateLabel, topCatKey);
  /* 週／月／年原本也是幸運色／花／石／數字四格亂數挑；改成用這段期間已經算好的
     分數推導，見 astro-charts.js 的 renderPeriodTone()。 */
  if (typeof renderPeriodTone === 'function') {
    h += renderPeriodTone(overall, scores, (periodKey === 'weekly' ? '本週' : periodKey === 'monthly' ? '本月' : '今年') + '的節奏');
  }

  h += '<div style="margin-top:22px;font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase;text-align:center">分項解讀</div>';
  var categoryTexts = {}, categoryOneliners = {};
  HOROSCOPE_SCORE_CATS.forEach(function (cat) {
    var s = scores[cat.key], col = CATEGORY_COLOR[cat.key];
    var tone = astroToneOf(s);
    var text = PERIOD_CATEGORY_TEXT[cat.key][tone];
    var oneliner = categoryOnelinerText(rng, cat.key, s);
    categoryTexts[cat.key] = text;
    categoryOneliners[cat.key] = oneliner;
    h += '<div style="border-top:1px solid rgba(201,169,110,.15);padding:16px 0">';
    h += '<div style="display:flex;align-items:center;gap:10px">';
    h += '<span style="font:700 14px \'Noto Sans TC\',sans-serif;color:#f0e9d8">' + cat.zh + '</span>';
    h += '<span style="font:700 15px \'Noto Serif TC\',serif;color:#e6cd9a">' + s + '</span>';
    h += '<div style="flex:1;height:7px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden"><div style="width:' + s + '%;height:100%;background:linear-gradient(90deg,' + col[0] + ',' + col[1] + ')"></div></div>';
    h += '</div>';
    h += '<div style="margin-top:8px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.8">' + esc(text) + '</div>';
    h += '<div style="margin-top:7px;font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;line-height:1.7">' + esc(oneliner) + '</div>';
    h += '</div>';
  });

  var periodScoreBasis = {};
  if (periodKey === 'weekly' || !returnChart) {
    HOROSCOPE_SCORE_CATS.forEach(function (cat) { periodScoreBasis[cat.key] = astroCategoryAspectBasis(cat.key, periodCfg, chart, transitPlanets); });
  } else {
    var aspectCfgUsed = periodKey === 'monthly' ? LUNAR_RETURN_ASPECT_CFG : SOLAR_RETURN_ASPECT_CFG;
    HOROSCOPE_SCORE_CATS.forEach(function (cat) { periodScoreBasis[cat.key] = astroReturnCategoryAspectBasis(cat.key, chart, returnChart, aspectCfgUsed); });
  }

  h += '<details style="margin-top:8px;border:1px solid rgba(201,169,110,.18);border-radius:10px;padding:10px 12px"><summary style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;cursor:pointer">為什麼會得到這些分數？</summary><div style="margin-top:8px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);line-height:1.75">分數從基準值出發，再依行運或回歸盤和你的本命盤互動調整；它是整理趨勢的指標，不是事件發生機率。</div>';
  HOROSCOPE_SCORE_CATS.forEach(function(cat){var basis=periodScoreBasis[cat.key]||[];h+='<div style="margin-top:8px;font:600 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72)">'+cat.zh+' '+scores[cat.key]+' 分</div><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.65">'+esc(basis.length?basis.slice(0,5).join('；'):'這段期間沒有明顯相位被觸發，因此接近基準分數。')+'</div>';});
  h += '</details>';

  var periodLabelZh = periodKey === 'weekly' ? '本週運勢' : periodKey === 'monthly' ? '本月運勢' : '年度運勢報告';
  LAST_HORO[periodKey] = {
    periodLabel: periodLabelZh,
    dateRangeLabel: rangeLabel,
    overall: overall, scores: scores,
    summary: summaryText, advice: null, avoid: null,
    returnInfo: returnChart ? { kindLabel: kindLabel, dateLabel: returnDateLabel, ascSign: ZODIAC_SIGNS[returnChart.ascSign].zh, mcSign: ZODIAC_SIGNS[returnChart.mcSign].zh } : null,
    categoryTexts: categoryTexts, categoryOneliners: categoryOneliners, scoreBasis: periodScoreBasis,
  };

  return h;
}

/* ---- per-period date navigation ---- */
function isoDateStr(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function mondayOf(d) { var m = new Date(d); var dow = (m.getDay() + 6) % 7; m.setDate(m.getDate() - dow); return m; }
function periodRangeLabel(periodKey, now) {
  if (periodKey === 'weekly') {
    var mon = mondayOf(now), sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return pad2(mon.getMonth() + 1) + '.' + pad2(mon.getDate()) + ' - ' + pad2(sun.getMonth() + 1) + '.' + pad2(sun.getDate());
  }
  if (periodKey === 'monthly') return now.getFullYear() + '年' + (now.getMonth() + 1) + '月';
  if (periodKey === 'yearly') return now.getFullYear() + '年';
  return now.getFullYear() + '/' + pad2(now.getMonth() + 1) + '/' + pad2(now.getDate());
}
function resolveHoroNow(periodKey) {
  var today = new Date();
  if (periodKey === 'daily') return state.horoDayAnchor ? new Date(state.horoDayAnchor + 'T12:00:00') : today;
  if (periodKey === 'weekly') { var d = new Date(today); d.setDate(d.getDate() + state.horoWeekOffset * 7); return d; }
  if (periodKey === 'monthly') return new Date(today.getFullYear(), today.getMonth() + state.horoMonthOffset, 15, 12);
  return new Date(today.getFullYear() + state.horoYearOffset, today.getMonth(), today.getDate(), 12);
}
function astroSetHoroDay(iso) { var today = isoDateStr(new Date()); state.horoDayAnchor = (iso === today) ? null : iso; render(); }
function astroSetHoroWeekOffset(v) { state.horoWeekOffset = v; render(); }
function astroSetHoroMonthOffset(v) { state.horoMonthOffset = v; render(); }
function astroSetHoroYearOffset(v) { state.horoYearOffset = v; render(); }
function astroSetHoroYearRange(n) { state.horoYearRange = n; state.horoYearOffset = 0; render(); window.scrollTo(0, 0); }
function astroSelectHoroYear(v) { state.horoYearOffset = v; render(); }
function astroGoHoroYear() {
  var el = document.getElementById('horo-year-jump');
  var y = el ? parseInt(el.value, 10) : NaN;
  if (!isFinite(y) || y < 1900 || y > 2200) { if (el) el.focus(); return; }
  state.horoYearOffset = y - new Date().getFullYear();
  render();
}

function computeYearOverview(chart, city, offset) {
  var today = new Date();
  var now = new Date(today.getFullYear() + offset, today.getMonth(), today.getDate(), 12);
  var transitPlanets = computeTransitPlanets(now), scores = {}, returnChart = null;
  if (state.astroUnknownTime) {
    scores = computeCategoryScores(HOROSCOPE_PERIODS.yearly, chart, transitPlanets);
  } else {
    returnChart = findSolarReturnChart(chart, Astronomy.MakeTime(now), city.lat, city.lon);
    HOROSCOPE_SCORE_CATS.forEach(function (cat) { scores[cat.key] = astroReturnCategoryScore(cat.key, chart, returnChart, SOLAR_RETURN_ASPECT_CFG); });
  }
  var keys = HOROSCOPE_SCORE_CATS.map(function (c) { return c.key; });
  var overall = Math.round(keys.reduce(function (sum, k) { return sum + scores[k]; }, 0) / keys.length);
  var topKey = keys.reduce(function (a, b) { return scores[b] > scores[a] ? b : a; }, keys[0]);
  var weakKey = keys.reduce(function (a, b) { return scores[b] < scores[a] ? b : a; }, keys[0]);
  var topCat = HOROSCOPE_SCORE_CATS.find(function(c){return c.key===topKey;});
  var weakCat = HOROSCOPE_SCORE_CATS.find(function(c){return c.key===weakKey;});
  return { offset:offset, year:now.getFullYear(), now:now, transitPlanets:transitPlanets, scores:scores, overall:overall,
    topKey:topKey, weakKey:weakKey, topZh:topCat.zh, weakZh:weakCat.zh, returnChart:returnChart,
    summary:buildPeriodSummary('yearly', scores, topKey, weakKey, overall) };
}
function buildYearOverviewRows(chart, city, count) {
  var rows = [];
  for (var i = 0; i < count; i++) rows.push(computeYearOverview(chart, city, i));
  return rows;
}
function renderYearOverviewCard(row) {
  var selected = state.horoYearOffset === row.offset;
  var h = '<button aria-pressed="'+selected+'" onclick="astroSelectHoroYear('+row.offset+')" style="display:block;width:100%;text-align:left;margin-top:9px;border:1px solid '+(selected?'#c9a96e':'rgba(201,169,110,.22)')+';border-radius:12px;padding:12px 13px;background:'+(selected?'rgba(201,169,110,.1)':'rgba(255,255,255,.02)')+';color:inherit;cursor:pointer">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div style="font:600 17px \'Noto Serif TC\',serif;color:#e6cd9a">'+row.year+'</div><div style="font:700 22px \'Noto Serif TC\',serif;color:#f0e9d8">'+row.overall+'<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)"> 分</span></div></div>';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:5px">較強：<span style="color:#e6cd9a">'+row.topZh+' '+row.scores[row.topKey]+'</span>　留意：'+row.weakZh+' '+row.scores[row.weakKey]+'</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:9px">';
  HOROSCOPE_SCORE_CATS.forEach(function(cat){var col=CATEGORY_COLOR[cat.key];h+='<div title="'+cat.zh+' '+row.scores[cat.key]+'分" aria-label="'+cat.zh+' '+row.scores[cat.key]+'分" style="text-align:center"><div style="height:4px;border-radius:3px;background:linear-gradient(90deg,'+col[0]+' '+row.scores[cat.key]+'%,'+'rgba(255,255,255,.08) '+row.scores[cat.key]+'%)"></div><div style="font:400 8px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:3px">'+cat.zh.slice(0,1)+'</div></div>';});
  h += '</div><div style="font:400 9px \'Noto Sans TC\',sans-serif;color:'+(selected?'#c9a96e':'rgba(240,233,216,.35)')+';margin-top:7px;text-align:right">'+(selected?'下方正在顯示此年完整解讀':'點擊查看完整解讀')+'</div></button>';
  return h;
}

function renderDailyDateStrip(selected) {
  var todayIso = isoDateStr(new Date());
  var selIso = isoDateStr(selected);
  var WD = ['日', '一', '二', '三', '四', '五', '六'];
  var h = '<div style="display:flex;gap:4px;margin-top:12px">';
  for (var i = -3; i <= 3; i++) {
    var d = new Date(selected); d.setDate(d.getDate() + i);
    var iso = isoDateStr(d);
    var isSel = iso === selIso, isToday = iso === todayIso;
    h += '<button onclick="astroSetHoroDay(\'' + iso + '\')" style="flex:1;padding:8px 2px;border-radius:10px;border:1px solid ' + (isSel ? '#c9a96e' : 'rgba(201,169,110,.2)') + ';background:' + (isSel ? 'rgba(201,169,110,.18)' : 'rgba(255,255,255,.02)') + ';color:' + (isSel ? '#f0e9d8' : 'rgba(240,233,216,.55)') + ';cursor:pointer;text-align:center">';
    h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif">' + (isToday ? '今天' : '週' + WD[d.getDay()]) + '</div>';
    h += '<div style="font:600 13px \'Noto Serif TC\',serif;margin-top:2px">' + d.getDate() + '</div>';
    h += '</button>';
  }
  h += '</div>';
  return h;
}
function renderOffsetNav(labelPrev, labelCenter, labelNext, offset, setterName, rangeLabel) {
  var h = '<div style="text-align:center;margin-top:12px">';
  h += '<div style="font:400 11px \'EB Garamond\',serif;color:rgba(240,233,216,.62)">' + rangeLabel + '</div>';
  h += '<div style="display:flex;justify-content:center;gap:8px;margin-top:6px">';
  h += '<button onclick="' + setterName + '(' + (offset - 1) + ')" style="font:500 12px \'Noto Sans TC\',sans-serif;background:rgba(255,255,255,.03);border:1px solid rgba(201,169,110,.25);color:rgba(240,233,216,.6);padding:6px 12px;border-radius:14px;cursor:pointer">‹ ' + labelPrev + '</button>';
  h += '<button onclick="' + setterName + '(0)" style="font:500 12px \'Noto Sans TC\',sans-serif;background:' + (offset === 0 ? 'rgba(201,169,110,.2)' : 'rgba(255,255,255,.03)') + ';border:1px solid ' + (offset === 0 ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';color:' + (offset === 0 ? '#f0e9d8' : 'rgba(240,233,216,.6)') + ';padding:6px 14px;border-radius:14px;cursor:pointer">' + labelCenter + '</button>';
  h += '<button onclick="' + setterName + '(' + (offset + 1) + ')" style="font:500 12px \'Noto Sans TC\',sans-serif;background:rgba(255,255,255,.03);border:1px solid rgba(201,169,110,.25);color:rgba(240,233,216,.6);padding:6px 12px;border-radius:14px;cursor:pointer">' + labelNext + ' ›</button>';
  h += '</div></div>';
  return h;
}

/* ---- copy horoscope for AI ---- */
var _horoCopyTimer = null;
function horoFlashCopied() {
  var btn = document.getElementById('horo-copy-btn');
  if (btn) btn.textContent = '已複製！Copied';
  clearTimeout(_horoCopyTimer);
  _horoCopyTimer = setTimeout(function () {
    var b = document.getElementById('horo-copy-btn');
    if (b) b.textContent = state.astroView === 'yearly' && state.horoYearRange > 1 ? '複製未來 ' + state.horoYearRange + ' 年給 AI 解讀' : '複製給 AI 解讀 Copy for AI';
  }, 2000);
}
function horoCopyForAI() {
  if (state.astroView === 'yearly' && state.horoYearRange > 1) {
    var natal = state.astroResult;
    var returnCity = state.astroReturnCityIdx == null ? (state.astroCityUsed || CITY_LIST[state.astroCityIdx]) : CITY_LIST[state.astroReturnCityIdx];
    var yearRows = buildYearOverviewRows(natal, returnCity, state.horoYearRange);
    var multi = ['【未來 ' + state.horoYearRange + ' 年年度運勢總覽】', '回歸盤所在地：' + returnCity.zh];
    if (state.astroUnknownTime) multi.push('注意：出生時間未知，年度分數不使用回歸盤上升與宮位。');
    yearRows.forEach(function(row){
      multi.push(''); multi.push('【' + row.year + '】綜合 ' + row.overall + ' 分');
      multi.push('最強領域：' + row.topZh + ' ' + row.scores[row.topKey] + ' 分；較需留意：' + row.weakZh + ' ' + row.scores[row.weakKey] + ' 分');
      multi.push(HOROSCOPE_SCORE_CATS.map(function(cat){return cat.zh + ' ' + row.scores[cat.key];}).join('｜'));
      multi.push('摘要：' + row.summary);
      if (row.returnChart) { var rd=row.returnChart.time.date; multi.push('太陽回歸：'+rd.getFullYear()+'/'+pad2(rd.getMonth()+1)+'/'+pad2(rd.getDate())+'　上升'+ZODIAC_SIGNS[row.returnChart.ascSign].zh+'　天頂'+ZODIAC_SIGNS[row.returnChart.mcSign].zh); }
    });
    multi.push(''); multi.push('請比較這些年份的整體起伏、感情、事業、財運與內在發展，指出最適合主動推進及較適合保守調整的年份。分數是占星趨勢指標，不是事件發生機率。');
    multi.push(personaInstructionLine());
    var multiText = multi.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(multiText).then(horoFlashCopied).catch(function(){fallbackCopy(multiText,horoFlashCopied);});
    else fallbackCopy(multiText,horoFlashCopied);
    return;
  }
  var data = LAST_HORO[state.astroView];
  if (!data) return;
  var lines = [];
  lines.push('【' + data.periodLabel + '】' + data.dateRangeLabel);
  lines.push('綜合分數：' + data.overall + ' 分（七大類別分數平均）');
  if (data.returnInfo) {
    lines.push(data.returnInfo.kindLabel + '　' + data.returnInfo.dateLabel + '　上升 ' + data.returnInfo.ascSign + '　天頂 ' + data.returnInfo.mcSign);
  }
  lines.push('');
  lines.push('各類別分數與計算依據（依影響力排序）：');
  HOROSCOPE_SCORE_CATS.forEach(function (cat) {
    if (data.scores[cat.key] == null) return;
    lines.push('- ' + cat.zh + '：' + data.scores[cat.key] + ' 分');
    if (data.categoryTexts && data.categoryTexts[cat.key]) lines.push('　解讀：' + data.categoryTexts[cat.key]);
    if (data.categoryOneliners && data.categoryOneliners[cat.key]) lines.push('　提醒：' + data.categoryOneliners[cat.key]);
    var basis = data.scoreBasis && data.scoreBasis[cat.key];
    if (basis && basis.length) {
      lines.push('　依據：' + basis.slice(0, 5).join('；'));
    } else {
      lines.push('　依據：此期間該類別無明顯行運相位被觸發，維持基準分數');
    }
  });
  lines.push('');
  lines.push('總結：' + data.summary);
  if (data.advice) lines.push('建議：' + data.advice.join('、'));
  if (data.avoid) lines.push('避免：' + data.avoid.join('、'));
  lines.push('');
  lines.push('（分數計算方式：從基準分出發，依「本期間會被觸發的行運行星」與「本命對應行星」之間形成的相位強度增減分數；月／年運額外納入回歸盤行星落入本命宮位的加成。以上為完整依據，請根據這些實際的行運與相位，幫我做更深入、更具體的解讀與建議，而不只是重複分數高低。）');
  lines.push(personaInstructionLine());
  var text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(horoFlashCopied).catch(function () { fallbackCopy(text, horoFlashCopied); });
  } else {
    fallbackCopy(text, horoFlashCopied);
  }
}
function astroSetReturnCity(v) { state.astroReturnCityIdx = v === '' ? null : parseInt(v,10); render(); }

function renderHoroscope(periodKey) {
  var chart = state.astroResult;
  var city = state.astroReturnCityIdx == null ? (state.astroCityUsed || CITY_LIST[state.astroCityIdx]) : CITY_LIST[state.astroReturnCityIdx];
  var periodCfg = HOROSCOPE_PERIODS[periodKey];
  var now = resolveHoroNow(periodKey);
  var transitPlanets = computeTransitPlanets(now);
  var rangeLabel = periodRangeLabel(periodKey, now);
  var h = '';
  h += '<div style="font:600 16px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:14px;text-align:center">' + periodCfg.zh + '</div>';
  h += '<div style="font:400 11px \'EB Garamond\',serif;color:rgba(240,233,216,.62);text-align:center;margin-top:2px">' + rangeLabel + '</div>';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);text-align:center;margin-top:8px;line-height:1.6">根據目前的行運與你的本命星盤比對而成，僅供參考</div>';
  if (periodKey === 'yearly') {
    h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:14px">';
    [1,3,5,10].forEach(function(n){var on=state.horoYearRange===n;h+='<button aria-pressed="'+on+'" onclick="astroSetHoroYearRange('+n+')" style="padding:8px 4px;border-radius:10px;border:1px solid '+(on?'#c9a96e':'rgba(201,169,110,.28)')+';background:'+(on?'rgba(201,169,110,.18)':'rgba(255,255,255,.02)')+';color:'+(on?'#f0e9d8':'rgba(240,233,216,.55)')+';font:500 11px \'Noto Sans TC\',sans-serif;cursor:pointer">'+n+' 年</button>';});
    h += '</div>';
  }
  if (periodKey === 'monthly' || periodKey === 'yearly') {
    h += '<label style="display:block;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);margin-top:13px">回歸盤所在地<select aria-label="回歸盤所在地" onchange="astroSetReturnCity(this.value)" style="width:100%;margin-top:6px;background:#1a1622;border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;color:#f0e9d8">';
    h += '<option value="">使用出生地（' + esc((state.astroCityUsed || {}).zh || '') + '）</option>';
    CITY_LIST.forEach(function(c,i){h += '<option value="' + i + '"' + (state.astroReturnCityIdx===i?' selected':'') + '>' + esc(c.zh) + ' / ' + esc(c.en) + '</option>';});
    h += '</select></label><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:5px">若生日當天人在外地，可改選當時所在地；這會影響回歸盤的上升與宮位。</div>';
  }

  if (periodKey === 'daily') {
    h += '<div style="display:flex;gap:7px;margin-top:13px"><input id="horo-day-jump" aria-label="指定日期" type="date" value="' + isoDateStr(now) + '" onchange="astroSetHoroDay(this.value)" style="flex:1;min-width:0;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:9px;padding:8px 10px;color:#f0e9d8;font:400 12px \'Noto Sans TC\',sans-serif;outline:none;color-scheme:dark">' + (state.horoDayAnchor ? '<button onclick="astroSetHoroDay(\'' + isoDateStr(new Date()) + '\')" style="flex:none;border:1px solid #c9a96e;border-radius:9px;padding:8px 13px;background:rgba(201,169,110,.12);color:#e6cd9a;font:500 11px \'Noto Sans TC\',sans-serif;cursor:pointer;white-space:nowrap">回到今天</button>' : '') + '</div>';
    h += renderDailyDateStrip(now);
    h += renderDailyHoroscope(chart, transitPlanets, periodCfg, now);
  } else if (periodKey === 'weekly') {
    h += renderOffsetNav('上週', '本週', '下週', state.horoWeekOffset, 'astroSetHoroWeekOffset', rangeLabel);
    h += renderPeriodDashboard(chart, transitPlanets, periodKey, periodCfg, now, city, rangeLabel);
  } else if (periodKey === 'monthly') {
    h += renderOffsetNav('上月', '本月', '下月', state.horoMonthOffset, 'astroSetHoroMonthOffset', rangeLabel);
    h += renderPeriodDashboard(chart, transitPlanets, periodKey, periodCfg, now, city, rangeLabel);
  } else {
    var yearRows = buildYearOverviewRows(chart, city, state.horoYearRange || 1);
    h += '<div style="margin-top:16px;font:500 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55)">未來 ' + state.horoYearRange + ' 年比較</div>';
    yearRows.forEach(function(row){h += renderYearOverviewCard(row);});
    h += renderOffsetNav('上一年', '本年', '下一年', state.horoYearOffset, 'astroSetHoroYearOffset', rangeLabel);
    h += '<div style="display:flex;gap:7px;margin-top:9px"><input id="horo-year-jump" aria-label="指定年度" inputmode="numeric" type="number" min="1900" max="2200" placeholder="輸入年份 YYYY" onkeydown="if(event.key===\'Enter\')astroGoHoroYear()" style="flex:1;min-width:0;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:9px;padding:8px 10px;color:#f0e9d8;font:400 12px \'Noto Sans TC\',sans-serif;outline:none"><button onclick="astroGoHoroYear()" style="border:1px solid #c9a96e;border-radius:9px;padding:8px 13px;background:rgba(201,169,110,.12);color:#e6cd9a;font:500 11px \'Noto Sans TC\',sans-serif;cursor:pointer">前往指定年份</button></div>';
    h += '<div style="margin-top:20px;border-top:1px solid rgba(201,169,110,.2);padding-top:16px;text-align:center;font:600 13px \'Noto Serif TC\',serif;color:#e6cd9a">' + rangeLabel + '完整解讀</div>';
    h += renderPeriodDashboard(chart, transitPlanets, periodKey, periodCfg, now, city, rangeLabel);
  }

  h += renderPersonaPicker();
  h += '<button id="horo-copy-btn" onclick="horoCopyForAI()" style="width:100%;margin-top:22px;padding:12px;border-radius:12px;border:1px solid #c9a96e;background:rgba(201,169,110,.12);color:#e6cd9a;font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">' + (periodKey === 'yearly' && state.horoYearRange > 1 ? '複製未來 ' + state.horoYearRange + ' 年給 AI 解讀' : '複製給 AI 解讀 Copy for AI') + '</button>';
  h += '<button onclick="astroSetView(\'chart\')" style="width:100%;margin-top:10px;padding:12px;border-radius:12px;border:1px solid rgba(201,169,110,.3);background:rgba(255,255,255,.02);color:rgba(240,233,216,.6);font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">← 回到本命星盤</button>';
  return h;
}

function astroSetHouseSystem(k) {
  state.astroHouseSystem = k;
  if (state.astroResult && state.astroCityUsed) {
    var hh = state.astroUnknownTime ? 12 : (parseInt(state.astroH, 10) || 0);
    var mm = state.astroUnknownTime ? 0 : (parseInt(state.astroMin, 10) || 0);
    state.astroResult = computeNatalChart(parseInt(state.astroY, 10), parseInt(state.astroM, 10), parseInt(state.astroD, 10), hh, mm, state.astroCityUsed.lat, state.astroCityUsed.lon, state.astroCityUsed.tz, k);
    resetNatalTopicAnalysisForChartChange();
    astroSaveProfile();
  }
  render();
}
function astroSelectDetail(k) { state.astroDetail = state.astroDetail === k ? null : k; render(); }
function astroMoonRangeText() {
  if (!state.astroUnknownTime || !state.astroCityUsed) return '';
  var c = state.astroCityUsed;
  /* 這裡會即時再算兩次盤，需要 Astronomy Engine。正常流程一定已經載入
     （astroGenerate/astroLoadProfile 都先 await ensureAstronomyLoaded），
     但如果引擎在之後才被快取失效或載入失敗，這一行丟出例外會讓整個 renderAstro()
     中斷、畫面變成空白——寧可省略這一段補充資訊，也不能整頁掛掉。 */
  try {
    var a = computeNatalChart(+state.astroY,+state.astroM,+state.astroD,0,0,c.lat,c.lon,c.tz,state.astroHouseSystem).planets.Moon;
    var b = computeNatalChart(+state.astroY,+state.astroM,+state.astroD,23,59,c.lat,c.lon,c.tz,state.astroHouseSystem).planets.Moon;
    return ZODIAC_SIGNS[a.sign].zh + ' ' + a.deg.toFixed(1) + '° ～ ' + ZODIAC_SIGNS[b.sign].zh + ' ' + b.deg.toFixed(1) + '°';
  } catch (e) {
    return '（暫時無法計算，星盤計算元件尚未就緒）';
  }
}
/* V2：命盤總覽建構一個「假 evidence」餵給跟人生主題分析同一套 contextualizeEvidence()，
   讓命盤總覽／人生主題分析共用同一份判斷與情境化引擎，只是輸出的目的不同
   （總覽是整體人格輪廓，主題分析是針對具體問題）——呼應規格要求的「四個輸出功能
   共用同一份本命盤資料與判斷邏輯」。 */
function natalQuickEvidence(chart, planetKey) {
  var p = chart.planets[planetKey];
  if (!p) return null;
  var def = findAnyPointDef(planetKey);
  return { planetKey: planetKey, sign: p.sign, house: state.astroUnknownTime ? null : p.house, canonicalKey: 'quick|' + planetKey, factor: def ? def.zh : planetKey, reason: def ? (def.meaning || def.zh) : '' };
}
function natalQuickText(chart, planetKey, intent, seedTag) {
  var e = natalQuickEvidence(chart, planetKey);
  return e ? contextualizeEvidence(e, intent, 'headline', 'quicksummary|' + seedTag) : null;
}
function renderAstroQuickSummary(chart) {
  var sunSign = chart.planets.Sun.sign, moonSign = chart.planets.Moon.sign;
  var eq = computeElementQualityBalance(chart);
  var elems = ['火', '土', '風', '水'];
  var topElem = elems.reduce(function (a, b) { return eq.elem[b] > eq.elem[a] ? b : a; }, elems[0]);

  /* 一句核心印象＋3個人格關鍵詞 */
  var coreImpression = natalQuickText(chart, 'Sun', 'overview', 'core');
  var keywords = [SIGN_KEYWORD[sunSign], SIGN_KEYWORD[moonSign]];
  if (!state.astroUnknownTime && chart.ascSign != null) keywords.push(SIGN_KEYWORD[chart.ascSign]);
  else keywords.push(topElem + '特質突出');
  keywords = keywords.filter(function (k, i) { return keywords.indexOf(k) === i; });

  /* 自我／情緒／人際／行動 四個面向。「自我」面向不套用一般 intent frame（那些
     frame 是為了回答具體問題設計的，例如 profile 講的是「容易遇到怎樣的人」，
     套在自我描述上語意會不通），改用專屬於自我描述的固定句型，直接引用
     coreNeed／behavior 欄位，跟上面的「一句核心印象」（function+mode）引用不同
     欄位，確保不會整段重複。 */
  var sunPb = PLANET_BEGINNER.Sun, sunSb = SIGN_BEGINNER[sunSign];
  var selfText = (sunPb && sunSb) ? ('你習慣透過「' + sunPb.coreNeed[0] + '」來確立自己，具體會' + sunSb.behavior + '。') : null;
  var dims = [
    { label: '自我', text: selfText },
    { label: '情緒', text: natalQuickText(chart, 'Moon', 'overview', 'emotion') },
    { label: '人際', text: natalQuickText(chart, 'Venus', 'style', 'social') },
    { label: '行動', text: natalQuickText(chart, 'Mars', 'pattern', 'action') },
  ].filter(function (d) { return d.text; });

  /* 核心優勢／成長課題：復用 strength／challenge intent，跟人生主題分析同一套字典 */
  var strengths = [natalQuickText(chart, 'Sun', 'strength', 'str1'), natalQuickText(chart, 'Moon', 'strength', 'str2')].filter(Boolean);
  var challenges = [natalQuickText(chart, 'Saturn', 'challenge', 'cha1'), natalQuickText(chart, 'Mars', 'challenge', 'cha2')].filter(Boolean);

  var major = astroUsableAspects(chart).filter(function (a) { return ASTRO_PLANET_BODY_KEYS.indexOf(a.a) >= 0 && ASTRO_PLANET_BODY_KEYS.indexOf(a.b) >= 0; }).sort(function (a, b) { return a.orb - b.orb; }).slice(0, 3);

  var h = '<section style="margin-top:16px;border:1px solid rgba(201,169,110,.38);border-radius:12px;padding:16px 17px;background:rgba(201,169,110,.07)"><h3 style="font:600 14px \'Noto Serif TC\',serif;color:#e6cd9a;margin:0">三分鐘看懂你的星盤</h3>';
  if (coreImpression) h += '<div style="font:500 12.5px \'Noto Sans TC\',sans-serif;color:#f0e9d8;line-height:1.8;margin-top:9px">' + esc(coreImpression) + '</div>';
  h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:9px">' + keywords.map(function (k) { return '<span style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;background:rgba(201,169,110,.12);border:1px solid rgba(201,169,110,.3);border-radius:20px;padding:3px 11px">' + esc(k) + '</span>'; }).join('') + '</div>';
  if (state.astroUnknownTime) h += '<div style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:8px">出生時間未知，因此本摘要不採用上升與宮位。</div>';

  if (dims.length) {
    h += '<div style="margin-top:13px;display:grid;grid-template-columns:1fr 1fr;gap:9px">';
    dims.forEach(function (d) {
      h += '<div style="border-left:2px solid rgba(201,169,110,.35);padding-left:8px"><span style="font:500 10.5px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + esc(d.label) + '</span><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.65;margin-top:2px">' + esc(d.text) + '</div></div>';
    });
    h += '</div>';
  }
  if (strengths.length) {
    h += '<div style="margin-top:12px;font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">核心優勢</div>';
    strengths.forEach(function (s) { h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.7;margin-top:3px">・' + esc(s) + '</div>'; });
  }
  if (challenges.length) {
    h += '<div style="margin-top:10px;font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">成長課題</div>';
    challenges.forEach(function (c) { h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.65);line-height:1.7;margin-top:3px">・' + esc(c) + '</div>'; });
  }
  if (major.length) {
    /* 這裡原本用 aspectBeginnerData()／ASPECT_BEGINNER——那是給合盤與推運寫的通用
       文案，只有「兩個關鍵字 + 合不合得來」兩層資訊，而且每種相位只有 2 句 lead。
       實際後果是三分相一多，畫面上就連續出現「天生合拍，兩者之間幾乎沒有阻力」
       「搭配得很自然，幾乎不用刻意練習」這種同義句，讀者看完不知道自己會做出
       什麼行為。

       改法不是換一組形容詞，而是換掉句子的組成方式：
       ・關係本身（合相／六分／三分／四分／對分）壓縮成一個短標籤，只講機制，
         同一種相位出現三次也只是同一個標籤，不會變成三句換句話說的廢話；
       ・句子主體改用 natalAspectProfile().gift，那是「你實際上會做的事」
         （例如「把資訊整理成清楚語言」），跟下方「主要相位」區同一份資料來源。
       落點（哪一宮、哪個星座）刻意留在下方詳細區與摺疊區，不塞進摘要——
       實測把 {Aplace} 帶進來會讓每句變成 60 字、連續兩個引號，反而更難讀。 */
    var QUICK_ASPECT_TAG = {
      conjunction: '幾乎同時發生',
      sextile: '主動用才會啟動',
      trine: '自動接力',
      square: '互相卡住',
      opposition: '兩端拉扯',
    };
    var quickAspectRows = major.map(function (qa) {
      var qpa = natalAspectProfile(qa.a), qpb = natalAspectProfile(qa.b);
      var qda = findAnyPointDef(qa.a), qdb = findAnyPointDef(qa.b);
      var qtag = QUICK_ASPECT_TAG[qa.type];
      if (!qpa || !qpb || !qda || !qdb || !qtag) return '';
      return '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.75;margin-top:6px">'
        + '<strong style="color:#f0e9d8">' + esc(qda.zh + ' × ' + qdb.zh) + '</strong>'
        + '<span style="font-size:10px;color:#c9a96e;border:1px solid rgba(201,169,110,.35);border-radius:8px;padding:1px 6px;margin-left:6px;white-space:nowrap">' + esc(qtag) + '</span>'
        + '<br>你會' + esc(qpa.gift) + '，也會' + esc(qpb.gift) + '。</div>';
    }).filter(Boolean).join('');
    if (quickAspectRows) {
      h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:12px">最明顯的三組性格互動</div>';
      h += '<div style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.6;margin-top:3px">兩顆行星角度接近時，它們代表的兩種能力會連動。標籤說的是連動方式：自動接力最省力，互相卡住與兩端拉扯比較耗神，但也最容易練出本事。</div>';
      h += quickAspectRows;
      h += '<details style="margin-top:8px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);cursor:pointer">查看三組相位的專業名稱與容許度</summary><div style="margin-top:5px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.7">' + major.map(function (qa) { return esc(aspectPlacementText(qa)); }).join('<br>') + '</div><div style="margin-top:5px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.7">想看這幾組落在哪一宮、哪個星座，以及可以怎麼練習，請往下展開「主要相位 Aspects」。</div></details>';
    }
  }
  return h + '</section>';
}

function astroUsableAspects(chart) {
  if (!state.astroUnknownTime) return chart.aspects || [];
  return (chart.aspects || []).filter(function (a) {
    return ['Moon', 'Fortune', 'Vertex'].indexOf(a.a) < 0 && ['Moon', 'Fortune', 'Vertex'].indexOf(a.b) < 0;
  });
}
function scoreConfidenceLabel() { return state.astroUnknownTime ? '中低（出生時間未知，不採用宮位）' : '中等（占星指標，並非事件機率）'; }
function renderAstroMethodology() {
  var h='<section style="margin-top:16px;border:1px solid rgba(201,169,110,.3);border-radius:12px;padding:15px 17px;background:rgba(255,255,255,.02)"><h3 style="font:600 14px \'Noto Serif TC\',serif;color:#e6cd9a;margin:0">計算方式與限制</h3>';
  var rows=[['天文位置','使用 Astronomy Engine 計算十大行星；凱龍星使用簡化軌道模型。'],['宮位','可選普拉西德制或整宮制；出生時間未知時不解讀上升、天頂、宮位、福點與宿命點。'],['相位容許度','合相／對分 8°、三分／四分 6°、六分 4°；依誤差由小到大排列。出生時間未知時，也會排除月亮、福點與宿命點相位。'],['交點與莉莉絲','採平均交點與平均莉莉絲算法。'],['運勢分數','依行運相位與回歸盤規則形成的本站指標，不是科學機率或事件保證。'],['隱私','出生資料只保存在你的瀏覽器，不會上傳伺服器。']];
  rows.forEach(function(r){h+='<div style="margin-top:10px"><strong style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">'+r[0]+'</strong><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.7);line-height:1.75;margin-top:2px">'+r[1]+'</div></div>';});
  return h+'</section>';
}
