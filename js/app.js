function isQuestionVague(q) {
  var trimmed = q.trim().replace(/[?？!！。.]/g, '');
  if (trimmed.length < 6) return 'short';
  var vagueWholePhrases = ['感情如何', '事業如何', '運勢如何', '財運如何', '健康如何', '學業如何', '會不會好', '怎麼樣', '如何'];
  if (vagueWholePhrases.indexOf(trimmed) !== -1) return 'vague';
  return null;
}

var state = {
  tab: 'home',
  deck: 'tarot',
  spread: 'three-time',
  category: null,
  wizardStep: 1,       // 1=類別 2=牌陣 3=問題 4=確認
  question: '',
  target: '',
  subtopic: '',        // 具體問題 key（目前僅 love 類別有對應 UI／解讀，見 SUBTOPICS）
  readingMode: 'cards', // 'cards' | 'combined'（目前僅 love 類別可切換；combined 需要 state.astroResult 存在）
  timeframe: 'month',
  drawn: [],
  phase: 'setup',      // setup | shuffling | picking | result
  pickOrder: [],       // shuffled indices of the full deck (picking pool)
  picked: [],          // pool cell indices the user has tapped, in order
  dailyFlipped: true,
  history: [],
  libDeck: 'tarot',
  libSuit: 'all',
  libSelected: null,
  histSelected: null,
  mnOpen: false,
  mnTab: 'suit',
  libQuiz: false,
  quiz: null,
  mnTabLen: 'tone',
  comboA: 1,
  comboB: 24,
  gtSig: 29,
  gtHelpOpen: false,
  aboutOpen: false,
  copied: false,
  tlGuideOpen: false,
  homeMoreOpen: false,
  homeTourDismissed: false,
  astroY: '', astroM: '', astroD: '', astroH: '', astroMin: '',
  astroCityQuery: '', astroCityIdx: null, astroCityUsed: null,
  astroUnknownTime: false, astroResult: null, astroView: 'chart', astroGenerating: false, astroTourDismissed: false,
  astroHouseSystem: 'placidus', astroDetail: null, astroMethodOpen: false,
  astroOpenPlacements: false, astroOpenPoints: false, astroOpenAspects: false,
  aiPersona: 'moon',
  astroReturnCityIdx: null, synRelationship: 'love',
  progYears: 1, progExpandedYear: 0, progOnlyTransitions: false,
  horoDayAnchor: null, horoWeekOffset: 0, horoMonthOffset: 0, horoYearOffset: 0, horoYearRange: 1,
  synY: '', synM: '', synD: '', synH: '', synMin: '', synGenerating: false,
  synCityQuery: '', synCityIdx: null, synCityUsed: null,
  synUnknownTime: false, synResult: null,
  xiuMode: 'personal', xiuY: '', xiuM: '', xiuD: '',
  xiuPartnerY: '', xiuPartnerM: '', xiuPartnerD: '',
  xiuDayAnchor: null, xiuWikiOpen: null, xiuSavedPartners: [],
};

var SPREAD_GROUPS = [
  { label: '基礎入門 Basics', keys: ['single', 'three-time', 'three-issue', 'three-mbs'] },
  { label: '感情 Love', keys: ['relationship', 'crush', 'peach', 'crosslove'] },
  { label: '進階綜合 Advanced', keys: ['celtic', 'horseshoe'] },
  { label: '職涯・決策 Career & Decisions', keys: ['fork', 'timeline'] },
];

/* shuffle animation keyframes */
(function () {
  var st = document.createElement('style');
  st.textContent =
    '@keyframes shufL {0%,100%{transform:translate(-50%,0) rotate(0)}30%{transform:translate(calc(-50% - 52px),-6px) rotate(-10deg)}60%{transform:translate(calc(-50% + 20px),4px) rotate(5deg)}}' +
    '@keyframes shufR {0%,100%{transform:translate(-50%,0) rotate(0)}30%{transform:translate(calc(-50% + 52px),6px) rotate(10deg)}60%{transform:translate(calc(-50% - 20px),-4px) rotate(-5deg)}}' +
    '@keyframes shufM {0%,100%{transform:translate(-50%,0) rotate(0)}45%{transform:translate(-50%,-10px) rotate(3deg)}}' +
    '@keyframes pickIn {from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}' +
    '@keyframes fadeUp {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}' +
    '@keyframes focusPulse {0%,100%{opacity:.45;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}' +
    '@keyframes cardGlow {0%{opacity:0;box-shadow:0 0 0 0 rgba(230,205,154,0)}30%{opacity:1;box-shadow:0 0 26px 9px rgba(230,205,154,.9),0 0 80px 28px rgba(230,205,154,.4)}100%{opacity:0;box-shadow:0 0 0 0 rgba(230,205,154,0)}}';
  document.head.appendChild(st);
})();

try {
  var _savedHistory = JSON.parse(localStorage.getItem('tl_history') || '[]');
  state.history = Array.isArray(_savedHistory) ? _savedHistory.slice(0, 30) : [];
} catch (e) { state.history = []; }
try {
  var _savedXiuPartners = JSON.parse(localStorage.getItem('tl_xiu_partners') || '[]');
  state.xiuSavedPartners = Array.isArray(_savedXiuPartners) ? _savedXiuPartners.slice(0, 50) : [];
} catch (e) { state.xiuSavedPartners = []; }

/* attach the rich meaning database (78-card) onto the tarot deck */
if (typeof RICH !== 'undefined') {
  TAROT.forEach(function (c) { c.rich = RICH[c.id] || null; });
}

function hashStr(s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
  return h;
}

var _today = new Date().toISOString().slice(0, 10);
var _seed = hashStr(_today);
var dailyCard = TAROT[_seed % TAROT.length];
var dailyReversed = (_seed >> 3) % 2 === 1;

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

var SIGIL = '<svg width="WW" height="HH" viewBox="0 0 70 70"><circle cx="35" cy="35" r="30" fill="none" stroke="#c9a96e" stroke-width="1"/><circle cx="35" cy="35" r="18" fill="none" stroke="#c9a96e" stroke-width="1"/><path d="M35 5 L35 65 M5 35 L65 35" stroke="#c9a96e" stroke-width=".6"/></svg>';
function sigil(w, h) { return SIGIL.replace('WW', w).replace('HH', h); }

/* 3D flip card (Cardcaptor-style: rotateY + golden glow burst on reveal) */
function flipBox(id, flipped, radius, backHtml, frontHtml) {
  var bf = '-webkit-backface-visibility:hidden;backface-visibility:hidden';
  return '<div style="position:absolute;inset:0;perspective:900px">'
    + '<div id="' + id + '-inner" style="position:absolute;inset:0;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;transition:transform .7s cubic-bezier(.35,.15,.25,1);transform:rotateY(' + (flipped ? 180 : 0) + 'deg)">'
    + '<div id="' + id + '-back" aria-hidden="' + flipped + '" style="position:absolute;inset:0;border-radius:' + radius + 'px;border:1px solid #c9a96e;background:linear-gradient(160deg,#241f2e,#1a1622);display:flex;align-items:center;justify-content:center;' + bf + '">' + backHtml + '</div>'
    + '<div id="' + id + '-front" aria-hidden="' + (!flipped) + '" style="position:absolute;inset:0;border-radius:' + radius + 'px;border:1px solid #d8b96c;background:#f2e9d8;box-sizing:border-box;transform:rotateY(180deg);' + bf + '">' + frontHtml + '</div>'
    + '</div>'
    + '<div id="' + id + '-glow" style="position:absolute;inset:-5px;border-radius:' + (radius + 4) + 'px;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center, rgba(255,244,210,.55), rgba(230,205,154,.22) 45%, transparent 72%)"></div>'
    + '</div>';
}
function doFlip(id, flipped) {
  var inner = document.getElementById(id + '-inner');
  if (inner) inner.style.transform = 'rotateY(' + (flipped ? 180 : 0) + 'deg)';
  var back = document.getElementById(id + '-back');
  var front = document.getElementById(id + '-front');
  if (back) back.setAttribute('aria-hidden', String(flipped));
  if (front) front.setAttribute('aria-hidden', String(!flipped));
  if (flipped) {
    var g = document.getElementById(id + '-glow');
    if (g) { g.style.animation = 'none'; void g.offsetWidth; g.style.animation = 'cardGlow .95s ease-out'; }
    fxFlip();
  }
}

function cardImgHtml(src, alt) {
  if (!src) return '<div style="flex:1;display:flex;align-items:center;justify-content:center;font:600 13px \'Noto Serif TC\',serif;color:#a9784f;padding:6px;text-align:center">' + esc(alt) + '</div>';
  return '<div style="flex:1;min-height:0;display:flex;align-items:stretch;justify-content:center;overflow:hidden"><img src="' + src + '" alt="' + esc(alt) + '" loading="lazy" style="width:100%;height:100%;object-fit:contain;display:block"></div>';
}
function cardThumbSrc(src) {
  return src ? src.replace('assets/cards/', 'assets/cards/thumbs/') : '';
}

/* ================= Lenormand pair combinations (兩兩組牌) ================= */
/* each card: n = noun when it is the subject, m = modifier when it colours the other card */
var LEN_COMBI = {
  1: { n: '消息與來訪', m: '即將到來的' },
  2: { n: '小小的幸運', m: '幸運順遂的' },
  3: { n: '旅行或遠方的事物', m: '來自遠方的' },
  4: { n: '家庭與安穩', m: '與家有關的' },
  5: { n: '健康與根基', m: '關乎健康的' },
  6: { n: '混沌與不確定', m: '曖昧不明的' },
  7: { n: '糾葛或誘惑', m: '暗藏波折的' },
  8: { n: '結束與轉化', m: '走向結束的' },
  9: { n: '禮物與美好', m: '令人愉悅的' },
  10: { n: '突然的切割', m: '突如其來的' },
  11: { n: '爭執與重複', m: '反覆拉扯的' },
  12: { n: '交談與騷動', m: '議論紛紛的' },
  13: { n: '新的開始', m: '剛起步的' },
  14: { n: '職場或算計', m: '需要提防的' },
  15: { n: '力量與資源', m: '有靠山支持的' },
  16: { n: '希望與指引', m: '帶著希望的' },
  17: { n: '改變與遷移', m: '正在轉變的' },
  18: { n: '友誼與忠誠', m: '值得信賴的' },
  19: { n: '體制與孤立', m: '公事層面的' },
  20: { n: '社交與公開場合', m: '公開的' },
  21: { n: '阻礙與延遲', m: '受阻的' },
  22: { n: '選擇與分岔', m: '面臨抉擇的' },
  23: { n: '損耗與流失', m: '逐漸損耗的' },
  24: { n: '愛與情感', m: '感情方面的' },
  25: { n: '承諾與約定', m: '關於承諾的' },
  26: { n: '秘密與知識', m: '尚未揭曉的' },
  27: { n: '訊息與文件', m: '書面往來的' },
  28: { n: '這位男士', m: '與他有關的' },
  29: { n: '這位女士', m: '與她有關的' },
  30: { n: '平和與成熟', m: '平靜安穩的' },
  31: { n: '成功與能量', m: '順利明朗的' },
  32: { n: '名聲與情緒', m: '受矚目的' },
  33: { n: '解答與關鍵', m: '必然實現的' },
  34: { n: '財富與流動', m: '與金錢有關的' },
  35: { n: '穩定與長久', m: '長期穩定的' },
  36: { n: '考驗與負擔', m: '命定沉重的' },
};

/* curated classic pairs override the generic template ("first-second") */
var LEN_PAIR_OVERRIDES = {
  '1-24': '愛的消息即將到來',
  '24-1': '感情上有新的進展或告白',
  '1-34': '與金錢或工作報酬有關的消息',
  '25-24': '感情中的承諾——告白、交往或婚約',
  '24-25': '一段以真心為基礎的承諾關係',
  '8-24': '一段感情告一段落，心境需要時間復原',
  '31-24': '感情明朗順利，充滿溫暖',
  '6-24': '感情狀態曖昧不明，先別急著下定論',
  '34-31': '財運亨通，收入或事業進帳順利',
  '21-33': '關鍵的阻礙即將被解開',
  '33-31': '成功是必然的，關鍵已經在你手上',
  '10-25': '承諾或合約可能突然生變',
  '14-19': '職場中需留意算計與辦公室政治',
  '18-25': '值得信賴、能走得長遠的關係',
  '3-9': '遠方帶來令人開心的禮物或邀請',
  '17-4': '搬家、換環境或家庭型態的轉變',
  '23-34': '留意金錢的流失與不必要的開銷',
  '16-22': '選擇的方向出現了明確的指引',
  '12-27': '消息往來頻繁，留意口頭與書面溝通的落差',
  '5-31': '健康狀態穩定好轉，充滿生命力',
  '7-24': '感情中有糾葛或第三方的影響，保持清醒',
  '15-34': '財務上有貴人或穩固的資源支持',
  '21-24': '感情進展暫時受阻，需要耐心',
  '13-24': '一段感情正要萌芽，新鮮而純粹',
  '8-19': '離開既有的體制或職位，迎向轉化',
};

function lenPairText(a, b) {
  var key = a.n + '-' + b.n;
  if (LEN_PAIR_OVERRIDES[key]) return LEN_PAIR_OVERRIDES[key];
  var A = LEN_COMBI[a.n], B = LEN_COMBI[b.n];
  if (!A || !B) return '';
  return B.m + A.n;
}

/* adjacent-pair readings for the current lenormand draw */
function lenPairs(drawn) {
  var out = [];
  for (var i = 0; i < drawn.length - 1; i++) {
    var a = drawn[i].card, b = drawn[i + 1].card;
    out.push({ label: a.nameZh + ' ＋ ' + b.nameZh, text: lenPairText(a, b) });
  }
  return out;
}

function lenStory(drawn) {
  if (!drawn || drawn.length < 2) return '';
  var pairs = lenPairs(drawn);
  if (drawn.length === 3) {
    return '第一張「' + drawn[0].card.nameZh + '」交代背景，並以「' + pairs[0].text + '」推進到核心牌「' + drawn[1].card.nameZh + '」；接著「' + pairs[1].text + '」，因此事情會朝「' + LEN_COMBI[drawn[2].card.n].n + '」的方向發展。';
  }
  if (drawn.length === 5) {
    return '中央牌「' + drawn[2].card.nameZh + '」是問題核心。左側顯示「' + pairs[0].text + '」，說明事情如何形成；右側則由「' + pairs[2].text + '」走向「' + pairs[3].text + '」。首尾牌「' + drawn[0].card.nameZh + '＋' + drawn[4].card.nameZh + '」提醒你：' + lenPairText(drawn[0].card, drawn[4].card) + '。';
  }
  return pairs.map(function (p) { return p.text; }).join('，接著');
}

/* ================= 記憶心法 Mnemonics (tarot encyclopedia) ================= */
var SUIT_DOMAIN_DATA = [
  { suit: 'pentacles', title: '錢幣 Pentacles', life: '金錢與物質', tags: ['工作', '現實', '資產', '安全感'], color: '#9fbf7f' },
  { suit: 'cups', title: '聖杯 Cups', life: '情感與人際', tags: ['愛', '直覺', '情緒', '關係'], color: '#7fa8c9' },
  { suit: 'wands', title: '權杖 Wands', life: '行動與能量', tags: ['熱情', '忙碌', '目標', '創造力'], color: '#d9964a' },
  { suit: 'swords', title: '寶劍 Swords', life: '思想與衝突', tags: ['邏輯', '焦慮', '衝突', '真相'], color: '#a9a9c9' },
];
var NUMBER_FORMULA_DATA = [
  { num: '1 A', theme: '新開端', example: '聖杯A＝新戀情、錢幣A＝新財路' },
  { num: '2', theme: '二選一／平衡', example: '錢幣二＝財務周轉、權杖二＝決定方向' },
  { num: '3', theme: '初步成果／合作', example: '錢幣三＝磨練技能（例外：寶劍三＝心碎）' },
  { num: '4', theme: '穩定／停滯', example: '權杖四＝安家、錢幣四＝守財' },
  { num: '5', theme: '衝突／損失', example: '錢幣五＝匱乏、寶劍五＝爭執（也是改變的契機）' },
  { num: '6', theme: '給予／過渡', example: '錢幣六＝慷慨互助、寶劍六＝邁向平靜' },
  { num: '7', theme: '評估／迷惘', example: '錢幣七＝耐心等待收穫、聖杯七＝選項太多的白日夢' },
  { num: '8', theme: '專注／行動', example: '錢幣八＝打磨技藝、權杖八＝極速推進' },
  { num: '9', theme: '獨自滿足／焦慮', example: '錢幣九＝富足獨立、寶劍九＝焦慮失眠' },
  { num: '10', theme: '結局', example: '聖杯十＝幸福圓滿、寶劍十＝徹底結束' },
];
var COURT_ROLE_DATA = [
  { title: '侍者 Page', en: '新消息／學習', desc: '通常代表一個來自外界的新開始或靈感，還在學習階段。', power: '起點角色' },
  { title: '騎士 Knight', en: '行動／任務', desc: '快速朝目標前進，帶有衝勁，象徵事情正在積極推進中。', power: '行動角色' },
  { title: '皇后 Queen', en: '滋養／感受', desc: '向內的力量，擅長關懷與體察情緒，是情感面的守護者。', power: '向內的力量' },
  { title: '國王 King', en: '責任／掌控', desc: '向外的力量，展現領導力與成熟穩健的決策能力。', power: '向外的力量' },
];

function mnToggle() { state.mnOpen = !state.mnOpen; render(); }
function mnSetTab(k) { state.mnTab = k; render(); }

function renderMnemonic() {
  var h = '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;margin-top:14px;background:rgba(255,255,255,.02);overflow:hidden">';
  h += '<button type="button" onclick="mnToggle()" style="min-height:44px;width:100%;background:none;border:none;padding:12px 15px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">';
  h += '<span style="font:500 13px \'Noto Sans TC\',sans-serif;color:#e6cd9a">🧠 記憶心法 <span style="font:italic 10px \'EB Garamond\',serif;color:rgba(240,233,216,.4)">Mnemonics</span></span>';
  h += '<span style="color:#c9a96e;font-size:11px">' + (state.mnOpen ? '▲ 收起' : '▼ 展開') + '</span>';
  h += '</button>';
  if (state.mnOpen) {
    h += '<div style="padding:0 15px 15px">';
    h += '<div style="display:flex;gap:7px">';
    [['suit', '花色領域'], ['number', '數字公式'], ['court', '宮廷角色'], ['confuse', '易混淆']].forEach(function (t) {
      var active = state.mnTab === t[0];
      h += '<button type="button" onclick="mnSetTab(\'' + t[0] + '\')" style="min-height:44px;flex:1;background:' + (active ? 'rgba(201,169,110,.18)' : 'transparent') + ';border:1px solid ' + (active ? '#c9a96e' : 'rgba(201,169,110,.3)') + ';color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.5)') + ';padding:7px 4px;border-radius:8px;cursor:pointer;font:500 12px \'Noto Sans TC\',sans-serif">' + t[1] + '</button>';
    });
    h += '</div>';
    if (state.mnTab === 'suit') {
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px">';
      SUIT_DOMAIN_DATA.forEach(function (d) {
        h += '<div style="border:1px solid rgba(201,169,110,.25);border-left:3px solid ' + d.color + ';border-radius:8px;padding:11px 12px;background:rgba(255,255,255,.02)">';
        h += '<div style="font:600 13px \'Noto Serif TC\',serif;color:' + d.color + '">' + d.title + '</div>';
        h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:3px">' + d.life + '</div>';
        h += '<div style="margin-top:6px">' + d.tags.map(function (t2) {
          return '<span style="display:inline-block;font:400 10px \'Noto Sans TC\',sans-serif;border:1px solid rgba(201,169,110,.3);color:rgba(240,233,216,.6);border-radius:9px;padding:2px 7px;margin:2px 3px 0 0">' + t2 + '</span>';
        }).join('') + '</div>';
        h += '</div>';
      });
      h += '</div>';
    } else if (state.mnTab === 'number') {
      h += '<div style="margin-top:12px">';
      NUMBER_FORMULA_DATA.forEach(function (d) {
        h += '<div style="display:flex;gap:11px;padding:8px 2px;border-bottom:1px solid rgba(201,169,110,.12);align-items:flex-start">';
        h += '<div style="flex:none;width:34px;text-align:center;font:600 13px \'Noto Serif TC\',serif;color:#c9a96e;border:1px solid rgba(201,169,110,.35);border-radius:7px;padding:3px 0">' + d.num + '</div>';
        h += '<div style="flex:1;min-width:0"><div style="font:500 12.5px \'Noto Sans TC\',sans-serif;color:#f0e9d8">' + d.theme + '</div>';
        h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:2px;line-height:1.5">' + d.example + '</div></div>';
        h += '</div>';
      });
      h += '</div>';
    } else if (state.mnTab === 'confuse') {
      h += '<div style="margin-top:12px">';
      CONFUSE_DATA.forEach(function (g) {
        h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:8px;padding:11px 13px;background:rgba(255,255,255,.02);margin-bottom:9px">';
        h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + g.common + '，差在哪?</div>';
        g.cards.forEach(function (cc) {
          var card = TAROT.find(function (x) { return x.id === cc.id; });
          if (!card) return;
          h += '<div style="display:flex;gap:9px;margin-top:8px;align-items:baseline">';
          h += '<span onclick="openLibCard(\'' + card.id + '\')" style="flex:none;font:600 12px \'Noto Serif TC\',serif;color:#e6cd9a;cursor:pointer;border-bottom:1px dotted rgba(201,169,110,.4)">' + card.nameZh + '</span>';
          h += '<span style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.65);line-height:1.6">' + cc.diff + '</span>';
          h += '</div>';
        });
        h += '</div>';
      });
      h += '</div>';
    } else {
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px">';
      COURT_ROLE_DATA.forEach(function (d) {
        h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:8px;padding:11px 12px;background:rgba(255,255,255,.02)">';
        h += '<div style="font:600 13px \'Noto Serif TC\',serif;color:#e6cd9a">' + d.title + '</div>';
        h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:2px">' + d.en + '</div>';
        h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.65);margin-top:5px;line-height:1.6">' + d.desc + '</div>';
        h += '<div style="display:inline-block;font:400 10px \'Noto Sans TC\',sans-serif;border:1px solid rgba(201,169,110,.35);color:rgba(240,233,216,.55);border-radius:9px;padding:2px 8px;margin-top:7px">' + d.power + '</div>';
        h += '</div>';
      });
      h += '</div>';
    }
    h += '</div>';
  }
  h += '</div>';
  return h;
}

/* ================= Lenormand rich database (36 cards) ================= */
/* kw: keywords; mean: core meaning; love/career/advice: contexts;
   pc: playing-card association; tone: 吉 / 中性 / 凶 */
var LEN_RICH = {
  1: { kw: ['消息', '行動', '速度', '來訪'], mean: '有消息或訪客正朝你而來，事情開始動起來，節奏明顯加快。', love: '對方主動釋出訊息或展開追求，關係有新動靜。', career: '新的邀約、通知或案子上門，宜快速回應。', advice: '保持機動，消息到來時果斷行動。', pc: '紅心 9', tone: '中性' },
  2: { kw: ['幸運', '機會', '輕盈', '短暫'], mean: '小而確定的幸運降臨，是短暫但真實的好運窗口。', love: '相處中出現令人會心一笑的小驚喜。', career: '有意外的小機會，講求時效。', advice: '好運稍縱即逝，看到機會就伸手。', pc: '方塊 6', tone: '吉' },
  3: { kw: ['旅行', '遠方', '貿易', '探索'], mean: '遠方的事物與你產生連結，可能是旅行、外地機會或思念。', love: '遠距離的關係，或需要拉開距離看清彼此。', career: '外地、外商或跨領域的機會值得考慮。', advice: '離開熟悉的水域，答案在遠方。', pc: '黑桃 10', tone: '中性' },
  4: { kw: ['家庭', '安穩', '房產', '基礎'], mean: '與家、房產或內在安全感有關，是你根基穩固之處。', love: '關係走向安定，適合談同居或見家人。', career: '家族事業，或體質穩健的公司。', advice: '先把根基顧好，再談擴張。', pc: '紅心 K', tone: '吉' },
  5: { kw: ['健康', '成長', '根基', '緩慢'], mean: '關乎身心健康與長期成長，事情需要時間慢慢扎根。', love: '感情細水長流，慢慢加溫。', career: '職涯像養一棵樹，累積終會開花。', advice: '照顧身體，耐心等待成長。', pc: '紅心 7', tone: '中性' },
  6: { kw: ['困惑', '不明', '變動', '遮蔽'], mean: '情勢籠罩迷霧，資訊不明，此刻看到的未必是全貌。', love: '對方心意不明朗，容易產生誤解。', career: '方向混沌，決策所需的資訊還不足。', advice: '等雲散再走，現在別做重大決定。', pc: '梅花 K', tone: '凶' },
  7: { kw: ['誘惑', '糾葛', '迂迴', '智慧'], mean: '事情不會直線發展，其中有糾葛、誘惑，需要迂迴的智慧。', love: '留意第三者，或關係中的暗流。', career: '職場有暗中較勁，話別說得太滿。', advice: '走得彎一點反而安全，保持警覺。', pc: '梅花 Q', tone: '凶' },
  8: { kw: ['結束', '轉化', '休止', '釋放'], mean: '一件事正走向終點，結束是為了騰出新的空間。', love: '一段關係或相處模式告一段落。', career: '專案或職務將收尾，準備轉換跑道。', advice: '好好道別，新的階段才進得來。', pc: '方塊 9', tone: '凶' },
  9: { kw: ['禮物', '喜悅', '邀請', '美好'], mean: '令人愉快的驚喜、邀請或善意正在靠近。', love: '被欣賞、被討好，關係甜度上升。', career: '成果被肯定，或收到好的邀約。', advice: '大方接受美好，也記得回禮。', pc: '黑桃 Q', tone: '吉' },
  10: { kw: ['切割', '決斷', '突然', '收割'], mean: '突如其來的切割或決定——快、準、不可逆。', love: '關係可能急轉直下，或需要果斷了斷。', career: '裁決、砍案或突然的人事變動。', advice: '該切就切，拖延只會更痛。', pc: '方塊 J', tone: '凶' },
  11: { kw: ['爭執', '重複', '張力', '消耗'], mean: '反覆的爭執或消耗性的循環，同樣的問題一再上演。', love: '爭吵一再重演，溝通變成互相攻擊。', career: '會議吵不完，流程一改再改。', advice: '停止重複的戲碼，換一種對話方式。', pc: '梅花 J', tone: '凶' },
  12: { kw: ['交談', '傳言', '焦慮', '成雙'], mean: '口頭交流頻繁，也可能是流言蜚語，或內心的嘈雜不安。', love: '曖昧的言語往來，或閒言閒語的干擾。', career: '溝通、開會與輿論聲量是這件事的重點。', advice: '把嘈雜關小聲，只聽重要的那一句。', pc: '方塊 7', tone: '中性' },
  13: { kw: ['開始', '天真', '小巧', '好奇'], mean: '新的開始，規模還小，帶著天真與好奇的能量。', love: '戀情剛萌芽，單純而青澀。', career: '新專案起步，從小規模做起。', advice: '用初學者的心態出發。', pc: '黑桃 J', tone: '中性' },
  14: { kw: ['機敏', '算計', '警覺', '生存'], mean: '需要警覺的處境——有人為自己盤算；也單純代表日常工作。', love: '對方的動機需要多觀察一陣子。', career: '職場政治檯面下運作，防人之心不可無。', advice: '聰明應對，別輕易亮出底牌。', pc: '梅花 9', tone: '凶' },
  15: { kw: ['力量', '權威', '保護', '資源'], mean: '強大的力量或資源介入，可能是靠山，也可能是壓力來源。', love: '關係中有一方較強勢，或有長輩介入。', career: '上司、金主或資深前輩的影響力。', advice: '借力使力，別跟力量硬碰。', pc: '梅花 10', tone: '中性' },
  16: { kw: ['希望', '指引', '靈感', '星光'], mean: '黑暗中出現指引，願景清晰，值得相信這個方向。', love: '對這段關係重新燃起希望。', career: '目標明確，長期規劃受到祝福。', advice: '抬頭看星星，按著願景走。', pc: '紅心 6', tone: '吉' },
  17: { kw: ['改變', '遷移', '更新', '季節'], mean: '遷移與更新的訊號，生活型態即將換季。', love: '關係進入新階段，例如同居或搬遷。', career: '調職、搬遷或轉型的時機到了。', advice: '順著改變走，舊巢不必留戀。', pc: '紅心 Q', tone: '吉' },
  18: { kw: ['忠誠', '朋友', '信任', '陪伴'], mean: '可信賴的朋友或夥伴出現，是忠誠與陪伴的能量。', love: '從友情發展的感情，或以信任為基底的關係。', career: '可靠的同事與長期的合作夥伴。', advice: '珍惜對你忠誠的人，也做個忠誠的人。', pc: '紅心 10', tone: '吉' },
  19: { kw: ['體制', '孤高', '官方', '界線'], mean: '與機構、官方或體制有關，也象徵高處的孤獨與清晰的界線。', love: '有一方過於獨立疏離。', career: '大公司、政府部門或制度性事務。', advice: '在體制內找到位置，孤獨時記得下樓。', pc: '黑桃 6', tone: '中性' },
  20: { kw: ['社交', '公開', '人脈', '聚會'], mean: '公開場合與群體活動，這件事將被眾人看見。', love: '公開關係，或在社交場合遇見對象。', career: '拓展人脈、公開發表的好時機。', advice: '走出去，讓人看見你。', pc: '黑桃 8', tone: '吉' },
  21: { kw: ['阻礙', '延遲', '沉重', '考驗'], mean: '眼前橫著一座山，進度延遲，需要耐力慢慢翻越。', love: '關係遇到現實阻力，急不得。', career: '專案卡關，或對手強勁。', advice: '山不會消失，但可以繞、可以爬。', pc: '梅花 8', tone: '凶' },
  22: { kw: ['選擇', '分岔', '自由', '猶豫'], mean: '站在人生的岔路口，必須做出選擇，而選擇權在你手上。', love: '在兩個人或兩種未來之間抉擇。', career: '轉職或路線的抉擇點。', advice: '沒有完美選項，選了就往前走。', pc: '方塊 Q', tone: '中性' },
  23: { kw: ['損耗', '流失', '焦慮', '侵蝕'], mean: '某件事正悄悄消耗你——能量、金錢或信任在一點一點流失。', love: '小摩擦持續累積，感情被慢慢啃蝕。', career: '資源流失、效率下降，留意小漏洞。', advice: '找出那個洞，盡快補起來。', pc: '梅花 7', tone: '凶' },
  24: { kw: ['愛', '情感', '真心', '溫暖'], mean: '愛與真心的能量——情感是這件事真正的核心。', love: '真誠的感情，心意相通。', career: '做有熱情的事，人緣是你的助力。', advice: '跟著心走，別讓腦替心做所有決定。', pc: '紅心 J', tone: '吉' },
  25: { kw: ['承諾', '契約', '循環', '連結'], mean: '承諾與約定——可能是感情的定情，也可能是工作的合約。', love: '關係走向承諾，論及交往或婚嫁。', career: '簽約、結盟或長期的合作綁定。', advice: '承諾之前想清楚，承諾之後就守住。', pc: '梅花 A', tone: '吉' },
  26: { kw: ['秘密', '知識', '學習', '未知'], mean: '有尚未揭曉的資訊，也與學習、研究或文件有關。', love: '對方還有你不知道的一面。', career: '進修、研究或需要保密的專案。', advice: '打開那本書之前，先確定你想知道答案。', pc: '方塊 10', tone: '中性' },
  27: { kw: ['訊息', '文件', '書面', '通知'], mean: '書面的訊息即將到來：文件、信件或重要通知。', love: '重要的心意會以文字傳達。', career: '合約、報告或公文往來頻繁。', advice: '白紙黑字，把重要的事寫下來。', pc: '黑桃 7', tone: '中性' },
  28: { kw: ['男性', '當事人', '主動', '陽性'], mean: '代表問卜者本人或這件事裡的關鍵男性人物。', love: '感情中的男方——他的狀態與心意。', career: '關鍵的男性合作者或主管。', advice: '把焦點放回這個人身上。', pc: '紅心 A', tone: '中性' },
  29: { kw: ['女性', '當事人', '直覺', '陰性'], mean: '代表問卜者本人或這件事裡的關鍵女性人物。', love: '感情中的女方——她的狀態與心意。', career: '關鍵的女性合作者或主管。', advice: '把焦點放回這個人身上。', pc: '黑桃 A', tone: '中性' },
  30: { kw: ['平和', '成熟', '純粹', '長者'], mean: '成熟平和的能量，歲月靜好，也與長輩或資歷有關。', love: '細水長流的成熟關係。', career: '資歷、經驗與德望帶來助力。', advice: '慢慢來，比較快。', pc: '黑桃 K', tone: '吉' },
  31: { kw: ['成功', '光明', '能量', '勝利'], mean: '整副牌中最強的吉兆之一：成功、清晰與充沛的能量。', love: '關係明朗溫暖，幸福感高。', career: '事業順利，成果亮眼。', advice: '趁著陽光正好，大步前進。', pc: '方塊 A', tone: '吉' },
  32: { kw: ['名聲', '情緒', '榮譽', '潮汐'], mean: '與名聲、榮譽和深層情緒有關——是被看見的時刻。', love: '浪漫與情緒如潮汐起伏，重視感受。', career: '聲望提升，作品或表現被肯定。', advice: '經營好你的名字，也照顧好你的情緒。', pc: '紅心 8', tone: '吉' },
  33: { kw: ['解答', '關鍵', '必然', '開啟'], mean: '問題的鑰匙已經出現，答案必然揭曉——強烈的肯定訊號。', love: '心結將被打開，關係有解。', career: '找到突破口，事情水到渠成。', advice: '你手上已有鑰匙，去開那扇門。', pc: '方塊 8', tone: '吉' },
  34: { kw: ['財富', '豐盛', '流動', '生意'], mean: '金錢與資源的流動，是豐盛的訊號，也與生意往來有關。', love: '關係資源豐沛，或與金錢議題交纏。', career: '收入增加、生意興隆。', advice: '讓錢流動起來，別只是囤著。', pc: '方塊 K', tone: '吉' },
  35: { kw: ['穩定', '堅持', '長久', '停泊'], mean: '穩穩地錨定——長期而可靠，但也提醒你別僵在原地。', love: '關係穩定長久，安全感十足。', career: '工作穩定，適合深耕。', advice: '穩定是資產，僵化是負債。', pc: '黑桃 9', tone: '吉' },
  36: { kw: ['考驗', '負擔', '命運', '信念'], mean: '沉重的考驗或不得不背的責任，也是信念被鍛鍊的時刻。', love: '感情正經歷考驗，痛，但有意義。', career: '重擔在肩，撐過去就不一樣了。', advice: '這不是懲罰，是修煉。', pc: '梅花 6', tone: '凶' },
};

/* ================= sound & haptic feedback (magic sparkle) ================= */
var _audioCtx = null;
function _actx() {
  _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
function _note(ctx, freq, start, dur, peak) {
  var o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(start); o.stop(start + dur + 0.05);
}
function _shimmer(ctx, start, dur, peak) {
  var sr = ctx.sampleRate, n = Math.floor(sr * dur);
  var buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
  for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  var src = ctx.createBufferSource(); src.buffer = buf;
  var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
  f.frequency.setValueAtTime(900, start);
  f.frequency.exponentialRampToValueAtTime(4200, start + dur);
  var g = ctx.createGain();
  g.gain.setValueAtTime(peak, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f); f.connect(g); g.connect(ctx.destination);
  src.start(start);
}
function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
/* 翻牌：星塵魔法——上行琶音 + 微失諧泛音的閃爍 + 氣音掃頻 + 高鈴尾音 */
function fxFlip() {
  try {
    var ctx = _actx(), t = ctx.currentTime;
    var notes = [1046.5, 1318.5, 1568, 2093, 2637]; // C6 E6 G6 C7 E7
    notes.forEach(function (f2, i) {
      var st = t + i * 0.05;
      _note(ctx, f2, st, 0.55, 0.05);
      _note(ctx, f2 * 2.004, st, 0.4, 0.017); // 微失諧泛音 → 閃爍感
    });
    _shimmer(ctx, t, 0.5, 0.03);
    _note(ctx, 3951, t + 0.3, 0.8, 0.028);   // B7 尾鈴
  } catch (e) {}
  vibrate(25);
}
/* 選牌：輕巧的鈴音一點 */
function fxPick() {
  try {
    var ctx = _actx(), t = ctx.currentTime;
    _note(ctx, 1975.5, t, 0.25, 0.032);
    _note(ctx, 3951, t, 0.18, 0.013);
  } catch (e) {}
  vibrate(12);
}

/* ================= Celtic Cross layout ================= */
var CELTIC_COORDS = [
  { l: 26, t: 34.5, w: 22 },            // 1 現況 (center)
  { l: 26, t: 34.5, w: 22, rot: 1 },    // 2 阻礙 (crossing, rotated)
  { l: 26, t: 69, w: 22 },              // 3 根基 (below)
  { l: 1, t: 34.5, w: 22 },             // 4 過去 (left)
  { l: 26, t: 0, w: 22 },               // 5 目標 (above)
  { l: 51, t: 34.5, w: 22 },            // 6 未來 (right)
  { l: 77, t: 72, w: 20 },              // 7 staff bottom
  { l: 77, t: 48, w: 20 },              // 8
  { l: 77, t: 24, w: 20 },              // 9
  { l: 77, t: 0, w: 20 },               // 10 staff top
];

function renderCelticCross() {
  var h = '<div style="position:relative;width:100%;max-width:420px;margin:18px auto 0;aspect-ratio:10/11.4">';
  state.drawn.forEach(function (d, i) {
    var c = CELTIC_COORDS[i];
    var cardFront = '<div style="position:absolute;inset:2px;border:1px solid #d8b96c;border-radius:5px;overflow:hidden;display:flex;flex-direction:column">'
      + cardImgHtml(d.card.img, d.card.nameZh)
      + '</div>';
    h += '<div onclick="flipCardAt(' + i + ')" style="position:absolute;left:' + c.l + '%;top:' + c.t + '%;width:' + c.w + '%;aspect-ratio:150/230;cursor:pointer;' + (c.rot ? 'transform:rotate(90deg);z-index:2;' : 'z-index:1;') + 'animation:cardIn .4s ease both;animation-delay:' + (i * 0.06) + 's">';
    h += flipBox('card-' + i, d.flipped, 6, sigil('42%', '42%'), cardFront);
    h += '<div style="position:absolute;top:-7px;left:-7px;width:17px;height:17px;border-radius:50%;background:#c9a96e;color:#1a1622;font:600 10px \'Noto Sans TC\',sans-serif;display:flex;align-items:center;justify-content:center;z-index:4">' + (i + 1) + '</div>';
    h += '</div>';
  });
  h += '</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;max-width:420px;margin:16px auto 0;padding:0 4px">';
  state.drawn.forEach(function (d, i) {
    h += '<div id="legend-' + i + '" style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);line-height:1.5">' + (i + 1) + '．' + d.pos.zh + (d.flipped ? '：' + d.card.nameZh + (d.reversed ? '（逆）' : '') : '') + '</div>';
  });
  h += '</div>';
  h += '<div style="text-align:center;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);margin-top:10px">點牌翻面，完整解讀在下方摘要</div>';
  return h;
}

/* ================= shareable result image (canvas) ================= */
function wrapCJK(ctx, text, maxW) {
  var lines = [], cur = '';
  for (var k = 0; k < text.length; k++) {
    var ch = text[k];
    if (ctx.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; }
    else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}
function rr(ctx, x, y, w, h2, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h2, r);
  ctx.arcTo(x + w, y + h2, x, y + h2, r);
  ctx.arcTo(x, y + h2, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* 分享圖只放具體問題的精簡摘要；完整欄位仍保留在「複製給 AI」與歷史紀錄中。 */
function currentSubtopicShareData() {
  if (!state.subtopic || !SUBTOPICS[state.category]) return null;
  var def = (SUBTOPICS[state.category] || []).filter(function (s) { return s.key === state.subtopic; })[0];
  if (!def) return null;
  var cardRes = cardSubtopicReading(state.category, state.subtopic, state.drawn);
  var astroRes = (state.readingMode === 'combined' && state.astroResult)
    ? astroCategoryReading(state.category, state.subtopic, state.astroResult, state.astroUnknownTime) : null;
  var combinedRes = astroRes && astroRes.available
    ? combinedReading(cardRes, astroRes, state.category, state.subtopic) : null;
  var result = combinedRes && combinedRes.available ? combinedRes : (cardRes && cardRes.available ? cardRes : astroRes);
  if (!result || !result.available) return null;
  return {
    title: def.zh,
    conclusion: result.conclusion || '',
    action: result.action || result.favor || '',
  };
}

function shareResultImage() {
  try {
    var drawn = state.drawn;
    if (!drawn.length) return;
    var isTarot = state.deck === 'tarot';
    var W = 750, pad = 44, cw = 148, ch = 227;
    var perRow = drawn.length >= 20 ? 6 : (drawn.length >= 7 ? 4 : Math.min(drawn.length, 3));
    var _scale = drawn.length >= 20 ? 0.68 : 1;
    cw = Math.round(cw * _scale); ch = Math.round(ch * _scale);
    var rows = Math.ceil(drawn.length / perRow);
    var gap = perRow > 1 ? (W - 2 * pad - perRow * cw) / (perRow - 1) : 0;

    var cv = document.createElement('canvas');
    var mctx = cv.getContext('2d');
    mctx.font = '24px "Noto Sans TC", sans-serif';
    var overall = overallReading();
    var oLines = wrapCJK(mctx, overall, W - 2 * pad);
    var subtopicShare = currentSubtopicShareData();
    var subTitleLines = subtopicShare ? wrapCJK(mctx, subtopicShare.title, W - 2 * pad) : [];
    var subConclusionLines = subtopicShare && subtopicShare.conclusion ? wrapCJK(mctx, subtopicShare.conclusion, W - 2 * pad) : [];
    var subActionLines = subtopicShare && subtopicShare.action ? wrapCJK(mctx, '行動提醒：' + subtopicShare.action, W - 2 * pad) : [];
    var qText = (state.target ? '關於「' + state.target + '」' : '') + (state.question ? '「' + state.question + '」' : '');
    var startY = qText ? 216 : 186;
    var subtopicH = subtopicShare ? (62 + subTitleLines.length * 30 + subConclusionLines.length * 34 + subActionLines.length * 32) : 0;
    var H = startY + rows * (ch + 92) + 60 + oLines.length * 38 + subtopicH + 96;
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');

    ctx.fillStyle = '#14111a'; ctx.fillRect(0, 0, W, H);
    var grd = ctx.createRadialGradient(W * 0.2, 60, 10, W * 0.2, 60, 500);
    grd.addColorStop(0, 'rgba(201,169,110,.12)'); grd.addColorStop(1, 'rgba(201,169,110,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(201,169,110,.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(16, 16, W - 32, H - 32);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9a96e'; ctx.font = 'italic 19px Georgia, serif';
    ctx.fillText('M Y S T I C   D E C K', W / 2, 66);
    ctx.fillStyle = '#f0e9d8'; ctx.font = '600 34px "Noto Serif TC", serif';
    ctx.fillText((isTarot ? '塔羅' : '雷諾曼') + '占卜結果', W / 2, 112);
    var spreads = currentSpreads();
    var cat = CATEGORIES.find(function (x) { return x.key === state.category; });
    ctx.fillStyle = 'rgba(240,233,216,.6)'; ctx.font = '19px "Noto Sans TC", sans-serif';
    ctx.fillText((cat ? cat.zh + ' · ' : '') + spreads[state.spread].zh + ' · ' + new Date().toLocaleDateString('zh-TW'), W / 2, 148);
    if (qText) {
      ctx.fillStyle = 'rgba(240,233,216,.45)'; ctx.font = 'italic 18px "Noto Sans TC", sans-serif';
      ctx.fillText(qText.length > 28 ? qText.slice(0, 28) + '…' : qText, W / 2, 182);
    }

    var jobs = drawn.map(function (d, i) {
      return new Promise(function (res) {
        if (!d.card.img) { res({ d: d, i: i, img: null }); return; }
        var im = new Image();
        im.onload = function () { res({ d: d, i: i, img: im }); };
        im.onerror = function () { res({ d: d, i: i, img: null }); };
        im.src = d.card.img;
      });
    });
    Promise.all(jobs).then(function (items) {
      items.forEach(function (it) {
        var i = it.i, d = it.d;
        var r2 = Math.floor(i / perRow), col = i % perRow;
        var rowCount = Math.min(perRow, drawn.length - r2 * perRow);
        var rowW = rowCount * cw + (rowCount - 1) * gap;
        var x = (W - rowW) / 2 + col * (cw + gap);
        var y = startY + r2 * (ch + 92);
        ctx.fillStyle = '#f2e9d8'; rr(ctx, x, y, cw, ch, 8); ctx.fill();
        ctx.strokeStyle = '#d8b96c'; ctx.lineWidth = 1.5; rr(ctx, x, y, cw, ch, 8); ctx.stroke();
        if (it.img) {
          var aw = cw - 14, ah = ch - 14;
          var s = Math.min(aw / it.img.width, ah / it.img.height);
          var dw = it.img.width * s, dh = it.img.height * s;
          ctx.save();
          ctx.translate(x + cw / 2, y + ch / 2);
          if (isTarot && d.reversed) ctx.rotate(Math.PI);
          ctx.drawImage(it.img, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();
        }
        ctx.fillStyle = '#c9a96e'; ctx.font = '14px "Noto Sans TC", sans-serif';
        ctx.fillText(d.pos.zh, x + cw / 2, y + ch + 26);
        ctx.fillStyle = '#f0e9d8'; ctx.font = '600 17px "Noto Serif TC", serif';
        ctx.fillText(d.card.nameZh + (isTarot ? (d.reversed ? '（逆）' : '（正）') : ''), x + cw / 2, y + ch + 50);
      });
      var oy = startY + rows * (ch + 92) + 26;
      ctx.fillStyle = '#e6cd9a'; ctx.font = '600 22px "Noto Serif TC", serif';
      ctx.fillText('✦ 綜合解讀 ✦', W / 2, oy);
      ctx.fillStyle = 'rgba(240,233,216,.9)'; ctx.font = '24px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left';
      oLines.forEach(function (ln, k2) { ctx.fillText(ln, pad, oy + 42 + k2 * 38); });
      var sy = oy + 42 + oLines.length * 38;
      if (subtopicShare) {
        ctx.strokeStyle = 'rgba(201,169,110,.25)'; ctx.beginPath(); ctx.moveTo(pad, sy + 14); ctx.lineTo(W - pad, sy + 14); ctx.stroke();
        sy += 52;
        ctx.fillStyle = '#e6cd9a'; ctx.font = '600 20px "Noto Serif TC", serif'; ctx.textAlign = 'left';
        ctx.fillText('✦ 具體問題', pad, sy);
        ctx.fillStyle = 'rgba(240,233,216,.65)'; ctx.font = '18px "Noto Sans TC", sans-serif';
        subTitleLines.forEach(function (ln, i2) { ctx.fillText(ln, pad, sy + 30 + i2 * 30); });
        sy += 30 + subTitleLines.length * 30;
        ctx.fillStyle = 'rgba(240,233,216,.92)'; ctx.font = '22px "Noto Sans TC", sans-serif';
        subConclusionLines.forEach(function (ln, i3) { ctx.fillText(ln, pad, sy + i3 * 34); });
        sy += subConclusionLines.length * 34 + 8;
        ctx.fillStyle = '#9bc5a3'; ctx.font = '19px "Noto Sans TC", sans-serif';
        subActionLines.forEach(function (ln, i4) { ctx.fillText(ln, pad, sy + i4 * 32); });
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(240,233,216,.35)'; ctx.font = 'italic 15px Georgia, serif';
      ctx.fillText('Mystic Deck · 塔羅 · 雷諾曼', W / 2, H - 42);
      cv.toBlob(function (blob) {
        if (!blob) return;
        var file;
        try { file = new File([blob], '占卜結果.png', { type: 'image/png' }); } catch (e) { file = null; }
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: '塔羅占卜結果' }).catch(function () {});
        } else {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = '占卜結果_' + new Date().toISOString().slice(0, 10) + '.png';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
      }, 'image/png');
    });
  } catch (e) { try { alert('無法產生圖片：' + e.message); } catch (e2) {} }
}

/* ================= image lazy attach (split-asset build) ================= */
function reassignImages() {
  if (typeof IMG === 'undefined' || !IMG || !Object.keys(IMG).length) return;
  var L = { wands: 'W', cups: 'C', swords: 'S', pentacles: 'P' };
  var CODE = { A: '0A', '2': '02', '3': '03', '4': '04', '5': '05', '6': '06', '7': '07', '8': '08', '9': '09', '10': '10', Page: 'J1', Knight: 'J2', Queen: 'QU', King: 'KI' };
  TAROT.forEach(function (c) {
    if (c.arcana === 'major') {
      var n2 = parseInt(c.id.slice(1), 10);
      c.img = IMG['RWSa-T-' + String(n2).padStart(2, '0')] || null;
    } else {
      var l2 = L[c.suit], cd = CODE[c.num];
      c.img = (l2 && cd) ? (IMG['RWSa-' + l2 + '-' + cd] || null) : null;
    }
  });
  LENORMAND.forEach(function (c) { c.img = IMG['LEN-' + String(c.n).padStart(2, '0')] || null; });
}

/* ================= 學習系統:易混淆對比 / 抽認卡測驗 / 22天計畫 ================= */

/* ---- 易混淆牌對比(記憶心法第四頁籤) ---- */
var CONFUSE_DATA = [
  { common: '都是「結束」', cards: [
    { id: 'm13', diff: '漸進的轉化——一個階段自然走完，放下迎新' },
    { id: 'm16', diff: '突然的崩塌——根基不穩的結構瞬間瓦解' },
    { id: 'swords-10', diff: '谷底的終點——痛到底了，之後只會更好' },
  ]},
  { common: '都是「兩人關係」', cards: [
    { id: 'm6', diff: '靈魂層面的契合與重大抉擇，關乎價值觀' },
    { id: 'cups-2', diff: '日常層面的情感連結與相互吸引' },
  ]},
  { common: '都是「力量」', cards: [
    { id: 'm8', diff: '向內的柔性力量——用耐心馴服，而非壓制' },
    { id: 'm7', diff: '向外的意志推進——駕馭對立、衝向目標' },
  ]},
  { common: '都是「引導者」', cards: [
    { id: 'm1', diff: '主動創造——整合手上資源實現目標' },
    { id: 'm5', diff: '傳承指導——依循傳統與體制的智慧' },
  ]},
  { common: '都是「暫停」', cards: [
    { id: 'm9', diff: '主動退隱——自己選擇獨處尋找答案' },
    { id: 'm12', diff: '被動懸置——被迫停下，換個角度看世界' },
  ]},
  { common: '都在「夜空」', cards: [
    { id: 'm17', diff: '希望——風暴後的平靜與療癒' },
    { id: 'm18', diff: '迷霧——不安、幻象與模糊不清' },
    { id: 'm19', diff: '明朗——一切清晰、成功與喜悅' },
  ]},
  { common: '都是「被困住」', cards: [
    { id: 'swords-2', diff: '自己選擇不看——蒙眼迴避抉擇的僵局' },
    { id: 'swords-8', diff: '自己以為出不去——其實束縛鬆綁就能走' },
  ]},
  { common: '都是「不滿足」', cards: [
    { id: 'cups-4', diff: '麻木倦怠——遞到眼前的機會也提不起勁' },
    { id: 'cups-7', diff: '幻想過多——選項太多反而抓不到重點' },
  ]},
  { common: '都是「擁有金錢」', cards: [
    { id: 'pentacles-4', diff: '緊抓不放——守財帶來安全感也帶來僵化' },
    { id: 'pentacles-9', diff: '豐盛獨立——靠自己掙來的餘裕與自在' },
  ]},
  { common: '都是「等待成果」', cards: [
    { id: 'wands-3', diff: '遠眺已啟航的船——布局後的自信期待' },
    { id: 'pentacles-7', diff: '凝視結果的藤——長期投入後的耐心評估' },
  ]},
];

/* ---- 學習進度(掌握度)資料 ---- */
var learnData = {};
try {
  var _savedLearn = JSON.parse(localStorage.getItem('tl_learn') || '{}');
  learnData = _savedLearn && typeof _savedLearn === 'object' && !Array.isArray(_savedLearn) ? _savedLearn : {};
} catch (e) { learnData = {}; }
function learnSave() { try { localStorage.setItem('tl_learn', JSON.stringify(learnData)); } catch (e) {} }
function learnScore(key) { return (learnData[key] && learnData[key].s) || 0; }
function learnMark(key, correct) {
  var d = learnData[key] || { s: 0, n: 0 };
  d.n++;
  d.s = correct ? d.s + 1 : Math.max(0, d.s - 1);
  learnData[key] = d;
  learnSave();
}
function isMastered(key) { return learnScore(key) >= 3; }
function masteredCount(isTarot) {
  var arr = isTarot ? TAROT : LENORMAND;
  return arr.filter(function (c) { return isMastered(isTarot ? c.id : 'l' + c.n); }).length;
}

/* ---- 抽認卡測驗 ---- */
function quizKey(c, isTarot) { return isTarot ? c.id : 'l' + c.n; }

function quizPickCard(isTarot) {
  var arr = isTarot ? TAROT : LENORMAND;
  var session = state.quiz && state.quiz.session;
  var recent = (session && session.recent) || [];
  var okKeys = (session && session.okKeys) || {};
  // 三層防重複:1) 最近出過的題不重複 2) 本回合答對的牌先不再出
  // 3) 掌握度越低,權重越高(間隔重複)
  function buildPool(skipRecent, skipOk) {
    var pool = [];
    arr.forEach(function (c) {
      var key = quizKey(c, isTarot);
      if (skipRecent && recent.indexOf(key) !== -1) return;
      if (skipOk && okKeys[key]) return;
      var w = isMastered(key) ? 1 : Math.max(2, 8 - learnScore(key) * 3);
      for (var i = 0; i < w; i++) pool.push(c);
    });
    return pool;
  }
  var pool = buildPool(true, true);
  if (!pool.length) pool = buildPool(true, false);
  if (!pool.length) pool = buildPool(false, false);
  return pool[Math.floor(Math.random() * pool.length)];
}

function quizMeaning(c, isTarot) {
  if (isTarot) return c.rich ? c.rich.u : c.upZh;
  var lr = LEN_RICH[c.n];
  return lr ? lr.mean : c.mZh;
}
function quizKw(c, isTarot) {
  if (isTarot) return (c.rich ? c.rich.ku : c.upZh.split('、')).slice(0, 3).join('、');
  var lr = LEN_RICH[c.n];
  return (lr ? lr.kw : c.mZh.split('、')).slice(0, 3).join('、');
}

function quizNext() {
  var isTarot = state.libDeck === 'tarot';
  var card = quizPickCard(isTarot);
  var arr = isTarot ? TAROT : LENORMAND;
  var types = ['img', 'meaning', 'kw'];
  var type = types[Math.floor(Math.random() * types.length)];
  if (type === 'img' && !card.img) type = 'kw';
  // 三個干擾項
  var others = arr.filter(function (c) { return c !== card; });
  var distractors = [];
  var used = {};
  while (distractors.length < 3) {
    var d = others[Math.floor(Math.random() * others.length)];
    var k = quizKey(d, isTarot);
    if (used[k]) continue;
    used[k] = 1;
    distractors.push(d);
  }
  var options = distractors.concat([card]);
  // Fisher–Yates
  for (var i = options.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = options[i]; options[i] = options[j]; options[j] = t;
  }
  var session = (state.quiz && state.quiz.session) || { n: 0, correct: 0, streak: 0 };
  session.recent = session.recent || [];
  session.okKeys = session.okKeys || {};
  var newKey = quizKey(card, isTarot);
  session.recent.push(newKey);
  var recentCap = Math.min(isTarot ? 12 : 10, arr.length - 4);
  while (session.recent.length > recentCap) session.recent.shift();
  state.quiz = { card: card, type: type, options: options, answered: null, session: session, lastKey: newKey };
}

function quizStart() {
  state.libQuiz = true;
  state.libSelected = null;
  state.quiz = null;
  quizNext();
  render();
  window.scrollTo(0, 0);
}
function quizExit() { state.libQuiz = false; state.quiz = null; render(); }
function quizGoNext() { quizNext(); render(); window.scrollTo(0, 0); }

function quizAnswer(i) {
  var q = state.quiz;
  if (!q || q.answered !== null) return;
  var isTarot = state.libDeck === 'tarot';
  q.answered = i;
  var correct = q.options[i] === q.card;
  q.session.n++;
  if (correct) {
    q.session.correct++; q.session.streak++;
    q.session.okKeys = q.session.okKeys || {};
    q.session.okKeys[quizKey(q.card, isTarot)] = true;
    fxFlip();
  } else { q.session.streak = 0; vibrate(60); }
  learnMark(quizKey(q.card, isTarot), correct);
  render();
}

function renderQuiz() {
  var isTarot = state.libDeck === 'tarot';
  var q = state.quiz;
  var deckArr = isTarot ? TAROT : LENORMAND;
  var h = '';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px">';
  h += '<button onclick="quizExit()" style="background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;font:400 12px \'Noto Sans TC\',sans-serif;padding:7px 16px;border-radius:16px;cursor:pointer">‹ 離開測驗</button>';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">本回合 ' + q.session.n + ' 題 · 答對 ' + q.session.correct + (q.session.streak >= 3 ? ' · 🔥連對 ' + q.session.streak : '') + '</div>';
  h += '</div>';
  h += '<div style="text-align:center;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);margin-top:8px">已掌握 ' + masteredCount(isTarot) + ' / ' + deckArr.length + ' 張 · 答錯的牌會更常出現</div>';

  // 題目
  var prompt = { img: '這張牌是?', meaning: '哪張牌的牌義是——', kw: '這些關鍵字屬於哪張牌?' }[q.type];
  h += '<div style="text-align:center;margin-top:18px">';
  h += '<div style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8">' + prompt + '</div>';
  if (q.type === 'img') {
    h += '<div style="width:132px;margin:14px auto 0;aspect-ratio:150/230;border-radius:8px;border:1px solid #d8b96c;overflow:hidden;background:#f2e9d8;display:flex;flex-direction:column">' + cardImgHtml(q.card.img, '?') + '</div>';
  } else if (q.type === 'meaning') {
    h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#e6cd9a;margin-top:12px;line-height:1.8;padding:0 8px">「' + esc(quizMeaning(q.card, isTarot)) + '」</div>';
  } else {
    h += '<div style="margin-top:12px">' + quizKw(q.card, isTarot).split('、').map(function (k) {
      return '<span style="display:inline-block;font:500 13px \'Noto Sans TC\',sans-serif;border:1px solid rgba(201,169,110,.5);color:#e6cd9a;border-radius:14px;padding:5px 14px;margin:3px">' + esc(k) + '</span>';
    }).join('') + '</div>';
  }
  h += '</div>';

  // 選項
  h += '<div style="display:flex;flex-direction:column;gap:9px;margin-top:18px">';
  q.options.forEach(function (opt, i) {
    var label = q.type === 'img' || q.type === 'kw'
      ? opt.nameZh + ' <span style="font:italic 11px \'EB Garamond\',serif;opacity:.55">' + opt.nameEn + '</span>'
      : opt.nameZh;
    var border = 'rgba(201,169,110,.3)', bg = 'rgba(255,255,255,.02)', color = 'rgba(240,233,216,.8)';
    if (q.answered !== null) {
      if (opt === q.card) { border = '#9fce9f'; bg = 'rgba(159,206,159,.12)'; color = '#d8f0d8'; }
      else if (i === q.answered) { border = '#d99b5f'; bg = 'rgba(217,155,95,.1)'; color = '#f0d8c0'; }
      else { color = 'rgba(240,233,216,.35)'; }
    }
    h += '<button onclick="quizAnswer(' + i + ')" style="text-align:left;background:' + bg + ';border:1px solid ' + border + ';color:' + color + ';border-radius:10px;padding:12px 15px;cursor:pointer;font:500 13px \'Noto Sans TC\',sans-serif">' + label + '</button>';
  });
  h += '</div>';

  // 答題後:解說 + 下一題
  if (q.answered !== null) {
    var right = q.options[q.answered] === q.card;
    h += '<div style="border:1px solid ' + (right ? 'rgba(159,206,159,.4)' : 'rgba(217,155,95,.4)') + ';border-radius:10px;padding:13px 16px;margin-top:14px;background:rgba(255,255,255,.02)">';
    h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:' + (right ? '#9fce9f' : '#d99b5f') + '">' + (right ? '✓ 答對了!' : '✗ 正確答案:' + q.card.nameZh) + (isMastered(quizKey(q.card, isTarot)) ? ' · 這張牌已掌握 ✦' : '') + '</div>';
    h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.8);margin-top:6px;line-height:1.7">' + esc(q.card.nameZh) + ':' + esc(quizMeaning(q.card, isTarot)) + '</div>';
    h += '<div style="margin-top:8px"><span onclick="openLibCard(\'' + quizKey(q.card, isTarot) + '\')" style="font:400 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;cursor:pointer;border-bottom:1px dotted rgba(201,169,110,.5)">查看完整牌義 →</span></div>';
    h += '</div>';
    h += '<div style="text-align:center;margin-top:16px"><button onclick="quizGoNext()" style="font:500 13px \'Noto Sans TC\',sans-serif;letter-spacing:.06em;background:linear-gradient(120deg,#c9a96e,#e6cd9a);color:#1a1622;border:none;padding:11px 34px;border-radius:22px;cursor:pointer">下一題 →</button></div>';
  }
  return h;
}

/* ---- 22 天大牌學習計畫 ---- */
var studyData = { start: null, done: {} };
try {
  var _savedStudy = JSON.parse(localStorage.getItem('tl_study') || '{"start":null,"done":{}}');
  studyData = _savedStudy && typeof _savedStudy === 'object' && !Array.isArray(_savedStudy)
    ? { start: typeof _savedStudy.start === 'string' ? _savedStudy.start : null,
        done: _savedStudy.done && typeof _savedStudy.done === 'object' && !Array.isArray(_savedStudy.done) ? _savedStudy.done : {} }
    : { start: null, done: {} };
} catch (e) { studyData = { start: null, done: {} }; }
function studySave() { try { localStorage.setItem('tl_study', JSON.stringify(studyData)); } catch (e) {} }
function studyDay() {
  if (!studyData.start) return 0;
  var d = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(studyData.start + 'T00:00:00').getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(22, d));
}
function studyStart() {
  studyData = { start: new Date().toISOString().slice(0, 10), done: {} };
  studySave(); render();
}
function studyRestart() { studyStart(); }
function studyMarkDone() {
  studyData.done[studyDay()] = true;
  studySave(); fxFlip(); render();
}

function renderStudyWidget() {
  var h = '<div style="border:1px solid rgba(201,169,110,.3);border-radius:12px;padding:16px 18px;margin-top:24px;background:rgba(255,255,255,.02)">';
  h += '<div style="display:flex;justify-content:space-between;align-items:baseline">';
  h += '<div style="font:500 13px \'Noto Sans TC\',sans-serif;color:#e6cd9a">🎓 22 天大牌之旅</div>';
  var doneN = Object.keys(studyData.done).length;
  if (studyData.start) h += '<div style="font:italic 10px \'EB Garamond\',serif;color:rgba(240,233,216,.4)">' + doneN + ' / 22</div>';
  h += '</div>';
  if (!studyData.start) {
    h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);margin-top:8px;line-height:1.7">每天認識一張大阿爾克那,22 天打好塔羅基本功。搭配牌義測驗效果更好。</div>';
    h += '<div style="text-align:center;margin-top:12px"><button onclick="studyStart()" style="font:500 12px \'Noto Sans TC\',sans-serif;background:rgba(201,169,110,.15);border:1px solid #c9a96e;color:#f0e9d8;padding:9px 24px;border-radius:18px;cursor:pointer">開始學習計畫</button></div>';
  } else {
    var day = studyDay();
    var allDone = doneN >= 22;
    // 進度條
    h += '<div style="height:4px;border-radius:2px;background:rgba(201,169,110,.15);margin-top:10px;overflow:hidden"><div style="width:' + Math.round(doneN / 22 * 100) + '%;height:100%;background:linear-gradient(90deg,#c9a96e,#e6cd9a)"></div></div>';
    if (allDone) {
      h += '<div style="font:500 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:12px;text-align:center">🎉 恭喜完成 22 張大牌!你已經打下扎實的基礎</div>';
      h += '<div style="text-align:center;margin-top:10px"><button onclick="studyRestart()" style="font:400 11px \'Noto Sans TC\',sans-serif;background:none;border:1px solid rgba(201,169,110,.35);color:rgba(240,233,216,.6);padding:6px 16px;border-radius:14px;cursor:pointer">重新開始一輪</button></div>';
    } else {
      var todayCard = TAROT[day - 1];
      var reviewCard = day > 1 ? TAROT[day - 2] : null;
      var todayDone = !!studyData.done[day];
      h += '<div style="display:flex;align-items:center;gap:12px;margin-top:12px">';
      h += '<div onclick="openLibCard(\'' + todayCard.id + '\')" style="flex:none;width:52px;aspect-ratio:150/230;border-radius:6px;border:1px solid #d8b96c;overflow:hidden;background:#f2e9d8;display:flex;flex-direction:column;cursor:pointer">' + cardImgHtml(todayCard.img, todayCard.nameZh) + '</div>';
      h += '<div style="flex:1;min-width:0">';
      h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45)">第 ' + day + ' 天 · 今日學習</div>';
      h += '<div onclick="openLibCard(\'' + todayCard.id + '\')" style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:2px;cursor:pointer">' + todayCard.nameZh + ' <span style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.5)">' + todayCard.nameEn + '</span></div>';
      if (reviewCard) h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-top:3px">複習昨日:<span onclick="openLibCard(\'' + reviewCard.id + '\')" style="color:#c9a96e;cursor:pointer;border-bottom:1px dotted rgba(201,169,110,.5)">' + reviewCard.nameZh + '</span></div>';
      h += '</div>';
      h += todayDone
        ? '<div style="flex:none;font:500 11px \'Noto Sans TC\',sans-serif;color:#9fce9f">✓ 完成</div>'
        : '<button onclick="studyMarkDone()" style="flex:none;font:500 11px \'Noto Sans TC\',sans-serif;background:rgba(201,169,110,.15);border:1px solid #c9a96e;color:#f0e9d8;padding:7px 13px;border-radius:14px;cursor:pointer">標記完成</button>';
      h += '</div>';
    }
  }
  h += '</div>';
  return h;
}

/* ================= 雷諾曼強化:牌陣 / 組合速查 / 記憶心法 / 大牌陣 ================= */

/* ---- 雷諾曼專屬牌陣(執行期擴充) ---- */
LENORMAND_SPREADS.line5 = { zh: '五張直線', en: 'Line of Five', positions: [
  { zh: '起因', en: 'Origin' }, { zh: '過去', en: 'Past' }, { zh: '現況', en: 'Present' },
  { zh: '發展', en: 'Development' }, { zh: '結果', en: 'Outcome' },
]};
LENORMAND_SPREADS.box9 = { zh: '九宮格', en: 'Nine Box', positions: [
  { zh: '過去的影響', en: 'Past Above' }, { zh: '心中所想', en: 'Mind' }, { zh: '未來的影響', en: 'Future Above' },
  { zh: '過去', en: 'Past' }, { zh: '核心主題', en: 'Core' }, { zh: '未來', en: 'Future' },
  { zh: '過去的根基', en: 'Past Base' }, { zh: '潛藏因素', en: 'Hidden' }, { zh: '發展的結果', en: 'Result' },
]};
LENORMAND_SPREADS.grand = { zh: '大牌陣', en: 'Grand Tableau', positions: (function () {
  var arr = [];
  for (var i = 1; i <= 36; i++) arr.push({ zh: '第' + i + '宮', en: 'House ' + i });
  return arr;
})()};

/* ---- 感情:暗戀與單身桃花牌陣(塔羅) ---- */
TAROT_SPREADS.crush = { zh: '暗戀牌陣', en: 'Secret Crush', positions: [
  { zh: '你的心意', en: 'Your Heart' }, { zh: '對方眼中的你', en: 'In Their Eyes' },
  { zh: '目前的距離', en: 'The Gap' }, { zh: '潛在的阻礙', en: 'Obstacle' },
  { zh: '未來的發展', en: 'Potential' },
]};
TAROT_SPREADS.peach = { zh: '單身桃花牌陣', en: 'New Love', positions: [
  { zh: '現在的你', en: 'Present You' }, { zh: '阻礙桃花的原因', en: 'The Block' },
  { zh: '提升魅力的建議', en: 'Advice' }, { zh: '緣分的走向', en: 'Where It Leads' },
  { zh: '即將出現的對象', en: 'The One Coming' },
]};
SPREAD_DESC.crush = '還沒說出口的心意——看清對方的想法與告白的可能。';
SPREAD_DESC.peach = '單身者專用——找出桃花卡住的原因與緣分的方向。';

SPREAD_DESC.line5 = '經典的五張敘事線，從起因一路讀到結果。';
SPREAD_DESC.box9 = '3×3 方陣，行、列、對角線交叉解讀核心主題。';
SPREAD_DESC.grand = '36 張全展的雷諾曼招牌玩法——不回答單一問題，而是一次看人生全景。適合年度運勢與階段盤點，展開後附新手讀法說明。';

var LEN_RECOMMENDATIONS = {
  love: ['box9', 'three-time', 'line5', 'grand', 'single'],
  career: ['box9', 'three-issue', 'line5', 'grand', 'single'],
  family: ['three-issue', 'box9', 'line5', 'single'],
  health: ['three-mbs', 'line5', 'box9', 'single'],
  wealth: ['three-issue', 'line5', 'box9', 'single'],
  social: ['box9', 'three-time', 'line5', 'single'],
  study: ['three-issue', 'line5', 'box9', 'single'],
  general: ['grand', 'box9', 'line5', 'three-time', 'single'],
};

/* ---- 組合速查器 ---- */
function comboSet(which, val) {
  if (which === 'a') state.comboA = parseInt(val, 10);
  else state.comboB = parseInt(val, 10);
  render();
}
function comboSwap() { var t = state.comboA; state.comboA = state.comboB; state.comboB = t; render(); }

function renderComboLookup() {
  var a = LENORMAND.find(function (c) { return c.n === state.comboA; });
  var b = LENORMAND.find(function (c) { return c.n === state.comboB; });
  var selStyle = 'flex:1;background:#241f2e;border:1px solid rgba(201,169,110,.4);color:#f0e9d8;border-radius:8px;padding:9px 8px;font:500 13px \'Noto Sans TC\',sans-serif;outline:none';
  function options(sel) {
    return LENORMAND.map(function (c) {
      return '<option value="' + c.n + '"' + (c.n === sel ? ' selected' : '') + '>' + c.n + '. ' + c.nameZh + '</option>';
    }).join('');
  }
  var h = '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:13px 14px;margin-top:12px;background:rgba(255,255,255,.02)">';
  h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#e6cd9a">🔍 組合速查 <span style="font:italic 10px \'EB Garamond\',serif;color:rgba(240,233,216,.4)">Pair Lookup</span></div>';
  h += '<div style="display:flex;gap:8px;align-items:center;margin-top:10px">';
  h += '<select onchange="comboSet(\'a\', this.value)" style="' + selStyle + '">' + options(state.comboA) + '</select>';
  h += '<button onclick="comboSwap()" style="flex:none;background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;border-radius:8px;padding:8px 10px;cursor:pointer;font-size:12px" title="交換順序">⇄</button>';
  h += '<select onchange="comboSet(\'b\', this.value)" style="' + selStyle + '">' + options(state.comboB) + '</select>';
  h += '</div>';
  if (a && b && a.n !== b.n) {
    h += '<div style="border:1px solid rgba(201,169,110,.35);border-radius:8px;padding:11px 13px;margin-top:10px;background:rgba(201,169,110,.07)">';
    h += '<div style="font:600 13px \'Noto Serif TC\',serif;color:#f0e9d8">「' + a.nameZh + ' ＋ ' + b.nameZh + '」</div>';
    h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#e6cd9a;margin-top:5px;line-height:1.7">' + esc(lenPairText(a, b)) + '</div>';
    h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-top:7px">反過來讀:「' + b.nameZh + ' ＋ ' + a.nameZh + '」＝' + esc(lenPairText(b, a)) + '</div>';
    h += '</div>';
    h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);margin-top:8px;line-height:1.6">讀法:第一張是主題，第二張為它上色。順序不同，意義也不同。</div>';
  } else if (a && b) {
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-top:10px;text-align:center">請選兩張不同的牌</div>';
  }
  h += '</div>';
  return h;
}

/* ---- 雷諾曼記憶心法 ---- */
var LEN_THEME_GROUPS = [
  { label: '問愛情看這些', hint: '感情議題的核心指標牌', ns: [24, 25, 9, 18, 28, 29] },
  { label: '問工作事業看這些', hint: '職場與成就的指標牌', ns: [14, 19, 35, 31, 15, 33] },
  { label: '問金錢看這些', hint: '財務與資源的指標牌', ns: [34, 15, 2, 23, 4] },
  { label: '訊息與溝通', hint: '消息、文件與言語往來', ns: [1, 27, 26, 12] },
  { label: '人物牌', hint: '代表具體的人', ns: [28, 29, 13, 18, 15] },
  { label: '時間感', hint: '事情的快慢節奏', ns: [1, 10, 8, 5, 35, 21] },
];
var LEN_CONFUSE_DATA = [
  { common: '都是「阻礙」', items: [
    { n: 6, diff: '迷霧般的混亂——看不清，但會散去' },
    { n: 21, diff: '實體的高牆——存在已久，需要翻越或繞行' },
  ]},
  { common: '都「不懷好意」', items: [
    { n: 7, diff: '誘惑與糾纏——彎彎曲曲的複雜關係' },
    { n: 14, diff: '算計與謀生——聰明但為自己打算的人' },
  ]},
  { common: '都是「結束與痛」', items: [
    { n: 8, diff: '自然的落幕——一個階段完整結束' },
    { n: 10, diff: '突然的切斷——快而不可逆的決定' },
    { n: 36, diff: '沉重的考驗——必須背起來走一段的負擔' },
  ]},
  { common: '都是「光亮」', items: [
    { n: 31, diff: '當下的成功——已經照在身上的光' },
    { n: 16, diff: '遠方的希望——指引方向的星光' },
    { n: 32, diff: '被看見的光——名聲、榮譽與情緒' },
  ]},
  { common: '都與「愛」有關', items: [
    { n: 24, diff: '感受層面的愛——心動與真情' },
    { n: 25, diff: '承諾層面的愛——約定、契約與婚姻' },
  ]},
  { common: '都是「資訊」', items: [
    { n: 26, diff: '蓋著的書——祕密、未知、需要學習' },
    { n: 27, diff: '打開的信——明文的訊息與文件' },
  ]},
  { common: '都是「建築」', items: [
    { n: 4, diff: '溫暖的家——歸屬感與私領域' },
    { n: 19, diff: '冰冷的塔——體制、官方與孤高' },
  ]},
  { common: '都是「移動」', items: [
    { n: 17, diff: '狀態的改變——升遷、搬家、蛻變' },
    { n: 3, diff: '空間的移動——旅行、遠方、貿易' },
  ]},
];

function renderLenMnemonic() {
  var h = '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;margin-top:14px;background:rgba(255,255,255,.02);overflow:hidden">';
  h += '<button type="button" onclick="mnToggle()" style="min-height:44px;width:100%;background:none;border:none;padding:12px 15px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">';
  h += '<span style="font:500 13px \'Noto Sans TC\',sans-serif;color:#e6cd9a">🧠 記憶心法 <span style="font:italic 10px \'EB Garamond\',serif;color:rgba(240,233,216,.4)">Mnemonics</span></span>';
  h += '<span style="color:#c9a96e;font-size:11px">' + (state.mnOpen ? '▲ 收起' : '▼ 展開') + '</span>';
  h += '</button>';
  if (state.mnOpen) {
    h += '<div style="padding:0 15px 15px">';
    h += '<div style="display:flex;gap:7px">';
    [['tone', '吉凶速覽'], ['theme', '主題牌組'], ['confuse', '易混淆']].forEach(function (t) {
      var active = state.mnTabLen === t[0];
      h += '<button type="button" onclick="mnSetTabLen(\'' + t[0] + '\')" style="min-height:44px;flex:1;background:' + (active ? 'rgba(201,169,110,.18)' : 'transparent') + ';border:1px solid ' + (active ? '#c9a96e' : 'rgba(201,169,110,.3)') + ';color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.5)') + ';padding:7px 4px;border-radius:8px;cursor:pointer;font:500 12px \'Noto Sans TC\',sans-serif">' + t[1] + '</button>';
    });
    h += '</div>';
    function chip(n, color) {
      var c = LENORMAND.find(function (x) { return x.n === n; });
      return '<span onclick="openLibCard(\'l' + n + '\')" style="display:inline-block;font:400 11px \'Noto Sans TC\',sans-serif;border:1px solid ' + color + ';color:' + color + ';border-radius:11px;padding:3px 9px;margin:3px 3px 0 0;cursor:pointer">' + n + ' ' + c.nameZh + '</span>';
    }
    if (state.mnTabLen === 'tone') {
      [['吉', '#9fce9f', '順著用，是好訊號'], ['中性', 'rgba(240,233,216,.6)', '看前後牌決定方向'], ['凶', '#d99b5f', '提醒與警訊,搭配建議讀']].forEach(function (g) {
        var ns = [];
        for (var n = 1; n <= 36; n++) if (LEN_RICH[n] && LEN_RICH[n].tone === g[0]) ns.push(n);
        h += '<div style="margin-top:12px">';
        h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:' + g[1] + '">' + g[0] + '（' + ns.length + ' 張）<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-left:6px">' + g[2] + '</span></div>';
        h += '<div style="margin-top:4px">' + ns.map(function (n) { return chip(n, g[1]); }).join('') + '</div>';
        h += '</div>';
      });
    } else if (state.mnTabLen === 'theme') {
      LEN_THEME_GROUPS.forEach(function (g) {
        h += '<div style="margin-top:12px">';
        h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + g.label + '<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-left:6px">' + g.hint + '</span></div>';
        h += '<div style="margin-top:4px">' + g.ns.map(function (n) { return chip(n, '#e6cd9a'); }).join('') + '</div>';
        h += '</div>';
      });
    } else {
      LEN_CONFUSE_DATA.forEach(function (g) {
        h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:8px;padding:11px 13px;background:rgba(255,255,255,.02);margin-top:9px">';
        h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + g.common + '，差在哪?</div>';
        g.items.forEach(function (it) {
          var c = LENORMAND.find(function (x) { return x.n === it.n; });
          h += '<div style="display:flex;gap:9px;margin-top:8px;align-items:baseline">';
          h += '<span onclick="openLibCard(\'l' + it.n + '\')" style="flex:none;font:600 12px \'Noto Serif TC\',serif;color:#e6cd9a;cursor:pointer;border-bottom:1px dotted rgba(201,169,110,.4)">' + c.nameZh + '</span>';
          h += '<span style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.65);line-height:1.6">' + it.diff + '</span>';
          h += '</div>';
        });
        h += '</div>';
      });
    }
    h += '</div>';
  }
  h += '</div>';
  return h;
}
function mnSetTabLen(k) { state.mnTabLen = k; render(); }

/* ---- 大牌陣 Grand Tableau ---- */
function gtSetSig(n) { state.gtSig = n; render(); }

function renderGrandTableau() {
  var h = '<div style="margin-top:18px">';
  h += '<div style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px">';
  state.drawn.forEach(function (d, i) {
    var isSig = d.card.n === state.gtSig;
    h += '<button aria-label="查看第 ' + (i + 1) + ' 宮，' + esc(d.card.nameZh) + '的牌義" onclick="openLibCard(\'l' + d.card.n + '\')" style="appearance:none;background:none;border:none;padding:0;color:inherit;text-align:inherit;cursor:pointer;animation:cardIn .4s ease both;animation-delay:' + (i * 0.025) + 's;position:relative">';
    h += '<div style="width:100%;aspect-ratio:150/230;border-radius:4px;border:' + (isSig ? '2px solid #e6cd9a;box-shadow:0 0 10px rgba(230,205,154,.6)' : '1px solid rgba(216,185,108,.45)') + ';overflow:hidden;background:#f2e9d8;display:flex;flex-direction:column">';
    h += d.card.img ? '<img src="' + d.card.img + '" alt="' + esc(d.card.nameZh) + '" style="width:100%;height:100%;object-fit:contain;display:block">' : '';
    h += '</div>';
    h += '<div style="text-align:center;font:400 8px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,' + (isSig ? '.95' : '.45') + ');margin-top:2px;line-height:1.2">' + d.card.nameZh + '</div>';
    h += '</button>';
  });
  h += '</div>';
  h += '<div style="display:flex;justify-content:center;gap:8px;margin-top:14px">';
  [[28, '以「男士」為代表'], [29, '以「女士」為代表']].forEach(function (p) {
    var active = state.gtSig === p[0];
    h += '<button onclick="gtSetSig(' + p[0] + ')" style="background:' + (active ? 'rgba(201,169,110,.18)' : 'transparent') + ';border:1px solid ' + (active ? '#c9a96e' : 'rgba(201,169,110,.3)') + ';color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.5)') + ';padding:7px 14px;border-radius:14px;cursor:pointer;font:500 11px \'Noto Sans TC\',sans-serif">' + p[1] + '</button>';
  });
  h += '</div>';
  h += '<div style="text-align:center;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);margin-top:8px">點任一張牌可查看牌義 · 完整解讀在下方摘要</div>';

  // ---- 新手說明:大牌陣是什麼、怎麼讀 ----
  h += '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;margin-top:14px;background:rgba(255,255,255,.02);overflow:hidden">';
  h += '<button onclick="gtHelpToggle()" style="width:100%;background:none;border:none;padding:12px 15px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">';
  h += '<span style="font:500 13px \'Noto Sans TC\',sans-serif;color:#e6cd9a">❓ 大牌陣是什麼？怎麼讀？</span>';
  h += '<span style="color:#c9a96e;font-size:11px">' + (state.gtHelpOpen ? '▲ 收起' : '▼ 展開') + '</span>';
  h += '</button>';
  if (state.gtHelpOpen) {
    h += '<div style="padding:0 15px 15px">';
    function gtSec(title, body) {
      return '<div style="margin-top:11px"><div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + title + '</div><div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);margin-top:4px;line-height:1.85">' + body + '</div></div>';
    }
    h += gtSec('這是什麼？', '一般牌陣是「問一個問題、抽幾張牌回答」；大牌陣是把 36 張牌<span style="color:#e6cd9a">全部攤開，一次看你人生的全景</span>。愛情、工作、金錢、健康的牌都在桌上，差別只在它們落在哪裡、離你多近。');
    h += gtSec('第一步：找到「你」', '先在牌陣中找到代表你的牌（男士或女士，用上方按鈕切換，發金光的那張就是你）。<span style="color:#e6cd9a">離你越近的牌，影響越強、越即時</span>——「心」貼在你旁邊，感情議題就在你生活正中央；「山」擋在你面前，眼前就有一座要翻的坎。');
    h += gtSec('第二步：看方位', '你身邊四個方向各有含義——<span style="color:#e6cd9a">身後（左）</span>是已經歷的過去、<span style="color:#e6cd9a">面前（右）</span>是即將面對的、<span style="color:#e6cd9a">頭頂（上）</span>是心裡想的、<span style="color:#e6cd9a">腳下（下）</span>是你已掌握的根基。下方摘要的「代表牌的四鄰」已經幫你讀好了。');
    h += gtSec('第三步：看大局', '<span style="color:#e6cd9a">開頭三張牌</span>定這段時期的基調；<span style="color:#e6cd9a">四個角落的牌</span>框住整體大環境。想深入任兩張相鄰的牌，可到牌典用「組合速查」。');
    h += gtSec('什麼時候用它？', '適合<span style="color:#e6cd9a">年度運勢、人生階段盤點</span>，或狀況牽涉很多層面、連自己都說不清該問什麼的時候。反之，問題很具體（例如「這次面試會上嗎」）用單張或九宮格更利落——<span style="color:#e6cd9a">大牌陣是看森林的，不是看一棵樹</span>。');
    h += '</div>';
  }
  h += '</div>';
  h += '</div>';
  return h;
}

function gtHelpToggle() { state.gtHelpOpen = !state.gtHelpOpen; render(); }

function grandPanel() {
  var cards = state.drawn.map(function (d) { return d.card; });
  var h = '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:15px 17px;background:rgba(255,255,255,.02);margin-top:12px">';
  h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#c9a96e;text-transform:uppercase">✧ 大牌陣解讀 Grand Tableau</div>';
  function line(label, txt) {
    return '<div style="margin-top:10px"><span style="font:500 12px \'Noto Sans TC\',sans-serif;color:#e6cd9a">' + label + '</span><div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.85);margin-top:3px;line-height:1.8">' + txt + '</div></div>';
  }
  // 主基調:前三張
  h += line('開場基調（前三張）', '「' + cards[0].nameZh + '＋' + cards[1].nameZh + '」：' + esc(lenPairText(cards[0], cards[1])) + '；「' + cards[1].nameZh + '＋' + cards[2].nameZh + '」：' + esc(lenPairText(cards[1], cards[2])));
  // 代表牌
  var si = cards.findIndex(function (c) { return c.n === state.gtSig; });
  var sig = cards[si];
  var row = Math.floor(si / 9), col = si % 9;
  var houseCard = LENORMAND[si];
  h += line('你的代表牌「' + sig.nameZh + '」', '落在第 ' + (si + 1) + ' 宮（' + houseCard.nameZh + '宮）——整體處境圍繞著「' + esc(LEN_COMBI[houseCard.n].n) + '」的課題。');
  // 四鄰
  var dirs = [];
  if (col > 0) dirs.push('身後（已經歷）：' + cards[si - 1].nameZh + '——' + esc(LEN_COMBI[cards[si - 1].n].n));
  if (col < 8) dirs.push('面前（即將面對）：' + cards[si + 1].nameZh + '——' + esc(LEN_COMBI[cards[si + 1].n].n));
  if (row > 0) dirs.push('頭頂（心之所想）：' + cards[si - 9].nameZh + '——' + esc(LEN_COMBI[cards[si - 9].n].n));
  if (row < 3) dirs.push('腳下（已掌握的根基）：' + cards[si + 9].nameZh + '——' + esc(LEN_COMBI[cards[si + 9].n].n));
  h += line('代表牌的四鄰', dirs.join('<br>'));
  // 四角
  var corners = [cards[0], cards[8], cards[27], cards[35]];
  h += line('框住全局的四角', corners.map(function (c) { return c.nameZh; }).join('、') + '——' + corners.map(function (c) { return esc(LEN_COMBI[c.n].n); }).join('；'));
  h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);margin-top:11px;line-height:1.6">提示:大牌陣裡,離代表牌越近的牌影響越強;可以用上方「組合速查」深入任兩張相鄰的牌。</div>';
  h += '</div>';
  return h;
}

/* ---- 九宮格交叉解讀 ---- */
function box9Panel() {
  var c = state.drawn.map(function (d) { return d.card; });
  if (c.length !== 9) return '';
  function chain(a, b, d2) {
    return '「' + a.nameZh + '＋' + b.nameZh + '」：' + esc(lenPairText(a, b)) + '；「' + b.nameZh + '＋' + d2.nameZh + '」：' + esc(lenPairText(b, d2));
  }
  var h = '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:15px 17px;background:rgba(255,255,255,.02);margin-top:12px">';
  h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#c9a96e;text-transform:uppercase">✧ 九宮格交叉解讀 Nine Box</div>';
  function line(label, txt) {
    return '<div style="margin-top:10px"><span style="font:500 12px \'Noto Sans TC\',sans-serif;color:#e6cd9a">' + label + '</span><div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.85);margin-top:3px;line-height:1.8">' + txt + '</div></div>';
  }
  h += line('核心主題', '「' + c[4].nameZh + '」——' + esc(LEN_RICH[c[4].n] ? LEN_RICH[c[4].n].mean : c[4].mZh));
  h += line('時間軸（中排：過去→現在→未來）', chain(c[3], c[4], c[5]));
  h += line('意識層（上排：想法與影響）', chain(c[0], c[1], c[2]));
  h += line('根基層（下排：底層的暗流）', chain(c[6], c[7], c[8]));
  h += line('對角線（穿越核心的力量）', '「' + c[0].nameZh + '＋' + c[4].nameZh + '＋' + c[8].nameZh + '」與「' + c[2].nameZh + '＋' + c[4].nameZh + '＋' + c[6].nameZh + '」交會於核心——' + esc(lenPairText(c[0], c[8])) + '；' + esc(lenPairText(c[2], c[6])));
  h += '</div>';
  return h;
}

/* ---------- 關於本站 / 隱私 / 清除資料 ---------- */
function aboutToggle() { state.aboutOpen = !state.aboutOpen; render(); }
function clearAllData() {
  try {
    if (!confirm('確定要清除所有紀錄嗎？\n（抽牌歷史、學習進度、22 天計畫、已儲存的星盤出生資料都會刪除，且無法復原）')) return;
  } catch (e) {}
  try {
    localStorage.removeItem('tl_history');
    localStorage.removeItem('tl_learn');
    localStorage.removeItem('tl_study');
    localStorage.removeItem('tl_astro_profile');
  } catch (e) {}
  state.history = [];
  learnData = {};
  studyData = { start: null, done: {} };
  state.astroY = ''; state.astroM = ''; state.astroD = ''; state.astroH = ''; state.astroMin = '';
  state.astroCityQuery = ''; state.astroCityIdx = null; state.astroCityUsed = null;
  state.astroUnknownTime = false; state.astroResult = null; state.astroView = null;
  render();
  try { alert('已清除所有紀錄'); } catch (e) {}
}
function renderAbout() {
  var h = '<div style="text-align:center;margin-top:22px">';
  h += '<button type="button" onclick="aboutToggle()" style="min-height:44px;background:none;border:none;color:rgba(240,233,216,.4);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:8px 4px">關於本站 · 隱私與版權 About</button>';
  h += '</div>';
  if (state.aboutOpen) {
    h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:15px 17px;margin-top:12px;background:rgba(255,255,255,.02);text-align:left">';
    function sec(t, b) {
      return '<div style="margin-top:10px"><div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + t + '</div><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);margin-top:3px;line-height:1.8">' + b + '</div></div>';
    }
    h += '<div style="font:600 13px \'Noto Serif TC\',serif;color:#f0e9d8">Mystic Deck · 塔羅與雷諾曼</div>';
    h += sec('關於本站', '免費的線上塔羅與雷諾曼占卜工具，包含十三種牌陣、完整牌義典藏與牌義學習系統。');
    h += sec('娛樂性質聲明', '占卜結果由固定牌義與程式邏輯組合而成，僅供娛樂與自我反思參考，不構成任何醫療、法律、財務或心理專業建議。重大決定請諮詢專業人士。');
    h += sec('隱私', '本站沒有伺服器、不收集任何個人資料。你的抽牌歷史、學習進度、以及星盤功能使用的出生日期／時間／地點，全部只儲存在你自己裝置的瀏覽器裡，不會上傳或傳送到任何地方。清除瀏覽器資料或按下方按鈕即可完全刪除。（若使用「複製給 AI 解讀」功能，貼到外部 AI 工具後，資料就會離開本站，請自行留意。）');
    h += sec('牌圖版權', '塔羅牌面採用 1909 年出版的 Rider–Waite–Smith 牌（Pamela Colman Smith 繪），已屬公有領域（Public Domain）。雷諾曼牌面則是本站依據傳統 36 張雷諾曼牌的經典象徵（如騎士、房子、心等）重新繪製的原創插畫，非取自任何現有商業牌卡。');
    h += '<div style="text-align:center;margin-top:14px"><button onclick="clearAllData()" style="background:none;border:1px solid rgba(217,155,95,.5);color:#d99b5f;font:400 11px \'Noto Sans TC\',sans-serif;padding:7px 18px;border-radius:14px;cursor:pointer">清除我的所有紀錄</button></div>';
    h += '</div>';
  }
  return h;
}

/* ---------- 塔羅 vs 雷諾曼：不知道要選哪個的人很多，直接放在首頁選擇處說明 ---------- */
function tlGuideToggle() { state.tlGuideOpen = !state.tlGuideOpen; render(); }
function renderTarotLenormandGuide() {
  var h = '<div style="margin-top:16px;border:1px solid rgba(201,169,110,.25);border-radius:12px;padding:14px 16px;background:rgba(255,255,255,.02)">';
  h += '<div role="button" tabindex="0" aria-expanded="' + state.tlGuideOpen + '" onclick="tlGuideToggle()" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();tlGuideToggle()}" style="min-height:44px;display:flex;justify-content:space-between;align-items:center;cursor:pointer">';
  h += '<div style="font:600 12px \'Noto Sans TC\',sans-serif;color:#e6cd9a">不知道要選塔羅還是雷諾曼？點這裡看差別</div>';
  h += '<span style="color:rgba(240,233,216,.4);font:400 12px sans-serif">' + (state.tlGuideOpen ? '︿' : '﹀') + '</span>';
  h += '</div>';
  if (state.tlGuideOpen) {
    h += '<div style="margin-top:12px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.9">塔羅牌共 78 張，22 張大阿爾克那談的是人生的重大主題與內在課題，56 張小阿爾克那則對應日常生活的細節，牌義豐富、還分正逆位，解讀起來比較像深度的心理探索——想搞懂「為什麼會這樣」「我內心真正在意的是什麼」，適合問感情裡的心理狀態、自我探索、需要多角度分析的複雜處境。</div>';
    h += '<div style="margin-top:10px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.9">雷諾曼共 36 張，每張都是船、鑰匙、雲、蛇這類具體的生活物件，沒有正逆位，牌與牌之間像在「造句」，給出的答案直接、務實，比較少心理層面的隱喻——想知道「這件事會不會發生」「大概什麼時候」，適合具體的事件預測、時間點判斷、工作或財務這類務實的生活決策。</div>';
    h += '<div style="margin-top:10px;font:400 12px \'Noto Sans TC\',sans-serif;color:#c9a96e;line-height:1.9">一句話：想深入理解自己選塔羅，想要具體明確的答案選雷諾曼。不確定的話，兩種都抽一次互相參照也可以。</div>';
  }
  h += '</div>';
  return h;
}

/* ---------- views ---------- */

function startQuestionFlow() {
  state.wizardStep = 1;
  state.category = null;
  state.question = '';
  state.target = '';
  state.subtopic = '';
  state.readingMode = 'cards';
  go('reading', state.deck || 'tarot');
}

function toggleHomeMore() { state.homeMoreOpen = !state.homeMoreOpen; render(); }

/* 首次造訪的一次性導覽卡片，做法比照星盤分頁已有的 renderAstroTourCard／
   astroDismissTour——只顯示一次，關掉後記在 localStorage，不會再跳出來 */
function homeDismissTour() {
  state.homeTourDismissed = true;
  try { localStorage.setItem('tl_home_tour_seen', '1'); } catch (e) {}
  render();
}
function renderHomeTourCard() {
  var h = '<div style="margin-top:16px;border:1px solid rgba(201,169,110,.3);border-radius:12px;padding:14px 16px;background:rgba(201,169,110,.05)">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center">';
  h += '<div style="font:600 12px \'Noto Sans TC\',sans-serif;color:#e6cd9a">第一次來嗎？先看這裡</div>';
  h += '<button onclick="homeDismissTour()" aria-label="關閉導覽" style="background:none;border:none;color:rgba(240,233,216,.4);font:400 18px sans-serif;cursor:pointer;line-height:1;padding:0">×</button>';
  h += '</div>';
  [
    ['下方「今日一牌」', '不用填任何資料，點卡片就能直接看'],
    ['「我想問一個問題」', '針對特定困擾，走完整的四步驟占卜'],
    ['「快速占卜」', '不想選來選去，直接抽一張牌看指引'],
    ['底部導覽列', '「星盤」「牌典」也都是獨立功能，隨時可以切換'],
  ].forEach(function (it) {
    h += '<div style="margin-top:8px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.7);line-height:1.6"><span style="color:#c9a96e;font-weight:600">' + it[0] + '</span>　' + it[1] + '</div>';
  });
  h += '<div style="text-align:center;margin-top:10px"><button onclick="homeDismissTour()" style="background:none;border:none;color:rgba(240,233,216,.4);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:0 0 1px">我知道了，不用再顯示</button></div>';
  h += '</div>';
  return h;
}

/* 快速占卜捷徑：跳過 4 步驟精靈的類別／牌陣／問題選擇，直接用「綜合／單張牌」
   這組最通用的預設值進入抽牌畫面。問題與對象保持空白，解讀時會用通用方式呈現
   （既有的確認頁本來就支援「未填寫，將以通用方式解讀」這個情境，見 wizNext 附近）。*/
function quickDraw() {
  state.category = 'general';
  state.subtopic = '';
  state.target = '';
  state.question = '';
  state.readingMode = 'cards';
  state.spread = 'single';
  go('reading', state.deck || 'tarot');
  startReading();
}

/* daily card's full meaning text: prefer the rich (upright/reversed) paragraph,
   fall back to the short zh meaning if no rich entry exists for this card */
function dailyFullMeaning(c, reversed) {
  if (c.rich) return reversed ? c.rich.r : c.rich.u;
  return reversed ? c.revZh : c.upZh;
}

function renderHome() {
  var h = '';
  h += '<div style="padding:0 24px">';

  // ---- primary entry point ----
  h += '<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">';
  h += '<button onclick="startQuestionFlow()" style="font:600 16px \'Noto Serif TC\',serif;letter-spacing:.04em;background:linear-gradient(120deg,#c9a96e,#e6cd9a);color:#1a1622;border:none;padding:22px 22px;border-radius:14px;cursor:pointer;text-align:left">';
  h += '<div>我想問一個問題 →</div><div style="font:italic 11px \'EB Garamond\',serif;opacity:.7;margin-top:3px;font-weight:400">I have a question — start a guided reading</div>';
  h += '</button>';
  h += '<button onclick="quickDraw()" style="min-height:44px;font:500 12px \'Noto Sans TC\',sans-serif;background:none;border:1px solid rgba(201,169,110,.35);color:rgba(240,233,216,.75);padding:10px 18px;border-radius:22px;cursor:pointer;text-align:center">快速占卜 · 直接抽一張牌 <span style="opacity:.6;font-style:italic;font:italic 10px \'EB Garamond\',serif">Quick Draw</span></button>';
  h += '</div>';
  if (!state.homeTourDismissed) h += renderHomeTourCard();

  // ---- daily card, always shown, no click needed ----
  var c = dailyCard;
  var meaningZh = dailyReversed ? c.revZh : c.upZh;
  var meaningEn = dailyReversed ? c.revEn : c.upEn;
  var todayLabel = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' });
  h += '<div id="daily-card-block" style="margin-top:28px">';
  h += '<div style="text-align:center;font:italic 12px \'EB Garamond\',serif;color:rgba(240,233,216,.5);margin-bottom:16px">' + esc(todayLabel) + '・今日一牌 Daily Card</div>';
  var frontInner = '<div style="position:absolute;inset:4px;border:1px solid #d8b96c;border-radius:7px;overflow:hidden;display:flex;flex-direction:column">'
    + cardImgHtml(c.img, c.nameZh + ' ' + c.nameEn)
    + '<div style="flex:none;background:#f2e9d8;padding:8px 6px 10px;text-align:center;border-top:1px solid #d8b96c">'
    + '<div style="font:600 11px \'Noto Serif TC\',serif;color:#8a6f47">' + esc(c.num) + '</div>'
    + '<div style="font:600 15px \'Noto Serif TC\',serif;color:#4a3826;margin-top:2px">' + esc(c.nameZh) + '</div>'
    + '<div style="font:italic 10px \'EB Garamond\',serif;color:#a9784f">' + esc(c.nameEn) + '</div>'
    + '<div style="font:500 10px \'Noto Sans TC\',sans-serif;color:#8a6f47;margin-top:4px">' + (dailyReversed ? '逆位 Reversed' : '正位 Upright') + '</div>'
    + '</div></div>';
  h += '<div role="button" tabindex="0" aria-label="翻開或收起今日一牌" aria-pressed="' + state.dailyFlipped + '" onclick="toggleDailyFlip()" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();toggleDailyFlip()}" style="margin:0 auto;width:170px;height:262px;cursor:pointer;position:relative">';
  h += flipBox('daily', state.dailyFlipped, 10, sigil(76, 76), frontInner);
  h += '</div>';
  h += '<div id="daily-meaning" style="text-align:center;margin-top:16px;padding:0 20px;display:' + (state.dailyFlipped ? 'block' : 'none') + '">';
  h += '<div style="font:600 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8">' + esc(meaningZh) + '</div>';
  h += '<div style="font:italic 12px \'EB Garamond\',serif;color:rgba(240,233,216,.5);margin-top:3px">' + esc(meaningEn) + '</div>';
  h += '</div>';
  h += '<div style="margin-top:18px;display:flex;flex-direction:column;gap:10px;padding:0 4px">';
  h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:12px 15px;background:rgba(255,255,255,.02)">';
  h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.06em;color:#c9a96e">為什麼是這張牌 <span style="opacity:.55;font-style:italic">Why this card</span></div>';
  h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);margin-top:6px;line-height:1.85;text-align:justify">今天是「' + esc(todayLabel) + '」，宇宙把這一天的訊息，摺進了這張牌裡。它不是隨機翻出來的——今天無論你什麼時候打開，遇見的都會是它；等到明天，時間翻頁，才會換下一張牌與你相遇。就把它當作今天專屬於你的一次低語。</div>';
  h += '</div>';
  h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:12px 15px;background:rgba(255,255,255,.02)">';
  h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.06em;color:#c9a96e">這張牌的意義 <span style="opacity:.55;font-style:italic">Card Meaning</span></div>';
  h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);margin-top:6px;line-height:1.85;text-align:justify">' + esc(dailyFullMeaning(c, dailyReversed)) + '</div>';
  h += '</div>';
  h += '</div>';
  h += '</div>';

  // ---- everything else, collapsed by default ----
  h += '<div style="margin-top:32px;border-top:1px solid rgba(201,169,110,.15);padding-top:16px">';
  h += '<div role="button" tabindex="0" aria-expanded="' + state.homeMoreOpen + '" onclick="toggleHomeMore()" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();toggleHomeMore()}" style="min-height:44px;display:flex;justify-content:space-between;align-items:center;cursor:pointer">';
  h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.08em;color:rgba(240,233,216,.5)">更多功能 More</div>';
  h += '<span style="color:#c9a96e;font-size:12px">' + (state.homeMoreOpen ? '︿ 收合' : '﹀ 展開') + '</span>';
  h += '</div>';
  if (state.homeMoreOpen) {
    /* 塔羅百科／星盤已經各自是底部導覽列的獨立分頁，這裡不再重複列出同一個
       目的地，避免使用者以為底部「更多」跟這裡是兩份不一樣的清單 */
    h += '<div style="display:flex;flex-direction:column;gap:10px;margin-top:14px">';
    h += '<button onclick="go(\'reading\',\'tarot\')" style="font:500 14px \'Noto Sans TC\',sans-serif;background:rgba(255,255,255,.02);color:#f0e9d8;border:1px solid rgba(201,169,110,.3);padding:13px 16px;border-radius:10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center"><span>塔羅牌占卜 <span style="font:italic 10px \'EB Garamond\',serif;opacity:.5">Tarot Reading</span></span><span>›</span></button>';
    h += '<button onclick="go(\'reading\',\'lenormand\')" style="font:500 14px \'Noto Sans TC\',sans-serif;background:rgba(255,255,255,.02);color:#f0e9d8;border:1px solid rgba(201,169,110,.3);padding:13px 16px;border-radius:10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center"><span>雷諾曼占卜 <span style="font:italic 10px \'EB Garamond\',serif;opacity:.5">Lenormand Reading</span></span><span>›</span></button>';
    h += '<button onclick="go(\'history\')" style="font:500 14px \'Noto Sans TC\',sans-serif;background:rgba(255,255,255,.02);color:#f0e9d8;border:1px solid rgba(201,169,110,.3);padding:13px 16px;border-radius:10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center"><span>歷史紀錄 <span style="font:italic 10px \'EB Garamond\',serif;opacity:.5">History</span></span><span>›</span></button>';
    h += '</div>';
    h += renderTarotLenormandGuide();
    h += renderStudyWidget();
    h += '<div style="text-align:center;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);margin-top:18px;line-height:1.8;padding:0 10px">初次接觸塔羅嗎？建議先到底部導覽列的「牌典」認識大阿爾克那 22 張牌，<br>再回來開始占卜，解讀會更容易上手。</div>';
    h += renderAbout();
  }
  h += '</div>';

  h += '</div>';
  return h;
}

function toggleDailyFlip() {
  state.dailyFlipped = !state.dailyFlipped;
  doFlip('daily', state.dailyFlipped);
  document.getElementById('daily-meaning').style.display = state.dailyFlipped ? 'block' : 'none';
}

/* ---------- reading ---------- */

/* ================= guided question flow (4-step wizard) ================= */

function wizProgress() {
  var h = '<div style="display:flex;gap:6px;margin-top:22px">';
  for (var i = 1; i <= 4; i++) h += '<div style="flex:1;height:3px;border-radius:2px;background:' + (i <= state.wizardStep ? '#c9a96e' : 'rgba(201,169,110,.18)') + '"></div>';
  return h + '</div>';
}

function wizBtns(showBack, nextOk, nextLabel, nextFn) {
  var h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:22px">';
  h += showBack
    ? '<button type="button" onclick="wizBack()" style="min-height:44px;font:400 12px \'Noto Sans TC\',sans-serif;background:none;border:1px solid rgba(201,169,110,.35);color:rgba(240,233,216,.6);padding:9px 20px;border-radius:22px;cursor:pointer">上一步</button>'
    : '<span></span>';
  h += '<button type="button" onclick="' + nextFn + '"' + (nextOk ? '' : ' disabled') + ' style="min-height:44px;font:500 13px \'Noto Sans TC\',sans-serif;letter-spacing:.06em;background:linear-gradient(120deg,#c9a96e,#e6cd9a);color:#1a1622;border:none;padding:11px 30px;border-radius:22px;cursor:pointer;opacity:' + (nextOk ? '1' : '.35') + '">' + nextLabel + '</button>';
  return h + '</div>';
}

/* Phase 1C（愛情）／Phase 2B（事業）共用的解讀來源選擇器，在有星盤引擎的分類於問題輸入步驟
   顯示。「牌卡＋我的星盤」只有 state.astroResult 存在時才可選——沒有星盤絕不能選，也絕不臨時
   生成假星盤；沒有星盤時顯示為不可用按鈕，並提供「先建立我的星盤」導向星盤分頁的入口。
   go('astro') 只是切換 state.tab，resetReading() 不會清除 category／question／subtopic／
   wizardStep，所以之後從星盤分頁切回占卜分頁時，這裡填到一半的資訊會保留。原名
   renderLoveModePicker，Phase 2B 起改為通用名稱；行為對 love 完全不變。 */
function renderModePicker() {
  var hasAstro = !!state.astroResult;
  var cardsActive = state.readingMode === 'cards';
  var combinedActive = state.readingMode === 'combined';
  var h = '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:14px">解讀來源</div>';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.42);margin-top:4px;line-height:1.6">牌卡著重目前情境；加入星盤後，會再補充你的長期性格與行動傾向。</div>';
  h += '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;align-items:center">';
  h += '<button type="button" aria-pressed="' + cardsActive + '" onclick="wizSetReadingMode(\'cards\')" style="min-height:44px;font:500 12px \'Noto Sans TC\',sans-serif;background:' + (cardsActive ? 'rgba(201,169,110,.18)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (cardsActive ? '#c9a96e' : 'rgba(201,169,110,.3)') + ';color:' + (cardsActive ? '#f0e9d8' : 'rgba(240,233,216,.6)') + ';padding:8px 14px;border-radius:22px;cursor:pointer">牌卡解讀</button>';
  if (hasAstro) {
    h += '<button type="button" aria-pressed="' + combinedActive + '" onclick="wizSetReadingMode(\'combined\')" style="min-height:44px;font:500 12px \'Noto Sans TC\',sans-serif;background:' + (combinedActive ? 'rgba(201,169,110,.18)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (combinedActive ? '#c9a96e' : 'rgba(201,169,110,.3)') + ';color:' + (combinedActive ? '#f0e9d8' : 'rgba(240,233,216,.6)') + ';padding:8px 14px;border-radius:22px;cursor:pointer">牌卡＋我的星盤</button>';
  } else {
    h += '<button type="button" disabled aria-disabled="true" title="需要先建立你的星盤才能使用" style="min-height:44px;font:500 12px \'Noto Sans TC\',sans-serif;background:rgba(255,255,255,.02);border:1px dashed rgba(201,169,110,.25);color:rgba(240,233,216,.3);padding:8px 14px;border-radius:22px;cursor:not-allowed">牌卡＋我的星盤</button>';
    h += '<button type="button" onclick="go(\'astro\')" style="min-height:44px;font:400 11px \'Noto Sans TC\',sans-serif;background:none;border:none;color:#c9a96e;cursor:pointer;border-bottom:1px dotted #c9a96e;padding:8px 2px">先建立我的星盤 →</button>';
  }
  h += '</div>';
  return h;
}

/* Phase 1A（愛情）／Phase 2A（事業）共用的具體子問題選擇器，只在 SUBTOPICS 有定義該分類時
   於問題輸入步驟顯示。依目前 state.readingMode 只列出 SUBTOPICS[state.category] 中 modes
   包含該模式的項目；再次點選同一個可取消選取。非 love 分類目前沒有模式切換 UI，
   wizSetCat() 切換分類時已把 readingMode 重設為 'cards'，所以這裡永遠只會列出 cards 子問題，
   career-talent（modes 只有 astro/combined）自然不會出現。原名 renderLoveSubtopicPicker，
   Phase 2A 起改為通用名稱；行為對 love 完全不變。 */
function renderSubtopicPicker() {
  var options = (SUBTOPICS[state.category] || []).filter(function (s) { return s.modes.indexOf(state.readingMode) !== -1; });
  if (!options.length) return '';
  var h = '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:14px">想深入了解的具體問題（選填，可再次點選取消）</div>';
  h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">';
  options.forEach(function (s) {
    var active = state.subtopic === s.key;
    h += '<button type="button" aria-pressed="' + active + '" onclick="wizToggleSubtopic(\'' + s.key + '\')" style="min-height:44px;display:inline-flex;align-items:center;font:400 11px \'Noto Sans TC\',sans-serif;background:' + (active ? 'rgba(201,169,110,.22)' : 'rgba(201,169,110,.08)') + ';border:1px solid ' + (active ? '#e6cd9a' : 'rgba(201,169,110,.3)') + ';color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.7)') + ';padding:8px 12px;border-radius:22px;cursor:pointer">' + (active ? '✓ ' : '') + esc(s.zh) + '</button>';
  });
  h += '</div>';
  return h;
}

function renderWizard(spreads, isTarot) {
  var h = wizProgress();
  h += '<div style="font:500 10px \'Noto Sans TC\',sans-serif;letter-spacing:.18em;color:#c9a96e;margin-top:20px">STEP ' + state.wizardStep + ' / 4</div>';

  if (state.wizardStep === 1) {
    h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);margin-top:6px">選擇牌組（不確定可先看下方差異說明）</div>';
    h += '<div style="display:flex;gap:8px;margin-top:8px">';
    h += '<button type="button" onclick="wizSetDeck(\'tarot\')" style="min-height:44px;flex:1;text-align:center;background:' + (isTarot ? 'rgba(201,169,110,.15)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (isTarot ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';border-radius:10px;padding:9px;cursor:pointer;font:500 12px \'Noto Sans TC\',sans-serif;color:' + (isTarot ? '#f0e9d8' : 'rgba(240,233,216,.6)') + '">塔羅牌 Tarot</button>';
    h += '<button type="button" onclick="wizSetDeck(\'lenormand\')" style="min-height:44px;flex:1;text-align:center;background:' + (!isTarot ? 'rgba(201,169,110,.15)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (!isTarot ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';border-radius:10px;padding:9px;cursor:pointer;font:500 12px \'Noto Sans TC\',sans-serif;color:' + (!isTarot ? '#f0e9d8' : 'rgba(240,233,216,.6)') + '">雷諾曼牌 Lenormand</button>';
    h += '</div>';
    h += renderTarotLenormandGuide();
    h += '<div style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:18px">你想詢問的是哪個面向？</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px">';
    CATEGORIES.forEach(function (cat) {
      var active = cat.key === state.category;
      h += '<button onclick="wizSetCat(\'' + cat.key + '\')" style="text-align:left;background:' + (active ? 'rgba(201,169,110,.15)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (active ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';border-radius:10px;padding:11px 13px;cursor:pointer">';
      h += '<div style="font:500 13px \'Noto Sans TC\',sans-serif;color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.75)') + '">' + cat.icon + ' ' + cat.zh + '</div>';
      h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-top:3px;line-height:1.5">' + cat.desc + '</div>';
      h += '</button>';
    });
    h += '</div>';
    if (!state.category) {
      h += '<div role="status" style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-top:8px;text-align:right">請先選擇一個想詢問的面向，才能繼續下一步</div>';
    }
    h += wizBtns(false, !!state.category, '下一步', 'wizNext()');

  } else if (state.wizardStep === 2) {
    h += '<div style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:6px">推薦適合這類問題的牌陣</div>';
    var recSrc = state.deck === 'lenormand' ? LEN_RECOMMENDATIONS : RECOMMENDATIONS;
    var recs = (recSrc[state.category] || []).filter(function (k) { return !!spreads[k]; });
    if (!recs.length) recs = Object.keys(spreads);
    h += '<div style="display:flex;flex-direction:column;gap:9px;margin-top:14px">';
    recs.forEach(function (key) {
      var sp = spreads[key];
      var active = key === state.spread;
      h += '<button onclick="wizSetSpread(\'' + key + '\')" style="text-align:left;background:' + (active ? 'rgba(201,169,110,.15)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (active ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';border-radius:10px;padding:12px 14px;cursor:pointer">';
      h += '<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font:500 13px \'Noto Sans TC\',sans-serif;color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.8)') + '">' + sp.zh + '</span><span style="font:italic 10px \'EB Garamond\',serif;color:#c9a96e">' + sp.positions.length + ' 張牌</span></div>';
      h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);margin-top:4px;line-height:1.5">' + (SPREAD_DESC[key] || '') + '</div>';
      var posLine = sp.positions.length > 10
        ? '免選牌 · 洗牌後 36 張自動排成 9×4 陣 · 找到代表你的牌，讀它的四鄰與全局'
        : sp.positions.map(function (p2) { return p2.zh; }).join(' · ');
      h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);margin-top:3px">' + posLine + '</div>';
      h += '</button>';
    });
    h += '</div>';
    h += wizBtns(true, !!spreads[state.spread] && recs.indexOf(state.spread) !== -1, '下一步', 'wizNext()');

  } else if (state.wizardStep === 3) {
    var tmpl = QUESTION_TEMPLATES[state.category] || QUESTION_TEMPLATES.general;
    var targetCfg = TARGET_FIELD_CONFIG[state.category];
    h += '<div style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:6px">具體描述你想問的問題</div>';
    if (targetCfg) {
      h += '<label for="target-input" style="display:block;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:14px">' + targetCfg.label + '</label>';
      h += '<input id="target-input" maxlength="80" value="' + esc(state.target) + '" oninput="state.target=this.value.slice(0,80)" placeholder="' + targetCfg.placeholder + '" style="width:100%;box-sizing:border-box;margin-top:6px;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:10px 13px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    }
    if (['love', 'career', 'family', 'wealth', 'health', 'social', 'study', 'general'].indexOf(state.category) !== -1) {
      /* 已完成牌卡＋星盤引擎的分類皆顯示解讀來源選擇器。 */
      h += renderModePicker();
      h += renderSubtopicPicker();
    } else if (SUBTOPICS[state.category]) {
      /* 其他有 SUBTOPICS 定義但尚未做星盤引擎的分類：只顯示子問題選擇器，
         沒有模式切換 UI，renderSubtopicPicker() 依 state.readingMode（此時恆為 'cards'）
         過濾，astro-only 的子問題自然不會出現。 */
      h += renderSubtopicPicker();
    }
    h += '<label for="question-input" style="display:block;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:14px">具體問題（選填，可點下方範例）</label>';
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.42);margin-top:4px;line-height:1.6">可以只選上方的具體問題，也可以自行輸入；兩者都有填寫時，解讀會一起參考。</div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">';
    tmpl.chips.forEach(function (c2, i2) {
      h += '<button type="button" onclick="wizChip(' + i2 + ')" style="min-height:44px;display:inline-flex;align-items:center;font:400 11px \'Noto Sans TC\',sans-serif;background:rgba(201,169,110,.08);border:1px solid rgba(201,169,110,.3);color:rgba(240,233,216,.7);padding:8px 12px;border-radius:22px;cursor:pointer">' + c2 + '</button>';
    });
    h += '</div>';
    h += '<textarea id="question-input" maxlength="300" aria-describedby="q-hint q-count" oninput="updateQHint(this.value)" placeholder="' + tmpl.placeholder + '" style="width:100%;box-sizing:border-box;margin-top:10px;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:11px 14px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none;min-height:74px;resize:vertical">' + esc(state.question) + '</textarea>';
    h += '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">';
    h += '<div id="q-hint" aria-live="polite" style="flex:1;font:400 11px \'Noto Sans TC\',sans-serif;margin-top:7px;line-height:1.6;min-height:16px"></div>';
    h += '<div id="q-count" aria-live="polite" style="flex:none;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);margin-top:8px">' + Math.min(state.question.length, 300) + ' / 300</div></div>';
    if (!isTarot) {
      var ranges = [['week','一週內'],['month','一個月內'],['quarter','三個月內'],['half','半年內'],['open','不限時間']];
      h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:14px">想看的時間範圍</div>';
      h += '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:8px">';
      ranges.forEach(function (r) { var active = state.timeframe === r[0]; h += '<button type="button" aria-pressed="' + active + '" onclick="wizSetTimeframe(\'' + r[0] + '\')" style="min-height:44px;font:400 11px \'Noto Sans TC\',sans-serif;background:' + (active ? 'rgba(201,169,110,.18)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (active ? '#c9a96e' : 'rgba(201,169,110,.3)') + ';color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.6)') + ';padding:8px 12px;border-radius:22px;cursor:pointer">' + r[1] + '</button>'; });
      h += '</div>';
    }
    h += wizBtns(true, true, '下一步', 'wizNext()');

  } else {
    var cat4 = CATEGORIES.find(function (x) { return x.key === state.category; });
    var sp2 = spreads[state.spread];
    h += '<div style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:6px">確認後開始抽牌</div>';
    h += '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:6px 16px;margin-top:14px;background:rgba(255,255,255,.02)">';
    var row = function (k, v) { return '<div style="display:flex;justify-content:space-between;gap:14px;padding:9px 0;border-bottom:1px solid rgba(201,169,110,.12)"><span style="flex:none;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45)">' + k + '</span><span style="font:400 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8;text-align:right;line-height:1.5">' + v + '</span></div>'; };
    h += row('牌組', state.deck === 'tarot' ? '塔羅牌' : '雷諾曼牌');
    h += row('類別', (cat4 ? cat4.icon + ' ' + cat4.zh : ''));
    h += row('牌陣', sp2.zh + '（' + sp2.positions.length + ' 張）');
    if (!isTarot) h += row('時間範圍', timeframeLabel());
    if (state.target) h += row('對象', esc(state.target));
    h += row('問題', state.question ? esc(state.question) : '<span style="color:rgba(240,233,216,.4)">（未填寫，將以通用方式解讀）</span>');
    h += '</div>';
    h += wizBtns(true, true, '開始抽牌 →', 'startReading()');
  }

  if (state.wizardStep > 1) {
    h += '<div style="text-align:center;margin-top:16px"><button type="button" onclick="wizRestart()" style="min-height:44px;background:none;border:none;color:rgba(240,233,216,.35);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:8px 6px">重新開始 Restart</button></div>';
  }
  return h;
}

function wizSetDeck(d) {
  if (state.deck !== d) { state.deck = d; state.spread = 'single'; }
  render();
}
function wizSetCat(k) {
  if (state.category !== k) {
    state.category = k; state.target = ''; state.subtopic = ''; state.readingMode = 'cards';
    var recSource = state.deck === 'lenormand' ? LEN_RECOMMENDATIONS : RECOMMENDATIONS;
    var firstRecommended = (recSource[k] || [])[0];
    if (firstRecommended) state.spread = firstRecommended;
  }
  render();
}
function wizToggleSubtopic(key) {
  state.subtopic = (state.subtopic === key) ? '' : key;
  render();
}
/* combined 模式只在目前分類（愛情或事業）已經有 state.astroResult 時才允許選取——沒有星盤
   絕不能選，也絕不臨時生成假星盤。切換模式後，若目前選取的 subtopic 在新模式下不支援，
   安全清除它（例如 career-talent 只有 astro/combined，切回 cards 時會被清除）。 */
function wizSetReadingMode(mode) {
  if (mode === state.readingMode) return;
  if (mode === 'combined' && !state.astroResult) return;
  state.readingMode = mode;
  var def = (SUBTOPICS[state.category] || []).filter(function (s) { return s.key === state.subtopic; })[0];
  if (state.subtopic && (!def || def.modes.indexOf(mode) === -1)) state.subtopic = '';
  render();
}
function wizSetSpread(k) { state.spread = k; render(); }
function wizSetTimeframe(k) { state.timeframe = k; render(); }
function timeframeLabel() { return ({week:'一週內',month:'一個月內',quarter:'三個月內',half:'半年內',open:'不限時間'})[state.timeframe] || '一個月內'; }
function wizNext() {
  if (state.wizardStep === 1 && !state.category) return;
  if (state.wizardStep === 3) {
    var targetInput = document.getElementById('target-input');
    if (targetInput) state.target = targetInput.value.trim().slice(0, 80);
    var ta = document.getElementById('question-input');
    if (ta) state.question = ta.value.trim().slice(0, 300);
  }
  state.wizardStep = Math.min(4, state.wizardStep + 1);
  render(); window.scrollTo(0, 0);
}
function wizBack() { state.wizardStep = Math.max(1, state.wizardStep - 1); render(); }
function wizRestart() {
  state.wizardStep = 1; state.category = null; state.question = ''; state.target = ''; state.subtopic = ''; state.readingMode = 'cards';
  resetReading(); render(); window.scrollTo(0, 0);
}
function wizChip(i) {
  var t = (QUESTION_TEMPLATES[state.category] || QUESTION_TEMPLATES.general).chips[i];
  state.question = t;
  var ta = document.getElementById('question-input');
  if (ta) ta.value = t;
  updateQHint(t);
}
function updateQHint(v) {
  state.question = String(v || '').slice(0, 300);
  var hint = document.getElementById('q-hint');
  var count = document.getElementById('q-count');
  if (count) count.textContent = state.question.length + ' / 300';
  if (!hint) return;
  if (!state.question.trim()) { hint.textContent = ''; return; }
  var issue = isQuestionVague(state.question);
  if (issue === 'short') { hint.style.color = '#d99b5f'; hint.textContent = '問題有點簡短，試著加入具體對象、時間範圍或情境，解讀會更貼近你的處境。'; }
  else if (issue === 'vague') { hint.style.color = '#d99b5f'; hint.textContent = '這個問題偏籠統，建議聚焦成一個更明確的面向。'; }
  else { hint.style.color = '#9fce9f'; hint.textContent = '問題夠具體，可以繼續下一步。'; }
}

function openLibCard(key) {
  state.tab = 'library';
  state.libQuiz = false;
  state.libDeck = /^l\d+$/.test(key) ? 'lenormand' : 'tarot';
  state.libSuit = 'all';
  state.libSelected = key;
  render(); window.scrollTo(0, 0);
}

function currentSpreads() {
  return state.deck === 'tarot' ? TAROT_SPREADS : LENORMAND_SPREADS;
}

function renderReading() {
  var isTarot = state.deck === 'tarot';
  var spreads = currentSpreads();
  if (!spreads[state.spread]) state.spread = 'single';
  var h = '';
  h += '<div style="padding:0 20px">';
  h += '<h2 style="font:600 18px \'Noto Serif TC\',serif;color:#f0e9d8;text-align:center;margin:0">' + (isTarot ? '塔羅牌占卜' : '雷諾曼占卜') + '</h2>';
  h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.45);text-align:center;margin-top:2px">' + (isTarot ? 'Tarot Reading' : 'Lenormand Reading') + '</div>';

  // guided 4-step wizard replaces the old pickers (setup phase only)
  if (state.phase === 'setup') {
    h += renderWizard(spreads, isTarot);
  }

  // focus phase: breathing guidance before the shuffle
  if (state.phase === 'focus') {
    h += '<div style="text-align:center;margin-top:52px;animation:fadeUp 1s ease both">';
    h += '<div style="display:inline-block;animation:focusPulse 2.2s ease-in-out infinite">' + sigil(64, 64) + '</div>';
    h += '<div style="font:500 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:24px;letter-spacing:.1em;line-height:2.1">深呼吸，在心中默唸題目<br>宇宙正在替你解答</div>';
    h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.45);margin-top:8px">Take a breath. The universe is listening.</div>';
    h += '</div>';
  }

  // shuffling animation
  if (state.phase === 'shuffling') {
    h += '<div style="text-align:center;margin-top:30px;animation:fadeUp .5s ease both">';
    h += '<div style="font:400 12px \'Noto Serif TC\',serif;color:rgba(240,233,216,.55);letter-spacing:.12em;margin-bottom:20px">宇宙正在替你解答⋯</div>';
    h += '<div style="position:relative;height:190px">';
    [['shufL', 0], ['shufR', 0.12], ['shufM', 0.24]].forEach(function (a) {
      h += '<div style="position:absolute;left:50%;top:0;transform:translate(-50%,0);width:118px;height:182px;border-radius:8px;border:1px solid #c9a96e;background:linear-gradient(160deg,#241f2e,#1a1622);display:flex;align-items:center;justify-content:center;animation:' + a[0] + ' 1.1s ease-in-out ' + a[1] + 's infinite;box-shadow:0 4px 18px rgba(0,0,0,.45)">' + sigil(46, 46) + '</div>';
    });
    h += '</div>';
    h += '<div style="font:500 13px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:14px;letter-spacing:.15em">洗牌中⋯</div>';
    h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.45);margin-top:3px">Shuffling the deck</div>';
    h += '</div>';
  }

  // picking phase: the deck fanned out across the table, like a real reading
  if (state.phase === 'picking') {
    var need = spreads[state.spread].positions.length;
    var n = state.pickOrder.length;
    var CW = 74, CH = 114, STEP = 15;
    h += '<div style="margin-top:26px;animation:pickIn .5s ease both">';
    h += '<div style="text-align:center">';
    h += '<div style="font:500 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8">請憑直覺選出 ' + need + ' 張牌</div>';
    h += '<div id="pick-count" style="font:italic 11px \'EB Garamond\',serif;color:#c9a96e;margin-top:4px">已選 ' + state.picked.length + ' / ' + need + '</div>';
    h += '</div>';
    h += '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:16px;padding:20px 0 12px">';
    h += '<div style="position:relative;height:' + (CH + 24) + 'px;width:' + (STEP * (n - 1) + CW + 16) + 'px;margin:0 auto">';
    state.pickOrder.forEach(function (_, j) {
      var pi = state.picked.indexOf(j);
      var pickedThis = pi !== -1;
      var rot = (((j * 7919) % 5) - 2) * 0.7;
      var tf = 'rotate(' + rot + 'deg)' + (pickedThis ? ' translateY(-16px)' : '');
      h += '<button type="button" id="pick-' + j + '" aria-label="選擇第 ' + (j + 1) + ' 張牌" aria-pressed="' + pickedThis + '"' + (pickedThis ? ' disabled' : '') + ' onclick="pickCard(' + j + ')" style="position:absolute;left:' + (j * STEP) + 'px;top:18px;width:' + CW + 'px;height:' + CH + 'px;padding:0;border-radius:6px;border:1px solid ' + (pickedThis ? '#e6cd9a' : 'rgba(201,169,110,.55)') + ';background:linear-gradient(160deg,#241f2e,#1a1622);cursor:' + (pickedThis ? 'default' : 'pointer') + ';display:flex;align-items:center;justify-content:center;box-shadow:' + (pickedThis ? '0 0 16px 3px rgba(230,205,154,.55)' : '-3px 0 8px rgba(0,0,0,.45)') + ';transition:transform .3s,box-shadow .3s;transform:' + tf + '">' + sigil('50%', '50%');
      if (pickedThis) h += '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 17px \'Noto Serif TC\',serif;color:#e6cd9a;text-shadow:0 0 8px rgba(20,17,26,.9)">' + (pi + 1) + '</div>';
      h += '</button>';
    });
    h += '</div></div>';
    h += '<div style="text-align:center;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);letter-spacing:.1em">← 左右滑動瀏覽整副牌 →</div>';
    h += '<div style="text-align:center;margin-top:10px"><button onclick="autoPickCards()" style="font:500 11px \'Noto Sans TC\',sans-serif;background:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.45);color:#e6cd9a;padding:7px 15px;border-radius:15px;cursor:pointer">讓系統代抽 Auto Draw</button></div>';
    h += '<div style="text-align:center;margin-top:12px"><button onclick="startReading()" style="font:400 11px \'Noto Sans TC\',sans-serif;background:none;border:1px solid rgba(201,169,110,.35);color:rgba(240,233,216,.6);padding:6px 14px;border-radius:14px;cursor:pointer">重新洗牌 Reshuffle</button></div>';
    h += '</div>';
  }

  // drawn cards
  if (state.drawn.length) {
    var cat = CATEGORIES.find(function (x) { return x.key === state.category; });
    h += '<div style="text-align:center;margin-top:24px">';
    h += '<div style="display:inline-block;font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.08em;color:#c9a96e;border:1px solid rgba(201,169,110,.4);border-radius:14px;padding:4px 14px">' + (cat ? cat.zh : '') + '</div>';
    var qEcho = (state.target ? '關於「' + esc(state.target) + '」—— ' : '') + (state.question ? '「' + esc(state.question) + '」' : '');
    if (qEcho) h += '<div style="font:italic 12px \'EB Garamond\',serif;color:rgba(240,233,216,.55);margin-top:8px">' + qEcho + '</div>';
    h += '</div>';

    if (!isTarot && state.spread === 'grand') {
      h += renderGrandTableau();
    } else if (isTarot && state.spread === 'celtic') {
      h += renderCelticCross();
    } else {
    var cardW = state.drawn.length >= 7 ? '26%' : (state.drawn.length >= 3 ? '30%' : '46%');
    h += '<div style="display:flex;flex-wrap:wrap;gap:16px 12px;justify-content:center;margin-top:16px">';
    state.drawn.forEach(function (d, i) {
      var c = d.card;
      var meaningZh = isTarot ? (d.reversed ? c.revZh : c.upZh) : c.mZh;
      var meaningEn = isTarot ? (d.reversed ? c.revEn : c.upEn) : c.mEn;
      h += '<div style="width:' + cardW + ';display:flex;flex-direction:column;align-items:center;gap:8px;animation:cardIn .4s ease both">';
      h += '<div style="font:500 10px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase">' + d.pos.zh + ' ' + d.pos.en + '</div>';
      var cardFront = '<div style="position:absolute;inset:3px;border:1px solid #d8b96c;border-radius:6px;overflow:hidden;display:flex;flex-direction:column">'
        + cardImgHtml(c.img, c.nameZh)
        + '<div style="flex:none;background:#f2e9d8;padding:4px 3px 5px;text-align:center;border-top:1px solid #d8b96c">'
        + '<div style="font:600 10px \'Noto Serif TC\',serif;color:#4a3826;line-height:1.2">' + esc(c.nameZh) + '</div>'
        + (isTarot ? '<div style="font:500 8px \'Noto Sans TC\',sans-serif;color:#8a6f47;margin-top:2px">' + (d.reversed ? '逆位 Reversed' : '正位 Upright') + '</div>' : '')
        + '</div></div>';
      h += '<button id="flip-button-' + i + '" type="button" aria-label="' + (d.flipped ? ('第 ' + (i + 1) + ' 張，' + esc(d.pos.zh) + '，' + esc(c.nameZh)) : ('翻開第 ' + (i + 1) + ' 張牌，位置：' + esc(d.pos.zh))) + '" onclick="flipCardAt(' + i + ')" style="appearance:none;background:none;border:none;padding:0;width:100%;aspect-ratio:150/230;cursor:pointer;position:relative">';
      h += flipBox('card-' + i, d.flipped, 8, sigil('40%', '40%'), cardFront);
      h += '</button>';
      h += '<div id="card-meaning-' + i + '" style="text-align:center;max-width:160px;display:' + (d.flipped ? 'block' : 'none') + '">';
      h += '<div style="font:600 11px \'Noto Sans TC\',sans-serif;color:#f0e9d8">' + esc(meaningZh) + '</div>';
      h += '<div style="font:italic 10px \'EB Garamond\',serif;color:rgba(240,233,216,.5);margin-top:2px">' + esc(meaningEn) + '</div>';
      h += '</div></div>';
    });
    h += '</div>';

    }

    h += renderPersonaPicker();
    h += '<div style="display:flex;justify-content:center;gap:10px;margin-top:22px;flex-wrap:wrap">';
    h += '<button onclick="flipAll()" style="font:400 12px \'Noto Sans TC\',sans-serif;background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;padding:8px 18px;border-radius:20px;cursor:pointer">全部翻牌 Reveal All</button>';
    h += '<button onclick="revealMeanings()" style="font:500 12px \'Noto Sans TC\',sans-serif;background:linear-gradient(120deg,#c9a96e,#e6cd9a);border:none;color:#1a1622;padding:8px 18px;border-radius:20px;cursor:pointer">直接看牌義 View Meanings</button>';
    h += '<button id="copy-btn" onclick="copyForAI()" style="font:400 12px \'Noto Sans TC\',sans-serif;background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;padding:8px 18px;border-radius:20px;cursor:pointer">' + (state.copied ? '已複製！Copied' : '複製給 AI 解讀 Copy for AI') + '</button>';
    h += '<button onclick="shareResultImage()" style="font:400 12px \'Noto Sans TC\',sans-serif;background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;padding:8px 18px;border-radius:20px;cursor:pointer">分享結果圖 Share</button>';
    h += '</div>';

    // summary panel
    h += '<div id="summary-panel" style="margin-top:28px;border-top:1px solid rgba(201,169,110,.2);padding-top:20px;display:' + (allFlipped() ? 'block' : 'none') + '">';
    h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase;text-align:center">解讀摘要 Reading Summary</div>';
    h += '<div style="border:1px solid rgba(201,169,110,.4);border-radius:10px;padding:15px 17px;background:rgba(201,169,110,.09);margin-top:16px">';
    h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#e6cd9a;text-transform:uppercase">✦ 綜合解讀 Overall Reading</div>';
    h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:8px;line-height:1.9;text-align:justify">' + esc(overallReading()) + '</div>';
    h += '</div>';
    if (state.category === 'love' && state.subtopic) {
      var loveSubDef = (SUBTOPICS.love || []).filter(function (s) { return s.key === state.subtopic; })[0];
      if (loveSubDef) {
        var loveCardRes = cardSubtopicReading('love', state.subtopic, state.drawn);
        if (state.readingMode === 'combined' && state.astroResult) {
          /* combined 模式：依序顯示 A 牌卡具體解讀、B 星盤補充解讀、C 牌卡＋星盤綜合觀察。
             星盤結果現算現用，不寫回 state，也絕不在沒有 state.astroResult 時臨時生成假星盤。 */
          h += renderSubtopicResultPanel(loveSubDef, loveCardRes, '牌卡具體解讀');
          var loveAstroRes = astroCategoryReading('love', state.subtopic, state.astroResult, state.astroUnknownTime);
          h += renderAstroSubtopicPanel(loveSubDef, loveAstroRes);
          var loveCombRes = combinedReading(loveCardRes, loveAstroRes, 'love', state.subtopic);
          h += renderCombinedSummaryPanel(loveSubDef, loveCombRes);
        } else {
          /* cards 模式：與 Phase 1A 完全一致，不多出任何星盤區塊 */
          h += renderSubtopicResultPanel(loveSubDef, loveCardRes);
        }
      }
    } else if (state.category === 'career' && state.subtopic) {
      var careerSubDef = (SUBTOPICS.career || []).filter(function (s) { return s.key === state.subtopic; })[0];
      if (careerSubDef) {
        var careerCardRes = cardSubtopicReading('career', state.subtopic, state.drawn);
        if (state.readingMode === 'combined' && state.astroResult) {
          /* Phase 2B combined 模式：依序顯示 A 牌卡具體解讀、B 星盤補充解讀、C 綜合觀察。
             career-talent 是 astro-only 子問題，cardSubtopicReading() 對它固定回傳
             available:false（mode-not-supported）；renderSubtopicResultPanel() 與
             renderCombinedSummaryPanel() 在資料不可用／非 combined 模式時本來就回傳空字串，
             因此這裡不需要另外特判 career-talent，就能正確安全降級成只顯示星盤補充解讀，
             不會出現空的牌卡面板或假的綜合面板。星盤結果現算現用，不寫回 state。 */
          h += renderSubtopicResultPanel(careerSubDef, careerCardRes, '牌卡具體解讀');
          var careerAstroRes = astroCategoryReading('career', state.subtopic, state.astroResult, state.astroUnknownTime);
          h += renderAstroSubtopicPanel(careerSubDef, careerAstroRes);
          var careerCombRes = combinedReading(careerCardRes, careerAstroRes, 'career', state.subtopic);
          h += renderCombinedSummaryPanel(careerSubDef, careerCombRes);
        } else {
          /* cards 模式：與 Phase 2A 完全一致，不多出任何星盤區塊 */
          h += renderSubtopicResultPanel(careerSubDef, careerCardRes);
        }
      }
    } else if (state.category === 'family' && state.subtopic) {
      var familySubDef = (SUBTOPICS.family || []).filter(function (s) { return s.key === state.subtopic; })[0];
      if (familySubDef) {
        var familyCardRes = cardSubtopicReading('family', state.subtopic, state.drawn);
        if (state.readingMode === 'combined' && state.astroResult) {
          h += renderSubtopicResultPanel(familySubDef, familyCardRes, '牌卡具體解讀');
          var familyAstroRes = astroCategoryReading('family', state.subtopic, state.astroResult, state.astroUnknownTime);
          h += renderAstroSubtopicPanel(familySubDef, familyAstroRes);
          var familyCombRes = combinedReading(familyCardRes, familyAstroRes, 'family', state.subtopic);
          h += renderCombinedSummaryPanel(familySubDef, familyCombRes);
        } else {
          h += renderSubtopicResultPanel(familySubDef, familyCardRes);
        }
      }
    } else if (state.category === 'wealth' && state.subtopic) {
      var wealthSubDef = (SUBTOPICS.wealth || []).filter(function (s) { return s.key === state.subtopic; })[0];
      if (wealthSubDef) {
        var wealthCardRes = cardSubtopicReading('wealth', state.subtopic, state.drawn);
        if (state.readingMode === 'combined' && state.astroResult) {
          h += renderSubtopicResultPanel(wealthSubDef, wealthCardRes, '牌卡具體解讀');
          var wealthAstroRes = astroCategoryReading('wealth', state.subtopic, state.astroResult, state.astroUnknownTime);
          h += renderAstroSubtopicPanel(wealthSubDef, wealthAstroRes);
          var wealthCombRes = combinedReading(wealthCardRes, wealthAstroRes, 'wealth', state.subtopic);
          h += renderCombinedSummaryPanel(wealthSubDef, wealthCombRes);
        } else {
          h += renderSubtopicResultPanel(wealthSubDef, wealthCardRes);
        }
      }
    } else if (['health', 'social', 'study', 'general'].indexOf(state.category) !== -1 && state.subtopic) {
      var remainingSubDef = (SUBTOPICS[state.category] || []).filter(function (s) { return s.key === state.subtopic; })[0];
      if (remainingSubDef) {
        var remainingCardRes = cardSubtopicReading(state.category, state.subtopic, state.drawn);
        if (state.readingMode === 'combined' && state.astroResult) {
          h += renderSubtopicResultPanel(remainingSubDef, remainingCardRes, '牌卡具體解讀');
          var remainingAstroRes = astroCategoryReading(state.category, state.subtopic, state.astroResult, state.astroUnknownTime);
          h += renderAstroSubtopicPanel(remainingSubDef, remainingAstroRes);
          var remainingCombRes = combinedReading(remainingCardRes, remainingAstroRes, state.category, state.subtopic);
          h += renderCombinedSummaryPanel(remainingSubDef, remainingCombRes);
        } else {
          h += renderSubtopicResultPanel(remainingSubDef, remainingCardRes);
        }
      }
    }
    if (!isTarot && state.spread === 'grand') {
      h += grandPanel();
    }
    if (!isTarot && state.spread === 'box9') {
      h += box9Panel();
    }
    if (!isTarot && state.drawn.length >= 2 && state.spread !== 'grand' && state.spread !== 'box9') {
      var lp = lenPairs(state.drawn);
      h += '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:15px 17px;background:rgba(255,255,255,.02);margin-top:12px">';
      h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#c9a96e;text-transform:uppercase">✧ 組牌解讀 Pair Reading</div>';
      h += '<div style="margin-top:9px;padding:11px 13px;border-left:2px solid #e6cd9a;background:rgba(201,169,110,.08);font:400 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8;line-height:1.85">' + esc(lenStory(state.drawn)) + '</div>';
      lp.forEach(function (pr) {
        h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.85);margin-top:9px;line-height:1.8">「' + esc(pr.label) + '」：' + esc(pr.text) + '</div>';
      });
      h += '</div>';
    }
    var analysis = analyzeSpread(state.drawn, isTarot);
    if (analysis.length) {
      h += '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:15px 17px;background:rgba(255,255,255,.02);margin-top:12px">';
      h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#c9a96e;text-transform:uppercase">✧ 牌陣分析 Spread Analysis</div>';
      analysis.forEach(function (t) {
        h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.85);margin-top:9px;line-height:1.8;text-align:justify;padding-left:14px;position:relative"><span style="position:absolute;left:0;color:#c9a96e">·</span>' + esc(t) + '</div>';
      });
      h += '</div>';
    }
    if (state.spread !== 'grand') {
    h += '<div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">';
    state.drawn.forEach(function (d) {
      var c = d.card;
      var meaningZh = isTarot ? (d.reversed ? c.revZh : c.upZh) : c.mZh;
      var meaningEn = isTarot ? (d.reversed ? c.revEn : c.upEn) : c.mEn;
      h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:12px 16px;background:rgba(255,255,255,.02)">';
      h += '<div style="display:flex;justify-content:space-between;align-items:baseline">';
      h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.08em;color:#c9a96e;text-transform:uppercase">' + d.pos.zh + ' ' + d.pos.en + '</div>';
      if (isTarot) h += '<div style="font:400 10px \'EB Garamond\',serif;color:rgba(240,233,216,.4)">' + (d.reversed ? '逆位 Reversed' : '正位 Upright') + '</div>';
      h += '</div>';
      h += '<div style="font:600 14px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:4px">' + esc(c.nameZh) + ' <span style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.5)">' + esc(c.nameEn) + '</span></div>';
      h += '<div style="font:italic 10px \'EB Garamond\',serif;color:rgba(240,233,216,.4);margin-top:1px">' + esc(meaningEn) + '</div>';
      var fields = [
        ['核心訊息', 'Core', cardCoreMeaning(d, isTarot)],
        ['目前狀態', 'Now', cardPosText(d, isTarot)],
        ['可能的盲點', 'Blind Spot', cardBlindSpot(d, isTarot)],
        ['建議採取的行動', 'Action', cardAction(d, isTarot)],
      ];
      h += '<div style="margin-top:9px;display:flex;flex-direction:column;gap:7px">';
      fields.forEach(function (f) {
        h += '<div><span style="font:500 10px \'Noto Sans TC\',sans-serif;letter-spacing:.06em;color:#c9a96e">' + f[0] + ' <span style="font:italic 9px \'EB Garamond\',serif;color:rgba(201,169,110,.6)">' + f[1] + '</span></span>';
        h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.85);margin-top:2px;line-height:1.7">' + esc(f[2]) + '</div></div>';
      });
      h += '</div>';
      h += '<div style="margin-top:9px;padding:8px 12px;border-left:2px solid #c9a96e;background:rgba(201,169,110,.07)"><span style="font:500 10px \'Noto Sans TC\',sans-serif;color:#e6cd9a">一句提醒 </span><span style="font:italic 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8">' + esc(cardReminder(d, isTarot)) + '</span></div>';
      var libKey = isTarot ? c.id : ('l' + c.n);
      h += '<div style="margin-top:8px"><span onclick="openLibCard(\'' + libKey + '\')" style="font:400 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;cursor:pointer;border-bottom:1px dotted rgba(201,169,110,.5)">在牌典查看這張牌 →</span></div>';
      h += '</div>';
    });
    h += '</div>';
    }
    h += '</div>';
    h += '<div style="text-align:center;margin-top:26px"><button onclick="wizRestart()" style="background:none;border:none;color:rgba(240,233,216,.5);font:400 12px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.4);padding:0 0 2px">← 重新提問，再抽一次</button></div>';
  }
  h += '</div>';
  return h;
}

function allFlipped() {
  return state.drawn.length > 0 && state.drawn.every(function (d) { return d.flipped; });
}

/* ---------- auto-generated overall reading (50–200 chars) ---------- */

var NEG_TAROT_IDS = ['m12', 'm13', 'm15', 'm16', 'm18', 'swords-3', 'swords-5', 'swords-9', 'swords-10', 'wands-5', 'cups-5', 'pentacles-5'];
var NEG_LEN_NS = [6, 7, 8, 10, 11, 14, 21, 23, 36];
var CAT_OPENERS = { love: '在感情上', career: '在事業上', family: '在家庭方面', health: '在健康方面', wealth: '在財運方面', social: '在人際關係上', study: '在學業上', general: '就你目前的整體狀態而言' };
var CAT_ADVICE = {
  love: ['真誠表達你的感受，關係會朝好的方向開展', '先照顧好自己的心，不急著要答案，時間會給彼此空間'],
  career: ['把握眼前的機會主動出擊，你的努力會被看見', '謀定而後動，先穩住現有的基礎再談突破'],
  family: ['多一點傾聽與陪伴，家人之間的結會慢慢鬆開', '界線與理解需要並存，給彼此一些消化的時間'],
  health: ['維持目前的節奏，身心正往平衡的方向走', '身體在提醒你放慢腳步，好好休息不是浪費時間'],
  wealth: ['財務能量正在流動，適合規劃與行動', '近期宜保守理財，避免衝動的支出與投資'],
  social: ['真誠的交流會為你帶來支持，主動釋出善意', '人際的節奏急不得，先觀察、再慢慢靠近'],
  study: ['把握目前的學習節奏主動出擊，你的努力終會反映在成績上', '先穩住基本功、別急著求快，扎實的累積比臨時抱佛腳更可靠'],
  general: ['順著當下的節奏走，事情會自然開展', '放慢腳步、整理內在，答案會逐漸清晰'],
};

/* keywords: prefer rich DB, fall back to legacy meaning strings */
function cardKws(d, isTarot) {
  var c = d.card;
  if (isTarot && c.rich) return d.reversed ? c.rich.kr : c.rich.ku;
  var m = isTarot ? (d.reversed ? c.revZh : c.upZh) : c.mZh;
  return m.split('、');
}
function cardKw(d, isTarot, n) {
  return cardKws(d, isTarot).slice(0, n || 2).join('與');
}
function cardLabel(d, isTarot) {
  return '「' + d.card.nameZh + '」' + (isTarot ? (d.reversed ? '逆位' : '正位') : '');
}

/* which context column of the rich DB fits the chosen question topic —
   the 7-context database covers every topic directly */
var CAT_CTX = { love: 'love', career: 'career', wealth: 'wealth', general: 'general', family: 'family', health: 'health', social: 'social', study: 'study' };

/* ---- position roles: the spread position actively reframes the card ---- */
function posRole(zh) {
  if (/阻礙|挑戰/.test(zh)) return 'obstacle';
  if (/建議|指引/.test(zh)) return 'advice';
  if (/過去/.test(zh)) return 'past';
  if (/未來|結果|走向|個月|發展/.test(zh)) return 'future';
  if (/潛意識|根源/.test(zh)) return 'root';
  if (/對方|外在|環境/.test(zh)) return 'other';
  if (/你的|自身|顯意識|感受|立場|需求|態度/.test(zh)) return 'self';
  if (/希望|恐懼/.test(zh)) return 'hope';
  if (/現況|現在/.test(zh)) return 'present';
  if (/連結/.test(zh)) return 'bond';
  if (zh === '身' || zh === '心' || zh === '靈') return 'self';
  if (/優勢/.test(zh)) return 'strength';
  return 'generic';
}

/* short lead sentence: position meaning modifies the card meaning */
function roleLead(role, kw, d) {
  switch (role) {
    case 'obstacle': return kw + '成為目前主要的阻力';
    case 'advice': return '牌建議你以' + kw + '的態度應對';
    case 'past': return '過去的' + kw + '影響延續至今';
    case 'future': return '事情正朝' + kw + '的方向發展';
    case 'root': return kw + '是這件事的深層根源';
    case 'other': return '外在或對方帶來' + kw + '的影響';
    case 'self': return '你的內在呈現' + kw;
    case 'hope': return '你心中交織著' + kw + '的期待與不安';
    case 'present': return '你正處於' + kw + '的狀態';
    case 'bond': return '兩人之間的連結圍繞著' + kw;
    case 'strength': return kw + '是這個選項的優勢所在';
    default: return kw + '是此處的關鍵';
  }
}

/* position modifier layer: each role has distinct upright (fu) / reversed (fr)
   framing templates — the position actively reframes the card meaning */
var POS_TEMPLATES = {
  obstacle: { fu: '眼前的阻力在於如何處理「{kw}」——{meaning}', fr: '「{kw}」成為主要阻力，且以逆位呈現、更偏向內在的卡關——{meaning}' },
  advice:   { fu: '牌建議你採取「{kw}」的態度——{meaning}', fr: '牌提醒你留意「{kw}」的傾向——{meaning}' },
  past:     { fu: '過去「{kw}」的經驗鋪墊了現在的局面——{meaning}', fr: '過去殘留的「{kw}」仍在影響現在——{meaning}' },
  future:   { fu: '發展正朝「{kw}」的方向前進——{meaning}', fr: '未來的走向暫時受「{kw}」牽制——{meaning}' },
  root:     { fu: '「{kw}」是這件事的深層根源——{meaning}', fr: '潛藏的「{kw}」在暗中影響全局——{meaning}' },
  other:    { fu: '外在或對方帶來「{kw}」的影響——{meaning}', fr: '外在環境瀰漫著「{kw}」的氛圍——{meaning}' },
  self:     { fu: '你的內在呈現「{kw}」——{meaning}', fr: '你的內在正經歷「{kw}」——{meaning}' },
  hope:     { fu: '你心中懷抱著「{kw}」的期待——{meaning}', fr: '「{kw}」是你隱隱的擔憂——{meaning}' },
  present:  { fu: '你正處於「{kw}」的狀態——{meaning}', fr: '當下的能量偏向「{kw}」——{meaning}' },
  bond:     { fu: '兩人的連結圍繞著「{kw}」——{meaning}', fr: '連結之中出現「{kw}」的暗流——{meaning}' },
  strength: { fu: '「{kw}」是這個選項的優勢——{meaning}', fr: '這個選項的優勢被「{kw}」削弱——{meaning}' },
  generic:  { fu: '「{kw}」是此處的關鍵——{meaning}', fr: '「{kw}」是此處需要留意的課題——{meaning}' },
};

/* combine card meaning + position modifier + topic context into one sentence */
function cardPosText(d, isTarot) {
  var role = posRole(d.pos.zh);
  var kws = cardKws(d, isTarot);
  var kw = kws[0] || (d.reversed ? '受阻的能量' : '核心能量');
  var meaning = '';
  if (isTarot && d.card.rich) {
    var r = d.card.rich;
    var oi = d.reversed ? 1 : 0;
    if (role === 'obstacle' || role === 'hope' || role === 'root') {
      // these positions reframe the card — use the neutral base meaning,
      // a topic-flavoured sentence would contradict the position's framing
      meaning = d.reversed ? r.r : r.u;
    } else {
      var ck = CAT_CTX[state.category];
      meaning = (ck && r.ctx[ck]) ? r.ctx[ck][oi] : (d.reversed ? r.r : r.u);
    }
  } else {
    meaning = isTarot ? (d.reversed ? d.card.revZh : d.card.upZh) : d.card.mZh;
  }
  var t = POS_TEMPLATES[role] || POS_TEMPLATES.generic;
  var tpl = (isTarot && d.reversed) ? t.fr : t.fu;
  return tpl.replace('{kw}', kw).replace('{meaning}', meaning);
}

/* ---- structured per-card breakdown: 核心訊息 / 目前狀態 / 盲點 / 行動 / 提醒 ---- */
var BLIND_SPOT_TEMPLATES = {
  obstacle: '容易只看到「{kw}」帶來的阻力，而忽略自己其實握有應對的主動權',
  advice: '可能知道該怎麼做，卻遲遲不敢真的照著「{kw}」的方向去行動',
  past: '容易被「{kw}」的舊經驗牽著走，忘了現在的條件已經不同',
  future: '可能把「{kw}」的走向當成定局，反而少了主動調整的空間',
  root: '「{kw}」是深層原因，但表面上可能還看不出這一層關聯',
  other: '容易把重心放在對方或外在的「{kw}」，卻沒留意自己能調整的部分',
  self: '可能對自己的「{kw}」太過熟悉，反而看不出它其實正在影響全局',
  hope: '在「{kw}」的期待與擔憂之間拉扯，容易想太多而遲遲無法決定',
  present: '正處在「{kw}」的狀態中，容易只看見眼前，忽略更長期的走向',
  bond: '容易只從自己的角度解讀這段連結中的「{kw}」，忽略對方的感受',
  strength: '容易低估「{kw}」這個優勢，或是太依賴它而忽略其他面向',
  generic: '容易忽略「{kw}」其實正在悄悄影響事情的走向',
};
var ACTION_TEMPLATES = {
  obstacle: '正面盤點「{kw}」帶來的具體限制，一項一項拆解，而不是籠統地擔心',
  advice: '照著「{kw}」的方向踏出一個具體、現在就能做的小動作',
  past: '把「{kw}」的經驗當參考、不當包袱，帶著新的條件重新評估現況',
  future: '朝「{kw}」的方向做準備，同時保留一點彈性應變的空間',
  root: '花時間釐清「{kw}」這個根源，而不是只處理表面的症狀',
  other: '主動溝通，了解對方或外在環境中「{kw}」背後真正的原因',
  self: '誠實面對自己內在的「{kw}」，這是接下來調整的起點',
  hope: '把「{kw}」的期待寫下來、具體化，減少懸而未決的焦慮感',
  present: '順著「{kw}」的狀態，做眼前最務實的下一步，不用一次想到終點',
  bond: '找個時間跟對方聊聊「{kw}」，把默契或誤解攤開來說清楚',
  strength: '善用「{kw}」這個優勢，讓它在關鍵時刻發揮作用',
  generic: '把「{kw}」放在心上，作為接下來行動的重要參考',
};
var REMINDER_TEMPLATES = {
  obstacle: '阻力是提醒，不是懲罰。',
  advice: '知道了，就去做。',
  past: '過去是養分，不是判決。',
  future: '方向已經在那裡，剩下的是節奏。',
  root: '看懂根源，問題就解了一半。',
  other: '你能真正掌握的，只有自己的回應。',
  self: '誠實面對自己，是最快的捷徑。',
  hope: '不用同時解決期待和恐懼，先選一個面對就好。',
  present: '此刻已經足夠，不用急著衝到下一步。',
  bond: '關係是兩個人的事，但你先動也沒關係。',
  strength: '優勢要用出來，才算數。',
  generic: '把這張牌的訊息放在心上就好。',
};
function cardCoreMeaning(d, isTarot) {
  var meaningZh = isTarot ? (d.reversed ? d.card.revZh : d.card.upZh) : d.card.mZh;
  return meaningZh;
}
function cardBlindSpot(d, isTarot) {
  var role = posRole(d.pos.zh);
  var kw = cardKws(d, isTarot)[0] || '這張牌';
  return (BLIND_SPOT_TEMPLATES[role] || BLIND_SPOT_TEMPLATES.generic).replace('{kw}', kw);
}
function cardAction(d, isTarot) {
  var role = posRole(d.pos.zh);
  var kw = cardKws(d, isTarot)[0] || '這張牌';
  return (ACTION_TEMPLATES[role] || ACTION_TEMPLATES.generic).replace('{kw}', kw);
}
function cardReminder(d, isTarot) {
  var role = posRole(d.pos.zh);
  return REMINDER_TEMPLATES[role] || REMINDER_TEMPLATES.generic;
}

/* ================= Phase 1A：愛情分類的具體子問題解讀（牌卡面，塔羅＋雷諾曼皆支援）=================
   只支援 catKey === 'love'；其他分類一律安全回傳 available:false，不產生內容。
   所有敘述都由「實際抽到的牌」動態決定：牌組（塔羅／雷諾曼）、正逆位、牌位角色、
   花色／宮廷牌階級／大牌，以及既有 RICH／LEN_RICH 資料，透過 hashStr 做確定性挑句——
   同一組抽牌重新整理會得到一樣的內容，不同牌組合則會挑到不同的措辭。 */

/* 花色／音調分組：塔羅用花色＋大牌，雷諾曼沒有花色，改用既有 LEN_RICH.tone（吉/中性/凶）分組 */
function loveCardGroup(card, isTarot) {
  if (isTarot) return card.arcana === 'major' ? 'major' : card.suit;
  var rich = LEN_RICH[card.n];
  var tone = rich && rich.tone;
  if (tone === '吉') return 'len_good';
  if (tone === '凶') return 'len_bad';
  return 'len_neutral';
}
/* 年齡／成熟度傾向：塔羅用宮廷牌階級與數字大小判斷成熟度，大牌另成一組；
   雷諾曼沒有宮廷牌，改用少數幾張與「年輕／成熟」意象直接相關的牌，其餘預設為 peer（相仿） */
var LEN_AGE_BAND = { 13: 'young', 28: 'peer', 29: 'peer', 4: 'mature', 5: 'mature', 15: 'mature', 19: 'mature', 30: 'mature' };
function loveMaturityBand(card, isTarot) {
  if (isTarot) {
    if (card.arcana === 'major') return 'major';
    if (card.num === 'Page') return 'young';
    if (card.num === 'Knight') return 'peer';
    if (card.num === 'Queen' || card.num === 'King') return 'mature';
    var n = card.num === 'A' ? 1 : parseInt(card.num, 10);
    if (n <= 4) return 'young';
    if (n <= 7) return 'peer';
    return 'mature';
  }
  return LEN_AGE_BAND[card.n] || 'peer';
}
/* 依子問題挑出最能代表答案的那張牌：優先找牌位角色相符的位置，找不到就用陣型中最後一張
  （多數牌陣的最後一個位置最接近「未來／結果」），單張牌陣自然就是那張牌 */
var LOVE_ROLE_PRIORITY = {
  'partner-type': ['other', 'future', 'bond'],
  'partner-profile': ['other', 'bond', 'future'],
  'meet-scene': ['other', 'past', 'bond'],
  'pace-pattern': ['bond', 'future', 'present'],
  crush: ['other', 'future', 'bond'],
  reunion: ['future', 'other', 'past'],
  'marriage-longterm': ['future', 'bond', 'other'],
};
function loveFocusCard(drawnCards, subtopicKey) {
  var priorities = LOVE_ROLE_PRIORITY[subtopicKey] || ['future', 'other', 'bond'];
  for (var i = 0; i < priorities.length; i++) {
    for (var j = 0; j < drawnCards.length; j++) {
      if (posRole(drawnCards[j].pos.zh) === priorities[i]) return drawnCards[j];
    }
  }
  return drawnCards[drawnCards.length - 1];
}
/* 整體牌陣語氣（正向／中性／挑戰）：沿用 overallReading() 同一套加減分邏輯與門檻，
   只是獨立算一份給子問題解讀用，不去更動 overallReading() 本身 */
function loveToneBucket(drawnCards, isTarot) {
  var score = 0;
  drawnCards.forEach(function (d) {
    if (isTarot) {
      var neg = NEG_TAROT_IDS.indexOf(d.card.id) !== -1;
      if (neg && !d.reversed) score -= 1;
      else if (!neg && d.reversed) score -= 1;
      else if (!neg && !d.reversed) score += 1;
    } else {
      score += NEG_LEN_NS.indexOf(d.card.n) !== -1 ? -1 : 1;
    }
  });
  var ratio = drawnCards.length ? score / drawnCards.length : 0;
  return ratio > 0.34 ? 'positive' : (ratio < -0.34 ? 'challenging' : 'neutral');
}

/* 每個子問題的「核心結論」導語（挑一句接在既有 RICH.ctx.love／LEN_RICH.love 的真實牌義句子前面）。
   partner-profile 不用這個導語庫——它的核心結論改用下面的 LOVE_PORTRAIT_TAG 組成專屬的
   「人物輪廓」句式，其餘子問題維持原本的導語＋牌義句組合方式。 */
var LOVE_SUBTOPIC_LEAD = {
  'partner-type': ['從你目前抽到的牌來看，', '這次牌面透露的訊息是，'],
  'meet-scene': ['關於可能相遇的場合，牌面提示：', '這張牌對相遇情境的暗示是：'],
  'pace-pattern': ['關於這段關係的節奏與相處，牌面顯示：', '從整體牌陣來看，這段關係的走向是：'],
  crush: ['關於這段曖昧，牌面透露：', '這張牌對曖昧對象的態度提示：'],
  reunion: ['關於復合的可能性，牌面顯示：', '這張牌對這段關係的提醒是：'],
  'marriage-longterm': ['關於長期關係與適婚傾向，牌面顯示：', '這張牌對關係走向的象徵是：'],
};
/* partner-profile 專用：用代表牌的花色／大牌／雷諾曼吉凶分組，挑一句簡短的人物輪廓形容詞組，
   套進「牌面首先呈現的是一位……傾向的人」的句式，取代過於一般化的導語 */
var LOVE_PORTRAIT_TAG = {
  wands: ['行動派、熱情直接', '充滿活力、敢衝敢闖', '陽光外向、有衝勁'],
  cups: ['細膩重情、體貼溫柔', '感性浪漫、重視連結', '情感豐富、容易被打動'],
  swords: ['理性獨立、思路清晰', '有主見、話說得直接', '冷靜自持、善於分析'],
  pentacles: ['務實可靠、腳踏實地', '沉穩踏實、重視安全感', '低調務實、重承諾'],
  major: ['氣場鮮明、份量十足', '特質強烈、不落俗套', '帶著某種命定感的氣質'],
  len_good: ['開朗正向、容易親近', '明亮溫暖、討人喜歡', '氣場順遂、給人好感'],
  len_neutral: ['低調平實、需要時間認識', '中規中矩、耐看型', '平穩內斂、不張揚'],
  len_bad: ['帶點防備、需要耐心靠近', '神秘難懂、步調謹慎', '複雜深沉、需要時間磨合'],
};
/* 「人物／環境特徵」欄位由哪些 TRAIT_POOL 軸心組成——只有列在這裡的子問題才會產生 traits 內容。
   partner-profile 固定六個維度：年齡傾向／外貌氣質／個性相處／職業類型／經濟觀念／家庭背景，
   financeStyle（金錢觀／消費／收入穩定度）與 familyBg（家庭氛圍／成長環境）分開，避免混在一起、
   也避免用「家庭背景」暗示確定的財產或階級。partner-type／meet-scene 維持原本的少數軸心，不強加。 */
var LOVE_TRAIT_AXES_BY_SUBTOPIC = {
  'partner-type': ['appearance', 'personality'],
  'partner-profile': ['ageHint', 'appearance', 'personality', 'jobType', 'financeStyle', 'familyBg'],
  'meet-scene': ['meetScene'],
};
/* traits 欄位輸出時的維度標籤，讓使用者能清楚辨認「年齡傾向：……；外貌氣質：……」這種分項敘述 */
var TRAIT_AXIS_LABELS = {
  ageHint: '年齡傾向',
  appearance: '外貌氣質',
  personality: '個性相處',
  jobType: '職業類型',
  financeStyle: '經濟觀念',
  familyBg: '家庭背景',
  meetScene: '相遇場合',
};

/* 依整體牌陣語氣挑句：trend／favor／risk／action／timing 這幾個欄位在所有愛情子問題間共用同一套
   語氣措辭池（只有子問題的 fields 有要求該欄位時才會用到），差異來自實際抽牌的正逆位與吉凶比例 */
var LOVE_TONE_POOL = {
  trend: {
    positive: ['整體發展的走向偏向順利，關係有機會穩定往前推進', '牌面能量偏正向，事情有機會比預期更快出現進展', '目前的趨勢對你有利，順著現有的節奏走下去即可'],
    neutral: ['發展走向還在醞釀中，順與不順都各有一些，需要再觀察一段時間', '目前處於過渡階段，趨勢尚未完全明朗，建議保持彈性', '事情的走向取決於接下來雙方的互動，暫時沒有絕對的定論'],
    challenging: ['目前的趨勢帶有一些阻力，進展可能比預期慢一些', '牌面顯示這段時間需要多一點耐心，不宜期待立即的變化', '發展走向暫時卡在某個環節，建議先處理眼前的課題再往前'],
  },
  favor: {
    positive: ['你目前的狀態與心態是最大的助力，保持現有的步調即可', '身邊的機會與人脈都對你有利，適合主動一點', '整體氛圍站在你這邊，坦然表現真實的自己會加分'],
    neutral: ['真誠與耐心會是這段時間最實際的助力', '保持開放的心態，願意多了解對方會帶來加分', '穩定的生活步調本身就是一種優勢，不必刻意強求'],
    challenging: ['願意誠實面對問題本身就是一種助力，別急著逃避', '過去累積的信任與耐心，會是撐過這段時期的關鍵', '願意先調整自己的心態，會比等對方改變更有幫助'],
  },
  risk: {
    positive: ['順利時也別忽略溝通，避免因為太順而少了確認彼此的心意', '留意別因為進展快就忽略了解對方真正的需求', '好的開始也需要持續經營，避免三分鐘熱度'],
    neutral: ['猶豫不決可能讓機會悄悄流失，建議別拖太久', '資訊不對等容易造成誤會，適時主動確認會比悶著猜更好', '過度分析反而可能錯過感受當下的機會'],
    challenging: ['要留意逃避溝通或累積情緒，反而讓問題越滾越大', '容易因為缺乏安全感而想太多，建議別把小事放大檢視', '過去未解決的心結若不處理，可能持續影響這段關係'],
  },
  action: {
    positive: ['可以主動一點，把握現有的好氛圍往前推進一步', '適合把心裡的想法說出口，坦誠會帶來更好的結果', '順勢而為，同時也記得肯定對方在這段關係中的付出'],
    neutral: ['建議先觀察一陣子，同時保持開放而不勉強的心態', '可以先從小的互動開始，慢慢累積彼此的了解與信任', '給彼此一點時間，同時誠實表達自己真正的需求'],
    challenging: ['建議先照顧好自己的情緒，再決定下一步怎麼走', '找一個平靜的時機，坦誠地把心裡的擔憂說出來', '暫時放慢腳步，把注意力放在能自己掌握的部分'],
  },
  timing: {
    positive: ['如果雙方都有意願，關係往更穩定的方向發展，時機點可能比想像中更快到來', '牌面顯示現在是相對適合往前一步的時機', '近期到中期都是相對有利的時間段，可以順勢而為'],
    neutral: ['時機尚未完全成熟，可能需要再多一段時間醞釀', '沒有明確的急迫性，順其自然、水到渠成會比刻意設定期限更好', '關鍵時間點還需要視雙方後續的互動而定，暫時無法斷定'],
    challenging: ['目前不是勉強推進的好時機，操之過急反而容易適得其反', '建議先把眼前的課題處理好，時機自然會比較清楚', '短期內可能仍有變數，適合抱持觀望但不放棄的態度'],
  },
};

/* ================= Phase 2A：事業分類的牌卡具體解讀資料與純函式 =================
   共用工具全部重用既有的通用函式：loveCardGroup()（花色／大牌／雷諾曼吉凶分組——名稱雖沿用
   Phase 1A，但內部邏輯本來就與愛情無關，是通用的花色分組工具）、loveToneBucket()（整體牌陣
   語氣，同樣是通用邏輯）、hashStr()、traitPoolPick()／TRAIT_POOL（上面已新增 career 專用軸心）。
   只有 CAREER_SUBTOPIC_LEAD／CAREER_ROLE_PRIORITY／CAREER_TRAIT_AXES_BY_SUBTOPIC／
   CAREER_AXIS_LABELS／CAREER_TONE_POOL／careerFocusCard() 是事業專屬、新增的內容。 */
var CAREER_SUBTOPIC_LEAD = {
  'industry-fit': ['從你目前抽到的牌來看，', '這次牌面透露的訊息是，'],
  'work-style-fit': ['關於適合的工作型態，牌面顯示：', '這張牌對工作模式的暗示是：'],
  'career-timing': ['關於升遷、轉職或求職的趨勢，牌面顯示：', '這張牌對職涯時機的提示是：'],
  'workplace-strength-weakness': ['關於你的職場優勢與課題，牌面顯示：', '這張牌對職場狀態的提醒是：'],
};
/* 依子問題挑出最能代表答案的那張牌：跟 loveFocusCard() 同樣的做法（先找角色相符的牌位，
   找不到就用陣型最後一張），只是換一套事業專用的角色優先序，鍵值沿用既有 posRole() 的角色。 */
var CAREER_ROLE_PRIORITY = {
  'industry-fit': ['future', 'present', 'self'],
  'work-style-fit': ['self', 'present', 'future'],
  'career-timing': ['future', 'advice', 'present'],
  'workplace-strength-weakness': ['self', 'other', 'advice'],
};
function careerFocusCard(drawnCards, subtopicKey) {
  var priorities = CAREER_ROLE_PRIORITY[subtopicKey] || ['future', 'present', 'self'];
  for (var i = 0; i < priorities.length; i++) {
    for (var j = 0; j < drawnCards.length; j++) {
      if (posRole(drawnCards[j].pos.zh) === priorities[i]) return drawnCards[j];
    }
  }
  return drawnCards[drawnCards.length - 1];
}
/* 「人物／環境特徵」欄位由哪些 TRAIT_POOL 軸心組成；只有列在這裡的子問題才會產生 traits 內容。
   career-timing 沒有 traits（SUBTOPICS.career 本來就沒有把 traits 列進它的 fields）。 */
var CAREER_TRAIT_AXES_BY_SUBTOPIC = {
  'industry-fit': ['industryDirection', 'jobFunction', 'workContent', 'workEnvironment'],
  'work-style-fit': ['employmentType', 'workRhythm'],
  'workplace-strength-weakness': ['strength', 'blindSpot', 'managerFit', 'teamFit'],
};
var CAREER_AXIS_LABELS = {
  industryDirection: '產業方向', jobFunction: '職務性質', workContent: '工作內容', workEnvironment: '工作環境',
  employmentType: '工作型態傾向', workRhythm: '自主與合作節奏',
  strength: '職場優勢', blindSpot: '容易卡住的地方', managerFit: '適合的主管風格', teamFit: '適合的團隊環境',
  /* Phase 2B：career-talent（星盤限定）新增的兩個維度標籤，沿用同一份 CAREER_AXIS_LABELS，
     跟牌卡端共用的維度（industryDirection 等）放在一起，不另外新建標籤物件。 */
  longTermDirection: '長期職涯方向', talentResource: '才能資源運用',
};
/* 依整體牌陣語氣挑句：trend／favor／risk／action／timing 這幾個欄位在所有事業子問題間共用同一套
   語氣措辭池，差異來自實際抽牌的正逆位與吉凶比例（loveToneBucket()，通用邏輯，非愛情限定）。
   timing 只能用「近期／需要醞釀／宜先準備」等模糊區間，不給確切日期或保證結果。 */
var CAREER_TONE_POOL = {
  trend: {
    positive: ['整體發展的走向偏向順利，工作上有機會迎來新的進展', '牌面能量偏正向，努力容易在近期得到回應', '目前的趨勢對你有利，適合順勢而為、把握機會'],
    neutral: ['發展走向還在醞釀中，順與不順都各有一些，需要再觀察一段時間', '目前處於過渡階段，趨勢尚未完全明朗，建議保持彈性', '事情的走向取決於接下來的準備與行動，暫時沒有絕對的定論'],
    challenging: ['目前的趨勢帶有一些阻力，進展可能比預期慢一些', '牌面顯示這段時間需要多一點耐心，不宜期待立即的變化', '發展走向暫時卡在某個環節，建議先處理眼前的課題再往前'],
  },
  favor: {
    positive: ['你目前的狀態與準備是最大的助力，保持現有的步調即可', '身邊的機會與人脈都對你有利，適合主動一點爭取', '整體氛圍站在你這邊，展現真實的實力會加分'],
    neutral: ['踏實的準備會是這段時間最實際的助力', '保持開放的心態，願意多方嘗試會帶來加分', '穩定的工作步調本身就是一種優勢，不必刻意強求'],
    challenging: ['願意誠實面對職場課題本身就是一種助力，別急著逃避', '過去累積的經驗與耐心，會是撐過這段時期的關鍵', '願意先調整自己的心態，會比等環境改變更有幫助'],
  },
  risk: {
    positive: ['順利時也別忽略持續累積，避免因為太順而鬆懈準備', '留意別因為進展快就忽略確認細節', '好的開始也需要持續投入，避免三分鐘熱度'],
    neutral: ['猶豫不決可能讓機會悄悄流失，建議別拖太久', '資訊不足容易造成誤判，適時主動確認會比悶著猜更好', '過度分析反而可能錯過行動的時機'],
    challenging: ['要留意逃避溝通或累積情緒，反而讓問題越滾越大', '容易因為缺乏安全感而想太多，建議別把小事放大檢視', '過去未解決的職場課題若不處理，可能持續影響現況'],
  },
  action: {
    positive: ['可以主動一點，把握現有的好氛圍往前推進一步', '適合把想法或需求說出口，坦誠會帶來更好的結果', '順勢而為，同時也記得肯定自己這段時間的努力'],
    neutral: ['建議先觀察一陣子，同時保持開放而不勉強的心態', '可以先從小的行動開始，慢慢累積成果與信心', '給自己一點時間，同時誠實盤點目前真正的需求'],
    challenging: ['建議先照顧好自己的狀態，再決定下一步怎麼走', '找一個適合的時機，坦誠地把心裡的顧慮說出來', '暫時放慢腳步，把注意力放在能自己掌握的部分'],
  },
  timing: {
    positive: ['近期是相對有利的時機，可以主動把握機會', '接下來一段時間適合積極爭取，時機站在你這邊', '短期內就有機會看到具體的進展或回應'],
    neutral: ['目前時機還在醞釀，建議先做好準備、伺機而動', '沒有特別急迫的時間點，宜先觀察再決定行動節奏', '接下來需要一段時間累積，還不到全力衝刺的時候'],
    challenging: ['目前不是躁進的時機，宜先穩住腳步、做足準備', '短期內可能不會有立即的結果，需要更多耐心醞釀', '建議先處理眼前的課題，時機到了再進一步行動'],
  },
};
/* cardSubtopicReadingCareer(subtopicKey, drawnCards)
   事業分類的牌卡具體解讀，只在 cardSubtopicReading() 分派時由 catKey==='career' 呼叫。
   核心結論優先取用既有 RICH.ctx.career／LEN_RICH.career 的真實牌義句子（不捏造新文案），
   traits／trend／favor／risk／action／timing 皆依實際抽到的牌、正逆位與整體牌陣語氣動態組合，
   語氣一律使用「較適合、可能、傾向、可優先考慮」，不斷言唯一職業、不保證錄取、升遷或收入。 */
function cardSubtopicReadingCareer(subtopicKey, drawnCards) {
  var out = { available: false, reason: '', catKey: 'career', subtopicKey: subtopicKey, conclusion: '', traits: '', trend: '', favor: '', risk: '', timing: '', action: '', caveat: '', tone: null };
  var subtopic = (SUBTOPICS.career || []).filter(function (s) { return s.key === subtopicKey; })[0];
  if (!subtopic) { out.reason = 'unknown-subtopic'; return out; }
  if (subtopic.modes.indexOf('cards') === -1) { out.reason = 'mode-not-supported'; return out; }
  if (!drawnCards || !drawnCards.length) { out.reason = 'no-cards'; return out; }

  var isTarot = typeof drawnCards[0].card.arcana !== 'undefined';
  var focus = careerFocusCard(drawnCards, subtopicKey);
  var seedBase = 'career|' + subtopicKey + '|' + drawnCards.map(function (d) {
    return (isTarot ? d.card.id : ('l' + d.card.n)) + (d.reversed ? 'R' : 'U');
  }).join(',');

  var baseMeaning;
  if (isTarot && focus.card.rich && focus.card.rich.ctx && focus.card.rich.ctx.career) {
    baseMeaning = focus.card.rich.ctx.career[focus.reversed ? 1 : 0];
  } else if (isTarot) {
    baseMeaning = focus.reversed ? focus.card.revZh : focus.card.upZh;
  } else {
    var lr2 = LEN_RICH[focus.card.n];
    baseMeaning = (lr2 && lr2.career) ? lr2.career : focus.card.mZh;
  }
  baseMeaning = baseMeaning.replace(/,/g, '，');
  var careerLeadPool = CAREER_SUBTOPIC_LEAD[subtopicKey] || CAREER_SUBTOPIC_LEAD['industry-fit'];
  var careerLead = careerLeadPool[hashStr(seedBase + '|lead') % careerLeadPool.length];
  out.conclusion = careerLead + baseMeaning;

  var careerAxes = CAREER_TRAIT_AXES_BY_SUBTOPIC[subtopicKey];
  if (careerAxes && subtopic.fields.indexOf('traits') !== -1) {
    var careerGroup = loveCardGroup(focus.card, isTarot); // 通用的花色／大牌／雷諾曼吉凶分組工具
    var careerParts = careerAxes.map(function (axis) {
      var text = traitPoolPick(axis, careerGroup, seedBase + '|' + axis);
      if (!text) return '';
      var label = CAREER_AXIS_LABELS[axis] || axis;
      return label + '：' + text;
    }).filter(function (t) { return !!t; });
    out.traits = careerParts.join('；');
  }

  var careerTone = loveToneBucket(drawnCards, isTarot); // 通用的整體牌陣語氣工具，非愛情限定
  out.tone = careerTone;
  ['trend', 'favor', 'risk', 'action', 'timing'].forEach(function (f) {
    if (subtopic.fields.indexOf(f) === -1) return;
    var pool = (CAREER_TONE_POOL[f] && CAREER_TONE_POOL[f][careerTone]) || [];
    if (!pool.length) return;
    out[f] = pool[hashStr(seedBase + '|' + f) % pool.length];
  });

  if (subtopic.fields.indexOf('caveat') !== -1) {
    out.caveat = '以上描述是牌面象徵與可能傾向，並非對職涯結果的確定預測（例如是否升遷、錄取或創業成功），實際情況仍需以你自己的專業判斷與現實條件為準。';
  }

  out.available = true;
  return out;
}

/* 家庭分類牌卡引擎：核心結論沿用每張牌既有的 family 情境牌義；其餘欄位依整個牌陣
   的正逆／吉凶比例選句。只描述互動模式與可調整方向，不替未在場的家人判定動機。 */
var FAMILY_SUBTOPIC_LEAD = {
  'family-dynamics': ['這次牌面反映的家庭互動核心是：', '關於原生家庭與互動模式，牌面顯示：'],
  'family-relations': ['關於你與家人的關係走向，牌面顯示：', '這段家庭關係目前較明顯的主題是：'],
  'living-responsibility': ['關於居住、搬動與家庭責任，牌面提示：', '目前家庭壓力的核心較可能是：'],
  'family-improve': ['家庭關係可以先從這個方向改善：', '牌面給你的改善重點是：'],
};
var FAMILY_ROLE_PRIORITY = {
  'family-dynamics': ['root', 'present', 'self'],
  'family-relations': ['other', 'bond', 'future'],
  'living-responsibility': ['obstacle', 'present', 'future'],
  'family-improve': ['advice', 'future', 'self'],
};
var FAMILY_TONE_POOL = {
  traits: {
    positive: ['家庭成員之間仍有支持與連結，遇到事情時較願意彼此照應', '互動中有一定的信任基礎，重要時刻仍能回到同一陣線'],
    neutral: ['家人各有立場與習慣，需要透過具體討論才能找到共同節奏', '家庭互動表面平穩，但有些需求可能尚未被清楚說出'],
    challenging: ['家庭中可能累積了責任不均、界線模糊或未說出口的情緒', '彼此容易用防衛、沉默或控制回應壓力，真正需求反而被遮住'],
  },
  trend: {
    positive: ['接下來的互動有逐步緩和的空間，坦白而溫和的溝通會帶來進展', '家庭氣氛較可能往理解與重新協調的方向發展'],
    neutral: ['關係仍在調整期，走向取決於是否願意把責任與需求說清楚', '短期內不一定立刻改變，但小幅調整能慢慢累積效果'],
    challenging: ['若持續逃避核心問題，原有摩擦可能反覆出現', '近期仍有壓力，先降低衝突強度比急著一次解決更實際'],
  },
  favor: {
    positive: ['既有的情感連結與願意互相照顧，是目前最重要的助力', '家人之間仍保有信任，適合用具體行動重新建立合作'],
    neutral: ['願意聽完彼此的理由，而不是急著判斷對錯，會帶來幫助', '把抽象抱怨改成具體需求，是目前最實際的助力'],
    challenging: ['先穩住自己的情緒與界線，會比勉強說服所有人更有幫助', '尋找一位能中立協調的人，可能有助於降低彼此防衛'],
  },
  risk: {
    positive: ['關係好轉時仍要把責任與界線說清楚，避免問題只是暫時被擱置', '別因為氣氛緩和就再次把自己的真實需求壓下來'],
    neutral: ['容易各自猜測對方心意，卻沒有確認真正需要什麼', '若只談道理、不談感受，溝通可能停在表面'],
    challenging: ['翻舊帳、情緒勒索或把所有責任推給一個人，會讓問題更難處理', '長期壓抑後一次爆發，可能讓原本可談的事情變成對立'],
  },
  action: {
    positive: ['找一個平靜時段，具體說出你的感受、需求與願意承擔的部分', '延續目前有效的互動方式，並用小行動增加彼此的安全感'],
    neutral: ['先釐清哪些是你的責任、哪些需要共同協調，再進行溝通', '一次只談一個具體問題，避免把多年累積的事情同時攤開'],
    challenging: ['先暫停高張力對話，等情緒下降後再談界線與可行方案', '若衝突已超出彼此能處理的範圍，可考慮尋求可信任的第三方協助'],
  },
};
function familyFocusCard(drawnCards, subtopicKey) {
  var priorities = FAMILY_ROLE_PRIORITY[subtopicKey] || ['root', 'present', 'advice'];
  for (var i = 0; i < priorities.length; i++) {
    for (var j = 0; j < drawnCards.length; j++) {
      if (posRole(drawnCards[j].pos.zh) === priorities[i]) return drawnCards[j];
    }
  }
  return drawnCards[drawnCards.length - 1];
}
function cardSubtopicReadingFamily(subtopicKey, drawnCards) {
  var out = { available: false, reason: '', catKey: 'family', subtopicKey: subtopicKey, conclusion: '', traits: '', trend: '', favor: '', risk: '', timing: '', action: '', caveat: '', tone: null };
  var subtopic = (SUBTOPICS.family || []).filter(function (s) { return s.key === subtopicKey; })[0];
  if (!subtopic) { out.reason = 'unknown-subtopic'; return out; }
  if (!drawnCards || !drawnCards.length) { out.reason = 'no-cards'; return out; }
  var isTarot = typeof drawnCards[0].card.arcana !== 'undefined';
  var focus = familyFocusCard(drawnCards, subtopicKey);
  var seed = 'family|' + subtopicKey + '|' + drawnCards.map(function (d) {
    return (isTarot ? d.card.id : ('l' + d.card.n)) + (d.reversed ? 'R' : 'U');
  }).join(',');
  var baseMeaning;
  if (isTarot && focus.card.rich && focus.card.rich.ctx && focus.card.rich.ctx.family) {
    baseMeaning = focus.card.rich.ctx.family[focus.reversed ? 1 : 0];
  } else if (isTarot) {
    baseMeaning = focus.reversed ? focus.card.revZh : focus.card.upZh;
  } else {
    var lr = LEN_RICH[focus.card.n];
    baseMeaning = (lr && lr.family) ? lr.family : focus.card.mZh;
  }
  baseMeaning = baseMeaning.replace(/,/g, '，');
  var leadPool = FAMILY_SUBTOPIC_LEAD[subtopicKey];
  out.conclusion = leadPool[hashStr(seed + '|lead') % leadPool.length] + baseMeaning;
  var tone = loveToneBucket(drawnCards, isTarot);
  out.tone = tone;
  ['traits', 'trend', 'favor', 'risk', 'action'].forEach(function (f) {
    if (subtopic.fields.indexOf(f) === -1) return;
    var pool = FAMILY_TONE_POOL[f][tone];
    out[f] = pool[hashStr(seed + '|' + f) % pool.length];
  });
  out.caveat = '以上內容反映牌面所呈現的家庭互動與你可觀察的部分，無法代替未在場家人說明其真實想法，也不是對搬家、分離或家庭事件的確定預測；請以實際溝通、安全與現實條件為準。';
  out.available = true;
  return out;
}

/* 財運牌卡引擎：描述現金流、風險態度與可能的資源來源，不提供任何特定投資標的、
   買賣時點或保證獲利結論。money-pattern 為星盤限定，不在牌卡模式產生內容。 */
var WEALTH_SUBTOPIC_LEAD = {
  'cashflow-risk': ['關於近期收支與現金流，牌面顯示：', '目前財務流動較明顯的訊息是：'],
  'risk-approach': ['關於宜保守或在可承受範圍內行動，牌面提示：', '這組牌對風險節奏的提醒是：'],
  'opportunity-source': ['財務機會可能從這個方向被看見：', '牌面顯示較值得留意的資源來源是：'],
};
var WEALTH_ROLE_PRIORITY = {
  'cashflow-risk': ['present', 'obstacle', 'future'],
  'risk-approach': ['advice', 'obstacle', 'future'],
  'opportunity-source': ['future', 'other', 'strength'],
};
var WEALTH_SOURCE_BY_GROUP = {
  wands: ['機會較可能來自主動開發、副業嘗試、行銷推廣或需要行動力的工作', '資源來源偏向新計畫、接案或把想法快速落實'],
  cups: ['機會較可能來自服務、照顧、美感創作、顧客關係或人際合作', '資源來源偏向信任、口碑與能回應他人需求的工作'],
  swords: ['機會較可能來自資訊、企劃、顧問、溝通、教學或專業判斷', '資源來源偏向知識、分析與解決複雜問題的能力'],
  pentacles: ['機會較可能來自本業累積、技術、管理、實體資源或長期合作', '資源來源偏向穩定工作、專業證明與可持續的成果'],
  major: ['財務議題正處於較大的轉折，機會來源不宜只用單一工作類型判定', '資源可能伴隨人生方向調整而出現，需要回到整體選擇評估'],
  len_good: ['資源流動相對順暢，工作、人脈或合作可能帶來可見機會', '機會來源較明朗，但仍需要實際確認條件與成本'],
  len_neutral: ['資源來源仍在醞釀，可能來自既有工作或日常人脈的小幅累積', '機會尚未特別集中，適合多方比較而不急著投入'],
  len_bad: ['目前更適合先處理漏洞、債務或不穩定因素，再尋找新的收入來源', '機會可能伴隨隱藏成本或條件，需要特別查證'],
};
var WEALTH_TONE_POOL = {
  trend: {
    positive: ['近期資源流動較有支持，但仍宜先保留必要預備金', '收支有改善空間，適合把握已看得懂且能承擔的機會'],
    neutral: ['財務走向仍在整理期，收入與支出需要持續觀察', '近期宜以穩定現金流為主，再決定是否增加風險'],
    challenging: ['現金流可能承受壓力，短期宜優先止漏、降低非必要支出', '近期變數偏多，先維持流動性比追求高報酬更重要'],
  },
  favor: {
    positive: ['已有的能力、工作成果與可靠合作，是目前最實際的財務助力', '清楚掌握的資訊與穩定執行力，有助於把機會轉成成果'],
    neutral: ['預算、紀錄與分散風險，是目前最能增加安全感的做法', '先盤點可動用資源與固定支出，會比憑感覺決定更有幫助'],
    challenging: ['保留緊急預備金並尋求可信任的專業意見，是目前的重要保護', '願意面對帳務與風險，而不是期待快速翻轉，會更有幫助'],
  },
  risk: {
    positive: ['順利時仍要留意過度樂觀、追高或把短期成果當成長期保證', '機會出現時要確認合約、成本與退出條件，避免只看潛在收益'],
    neutral: ['資訊不完整、猶豫後衝動投入或忽略小額累積支出，都是需要留意的風險', '不要因為害怕錯過而超出自己原本設定的承受範圍'],
    challenging: ['需留意高槓桿、借貸投入、來路不明的機會與承諾保證獲利的說法', '壓力下容易想靠一次高風險決策翻轉，反而放大損失'],
  },
  action: {
    positive: ['可以在設定上限與退出條件後，小幅度測試自己充分理解的機會', '先確定必要支出與預備金，再把剩餘資源投入明確目標'],
    neutral: ['先記錄一段時間的收支與風險承受度，再決定下一步', '把大決定拆成小步驟，避免一次投入過多資源'],
    challenging: ['暫緩高風險或不熟悉的決定，先處理現金流、債務與必要支出', '若涉及重大金額、借貸或複雜商品，請先諮詢合格財務專業人士'],
  },
};
function wealthFocusCard(drawnCards, subtopicKey) {
  var priorities = WEALTH_ROLE_PRIORITY[subtopicKey] || ['present', 'future', 'advice'];
  for (var i = 0; i < priorities.length; i++) for (var j = 0; j < drawnCards.length; j++) {
    if (posRole(drawnCards[j].pos.zh) === priorities[i]) return drawnCards[j];
  }
  return drawnCards[drawnCards.length - 1];
}
function cardSubtopicReadingWealth(subtopicKey, drawnCards) {
  var out = { available: false, reason: '', catKey: 'wealth', subtopicKey: subtopicKey, conclusion: '', traits: '', trend: '', favor: '', risk: '', timing: '', action: '', caveat: '', tone: null };
  var subtopic = (SUBTOPICS.wealth || []).filter(function (s) { return s.key === subtopicKey; })[0];
  if (!subtopic) { out.reason = 'unknown-subtopic'; return out; }
  if (subtopic.modes.indexOf('cards') === -1) { out.reason = 'mode-not-supported'; return out; }
  if (!drawnCards || !drawnCards.length) { out.reason = 'no-cards'; return out; }
  var isTarot = typeof drawnCards[0].card.arcana !== 'undefined';
  var focus = wealthFocusCard(drawnCards, subtopicKey);
  var seed = 'wealth|' + subtopicKey + '|' + drawnCards.map(function (d) {
    return (isTarot ? d.card.id : ('l' + d.card.n)) + (d.reversed ? 'R' : 'U');
  }).join(',');
  var baseMeaning;
  if (isTarot && focus.card.rich && focus.card.rich.ctx && focus.card.rich.ctx.wealth) baseMeaning = focus.card.rich.ctx.wealth[focus.reversed ? 1 : 0];
  else if (isTarot) baseMeaning = focus.reversed ? focus.card.revZh : focus.card.upZh;
  else { var lr = LEN_RICH[focus.card.n]; baseMeaning = (lr && lr.wealth) ? lr.wealth : focus.card.mZh; }
  baseMeaning = baseMeaning.replace(/,/g, '，');
  var leadPool = WEALTH_SUBTOPIC_LEAD[subtopicKey];
  out.conclusion = leadPool[hashStr(seed + '|lead') % leadPool.length] + baseMeaning;
  var tone = loveToneBucket(drawnCards, isTarot);
  out.tone = tone;
  if (subtopicKey === 'opportunity-source') {
    var group = loveCardGroup(focus.card, isTarot);
    var sourcePool = WEALTH_SOURCE_BY_GROUP[group] || WEALTH_SOURCE_BY_GROUP.len_neutral;
    out.traits = '可能來源：' + sourcePool[hashStr(seed + '|source') % sourcePool.length];
  }
  ['trend', 'favor', 'risk', 'action'].forEach(function (f) {
    if (subtopic.fields.indexOf(f) !== -1) out[f] = WEALTH_TONE_POOL[f][tone][hashStr(seed + '|' + f) % WEALTH_TONE_POOL[f][tone].length];
  });
  out.caveat = FINANCE_DISCLAIMER + ' 牌面只能提供風險節奏與自我觀察，不能判斷特定標的一定上漲、保證獲利或取代完整的財務評估。';
  out.available = true;
  return out;
}

/* 健康／人際／學業共用牌卡骨架；各分類仍使用自己的既有 ctx 牌義、專屬導語與
   專屬措辭池。健康只談生活節奏與自我照顧，不把牌面對應成疾病或器官。 */
var REMAINING_CARD_CONFIG = {
  health: {
    leads: {
      'body-lifestyle': '關於近期壓力與生活習慣，牌面提醒：',
      'daily-balance': '關於睡眠、飲食、情緒與活動平衡，牌面顯示：',
    },
    caveat: HEALTH_DISCLAIMER + ' 牌面不對應特定器官或疾病，本次只提供生活習慣、壓力與自我照顧的象徵性提醒。',
  },
  social: {
    leads: {
      'attract-type': '關於你容易遇到的人際類型，牌面顯示：',
      'interpersonal-style': '關於你的人際優勢、盲點與界線，牌面提醒：',
      'ally-conflict': '關於合作、支持、競爭與誤解，牌面顯示：',
    },
    caveat: '以上為牌面呈現的人際互動傾向，不能代替他人說明其真實想法，也不能斷言誰一定是貴人或敵人；請以實際行為、溝通與界線為準。',
  },
  study: {
    leads: {
      'major-fit': '關於適合的科系、技能與學習方式，牌面顯示：',
      'exam-application': '關於考試、申請、留學或證照準備，牌面提醒：',
      'focus-execution': '關於專注、時間安排、理解與表達，牌面顯示：',
    },
    caveat: '以上為牌面呈現的學習傾向與準備方向，不保證考試、錄取、申請或證照結果；實際成果仍取決於準備程度、評分標準與現實條件。',
  },
};
var REMAINING_CARD_TRAITS = {
  health: {
    wands: '生活節奏偏快、行動量高，較需要安排降速與恢復時間', cups: '狀態容易受情緒與關係氛圍影響，適合建立穩定的情緒出口',
    swords: '思緒與資訊壓力較明顯，需要減少過度分析並保留睡眠品質', pentacles: '身體較重視規律、飲食與可持續習慣，適合循序調整',
    major: '目前的身心課題較像整體生活轉折，不宜簡化成單一身體部位', len_good: '整體恢復條件較有支持，適合維持有效習慣',
    len_neutral: '狀態需要持續觀察，先從作息與壓力紀錄找規律', len_bad: '目前較需要休息與現實協助，不宜勉強硬撐',
  },
  social: {
    wands: '容易遇到直接、有行動力、喜歡帶動氣氛的人', cups: '容易遇到重感受、願意傾聽、也較敏感的人',
    swords: '容易遇到理性、重視觀點與溝通效率的人', pentacles: '容易遇到務實、可靠、重視長期互助的人',
    major: '近期人際可能帶來較鮮明的轉折或重要課題', len_good: '互動對象較願意支持合作，關係發展相對順暢',
    len_neutral: '互動需要時間觀察與磨合，不宜太早定義關係', len_bad: '互動中可能有防衛、誤解或利益衝突，需要保留界線',
  },
  study: {
    wands: '較適合目標明確、能實作與快速得到回饋的學習方式', cups: '較適合有故事、圖像、情感連結或人際互動的內容',
    swords: '較適合分析、閱讀、寫作、辯證與資訊整理型學習', pentacles: '較適合反覆練習、做題、實作與穩定累積的方式',
    major: '學習方向可能正經歷較大的選擇或轉換，需要先確認核心目標', len_good: '目前學習資源與回饋較有支持，適合延續有效方法',
    len_neutral: '學習方向仍需比較與試做，再決定主要投入項目', len_bad: '目前可能有基礎漏洞、壓力或方法不合，需要先處理卡點',
  },
};
var REMAINING_TONE_POOL = {
  health: {
    trend: { positive:'整體狀態有回穩空間，維持規律比短期激烈調整更有幫助', neutral:'狀態仍在波動，適合記錄睡眠、飲食、活動與壓力的變化', challenging:'近期負荷偏高，應優先休息並留意實際不適是否需要專業協助' },
    favor: { positive:'已經有效的作息與支持系統，是目前最重要的助力', neutral:'小幅但能持續的生活調整，比一次改很多更容易維持', challenging:'願意求助、休息並降低負荷，是目前重要的保護因素' },
    risk: { positive:'好轉時仍別一次恢復過多活動，避免忽略身體回饋', neutral:'容易因忙碌而跳過休息，或用短期刺激取代真正恢復', challenging:'不宜把牌面當成診斷，也不要因占卜結果延後就醫' },
    action: { positive:'延續有效習慣，安排固定的睡眠、飲食與活動節奏', neutral:'一次選一項最影響生活的習慣，連續觀察並逐步調整', challenging:'先降低負荷；若有持續或嚴重不適，請尋求合格醫療人員協助' },
  },
  social: {
    trend: { positive:'互動有增加信任與合作的空間，主動而真誠會帶來進展', neutral:'關係仍在觀察與磨合期，走向取決於後續溝通', challenging:'近期容易出現立場差異或誤解，先降溫再確認事實' },
    favor: { positive:'清楚表達與可靠行動，是建立支持關係的主要優勢', neutral:'願意傾聽並確認彼此理解，會比急著說服更有幫助', challenging:'保留界線並尋找中立資訊，能降低被情緒帶走的風險' },
    risk: { positive:'關係順利時也別忽略界線與互惠，避免單方面付出', neutral:'容易用猜測代替確認，或為了合群壓下真實需求', challenging:'需留意操控、排擠、利益不透明或反覆踩界線的行為' },
    action: { positive:'可以主動安排一次具體合作或坦白對話，累積信任', neutral:'先說明你的觀察與需求，再詢問對方的理解', challenging:'暫停高衝突互動，保存事實並清楚設定可接受的界線' },
  },
  study: {
    trend: { positive:'準備方向逐漸清楚，持續執行容易看到累積成果', neutral:'仍在調整方法與節奏，需要用練習結果檢查成效', challenging:'目前有基礎或時間配置問題，先補漏洞比追趕進度重要' },
    favor: { positive:'目前的理解力與執行節奏是主要優勢，適合穩定累積', neutral:'明確計畫、回饋與分段複習，是最實際的助力', challenging:'願意求助並重整基礎，會比獨自硬撐更有效' },
    risk: { positive:'進展順利時仍要定期測驗自己，避免只有熟悉感沒有真正理解', neutral:'容易規劃過多、切換方法或拖到最後才集中準備', challenging:'焦慮、熬夜與只做擅長題目，可能讓弱點持續累積' },
    action: { positive:'維持目前方法，加入定期回想測驗與錯題整理', neutral:'把目標拆成每天可完成的任務，並依回饋調整', challenging:'先縮小範圍補最關鍵的基礎，必要時尋求老師或同學協助' },
  },
};
function cardSubtopicReadingRemaining(catKey, subtopicKey, drawnCards) {
  var out = { available:false, reason:'', catKey:catKey, subtopicKey:subtopicKey, conclusion:'', traits:'', trend:'', favor:'', risk:'', timing:'', action:'', caveat:'', tone:null };
  var cfg = REMAINING_CARD_CONFIG[catKey], subtopic = (SUBTOPICS[catKey] || []).filter(function (s) { return s.key === subtopicKey; })[0];
  if (!cfg) { out.reason = 'unsupported-category'; return out; }
  if (!subtopic) { out.reason = 'unknown-subtopic'; return out; }
  if (subtopic.modes.indexOf('cards') === -1) { out.reason = 'mode-not-supported'; return out; }
  if (!drawnCards || !drawnCards.length) { out.reason = 'no-cards'; return out; }
  var isTarot = typeof drawnCards[0].card.arcana !== 'undefined';
  var focus = drawnCards[drawnCards.length - 1];
  var seed = catKey + '|' + subtopicKey + '|' + drawnCards.map(function (d) { return (isTarot ? d.card.id : 'l'+d.card.n) + (d.reversed?'R':'U'); }).join(',');
  var base;
  if (isTarot && focus.card.rich && focus.card.rich.ctx && focus.card.rich.ctx[catKey]) base = focus.card.rich.ctx[catKey][focus.reversed ? 1 : 0];
  else if (isTarot) base = focus.reversed ? focus.card.revZh : focus.card.upZh;
  else { var lr = LEN_RICH[focus.card.n]; base = (lr && lr[catKey]) ? lr[catKey] : focus.card.mZh; }
  out.conclusion = cfg.leads[subtopicKey] + base.replace(/,/g, '，');
  var tone = loveToneBucket(drawnCards, isTarot); out.tone = tone;
  if (subtopic.fields.indexOf('traits') !== -1) {
    var group = loveCardGroup(focus.card, isTarot);
    out.traits = REMAINING_CARD_TRAITS[catKey][group] || '';
  }
  ['trend','favor','risk','action'].forEach(function (f) { if (subtopic.fields.indexOf(f) !== -1) out[f] = REMAINING_TONE_POOL[catKey][f][tone]; });
  if (subtopic.fields.indexOf('timing') !== -1) out.timing = tone === 'positive' ? '近期可依準備進度穩定推進' : (tone === 'neutral' ? '仍需一段時間準備與觀察' : '宜先補足基礎，不急著設定確切結果時間');
  out.caveat = cfg.caveat; out.available = true; return out;
}

var GENERAL_SUBTOPIC_LEAD = {
  'overall-theme':'近期整體生活最明顯的主軸是：',
  'priority-focus':'目前最值得優先處理的是：',
  'hidden-blindspot':'牌面提醒你可能忽略的是：',
  'next-direction':'下一階段可以朝這個方向前進：',
};
var GENERAL_FOCUS_BY_GROUP = {
  wands:'行動、目標與生活動力',cups:'情緒、關係與內在滿足',swords:'思考、溝通與需要做出的判斷',pentacles:'工作、資源與現實生活基礎',
  major:'目前較重要的人生轉折與整體方向',len_good:'正在形成的機會與支持',len_neutral:'需要持續觀察與調整的日常狀態',len_bad:'眼前的壓力、漏洞與需要先處理的問題',
};
var GENERAL_TONE_POOL = {
  trend:{positive:'整體趨勢較有支持，適合穩定推進並擴大已有效的做法',neutral:'目前處於整理與轉換期，方向會隨後續選擇逐漸清楚',challenging:'近期阻力偏多，先處理核心壓力比急著全面推進更實際'},
  favor:{positive:'已有的能力、支持與清楚目標，是目前最大的助力',neutral:'願意盤點現況並調整優先順序，會帶來實際幫助',challenging:'保留基本生活節奏、可信任的支持與求助管道，是重要保護'},
  risk:{positive:'順利時仍要留意一次承擔太多，避免忽略休息與細節',neutral:'容易同時關注太多問題，導致真正重要的事沒有被處理',challenging:'壓力下可能急著做重大決定或完全停擺，需要先縮小問題範圍'},
  action:{positive:'選定一個最重要的方向，延續有效做法並安排下一個具體步驟',neutral:'把待處理事項分成現在、稍後與可以放下三類，再開始行動',challenging:'先穩住安全、健康與必要責任，再處理其他長期目標'},
};
function cardSubtopicReadingGeneral(subtopicKey, drawnCards) {
  var out={available:false,reason:'',catKey:'general',subtopicKey:subtopicKey,conclusion:'',traits:'',trend:'',favor:'',risk:'',timing:'',action:'',caveat:'',tone:null};
  var subtopic=(SUBTOPICS.general||[]).filter(function(s){return s.key===subtopicKey;})[0];
  if(!subtopic){out.reason='unknown-subtopic';return out;} if(!drawnCards||!drawnCards.length){out.reason='no-cards';return out;}
  var isTarot=typeof drawnCards[0].card.arcana!=='undefined',focus=drawnCards[drawnCards.length-1];
  var base=isTarot&&focus.card.rich&&focus.card.rich.ctx&&focus.card.rich.ctx.general?focus.card.rich.ctx.general[focus.reversed?1:0]:(isTarot?(focus.reversed?focus.card.revZh:focus.card.upZh):focus.card.mZh);
  out.conclusion=GENERAL_SUBTOPIC_LEAD[subtopicKey]+base.replace(/,/g,'，');
  var tone=loveToneBucket(drawnCards,isTarot);out.tone=tone;
  if(subtopic.fields.indexOf('traits')!==-1){var group=loveCardGroup(focus.card,isTarot);out.traits='優先面向：'+(GENERAL_FOCUS_BY_GROUP[group]||GENERAL_FOCUS_BY_GROUP.len_neutral);}
  ['trend','favor','risk','action'].forEach(function(f){if(subtopic.fields.indexOf(f)!==-1)out[f]=GENERAL_TONE_POOL[f][tone];});
  out.caveat='綜合解讀呈現的是目前牌面的象徵性主題與可調整方向，不代表所有生活領域都會同時發生事件，也不是對未來結果的確定預測。';
  out.available=true;return out;
}

/* cardSubtopicReading(catKey, subtopicKey, drawnCards)
   目前支援 catKey==='love'（cardSubtopicReadingLove，Phase 1A，邏輯完全不變）與
   catKey==='career'（cardSubtopicReadingCareer，Phase 2A）；drawnCards 需為 state.drawn
   這種 {card, reversed, pos, flipped} 陣列。塔羅／雷諾曼皆由 drawnCards[0].card.arcana
   是否存在自動判斷，不需要另外傳 isTarot。回傳結構化物件，只有實際有內容的欄位才會被填入；
   catKey/subtopicKey 不支援或沒有抽牌時安全回傳 available:false，不捏造任何內容。 */
function cardSubtopicReading(catKey, subtopicKey, drawnCards) {
  if (catKey === 'career') return cardSubtopicReadingCareer(subtopicKey, drawnCards);
  if (catKey === 'family') return cardSubtopicReadingFamily(subtopicKey, drawnCards);
  if (catKey === 'wealth') return cardSubtopicReadingWealth(subtopicKey, drawnCards);
  if (['health', 'social', 'study'].indexOf(catKey) !== -1) return cardSubtopicReadingRemaining(catKey, subtopicKey, drawnCards);
  if (catKey === 'general') return cardSubtopicReadingGeneral(subtopicKey, drawnCards);
  return cardSubtopicReadingLove(catKey, subtopicKey, drawnCards);
}
function cardSubtopicReadingLove(catKey, subtopicKey, drawnCards) {
  var out = { available: false, reason: '', catKey: catKey, subtopicKey: subtopicKey, conclusion: '', traits: '', trend: '', favor: '', risk: '', timing: '', action: '', caveat: '', tone: null };
  if (catKey !== 'love') { out.reason = 'unsupported-category'; return out; }
  var subtopic = (SUBTOPICS.love || []).filter(function (s) { return s.key === subtopicKey; })[0];
  if (!subtopic) { out.reason = 'unknown-subtopic'; return out; }
  if (subtopic.modes.indexOf('cards') === -1) { out.reason = 'mode-not-supported'; return out; }
  if (!drawnCards || !drawnCards.length) { out.reason = 'no-cards'; return out; }

  var isTarot = typeof drawnCards[0].card.arcana !== 'undefined';
  var focus = loveFocusCard(drawnCards, subtopicKey);
  var seedBase = subtopicKey + '|' + drawnCards.map(function (d) {
    return (isTarot ? d.card.id : ('l' + d.card.n)) + (d.reversed ? 'R' : 'U');
  }).join(',');

  /* 核心結論：兩種組法都以「代表牌真實的 RICH.ctx.love／LEN_RICH.love 牌義句子」為底，不捏造內容——
     partner-profile 額外套上「人物輪廓」句式，避免只出現像「看清關係問題」這種跟人物無關的一般敘述；
     其餘子問題維持原本的導語＋牌義句組合方式。 */
  var baseMeaning;
  if (isTarot && focus.card.rich && focus.card.rich.ctx && focus.card.rich.ctx.love) {
    baseMeaning = focus.card.rich.ctx.love[focus.reversed ? 1 : 0];
  } else if (isTarot) {
    baseMeaning = focus.reversed ? focus.card.revZh : focus.card.upZh;
  } else {
    var lr = LEN_RICH[focus.card.n];
    baseMeaning = (lr && lr.love) ? lr.love : focus.card.mZh;
  }
  if (subtopicKey === 'partner-profile') {
    var tagPool = LOVE_PORTRAIT_TAG[loveCardGroup(focus.card, isTarot)] || LOVE_PORTRAIT_TAG.major;
    var tag = tagPool[hashStr(seedBase + '|tag') % tagPool.length];
    var baseMeaningZh = baseMeaning.replace(/,/g, '，');
    out.conclusion = '牌面首先呈現的是一位較' + tag + '的人；代表牌同時提醒你，' + baseMeaningZh;
  } else {
    var leadPool = LOVE_SUBTOPIC_LEAD[subtopicKey] || LOVE_SUBTOPIC_LEAD['partner-type'];
    var lead = leadPool[hashStr(seedBase + '|lead') % leadPool.length];
    out.conclusion = lead + baseMeaning;
  }

  /* 人物／環境特徵：依子問題對應的軸心，用「代表牌」的花色／成熟度分組，從 TRAIT_POOL 挑句組合，
     並加上 TRAIT_AXIS_LABELS 的維度標籤，讓多維度的敘述（例如 partner-profile）能清楚分項辨認 */
  var axes = LOVE_TRAIT_AXES_BY_SUBTOPIC[subtopicKey];
  if (axes && subtopic.fields.indexOf('traits') !== -1) {
    var group = loveCardGroup(focus.card, isTarot);
    var parts = axes.map(function (axis) {
      var g = axis === 'ageHint' ? loveMaturityBand(focus.card, isTarot) : group;
      var text = traitPoolPick(axis, g, seedBase + '|' + axis);
      if (!text) return '';
      var label = TRAIT_AXIS_LABELS[axis] || axis;
      return label + '：' + text;
    }).filter(function (t) { return !!t; });
    out.traits = parts.join('；');
  }

  /* 發展趨勢／有利因素／風險阻礙／可執行建議／時間傾向：依整體牌陣語氣挑句，只填子問題有要求的欄位 */
  var tone = loveToneBucket(drawnCards, isTarot);
  out.tone = tone; // Phase 1C：純新增的非 UI meta 欄位，供 combinedReading() 比對牌卡／星盤語氣，不影響既有欄位
  ['trend', 'favor', 'risk', 'action', 'timing'].forEach(function (f) {
    if (subtopic.fields.indexOf(f) === -1) return;
    var pool = (LOVE_TONE_POOL[f] && LOVE_TONE_POOL[f][tone]) || [];
    if (!pool.length) return;
    out[f] = pool[hashStr(seedBase + '|' + f) % pool.length];
  });

  if (subtopic.fields.indexOf('caveat') !== -1) {
    out.caveat = '以上描述是牌面象徵與可能傾向，並非對現實人物或事件的確定預測，實際情況仍需以你自己的觀察與相處為準。';
  }

  out.available = true;
  return out;
}

/* UI：把 cardSubtopicReading() 的結構化結果畫成「具體問題解讀」區塊，只在選了 subtopic 時呼叫；
   只顯示該子問題 fields 有列出、且實際有內容的欄位，不製造空標題。 */
var SUBTOPIC_FIELD_LABELS = {
  conclusion: ['核心結論', 'Conclusion'],
  traits: ['人物／環境特徵', 'Traits'],
  trend: ['發展趨勢', 'Trend'],
  favor: ['有利因素', 'Favorable'],
  risk: ['風險或阻礙', 'Risk'],
  timing: ['時間傾向', 'Timing'],
  action: ['可執行建議', 'Action'],
  caveat: ['不確定性提醒', 'Caveat'],
};
var SUBTOPIC_FIELD_ORDER = ['conclusion', 'traits', 'trend', 'favor', 'risk', 'timing', 'action', 'caveat'];
var SUBTOPIC_UI_CAVEAT = {
  cards: '牌面呈現的是象徵與可能傾向，請以實際觀察與自己的判斷為準。',
  astro: '星盤描述的是個人傾向，會受出生資料完整度影響，不代表確定結果。',
  combined: '牌卡與星盤皆為探索參考，不是對人物或未來的確定預測。',
};
/* titleText 為選填參數：cards-only 模式沿用預設「具體問題解讀」（與 Phase 1A 完全一致的輸出，
   逐位元組不變）；Phase 1C 的 combined 模式呼叫時會傳入「牌卡具體解讀」以清楚標示這是哪一邊的內容。 */
function renderSubtopicResultPanel(subtopicDef, result, titleText) {
  if (!result || !result.available) return '';
  var title = titleText || '具體問題解讀';
  var isCombinedDetail = titleText === '牌卡具體解讀';
  var h = '<div style="border:1px solid rgba(201,169,110,.4);border-radius:10px;padding:15px 17px;background:rgba(255,255,255,.02);margin-top:12px">';
  if (isCombinedDetail) {
    h += '<details><summary style="min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;list-style:none;font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#e6cd9a;text-transform:uppercase">✦ ' + esc(title) + '<span style="font:400 10px \'Noto Sans TC\',sans-serif;letter-spacing:0;color:rgba(240,233,216,.45);white-space:nowrap">點擊展開</span></summary>';
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:2px;line-height:1.6">' + esc(subtopicDef.zh) + '</div>';
  } else {
    h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#e6cd9a;text-transform:uppercase">✦ ' + esc(title) + ' · ' + esc(subtopicDef.zh) + '</div>';
  }
  h += '<div style="margin-top:9px;display:flex;flex-direction:column;gap:9px">';
  SUBTOPIC_FIELD_ORDER.forEach(function (f) {
    if (subtopicDef.fields.indexOf(f) === -1) return;
    var val = result[f];
    if (!val) return;
    if (f === 'caveat') val = SUBTOPIC_UI_CAVEAT.cards;
    var label = SUBTOPIC_FIELD_LABELS[f];
    h += '<div><span style="font:500 10px \'Noto Sans TC\',sans-serif;letter-spacing:.06em;color:#c9a96e">' + label[0] + ' <span style="font:italic 9px \'EB Garamond\',serif;color:rgba(201,169,110,.6)">' + label[1] + '</span></span>';
    h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:3px;line-height:1.8;text-align:justify">' + esc(val) + '</div></div>';
  });
  h += '</div>';
  if (isCombinedDetail) h += '</details>';
  h += '</div>';
  return h;
}

/* Phase 1C：把 astroCategoryReading() 的結果畫成「星盤補充解讀」區塊，只在 combined 模式、
   且 astroResult.available 時呼叫。內部資料不足／被排除的項目一律轉成中文說明，
   絕不顯示內部英文 reason 代碼或 undefined。 */
var ASTRO_SKIP_ITEM_LABELS = {
  Venus: '金星', Mars: '火星', Moon: '月亮', Sun: '太陽', Mercury: '水星', Jupiter: '木星', Saturn: '土星',
  house5: '第五宮', house7: '第七宮', house2: '第二宮', house6: '第六宮', house10: '第十宮', MC: '天頂（MC）',
  'moon-aspects': '月亮相關相位',
};
var ASTRO_SKIP_REASON_LABELS = {
  'unknown-time-unreliable': '出生時間未知，可靠度不足而不使用',
  'not-in-chart': '星盤資料中沒有這項資訊',
  'invalid-sign-data': '星座資料異常，無法使用',
  'invalid-house-data': '宮位資料異常，無法使用',
  'no-house-data': '缺少宮位資料',
  'unknown-time': '出生時間未知，此宮位資訊未使用',
};
function renderAstroSubtopicPanel(subtopicDef, result) {
  if (!result || !result.available) return '';
  var h = '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:15px 17px;background:rgba(255,255,255,.02);margin-top:12px">';
  h += '<details><summary style="min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;list-style:none;font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#c9a96e;text-transform:uppercase">✧ 星盤補充解讀<span style="font:400 10px \'Noto Sans TC\',sans-serif;letter-spacing:0;color:rgba(240,233,216,.45);white-space:nowrap">點擊展開</span></summary>';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:2px;line-height:1.6">' + esc(subtopicDef.zh) + '</div>';
  h += '<div style="margin-top:9px;display:flex;flex-direction:column;gap:9px">';
  SUBTOPIC_FIELD_ORDER.forEach(function (f) {
    if (subtopicDef.fields.indexOf(f) === -1) return;
    var val = result[f];
    if (!val) return;
    if (f === 'caveat') val = SUBTOPIC_UI_CAVEAT.astro;
    var label = SUBTOPIC_FIELD_LABELS[f];
    h += '<div><span style="font:500 10px \'Noto Sans TC\',sans-serif;letter-spacing:.06em;color:#c9a96e">' + label[0] + ' <span style="font:italic 9px \'EB Garamond\',serif;color:rgba(201,169,110,.6)">' + label[1] + '</span></span>';
    h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:3px;line-height:1.8;text-align:justify">' + esc(val) + '</div></div>';
  });
  h += '</div>';
  if (result.evidence && result.evidence.used && result.evidence.used.length) {
    h += '<details style="margin-top:9px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);cursor:pointer">本次使用的星盤依據</summary>';
    h += '<div style="margin-top:6px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);line-height:1.8">';
    result.evidence.used.forEach(function (u) { h += '· ' + esc(u) + '<br>'; });
    h += '</div></details>';
  }
  if (result.evidence && result.evidence.skipped && result.evidence.skipped.length) {
    var skipText = result.evidence.skipped.map(function (s) {
      var itemLabel = ASTRO_SKIP_ITEM_LABELS[s.item] || s.item;
      var reasonLabel = ASTRO_SKIP_REASON_LABELS[s.reason] || '資料不足';
      return itemLabel + '（' + reasonLabel + '）';
    }).join('、');
    h += '<div style="margin-top:9px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);line-height:1.8">本次未使用：' + esc(skipText) + '</div>';
  }
  h += '</details></div>';
  return h;
}

/* Phase 1C：牌卡＋星盤綜合觀察面板，只在 combinedReading() 回傳 mode==='combined' 時呼叫
  （cards-only／astro-only／unavailable 都不顯示這個面板——沒有兩邊資料就沒有「綜合」可言）。 */
var COMBINED_AGREEMENT_LABELS = {
  agree: '牌卡與星盤方向一致：目前狀態呼應長期傾向',
  differ: '牌卡與星盤時間尺度不同：目前狀態與長期傾向出現落差',
  unknown: '資料不足以判斷牌卡與星盤是否一致',
};
function renderCombinedSummaryPanel(subtopicDef, result) {
  if (!result || !result.available || result.mode !== 'combined') return '';
  var h = '<div style="border:1px solid rgba(201,169,110,.45);border-radius:10px;padding:15px 17px;background:rgba(201,169,110,.06);margin-top:12px">';
  h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#e6cd9a;text-transform:uppercase">✦ 牌卡＋星盤綜合觀察 · ' + esc(subtopicDef.zh) + '</div>';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);margin-top:4px">' + esc(COMBINED_AGREEMENT_LABELS[result.agreement] || '') + '</div>';
  h += '<div style="margin-top:11px;display:flex;flex-direction:column;gap:10px">';
  ['conclusion', 'action'].forEach(function (f) {
    if (subtopicDef.fields.indexOf(f) === -1 || !result[f]) return;
    var label = SUBTOPIC_FIELD_LABELS[f];
    h += '<div><span style="font:500 10px \'Noto Sans TC\',sans-serif;letter-spacing:.06em;color:#c9a96e">' + label[0] + ' <span style="font:italic 9px \'EB Garamond\',serif;color:rgba(201,169,110,.6)">' + label[1] + '</span></span>';
    h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:3px;line-height:1.75;text-align:justify">' + esc(result[f]) + '</div></div>';
  });
  h += '</div>';
  h += '<details style="margin-top:10px"><summary style="min-height:44px;display:flex;align-items:center;cursor:pointer;font:400 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">查看完整綜合解讀</summary>';
  h += '<div style="display:flex;flex-direction:column;gap:9px;padding-top:3px">';
  SUBTOPIC_FIELD_ORDER.forEach(function (f) {
    if (f === 'conclusion' || f === 'action') return;
    if (subtopicDef.fields.indexOf(f) === -1) return;
    var val = result[f];
    if (!val) return;
    if (f === 'caveat') val = SUBTOPIC_UI_CAVEAT.combined;
    var label = SUBTOPIC_FIELD_LABELS[f];
    h += '<div><span style="font:500 10px \'Noto Sans TC\',sans-serif;letter-spacing:.06em;color:#c9a96e">' + label[0] + ' <span style="font:italic 9px \'EB Garamond\',serif;color:rgba(201,169,110,.6)">' + label[1] + '</span></span>';
    h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:3px;line-height:1.8;text-align:justify">' + esc(val) + '</div></div>';
  });
  h += '</div></details></div>';
  return h;
}

/* ---- classic card combos: theme stacking regardless of orientation ---- */
var CLASSIC_COMBOS = [
  { ids: ['m13', 'm16'], text: '死神與高塔同時出現，顯示變動的力道非常強烈——這不是漸進式的調整，而是舊有結構被連根拔起的劇烈轉折。建議做好心理準備，而非抗拒它的發生。' },
  { ids: ['m6', 'm15'], text: '戀人與惡魔同時出現，指出感情或選擇中存在「明知不健康卻難以割捨」的拉扯，建議誠實面對這段關係或決定中真正束縛你的部分。' },
  { ids: ['m17', 'm18'], text: '星星與月亮同時出現，顯示希望與不確定感並存——內心一邊懷抱信念，一邊仍對現況感到迷茫，建議給自己多一點時間讓迷霧散去，不必急著看清全貌。' },
  { ids: ['m19', 'm21'], text: '太陽與世界同時出現，是非常正向的組合，顯示這件事有機會走向圓滿且值得慶祝的結果。' },
  { ids: ['swords-3', 'swords-10'], text: '寶劍三與寶劍十同時出現，情感或處境上的痛感被放大，顯示這段經歷可能相當煎熬，但寶劍十也暗示這已經是谷底，之後會逐漸好轉。' },
  { ids: ['cups-9', 'cups-10'], text: '聖杯九與聖杯十同時出現，是情感滿足與圓滿的強烈訊號，顯示這件事很有機會達到讓人由衷滿意的結果。' },
  { ids: ['m0', 'm1'], text: '愚人與魔術師同時出現，顯示不只有新開始的衝動，更具備了實際執行的能力與資源，是「想法」與「行動力」都到位的組合。' },
  { ids: ['m12', 'm9'], text: '倒吊人與隱士同時出現，暗示目前不是行動的時機，而是需要沉澱、換位思考、向內探尋答案的階段。' },
  { ids: ['wands-5', 'swords-5'], text: '權杖五與寶劍五同時出現，顯示衝突不只在表面競爭，更牽涉到言語或心理層面的較量，建議留意溝通方式，避免兩敗俱傷。' },
  { ids: ['pentacles-10', 'm4'], text: '錢幣十與皇帝同時出現，指向穩固的長期架構與傳承，適合考慮更長遠、制度性的規劃。' },
];

/* full spread analysis: detailed stats insights + combo detection */
function analyzeSpread(drawn, isTarot) {
  var out = [];
  if (!isTarot || !drawn.length) return out;
  var total = drawn.length;
  var majors = drawn.filter(function (d) { return d.card.arcana === 'major'; }).length;
  if (total >= 3) {
    if (majors / total >= 0.5) out.push('這次牌陣中大阿爾克那（' + majors + '/' + total + '）佔比很高，顯示這不是日常小事，而是牽動人生方向的重大課題，結果的影響力可能比表面問題更深遠。');
    else if (majors === 0) out.push('這次牌陣全部由小阿爾克那組成，顯示這件事更偏向日常、具體的生活層面，而非命運性的重大轉折，調整具體做法就能看到改變。');
  }
  var suitCounts = { wands: 0, cups: 0, swords: 0, pentacles: 0 };
  drawn.forEach(function (d) { if (d.card.suit) suitCounts[d.card.suit]++; });
  var minorTotal = total - majors;
  if (minorTotal >= 2) {
    var suitLabels = { wands: '權杖（行動與熱情）', cups: '聖杯（情感與關係）', swords: '寶劍（思維與衝突）', pentacles: '錢幣（現實與資源）' };
    var dom = null, domN = 0;
    Object.keys(suitCounts).forEach(function (s) { if (suitCounts[s] > domN) { domN = suitCounts[s]; dom = s; } });
    if (dom && domN / minorTotal >= 0.5 && domN >= 2) out.push('小阿爾克那中' + suitLabels[dom] + '明顯集中出現，顯示這件事的關鍵因素落在這個層面，建議把注意力優先放在這裡。');
  }
  var rev = drawn.filter(function (d) { return d.reversed; }).length;
  if (total >= 3) {
    if (rev / total >= 0.6) out.push('逆位牌比例偏高（' + rev + '/' + total + '），暗示目前內在阻力較大、能量卡住或有些狀況尚未攤開來面對，建議先處理內在的猶豫，而不是急著往外行動。');
    else if (rev === 0) out.push('這次牌陣全部正位，顯示能量流動順暢，事情發展相對明朗，阻力主要來自外在客觀條件而非內在猶豫。');
  }
  var ids = {};
  drawn.forEach(function (d) { ids[d.card.id] = true; });
  CLASSIC_COMBOS.forEach(function (combo) {
    if (combo.ids.every(function (id) { return ids[id]; })) out.push(combo.text);
  });
  return out;
}

/* ---- statistical layer over the whole draw ---- */
var SUIT_INSIGHT = {
  wands: '權杖能量集中，主軸在行動力與企圖心',
  cups: '聖杯能量集中，主軸在情感與關係',
  swords: '寶劍能量集中，主軸在思緒與溝通的拉扯',
  pentacles: '錢幣能量集中，主軸在現實與資源',
};
function drawInsights(drawn, isTarot) {
  var out = [];
  var n = drawn.length;
  if (!isTarot || n < 3) return out;
  var majors = drawn.filter(function (d) { return d.card.arcana === 'major'; }).length;
  if (majors / n >= 0.5) out.push('大牌比例偏高，這是人生層級的重要轉折，而非日常小事');
  var suitCount = {};
  drawn.forEach(function (d) { if (d.card.suit) suitCount[d.card.suit] = (suitCount[d.card.suit] || 0) + 1; });
  var topSuit = null, topN = 0;
  Object.keys(suitCount).forEach(function (s) { if (suitCount[s] > topN) { topN = suitCount[s]; topSuit = s; } });
  if (topSuit && topN >= Math.max(2, Math.ceil(n / 2))) out.push(SUIT_INSIGHT[topSuit]);
  var rev = drawn.filter(function (d) { return d.reversed; }).length;
  if (rev / n >= 0.5) out.push('逆位偏多，內在阻力較大、能量暫時卡住');
  return out.slice(0, 2);
}

function overallReading() {
  var isTarot = state.deck === 'tarot';
  var drawn = state.drawn;
  if (!drawn.length) return '';
  var score = 0;
  drawn.forEach(function (d) {
    if (isTarot) {
      var neg = NEG_TAROT_IDS.indexOf(d.card.id) !== -1;
      if (neg && !d.reversed) score -= 1;
      else if (!neg && d.reversed) score -= 1;
      else if (!neg && !d.reversed) score += 1; // reversed challenging card = release, neutral
    } else {
      score += NEG_LEN_NS.indexOf(d.card.n) !== -1 ? -1 : 1;
    }
  });
  var ratio = score / drawn.length;
  var toneIdx = ratio > 0.34 ? 0 : (ratio < -0.34 ? 2 : 1);
  var toneTxt = ['整體能量明亮而流動', '正向與提醒交織', '能量偏向沉澱與提醒'][toneIdx];
  var insights = drawInsights(drawn, isTarot);

  function cardClause(d) {
    return d.pos.zh + '的' + cardLabel(d, isTarot) + '——' + roleLead(posRole(d.pos.zh), cardKw(d, isTarot, 2), d);
  }
  var parts = [];
  var tail = '';
  if (drawn.length === 1) {
    parts.push('你抽到的' + cardLabel(drawn[0], isTarot) + '，帶來' + cardKw(drawn[0], isTarot, 3) + '的訊息');
  } else if (drawn.length <= 3) {
    drawn.forEach(function (d) { parts.push(cardClause(d)); });
  } else {
    var ci = -1;
    for (var i = 1; i < drawn.length - 1; i++) {
      if (/阻礙|挑戰|恐懼/.test(drawn[i].pos.zh)) { ci = i; break; }
    }
    if (ci === -1) ci = Math.floor(drawn.length / 2);
    var rawPicks = drawn.length >= 5
      ? [0, ci, Math.floor(drawn.length / 2), drawn.length - 2, drawn.length - 1]
      : [0, ci, drawn.length - 1];
    var picks = rawPicks.filter(function (v, i2, a) { return v >= 0 && v < drawn.length && a.indexOf(v) === i2; });
    picks.forEach(function (pi) { parts.push(cardClause(drawn[pi])); });
    tail = '其餘的牌' + (toneIdx === 0 ? '大多順勢支持這股流動' : '則提醒你留意過程中的變數');
  }
  var advice = CAT_ADVICE[state.category][toneIdx === 2 ? 1 : 0];

  function assemble(ins, withTail, nCards) {
    var ps = parts.slice(0, nCards);
    if (withTail && tail) ps = ps.concat([tail]);
    return CAT_OPENERS[state.category] + '，這組牌' + toneTxt +
      (ins.length ? '；' + ins.join('；') : '') + '。' +
      ps.join('；') + '。整體而言，' + advice + '。';
  }
  var cap = drawn.length >= 5 ? 320 : 200;
  var txt = assemble(insights, true, parts.length);
  if (txt.length > cap) txt = assemble(insights, false, parts.length);
  if (txt.length > cap) txt = assemble(insights, false, Math.min(3, parts.length));
  if (txt.length > cap) txt = assemble(insights, false, 2);
  if (txt.length > cap) txt = assemble(insights.slice(0, 1), false, 2);
  return txt;
}

function shuffledIndices(n, count) {
  var idx = [];
  for (var i = 0; i < n; i++) idx.push(i);
  for (var j = idx.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var t = idx[j]; idx[j] = idx[k]; idx[k] = t;
  }
  return idx.slice(0, count);
}

var _shuffleTimer = null;
function startReading() {
  var data = state.deck === 'tarot' ? TAROT : LENORMAND;
  state.drawn = [];
  state.picked = [];
  state.phase = 'focus';
  render();
  clearTimeout(_shuffleTimer);
  _shuffleTimer = setTimeout(function () {
    state.phase = 'shuffling';
    render();
    _shuffleTimer = setTimeout(function () {
      state.pickOrder = shuffledIndices(data.length, data.length);
      if (state.deck === 'lenormand' && state.spread === 'grand') {
        // 大牌陣:36 張全發,直接面朝上展開
        state.picked = state.pickOrder.map(function (_, i) { return i; });
        buildDrawn();
        return;
      }
      state.phase = 'picking';
      render();
    }, 2400);
  }, 2600);
}

function pickCard(j) {
  if (state.phase !== 'picking') return;
  var need = currentSpreads()[state.spread].positions.length;
  if (state.picked.indexOf(j) !== -1 || state.picked.length >= need) return;
  state.picked.push(j);
  fxPick();
  var cell = document.getElementById('pick-' + j);
  if (cell) {
    cell.style.transform += ' translateY(-16px)';
    cell.style.borderColor = '#e6cd9a';
    cell.style.boxShadow = '0 0 16px 3px rgba(230,205,154,.55)';
    cell.style.zIndex = '5';
    cell.insertAdjacentHTML('beforeend', '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 17px \'Noto Serif TC\',serif;color:#e6cd9a;text-shadow:0 0 8px rgba(20,17,26,.9)">' + state.picked.length + '</div>');
  }
  var counter = document.getElementById('pick-count');
  if (counter) counter.textContent = '已選 ' + state.picked.length + ' / ' + need;
  if (state.picked.length >= need) setTimeout(buildDrawn, 450);
}

function autoPickCards() {
  if (state.phase !== 'picking') return;
  var need = currentSpreads()[state.spread].positions.length;
  var available = [];
  for (var i = 0; i < state.pickOrder.length; i++) if (state.picked.indexOf(i) === -1) available.push(i);
  while (state.picked.length < need && available.length) {
    var at = Math.floor(Math.random() * available.length);
    state.picked.push(available.splice(at, 1)[0]);
  }
  fxPick();
  setTimeout(buildDrawn, 300);
}

function buildDrawn() {
  var isTarot = state.deck === 'tarot';
  var data = isTarot ? TAROT : LENORMAND;
  var spreads = currentSpreads();
  var positions = spreads[state.spread].positions;
  state.drawn = state.picked.map(function (j, i) {
    return { card: data[state.pickOrder[j]], reversed: isTarot ? Math.random() < 0.5 : false, flipped: state.spread === 'grand', pos: positions[i] };
  });
  state.phase = 'result';
  var cat = CATEGORIES.find(function (x) { return x.key === state.category; });
  var summary = state.drawn.map(function (d) {
    var orient = isTarot ? (d.reversed ? '（逆）' : '（正）') : '';
    return d.pos.zh + ': ' + d.card.nameZh + orient;
  }).join('　');
  var entry = {
    date: new Date().toISOString(),
    typeLabel: isTarot ? '塔羅' : '雷諾曼',
    spreadLabel: spreads[state.spread].zh,
    summary: summary,
    categoryLabel: cat ? cat.zh : '',
    question: state.question || '',
    target: state.target || '',
    timeframe: isTarot ? '' : timeframeLabel(),
    detail: {
      deck: state.deck,
      overall: overallReading(),
      analysis: analyzeSpread(state.drawn, isTarot),
      pairs: (isTarot || state.spread === 'grand' || state.spread === 'box9') ? [] : lenPairs(state.drawn),
      cards: state.drawn.map(function (d) {
        return {
          name: d.card.nameZh, nameEn: d.card.nameEn, pos: d.pos.zh, rev: isTarot ? d.reversed : null,
          text: cardPosText(d, isTarot),
          core: cardCoreMeaning(d, isTarot), blindSpot: cardBlindSpot(d, isTarot),
          action: cardAction(d, isTarot), reminder: cardReminder(d, isTarot),
        };
      }),
      /* Phase 1A/1C/2A：新增欄位，僅在愛情或事業分類且選了具體子問題時才有值；不影響既有欄位／
         舊歷史紀錄格式，歷史列表畫面（renderHistory／historyCopyForAI／分享圖片）本階段尚未讀取
         這些欄位，留待後續階段（見完成報告）。reading 是 Phase 1A 就存在的舊欄位，維持不變；
         readingMode／cardReading／astroReading／combinedReading 是 Phase 1C 新增欄位（事業目前
         沒有星盤引擎，astroReading／combinedReading 固定為 null，readingMode 固定為 'cards'，
         不臨時捏造）；catKey 是 Phase 2A 純新增欄位，方便未來區分是哪個分類的子問題結果。 */
      subtopic: (state.subtopic && SUBTOPICS[state.category]) ? (function () {
        var def = (SUBTOPICS[state.category] || []).filter(function (s) { return s.key === state.subtopic; })[0];
        if (!def) return null;
        var hasAstroEngine = ['love', 'career', 'family', 'wealth', 'health', 'social', 'study', 'general'].indexOf(state.category) !== -1;
        var cardRes = cardSubtopicReading(state.category, state.subtopic, state.drawn);
        var astroRes = (hasAstroEngine && state.readingMode === 'combined' && state.astroResult)
          ? astroCategoryReading(state.category, state.subtopic, state.astroResult, state.astroUnknownTime) : null;
        var combRes = (astroRes && astroRes.available) ? combinedReading(cardRes, astroRes, state.category, state.subtopic) : null;
        return {
          key: state.subtopic, zh: def.zh, catKey: state.category,
          reading: cardRes,
          readingMode: hasAstroEngine ? state.readingMode : 'cards',
          cardReading: cardRes,
          astroReading: astroRes,
          combinedReading: combRes,
        };
      })() : null,
    },
  };
  state.history = [entry].concat(state.history).slice(0, 30);
  try { localStorage.setItem('tl_history', JSON.stringify(state.history)); } catch (e) {}
  render();
}

function flipCardAt(i) {
  state.drawn[i].flipped = !state.drawn[i].flipped;
  doFlip('card-' + i, state.drawn[i].flipped);
  var m = document.getElementById('card-meaning-' + i);
  if (m) m.style.display = state.drawn[i].flipped ? 'block' : 'none';
  var lg = document.getElementById('legend-' + i);
  if (lg) {
    var d = state.drawn[i];
    lg.textContent = (i + 1) + '．' + d.pos.zh + (d.flipped ? '：' + d.card.nameZh + (d.reversed ? '（逆）' : '') : '');
  }
  var flipBtn = document.getElementById('flip-button-' + i);
  if (flipBtn) {
    var fd = state.drawn[i];
    flipBtn.setAttribute('aria-label', fd.flipped ? ('第 ' + (i + 1) + ' 張，' + fd.pos.zh + '，' + fd.card.nameZh) : ('翻開第 ' + (i + 1) + ' 張牌，位置：' + fd.pos.zh));
  }
  updateSummaryVisibility();
}

function flipAll() {
  var delay = 0;
  state.drawn.forEach(function (d, i) {
    if (!d.flipped) {
      d.flipped = true;
      (function (idx, dl) {
        setTimeout(function () {
          doFlip('card-' + idx, true);
          var m = document.getElementById('card-meaning-' + idx);
          if (m) m.style.display = 'block';
          var d2 = state.drawn[idx];
          var lg = document.getElementById('legend-' + idx);
          if (lg) {
            lg.textContent = (idx + 1) + '．' + d2.pos.zh + '：' + d2.card.nameZh + (d2.reversed ? '（逆）' : '');
          }
          var fb = document.getElementById('flip-button-' + idx);
          if (fb) fb.setAttribute('aria-label', '第 ' + (idx + 1) + ' 張，' + d2.pos.zh + '，' + d2.card.nameZh);
          updateSummaryVisibility();
        }, dl);
      })(i, delay);
      delay += 160;
    }
  });
  updateSummaryVisibility();
}

function updateSummaryVisibility() {
  var el = document.getElementById('summary-panel');
  if (el) el.style.display = allFlipped() ? 'block' : 'none';
}

/* flip everything, then scroll down to the full meanings panel */
function revealMeanings() {
  var unflipped = state.drawn.filter(function (d) { return !d.flipped; }).length;
  flipAll();
  setTimeout(function () {
    var el = document.getElementById('summary-panel');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, unflipped ? unflipped * 160 + 500 : 100);
}

var _copyTimer = null;
var _astroCopyTimer = null;
function flashCopied() {
  state.copied = true;
  var btn = document.getElementById('copy-btn');
  if (btn) btn.textContent = '已複製！Copied';
  clearTimeout(_copyTimer);
  _copyTimer = setTimeout(function () {
    state.copied = false;
    var b = document.getElementById('copy-btn');
    if (b) b.textContent = '複製給 AI 解讀 Copy for AI';
  }, 2000);
}

function fallbackCopy(text, onDone) {
  try {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    (onDone || flashCopied)();
  } catch (e) {}
}

/* ---- 複製給 AI 解讀：解讀語氣人格 ----
   使用者可以挑選不同的「分析者」風格，這只會影響貼到複製文字最後面、
   告訴外部 AI「請用什麼語氣回答」的那一行指示，不影響上面的資料本身。 */
var AI_PERSONAS = [
  {
    key: 'moon', name: '月見', tagline: '溫暖敘事，原版語氣',
    instruction: '請以「月見」的風格回答：語氣溫暖而有畫面感，適度使用比喻，在指出課題的同時給予鼓勵，讓人讀完覺得被理解也有方向。',
  },
  {
    key: 'blade', name: '拆局者', tagline: '直接犀利，不繞路',
    instruction: '請以「拆局者」的風格回答：直接點出核心盲點，不繞彎、不過度包裝，用簡短有力的句子把問題攤開，最後給一個明確可行的解法。',
  },
  {
    key: 'blank', name: '留白', tagline: '簡要，只留重點',
    instruction: '請以「留白」的風格回答：極度精簡，只保留最關鍵的一兩個重點，避免任何鋪陳、比喻或重複，句子越短越好。',
  },
  {
    key: 'warmlight', name: '暖光', tagline: '溫暖療癒，先接住情緒',
    instruction: '請以「暖光」的風格回答：語氣柔軟、像陪伴一樣，先同理感受再給建議，多使用肯定與安撫的字眼，避免任何批判性的用語。',
  },
  {
    key: 'compass', name: '羅盤', tagline: '理性務實，給具體步驟',
    instruction: '請以「羅盤」的風格回答：用結構化的方式呈現，先給診斷、再列出具體可執行的步驟（可用編號），語氣理性務實，避免情緒化的形容詞。',
  },
  {
    key: 'random', name: '擲筊', tagline: '每次隨機，讓緣分決定',
    instruction: '', // 特殊處理：實際風格在 personaInstructionLine() 裡每次重新抽一位
  },
];
function findAiPersona(key) { return AI_PERSONAS.find(function (p) { return p.key === key; }) || AI_PERSONAS[0]; }
/* 「擲筊」模式：每次複製都重新從其餘 5 位分析者裡隨機抽一位，並在複製出來的
   文字裡註明這次抽到誰，讓使用者事後回頭看也知道當時是哪種語氣 */
function personaInstructionLine() {
  if (state.aiPersona === 'random') {
    var pool = AI_PERSONAS.filter(function (p) { return p.key !== 'random'; });
    var pick = pool[Math.floor(Math.random() * pool.length)];
    return '（本次擲筊抽到「' + pick.name + '」為你解讀）\n' + pick.instruction;
  }
  return findAiPersona(state.aiPersona).instruction;
}
function setAiPersona(key) {
  state.aiPersona = key;
  try { localStorage.setItem('tl_ai_persona', key); } catch (e) {}
  render();
}
/* 放在每個「複製給 AI 解讀」按鈕正上方的小選擇器，所有風格（含隨機的擲筊）共用同一套 state.aiPersona */
function renderPersonaPicker() {
  /* tagline used to live only in the title="" attribute, which mobile touch
     browsers never show (no hover, no long-press tooltip) — so on phones
     every non-selected persona was just an unexplained name. Each option now
     prints its own tagline underneath, always visible regardless of device. */
  var h = '<div style="margin-top:16px">';
  h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-bottom:6px">解讀語氣 AI Tone</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
  AI_PERSONAS.forEach(function (p) {
    var on = state.aiPersona === p.key;
    h += '<button type="button" aria-pressed="' + on + '" onclick="setAiPersona(\'' + p.key + '\')" style="text-align:left;padding:8px 10px;border-radius:10px;border:1px solid ' + (on ? '#c9a96e' : 'rgba(201,169,110,.28)') + ';background:' + (on ? 'rgba(201,169,110,.18)' : 'rgba(255,255,255,.02)') + ';cursor:pointer">';
    h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:' + (on ? '#f0e9d8' : 'rgba(240,233,216,.72)') + '">' + esc(p.name) + '</div>';
    h += '<div style="font:400 9px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.42);margin-top:2px;line-height:1.4">' + esc(p.tagline) + '</div>';
    h += '</button>';
  });
  h += '</div>';
  h += '</div>';
  return h;
}

function copyForAI() {
  var isTarot = state.deck === 'tarot';
  var spreads = currentSpreads();
  if (!state.drawn.length) return;
  var cat = CATEGORIES.find(function (x) { return x.key === state.category; });
  var lines = [];
  lines.push('占卜類型：' + (isTarot ? '塔羅牌 Tarot' : '雷諾曼牌 Lenormand'));
  if (cat) lines.push('占卜主題：' + cat.zh + ' (' + cat.en + ')');
  if (state.target) lines.push('對象：' + state.target);
  if (state.question) lines.push('問題：' + state.question);
  lines.push('牌陣：' + spreads[state.spread].zh + ' (' + spreads[state.spread].en + ')');
  lines.push('');
  state.drawn.forEach(function (d) {
    var c = d.card;
    var orient = isTarot ? (d.reversed ? '逆位 Reversed' : '正位 Upright') : '';
    lines.push(d.pos.zh + '（' + d.pos.en + '）：' + c.nameZh + ' ' + c.nameEn + (orient ? '，' + orient : ''));
    lines.push('　核心訊息：' + cardCoreMeaning(d, isTarot));
    lines.push('　目前狀態：' + cardPosText(d, isTarot));
    lines.push('　可能的盲點：' + cardBlindSpot(d, isTarot));
    lines.push('　建議採取的行動：' + cardAction(d, isTarot));
    lines.push('　一句提醒：' + cardReminder(d, isTarot));
  });
  lines.push('');
  if (!isTarot && state.drawn.length >= 2) {
    lines.push('組牌解讀：' + lenPairs(state.drawn).map(function (p2) { return p2.label + '＝' + p2.text; }).join('；'));
  }
  lines.push('初步綜合解讀：' + overallReading());
  var _an = analyzeSpread(state.drawn, isTarot);
  if (_an.length) lines.push('牌陣分析：' + _an.join(' '));
  /* Phase 1A/1C：純新增段落，只有愛情分類且選了具體子問題時才會輸出，不影響既有輸出內容。
     combined 模式（且有 state.astroResult）時，額外附加星盤依據與綜合觀察段落。 */
  if (state.category === 'love' && state.subtopic) {
    var loveSubDef2 = (SUBTOPICS.love || []).filter(function (s) { return s.key === state.subtopic; })[0];
    var subRes = loveSubDef2 ? cardSubtopicReading('love', state.subtopic, state.drawn) : null;
    if (subRes && subRes.available) {
      lines.push('');
      lines.push('具體問題解讀（牌卡）：' + loveSubDef2.zh);
      SUBTOPIC_FIELD_ORDER.forEach(function (f) {
        if (loveSubDef2.fields.indexOf(f) === -1 || !subRes[f]) return;
        lines.push('　' + SUBTOPIC_FIELD_LABELS[f][0] + '：' + subRes[f]);
      });
      if (state.readingMode === 'combined' && state.astroResult) {
        var astroRes2 = astroCategoryReading('love', state.subtopic, state.astroResult, state.astroUnknownTime);
        if (astroRes2.available) {
          lines.push('');
          lines.push('具體問題解讀（星盤）：' + loveSubDef2.zh);
          SUBTOPIC_FIELD_ORDER.forEach(function (f) {
            if (loveSubDef2.fields.indexOf(f) === -1 || !astroRes2[f]) return;
            lines.push('　' + SUBTOPIC_FIELD_LABELS[f][0] + '：' + astroRes2[f]);
          });
          if (astroRes2.evidence && astroRes2.evidence.used.length) {
            lines.push('　星盤依據：' + astroRes2.evidence.used.join('；'));
          }
          var combRes2 = combinedReading(subRes, astroRes2, 'love', state.subtopic);
          if (combRes2.available && combRes2.mode === 'combined') {
            lines.push('');
            lines.push('牌卡＋星盤綜合觀察：' + loveSubDef2.zh);
            SUBTOPIC_FIELD_ORDER.forEach(function (f) {
              if (loveSubDef2.fields.indexOf(f) === -1 || !combRes2[f]) return;
              lines.push('　' + SUBTOPIC_FIELD_LABELS[f][0] + '：' + combRes2[f]);
            });
          }
        }
      }
    }
  } else if (state.category === 'career' && state.subtopic) {
    /* Phase 2A：事業牌卡段落，純新增，只有事業分類且選了具體子問題時才會輸出，不影響既有輸出
       內容；複製給 AI 一律輸出完整欄位與完整 caveat（不像畫面上的折疊面板只顯示摘要）。
       career-talent 是 astro-only 子問題，cardSubtopicReading() 對它固定回傳 available:false，
       這裡會自動跳過牌卡段落，不會出現空標題。 */
    var careerSubDef2 = (SUBTOPICS.career || []).filter(function (s) { return s.key === state.subtopic; })[0];
    var careerRes2 = careerSubDef2 ? cardSubtopicReading('career', state.subtopic, state.drawn) : null;
    if (careerRes2 && careerRes2.available) {
      lines.push('');
      lines.push('具體問題解讀（事業）：' + careerSubDef2.zh);
      SUBTOPIC_FIELD_ORDER.forEach(function (f) {
        if (careerSubDef2.fields.indexOf(f) === -1 || !careerRes2[f]) return;
        lines.push('　' + SUBTOPIC_FIELD_LABELS[f][0] + '：' + careerRes2[f]);
      });
    }
    /* Phase 2B：combined 模式（且有 state.astroResult）時，額外附加事業星盤完整解讀、
       實際星盤依據，以及牌卡＋星盤綜合觀察；career-talent 沒有牌卡結果時，清楚標示為
       「星盤限定 astro-only」，不假裝有牌卡內容。 */
    if (careerSubDef2 && state.readingMode === 'combined' && state.astroResult) {
      var careerAstroRes2 = astroCategoryReading('career', state.subtopic, state.astroResult, state.astroUnknownTime);
      if (careerAstroRes2.available) {
        var hasCareerCard2 = !!(careerRes2 && careerRes2.available);
        lines.push('');
        lines.push('具體問題解讀（事業星盤）：' + careerSubDef2.zh + (hasCareerCard2 ? '' : '（星盤限定 astro-only，本題無牌卡模式）'));
        SUBTOPIC_FIELD_ORDER.forEach(function (f) {
          if (careerSubDef2.fields.indexOf(f) === -1 || !careerAstroRes2[f]) return;
          lines.push('　' + SUBTOPIC_FIELD_LABELS[f][0] + '：' + careerAstroRes2[f]);
        });
        if (careerAstroRes2.evidence && careerAstroRes2.evidence.used.length) {
          lines.push('　星盤依據：' + careerAstroRes2.evidence.used.join('；'));
        }
        var careerCombRes2 = combinedReading(careerRes2, careerAstroRes2, 'career', state.subtopic);
        if (careerCombRes2.available && careerCombRes2.mode === 'combined') {
          lines.push('');
          lines.push('牌卡＋星盤綜合觀察（事業）：' + careerSubDef2.zh);
          SUBTOPIC_FIELD_ORDER.forEach(function (f) {
            if (careerSubDef2.fields.indexOf(f) === -1 || !careerCombRes2[f]) return;
            lines.push('　' + SUBTOPIC_FIELD_LABELS[f][0] + '：' + careerCombRes2[f]);
          });
        }
      }
    }
  } else if (state.category === 'family' && state.subtopic) {
    var familySubDef2 = (SUBTOPICS.family || []).filter(function (s) { return s.key === state.subtopic; })[0];
    var familyRes2 = familySubDef2 ? cardSubtopicReading('family', state.subtopic, state.drawn) : null;
    if (familyRes2 && familyRes2.available) {
      lines.push('');
      lines.push('具體問題解讀（家庭牌卡）：' + familySubDef2.zh);
      SUBTOPIC_FIELD_ORDER.forEach(function (f) {
        if (familySubDef2.fields.indexOf(f) !== -1 && familyRes2[f]) lines.push('　' + SUBTOPIC_FIELD_LABELS[f][0] + '：' + familyRes2[f]);
      });
    }
    if (familySubDef2 && state.readingMode === 'combined' && state.astroResult) {
      var familyAstroRes2 = astroCategoryReading('family', state.subtopic, state.astroResult, state.astroUnknownTime);
      if (familyAstroRes2.available) {
        lines.push('');
        lines.push('具體問題解讀（家庭星盤）：' + familySubDef2.zh);
        SUBTOPIC_FIELD_ORDER.forEach(function (f) {
          if (familySubDef2.fields.indexOf(f) !== -1 && familyAstroRes2[f]) lines.push('　' + SUBTOPIC_FIELD_LABELS[f][0] + '：' + familyAstroRes2[f]);
        });
        if (familyAstroRes2.evidence && familyAstroRes2.evidence.used.length) lines.push('　星盤依據：' + familyAstroRes2.evidence.used.join('；'));
        var familyCombRes2 = combinedReading(familyRes2, familyAstroRes2, 'family', state.subtopic);
        if (familyCombRes2.available && familyCombRes2.mode === 'combined') {
          lines.push('');
          lines.push('牌卡＋星盤綜合觀察（家庭）：' + familySubDef2.zh);
          SUBTOPIC_FIELD_ORDER.forEach(function (f) {
            if (familySubDef2.fields.indexOf(f) !== -1 && familyCombRes2[f]) lines.push('　' + SUBTOPIC_FIELD_LABELS[f][0] + '：' + familyCombRes2[f]);
          });
        }
      } else if (state.astroUnknownTime) {
        lines.push('');
        lines.push('家庭星盤補充：出生時間未知，本次不使用月亮與第四宮進行家庭解讀，因此只保留牌卡結果。');
      }
    }
  } else if (state.category === 'wealth' && state.subtopic) {
    var wealthSubDef2 = (SUBTOPICS.wealth || []).filter(function (s) { return s.key === state.subtopic; })[0];
    var wealthRes2 = wealthSubDef2 ? cardSubtopicReading('wealth', state.subtopic, state.drawn) : null;
    if (wealthRes2 && wealthRes2.available) {
      lines.push('');
      lines.push('具體問題解讀（財運牌卡）：' + wealthSubDef2.zh);
      SUBTOPIC_FIELD_ORDER.forEach(function (f) {
        if (wealthSubDef2.fields.indexOf(f) !== -1 && wealthRes2[f]) lines.push('　' + SUBTOPIC_FIELD_LABELS[f][0] + '：' + wealthRes2[f]);
      });
    }
    if (wealthSubDef2 && state.readingMode === 'combined' && state.astroResult) {
      var wealthAstroRes2 = astroCategoryReading('wealth', state.subtopic, state.astroResult, state.astroUnknownTime);
      if (wealthAstroRes2.available) {
        lines.push('');
        lines.push('具體問題解讀（財運星盤）：' + wealthSubDef2.zh + (wealthRes2 && wealthRes2.available ? '' : '（星盤限定 astro-only，本題無牌卡模式）'));
        SUBTOPIC_FIELD_ORDER.forEach(function (f) {
          if (wealthSubDef2.fields.indexOf(f) !== -1 && wealthAstroRes2[f]) lines.push('　' + SUBTOPIC_FIELD_LABELS[f][0] + '：' + wealthAstroRes2[f]);
        });
        if (wealthAstroRes2.evidence && wealthAstroRes2.evidence.used.length) lines.push('　星盤依據：' + wealthAstroRes2.evidence.used.join('；'));
        var wealthCombRes2 = combinedReading(wealthRes2, wealthAstroRes2, 'wealth', state.subtopic);
        if (wealthCombRes2.available && wealthCombRes2.mode === 'combined') {
          lines.push('');
          lines.push('牌卡＋星盤綜合觀察（財運）：' + wealthSubDef2.zh);
          SUBTOPIC_FIELD_ORDER.forEach(function (f) {
            if (wealthSubDef2.fields.indexOf(f) !== -1 && wealthCombRes2[f]) lines.push('　' + SUBTOPIC_FIELD_LABELS[f][0] + '：' + wealthCombRes2[f]);
          });
        }
      }
    }
  } else if (['health', 'social', 'study', 'general'].indexOf(state.category) !== -1 && state.subtopic) {
    var remCat2 = state.category;
    var remNames2 = {health:'健康',social:'人際',study:'學業',general:'綜合'};
    var remSubDef2 = (SUBTOPICS[remCat2] || []).filter(function(s){return s.key===state.subtopic;})[0];
    var remCardRes2 = remSubDef2 ? cardSubtopicReading(remCat2,state.subtopic,state.drawn) : null;
    if (remCardRes2 && remCardRes2.available) {
      lines.push(''); lines.push('具體問題解讀（'+remNames2[remCat2]+'牌卡）：'+remSubDef2.zh);
      SUBTOPIC_FIELD_ORDER.forEach(function(f){if(remSubDef2.fields.indexOf(f)!==-1&&remCardRes2[f])lines.push('　'+SUBTOPIC_FIELD_LABELS[f][0]+'：'+remCardRes2[f]);});
    }
    if (remSubDef2 && state.readingMode==='combined' && state.astroResult) {
      var remAstroRes2=astroCategoryReading(remCat2,state.subtopic,state.astroResult,state.astroUnknownTime);
      if(remAstroRes2.available){
        lines.push(''); lines.push('具體問題解讀（'+remNames2[remCat2]+'星盤）：'+remSubDef2.zh+(remCardRes2&&remCardRes2.available?'':'（星盤限定 astro-only，本題無牌卡模式）'));
        SUBTOPIC_FIELD_ORDER.forEach(function(f){if(remSubDef2.fields.indexOf(f)!==-1&&remAstroRes2[f])lines.push('　'+SUBTOPIC_FIELD_LABELS[f][0]+'：'+remAstroRes2[f]);});
        if(remAstroRes2.evidence&&remAstroRes2.evidence.used.length)lines.push('　星盤依據：'+remAstroRes2.evidence.used.join('；'));
        var remCombRes2=combinedReading(remCardRes2,remAstroRes2,remCat2,state.subtopic);
        if(remCombRes2.available&&remCombRes2.mode==='combined'){
          lines.push(''); lines.push('牌卡＋星盤綜合觀察（'+remNames2[remCat2]+'）：'+remSubDef2.zh);
          SUBTOPIC_FIELD_ORDER.forEach(function(f){if(remSubDef2.fields.indexOf(f)!==-1&&remCombRes2[f])lines.push('　'+SUBTOPIC_FIELD_LABELS[f][0]+'：'+remCombRes2[f]);});
        }
      }
    }
  }
  lines.push('');
  lines.push('請根據以上牌陣，幫我解讀這次占卜的整體意義。');
  lines.push(personaInstructionLine());
  var text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(flashCopied).catch(function () { fallbackCopy(text); });
  } else {
    fallbackCopy(text);
  }
}

/* ---------- library ---------- */

var LIB_SUITS = [
  { key: 'all', zh: '全部' }, { key: 'major', zh: '大牌' }, { key: 'wands', zh: '權杖' },
  { key: 'cups', zh: '聖杯' }, { key: 'swords', zh: '寶劍' }, { key: 'pentacles', zh: '錢幣' },
];

function renderLibrary() {
  var libIsTarot = state.libDeck === 'tarot';
  var h = '';
  h += '<div style="padding:0 20px">';
  h += '<div style="font:600 18px \'Noto Serif TC\',serif;color:#f0e9d8;text-align:center">牌義典藏</div>';
  h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.45);text-align:center;margin-top:2px">Card Meaning Library</div>';

  if (state.libQuiz && state.quiz) {
    h += renderQuiz();
    h += '</div>';
    return h;
  }

  var data = libIsTarot ? TAROT : LENORMAND;
  var detail = null;
  if (state.libSelected) {
    detail = data.find(function (c) { return (libIsTarot ? c.id : ('l' + c.n)) === state.libSelected; });
  }

  if (detail) {
    h += '<div style="margin-top:20px">';
    h += '<button onclick="closeLibCard()" style="background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;font:400 12px \'Noto Sans TC\',sans-serif;padding:7px 16px;border-radius:16px;cursor:pointer">‹ 返回列表 Back</button>';
    h += '<div style="display:flex;gap:16px;margin-top:16px;align-items:flex-start">';
    h += '<div style="flex:none;width:130px;aspect-ratio:150/230;border-radius:8px;border:1px solid #d8b96c;overflow:hidden;background:#f2e9d8;display:flex;flex-direction:column">' + cardImgHtml(detail.img, detail.nameZh) + '</div>';
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font:600 12px \'Noto Serif TC\',serif;color:#c9a96e">' + esc(libIsTarot ? detail.num : detail.n) + '</div>';
    h += '<div style="font:600 20px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:2px">' + esc(detail.nameZh) + '</div>';
    h += '<div style="font:italic 12px \'EB Garamond\',serif;color:rgba(240,233,216,.5)">' + esc(detail.nameEn) + '</div>';
    if (!libIsTarot && LEN_RICH[detail.n]) {
      var lr0 = LEN_RICH[detail.n];
      var toneColor = lr0.tone === '吉' ? '#9fce9f' : (lr0.tone === '凶' ? '#d99b5f' : 'rgba(240,233,216,.6)');
      h += '<div style="margin-top:8px"><span style="display:inline-block;font:500 10px \'Noto Sans TC\',sans-serif;border:1px solid ' + toneColor + ';color:' + toneColor + ';border-radius:10px;padding:2px 9px">傾向 ' + lr0.tone + '</span>';
      h += '<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-left:8px">對應撲克：' + lr0.pc + '</span></div>';
    }
    h += '</div></div>';
    h += '<div style="margin-top:22px;display:flex;flex-direction:column;gap:14px">';
    h += '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:14px 16px;background:rgba(201,169,110,.06)">';
    h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#c9a96e;text-transform:uppercase">' + (libIsTarot ? '正位 Upright' : '牌義 Meaning') + '</div>';
    h += '<div style="font:500 14px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:6px;line-height:1.6">' + esc(libIsTarot ? detail.upZh : detail.mZh) + '</div>';
    h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.5);margin-top:3px">' + esc(libIsTarot ? detail.upEn : detail.mEn) + '</div>';
    h += '</div>';
    if (libIsTarot) {
      h += '<div style="border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:14px 16px;background:rgba(255,255,255,.02)">';
      h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase">逆位 Reversed</div>';
      h += '<div style="font:500 14px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:6px;line-height:1.6">' + esc(detail.revZh) + '</div>';
      h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.5);margin-top:3px">' + esc(detail.revEn) + '</div>';
      h += '</div>';
    }
    if (libIsTarot && detail.rich) {
      var rr = detail.rich;
      function chips(arr, on) {
        return arr.map(function (k) {
          return '<span style="display:inline-block;font:400 11px \'Noto Sans TC\',sans-serif;border:1px solid ' + (on ? 'rgba(201,169,110,.45)' : 'rgba(255,255,255,.15)') + ';color:' + (on ? '#e6cd9a' : 'rgba(240,233,216,.55)') + ';border-radius:12px;padding:3px 10px;margin:3px 4px 0 0">' + esc(k) + '</span>';
        }).join('');
      }
      h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:14px 16px;background:rgba(255,255,255,.02)">';
      h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase">關鍵字 Keywords</div>';
      h += '<div style="margin-top:6px"><span style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">正位</span><br>' + chips(rr.ku, true) + '</div>';
      h += '<div style="margin-top:9px"><span style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">逆位</span><br>' + chips(rr.kr, false) + '</div>';
      h += '</div>';
      h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:14px 16px;background:rgba(255,255,255,.02)">';
      h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase">情境牌義 In Context</div>';
      [['love', '愛情'], ['career', '事業'], ['family', '家庭'], ['health', '健康'], ['wealth', '財運'], ['social', '人際'], ['study', '學業'], ['general', '綜合']].forEach(function (p) {
        if (!rr.ctx[p[0]]) return;
        h += '<div style="margin-top:10px">';
        h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + p[1] + '</div>';
        h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.85);margin-top:3px;line-height:1.65">正位：' + esc(rr.ctx[p[0]][0]) + '</div>';
        h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);margin-top:2px;line-height:1.65">逆位：' + esc(rr.ctx[p[0]][1]) + '</div>';
        h += '</div>';
      });
      h += '</div>';
    }
    if (!libIsTarot && LEN_RICH[detail.n]) {
      var lr = LEN_RICH[detail.n];
      // 核心牌義
      h += '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:14px 16px;background:rgba(255,255,255,.02)">';
      h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#c9a96e;text-transform:uppercase">核心牌義 Core Meaning</div>';
      h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:7px;line-height:1.8">' + esc(lr.mean) + '</div>';
      h += '<div style="margin-top:9px">' + lr.kw.map(function (k) {
        return '<span style="display:inline-block;font:400 11px \'Noto Sans TC\',sans-serif;border:1px solid rgba(201,169,110,.45);color:#e6cd9a;border-radius:12px;padding:3px 10px;margin:3px 4px 0 0">' + esc(k) + '</span>';
      }).join('') + '</div>';
      h += '</div>';
      // 情境牌義
      h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:14px 16px;background:rgba(255,255,255,.02)">';
      h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase">情境牌義 In Context</div>';
      [['love', '愛情', lr.love], ['career', '事業', lr.career], ['advice', '建議', lr.advice]].forEach(function (p3) {
        h += '<div style="margin-top:10px">';
        h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + p3[1] + '</div>';
        h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.85);margin-top:3px;line-height:1.65">' + esc(p3[2]) + '</div>';
        h += '</div>';
      });
      h += '</div>';
      // 組牌提示
      var combi = LEN_COMBI[detail.n];
      h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:14px 16px;background:rgba(255,255,255,.02)">';
      h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase">組牌提示 In Combinations</div>';
      if (combi) {
        h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.85);margin-top:8px;line-height:1.7">作為主題時：<span style="color:#e6cd9a">' + esc(combi.n) + '</span><br>修飾他牌時：<span style="color:#e6cd9a">' + esc(combi.m) + '⋯</span></div>';
      }
      var pairKeys = Object.keys(LEN_PAIR_OVERRIDES).filter(function (k2) {
        var ab = k2.split('-');
        return +ab[0] === detail.n || +ab[1] === detail.n;
      }).slice(0, 4);
      if (pairKeys.length) {
        h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);margin-top:11px">經典組合</div>';
        pairKeys.forEach(function (k3) {
          var ab2 = k3.split('-');
          var ca = LENORMAND.find(function (x) { return x.n === +ab2[0]; });
          var cb = LENORMAND.find(function (x) { return x.n === +ab2[1]; });
          h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.8);margin-top:5px;line-height:1.6">「' + ca.nameZh + ' ＋ ' + cb.nameZh + '」：' + esc(LEN_PAIR_OVERRIDES[k3]) + '</div>';
        });
      }
      h += '</div>';
    }
    h += '</div></div>';
  } else {
    // deck tabs
    h += '<div style="display:flex;margin-top:18px;border-bottom:1px solid rgba(201,169,110,.15)">';
    [{ key: 'tarot', zh: '塔羅 78 張' }, { key: 'lenormand', zh: '雷諾曼 36 張' }].forEach(function (t) {
      var active = t.key === state.libDeck;
      h += '<button type="button" onclick="setLibDeck(\'' + t.key + '\')" style="min-height:44px;flex:1;background:none;border:none;border-bottom:2px solid ' + (active ? '#c9a96e' : 'transparent') + ';color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.4)') + ';padding:10px 4px;cursor:pointer;font:500 13px \'Noto Sans TC\',sans-serif">' + t.zh + '</button>';
    });
    h += '</div>';
    if (libIsTarot) h += renderMnemonic();
    else { h += renderLenMnemonic(); h += renderComboLookup(); }
    // quiz + mastery progress
    var mc = masteredCount(libIsTarot);
    var deckTotal = libIsTarot ? TAROT.length : LENORMAND.length;
    h += '<div style="display:flex;align-items:center;gap:12px;margin-top:12px;border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:11px 14px;background:rgba(255,255,255,.02)">';
    h += '<button type="button" onclick="quizStart()" style="min-height:44px;flex:none;font:500 12px \'Noto Sans TC\',sans-serif;background:linear-gradient(120deg,#c9a96e,#e6cd9a);color:#1a1622;border:none;padding:9px 18px;border-radius:22px;cursor:pointer">🎯 牌義測驗</button>';
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">已掌握 ' + mc + ' / ' + deckTotal + ' 張</div>';
    h += '<div style="height:4px;border-radius:2px;background:rgba(201,169,110,.15);margin-top:5px;overflow:hidden"><div style="width:' + Math.round(mc / deckTotal * 100) + '%;height:100%;background:linear-gradient(90deg,#c9a96e,#e6cd9a)"></div></div>';
    h += '</div></div>';
    // suit pills
    var suits = libIsTarot ? LIB_SUITS : [{ key: 'all', zh: '全部' }];
    h += '<div style="display:flex;gap:8px;margin-top:14px;overflow-x:auto;padding-bottom:4px">';
    suits.forEach(function (su) {
      var active = su.key === state.libSuit;
      h += '<button type="button" onclick="setLibSuit(\'' + su.key + '\')" style="min-height:44px;flex:none;background:' + (active ? 'rgba(201,169,110,.18)' : 'transparent') + ';border:1px solid ' + (active ? '#c9a96e' : 'rgba(201,169,110,.3)') + ';color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.55)') + ';padding:8px 13px;border-radius:22px;cursor:pointer;font:500 11px \'Noto Sans TC\',sans-serif;white-space:nowrap">' + su.zh + '</button>';
    });
    h += '</div>';
    // grid
    var filtered = (libIsTarot && state.libSuit !== 'all')
      ? data.filter(function (c) { return c.arcana === 'major' ? state.libSuit === 'major' : c.suit === state.libSuit; })
      : data;
    h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px 10px;margin-top:18px">';
    filtered.forEach(function (c) {
      var key = libIsTarot ? c.id : ('l' + c.n);
      h += '<div role="button" tabindex="0" aria-label="查看' + esc(c.nameZh) + '完整牌義" onclick="selectLibCard(\'' + key + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();selectLibCard(\'' + key + '\')}" style="cursor:pointer;display:flex;flex-direction:column;gap:5px;position:relative">';
      if (isMastered(key)) h += '<div style="position:absolute;top:-5px;right:-5px;width:17px;height:17px;border-radius:50%;background:#c9a96e;color:#1a1622;font:600 10px sans-serif;display:flex;align-items:center;justify-content:center;z-index:2">✓</div>';
      h += '<div style="width:100%;aspect-ratio:150/230;border-radius:6px;border:1px solid rgba(216,185,108,.5);overflow:hidden;background:#f2e9d8;display:flex;flex-direction:column">';
      if (c.img) {
        h += '<img src="' + cardThumbSrc(c.img) + '" alt="' + esc(c.nameZh) + '" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:contain;display:block">';
      } else {
        h += '<div style="flex:1;display:flex;align-items:center;justify-content:center;font:600 15px \'Noto Serif TC\',serif;color:#a9784f">' + esc(libIsTarot ? c.num : c.n) + '</div>';
      }
      h += '</div>';
      h += '<div style="text-align:center;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.8);line-height:1.3">' + esc(c.nameZh) + '</div>';
      h += '</div>';
    });
    h += '</div>';
  }
  h += '</div>';
  return h;
}

/* ---------- history ---------- */

function fmtDate(iso) {
  var d = new Date(iso);
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function histOpen(i) { state.histSelected = i; render(); window.scrollTo(0, 0); }
function histClose() { state.histSelected = null; render(); }

var _histCopyTimer = null;
function historyFlashCopied() {
  var btn = document.getElementById('hist-copy-btn');
  if (btn) btn.textContent = '已複製！Copied';
  clearTimeout(_histCopyTimer);
  _histCopyTimer = setTimeout(function () {
    var b = document.getElementById('hist-copy-btn');
    if (b) b.textContent = '複製給 AI 解讀 Copy for AI';
  }, 2000);
}
function historySubtopicResult(st) {
  if (!st) return null;
  if (st.readingMode === 'combined' && st.combinedReading && st.combinedReading.available) return st.combinedReading;
  if (st.cardReading && st.cardReading.available) return st.cardReading;
  if (st.reading && st.reading.available) return st.reading;
  if (st.astroReading && st.astroReading.available) return st.astroReading;
  return null;
}
function appendHistorySubtopicCopy(lines, st) {
  if (!st) return;
  lines.push('具體問題：' + (st.zh || st.key || ''));
  var sections = [
    ['牌卡解讀', st.cardReading || st.reading],
    ['星盤補充解讀', st.astroReading],
    ['牌卡＋星盤綜合觀察', st.combinedReading],
  ];
  sections.forEach(function (section) {
    var result = section[1];
    if (!result || !result.available) return;
    lines.push(section[0] + '：');
    SUBTOPIC_FIELD_ORDER.forEach(function (f) {
      if (result[f]) lines.push('　' + SUBTOPIC_FIELD_LABELS[f][0] + '：' + result[f]);
    });
    if (result.evidence && result.evidence.used && result.evidence.used.length) {
      lines.push('　星盤依據：' + result.evidence.used.join('；'));
    }
  });
  lines.push('');
}
function renderHistorySubtopic(st) {
  if (!st) return '';
  var result = historySubtopicResult(st);
  if (!result) return '';
  var h = '<div style="border:1px solid rgba(201,169,110,.35);border-radius:10px;padding:15px 17px;background:rgba(201,169,110,.06);margin-top:12px">';
  h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.08em;color:#e6cd9a">✦ 具體問題解讀</div>';
  h += '<div style="font:500 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:5px;line-height:1.7">' + esc(st.zh || st.key || '') + '</div>';
  h += '<div style="margin-top:9px;display:flex;flex-direction:column;gap:8px">';
  SUBTOPIC_FIELD_ORDER.forEach(function (f) {
    if (!result[f]) return;
    var val = f === 'caveat' ? SUBTOPIC_UI_CAVEAT[result.mode === 'combined' ? 'combined' : (st.readingMode === 'combined' ? 'astro' : 'cards')] : result[f];
    h += '<div><span style="font:500 10px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + SUBTOPIC_FIELD_LABELS[f][0] + '</span>';
    h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.85);line-height:1.75;margin-top:2px;text-align:justify">' + esc(val) + '</div></div>';
  });
  h += '</div>';
  if (st.readingMode === 'combined' && (st.cardReading || st.astroReading)) {
    h += '<details style="margin-top:9px"><summary style="min-height:44px;display:flex;align-items:center;font:500 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);cursor:pointer">查看當時的牌卡與星盤分項</summary>';
    [['牌卡',st.cardReading || st.reading],['星盤',st.astroReading]].forEach(function (section) {
      if (!section[1] || !section[1].available || !section[1].conclusion) return;
      h += '<div style="margin-top:6px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.7);line-height:1.7"><span style="color:#c9a96e">' + section[0] + '：</span>' + esc(section[1].conclusion) + '</div>';
    });
    h += '</details>';
  }
  return h + '</div>';
}
function historyCopyForAI() {
  if (state.histSelected === null || !state.history[state.histSelected]) return;
  var e = state.history[state.histSelected];
  var dt = e.detail;
  var lines = [];
  lines.push('占卜紀錄回顧 Past Reading');
  lines.push('類型：' + e.typeLabel + ' · ' + e.spreadLabel + (e.categoryLabel ? ' · ' + e.categoryLabel : ''));
  lines.push('時間：' + fmtDate(e.date));
  if (e.target) lines.push('對象：' + e.target);
  if (e.question) lines.push('問題：' + e.question);
  lines.push('');
  if (dt) {
    if (dt.cards && dt.cards.length) {
      lines.push('抽到的牌：');
      dt.cards.forEach(function (cd) {
        lines.push('- ' + cd.pos + '：' + cd.name + ' ' + cd.nameEn + (cd.rev !== null && cd.rev !== undefined ? (cd.rev ? '（逆位）' : '（正位）') : '') + (cd.text ? '——' + cd.text : ''));
        if (cd.blindSpot) lines.push('　可能的盲點：' + cd.blindSpot);
        if (cd.action) lines.push('　建議採取的行動：' + cd.action);
        if (cd.reminder) lines.push('　一句提醒：' + cd.reminder);
      });
      lines.push('');
    }
    if (dt.pairs && dt.pairs.length) {
      lines.push('組牌解讀：');
      dt.pairs.forEach(function (pr) { lines.push('- ' + pr.label + '：' + pr.text); });
      lines.push('');
    }
    if (dt.analysis && dt.analysis.length) {
      lines.push('牌陣分析：');
      dt.analysis.forEach(function (t) { lines.push('- ' + t); });
      lines.push('');
    }
    if (dt.overall) { lines.push('綜合解讀：' + dt.overall); lines.push(''); }
    appendHistorySubtopicCopy(lines, dt.subtopic);
  } else if (e.summary) {
    lines.push('摘要：' + e.summary);
    lines.push('');
  }
  lines.push('請根據以上這次占卜紀錄，幫我重新解讀一次，並補充我當初可能沒注意到的細節或提醒。');
  lines.push(personaInstructionLine());
  var text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(historyFlashCopied).catch(function () { fallbackCopy(text, historyFlashCopied); });
  } else {
    fallbackCopy(text, historyFlashCopied);
  }
}

function renderHistory() {
  var h = '';
  h += '<div style="padding:0 20px">';
  h += '<div style="font:600 18px \'Noto Serif TC\',serif;color:#f0e9d8;text-align:center">抽牌歷史</div>';
  h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.45);text-align:center;margin-top:2px">Reading History</div>';

  // ---- detail view: full replay of a past reading ----
  if (state.histSelected !== null && state.history[state.histSelected]) {
    var e = state.history[state.histSelected];
    var dt = e.detail;
    h += '<div style="margin-top:20px">';
    h += '<button onclick="histClose()" style="background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;font:400 12px \'Noto Sans TC\',sans-serif;padding:7px 16px;border-radius:16px;cursor:pointer">‹ 返回列表 Back</button>';
    h += '<div style="text-align:center;margin-top:16px">';
    h += '<div style="font:500 13px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + esc(e.typeLabel) + ' · ' + esc(e.spreadLabel) + (e.categoryLabel ? ' · ' + esc(e.categoryLabel) : '') + '</div>';
    h += '<div style="font:400 11px \'EB Garamond\',serif;color:rgba(240,233,216,.4);margin-top:3px">' + fmtDate(e.date) + '</div>';
    if (e.question || e.target) h += '<div style="font:italic 12px \'EB Garamond\',serif;color:rgba(240,233,216,.5);margin-top:6px">' + (e.target ? '關於「' + esc(e.target) + '」' : '') + (e.question ? '「' + esc(e.question) + '」' : '') + '</div>';
    h += '</div>';
    if (dt) {
      if (dt.overall) {
        h += '<div style="border:1px solid rgba(201,169,110,.4);border-radius:10px;padding:15px 17px;background:rgba(201,169,110,.09);margin-top:18px">';
        h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#e6cd9a;text-transform:uppercase">✦ 綜合解讀 Overall Reading</div>';
        h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:8px;line-height:1.9;text-align:justify">' + esc(dt.overall) + '</div>';
        h += '</div>';
      }
      h += renderHistorySubtopic(dt.subtopic);
      if (dt.analysis && dt.analysis.length) {
        h += '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:15px 17px;background:rgba(255,255,255,.02);margin-top:12px">';
        h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#c9a96e;text-transform:uppercase">✧ 牌陣分析 Spread Analysis</div>';
        dt.analysis.forEach(function (t) {
          h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.85);margin-top:9px;line-height:1.8;text-align:justify;padding-left:14px;position:relative"><span style="position:absolute;left:0;color:#c9a96e">·</span>' + esc(t) + '</div>';
        });
        h += '</div>';
      }
      if (dt.pairs && dt.pairs.length) {
        h += '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:15px 17px;background:rgba(255,255,255,.02);margin-top:12px">';
        h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#c9a96e;text-transform:uppercase">✧ 組牌解讀 Pair Reading</div>';
        dt.pairs.forEach(function (pr) {
          h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.85);margin-top:9px;line-height:1.8">「' + esc(pr.label) + '」：' + esc(pr.text) + '</div>';
        });
        h += '</div>';
      }
      h += '<div style="display:flex;flex-direction:column;gap:12px;margin-top:12px">';
      (dt.cards || []).forEach(function (cd) {
        h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:12px 16px;background:rgba(255,255,255,.02)">';
        h += '<div style="display:flex;justify-content:space-between;align-items:baseline">';
        h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.08em;color:#c9a96e;text-transform:uppercase">' + esc(cd.pos) + '</div>';
        if (cd.rev !== null && cd.rev !== undefined) h += '<div style="font:400 10px \'EB Garamond\',serif;color:rgba(240,233,216,.4)">' + (cd.rev ? '逆位 Reversed' : '正位 Upright') + '</div>';
        h += '</div>';
        h += '<div style="font:600 14px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:4px">' + esc(cd.name) + ' <span style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.5)">' + esc(cd.nameEn) + '</span></div>';
        var histFields = [];
        if (cd.core) histFields.push(['核心訊息', cd.core]);
        histFields.push(['目前狀態', cd.text]);
        if (cd.blindSpot) histFields.push(['可能的盲點', cd.blindSpot]);
        if (cd.action) histFields.push(['建議採取的行動', cd.action]);
        h += '<div style="margin-top:7px;display:flex;flex-direction:column;gap:6px">';
        histFields.forEach(function (f) {
          h += '<div><span style="font:500 10px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + f[0] + '</span><div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.85);margin-top:2px;line-height:1.7">' + esc(f[1]) + '</div></div>';
        });
        h += '</div>';
        if (cd.reminder) h += '<div style="margin-top:8px;padding:7px 11px;border-left:2px solid #c9a96e;background:rgba(201,169,110,.07)"><span style="font:500 10px \'Noto Sans TC\',sans-serif;color:#e6cd9a">一句提醒 </span><span style="font:italic 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8">' + esc(cd.reminder) + '</span></div>';
        h += '</div>';
      });
      h += '</div>';
    } else {
      h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);margin-top:18px;line-height:1.8;text-align:center">' + esc(e.summary) + '<br><span style="color:rgba(240,233,216,.35);font-size:11px">（此為舊格式紀錄，僅保留摘要）</span></div>';
    }
    h += renderPersonaPicker();
    h += '<button id="hist-copy-btn" onclick="historyCopyForAI()" style="width:100%;margin-top:22px;padding:12px;border-radius:12px;border:1px solid #c9a96e;background:rgba(201,169,110,.12);color:#e6cd9a;font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">複製給 AI 解讀 Copy for AI</button>';
    h += '</div></div>';
    return h;
  }

  // ---- list view ----
  if (state.history.length) {
    h += '<div style="text-align:center;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);margin-top:10px">點擊紀錄可回看完整解讀</div>';
    h += '<div style="display:flex;flex-direction:column;gap:12px;margin-top:14px">';
    state.history.forEach(function (e, idx) {
      h += '<div onclick="histOpen(' + idx + ')" style="border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:14px 16px;background:rgba(255,255,255,.02);cursor:pointer">';
      h += '<div style="display:flex;justify-content:space-between;align-items:baseline">';
      h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + esc(e.typeLabel) + ' · ' + esc(e.spreadLabel) + (e.categoryLabel ? ' · ' + esc(e.categoryLabel) : '') + '</div>';
      h += '<div style="font:400 10px \'EB Garamond\',serif;color:rgba(240,233,216,.4)">' + fmtDate(e.date) + '</div>';
      h += '</div>';
      if (e.question || e.target) h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.4);margin-top:4px">' + (e.target ? '關於「' + esc(e.target) + '」' : '') + (e.question ? '「' + esc(e.question) + '」' : '') + '</div>';
      h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);margin-top:6px;line-height:1.6">' + esc(e.summary) + '</div>';
      if (e.detail) h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:7px">查看完整解讀 →</div>';
      h += '</div>';
    });
    h += '</div>';
  } else {
    h += '<div style="text-align:center;margin-top:60px;font:italic 13px \'EB Garamond\',serif;color:rgba(240,233,216,.35)">尚無紀錄 · No history yet</div>';
  }
  h += '</div>';
  return h;
}

/* ---------- navigation / render ---------- */

function resetReading() {
  state.drawn = [];
  state.picked = [];
  state.phase = 'setup';
  clearTimeout(_shuffleTimer);
}

function go(tab, deck) {
  state.tab = tab;
  state.histSelected = null;
  state.libQuiz = false;
  if (deck) state.deck = deck;
  resetReading();
  if (tab === 'astro' && typeof PLANET_DEFS === 'undefined') {
    /* 先呼叫 ensureAstrologyDataLoaded() 讓 astrologyDataLoadPromise 同步設好，
       render() 才不會在資料還沒開始載入的那一瞬間，誤判成「載入失敗」 */
    var astroLoad = ensureAstrologyDataLoaded();
    render();
    astroLoad.then(function () {
      ensureAstrologyBodyKeys();
      if (state.tab === 'astro') render();
    }).catch(function () {
      if (state.tab === 'astro') render();
    });
  } else {
    render();
  }
  window.scrollTo(0, 0);
}

function selectSpread(sp) { state.spread = sp; resetReading(); render(); }
function selectCategory(cat) { state.category = cat; state.subtopic = ''; state.readingMode = 'cards'; resetReading(); render(); }
function setLibDeck(d) { state.libDeck = d; state.libSuit = 'all'; state.libSelected = null; state.libQuiz = false; render(); }
function setLibSuit(su) { state.libSuit = su; state.libSelected = null; render(); }
function selectLibCard(key) { state.libSelected = key; render(); window.scrollTo(0, 0); }
function closeLibCard() { state.libSelected = null; render(); }

function renderNav() {
  var navDef = [
    { key: 'home', zh: '首頁', en: 'Home' },
    { key: 'reading', zh: '占卜', en: 'Reading' },
    { key: 'astro', zh: '星盤', en: 'Natal Chart' },
    { key: 'library', zh: '牌典', en: 'Library' },
    { key: 'more', zh: '更多', en: 'More' },
  ];
  var activeTab = state.tab;
  var h = '';
  navDef.forEach(function (n) {
    var active = activeTab === n.key || (n.key === 'more' && state.tab === 'history');
    var onclick = n.key === 'reading' ? "go('reading',state.deck)" : "go('" + n.key + "')";
    h += '<button onclick="' + onclick + '" style="flex:1;background:none;border:none;padding:14px 6px 12px;cursor:pointer;color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.4)') + ';text-align:center">';
    h += '<div style="font:500 13px \'Noto Sans TC\',sans-serif">' + n.zh + '</div>';
    h += '<div style="font:italic 9px \'EB Garamond\',serif;opacity:.55;margin-top:1px">' + n.en + '</div>';
    h += '</button>';
  });
  document.getElementById('nav').innerHTML = h;
}

function renderMore() {
  var h = '<div style="padding:8px 24px 24px"><h2 style="font:600 18px \'Noto Serif TC\',serif;color:#f0e9d8;margin:0 0 16px">更多功能</h2>';
  var items = [
    ['塔羅牌占卜','Tarot Reading',"go('reading','tarot')"],
    ['雷諾曼占卜','Lenormand Reading',"go('reading','lenormand')"],
    ['占卜歷史紀錄','Reading History',"go('history')"]
  ];
  items.forEach(function (it) { h += '<button onclick="' + it[2] + '" style="width:100%;display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.02);border:1px solid rgba(201,169,110,.28);color:#f0e9d8;padding:14px 15px;border-radius:10px;margin-bottom:9px;cursor:pointer;text-align:left"><span>' + it[0] + '<span style="display:block;font:italic 10px \'EB Garamond\',serif;opacity:.45;margin-top:2px">' + it[1] + '</span></span><span aria-hidden="true">›</span></button>'; });
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);line-height:1.8;margin-top:18px">占卜內容僅供自我探索與娛樂參考；健康、財務與法律問題請諮詢合格專業人士。</div>';
  /* 關於本站／隱私／清除資料原本只藏在首頁「更多功能」展開後才看得到；
     底部導覽列「更多」是更常被點的入口，這裡也要能直接找到 */
  h += renderAbout();
  h += '</div>';
  return h;
}

function render() {
  var view = document.getElementById('view');
  if (state.tab === 'home') view.innerHTML = renderHome();
  else if (state.tab === 'reading') view.innerHTML = renderReading();
  else if (state.tab === 'astro') view.innerHTML = renderAstro();
  else if (state.tab === 'library') view.innerHTML = renderLibrary();
  else if (state.tab === 'history') view.innerHTML = renderHistory();
  else if (state.tab === 'more') view.innerHTML = renderMore();
  renderNav();
}

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

  var summary = useHouse
    ? fillTpl(astroSeededPick(seed + 'sum', FUSE_POINT_SUMMARY_HOUSE_TPL), { P: P, S: S, coreFunction: pb.coreFunction, method: sb.method, lifeArea: hb.lifeArea })
    : fillTpl(astroSeededPick(seed + 'sum', FUSE_POINT_SUMMARY_NOHOUSE_TPL), { P: P, S: S, coreFunction: pb.coreFunction, method: sb.method });
  var primaryTpl = POINT_PRIMARY_TPL[pointDef.key];
  var primaryText = useHouse
    ? fillTpl(astroSeededPick(seed + 'pri', primaryTpl.house), { S: S, motivation: sb.motivation, lifeArea: hb.lifeArea })
    : fillTpl(astroSeededPick(seed + 'pri', primaryTpl.nohouse), { S: S, motivation: sb.motivation });
  var lifeExpression = useHouse
    ? fillTpl(astroSeededPick(seed + 'life', FUSE_POINT_LIFE_HOUSE_TPL), { P: P, lifeArea: hb.lifeArea, pointExpression: pb.expression })
    : fillTpl(astroSeededPick(seed + 'life', FUSE_POINT_LIFE_NOHOUSE_TPL), { P: P, pointExpression: pb.expression });
  var caution = useHouse
    ? fillTpl(astroSeededPick(seed + 'cau', FUSE_POINT_CAUTION_HOUSE_TPL), { P: P, lifeArea: hb.lifeArea, imbalance: pb.imbalance, growthDirection: pb.growthDirection })
    : fillTpl(astroSeededPick(seed + 'cau', FUSE_POINT_CAUTION_NOHOUSE_TPL), { imbalance: pb.imbalance, growthDirection: pb.growthDirection });

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
    summary: summary,
    primaryLabel: pb.primaryLabel,
    primaryText: primaryText,
    lifeExpression: lifeExpression,
    caution: caution,
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
  return '<article style="border-top:1px solid rgba(201,169,110,.15);padding:12px 0"><div style="font:600 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8">'+esc(d.title)+'</div><div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.75;margin-top:5px">'+esc(d.lead)+'</div><div style="margin-top:7px;font:400 11px \'Noto Sans TC\',sans-serif;color:#9bc5a3;line-height:1.65">優勢：'+esc(d.strength)+'</div><div style="margin-top:3px;font:400 11px \'Noto Sans TC\',sans-serif;color:#d9a0a0;line-height:1.65">容易卡住：'+esc(d.watch)+'</div><div style="margin-top:3px;font:400 11px \'Noto Sans TC\',sans-serif;color:#e6cd9a;line-height:1.65">可以怎麼練習：'+esc(d.practice)+'</div><details style="margin-top:8px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);cursor:pointer">查看相位名稱、容許度與專業解讀</summary><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);line-height:1.7;margin-top:6px">'+esc(aspectPlacementText(asp))+'</div></details></article>';
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
  Venus:'關係價值、喜好與吸引', Mars:'行動、欲望與界線', Jupiter:'信念、成長與擴張',
  Saturn:'責任、限制與長期建立', Uranus:'自由、突破與改革', Neptune:'想像、共感與理想',
  Pluto:'權力、危機與深層轉化', Node:'尚在發展的成長方向', SNode:'熟悉而容易依賴的模式',
  Lilith:'不願被壓抑的自主需求', Chiron:'容易受傷與不足的敏感點',
  Fortune:'感到順流與投入的方式', Vertex:'被關係或事件推動的經驗',
};
var NATAL_ASPECT_FUNCTION_BEHAVIORS = {
  Sun:{gift:'清楚表達自己的方向',risk:'把價值感綁在表現上',practice:'確認真正想成為誰'},
  Moon:{gift:'辨認並安頓情緒需求',risk:'被情緒與不安全感牽動',practice:'先照顧當下的感受'},
  Mercury:{gift:'把資訊整理成清楚語言',risk:'過度分析或急著下結論',practice:'確認資訊後再表達'},
  Venus:{gift:'衡量關係與價值是否協調',risk:'為維持和諧而迎合',practice:'說清楚喜好與界線'},
  Mars:{gift:'把欲望化為行動並守住界線',risk:'衝動出手或壓住怒氣',practice:'先辨認目標與力道'},
  Jupiter:{gift:'看見機會並擴大視野',risk:'過度樂觀而忽略細節',practice:'把信念落成可行步驟'},
  Saturn:{gift:'承擔責任並建立長期能力',risk:'怕犯錯而過度緊縮',practice:'訂出可持續的規則'},
  Uranus:{gift:'跳脫框架並提出新做法',risk:'為自由突然切斷連結',practice:'保留改變也說明理由'},
  Neptune:{gift:'感受氛圍並轉化想像',risk:'混淆理想、投射與現實',practice:'用事實檢查直覺'},
  Pluto:{gift:'看穿核心並承受深層轉變',risk:'用控制或猜疑防衛',practice:'分清能掌握與不能掌握'},
  Node:{gift:'嘗試尚不熟悉的成長方向',risk:'因陌生而放棄或躁進',practice:'用小步驟練習新能力'},
  SNode:{gift:'調用熟悉而穩定的資源',risk:'只靠老方法拒絕調整',practice:'保留資源也嘗試新做法'},
  Lilith:{gift:'辨認自主需求並守住界線',risk:'壓抑太久後激烈反彈',practice:'提早說出真實需求'},
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
  h+='<details style="margin-top:7px"><summary style="min-height:44px;display:flex;align-items:center;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);cursor:pointer">查看相位原理與整合方式</summary><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);line-height:1.8;margin-top:2px"><div>'+esc(d.advanced.functions)+'</div><div style="margin-top:5px">'+esc(d.advanced.principle)+'</div><div style="margin-top:5px">'+esc(d.advanced.context)+'</div><div style="margin-top:5px">'+esc(d.advanced.expression)+'</div><div style="margin-top:5px;color:#e6cd9a">整合方式：'+esc(d.advanced.integration)+'</div><div style="margin-top:5px;color:rgba(240,233,216,.45)">'+esc(d.technical)+'</div></div></details>';
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
  h += '<div style="margin-top:9px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.48);line-height:1.7">本位＝先開始；固定＝持續做；變動＝彈性調整。數字是十大行星落入各類星座的數量，不代表分數高低。</div></details>';
  h += '</div>';
  return h;
}
function renderAngleAndHouseBeginner(chart) {
  if (state.astroUnknownTime) return '';
  var asc=ZODIAC_SIGNS[chart.ascSign], mc=ZODIAC_SIGNS[Math.floor(chart.mc/30)];
  var counts={}, names={}; for(var i=1;i<=12;i++){counts[i]=0;names[i]=[];}
  PLANET_DEFS.forEach(function(d){var p=chart.planets[d.key];counts[p.house]++;names[p.house].push(d.zh);});
  var top=Object.keys(counts).filter(function(k){return counts[k]>0;}).sort(function(a,b){return counts[b]-counts[a];}).slice(0,3);
  var h='<section style="margin-top:14px;border:1px solid rgba(201,169,110,.2);border-radius:12px;padding:14px"><div style="font:600 13px \'Noto Sans TC\',sans-serif;color:#e6cd9a">別人怎麼認識你，以及人生重心</div>';
  h+='<div style="margin-top:8px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.8"><strong style="color:#f0e9d8">第一印象：</strong>別人剛認識你時，容易感受到你'+esc(SIGN_BEGINNER[chart.ascSign].behavior)+'。</div>';
  h+='<div style="margin-top:5px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.8"><strong style="color:#f0e9d8">工作與公共形象：</strong>你傾向用「'+esc(SIGN_BEGINNER[Math.floor(chart.mc/30)].mode)+'」的方式建立專業形象。</div>';
  if(top.length) h+='<div style="margin-top:10px;font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">能量最常出現的生活領域</div>'+top.map(function(k){var hb=HOUSE_BEGINNER[parseInt(k,10)-1];return '<div style="margin-top:5px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.7);line-height:1.7">第 '+k+' 宮：'+esc(hb.area)+'（'+counts[k]+' 顆行星）</div>';}).join('');
  h+='<details style="margin-top:10px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);cursor:pointer">查看 ASC、MC 與宮位分布</summary><div style="margin-top:6px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);line-height:1.75">ASC '+asc.zh+' '+(chart.asc%30).toFixed(1)+'°；MC '+mc.zh+' '+(chart.mc%30).toFixed(1)+'°。'+top.map(function(k){return '第'+k+'宮：'+names[k].join('、');}).join('；')+'。宮位數量代表關注集中處，不代表吉凶。</div></details></section>';
  return h;
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

  // planets — simple decluttering: stagger radius when longitudes are close
  var order = PLANET_DEFS.map(function (p) { return p.key; }).slice().sort(function (k1, k2) { return chart.planets[k1].lon - chart.planets[k2].lon; });
  var lastLon = null, tier = 0;
  order.forEach(function (key) {
    var lon = chart.planets[key].lon;
    if (lastLon !== null) {
      var gap = Math.abs(lon - lastLon);
      if (gap > 180) gap = 360 - gap;
      tier = gap < 7 ? (tier + 1) % 2 : 0;
    }
    lastLon = lon;
    var r = planetR - tier * 16;
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
function filterCityList(q) {
  if (!q) return CITY_LIST.slice(0, 12);
  var ql = q.toLowerCase();
  return CITY_LIST.filter(function (c) { return c.zh.indexOf(q) !== -1 || c.en.toLowerCase().indexOf(ql) !== -1; }).slice(0, 12);
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
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);margin-top:8px">查無此城市，試試看用中文城市名或英文拼音（例如 Tokyo、New York）搜尋</div>';
  }
  if (state[prefix + 'CityIdx'] != null) {
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:8px">已選擇：' + CITY_LIST[state[prefix + 'CityIdx']].zh + '</div>';
  } else if (state[prefix + 'Y'] && state[prefix + 'M'] && state[prefix + 'D']) {
    h += '<div role="status" style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-top:8px">請從上方選擇或搜尋你的出生地，才能生成星盤</div>';
  }
  h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.3);margin-top:16px;line-height:1.7">🔒 出生資料只會儲存在你自己的裝置（瀏覽器）中，不會上傳到任何伺服器' + (prefix === 'astro' ? '；你也可以隨時在生成星盤後按「清除已儲存的星盤資料」完全刪除。' : '。') + '</div>';
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
    h += '<div role="status" style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);margin-top:10px;text-align:center">已完成 ' + doneCount + ' / 3 項（出生日期・出生時間・出生地）</div>';
  }
  h += '<button onclick="' + genFnName + '()" ' + (ready && !generating ? '' : 'disabled') + ' style="width:100%;margin-top:8px;padding:13px;border-radius:12px;border:1px solid ' + (ready ? '#c9a96e' : 'rgba(201,169,110,.2)') + ';background:' + (ready ? 'linear-gradient(135deg,#c9a96e,#a9835a)' : 'rgba(255,255,255,.03)') + ';color:' + (ready ? '#1a1622' : 'rgba(240,233,216,.3)') + ';font:600 14px \'Noto Sans TC\',sans-serif;cursor:pointer">' + btnLabel + '</button>';
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
  } catch (e) { alert('匯出失敗，你的瀏覽器可能不支援檔案下載'); }
}
function astroImportProfileFile(fileInput) {
  var file = fileInput.files && fileInput.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var data;
    try { data = JSON.parse(e.target.result); } catch (e2) { alert('匯入失敗，檔案格式不正確'); return; }
    if (!data || data.type !== 'mystic-deck-natal-profile') { alert('這不是本站匯出的星盤資料檔案'); return; }
    var err = validateBirthDate(data.y, data.m, data.d, data.h, data.min, !!data.unknownTime);
    if (err) { alert('匯入的資料有問題：' + err); return; }
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
      alert('匯入成功，但找不到對應的城市，請重新選擇出生地後按「生成星盤」');
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
  render(); window.scrollTo(0, 0);
}
async function astroGenerate() {
  var city = CITY_LIST[state.astroCityIdx];
  if (!city || !state.astroY || !state.astroM || !state.astroD) return;
  if (validateBirthDate(state.astroY, state.astroM, state.astroD, state.astroH, state.astroMin, state.astroUnknownTime)) { render(); return; }
  /* 星盤運算（10大行星＋凱龍星軌道解算＋宮位）在舊手機上可能會有感卡頓，
     先顯示「計算中」讓畫面更新一次，下一個 tick 才真正跑運算，避免按下去畫面
     整個凍住、使用者以為沒反應而重複點擊。 */
  state.astroGenerating = true;
  render();
  try {
    await ensureAstronomyLoaded();
  } catch (e) {
    state.astroGenerating = false;
    render();
    try { alert('星盤計算元件載入失敗，請確認網路後重新整理頁面再試一次。'); } catch (e2) {}
    return;
  }
  setTimeout(function () {
    var hh = state.astroUnknownTime ? 12 : (parseInt(state.astroH, 10) || 0);
    var mm = state.astroUnknownTime ? 0 : (parseInt(state.astroMin, 10) || 0);
    var chart = computeNatalChart(parseInt(state.astroY, 10), parseInt(state.astroM, 10), parseInt(state.astroD, 10), hh, mm, city.lat, city.lon, city.tz, state.astroHouseSystem);
    state.astroResult = chart;
    state.astroCityUsed = city;
    state.astroGenerating = false;
    astroSaveProfile();
    render();
    window.scrollTo(0, 0);
  }, 30);
}
function astroReset() {
  try {
    if (!confirm('確定要重新輸入嗎？\n目前算好的星盤解讀會被清除（出生日期／時間／地點資料還在，可以直接修改後重新生成）。')) return;
  } catch (e) {}
  state.astroResult = null;
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
  h += '<label style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);display:flex;align-items:center;gap:5px;cursor:pointer"><input type="checkbox" ' + (state[prefix + 'UnknownTime'] ? 'checked' : '') + ' onchange="' + prefix + 'ToggleUnknownTime()">不確定時間（以正午 12:00 估算）</label>';
  h += '</div>';
  if (state[prefix + 'UnknownTime']) {
    h += '<div style="margin-top:6px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);line-height:1.7">勾選後：這個人的上升／宮位與月亮相關的比對會被省略，其餘行星星座的比對仍然準確——如果對方不確定自己的出生時間，一樣可以照這樣繼續。</div>';
  }
  if (!state[prefix + 'UnknownTime']) {
    h += '<div style="display:flex;gap:8px;margin-top:6px">';
    h += '<input id="'+prefix+'-h" aria-label="出生小時" inputmode="numeric" min="0" max="23" type="number" placeholder="時 HH (0-23)" value="' + esc(state[prefix + 'H']) + '" oninput="state.' + prefix + 'H=this.value;birthAutoNext(this,\''+prefix+'-min\',2)" onblur="render()" style="width:50%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    h += '<input id="'+prefix+'-min" aria-label="出生分鐘" inputmode="numeric" min="0" max="59" type="number" placeholder="分 MM" value="' + esc(state[prefix + 'Min']) + '" oninput="state.' + prefix + 'Min=this.value;birthAutoNext(this,\''+prefix+'-city\',2)" onblur="render()" style="width:50%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    h += '</div>';
    h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);margin-top:5px">時間會影響上升星座與宮位，請盡量提供準確的出生時間</div>';
  }

  h += '<div style="margin-top:16px;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">出生地</div>';
  h += '<input id="'+prefix+'-city" aria-label="搜尋出生城市" type="text" placeholder="搜尋城市，例如：台北、Tokyo" value="' + esc(state[prefix + 'CityQuery']) + '" oninput="' + prefix + 'CityInput(this.value)" style="width:100%;box-sizing:border-box;margin-top:6px;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
  h += '<div id="' + prefix + '-city-live">' + renderCityLiveBlock(prefix, genFnName) + '</div>';
  return h;
}

/* ================= 合盤 Synastry ================= */
function synSetCity(idx) { state.synCityIdx = idx; updateCityLiveBlock('syn', 'synGenerate'); }
function synCityInput(v) {
  state.synCityQuery = v; state.synCityIdx = null;
  updateCityLiveBlock('syn', 'synGenerate');
}
function synToggleUnknownTime() { state.synUnknownTime = !state.synUnknownTime; render(); }
async function synGenerate() {
  var city = CITY_LIST[state.synCityIdx];
  if (!city || !state.synY || !state.synM || !state.synD) return;
  if (validateBirthDate(state.synY, state.synM, state.synD, state.synH, state.synMin, state.synUnknownTime)) { render(); return; }
  state.synGenerating = true;
  render();
  try {
    await ensureAstronomyLoaded();
  } catch (e) {
    state.synGenerating = false;
    render();
    try { alert('星盤計算元件載入失敗，請確認網路後重新整理頁面再試一次。'); } catch (e2) {}
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
function synReset() { state.synResult = null; render(); window.scrollTo(0, 0); }
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
  var base = ASPECT_BEGINNER[asp.type];
  var seedBase = 'cross|' + asp.aKey + '|' + asp.bKey + '|' + asp.type;
  function pickField(name) {
    var tpl = astroSeededPick(seedBase + '|' + name, base[name]);
    if (usedSet) {
      var key = asp.type + '|' + name + '|' + tpl;
      if (usedSet[key]) {
        var alt = base[name].filter(function (t) { return !usedSet[asp.type + '|' + name + '|' + t]; })[0];
        if (alt) tpl = alt;
      }
      usedSet[asp.type + '|' + name + '|' + tpl] = true;
    }
    return fillAspectTemplate(tpl, '本人的' + aDef.kw, '對方的' + bDef.kw);
  }
  var title = '本人' + aDef.zh + ' × 對方' + bDef.zh;
  var lead = pickField('lead'), strength = pickField('strength'), watch = pickField('watch'), practice = pickField('practice');
  return '<article style="border-top:1px solid rgba(201,169,110,.15);padding:12px 0"><div style="font:600 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8">' + esc(title) + '</div><div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.75;margin-top:5px">' + esc(lead) + '</div><div style="margin-top:7px;font:400 11px \'Noto Sans TC\',sans-serif;color:#9bc5a3;line-height:1.65">優勢：' + esc(strength) + '</div><div style="margin-top:3px;font:400 11px \'Noto Sans TC\',sans-serif;color:#d9a0a0;line-height:1.65">容易卡住：' + esc(watch) + '</div><div style="margin-top:3px;font:400 11px \'Noto Sans TC\',sans-serif;color:#e6cd9a;line-height:1.65">可以怎麼練習：' + esc(practice) + '</div><details style="margin-top:8px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);cursor:pointer">查看相位名稱、容許度與專業解讀</summary><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);line-height:1.7;margin-top:6px">' + esc(crossAspectText(asp, '本人', '對方')) + '</div></details></article>';
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
  h += '<div style="flex:1;border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:10px"><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45)">本人</div><div style="font:600 13px \'Noto Serif TC\',serif;color:#e6cd9a;margin-top:3px">' + (state.astroUnknownTime ? '出生時間未知' : ZODIAC_SIGNS[chartA.ascSign].sym + ' ' + ZODIAC_SIGNS[chartA.ascSign].zh + '上升') + '</div><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:2px">' + ZODIAC_SIGNS[chartA.planets.Sun.sign].zh + '太陽　' + ZODIAC_SIGNS[chartA.planets.Moon.sign].zh + '月亮</div></div>';
  h += '<div style="flex:1;border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:10px"><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45)">對方</div><div style="font:600 13px \'Noto Serif TC\',serif;color:#e6cd9a;margin-top:3px">' + (state.synUnknownTime ? '出生時間未知' : ZODIAC_SIGNS[chartB.ascSign].sym + ' ' + ZODIAC_SIGNS[chartB.ascSign].zh + '上升') + '</div><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:2px">' + ZODIAC_SIGNS[chartB.planets.Sun.sign].zh + '太陽　' + ZODIAC_SIGNS[chartB.planets.Moon.sign].zh + '月亮</div></div>';
  h += '</div>';

  var harmonious = aspects.filter(function (a) { return a.type === 'trine' || a.type === 'sextile'; }).length;
  var challenging = aspects.filter(function (a) { return a.type === 'square' || a.type === 'opposition'; }).length;
  var summaryTxt = '這份「' + synRelationshipLabel() + '」合盤共有 ' + aspects.length + ' 組緊密相位，其中 ' + harmonious + ' 組是和諧相位、' + challenging + ' 組是挑戰相位。' +
    (score >= 72 ? '整體默契不錯，彼此的能量容易自然地互相支援。' : score <= 45 ? '相處上需要多一點耐心磨合，摩擦也是認識彼此的機會。' : '有順也有磨，是需要花時間慢慢培養默契的一段關係。');
  h += '<div style="margin-top:16px;border-top:1px solid rgba(201,169,110,.15);border-bottom:1px solid rgba(201,169,110,.15);padding:14px 0;font:400 13px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.8);line-height:1.9">' + esc(summaryTxt) + '</div>';

  h += '<div style="margin-top:18px;font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase;text-align:center">重點交叉相位</div>';
  var crossUsedSet = {};
  aspects.slice(0, 10).forEach(function (asp) {
    h += renderCrossAspectBeginnerCard(asp, crossUsedSet);
  });

  h += renderPersonaPicker();
  h += '<button id="syn-copy-btn" onclick="synastryCopyForAI()" style="width:100%;margin-top:22px;padding:12px;border-radius:12px;border:1px solid #c9a96e;background:rgba(201,169,110,.12);color:#e6cd9a;font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">複製給 AI 解讀 Copy for AI</button>';
  h += '<button onclick="synReset()" style="width:100%;margin-top:10px;padding:12px;border-radius:12px;border:1px solid rgba(201,169,110,.3);background:rgba(255,255,255,.02);color:rgba(240,233,216,.6);font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">重新輸入對方資料 ↺</button>';
  return h;
}

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
function renderProgressionMonths(natal, city) {
  var base = new Date(), charts = [], h = '<div style="margin-top:16px;font:500 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55)">未來 12 個月節奏</div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px">';
  for (var i = 0; i <= 12; i++) charts.push(computeProgressedChart(natal, city, progressionAddMonths(base, i)));
  var monthUsedSet = {};
  for (var m = 0; m < 12; m++) {
    var d = progressionAddMonths(base, m), p = charts[m], next = charts[m + 1];
    var moon = ZODIAC_SIGNS[p.planets.Moon.sign], moonShift = p.planets.Moon.sign !== next.planets.Moon.sign;
    var aspects = progressionAspects(natal, p), top = aspects[0];
    var monthPlain=top?progressionAspectPlain(top, monthUsedSet):null;
    h += '<div style="border:1px solid '+(moonShift?'rgba(230,205,154,.5)':'rgba(201,169,110,.18)')+';border-radius:9px;padding:8px 9px;background:rgba(255,255,255,.018)"><div style="display:flex;justify-content:space-between;gap:5px"><span style="font:600 11px \'Noto Sans TC\',sans-serif;color:#e6cd9a">'+d.getFullYear()+'/'+pad2(d.getMonth()+1)+'</span>'+(moonShift?'<span style="font:500 8px \'Noto Sans TC\',sans-serif;color:#211b15;background:#e6cd9a;border-radius:8px;padding:2px 5px">內在節奏換檔</span>':'')+'</div><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.68);margin-top:4px">情緒節奏：'+esc(SIGN_BEGINNER[p.planets.Moon.sign].mode)+'</div>'+(monthPlain?'<div style="font:400 9px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:4px;line-height:1.5">'+esc(monthPlain.title)+'：'+esc(monthPlain.text)+'</div>':'')+'<details style="margin-top:5px"><summary style="font:400 8px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);cursor:pointer">精確位置與相位</summary><div style="font:400 8px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.42);line-height:1.5;margin-top:3px">推運月亮 '+moon.zh+' '+p.planets.Moon.deg.toFixed(1)+'°'+(top?'；'+esc(crossAspectText(top,'本命','推運')):'')+'</div></details></div>';
  }
  return h + '</div>';
}
function progSetYears(n) { state.progYears = n; state.progExpandedYear = 0; state.progOnlyTransitions = false; render(); window.scrollTo(0, 0); }
function progToggleYear(i) { state.progExpandedYear = state.progExpandedYear === i ? null : i; render(); }
function progToggleTransitions() { state.progOnlyTransitions = !state.progOnlyTransitions; render(); }
/* 修正：base.lead／base.strength／base.practice 都是模板「陣列」（每種相位
   類型有 2 個版本，供 astroSeededPick 挑選），原本這裡直接把陣列跟字串相加，
   JS 會把整個陣列用逗號接成字串塞進去——不但沒有代入關鍵字（畫面上會直接
   看到「{Akw}」「{Bkw}」這種未代入的原始佔位符），還會把 2 個版本一次全部
   顯示、中間夾一個逗號。改成跟其他相位敘述一樣，先用 astroSeededPick 挑一
   個版本、再用 fillAspectTemplate 代入關鍵字。usedSet（選填）則跟其他相位
   清單一樣，用來避免同一份清單（例如「未來 12 個月節奏」的 12 張月卡，或
   一次顯示多年的推運卡片）裡巧合選到同一個版本、讀起來像同一句話重複。 */
function progressionAspectPlain(a, usedSet) {
  var natal=findAnyPointDef(a.aKey), moving=findAnyPointDef(a.bKey), base=ASPECT_BEGINNER[a.type];
  var seedBase = a.aKey + '|' + a.bKey + '|' + a.type;
  function pickField(name) {
    var tpl = astroSeededPick(seedBase + '|' + name, base[name]);
    if (usedSet) {
      var key = a.type + '|' + name + '|' + tpl;
      if (usedSet[key]) {
        var alt = base[name].filter(function (t) { return !usedSet[a.type + '|' + name + '|' + t]; })[0];
        if (alt) tpl = alt;
      }
      usedSet[a.type + '|' + name + '|' + tpl] = true;
    }
    return fillAspectTemplate(tpl, natal.kw, moving.kw);
  }
  return {
    title: natal.zh + '與' + moving.zh,
    text: '你原本的「' + natal.kw + '」，正和正在發展的「' + moving.kw + '」互相影響。' + pickField('lead'),
    strength: pickField('strength'),
    practice: pickField('practice'),
  };
}
function renderProgressionYearCard(row, natal, usedSet) {
  var p = row.prog, moon = ZODIAC_SIGNS[p.planets.Moon.sign], sun = ZODIAC_SIGNS[p.planets.Sun.sign];
  var open = state.progExpandedYear === row.index;
  var h = '<article style="margin-top:10px;border:1px solid ' + (row.isTransition ? 'rgba(230,205,154,.55)' : 'rgba(201,169,110,.22)') + ';border-radius:12px;background:rgba(255,255,255,.02);overflow:hidden">';
  h += '<button aria-expanded="' + open + '" onclick="progToggleYear(' + row.index + ')" style="display:block;width:100%;text-align:left;background:none;border:0;color:inherit;padding:13px 14px;cursor:pointer">';
  h += '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div style="font:600 17px \'Noto Serif TC\',serif;color:#e6cd9a">' + row.year + '</div><div style="display:flex;gap:6px;align-items:center">' + (row.isTransition ? '<span style="font:600 10px \'Noto Sans TC\',sans-serif;color:#211b15;background:#e6cd9a;border-radius:10px;padding:3px 7px">轉折年</span>' : '') + '<span style="font:400 15px sans-serif;color:rgba(240,233,216,.45)">' + (open ? '−' : '＋') + '</span></div></div>';
  h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.82);margin-top:5px;line-height:1.65">' + esc(row.theme) + '</div>';
  h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"><span style="font:400 10px \'Noto Sans TC\',sans-serif;color:#c9a96e">☽ ' + moon.zh + '</span><span style="font:400 10px \'Noto Sans TC\',sans-serif;color:#c9a96e">☉ ' + sun.zh + '</span>' + row.focuses.map(function(f){return '<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);border:1px solid rgba(201,169,110,.2);border-radius:10px;padding:2px 6px">'+f+'</span>';}).join('') + '</div>';
  if (row.aspects.length) { var firstPlain=progressionAspectPlain(row.aspects[0], usedSet); h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:8px;line-height:1.6">今年重點：' + esc(firstPlain.text) + '</div>'; }
  h += '</button>';
  if (open) {
    h += '<div style="border-top:1px solid rgba(201,169,110,.15);padding:12px 14px">';
    h += '<div style="padding:10px 11px;border-radius:9px;background:rgba(201,169,110,.07);font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.75">內心的安全感正用「'+esc(SIGN_BEGINNER[p.planets.Moon.sign].mode)+'」的方式調整；長期自我方向則帶著「'+esc(SIGN_BEGINNER[p.planets.Sun.sign].mode)+'」的色彩。</div>';
    if (row.moonChanged || row.sunChanged) h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:#e6cd9a;margin-top:10px;line-height:1.7">' + (row.moonChanged ? '• 這一年推運月亮將換座，內在需求會出現階段轉換。<br>' : '') + (row.sunChanged ? '• 這一年推運太陽將換座，是較少見的長期自我轉型。' : '') + '</div>';
    var expandedUsedSet = {};
    row.aspects.slice(0, 6).forEach(function (a) { var d=progressionAspectPlain(a, expandedUsedSet); h += '<div style="border-top:1px solid rgba(201,169,110,.12);padding:9px 0"><div style="font:600 11px \'Noto Sans TC\',sans-serif;color:#f0e9d8">'+esc(d.title)+'</div><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.7;margin-top:4px">'+esc(d.text)+'</div><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:#e6cd9a;line-height:1.65;margin-top:4px">建議：'+esc(d.practice)+'</div><details style="margin-top:6px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.42);cursor:pointer">查看推運相位、容許度與專業解讀</summary><div style="margin-top:5px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.52);line-height:1.65">'+esc(crossAspectText(a,'本命','推運'))+'</div></details></div>'; });
    h += '<details style="margin-top:8px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);cursor:pointer">查看推運太陽、月亮精確位置</summary><div style="margin-top:5px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);line-height:1.7">推運月亮：'+moon.zh+' '+p.planets.Moon.deg.toFixed(1)+'°；推運太陽：'+sun.zh+' '+p.planets.Sun.deg.toFixed(1)+'°。</div></details>';
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
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);text-align:center;margin-top:6px;line-height:1.6">從現在開始，看見未來不同年份的內在發展節奏</div>';

  h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:14px">';
  [1,3,5,10].forEach(function(n){var on=state.progYears===n;h+='<button aria-pressed="'+on+'" onclick="progSetYears('+n+')" style="padding:8px 4px;border-radius:10px;border:1px solid '+(on?'#c9a96e':'rgba(201,169,110,.28)')+';background:'+(on?'rgba(201,169,110,.18)':'rgba(255,255,255,.02)')+';color:'+(on?'#f0e9d8':'rgba(240,233,216,.55)')+';font:500 11px \'Noto Sans TC\',sans-serif;cursor:pointer">'+n+' 年</button>';});
  h += '</div>';

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
  if (state.astroUnknownTime) h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.38);line-height:1.7;margin-top:10px">＊出生時間未知：不採用上升、天頂、宮位及月亮相關相位；推運月亮位置僅作概略階段參考。</div>';

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
  var h = '<div style="margin-top:10px"><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-bottom:5px">常用對象，點一下快速帶入</div><div style="display:flex;flex-wrap:wrap;gap:6px">';
  state.xiuSavedPartners.forEach(function (p, idx) {
    h += '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.03);border:1px solid rgba(201,169,110,.3);border-radius:14px;padding:4px 5px 4px 11px">';
    h += '<button onclick="xiuSelectSavedPartner(' + idx + ')" style="background:none;border:none;color:rgba(240,233,216,.75);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;padding:0">' + esc(p.name) + '</button>';
    h += '<button onclick="xiuDeleteSavedPartner(' + idx + ',event)" aria-label="刪除存檔" style="background:none;border:none;color:rgba(240,233,216,.3);font:400 13px sans-serif;cursor:pointer;padding:0 4px;line-height:1">×</button>';
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
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);text-align:center;margin-top:6px;line-height:1.6">中國古代天文將黃道分成 28 個區域，自古用於擇日與命理參考</div>';
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
      h += '<div style="margin-top:14px;text-align:center;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4)">請輸入完整的出生年月日</div>';
    }
    h += '<div style="margin-top:16px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);line-height:1.8">＊本命星宿採用「連續 28 日循環」直接對照你的陽曆生日計算，跟每日／擇日用的是同一套邏輯；這跟少數命理流派另外使用的農曆演禽本命宿表是不同的系統，兩者可能對不上，這裡選擇邏輯一致、可驗證的版本。</div>';

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
      h += '<details style="margin-top:8px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);cursor:pointer">六戀關係是怎麼換算出來的？</summary><div style="margin-top:6px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);line-height:1.75">傳統「六戀」命名法用的是「演禽廿七宿」系統：把牛宿和女宿併成同一個位置，共 27 個位置排成一圈，再看兩人的位置相差幾格決定屬於哪一種六戀關係。這裡日常用的本命星宿則是 28 個位置（牛、女分開，每天換一格，可回推日期驗證），所以會先把兩人的 28 宿位置換算成這套 27 宿系統的位置，再套用六戀表——這也是上面同時看得到「關係類型」（28 宿邏輯）與「傳統六戀關係」（27 宿邏輯）兩種分類的原因。</div></details>';
      h += '</div>';
      h += '<button onclick="xiuSavePartner()" style="width:100%;margin-top:10px;padding:11px;border-radius:12px;border:1px solid rgba(201,169,110,.3);background:rgba(255,255,255,.02);color:rgba(240,233,216,.6);font:500 12px \'Noto Sans TC\',sans-serif;cursor:pointer">💾 存下對方資料，下次快速選取</button>';
      h += renderPersonaPicker();
      h += '<button id="xiu-copy-btn" onclick="xiuCopyForAI()" style="width:100%;margin-top:16px;padding:12px;border-radius:12px;border:1px solid #c9a96e;background:rgba(201,169,110,.12);color:#e6cd9a;font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">複製給 AI 解讀 Copy for AI</button>';
    } else {
      h += '<div style="margin-top:14px;text-align:center;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4)">請輸入兩人完整的出生年月日</div>';
    }
    h += '<div style="margin-top:16px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);line-height:1.8">＊「關係類型」是根據星宿在四象／七曜上的結構性關係（同宿、同曜、同象、對象、鄰象）設計的簡化版本；「傳統六戀關係」則是換算成演禽廿七宿系統（牛、女併同一格）後套用的古典命名法（榮親／友衰／危成／安壞／業胎／命之星），兩套系統算法不同，可以互相參考。</div>';

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
  var h = '<div style="margin-top:16px"><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-bottom:6px;text-align:center">未來 7 天一覽 · 點一下可切換查詢日</div><div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">';
  for (var i = 0; i < 7; i++) {
    var d = new Date(base.getTime());
    d.setDate(base.getDate() + i);
    var yy = d.getFullYear(), mm = d.getMonth() + 1, dd = d.getDate();
    var idx = xiuIndexForYMD(yy, mm, dd);
    var x = XIU_DEFS[idx];
    var isFirst = i === 0;
    h += '<button onclick="xiuSetDayAnchor(\'' + yy + '-' + pad2(mm) + '-' + pad2(dd) + '\')" style="flex:0 0 auto;min-width:62px;text-align:center;border:1px solid ' + (isFirst ? '#c9a96e' : XIU_DIR_COLOR[x.dir]) + ';border-radius:10px;padding:8px 5px;background:' + (isFirst ? 'rgba(201,169,110,.14)' : 'rgba(255,255,255,.02)') + ';cursor:pointer">';
    h += '<div style="font:400 9px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45)">週' + wdNames[d.getDay()] + ' ' + mm + '/' + dd + '</div>';
    h += '<div style="font:600 13px \'Noto Serif TC\',serif;color:#e6cd9a;margin-top:3px">' + esc(x.zh) + '宿</div>';
    h += '<div style="font:400 9px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-top:1px">' + esc(x.elem) + '曜</div>';
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
function astroCopyForAI() {
  var chart = state.astroResult;
  if (!chart) return;
  var text = buildAstroCopyText(chart, !!state.astroUnknownTime);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(astroFlashCopied).catch(function () { fallbackCopy(text, astroFlashCopied); });
  } else {
    fallbackCopy(text, astroFlashCopied);
  }
}

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
var HOROSCOPE_SCORE_CATS = CATEGORIES.filter(function (c) { return c.key !== 'general'; });
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

/* ================= Phase 0：星盤分類重點與綜合解讀骨架（資料結構＋函式骨架，尚未接入畫面）=================
   ASTRO_CATEGORY_FOCUS 是「本命結構描述」專用的分類→行星／宮位對照表，
   刻意與上面 ASTRO_CATEGORY_RULERS（運勢行運算分專用）分開，不影響既有運勢分數邏輯。
   symbolicOnly 為 true（健康）表示行星／宮位只能當作生活習慣的象徵性參考，
   不得延伸為疾病或身體部位的診斷式對應。 */
var ASTRO_CATEGORY_FOCUS = {
  love: { planets: ['Venus', 'Mars', 'Moon'], houses: [5, 7], useAsc: false, useMC: false, symbolicOnly: false },
  career: { planets: ['Sun', 'Mercury', 'Mars', 'Jupiter', 'Saturn'], houses: [2, 6, 10], useAsc: false, useMC: true, symbolicOnly: false },
  family: { planets: ['Moon'], houses: [4], useAsc: false, useMC: false, symbolicOnly: false },
  health: { planets: ['Sun', 'Moon'], houses: [6], useAsc: true, useMC: false, symbolicOnly: true },
  wealth: { planets: ['Venus', 'Jupiter', 'Saturn'], houses: [2, 8], useAsc: false, useMC: false, symbolicOnly: false },
  social: { planets: ['Mercury', 'Venus'], houses: [11], useAsc: false, useMC: false, symbolicOnly: false },
  study: { planets: ['Mercury', 'Jupiter'], houses: [3, 9], useAsc: false, useMC: false, symbolicOnly: false },
  /* general 維持現狀，不提供分類專屬的星盤重點 */
};

/* ---- 可用性檢查：任何解讀文案在組句前都必須先過這幾道閘門，絕不推測缺少的星盤資料 ----
   統一改為接收「ctx」物件（{chart, unknownTime, synChart}），不再讀取 state.* ——
   同一個 chart 進來，所有可用性判斷都只針對這個 chart，不會有一部分讀 ctx、一部分暗中讀
   state.astroResult 的情況。未來 UI 呼叫時自行組出 ctx，例如：
     astroHasChart({ chart: state.astroResult })
     astroTimeKnown({ chart: state.astroResult, unknownTime: state.astroUnknownTime })
     astroHasSynastry({ chart: state.astroResult, synChart: state.synResult }) */
function astroHasChart(ctx) { return !!(ctx && ctx.chart); }
function astroTimeKnown(ctx) { return astroHasChart(ctx) && !ctx.unknownTime; }
function astroHasSynastry(ctx) { return astroHasChart(ctx) && !!(ctx && ctx.synChart); }
/* Fortune（福點）／Vertex（宿命點）本身的算法依賴上升，出生時間未知時一律視為不可用 */
function astroPointAvailable(ctx, pointKey) {
  if (!astroHasChart(ctx)) return false;
  if (!astroTimeKnown(ctx) && (pointKey === 'Fortune' || pointKey === 'Vertex')) return false;
  return true;
}
/* 依「未知出生時間不可用上升／天頂／宮位／福點／宿命點」的規則，
   把 ASTRO_CATEGORY_FOCUS 的設定收斂成「這張星盤現在實際可用」的重點清單；
   沒有星盤時回傳全空，不得杜撰。 */
function astroAvailableFocus(ctx, catKey) {
  var focus = ASTRO_CATEGORY_FOCUS[catKey];
  var out = { planets: [], houses: [], useAsc: false, useMC: false, symbolicOnly: !!(focus && focus.symbolicOnly) };
  if (!focus || !astroHasChart(ctx)) return out;
  var timeKnown = astroTimeKnown(ctx);
  out.planets = focus.planets.slice();
  out.houses = timeKnown ? focus.houses.slice() : [];
  out.useAsc = timeKnown && !!focus.useAsc;
  out.useMC = timeKnown && !!focus.useMC;
  return out;
}
/* 純函式版本的「可用相位」過濾——只依傳入的 chart／unknownTime 判斷，不讀取 state。
   既有的 astroUsableAspects(chart)（定義在星盤頁面渲染區）直接讀取 state.astroUnknownTime，
   是專供 UI 使用的舊函式；分類解讀引擎（例如 Phase 1B 的愛情星盤引擎）必須改用這一份，
   避免引擎的可用性判斷暗中跟全域 state 綁在一起。過濾規則與既有 astroUsableAspects 一致：
   出生時間未知時排除任一端是 Moon／Fortune／Vertex 的相位。 */
function pureUsableAspects(chart, unknownTime) {
  var aspects = (chart && chart.aspects) || [];
  if (!unknownTime) return aspects;
  return aspects.filter(function (a) {
    return ['Moon', 'Fortune', 'Vertex'].indexOf(a.a) < 0 && ['Moon', 'Fortune', 'Vertex'].indexOf(a.b) < 0;
  });
}

/* Phase 1A：愛情分類「具體人物／環境特徵」所需的措辭池，供 cardSubtopicReading() 使用。
   讀取端一律必須透過 traitPoolPick() 存取——尚未撰寫文案的分類／分組仍保持空陣列，
   絕不外洩 TODO／待補之類的內部標記文字。
   分組鍵：
     塔羅：wands／cups／swords／pentacles（花色）、major（大阿爾克那）
     雷諾曼：len_good／len_neutral／len_bad（依既有 LEN_RICH.tone 吉／中性／凶分組）
   ageHint 例外：分組鍵是 young／peer／mature（＋塔羅大牌另有 major），
   因為年齡傾向由宮廷牌階級／數字大小或雷諾曼少數牌義判斷，而非花色。
   目前只有「愛情」用得到的軸心與分組已填入正式文案；其他分類／未來軸心留待後續階段擴充。 */
var TRAIT_POOL = {
  ageHint: {
    young: ['對方可能比你年輕一些，或帶著剛起步、充滿好奇心的心態靠近你', '這段緣分裡的對方，心態或年齡都偏向較年輕、還在摸索方向的階段', '對方可能還在學習如何經營關係，年齡或心態都偏向初期階段'],
    peer: ['年齡或人生階段可能與你相仿，彼此的步調容易同步', '對方較可能與你年齡相近，帶著積極主動、想要靠近的行動力', '這段關係裡雙方的成熟度接近，年齡差距應該不算明顯'],
    mature: ['對方可能年齡稍長，或心態遠比實際年齡成熟穩重', '即使年齡相近，對方待人處世的方式也可能顯得比較老練、有分寸', '對方較可能在關係中扮演照顧、引導的角色，心態上偏向成熟'],
    major: ['這段緣分更像是牌面呈現的一個人生階段，年齡差距不宜從單一象徵直接判斷', '牌面反映的是這段關係整體的份量與意義，實際年齡需要以現實資訊為準', '象徵意義大於年齡指標，對方的成熟度可能超出表面年紀給人的印象'],
  },
  appearance: {
    wands: ['氣質偏向陽光、有活力，給人熱情主動的第一印象', '外在可能帶點率性與衝勁，眼神或談吐透露出行動派的氣場', '整體氣質明亮、有存在感，容易在人群中被注意到'],
    cups: ['氣質溫柔、帶有情感豐富的感覺，眼神容易流露真實情緒', '外在給人親切、有同理心的印象，相處起來讓人感覺被理解', '整體氛圍柔和、浪漫，可能帶著藝術或感性的氣息'],
    swords: ['氣質俐落、理性，談吐清晰，給人聰明幹練的印象', '外在可能顯得有點距離感或冷靜，但思路清楚、有主見', '整體氣場偏向知性，眼神銳利，善於觀察與分析'],
    pentacles: ['氣質沉穩務實，給人可靠、安定的第一印象', '外在打扮偏向簡單實在，不追求浮誇，讓人感覺踏實', '整體氛圍低調穩重，行事作風腳踏實地'],
    major: ['整體氣場較為突出、有份量，容易讓人留下深刻印象', '這個人可能帶有某種鮮明的個人風格，氣質難以用單一詞彙概括', '給人的感覺超出一般日常互動的份量，帶著某種命定般的氣場'],
    len_good: ['氣質明亮開朗，給人容易親近、舒服自在的感覺', '整體氛圍正向、溫暖，相處起來讓人感覺輕鬆', '外在氣場帶著好運與生氣，容易讓人產生好感'],
    len_neutral: ['氣質偏向低調內斂，需要多相處才會慢慢認識真實的一面', '外在給人的印象中規中矩，特質需要花時間觀察才會顯現', '整體氛圍平實不張揚，第一印象可能普通但耐看'],
    len_bad: ['氣質可能帶點防備或疏離感，需要時間才能卸下心防', '外在或第一印象可能不容易掌握，帶著一些神秘或難以捉摸的成分', '整體氛圍偏向沉重或複雜，相處初期可能需要多一點耐心理解'],
  },
  personality: {
    wands: ['個性直接、有行動力，喜歡主動追求、不喜歡拖泥帶水', '相處起來充滿活力，但也可能因為急躁而需要多留意耐心', '個性樂觀進取，容易帶動關係的節奏往前推進'],
    cups: ['個性感性、重視情感連結，相處時很在意彼此的感受', '容易投入感情，也期待對方能給予相對的情感回應', '個性體貼細膩，但也可能因為太敏感而容易多想'],
    swords: ['個性理性、重視溝通的邏輯，喜歡把話說清楚', '相處起來可能較有距離感，需要透過對話慢慢建立信任', '個性獨立、有主見，也可能因為太直接而顯得少了點溫度'],
    pentacles: ['個性務實穩定，重視關係中實際的付出與長期的安全感', '相處步調偏慢但踏實，喜歡用行動而非言語證明心意', '個性可靠負責，但也可能因為太謹慎而錯過表達心意的時機'],
    major: ['個性帶有某種鮮明的主軸，相處模式可能不落於一般常規', '這段關係的相處模式，可能牽動著比日常更深層的課題', '個性特質鮮明，相處起來容易讓人印象深刻，也可能需要多一層理解'],
    len_good: ['個性開朗隨和，相處起來輕鬆自在，容易一拍即合', '相處模式傾向正向支持，願意主動維繫這段關係', '個性帶著好運與熱情，容易讓關係順勢往好的方向發展'],
    len_neutral: ['個性中規中矩，相處模式需要雙方一起慢慢磨合出默契', '對關係的態度不算積極也不算消極，走向取決於後續互動', '相處起來平穩，但也提醒別因為太習慣而忽略經營'],
    len_bad: ['個性可能帶著一些糾結或防衛，相處上需要更多耐心與溝通', '相處模式可能出現反覆或猶豫，建議把話說開會比悶著更好', '這段互動可能存在需要留意的課題，別急著下定論，先觀察再說'],
  },
  jobType: {
    wands: ['工作型態可能偏向業務、創業或需要主動出擊的行業', '較可能從事步調快、需要衝勁與行動力的工作環境', '職業類型或許與推廣、開發、體能相關的領域有關'],
    cups: ['工作型態可能與人際、關懷、藝術或情感相關的領域有關', '較可能從事需要同理心與溝通的工作，例如助人、創作或服務業', '職業類型或許與美感、療癒或情感陪伴相關的領域有關'],
    swords: ['工作型態可能偏向需要邏輯分析、規劃或溝通協調的領域', '較可能從事與資訊、法律、教育或策略相關的工作', '職業類型或許需要清晰思路與精準表達，例如專業顧問類角色'],
    pentacles: ['工作型態可能偏向穩定務實，例如財務、工程或管理相關領域', '較可能從事需要長期累積、講求實際成果的工作', '職業類型或許與資源管理、不動產或傳統產業有關'],
    major: ['職業樣貌可能不落於單一產業，更接近某種使命感或人生志業', '工作型態或許牽動著較大的格局，例如帶領、開創或轉型的角色', '這個人的事業樣貌可能正經歷重要的階段性轉變'],
    len_good: ['工作發展順利，可能從事讓人容易看見成果、被肯定的領域', '職業型態偏向明朗上升，機會與資源相對充足', '較可能從事與人脈、社交或公開曝光相關、發展順暢的工作'],
    len_neutral: ['工作型態普通穩定，暫時看不出特別突出或特別辛苦的跡象', '職業樣貌中規中矩，發展取決於接下來的選擇與努力', '目前的工作狀態平穩，尚在觀察與調整的階段'],
    len_bad: ['工作上可能正經歷一些壓力或不穩定，需要多一點耐心撐過', '職業型態或許正面臨轉換、調整或收尾的階段', '目前的工作環境可能存在需要留意的挑戰，建議謹慎評估'],
  },
  /* financeStyle：金錢觀、消費習慣、工作收入穩定傾向——不宣稱具體資產或收入數字 */
  financeStyle: {
    wands: ['金錢觀較為大膽，願意為機會冒險投資，但也可能因衝動而消費較快', '收入來源可能不只一份，帶點闖蕩、敢賺敢花的風格', '對財務決策行動力強，但宜留意衝動下的花費'],
    cups: ['金錢觀重視生活品質與情感層面的滿足，不只看數字', '花錢態度較隨心，願意為在乎的人事物付出', '收入穩定度普通，但重視花在關係與體驗上的價值'],
    swords: ['金錢觀理性，習慣先分析利弊再決定，不輕易衝動花費', '對收支有清楚的規劃與盤算，重視長遠的財務評估', '消費習慣偏向精打細算，但也可能因想太多而猶豫不決'],
    pentacles: ['金錢觀保守務實，重視儲蓄與長期累積的安全感', '收入穩定度較高，消費習慣偏向量入為出', '對財務規劃謹慎踏實，重視資源的穩固勝過短期享受'],
    major: ['財務樣貌不落於一般規律，可能正經歷重要的轉折或翻轉', '金錢觀帶著某種較大格局的意義，難以用一般收支衡量', '收入與資源的樣貌，象徵意義大於具體數字'],
    len_good: ['金錢觀正向，收入穩定度偏高，消費也相對從容', '財務狀況相對寬裕，資源運用順暢', '收入來源穩定，且帶有成長空間'],
    len_neutral: ['金錢觀普通中庸，收入穩定度中規中矩', '消費習慣沒有特別突出的傾向，仍在摸索中', '財務狀態平穩，暫無明顯壓力也無明顯優勢'],
    len_bad: ['金錢觀可能較緊繃，收入穩定度暫時需要留意', '消費或財務上可能正經歷一些壓力或不穩定期', '財務狀況可能需要更謹慎的規劃與應對'],
  },
  /* familyBg：只描述家庭氛圍、成長環境與家人互動模式，不宣稱確定的財產、階級或身分 */
  familyBg: {
    wands: ['家庭氛圍可能較為活潑、步調快，成員彼此有各自的空間', '成長環境可能鼓勵獨立與嘗試，家人互動直接坦率', '家庭互動偏向熱絡，但也可能各自忙碌、聚少離多'],
    cups: ['家庭氛圍溫暖，重視情感連結，可能與家人關係緊密', '成長環境重視情感表達，家人之間習慣互相關心', '家庭互動細膩體貼，但也可能情感牽絆較深、不易切割'],
    swords: ['家庭氛圍可能重視溝通與規則，或彼此保有各自的獨立空間', '成長環境偏向理性務實，家人相處講求道理多於情感', '家庭互動可能保持一定距離感，習慣就事論事'],
    pentacles: ['家庭氛圍務實傳統，重視責任分工與實際的支持', '成長環境穩定規律，家人關係重視長期的陪伴', '家庭互動樸實低調，重視實際行動勝過言語表達'],
    major: ['家庭背景可能牽涉較深的家族故事，難以三言兩語概括', '成長過程或許正經歷重要的家庭轉折或世代傳承', '家庭氛圍象徵意義大於表面樣貌，實際情況需另外了解'],
    len_good: ['家庭氛圍偏向和樂正向，成長過程相對受到支持', '家人互動溫暖融洽，整體家庭氣氛順遂', '成長環境給予的支持感較強，家庭關係穩定'],
    len_neutral: ['家庭氛圍普通平穩，沒有特別突出也沒有明顯隱憂', '家人互動中規中矩，實際情況仍需進一步認識', '成長背景看不出明顯議題，建議多花時間了解'],
    len_bad: ['家庭氛圍可能存在一些壓力或需要磨合的課題', '成長過程或家人互動可能正經歷一些緊繃或調整期', '這方面可能有需要謹慎看待的地方，建議多觀察、別急著下結論'],
  },
  meetScene: {
    wands: ['可能在活動、運動場合或需要主動社交的場所相遇', '相遇場景或許與工作衝勁、競賽或共同挑戰有關', '較可能在步調快、氣氛熱絡的場合中認識對方'],
    cups: ['可能在聚會、聯誼或朋友介紹等重視情感連結的場合相遇', '相遇場景或許與藝文活動、療癒或情感交流的空間有關', '較可能透過共同的朋友圈或情感支持的場合認識'],
    swords: ['可能在職場、學習或需要理性交流的場合相遇', '相遇場景或許與討論、辯論或知識交流的環境有關', '較可能在需要動腦、溝通協調的場合中認識對方'],
    pentacles: ['可能在工作、日常生活或穩定的社交圈中相遇', '相遇場景或許與長期經營的環境有關，例如同事、鄰居或熟人介紹', '較可能在務實、規律的日常場合中慢慢熟識'],
    major: ['相遇的方式可能帶點命定感，難以用一般社交場合概括', '這段緣分或許透過重要的人生節點或轉折時刻展開', '相遇場景象徵意義大於實際地點，重點在於那個時機點的意義'],
    len_good: ['相遇場合可能明朗順利，例如公開活動、聚會或朋友介紹', '較可能在氣氛正向、充滿好消息的場合認識對方', '相遇的契機可能來得突然但美好，值得保持開放心態'],
    len_neutral: ['相遇場合可能很日常，例如平常的生活圈或例行的社交場合', '目前還看不出特別的場景線索，建議保持觀察、順其自然', '相遇方式可能普通平淡，重點在後續互動而非初次印象'],
    len_bad: ['相遇場合可能帶點波折，或在彼此都不算輕鬆的情境下認識', '初次認識的過程可能不太順利，建議別因此就否定這段緣分', '相遇的時機點可能不是最理想的階段，需要多一點耐心與時間'],
  },
  /* ================= Phase 2A：事業分類「具體人物／環境特徵」所需的措辭池 =================
     沿用上面同一份 TRAIT_POOL 物件與 traitPoolPick() 存取方式（不重複宣告共用工具）；
     分組鍵與愛情軸心一致：塔羅花色／大牌，雷諾曼吉／中性／凶。以下十個軸心只供 career 使用，
     內容一律為「較適合／可能／傾向」語氣，不斷言唯一職業、不保證錄取或收入。 */
  industryDirection: {
    wands: ['產業方向可能較適合業務開發、行銷推廣或需要主動出擊的領域', '可優先考慮步調快、能快速看到成果的產業，例如新創或業務導向的公司'],
    cups: ['產業方向可能較適合人際服務、教育、藝文或身心照護相關領域', '可優先考慮重視人際互動與情感連結的產業，例如諮商、公關或社福'],
    swords: ['產業方向可能較適合資訊、法律、顧問或需要邏輯分析的領域', '可優先考慮講求精準判斷與策略思考的產業，例如科技、研究或法務'],
    pentacles: ['產業方向可能較適合金融、工程、不動產或講求穩定的傳統產業', '可優先考慮制度成熟、能長期累積專業的產業，例如製造、財會或公部門'],
    major: ['產業方向可能不侷限於單一領域，較適合能發揮個人使命感的工作', '可優先考慮正在轉型或具有開創性質的產業，重點在方向而非產業別'],
    len_good: ['產業方向目前傾向順遂，適合朝人脈與資源都相對充足的領域發展', '可優先考慮正在成長、機會較多的產業'],
    len_neutral: ['產業方向暫時看不出明顯偏好，可以多方嘗試、保持觀察', '可優先考慮先累積經驗、不急著鎖定單一產業'],
    len_bad: ['產業方向目前可能面臨一些調整或挑戰，宜謹慎評估再投入', '可優先考慮先穩定現況、避免貿然轉換到陌生領域'],
  },
  jobFunction: {
    wands: ['職務性質可能偏向需要主動出擊、對外接觸的角色', '較適合能發揮行動力與衝勁的職務，例如業務、公關或專案推動'],
    cups: ['職務性質可能偏向需要同理心與溝通的角色', '較適合能照顧他人感受、建立關係的職務，例如人資、客服或教學'],
    swords: ['職務性質可能偏向需要分析、規劃或把關的角色', '較適合邏輯清晰、能提出策略的職務，例如企劃、分析或法務'],
    pentacles: ['職務性質可能偏向需要穩定執行與細心把關的角色', '較適合講求精確與長期負責的職務，例如財會、工程或行政管理'],
    major: ['職務性質可能不落於傳統框架，較偏向帶領或開創性質的角色', '較適合需要整合全局、承擔較大責任的職務'],
    len_good: ['職務性質目前傾向順利，適合承擔更多能見度高的角色', '較適合能發揮所長、容易被看見成果的職務'],
    len_neutral: ['職務性質暫時中規中矩，可以先從熟悉的角色做起', '較適合先累積基本功，再逐步調整職務方向'],
    len_bad: ['職務性質目前可能有壓力或需要調整的地方，宜謹慎評估', '較適合先穩住現有角色，再考慮是否轉換'],
  },
  workContent: {
    wands: ['日常工作內容可能偏向專案推動、開發新客戶或處理突發狀況', '工作步調較快，經常需要同時處理多項進行中的任務'],
    cups: ['日常工作內容可能偏向與人互動、傾聽需求或協調關係', '工作步調較彈性，重視每一次溝通與互動的品質'],
    swords: ['日常工作內容可能偏向資料分析、撰寫文件或制定計畫', '工作步調講求精準，需要花時間確認細節與邏輯'],
    pentacles: ['日常工作內容可能偏向例行性的執行、追蹤與維護', '工作步調穩定規律，重視流程與長期累積的成果'],
    major: ['日常工作內容可能不只是例行事務，牽涉較大格局的規劃或轉型', '工作內容可能正處於重新定義角色的階段'],
    len_good: ['日常工作內容目前發展順利，容易看到具體成果', '工作內容偏向被肯定、有成長空間的任務'],
    len_neutral: ['日常工作內容暫時平穩，沒有特別突出也沒有明顯壓力', '工作內容中規中矩，適合先觀察再調整步調'],
    len_bad: ['日常工作內容目前可能較繁重或瑣碎，需要多一點耐心', '工作內容可能正經歷調整期，宜謹慎分配心力'],
  },
  workEnvironment: {
    wands: ['工作環境較適合步調快、鼓勵主動嘗試的團隊或新創氛圍', '適合充滿挑戰、能自由發揮行動力的工作場所'],
    cups: ['工作環境較適合重視人情味、氣氛溫暖的團隊', '適合同事間互相支持、情感連結緊密的工作場所'],
    swords: ['工作環境較適合講求專業分工、邏輯清楚的團隊', '適合制度明確、溝通直接了當的工作場所'],
    pentacles: ['工作環境較適合穩定務實、制度成熟的組織', '適合重視長期發展與安全感的工作場所'],
    major: ['工作環境的樣貌可能不落於一般框架，正在經歷轉型或重塑', '適合能讓你發揮更大格局與使命感的場所'],
    len_good: ['工作環境目前氛圍正向，人際關係相對和諧', '適合資源與機會都相對充足的工作場所'],
    len_neutral: ['工作環境暫時平穩，沒有特別的優勢也沒有明顯困擾', '適合先觀察團隊文化，再決定是否長期投入'],
    len_bad: ['工作環境目前可能存在一些緊張或需要磨合的地方', '宜多留意職場氛圍，必要時建立自己的界線'],
  },
  employmentType: {
    wands: ['工作型態傾向可能較適合業務導向的受雇工作，或需要主動出擊的接案型態', '也可能適合開創性質強的創業或專案主導角色'],
    cups: ['工作型態傾向可能較適合團隊合作、重視人際的受雇工作', '也可能適合以陪伴與服務為核心的接案或創意型態'],
    swords: ['工作型態傾向可能較適合需要專業判斷的受雇或顧問型接案', '也可能適合技術與邏輯導向的專業角色'],
    pentacles: ['工作型態傾向可能較適合穩定的受雇工作，或制度化的管理職務', '也可能適合按部就班經營的長期事業'],
    major: ['工作型態傾向可能不侷限於單一模式，較適合能自主定義角色的方式', '也可能適合帶有開創精神的創業或轉型嘗試'],
    len_good: ['工作型態傾向目前順遂，不論受雇或接案都有發展空間', '較適合把握現有機會、擴大現有的工作型態'],
    len_neutral: ['工作型態傾向暫時沒有明顯偏好，可以先維持現況、多方觀察', '較適合先試探不同型態，再決定長期方向'],
    len_bad: ['工作型態傾向目前可能需要調整，貿然轉換型態宜謹慎評估', '較適合先穩住現有工作型態，再考慮轉換'],
  },
  workRhythm: {
    wands: ['自主與合作節奏可能偏向快節奏、獨立決斷，也樂於主導合作', '較適合步調明快、能快速拍板的工作方式'],
    cups: ['自主與合作節奏可能偏向重視共識、需要情感上的信任基礎', '較適合節奏彈性、重視團隊感受的合作方式'],
    swords: ['自主與合作節奏可能偏向獨立作業、依邏輯分工合作', '較適合各司其職、溝通講求效率的工作方式'],
    pentacles: ['自主與合作節奏可能偏向穩健漸進、按計畫逐步推進', '較適合長期穩定的合作關係，不喜歡臨時變動'],
    major: ['自主與合作節奏可能不落於一般框架，重點在能否發揮主導權', '較適合能有較大自主空間、自行定義節奏的合作方式'],
    len_good: ['自主與合作節奏目前順暢，彼此配合度較高', '較適合順勢擴大自主權限或合作範圍'],
    len_neutral: ['自主與合作節奏暫時平穩，尚在磨合彼此習慣的階段', '較適合先維持現有節奏，不急著改變合作模式'],
    len_bad: ['自主與合作節奏目前可能出現落差，需要多溝通協調', '較適合先釐清彼此期待，再決定合作深度'],
  },
  strength: {
    wands: ['職場優勢可能在於行動力強、敢於承擔挑戰', '面對壓力時反應快，容易成為推動事情前進的人'],
    cups: ['職場優勢可能在於善於察言觀色、建立信任關係', '能敏銳感受團隊氛圍，是凝聚人心的角色'],
    swords: ['職場優勢可能在於邏輯清晰、擅長分析與表達', '能快速抓住問題核心，提出具體可行的方案'],
    pentacles: ['職場優勢可能在於穩定可靠、執行力強', '重視細節與品質，是值得信賴的長期夥伴'],
    major: ['職場優勢可能超出一般技能範疇，展現在格局與影響力上', '具備帶領或轉化局勢的潛力'],
    len_good: ['職場優勢目前明顯，容易被看見並獲得肯定', '整體表現順遂，是發揮實力的好時機'],
    len_neutral: ['職場優勢暫時還不算突出，需要更多時間累積展現', '可以從小地方開始建立自己的專業形象'],
    len_bad: ['職場優勢目前可能被現實壓力掩蓋，需要重新盤點', '建議先釐清自己真正擅長的部分，再對外展現'],
  },
  blindSpot: {
    wands: ['容易卡住的地方可能是太急躁，還沒想清楚就先行動', '也可能因為太專注衝刺而忽略團隊的節奏'],
    cups: ['容易卡住的地方可能是太顧慮他人感受而不敢表達立場', '也可能因為情緒化而影響專業判斷'],
    swords: ['容易卡住的地方可能是想太多、容易陷入過度分析', '也可能因為表達太直接而顯得缺乏彈性'],
    pentacles: ['容易卡住的地方可能是太保守、不敢嘗試新的做法', '也可能因為過度謹慎而錯過行動的時機'],
    major: ['容易卡住的地方可能是把格局看得太大，反而忽略眼前的細節', '也可能因為壓力較大而一時看不清方向'],
    len_good: ['容易卡住的地方可能是太順利而放鬆警覺', '也可能因為機會多而不容易聚焦'],
    len_neutral: ['容易卡住的地方暫時不明顯，建議持續留意自己的狀態', '可能容易因為猶豫不決而拖延'],
    len_bad: ['容易卡住的地方可能與目前的壓力或挑戰有關，需要多留意情緒', '也可能因為卡在瓶頸而感到挫折，建議適時求助'],
  },
  managerFit: {
    wands: ['適合的主管風格可能是給予空間、鼓勵主動出擊的類型', '較能適應果斷明快、願意授權的領導方式'],
    cups: ['適合的主管風格可能是重視溝通、願意傾聽的類型', '較能適應溫和支持、給予情感回饋的領導方式'],
    swords: ['適合的主管風格可能是條理清楚、能給明確方向的類型', '較能適應理性溝通、就事論事的領導方式'],
    pentacles: ['適合的主管風格可能是穩健可靠、重視制度的類型', '較能適應按部就班、給予清楚規則的領導方式'],
    major: ['適合的主管風格可能不拘泥傳統，重點在能否給予格局與願景', '較能適應具有遠見、願意授權重大決策的領導方式'],
    len_good: ['目前與主管的互動傾向順利，適合主動爭取更多發揮空間', '較能從支持型的主管身上獲得成長機會'],
    len_neutral: ['與主管的適配度暫時中性，需要更多相處才能判斷', '建議先觀察主管的溝通習慣，再調整互動方式'],
    len_bad: ['與主管的互動目前可能有些磨合，需要多一點耐心與溝通', '建議先釐清彼此期待，避免誤解累積'],
  },
  teamFit: {
    wands: ['適合的團隊環境可能是步調明快、鼓勵嘗試的團隊', '在充滿挑戰與行動力的團隊中較能發揮'],
    cups: ['適合的團隊環境可能是氣氛融洽、互相支持的團隊', '在重視情感連結與合作默契的團隊中較能發揮'],
    swords: ['適合的團隊環境可能是分工明確、專業導向的團隊', '在講求邏輯與效率的團隊中較能發揮'],
    pentacles: ['適合的團隊環境可能是穩定踏實、制度健全的團隊', '在重視長期合作與信任的團隊中較能發揮'],
    major: ['適合的團隊環境可能不拘泥於規模，重點在是否有共同的願景', '在能發揮更大影響力的團隊或組織中較能施展'],
    len_good: ['目前的團隊氛圍傾向正向，適合多參與團隊合作的機會', '在資源充足、氣氛良好的團隊中容易發揮'],
    len_neutral: ['團隊適配度暫時中性，可以多花時間了解團隊文化', '建議先觀察團隊互動模式，再決定投入程度'],
    len_bad: ['目前的團隊氛圍可能存在一些緊張或磨合，需要多留意', '建議先建立清楚的溝通界線，再逐步培養信任'],
  },
};
/* 安全存取 TRAIT_POOL：對應措辭池為空（尚未撰稿）時一律回傳空字串，絕不外洩佔位文字。
   seedStr 由呼叫端組出（例如卡片 id＋子問題 key），供之後改用確定性挑句時使用；
   目前措辭池皆為空陣列，此函式恆回傳 ''，僅先定義呼叫介面。 */
function traitPoolPick(axis, group, seedStr) {
  var pool = TRAIT_POOL[axis] && TRAIT_POOL[axis][group];
  if (!pool || !pool.length) return '';
  var idx = seedStr ? (hashStr(String(seedStr)) % pool.length) : 0;
  return pool[idx];
}

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
    neutral: ['行星角度有順有逆，發展走向還在醞釀，需要再觀察一段時間', '星盤能量處於過渡狀態，趨勢尚未完全明朗，宜保持彈性', '目前的星象組合中性，走向取決於接下來的實際互動'],
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
  水: ['土星落在水象星座，責任與限制可能出現在情緒或界線不易拿捏，是需要練習的課題', '長期累積的專業化方向傾向在同理與專業之間找到平衡'],
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
    neutral: ['行星角度有順有逆，目前處於累積與觀察並行的階段', '星盤能量中性，發展走向取決於接下來的準備與行動'],
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
  水: ['理想的家重視情感連結、照顧與可以安心示弱的氣氛', '家庭課題常圍繞情緒界線、依附與如何互相支持而不過度承擔'],
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
    challenging: ['先建立自己的情緒界線與支持系統，會比獨自承擔更有幫助'],
  },
  risk: {
    positive: ['關係和諧時仍要確認責任是否公平，避免習慣性替所有人收拾'],
    neutral: ['容易把熟悉的家庭反應當成唯一做法，需要留意沉默、說教或過度照顧'],
    challenging: ['壓力下可能在控制、退縮或情緒化反應間擺盪，讓真正需求更難被聽見'],
  },
  action: {
    positive: ['可以延續有效的照顧方式，同時清楚說明自己的界線與需要'],
    neutral: ['先用一句具體而不指責的話說明感受，再討論可執行的分工'],
    challenging: ['先降低衝突強度並穩定情緒，再處理責任、居住或界線等現實問題'],
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
  水: ['風險課題在於避免因情緒、信任或人情壓力模糊財務界線'],
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
  水: ['共同財務與合作資源需要避免人情取代規則，並保留各自界線'],
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
  favor:{positive:'能主動運用既有優勢並接受合適支持，是目前可持續發展的力量',neutral:'願意盤點真正重視的事、保留調整空間，會比追求完美答案更有幫助',challenging:'規律生活、清楚界線與可信任的支持系統，是面對壓力的重要資源'},
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
var LUCKY_COLORS = [
  { zh: '煙青', hex: '#8a8fa3' }, { zh: '藏青', hex: '#1f3a5f' }, { zh: '杏色', hex: '#e8c39e' },
  { zh: '珊瑚橘', hex: '#ff7f5e' }, { zh: '薄荷綠', hex: '#98d8c8' }, { zh: '霧霾藍', hex: '#7a92a3' },
  { zh: '酒紅', hex: '#722f37' }, { zh: '鵝黃', hex: '#f3e5ab' }, { zh: '天青', hex: '#a0d8ef' },
  { zh: '米白', hex: '#f5f0e6' }, { zh: '墨綠', hex: '#2f4f3f' }, { zh: '藕粉', hex: '#e8c4c4' },
];
var LUCKY_ACCESSORIES = ['檀木', '銀飾', '水晶', '珍珠', '麻布', '黃銅', '陶瓷', '玉石', '琥珀', '木質', '絲質', '貝殼'];
/* 每種配飾材質給對應的圖示，避免像「木質」卻顯示鑽石圖示這種文不對圖的狀況 */
var LUCKY_ACCESSORY_ICON = {
  '檀木': '🪵', '木質': '🪵', '銀飾': '💍', '水晶': '🔮', '珍珠': '🦪',
  '麻布': '🧵', '黃銅': '🔔', '陶瓷': '🏺', '玉石': '🟢', '琥珀': '🍯',
  '絲質': '🎀', '貝殼': '🐚',
};
var LUCKY_HOURS = ['23-01點', '01-03點', '03-05點', '05-07點', '07-09點', '09-11點', '11-13點', '13-15點', '15-17點', '17-19點', '19-21點', '21-23點'];
var LUCKY_DIRECTIONS = ['東', '南', '西', '北', '東南', '東北', '西南', '西北'];
var LUCKY_FOODS = ['全麥食品', '堅果', '深色蔬菜', '溫熱湯品', '當季水果', '優格', '燕麥', '魚類', '豆製品', '根莖類'];
/* 每種食物給對應的圖示，避免像「魚類」卻顯示餐具圖示這種文不對圖的狀況 */
var LUCKY_FOOD_ICON = {
  '全麥食品': '🍞', '堅果': '🥜', '深色蔬菜': '🥬', '溫熱湯品': '🍲', '當季水果': '🍎',
  '優格': '🥣', '燕麥': '🌾', '魚類': '🐟', '豆製品': '🫘', '根莖類': '🥕',
};
var LUCKY_ITEMS_LIST = ['抱枕', '鑰匙圈', '手帕', '筆記本', '耳機', '保溫杯', '護手霜', '小鏡子', '香氛小物', '便條紙'];
var LUCKY_ITEM_ICON = {
  '抱枕': '🛋️', '鑰匙圈': '🔑', '手帕': '🧣', '筆記本': '📓', '耳機': '🎧',
  '保溫杯': '☕', '護手霜': '🧴', '小鏡子': '🪞', '香氛小物': '🕯️', '便條紙': '📝',
};
var LUCKY_FLOWERS = ['鈴蘭', '玫瑰', '向日葵', '桔梗', '滿天星', '薰衣草', '雛菊', '茉莉', '繡球花', '百合'];
var LUCKY_FLOWER_ICON = {
  '鈴蘭': '💮', '玫瑰': '🌹', '向日葵': '🌻', '桔梗': '🪻', '滿天星': '✨',
  '薰衣草': '💜', '雛菊': '🌼', '茉莉': '🤍', '繡球花': '🔵', '百合': '🏵️',
};

function renderLuckyCell(iconHtml, value, label) {
  return '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 4px">' + iconHtml + '<div style="font:600 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;text-align:center">' + esc(value) + '</div><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4)">' + label + '</div></div>';
}
function renderLuckyGrid(rng) {
  var color = astroSeededPickN(rng, LUCKY_COLORS, 1)[0];
  var accessory = astroSeededPickN(rng, LUCKY_ACCESSORIES, 1)[0];
  var hour = astroSeededPickN(rng, LUCKY_HOURS, 1)[0];
  var direction = astroSeededPickN(rng, LUCKY_DIRECTIONS, 1)[0];
  var food = astroSeededPickN(rng, LUCKY_FOODS, 1)[0];
  var item = astroSeededPickN(rng, LUCKY_ITEMS_LIST, 1)[0];
  var flower = astroSeededPickN(rng, LUCKY_FLOWERS, 1)[0];
  var n1 = Math.floor(rng() * 10), n2 = Math.floor(rng() * 10);
  if (n2 === n1) n2 = (n2 + 1) % 10;
  var cells = [
    renderLuckyCell('<div style="width:22px;height:22px;border-radius:50%;background:' + color.hex + ';border:1px solid rgba(255,255,255,.3)"></div>', color.zh, '幸運色'),
    renderLuckyCell('<div style="font-size:20px">' + (LUCKY_ACCESSORY_ICON[accessory] || '💎') + '</div>', accessory, '幸運配飾'),
    renderLuckyCell('<div style="font-size:20px">⏰</div>', hour, '幸運時辰'),
    renderLuckyCell('<div style="font-size:20px">🧭</div>', direction, '幸運方位'),
    renderLuckyCell('<div style="font-size:20px">🔢</div>', n1 + '、' + n2, '幸運數字'),
    renderLuckyCell('<div style="font-size:20px">' + (LUCKY_FOOD_ICON[food] || '🍽️') + '</div>', food, '幸運食物'),
    renderLuckyCell('<div style="font-size:20px">' + (LUCKY_ITEM_ICON[item] || '🎁') + '</div>', item, '幸運隨身物'),
    renderLuckyCell('<div style="font-size:20px">' + (LUCKY_FLOWER_ICON[flower] || '🌸') + '</div>', flower, '幸運花'),
  ];
  var h = '<div style="display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid rgba(201,169,110,.15)">';
  cells.forEach(function (c) { h += c; });
  h += '</div>';
  return h;
}

function astroSetView(v) { state.astroView = v; state.astroDetail = null; render(); window.scrollTo(0, 0); }
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
  try { localStorage.removeItem('tl_astro_tour_seen'); } catch (e) {}
  render();
  window.scrollTo(0, 0);
}
/* 星盤功能現在有 7 個子頁面，第一次生成星盤時用一張小卡簡短導覽，避免新用戶
   不知道除了本命盤之外還有這些功能；只顯示一次，關掉後記在 localStorage 不會再跳出來 */
function renderAstroTourCard() {
  var items = [
    ['本命星盤', '十大行星、上升／宮位、相位、元素比例的完整分析'],
    ['每日／本週／本月／年度', '依真實行運與太陽／月亮回歸算出的評分與解讀，可切換日期'],
    ['合盤', '輸入另一人的資料，比對兩人的星盤相性'],
    ['推運', '用「一天等於一年」技法看你現在的心境演變'],
    ['28星宿', '中國古代的另一套系統，可看本命星宿、跟另一人的關係、每日擇日'],
    ['計算方式', '說明每一項數字背後用的計算方法與限制，供想了解細節的人查閱'],
  ];
  var h = '<div style="margin-top:16px;border:1px solid rgba(201,169,110,.3);border-radius:12px;padding:14px 16px;background:rgba(201,169,110,.05)">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center">';
  h += '<div style="font:600 12px \'Noto Sans TC\',sans-serif;color:#e6cd9a">星盤功能小導覽</div>';
  h += '<button onclick="astroDismissTour()" style="background:none;border:none;color:rgba(240,233,216,.4);font:400 18px sans-serif;cursor:pointer;line-height:1;padding:0">×</button>';
  h += '</div>';
  items.forEach(function (it) {
    h += '<div style="margin-top:8px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.7);line-height:1.6"><span style="color:#c9a96e;font-weight:600">' + it[0] + '</span>　' + it[1] + '</div>';
  });
  h += '<div style="text-align:center;margin-top:10px"><button onclick="astroDismissTour()" style="background:none;border:none;color:rgba(240,233,216,.4);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:0 0 1px">我知道了，不用再顯示</button></div>';
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
  h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-top:4px">指標可信度：' + scoreConfidenceLabel() + '</div>';
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
  h += '<div style="flex:1"><div style="font:700 13px \'Noto Sans TC\',sans-serif;color:#e6cd9a">建議</div><div style="margin-top:6px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.7">' + esc(adviceItems.join('、')) + '</div></div>';
  h += '<div style="flex:1"><div style="font:700 13px \'Noto Sans TC\',sans-serif;color:#d67878">避免</div><div style="margin-top:6px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.7">' + esc(avoidItems.join('、')) + '</div></div>';
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

  h += '<div style="margin-top:22px;font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase;text-align:center">今日幸運關鍵字</div>';
  h += renderLuckyGrid(rng);

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

var LUCKY_STONES = ['黃水晶', '白水晶', '粉晶', '紫水晶', '黑曜石', '月光石', '拓帕石', '橄欖石', '紅玉髓', '藍晶石'];
/* 每種礦石給對應的顏色圖示，跟幸運配飾的作法一致，避免全部都是同一顆鑽石圖示 */
var LUCKY_STONE_ICON = {
  '黃水晶': '🟡', '白水晶': '⚪', '粉晶': '💗', '紫水晶': '🟣', '黑曜石': '⚫',
  '月光石': '🌙', '拓帕石': '🟠', '橄欖石': '🟢', '紅玉髓': '🔴', '藍晶石': '🔵',
};

function renderLuckyMini(rng) {
  var color = astroSeededPickN(rng, LUCKY_COLORS, 1)[0];
  var flower = astroSeededPickN(rng, LUCKY_FLOWERS, 1)[0];
  var stone = astroSeededPickN(rng, LUCKY_STONES, 1)[0];
  var n1 = Math.floor(rng() * 10), n2 = Math.floor(rng() * 10);
  if (n2 === n1) n2 = (n2 + 1) % 10;
  var cells = [
    renderLuckyCell('<div style="width:22px;height:22px;border-radius:8px;background:' + color.hex + ';border:1px solid rgba(255,255,255,.3)"></div>', color.zh, '幸運色'),
    renderLuckyCell('<div style="font-size:20px">' + (LUCKY_FLOWER_ICON[flower] || '🌸') + '</div>', flower, '幸運花'),
    renderLuckyCell('<div style="font-size:20px">' + (LUCKY_STONE_ICON[stone] || '💎') + '</div>', stone, '幸運石'),
    renderLuckyCell('<div style="font-size:20px">🔢</div>', n1 + '、' + n2, '幸運數字'),
  ];
  var h = '<div style="display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid rgba(201,169,110,.15)">';
  cells.forEach(function (c) { h += c; });
  h += '</div>';
  return h;
}

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
  h += '<details style="margin-top:8px"><summary style="color:rgba(240,233,216,.45);cursor:pointer">查看回歸盤日期、上升與天頂</summary><div style="margin-top:5px"><span style="color:#e6cd9a;font-weight:600">' + kindLabel + '</span>　' + dateLabel + '　上升 ' + ascDef.sym + ascDef.zh + '　天頂 ' + mcDef.sym + mcDef.zh + '</div></details>';
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
  if (state.astroUnknownTime && periodKey !== 'weekly') h += '<div style="margin-top:10px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);line-height:1.7">無出生時間模式不使用回歸盤宮位，分數僅依行運與本命行星相位估算。</div>';
  if (returnChart) h += renderReturnHighlight(returnChart, kindLabel, returnDateLabel, topCatKey);
  h += '<div style="margin-top:18px">' + renderLuckyMini(rng) + '</div>';

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
  HOROSCOPE_SCORE_CATS.forEach(function(cat){var basis=periodScoreBasis[cat.key]||[];h+='<div style="margin-top:8px;font:600 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72)">'+cat.zh+' '+scores[cat.key]+' 分</div><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.48);line-height:1.65">'+esc(basis.length?basis.slice(0,5).join('；'):'這段期間沒有明顯相位被觸發，因此接近基準分數。')+'</div>';});
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
  h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div style="font:600 17px \'Noto Serif TC\',serif;color:#e6cd9a">'+row.year+'</div><div style="font:700 22px \'Noto Serif TC\',serif;color:#f0e9d8">'+row.overall+'<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45)"> 分</span></div></div>';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:5px">較強：<span style="color:#e6cd9a">'+row.topZh+' '+row.scores[row.topKey]+'</span>　留意：'+row.weakZh+' '+row.scores[row.weakKey]+'</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:9px">';
  HOROSCOPE_SCORE_CATS.forEach(function(cat){var col=CATEGORY_COLOR[cat.key];h+='<div title="'+cat.zh+' '+row.scores[cat.key]+'分" aria-label="'+cat.zh+' '+row.scores[cat.key]+'分" style="text-align:center"><div style="height:4px;border-radius:3px;background:linear-gradient(90deg,'+col[0]+' '+row.scores[cat.key]+'%,'+'rgba(255,255,255,.08) '+row.scores[cat.key]+'%)"></div><div style="font:400 8px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-top:3px">'+cat.zh.slice(0,1)+'</div></div>';});
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
  h += '<div style="font:400 11px \'EB Garamond\',serif;color:rgba(240,233,216,.4)">' + rangeLabel + '</div>';
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
  h += '<div style="font:400 11px \'EB Garamond\',serif;color:rgba(240,233,216,.4);text-align:center;margin-top:2px">' + rangeLabel + '</div>';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);text-align:center;margin-top:8px;line-height:1.6">根據目前的行運與你的本命星盤比對而成，僅供參考</div>';
  if (periodKey === 'yearly') {
    h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:14px">';
    [1,3,5,10].forEach(function(n){var on=state.horoYearRange===n;h+='<button aria-pressed="'+on+'" onclick="astroSetHoroYearRange('+n+')" style="padding:8px 4px;border-radius:10px;border:1px solid '+(on?'#c9a96e':'rgba(201,169,110,.28)')+';background:'+(on?'rgba(201,169,110,.18)':'rgba(255,255,255,.02)')+';color:'+(on?'#f0e9d8':'rgba(240,233,216,.55)')+';font:500 11px \'Noto Sans TC\',sans-serif;cursor:pointer">'+n+' 年</button>';});
    h += '</div>';
  }
  if (periodKey === 'monthly' || periodKey === 'yearly') {
    h += '<label style="display:block;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);margin-top:13px">回歸盤所在地<select aria-label="回歸盤所在地" onchange="astroSetReturnCity(this.value)" style="width:100%;margin-top:6px;background:#1a1622;border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;color:#f0e9d8">';
    h += '<option value="">使用出生地（' + esc((state.astroCityUsed || {}).zh || '') + '）</option>';
    CITY_LIST.forEach(function(c,i){h += '<option value="' + i + '"' + (state.astroReturnCityIdx===i?' selected':'') + '>' + esc(c.zh) + ' / ' + esc(c.en) + '</option>';});
    h += '</select></label><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);margin-top:5px">若生日當天人在外地，可改選當時所在地；這會影響回歸盤的上升與宮位。</div>';
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
    astroSaveProfile();
  }
  render();
}
function astroSelectDetail(k) { state.astroDetail = state.astroDetail === k ? null : k; render(); }
function astroMoonRangeText() {
  if (!state.astroUnknownTime || !state.astroCityUsed) return '';
  var c = state.astroCityUsed;
  var a = computeNatalChart(+state.astroY,+state.astroM,+state.astroD,0,0,c.lat,c.lon,c.tz,state.astroHouseSystem).planets.Moon;
  var b = computeNatalChart(+state.astroY,+state.astroM,+state.astroD,23,59,c.lat,c.lon,c.tz,state.astroHouseSystem).planets.Moon;
  return ZODIAC_SIGNS[a.sign].zh + ' ' + a.deg.toFixed(1) + '° ～ ' + ZODIAC_SIGNS[b.sign].zh + ' ' + b.deg.toFixed(1) + '°';
}
function renderAstroQuickSummary(chart) {
  var sun = ZODIAC_SIGNS[chart.planets.Sun.sign], moon = ZODIAC_SIGNS[chart.planets.Moon.sign];
  var eq = computeElementQualityBalance(chart);
  var elems = ['火','土','風','水'];
  var topElem = elems.reduce(function(a,b){return eq.elem[b]>eq.elem[a]?b:a;}, elems[0]);
  var major = astroUsableAspects(chart).filter(function(a){return ASTRO_PLANET_BODY_KEYS.indexOf(a.a)>=0&&ASTRO_PLANET_BODY_KEYS.indexOf(a.b)>=0;}).sort(function(a,b){return a.orb-b.orb;}).slice(0,3);
  var h = '<section style="margin-top:16px;border:1px solid rgba(201,169,110,.38);border-radius:12px;padding:15px 17px;background:rgba(201,169,110,.07)"><h3 style="font:600 14px \'Noto Serif TC\',serif;color:#e6cd9a;margin:0">三分鐘看懂你的星盤</h3>';
  h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.82);line-height:1.85;margin-top:9px">你的核心自我帶有<strong>' + sun.zh + '</strong>的' + sun.trait + '；情緒需求偏向<strong>' + moon.zh + '</strong>的' + moon.trait + '。整體以<strong>' + topElem + '元素</strong>最突出。' + (state.astroUnknownTime ? '出生時間未知，因此本摘要不採用上升與宮位。' : '你給人的第一印象則帶有<strong>' + ZODIAC_SIGNS[chart.ascSign].zh + '上升</strong>的色彩。') + '</div>';
  if (major.length) {
    var usedLeads = [];
    h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:10px">最明顯的三組性格互動</div>' + major.map(function(a){var d=aspectBeginnerDataUnique(a, usedLeads);return '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.68);line-height:1.7;margin-top:4px">• <strong>'+esc(d.title)+'</strong>：'+esc(d.lead)+'</div>';}).join('')+'<details style="margin-top:7px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.42);cursor:pointer">查看三組相位的專業名稱與容許度</summary><div style="margin-top:5px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);line-height:1.7">'+major.map(function(a){return esc(aspectPlacementText(a));}).join('<br>')+'</div></details>';
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
  h += '<div style="font:400 11px \'EB Garamond\',serif;letter-spacing:.3em;color:#c9a96e;text-transform:uppercase;text-align:center">Natal Chart</div>';
  h += '<div style="font:600 20px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:4px;text-align:center">個人星盤</div>';

  if (!state.astroResult) {
    h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);margin-top:14px;line-height:1.7;text-align:center">輸入出生日期、時間與地點，生成完整的西洋占星本命星盤——十大行星、上升／天頂、十二宮位與主要相位。</div>';
    h += '<div style="margin-top:12px;border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:11px 13px;background:rgba(255,255,255,.02);font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);line-height:1.85">第一次用嗎？開始前你需要知道：①需要出生年月日、時間、地點三項資料；②不確定精確時間也沒關係，下面可以勾選「不確定時間」，一樣能生成星盤；③出生資料只會存在你自己的瀏覽器裡，不會上傳到任何伺服器。</div>';
    h += '<div style="text-align:center;margin-top:10px">';
    h += '<label style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:0 0 1px">換新裝置了嗎？點此匯入之前備份的星盤資料<input type="file" accept="application/json,.json" onchange="astroImportProfileFile(this)" style="display:none"></label>';
    h += '</div>';

    h += '<div style="margin-top:22px;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">出生日期</div>';
    h += '<div style="display:flex;gap:8px;margin-top:6px">';
    h += '<input id="astro-y" aria-label="出生年份" inputmode="numeric" min="1900" max="2100" type="number" placeholder="年 YYYY" value="' + esc(state.astroY) + '" oninput="state.astroY=this.value;birthAutoNext(this,\'astro-m\',4)" onblur="render()" style="width:33%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    h += '<input id="astro-m" aria-label="出生月份" inputmode="numeric" min="1" max="12" type="number" placeholder="月 MM" value="' + esc(state.astroM) + '" oninput="state.astroM=this.value;birthAutoNext(this,\'astro-d\',2)" onblur="render()" style="width:33%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    h += '<input id="astro-d" aria-label="出生日期" inputmode="numeric" min="1" max="31" type="number" placeholder="日 DD" value="' + esc(state.astroD) + '" oninput="state.astroD=this.value;birthAutoNext(this,\'' + (state.astroUnknownTime ? 'astro-city' : 'astro-h') + '\',2)" onblur="render()" style="width:33%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    h += '</div>';
    var astroBirthErr = validateBirthDate(state.astroY, state.astroM, state.astroD, state.astroH, state.astroMin, state.astroUnknownTime);
    if (astroBirthErr) h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:#d67878;margin-top:6px">⚠ ' + esc(astroBirthErr) + '</div>';

    h += '<div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center">';
    h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">出生時間</div>';
    h += '<label style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45);display:flex;align-items:center;gap:5px;cursor:pointer"><input type="checkbox" ' + (state.astroUnknownTime ? 'checked' : '') + ' onchange="astroToggleUnknownTime()">不確定時間（產生無時間星盤）</label>';
    h += '</div>';
    if (state.astroUnknownTime) {
      h += '<div style="margin-top:6px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);line-height:1.7">勾選後：不會顯示上升／天頂／宮位，也會省略跟月亮相關的相位；十大行星本身的星座位置仍然準確。</div>';
    }
    if (!state.astroUnknownTime) {
      h += '<div style="display:flex;gap:8px;margin-top:6px">';
      h += '<input id="astro-h" aria-label="出生小時" inputmode="numeric" min="0" max="23" type="number" placeholder="時 HH (0-23)" value="' + esc(state.astroH) + '" oninput="state.astroH=this.value;birthAutoNext(this,\'astro-min\',2)" onblur="render()" style="width:50%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
      h += '<input id="astro-min" aria-label="出生分鐘" inputmode="numeric" min="0" max="59" type="number" placeholder="分 MM" value="' + esc(state.astroMin) + '" oninput="state.astroMin=this.value;birthAutoNext(this,\'astro-city\',2)" onblur="render()" style="width:50%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
      h += '</div>';
      h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.35);margin-top:5px">時間會影響上升星座與宮位，請盡量提供準確的出生時間</div>';
    }
    h += '<div style="margin-top:16px;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5)">出生地</div>';
    h += '<input id="astro-city" aria-label="搜尋出生城市" type="text" placeholder="搜尋城市，例如：台北、Tokyo" value="' + esc(state.astroCityQuery) + '" oninput="astroCityInput(this.value)" style="width:100%;box-sizing:border-box;margin-top:6px;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 10px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
    h += '<div id="astro-city-live">' + renderCityLiveBlock('astro', 'astroGenerate') + '</div>';

  } else {
    var chart = state.astroResult;

    var viewTabs = [['chart', '本命星盤'], ['daily', '每日'], ['weekly', '本週'], ['monthly', '本月'], ['yearly', '年度'], ['synastry', '合盤'], ['progression', '推運'], ['xiu28', '28星宿'], ['method', '計算方式']];
    h += '<div style="display:flex;gap:6px;margin-top:16px;flex-wrap:wrap;justify-content:center">';
    viewTabs.forEach(function (vt) {
      var on = (state.astroView || 'chart') === vt[0];
      h += '<button aria-pressed="' + on + '" onclick="astroSetView(\'' + vt[0] + '\')" style="font:500 11px \'Noto Sans TC\',sans-serif;background:' + (on ? 'rgba(201,169,110,.2)' : 'rgba(255,255,255,.03)') + ';border:1px solid ' + (on ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';color:' + (on ? '#f0e9d8' : 'rgba(240,233,216,.55)') + ';padding:6px 13px;border-radius:14px;cursor:pointer">' + vt[1] + '</button>';
    });
    h += '</div>';
    if (!state.astroTourDismissed) {
      h += renderAstroTourCard();
    } else {
      h += '<div style="text-align:center;margin-top:8px"><button onclick="astroShowTour()" style="background:none;border:none;color:rgba(240,233,216,.35);font:400 10px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:0 0 1px">星盤功能小導覽 · 再看一次</button></div>';
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
      h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);margin-top:10px;text-align:center">＊出生時間未知：行星度數以當日中點呈現，月亮請以上方範圍為準。</div>';
    }

    /* 白話摘要排在星盤輪圖正下方、上升／天頂與宮位制這些專有名詞卡片之前，
       讓第一次使用、不懂占星的人先看得懂的內容，再往下看細節與技術選項 */
    h += renderAstroQuickSummary(chart);

    if (!state.astroUnknownTime) {
    h += '<div style="display:flex;gap:10px;margin-top:16px;justify-content:center;text-align:center">';
    h += '<div style="flex:1;border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:10px"><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45)">上升星座 ASC</div><div style="font:600 15px \'Noto Serif TC\',serif;color:#e6cd9a;margin-top:3px">' + ascSignDef.sym + ' ' + ascSignDef.zh + '</div><div style="font:400 10px \'EB Garamond\',serif;color:rgba(240,233,216,.4)">' + (chart.asc % 30).toFixed(1) + '°</div></div>';
    h += '<div style="flex:1;border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:10px"><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.45)">天頂 MC</div><div style="font:600 15px \'Noto Serif TC\',serif;color:#e6cd9a;margin-top:3px">' + mcSignDef.sym + ' ' + mcSignDef.zh + '</div><div style="font:400 10px \'EB Garamond\',serif;color:rgba(240,233,216,.4)">' + (chart.mc % 30).toFixed(1) + '°</div></div>';
    h += '</div>';
    h += '<div style="text-align:center;margin-top:6px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.3)">宮位制：' + (state.astroHouseSystem === 'whole' ? '整宮制 Whole Sign' : '普拉西德制 Placidus') + '</div>';
    h += '<div style="display:flex;justify-content:center;gap:7px;margin-top:8px"><button aria-pressed="' + (state.astroHouseSystem==='placidus') + '" onclick="astroSetHouseSystem(\'placidus\')" style="background:none;border:1px solid rgba(201,169,110,.3);color:#c9a96e;padding:5px 9px;border-radius:12px;cursor:pointer">普拉西德</button><button aria-pressed="' + (state.astroHouseSystem==='whole') + '" onclick="astroSetHouseSystem(\'whole\')" style="background:none;border:1px solid rgba(201,169,110,.3);color:#c9a96e;padding:5px 9px;border-radius:12px;cursor:pointer">整宮制</button></div>';
    h += '<div style="text-align:center;margin-top:4px;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.32)">不確定選哪個？多數人用預設的「普拉西德制」就好，這裡切換只會改變宮位分法，行星星座不會變。</div>';
    }

    h += renderAngleAndHouseBeginner(chart);
    h += renderElementQualitySummary(chart);

    h += '<details' + (state.astroOpenPlacements ? ' open' : '') + ' style="margin-top:22px" ontoggle="state.astroOpenPlacements=this.open;var c=this.querySelector(\'.astro-caret\');if(c)c.textContent=this.open?\'▾\':\'▸\'"><summary style="min-height:44px;display:flex;align-items:center;font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase;cursor:pointer;list-style:none"><span class="astro-caret" style="display:inline-block;width:12px">' + (state.astroOpenPlacements ? '▾' : '▸') + '</span>行星落點 Placements</summary>';
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
        + '<div style="margin-top:5px;color:rgba(240,233,216,.45)">'+esc(d.technical)+'</div>'
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
        + '<div style="margin-top:5px;color:rgba(240,233,216,.45)">' + esc(r.technical) + '</div>'
        + '</div></details>';
      h += '</div>';
    });
    h += '<details style="margin-top:9px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.38);cursor:pointer">查看額外本命點的算法與精度</summary><div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.4);line-height:1.7;margin-top:5px">凱龍星座標為簡化軌道模型估算，精度約在 0.2° 以內；莉莉絲／福點／交點採用平均點（mean）算法，屬主流占星軟體常見標準之一；出生地與時間的時區換算已自動套用當地歷史上的日光節約時間規則，不需要自行手動校正。</div></details>';
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
    h += '<button onclick="astroExportProfile()" style="background:none;border:none;color:rgba(240,233,216,.3);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:0 0 1px">匯出星盤資料備份</button>';
    h += '<button onclick="astroForget()" style="background:none;border:none;color:rgba(240,233,216,.3);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:0 0 1px">清除已儲存的星盤資料</button>';
    h += '</div>';
    h += renderAstroDetailModal(chart);
  }

  h += '</div>';
  return h;
}

astroLoadProfile();
try { state.astroTourDismissed = localStorage.getItem('tl_astro_tour_seen') === '1'; } catch (e) {}
try { state.homeTourDismissed = localStorage.getItem('tl_home_tour_seen') === '1'; } catch (e) {}
try { var _savedPersona = localStorage.getItem('tl_ai_persona'); if (_savedPersona && findAiPersona(_savedPersona).key === _savedPersona) state.aiPersona = _savedPersona; } catch (e) {}

render();

