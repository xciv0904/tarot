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
  h += '<div style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);text-align:center;margin-top:4px;line-height:1.6">點任何一條，下方只顯示跟它有關的解讀</div>';
  h += '<div style="margin-top:12px;display:flex;flex-direction:column;gap:9px">';

  rows.forEach(function (r) {
    var on = activeFacet === r.key;
    if (r.score === null) {
      h += '<div style="opacity:.45"><div style="display:flex;justify-content:space-between;align-items:baseline">'
        + '<span style="font:500 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.7)">' + esc(r.zh) + '</span>'
        + '<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45)">沒有明顯訊號</span></div>'
        + '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-top:2px">' + esc(r.hint) + '</div></div>';
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
    h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.42);margin-top:4px">' + esc(r.hint) + '</div>';
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
  h += '<div style="display:flex;gap:14px;justify-content:center;margin-top:6px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45)">'
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
    h += '<div style="margin-left:42px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35)">' + esc(hints[k]) + '</div>';
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

/* ---------- 二次推運時間軸 ----------
   推運畫面原本是 4,089 字、零個視覺元素：每一年一張文字卡，要一路讀下去才知道
   「哪一年比較關鍵」。但 buildProgressionYears() 早就標好了 isTransition
   （推運月亮或太陽換星座、或有緊密相位），只是沒有畫出來。

   這條時間軸把整段期間壓成一行：金色實心點＝有轉折的年份，空心點＝相對平穩，
   點下去會展開該年的詳細內容。先看到「哪幾年要注意」，再決定要讀哪一段。 */
function renderProgressionTimeline(rows, expandedYear) {
  if (!rows || rows.length < 2) return '';
  var n = rows.length;
  var W = 300, H = 74, padX = 18, y = 34;
  var step = (W - padX * 2) / Math.max(1, n - 1);
  var marks = rows.filter(function (r) { return r.isTransition; }).map(function (r) { return r.year; });
  var desc = '從 ' + rows[0].year + ' 年到 ' + rows[n - 1].year + ' 年的推運時間軸，共 ' + n + ' 年。'
    + (marks.length ? '其中 ' + marks.join('、') + ' 年有明顯轉折（推運月亮或太陽換星座，或出現緊密相位）。' : '這段期間沒有特別明顯的轉折年。');

  var svg = '<svg role="img" aria-labelledby="prog-tl-title prog-tl-desc" viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:340px;display:block;margin:0 auto">';
  svg += '<title id="prog-tl-title">推運轉折時間軸</title><desc id="prog-tl-desc">' + esc(desc) + '</desc>';
  svg += '<line x1="' + padX + '" y1="' + y + '" x2="' + (W - padX) + '" y2="' + y + '" stroke="rgba(201,169,110,.3)" stroke-width="1"/>';
  rows.forEach(function (r, i) {
    var x = padX + step * i;
    var on = expandedYear === r.index;
    var r0 = r.isTransition ? 6 : 4;
    svg += '<circle cx="' + x.toFixed(1) + '" cy="' + y + '" r="' + (on ? r0 + 2.5 : r0) + '"'
      + ' fill="' + (r.isTransition ? '#e6cd9a' : '#1a1622') + '"'
      + ' stroke="' + (on ? '#f0e9d8' : 'rgba(201,169,110,.7)') + '" stroke-width="' + (on ? 2 : 1) + '"/>';
    /* 年份標籤太密會疊在一起，超過 6 年就只標首尾與轉折年 */
    var showLabel = n <= 6 || i === 0 || i === n - 1 || r.isTransition;
    if (showLabel) {
      svg += '<text x="' + x.toFixed(1) + '" y="' + (y + 21) + '" text-anchor="middle" font-size="9" fill="rgba(240,233,216,'
        + (r.isTransition ? '.8' : '.45') + ')">' + r.year + '</text>';
    }
  });
  svg += '</svg>';

  var h = '<div style="margin-top:14px">' + svg;
  h += '<div style="display:flex;gap:14px;justify-content:center;margin-top:2px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">'
    + '<span style="display:inline-flex;align-items:center;gap:5px"><span aria-hidden="true" style="width:9px;height:9px;border-radius:50%;background:#e6cd9a;display:inline-block"></span>有轉折</span>'
    + '<span style="display:inline-flex;align-items:center;gap:5px"><span aria-hidden="true" style="width:8px;height:8px;border-radius:50%;border:1px solid rgba(201,169,110,.7);display:inline-block"></span>相對平穩</span></div>';
  if (marks.length) {
    h += '<div style="text-align:center;margin-top:7px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);line-height:1.7">'
      + '這段期間比較關鍵的是 <strong style="color:#e6cd9a">' + esc(marks.join('、')) + '</strong> 年，可以先看這幾段。</div>';
  }
  h += '</div>';
  return h;
}
