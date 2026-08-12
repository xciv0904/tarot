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
  subtopic: '',        // 具體問題 key（單選，驅動牌卡＋星盤深度解讀，見 SUBTOPICS）
  readingMode: 'cards', // 'cards' | 'combined'（combined 需要 state.astroResult 存在）
  timeframe: 'month',
  /* Step 3「想深入了解的面向」——跟上面的 state.subtopic 是兩套獨立機制：這裡是可複選
     （每個分類最多 3 項）的面向標籤，依 topicQuestionConfig 分類各自存放，不會互相覆蓋，
     切換 Step 1 的分類時也不需要清除，因為畫面永遠只讀目前 state.category 對應的那一份。 */
  wizFocusSel: {},        // { [categoryKey]: string[] }，每個分類最多 3 項
  wizFocusExpanded: {},   // { [categoryKey]: boolean }，是否展開顯示全部分組
  wizFocusLimitHit: '',
  /* Step 3 的兩個選填 disclosure */
  wizFocusOpen: false, wizContextOpen: false,
  /* 結果頁延伸區塊：展開中的細節題、選取中的新問題、更多方向、上一個解讀的快照 */
  followUpSelected: '', followUpMoreOpen: false, previousReading: null, overallOpen: false,   // 選滿 3 項後又點擊第 4 項時，記錄是哪個分類觸發，顯示提示用
  drawn: [],
  phase: 'setup',      // setup | shuffling | picking | result
  pickOrder: [],       // shuffled indices of the full deck (picking pool)
  picked: [],          // pool cell indices the user has tapped, in order
  history: [],
  libDeck: 'tarot',
  libSuit: 'all',
  libSelected: null,
  histSelected: null,
  mnOpen: false,
  mnTab: 'suit',
  /* 牌典：展開狀態、學習模式、解牌練習的答案是否揭曉 */
  mnExpanded: {}, mnLearnMode: false, mnDrillOpen: {},
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
  homeTourDismissed: false, clearDataArmed: false, dataNotice: '', armedAction: '',
  homeTourIdx: 0,
  moreTourOpen: false,   // 「更多 → 新手使用指南」是否就地展開中
  astroY: '', astroM: '', astroD: '', astroH: '', astroMin: '',
  astroCityQuery: '', astroCityIdx: null, astroCityUsed: null,
  astroUnknownTime: false, astroResult: null, astroView: 'chart', astroGenerating: false, astroTourDismissed: true,
  /* 星盤頁的頁內狀態訊息（取代原本的 alert）：{ kind:'error'|'success'|'info', text } */
  astroNotice: null,
  /* 多命盤：清單、目前啟用的 id、以及「正在建立新的一張」的旗標 */
  astroCharts: [], astroActiveId: null, astroPendingNew: false, astroChartsOpen: false, ascWindowsOpen: false,
  returnToReadingAfterAstro: false,
  astroTourIdx: 0, astroTabsMoreOpen: false, astroForecastOpen: false,
  /* 人生主題專題分析：選主題／選題目（每主題各自最多 3 個，keyed 儲存所以切換
     主題不會互相污染，回到同一主題會保留原本已選）／分析結果／摺疊卡展開狀態 */
  natalTopicCat: null,
  natalTopicQSel: {},
  natalTopicResult: null, natalTopicGenerating: false,
  natalTopicExpanded: {},
  natalTopicShowAll: {},
  natalTopicLimitHit: '',
  astroHouseSystem: 'placidus', astroDetail: null, astroMethodOpen: false,
  astroOpenPlacements: false, astroOpenPoints: false, astroOpenAspects: false,
  aiPersona: 'moon',
  /* 'data' = 只給原始數據讓 AI 自己綜合；'full' = 連同本站寫好的解讀一起附上。
     預設 data，因為實測後者會讓 AI 退化成改寫既有文字，而不是自己讀盤。 */
  astroCopyMode: 'data',
  astroReturnCityIdx: null, synRelationship: 'love',
  progYears: 1, progExpandedYear: 0, progOnlyTransitions: false,
  horoDayAnchor: null, horoWeekOffset: 0, horoMonthOffset: 0, horoYearOffset: 0, horoYearRange: 1,
  synY: '', synM: '', synD: '', synH: '', synMin: '', synGenerating: false,
  synCityQuery: '', synCityIdx: null, synCityUsed: null,
  synUnknownTime: false, synResult: null,
  synFacet: null,
  /* 合盤：關係模式的展開狀態、專業模式、其他互動是否展開 */
  synPatternOpen: {}, synProfessional: false, synMoreOpen: false,       // 合盤：目前只看哪一個相性面向（null＝全部）
  xiuMode: 'personal', xiuY: '', xiuM: '', xiuD: '',
  xiuPartnerY: '', xiuPartnerM: '', xiuPartnerD: '',
  xiuDayAnchor: null, xiuWikiOpen: null, xiuSavedPartners: [],
};

var SPREAD_GROUPS = [
  { label: '基礎入門 Basics', keys: ['single', 'three-time', 'three-issue', 'three-mbs'] },
  { label: '感情 Love', keys: ['relationship', 'crush', 'peach', 'crosslove'] },
  { label: '進階綜合 Advanced', keys: ['celtic', 'horseshoe'] },
  { label: '決策 Decisions', keys: ['fork', 'yesno', 'timeline'] },
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

/* 把 78 張牌的完整牌義（RICH）掛到牌堆上。RICH 現在放在獨立的
   js/data/reading-rich-data.js 並按需載入（見 index.html 的 ensureReadingRichLoaded），
   所以這裡改成可重複呼叫的函式：第一次執行時資料通常還沒到，會直接跳過；
   資料載入完成後由載入器再呼叫一次補掛。所有讀 card.rich 的地方本來就都有
   短牌義可以降級（例如 cardCoreMeaning、cardPosText），不會出現空白內容。 */
function attachRichMeanings() {
  if (typeof RICH === 'undefined' || !RICH) return false;
  TAROT.forEach(function (c) { c.rich = RICH[c.id] || null; });
  return true;
}
attachRichMeanings();

function hashStr(s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
  return h;
}


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

/* 牌面圖有兩種尺寸：assets/cards/（420px 寬，平均 65KB）與 assets/cards/thumbs/
   （300px 寬，平均 29KB）。第三個參數 useThumb 讓呼叫端依「這張牌實際會顯示多大」
   選尺寸——顯示寬度在 180px 以內時，300px 的縮圖在 2 倍螢幕上仍然銳利，卻只要
   不到一半的流量；只有 2 張牌並排（單張約 240px 寬）這種大圖情境才用全尺寸。
   decoding="async" 讓圖片解碼不佔用主執行緒，多張牌同時出現時捲動比較不會頓。 */
/* 牌面圖的實際比例：assets/cards 全部是 420×700，縮圖 300×500，都是 0.6。
   需要讓圖片填滿容器的版面請從這個比例推導高度，不要各自寫死。 */
var CARD_ART_RATIO = 0.6;

/* 圖片載入失敗時換成牌名方塊，而不是留一個破圖。
   來源可能是網路不穩、Service Worker 清過快取、或擋圖擴充套件——不管哪一種，
   畫面上都不該出現破圖，alt 已經帶著牌名了。 */
function cardImgFallback(img) {
  if (!img || !img.parentNode) return;
  var alt = img.getAttribute('alt') || '';
  img.parentNode.innerHTML = '<div style="flex:1;display:flex;align-items:center;justify-content:center;'
    + 'font:600 13px \'Noto Serif TC\',serif;color:#a9784f;padding:6px;text-align:center">' + esc(alt) + '</div>';
}
function cardImgHtml(src, alt, useThumb) {
  if (!src) return '<div style="flex:1;display:flex;align-items:center;justify-content:center;font:600 13px \'Noto Serif TC\',serif;color:#a9784f;padding:6px;text-align:center">' + esc(alt) + '</div>';
  var finalSrc = useThumb ? cardThumbSrc(src) : src;
  return '<div style="flex:1;min-height:0;display:flex;align-items:stretch;justify-content:center;overflow:hidden"><img src="' + finalSrc + '" alt="' + esc(alt) + '" loading="lazy" decoding="async" onerror="cardImgFallback(this)" style="width:100%;height:100%;object-fit:contain;display:block"></div>';
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
/* ============================================================================
   牌典知識層：花色 × 數字 × 宮廷

   原本這三份資料都是「速查關鍵字」，而且數字那一份是從單張牌義倒推回去的：
     3：初步成果／合作　　　← 合作只是錢幣三的表現
     5：衝突／損失　　　　　← 損失只是錢幣五的表現
     7：評估／迷惘
     8：專注／行動　　　　　← 行動只是權杖八的表現
     9：獨自滿足／焦慮　　　← 焦慮只是寶劍九的表現
   最明顯的證據是 3 那一列自己標了「例外：寶劍三＝心碎」——需要標例外，
   就代表這個定義本身不成立。數字是「事情發展到哪個階段」的原型，
   合作、損失、行動都是某個花色在那個階段的具體長相，不能倒過來當數字的定義。

   現在改成：數字＝發展階段原型，花色＝人生領域，兩者相乘才得到單張牌，
   而單張牌仍保有自己的傳統獨立意義（RICH／牌義資料不變，這裡不取代它）。
   ========================================================================== */

var SUIT_DOMAIN_DATA = [
  {
    suit: 'wands', title: '權杖 Wands', life: '行動與能量', element: '火',
    coreQuestion: '我想做什麼？',
    tags: ['熱情', '目標', '創造力', '競爭'],
    domain: '行動、企圖、創造、熱情、競爭、生命力',
    healthy: '有動力、敢行動、願意嘗試沒把握的事',
    excess: '衝動、急躁、把每件事都當成要贏的比賽',
    lack: '提不起勁、沒有方向、想很久卻遲遲不動',
    love: '看的是「有沒有火花、想不想主動靠近」，而不是穩不穩定。',
    work: '看的是「想不想做、推不推得動」，而不是薪水或制度。',
    money: '看的是「敢不敢投入、有沒有開創新收入」，偏向賺的動能而非守成。',
    advice: '通常在說「去做就對了」，先動起來再修正，不要等萬全準備。',
    color: '#d9964a',
  },
  {
    suit: 'cups', title: '聖杯 Cups', life: '情感與人際', element: '水',
    coreQuestion: '我感覺如何？',
    tags: ['愛', '直覺', '情緒', '關係'],
    domain: '情感、關係、直覺、想像、同理、療癒',
    healthy: '感受得到自己與別人的情緒，願意投入關係',
    excess: '想太多、耽溺在情緒裡、把想像當成事實',
    lack: '麻木、說不出感受、用理性擋掉所有情緒',
    love: '直接就是感情本身，看的是「投入到什麼程度、感受被不被接住」。',
    work: '看的是「做這件事開不開心、跟人合不合得來」，而不是效率。',
    money: '看的是「錢帶來的安全感與情緒」，常牽涉為了關係而花的錢。',
    advice: '通常在說「先照顧感受」，把心裡真正想要的講出來再談做法。',
    color: '#7fa8c9',
  },
  {
    suit: 'swords', title: '寶劍 Swords', life: '思想與溝通', element: '風',
    coreQuestion: '事實是什麼？我怎麼想？',
    tags: ['邏輯', '真相', '溝通', '衝突'],
    domain: '思考、判斷、語言、真相、界線、衝突',
    healthy: '看得清楚、講得明白、敢面對不舒服的事實',
    excess: '過度分析、鑽牛角尖、用道理傷人',
    lack: '不敢面對真相、話說不清楚、任由誤會累積',
    love: '看的是「講不講得通、有沒有把話說開」，常牽涉溝通與誤解。',
    work: '看的是「策略對不對、資訊夠不夠」，也常指涉職場上的角力。',
    money: '看的是「帳算不算得清、合約與條件是否明確」。',
    advice: '通常在說「先把事情弄清楚」，把感覺放一邊，先確認事實。',
    color: '#a9a9c9',
  },
  {
    suit: 'pentacles', title: '錢幣 Pentacles', life: '現實與資源', element: '土',
    coreQuestion: '實際上會怎麼樣？',
    tags: ['工作', '金錢', '身體', '安全感'],
    domain: '金錢、工作、身體、技能、時間、實際成果',
    healthy: '踏實、把事情做出來、能長期累積',
    excess: '只看得到現實條件、過度保守、被錢綁住',
    lack: '不切實際、撐不下去、投入了卻沒有累積',
    love: '看的是「能不能一起過日子」，重點在承諾與實際相處。',
    work: '直接就是工作本身，看的是技能、報酬與長期發展。',
    money: '直接就是金錢與資源，也看身體與時間這兩種本錢。',
    advice: '通常在說「回到現實條件」，先確認資源與時間夠不夠。',
    color: '#9fbf7f',
  },
];

/* 數字＝發展階段。每一階段回答一個核心問題，四花色只是同一階段落在不同領域的長相。
   suits 欄位刻意寫成「因為…所以…」的推導句，不是關鍵字，讓使用者看得到中間的邏輯。 */
var NUMBER_FORMULA_DATA = [
  {
    num: 'A', keywords: ['種子', '潛力', '起點'], label: 'A／1', name: '開始', memory: '一顆種子剛落地，什麼都還沒發生。',
    question: '什麼東西剛開始？',
    concept: '純粹的潛力，還沒有形狀。這股力量最完整也最未經使用，可能性最大，但也最不確定能不能長成。',
    why: '這是整個花色的源頭。後面所有階段都是這顆種子在不同條件下的發展結果。',
    positive: '機會出現、有了新的念頭、拿到可以開始的資源。',
    shadow: '只停在想像，遲遲不落地；或抓著機會卻沒有真的投入。',
    suits: {
      wands: '行動力剛冒出來，因此常是靈感、衝動與想開始做一件事。',
      cups: '情感剛被打開，因此常是心動、新的關係或重新有感覺。',
      swords: '想法剛變清楚，因此常是突破性的認知、真相或一句關鍵的話。',
      pentacles: '現實資源剛到位，因此常是新工作、新收入或具體的機會。',
    },
    ask: '這個開始我真的想要嗎？我願意投入什麼去讓它長大？',
    myth: '「A＝好事」過度簡化。A 只說有東西開始了，好不好要看花色與後續。',
  },
  {
    num: '2', keywords: ['成雙', '取捨', '關係'], label: '2', name: '互動', memory: '出現了第二股力量，要決定怎麼相處。',
    question: '兩邊現在要怎麼相處？',
    concept: '一分為二。有了對象、有了選項，也就有了關係與取捨。重點不是誰對，而是兩邊要用什麼方式並存。',
    why: '種子長出來之後就會遇到別的東西——另一個人、另一個選擇、另一種可能。',
    positive: '找到平衡、建立合作、做出選擇。',
    shadow: '卡在中間不決定，或為了維持平衡什麼都不敢動。',
    suits: {
      wands: '要決定往哪個方向使力，因此常是規劃、評估兩條路。',
      cups: '兩個人之間形成連結，因此常是相互吸引、承諾與和解。',
      swords: '兩種想法互不相讓，因此常是僵持、迴避與不願面對的選擇。',
      pentacles: '資源要在兩處之間調度，因此常是周轉、兼顧與取捨。',
    },
    ask: '我在平衡的是哪兩件事？我是在選擇，還是只是不想決定？',
    myth: '「2＝伴侶」過度簡化。2 是任何兩股力量的關係，不一定是人。',
  },
  {
    num: '3', keywords: ['成形', '看得見', '初果'], label: '3', name: '成形', memory: '事情開始形成可以看見的結果。',
    question: '目前正在形成什麼結果？',
    concept: '兩股力量互動之後產生了第三樣東西。這是第一次看得到成果——不論那個成果是好是壞。',
    why: '1 是開始，2 是互動，到了 3，前面的力量開始形成具體結果。',
    positive: '初步成果出現、有人加入、事情變得看得見。',
    shadow: '成果還不成熟就當成定局，或看見結果才發現方向錯了。',
    suits: {
      wands: '行動開始向外發展，因此常涉及規劃下一步、等待成果與拓展。',
      cups: '情感在人與人之間形成交流，因此常涉及聚會、分享與支持。',
      swords: '想法或真相形成清楚結果，因此痛苦、分離或失望變得無法忽視。',
      pentacles: '能力形成實際成果，因此涉及技能、合作與分工。',
    },
    ask: '目前已經成形的是什麼？這是我要的結果嗎？',
    myth: '「3＝合作」過度簡化。合作只是部分三號牌的具體表現；寶劍三同樣是 3，卻是心碎。',
  },
  {
    num: '4', keywords: ['框架', '守住', '卡住'], label: '4', name: '穩固', memory: '東西定下來了，也開始有點動不了。',
    question: '什麼已經穩定？什麼開始卡住？',
    concept: '結構出現。有了框架、規則與界線，安全感隨之而來，但彈性也隨之減少。',
    why: '成果出現之後，人會想把它固定住，於是形成結構。',
    positive: '有了基礎、可以休息、把成果守住。',
    shadow: '守得太緊變成停滯，或把暫時的安全當成永久。',
    suits: {
      wands: '行動有了穩定的基地，因此常是慶祝、安頓與階段性完成。',
      cups: '情感進入停滯，因此常是提不起勁、對現況無感。',
      swords: '思緒暫停下來，因此常是休息、退場與必要的沉澱。',
      pentacles: '資源被牢牢握住，因此常是儲蓄、保守與不願放手。',
    },
    ask: '這個穩定在保護我，還是在限制我？',
    myth: '「4＝穩定」只講對一半。4 同時是穩定與卡住，聖杯四就是穩定到無聊。',
  },
  {
    num: '5', keywords: ['打破', '碰撞', '鬆動'], label: '5', name: '失衡', memory: '原本的平衡被打破了。',
    question: '原本的平衡被什麼打破？',
    concept: '結構被挑戰。可能來自外力，也可能是內部撐不住。不舒服，但這是讓事情繼續動的必要環節。',
    why: '4 建立的結構總會遇到它無法處理的狀況，於是被打破。',
    positive: '看見原本忽略的問題、被迫調整、離開不適合的位置。',
    shadow: '只停在受害或爭輸贏，沒有把失衡轉成調整。',
    suits: {
      wands: '行動彼此衝撞，因此常是競爭、意見不合與內耗。',
      cups: '情感受損，因此常是失落、後悔與只看得到失去的部分。',
      swords: '想法上出現勝負，因此常是爭執、羞辱與撕破臉。',
      pentacles: '現實條件出問題，因此常是匱乏、被排除與撐不下去。',
    },
    ask: '被打破的是什麼？這個失衡在逼我調整什麼？',
    myth: '「5＝損失」過度簡化。5 是失衡，權杖五是競爭而非損失，重點在平衡被打破。',
  },
  {
    num: '6', keywords: ['流動', '調整', '移動'], label: '6', name: '重整', memory: '衝突之後，重新找到相處的方式。',
    question: '經過衝突後，如何重新調整？',
    concept: '流動恢復。有東西被交換、有人退讓、有位置被移動，關係或局面重新運作起來。',
    why: '5 打破平衡之後，總要有人做出調整，事情才能繼續。',
    positive: '得到協助、放下過去、往比較平靜的地方移動。',
    shadow: '表面和解但問題沒解決，或只是逃離現場而非真正調整。',
    suits: {
      wands: '行動被肯定，因此常是成功、認可與階段性的勝利。',
      cups: '情感回到過去的連結，因此常是回憶、舊人與單純的善意。',
      swords: '思緒離開混亂，因此常是轉換環境、暫時離開與慢慢平復。',
      pentacles: '資源在人之間流動，因此常是給予、接受與不對等的援助。',
    },
    ask: '我調整的是做法，還是只是換個地方繼續原本的問題？',
    myth: '「6＝給予」過度簡化。給予只是錢幣六的表現，6 的核心是重新流動。',
  },
  {
    num: '7', keywords: ['評估', '中場', '策略'], label: '7', name: '檢視', memory: '走到一半，停下來評估要不要繼續。',
    question: '走到這裡後，我要繼續、改變還是防守？',
    concept: '中場評估。投入已經很多，成果還沒定案，這時最需要判斷力，也最容易自我懷疑。',
    why: '6 讓事情重新運作之後，會走到一個必須決定要不要繼續的位置。',
    positive: '看清楚投入是否值得、調整策略、守住已經有的。',
    shadow: '想太多而不動、被幻想牽著走，或用不誠實的方式取巧。',
    suits: {
      wands: '需要守住立場，因此常是防衛、應付挑戰與撐住壓力。',
      cups: '想像取代了判斷，因此常是選項太多、白日夢與看不清真實。',
      swords: '策略取代了正面對決，因此常是取巧、隱瞞與獨自行動。',
      pentacles: '成果需要時間，因此常是評估、耐心與判斷值不值得繼續。',
    },
    ask: '我投入的這些，現在看起來值得嗎？我要繼續、轉向還是先守住？',
    myth: '「7＝等待」過度簡化。等待只是錢幣七的表現，7 的核心是評估與選擇。',
  },
  {
    num: '8', keywords: ['持續', '重複', '累積'], label: '8', name: '投入', memory: '決定之後，力量開始持續投入。',
    question: '能量現在被持續投入在哪裡？',
    concept: '進入運作。評估完就是執行，這階段講的是持續、重複與累積，不是一次性的爆發。',
    why: '7 做完決定之後，力量會集中到某一個方向並持續運作。',
    positive: '專注、熟練、事情快速推進或穩定累積。',
    shadow: '投入在錯的地方而不自知，或被自己建立的模式困住。',
    suits: {
      wands: '行動全速展開，因此常是快速推進、消息與同時發生很多事。',
      cups: '情感離開原本的投入，因此常是主動放下、去尋找更深的東西。',
      swords: '思考把自己綁住，因此常是自我設限、進退兩難與看不到出路。',
      pentacles: '技能被反覆練習，因此常是精進、專業與重複操作。',
    },
    ask: '我的時間與力氣實際上投在哪裡？那是我七號牌時決定的方向嗎？',
    myth: '「8＝行動」過度簡化。行動只是權杖八的表現，錢幣八同樣是 8，卻是安靜的重複練習。',
  },
  {
    num: '9', keywords: ['總和', '獨自', '承受'], label: '9', name: '承受', memory: '一路累積下來，現在由我一個人面對結果。',
    question: '一路累積下來，我現在得到或承受什麼？',
    concept: '接近完成，但還沒結束。前面所有投入的總和，此刻集中在個人身上——可能是收穫，也可能是代價。',
    why: '8 持續投入之後，累積的結果會回到自己身上。',
    positive: '享受成果、獨立、知道自己撐得住。',
    shadow: '獨自承擔到過頭、只看見還沒完成的部分。',
    suits: {
      wands: '長期作戰留下疲憊，因此常是戒備、耗損與硬撐。',
      cups: '願望得到滿足，因此常是滿意、如願與短暫的自得。',
      swords: '思緒的重量集中在夜裡，因此常是焦慮、失眠與反覆自責。',
      pentacles: '長期經營帶來實質富足，因此常是獨立、餘裕與自己掙來的安穩。',
    },
    ask: '我現在承受的，是我自己選擇累積出來的嗎？',
    myth: '「9＝焦慮」過度簡化。焦慮只是寶劍九的表現，錢幣九同樣是 9，卻是富足。',
  },
  {
    num: '10', keywords: ['飽和', '到底', '換檔'], label: '10', name: '完成', memory: '這個階段走到底了，接下來是新的循環。',
    question: '這個階段最後形成了什麼？',
    concept: '飽和。這個領域的力量發展到極限，形成一個完整的結果，同時也意味著這種模式無法再繼續。',
    why: '9 承受完累積之後，事情走到這個花色所能到達的盡頭。',
    positive: '完整、交棒、一個階段真正結束。',
    shadow: '被結果困住、扛了不屬於自己的份量、以為結束就是失敗。',
    suits: {
      wands: '責任堆到極限，因此常是超載、硬撐與該放下卻放不下。',
      cups: '情感達到圓滿，因此常是家庭、歸屬與長期的幸福。',
      swords: '思想走到盡頭，因此常是徹底結束、痛到底與再壞不過如此。',
      pentacles: '資源累積成傳承，因此常是家業、長期保障與跨世代的結果。',
    },
    ask: '這個階段真正完成了什麼？下一個循環我想從哪裡開始？',
    myth: '「10＝結局」不等於「事情結束就沒了」。10 是這一輪的飽和，下一張是同花色的 A，循環重新開始。',
  },
];

/* 宮廷＝你跟這股能量的關係處在哪個位置。四個位階是同一條學習曲線。 */
/* ============================================================================
   大阿爾克那：旅程結構

   大牌沒有「數字 × 花色」可以推導，但它有兩個真實而且可教的結構：

   1. 三個階段（1–7 / 8–14 / 15–21，愚人 0 在整條路之外）
      建立自我 → 向內轉化 → 整合超越。

   2. 七組直行對應
      把 1–21 排成三列七行，同一行的三張牌在講同一個課題的三種層次：
        1 魔術師 ／ 8 力量  ／15 惡魔　→ 怎麼駕馭自己的力量
        2 女祭司 ／ 9 隱士  ／16 塔　　→ 隱藏的東西怎麼被看見
        3 皇后　 ／10 輪　　／17 星星　→ 生命怎麼流動與再生
        4 皇帝　 ／11 正義  ／18 月亮　→ 秩序與真相怎麼被確立
        5 教皇　 ／12 吊人  ／19 太陽　→ 意義從哪裡來
        6 戀人　 ／13 死神  ／20 審判　→ 選擇與放下
        7 戰車　 ／14 節制  ／21 世界　→ 前進的方式

   這個對應是牌陣結構本身，不是本站自創；它讓使用者可以從已經懂的牌推到還不懂的牌，
   這正是大牌版本的「推導」。單張牌的傳統牌義（upZh／revZh／RICH）不受影響。
   ========================================================================== */
var MAJOR_STAGE_DATA = [
  { key: 'outer', range: '1–7', title: '第一階段・建立自我', memory: '在外面的世界裡，把「我是誰」搭起來。',
    desc: '遇到的都是外在的角色與規則：怎麼開始、怎麼相信自己、怎麼面對權威與選擇。這一段在學的是把自己立起來。' },
  { key: 'inner', range: '8–14', title: '第二階段・向內轉化', memory: '外面走完一圈，開始面對自己內在。',
    desc: '力量從外在轉向內在：需要耐心、獨處、接受無法控制的事，也需要面對結束。這一段在學的是放手與整合。' },
  { key: 'beyond', range: '15–21', title: '第三階段・整合超越', memory: '面對最不想看的部分，然後重新長回來。',
    desc: '從陰影開始，經過崩解與重建，最後回到清晰與完整。這一段在學的是把破碎的部分收回同一個人身上。' },
];

var MAJOR_COLUMN_DATA = [
  { col: 1, theme: '怎麼駕馭自己的力量', ids: ['m1', 'm8', 'm15'] },
  { col: 2, theme: '隱藏的東西怎麼被看見', ids: ['m2', 'm9', 'm16'] },
  { col: 3, theme: '生命怎麼流動與再生', ids: ['m3', 'm10', 'm17'] },
  { col: 4, theme: '秩序與真相怎麼被確立', ids: ['m4', 'm11', 'm18'] },
  { col: 5, theme: '意義從哪裡來', ids: ['m5', 'm12', 'm19'] },
  { col: 6, theme: '選擇與放下', ids: ['m6', 'm13', 'm20'] },
  { col: 7, theme: '前進的方式', ids: ['m7', 'm14', 'm21'] },
];

/* numberEcho 只寫在對應站得住腳的地方（1–10）。11–21 靠直行對應理解，
   不硬套數字，避免製造看起來精確但實際牽強的關聯。 */
var MAJOR_JOURNEY_DATA = {
  m0: { stage: null, col: null, role: '整條路的起點，也是路本身。',
    lesson: '在還不知道會發生什麼之前，仍然願意踏出去。',
    shadow: '把沒有計畫當成自由，用天真迴避該負的責任。',
    love: '關係剛開始，還沒有任何條件與包袱。', work: '轉換跑道或投入沒把握的事。',
    advice: '不用等準備好，先走再說。', ask: '我在害怕的是失敗，還是害怕自己其實想要？' },
  m1: { stage: 'outer', col: 1, numberEcho: '和小牌的 A 一樣是「開始」，但大牌處理的是「我有能力創造」這件事本身。',
    role: '認識到自己手上有工具，可以動手把想法變成現實。',
    lesson: '把潛力變成實際的行動。',
    shadow: '只表演會什麼，卻沒有真的做出東西；或用能力操縱別人。',
    love: '主動出擊、把心意化為具體行動。', work: '有資源也有能力，適合啟動新的事。',
    advice: '你要的東西已經在手邊了，開始用它。', ask: '我手上已經有的資源，我真的用上了嗎？' },
  m2: { stage: 'outer', col: 2, numberEcho: '和小牌的 2 一樣是「兩股力量」，但這裡是意識與潛意識之間的那道門。',
    role: '學會相信說不出口、但確實知道的東西。',
    lesson: '安靜下來，讓答案自己浮現。',
    shadow: '什麼都不說變成隔絕，或用神秘感取代真正的理解。',
    love: '曖昧、心照不宣，尚未攤開的情感。', work: '資訊還不完整，先觀察不要急著表態。',
    advice: '先別問別人，先聽自己。', ask: '我其實已經知道答案了嗎？只是還不想承認？' },
  m3: { stage: 'outer', col: 3, numberEcho: '和小牌的 3 一樣是「成形」，這裡成形的是生命與豐盛本身。',
    role: '把東西真的孕育出來、養大。',
    lesson: '創造需要時間，也需要願意照顧。',
    shadow: '過度給予變成掌控，或用照顧綁住對方。',
    love: '穩定滋養的關係，也可能牽涉家庭與生育。', work: '成果正在長大，適合經營而非開創。',
    advice: '讓它慢慢長，不要急著收成。', ask: '我在照顧的這件事，是不是也需要被放手？' },
  m4: { stage: 'outer', col: 4, numberEcho: '和小牌的 4 一樣是「穩固」，這裡建立的是規則與秩序。',
    role: '把混亂變成有結構、可以運作的東西。',
    lesson: '負起責任，並且承擔決定的後果。',
    shadow: '把控制當成安全，用權威壓過需要。',
    love: '穩定可靠，但也可能缺乏彈性。', work: '需要建立制度、扛起管理責任。',
    advice: '先把框架定下來，其他再說。', ask: '我建立的秩序在保護誰？' },
  m5: { stage: 'outer', col: 5, numberEcho: '小牌的 5 是平衡被打破；大牌的 5 是那個「之後會被打破的體系」本身。',
    role: '學會既有的規則與傳承下來的做法。',
    lesson: '先進入體系，才知道哪些值得留下。',
    shadow: '把規矩當真理，或用身分壓過真正的問題。',
    love: '傳統形式的關係，例如公開、承諾、婚姻。', work: '在既有制度內學習與取得資格。',
    advice: '照著已經被驗證的方法做。', ask: '我遵守的是有用的規則，還是別人的期待？' },
  m6: { stage: 'outer', col: 6, numberEcho: '和小牌的 6 一樣是「重新調整」，這裡調整的是價值觀層級的選擇。',
    role: '面對一個會決定你成為什麼人的選擇。',
    lesson: '選擇不只是挑一邊，是承認自己重視什麼。',
    shadow: '為了不失去而不選，或把選擇推給別人。',
    love: '真實的連結，也可能是關係中的重大決定。', work: '要在兩條路之間表態。',
    advice: '選你真正認同的，不是比較安全的。', ask: '我逃避的是選錯，還是逃避承認我要什麼？' },
  m7: { stage: 'outer', col: 7, numberEcho: '和小牌的 7 一樣是「繼續、改變還是防守」，這裡的答案是靠意志推進。',
    role: '用意志把互相拉扯的力量控制住，往前走。',
    lesson: '方向感比速度重要。',
    shadow: '硬撐、只靠壓制而不整合，最後失控。',
    love: '主動推進關係，但可能太用力。', work: '需要衝刺並掌握節奏的階段。',
    advice: '抓住方向盤，不要讓情緒開車。', ask: '我在控制的兩股力量，各自想要什麼？' },
  m8: { stage: 'inner', col: 1, numberEcho: '和小牌的 8 一樣是「持續投入」，這裡投入的是溫柔而穩定的內在力量。',
    role: '不靠壓制，而是靠理解來馴服自己的本能。',
    lesson: '真正的力量是溫和且持續的。',
    shadow: '用意志硬壓情緒，或誤以為忍耐就是堅強。',
    love: '有耐心地面對關係中的難處。', work: '靠穩定與韌性而不是強勢取勝。',
    advice: '柔軟一點，但不要放棄。', ask: '我想壓下去的那個反應，它其實想告訴我什麼？' },
  m9: { stage: 'inner', col: 2, numberEcho: '和小牌的 9 一樣是「獨自面對累積下來的結果」，這裡是主動選擇的獨處。',
    role: '離開人群，把自己的答案想清楚。',
    lesson: '有些事只能自己走完。',
    shadow: '獨處變成逃避，或用清高隔絕所有人。',
    love: '需要空間，或關係中的一段沉澱期。', work: '適合鑽研、不適合合作的階段。',
    advice: '安靜一段時間，不要急著問別人。', ask: '我是在找答案，還是在躲？' },
  m10: { stage: 'inner', col: 3, numberEcho: '和小牌的 10 一樣是「一輪走到底」，但輪子還會繼續轉。',
    role: '接受有些事不由自己決定。',
    lesson: '在變動裡找到自己能做的部分。',
    shadow: '把一切交給運氣，或在低點時以為永遠如此。',
    love: '關係出現轉折，時機的成分很大。', work: '外在條件改變，需要順勢調整。',
    advice: '這次的變化不是你造成的，但回應方式是你的。', ask: '這個轉變裡，哪一部分真的在我手上？' },
  m11: { stage: 'inner', col: 4, numberEcho: null,
    role: '照著事實與責任，做出公平的結算。',
    lesson: '每個選擇都有它的代價，而且會回到自己身上。',
    shadow: '用道理當武器，或以公平之名不願體諒。',
    love: '關係需要坦白與對等，也可能牽涉法律形式。', work: '合約、責任歸屬與是非判定。',
    advice: '就事論事，把該講的講清楚。', ask: '如果拿掉情緒，事實到底是什麼？' },
  m12: { stage: 'inner', col: 5, numberEcho: null,
    role: '主動停下來，用完全不同的角度看同一件事。',
    lesson: '有時候不動才是真正的行動。',
    shadow: '把拖延說成等待，或用犧牲換取愧疚感。',
    love: '關係停滯，需要換位思考。', work: '暫時無法推進，適合重新理解問題。',
    advice: '先別動，換個角度看。', ask: '如果反過來看，這件事會變成什麼？' },
  m13: { stage: 'inner', col: 6, numberEcho: null,
    role: '讓已經結束的東西真的結束。',
    lesson: '不放手，新的就進不來。',
    shadow: '抓著殘骸不放，或用一切都會過去逃避處理。',
    love: '關係的某個階段確實結束了。', work: '該收掉的項目或角色。',
    advice: '承認它結束了，然後往前。', ask: '我不放手的，是這件事本身，還是我對它的期待？' },
  m14: { stage: 'inner', col: 7, numberEcho: null,
    role: '把兩種相反的東西調成剛好的比例。',
    lesson: '中庸不是妥協，是找到可持續的配方。',
    shadow: '什麼都要一點，最後什麼都不到位。',
    love: '需要磨合出彼此都舒服的節奏。', work: '調整資源配置與步調。',
    advice: '不要極端，慢慢調到剛好。', ask: '我現在是哪一邊過多了？' },
  m15: { stage: 'beyond', col: 1, numberEcho: null,
    role: '面對自己被什麼綁住。',
    lesson: '看清楚鎖鏈其實是自己套上的。',
    shadow: '用「我沒辦法」合理化不想改變。',
    love: '難以離開的依賴或不健康的模式。', work: '為了現實條件困在不適合的位置。',
    advice: '先承認你其實有選擇。', ask: '如果沒有後果，我還會留在這裡嗎？' },
  m16: { stage: 'beyond', col: 2, numberEcho: null,
    role: '假的結構被一次打掉。',
    lesson: '倒下來的東西，本來就不該撐那麼久。',
    shadow: '把崩塌全歸咎外力，錯過看清真相的機會。',
    love: '關係中不能再假裝的部分被攤開。', work: '突發變故打破原本的安排。',
    advice: '先讓它倒，再看剩下什麼是真的。', ask: '倒掉的這個東西，我早就知道它不穩嗎？' },
  m17: { stage: 'beyond', col: 3, numberEcho: null,
    role: '在崩塌之後，慢慢恢復希望。',
    lesson: '療癒需要時間，而且是安靜的。',
    shadow: '把希望當成不用行動的理由。',
    love: '關係開始修復，需要耐心。', work: '重新找到方向，但還在起步。',
    advice: '慢慢來，方向是對的。', ask: '我願意相信這次會不一樣嗎？' },
  m18: { stage: 'beyond', col: 4, numberEcho: null,
    role: '在看不清楚的地方前進。',
    lesson: '分辨哪些恐懼是真的，哪些是自己加上去的。',
    shadow: '把想像當成事實，然後對著幻覺反應。',
    love: '不安與猜測放大了實際的問題。', work: '資訊不足，判斷容易失真。',
    advice: '先確認事實，再決定要不要害怕。', ask: '這件事我看到的，有多少是我自己補上的？' },
  m19: { stage: 'beyond', col: 5, numberEcho: null,
    role: '事情變得清楚，能量回來了。',
    lesson: '不需要遮掩，可以直接做自己。',
    shadow: '過度樂觀而忽略還沒解決的部分。',
    love: '關係明朗、坦率而愉快。', work: '成果被看見，狀態正好。',
    advice: '把握現在，直接去做。', ask: '這份順利，我要用來完成什麼？' },
  m20: { stage: 'beyond', col: 6, numberEcho: null,
    role: '回頭把整段過去做一次總結算。',
    lesson: '看懂自己走過的路，才能真的往前。',
    shadow: '不斷審判自己或別人，停在檢討裡。',
    love: '舊關係重新浮現，或關係進入新的階段。', work: '過去的努力被重新評價。',
    advice: '面對它，然後做出回應。', ask: '如果現在重來，我會怎麼選？' },
  m21: { stage: 'beyond', col: 7, numberEcho: null,
    role: '整段旅程完整了。',
    lesson: '完成之後，下一輪從更高的位置重新開始。',
    shadow: '以為到終點就結束了，停在原地。',
    love: '關係達到完整與滿足。', work: '專案圓滿收束。',
    advice: '好好結束它，再開始下一件。', ask: '這一輪我真正學會的是什麼？' },
};

var COURT_ROLE_DATA = [
  {
    rank: 'page', keywords: ['新手', '好奇', '學'], title: '侍者 Page', en: 'Page', power: '正在認識',
    model: '我正在認識／學習這股能量',
    desc: '第一次接觸這個領域，還在摸索。好奇、生澀，但也因為沒有包袱而最願意嘗試。',
    asPerson: '年紀較輕或資歷較淺的人，也可能是任何在這件事上還是新手的人。',
    asState: '你在這個領域剛起步，知道的還不多，但興趣正濃。',
    asAdvice: '用學習者的姿態進場，先問、先看、先試，不要急著證明自己會。',
    love: '曖昧、剛開始、還在確認要不要投入。',
    work: '新職位、新專案，還在學規則的階段。',
    shadow: '光說不練、三分鐘熱度，或把新鮮感當成能力。',
    suits: {
      wands: '對新的可能性感到興奮，正想試試看能不能做到。',
      cups: '剛開始感覺到什麼，還說不清楚那是不是喜歡。',
      swords: '急著把想法說出口，還沒學會挑時機與分寸。',
      pentacles: '剛開始學一項技能，願意從最基本的做起。',
    },
  },
  {
    rank: 'knight', keywords: ['衝', '追', '快'], title: '騎士 Knight', en: 'Knight', power: '正在追求',
    model: '我正在追求／執行這股能量',
    desc: '已經知道自己要什麼，正全力往那個方向去。速度快、企圖強，但也最容易過頭。',
    asPerson: '行動力強、目標明確的人，通常帶著明顯的方向感或衝勁。',
    asState: '你正在為這件事全力衝刺，其他事都暫時排在後面。',
    asAdvice: '該行動了，但先確認方向對，因為這個位階很容易一路衝到底才發現走錯。',
    love: '主動追求、明確表態，也可能來得快去得快。',
    work: '正在執行、推進，處在專案最用力的階段。',
    shadow: '衝過頭、只顧目標而忽略人，或半途失去耐心。',
    suits: {
      wands: '追求刺激、行動與體驗，想到就去做。',
      cups: '主動追求情感與浪漫，願意為對方做出姿態。',
      swords: '主動追求想法、答案與突破，講話直接、行動快。',
      pentacles: '持續執行現實責任，慢但一步都不會少。',
    },
  },
  {
    rank: 'queen', keywords: ['成熟', '內化', '穩'], title: '皇后 Queen', en: 'Queen', power: '已經內化',
    model: '我已經把這股能力內化',
    desc: '這個領域的能力已經長在身上，不需要刻意就能運用。向內、成熟，重點在品質而非速度。',
    asPerson: '在這個領域已經很成熟的人，通常給人穩定、能接住別人的感覺。',
    asState: '你在這件事上已經有自己的一套，不用再靠外在肯定。',
    asAdvice: '相信自己已經會的部分，用你的方式處理，不必模仿別人。',
    love: '穩定投入、能照顧關係，也知道自己的界線在哪。',
    work: '這個領域的資深者，靠品質與判斷力而不是靠拚。',
    shadow: '過度照顧別人而忽略自己，或用成熟包裝控制。',
    suits: {
      wands: '有影響力也有溫度，能帶動別人而不必壓過別人。',
      cups: '能深刻同理，也容易被別人的情緒淹沒。',
      swords: '看得清楚、講得準確，有時準確得讓人受傷。',
      pentacles: '把生活與資源照顧得很好，務實而可靠。',
    },
  },
  {
    rank: 'king', keywords: ['負責', '決定', '用'], title: '國王 King', en: 'King', power: '對外運用',
    model: '我能穩定管理並對外運用這股能力',
    desc: '不只自己會，還能對外承擔與分配。向外、負責，重點在讓這股能量在更大的範圍裡運作。',
    asPerson: '在這個領域握有決定權或責任的人，通常是主管、長輩或專業權威。',
    asState: '你在這件事上要負最終責任，而且有能力承擔。',
    asAdvice: '做決定並承擔它，這個位階的力量來自負責，不是來自控制。',
    love: '願意承諾並負責，但也可能把關係當成需要管理的事。',
    work: '需要拍板、對結果負責的位置。',
    shadow: '變成專制、只用權威解決問題，或把責任當成不能鬆手的理由。',
    suits: {
      wands: '有願景也敢下注，能把一群人帶往一個方向。',
      cups: '情緒穩定成熟，能接住整個環境的感受。',
      swords: '以規則與邏輯治理，公正但可能顯得冷。',
      pentacles: '把資源經營成長期的穩定，重視實際結果。',
    },
  },
];

/* 「自己試著解牌」。題目由數字 × 花色即時組出來，不是寫死的題庫——
   使用者先自己用公式推一次，再展開答案比對。
   刻意不計分、不做連續答對：一旦有分數，人會開始猜答案而不是練推導。 */
var LIBRARY_DRILLS = [
  { num: '7', suit: 'pentacles' },
  { num: '8', suit: 'wands' },
  { num: '5', suit: 'cups' },
  { num: '4', suit: 'swords' },
];
function libraryDrillCard(numKey, suitKey) {
  var numMap = { A: 'A', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10' };
  return TAROT.filter(function (c) { return c.suit === suitKey && String(c.num) === numMap[numKey]; })[0] || null;
}
function renderLibraryDrills() {
  var h = '<div style="margin-top:16px;border-top:1px solid rgba(201,169,110,.2);padding-top:14px">';
  h += '<div style="font:600 13px \'Noto Serif TC\',serif;color:#e6cd9a">自己試著解牌</div>';
  h += '<p class="md-note" style="margin:5px 0 0">先用上面的公式自己推一次，再展開對答案。這裡不計分——重點是練會推導的過程。</p>';
  LIBRARY_DRILLS.forEach(function (d, i) {
    var numDef = NUMBER_FORMULA_DATA.filter(function (x) { return x.num === d.num; })[0];
    var suitDef = SUIT_DOMAIN_DATA.filter(function (x) { return x.suit === d.suit; })[0];
    var card = libraryDrillCard(d.num, d.suit);
    if (!numDef || !suitDef || !card) return;
    var key = 'drill:' + i;
    var open = !!(state.mnDrillOpen && state.mnDrillOpen[key]);
    h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:8px;padding:12px 13px;background:rgba(255,255,255,.02);margin-top:9px">';
    h += '<div style="font:600 13px \'Noto Serif TC\',serif;color:#f0e9d8">' + esc(card.nameZh) + '</div>';
    h += '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);margin-top:5px;line-height:1.75">先想想看：<br>・' + esc(numDef.label) + ' 代表什麼階段？<br>・' + esc(suitDef.title.split(' ')[0]) + ' 處理哪個領域？</div>';
    h += '<button type="button" aria-expanded="' + open + '" onclick="mnDrillToggle(\'' + key + '\')" style="min-height:44px;width:100%;margin-top:8px;background:none;border:none;border-top:1px solid rgba(201,169,110,.14);color:#c9a96e;font:500 11px \'Noto Sans TC\',sans-serif;cursor:pointer;padding:10px 0 0;display:flex;justify-content:space-between;align-items:center">'
      + '<span>' + (open ? '收起答案' : '展開答案') + '</span><span aria-hidden="true">' + (open ? '▴' : '›') + '</span></button>';
    if (open) {
      h += mnField(numDef.label + '＝' + numDef.name, numDef.question, '#e6cd9a');
      h += mnField(suitDef.title.split(' ')[0] + '＝' + suitDef.life, suitDef.domain, '#c9a96e');
      h += mnField('所以 ' + card.nameZh + ' 常呈現', numDef.suits[d.suit]);
      h += '<div style="margin-top:8px;font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.7">這是用公式推出來的方向。這張牌完整的傳統牌義，可以在上方牌陣列表點進' + esc(card.nameZh) + '查看。</div>';
    }
    h += '</div>';
  });
  return h + '</div>';
}

/* 大牌分頁。小牌靠「數字 × 花色」推導，大牌沒有這個結構，
   但它有三階段旅程與七組直行對應——那是牌陣本身的排列，不是本站自創。
   同一行的三張牌在講同一個課題的三種層次，使用者可以從已經懂的那張推到還不懂的。 */
function majorCardById(id) { return TAROT.filter(function (x) { return x.id === id; })[0] || null; }
function renderMajorJourney() {
  var h = '<p class="md-note" style="margin:10px 0 0">大牌沒有花色，推導靠的是它在整條旅程裡的位置。先看三個階段，再看七組對照——同一組的三張牌在講同一個課題的三種層次。</p>';

  /* 三階段 */
  h += '<div style="margin-top:11px">';
  MAJOR_STAGE_DATA.forEach(function (st) {
    var key = 'majstage:' + st.key;
    h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:8px;padding:11px 12px;background:rgba(255,255,255,.02);margin-top:8px">';
    h += '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">';
    h += '<span style="font:600 13px \'Noto Serif TC\',serif;color:#e6cd9a">' + esc(st.title) + '</span>';
    h += '<span style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + esc(st.range) + '</span></div>';
    h += '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);margin-top:4px;line-height:1.7">' + esc(st.memory) + '</div>';
    h += mnDisclosure(key, '這個階段在學什麼');
    if (mnIsExpanded(key)) h += mnField('階段任務', st.desc);
    h += '</div>';
  });
  h += '</div>';

  /* 七組直行對應 */
  h += '<div style="margin-top:16px;font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">七組對照・同一個課題的三種層次</div>';
  MAJOR_COLUMN_DATA.forEach(function (colDef) {
    var key = 'majcol:' + colDef.col;
    h += '<div style="border:1px solid rgba(201,169,110,.22);border-radius:8px;padding:11px 12px;background:rgba(255,255,255,.02);margin-top:8px">';
    h += '<div style="font:500 12.5px \'Noto Sans TC\',sans-serif;color:#f0e9d8">' + esc(colDef.theme) + '</div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">';
    colDef.ids.forEach(function (id) {
      var card = majorCardById(id);
      if (!card) return;
      h += '<button type="button" onclick="openLibCard(\'' + esc(id) + '\')" style="min-height:36px;font:500 11.5px \'Noto Serif TC\',serif;color:#e6cd9a;background:none;border:1px solid rgba(201,169,110,.35);border-radius:14px;padding:6px 12px;cursor:pointer">' + esc(card.nameZh) + '</button>';
    });
    h += '</div>';
    h += mnDisclosure(key, '這三張差在哪一層');
    if (mnIsExpanded(key)) {
      colDef.ids.forEach(function (id) {
        var card = majorCardById(id), j = MAJOR_JOURNEY_DATA[id];
        if (!card || !j) return;
        var stage = MAJOR_STAGE_DATA.filter(function (x) { return x.key === j.stage; })[0];
        h += '<div style="margin-top:9px;border-left:2px solid rgba(201,169,110,.35);padding-left:9px">';
        h += '<div style="font:600 12px \'Noto Serif TC\',serif;color:#e6cd9a">' + esc(card.nameZh)
          + '<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-left:6px">' + esc(stage ? stage.title.split('・')[1] : '') + '</span></div>';
        h += '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);margin-top:3px;line-height:1.75">' + esc(j.role) + '</div>';
        h += '</div>';
      });
    }
    h += '</div>';
  });

  /* 22 張逐張 */
  h += '<div style="margin-top:16px;font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">22 張大牌</div>';
  TAROT.filter(function (x) { return x.arcana === 'major'; }).forEach(function (card) {
    var j = MAJOR_JOURNEY_DATA[card.id];
    if (!j) return;
    var key = 'maj:' + card.id;
    var stage = MAJOR_STAGE_DATA.filter(function (x) { return x.key === j.stage; })[0];
    h += '<div style="border:1px solid rgba(201,169,110,.22);border-radius:8px;padding:11px 12px;background:rgba(255,255,255,.02);margin-top:8px">';
    h += '<div style="display:flex;gap:10px;align-items:flex-start">';
    h += '<div style="flex:none;min-width:32px;text-align:center;font:600 12px \'Noto Serif TC\',serif;color:#c9a96e;border:1px solid rgba(201,169,110,.35);border-radius:8px;padding:5px 4px">' + esc(card.num) + '</div>';
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font:600 13px \'Noto Serif TC\',serif;color:#f0e9d8">' + esc(card.nameZh) + '</div>';
    h += '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);margin-top:3px;line-height:1.7">' + esc(j.role) + '</div>';
    h += mnKeywordChips(String(card.upZh || '').split(/[、,]/).slice(0, 3), '#c9a96e');
    h += '</div></div>';
    h += mnDisclosure(key, '這張牌怎麼推出來');
    if (mnIsExpanded(key)) {
      if (stage) h += mnField('在旅程的哪一段', stage.title + '（' + stage.range + '）——' + stage.memory);
      if (j.col) {
        var colDef = MAJOR_COLUMN_DATA.filter(function (x) { return x.col === j.col; })[0];
        if (colDef) {
          var others = colDef.ids.filter(function (x) { return x !== card.id; })
            .map(function (x) { var cc = majorCardById(x); return cc ? cc.nameZh : x; }).join('、');
          h += mnField('同一個課題的另外兩張', colDef.theme + '——另外兩張是' + others + '，同一件事在不同層次的版本。', '#8fc7f4');
        }
      }
      if (j.numberEcho) h += mnField('和小牌數字的呼應', j.numberEcho);
      h += mnField('這張牌的課題', j.lesson, '#e6cd9a');
      h += mnField('陰影面', j.shadow, '#d9a0a0');
      h += mnField('感情題怎麼讀', j.love);
      h += mnField('工作題怎麼讀', j.work);
      h += mnField('當成建議牌', j.advice, '#9bc5a3');
      h += mnField('抽到這張先問自己', j.ask, '#e6cd9a');
      h += '<div style="margin-top:8px;font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.7">這裡講的是推導結構。'
        + esc(card.nameZh) + ' 完整的正逆位牌義，可以在牌陣列表點進這張牌查看。</div>';
    }
    h += '</div>';
  });
  return h;
}

function mnToggle() { state.mnOpen = !state.mnOpen; render(); }
/* Progressive disclosure：列表只給名稱、一句核心與關鍵字，深入內容點開才載入。
   key 前綴避免不同分頁的同名項目互相打架（例如花色 wands 與宮廷 wands 欄位）。 */
function mnExpandToggle(key) {
  state.mnExpanded = state.mnExpanded || {};
  state.mnExpanded[key] = !state.mnExpanded[key];
  render();
}
function mnIsExpanded(key) { return !!(state.mnExpanded && state.mnExpanded[key]); }
function mnLearnToggle() { state.mnLearnMode = !state.mnLearnMode; render(); }
/* 「自己試著解牌」的答案是否揭曉。刻意不做計分或連續答對——目的是建立推導能力，
   不是玩遊戲；一旦有分數，使用者會開始猜答案而不是想推導過程。 */
function mnDrillToggle(key) {
  state.mnDrillOpen = state.mnDrillOpen || {};
  state.mnDrillOpen[key] = !state.mnDrillOpen[key];
  render();
}
function mnKeywordChips(words, color) {
  return '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px">' + (words || []).map(function (w) {
    return '<span style="font:400 10px \'Noto Sans TC\',sans-serif;border:1px solid rgba(201,169,110,.3);color:' + (color || 'rgba(240,233,216,.72)') + ';border-radius:10px;padding:2px 8px">' + esc(w) + '</span>';
  }).join('') + '</div>';
}
function mnDisclosure(key, label) {
  var open = mnIsExpanded(key);
  return '<button type="button" aria-expanded="' + open + '" onclick="mnExpandToggle(\'' + esc(key) + '\')" style="min-height:44px;width:100%;margin-top:8px;background:none;border:none;border-top:1px solid rgba(201,169,110,.14);color:#c9a96e;font:500 11px \'Noto Sans TC\',sans-serif;cursor:pointer;padding:10px 0 0;display:flex;justify-content:space-between;align-items:center;gap:8px">'
    + '<span>' + esc(label) + '</span><span aria-hidden="true">' + (open ? '▴' : '›') + '</span></button>';
}
function mnField(label, text, color) {
  if (!text) return '';
  return '<div style="margin-top:8px;border-left:2px solid ' + (color || 'rgba(201,169,110,.35)') + ';padding-left:9px">'
    + '<span style="font:500 10.5px \'Noto Sans TC\',sans-serif;color:' + (color || '#c9a96e') + '">' + esc(label) + '</span>'
    + '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.8;margin-top:2px">' + esc(text) + '</div></div>';
}
/* 四花色變化：這是「數字 × 花色 → 單張牌」推導的展示位置，
   每一句都寫成「因為…所以…」，讓使用者看得到中間的邏輯而不只是結果。 */
function mnSuitBreakdown(map) {
  var order = [['wands', '權杖', '#d9964a'], ['cups', '聖杯', '#7fa8c9'], ['swords', '寶劍', '#a9a9c9'], ['pentacles', '錢幣', '#9fbf7f']];
  var h = '<div style="margin-top:9px">';
  order.forEach(function (o) {
    if (!map[o[0]]) return;
    h += '<div style="display:flex;gap:8px;margin-top:6px;align-items:flex-start">'
      + '<span style="flex:none;font:500 10.5px \'Noto Sans TC\',sans-serif;color:' + o[2] + ';border:1px solid ' + o[2] + '55;border-radius:8px;padding:2px 7px;white-space:nowrap">' + o[1] + '</span>'
      + '<span style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.75">' + esc(map[o[0]]) + '</span></div>';
  });
  return h + '</div>';
}

function mnSetTab(k) { state.mnTab = k; render(); }

function renderMnemonic() {
  var h = '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;margin-top:14px;background:rgba(255,255,255,.02);overflow:hidden">';
  h += '<button type="button" onclick="mnToggle()" style="min-height:44px;width:100%;background:none;border:none;padding:12px 15px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">';
  h += '<span style="font:500 13px \'Noto Sans TC\',sans-serif;color:#e6cd9a">🧠 記憶心法 <span style="font:italic 10px \'EB Garamond\',serif;color:rgba(240,233,216,.62)">Mnemonics</span></span>';
  h += '<span style="color:#c9a96e;font-size:11px">' + (state.mnOpen ? '▲ 收起' : '▼ 展開') + '</span>';
  h += '</button>';
  if (state.mnOpen) {
    h += '<div style="padding:0 15px 15px">';
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    [['suit', '花色領域'], ['number', '數字公式'], ['court', '宮廷角色'], ['major', '大牌旅程'], ['confuse', '易混淆']].forEach(function (t) {
      var active = state.mnTab === t[0];
      h += '<button type="button" onclick="mnSetTab(\'' + t[0] + '\')" style="min-height:44px;flex:1 1 92px;background:' + (active ? 'rgba(201,169,110,.18)' : 'transparent') + ';border:1px solid ' + (active ? '#c9a96e' : 'rgba(201,169,110,.3)') + ';color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.5)') + ';padding:7px 4px;border-radius:8px;cursor:pointer;font:500 12px \'Noto Sans TC\',sans-serif">' + t[1] + '</button>';
    });
    h += '</div>';
    /* 一般／學習模式。兩者用同一份知識資料，學習模式只是多開幾層推導內容，
       不會產生互相矛盾的牌義。 */
    h += '<div role="group" aria-label="閱讀模式" style="display:flex;justify-content:flex-end;align-items:center;gap:6px;margin-top:10px;flex-wrap:wrap">';
    h += '<span style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);padding:6px 2px">閱讀模式</span>';
    [[false, '一般'], [true, '學習']].forEach(function (m) {
      var on = !!state.mnLearnMode === m[0];
      h += '<button type="button" aria-pressed="' + on + '" onclick="mnLearnToggle()" style="min-height:36px;font:500 10.5px \'Noto Sans TC\',sans-serif;border:1px solid ' + (on ? '#e6cd9a' : 'rgba(201,169,110,.3)') + ';border-radius:12px;padding:5px 10px;background:' + (on ? 'rgba(201,169,110,.18)' : 'transparent') + ';color:' + (on ? '#f0e9d8' : '#c9a96e') + ';cursor:pointer">' + (on ? '✓ ' : '') + m[1] + '</button>';
    });
    h += '</div>';
    h += '<div role="status" style="text-align:right;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:3px">目前：' + (state.mnLearnMode ? '學習模式（數字公式頁會多出推導練習）' : '一般模式（只看核心與關鍵字，需要時再展開）') + '</div>';
    if (state.mnTab === 'suit') {
      h += '<p class="md-note" style="margin:10px 0 0">花色回答「這件事發生在人生的哪一塊」。點開可以看到同一個花色在感情、工作、金錢題裡各自怎麼翻譯。</p>';
      SUIT_DOMAIN_DATA.forEach(function (d) {
        var key = 'suit:' + d.suit;
        h += '<div style="border:1px solid rgba(201,169,110,.25);border-left:3px solid ' + d.color + ';border-radius:8px;padding:12px 13px;background:rgba(255,255,255,.02);margin-top:9px">';
        h += '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">';
        h += '<span style="font:600 13.5px \'Noto Serif TC\',serif;color:' + d.color + '">' + d.title + '</span>';
        h += '<span style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">' + esc(d.element) + '元素・' + esc(d.life) + '</span>';
        h += '</div>';
        h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:5px">核心問題：' + esc(d.coreQuestion) + '</div>';
        h += mnKeywordChips(d.tags, 'rgba(240,233,216,.72)');
        h += mnDisclosure(key, '深入理解這個花色');
        if (mnIsExpanded(key)) {
          h += mnField('關注領域', d.domain);
          h += mnField('健康運作', d.healthy, '#9bc5a3');
          h += mnField('過度運作', d.excess, '#d9a0a0');
          h += mnField('能量不足', d.lack, '#b7a4d8');
          h += '<div style="margin-top:11px;font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">同一個花色，不同問題怎麼讀</div>';
          h += mnField('感情題', d.love);
          h += mnField('工作題', d.work);
          h += mnField('金錢題', d.money);
          h += mnField('當成建議牌', d.advice);
        }
        h += '</div>';
      });
    } else if (state.mnTab === 'number') {
      /* 推牌公式放在最上面：使用者要先知道「牌義是被推導出來的」，
         後面每個數字的四花色變化才有意義，而不是又一份關鍵字表。 */
      h += '<div style="margin-top:12px;border:1px solid rgba(201,169,110,.35);border-radius:10px;padding:13px 14px;background:rgba(201,169,110,.07)">';
      h += '<div style="font:600 13px \'Noto Serif TC\',serif;color:#e6cd9a">一張小阿爾克那怎麼讀？</div>';
      [['數字', '事情發展到哪個階段'], ['花色', '事情發生在哪種人生領域'],
       ['牌面圖像與傳統牌義', '這股力量具體怎麼表現'], ['正逆位', '這股能量目前如何運作'],
       ['問題情境', '最後翻譯成感情、工作、金錢或其他生活問題']].forEach(function (r, i) {
        h += '<div style="display:flex;gap:8px;align-items:baseline;margin-top:' + (i ? '6' : '9') + 'px">'
          + '<span style="flex:none;font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;min-width:104px">' + (i ? '× ' : '　') + r[0] + '</span>'
          + '<span style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.7">' + r[1] + '</span></div>';
      });
      h += '<div style="margin-top:10px;padding-top:9px;border-top:1px dashed rgba(201,169,110,.25);font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);line-height:1.8">'
        + '例：<strong style="color:#e6cd9a">8</strong>＝持續投入、進入運作　×　<strong style="color:#9fbf7f">錢幣</strong>＝技能、工作、現實資源　→　'
        + '<strong style="color:#f0e9d8">錢幣八</strong>＝持續投入技能與工作，因此形成練習、精進、重複操作與培養專業的牌義。</div>';
      h += '<div style="margin-top:8px;font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.7">公式是用來推導與記憶的，不取代單張牌的傳統牌義；每張牌在牌典裡仍有自己完整的解釋。</div>';
      h += '</div>';

      h += '<p class="md-note" style="margin:11px 0 0">數字說的是「發展到哪個階段」，不是固定的好壞。點開任一階段可以看到它在四個花色裡各自長成什麼樣子。</p>';
      NUMBER_FORMULA_DATA.forEach(function (d) {
        var key = 'num:' + d.num;
        h += '<div style="border:1px solid rgba(201,169,110,.22);border-radius:8px;padding:11px 12px;background:rgba(255,255,255,.02);margin-top:9px">';
        h += '<div style="display:flex;gap:11px;align-items:flex-start">';
        h += '<div style="flex:none;min-width:36px;text-align:center;font:600 14px \'Noto Serif TC\',serif;color:#c9a96e;border:1px solid rgba(201,169,110,.35);border-radius:8px;padding:5px 4px">' + esc(d.label) + '</div>';
        h += '<div style="flex:1;min-width:0">';
        h += '<div style="font:600 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8">' + esc(d.name) + '</div>';
        h += '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);margin-top:3px;line-height:1.65">' + esc(d.memory) + '</div>';
        h += mnKeywordChips(d.keywords, '#c9a96e');
        h += '</div></div>';
        h += mnDisclosure(key, '為什麼會發展到這個階段');
        if (mnIsExpanded(key)) {
          h += mnField('核心問題', d.question, '#e6cd9a');
          h += mnField('核心概念', d.concept);
          h += mnField('為什麼會走到這裡', d.why);
          h += mnField('正向運作', d.positive, '#9bc5a3');
          h += mnField('過度或陰影運作', d.shadow, '#d9a0a0');
          h += '<div style="margin-top:11px;font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">同一個階段，四個花色的長相</div>';
          h += mnSuitBreakdown(d.suits);
          h += mnField('抽到這個數字先問自己', d.ask, '#e6cd9a');
          h += mnField('常見誤區', d.myth, '#b7a4d8');
        }
        h += '</div>';
      });

      /* 自己試著解牌：先讓使用者用上面的公式推一次，再揭曉。
         刻意不計分、不排行——目的是建立推導能力，有分數就會變成猜答案。 */
      if (state.mnLearnMode) {
        h += renderLibraryDrills();
      }
    } else if (state.mnTab === 'confuse') {
      h += '<p class="md-note" style="margin:10px 0 0">分不出來的兩張牌，差別通常不在關鍵字，而在「為什麼會走到這一步」。每組最後都有一個可以直接拿來判斷的問題。</p>';
      CONFUSE_DATA.forEach(function (g, gi) {
        var key = 'cf:' + gi;
        h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:8px;padding:12px 13px;background:rgba(255,255,255,.02);margin-top:9px">';
        h += '<div style="font:500 11.5px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + esc(g.common) + '</div>';
        h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:7px">';
        g.cards.forEach(function (cc) {
          var card = TAROT.find(function (x) { return x.id === cc.id; });
          if (!card) return;
          h += '<button type="button" onclick="openLibCard(\'' + esc(card.id) + '\')" style="min-height:36px;font:600 11.5px \'Noto Serif TC\',serif;color:#e6cd9a;background:none;border:1px solid rgba(201,169,110,.35);border-radius:14px;padding:6px 12px;cursor:pointer">' + esc(card.nameZh) + '</button>';
        });
        h += '</div>';
        h += mnDisclosure(key, '怎麼分辨這幾張');
        if (mnIsExpanded(key)) {
          g.cards.forEach(function (cc) {
            var card = TAROT.find(function (x) { return x.id === cc.id; });
            if (!card) return;
            h += '<div style="margin-top:9px;border-left:2px solid rgba(201,169,110,.35);padding-left:9px">';
            h += '<div style="font:600 12px \'Noto Serif TC\',serif;color:#e6cd9a">' + esc(card.nameZh) + '</div>';
            if (cc.stance) h += '<div style="font:500 11.5px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:3px;line-height:1.7">「' + esc(cc.stance) + '」</div>';
            h += '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);margin-top:3px;line-height:1.75">' + esc(cc.diff) + '</div>';
            if (cc.when) h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:3px;line-height:1.7">什麼情況比較像它：' + esc(cc.when) + '</div>';
            h += '</div>';
          });
          if (g.decide) {
            h += '<div style="margin-top:11px;border:1px solid rgba(201,169,110,.3);border-radius:8px;padding:9px 11px;background:rgba(201,169,110,.06)">'
              + '<span style="font:500 10.5px \'Noto Sans TC\',sans-serif;color:#c9a96e">判斷問題</span>'
              + '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:3px;line-height:1.75">' + esc(g.decide) + '</div></div>';
          }
        }
        h += '</div>';
      });
    } else if (state.mnTab === 'major') {
      h += renderMajorJourney();
    } else {
      h += '<p class="md-note" style="margin:10px 0 0">宮廷牌問的是「你跟這股能量的關係走到哪」。四個位階是同一條學習曲線：認識 → 追求 → 內化 → 對外運用。</p>';
      COURT_ROLE_DATA.forEach(function (d) {
        var key = 'court:' + d.rank;
        h += '<div style="border:1px solid rgba(201,169,110,.25);border-radius:8px;padding:12px 13px;background:rgba(255,255,255,.02);margin-top:9px">';
        h += '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">';
        h += '<span style="font:600 13.5px \'Noto Serif TC\',serif;color:#e6cd9a">' + esc(d.title) + '</span>';
        h += '<span style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + esc(d.power) + '</span>';
        h += '</div>';
        h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:5px;line-height:1.7">「' + esc(d.model) + '」</div>';
        h += mnKeywordChips(d.keywords, '#c9a96e');
        h += mnDisclosure(key, '深入理解這個位階');
        if (mnIsExpanded(key)) {
          h += mnField('這個位階在說什麼', d.desc);
          h += mnField('當成人物', d.asPerson);
          h += mnField('當成你自己的狀態', d.asState);
          h += mnField('當成行動建議', d.asAdvice, '#e6cd9a');
          h += mnField('感情中的表現', d.love);
          h += mnField('工作中的表現', d.work);
          h += mnField('陰影面', d.shadow, '#d9a0a0');
          h += '<div style="margin-top:11px;font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">同一個位階，四個花色的長相</div>';
          h += mnSuitBreakdown(d.suits);
        }
        h += '</div>';
      });
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
  19: { kw: ['體制', '孤高', '官方', '劃清距離'], mean: '與機構、官方或體制有關，也象徵站得高、看得清楚，但也離人群比較遠。', love: '有一方過於獨立疏離。', career: '大公司、政府部門或制度性事務。', advice: '在體制內找到位置，孤獨時記得下樓。', pc: '黑桃 6', tone: '中性' },
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
      + cardImgHtml(d.card.img, d.card.nameZh, true)
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
  h += '<div style="text-align:center;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:10px">點牌翻面，完整解讀在下方摘要</div>';
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

/* ================= 通用文字分享圖 =================
   占卜有 shareResultImage()，但星盤沒有——而人生主題分析才是這個站最值得被分享的
   內容。那支函式是為牌陣寫的（要排牌圖、算列數），星盤紀錄套不上，所以另外做一個
   純文字版的海報產生器，之後命盤總覽之類的區塊也能直接呼叫。

   隱私：分享圖刻意不包含出生日期、時間與城市。使用者要公開的是解讀，不是自己的
   出生資料；一旦貼到社群就收不回來了。 */
function shareTextCardImage(opts) {
  try {
    var W = 750, pad = 46;
    var cv = document.createElement('canvas');
    var mctx = cv.getContext('2d');
    mctx.font = '24px "Noto Sans TC", sans-serif';
    var maxW = W - 2 * pad;

    /* 先量測高度再決定畫布大小——CJK 換行後的行數沒辦法預估。 */
    var blocks = [];
    (opts.sections || []).forEach(function (sec) {
      var titleLines = sec.title ? wrapCJK(mctx, sec.title, maxW) : [];
      var bodyLines = sec.body ? wrapCJK(mctx, sec.body, maxW) : [];
      var noteLines = sec.note ? wrapCJK(mctx, sec.note, maxW) : [];
      blocks.push({ label: sec.label || '', titleLines: titleLines, bodyLines: bodyLines, noteLines: noteLines });
    });
    var headH = 200;
    var bodyH = blocks.reduce(function (n, b) {
      return n + (b.label ? 30 : 0) + b.titleLines.length * 40 + b.bodyLines.length * 34 + b.noteLines.length * 30 + 30;
    }, 0);
    var H = headH + bodyH + 110;
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');

    ctx.fillStyle = '#14111a'; ctx.fillRect(0, 0, W, H);
    var grd = ctx.createRadialGradient(W * 0.2, 60, 10, W * 0.2, 60, 520);
    grd.addColorStop(0, 'rgba(201,169,110,.12)'); grd.addColorStop(1, 'rgba(201,169,110,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(201,169,110,.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(16, 16, W - 32, H - 32);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9a96e'; ctx.font = 'italic 19px Georgia, serif';
    ctx.fillText('M Y S T I C   D E C K', W / 2, 66);
    ctx.fillStyle = '#f0e9d8'; ctx.font = '600 34px "Noto Serif TC", serif';
    ctx.fillText(String(opts.title || ''), W / 2, 114);
    if (opts.subtitle) {
      ctx.fillStyle = 'rgba(240,233,216,.6)'; ctx.font = '19px "Noto Sans TC", sans-serif';
      ctx.fillText(String(opts.subtitle), W / 2, 152);
    }

    ctx.textAlign = 'left';
    var y = headH;
    blocks.forEach(function (b) {
      if (b.label) {
        ctx.fillStyle = '#c9a96e'; ctx.font = '500 19px "Noto Sans TC", sans-serif';
        ctx.fillText(b.label, pad, y); y += 30;
      }
      ctx.fillStyle = '#e6cd9a'; ctx.font = '600 27px "Noto Serif TC", serif';
      b.titleLines.forEach(function (l) { ctx.fillText(l, pad, y + 22); y += 40; });
      ctx.fillStyle = 'rgba(240,233,216,.82)'; ctx.font = '22px "Noto Sans TC", sans-serif';
      b.bodyLines.forEach(function (l) { ctx.fillText(l, pad, y + 18); y += 34; });
      ctx.fillStyle = 'rgba(240,233,216,.6)'; ctx.font = '19px "Noto Sans TC", sans-serif';
      b.noteLines.forEach(function (l) { ctx.fillText(l, pad, y + 16); y += 30; });
      y += 30;
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(240,233,216,.45)'; ctx.font = 'italic 15px Georgia, serif';
    ctx.fillText(opts.footer || 'Mystic Deck · 塔羅 · 占星', W / 2, H - 42);

    cv.toBlob(function (blob) {
      if (!blob) return;
      var name = (opts.fileName || '分享圖') + '_' + new Date().toISOString().slice(0, 10) + '.png';
      var file;
      try { file = new File([blob], name, { type: 'image/png' }); } catch (e) { file = null; }
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: opts.title || 'Mystic Deck' }).catch(function () {});
      } else {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      }
    }, 'image/png');
    return true;
  } catch (e) { return false; }
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

/* reassignImages() 已移除：那是 split-asset build 時期的殘留，整個專案沒有任何
   呼叫點（git grep 只找得到定義本身）。牌面圖片實際上是 reading-data.js 載入時
   就依 IMG 指派好的，這支函式從來沒有參與過。 */

/* ================= 學習系統:易混淆對比 / 抽認卡測驗 / 22天計畫 ================= */

/* ---- 易混淆牌對比(記憶心法第四頁籤) ---- */
/* 易混淆比較。每組不只列關鍵字，而是給：兩張的共同點 → 各自的立場（第一人稱一句話）
   → 什麼情況比較像它 → 一個可以直接拿來判斷的問題。
   stance 是這張牌「如果會說話，它會怎麼說」——實測這比形容詞更容易記住差異。 */
var CONFUSE_DATA = [
  { common: '都可能是「結束」', decide: '這個結束是自然走完、突然斷裂，還是已經痛到谷底？', cards: [
    { id: 'm13', stance: '這個階段已經走完了，我要放下它往前。', diff: '漸進的轉化——結束是過程的一部分，通常早有徵兆。', when: '事情慢慢淡掉、你自己也知道該告一段落。' },
    { id: 'm16', stance: '我以為穩固的東西，其實根基是假的。', diff: '突然的崩塌——外力介入，把撐不住的結構一次打掉。', when: '毫無預警、你完全沒準備好的變故。' },
    { id: 'swords-10', stance: '已經壞到底了，不會更糟。', diff: '谷底的終點——痛感最強，但也代表這一輪真的結束了。', when: '你已經耗盡、只想承認事情結束的時候。' },
  ]},
  { common: '都在講「兩人關係」', decide: '這是價值觀層級的重大選擇，還是日常的情感連結？', cards: [
    { id: 'm6', stance: '我要選擇成為什麼樣的人，而這個選擇跟關係有關。', diff: '靈魂層面的契合與重大抉擇，牽涉價值觀與人生方向。', when: '關係逼你面對「我到底要什麼」的時候。' },
    { id: 'cups-2', stance: '我們之間有真實的連結。', diff: '日常層面的情感連結、相互吸引與對等的交流。', when: '兩人正在建立或修復關係本身。' },
  ]},
  { common: '都是「被綁住的感覺」', decide: '綁住我的是自己的慾望，還是我正在做的選擇？', cards: [
    { id: 'm15', stance: '我知道這樣不好，但我離不開。', diff: '被慾望、依賴或不健康的模式綑住，而且鎖鏈其實是鬆的。', when: '明知有問題卻反覆回去的狀況。' },
    { id: 'm6', stance: '我要選哪一邊？', diff: '關係中的選擇本身，重點在做出決定而非被困住。', when: '你其實有選擇權，只是還沒決定。' },
  ]},
  { common: '都是「暫停與獨處」', decide: '我是主動退開去想清楚，還是被迫停下來休息？', cards: [
    { id: 'm9', stance: '我需要離開人群，自己把答案想清楚。', diff: '主動的、有目的的獨處，帶著尋找的意圖。', when: '你自己選擇抽離，而且知道在找什麼。' },
    { id: 'swords-4', stance: '我撐不住了，需要先停下來。', diff: '被動的、恢復性的休息，重點是止損與復原。', when: '你已經耗損，需要的是休息而不是答案。' },
  ]},
  { common: '都可能是「離開」', decide: '是因為不再想要，還是因為現在需要離開困境？', cards: [
    { id: 'cups-8', stance: '我情感上已經得不到滿足，所以決定離開。', diff: '主動放下——即使外在看起來還不錯，內在已經沒有了。', when: '你自己選擇走，而且不打算回頭。' },
    { id: 'swords-6', stance: '現在的環境太混亂，所以先移動到比較平靜的地方。', diff: '過渡性的移動——不是不要了，是需要先脫離現在的處境。', when: '你是為了喘口氣而離開，未必是永久的。' },
  ]},
  { common: '都是「不做決定」', decide: '我是刻意不看，還是選擇先什麼都不做？', cards: [
    { id: 'swords-2', stance: '我不想看，所以我把眼睛遮起來。', diff: '迴避——訊息就在那裡，但你選擇不去面對。', when: '你其實知道答案，只是不想承認。' },
    { id: 'm12', stance: '我先停在這裡，換個角度看。', diff: '主動的暫停與觀點轉換，犧牲當下換取不同的理解。', when: '你願意等，而且期待從中看到新的東西。' },
  ]},
  { common: '都是「好事、有希望」', decide: '這份好是還在醞釀的希望，還是已經實現的成果？', cards: [
    { id: 'm17', stance: '風暴過去了，我可以慢慢重建。', diff: '療癒與希望——安靜的、還在恢復中的，尚未成形。', when: '剛脫離低潮，前面還需要時間。' },
    { id: 'm19', stance: '一切都清楚而明亮。', diff: '成功與清晰——結果已經出來，可以被看見與慶祝。', when: '事情已經明朗，能量充足。' },
  ]},
  { common: '都跟「看不見的事」有關', decide: '這是可以被理解的內在智慧，還是會扭曲判斷的投射？', cards: [
    { id: 'm2', stance: '答案在裡面，但還不到說出口的時候。', diff: '內在的、可信任的直覺與潛在知識，安靜但清楚。', when: '你需要的是安靜下來聽自己。' },
    { id: 'm18', stance: '我看到的東西，可能不是真的。', diff: '恐懼、幻想與投射——看到的畫面被自己的情緒改造過。', when: '不安讓你開始腦補劇情。' },
  ]},
  { common: '都是「成熟的女性能量」', decide: '這是豐盛的創造與滋養，還是深度的情感理解？', cards: [
    { id: 'm3', stance: '我讓事物生長、豐盛起來。', diff: '創造與孕育，偏向物質、感官與具體的產出。', when: '重點是把東西生出來、養大。' },
    { id: 'cups-Queen', stance: '我能感覺到你沒說出口的部分。', diff: '情感的深度與同理，偏向感受、療癒與接住人。', when: '重點是情緒的理解與陪伴。' },
  ]},
  { common: '都是「快速前進」', decide: '推動我的是意志力，還是事情本身的速度？', cards: [
    { id: 'm7', stance: '我靠意志把兩股相反的力量控制住，往前走。', diff: '有駕馭者——前進來自自我控制與方向感。', when: '你需要克服阻力、掌握局面。' },
    { id: 'wands-8', stance: '事情一次全部來了。', diff: '沒有駕馭者——速度來自外在，消息與事件同時發生。', when: '你只是被捲進快速的進展裡。' },
  ]},
  { common: '都跟「結果與判決」有關', decide: '這是我行為的直接後果，還是一次更大的清算與召喚？', cards: [
    { id: 'm11', stance: '因為你做了什麼，所以得到什麼。', diff: '因果與平衡——就事論事，重點在公平與責任。', when: '牽涉合約、對錯、該負的責任。' },
    { id: 'm20', stance: '該面對全部的過去了。', diff: '總結算與覺醒——跨越整個階段的回顧與召喚。', when: '重大轉折、重新評估整段人生。' },
  ]},
  { common: '都是「權威與規則」', decide: '這個權威來自實力與地位，還是來自傳統與信念體系？', cards: [
    { id: 'm4', stance: '規矩由我訂，因為責任在我身上。', diff: '世俗的權威——結構、控制與實際的掌權。', when: '牽涉制度、位階與現實中的決定權。' },
    { id: 'm5', stance: '我們照著傳下來的方式做。', diff: '精神與傳統的權威——教導、共識與既有的價值體系。', when: '牽涉信念、教育、群體規範。' },
  ]},
  { common: '都是「新的開始」', decide: '這是我主動創造的開始，還是機會被送到我面前？', cards: [
    { id: 'm1', stance: '我有全部的工具，可以開始創造。', diff: '主動的創造者——能力齊備，重點在把想法變成現實。', when: '你有意識地啟動一件事。' },
    { id: 'wands-A', stance: '一個新的可能性出現了。', diff: '被給予的火種——機會與衝動出現，還沒被組織起來。', when: '靈感或機會剛冒出來，尚未成形。' },
  ]},
  { common: '都是「一個循環完成」', decide: '這是還在轉動的階段變化，還是真正的完整結束？', cards: [
    { id: 'm10', stance: '情況變了，輪子又轉了一格。', diff: '轉動中的變化——起伏會繼續，不是終點。', when: '運勢或處境正在改變，但故事沒完。' },
    { id: 'm21', stance: '這一輪完整了。', diff: '真正的完成與整合——所有部分都到位。', when: '一個大階段確實走完。' },
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
  // 3) 掌握度越低，權重越高(間隔重複)
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
  h += '<div style="text-align:center;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:8px">已掌握 ' + masteredCount(isTarot) + ' / ' + deckArr.length + ' 張 · 答錯的牌會更常出現</div>';

  // 題目
  var prompt = { img: '這張牌是?', meaning: '哪張牌的牌義是——', kw: '這些關鍵字屬於哪張牌?' }[q.type];
  h += '<div style="text-align:center;margin-top:18px">';
  h += '<div style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8">' + prompt + '</div>';
  if (q.type === 'img') {
    h += '<div style="width:132px;margin:14px auto 0;aspect-ratio:150/230;border-radius:8px;border:1px solid #d8b96c;overflow:hidden;background:#f2e9d8;display:flex;flex-direction:column">' + cardImgHtml(q.card.img, '?', true) + '</div>';
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
  if (studyData.start) h += '<div style="font:italic 10px \'EB Garamond\',serif;color:rgba(240,233,216,.62)">' + doneN + ' / 22</div>';
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
      h += '<div onclick="openLibCard(\'' + todayCard.id + '\')" style="flex:none;width:52px;aspect-ratio:150/230;border-radius:6px;border:1px solid #d8b96c;overflow:hidden;background:#f2e9d8;display:flex;flex-direction:column;cursor:pointer">' + cardImgHtml(todayCard.img, todayCard.nameZh, true) + '</div>';
      h += '<div style="flex:1;min-width:0">';
      h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">第 ' + day + ' 天 · 今日學習</div>';
      h += '<div onclick="openLibCard(\'' + todayCard.id + '\')" style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:2px;cursor:pointer">' + todayCard.nameZh + ' <span style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.5)">' + todayCard.nameEn + '</span></div>';
      if (reviewCard) h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:3px">複習昨日:<span onclick="openLibCard(\'' + reviewCard.id + '\')" style="color:#c9a96e;cursor:pointer;border-bottom:1px dotted rgba(201,169,110,.5)">' + reviewCard.nameZh + '</span></div>';
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
  h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#e6cd9a">🔍 組合速查 <span style="font:italic 10px \'EB Garamond\',serif;color:rgba(240,233,216,.62)">Pair Lookup</span></div>';
  h += '<div style="display:flex;gap:8px;align-items:center;margin-top:10px">';
  h += '<select onchange="comboSet(\'a\', this.value)" style="' + selStyle + '">' + options(state.comboA) + '</select>';
  h += '<button onclick="comboSwap()" style="flex:none;background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;border-radius:8px;padding:8px 10px;cursor:pointer;font-size:12px" title="交換順序">⇄</button>';
  h += '<select onchange="comboSet(\'b\', this.value)" style="' + selStyle + '">' + options(state.comboB) + '</select>';
  h += '</div>';
  if (a && b && a.n !== b.n) {
    h += '<div style="border:1px solid rgba(201,169,110,.35);border-radius:8px;padding:11px 13px;margin-top:10px;background:rgba(201,169,110,.07)">';
    h += '<div style="font:600 13px \'Noto Serif TC\',serif;color:#f0e9d8">「' + a.nameZh + ' ＋ ' + b.nameZh + '」</div>';
    h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#e6cd9a;margin-top:5px;line-height:1.7">' + esc(lenPairText(a, b)) + '</div>';
    h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:7px">反過來讀:「' + b.nameZh + ' ＋ ' + a.nameZh + '」＝' + esc(lenPairText(b, a)) + '</div>';
    h += '</div>';
    h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:8px;line-height:1.6">讀法:第一張是主題，第二張為它上色。順序不同，意義也不同。</div>';
  } else if (a && b) {
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:10px;text-align:center">請選兩張不同的牌</div>';
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
  h += '<span style="font:500 13px \'Noto Sans TC\',sans-serif;color:#e6cd9a">🧠 記憶心法 <span style="font:italic 10px \'EB Garamond\',serif;color:rgba(240,233,216,.62)">Mnemonics</span></span>';
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
      [['吉', '#9fce9f', '順著用，是好訊號'], ['中性', 'rgba(240,233,216,.6)', '看前後牌決定方向'], ['凶', '#d99b5f', '提醒與警訊，搭配建議讀']].forEach(function (g) {
        var ns = [];
        for (var n = 1; n <= 36; n++) if (LEN_RICH[n] && LEN_RICH[n].tone === g[0]) ns.push(n);
        h += '<div style="margin-top:12px">';
        h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:' + g[1] + '">' + g[0] + '（' + ns.length + ' 張）<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-left:6px">' + g[2] + '</span></div>';
        h += '<div style="margin-top:4px">' + ns.map(function (n) { return chip(n, g[1]); }).join('') + '</div>';
        h += '</div>';
      });
    } else if (state.mnTabLen === 'theme') {
      LEN_THEME_GROUPS.forEach(function (g) {
        h += '<div style="margin-top:12px">';
        h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + g.label + '<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-left:6px">' + g.hint + '</span></div>';
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
    h += d.card.img ? '<img src="' + cardThumbSrc(d.card.img) + '" alt="' + esc(d.card.nameZh) + '" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:contain;display:block">' : '';
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
  h += '<div style="text-align:center;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:8px">點任一張牌可查看牌義 · 完整解讀在下方摘要</div>';

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
  h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:11px;line-height:1.6">提示:大牌陣裡，離代表牌越近的牌影響越強;可以用上方「組合速查」深入任兩張相鄰的牌。</div>';
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
/* 「清除我的所有紀錄」必須真的清掉本站寫進 localStorage 的每一個 key。
   之前只清了 4 個，tl_xiu_partners（使用者存下來的配對對象出生年月日，屬於個人資料）
   會留在裝置上，跟隱私說明「按下方按鈕即可完全刪除」不符；tl_ai_persona 與兩個
   導覽已讀旗標也一併清掉，讓清除後的狀態等同全新造訪。 */
var APP_STORAGE_KEYS = [
  'tl_history', 'tl_learn', 'tl_study', 'tl_astro_profile',
  'tl_xiu_partners', 'tl_ai_persona', 'tl_home_tour_seen', 'tl_astro_tour_seen',
  'tl_astro_charts',
  'tl_astro_copy_mode',
];
/* 這裡本來用 browser confirm()。那個對話框長得跟網站沒有關係、文字不能排版，
   而且在部分瀏覽器會被當成彈出視窗抑制掉——真的被抑制時 confirm() 直接回傳
   false，使用者按了沒反應也不知道為什麼。改成畫面內的兩段式確認。 */
function askClearAllData() { state.clearDataArmed = !state.clearDataArmed; render(); }
function renderClearDataBlock() {
  if (!state.clearDataArmed) {
    return '<button type="button" onclick="askClearAllData()" style="min-height:44px;background:none;border:1px solid rgba(217,155,95,.5);color:#d99b5f;font:400 11px \'Noto Sans TC\',sans-serif;padding:9px 20px;border-radius:18px;cursor:pointer">清除所有紀錄</button>';
  }
  var h = '<div role="alert" style="border:1px solid #d99b5f;border-radius:12px;padding:13px 15px;background:rgba(217,155,95,.08);text-align:left">';
  h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8">這個動作無法復原</div>';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);margin-top:6px;line-height:1.8">會刪除抽牌歷史、學習進度、22 天計畫、已儲存的星盤出生資料與配對對象。建議先「匯出備份」再清除。</div>';
  h += '<div style="display:flex;gap:9px;margin-top:11px;flex-wrap:wrap">';
  h += '<button type="button" onclick="clearAllData()" style="flex:1 1 auto;min-height:44px;background:rgba(217,155,95,.18);border:1px solid #d99b5f;color:#f0e9d8;font:500 12px \'Noto Sans TC\',sans-serif;border-radius:10px;cursor:pointer">確定清除全部紀錄</button>';
  h += '<button type="button" onclick="askClearAllData()" style="flex:0 0 auto;min-height:44px;background:none;border:1px solid rgba(201,169,110,.35);color:rgba(240,233,216,.75);font:400 12px \'Noto Sans TC\',sans-serif;border-radius:10px;padding:0 18px;cursor:pointer">取消</button>';
  h += '</div></div>';
  return h;
}

/* 資料只存在這台裝置的 localStorage：沒有帳號、清快取或換裝置就沒了。
   匯出／匯入是唯一的保命索，也是「確定清除」之前應該先做的事。 */
function exportAllData() {
  var payload = { format: 'mystic-deck-backup', version: 1, exportedAt: new Date().toISOString(), data: {} };
  try {
    APP_STORAGE_KEYS.forEach(function (k) {
      var v = localStorage.getItem(k);
      if (v != null) payload.data[k] = v;
    });
  } catch (e) {}
  try {
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'mystic-deck-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    state.dataNotice = '已匯出備份檔。';
  } catch (e) { state.dataNotice = '匯出失敗：' + (e && e.message ? e.message : '未知錯誤'); }
  render();
}
function importAllData(input) {
  var file = input && input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var parsed = JSON.parse(String(reader.result));
      if (!parsed || parsed.format !== 'mystic-deck-backup' || !parsed.data) {
        throw new Error('這不是本站的備份檔');
      }
      /* 只接受白名單內的 key，避免備份檔被改過之後往 localStorage 塞任意內容。 */
      var restored = 0;
      Object.keys(parsed.data).forEach(function (k) {
        if (APP_STORAGE_KEYS.indexOf(k) === -1) return;
        if (typeof parsed.data[k] !== 'string') return;
        localStorage.setItem(k, parsed.data[k]);
        restored++;
      });
      state.dataNotice = '已還原 ' + restored + ' 項資料，重新整理後生效。';
    } catch (e) {
      state.dataNotice = '匯入失敗：' + (e && e.message ? e.message : '檔案格式不正確');
    }
    render();
  };
  reader.onerror = function () { state.dataNotice = '讀取檔案失敗。'; render(); };
  reader.readAsText(file);
}

function clearAllData() {
  state.clearDataArmed = false;
  try {
    APP_STORAGE_KEYS.forEach(function (k) { localStorage.removeItem(k); });
  } catch (e) {}
  state.history = [];
  learnData = {};
  studyData = { start: null, done: {} };
  state.xiuSavedPartners = [];
  state.aiPersona = 'moon';
  state.homeTourDismissed = false;
  state.astroTourDismissed = false;
  state.astroY = ''; state.astroM = ''; state.astroD = ''; state.astroH = ''; state.astroMin = '';
  state.astroCityQuery = ''; state.astroCityIdx = null; state.astroCityUsed = null;
  state.astroUnknownTime = false; state.astroResult = null; state.astroView = 'chart';
  render();
  try { alert('已清除所有紀錄'); } catch (e) {}
}
function renderAbout() {
  var h = '<div style="text-align:center;margin-top:22px">';
  h += '<button type="button" onclick="aboutToggle()" style="min-height:44px;background:none;border:none;color:rgba(240,233,216,.62);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:8px 4px">關於本站 · 隱私與版權 About</button>';
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
    /* 資料只存在這台裝置：沒有帳號，清瀏覽器資料或換手機就沒了。
       匯出／匯入放在清除按鈕的正上方——要刪之前先看到怎麼備份。 */
    h += '<div style="margin-top:16px;border-top:1px solid rgba(201,169,110,.15);padding-top:14px">';
    h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#c9a96e">你的資料</div>';
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:5px;line-height:1.8">全部只存在這台裝置的瀏覽器裡。清除瀏覽器資料、換裝置或換瀏覽器都會消失，本站沒有伺服器可以幫你找回來。</div>';
    if (state.dataNotice) {
      h += '<div role="status" style="margin-top:9px;font:400 11px \'Noto Sans TC\',sans-serif;color:#e6cd9a;border-left:2px solid #c9a96e;padding-left:9px;line-height:1.8">' + esc(state.dataNotice) + '</div>';
    }
    h += '<div style="display:flex;gap:9px;margin-top:11px;flex-wrap:wrap">';
    h += '<button type="button" onclick="exportAllData()" style="flex:1 1 140px;min-height:44px;background:rgba(201,169,110,.12);border:1px solid rgba(201,169,110,.45);color:#f0e9d8;font:500 12px \'Noto Sans TC\',sans-serif;border-radius:10px;cursor:pointer">匯出備份檔</button>';
    h += '<label style="flex:1 1 140px;min-height:44px;display:flex;align-items:center;justify-content:center;background:none;border:1px solid rgba(201,169,110,.35);color:rgba(240,233,216,.8);font:400 12px \'Noto Sans TC\',sans-serif;border-radius:10px;cursor:pointer">從備份檔還原'
      + '<input type="file" accept="application/json,.json" onchange="importAllData(this)" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"></label>';
    h += '</div>';
    h += '<div style="text-align:center;margin-top:14px">' + renderClearDataBlock() + '</div>';
    h += '</div>';
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
  h += '<span style="color:rgba(240,233,216,.62);font:400 12px sans-serif">' + (state.tlGuideOpen ? '︿' : '﹀') + '</span>';
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
   astroDismissTour——只顯示一次，關掉後記在 localStorage，不會再跳出來。
   內容維持原本 4 則，但改成一次只顯示一則＋上一則/下一則/圓點導覽，
   降低第一次進站時的閱讀負擔（原本是一次列出 4 條文字的長方框）。 */
/* 導覽內容刻意不寫「下方」「上面」這類跟版面綁定的字，因為這張卡片在首頁和
   「更多 → 新手使用指南」兩個地方都會出現。原本的文字還跟實際按鈕對不上——
   寫「我想問一個問題」但按鈕是「我有一件事想問」，寫「快速占卜」但那顆叫
   「直接抽一張牌」——一併改成畫面上真正看得到的名稱。 */
var HOME_TOUR_ITEMS = [
  ['首頁「抽一張牌」', '不用填任何資料，直接抽一張，看看今天的提醒'],
  ['首頁「我有一件事想問」', '心裡有具體的事，一步一步帶你完成占卜'],
  ['底部「星盤」', '填出生年月日與地點，算出你的個人星盤'],
  ['底部「牌典」', '查每一張牌的完整牌義，也可以做記憶測驗'],
];
function homeDismissTour() {
  state.homeTourDismissed = true;
  try { localStorage.setItem('tl_home_tour_seen', '1'); } catch (e) {}
  render();
}
function homeShowTour() {
  state.homeTourDismissed = false;
  state.homeTourIdx = 0;
  try { localStorage.removeItem('tl_home_tour_seen'); } catch (e) {}
  render();
}
/* 原本是把 homeTourDismissed 設回 false 再 go('home')：使用者在「更多」按了一個
   選單項目，卻被丟到首頁，會以為是按錯或當掉，而不是「指南打開了」。
   改成就地在「更多」頁展開同一張導覽卡，不換頁。 */
function openBeginnerGuide() {
  state.moreTourOpen = true;
  state.homeTourIdx = 0;
  render();
}
function closeBeginnerGuide() { state.moreTourOpen = false; render(); }
function openMoreAbout() {
  state.aboutOpen = true;
  render();
  setTimeout(function () {
    var section = document.getElementById('more-about-section');
    if (section && section.scrollIntoView) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 0);
}
function homeTourGo(i) {
  var max = HOME_TOUR_ITEMS.length - 1;
  state.homeTourIdx = i < 0 ? 0 : (i > max ? max : i);
  render();
}
function renderHomeTourCard(closeFn) {
  var onClose = closeFn || 'homeDismissTour()';
  var idx = state.homeTourIdx || 0;
  if (idx > HOME_TOUR_ITEMS.length - 1) idx = HOME_TOUR_ITEMS.length - 1;
  var it = HOME_TOUR_ITEMS[idx];
  var atStart = idx === 0, atEnd = idx === HOME_TOUR_ITEMS.length - 1;
  var h = '<div style="margin-top:16px;border:1px solid rgba(201,169,110,.3);border-radius:12px;padding:14px 16px;background:rgba(201,169,110,.05)">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center">';
  h += '<div style="font:600 12px \'Noto Sans TC\',sans-serif;color:#e6cd9a">第一次來嗎？先看這裡 <span style="opacity:.5;font-weight:400">' + (idx + 1) + '/' + HOME_TOUR_ITEMS.length + '</span></div>';
  h += '<button onclick="' + onClose + '" aria-label="關閉導覽" style="background:none;border:none;color:rgba(240,233,216,.62);font:400 18px sans-serif;cursor:pointer;line-height:1;padding:0">×</button>';
  h += '</div>';
  h += '<div style="margin-top:10px;min-height:40px;font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.8);line-height:1.7"><span style="color:#c9a96e;font-weight:600">' + it[0] + '</span><br>' + it[1] + '</div>';
  h += '<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-top:12px">';
  h += '<button onclick="homeTourGo(' + (idx - 1) + ')" aria-label="上一則" ' + (atStart ? 'disabled' : '') + ' style="background:none;border:none;color:' + (atStart ? 'rgba(240,233,216,.15)' : 'rgba(240,233,216,.6)') + ';font-size:16px;line-height:1;cursor:' + (atStart ? 'default' : 'pointer') + ';padding:4px 4px">‹</button>';
  h += '<div style="display:flex;gap:6px">';
  HOME_TOUR_ITEMS.forEach(function (_, i) {
    h += '<button onclick="homeTourGo(' + i + ')" aria-label="第' + (i + 1) + '則" style="width:6px;height:6px;padding:0;border-radius:50%;border:none;cursor:pointer;background:' + (i === idx ? '#e6cd9a' : 'rgba(240,233,216,.25)') + '"></button>';
  });
  h += '</div>';
  h += '<button onclick="homeTourGo(' + (idx + 1) + ')" aria-label="下一則" ' + (atEnd ? 'disabled' : '') + ' style="background:none;border:none;color:' + (atEnd ? 'rgba(240,233,216,.15)' : 'rgba(240,233,216,.6)') + ';font-size:16px;line-height:1;cursor:' + (atEnd ? 'default' : 'pointer') + ';padding:4px 4px">›</button>';
  h += '</div>';
  h += '<div style="text-align:center;margin-top:10px"><button onclick="' + onClose + '" style="background:none;border:none;color:rgba(240,233,216,.62);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:0 0 1px">我知道了，不用再顯示</button></div>';
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


function renderHome() {
  var h = '';
  h += '<div style="padding:0 24px">';

  // 新手先依需求選入口，不必先理解塔羅、雷諾曼或星盤的差別。
  h += '<div style="text-align:center;margin:2px 0 16px"><h2 style="font:600 18px \'Noto Serif TC\',serif;color:#f0e9d8;margin:0">你現在最想獲得什麼？</h2><div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:5px">選一個最接近現在狀態的入口就好</div></div>';
  h += '<div style="display:flex;flex-direction:column;gap:10px">';
  /* 原本第一顆是「今天需要一點指引」，它只是捲到下方的今日一牌並翻開——
     使用者要的其實是「現在就抽一張」。今日一牌是系統指定的、被動的；
     直接抽牌是使用者自己的動作，參與感完全不同，而它先前卻埋在折疊的
     「其他功能」裡。這裡對調兩者的位置。 */
  h += '<button onclick="quickDraw()" style="min-height:72px;font:500 14px \'Noto Sans TC\',sans-serif;background:rgba(201,169,110,.10);border:1px solid rgba(201,169,110,.4);color:#f0e9d8;padding:14px 17px;border-radius:14px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:13px">'
    + '<span aria-hidden="true" style="flex:none;width:34px;height:52px;border-radius:5px;border:1px solid #c9a96e;background:linear-gradient(160deg,#241f2e,#1a1622);display:flex;align-items:center;justify-content:center">' + sigil(22, 22) + '</span>'
    + '<span><span style="display:block;color:#e6cd9a;font:600 15px \'Noto Serif TC\',serif">抽一張牌</span>'
    + '<span style="display:block;font-size:11px;opacity:.6;margin-top:4px">不用準備問題，現在就抽，看看今天的提醒</span></span></button>';
  h += '<button onclick="startQuestionFlow()" style="min-height:72px;font:600 16px \'Noto Serif TC\',serif;background:linear-gradient(120deg,#c9a96e,#e6cd9a);color:#1a1622;border:none;padding:16px 18px;border-radius:14px;cursor:pointer;text-align:left"><div>我有一件事想問 →</div><div style="font:400 11px \'Noto Sans TC\',sans-serif;opacity:.65;margin-top:4px">依照你的問題，一步一步完成占卜</div></button>';
  h += '<button onclick="go(\'astro\')" style="min-height:68px;font:500 14px \'Noto Sans TC\',sans-serif;background:rgba(124,92,255,.06);border:1px solid rgba(201,169,110,.28);color:#f0e9d8;padding:14px 17px;border-radius:14px;cursor:pointer;text-align:left"><div style="color:#e6cd9a;font:600 15px \'Noto Serif TC\',serif">我想更了解自己</div><div style="font-size:11px;opacity:.55;margin-top:4px">用出生資料建立個人星盤，了解性格與人生主題</div></button>';
  h += '</div>';

  /* 新手導覽卡：導覽列「更多 → 新手使用指南」(openBeginnerGuide) 與 homeShowTour()
     都是把 homeTourDismissed 設回 false 再回首頁，所以首頁一定要有這段渲染，
     否則那顆按鈕點下去畫面完全沒有變化，看起來就像壞掉的按鈕。 */
  if (!state.homeTourDismissed) {
    h += renderHomeTourCard();
  } else {
    h += '<div style="text-align:center;margin-top:12px"><button type="button" onclick="homeShowTour()" style="min-height:36px;background:none;border:none;color:rgba(240,233,216,.62);font:400 10px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:0 0 1px">新手導覽 · 再看一次</button></div>';
  }

  /* 今日一牌已從首頁移除。它是系統依日期指定的、被動的一張牌；使用者真正想要的
     是「現在就抽一張」——那是自己的動作，參與感完全不同，而且抽完就是一次完整
     的占卜流程，可以存進紀錄、可以回填後來發生的事。相關的牌義查詢仍在牌典，
     單張抽牌入口在上方主按鈕。 */

  // ---- everything else, collapsed by default ----
  h += '<div style="margin-top:32px;border-top:1px solid rgba(201,169,110,.15);padding-top:16px">';
  h += '<div role="button" tabindex="0" aria-expanded="' + state.homeMoreOpen + '" onclick="toggleHomeMore()" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();toggleHomeMore()}" style="min-height:44px;display:flex;justify-content:space-between;align-items:center;cursor:pointer">';
  h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.08em;color:rgba(240,233,216,.5)">其他功能</div>';
  h += '<span style="color:#c9a96e;font-size:12px">' + (state.homeMoreOpen ? '︿ 收合' : '﹀ 展開') + '</span>';
  h += '</div>';
  if (state.homeMoreOpen) {
    /* 塔羅百科／星盤已經各自是底部導覽列的獨立分頁，這裡不再重複列出同一個
       目的地，避免使用者以為底部「更多」跟這裡是兩份不一樣的清單 */
    h += '<div style="display:flex;flex-direction:column;gap:10px;margin-top:14px">';
    h += '<button onclick="go(\'history\')" style="font:500 14px \'Noto Sans TC\',sans-serif;background:rgba(255,255,255,.02);color:#f0e9d8;border:1px solid rgba(201,169,110,.3);padding:13px 16px;border-radius:10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center"><span>查看占卜紀錄</span><span>›</span></button>';
    h += '</div>';
    h += renderStudyWidget();
    h += '<div style="text-align:center;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:18px;line-height:1.8;padding:0 10px">不用先懂牌義也可以開始，解讀會逐張說明。<br>抽完想深入了解某一張，每張牌下面都有「在牌典查看這張牌」。</div>';
    h += renderAbout();
  }
  h += '</div>';

  h += '</div>';
  return h;
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
  var h = '<div style="font:600 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:16px">你想用哪種方式解讀？</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">';
  h += '<button type="button" aria-pressed="' + cardsActive + '" onclick="wizSetReadingMode(\'cards\')" style="min-height:58px;text-align:left;background:' + (cardsActive ? 'rgba(201,169,110,.18)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (cardsActive ? '#c9a96e' : 'rgba(201,169,110,.3)') + ';color:' + (cardsActive ? '#f0e9d8' : 'rgba(240,233,216,.7)') + ';padding:10px 13px;border-radius:10px;cursor:pointer"><span style="font:500 12px \'Noto Sans TC\',sans-serif">' + (cardsActive ? '✓ ' : '') + '只用這次抽到的牌</span><span style="display:block;font:400 10.5px \'Noto Sans TC\',sans-serif;opacity:.55;margin-top:4px">分析現在這件事的狀態、發展與可採取的做法</span></button>';
  if (hasAstro) {
    h += '<button type="button" aria-pressed="' + combinedActive + '" onclick="wizSetReadingMode(\'combined\')" style="min-height:58px;text-align:left;background:' + (combinedActive ? 'rgba(201,169,110,.18)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (combinedActive ? '#c9a96e' : 'rgba(201,169,110,.3)') + ';color:' + (combinedActive ? '#f0e9d8' : 'rgba(240,233,216,.7)') + ';padding:10px 13px;border-radius:10px;cursor:pointer"><span style="font:500 12px \'Noto Sans TC\',sans-serif">' + (combinedActive ? '✓ ' : '') + '抽牌＋我的個人星盤</span><span style="display:block;font:400 10.5px \'Noto Sans TC\',sans-serif;opacity:.55;margin-top:4px">除了現在的牌面，再補充你長期的個性與行動模式</span></button>';
  } else {
    h += '<div style="border:1px dashed rgba(201,169,110,.25);border-radius:10px;padding:10px 13px;color:rgba(240,233,216,.62)"><div style="font:500 12px \'Noto Sans TC\',sans-serif">抽牌＋我的個人星盤</div><div style="font:400 10.5px \'Noto Sans TC\',sans-serif;line-height:1.6;margin-top:4px">建立一次星盤後即可使用；完成後會自動回到這一頁。</div><button type="button" onclick="readingBuildAstro()" style="min-height:40px;margin-top:6px;background:none;border:none;color:#c9a96e;font:500 11px \'Noto Sans TC\',sans-serif;cursor:pointer;padding:4px 0">建立我的星盤 →</button></div>';
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
/* 決策類沒有舊的 SUBTOPICS。它的主問題直接來自 taxonomy——state.subtopic 會存
   taxonomy id，而該分類本來就沒有接上 cardSubtopicReading()，不影響既有解讀。 */
function renderTaxonomyPrimaryPicker(catKey) {
  var prs = taxonomyPrimaries(catKey);
  if (!prs.length) return '';
  var h = '<div style="font:600 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:16px">這次你最想問什麼？</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:9px">';
  prs.forEach(function (p) {
    var on = state.subtopic === p.id;
    h += '<button type="button" aria-pressed="' + on + '" onclick="wizSetSubtopic(\'' + esc(p.id) + '\')" style="min-height:44px;text-align:left;font:400 13px \'Noto Sans TC\',sans-serif;background:' + (on ? 'rgba(201,169,110,.22)' : 'rgba(255,255,255,.03)') + ';border:1px solid ' + (on ? '#e6cd9a' : 'rgba(201,169,110,.28)') + ';color:' + (on ? '#f0e9d8' : 'rgba(240,233,216,.85)') + ';padding:11px 14px;border-radius:12px;cursor:pointer;white-space:normal;line-height:1.5">' + (on ? '✓ ' : '') + esc(p.label) + '</button>';
  });
  return h + '</div>';
}

/* 主問題（＋解讀來源）。原本住在第三步，也就是使用者選完牌陣之後——先挑工具、
   再說要做什麼，順序是反的，而且牌陣推薦因此只能看分類。移到第二步之後，
   換一個主問題，下面的牌陣清單會當場跟著換，因果在同一屏看得到。 */
function renderPrimaryQuestionBlock() {
  var h = '';
  if (['love', 'career', 'family', 'wealth', 'health', 'social', 'study', 'general'].indexOf(state.category) !== -1) {
    h += renderModePicker();
    h += renderSubtopicPicker();
  } else if (!SUBTOPICS[state.category] && taxonomyHasCategory(state.category)) {
    /* 決策類：沒有舊題庫，主問題直接來自 taxonomy。 */
    h += renderTaxonomyPrimaryPicker(state.category);
  } else if (SUBTOPICS[state.category]) {
    /* 其他有 SUBTOPICS 定義但尚未做星盤引擎的分類：只顯示子問題選擇器，
       沒有模式切換 UI，renderSubtopicPicker() 依 state.readingMode（此時恆為 'cards'）
       過濾，astro-only 的子問題自然不會出現。 */
    h += renderSubtopicPicker();
  }
  return h;
}

/* 牌陣推薦。taxonomy 的 44 個 primary 每一個都寫好了 spreads，但第二步一直只讀
   RECOMMENDATIONS[category]——所以「未來可能會遇到什麼類型的人」跟「怎麼經營
   目前這段關係」拿到一模一樣的清單，而第一步明講「系統會依照內容推薦合適的牌陣」。
   有主問題就用主問題的，沒有才退回分類清單；雷諾曼維持自己的對照表，因為
   taxonomy 的 spreads 是照塔羅牌陣命名的。 */
function wizSpreadRecommendations() {
  var all = currentSpreads();
  var recSrc = state.deck === 'lenormand' ? LEN_RECOMMENDATIONS : RECOMMENDATIONS;
  var byCat = ((recSrc && recSrc[state.category]) || []).filter(function (k) { return !!all[k]; });

  var byPrimary = [];
  if (state.deck !== 'lenormand' && state.subtopic && typeof taxonomyPrimaryForSubtopic === 'function') {
    var primary = taxonomyPrimaryForSubtopic(state.category, state.subtopic);
    if (primary && typeof taxonomyRecommendedSpreads === 'function') {
      byPrimary = taxonomyRecommendedSpreads(state.category, primary.id)
        .filter(function (k) { return !!all[k]; });
    }
  }
  /* 「更貼近這題」不等於「其餘都不能用」。第一版只回傳主問題的清單，結果
     單身桃花、暗戀、三張牌・解析、時間軸這些牌陣在某些分類整個從畫面上消失了——
     推薦變成了篩選。現在分兩組：主問題那組排在前面，這個領域其他常用的排後面，
     一個都不會被拿掉。 */
  var rest = byCat.filter(function (k) { return byPrimary.indexOf(k) === -1; });
  if (!byPrimary.length && !rest.length) return { top: [], rest: Object.keys(all), source: 'all' };
  if (!byPrimary.length) return { top: rest, rest: [], source: 'category' };
  return { top: byPrimary, rest: rest, source: 'primary' };
}
function renderSubtopicPicker() {
  var preset = getSpreadQuestionPreset();
  var allowed = preset.subtopics || [];
  var options = (SUBTOPICS[state.category] || []).filter(function (s) {
    return s.modes.indexOf(state.readingMode) !== -1 && (!allowed.length || allowed.indexOf(s.key) !== -1);
  });
  if (!options.length) return '';
  /* 所有選項收進單一選單，避免和自由輸入、範例問題同時鋪成數十顆按鈕。
     這一項仍直接驅動站內深度解讀，只是降低畫面的選擇負擔。 */
  var h = '<label for="subtopic-select" style="display:block;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.55);margin-top:16px">你最想知道什麼？（選填）</label>';
  h += '<select id="subtopic-select" onchange="wizSetSubtopic(this.value)" style="width:100%;box-sizing:border-box;margin-top:7px;background:#1a1622;border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:11px 12px;font:400 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
  h += '<option value="">先不選，直接描述問題</option>';
  options.forEach(function (s) {
    var active = state.subtopic === s.key;
    h += '<option value="' + esc(s.key) + '"' + (active ? ' selected' : '') + '>' + esc(s.zh) + '</option>';
  });
  h += '</select>';
  return h;
}

function getSpreadQuestionPreset() {
  var categoryPresets = SPREAD_QUESTION_PRESETS[state.category] || {};
  return categoryPresets[state.spread] || DECISION_QUESTION_PRESETS[state.spread] || categoryPresets.default || {};
}
function getSpreadQuestionExamples() {
  var concreteByCategory = CONCRETE_QUESTION_EXAMPLES[state.category] || {};
  var concrete = concreteByCategory[state.spread] || concreteByCategory.default;
  if (concrete && concrete.length) return concrete;
  var preset = getSpreadQuestionPreset();
  if (preset.examples && preset.examples.length) return preset.examples;
  var focusCfg = topicQuestionConfig[state.category];
  return focusCfg ? focusCfg.examples : (QUESTION_TEMPLATES[state.category] || QUESTION_TEMPLATES.general).chips;
}

/* ================= Step 3「想深入了解的面向」（可複選，最多 3 項）=================
   資料來源：js/data/reading-data.js 的 topicQuestionConfig，八個分類各自獨立，
   不在 DOM 裡為每個分類寫死重複區塊。

   原本收合時是「跨分組輪流取湊滿 7 項、而且不顯示分組標題」，結果使用者看到的是
   一排沒有脈絡的選項：感情分類會把「對方目前對我的真實感受」（交往中）、「對方只是
   友善還是有好感」（曖昧）、「復合的可能性與條件」（已分手）混在一起，等於要在四種
   完全不同的感情狀態之間自己分辨，選擇負擔反而更重。

   改成收合時也保留分組結構、每組只露前兩項：畫面上是 4 個標題各帶 2 個選項，
   使用者只要看自己現在符合的那一組，實際要考慮的其實只有兩三項。
   要看完整清單再點「顯示更多選項」。

   如果使用者選到的項目剛好落在「更多」裡（例如展開後選了、又收起面板），
   會自動保持展開，避免已選項目被面板收合藏起來、卻沒有任何畫面線索。 */
var FOCUS_PREVIEW_PER_GROUP = 2;
/* 依「目前選到的牌陣」與「已選的具體子問題」濾掉答不了的面向分組。
   兩份對應表都在 reading-data.js：SPREAD_FOCUS_GROUPS 與 SUBTOPIC_FOCUS_GROUPS。

   子問題比牌陣更能說明使用者的處境（選了「未來可能遇到什麼類型的人」就代表單身），
   所以兩者都有設定時取交集；交集為空時以子問題為準。
   萬一設定寫錯導致一組都不剩，退回顯示全部——寧可多列，也不要讓畫面空掉。 */
function focusGroupsForSpread(catKey, cfg) {
  var bySpread = (typeof SPREAD_FOCUS_GROUPS !== 'undefined' && SPREAD_FOCUS_GROUPS[catKey])
    ? SPREAD_FOCUS_GROUPS[catKey][state.spread] : null;
  var bySubtopic = (state.subtopic && typeof SUBTOPIC_FOCUS_GROUPS !== 'undefined' && SUBTOPIC_FOCUS_GROUPS[catKey])
    ? SUBTOPIC_FOCUS_GROUPS[catKey][state.subtopic] : null;
  var allowed = null;
  if (bySpread && bySubtopic) {
    allowed = bySubtopic.filter(function (k) { return bySpread.indexOf(k) !== -1; });
    if (!allowed.length) allowed = bySubtopic;
  } else {
    allowed = bySubtopic || bySpread;
  }
  if (!allowed || !allowed.length) return cfg.focusGroups;
  var kept = cfg.focusGroups.filter(function (g) { return allowed.indexOf(g.key) !== -1; });
  return kept.length ? kept : cfg.focusGroups;
}
function computeDefaultFocusGroups(cfg, groups) {
  return (groups || cfg.focusGroups).map(function (g) {
    return { title: g.title, options: g.options.slice(0, FOCUS_PREVIEW_PER_GROUP) };
  });
}
function computeDefaultFocusOptions(cfg, groups) {
  var flat = [];
  computeDefaultFocusGroups(cfg, groups).forEach(function (g) { flat = flat.concat(g.options); });
  return flat;
}
/* 換牌陣時，把已經選了、但新牌陣不適用的面向清掉——留著只會在確認頁與
   AI 提示詞裡出現這個牌陣根本回答不了的項目。 */
function pruneFocusSelection(catKey) {
  var cfg = topicQuestionConfig[catKey];
  var sel = state.wizFocusSel[catKey];
  if (!cfg || !sel || !sel.length) return;
  var usable = {};
  focusGroupsForSpread(catKey, cfg).forEach(function (g) {
    g.options.forEach(function (o) { usable[o] = 1; });
  });
  state.wizFocusSel[catKey] = sel.filter(function (o) { return usable[o]; });
}
function wizToggleFocus(catKey, opt) {
  var sel = state.wizFocusSel[catKey] || (state.wizFocusSel[catKey] = []);
  var idx = sel.indexOf(opt);
  if (idx !== -1) {
    sel.splice(idx, 1);
    state.wizFocusLimitHit = '';
  } else if (sel.length >= 3) {
    state.wizFocusLimitHit = catKey;
  } else {
    sel.push(opt);
    state.wizFocusLimitHit = '';
  }
  render();
}
function wizToggleFocusPanel() { state.wizFocusOpen = !state.wizFocusOpen; render(); }
function wizToggleContextPanel() { state.wizContextOpen = !state.wizContextOpen; render(); }
function wizFocusCount() { return ((state.wizFocusSel && state.wizFocusSel[state.category]) || []).length; }
function wizToggleFocusExpand(catKey) {
  state.wizFocusExpanded[catKey] = !state.wizFocusExpanded[catKey];
  render();
}
/* 哪些面向分組屬於「看完解讀之後才適合探索」，而不是回答眼前這個問題所必需。
   典型是自我成長類：抽的是「未來可能遇到什麼類型的人」，卻先要你選「我在感情中的
   慣性模式」——那是很好的題目，只是時機不對。這些題目不刪除，改成結果頁的延伸探索。 */
var FOCUS_FOLLOWUP_GROUPS = {
  love: ['self'],
  career: ['growth', 'self'],
  family: ['self'],
  wealth: ['self'],
  health: ['self'],
  social: ['self'],
  study: ['self'],
  general: ['self'],
};
function focusGroupIsFollowUp(catKey, groupKey) {
  return (FOCUS_FOLLOWUP_GROUPS[catKey] || []).indexOf(groupKey) !== -1;
}
/* 解讀前只顯示能直接幫助回答目前問題的分組。 */
function focusGroupsForNow(catKey, cfg) {
  var groups = focusGroupsForSpread(catKey, cfg);
  var kept = groups.filter(function (g) { return !focusGroupIsFollowUp(catKey, g.key); });
  return kept.length ? kept : groups;
}
/* 結果頁的延伸探索題庫：被移出解讀前流程的分組，加上這次沒被選到的其他面向。 */
function focusFollowUpOptions(catKey) {
  var cfg = topicQuestionConfig[catKey];
  if (!cfg) return [];
  var sel = (state.wizFocusSel && state.wizFocusSel[catKey]) || [];
  var out = [];
  (cfg.focusGroups || []).forEach(function (g) {
    if (!focusGroupIsFollowUp(catKey, g.key)) return;
    g.options.forEach(function (o) { if (out.indexOf(o) === -1) out.push(o); });
  });
  focusGroupsForSpread(catKey, cfg).forEach(function (g) {
    g.options.forEach(function (o) {
      if (sel.indexOf(o) === -1 && out.indexOf(o) === -1) out.push(o);
    });
  });
  return out;
}

/* 結果頁的延伸探索。原本被移出解讀前流程的自我成長類題目在這裡回來——
   看完這次的解讀，才是探索「我在感情中的慣性模式」比較有意義的時機。
   點下去會用同一個分類重新開始一次占卜，並把該題目預先填進自由輸入。
   刻意講明「需要重新抽一次牌」——不能讓使用者以為新問題自動適用剛才那幾張牌。 */
/* ============================================================================
   解讀結果頁的延伸區塊

   原本這裡是一排大卡片，右側只有「›」，點一下就直接清空牌面、跳回問題設定。
   從 affordance 看它完全像「展開看內容」，實際卻是離開目前解讀並要求重新抽牌——
   誤觸成本高到只是想看看題目的人會突然掉進新的占卜流程。

   現在只留「想換一個問題繼續」：是新問題、需要重新抽牌，所以必須先選題再明確
   確認。至於「想再看懂這次的牌」，答案本來就在同一頁的上方。
   ========================================================================== */

/* A 類（想再看懂這次的牌）已移除。結果頁上方本來就有「直接回答」、
   「牌與牌怎麼互相影響」、「下一步可以做什麼」、每張牌的牌位解讀與
   「整副牌的走向」；A 區把同樣的函式輸出再展開一次，同一頁出現兩份一模一樣
   的長段落。要看懂這次的牌，答案已經在上面了。 */

/* B 類：語意去重。本次的主問題與已選面向都算「已經回答過」，
   不能再推薦同一件事——用語意 key 比對，不只比字串。 */
function readingAnsweredSemanticKeys() {
  var keys = {};
  var tax = (typeof taxonomyActiveFor === 'function') ? taxonomyActiveFor(state.category, state.subtopic) : null;
  if (tax) keys[tax.intent] = true;
  ((state.wizFocusSel && state.wizFocusSel[state.category]) || []).forEach(function (label) {
    var fid = (typeof taxonomyFocusIdByLabel === 'function') ? taxonomyFocusIdByLabel(label) : null;
    var area = fid && typeof FOCUS_AREA_REGISTRY !== 'undefined' ? FOCUS_AREA_REGISTRY[fid] : null;
    if (area && area.semanticFocus) keys[area.semanticFocus] = true;
    keys['label:' + label] = true;
  });
  return keys;
}
function readingNewQuestions() {
  var answered = readingAnsweredSemanticKeys();
  var out = [];
  focusFollowUpOptions(state.category).forEach(function (label) {
    var fid = (typeof taxonomyFocusIdByLabel === 'function') ? taxonomyFocusIdByLabel(label) : null;
    var area = (fid && typeof FOCUS_AREA_REGISTRY !== 'undefined') ? FOCUS_AREA_REGISTRY[fid] : null;
    var sem = area ? area.semanticFocus : ('label:' + label);
    if (answered[sem] || answered['label:' + label]) return;
    out.push({ id: fid || ('q' + out.length), label: label, semanticIntent: sem, requiresNewDraw: true });
  });
  return out;
}
function selectFollowUpQuestion(id) {
  state.followUpSelected = (state.followUpSelected === id) ? '' : id;
  render();
}
function toggleOverallReading() { state.overallOpen = !state.overallOpen; render(); }
function toggleFollowUpMore() { state.followUpMoreOpen = !state.followUpMoreOpen; render(); }

/* 確認之後才真的開始新的一輪。目前這份解讀會先被完整快照起來，
   使用者在新占卜完成之前都能原樣回到它——不是靠瀏覽器上一頁。 */
function confirmFollowUpQuestion(id) {
  var q = readingNewQuestions().filter(function (x) { return x.id === id; })[0];
  if (!q) return;
  state.previousReading = {
    category: state.category, deck: state.deck, spread: state.spread,
    subtopic: state.subtopic, question: state.question, target: state.target,
    readingMode: state.readingMode, timeframe: state.timeframe,
    drawn: state.drawn, picked: state.picked, phase: state.phase,
    wizFocusSel: JSON.parse(JSON.stringify(state.wizFocusSel || {})),
    fromQuestionLabel: q.label,
  };
  /* 只帶入必要的上下文：分類沿用，問題預填。舊的牌不會跟過去，
     也不會自動選好面向——新問題必須自己抽牌，舊牌不能當成它的證據。 */
  state.question = q.label;
  state.wizContextOpen = true;
  state.wizFocusOpen = false;
  state.wizFocusSel[state.category] = [];
  state.subtopic = '';
  state.drawn = [];
  state.picked = [];
  state.phase = 'setup';
  state.wizardStep = 3;
  state.followUpSelected = '';
  render();
  window.scrollTo(0, 0);
}
function returnToPreviousReading() {
  var prev = state.previousReading;
  if (!prev) return;
  state.category = prev.category; state.deck = prev.deck; state.spread = prev.spread;
  state.subtopic = prev.subtopic; state.question = prev.question; state.target = prev.target;
  state.readingMode = prev.readingMode; state.timeframe = prev.timeframe;
  state.drawn = prev.drawn; state.picked = prev.picked; state.phase = prev.phase;
  state.wizFocusSel = prev.wizFocusSel;
  state.previousReading = null;
  state.followUpSelected = '';
  render();
  window.scrollTo(0, 0);
}
/* 新占卜還沒抽完之前，隨時可以原樣回到上一個解讀。 */
function renderReturnToPreviousBar() {
  if (!state.previousReading || state.phase === 'result') return '';
  return '<button type="button" onclick="returnToPreviousReading()" style="width:100%;min-height:44px;margin-bottom:12px;background:rgba(201,169,110,.08);border:1px solid rgba(201,169,110,.35);color:#c9a96e;border-radius:12px;padding:11px 14px;font:500 12px \'Noto Sans TC\',sans-serif;cursor:pointer;text-align:left">'
    + '← 回到上一個解讀<span style="display:block;font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:3px">剛才那次的牌與解讀都還在，隨時可以回去看</span></button>';
}

var FOLLOWUP_PREVIEW = 3;
function renderReadingFollowUp() {
  var news = readingNewQuestions();
  if (!news.length) return '';
  var h = '';

  /* ---- B 區：新問題，必須選題再確認 ---- */
  {
    var shown = state.followUpMoreOpen ? news : news.slice(0, FOLLOWUP_PREVIEW);
    h += '<section style="margin-top:22px;border-top:1px solid rgba(201,169,110,.2);padding-top:16px">';
    h += '<h3 class="md-h3" style="font-size:14px">想換一個問題繼續？</h3>';
    h += '<p class="md-note" style="margin:4px 0 0">下面都是新的問題，需要重新抽牌。</p>';
    h += '<p class="md-note" style="margin:2px 0 0;color:rgba(240,233,216,.62)">目前這次的解讀會保留，不會被覆蓋。</p>';
    h += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:11px">';
    shown.forEach(function (q) {
      var open = state.followUpSelected === q.id;
      h += '<div style="border:1px solid ' + (open ? '#e6cd9a' : 'rgba(201,169,110,.25)') + ';border-radius:12px;background:' + (open ? 'rgba(201,169,110,.08)' : 'rgba(255,255,255,.02)') + ';overflow:hidden">';
      /* 第一次點擊只選取，不離開這一頁。 */
      h += '<button type="button" aria-expanded="' + open + '" onclick="selectFollowUpQuestion(\'' + esc(q.id) + '\')" style="width:100%;min-height:52px;background:none;border:none;padding:11px 13px;cursor:pointer;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:10px">'
        + '<span><span style="display:block;font:400 12.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.88);line-height:1.5">' + esc(q.label) + '</span>'
        + '<span style="display:block;font:400 10.5px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:3px">新問題・需要重新抽牌</span></span>'
        + '<span aria-hidden="true" style="flex:none;color:#c9a96e;font:500 11px \'Noto Sans TC\',sans-serif;white-space:nowrap">' + (open ? '收起' : '選擇') + '</span></button>';
      if (open) {
        h += '<div style="padding:0 13px 13px">';
        h += '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.8;border-top:1px solid rgba(201,169,110,.15);padding-top:10px">這是一個新的問題，需要重新抽牌。剛才那幾張牌仍然只回答上一個問題。</div>';
        h += '<div style="display:flex;gap:9px;margin-top:11px;flex-wrap:wrap">';
        h += '<button type="button" onclick="confirmFollowUpQuestion(\'' + esc(q.id) + '\')" style="flex:1 1 auto;min-height:44px;background:linear-gradient(120deg,#c9a96e,#e6cd9a);color:#1a1622;border:none;border-radius:22px;padding:11px 18px;font:600 12.5px \'Noto Sans TC\',sans-serif;cursor:pointer">用這題開始新占卜</button>';
        h += '<button type="button" onclick="selectFollowUpQuestion(\'' + esc(q.id) + '\')" style="flex:0 0 auto;min-height:44px;background:none;border:1px solid rgba(201,169,110,.35);color:rgba(240,233,216,.75);border-radius:22px;padding:11px 20px;font:400 12px \'Noto Sans TC\',sans-serif;cursor:pointer">取消</button>';
        h += '</div></div>';
      }
      h += '</div>';
    });
    h += '</div>';
    if (news.length > FOLLOWUP_PREVIEW) {
      h += '<button type="button" aria-expanded="' + (!!state.followUpMoreOpen) + '" onclick="toggleFollowUpMore()" style="width:100%;min-height:44px;margin-top:9px;background:none;border:none;color:#c9a96e;font:400 11.5px \'Noto Sans TC\',sans-serif;cursor:pointer">'
        + (state.followUpMoreOpen ? '收起其他方向 ▴' : '查看更多方向 ↓（還有 ' + (news.length - FOLLOWUP_PREVIEW) + ' 個）') + '</button>';
    }
    h += '</section>';
  }
  return h;
}

var FOCUS_PREVIEW_COUNT = 5;
/* 面向清單的來源。已遷移到 taxonomy 的分類（見 QUESTION_TAXONOMY）改由目前選定的
   主問題決定——這是修掉「前面選的問題沒有作用」的地方；尚未遷移的分類沿用舊的
   分組篩選，行為完全不變。 */
function focusOptionsForCurrent(catKey, cfg) {
  var taxPrimary = taxonomyActiveFor(catKey, state.subtopic);
  if (taxPrimary) {
    return {
      source: 'taxonomy',
      primary: taxPrimary,
      options: taxonomyAllowedFocusIds(catKey, taxPrimary.id).map(taxonomyFocusLabel),
    };
  }
  /* 已遷移的分類但還沒選主問題：把目前牌陣帶的前提也算進去。選了暗戀牌陣就
     等於說了「有一個特定對象」，那些面向本來就該出現。牌陣沒有前提時，
     結果與過去相同——只給不需要任何前提的面向。 */
  if (taxonomyHasCategory(catKey)) {
    var spreadAssumptions = (typeof taxonomySpreadAssumptions === 'function')
      ? taxonomySpreadAssumptions(state.spread) : {};
    return {
      source: Object.keys(spreadAssumptions).length ? 'spread' : 'neutral',
      primary: null,
      spreadAssumptions: spreadAssumptions,
      options: taxonomyNeutralFocusIds(catKey, spreadAssumptions).map(taxonomyFocusLabel),
    };
  }
  if (!cfg) return { source: 'none', primary: null, options: [] };
  var groups = focusGroupsForNow(catKey, cfg);
  var flat = [];
  groups.forEach(function (g) { g.options.forEach(function (o) { if (flat.indexOf(o) === -1) flat.push(o); }); });
  return { source: 'legacy', primary: null, options: flat };
}
/* placeholder 與範例都由 category + primary + 已選面向決定，不再是整類共用一句。 */
function wizPlaceholder() {
  var tax = taxonomyActiveFor(state.category, state.subtopic);
  if (tax) return taxonomyPlaceholder(state.category, tax.id);
  var cfg = topicQuestionConfig[state.category];
  return (cfg && cfg.placeholder) || '例如：最近的狀況讓我有點不確定，想先看看方向。';
}
function wizExamples() {
  var tax = taxonomyActiveFor(state.category, state.subtopic);
  if (tax) {
    var sel = (state.wizFocusSel[state.category] || [])
      .map(taxonomyFocusIdByLabel).filter(Boolean);
    return taxonomyExamples(state.category, tax.id, sel);
  }
  return getSpreadQuestionExamples().slice(0, 3);
}

function renderFocusAreaPicker() {
  var catKey = state.category;
  var cfg = topicQuestionConfig[catKey];
  /* 決策類沒有舊的 topicQuestionConfig，但已經有 taxonomy——不能因此整區消失。 */
  if (!cfg && !taxonomyHasCategory(catKey)) return '';
  var sel = state.wizFocusSel[catKey] || [];
  var src = focusOptionsForCurrent(catKey, cfg);
  var flat = src.options;
  var hasHiddenSelection = sel.some(function (o) { return flat.slice(0, FOCUS_PREVIEW_COUNT).indexOf(o) === -1; });
  var expanded = !!state.wizFocusExpanded[catKey] || hasHiddenSelection;
  var shown = expanded ? flat : flat.slice(0, FOCUS_PREVIEW_COUNT);

  function optBtn(opt) {
    var active = sel.indexOf(opt) !== -1;
    var full = sel.length >= 3 && !active;
    return '<button type="button" aria-pressed="' + active + '" onclick="wizToggleFocus(\'' + catKey + '\',&quot;' + esc(opt) + '&quot;)"'
      + ' style="min-height:44px;text-align:left;font:400 12px \'Noto Sans TC\',sans-serif;'
      + 'background:' + (active ? 'rgba(201,169,110,.22)' : 'rgba(255,255,255,.03)') + ';'
      + 'border:1px solid ' + (active ? '#e6cd9a' : 'rgba(201,169,110,.28)') + ';'
      + 'color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,' + (full ? '.72' : '.85') + ')') + ';'
      + 'padding:9px 13px;border-radius:12px;cursor:pointer;white-space:normal;line-height:1.5">'
      + (active ? '✓ ' : '') + esc(opt) + '</button>';
  }

  var h = '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">';
  h += '<span style="font:500 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8">想特別看哪些部分？</span>';
  h += '<span style="font:400 11px \'Noto Sans TC\',sans-serif;color:' + (sel.length ? '#e6cd9a' : 'rgba(240,233,216,.62)') + '">選填・已選 ' + sel.length + ' / 3</span>';
  h += '</div>';
  /* 顯示真正的上下游連動。這不是裝飾——下面的清單確實是依這個主問題重新算出來的。 */
  if (src.primary) {
    /* 顯示使用者實際點到的那一句，不是 taxonomy 內部的 label——
       兩者不一定同字，寫成內部名稱會變成「你選了 A，已依你選的 B 整理」。 */
    var pickedDef = (SUBTOPICS[catKey] || []).filter(function (x) { return x.key === state.subtopic; })[0];
    var pickedLabel = pickedDef ? pickedDef.zh : src.primary.label;
    h += '<div style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:5px;line-height:1.6;border-left:2px solid rgba(201,169,110,.4);padding-left:8px">已依你選的「' + esc(pickedLabel) + '」整理相關面向。</div>';
  } else if (src.source === 'spread') {
    var spName = (currentSpreads()[state.spread] || {}).zh || '這個牌陣';
    h += '<div style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:5px;line-height:1.6;border-left:2px solid rgba(201,169,110,.4);padding-left:8px">已依「'
      + esc(spName) + '」的前提整理。選了上面的主問題會再更精準。</div>';
  } else if (src.source === 'neutral') {
    h += '<div style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:5px;line-height:1.6;border-left:2px solid rgba(201,169,110,.25);padding-left:8px">還沒選主問題，這裡先只列出任何狀況都適用的面向。選了上面的問題之後，會換成真正相關的那幾個。</div>';
  }
  h += '<div style="display:flex;flex-direction:column;gap:7px;margin-top:9px">';
  shown.forEach(function (opt) { h += optBtn(opt); });
  h += '</div>';

  if (flat.length > shown.length || expanded) {
    h += '<button type="button" aria-expanded="' + expanded + '" onclick="wizToggleFocusExpand(\'' + catKey + '\')" style="min-height:44px;width:100%;margin-top:8px;background:none;border:none;color:#c9a96e;font:400 11.5px \'Noto Sans TC\',sans-serif;cursor:pointer">'
      + (expanded ? '收起其他面向 ▴' : '更多面向 ↓（還有 ' + (flat.length - shown.length) + ' 個）') + '</button>';
  }
  if (state.wizFocusLimitHit === catKey) {
    h += '<div role="status" style="font:400 11px \'Noto Sans TC\',sans-serif;color:#d67878;margin-top:6px">最多選 3 個，再點一次已選的可以取消</div>';
  }
  return h;
}

function renderWizard(spreads, isTarot) {
  var h = wizProgress();
  h += '<div style="font:500 10px \'Noto Sans TC\',sans-serif;letter-spacing:.18em;color:#c9a96e;margin-top:20px">STEP ' + state.wizardStep + ' / 4</div>';

  if (state.wizardStep === 1) {
    h += '<div style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:8px">你想詢問哪一方面？</div>';
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:5px;line-height:1.6">先選問題類型即可，系統會依照內容推薦合適的牌陣。</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px">';
    CATEGORIES.forEach(function (cat) {
      var active = cat.key === state.category;
      h += '<button onclick="wizSetCat(\'' + cat.key + '\')" style="text-align:left;background:' + (active ? 'rgba(201,169,110,.15)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (active ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';border-radius:10px;padding:11px 13px;cursor:pointer">';
      h += '<div style="font:500 13px \'Noto Sans TC\',sans-serif;color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.75)') + '">' + cat.icon + ' ' + cat.zh + '</div>';
      h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:3px;line-height:1.5">' + cat.desc + '</div>';
      h += '</button>';
    });
    h += '</div>';
    if (!state.category) {
      h += '<div role="status" style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:8px;text-align:right">請先選擇一個想詢問的面向，才能繼續下一步</div>';
    }
    /* 這裡原本是原生 <details>，收合狀態只存在 DOM 裡。render() 會整段重畫
       innerHTML，所以裡面任何會觸發 render() 的控制項（換牌組、展開說明）
       一按下去，<details> 就被重建成關閉狀態——畫面看起來像跳回上一頁，
       要再點一次才看得到結果。牌組選擇本來也藏在那個 11px 的灰字摘要裡。

       改成常駐顯示：只有兩個選項，值得直接看到；說明另外用 state 控制展開。 */
    h += '<div style="margin-top:16px;border-top:1px solid rgba(201,169,110,.16);padding-top:12px">';
    h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72)">用哪一種牌</div>';
    h += '<div role="group" aria-label="牌組" style="display:flex;gap:8px;margin-top:8px">';
    h += '<button type="button" aria-pressed="' + isTarot + '" onclick="wizSetDeck(\'tarot\')" style="min-height:56px;flex:1;text-align:center;background:' + (isTarot ? 'rgba(201,169,110,.15)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (isTarot ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';border-radius:10px;padding:9px;cursor:pointer">'
      + '<span style="display:block;font:500 13px \'Noto Sans TC\',sans-serif;color:' + (isTarot ? '#f0e9d8' : 'rgba(240,233,216,.7)') + '">' + (isTarot ? '✓ ' : '') + '塔羅牌</span>'
      + '<span style="display:block;font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:2px">78 張・分正逆位</span></button>';
    h += '<button type="button" aria-pressed="' + !isTarot + '" onclick="wizSetDeck(\'lenormand\')" style="min-height:56px;flex:1;text-align:center;background:' + (!isTarot ? 'rgba(201,169,110,.15)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (!isTarot ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';border-radius:10px;padding:9px;cursor:pointer">'
      + '<span style="display:block;font:500 13px \'Noto Sans TC\',sans-serif;color:' + (!isTarot ? '#f0e9d8' : 'rgba(240,233,216,.7)') + '">' + (!isTarot ? '✓ ' : '') + '雷諾曼牌</span>'
      + '<span style="display:block;font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:2px">36 張・直接明確</span></button>';
    h += '</div>';
    h += renderTarotLenormandGuide();
    h += '</div>';
    h += wizBtns(false, !!state.category, '下一步', 'wizNext()');

  } else if (state.wizardStep === 2) {
    var focusCfg2 = topicQuestionConfig[state.category];
    h += '<div style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:6px">這次你最想問什麼？</div>';
    if (focusCfg2 && focusCfg2.riskNotice) {
      h += '<div style="margin-top:10px;border:1px solid rgba(214,120,120,.35);border-radius:10px;padding:10px 13px;background:rgba(214,120,120,.06);font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.7">⚠ ' + esc(focusCfg2.riskNotice) + '</div>';
    }
    h += renderPrimaryQuestionBlock();

    var rec = wizSpreadRecommendations();
    var recs = rec.top.concat(rec.rest);
    h += '<div style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:22px;border-top:1px solid rgba(201,169,110,.18);padding-top:16px">選一個牌陣</div>';
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:5px;line-height:1.7">'
      + (rec.source === 'primary'
        ? '排在前面的是比較貼近你上面那一題的。換一個問題，排序就會換。'
        : '先選上面的問題，這裡會把更貼近那一題的排到前面。')
      + '</div>';
    h += '<div style="display:flex;flex-direction:column;gap:9px;margin-top:14px">';
    recs.forEach(function (key, ri) {
      if (rec.source === 'primary' && rec.rest.length) {
        if (ri === 0) h += '<div style="font:500 10.5px \'Noto Sans TC\',sans-serif;letter-spacing:.06em;color:#c9a96e">更貼近這一題</div>';
        if (ri === rec.top.length) h += '<div style="font:500 10.5px \'Noto Sans TC\',sans-serif;letter-spacing:.06em;color:rgba(240,233,216,.5);margin-top:6px">這個領域也常用</div>';
      }
      var sp = spreads[key];
      var active = key === state.spread;
      h += '<button onclick="wizSetSpread(\'' + key + '\')" style="text-align:left;background:' + (active ? 'rgba(201,169,110,.15)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (active ? '#c9a96e' : 'rgba(201,169,110,.25)') + ';border-radius:10px;padding:12px 14px;cursor:pointer">';
      h += '<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font:500 13px \'Noto Sans TC\',sans-serif;color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.8)') + '">' + sp.zh + '</span><span style="font:italic 10px \'EB Garamond\',serif;color:#c9a96e">' + sp.positions.length + ' 張牌</span></div>';
      h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:4px;line-height:1.5">' + (SPREAD_DESC[key] || '') + '</div>';
      var posLine = sp.positions.length > 10
        ? '免選牌 · 洗牌後 36 張自動排成 9×4 陣 · 找到代表你的牌，讀它的四鄰與全局'
        : sp.positions.map(function (p2) { return p2.zh; }).join(' · ');
      h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:3px">' + posLine + '</div>';
      h += '</button>';
    });
    h += '</div>';
    h += wizBtns(true, !!spreads[state.spread] && recs.indexOf(state.spread) !== -1, '下一步', 'wizNext()');

  } else if (state.wizardStep === 3) {
    h += renderReturnToPreviousBar();
    var tmpl = QUESTION_TEMPLATES[state.category] || QUESTION_TEMPLATES.general;
    var focusCfg = topicQuestionConfig[state.category];
    var spreadQuestionPreset = getSpreadQuestionPreset();
    var spreadQuestionExamples = getSpreadQuestionExamples();
    var targetCfg = TARGET_FIELD_CONFIG[state.category];
    /* Step 3 標題／說明文字依 Step 1 選擇的主題動態變化（topicQuestionConfig[category].label／hint），
       沒有對應設定時退回原本固定文案，不會出現 undefined。 */
    h += '<div style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:6px">再告訴我一點你的情況</div>';
    /* riskNotice 跟著主問題移到第二步了——警語要跟它在說的那個問題在同一屏。 */
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:5px;line-height:1.6">'
      + (focusCfg ? esc(focusCfg.hint) : '這一步全部選填，直接按下面的按鈕也可以開始。') + '</div>';
    /* 「想深入了解的面向」複選器：copyForAI() 組裝 AI 提示詞時會讀 state.wizFocusSel
       （見 var wizFocus = ...），少了這段渲染，使用者就沒有任何地方可以選面向，
       那段提示詞永遠是空的。這裡把它接回問題輸入框的正上方——先選面向、再寫問題。 */
    /* 兩個 disclosure。原本這裡連續攤開三個大型區塊（主問題／面向多選／自由輸入），
       使用者會覺得一直被追問「你到底想問什麼」。
       實際上只有主問題是必要的——它驅動 cardSubtopicReading() 與 readingSchemaFor()；
       面向與自由輸入都只進 AI 提示詞，屬於選填的加強。所以只留一個必要決策，
       其餘收合，而且明講「也可以直接開始」。 */
    h += '<div style="margin-top:16px;border:1px solid rgba(201,169,110,.22);border-radius:12px;background:rgba(255,255,255,.02);overflow:hidden">';
    h += '<button type="button" aria-expanded="' + (!!state.wizFocusOpen) + '" onclick="wizToggleFocusPanel()" style="min-height:44px;width:100%;background:none;border:none;padding:13px 14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px;text-align:left">'
      + '<span><span style="font:500 12.5px \'Noto Sans TC\',sans-serif;color:#e6cd9a">＋ 想讓解讀更聚焦</span>'
      + '<span style="display:block;font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:3px">選填・最多 3 個'
      + (wizFocusCount() ? ('・已選 ' + wizFocusCount()) : '') + '</span></span>'
      + '<span aria-hidden="true" style="color:#c9a96e">' + (state.wizFocusOpen ? '▴' : '▾') + '</span></button>';
    if (state.wizFocusOpen) {
      h += '<div style="padding:0 14px 14px">' + renderFocusAreaPicker() + '</div>';
    }
    h += '</div>';

    h += '<div style="margin-top:9px;border:1px solid rgba(201,169,110,.22);border-radius:12px;background:rgba(255,255,255,.02);overflow:hidden">';
    h += '<button type="button" aria-expanded="' + (!!state.wizContextOpen) + '" onclick="wizToggleContextPanel()" style="min-height:44px;width:100%;background:none;border:none;padding:13px 14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px;text-align:left">'
      + '<span><span style="font:500 12.5px \'Noto Sans TC\',sans-serif;color:#e6cd9a">＋ 有具體情況想補充？</span>'
      + '<span style="display:block;font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:3px">選填'
      + (state.question ? '・已填寫' : '') + '</span></span>'
      + '<span aria-hidden="true" style="color:#c9a96e">' + (state.wizContextOpen ? '▴' : '▾') + '</span></button>';
    if (state.wizContextOpen) {
      h += '<div style="padding:0 14px 14px">';
      h += '<label for="question-input" style="display:block;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">寫下你的情況（選填）</label>';
      h += '<textarea id="question-input" maxlength="300" aria-describedby="q-hint q-count" oninput="updateQHint(this.value)" placeholder="' + esc(wizPlaceholder()) + '" style="width:100%;box-sizing:border-box;margin-top:7px;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:11px 13px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none;min-height:74px;resize:vertical">' + esc(state.question) + '</textarea>';
      h += '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">';
      h += '<div id="q-hint" aria-live="polite" style="flex:1;font:400 11px \'Noto Sans TC\',sans-serif;margin-top:6px;line-height:1.6;color:rgba(240,233,216,.62)"></div>';
      h += '<div id="q-count" aria-live="polite" style="flex:none;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:7px"></div>';
      h += '</div>';
      if (spreadQuestionExamples.length) {
        h += '<div style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:9px">或直接套用範例：</div>';
        h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">';
        wizExamples().forEach(function (c2, i2) {
          h += '<button type="button" onclick="wizChip(' + i2 + ')" style="min-height:36px;font:400 11px \'Noto Sans TC\',sans-serif;background:none;border:1px dashed rgba(201,169,110,.35);color:rgba(240,233,216,.75);padding:7px 12px;border-radius:14px;cursor:pointer;text-align:left;white-space:normal;line-height:1.5">' + esc(c2) + '</button>';
        });
        h += '</div>';
      }
      if (targetCfg) {
        h += '<label for="target-input" style="display:block;font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:12px">' + esc(targetCfg.label) + '（選填）</label>';
        h += '<input id="target-input" maxlength="80" value="' + esc(state.target) + '" oninput="state.target=this.value.slice(0,80)" placeholder="' + esc(targetCfg.placeholder) + '" style="width:100%;box-sizing:border-box;margin-top:6px;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:10px 13px;font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none">';
      }
      if (!isTarot) {
        var ranges = [['week','一週內'],['month','一個月內'],['quarter','三個月內'],['half','半年內'],['open','不限時間']];
        h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:12px">想看的時間範圍</div>';
        h += '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:7px">';
        ranges.forEach(function (r) {
          var active = state.timeframe === r[0];
          h += '<button type="button" aria-pressed="' + active + '" onclick="wizSetTimeframe(\'' + r[0] + '\')" style="min-height:36px;font:400 11px \'Noto Sans TC\',sans-serif;background:' + (active ? 'rgba(201,169,110,.22)' : 'none') + ';border:1px solid ' + (active ? '#e6cd9a' : 'rgba(201,169,110,.3)') + ';color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.75)') + ';padding:7px 13px;border-radius:14px;cursor:pointer">' + (active ? '✓ ' : '') + r[1] + '</button>';
        });
        h += '</div>';
      }
      h += '</div>';
    }
    h += '</div>';

    h += '<div style="text-align:center;margin-top:10px;font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">上面兩項都是選填，不設定也可以直接開始。</div>';

    h += wizBtns(true, true, '開始解讀 →', 'wizNext()');

  } else {
    var cat4 = CATEGORIES.find(function (x) { return x.key === state.category; });
    var sp2 = spreads[state.spread];
    h += '<div style="font:600 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:6px">確認後開始抽牌</div>';
    h += '<div style="border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:6px 16px;margin-top:14px;background:rgba(255,255,255,.02)">';
    var row = function (k, v) { return '<div style="display:flex;justify-content:space-between;gap:14px;padding:9px 0;border-bottom:1px solid rgba(201,169,110,.12)"><span style="flex:none;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">' + k + '</span><span style="font:400 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8;text-align:right;line-height:1.5">' + v + '</span></div>'; };
    h += row('牌組', state.deck === 'tarot' ? '塔羅牌' : '雷諾曼牌');
    h += row('類別', (cat4 ? cat4.icon + ' ' + cat4.zh : ''));
    h += row('牌陣', sp2.zh + '（' + sp2.positions.length + ' 張）');
    if (!isTarot) h += row('時間範圍', timeframeLabel());
    if (state.target) h += row('對象', esc(state.target));
    h += row('問題', state.question ? esc(state.question) : '<span style="color:rgba(240,233,216,.62)">（未填寫，將以通用方式解讀）</span>');
    h += '</div>';
    h += wizBtns(true, true, '開始抽牌 →', 'startReading()');
  }

  if (state.wizardStep > 1) {
    h += '<div style="text-align:center;margin-top:16px"><button type="button" onclick="wizRestart()" style="min-height:44px;background:none;border:none;color:rgba(240,233,216,.62);font:400 11px \'Noto Sans TC\',sans-serif;cursor:pointer;border-bottom:1px dotted rgba(240,233,216,.3);padding:8px 6px">重新開始 Restart</button></div>';
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
    state.wizFocusLimitHit = ''; // 切換分類時清掉上一個分類殘留的「已選滿」提示
    var recSource = state.deck === 'lenormand' ? LEN_RECOMMENDATIONS : RECOMMENDATIONS;
    var firstRecommended = (recSource[k] || [])[0];
    if (firstRecommended) state.spread = firstRecommended;
  }
  render();
}
/* wizToggleSubtopic() 是子問題還用按鈕呈現時的切換函式；改成 <select> 之後
   由 wizSetSubtopic() 接手，已無呼叫端，予以移除。 */
/* 換主問題＝下游全部重算。已選但新主問題不適用的面向必須清掉——
   不能讓隱藏的舊選擇偷偷送進 prompt。範例與 placeholder 也會跟著換。 */
function wizSetSubtopic(key) {
  state.subtopic = key;
  var cat = state.category;
  var sel = state.wizFocusSel[cat];
  if (sel && sel.length) {
    var tax = taxonomyActiveFor(cat, key);
    if (tax) {
      var allowed = taxonomyAllowedFocusIds(cat, tax.id).map(taxonomyFocusLabel);
      state.wizFocusSel[cat] = sel.filter(function (o) { return allowed.indexOf(o) !== -1; });
    } else {
      pruneFocusSelection(cat);
    }
  }
  state.wizFocusExpanded[cat] = false;
  state.wizFocusLimitHit = '';
  render();
}

function readingBuildAstro() {
  state.returnToReadingAfterAstro = true;
  go('astro');
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
function wizSetSpread(k) {
  state.spread = k;
  var preset = getSpreadQuestionPreset();
  if (state.subtopic && preset.subtopics && preset.subtopics.indexOf(state.subtopic) === -1) state.subtopic = '';
  if (state.category) pruneFocusSelection(state.category);
  render();
}
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
  var list = wizExamples();
  var t = list[i];
  if (!t) return;
  state.question = t;
  var el = document.getElementById('question-input');
  if (el) el.value = t;
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
  h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.62);text-align:center;margin-top:2px">' + (isTarot ? 'Tarot Reading' : 'Lenormand Reading') + '</div>';

  // guided 4-step wizard replaces the old pickers (setup phase only)
  if (state.phase === 'setup') {
    h += renderWizard(spreads, isTarot);
  }

  // focus phase: breathing guidance before the shuffle
  if (state.phase === 'focus') {
    h += '<div style="text-align:center;margin-top:52px;animation:fadeUp 1s ease both">';
    h += '<div style="display:inline-block;animation:focusPulse 2.2s ease-in-out infinite">' + sigil(64, 64) + '</div>';
    h += '<div style="font:500 15px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:24px;letter-spacing:.1em;line-height:2.1">深呼吸，在心中默唸題目<br>宇宙正在替你解答</div>';
    h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.62);margin-top:8px">Take a breath. The universe is listening.</div>';
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
    h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.62);margin-top:3px">Shuffling the deck</div>';
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
    h += '<div style="text-align:center;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);letter-spacing:.1em">← 左右滑動瀏覽整副牌 →</div>';
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
        + cardImgHtml(c.img, c.nameZh, state.drawn.length >= 3)
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


    /* 翻牌與顯示牌義必須留在牌卡旁邊——它們是「還沒讀到解讀」時要用的。
       語氣選擇與複製／分享則移到整份解讀之後：那是讀完才會做的事，擺在
       前面只會把「直接回答」往下推。 */
    h += '<div style="display:flex;justify-content:center;gap:10px;margin-top:22px;flex-wrap:wrap">';
    h += '<button onclick="flipAll()" style="font:400 12px \'Noto Sans TC\',sans-serif;background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;padding:8px 18px;border-radius:20px;cursor:pointer">全部翻牌 Reveal All</button>';
    h += '<button onclick="revealMeanings()" style="font:500 12px \'Noto Sans TC\',sans-serif;background:linear-gradient(120deg,#c9a96e,#e6cd9a);border:none;color:#1a1622;padding:8px 18px;border-radius:20px;cursor:pointer">直接看牌義 View Meanings</button>';
    h += '</div>';

    // summary panel
    h += '<div id="summary-panel" style="margin-top:28px;border-top:1px solid rgba(201,169,110,.2);padding-top:20px;display:' + (allFlipped() ? 'block' : 'none') + '">';
    h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:rgba(240,233,216,.5);text-transform:uppercase;text-align:center">解讀摘要 Reading Summary</div>';
    var activeSubDef = state.subtopic ? (SUBTOPICS[state.category] || []).filter(function (s) { return s.key === state.subtopic; })[0] : null;
    var activeCardResult = activeSubDef ? cardSubtopicReading(state.category, state.subtopic, state.drawn) : null;
    if (activeSubDef && activeCardResult && activeCardResult.available) {
      h += renderSubtopicResultPanel(activeSubDef, activeCardResult, '直接回答這個問題');
    }
    /* 上面的「直接回答」面板已經把結論、牌與牌的互相影響、下一步逐項列出來了。
       整副牌的走向是同一批內容的連續敘述版本——兩個都攤開會讓同一頁出現兩份
       幾乎一樣的長段落。有直接回答時預設收合，想讀完整敘述再展開。 */
    var hasTyped = !!(activeSubDef && activeCardResult && activeCardResult.available && activeCardResult.typed);
    var overallOpen = hasTyped ? !!state.overallOpen : true;
    h += '<div style="border:1px solid rgba(201,169,110,.4);border-radius:10px;padding:15px 17px;background:rgba(201,169,110,.09);margin-top:16px">';
    if (hasTyped) {
      h += '<button type="button" aria-expanded="' + overallOpen + '" onclick="toggleOverallReading()" style="width:100%;min-height:44px;display:flex;justify-content:space-between;align-items:center;gap:10px;background:none;border:none;padding:0;cursor:pointer;text-align:left">'
        + '<span style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#e6cd9a;text-transform:uppercase">✦ 整副牌的走向 Overall Reading</span>'
        + '<span style="flex:none;color:#c9a96e;font:500 11px \'Noto Sans TC\',sans-serif;white-space:nowrap">' + (overallOpen ? '▴ 收起' : '▾ 讀完整敘述') + '</span></button>';
      if (!overallOpen) h += '<div style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:4px;line-height:1.7">跟上面同一批內容，換成連續的敘述寫法。</div>';
    } else {
      h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#e6cd9a;text-transform:uppercase">✦ 整副牌的走向 Overall Reading</div>';
    }
    if (overallOpen) h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:8px;line-height:1.9;text-align:justify">' + esc(overallReading()) + '</div>';
    h += '</div>';
    if (state.category === 'love' && state.subtopic) {
      var loveSubDef = (SUBTOPICS.love || []).filter(function (s) { return s.key === state.subtopic; })[0];
      if (loveSubDef) {
        var loveCardRes = cardSubtopicReading('love', state.subtopic, state.drawn);
        if (state.readingMode === 'combined' && state.astroResult) {
          /* combined 模式：依序顯示 A 牌卡具體解讀、B 星盤補充解讀、C 牌卡＋星盤綜合觀察。
             星盤結果現算現用，不寫回 state，也絕不在沒有 state.astroResult 時臨時生成假星盤。 */
          var loveAstroRes = astroCategoryReading('love', state.subtopic, state.astroResult, state.astroUnknownTime);
          h += renderAstroSubtopicPanel(loveSubDef, loveAstroRes);
          var loveCombRes = combinedReading(loveCardRes, loveAstroRes, 'love', state.subtopic);
          h += renderCombinedSummaryPanel(loveSubDef, loveCombRes);
        } else {
          /* cards 模式：與 Phase 1A 完全一致，不多出任何星盤區塊 */
          /* 牌卡直接答案已先顯示在整副牌走向之前。 */
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
          var careerAstroRes = astroCategoryReading('career', state.subtopic, state.astroResult, state.astroUnknownTime);
          h += renderAstroSubtopicPanel(careerSubDef, careerAstroRes);
          var careerCombRes = combinedReading(careerCardRes, careerAstroRes, 'career', state.subtopic);
          h += renderCombinedSummaryPanel(careerSubDef, careerCombRes);
        } else {
          /* cards 模式：與 Phase 2A 完全一致，不多出任何星盤區塊 */
          /* 牌卡直接答案已先顯示在整副牌走向之前。 */
        }
      }
    } else if (state.category === 'family' && state.subtopic) {
      var familySubDef = (SUBTOPICS.family || []).filter(function (s) { return s.key === state.subtopic; })[0];
      if (familySubDef) {
        var familyCardRes = cardSubtopicReading('family', state.subtopic, state.drawn);
        if (state.readingMode === 'combined' && state.astroResult) {
          var familyAstroRes = astroCategoryReading('family', state.subtopic, state.astroResult, state.astroUnknownTime);
          h += renderAstroSubtopicPanel(familySubDef, familyAstroRes);
          var familyCombRes = combinedReading(familyCardRes, familyAstroRes, 'family', state.subtopic);
          h += renderCombinedSummaryPanel(familySubDef, familyCombRes);
        } else {
          /* 牌卡直接答案已先顯示在整副牌走向之前。 */
        }
      }
    } else if (state.category === 'wealth' && state.subtopic) {
      var wealthSubDef = (SUBTOPICS.wealth || []).filter(function (s) { return s.key === state.subtopic; })[0];
      if (wealthSubDef) {
        var wealthCardRes = cardSubtopicReading('wealth', state.subtopic, state.drawn);
        if (state.readingMode === 'combined' && state.astroResult) {
          var wealthAstroRes = astroCategoryReading('wealth', state.subtopic, state.astroResult, state.astroUnknownTime);
          h += renderAstroSubtopicPanel(wealthSubDef, wealthAstroRes);
          var wealthCombRes = combinedReading(wealthCardRes, wealthAstroRes, 'wealth', state.subtopic);
          h += renderCombinedSummaryPanel(wealthSubDef, wealthCombRes);
        } else {
          /* 牌卡直接答案已先顯示在整副牌走向之前。 */
        }
      }
    } else if (['health', 'social', 'study', 'general'].indexOf(state.category) !== -1 && state.subtopic) {
      var remainingSubDef = (SUBTOPICS[state.category] || []).filter(function (s) { return s.key === state.subtopic; })[0];
      if (remainingSubDef) {
        var remainingCardRes = cardSubtopicReading(state.category, state.subtopic, state.drawn);
        if (state.readingMode === 'combined' && state.astroResult) {
          var remainingAstroRes = astroCategoryReading(state.category, state.subtopic, state.astroResult, state.astroUnknownTime);
          h += renderAstroSubtopicPanel(remainingSubDef, remainingAstroRes);
          var remainingCombRes = combinedReading(remainingCardRes, remainingAstroRes, state.category, state.subtopic);
          h += renderCombinedSummaryPanel(remainingSubDef, remainingCombRes);
        } else {
          /* 牌卡直接答案已先顯示在整副牌走向之前。 */
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
    if (isTarot && state.spread === 'yesno') h += renderYesNoResult(state.drawn);
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
      if (isTarot) h += '<div style="font:400 10px \'EB Garamond\',serif;color:rgba(240,233,216,.62)">' + (d.reversed ? '逆位 Reversed' : '正位 Upright') + '</div>';
      h += '</div>';
      h += '<div style="font:600 14px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:4px">' + esc(c.nameZh) + ' <span style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.5)">' + esc(c.nameEn) + '</span></div>';
      h += '<div style="font:italic 10px \'EB Garamond\',serif;color:rgba(240,233,216,.62);margin-top:1px">' + esc(meaningEn) + '</div>';
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
      /* 原本是 <span onclick>，用鍵盤 Tab 走不到、螢幕閱讀器也不會念成可點擊元素；
         換成 <button> 之後同時取得焦點樣式、Enter/空白鍵操作與正確的語意角色。 */
      h += '<div style="margin-top:8px"><button type="button" onclick="openLibCard(\'' + libKey + '\')" style="min-height:36px;background:none;border:none;padding:0;font:400 11px \'Noto Sans TC\',sans-serif;color:#c9a96e;cursor:pointer;border-bottom:1px dotted rgba(201,169,110,.5)">在牌典查看這張牌 →</button></div>';
      h += '</div>';
    });
    h += '</div>';
    }
    h += '</div>';
    /* 延伸問題放在整份解讀的最後。它原本緊接在牌卡下方，也就是使用者還沒讀到
       任何解讀內容之前，就先被問「要不要換一個問題」——順序上說不通，而且
       那一區的按鈕會把真正的解讀往下推。 */

    /* 讀完解讀才會用到的：語氣、複製給 AI、分享圖。 */
    h += renderPersonaPicker();
    h += '<div style="display:flex;justify-content:center;gap:10px;margin-top:20px;flex-wrap:wrap">';
    h += '<button id="copy-btn" onclick="copyForAI()" style="font:400 12px \'Noto Sans TC\',sans-serif;background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;padding:8px 18px;border-radius:20px;cursor:pointer">' + (state.copied ? '已複製！Copied' : '複製給 AI 解讀 Copy for AI') + '</button>';
    h += '<button onclick="shareResultImage()" style="font:400 12px \'Noto Sans TC\',sans-serif;background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;padding:8px 18px;border-radius:20px;cursor:pointer">分享結果圖 Share</button>';
    h += '</div>';
    h += renderAiPasteHint();
    h += renderReadingFollowUp();
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
var CAT_OPENERS = { love: '在感情上', career: '在事業上', family: '在家庭方面', health: '在健康方面', wealth: '在財運方面', social: '在人際關係上', study: '在學業上', decision: '就這個決定而言', general: '就你目前的整體狀態而言' };
/* 綜合解讀的結尾建議。原本每個分類只有「正向」「保守」兩句，而且是用 toneIdx 直接
   索引，導致同一個分類、同一種語氣永遠跳出一模一樣的結尾——連抽十次牌，最後一句
   都相同，很快就會讓人覺得是罐頭。改成三種語氣各自有三句，再用抽到的牌做雜湊挑句，
   同一組牌結果仍然穩定可重現，不同組牌則會拿到不同的收尾。 */
var CAT_ADVICE = {
  love: {
    positive: ['趁氣氛正好，把想說的話說出口，別等到需要猜的時候', '現在適合主動一點，你釋出的訊號對方接得到', '維持現在的相處節奏就好，不用刻意加碼證明什麼'],
    neutral: ['與其反覆猜測，不如找機會問一句你最想知道的事', '先把自己的期待想清楚，再決定要不要說、什麼時候說', '給這件事一個觀察期限，到期再回頭看要不要繼續投入'],
    challenging: ['先照顧好自己的狀態，不急著要一個答案', '這段時間適合退一步，把力氣留給真的能改變的部分', '別急著解釋或挽回，讓彼此都有喘口氣的空間'],
  },
  career: {
    positive: ['機會就在眼前，主動開口爭取比等人指派有效', '把手上的成果整理出來讓人看見，這是最好的時機', '順著現在的節奏推進，不需要另外開新戰場'],
    neutral: ['先確認你想要的到底是什麼，再決定要投入哪一邊', '把大目標拆成這個月能做完的小事，跑一輪再看結果', '主動問清楚別人對你的期待，會比自己揣測省很多力氣'],
    challenging: ['先穩住現在有的，再談下一步要往哪裡走', '這段時間不適合冒進，把基本功補起來比較實在', '遇到卡關先找人談，不要一個人硬扛到底'],
  },
  family: {
    positive: ['趁關係緩和的時候，主動安排一次相處的時間', '你現在的付出家人感受得到，繼續保持就好', '把想講的話趁氣氛好的時候說，會比爭執時說更容易被聽進去'],
    neutral: ['一次只談一件事，不要把累積多年的帳一起翻出來', '把抱怨換成具體的請求，對方比較知道能怎麼配合', '先分清楚哪些是你的責任、哪些需要一起討論'],
    challenging: ['先守住自己的底線，再談要不要退讓', '給彼此一點時間消化，不用急著在這幾天分出對錯', '需要距離的時候就保持距離，那不是不孝也不是冷漠'],
  },
  health: {
    positive: ['維持現在的作息就好，不需要另外加強度', '狀態不錯的時候，正適合把好習慣固定下來', '身體有餘裕的時候，安排一次健康檢查會更安心'],
    neutral: ['把睡眠、飲食和壓力簡單記錄一週，再決定要調整什麼', '小幅度但持續的調整，會比一次大改更容易撐下去', '先找出最影響你精神的那一件事，從那裡開始'],
    challenging: ['身體在叫你慢下來，休息不是偷懶', '有明顯不舒服就去看醫生，不要靠自己撐或上網查', '先減少一件正在消耗你的事，比多做一件養生的事有用'],
  },
  wealth: {
    positive: ['資源流動順的時候，適合把長期規劃排出來', '現在適合行動，但仍要留一筆動不到的預備金', '把已經看懂的機會做好，不用急著擴大到不熟的領域'],
    neutral: ['先記錄一個月的收支，再決定要不要改變什麼', '把大筆決定拆成幾次小額投入，降低一次押錯的風險', '搞清楚自己能承受多少損失，再看要不要進場'],
    challenging: ['近期以守成為主，先別讓支出再往上加', '不熟的東西不要碰，怕錯過的心情本身就是風險', '先把固定支出盤一次，找出可以立刻停掉的那一筆'],
  },
  social: {
    positive: ['主動釋出善意，現在的你說什麼別人都比較聽得進去', '趁關係熱絡時把重要的連結經營起來', '維持現在的來往頻率就好，不用刻意討好誰'],
    neutral: ['與其猜別人怎麼想，不如直接問一句', '先想清楚你想從這段關係得到什麼，再決定投入多少', '從固定的小互動開始，關係是靠次數累積的'],
    challenging: ['先退一步觀察，不用急著修補每一段關係', '把力氣留給真的在乎你的人，其他的可以先放著', '被誤解的時候先別急著辯解，時間會處理掉一部分'],
  },
  study: {
    positive: ['照現在的節奏走下去，成果會反映在成績上', '狀態好的時候先攻最難的那一科，效率最高', '把有效的讀書方法固定成習慣，別一直換方法'],
    neutral: ['先用一次小考或練習題確認弱點在哪，再分配時間', '把讀書計畫縮短到一週，跑完再檢討要不要調整', '搞清楚考試真正在考什麼，比一直往下讀更重要'],
    challenging: ['先把基本題穩住，難題可以晚一點再處理', '進度落後時先減量，維持每天都有讀比一次讀很久有用', '卡住就去問人，自己鑽牛角尖最花時間'],
  },
  general: {
    positive: ['順著現在的節奏走，不需要特別做什麼', '狀態不錯的時候，適合把想做很久的事排進行程', '維持現在的做法就好，不用急著改變什麼'],
    neutral: ['先把最在意的那一件事挑出來處理，其他的可以等', '給自己一個檢查點，到那天再用結果決定下一步', '資訊不夠就先去問、去查，不要用猜的做決定'],
    challenging: ['先慢下來，把眼前最急的一件事處理完再說', '這段時間不適合做重大決定，先穩住日常就好', '需要休息就休息，不用把每件事都扛在自己身上'],
  },
  decision: {
    positive: ['目前條件支持往前，但仍要確認現實成本是否能承受', '可以先走一個可回頭的小步驟，用實際結果驗證方向', '優勢已經浮現，接下來要把承諾、期限與資源說清楚'],
    neutral: ['先補齊最關鍵的一項資訊，再決定會更穩妥', '把兩邊不能接受的代價各寫一條，答案會更清楚', '先設定一個檢查點，不必今天就把所有後路封死'],
    challenging: ['目前阻力高於助力，先處理風險再決定是否推進', '暫緩不是放棄，先確認最壞情況是否承受得起', '不要只因為害怕錯過就答應，先看代價是否合理'],
  },
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
var CAT_CTX = { love: 'love', career: 'career', wealth: 'wealth', decision: 'general', general: 'general', family: 'family', health: 'health', social: 'social', study: 'study' };

/* 三張牌採奇數票避免平手；正逆位只決定方向，牌義本身用來說明成立條件與阻力。 */
function yesNoVerdict(drawn) {
  var upright = drawn.filter(function (d) { return !d.reversed; }).length;
  var total = drawn.length;
  var label = upright === total ? '明顯偏向「是」'
    : upright >= 2 ? '目前偏向「是」'
      : upright === 1 ? '目前偏向「否」' : '明顯偏向「否」';
  return { label: label, upright: upright, reversed: total - upright };
}

function renderYesNoResult(drawn) {
  var verdict = yesNoVerdict(drawn);
  var h = '<div style="border:1px solid rgba(201,169,110,.45);border-radius:10px;padding:17px;background:rgba(201,169,110,.07);margin-top:12px">';
  h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#c9a96e">✧ 是／否結果 YES OR NO</div>';
  h += '<div style="font:600 20px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:9px">' + verdict.label + '</div>';
  h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.78);margin-top:8px;line-height:1.8">正位 ' + verdict.upright + ' 張／逆位 ' + verdict.reversed + ' 張。這代表目前條件的傾向，不是結果保證；三張牌的內容會告訴你答案成立需要什麼，以及最大的阻力在哪裡。</div>';
  h += '</div>';
  return h;
}

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
  future:   { fu: '發展正朝「{kw}」的方向前進——{meaning}', fr: '未來的走向暫時受「{kw}」影響——{meaning}' },
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
  /* meaning 來自牌義資料，有的有句號、有的沒有，先去掉再由 polishSentence 統一補，
     避免組成「⋯⋯。的狀態。」這種句中多一個句號的情況。 */
  return polishSentence(tpl.replace('{kw}', kw).replace('{meaning}', String(meaning).replace(/[。！]$/, '')));
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
  obstacle: '先確認阻力是缺資訊、缺資源，還是有人不同意。',
  advice: '把牌的建議改成今天能完成的一步。',
  past: '分開列出舊經驗與現在條件，別把兩者混在一起。',
  future: '先準備能因應變化的方案，再決定投入多少。',
  root: '先處理反覆出現的原因，暫時不要只補表面漏洞。',
  other: '先確認對方的實際行動，再判斷自己的下一步。',
  self: '寫下你現在真正想要的結果，以及不能接受的代價。',
  hope: '把期待與擔心各寫一條，再看哪一條有事實支持。',
  present: '先完成眼前最必要的一步，再評估後續。',
  bond: '選一件彼此理解不同的事，直接確認雙方的意思。',
  strength: '決定在哪個具體任務上使用這項優勢。',
  generic: '把牌義對照目前發生的事，只保留能驗證的部分。',
};
function cardCoreMeaning(d, isTarot) {
  var meaningZh = isTarot ? (d.reversed ? d.card.revZh : d.card.upZh) : d.card.mZh;
  return polishSentence(meaningZh);
}
function cardBlindSpot(d, isTarot) {
  var role = posRole(d.pos.zh);
  var kw = cardKws(d, isTarot)[0] || '這張牌';
  return polishSentence((BLIND_SPOT_TEMPLATES[role] || BLIND_SPOT_TEMPLATES.generic).replace('{kw}', kw));
}
function cardAction(d, isTarot) {
  var role = posRole(d.pos.zh);
  var kw = cardKws(d, isTarot)[0] || '這張牌';
  return polishSentence((ACTION_TEMPLATES[role] || ACTION_TEMPLATES.generic).replace('{kw}', kw));
}
function cardReminder(d, isTarot) {
  var role = posRole(d.pos.zh);
  return polishSentence(REMINDER_TEMPLATES[role] || REMINDER_TEMPLATES.generic);
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
  major: ['存在感強、不容易被忽略', '個性鮮明、和一般人不太一樣', '份量比一般認識的人重'],
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
    neutral: ['現在是好壞都有的階段，走向會由接下來這幾次互動決定，不是現在就定案', '關係停在不上不下的位置，通常是有句話還沒說出口，說了才會動', '兩邊都還在觀望，誰先把自己的期待講清楚，走向就往誰的方向偏'],
    challenging: ['目前的趨勢帶有一些阻力，進展可能比預期慢一些', '牌面顯示這段時間需要多一點耐心，不宜期待立即的變化', '發展走向暫時卡在某個環節，建議先處理眼前的課題再往前'],
  },
  favor: {
    positive: ['你目前的狀態與心態是最大的助力，保持現有的步調即可', '身邊的機會與人脈都對你有利，適合主動一點', '整體氛圍站在你這邊，坦然表現真實的自己會加分'],
    neutral: ['你願意先開口說出真實想法，是現在最能推動關係的一件事', '相處時多問一句「你的想法呢」，比自己猜半天有用得多', '不急著要一個答案的態度，反而讓對方更敢靠近'],
    challenging: ['願意誠實面對問題本身就是一種助力，別急著逃避', '過去累積的信任與耐心，會是撐過這段時期的關鍵', '願意先調整自己的心態，會比等對方改變更有幫助'],
  },
  risk: {
    positive: ['順利時也別忽略溝通，避免因為太順而少了確認彼此的心意', '留意別因為進展快就忽略了解對方真正的需求', '好的開始也需要持續經營，避免三分鐘熱度'],
    neutral: ['把自己的猜測當成事實，是這段時間最容易踩到的坑', '有話不說、等對方自己發現，通常只會拖成誤會', '想了很多卻沒有動作，機會可能就這樣安靜地過去'],
    challenging: ['要留意逃避溝通或累積情緒，反而讓問題越滾越大', '容易因為缺乏安全感而想太多，建議別把小事放大檢視', '過去未解決的心結若不處理，可能持續影響這段關係'],
  },
  action: {
    positive: ['可以主動一點，把握現有的好氛圍往前推進一步', '適合把心裡的想法說出口，坦誠會帶來更好的結果', '順勢而為，同時也記得肯定對方在這段關係中的付出'],
    neutral: ['挑一件你最在意、卻一直沒說的事，找個輕鬆的時機說出來', '從固定的小邀約或閒聊開始，讓相處先有一個穩定的節奏', '給自己訂一個期限，到期還沒進展就重新評估，不要無限期等下去', '給彼此一點時間，同時誠實表達自己真正的需求'],
    challenging: ['建議先照顧好自己的情緒，再決定下一步怎麼走', '找一個平靜的時機，坦誠地把心裡的擔憂說出來', '暫時放慢腳步，把注意力放在能自己掌握的部分'],
  },
  timing: {
    positive: ['如果雙方都有意願，關係往更穩定的方向發展，時機點可能比想像中更快到來', '牌面顯示現在是相對適合往前一步的時機', '近期到中期都是相對有利的時間段，可以順勢而為'],
    neutral: ['沒有明顯的時間點，多半要等其中一方先主動打破現狀才會動', '短期內不會有大變化，比較可能在一次好好談過之後才推進', '時間點取決於你什麼時候願意把話說開，而不是等某個日子到來', '關鍵時間點還需要視雙方後續的互動而定，暫時無法斷定'],
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
    neutral: ['現在是機會與阻力並存的階段，接下來的準備會決定往哪一邊倒', '事情停在原地，多半是因為方向還沒真的選定，不是努力不夠', '走向還沒定案，你手上正在做的事會直接影響最後的結果'],
    challenging: ['目前的趨勢帶有一些阻力，進展可能比預期慢一些', '牌面顯示這段時間需要多一點耐心，不宜期待立即的變化', '發展走向暫時卡在某個環節，建議先處理眼前的課題再往前'],
  },
  favor: {
    positive: ['你目前的狀態與準備是最大的助力，保持現有的步調即可', '身邊的機會與人脈都對你有利，適合主動一點爭取', '整體氛圍站在你這邊，展現真實的實力會加分'],
    neutral: ['把已經做出來的成果整理清楚，比多接一件新的事更有幫助', '直接問清楚主管或客戶真正在意什麼，比自己揣測有效得多', '穩定的產出本身就是籌碼，不必急著證明什麼'],
    challenging: ['願意誠實面對職場課題本身就是一種助力，別急著逃避', '過去累積的經驗與耐心，會是撐過這段時期的關鍵', '願意先調整自己的心態，會比等環境改變更有幫助'],
  },
  risk: {
    positive: ['順利時也別忽略持續累積，避免因為太順而鬆懈準備', '留意別因為進展快就忽略確認細節', '好的開始也需要持續投入，避免三分鐘熱度'],
    neutral: ['資訊不夠就先下判斷，是這段時間最容易出錯的地方', '一直在等更好的機會，可能讓眼前這個先跑掉', '只在心裡盤算卻沒說出口，別人不會知道你想要什麼', '過度分析反而可能錯過行動的時機'],
    challenging: ['要留意逃避溝通或累積情緒，反而讓問題越滾越大', '容易因為缺乏安全感而想太多，建議別把小事放大檢視', '過去未解決的職場課題若不處理，可能持續影響現況'],
  },
  action: {
    positive: ['可以主動一點，把握現有的好氛圍往前推進一步', '適合把想法或需求說出口，坦誠會帶來更好的結果', '順勢而為，同時也記得肯定自己這段時間的努力'],
    neutral: ['把想做的事拆成三個月內能看到結果的小目標，先跑一輪', '找一位真的做過這件事的人聊三十分鐘，勝過自己查一個星期', '設一個檢查點，到那天用實際結果決定要繼續還是換方向', '給自己一點時間，同時誠實盤點目前真正的需求'],
    challenging: ['建議先照顧好自己的狀態，再決定下一步怎麼走', '找一個適合的時機，坦誠地把心裡的顧慮說出來', '暫時放慢腳步，把注意力放在能自己掌握的部分'],
  },
  timing: {
    positive: ['近期是相對有利的時機，可以主動把握機會', '接下來一段時間適合積極爭取，時機站在你這邊', '短期內就有機會看到具體的進展或回應'],
    neutral: ['沒有明顯的時間點，比較可能在你完成手上這件事之後才鬆動', '短期內不會突然改變，要累積到一定程度才會一次顯現', '時間點由你的準備進度決定，而不是等外在環境自己變好', '接下來需要一段時間累積，還不到全力衝刺的時候'],
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
    challenging: ['家庭中可能累積了分工不均、你我不分，或沒說出口的情緒', '彼此容易用防衛、沉默或控制回應壓力，真正需求反而被遮住'],
  },
  trend: {
    positive: ['接下來的互動有逐步緩和的空間，坦白而溫和的溝通會帶來進展', '家庭氣氛較可能往理解與重新協調的方向發展'],
    neutral: ['關係仍在調整期，走向取決於是否願意把責任與需求說清楚', '短期內不一定立刻改變，但小幅調整能慢慢累積效果'],
    challenging: ['若持續逃避核心問題，原有摩擦可能反覆出現', '近期仍有壓力，先降低衝突強度比急著一次解決更實際'],
  },
  favor: {
    positive: ['既有的情感連結與願意互相照顧，是目前最重要的助力', '家人之間仍保有信任，適合用具體行動重新建立合作'],
    neutral: ['願意聽完彼此的理由，而不是急著判斷對錯，會帶來幫助', '把抽象抱怨改成具體需求，是目前最實際的助力'],
    challenging: ['先穩住自己的情緒與底線，會比勉強說服所有人更有幫助', '尋找一位能中立協調的人，可能有助於降低彼此防衛'],
  },
  risk: {
    positive: ['關係好轉時仍要把誰負責什麼、各自的底線在哪說清楚，避免問題只是暫時被擱置', '別因為氣氛緩和就再次把自己的真實需求壓下來'],
    neutral: ['容易各自猜測對方心意，卻沒有確認真正需要什麼', '若只談道理、不談感受，溝通可能停在表面'],
    challenging: ['翻舊帳、情緒勒索或把所有責任推給一個人，會讓問題更難處理', '長期壓抑後一次爆發，可能讓原本可談的事情變成對立'],
  },
  action: {
    positive: ['找一個平靜時段，具體說出你的感受、需求與願意承擔的部分', '延續目前有效的互動方式，並用小行動增加彼此的安全感'],
    neutral: ['先釐清哪些是你的責任、哪些需要共同協調，再進行溝通', '一次只談一個具體問題，避免把多年累積的事情同時攤開'],
    challenging: ['先暫停高張力對話，等情緒下降後再談各自的底線與可行的做法', '若衝突已超出彼此能處理的範圍，可考慮尋求可信任的第三方協助'],
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
      'interpersonal-style': '關於你的人際優勢、盲點，以及該守住的底線，牌面提醒：',
      'ally-conflict': '關於合作、支持、競爭與誤解，牌面顯示：',
    },
    caveat: '以上為牌面呈現的人際互動傾向，不能代替他人說明其真實想法，也不能斷言誰一定是貴人或敵人；請以實際的行為、溝通與相處分寸為準。',
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
    len_neutral: '互動需要時間觀察與磨合，不宜太早定義關係', len_bad: '互動中可能有防衛、誤解或利益衝突，需要保留一點距離',
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
    favor: { positive:'清楚表達與可靠行動，是建立支持關係的主要優勢', neutral:'願意傾聽並確認彼此理解，會比急著說服更有幫助', challenging:'保持一點距離、多找中立的資訊，能降低被情緒帶著走的風險' },
    risk: { positive:'關係順利時也別忽略分寸與互相，避免變成單方面付出', neutral:'容易用猜測代替確認，或為了合群壓下真實需求', challenging:'需留意被操控、被排擠、帳目不清，或一再越過你底線的行為' },
    action: { positive:'可以主動安排一次具體合作或坦白對話，累積信任', neutral:'先說明你的觀察與需求，再詢問對方的理解', challenging:'暫停高衝突互動，把事情經過留下紀錄，並明講你能接受到哪裡' },
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
/* 句尾標點統一。牌義資料裡有將近一半的句子沒有句號（例如「新的熱情與創作靈感萌芽」），
   另一半有，兩種混在同一個解讀面板裡就會看起來很隨便——甚至同一張卡片的上下兩行，
   一行有句號、一行沒有。這裡在輸出的最後一關統一補上，資料本身不動，
   因為那些句子在組裝過程中還會被接到別的句子中間，直接改資料反而會出現「。，」。 */
function polishSentence(t) {
  var s2 = refineReadingCopy(String(t == null ? '' : t)).replace(/\s+$/, '');
  if (!s2) return '';
  return '。！？」）；'.indexOf(s2.charAt(s2.length - 1)) === -1 ? s2 + '。' : s2;
}
/* 把一份子問題解讀結果的所有文字欄位一次補完句號。 */
function polishSubtopicResult(out) {
  if (!out) return out;
  ['conclusion', 'traits', 'trend', 'favor', 'risk', 'timing', 'action', 'caveat'].forEach(function (f) {
    if (out[f]) out[f] = polishSentence(out[f]);
  });
  return out;
}

function cardSubtopicReading(catKey, subtopicKey, drawnCards) {
  var out = polishSubtopicResult(cardSubtopicReadingRaw(catKey, subtopicKey, drawnCards));
  if (out && out.available) {
    out.typed = buildTypedQuestionReading(catKey, subtopicKey, drawnCards, out);
    if (out.typed && out.typed.primaryAnswer) out.conclusion = polishSentence(out.typed.primaryAnswer);
  }
  return out;
}
function cardSubtopicReadingRaw(catKey, subtopicKey, drawnCards) {
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
    out.conclusion = '從代表牌看，對方給人的感覺是「' + tag + '」；同一張牌也提醒你，' + baseMeaningZh;
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

/* ---------- question-aware reading synthesis ----------
 * The legacy result stays available for history and combined astrology. This
 * layer adds named content types, so a missing meeting scene can no longer be
 * filled by a personality sentence merely because both used `traits` before. */
var READING_MEETING_MECHANISM_BY_GROUP = {
  wands: ['你們較可能因同場活動、競賽或臨時任務開始說話。', '一方主動邀請或需要立即合作，會成為第一次接觸的理由。'],
  cups: ['共同朋友介紹，或在聚會中聊到彼此在意的事，較容易讓你們開始接觸。', '你們可能先分享感受、作品或共同興趣，再慢慢延長聯絡。'],
  swords: ['交換資訊、討論課程或處理工作問題，較可能成為開場。', '你們會先因問題需要確認而對話，之後才發現彼此聊得來。'],
  pentacles: ['共同工作、固定課程或例行往來，會讓你們有多次碰面的機會。', '一方提供實際協助，或一起完成一項任務，較容易讓關係開始。'],
  major: ['牌面沒有提供可靠的接觸方式，只能看出這次相遇會發生在人生安排改變時。'],
  len_good: ['朋友介紹、公開活動或收到邀請，較可能促成第一次接觸。'],
  len_neutral: ['你們較可能在固定生活圈多次碰面，熟悉後才開始交談。'],
  len_bad: ['第一次接觸可能源自需要處理的麻煩或突發狀況，初期不一定輕鬆。']
};
var READING_RELATION_WORDS = {
  support: ['接著','因此','也讓'], contrast: ['但','同時','問題在於'], sequence: ['先','之後','最後']
};

function readingSchemaFor(catKey, subtopicKey) {
  return READING_QUESTION_SCHEMAS[catKey] && READING_QUESTION_SCHEMAS[catKey][subtopicKey];
}

/* 牌位名稱多半自己就帶「的」（過去的影響、發展的結果），再串一個「的」會變成
   「過去的影響的『戒指』」。名稱裡已經有「的」時改用「在」。 */
function readingCardIdentity(d, isTarot) {
  var pos = d.pos.zh;
  var name = '「' + d.card.nameZh + '」' + (isTarot ? (d.reversed ? '逆位' : '正位') : '');
  return pos.indexOf('的') !== -1 ? (name + '在' + pos) : (pos + '的' + name);
}

function readingEvidence(d, isTarot) {
  var keywords = cardKws(d, isTarot).slice(0, 2).join('、');
  return readingCardIdentity(d, isTarot) + '指向' + keywords + '。';
}

function readingFocusForSchema(catKey, subtopicKey, drawnCards) {
  if (catKey === 'love') return loveFocusCard(drawnCards, subtopicKey);
  if (catKey === 'career') return careerFocusCard(drawnCards, subtopicKey);
  if (catKey === 'family') return familyFocusCard(drawnCards, subtopicKey);
  if (catKey === 'wealth') return wealthFocusCard(drawnCards, subtopicKey);
  return drawnCards[drawnCards.length - 1];
}

function addTypedSection(target, schema, contentType, text, evidence) {
  if (!text || schema.allowedContentTypes.indexOf(contentType) === -1) return;
  var cleaned = polishSentence(refineReadingCopy(text));
  var check = validateReadingContent(contentType, cleaned);
  if (!check.valid) {
    target.omitted.push({ contentType: contentType, reason: check.reason });
    return;
  }
  target.sections[contentType] = { contentType: contentType, label: READING_CONTENT_LABELS[contentType] || contentType, text: cleaned, evidence: evidence || [] };
}

function typedGroupText(contentType, group, seed) {
  if (contentType === 'partner_appearance') return traitPoolPick('appearance', group, seed + '|appearance');
  if (contentType === 'partner_traits') return traitPoolPick('personality', group, seed + '|personality');
  if (contentType === 'meeting_context') return traitPoolPick('meetScene', group, seed + '|scene');
  if (contentType === 'meeting_mechanism') {
    var mechanisms = READING_MEETING_MECHANISM_BY_GROUP[group] || READING_MEETING_MECHANISM_BY_GROUP.len_neutral;
    return mechanisms[hashStr(seed + '|mechanism') % mechanisms.length];
  }
  if (contentType === 'suitable_roles') return traitPoolPick('jobFunction', group, seed + '|roles');
  if (contentType === 'suitable_environment') return traitPoolPick('workEnvironment', group, seed + '|environment');
  if (contentType === 'employment_mode') return traitPoolPick('employmentType', group, seed + '|employment');
  if (contentType === 'money_source') {
    var source = WEALTH_SOURCE_BY_GROUP[group] || WEALTH_SOURCE_BY_GROUP.len_neutral;
    return source[hashStr(seed + '|money-source') % source.length];
  }
  return '';
}

function buildCardRelationship(drawnCards, isTarot) {
  if (!drawnCards || drawnCards.length < 2) return '';
  var first = drawnCards[0];
  var obstacle = drawnCards.filter(function (d) { return posRole(d.pos.zh) === 'obstacle'; })[0];
  var outcome = drawnCards.filter(function (d) { return posRole(d.pos.zh) === 'future'; }).slice(-1)[0] || drawnCards[drawnCards.length - 1];
  var middle = obstacle || drawnCards[Math.floor(drawnCards.length / 2)];
  var firstKw = cardKws(first, isTarot)[0];
  var middleKw = cardKws(middle, isTarot)[0];
  var outcomeKw = cardKws(outcome, isTarot)[0];
  if (middle !== outcome && (posRole(middle.pos.zh) === 'obstacle' || (isTarot && middle.reversed !== outcome.reversed))) {
    return readingCardIdentity(first, isTarot) + '先帶出' + firstKw + '；' + readingCardIdentity(middle, isTarot) + '顯示' + middleKw + '會卡住進度。但' + readingCardIdentity(outcome, isTarot) + '把後續焦點放在' + outcomeKw + '。';
  }
  return readingCardIdentity(first, isTarot) + '先帶出' + firstKw + '；' + readingCardIdentity(outcome, isTarot) + '接著把事情推向' + outcomeKw + '。';
}

function buildTypedQuestionReading(catKey, subtopicKey, drawnCards, legacy) {
  var schema = readingSchemaFor(catKey, subtopicKey);
  var out = { available:false, schema:schema || null, primaryAnswer:'', sections:{}, cardRelationship:'', evidence:[], action:'', uncertainty:'', omitted:[] };
  if (!schema || !drawnCards || !drawnCards.length) return out;
  var isTarot = typeof drawnCards[0].card.arcana !== 'undefined';
  var focus = readingFocusForSchema(catKey, subtopicKey, drawnCards);
  var group = loveCardGroup(focus.card, isTarot);
  var seed = schema.questionId + '|question=' + String(state.question || '') + '|' + drawnCards.map(function (d) { return (isTarot ? d.card.id : 'l' + d.card.n) + (d.reversed ? 'R' : 'U') + '@' + d.pos.zh; }).join('|');
  var focusEvidence = [readingEvidence(focus, isTarot)];

  schema.sectionOrder.forEach(function (contentType) {
    var text = typedGroupText(contentType, group, seed);
    if (!text && contentType === 'financial_advice') text = legacy.action || legacy.risk;
    if (!text && contentType === 'relationship_development') text = legacy.trend || legacy.conclusion;
    if (!text && contentType === 'interaction_style') text = legacy.traits || legacy.risk;
    if (!text && contentType === 'counterpart_attitude') text = legacy.conclusion;
    if (!text && contentType === 'reconciliation_conditions') text = (legacy.risk ? legacy.risk + ' ' : '') + (legacy.action || '');
    if (!text && contentType === 'longterm_relationship') text = legacy.trend || legacy.conclusion;
    if (!text && /^(family_|living_|relationship_repair|wellbeing_|social_|ally_|learning_|exam_|focus_|overall_|priority_|hidden_|next_)/.test(contentType)) {
      text = contentType === 'action' ? legacy.action : (legacy.conclusion || legacy.traits || legacy.trend);
    }
    addTypedSection(out, schema, contentType, text, focusEvidence);
  });

  var firstType = schema.sectionOrder.filter(function (key) { return !!out.sections[key]; })[0];
  out.primaryAnswer = firstType ? out.sections[firstType].text : polishSentence(refineReadingCopy(legacy.conclusion));
  out.cardRelationship = polishSentence(refineReadingCopy(buildCardRelationship(drawnCards, isTarot)));
  out.evidence = drawnCards.slice(0, Math.min(3, drawnCards.length)).map(function (d) { return readingEvidence(d, isTarot); });
  out.action = polishSentence(refineReadingCopy(legacy.action || ''));
  out.uncertainty = polishSentence(refineReadingCopy(legacy.caveat || '牌面呈現目前條件下的傾向，後續仍會受實際選擇影響。'));
  out.available = !!out.primaryAnswer;
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
    h += '<details><summary style="min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;list-style:none;font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#e6cd9a;text-transform:uppercase">✦ ' + esc(title) + '<span style="font:400 10px \'Noto Sans TC\',sans-serif;letter-spacing:0;color:rgba(240,233,216,.62);white-space:nowrap">點擊展開</span></summary>';
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.5);margin-top:2px;line-height:1.6">' + esc(subtopicDef.zh) + '</div>';
  } else {
    h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#e6cd9a;text-transform:uppercase">✦ ' + esc(title) + ' · ' + esc(subtopicDef.zh) + '</div>';
  }
  if (result.typed && result.typed.available) {
    var typed = result.typed;
    h += '<div style="margin-top:10px;padding:11px 13px;border-left:2px solid #e6cd9a;background:rgba(201,169,110,.08)">';
    h += '<div style="font:500 10px \'Noto Sans TC\',sans-serif;color:#c9a96e">直接回答</div>';
    h += '<div style="font:500 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:3px;line-height:1.8">' + esc(typed.primaryAnswer) + '</div></div>';
    h += '<div style="margin-top:10px;display:flex;flex-direction:column;gap:9px">';
    (typed.schema.sectionOrder || []).forEach(function (contentType) {
      var section = typed.sections[contentType];
      if (!section || section.text === typed.primaryAnswer) return;
      h += '<div><span style="font:500 10px \'Noto Sans TC\',sans-serif;letter-spacing:.04em;color:#c9a96e">' + esc(section.label) + '</span>';
      h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:3px;line-height:1.8">' + esc(section.text) + '</div></div>';
    });
    if (typed.cardRelationship) {
      h += '<div><span style="font:500 10px \'Noto Sans TC\',sans-serif;letter-spacing:.04em;color:#c9a96e">牌與牌怎麼互相影響</span>';
      h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:3px;line-height:1.8">' + esc(typed.cardRelationship) + '</div></div>';
    }
    if (typed.action && !Object.keys(typed.sections).some(function (key) { return typed.sections[key].text === typed.action; })) {
      h += '<div><span style="font:500 10px \'Noto Sans TC\',sans-serif;letter-spacing:.04em;color:#c9a96e">下一步可以做什麼</span>';
      h += '<div style="font:400 13px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:3px;line-height:1.8">' + esc(typed.action) + '</div></div>';
    }
    h += '</div>';
    h += '<details style="margin-top:10px"><summary style="min-height:40px;display:flex;align-items:center;cursor:pointer;font:400 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">為什麼這樣判斷</summary>';
    h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.68);line-height:1.8">';
    typed.evidence.forEach(function (line) { h += '· ' + esc(line) + '<br>'; });
    if (typed.omitted.length) h += '· 有 ' + typed.omitted.length + ' 個欄位因牌面不足或語意不符而未顯示。<br>';
    h += '</div></details>';
    if (isCombinedDetail) h += '</details>';
    h += '</div>';
    return h;
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
  h += '<details><summary style="min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;list-style:none;font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#c9a96e;text-transform:uppercase">✧ 星盤補充解讀<span style="font:400 10px \'Noto Sans TC\',sans-serif;letter-spacing:0;color:rgba(240,233,216,.62);white-space:nowrap">點擊展開</span></summary>';
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
    h += '<details style="margin-top:9px"><summary style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);cursor:pointer">本次使用的星盤依據</summary>';
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
    h += '<div style="margin-top:9px;font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.8">本次未使用：' + esc(skipText) + '</div>';
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
  return out.map(function (text) { return refineTraditionalChineseCopy(text); });
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

/* Free-form questions do not have a predefined answerTarget.  They still need
   a first sentence that answers the wording the visitor actually entered.
   For A-or-B and yes/no questions we can safely express the current direction;
   other questions get a concise status lead before the card evidence. */
function directQuestionLead(question, toneIdx, toneTxt) {
  var q = String(question || '').trim();
  if (!q) return '';
  if (q.indexOf('還是') !== -1) {
    var choices = q.replace(/[？?]\s*$/, '').split('還是');
    if (choices.length === 2) {
      var leftParts = choices[0].split(/[，,]/);
      var left = leftParts[leftParts.length - 1].replace(/^(?:這|目前|現在)?是/, '').trim();
      var right = choices[1].trim();
      if (left && right) {
        if (toneIdx === 0) return '直接回答：這組牌目前較接近「' + left + '」。';
        if (toneIdx === 2) return '直接回答：這組牌目前較接近「' + right + '」。';
        return '直接回答：現在還無法只選「' + left + '」或「' + right + '」，關鍵要看後續行動。';
      }
    }
  }
  if (/是否|能不能|會不會|要不要/.test(q)) {
    return '直接回答：' + (toneIdx === 0 ? '目前偏向「是」。' : toneIdx === 2 ? '目前偏向「否」。' : '目前條件不足，還不適合下定論。');
  }
  return '直接回答：這件事' + toneTxt + '。';
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
  /* 語氣描述改成一般人一看就懂的說法：原本的「正向與提醒交織」「能量偏向沉澱與提醒」
     是占卜圈的行話，第一次使用的人得先猜這是好是壞。 */
  var toneTxt = ['整體看起來偏順利', '有好的部分，也有需要注意的地方', '提醒的成分比較多，適合先穩住再往前'][toneIdx];
  var insights = drawInsights(drawn, isTarot);

  /* 牌位名稱本身常常已經帶「的」（「過去的影響」「發展的結果」），再接一個
     「的」就變成「過去的影響的『戒指』」。名稱有「的」時改用「在」。 */
  function cardClause(d) {
    var pos = d.pos.zh;
    var head = pos.indexOf('的') !== -1
      ? (cardLabel(d, isTarot) + '在' + pos)
      : (pos + '的' + cardLabel(d, isTarot));
    return head + '——' + roleLead(posRole(pos), cardKw(d, isTarot, 2), d);
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
  /* 用抽到的牌做雜湊挑結尾句：同一組牌永遠得到同一句（結果可重現、可回顧），
     不同組牌則會換句，不會每次都用同一段話收尾。 */
  var adviceSet = CAT_ADVICE[state.category][['positive', 'neutral', 'challenging'][toneIdx]];
  var adviceSeed = hashStr(drawn.map(function (d) { return (isTarot ? d.card.id : 'l' + d.card.n) + (d.reversed ? 'r' : 'u'); }).join('|'));
  var advice = adviceSet[adviceSeed % adviceSet.length];
  var relationship = drawn.length > 1 ? buildCardRelationship(drawn, isTarot) : '';
  var directLead = directQuestionLead(state.question, toneIdx, toneTxt);

  /* directQuestionLead 沒有題目可直接回答時會退回「這件事＋語氣」，
     開頭再寫一次「這組牌＋同一個語氣」就變成同一句話連講兩遍：
     「直接回答：這件事整體看起來偏順利。在事業上，這組牌整體看起來偏順利。」
     前面已經講過語氣時，開頭就只留領域。 */
  var leadHasTone = directLead.indexOf(toneTxt) !== -1;
  function assemble(ins, withTail, nCards) {
    var ps = parts.slice(0, nCards);
    if (withTail && tail) ps = ps.concat([tail]);
    var head;
    if (leadHasTone) head = CAT_OPENERS[state.category] + '，' + (ins.length ? ins.join('；') + '。' : '');
    else head = CAT_OPENERS[state.category] + '，這組牌' + toneTxt + (ins.length ? '；' + ins.join('；') : '') + '。';
    return refineReadingCopy(directLead + head +
      ps.join('；') + '。' + (relationship ? relationship : '') + '下一步：' + advice + '。');
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
        // 大牌陣:36 張全發，直接面朝上展開
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
  entry.kind = 'reading';
  entry.outcome = '';
  state.history = [entry].concat(state.history).slice(0, HISTORY_MAX);
  historySave();
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

/* 「複製給 AI 解讀」按下去只會把按鈕文字換成「已複製！」，然後就沒有下文了。
   第一次用的人手上握著三萬字的提示詞，畫面沒有任何地方告訴他要貼到哪裡。

   刻意做成常駐而不是「複製後才出現」：使用者在按下按鈕之前就該知道這個功能
   要搭配外部 AI 使用，否則按鈕本身的意思也不清楚。三個連結一律 noopener，
   而且只是開啟對話頁面——本站不會、也沒有能力把資料自動送出去。 */
var AI_CHAT_LINKS = [
  { zh: 'ChatGPT', url: 'https://chatgpt.com/' },
  { zh: 'Claude', url: 'https://claude.ai/new' },
  { zh: 'Gemini', url: 'https://gemini.google.com/app' },
];
function renderAiPasteHint(extraStyle) {
  var h = '<div style="margin-top:8px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);padding:10px 12px;' + (extraStyle || '') + '">';
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.72);line-height:1.75">複製後貼到任一個 AI 對話框送出即可，不需要另外下指令——提示詞裡已經寫好解讀原則。</div>';
  h += '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:7px">';
  AI_CHAT_LINKS.forEach(function (a) {
    h += '<a href="' + a.url + '" target="_blank" rel="noopener noreferrer" style="min-height:36px;display:inline-flex;align-items:center;font:500 11.5px \'Noto Sans TC\',sans-serif;color:#c9a96e;background:rgba(201,169,110,.08);border:1px solid rgba(201,169,110,.35);border-radius:18px;padding:7px 15px;text-decoration:none">' + a.zh + ' ↗</a>';
  });
  h += '</div>';
  h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.6;margin-top:7px">本站只把文字放進你的剪貼簿，不會自行傳送任何資料。要不要貼、貼給誰，由你決定。</div>';
  return h + '</div>';
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
    instruction: '請以「羅盤」的風格回答：用結構化的方式呈現，先從使用者熟悉的具體表現開始，再收束成核心判斷與可執行步驟（可用編號）；語氣理性務實，避免像診斷書或使用情緒化的形容詞。',
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
  h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-bottom:6px">解讀語氣 AI Tone</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
  AI_PERSONAS.forEach(function (p) {
    var on = state.aiPersona === p.key;
    h += '<button type="button" aria-pressed="' + on + '" onclick="setAiPersona(\'' + p.key + '\')" style="text-align:left;padding:8px 10px;border-radius:10px;border:1px solid ' + (on ? '#c9a96e' : 'rgba(201,169,110,.28)') + ';background:' + (on ? 'rgba(201,169,110,.18)' : 'rgba(255,255,255,.02)') + ';cursor:pointer">';
    h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:' + (on ? '#f0e9d8' : 'rgba(240,233,216,.72)') + '">' + esc(p.name) + '</div>';
    h += '<div style="font:400 9px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:2px;line-height:1.4">' + esc(p.tagline) + '</div>';
    h += '</button>';
  });
  h += '</div>';
  h += '</div>';
  return h;
}

function appendTypedReadingCopy(lines, subtopicDef, result) {
  if (!result || !result.available || !result.typed || !result.typed.available) return false;
  var typed = result.typed;
  lines.push('問題識別：' + typed.schema.questionId);
  lines.push('回答目標：' + typed.schema.answerTarget + '（' + typed.schema.questionFocus + '）');
  lines.push('直接回答：' + typed.primaryAnswer);
  (typed.schema.sectionOrder || []).forEach(function (contentType) {
    var section = typed.sections[contentType];
    if (!section || section.text === typed.primaryAnswer) return;
    lines.push(section.label + '：' + section.text);
  });
  if (typed.cardRelationship) lines.push('牌與牌的關係：' + typed.cardRelationship);
  if (typed.action) lines.push('可執行行動：' + typed.action);
  lines.push('牌面依據：');
  typed.evidence.forEach(function (evidence) { lines.push('- ' + evidence); });
  if (typed.omitted.length) lines.push('資料不足而省略的欄位：' + typed.omitted.map(function (x) { return x.contentType; }).join('、'));
  return true;
}

function readingAiStyleInstruction() {
  return traditionalChineseStyleInstruction() + '\n' + [
    '6. 先整合牌與牌之間的支持、衝突、前因後果或轉折，再談單張牌。沒有牌面依據就明說資料不足。',
    '7. 嚴格遵守回答目標與內容型別。場合只寫場所、活動、管道與接觸原因；外貌不改寫成個性；職位不改寫成工作環境；財運來源不改寫成理財建議。',
    '8. 所有結論都以本次牌名、正逆位、牌位與原始問題為依據。不可新增未抽到的牌、日期或保證結果。'
  ].join('\n');
}

function copyForAI() {
  var isTarot = state.deck === 'tarot';
  var spreads = currentSpreads();
  if (!state.drawn.length) return;
  var cat = CATEGORIES.find(function (x) { return x.key === state.category; });
  var focusCfg2 = topicQuestionConfig[state.category];

  /* 提示詞改由 buildReadingPayload() 驅動，每一段都標明它在解讀裡的角色，
     而不是把所有文字拼成一段問句丟過去。這樣模型知道哪個是主要回答任務、
     哪些只是優先補充、哪些只是背景，最後才不會出現「問 A 卻大篇幅回答 B」。 */
  var wizFocus = (state.wizFocusSel && state.wizFocusSel[state.category]) || [];
  var taxPrimary = (typeof taxonomyActiveFor === 'function')
    ? taxonomyActiveFor(state.category, state.subtopic) : null;
  var payload = (typeof buildReadingPayload === 'function') ? buildReadingPayload({
    categoryId: state.category,
    primaryId: taxPrimary ? taxPrimary.id : null,
    spreadId: state.spread,
    readingMode: state.readingMode,
    focusIds: wizFocus.map(function (label) {
      return (typeof taxonomyFocusIdByLabel === 'function') ? taxonomyFocusIdByLabel(label) : null;
    }).filter(Boolean),
    customContext: state.question || '',
    cards: state.drawn,
    astrologyContext: state.astroResult ? { present: true } : null,
  }) : null;

  var lines = [];
  lines.push('占卜類型：' + (isTarot ? '塔羅牌 Tarot' : '雷諾曼牌 Lenormand'));
  lines.push('資料來源：' + (payload && payload.readingMode === 'tarot_and_natal'
    ? '這次抽到的牌 ＋ 使用者的本命星盤（星盤只作輔助，不得蓋過牌面）'
    : '只有這次抽到的牌（本次不使用任何星盤資料）'));
  if (cat) lines.push('問題領域：' + cat.zh + ' (' + cat.en + ')');
  if (state.target) lines.push('對象：' + state.target);

  /* 主要回答任務。taxonomy 有對應時附上 intent，讓模型知道這題要回答什麼型態的問題。 */
  if (taxPrimary) {
    lines.push('主要問題（這次最需要回答的）：' + taxPrimary.label);
    lines.push('　問題意圖 intent：' + taxPrimary.intent);
    var assume = Object.keys(taxPrimary.assumptions || {}).filter(function (k) { return taxPrimary.assumptions[k]; });
    if (assume.length) lines.push('　這題的前提：' + assume.join('、') + '（不符合前提的內容不要寫）');
  }
  /* 優先補充內容。 */
  if (wizFocus.length) {
    lines.push('優先補充的面向（次於主要問題）：');
    wizFocus.forEach(function (f, fi) { lines.push('　' + (fi + 1) + '. ' + f); });
  }
  /* 現實背景——只用來提高精度，不得因此自行擴充主題。 */
  if (state.question) lines.push('使用者補充的現實背景：' + state.question);

  var activeSchema = readingSchemaFor(state.category, state.subtopic);
  if (activeSchema) {
    lines.push('questionId：' + activeSchema.questionId);
    lines.push('intent：' + activeSchema.intent);
    lines.push('questionFocus：' + activeSchema.questionFocus);
    lines.push('answerTarget：' + activeSchema.answerTarget);
    lines.push('允許內容型別：' + activeSchema.allowedContentTypes.join('、'));
    lines.push('排除內容型別：' + activeSchema.excludedContentTypes.join('、'));
  }
  var safety = (typeof QUESTION_TAXONOMY !== 'undefined' && QUESTION_TAXONOMY[state.category])
    ? (QUESTION_TAXONOMY[state.category].safetyRules || []) : [];
  if (safety.length) {
    lines.push('安全規則（必須遵守）：');
    safety.forEach(function (r) { lines.push('　・' + r); });
  }
  lines.push('牌陣：' + spreads[state.spread].zh + ' (' + spreads[state.spread].en + ')');
  /* 有具體問題或有選面向時，才附上給 AI 的解讀原則——避免每一次「未填寫、以通用方式解讀」
     的複製結果都多出一段用不到的指示。健康／財運分類另外一律附加免責聲明（riskNotice），
     不受這個條件影響，只要是這兩個分類就一定會出現。 */
  lines.push('');
  lines.push('【輸出優先級】');
  lines.push('1. 先回答「主要問題」，並且要有明確結論，不能只鋪陳。');
  lines.push('2. 再回應「優先補充的面向」，每項簡短即可，不要為了逐條回答而變成長篇清單。');
  lines.push('3.「使用者補充的現實背景」只用來提高情境精度，不要因此自行增加沒有被問的主題。');
  lines.push('4. 牌面是主要證據；證據不足時要說明不確定，不要硬下定論。');
  if (payload && payload.readingMode === 'tarot_and_natal') {
    lines.push('5. 星盤只是輔助證據，用來補充傾向；結論仍以牌面為主，不得讓星盤蓋過牌。');
  } else {
    lines.push('5. 本次沒有星盤資料，不要推測使用者的星座、命盤或人格分類。');
  }
  if (wizFocus.length || state.question) {
    lines.push('');
    lines.push('【其他注意事項】');
    lines.push('1. 請優先回答「使用者補充的現實背景」中提到的實際狀況。');
    if (wizFocus.length) lines.push('2. 再依序回應「想深入了解的面向」列出的項目，不要把它們拆成互不相關的分段解讀，請整合牌面形成一個有主軸的答案。');
    if (focusCfg2 && focusCfg2.riskNotice) lines.push((wizFocus.length ? '3' : '2') + '. ' + focusCfg2.riskNotice + '請勿做出確定性的醫療診斷、投資保證或法律判斷。');
  }
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
  if (isTarot && state.spread === 'yesno') {
    var _yn = yesNoVerdict(state.drawn);
    lines.push('是／否傾向：' + _yn.label + '（正位 ' + _yn.upright + ' 張／逆位 ' + _yn.reversed + ' 張）');
    lines.push('判讀提醒：這是目前條件的象徵性傾向，不是結果保證；請綜合三張牌說明答案成立的條件、阻力與可採取的行動。');
  }
  /* Phase 1A/1C：純新增段落，只有愛情分類且選了具體子問題時才會輸出，不影響既有輸出內容。
     combined 模式（且有 state.astroResult）時，額外附加星盤依據與綜合觀察段落。 */
  if (state.category === 'love' && state.subtopic) {
    var loveSubDef2 = (SUBTOPICS.love || []).filter(function (s) { return s.key === state.subtopic; })[0];
    var subRes = loveSubDef2 ? cardSubtopicReading('love', state.subtopic, state.drawn) : null;
    if (subRes && subRes.available) {
      lines.push('');
      lines.push('具體問題解讀（牌卡）：' + loveSubDef2.zh);
      appendTypedReadingCopy(lines, loveSubDef2, subRes);
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
      appendTypedReadingCopy(lines, careerSubDef2, careerRes2);
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
      appendTypedReadingCopy(lines, familySubDef2, familyRes2);
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
      appendTypedReadingCopy(lines, wealthSubDef2, wealthRes2);
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
      appendTypedReadingCopy(lines, remSubDef2, remCardRes2);
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
  lines.push(personaInstructionLine());
  lines.push(readingAiStyleInstruction());
  lines.push('請先用一句話直接回答原始問題，再依牌陣位置整合各牌。最後只保留一項能在現實中執行的下一步。');
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
  h += '<h2 style="font:600 18px \'Noto Serif TC\',serif;color:#f0e9d8;text-align:center;margin:0">牌義典藏</h2>';
  h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.62);text-align:center;margin-top:2px">Card Meaning Library</div>';

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
    h += '<div style="flex:none;width:130px;aspect-ratio:150/230;border-radius:8px;border:1px solid #d8b96c;overflow:hidden;background:#f2e9d8;display:flex;flex-direction:column">' + cardImgHtml(detail.img, detail.nameZh, true) + '</div>';
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font:600 12px \'Noto Serif TC\',serif;color:#c9a96e">' + esc(libIsTarot ? detail.num : detail.n) + '</div>';
    h += '<div style="font:600 20px \'Noto Serif TC\',serif;color:#f0e9d8;margin-top:2px">' + esc(detail.nameZh) + '</div>';
    h += '<div style="font:italic 12px \'EB Garamond\',serif;color:rgba(240,233,216,.5)">' + esc(detail.nameEn) + '</div>';
    if (!libIsTarot && LEN_RICH[detail.n]) {
      var lr0 = LEN_RICH[detail.n];
      var toneColor = lr0.tone === '吉' ? '#9fce9f' : (lr0.tone === '凶' ? '#d99b5f' : 'rgba(240,233,216,.6)');
      h += '<div style="margin-top:8px"><span style="display:inline-block;font:500 10px \'Noto Sans TC\',sans-serif;border:1px solid ' + toneColor + ';color:' + toneColor + ';border-radius:10px;padding:2px 9px">傾向 ' + lr0.tone + '</span>';
      h += '<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-left:8px">對應撲克：' + lr0.pc + '</span></div>';
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
        h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:11px">經典組合</div>';
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

/* ================= 歷史紀錄：型別與「後來呢？」 =================
   歷史原本只收占卜。星盤的人生主題分析要花力氣選主題、挑題目、等運算，
   關掉分頁卻什麼都不留——使用者沒辦法回頭確認「當時它說了什麼」。

   向後相容規則（舊使用者本機已有最多 30 筆舊紀錄）：
     · 舊紀錄沒有 kind 欄位，一律視為 'reading'
     · 舊紀錄沒有 outcome 欄位，一律視為空字串
     · 兩種型別共用同一個 tl_history 與同一個上限，不另開 storage key
   任何讀取端都必須走下面這兩個 helper，不得直接讀 entry.kind／entry.outcome。 */
function historyEntryKind(entry) { return (entry && entry.kind === 'natal') ? 'natal' : 'reading'; }
function historyEntryOutcome(entry) { return (entry && typeof entry.outcome === 'string') ? entry.outcome : ''; }

var HISTORY_MAX = 30;
var HISTORY_OUTCOME_MAX = 500;
function historySave() {
  try { localStorage.setItem('tl_history', JSON.stringify(state.history)); } catch (e) {}
}
/* 使用者事後回填實際發生的事。占卜工具能不能被信任，取決於使用者回得去比對；
   這個欄位是唯一能讓「上次它說對了」變成可見證據的地方。 */
function historySetOutcome(idx, text) {
  var entry = state.history[idx];
  if (!entry) return;
  entry.outcome = String(text || '').slice(0, HISTORY_OUTCOME_MAX);
  entry.outcomeAt = entry.outcome ? new Date().toISOString() : '';
  historySave();
  render();
}
function historyOutcomeInputId(idx) { return 'history-outcome-' + idx; }
function historySaveOutcomeFromInput(idx) {
  var el = document.getElementById(historyOutcomeInputId(idx));
  if (el) historySetOutcome(idx, el.value);
}
/* 回填區塊。刻意用 onchange（失焦才存）而不是 oninput——oninput 每打一個字就
   render() 會把 textarea 整個重建，游標會跳掉。 */
function renderHistoryOutcome(idx, entry) {
  var outcome = historyEntryOutcome(entry);
  var h = '<div style="margin-top:12px;border-top:1px solid rgba(201,169,110,.15);padding-top:10px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">';
  h += '<span style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">後來呢？</span>';
  if (outcome && entry.outcomeAt) h += '<span style="font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62)">' + fmtDate(entry.outcomeAt) + ' 記錄</span>';
  h += '</div>';
  h += '<div style="font:400 10.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.6;margin-top:3px">寫下後來實際發生的事。下次回頭看，你才知道當時的解讀對上了哪些、沒對上哪些。只存在這台裝置。</div>';
  h += '<textarea id="' + historyOutcomeInputId(idx) + '" maxlength="' + HISTORY_OUTCOME_MAX + '" aria-label="記錄後來實際發生的事"'
    + ' onchange="historySetOutcome(' + idx + ',this.value)"'
    + ' placeholder="例如：兩週後對方主動聯絡了，跟牌面說的差不多"'
    + ' style="width:100%;box-sizing:border-box;margin-top:7px;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.3);border-radius:10px;padding:10px 12px;font:400 12px \'Noto Sans TC\',sans-serif;color:#f0e9d8;outline:none;min-height:64px;resize:vertical">'
    + esc(outcome) + '</textarea>';
  h += '<div style="display:flex;justify-content:flex-end;margin-top:6px"><button type="button" onclick="historySaveOutcomeFromInput(' + idx + ')" style="min-height:36px;font:500 11px \'Noto Sans TC\',sans-serif;background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;padding:7px 16px;border-radius:16px;cursor:pointer">儲存</button></div>';
  return h + '</div>';
}

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
    if (result.typed && result.typed.available) {
      appendTypedReadingCopy(lines, { zh: st.zh || st.key || '' }, result);
      return;
    }
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
  var typedResult = (st.cardReading || st.reading);
  if (typedResult && typedResult.typed && typedResult.typed.available) {
    return renderSubtopicResultPanel({ zh: st.zh || st.key || '', fields: [] }, typedResult, '直接回答這個問題');
  }
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
  lines.push(personaInstructionLine());
  lines.push(readingAiStyleInstruction());
  lines.push('請先直接回答原始問題，再說明牌位之間的關係。只補充能由這次抽牌追溯的內容。');
  var text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(historyFlashCopied).catch(function () { fallbackCopy(text, historyFlashCopied); });
  } else {
    fallbackCopy(text, historyFlashCopied);
  }
}

/* 星盤主題分析的歷史詳細頁。刻意跟占卜的詳細頁分開：那一頁是為牌陣寫的
   （牌卡、組牌、牌陣分析），星盤紀錄套上去會留下一整排空區塊。 */
function renderHistoryNatalDetail(e, idx) {
  var dt = e.detail || {};
  var h = '<div style="margin-top:20px">';
  h += '<button onclick="histClose()" style="min-height:36px;background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;font:400 12px \'Noto Sans TC\',sans-serif;padding:7px 16px;border-radius:16px;cursor:pointer">‹ 返回列表 Back</button>';
  h += '<div style="text-align:center;margin-top:16px">';
  h += '<div style="font:500 13px \'Noto Sans TC\',sans-serif;color:#c9a96e">人生主題分析 · ' + esc(e.spreadLabel || '') + '</div>';
  h += '<div style="font:400 11px \'EB Garamond\',serif;color:rgba(240,233,216,.62);margin-top:3px">' + fmtDate(e.date) + '</div>';
  h += '</div>';

  /* 當時用的是哪一組出生資料。使用者可能已經改過盤，沒有這一段就無從判斷
     這份舊解讀還算不算數。 */
  if (dt.birth) {
    h += '<div class="md-chartbar" style="margin-top:14px">';
    h += '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">';
    h += '<span style="font:500 11px \'Noto Sans TC\',sans-serif;color:#c9a96e">當時使用的命盤</span>';
    h += '<span class="md-kind md-kind--fact">排盤資料</span></div>';
    h += '<div style="font:500 12.5px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:4px">' + esc(dt.birth.date || '') + '　' + esc(dt.birth.time || '') + '　' + esc(dt.birth.city || '') + '</div>';
    h += '<div class="md-chartbar__row"><span class="md-chartbar__item">時區 <b>' + esc(dt.birth.tz || '') + '</b></span>'
      + '<span class="md-chartbar__item">宮位制 <b>' + esc(dt.birth.houseSystem || '') + '</b></span></div>';
    if (dt.birth.unknownTime) h += '<div style="margin-top:6px;font:400 10.5px \'Noto Sans TC\',sans-serif;color:#d9a0a0;line-height:1.7">△ 當時未提供出生時間，上升、天頂與宮位未納入。</div>';
    h += '</div>';
  }

  if (dt.overview) {
    h += '<div style="border:1px solid rgba(201,169,110,.4);border-radius:10px;padding:15px 17px;background:rgba(201,169,110,.09);margin-top:14px">';
    h += '<div style="font:500 11px \'Noto Sans TC\',sans-serif;letter-spacing:.1em;color:#e6cd9a">✦ 主題總覽</div>';
    h += '<div style="font:400 12.5px \'Noto Sans TC\',sans-serif;color:#f0e9d8;margin-top:8px;line-height:1.85">' + esc(dt.overview) + '</div>';
    h += '</div>';
  }

  (dt.answers || []).forEach(function (a) {
    h += '<div style="margin-top:12px;border:1px solid rgba(201,169,110,.28);border-radius:14px;padding:15px 16px;background:rgba(255,255,255,.025)">';
    h += '<h4 style="font:500 11px \'Noto Sans TC\',sans-serif;color:rgba(201,169,110,.85);margin:0">' + esc(a.title) + '</h4>';
    h += '<div style="font:600 14.5px \'Noto Serif TC\',serif;color:#e6cd9a;margin-top:6px;line-height:1.6">' + esc(a.headline) + '</div>';
    if (a.summary) h += '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.75;margin-top:6px">' + esc(a.summary) + '</div>';
    (a.details || []).forEach(function (d) {
      h += '<div style="border-left:2px solid rgba(201,169,110,.35);padding-left:9px;margin-top:9px">'
        + '<span style="font:500 10.5px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + esc(d.label) + '</span>'
        + '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.75;margin-top:2px">' + esc(d.text) + '</div></div>';
    });
    if (a.caution) h += '<div style="margin-top:10px;display:flex;gap:7px;align-items:flex-start"><span style="flex:none;font:500 10px \'Noto Sans TC\',sans-serif;color:#d9a0a0;background:rgba(214,120,120,.12);border-radius:8px;padding:2px 7px;margin-top:1px">實用提醒</span><div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.68);line-height:1.75">' + esc(a.caution) + '</div></div>';
    h += '</div>';
  });

  h += renderHistoryOutcome(idx, e);
  h += '</div>';
  return h;
}

function renderHistory() {
  var h = '';
  h += '<div style="padding:0 20px">';
  h += '<h2 style="font:600 18px \'Noto Serif TC\',serif;color:#f0e9d8;text-align:center;margin:0">我的紀錄</h2>';
  h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.62);text-align:center;margin-top:2px">Reading &amp; Chart History</div>';

  // ---- detail view: full replay of a past reading ----
  if (state.histSelected !== null && state.history[state.histSelected]) {
    var e = state.history[state.histSelected];
    /* 星盤主題分析走另一套版面：它沒有牌、沒有牌陣、沒有組牌，
       硬套占卜的詳細頁會出現一整排空區塊。 */
    if (historyEntryKind(e) === 'natal') return h + renderHistoryNatalDetail(e, state.histSelected) + '</div>';
    var dt = e.detail;
    h += '<div style="margin-top:20px">';
    h += '<button onclick="histClose()" style="background:none;border:1px solid rgba(201,169,110,.4);color:#c9a96e;font:400 12px \'Noto Sans TC\',sans-serif;padding:7px 16px;border-radius:16px;cursor:pointer">‹ 返回列表 Back</button>';
    h += '<div style="text-align:center;margin-top:16px">';
    h += '<div style="font:500 13px \'Noto Sans TC\',sans-serif;color:#c9a96e">' + esc(e.typeLabel) + ' · ' + esc(e.spreadLabel) + (e.categoryLabel ? ' · ' + esc(e.categoryLabel) : '') + '</div>';
    h += '<div style="font:400 11px \'EB Garamond\',serif;color:rgba(240,233,216,.62);margin-top:3px">' + fmtDate(e.date) + '</div>';
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
        if (cd.rev !== null && cd.rev !== undefined) h += '<div style="font:400 10px \'EB Garamond\',serif;color:rgba(240,233,216,.62)">' + (cd.rev ? '逆位 Reversed' : '正位 Upright') + '</div>';
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
      h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.6);margin-top:18px;line-height:1.8;text-align:center">' + esc(e.summary) + '<br><span style="color:rgba(240,233,216,.62);font-size:11px">（此為舊格式紀錄，僅保留摘要）</span></div>';
    }
    h += renderHistoryOutcome(state.histSelected, e);
    h += renderPersonaPicker();
    h += '<button id="hist-copy-btn" onclick="historyCopyForAI()" style="width:100%;margin-top:22px;padding:12px;border-radius:12px;border:1px solid #c9a96e;background:rgba(201,169,110,.12);color:#e6cd9a;font:500 13px \'Noto Sans TC\',sans-serif;cursor:pointer">複製給 AI 解讀 Copy for AI</button>';
    h += renderAiPasteHint();
    h += '</div></div>';
    return h;
  }

  // ---- list view ----
  if (state.history.length) {
    h += '<div style="text-align:center;font:400 10px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);margin-top:10px">占卜與星盤主題分析都會存在這裡。點開任一筆可以回看完整解讀，並記錄後來實際發生的事。</div>';
    h += '<div style="display:flex;flex-direction:column;gap:12px;margin-top:14px">';
    state.history.forEach(function (e, idx) {
      /* 整張紀錄卡原本是 <div onclick>：滑鼠可以點，但鍵盤與螢幕閱讀器完全用不到。
         改成 role=button + tabindex + Enter/空白鍵處理，維持原本的外觀與排版。 */
      var isNatal = historyEntryKind(e) === 'natal';
      var outcomeText = historyEntryOutcome(e);
      h += '<div role="button" tabindex="0" aria-label="查看這筆' + (isNatal ? '星盤主題分析' : '占卜') + '紀錄的完整解讀" onclick="histOpen(' + idx + ')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();histOpen(' + idx + ')}" style="border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:14px 16px;background:rgba(255,255,255,.02);cursor:pointer">';
      h += '<div style="display:flex;justify-content:space-between;align-items:baseline">';
      h += '<div style="font:500 12px \'Noto Sans TC\',sans-serif;color:#c9a96e;display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
        + '<span style="font-size:10px;border:1px solid ' + (isNatal ? 'rgba(143,199,244,.5)' : 'rgba(201,169,110,.45)') + ';color:' + (isNatal ? '#8fc7f4' : '#c9a96e') + ';border-radius:8px;padding:2px 7px">' + (isNatal ? '星盤' : '占卜') + '</span>'
        + '<span>' + esc(e.typeLabel) + ' · ' + esc(e.spreadLabel) + (e.categoryLabel && !isNatal ? ' · ' + esc(e.categoryLabel) : '') + '</span></div>';
      h += '<div style="font:400 10px \'EB Garamond\',serif;color:rgba(240,233,216,.62)">' + fmtDate(e.date) + '</div>';
      h += '</div>';
      if (e.question || e.target) h += '<div style="font:italic 11px \'EB Garamond\',serif;color:rgba(240,233,216,.62);margin-top:4px">' + (e.target ? '關於「' + esc(e.target) + '」' : '') + (e.question ? '「' + esc(e.question) + '」' : '') + '</div>';
      h += '<div style="font:400 12px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);margin-top:6px;line-height:1.6">' + esc(e.summary) + '</div>';
      if (outcomeText) {
        h += '<div style="margin-top:8px;border-left:2px solid rgba(155,197,163,.5);padding-left:9px">'
          + '<span style="font:500 10px \'Noto Sans TC\',sans-serif;color:#9bc5a3">後來</span>'
          + '<div style="font:400 11.5px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.75);line-height:1.6;margin-top:2px">' + esc(outcomeText.length > 60 ? outcomeText.slice(0, 60) + '…' : outcomeText) + '</div></div>';
      }
      if (e.detail) h += '<div style="font:400 10px \'Noto Sans TC\',sans-serif;color:#c9a96e;margin-top:7px">' + (outcomeText ? '查看完整解讀 →' : '查看完整解讀・記錄後來發生的事 →') + '</div>';
      h += '</div>';
    });
    h += '</div>';
  } else {
    h += '<div style="text-align:center;margin-top:60px;font:italic 13px \'EB Garamond\',serif;color:rgba(240,233,216,.62)">還沒有紀錄。占卜結果與人生主題分析都會自動存在這裡，之後可以回頭比對。</div>';
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
  if (tab !== 'astro') state.returnToReadingAfterAstro = false;
  state.tab = tab;
  state.histSelected = null;
  state.libQuiz = false;
  if (deck) state.deck = deck;
  resetReading();
  /* 占卜與牌典一定會用到完整牌義；正常情況下首頁載入後的空檔就已經補載完成，
     這裡再保險呼叫一次（已載入時是同步的 no-op），避免使用者直接開這兩個分頁時
     只看到降級的短牌義。載入完成後載入器會自己重畫。 */
  if ((tab === 'reading' || tab === 'library') && typeof ensureReadingRichLoaded === 'function') {
    ensureReadingRichLoaded().catch(function () {});
  }
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

/* selectSpread()／selectCategory() 是四步驟精靈上線前的舊選擇器入口，
   現在由 wizSetSpread()／wizSetCat() 取代，全站已無任何呼叫，予以移除。 */
function setLibDeck(d) { state.libDeck = d; state.libSuit = 'all'; state.libSelected = null; state.libQuiz = false; render(); }
function setLibSuit(su) { state.libSuit = su; state.libSelected = null; render(); }
function selectLibCard(key) { state.libSelected = key; render(); window.scrollTo(0, 0); }
function closeLibCard() { state.libSelected = null; render(); }

/* 每個底部導覽項目的簡易線條圖示，用 currentColor 跟按鈕本身的
   active/inactive 顏色連動，不需要額外的圖片資源。 */
var NAV_ICONS = {
  home: '<path d="M3 9.5L10 3l7 6.5"/><path d="M5 8.5V16.5a1 1 0 0 0 1 1h3v-5h2v5h3a1 1 0 0 0 1-1V8.5"/>',
  reading: '<rect x="4" y="5" width="8" height="12" rx="1.5" transform="rotate(-8 8 11)"/><rect x="8" y="5" width="8" height="12" rx="1.5" transform="rotate(8 12 11)"/>',
  astro: '<circle cx="10" cy="10" r="7"/><path d="M10 3v14M3 10h14"/><circle cx="13.3" cy="7" r="1.1" fill="currentColor" stroke="none"/>',
  library: '<path d="M3 4.5c1.5-1 3.5-1 5 0v11c-1.5-1-3.5-1-5 0v-11Z"/><path d="M17 4.5c-1.5-1-3.5-1-5 0v11c1.5-1 3.5-1 5 0v-11Z"/>',
  more: '<circle cx="4" cy="10" r="1.6" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="1.6" fill="currentColor" stroke="none"/><circle cx="16" cy="10" r="1.6" fill="currentColor" stroke="none"/>',
};
function renderNav() {
  var navDef = [
    { key: 'home', zh: '首頁' },
    { key: 'reading', zh: '占卜' },
    { key: 'astro', zh: '星盤' },
    { key: 'library', zh: '牌典' },
    { key: 'more', zh: '更多' },
  ];
  var activeTab = state.tab;
  var h = '';
  navDef.forEach(function (n) {
    var active = activeTab === n.key || (n.key === 'more' && state.tab === 'history');
    var onclick = n.key === 'reading' ? "go('reading',state.deck)" : "go('" + n.key + "')";
    /* aria-current="page"：目前分頁在視覺上只用顏色深淺區分，螢幕閱讀器與高對比模式
       看不出差別，補上這個屬性才會念出「目前頁面」。 */
    h += '<button onclick="' + onclick + '"' + (active ? ' aria-current="page"' : '') + ' style="flex:1;background:none;border:none;padding:12px 6px 12px;cursor:pointer;color:' + (active ? '#f0e9d8' : 'rgba(240,233,216,.68)') + ';text-align:center">';
    h += '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 2px" aria-hidden="true">' + NAV_ICONS[n.key] + '</svg>';
    h += '<div style="font:500 13px \'Noto Sans TC\',sans-serif">' + n.zh + '</div>';
    h += '</button>';
  });
  document.getElementById('nav').innerHTML = h;
}

function renderMore() {
  var h = '<div style="padding:8px 24px 24px"><h2 style="font:600 18px \'Noto Serif TC\',serif;color:#f0e9d8;margin:0 0 16px">更多功能</h2>';
  var items = [
    ['占卜歷史紀錄','Review Past Readings',"go('history')"],
    ['新手使用指南','Beginner Guide',"openBeginnerGuide()"],
    ['隱私與資料管理','Privacy & Data',"openMoreAbout()"]
  ];
  var itemsHtml = '';
  items.forEach(function (it) { itemsHtml += '<button onclick="' + it[2] + '" style="width:100%;display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.02);border:1px solid rgba(201,169,110,.28);color:#f0e9d8;padding:14px 15px;border-radius:10px;margin-bottom:9px;cursor:pointer;text-align:left"><span>' + it[0] + '<span style="display:block;font:italic 10px \'EB Garamond\',serif;opacity:.45;margin-top:2px">' + it[1] + '</span></span><span aria-hidden="true">›</span></button>'; });
  h += itemsHtml;
  /* 「新手使用指南」按下去就在這裡展開，不換頁——同一張卡片，關閉行為換成
     只收起這一頁的展開狀態，不影響首頁那張「第一次來嗎」的已讀記錄。 */
  if (state.moreTourOpen) h += renderHomeTourCard('closeBeginnerGuide()');
  h += '<div style="font:400 11px \'Noto Sans TC\',sans-serif;color:rgba(240,233,216,.62);line-height:1.8;margin-top:18px">占卜內容僅供自我探索與娛樂參考；健康、財務與法律問題請諮詢合格專業人士。</div>';
  /* 關於本站／隱私／清除資料原本只藏在首頁「更多功能」展開後才看得到；
     底部導覽列「更多」是更常被點的入口，這裡也要能直接找到 */
  h += '<div id="more-about-section">' + renderAbout() + '</div>';
  h += '</div>';
  return h;
}

/* 星盤模組（js/data/astro-advanced.js）還在下載時的占位畫面。用字與樣式跟
   astro-advanced.js 裡 renderAstro() 自己的載入／失敗提示保持一致，
   讓使用者不會察覺畫面其實是由兩段不同的程式碼畫出來的。 */
function renderAstroLoading() {
  var failed = (typeof astrologyDataLoadPromise !== 'undefined') && astrologyDataLoadPromise === null;
  var msg = failed ? '星盤功能載入失敗，請檢查網路連線後重新整理頁面。' : '星盤功能載入中…';
  return '<div style="padding:70px 20px;text-align:center;color:rgba(240,233,216,.5);font:400 13px \'Noto Sans TC\',sans-serif">' + msg + '</div>';
}

function render() {
  var view = document.getElementById('view');
  if (state.tab === 'home') document.body.classList.add('is-home');
  else document.body.classList.remove('is-home');
  /* 使用者可能是先逛別的分頁才回到首頁；影片只在真的看到首頁時才注入一次。 */
  if (state.tab === 'home' && typeof maybeInjectHomeAmbient === 'function') maybeInjectHomeAmbient();
  if (state.tab === 'home') view.innerHTML = renderHome();
  else if (state.tab === 'reading') view.innerHTML = renderReading();
  /* renderAstro() 現在住在延後載入的 astro-advanced.js 裡。go('astro') 會先觸發載入、
     再立刻畫一次（讓分頁切換有即時回應），那一瞬間函式還不存在，所以這裡要判斷；
     載入完成後 go() 會再呼叫一次 render()，畫面就會換成真正的星盤內容。 */
  else if (state.tab === 'astro') view.innerHTML = (typeof renderAstro === 'function') ? renderAstro() : renderAstroLoading();
  else if (state.tab === 'library') view.innerHTML = renderLibrary();
  else if (state.tab === 'history') view.innerHTML = renderHistory();
  else if (state.tab === 'more') view.innerHTML = renderMore();
  renderNav();
}

/* 本命星盤計算與畫面、出生資料輸入表單、行運基礎 已移到 js/data/astro-advanced.js（見檔頭說明）。 */

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
    major: ['這張是大牌，講的是這段關係走到哪個階段，不是某個人，年齡請以你實際知道的為準', '大牌不描述個人條件，年齡這一項牌面沒有答案，不需要硬從象徵推回去', '牌面說的是這件事對你有多重要，不是對方幾歲'],
  },
  appearance: {
    wands: ['氣質偏向陽光、有活力，給人熱情主動的第一印象', '外在可能帶點率性與衝勁，眼神或談吐透露出行動派的氣場', '整體氣質明亮、有存在感，容易在人群中被注意到'],
    cups: ['氣質溫柔、帶有情感豐富的感覺，眼神容易流露真實情緒', '外在給人親切、有同理心的印象，相處起來讓人感覺被理解', '整體氛圍柔和、浪漫，可能帶著藝術或感性的氣息'],
    swords: ['氣質俐落、理性，談吐清晰，給人聰明幹練的印象', '外在可能顯得有點距離感或冷靜，但思路清楚、有主見', '整體氣場偏向知性，眼神銳利，善於觀察與分析'],
    pentacles: ['氣質沉穩務實，給人可靠、安定的第一印象', '外在打扮偏向簡單實在，不追求浮誇，讓人感覺踏實', '整體氛圍低調穩重，行事作風腳踏實地'],
    major: ['這張是大牌，畫的是處境而不是長相，外型這一項牌面給不出具體描述', '大牌不講五官或穿著，唯一能說的是：這個人在你心裡的分量比一般認識的人重', '外型看不出來，但牌面顯示你對這個人的印象很強烈、不容易忽略'],
    len_good: ['氣質明亮開朗，給人容易親近、舒服自在的感覺', '整體氛圍正向、溫暖，相處起來讓人感覺輕鬆', '外在氣場帶著好運與生氣，容易讓人產生好感'],
    len_neutral: ['氣質偏向低調內斂，需要多相處才會慢慢認識真實的一面', '外在給人的印象中規中矩，特質需要花時間觀察才會顯現', '整體氛圍平實不張揚，第一印象可能普通但耐看'],
    len_bad: ['氣質可能帶點防備或疏離感，需要時間才能卸下心防', '外在或第一印象可能不容易掌握，帶著一些神秘或難以捉摸的成分', '整體氛圍偏向沉重或複雜，相處初期可能需要多一點耐心理解'],
  },
  personality: {
    wands: ['個性直接、有行動力，喜歡主動追求、不喜歡拖泥帶水', '相處起來充滿活力，但也可能因為急躁而需要多留意耐心', '個性樂觀進取，容易帶動關係的節奏往前推進'],
    cups: ['個性感性、重視情感連結，相處時很在意彼此的感受', '容易投入感情，也期待對方能給予相對的情感回應', '個性體貼細膩，但也可能因為太敏感而容易多想'],
    swords: ['個性理性、重視溝通的邏輯，喜歡把話說清楚', '相處起來可能較有距離感，需要透過對話慢慢建立信任', '個性獨立、有主見，也可能因為太直接而顯得少了點溫度'],
    pentacles: ['個性務實穩定，重視關係中實際的付出與長期的安全感', '相處步調偏慢但踏實，喜歡用行動而非言語證明心意', '個性可靠負責，但也可能因為太謹慎而錯過表達心意的時機'],
    major: ['性格這一項牌面沒有給細節，只能說相處起來不會是平淡無波的那種', '大牌講的是主題不是個性，對方是什麼樣的人，建議直接從實際互動觀察', '牌面沒有指出具體性格，但暗示這段關係會碰到比日常相處更難處理的題目'],
    len_good: ['個性開朗隨和，相處起來輕鬆自在，容易一拍即合', '相處模式傾向正向支持，願意主動維繫這段關係', '個性帶著好運與熱情，容易讓關係順勢往好的方向發展'],
    len_neutral: ['個性中規中矩，相處模式需要雙方一起慢慢磨合出默契', '對關係的態度不算積極也不算消極，走向取決於後續互動', '相處起來平穩，但也提醒別因為太習慣而忽略經營'],
    len_bad: ['個性可能帶著一些糾結或防衛，相處上需要更多耐心與溝通', '相處模式可能出現反覆或猶豫，建議把話說開會比悶著更好', '這段互動可能存在需要留意的課題，別急著下定論，先觀察再說'],
  },
  jobType: {
    wands: ['工作型態可能偏向業務、創業或需要主動出擊的行業', '較可能從事步調快、需要衝勁與行動力的工作環境', '職業類型或許與推廣、開發、體能相關的領域有關'],
    cups: ['工作型態可能與人際、關懷、藝術或情感相關的領域有關', '較可能從事需要同理心與溝通的工作，例如助人、創作或服務業', '職業類型或許與美感、療癒或情感陪伴相關的領域有關'],
    swords: ['工作型態可能偏向需要邏輯分析、規劃或溝通協調的領域', '較可能從事與資訊、法律、教育或策略相關的工作', '職業類型或許需要清晰思路與精準表達，例如專業顧問類角色'],
    pentacles: ['工作型態可能偏向穩定務實，例如財務、工程或管理相關領域', '較可能從事需要長期累積、講求實際成果的工作', '職業類型或許與資源管理、不動產或傳統產業有關'],
    major: ['職業這一項牌面沒有指向特定行業，直接問或觀察會比從牌面推測準確', '大牌對應的是角色而不是職稱，可能是帶頭、開創或正在換跑道的位置', '做什麼工作看不出來，牌面顯示的是這個人正站在事業的轉折點上'],
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
    major: ['金錢這一項牌面沒有具體線索，收入與花錢習慣建議從實際相處判斷', '大牌不談收支數字，只顯示這個人的財務正在變動或重新整理', '理財風格看不出來，牌面指的是價值觀在改變，而不是金額多少'],
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
    major: ['家庭這一項牌面沒有細節，實際狀況要靠相處和對話才會知道', '大牌顯示家庭對這個人影響很深，但沒有指出是什麼事，不要自己補劇情', '成長背景看不出來，只能說家裡留在他身上的痕跡比一般人明顯'],
    len_good: ['家庭氛圍偏向和樂正向，成長過程相對受到支持', '家人互動溫暖融洽，整體家庭氣氛順遂', '成長環境給予的支持感較強，家庭關係穩定'],
    len_neutral: ['家庭氛圍普通平穩，沒有特別突出也沒有明顯隱憂', '家人互動中規中矩，實際情況仍需進一步認識', '成長背景看不出明顯議題，建議多花時間了解'],
    len_bad: ['家庭氛圍可能存在一些壓力或需要磨合的課題', '成長過程或家人互動可能正經歷一些緊繃或調整期', '這方面可能有需要謹慎看待的地方，建議多觀察、別急著下結論'],
  },
  meetScene: {
    wands: ['可能在活動、運動場合或需要主動社交的場所相遇', '相遇場景或許與工作衝勁、競賽或共同挑戰有關', '較可能在步調快、氣氛熱絡的場合中認識對方'],
    cups: ['可能在聚會、聯誼或朋友介紹等重視情感連結的場合相遇', '相遇場景或許與藝文活動、療癒或情感交流的空間有關', '較可能透過共同的朋友圈或情感支持的場合認識'],
    swords: ['可能在職場、學習或需要理性交流的場合相遇', '相遇場景或許與討論、辯論或知識交流的環境有關', '較可能在需要動腦、溝通協調的場合中認識對方'],
    pentacles: ['可能在工作、日常生活或穩定的社交圈中相遇', '相遇場景或許與長期經營的環境有關，例如同事、鄰居或熟人介紹', '較可能在務實、規律的日常場合中慢慢熟識'],
    major: ['在哪裡遇到牌面沒有指出來，重點是時機而不是地點', '大牌不描述具體場合，能說的是這次相遇發生在你人生的轉彎處', '認識的方式看不出來，不用為了對上牌義硬套某個場合'],
    len_good: ['相遇場合可能明朗順利，例如公開活動、聚會或朋友介紹', '較可能在氣氛正向、充滿好消息的場合認識對方', '相遇的契機可能來得突然但美好，值得保持開放心態'],
    len_neutral: ['相遇場合可能很日常，例如平常的生活圈或例行的社交場合', '牌面沒有指出特別的場合，先照平常的生活步調走就好', '相遇方式可能普通平淡，重點在後續互動而非初次印象'],
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
    len_bad: ['工作環境目前可能存在一些緊張或需要磨合的地方', '宜多留意職場氛圍，必要時把自己的底線說清楚'],
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
    len_bad: ['目前的團隊氛圍可能存在一些緊張或磨合，需要多留意', '建議先把溝通方式與各自的分工講清楚，再逐步培養信任'],
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

/* 各分類的星盤解讀引擎、人生主題專題分析、知識層投影、星盤主畫面 已移到 js/data/astro-advanced.js（見檔頭說明）。 */


/* 星盤程式碼與資料現在都是延後載入，所以「還原上次的星盤」也要跟著延後：
   只有 localStorage 真的存著出生資料時才把整包星盤模組拉進來，沒用過星盤功能的人
   完全不會付這個成本（以前不論有沒有資料都會執行 astroLoadProfile()）。 */
try {
  if (localStorage.getItem('tl_astro_profile')) {
    ensureAstrologyDataLoaded().then(function () {
      ensureAstrologyBodyKeys();
      return astroLoadProfile();
    }).catch(function () {});
  }
} catch (e) {}
try { state.astroTourDismissed = localStorage.getItem('tl_astro_tour_seen') !== '0'; } catch (e) {}
try { state.homeTourDismissed = localStorage.getItem('tl_home_tour_seen') === '1'; } catch (e) {}
try { var _savedPersona = localStorage.getItem('tl_ai_persona'); if (_savedPersona && findAiPersona(_savedPersona).key === _savedPersona) state.aiPersona = _savedPersona; } catch (e) {}
try { var _savedCopyMode = localStorage.getItem('tl_astro_copy_mode'); if (_savedCopyMode === 'data' || _savedCopyMode === 'full') state.astroCopyMode = _savedCopyMode; } catch (e) {}

render();
