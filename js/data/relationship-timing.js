/* Relationship Timing Engine V2
 *
 * Pure deterministic layer: transits -> individual natal activations -> shared
 * activations -> relationship phases.  This file intentionally knows nothing
 * about DOM or copy-to-AI; renderers must consume its dated evidence as-is.
 */
(function (root) {
  'use strict';

  var DAY_MS = 86400000;
  var SCHEMA_VERSION = 2;
  var CONFIDENCE_ORDER = { UNAVAILABLE:0, LOW:1, MEDIUM:2, HIGH:3 };
  var ASPECTS = [
    { key:'conjunction', angle:0, weight:1.00 },
    { key:'sextile', angle:60, weight:0.68 },
    { key:'square', angle:90, weight:0.90 },
    { key:'trine', angle:120, weight:0.80 },
    { key:'opposition', angle:180, weight:0.95 },
  ];

  /* Angular orbs and sampling cadence are planet-specific. Fast bodies refine
     timing; medium/slow bodies are allowed to anchor a relationship phase. */
  var TRANSITS = {
    Moon:    { speed:'fast',   weight:0.34, orb:1.20, stepHours:6,  sharedDays:3 },
    Mercury: { speed:'fast',   weight:0.48, orb:1.50, stepHours:24, sharedDays:6 },
    Venus:   { speed:'fast',   weight:0.62, orb:1.80, stepHours:24, sharedDays:8 },
    Mars:    { speed:'fast',   weight:0.68, orb:1.80, stepHours:24, sharedDays:9 },
    Jupiter: { speed:'medium', weight:0.90, orb:2.20, stepHours:48, sharedDays:24 },
    Saturn:  { speed:'medium', weight:1.00, orb:2.00, stepHours:48, sharedDays:28 },
    Uranus:  { speed:'slow',   weight:0.96, orb:1.60, stepHours:48, sharedDays:35 },
    Neptune: { speed:'slow',   weight:0.90, orb:1.50, stepHours:48, sharedDays:38 },
    Pluto:   { speed:'slow',   weight:1.00, orb:1.40, stepHours:48, sharedDays:42 },
  };

  /* Relationship-sensitive points are a weighted knowledge map. Categories
     overlap by design: e.g. Venus may support attraction, connection and
     commitment, while the transit/aspect context chooses the dominant theme. */
  var TARGETS = {
    Sun:     { weight:0.88, themes:{ attraction:.70,connection:.66,communication:.38,commitment:.58,definition:.74,expansion:.52 } },
    Moon:    { weight:1.00, themes:{ connection:.82,emotional_closeness:1,communication:.42,commitment:.55,pressure:.34,intensity:.52,healing:.48 } },
    Mercury: { weight:0.82, themes:{ communication:1,connection:.38,definition:.56,confusion:.30 } },
    Venus:   { weight:1.00, themes:{ attraction:1,connection:.86,emotional_closeness:.72,commitment:.70,intensity:.45,expansion:.62 } },
    Mars:    { weight:0.90, themes:{ attraction:.82,communication:.28,pressure:.50,distance:.26,change:.42,intensity:.88 } },
    Jupiter: { weight:0.68, themes:{ connection:.42,commitment:.40,definition:.34,expansion:1,healing:.46 } },
    Saturn:  { weight:0.92, themes:{ commitment:1,definition:.92,pressure:.88,distance:.58,change:.48 } },
    Uranus:  { weight:0.82, themes:{ distance:.62,change:1,intensity:.45,definition:.42 } },
    Neptune: { weight:0.74, themes:{ connection:.45,emotional_closeness:.46,healing:.62,idealization:1,confusion:.90 } },
    Pluto:   { weight:0.90, themes:{ connection:.32,pressure:.58,change:.82,intensity:1,healing:.42 } },
  };

  var TRANSIT_THEMES = {
    Moon:{ emotional_closeness:.95,connection:.72,communication:.36 },
    Mercury:{ communication:1,definition:.52,confusion:.24 },
    Venus:{ attraction:1,connection:.86,emotional_closeness:.72,healing:.42 },
    Mars:{ attraction:.72,pressure:.70,intensity:.82,change:.38 },
    Jupiter:{ expansion:1,connection:.58,commitment:.54,healing:.48 },
    Saturn:{ commitment:1,definition:.92,pressure:.88,distance:.58 },
    Uranus:{ change:1,distance:.76,definition:.50,intensity:.46 },
    Neptune:{ idealization:1,confusion:.92,emotional_closeness:.52,healing:.48 },
    Pluto:{ intensity:1,change:.92,pressure:.72,healing:.45 },
  };

  var THEME_LABELS = {
    attraction:'吸引與靠近', connection:'關係連結', communication:'溝通與理解',
    emotional_closeness:'情緒靠近', commitment:'承諾與投入', definition:'關係定位',
    pressure:'現實壓力', distance:'距離與自由', change:'關係改變', intensity:'互動強度',
    healing:'修復與重新理解', idealization:'期待與理想化', confusion:'模糊與誤讀', expansion:'共同發展',
  };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function norm360(v) { v %= 360; return v < 0 ? v + 360 : v; }
  function angleDiff(a, b) { var d = Math.abs(norm360(a) - norm360(b)); return d > 180 ? 360 - d : d; }
  function aspectError(transitLon, natalLon, aspectAngle) { return Math.abs(angleDiff(transitLon, natalLon) - aspectAngle); }
  function dateIso(d) { return new Date(d).toISOString().slice(0, 10); }
  function dateTimeIso(d) { return new Date(d).toISOString(); }
  function addDays(d, days) { return new Date(d.getTime() + days * DAY_MS); }
  function dateKey(d) { return dateIso(d).replace(/-/g, ''); }
  function minConfidence(a, b) { return CONFIDENCE_ORDER[a] <= CONFIDENCE_ORDER[b] ? a : b; }
  function bodyLongitude(planet, date) {
    if (typeof root.astroEclipticLon !== 'function' || !root.Astronomy) throw new Error('RelationshipTiming requires Astronomy Engine and astroEclipticLon');
    return root.astroEclipticLon(planet, root.Astronomy.MakeTime(date));
  }
  function signedDailyMotion(planet, date) {
    var before = bodyLongitude(planet, addDays(date, -.5));
    var after = bodyLongitude(planet, addDays(date, .5));
    var delta = norm360(after - before);
    return delta > 180 ? delta - 360 : delta;
  }

  function themeScores(transitPlanet, natalPoint, aspectKey) {
    var out = {}, target = TARGETS[natalPoint], transit = TRANSIT_THEMES[transitPlanet] || {};
    Object.keys(THEME_LABELS).forEach(function (key) {
      var a = target && target.themes[key] || 0;
      var b = transit[key] || 0;
      if (a || b) out[key] = .62 * a + .38 * b;
    });
    var hard = aspectKey === 'square' || aspectKey === 'opposition';
    if (hard) {
      if (out.pressure) out.pressure *= 1.18;
      if (out.confusion) out.confusion *= 1.12;
      if (out.distance) out.distance *= 1.10;
    } else {
      if (out.connection) out.connection *= 1.08;
      if (out.healing) out.healing *= 1.08;
    }
    return out;
  }
  function rankedThemes(scores) {
    return Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; }).slice(0, 3);
  }

  function synastryActivation(person, natalPoint, aspects) {
    var evidence = [], maxWeight = 0;
    (aspects || []).forEach(function (asp) {
      var matches = (person === 'A' && asp.aKey === natalPoint) || (person === 'B' && asp.bKey === natalPoint);
      if (!matches) return;
      var aspectCfg = ASPECTS.filter(function (a) { return a.key === asp.type; })[0];
      var orbLimit = (root.CROSS_ASPECT_ORB && root.CROSS_ASPECT_ORB[asp.type]) || 7;
      var exactness = clamp(1 - asp.orb / orbLimit, 0, 1);
      var weight = (aspectCfg ? aspectCfg.weight : .7) * (.55 + .45 * exactness);
      if (['Sun','Moon','Venus','Mars','Saturn'].indexOf(asp.aKey) >= 0) weight *= 1.08;
      if (['Sun','Moon','Venus','Mars','Saturn'].indexOf(asp.bKey) >= 0) weight *= 1.08;
      evidence.push({ aKey:asp.aKey, bKey:asp.bKey, type:asp.type, orb:asp.orb, weight:+weight.toFixed(4) });
      maxWeight = Math.max(maxWeight, weight);
    });
    evidence.sort(function (a, b) { return b.weight - a.weight; });
    return { multiplier:1 + Math.min(.35, maxWeight * .28), evidence:evidence.slice(0, 4) };
  }

  /* Centralized formula. exactOrb is the minimum sampled/refined separation from
     exact aspect, not the natal cross-aspect orb. */
  function eventStrength(parts) {
    var orbRatio = clamp(parts.exactOrb / parts.orbLimit, 0, 1);
    var orbWeight = .30 + .70 * Math.pow(1 - orbRatio, 2);
    var raw = parts.transitWeight * parts.targetWeight * parts.aspectWeight * orbWeight
      * parts.relationshipContextWeight * (parts.sharedMultiplier || 1);
    return Math.round(clamp(raw / 1.35, 0, 1) * 100);
  }

  function moonRangeForLocalDay(meta) {
    if (!meta || !meta.unknownTime || !meta.y || !meta.m || !meta.d || !meta.tz || typeof root.zonedTimeToUtc !== 'function') {
      return { confidence:'UNAVAILABLE', samples:[] };
    }
    var hours = [0, 6, 12, 18, 23.9833];
    var samples = hours.map(function (hour) {
      var hh = Math.floor(hour), mm = Math.round((hour - hh) * 60);
      var date = root.zonedTimeToUtc(+meta.y, +meta.m, +meta.d, hh, mm, 0, meta.tz);
      return { date:dateTimeIso(date), lon:bodyLongitude('Moon', date) };
    });
    return { confidence:'MEDIUM', samples:samples, startLon:samples[0].lon, endLon:samples[samples.length - 1].lon };
  }

  function moonAspectConfidence(transitLon, aspectAngle, orbLimit, moonRange) {
    if (!moonRange || !moonRange.samples || !moonRange.samples.length) return 'UNAVAILABLE';
    var inside = moonRange.samples.map(function (s) { return aspectError(transitLon, s.lon, aspectAngle) <= orbLimit; });
    if (inside.every(Boolean)) return 'HIGH';
    if (inside.some(Boolean)) return 'LOW';
    return 'UNAVAILABLE';
  }

  function refineMinimum(planet, natalLon, aspectAngle, from, to) {
    var left = from.getTime(), right = to.getTime();
    /* Ten ternary iterations locate the peak well within a calendar day; the
       product displays dates (not exact clock times), and preserves the final
       numeric orb so regression can detect drift. */
    for (var i = 0; i < 10; i++) {
      var m1 = left + (right - left) / 3, m2 = right - (right - left) / 3;
      var e1 = aspectError(bodyLongitude(planet, new Date(m1)), natalLon, aspectAngle);
      var e2 = aspectError(bodyLongitude(planet, new Date(m2)), natalLon, aspectAngle);
      if (e1 <= e2) right = m2; else left = m1;
    }
    var t = (left + right) / 2;
    return { date:new Date(t), orb:aspectError(bodyLongitude(planet, new Date(t)), natalLon, aspectAngle) };
  }

  function refineBoundary(planet, natalLon, aspectAngle, orbLimit, insideDate, outsideDate) {
    var inside = insideDate.getTime(), outside = outsideDate.getTime();
    for (var i = 0; i < 10; i++) {
      var mid = (inside + outside) / 2;
      if (aspectError(bodyLongitude(planet, new Date(mid)), natalLon, aspectAngle) <= orbLimit) inside = mid;
      else outside = mid;
    }
    return new Date((inside + outside) / 2);
  }

  function samplePlanet(planet, start, end, stepHours) {
    var rows = [], stepMs = stepHours * 3600000;
    for (var t = start.getTime(); t <= end.getTime(); t += stepMs) {
      var date = new Date(t);
      rows.push({ date:date, lon:bodyLongitude(planet, date) });
    }
    if (!rows.length || rows[rows.length - 1].date < end) rows.push({ date:new Date(end), lon:bodyLongitude(planet, end) });
    return rows;
  }

  function makeEvent(run, cfg, person, targetKey, natalLon, aspectCfg, syn, moonRange) {
    var first = run.rows[0], last = run.rows[run.rows.length - 1];
    var leftOutside = run.leftOutside || addDays(first.date, -cfg.stepHours / 24);
    var rightOutside = run.rightOutside || addDays(last.date, cfg.stepHours / 24);
    var start = refineBoundary(run.planet, natalLon, aspectCfg.angle, cfg.orb, first.date, leftOutside);
    var end = refineBoundary(run.planet, natalLon, aspectCfg.angle, cfg.orb, last.date, rightOutside);
    var peak = refineMinimum(run.planet, natalLon, aspectCfg.angle, first.date, last.date.getTime() === first.date.getTime() ? rightOutside : last.date);
    var beforeOrb = aspectError(bodyLongitude(run.planet, addDays(peak.date, -.25)), natalLon, aspectCfg.angle);
    var afterOrb = aspectError(bodyLongitude(run.planet, addDays(peak.date, .25)), natalLon, aspectCfg.angle);
    var confidence = 'HIGH', coreEligible = true;
    if (targetKey === 'Moon' && moonRange) {
      confidence = moonAspectConfidence(bodyLongitude(run.planet, peak.date), aspectCfg.angle, cfg.orb, moonRange);
      coreEligible = confidence === 'HIGH';
    }
    var scores = themeScores(run.planet, targetKey, aspectCfg.key), themes = rankedThemes(scores);
    var strength = eventStrength({ transitWeight:cfg.weight, targetWeight:TARGETS[targetKey].weight,
      aspectWeight:aspectCfg.weight, exactOrb:peak.orb, orbLimit:cfg.orb,
      relationshipContextWeight:syn.multiplier, sharedMultiplier:1 });
    var retrograde = signedDailyMotion(run.planet, peak.date) < 0;
    return {
      id:'rt-' + person + '-' + run.planet + '-' + targetKey + '-' + aspectCfg.key + '-' + dateKey(peak.date),
      startDate:dateTimeIso(start), peakDate:dateTimeIso(peak.date), endDate:dateTimeIso(end),
      transitPlanet:run.planet, natalPerson:person, natalPoint:targetKey, aspect:aspectCfg.key,
      exactOrb:+peak.orb.toFixed(5), applying:beforeOrb > peak.orb, separating:afterOrb > peak.orb,
      retrograde:retrograde, speedClass:cfg.speed, category:themes[0], themes:themes,
      themeScores:scores, strength:strength, relationshipRelevance:+syn.multiplier.toFixed(4),
      cycleId:null, confidence:confidence, coreEligible:coreEligible,
      evidence:[{ kind:'transit_to_natal', transitPlanet:run.planet, natalPerson:person,
        natalPoint:targetKey, aspect:aspectCfg.key, exactOrb:+peak.orb.toFixed(5), confidence:confidence }],
      relatedSynastryEvidence:syn.evidence,
    };
  }

  function individualEventsForPlanet(planet, chartA, chartB, metaA, metaB, aspects, start, end) {
    var cfg = TRANSITS[planet], samples = samplePlanet(planet, start, end, cfg.stepHours), events = [];
    [['A', chartA, metaA], ['B', chartB, metaB]].forEach(function (person) {
      var moonRange = person[2] && person[2].unknownTime ? moonRangeForLocalDay(person[2]) : null;
      Object.keys(TARGETS).forEach(function (targetKey) {
        var natal = person[1] && person[1].planets && person[1].planets[targetKey];
        if (!natal || typeof natal.lon !== 'number' || !isFinite(natal.lon)) return;
        ASPECTS.forEach(function (aspectCfg) {
          var active = [];
          samples.forEach(function (sample, index) {
            var inOrb = aspectError(sample.lon, natal.lon, aspectCfg.angle) <= cfg.orb;
            if (inOrb) active.push(sample);
            if ((!inOrb || index === samples.length - 1) && active.length) {
              var firstIndex = samples.indexOf(active[0]), lastIndex = samples.indexOf(active[active.length - 1]);
              var run = { planet:planet, rows:active.slice(),
                leftOutside:firstIndex > 0 ? samples[firstIndex - 1].date : null,
                rightOutside:lastIndex < samples.length - 1 ? samples[lastIndex + 1].date : null };
              var syn = synastryActivation(person[0], targetKey, aspects);
              var potential = eventStrength({ transitWeight:cfg.weight, targetWeight:TARGETS[targetKey].weight,
                aspectWeight:aspectCfg.weight, exactOrb:0, orbLimit:cfg.orb,
                relationshipContextWeight:syn.multiplier, sharedMultiplier:1 });
              /* Below this ceiling an exact hit cannot become phase evidence.
                 Skip expensive boundary refinement, but keep a lower threshold
                 for fast bodies because they only refine an existing phase. */
              if (potential < (cfg.speed === 'fast' ? 18 : 38)) { active = []; return; }
              var event = makeEvent(run, cfg, person[0], targetKey, natal.lon, aspectCfg, syn, moonRange);
              if (event.confidence !== 'UNAVAILABLE') events.push(event);
              active = [];
            }
          });
        });
      });
    });
    return events;
  }

  function assignCycles(events) {
    var groups = {};
    events.forEach(function (event) {
      var key = [event.natalPerson,event.transitPlanet,event.natalPoint,event.aspect].join('|');
      (groups[key] || (groups[key] = [])).push(event);
    });
    var cycles = [];
    Object.keys(groups).forEach(function (key) {
      var rows = groups[key].sort(function (a, b) { return Date.parse(a.peakDate) - Date.parse(b.peakDate); });
      var chunks = [], chunk = [];
      rows.forEach(function (event) {
        var gap = chunk.length ? (Date.parse(event.peakDate) - Date.parse(chunk[chunk.length - 1].peakDate)) / DAY_MS : 0;
        var limit = event.speedClass === 'fast' ? 45 : 500;
        if (chunk.length && gap > limit) { chunks.push(chunk); chunk = []; }
        chunk.push(event);
      });
      if (chunk.length) chunks.push(chunk);
      chunks.forEach(function (hits) {
        var cycleId = 'rtc-' + hits[0].natalPerson + '-' + hits[0].transitPlanet + '-' + hits[0].natalPoint + '-' + hits[0].aspect + '-' + dateKey(hits[0].peakDate);
        hits.forEach(function (hit, index) { hit.cycleId = cycleId; hit.cycleHit = index + 1; hit.cycleHitCount = hits.length; });
        cycles.push({ id:cycleId, transitPlanet:hits[0].transitPlanet, natalPerson:hits[0].natalPerson,
          natalPoint:hits[0].natalPoint, aspect:hits[0].aspect, startDate:hits[0].startDate,
          endDate:hits[hits.length - 1].endDate, hitCount:hits.length, hits:hits });
      });
    });
    return cycles;
  }

  function overlapOrNear(a, b) {
    var aStart = Date.parse(a.startDate), aEnd = Date.parse(a.endDate), bStart = Date.parse(b.startDate), bEnd = Date.parse(b.endDate);
    if (aStart <= bEnd && bStart <= aEnd) return true;
    var gap = Math.abs(Date.parse(a.peakDate) - Date.parse(b.peakDate)) / DAY_MS;
    return gap <= Math.max(TRANSITS[a.transitPlanet].sharedDays, TRANSITS[b.transitPlanet].sharedDays);
  }
  function compatibleThemes(a, b) { return a.themes.some(function (theme) { return b.themes.indexOf(theme) >= 0; }); }
  function boundedDateWindow(rawStart, rawEnd, peak, limitDays) {
    var rawStartMs = Date.parse(rawStart), rawEndMs = Date.parse(rawEnd);
    var start = rawStartMs, end = rawEndMs, center = clamp(Date.parse(peak), rawStartMs, rawEndMs);
    var half = Math.max(1, limitDays / 2) * DAY_MS;
    start = Math.max(start, center - half);
    end = Math.min(end, center + half);
    if (end < start) start = end = center;
    return { startDate:new Date(start).toISOString(), endDate:new Date(end).toISOString() };
  }
  function sharedDateWindow(a, b, peak) {
    var overlapStart = Math.max(Date.parse(a.startDate), Date.parse(b.startDate));
    var overlapEnd = Math.min(Date.parse(a.endDate), Date.parse(b.endDate));
    var rawStart, rawEnd;
    if (overlapStart <= overlapEnd) {
      rawStart = new Date(overlapStart).toISOString();
      rawEnd = new Date(overlapEnd).toISOString();
    } else {
      rawStart = new Date(Math.min(Date.parse(a.peakDate), Date.parse(b.peakDate))).toISOString();
      rawEnd = new Date(Math.max(Date.parse(a.peakDate), Date.parse(b.peakDate))).toISOString();
    }
    var limitDays = Math.min(60, Math.max(TRANSITS[a.transitPlanet].sharedDays, TRANSITS[b.transitPlanet].sharedDays) * 2);
    var window = boundedDateWindow(rawStart, rawEnd, peak, limitDays);
    window.limitDays = limitDays;
    return window;
  }
  function sharedActivations(events) {
    var aEvents = events.filter(function (e) { return e.natalPerson === 'A' && e.coreEligible && e.strength >= 24; });
    var bEvents = events.filter(function (e) { return e.natalPerson === 'B' && e.coreEligible && e.strength >= 24; });
    var out = [];
    aEvents.forEach(function (a) {
      bEvents.forEach(function (b) {
        if (!overlapOrNear(a, b) || !compatibleThemes(a, b)) return;
        var common = a.themes.filter(function (t) { return b.themes.indexOf(t) >= 0; });
        var rel = Math.max(a.relationshipRelevance, b.relationshipRelevance);
        var sharedStrength = Math.round(clamp(((a.strength + b.strength) / 2) * 1.25 * (1 + (rel - 1) * .25), 0, 100));
        var sharedThemeScores = {};
        (common.length ? common : [a.category]).forEach(function (theme) {
          sharedThemeScores[theme] = (((a.themeScores && a.themeScores[theme]) || 0) + ((b.themeScores && b.themeScores[theme]) || 0)) / 2;
        });
        var category = Object.keys(sharedThemeScores).sort(function (x, y) { return sharedThemeScores[y] - sharedThemeScores[x]; })[0] || a.category;
        var evidence = a.relatedSynastryEvidence.concat(b.relatedSynastryEvidence);
        var seen = {};
        evidence = evidence.filter(function (e) { var k = [e.aKey,e.bKey,e.type].join('|'); if (seen[k]) return false; seen[k] = true; return true; }).slice(0, 5);
        var peak = new Date((Date.parse(a.peakDate) + Date.parse(b.peakDate)) / 2);
        var window = sharedDateWindow(a, b, peak);
        out.push({ id:'rts-' + a.id.slice(3) + '-' + b.id.slice(3),
          startDate:window.startDate, peakDate:peak.toISOString(), endDate:window.endDate,
          category:category, themes:common.length ? common : [category], personAEvents:[a], personBEvents:[b],
          themeScores:sharedThemeScores, sharedStrength:sharedStrength, relatedSynastryEvidence:evidence,
          windowLimitDays:window.limitDays,
          confidence:minConfidence(a.confidence, b.confidence) });
      });
    });
    out.sort(function (a, b) { return Date.parse(a.peakDate) - Date.parse(b.peakDate); });
    /* Several targets can describe the same shared window. Collapse same-theme
       candidates before phase clustering so the UI never becomes a Cartesian
       product of A events x B events. */
    var collapsed = [];
    out.forEach(function (row) {
      var previous = collapsed[collapsed.length - 1];
      var close = previous && previous.category === row.category
        && Math.abs(Date.parse(row.peakDate) - Date.parse(previous.peakDate)) / DAY_MS <= 12;
      if (!close) { collapsed.push(row); return; }
      var strongerPeak = row.sharedStrength > previous.sharedStrength ? row.peakDate : previous.peakDate;
      var mergedWindow = boundedDateWindow(
        new Date(Math.min(Date.parse(previous.startDate), Date.parse(row.startDate))).toISOString(),
        new Date(Math.max(Date.parse(previous.endDate), Date.parse(row.endDate))).toISOString(),
        strongerPeak, Math.min(60, Math.max(previous.windowLimitDays || 60, row.windowLimitDays || 60)));
      previous.startDate = mergedWindow.startDate;
      previous.endDate = mergedWindow.endDate;
      previous.peakDate = strongerPeak;
      previous.personAEvents = previous.personAEvents.concat(row.personAEvents);
      previous.personBEvents = previous.personBEvents.concat(row.personBEvents);
      Object.keys(row.themeScores || {}).forEach(function (theme) {
        previous.themeScores[theme] = Math.max(previous.themeScores[theme] || 0, row.themeScores[theme]);
      });
      previous.sharedStrength = Math.max(previous.sharedStrength, row.sharedStrength);
      previous.relatedSynastryEvidence = previous.relatedSynastryEvidence.concat(row.relatedSynastryEvidence).slice(0, 5);
      previous.confidence = minConfidence(previous.confidence, row.confidence);
    });
    return collapsed;
  }

  function phaseCopy(category, stateContext) {
    var copy = {
      attraction:['靠近與表態比較容易被放大','有好感或想靠近的訊號較容易被看見。','把想見面或想得到的回應說清楚，不用靠試探。','這是互動議題變明顯，不代表對方一定會採取行動。'],
      connection:['重新感受彼此的連結','兩人會更注意這段關係是否有來有往。','用一件能一起完成的小事確認彼此投入程度。','連結感提高不等於關係會自動升級。'],
      communication:['需要把關鍵話題說清楚','原本略過的差異較難繼續靠猜測處理。','先確認要談的問題，再各自說明需要與限制。','對話變多不等於一定爭執，也不保證立即有答案。'],
      emotional_closeness:['情緒需求更容易浮上來','陪伴、回應速度與安全感會比平常更受注意。','直接說需要陪伴、安靜或確認，避免用冷淡測試。','感受被放大，不代表每個擔心都是事實。'],
      commitment:['承諾與實際投入成為重點','時間、責任與下一步安排會比口頭感受更重要。','把承諾拆成可以確認的時間、分工與行動。','這是承諾議題提高，不等於一定結婚或分手。'],
      definition:['關係需要重新定位','沒有說清楚的期待與距離較難繼續忽略。','各自說明希望維持、改變或停止的是什麼。','需要定義不代表答案一定是更靠近。'],
      pressure:['現實壓力正在測試相處方式','時間、責任或限制可能放大既有的相處問題。','先分清楚外在限制與彼此態度，再談能調整的部分。','壓力提高不等於關係注定失敗。'],
      distance:['距離與自由需求變得明顯','兩人對聯絡頻率、空間或自主的需求較容易不同步。','約定可接受的聯絡與暫停方式，避免突然消失。','需要空間不必然代表失去感情。'],
      change:['原本的相處模式需要調整','習慣做法可能不再有效，新的距離或節奏正在形成。','先談哪一個做法已經行不通，再試一項小幅調整。','改變不等於必然分開，也不保證一定升級。'],
      intensity:['互動強度容易被放大','吸引、控制感或衝突反應可能同時變得更強。','反應很大時先停一下，再確認真正要保護的是什麼。','強烈感受不是事件必然發生的證明。'],
      healing:['適合重新理解與修復','舊問題較容易被看見，也有機會換一種回應方式。','只處理一件可驗證的舊問題，說明希望怎麼不同。','願意談不代表傷害已經自動消失。'],
      idealization:['期待與想像容易增加','兩人可能更容易看見理想版本，而略過尚未確認的部分。','把期待換成具體問題，確認對方實際能做到什麼。','感覺很對不等於現實條件已經成立。'],
      confusion:['模糊與誤讀需要被釐清','未說出口的期待容易被各自解讀成不同意思。','把事實、猜測與希望分開說，再確認對方聽到什麼。','暫時沒有答案不等於最壞的猜測成立。'],
      expansion:['共同發展的空間提高','兩人較容易討論新的安排、經驗或下一步。','挑一個能共同承擔的新計畫，先確認資源與時間。','機會增加不代表所有計畫都會自然落地。'],
    }[category] || ['關係議題同時被提高','兩人的關係敏感點在接近的時間受到啟動。','把注意力放在可說清楚、可確認的互動。','這是時序訊號，不是事件保證。'];
    if (stateContext === 'separated') copy = [copy[0], '在目前已分開的情境下，這較像重新檢視關係與未完成議題的窗口。', copy[2], '它不代表對方一定會聯絡或一定會復合。'];
    else if (stateContext === 'talking') copy = [copy[0], '在目前聊天或曖昧的情境下，這個主題較可能表現在互動節奏與關係定位。', copy[2], copy[3]];
    else if (stateContext === 'stable') copy = [copy[0], '在穩定交往的情境下，這個主題較可能表現在下一階段與日常安排。', copy[2], copy[3]];
    return { title:copy[0], meaning:copy[1], action:copy[2], caution:copy[3] };
  }

  var TARGET_NEEDS = {
    Sun:'關係定位與被重視的感受', Moon:'回應速度與安全感', Mercury:'話有沒有說清楚',
    Venus:'喜歡與投入有沒有被回應', Mars:'誰主動、關係進展多快', Jupiter:'能不能一起往前',
    Saturn:'承諾與現實安排', Uranus:'自由空間與變動', Neptune:'期待和事實的落差', Pluto:'信任、控制與深層改變',
  };
  var SECONDARY_COPY = {
    attraction:{ title:'靠近的感覺變強，也更在意回應', meaning:'有好感或想靠近的訊號變明顯，但真正的重點是雙方回應是否對得上。', action:'直接提出一次見面或一個具體邀請，用實際回應判斷投入。', caution:'互動升溫不等於關係已經確認。' },
    connection:{ title:'互動是否有來有往變得更重要', meaning:'聯絡、陪伴與主動程度會更容易被拿來衡量這段關係。', action:'觀察一件事：提出需要後，雙方是否都願意回應與調整。', caution:'覺得有連結，不等於兩人對關係有相同打算。' },
    communication:{ title:'互動方式需要說得更清楚', meaning:'差別容易出現在回覆方式、說話節奏，以及重要問題有沒有真正講明。', action:'選一個最近反覆猜測的問題，用一句明確問題確認，不用暗示。', caution:'訊息變多不代表核心問題已經談開。' },
    emotional_closeness:{ title:'安全感與陪伴需求變得明顯', meaning:'誰需要更多回應、誰需要先消化情緒，會比平常更影響相處。', action:'各自說明現在需要陪伴、確認或安靜，不用冷淡測試對方。', caution:'情緒變強不代表最擔心的事已經發生。' },
    commitment:{ title:'確認彼此願意投入多少', meaning:'焦點會落在願不願意排出時間、承擔責任，而不只是口頭感受。', action:'確認下一次見面、聯絡頻率或一項分工，看看承諾能否落到行動。', caution:'談到未來不等於已經作出承諾。' },
    definition:{ title:'需要說清楚彼此怎麼看這段關係', meaning:'沒講明的期待與界線較難繼續靠默契帶過。', action:'各自回答希望維持、改變或停止的是什麼，再找出一項共識。', caution:'需要定義不代表答案一定是更靠近。' },
    pressure:{ title:'現實安排正在測試相處方式', meaning:'時間、責任或生活限制會讓原本可忽略的差異更難跳過。', action:'先分清楚外在限制與彼此態度，再談一項現在能調整的安排。', caution:'一時卡住不等於關係注定失敗。' },
    distance:{ title:'靠近與保留空間需要重新協調', meaning:'聯絡頻率、距離或自主需求較容易不同步。', action:'說清楚可接受的聯絡頻率與需要暫停時的做法，避免突然消失。', caution:'需要空間不等於不在意。' },
    change:{ title:'原本的相處節奏需要調整', meaning:'過去有效的聯絡或相處方式可能不再適合現在。', action:'指出一個已經行不通的做法，先試一項小幅、可回頭檢查的改變。', caution:'改變不等於必然分開，也不保證自然升級。' },
    intensity:{ title:'吸引與拉扯同時變強', meaning:'靠近、吃醋、控制感或衝突反應可能同時被放大。', action:'反應很大時先停一下，再說真正想確認或保護的是什麼。', caution:'感受強烈不是事件必然發生的證明。' },
    healing:{ title:'舊問題適合用新的方式處理', meaning:'過去沒處理完的感受較容易再出現，也比較看得出能不能換一種回應。', action:'只挑一件可驗證的舊問題，說明這次希望彼此怎麼做得不同。', caution:'願意談不代表傷害已經消失。' },
    idealization:{ title:'期待增加，更需要核對現實', meaning:'理想版本會更吸引人，尚未確認的現實條件也更容易被略過。', action:'把一個期待換成具體問題，確認對方實際願意做到什麼。', caution:'感覺很對不等於條件已經成立。' },
    confusion:{ title:'猜測變多，需要回到可確認的事實', meaning:'未說出口的期待容易被雙方解讀成不同意思。', action:'把已發生的事、自己的猜測與希望分開說，再確認對方的理解。', caution:'暫時沒有答案不等於最壞的猜測成立。' },
    expansion:{ title:'是否一起往前會變成具體問題', meaning:'新的安排、共同經驗或下一步較容易被提出。', action:'挑一個雙方都要投入的新計畫，先確認時間、資源與責任。', caution:'機會增加不代表計畫會自然落地。' },
  };
  function topEvent(rows, person) {
    var events = [];
    rows.forEach(function (row) { events = events.concat(person === 'A' ? row.personAEvents : row.personBEvents); });
    return events.sort(function (a, b) { return b.strength * b.relationshipRelevance - a.strength * a.relationshipRelevance; })[0] || null;
  }
  function phaseNarrative(category, secondary, rows, stateContext) {
    var base = phaseCopy(category, stateContext), detail = SECONDARY_COPY[secondary] || SECONDARY_COPY[category];
    var a = topEvent(rows, 'A'), b = topEvent(rows, 'B');
    var why = a && b
      ? '本人較在意的「' + (TARGET_NEEDS[a.natalPoint] || THEME_LABELS[category]) + '」，與對方較在意的「' + (TARGET_NEEDS[b.natalPoint] || THEME_LABELS[secondary]) + '」在接近的時間同時變強。'
      : '雙方在接近的時間同時碰到「' + THEME_LABELS[category] + '」課題。';
    return {
      title:detail.title,
      meaning:detail.meaning || base.meaning,
      action:detail.action || base.action,
      caution:detail.caution || base.caution,
      whyNow:why,
    };
  }

  function clusterPhases(shared, stateContext) {
    var anchors = shared.filter(function (s) {
      var events = s.personAEvents.concat(s.personBEvents);
      return s.sharedStrength >= 55 && events.some(function (e) { return e.speedClass !== 'fast'; });
    });
    var groups = [];
    anchors.forEach(function (item) {
      var group = groups[groups.length - 1], near = false;
      if (group) {
        var gap = (Date.parse(item.startDate) - group.end) / DAY_MS;
        /* A phase is a time cluster first. Different but simultaneous themes
           belong in one phase, with the strongest theme used as its headline. */
        var mergedSpan = (Math.max(group.end, Date.parse(item.endDate)) - group.start) / DAY_MS;
        near = gap <= 18 && mergedSpan <= 75;
      }
      if (!group || !near) {
        group = { rows:[], start:Date.parse(item.startDate), end:Date.parse(item.endDate), themes:[] };
        groups.push(group);
      }
      group.rows.push(item); group.start = Math.min(group.start, Date.parse(item.startDate)); group.end = Math.max(group.end, Date.parse(item.endDate));
      item.themes.forEach(function (t) { if (group.themes.indexOf(t) < 0) group.themes.push(t); });
    });
    return groups.map(function (group, index) {
      var categoryScores = {};
      group.rows.forEach(function (s) {
        s.themes.forEach(function (t) {
          categoryScores[t] = (categoryScores[t] || 0) + s.sharedStrength * ((s.themeScores && s.themeScores[t]) || .25);
        });
      });
      var rankedCategories = Object.keys(categoryScores).sort(function (a, b) { return categoryScores[b] - categoryScores[a]; });
      var category = rankedCategories[0], secondary = rankedCategories[1] || category;
      var strongest = group.rows.slice().sort(function (a, b) { return b.sharedStrength - a.sharedStrength; })[0];
      var confidence = group.rows.reduce(function (value, row) { return minConfidence(value, row.confidence); }, 'HIGH');
      var copy = phaseNarrative(category, secondary, group.rows, stateContext);
      return { id:'rtp-' + dateKey(new Date(group.start)) + '-' + index, startDate:new Date(group.start).toISOString(),
        peakDate:strongest.peakDate, endDate:new Date(group.end).toISOString(), category:category, secondaryCategory:secondary,
        semanticKey:category + '|' + secondary, themes:group.themes, title:copy.title, meaning:copy.meaning,
        action:copy.action, caution:copy.caution, whyNow:copy.whyNow,
        phaseStrength:Math.max.apply(null, group.rows.map(function (s) { return s.sharedStrength; })),
        confidence:confidence, sharedActivations:group.rows };
    });
  }

  function filterRange(timeline, rangeKey) {
    var ranges = timeline.rangeBoundaries, range = ranges[rangeKey];
    if (!range) return [];
    return timeline.phases.filter(function (p) { return Date.parse(p.peakDate) >= range.start && Date.parse(p.peakDate) < range.end; });
  }

  function selectSalientPhases(candidates, start, end, limit, includeCurrent) {
    var inRange = candidates.filter(function (phase) {
      var peak = Date.parse(phase.peakDate);
      return peak >= start.getTime() && peak < end.getTime();
    });
    var selected = [], visibleTitles = {};
    if (includeCurrent) {
      var current = inRange.filter(function (phase) {
        return Date.parse(phase.startDate) <= start.getTime() && Date.parse(phase.endDate) >= start.getTime();
      }).sort(function (a, b) { return b.phaseStrength - a.phaseStrength; })[0];
      if (current) { selected.push(current); visibleTitles[current.title] = true; }
    }
    inRange.slice().sort(function (a, b) { return b.phaseStrength - a.phaseStrength; }).forEach(function (phase) {
      if (selected.length >= limit || selected.indexOf(phase) >= 0 || visibleTitles[phase.title]) return;
      var spaced = selected.every(function (other) {
        return Math.abs(Date.parse(phase.peakDate) - Date.parse(other.peakDate)) / DAY_MS >= 18;
      });
      if (spaced) { selected.push(phase); visibleTitles[phase.title] = true; }
    });
    return selected.sort(function (a, b) { return Date.parse(a.peakDate) - Date.parse(b.peakDate); });
  }

  function buildTimeline(options) {
    options = options || {};
    if (!options.chartA || !options.chartB) throw new Error('RelationshipTiming requires chartA and chartB');
    var start = options.startDate ? new Date(options.startDate) : new Date();
    start = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    var end = options.endDate ? new Date(options.endDate) : addDays(start, 365.2422 * 3);
    var events = [];
    Object.keys(TRANSITS).filter(function (planet) { return TRANSITS[planet].speed !== 'fast'; }).forEach(function (planet) {
      events = events.concat(individualEventsForPlanet(planet, options.chartA, options.chartB,
        options.personA || {}, options.personB || {}, options.synastryAspects || [], start, end));
    });
    events.sort(function (a, b) { return Date.parse(a.peakDate) - Date.parse(b.peakDate); });
    var shared = sharedActivations(events);
    var candidatePhases = clusterPhases(shared, options.relationshipState || 'unspecified');
    var recentEnd = addDays(start, 365.2422 / 4), midEnd = addDays(start, 365.2422), longEnd = end;
    /* One candidate timeline, one salience rule. Range boundaries only decide
       which part is displayed; they do not rerun astronomy or change dates. */
    var phases = selectSalientPhases(candidatePhases, start, recentEnd, 4, true)
      .concat(selectSalientPhases(candidatePhases, recentEnd, midEnd, 5, false))
      .concat(selectSalientPhases(candidatePhases, midEnd, longEnd, 8, false))
      .sort(function (a, b) { return Date.parse(a.peakDate) - Date.parse(b.peakDate); });
    /* Fast bodies refine already-supported phases; they never create a major
       phase by themselves. Scan only the windows the UI can actually display,
       and only ±4 days around each phase peak. */
    var fastById = {};
    phases.forEach(function (phase) {
      var peak = new Date(phase.peakDate), from = new Date(Math.max(start.getTime(), addDays(peak, -4).getTime()));
      var to = new Date(Math.min(end.getTime(), addDays(peak, 4).getTime()));
      var triggers = [];
      Object.keys(TRANSITS).filter(function (planet) { return TRANSITS[planet].speed === 'fast'; }).forEach(function (planet) {
        triggers = triggers.concat(individualEventsForPlanet(planet, options.chartA, options.chartB,
          options.personA || {}, options.personB || {}, options.synastryAspects || [], from, to));
      });
      triggers = triggers.filter(function (event) { return event.coreEligible && event.strength >= 20; })
        .sort(function (a, b) { return b.strength - a.strength; }).slice(0, 6);
      phase.fastTriggers = triggers;
      triggers.forEach(function (event) { fastById[event.id] = event; });
    });
    events = events.concat(Object.keys(fastById).map(function (id) { return fastById[id]; }))
      .sort(function (a, b) { return Date.parse(a.peakDate) - Date.parse(b.peakDate); });
    var cycles = assignCycles(events);
    var timeline = { schemaVersion:SCHEMA_VERSION, generatedFor:dateIso(start), startDate:start.toISOString(), endDate:end.toISOString(),
      events:events, cycles:cycles, sharedActivations:shared, phases:phases,
      candidatePhaseCount:candidatePhases.length,
      rangeBoundaries:{ recent:{ start:start.getTime(), end:recentEnd.getTime() }, mid:{ start:recentEnd.getTime(), end:midEnd.getTime() }, long:{ start:midEnd.getTime(), end:longEnd.getTime() } },
      reliability:{ personA:(options.personA && options.personA.unknownTime) ? 'MEDIUM' : 'HIGH',
        personB:(options.personB && options.personB.unknownTime) ? 'MEDIUM' : 'HIGH',
        excluded:['ASC','DSC','MC','IC','houses','house rulers','angles'],
        note:'關係走勢只使用行運對雙方本命行星的啟動。出生時間未知者的月亮會按當地出生整日範圍驗證；只有整段範圍皆成立的月亮證據可進入核心結果。' } };
    timeline.ranges = { recent:filterRange(timeline, 'recent'), mid:filterRange(timeline, 'mid'), long:filterRange(timeline, 'long') };
    var nowMs = start.getTime();
    timeline.currentPhase = phases.filter(function (p) { return Date.parse(p.startDate) <= nowMs && Date.parse(p.endDate) >= nowMs; })[0] || null;
    timeline.nextPhase = phases.filter(function (p) { return Date.parse(p.startDate) > nowMs; })[0] || null;
    return timeline;
  }

  root.RelationshipTimingEngine = {
    schemaVersion:SCHEMA_VERSION, confidence:CONFIDENCE_ORDER, transits:TRANSITS, targets:TARGETS,
    themeLabels:THEME_LABELS, aspects:ASPECTS, eventStrength:eventStrength,
    moonRangeForLocalDay:moonRangeForLocalDay, moonAspectConfidence:moonAspectConfidence,
    signedDailyMotion:signedDailyMotion, buildTimeline:buildTimeline, filterRange:filterRange,
    _test:{ angleDiff:angleDiff, aspectError:aspectError, assignCycles:assignCycles,
      sharedActivations:sharedActivations, clusterPhases:clusterPhases, synastryActivation:synastryActivation,
      bodyLongitude:bodyLongitude, refineMinimum:refineMinimum,
      individualEventsForPlanet:individualEventsForPlanet },
  };
})(typeof window !== 'undefined' ? window : globalThis);
