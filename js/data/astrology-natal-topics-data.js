/* ================= 人生主題專題分析：資料設定 =================
   這份檔案只放「資料」，不放邏輯（邏輯在 app.js 的 analyzeNatalTopic 系列函式）。
   核心原則（跟這個功能的其他部分一致）：
     - 完全依賴既有 computeNatalChart() 算出來的 chartData，不重新排盤。
     - 缺少的指標（例如婚神星 Juno，目前系統完全沒有計算）直接不放進題目的
       indicators 清單裡，由 app.js 端的 extractChartEvidence() 自動略過、
       不會捏造，也不會在畫面上出現「無法解讀」這種空話。
     - 宮主星／上升主星（命主星）需要「星座→守護星」對照表，系統原本沒有，
       這裡新增 SIGN_RULER_MODERN，採用現代占星對應（天蠍座→冥王星、
       水瓶座→天王星、雙魚座→海王星），跟站內其他地方目前的做法一致
       （這個網站的行星意義本來就是十大行星，沒有再分傳統／現代兩套）。

   indicators 的每一項是一個「指標描述」，由 app.js 的 extractChartEvidence()
   負責去 chartData 裡實際擷取資料、找不到就跳過。可用的 type：
     angle                  { type:'angle', which:'asc'|'mc'|'dsc'|'ic' }
     housePlanets           { type:'housePlanets', house:1-12 }
     houseRuler             { type:'houseRuler', house:1-12 }
     chartRuler              { type:'chartRuler' }                     （= 上升主星／命主星）
     planet                  { type:'planet', key:'Venus' }
     point                    { type:'point', key:'Vertex'|'Fortune'|'Lilith'|'Chiron'|'Node' }
     aspectsInvolving         { type:'aspectsInvolving', keys:['Venus','Mars'] }
     aspectsInvolvingHouseRuler { type:'aspectsInvolvingHouseRuler', house:7 }
     elementQualityBalance    { type:'elementQualityBalance' }
     nodeAxis                 { type:'nodeAxis' }
     angularPlanets           { type:'angularPlanets' }                （1/4/7/10 宮内行星總覽）
     stelliumHouse            { type:'stelliumHouse' }                 （哪個宮位聚集最多行星）
     tightAspectsAmongPersonal { type:'tightAspectsAmongPersonal' }    （太陽~火星彼此的緊密相位）
*/

var SIGN_RULER_MODERN = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Pluto', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

var NATAL_TOPIC_CATEGORIES = [
  { key: 'love', zh: '愛情', icon: '♥' },
  { key: 'career', zh: '事業', icon: '♦' },
  { key: 'family', zh: '家庭', icon: '⌂' },
  { key: 'health', zh: '健康', icon: '✚' },
  { key: 'wealth', zh: '財運', icon: '◆' },
  { key: 'social', zh: '人際', icon: '☍' },
  { key: 'study', zh: '學業', icon: '✎' },
  { key: 'general', zh: '綜合', icon: '✦' },
];

var NATAL_TOPIC_QUESTIONS = {
  love: [
    { id: 'love-partner-type', title: '我容易遇到怎樣的對象', intent: 'partner_profile',
      answerTargets: ['對方的個性傾向', '對方的互動風格', '你會重視對方的哪些特質'],
      excludedTargets: ['你自己的個性描述', '你自己的情緒需求本身'],
      detailLabels: ['對象的個性傾向', '互動與相處風格', '你會被什麼特質留住'],
      indicators: [
      { type: 'angle', which: 'dsc' }, { type: 'housePlanets', house: 7 }, { type: 'houseRuler', house: 7 },
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Mars' }, { type: 'point', key: 'Juno' },
    ] },
    { id: 'love-attract-type', title: '我容易被哪類人吸引', intent: 'attraction_pattern',
      answerTargets: ['你會主動被什麼特質吸引', '互動中容易心動的瞬間'],
      excludedTargets: ['對方的完整輪廓（屬於上一題的範圍）', '你自己過去的感情經驗'],
      detailLabels: ['容易被什麼特質吸引', '什麼樣的互動最讓你心動'],
      indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Mars' }, { type: 'houseRuler', house: 7 }, { type: 'housePlanets', house: 7 },
    ] },
    { id: 'love-meet-scene', title: '可能在什麼情境認識', intent: 'profile', indicators: [
      { type: 'houseRuler', house: 7 }, { type: 'planet', key: 'Venus' }, { type: 'houseRuler', house: 5 },
      { type: 'point', key: 'Vertex' }, { type: 'housePlanets', house: 9 }, { type: 'housePlanets', house: 11 },
      { type: 'aspectsInvolvingHouseRuler', house: 7 }, { type: 'aspectsInvolving', keys: ['Venus', 'Vertex'] },
    ] },
    { id: 'love-appearance-vibe', title: '對方可能呈現的外型與氣質', intent: 'appearance_and_vibe',
      answerTargets: ['外型風格傾向', '氣場／氛圍給人的感覺'],
      excludedTargets: ['情緒需求或內在性格', '跟外型氣質無關的相處模式'],
      detailLabels: ['外型風格傾向', '氣場給人的感覺'],
      indicators: [
      { type: 'angle', which: 'dsc' }, { type: 'housePlanets', house: 7 }, { type: 'houseRuler', house: 7 },
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Mars' },
    ], appearanceCaveat: true },
    { id: 'love-relationship-style', title: '適合我的關係模式', intent: 'style', indicators: [
      { type: 'houseRuler', house: 7 }, { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Moon' }, { type: 'housePlanets', house: 7 },
    ] },
    { id: 'love-strength', title: '我的感情優勢', intent: 'strength', indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Moon' }, { type: 'houseRuler', house: 7 },
    ] },
    { id: 'love-blindspot', title: '我的感情盲點', intent: 'challenge', indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Mars' }, { type: 'houseRuler', house: 7 },
    ] },
    { id: 'love-longterm-value', title: '長期關係中真正重視什麼', intent: 'value', indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'houseRuler', house: 7 }, { type: 'planet', key: 'Moon' },
    ] },
  ],
  career: [
    { id: 'career-work-type', title: '適合哪類型工作', intent: 'fit', indicators: [
      { type: 'angle', which: 'mc' }, { type: 'housePlanets', house: 10 }, { type: 'houseRuler', house: 10 }, { type: 'planet', key: 'Sun' }, { type: 'chartRuler' },
    ] },
    { id: 'career-work-env', title: '適合什麼工作環境', intent: 'environment', indicators: [
      { type: 'housePlanets', house: 6 }, { type: 'houseRuler', house: 6 }, { type: 'angle', which: 'mc' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'career-core-skill', title: '我的核心職場能力', intent: 'capability', indicators: [
      { type: 'planet', key: 'Sun' }, { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Mars' }, { type: 'chartRuler' },
    ] },
    { id: 'career-monetize', title: '哪些能力較容易轉化成收入', intent: 'capability', indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Jupiter' },
    ] },
    { id: 'career-work-mode', title: '適合穩定就業、自由工作或創業', intent: 'style', indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Mars' }, { type: 'chartRuler' }, { type: 'houseRuler', house: 10 },
    ] },
    { id: 'career-blindspot', title: '我的職涯盲點', intent: 'challenge', indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Mars' }, { type: 'houseRuler', house: 10 },
    ] },
    { id: 'career-longterm', title: '如何建立長期職涯方向', intent: 'direction', indicators: [
      { type: 'angle', which: 'mc' }, { type: 'houseRuler', house: 10 }, { type: 'planet', key: 'Jupiter' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'career-fulfillment', title: '容易在哪些領域獲得成就感', intent: 'value', indicators: [
      { type: 'planet', key: 'Sun' }, { type: 'planet', key: 'Jupiter' }, { type: 'housePlanets', house: 10 }, { type: 'angle', which: 'mc' },
    ] },
  ],
  family: [
    { id: 'family-role', title: '我在家庭中習慣扮演的角色', intent: 'profile', indicators: [
      { type: 'housePlanets', house: 4 }, { type: 'houseRuler', house: 4 }, { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'family-origin-impact', title: '原生家庭如何影響我', intent: 'origin', indicators: [
      { type: 'angle', which: 'ic' }, { type: 'houseRuler', house: 4 }, { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'family-boundary', title: '我需要建立什麼家庭界線', intent: 'challenge', indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'housePlanets', house: 4 }, { type: 'houseRuler', house: 4 },
    ] },
    { id: 'family-living-env', title: '我適合怎樣的居住環境', intent: 'environment', indicators: [
      { type: 'angle', which: 'ic' }, { type: 'housePlanets', house: 4 }, { type: 'houseRuler', house: 4 }, { type: 'planet', key: 'Moon' },
    ] },
    { id: 'family-inner-safety', title: '如何建立內在安全感', intent: 'safety', indicators: [
      { type: 'planet', key: 'Moon' }, { type: 'angle', which: 'ic' }, { type: 'housePlanets', house: 4 },
    ] },
    { id: 'family-work-balance', title: '家庭與事業如何平衡', intent: 'direction', indicators: [
      { type: 'houseRuler', house: 4 }, { type: 'houseRuler', house: 10 }, { type: 'angle', which: 'ic' }, { type: 'angle', which: 'mc' },
    ] },
    { id: 'family-core-lesson', title: '家庭關係中的核心課題', intent: 'challenge', indicators: [
      { type: 'housePlanets', house: 4 }, { type: 'houseRuler', house: 4 }, { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Sun' },
    ] },
  ],
  health: [
    { id: 'health-stress-pattern', title: '我的壓力反應模式', intent: 'pattern', indicators: [
      { type: 'planet', key: 'Mars' }, { type: 'planet', key: 'Saturn' }, { type: 'housePlanets', house: 1 }, { type: 'angle', which: 'asc' },
    ] },
    { id: 'health-lifestyle-fit', title: '哪種生活習慣較適合我', intent: 'fit', indicators: [
      { type: 'housePlanets', house: 6 }, { type: 'houseRuler', house: 6 }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'health-body-boundary', title: '我容易忽略哪些身體界線', intent: 'challenge', indicators: [
      { type: 'angle', which: 'asc' }, { type: 'housePlanets', house: 1 }, { type: 'planet', key: 'Mars' },
    ] },
    { id: 'health-emotion-body', title: '情緒與身體狀態如何互相影響', intent: 'pattern', indicators: [
      { type: 'planet', key: 'Moon' }, { type: 'housePlanets', house: 6 }, { type: 'houseRuler', house: 6 },
    ] },
    { id: 'health-self-care', title: '我需要建立什麼自我照顧方式', intent: 'safety', indicators: [
      { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Saturn' }, { type: 'housePlanets', house: 6 },
    ] },
    { id: 'health-rest-rhythm', title: '如何安排休息與恢復節奏', intent: 'safety', indicators: [
      { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Saturn' }, { type: 'houseRuler', house: 6 },
    ] },
  ],
  wealth: [
    { id: 'wealth-earning-style', title: '我的主要賺錢方式', intent: 'pattern', indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Jupiter' }, { type: 'angle', which: 'mc' },
    ] },
    { id: 'wealth-monetizable', title: '哪些能力較容易變現', intent: 'capability', indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Jupiter' },
    ] },
    { id: 'wealth-spend-save', title: '我的消費與儲蓄模式', intent: 'pattern', indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'wealth-risk-attitude', title: '我對財務風險的態度', intent: 'challenge', indicators: [
      { type: 'houseRuler', house: 8 }, { type: 'planet', key: 'Jupiter' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'wealth-solo-or-shared', title: '適合個人收入還是合作資源', intent: 'fit', indicators: [
      { type: 'houseRuler', house: 2 }, { type: 'houseRuler', house: 8 }, { type: 'housePlanets', house: 8 },
    ] },
    { id: 'wealth-blindspot', title: '我的財務盲點', intent: 'challenge', indicators: [
      { type: 'houseRuler', house: 2 }, { type: 'houseRuler', house: 8 }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'wealth-stable-structure', title: '如何建立更穩定的財務結構', intent: 'direction', indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Saturn' }, { type: 'angle', which: 'mc' },
    ] },
  ],
  social: [
    { id: 'social-first-impression', title: '我給人的第一印象', intent: 'impression', indicators: [
      { type: 'angle', which: 'asc' }, { type: 'planet', key: 'Mercury' },
    ] },
    { id: 'social-comm-style', title: '我的溝通風格', intent: 'style', indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'housePlanets', house: 3 }, { type: 'houseRuler', house: 3 },
    ] },
    { id: 'social-group-role', title: '我在人群中的角色', intent: 'profile', indicators: [
      { type: 'housePlanets', house: 11 }, { type: 'houseRuler', house: 11 },
    ] },
    { id: 'social-attract-friend', title: '我容易吸引哪類朋友', intent: 'attraction', indicators: [
      { type: 'houseRuler', house: 11 }, { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Moon' },
    ] },
    { id: 'social-strength', title: '我的人際優勢', intent: 'strength', indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Mercury' }, { type: 'angle', which: 'asc' },
    ] },
    { id: 'social-boundary-conflict', title: '我的界線與衝突模式', intent: 'tension', indicators: [
      { type: 'houseRuler', house: 7 }, { type: 'planet', key: 'Moon' },
    ] },
    { id: 'social-circle-fit', title: '適合我的社交圈', intent: 'fit', indicators: [
      { type: 'housePlanets', house: 11 }, { type: 'houseRuler', house: 11 }, { type: 'planet', key: 'Venus' },
    ] },
  ],
  study: [
    { id: 'study-learning-style', title: '適合我的學習方式', intent: 'style', indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'housePlanets', house: 3 }, { type: 'houseRuler', house: 3 },
    ] },
    { id: 'study-memory-mode', title: '我的資訊理解與記憶模式', intent: 'pattern', indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'study-procrastination', title: '容易拖延或分心的原因', intent: 'challenge', indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Neptune' }, { type: 'planet', key: 'Uranus' },
    ] },
    { id: 'study-mode-fit', title: '適合語言、理論、實作或研究', intent: 'fit', indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Jupiter' }, { type: 'houseRuler', house: 9 },
    ] },
    { id: 'study-overseas', title: '海外學習或高等教育傾向', intent: 'direction', indicators: [
      { type: 'housePlanets', house: 9 }, { type: 'houseRuler', house: 9 }, { type: 'planet', key: 'Jupiter' },
    ] },
    { id: 'study-rhythm', title: '如何建立有效的讀書節奏', intent: 'safety', indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Mercury' }, { type: 'housePlanets', house: 6 },
    ] },
    { id: 'study-strength-blindspot', title: '我的學習優勢與盲點', intent: 'strength', indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Jupiter' }, { type: 'planet', key: 'Saturn' }, { type: 'houseRuler', house: 3 },
    ] },
  ],
  general: [
    { id: 'general-top-themes', title: '命盤最重要的三個人生主題', intent: 'overview', indicators: [
      { type: 'angularPlanets' }, { type: 'elementQualityBalance' }, { type: 'nodeAxis' }, { type: 'stelliumHouse' },
    ] },
    { id: 'general-core-strength', title: '我的核心優勢', intent: 'strength', indicators: [
      { type: 'planet', key: 'Sun' }, { type: 'chartRuler' }, { type: 'elementQualityBalance' },
    ] },
    { id: 'general-recurring-issue', title: '最容易反覆出現的課題', intent: 'challenge', indicators: [
      { type: 'nodeAxis' }, { type: 'planet', key: 'Saturn' }, { type: 'tightAspectsAmongPersonal' },
    ] },
    { id: 'general-priority-direction', title: '適合優先發展的方向', intent: 'direction', indicators: [
      { type: 'planet', key: 'Sun' }, { type: 'planet', key: 'Jupiter' }, { type: 'chartRuler' },
    ] },
    { id: 'general-standout-energy', title: '哪些能量在命盤中最突出', intent: 'overview', indicators: [
      { type: 'elementQualityBalance' }, { type: 'angularPlanets' }, { type: 'stelliumHouse' },
    ] },
    { id: 'general-inner-tension', title: '如何平衡目前的內在矛盾', intent: 'tension', indicators: [
      { type: 'tightAspectsAmongPersonal' }, { type: 'elementQualityBalance' },
    ] },
  ],
};

/* ================= V2：Question Definition 支援欄位 =================
   intent 決定同一組占星配置要用「哪個角度」講出來（見下方 INTENT_FRAMES）。
   部分 intent 是規格明確要求的精確名稱（partner_profile／attraction_pattern／
   appearance_and_vibe），其餘主題的題目沿用同一組通用 intent（profile／
   attraction／style…），透過 INTENT_ALIAS 對應到同一份 frame，達到「同一套
   架構套用到所有主題問題」的要求，而不必每題各自寫一份獨立字典。
   缺 answerTargets／excludedTargets／detailLabels 的題目，會在下方迴圈用
   INTENT_DEFAULT_META 依 intent 自動補上預設值，確保每一題最終都具備完整的
   Question Definition 欄位。 */
var INTENT_ALIAS = { partner_profile: 'profile', attraction_pattern: 'attraction', appearance_and_vibe: 'appearance' };
/* 需要「嚴格偏好」題目自己明確列出的行星／角宮，避免宮內行星／宮主星自動發現的
   配置（例如月亮剛好也落在第七宮）蓋過這題真正該回答的重點——這正是「外型與氣質」
   之前會讀成月亮情緒需求的根本原因，見 applyEvidenceBias()。 */
var NATAL_INTENT_STRICT_PREFERRED = ['appearance', 'attraction', 'impression'];
var NATAL_INTENT_EXCLUDED_PLANETS = { appearance: ['Moon', 'Neptune'], attraction: ['Moon'] };
var INTENT_DEFAULT_META = {
  overview: { labels: ['整體印象', '核心主軸'] },
  profile: { labels: ['對象／情境輪廓', '相處風格'] },
  attraction: { labels: ['吸引關鍵', '互動火花'] },
  appearance: { labels: ['外型風格傾向', '氣場給人的感覺'] },
  style: { labels: ['適合的模式', '相處或執行方式'] },
  strength: { labels: ['優勢展現', '穩定力量'] },
  challenge: { labels: ['需要留意', '練習課題'] },
  value: { labels: ['真正重視什麼', '長期需求'] },
  environment: { labels: ['適合的場域', '舒適的條件'] },
  fit: { labels: ['適合的方式', '步調與節奏'] },
  capability: { labels: ['核心能力', '擅長之處'] },
  direction: { labels: ['發展方向', '長期目標'] },
  pattern: { labels: ['習慣模式', '反應傾向'] },
  safety: { labels: ['安定下來的方式', '自我照顧的做法'] },
  impression: { labels: ['給人的印象', '初次互動的樣子'] },
  tension: { labels: ['容易卡住的地方', '練習課題'] },
  origin: { labels: ['過去經驗的影響', '延續或修正的方向'] },
};
(function fillNatalQuestionDefaults() {
  Object.keys(NATAL_TOPIC_QUESTIONS).forEach(function (topicKey) {
    NATAL_TOPIC_QUESTIONS[topicKey].forEach(function (q) {
      var baseIntent = INTENT_ALIAS[q.intent] || q.intent || 'overview';
      var meta = INTENT_DEFAULT_META[baseIntent] || INTENT_DEFAULT_META.overview;
      if (!q.detailLabels) q.detailLabels = meta.labels.slice();
      if (!q.answerTargets) q.answerTargets = meta.labels.slice();
      if (!q.excludedTargets) q.excludedTargets = [];
      if (!q.preferredPlanets) q.preferredPlanets = q.indicators.filter(function (i) { return i.type === 'planet'; }).map(function (i) { return i.key; });
      if (!q.excludedPlanets) q.excludedPlanets = NATAL_INTENT_EXCLUDED_PLANETS[baseIntent] || [];
    });
  });
})();

/* ================= V2：情境化解讀（同一組配置，依 intent 講出不同角度） =================
   欄位對照全部沿用既有的 PLANET_BEGINNER／SIGN_BEGINNER／HOUSE_BEGINNER（見
   astrology-core-data.js），不重寫內容庫本身；只是依照題目的 intent，挑選
   「這個角度該引用哪些欄位、用什麼句型串起來」。coreNeed0 代表 PLANET_BEGINNER
   的 coreNeed[0]。這個表本身只是資料（欄位對照＋句型骨架），實際套用文字的邏輯
   在 app.js 的 contextualizeEvidence()。 */
var INTENT_FRAMES = {
  overview:   { p: 'function',  s: 'mode',       h: 'lifeArea',    tpl: ['{S_}，同時{P_}。', '整體來看，{S_}；核心則在於{P_}。'] },
  profile:    { p: 'coreNeed0', s: 'behavior',   h: 'area',        tpl: ['較容易遇到{S_}的人或情境，也重視「{P_}」這件事。', '你身邊常出現的，通常是{S_}的人或狀況，這跟你在意「{P_}」有關。'] },
  attraction: { p: 'verb',      s: 'motivation',                   tpl: ['容易被「{S_}」的人吸引，因為你自己也想{P_}。', '會不自覺被{S_}的人打動，這也跟你{P_}的傾向互相呼應。'] },
  appearance: { vibe: true,                                        tpl: ['對方可能帶有{VIBE}的氣質。', '外型與氣場上，容易遇到{VIBE}的人。'] },
  style:      { p: 'function',  s: 'method',     h: 'coreQuestion',tpl: ['適合的模式是{S_}，同時也在滿足「{P_}」這個需要。', '比較合拍的方式是{S_}——背後其實是{P_}。'] },
  strength:   { p: 'strength',  s: 'strength',                     tpl: ['{P_}；{S_}。', '你的優勢在於{S_}，加上{P_}。'] },
  challenge:  { p: 'watch',     s: 'watch',      h: 'growthTask',  tpl: ['{P_}。{S_}。', '需要留意的是{S_}，也提醒自己{P_}。'] },
  value:      { p: 'coreNeed0', s: 'motivation',                   tpl: ['你真正在意的是「{P_}」，也希望對方能理解你{S_}的傾向。', '長期而言，「{P_}」比表面條件更重要，這也跟你{S_}有關。'] },
  environment:{ h: 'area',      s: 'mode',                         tpl: ['適合{H_}的環境，因為你習慣{S_}。', '{H_}——這種場合會讓你比較自在，也比較貼近你{S_}的步調。'] },
  fit:        { s: 'method',    p: 'result',                       tpl: ['比較適合{S_}的方式，這樣能讓你{P_}。', '用{S_}的步調進行，會比較容易{P_}。'] },
  capability: { p: 'verb',      p2: 'function',                    tpl: ['你擅長{P_}，核心能力在於{P2_}。', '{P2_}，具體展現在你很會{P_}。'] },
  direction:  { h: 'lifeArea',  p: 'matureAim',                    tpl: ['方向上可以朝{H_}前進，慢慢做到{P_}。', '{H_}是值得投入的方向，長期目標是{P_}。'] },
  pattern:    { p: 'verb',      s: 'mode',                         tpl: ['你的習慣模式是{S_}，具體展現在你會想{P_}。', '遇到狀況時你傾向{S_}，同時也想{P_}。'] },
  safety:     { p: 'result',    s: 'behavior',                     tpl: ['能讓你安定下來的方式是{P_}，可以透過{S_}來練習。', '{S_}——這麼做通常能幫你找回{P_}的感覺。'] },
  impression: { s: 'behavior',                                     tpl: ['你給人的第一印象是{S_}。', '初次見面時你通常會{S_}，這也是別人對你的第一印象。'] },
  tension:    { p: 'watch',     s: 'shadow',                       tpl: ['容易卡住的地方是{S_}，也提醒自己{P_}。', '需要練習的課題是{S_}；同時留意{P_}。'] },
  origin:     { h: 'growthTask',p: 'imbalance',                    tpl: ['過去的經驗可能讓你{P_}，現在可以練習的地方是{H_}。', '{H_}——這也呼應了你需要留意{P_}的傾向。'] },
};
/* appearance 專用：只描述外型／氣場的印象，完全不碰情緒需求或內在性格字眼，
   避免「外型題卻在講情緒管理」這個明確被規格禁止的問題。 */
var SIGN_VIBE = [
  '俐落有行動感、講話直接，給人隨時準備出發的朝氣',
  '穩重踏實、步調不疾不徐，給人可靠耐看的感覺',
  '輕快靈活、話題豐富，給人聰明反應快的印象',
  '溫和內斂、帶點害羞，給人親切、有溫度的感覺',
  '大方明亮、有存在感，給人自信、容易吸引目光的氣場',
  '整潔俐落、細節講究，給人聰慧有條理的印象',
  '談吐得體、外型講究，給人優雅、容易親近的美感',
  '眼神深邃、氣場神秘，給人耐人尋味的印象',
  '爽朗開闊、笑容自然，給人自由、見過世面的氣質',
  '穩重內斂、舉止得宜，給人成熟、值得信賴的印象',
  '獨特不隨波逐流，給人聰明、與眾不同的氣質',
  '溫柔飄逸、眼神帶點夢幻，給人浪漫有靈氣的感覺',
];
/* V2：命盤總覽（renderAstroQuickSummary）用的「人格關鍵詞」——4字短語，
   跟 SIGN_VIBE（外型氣質用）與 SIGN_BEGINNER（完整句子）用途不同，這裡刻意
   保持最短，適合當標籤／關鍵詞展示。 */
var SIGN_KEYWORD = ['直接果敢', '穩健務實', '靈活好奇', '細膩重情', '熱情自信', '細心理性', '溫和協調', '深刻專注', '樂觀開闊', '務實自律', '獨立創新', '浪漫感性'];
/* 主題總覽（topicOverview）：只描述整體基調，不重複列出配置名稱，也不用
   「這次選擇的 N 個問題」這種罐頭開場。tone 依這批題目最常見的元素決定。 */
var NATAL_ELEM_TONE = {
  '火': '行動力強、容易主動出擊，也重視當下的熱情',
  '土': '務實穩健，重視看得到的成果與安全感',
  '風': '重視溝通與彈性，擅長從不同角度切入問題',
  '水': '重視情感連結，直覺敏銳、容易感受到細節',
};
var NATAL_TOPIC_OVERVIEW_FRAME = {
  love: ['你的感情模式整體來說{tone}。以下幾題想呈現的是比較一致的傾向，而不是單一事件的預測。', '把這幾個角度合在一起看，你在感情裡{tone}。接下來會分別從不同切入點，帶出更具體的樣貌。'],
  career: ['你的職場傾向整體來說{tone}。以下會分別從不同角度，說明這股特質實際會怎麼展現。', '整合來看，你在工作上{tone}，接下來的內容會更具體地拆解這一點。'],
  family: ['你在家庭關係中{tone}。以下幾個角度會分別說明這個模式是怎麼形成、又怎麼展現的。', '整體而言，家庭對你來說是{tone}會被放大的場域，接下來會分別說明細節。'],
  health: ['面對身心狀態時，你{tone}。以下會分別說明這股傾向在不同層面會怎麼出現。', '整合來看，你處理壓力與健康的方式{tone}，接下來的內容會更具體地拆解。'],
  wealth: ['你處理金錢的方式整體來說{tone}。以下會分別從不同角度說明這個傾向。', '整合來看，你在財務上{tone}，接下來會更具體地拆解每個面向。'],
  social: ['你在人際互動中{tone}。以下幾題會分別說明這股特質在不同情境下的樣貌。', '整合來看，你面對人群時{tone}，接下來的內容會更具體。'],
  study: ['你的學習傾向整體來說{tone}。以下會分別說明這股特質在不同層面的展現。', '整合來看，你面對學習時{tone}，接下來會更具體地拆解每個面向。'],
  general: ['整張命盤看下來，你目前{tone}。以下會分別從不同角度切入，說明這股基調的具體樣貌。', '整合來看，這張命盤目前的基調是{tone}，接下來的內容會更具體地展開。'],
};

/* 摘要／優勢／留意的句型骨架，依主題分組，每組數個變化版本，seed 過的 astroSeededPick
   會依「主題+題目+證據內容」挑一個，確保同樣的命盤配置永遠讀到同一句、不同配置不會撞句型。
   {top}／{second}／{third} 由最高權重的證據 factor+placement 文字填入；{trait} 由證據對應的
   PLANET_BEGINNER/SIGN_BEGINNER/HOUSE_BEGINNER 關鍵字填入。 */
var NATAL_TOPIC_SUMMARY_TPL = {
  love: ['從{top}來看，你在感情裡{trait}，{second}又進一步呼應了這個傾向。', '{top}是這題最主要的線索，加上{second}的配置，兩者比較一致地指向你{trait}。'],
  career: ['{top}顯示你在職場上{trait}，{second}也支持這個方向。', '從{top}與{second}一起看，你比較容易在{trait}的情境裡發揮。'],
  family: ['{top}反映出你在家庭裡{trait}，{second}補充說明了這個模式是怎麼來的。', '從{top}來看，家庭對你來說{trait}；{second}讓這個輪廓更清楚。'],
  health: ['{top}顯示你面對壓力時{trait}，{second}也提供了類似的線索。', '從{top}與{second}一起看，你的身心狀態比較容易{trait}。'],
  wealth: ['{top}反映出你{trait}，{second}也呼應了這個財務傾向。', '從{top}來看，你處理金錢的方式{trait}；{second}讓這個模式更明確。'],
  social: ['{top}顯示你在人際互動中{trait}，{second}也支持這個觀察。', '從{top}與{second}一起看，你比較容易在人群中{trait}。'],
  study: ['{top}反映出你{trait}，{second}也提供了類似的線索。', '從{top}來看，你的學習傾向是{trait}；{second}讓這點更明確。'],
  general: ['{top}是這張命盤最突出的線索之一，顯示你{trait}；{second}補充了這個主軸。', '從{top}與{second}一起看，目前的你比較容易{trait}。'],
};
var NATAL_TOPIC_STRENGTH_TPL = [
  '{trait}，這是你相對穩定、可以持續發揮的部分。',
  '{trait}，通常會是別人對你印象比較深的地方。',
  '{trait}，這股力量較容易的展現在日常裡。',
];
var NATAL_TOPIC_CAUTION_TPL = [
  '{trait}，是目前比較需要留意、練習調整的地方。',
  '{trait}，這部分容易在壓力大的時候特別明顯。',
  '{trait}，值得找機會慢慢練習、不用急著一次解決。',
];

/* 元素衝突時的簡短說明（火/土/風/水兩兩配對，無序、6組），用於 identifyTensions()。
   語氣使用「較容易」「可能」「通常」等非宿命用詞，符合規格要求。 */
var ELEMENT_TENSION_NOTE = {
  '火-水': '一部分的你較容易想直接行動，另一部分卻更在意感受與情緒安全，這兩股力量有時會互相拉扯，需要練習找到節奏。',
  '火-土': '一部分的你想要快速推進，另一部分卻更重視穩紮穩打，兩者拉扯時容易讓人猶豫該衝還是該等。',
  '火-風': '一部分的你想直接行動，另一部分卻習慣先想清楚、討論過再說，兩種步調偶爾會互相干擾。',
  '土-風': '一部分的你重視實際與穩定，另一部分卻對新資訊、新可能性感到好奇，這兩種傾向可能會互相牽制。',
  '土-水': '一部分的你想維持穩定的架構，另一部分卻容易被情緒或直覺牽著走，兩者需要彼此協調。',
  '風-水': '一部分的你習慣用理性分析事情，另一部分卻更依賴感受與直覺，這兩種傾向偶爾會互相矛盾。',
};
