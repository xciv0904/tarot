/* ============================================================================
   星盤資料視覺化：把已經算好的數字畫成圖。

   起因：實測合盤畫面有 3,345 字、102 段文字、**0 個圖像**；本命星盤 25,168 字
   只配一張輪圖。相性指數、和諧與挑戰相位的數量、每一組行星互動的強度——這些
   全都是現成的數值，卻整包用文字列出來讓人自己在腦中組裝。

   這個檔案只負責「畫」，不做任何占星計算：所有數值都由呼叫端算好後傳進來，
   確保畫面與文字敘述看到的是同一份資料，不會各算各的。

   一律用純 SVG，不引入任何圖表套件——這個專案沒有打包工具，多一個相依就多一份
   要維護的東西，而這裡需要的形狀都很簡單。

   無障礙：每張圖都是 role="img"，並附上 <title> 與 <desc>，讓讀屏使用者拿到
   跟看圖的人一樣的資訊，而不是被跳過。
   ============================================================================ */

/* 合盤相性的五個面向，以及各自由哪些行星決定。
   一個相位只要任一端落在該面向的行星清單裡就會計入，所以同一組相位可能同時
   影響多個面向——這是刻意的，月亮金星的相位本來就同時牽動情感與吸引力。 */
var SYNASTRY_FACETS = [
  { key: 'emotion', zh: '情感共鳴', planets: ['Moon', 'Venus'], hint: '感受能不能被接住、相處起來舒不舒服' },
  { key: 'talk', zh: '溝通理解', planets: ['Mercury'], hint: '講話合不合拍、容不容易誤會' },
  { key: 'spark', zh: '吸引與行動', planets: ['Sun', 'Mars'], hint: '有沒有火花、推不推得動彼此' },
  { key: 'commit', zh: '穩定與承諾', planets: ['Saturn', 'Jupiter'], hint: '走得久不久、能不能一起扛事' },
  { key: 'change', zh: '刺激與變化', planets: ['Uranus', 'Neptune', 'Pluto'], hint: '會不會互相改變、有沒有戲劇性' },
];

/* 把交叉相位換算成每個面向的分數。
   回傳 score=null 代表這個面向完全沒有相位——這種情況要老實說「沒有明顯訊號」，
   而不是給一個看起來像中間值的 50 分，那會讓人以為「普通」而不是「沒資料」。 */
function synastryFacetScores(aspects) {
  return SYNASTRY_FACETS.map(function (facet) {
    var hits = (aspects || []).filter(function (asp) {
      return facet.planets.indexOf(asp.aKey) !== -1 || facet.planets.indexOf(asp.bKey) !== -1;
    });
    if (!hits.length) return { key: facet.key, zh: facet.zh, hint: facet.hint, score: null, count: 0 };
    var score = 55;
    hits.forEach(function (asp) {
      var orbLimit = (typeof CROSS_ASPECT_ORB !== 'undefined' && CROSS_ASPECT_ORB[asp.type]) || 6;
      var strength = 1 - Math.min(1, asp.orb / orbLimit);
      score += astroAspectPoints(asp.type, asp.aKey) * strength * 0.5;
    });
    return {
      key: facet.key, zh: facet.zh, hint: facet.hint, count: hits.length,
      score: Math.max(15, Math.min(95, Math.round(score))),
    };
  });
}

/* 分數的顏色帶：跟站上既有的色票一致（綠＝順、金＝中性、紅＝需留意）。 */
function synastryBandColor(score) {
  if (score >= 68) return '#9bc5a3';
  if (score <= 45) return '#d9a0a0';
  return '#e6cd9a';
}
function synastryBandLabel(score) {
  if (score >= 68) return '順';
  if (score <= 45) return '需留意';
  return '中等';
}

/* ---------- 相性面向長條圖 ----------
   刻意用橫向長條而不是雷達圖：手機上雷達圖的軸標籤會擠在一起看不清楚，
   長條圖從上往下讀就好，也比較容易做成可點擊的按鈕。
   每一條都是 <button>，點下去會篩選下方的相位卡片（見 synSetFacet）。 */
function renderSynastryFacetBars(aspects, activeFacet) {
  var rows = synastryFacetScores(aspects);
  var withData = rows.filter(function (r) { return r.score !== null; });
  if (!withData.length) return '';

  var h = '<div style="margin-top:18px">';
  h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.08em;color:rgba(240,233,216,.55);text-align:center">五個面向各自的默契程度</div>';
  h += '<div style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);text-align:center;margin-top:4px;line-height:1.6">點任何一條，下方只顯示跟它有關的解讀</div>';
  h += '<div style="margin-top:12px;display:flex;flex-direction:column;gap:9px">';

  rows.forEach(function (r) {
    var on = activeFacet === r.key;
    if (r.score === null) {
      h += '<div style="opacity:.45"><div style="display:flex;justify-content:space-between;align-items:baseline">'
        + '<span style="font:500 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.7)">' + esc(r.zh) + '</span>'
        + '<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">沒有明顯訊號</span></div>'
        + '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:2px">' + esc(r.hint) + '</div></div>';
      return;
    }
    var color = synastryBandColor(r.score);
    h += '<button type="button" aria-pressed="' + on + '" onclick="synSetFacet(\'' + r.key + '\')"'
      + ' aria-label="' + esc(r.zh + '，' + r.score + ' 分，' + synastryBandLabel(r.score) + '，' + r.count + ' 組相位。點擊只看這個面向的解讀') + '"'
      + ' style="width:100%;text-align:left;background:' + (on ? 'rgba(201,169,110,.14)' : 'transparent')
      + ';border:1px solid ' + (on ? '#c9a96e' : 'rgba(201,169,110,.18)') + ';border-radius:10px;padding:9px 11px;cursor:pointer">';
    h += '<div style="display:flex;justify-content:space-between;align-items:baseline">';
    h += '<span style="font:500 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8">' + (on ? '✓ ' : '') + esc(r.zh) + '</span>';
    h += '<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:' + color + '">' + esc(synastryBandLabel(r.score)) + '　' + r.count + ' 組</span>';
    h += '</div>';
    /* 長條本身：底槽 + 依分數填色。用 div 而不是 SVG，讓它自然跟著容器寬度縮放。 */
    h += '<div aria-hidden="true" style="margin-top:6px;height:7px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden">';
    h += '<div style="width:' + r.score + '%;height:100%;border-radius:4px;background:' + color + ';opacity:.85"></div>';
    h += '</div>';
    h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:4px">' + esc(r.hint) + '</div>';
    h += '</button>';
  });
  h += '</div></div>';
  return h;
}

/* ---------- 雙人行星連線圖 ----------
   外圈是本人的行星、內圈是對方的，位置照黃道經度排；兩顆行星之間有相位就連一條線，
   和諧相位畫綠色、挑戰相位畫紅色、合相畫金色，線的粗細與不透明度代表緊密程度。

   位置一律用絕對黃道座標（0° 牡羊在左側），不以任一方的上升為準——這是兩個人的
   對照圖，用其中一個人的角度當基準並不公平，也會讓另一個人的行星位置看起來很怪。 */
var SYN_LINK_COLORS = {
  trine: '#9bc5a3', sextile: '#9bc5a3',
  square: '#d9a0a0', opposition: '#d9a0a0',
  conjunction: '#e6cd9a',
};
function renderSynastryLinkChart(chartA, chartB, aspects, activeFacet) {
  if (!chartA || !chartB || typeof PLANET_DEFS === 'undefined') return '';
  var keys = PLANET_DEFS.map(function (p) { return p.key; });
  var cx = 150, cy = 150, outerR = 118, innerR = 76;
  var facet = activeFacet ? SYNASTRY_FACETS.filter(function (f) { return f.key === activeFacet; })[0] : null;

  function angleOf(lon) { return astroNormDeg(180 - lon); }
  function posOf(lon, r) { return astroPolar(cx, cy, r, angleOf(lon)); }

  var shown = (aspects || []).filter(function (asp) {
    if (!facet) return true;
    return facet.planets.indexOf(asp.aKey) !== -1 || facet.planets.indexOf(asp.bKey) !== -1;
  });

  var harmony = shown.filter(function (a) { return a.type === 'trine' || a.type === 'sextile'; }).length;
  var tension = shown.filter(function (a) { return a.type === 'square' || a.type === 'opposition'; }).length;
  var conj = shown.filter(function (a) { return a.type === 'conjunction'; }).length;
  var desc = '外圈是你的行星、內圈是對方的行星，兩人之間共有 ' + shown.length + ' 組互相牽動：'
    + harmony + ' 組彼此加分（綠線）、' + tension + ' 組需要磨合（紅線）、' + conj + ' 組能量疊在一起（金線）。'
    + (facet ? '目前只顯示「' + facet.zh + '」相關的部分。' : '');

  var svg = '<svg role="img" aria-labelledby="syn-link-title syn-link-desc" viewBox="0 0 300 300" width="100%" style="max-width:320px;display:block;margin:0 auto">';
  svg += '<title id="syn-link-title">兩人行星互動圖</title><desc id="syn-link-desc">' + esc(desc) + '</desc>';

  /* 十二星座刻度，讓兩圈的位置有共同參照 */
  for (var i = 0; i < 12; i++) {
    var a1 = angleOf(i * 30);
    var t1 = astroPolar(cx, cy, outerR + 4, a1), t2 = astroPolar(cx, cy, outerR + 12, a1);
    svg += '<line x1="' + t1.x + '" y1="' + t1.y + '" x2="' + t2.x + '" y2="' + t2.y + '" stroke="rgba(201,169,110,.22)" stroke-width="0.8"/>';
    var gp = astroPolar(cx, cy, outerR + 22, angleOf(i * 30 + 15));
    svg += '<text x="' + gp.x + '" y="' + (gp.y + 4) + '" text-anchor="middle" font-size="11" fill="rgba(201,169,110,.55)">' + ZODIAC_SIGNS[i].sym + '</text>';
  }
  svg += '<circle cx="150" cy="150" r="' + outerR + '" fill="none" stroke="rgba(201,169,110,.3)" stroke-width="1"/>';
  svg += '<circle cx="150" cy="150" r="' + innerR + '" fill="none" stroke="rgba(124,92,255,.35)" stroke-width="1"/>';

  /* 先畫連線再畫行星，行星圓點才不會被線蓋住 */
  shown.forEach(function (asp) {
    var pa = chartA.planets[asp.aKey], pb = chartB.planets[asp.bKey];
    if (!pa || !pb) return;
    var orbLimit = (typeof CROSS_ASPECT_ORB !== 'undefined' && CROSS_ASPECT_ORB[asp.type]) || 6;
    var strength = 1 - Math.min(1, asp.orb / orbLimit);
    var p1 = posOf(pa.lon, outerR), p2 = posOf(pb.lon, innerR);
    svg += '<line x1="' + p1.x.toFixed(1) + '" y1="' + p1.y.toFixed(1) + '" x2="' + p2.x.toFixed(1) + '" y2="' + p2.y.toFixed(1)
      + '" stroke="' + (SYN_LINK_COLORS[asp.type] || '#c9a96e') + '" stroke-width="' + (0.6 + strength * 1.6).toFixed(2)
      + '" opacity="' + (0.25 + strength * 0.5).toFixed(2) + '"/>';
  });

  function drawPlanets(chart, r, ringColor) {
    keys.forEach(function (k) {
      var p = chart.planets[k];
      if (!p) return;
      var def = PLANET_DEFS.filter(function (x) { return x.key === k; })[0];
      var dim = facet && facet.planets.indexOf(k) === -1;
      var pos = posOf(p.lon, r);
      svg += '<circle cx="' + pos.x.toFixed(1) + '" cy="' + pos.y.toFixed(1) + '" r="9" fill="#1a1622" stroke="' + ringColor
        + '" stroke-width="0.9" opacity="' + (dim ? 0.35 : 1) + '"/>';
      svg += '<text x="' + pos.x.toFixed(1) + '" y="' + (pos.y + 3.5).toFixed(1) + '" text-anchor="middle" font-size="10" fill="#f0e9d8" opacity="'
        + (dim ? 0.4 : 1) + '">' + def.sym + '</text>';
    });
  }
  drawPlanets(chartA, outerR, 'rgba(201,169,110,.75)');
  drawPlanets(chartB, innerR, 'rgba(124,92,255,.75)');
  svg += '</svg>';

  var h = '<div style="margin-top:16px">' + svg;
  /* 圖例：顏色本身不該是唯一的區分方式，所以每一項都同時有文字說明 */
  h += '<div style="display:flex;flex-wrap:wrap;gap:10px 14px;justify-content:center;margin-top:10px">';
  [['#9bc5a3', '彼此加分'], ['#d9a0a0', '需要磨合'], ['#e6cd9a', '能量疊在一起']].forEach(function (item) {
    h += '<span style="display:inline-flex;align-items:center;gap:5px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55)">'
      + '<span aria-hidden="true" style="width:14px;height:2px;background:' + item[0] + ';display:inline-block"></span>' + item[1] + '</span>';
  });
  h += '</div>';
  h += '<div style="display:flex;gap:14px;justify-content:center;margin-top:6px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">'
    + '<span>外圈＝你</span><span>內圈＝對方</span></div>';
  h += '</div>';
  return h;
}

/* ---------- 元素與性質分布 ----------
   這兩組數字（十大行星各落在哪個元素／性質）本來就算好了，卻藏在
   「查看元素與性質數字」的摺疊區裡，用四個裸數字呈現。攤開畫成長條之後，
   「哪一種特別多、哪一種幾乎沒有」一眼就看得出來，不用自己比大小。

   刻意不用圓餅圖：四到五個分類的比例比較，長條的長度比扇形的角度好判讀，
   而且長條可以直接把數量標在旁邊。 */
var ELEMENT_CHART_COLORS = { 火: '#e07850', 土: '#c9a96e', 風: '#8fc7f4', 水: '#6fa8d8' };
var QUALITY_CHART_COLORS = { 本位: '#e6cd9a', 固定: '#9bc5a3', 變動: '#b7a4d8' };
var ELEMENT_CHART_HINT = { 火: '衝動力', 土: '踏實度', 風: '思考與交流', 水: '感受力' };
var QUALITY_CHART_HINT = { 本位: '開頭', 固定: '持續', 變動: '應變' };

function renderBalanceBars(title, data, keys, colors, hints, total) {
  var h = '<div style="margin-top:12px">';
  h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-bottom:7px">' + esc(title) + '</div>';
  keys.forEach(function (k) {
    var n = data[k] || 0;
    var pct = total ? Math.round((n / total) * 100) : 0;
    h += '<div style="display:flex;align-items:center;gap:8px;margin-top:6px">';
    h += '<span style="flex:none;width:34px;font:500 11.5px \'Noto Sans TC\',sans-serif;color:' + colors[k] + '">' + esc(k) + '</span>';
    /* 長條本身不傳達獨立資訊——數量就寫在右邊，讀屏使用者不會漏掉 */
    h += '<span aria-hidden="true" style="flex:1;height:9px;border-radius:5px;background:rgba(255,255,255,.06);overflow:hidden;display:block">';
    h += '<span style="display:block;width:' + pct + '%;height:100%;border-radius:5px;background:' + colors[k] + ';opacity:.85"></span></span>';
    h += '<span style="flex:none;width:52px;text-align:right;font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6)">' + n + ' 顆</span>';
    h += '</div>';
    h += '<div style="margin-left:42px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">' + esc(hints[k]) + '</div>';
  });
  return h + '</div>';
}

function renderElementQualityChart(eq) {
  if (!eq) return '';
  var elemKeys = ['火', '土', '風', '水'], qualKeys = ['本位', '固定', '變動'];
  var elemTotal = elemKeys.reduce(function (n, k) { return n + (eq.elem[k] || 0); }, 0);
  var qualTotal = qualKeys.reduce(function (n, k) { return n + (eq.qual[k] || 0); }, 0);
  if (!elemTotal) return '';
  var missing = elemKeys.filter(function (k) { return !eq.elem[k]; });
  var h = '<div style="margin-top:14px;border-top:1px solid rgba(201,169,110,.14);padding-top:12px">';
  h += renderBalanceBars('四元素：你主要用哪種方式反應', eq.elem, elemKeys, ELEMENT_CHART_COLORS, ELEMENT_CHART_HINT, elemTotal);
  h += renderBalanceBars('三性質：你習慣的行動節奏', eq.qual, qualKeys, QUALITY_CHART_COLORS, QUALITY_CHART_HINT, qualTotal);
  /* 「完全沒有」比「比較少」更值得講——缺元素常常是使用者最有感的一件事 */
  if (missing.length) {
    h += '<div style="margin-top:10px;font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);line-height:1.7">'
      + '十顆行星沒有任何一顆落在「' + esc(missing.join('、')) + '」，代表這一塊要靠後天刻意練習，不會自然而然發生。</div>';
  }
  return h + '</div>';
}

/* ---------- 二次推運總覽圖 ----------
   推運畫面原本是四千字、零個視覺元素：每一年一張文字卡，要一路讀完才知道
   「哪幾年重要、內在需求什麼時候換檔」。但這些 buildProgressionYears() 都算好了：

     · prog.planets.Moon.sign — 推運月亮的星座，每 2～3 年換一次，是這個技法的主軸
     · prog.planets.Sun.sign  — 推運太陽的星座，28～30 年才換一次
     · aspects.length          — 那一年有幾組緊密相位，等於那年的「熱鬧程度」
     · isTransition            — 該年是否有換座或緊密相位

   一張圖分三層疊起來：上面是推運月亮的星座帶（換座就換一段、依元素著色），
   中間是年份軸與轉折標記，下面是每年的相位數量長條。看完就知道要細讀哪幾年。 */
var PROG_ELEMENT_FILL = { 火: '#c0704f', 土: '#8c7a55', 風: '#6d87a0', 水: '#5c7f92' };

function renderProgressionTimeline(rows, expandedYear) {
  if (!rows || rows.length < 2 || typeof ZODIAC_SIGNS === 'undefined') return '';
  var n = rows.length;
  var W = 300, padX = 16, bandY = 16, bandH = 26, axisY = 62, barTop = 78, barMaxH = 34;
  var H = barTop + barMaxH + 22;
  var colW = (W - padX * 2) / n;

  /* 推運月亮的星座分段：連續同一個星座的年份合併成一段 */
  var segs = [];
  rows.forEach(function (r, i) {
    var sign = r.prog && r.prog.planets && r.prog.planets.Moon ? r.prog.planets.Moon.sign : null;
    if (sign === null) return;
    var last = segs[segs.length - 1];
    if (last && last.sign === sign) last.end = i; else segs.push({ sign: sign, start: i, end: i });
  });
  var maxAspects = rows.reduce(function (m, r) { return Math.max(m, (r.aspects || []).length); }, 1);
  var marks = rows.filter(function (r) { return r.isTransition; }).map(function (r) { return r.year; });
  var sunSigns = [];
  rows.forEach(function (r) {
    var sg = r.prog && r.prog.planets && r.prog.planets.Sun ? ZODIAC_SIGNS[r.prog.planets.Sun.sign].zh : null;
    if (sg && sunSigns.indexOf(sg) === -1) sunSigns.push(sg);
  });

  var desc = rows[0].year + ' 到 ' + rows[n - 1].year + ' 年共 ' + n + ' 年。推運月亮依序走過 '
    + segs.map(function (sg) {
        var yrs = rows[sg.start].year + (sg.end > sg.start ? ('–' + rows[sg.end].year) : '');
        return ZODIAC_SIGNS[sg.sign].zh + '（' + yrs + '）';
      }).join('、')
    + '；推運太陽在' + sunSigns.join('、') + '。'
    + (marks.length ? '有明顯轉折的是 ' + marks.join('、') + ' 年。' : '這段期間沒有特別明顯的轉折年。')
    + '每年的緊密相位數量為 ' + rows.map(function (r) { return r.year + ' 年 ' + (r.aspects || []).length + ' 組'; }).join('、') + '。';

  var svg = '<svg role="img" aria-labelledby="prog-tl-title prog-tl-desc" viewBox="0 0 ' + W + ' ' + H
    + '" width="100%" style="max-width:340px;display:block;margin:0 auto">';
  svg += '<title id="prog-tl-title">推運總覽</title><desc id="prog-tl-desc">' + esc(desc) + '</desc>';

  /* 第一層：推運月亮星座帶 */
  segs.forEach(function (sg) {
    var x = padX + colW * sg.start;
    var w = colW * (sg.end - sg.start + 1);
    var def = ZODIAC_SIGNS[sg.sign];
    var fill = PROG_ELEMENT_FILL[def.elem] || '#8c7a55';
    svg += '<rect x="' + x.toFixed(1) + '" y="' + bandY + '" width="' + (w - 2).toFixed(1) + '" height="' + bandH
      + '" rx="5" fill="' + fill + '" opacity="0.5"/>';
    if (w > 34) {
      svg += '<text x="' + (x + w / 2 - 1).toFixed(1) + '" y="' + (bandY + 17) + '" text-anchor="middle" font-size="10" fill="#f0e9d8">'
        + def.sym + ' ' + esc(def.zh.replace('座', '')) + '</text>';
    }
  });
  svg += '<text x="' + padX + '" y="' + (bandY - 4) + '" font-size="8.5" fill="rgba(240,233,216,.45)">推運月亮走過的星座</text>';

  /* 第二層：年份軸與轉折點 */
  svg += '<line x1="' + padX + '" y1="' + axisY + '" x2="' + (W - padX) + '" y2="' + axisY + '" stroke="rgba(201,169,110,.28)" stroke-width="1"/>';
  rows.forEach(function (r, i) {
    var cx = padX + colW * (i + 0.5);
    var on = expandedYear === r.index;
    var rr = r.isTransition ? 5 : 3.5;
    svg += '<circle cx="' + cx.toFixed(1) + '" cy="' + axisY + '" r="' + (on ? rr + 2 : rr) + '" fill="'
      + (r.isTransition ? '#e6cd9a' : '#1a1622') + '" stroke="' + (on ? '#f0e9d8' : 'rgba(201,169,110,.7)')
      + '" stroke-width="' + (on ? 2 : 1) + '"/>';
  });

  /* 第三層：每年的相位數量長條 */
  rows.forEach(function (r, i) {
    var cnt = (r.aspects || []).length;
    var hgt = Math.max(3, (cnt / maxAspects) * barMaxH);
    var x = padX + colW * (i + 0.5) - 6;
    svg += '<rect x="' + x.toFixed(1) + '" y="' + (barTop + barMaxH - hgt).toFixed(1) + '" width="12" height="' + hgt.toFixed(1)
      + '" rx="2.5" fill="rgba(201,169,110,' + (0.3 + 0.5 * cnt / maxAspects).toFixed(2) + ')"/>';
    svg += '<text x="' + (x + 6).toFixed(1) + '" y="' + (barTop + barMaxH + 11) + '" text-anchor="middle" font-size="8.5" fill="rgba(240,233,216,'
      + (r.isTransition ? '.8' : '.45') + ')">' + r.year + '</text>';
  });
  svg += '<text x="' + padX + '" y="' + (barTop - 3) + '" font-size="8.5" fill="rgba(240,233,216,.45)">每年被觸發的相位數</text>';
  svg += '</svg>';

  var h = '<div style="margin-top:14px">' + svg;
  h += '<div style="display:flex;gap:14px;justify-content:center;margin-top:4px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);flex-wrap:wrap">'
    + '<span style="display:inline-flex;align-items:center;gap:5px"><span aria-hidden="true" style="width:9px;height:9px;border-radius:50%;background:#e6cd9a;display:inline-block"></span>有轉折</span>'
    + '<span style="display:inline-flex;align-items:center;gap:5px"><span aria-hidden="true" style="width:8px;height:8px;border-radius:50%;border:1px solid rgba(201,169,110,.7);display:inline-block"></span>相對平穩</span>'
    + '<span>色帶＝推運月亮的星座（依元素著色）</span></div>';
  if (marks.length) {
    h += '<div style="text-align:center;margin-top:7px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);line-height:1.7">'
      + '這段期間比較關鍵的是 <strong style="color:#e6cd9a">' + esc(marks.join('、')) + '</strong> 年，可以先看這幾段。</div>';
  }
  h += '</div>';
  return h;
}

/* ============================================================================
   「今天的節奏」——取代原本的幸運八宮格。

   原本那一區（幸運色／配飾／時辰／方位／數字／食物／隨身物／花）有兩個問題：

   1. 每一項都是 astroSeededPickN() 從固定清單亂數挑的，跟使用者的星盤、跟當天的
      行運都沒有任何關係。這跟這個專案在二十八星宿那段程式碼寫下的原則直接衝突：
      「不採用坊間流傳、版本彼此矛盾、找不到單一可靠出處的⋯⋯選擇『說得清楚、
      站得住腳』優先於『看起來很古典』。」幸運食物與幸運隨身物正是那種東西。
   2. 那八項的組合與市面上的競品幾乎一字不差，看起來像抄的。

   改成四項，每一項都能講出是怎麼算出來的：
     · 今日主色    ← 行運月亮所在星座的元素（火／土／風／水各有自己的色系）
     · 適合的節奏  ← 月相（太陽與月亮的角距）落在新月／上弦／滿月／下弦哪一段
     · 今天的焦點  ← 行運月亮落在你本命盤第幾宮，取該宮位對應的生活領域
     · 狀態最好的  ← 已經算好的分類分數中最高的那一項

   同一天、同一張盤，結果必然相同，而且可以回推——這才是可以放進產品裡的東西。
   ============================================================================ */

/* 四元素各自的色系。同一個元素給三個選項，用日期在該元素內挑，
   所以顏色會跟著月亮換星座而變，不是憑空跳號。 */
var MOON_ELEMENT_RHYTHM = {
  火: '想到就做，今天適合先開口、先出手，不用等準備到完美。',
  土: '慢一點但踏實，今天適合處理具體的、看得到成果的事。',
  風: '腦子轉得快，今天適合聊、適合問、適合把事情講清楚。',
  水: '感覺特別敏銳，今天適合處理人的事，也容易被氣氛影響。',
};
/* 月相四階段：用太陽與月亮的角距判斷，這是有明確定義、可驗證的天文量。 */
var MOON_PHASE_STAGES = [
  { max: 45, zh: '起頭期', hint: '適合開始新的事，還不用急著看成果' },
  { max: 135, zh: '推進期', hint: '適合往前推、解決卡住的環節' },
  { max: 225, zh: '收成期', hint: '適合檢視結果、把話講開、做決定' },
  { max: 315, zh: '收尾期', hint: '適合結束、整理、放掉不需要的' },
  { max: 361, zh: '起頭期', hint: '適合開始新的事，還不用急著看成果' },
];
function moonPhaseStage(sunLon, moonLon) {
  var d = astroNormDeg(moonLon - sunLon);
  for (var i = 0; i < MOON_PHASE_STAGES.length; i++) {
    if (d < MOON_PHASE_STAGES[i].max) return MOON_PHASE_STAGES[i];
  }
  return MOON_PHASE_STAGES[0];
}
/* 用本命盤的宮首算出某個黃經落在第幾宮。computeNatalChart 內部那個 houseOf 是
   閉包，外面拿不到，所以這裡依同樣規則重算一次。 */
function houseOfLongitude(chart, lon) {
  if (!chart || !chart.houseCusps) return 0;
  for (var i = 0; i < 12; i++) {
    var start = chart.houseCusps[i], end = chart.houseCusps[(i + 1) % 12];
    var arc = astroNormDeg(end - start); if (arc === 0) arc = 360;
    if (astroNormDeg(lon - start) < arc) return i + 1;
  }
  return 12;
}

function renderRhythmCell(iconHtml, value, label) {
  return '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 4px">' + iconHtml
    + '<div style="font:600 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;text-align:center;line-height:1.35">' + esc(value) + '</div>'
    + '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">' + esc(label) + '</div></div>';
}

function renderDailyRhythm(chart, transitPlanets, scores, unknownTime, selectedDate) {
  if (!chart || !transitPlanets || typeof ZODIAC_SIGNS === 'undefined') return '';
  var moonLon = transitPlanets.Moon, sunLon = transitPlanets.Sun;
  if (typeof moonLon !== 'number' || typeof sunLon !== 'number') return '';
  var moonSignIdx = Math.floor(astroNormDeg(moonLon) / 30);
  var moonSign = ZODIAC_SIGNS[moonSignIdx];
  var elem = moonSign.elem;
  var stage = moonPhaseStage(sunLon, moonLon);

  /* 顏色一律交給下面的行星日那一組。這裡本來也有一個「今日主色」（取自月亮星座的
     元素），但兩個顏色依據不同、同時出現只會讓人以為系統自相矛盾。 */
  var cells = [
    renderRhythmCell('<div style="font-size:19px">' + esc(moonSign.sym) + '</div>', moonSign.zh, '月亮在'),
    renderRhythmCell('<div style="font-size:19px">◑</div>', stage.zh, '月相階段'),
  ];
  /* 出生時間未知就沒有可信的宮位，這一格改放「狀態最好的一項」而不是硬掰 */
  if (!unknownTime) {
    var house = houseOfLongitude(chart, moonLon);
    var area = (typeof HOUSE_BEGINNER !== 'undefined' && HOUSE_BEGINNER[house - 1])
      ? HOUSE_BEGINNER[house - 1].lifeArea : '';
    cells.push(renderRhythmCell('<div style="font-size:19px">◎</div>', area || ('第 ' + house + ' 宮'), '今天的焦點'));
  } else if (scores) {
    var best = Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; })[0];
    var bestDef = (typeof HOROSCOPE_SCORE_CATS !== 'undefined')
      ? HOROSCOPE_SCORE_CATS.filter(function (x) { return x.key === best; })[0] : null;
    cells.push(renderRhythmCell('<div style="font-size:19px">◎</div>', bestDef ? bestDef.zh : '—', '狀態最好的'));
  }

  var h = '<div style="margin-top:22px">';
  h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-align:center">今天的節奏</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(' + cells.length + ',1fr);border-top:1px solid rgba(201,169,110,.15);margin-top:8px">';
  cells.forEach(function (cellHtml) { h += cellHtml; });
  h += '</div>';
  h += '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.8;margin-top:8px;padding:0 2px">'
    + esc(MOON_ELEMENT_RHYTHM[elem] || '') + esc(stage.hint) + '。</div>';
  /* 每一項都說得出是怎麼算的——這一區以前是亂數挑的，現在要讓人可以驗證 */
  h += '<details style="margin-top:8px"><summary style="font:500 10.5px \'Noto Sans TC\',sans-serif;color:#c9a96e;cursor:pointer">這幾項是怎麼算出來的？</summary>'
    + '<div style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);line-height:1.85;margin-top:6px">'
    + '上面那句相處節奏來自月亮所在星座的元素（' + esc(moonSign.zh) + '屬' + esc(elem) + '）；'
    + '月相階段是太陽與月亮的角距（目前 ' + Math.round(astroNormDeg(moonLon - sunLon)) + '°）；'
    + (unknownTime ? '出生時間未知時不顯示宮位焦點，改列分數最高的類別。' : '焦點是今天月亮走到你本命盤的第 ' + houseOfLongitude(chart, moonLon) + ' 宮。')
    + '這裡沒有任何一項是隨機挑的。</div></details>';
  h += '</div>';
  /* 幸運色／數字／時段掛在「今天由哪顆行星主管」這個古典依據上，跟上面月亮那三項
     是兩套不同的推導，所以分成兩區塊、各自說明來源。 */
  if (typeof renderPlanetaryDayRow === 'function') {
    var rhythmDate = selectedDate instanceof Date && !isNaN(selectedDate.getTime())
      ? selectedDate : new Date();
    h += renderPlanetaryDayRow(rhythmDate, (typeof state !== 'undefined') ? (state.astroCityUsed || null) : null);
  }
  return h;
}

/* 週／月／年沒有「今天月亮在哪」可用（月亮一週就走完半圈），
   改用該期間已經算好的分數：最高與最低的兩個類別，以及整體分數帶。 */
var PERIOD_TONE_BANDS = [
  { min: 72, zh: '順風段', hint: '整體支持度不錯，適合主動推進手上的事' },
  { min: 55, zh: '平穩段', hint: '沒有特別的推力也沒有明顯阻力，照原本節奏走' },
  { min: 0, zh: '逆風段', hint: '阻力比較明顯，先守住既有的，不急著擴張' },
];
function renderPeriodTone(overall, scores, periodLabel) {
  if (!scores || typeof HOROSCOPE_SCORE_CATS === 'undefined') return '';
  var keys = Object.keys(scores);
  if (!keys.length) return '';
  var sorted = keys.slice().sort(function (a, b) { return scores[b] - scores[a]; });
  var topKey = sorted[0], lowKey = sorted[sorted.length - 1];
  function zhOf(k) {
    var d = HOROSCOPE_SCORE_CATS.filter(function (x) { return x.key === k; })[0];
    return d ? d.zh : k;
  }
  var band = PERIOD_TONE_BANDS.filter(function (b) { return overall >= b.min; })[0] || PERIOD_TONE_BANDS[2];
  /* 上方的分類長條是 linear-gradient(180deg, col[0], col[1])，這裡如果只填 col[0]
     或再加 opacity，同一個分類在同一頁會呈現兩種色調，反而讓人以為是不同東西。
     所以用完全相同的漸層，「相對平淡」改用虛線外框表示，不動顏色本身。 */
  function catFill(k, fallback) {
    var col = (typeof CATEGORY_COLOR !== 'undefined') ? CATEGORY_COLOR[k] : null;
    return col ? ('linear-gradient(180deg,' + col[0] + ',' + col[1] + ')') : fallback;
  }
  var topFill = catFill(topKey, '#e6cd9a');
  var lowFill = catFill(lowKey, '#8a8fa3');

  var cells = [
    renderRhythmCell('<div style="width:22px;height:22px;border-radius:6px;background:' + topFill + ';border:1px solid rgba(255,255,255,.25)"></div>',
      zhOf(topKey) + ' ' + scores[topKey], '最被強化'),
    renderRhythmCell('<div style="width:22px;height:22px;border-radius:6px;background:' + lowFill + ';border:1px dashed rgba(255,255,255,.45)"></div>',
      zhOf(lowKey) + ' ' + scores[lowKey], '相對平淡'),
    renderRhythmCell('<div style="font-size:19px">≈</div>', band.zh, '整體節奏'),
  ];
  var h = '<div style="margin-top:22px">';
  h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-align:center">' + esc(periodLabel || '這段期間的節奏') + '</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid rgba(201,169,110,.15);margin-top:8px">';
  cells.forEach(function (cellHtml) { h += cellHtml; });
  h += '</div>';
  h += '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.8;margin-top:8px;padding:0 2px">' + esc(band.hint) + '。</div>';
  h += '</div>';
  return h;
}

/* ============================================================================
   幸運色／幸運數字／幸運時段——用古典的「行星日」與「行星時」推導。

   這三項使用者想留下來，但不能再用亂數挑。改成全部掛在同一個依據上：
   今天由哪顆行星主管。

   · 行星日：星期天到星期六依序由日、月、火、水、木、金、土主管。這是行星日
     的來源，英文與拉丁語系的星期名稱就是這樣來的（Sunday/Monday/mardi/
     mercredi…），有明確且單一的出處。
   · 行星時：日出到日落等分為十二段、日落到隔天日出再十二段，從當日主星起，
     依迦勒底次序（土、木、火、日、金、水、月）輪流主管。日出日落由
     Astronomy Engine 依實際經緯度計算，不是查表。
   · 顏色與數字：沿用行星既有的傳統對應，不自創。

   所以「今天由水星主管，幸運色橙黃、幸運數字 5、幸運時段 05:19–06:26 與
   13:06–14:13」這句話的每一個部分都能回推，而且換一天、換一個城市就會不同。
   ============================================================================ */
var PLANETARY_DAY_RULERS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']; // 週日→週六
var CHALDEAN_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
var PLANET_RULER_INFO = {
  Sun:     { zh: '太陽', sym: '☉', color: { zh: '金黃', hex: '#e0b04a' }, num: 1, tone: '適合站到台前、把事情做個決定' },
  Moon:    { zh: '月亮', sym: '☽', color: { zh: '銀白', hex: '#d8dde4' }, num: 2, tone: '適合處理感受、照顧自己與家人' },
  Mars:    { zh: '火星', sym: '♂', color: { zh: '赤紅', hex: '#c0503f' }, num: 9, tone: '適合出手、把拖著的事推動' },
  Mercury: { zh: '水星', sym: '☿', color: { zh: '橙黃', hex: '#d99b5f' }, num: 5, tone: '適合溝通、寫東西、談條件' },
  Jupiter: { zh: '木星', sym: '♃', color: { zh: '靛藍', hex: '#5b6fa8' }, num: 3, tone: '適合擴展、學習、談長遠的事' },
  Venus:   { zh: '金星', sym: '♀', color: { zh: '青綠', hex: '#6fa88b' }, num: 6, tone: '適合經營關係、處理美感與金錢' },
  Saturn:  { zh: '土星', sym: '♄', color: { zh: '深褐', hex: '#6b5b4a' }, num: 8, tone: '適合收尾、整理、面對現實條件' },
};

/* 回傳當日該主星主管的白天時段（可能一到兩段）。
   算不出日出日落（極區永晝永夜、或引擎不可用）時回傳空陣列，呼叫端就不顯示，
   不用假資料填充。 */
function planetaryHoursForRuler(date, lat, lon, tz, rulerKey) {
  if (typeof Astronomy === 'undefined' || !Astronomy.SearchRiseSet) return [];
  try {
    var observer = new Astronomy.Observer(lat, lon, 0);
    /* 從當地當天 00:00 起算，否則 SearchRiseSet 會抓到隔天的日出、
       配上今天的日落，得出負的白天長度。 */
    var localMidnight = zonedTimeToUtc(date.getFullYear(), date.getMonth() + 1, date.getDate(), 0, 0, 0, tz);
    var rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, Astronomy.MakeTime(localMidnight), 2);
    if (!rise) return [];
    var set = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, Astronomy.MakeTime(rise.date), 2);
    if (!set) return [];
    var span = set.date.getTime() - rise.date.getTime();
    if (span <= 0) return [];
    var hourMs = span / 12;
    var startIdx = CHALDEAN_ORDER.indexOf(rulerKey);
    if (startIdx < 0) return [];
    var fmt = new Intl.DateTimeFormat('zh-TW', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
    var out = [];
    for (var i = 0; i < 12; i++) {
      if (CHALDEAN_ORDER[(startIdx + i) % 7] !== rulerKey) continue;
      out.push(fmt.format(new Date(rise.date.getTime() + i * hourMs))
        + '–' + fmt.format(new Date(rise.date.getTime() + (i + 1) * hourMs)));
    }
    return out;
  } catch (e) { return []; }
}

function renderPlanetaryDayRow(date, city) {
  var rulerKey = PLANETARY_DAY_RULERS[date.getDay()];
  var info = PLANET_RULER_INFO[rulerKey];
  if (!info) return '';
  var hours = city ? planetaryHoursForRuler(date, city.lat, city.lon, city.tz, rulerKey) : [];

  var cells = [
    renderRhythmCell('<div style="font-size:19px;color:#c9a96e">' + esc(info.sym) + '</div>', info.zh, '今日主星'),
    renderRhythmCell('<div style="width:22px;height:22px;border-radius:50%;background:' + info.color.hex
      + ';border:1px solid rgba(255,255,255,.3)"></div>', info.color.zh, '幸運色'),
    renderRhythmCell('<div style="font-size:17px;color:rgba(240,233,216,.5)">#</div>', String(info.num), '幸運數字'),
  ];
  /* 極區的永晝永夜算不出日出日落，這一格就不顯示，不用「全天」之類的話矇混 */
  if (hours.length) {
    cells.push(renderRhythmCell('<div style="font-size:17px">◷</div>', hours.join('　'), '幸運時段'));
  }

  var h = '<div style="margin-top:18px">';
  h += '<div style="display:grid;grid-template-columns:repeat(' + cells.length + ',1fr);border-top:1px solid rgba(201,169,110,.15)">';
  cells.forEach(function (cellHtml) { h += cellHtml; });
  h += '</div>';
  h += '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.8;margin-top:8px;padding:0 2px">'
    + '今天是' + esc(info.zh) + '日，' + esc(info.tone) + '。</div>';
  h += '<details style="margin-top:6px"><summary style="font:500 10.5px \'Noto Sans TC\',sans-serif;color:#c9a96e;cursor:pointer">這三項是怎麼算出來的？</summary>'
    + '<div style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);line-height:1.85;margin-top:6px">'
    + '星期天到星期六依序由日、月、火、水、木、金、土主管，這也是英文星期名稱的由來；今天是'
    + esc(info.zh) + '日，顏色與數字沿用這顆行星的傳統對應。'
    + (hours.length
        ? '幸運時段是「行星時」：把日出到日落等分成十二段，從當日主星起依迦勒底次序輪流，'
          + esc(info.zh) + '主管的就是上面那幾段——日出日落是用你出生地的經緯度實際算出來的，換城市會不一樣。'
        : '你所在的緯度今天算不出日出或日落，所以不顯示時段。')
    + '</div></details>';
  h += '</div>';
  return h;
}

/* ---------- 某一年的推運相位組成 ----------
   展開一張年卡時，原本會一次列出六組相位，每組都是「標題＋長解釋＋建議」三段。
   實測那一張卡就佔掉整頁六成的字，讀完才知道這一年是偏順還是偏卡。

   先用一條堆疊長條把組成講完（幾組加分、幾組磨合、幾組融合），再列出參與的行星，
   下面才放三組最緊密的細講；其餘的維持在原本的摺疊區裡，資訊沒有少。 */
var PROG_ASPECT_GROUPS = [
  { key: 'ease', zh: '順勢', color: '#9bc5a3', types: ['trine', 'sextile'] },
  { key: 'merge', zh: '融合', color: '#e6cd9a', types: ['conjunction'] },
  { key: 'friction', zh: '磨合', color: '#d9a0a0', types: ['square', 'opposition'] },
];
function renderProgressionYearAspects(row) {
  var aspects = (row && row.aspects) || [];
  if (aspects.length < 2 || typeof PLANET_DEFS === 'undefined') return '';
  var counts = {}, total = 0;
  PROG_ASPECT_GROUPS.forEach(function (g) {
    counts[g.key] = aspects.filter(function (a) { return g.types.indexOf(a.type) !== -1; }).length;
    total += counts[g.key];
  });
  if (!total) return '';

  /* 參與最多次的行星——哪幾顆星今年被反覆點名，比逐條讀相位更快看出重點 */
  var tally = {};
  aspects.forEach(function (a) {
    [a.aKey, a.bKey].forEach(function (k) { if (k) tally[k] = (tally[k] || 0) + 1; });
  });
  var top = Object.keys(tally).sort(function (x, y) { return tally[y] - tally[x]; }).slice(0, 4);

  var desc = row.year + ' 年共 ' + aspects.length + ' 組緊密相位：'
    + PROG_ASPECT_GROUPS.map(function (g) { return g.zh + ' ' + counts[g.key] + ' 組'; }).join('、')
    + '。被點名最多次的是 ' + top.map(function (k) {
        var d = PLANET_DEFS.filter(function (x) { return x.key === k; })[0];
        return (d ? d.zh : k) + ' ' + tally[k] + ' 次';
      }).join('、') + '。';

  var h = '<div role="img" aria-label="' + esc(desc) + '" style="margin-top:10px">';
  h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-bottom:5px">這一年的 ' + aspects.length + ' 組相位怎麼組成</div>';
  h += '<div aria-hidden="true" style="display:flex;height:9px;border-radius:5px;overflow:hidden;background:rgba(255,255,255,.05)">';
  PROG_ASPECT_GROUPS.forEach(function (g) {
    if (!counts[g.key]) return;
    h += '<div style="width:' + (counts[g.key] / total * 100).toFixed(1) + '%;background:' + g.color + ';opacity:.85"></div>';
  });
  h += '</div>';
  h += '<div aria-hidden="true" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px">';
  PROG_ASPECT_GROUPS.forEach(function (g) {
    if (!counts[g.key]) return;
    h += '<span style="display:inline-flex;align-items:center;gap:4px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6)">'
      + '<span style="width:8px;height:8px;border-radius:2px;background:' + g.color + ';display:inline-block"></span>'
      + esc(g.zh) + ' ' + counts[g.key] + '</span>';
  });
  h += '</div>';
  h += '<div aria-hidden="true" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:7px">';
  top.forEach(function (k) {
    var d = PLANET_DEFS.filter(function (x) { return x.key === k; })[0];
    if (!d) return;
    h += '<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:#c9a96e;border:1px solid rgba(201,169,110,.3);border-radius:11px;padding:3px 8px">'
      + esc(d.sym + ' ' + d.zh) + ' ×' + tally[k] + '</span>';
  });
  h += '</div></div>';
  return h;
}

/* ---------- 未來十二個月的推運月亮 ----------
   原本這一區是十二張並排的小卡，每張都有月份、推運月亮星座、以及當月最緊密的相位。
   但推運月亮走完一個星座要 2～3 年，所以十二個月裡最多只會換一次座——十二張卡有
   十一張在講同一件事，難怪讀起來很累（實測這一區就佔了「1 年」頁面的 65%）。

   改成一條十二格的帶子：顏色是推運月亮的星座（依元素），換座的地方直接標出來。
   下面只列真正不一樣的月份，重複的不再各寫一次。 */
function renderProgressionMonthStrip(months) {
  if (!months || months.length < 2 || typeof ZODIAC_SIGNS === 'undefined') return '';
  var W = 300, padX = 14, y = 18, barH = 24;
  var colW = (W - padX * 2) / months.length;

  var segs = [];
  months.forEach(function (m, i) {
    var last = segs[segs.length - 1];
    if (last && last.sign === m.sign) last.end = i; else segs.push({ sign: m.sign, start: i, end: i });
  });
  var shiftAt = months.map(function (m, i) { return m.moonShift ? i : -1; }).filter(function (i) { return i >= 0; });

  var desc = '未來十二個月的推運月亮：'
    + segs.map(function (sg) {
        var a = months[sg.start].label, b = months[sg.end].label;
        return ZODIAC_SIGNS[sg.sign].zh + '（' + (a === b ? a : a + ' 到 ' + b) + '）';
      }).join('，接著是 ')
    + '。' + (shiftAt.length
        ? shiftAt.map(function (i) { return months[i].label; }).join('、') + ' 會換座，內在需求在那時轉換。'
        : '這十二個月都在同一個星座，內在需求維持同一個主軸。');

  var svg = '<svg role="img" aria-labelledby="prog-mo-title prog-mo-desc" viewBox="0 0 ' + W + ' 62" width="100%" style="max-width:340px;display:block;margin:0 auto">';
  svg += '<title id="prog-mo-title">未來十二個月的推運月亮</title><desc id="prog-mo-desc">' + esc(desc) + '</desc>';
  segs.forEach(function (sg) {
    var x = padX + colW * sg.start, w = colW * (sg.end - sg.start + 1);
    var def = ZODIAC_SIGNS[sg.sign];
    svg += '<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + (w - 2).toFixed(1) + '" height="' + barH
      + '" rx="5" fill="' + (PROG_ELEMENT_FILL[def.elem] || '#8c7a55') + '" opacity="0.5"/>';
    if (w > 40) {
      svg += '<text x="' + (x + w / 2 - 1).toFixed(1) + '" y="' + (y + 16) + '" text-anchor="middle" font-size="10" fill="#f0e9d8">'
        + def.sym + ' ' + esc(def.zh.replace('座', '')) + '</text>';
    }
  });
  /* 換座的位置畫一條垂直線，這是這一區唯一真正的轉折 */
  shiftAt.forEach(function (i) {
    var x = padX + colW * (i + 1);
    svg += '<line x1="' + x.toFixed(1) + '" y1="' + (y - 4) + '" x2="' + x.toFixed(1) + '" y2="' + (y + barH + 4)
      + '" stroke="#e6cd9a" stroke-width="1.6"/>';
  });
  months.forEach(function (m, i) {
    if (i % 2 !== 0 && months.length > 8) return; // 標籤太密就隔一個標一次
    svg += '<text x="' + (padX + colW * (i + 0.5)).toFixed(1) + '" y="' + (y + barH + 16)
      + '" text-anchor="middle" font-size="8" fill="rgba(240,233,216,.45)">' + esc(m.label) + '</text>';
  });
  svg += '</svg>';

  var h = '<div style="margin-top:12px">' + svg;
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.65);line-height:1.8;margin-top:6px">'
    + (shiftAt.length
        ? '推運月亮會在 <strong style="color:#e6cd9a">' + esc(shiftAt.map(function (i) { return months[i].label; }).join('、'))
          + '</strong> 換座，那前後是這一年內在需求最明顯的轉折點。'
        : '這十二個月推運月亮都在同一個星座，內在需求維持同一個主軸，不會有明顯的階段切換。')
    + '</div></div>';
  return h;
}
