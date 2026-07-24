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
    { id: 'love-partner-type', title: '我容易遇到怎樣的對象', indicators: [
      { type: 'angle', which: 'dsc' }, { type: 'housePlanets', house: 7 }, { type: 'houseRuler', house: 7 },
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Mars' }, { type: 'point', key: 'Juno' },
    ] },
    { id: 'love-attract-type', title: '我容易被哪類人吸引', indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Mars' }, { type: 'houseRuler', house: 7 }, { type: 'housePlanets', house: 7 },
    ] },
    { id: 'love-meet-scene', title: '可能在什麼情境認識', indicators: [
      { type: 'houseRuler', house: 7 }, { type: 'planet', key: 'Venus' }, { type: 'houseRuler', house: 5 },
      { type: 'point', key: 'Vertex' }, { type: 'housePlanets', house: 9 }, { type: 'housePlanets', house: 11 },
      { type: 'aspectsInvolvingHouseRuler', house: 7 }, { type: 'aspectsInvolving', keys: ['Venus', 'Vertex'] },
    ] },
    { id: 'love-appearance-vibe', title: '對方可能呈現的外型與氣質', indicators: [
      { type: 'angle', which: 'dsc' }, { type: 'housePlanets', house: 7 }, { type: 'houseRuler', house: 7 },
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Mars' },
    ], appearanceCaveat: true },
    { id: 'love-relationship-style', title: '適合我的關係模式', indicators: [
      { type: 'houseRuler', house: 7 }, { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Moon' }, { type: 'housePlanets', house: 7 },
    ] },
    { id: 'love-strength', title: '我的感情優勢', indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Moon' }, { type: 'houseRuler', house: 7 },
    ] },
    { id: 'love-blindspot', title: '我的感情盲點', indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Mars' }, { type: 'houseRuler', house: 7 },
    ] },
    { id: 'love-longterm-value', title: '長期關係中真正重視什麼', indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'houseRuler', house: 7 }, { type: 'planet', key: 'Moon' },
    ] },
  ],
  career: [
    { id: 'career-work-type', title: '適合哪類型工作', indicators: [
      { type: 'angle', which: 'mc' }, { type: 'housePlanets', house: 10 }, { type: 'houseRuler', house: 10 }, { type: 'planet', key: 'Sun' }, { type: 'chartRuler' },
    ] },
    { id: 'career-work-env', title: '適合什麼工作環境', indicators: [
      { type: 'housePlanets', house: 6 }, { type: 'houseRuler', house: 6 }, { type: 'angle', which: 'mc' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'career-core-skill', title: '我的核心職場能力', indicators: [
      { type: 'planet', key: 'Sun' }, { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Mars' }, { type: 'chartRuler' },
    ] },
    { id: 'career-monetize', title: '哪些能力較容易轉化成收入', indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Jupiter' },
    ] },
    { id: 'career-work-mode', title: '適合穩定就業、自由工作或創業', indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Mars' }, { type: 'chartRuler' }, { type: 'houseRuler', house: 10 },
    ] },
    { id: 'career-blindspot', title: '我的職涯盲點', indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Mars' }, { type: 'houseRuler', house: 10 },
    ] },
    { id: 'career-longterm', title: '如何建立長期職涯方向', indicators: [
      { type: 'angle', which: 'mc' }, { type: 'houseRuler', house: 10 }, { type: 'planet', key: 'Jupiter' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'career-fulfillment', title: '容易在哪些領域獲得成就感', indicators: [
      { type: 'planet', key: 'Sun' }, { type: 'planet', key: 'Jupiter' }, { type: 'housePlanets', house: 10 }, { type: 'angle', which: 'mc' },
    ] },
  ],
  family: [
    { id: 'family-role', title: '我在家庭中習慣扮演的角色', indicators: [
      { type: 'housePlanets', house: 4 }, { type: 'houseRuler', house: 4 }, { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'family-origin-impact', title: '原生家庭如何影響我', indicators: [
      { type: 'angle', which: 'ic' }, { type: 'houseRuler', house: 4 }, { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'family-boundary', title: '我需要建立什麼家庭界線', indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'housePlanets', house: 4 }, { type: 'houseRuler', house: 4 },
    ] },
    { id: 'family-living-env', title: '我適合怎樣的居住環境', indicators: [
      { type: 'angle', which: 'ic' }, { type: 'housePlanets', house: 4 }, { type: 'houseRuler', house: 4 }, { type: 'planet', key: 'Moon' },
    ] },
    { id: 'family-inner-safety', title: '如何建立內在安全感', indicators: [
      { type: 'planet', key: 'Moon' }, { type: 'angle', which: 'ic' }, { type: 'housePlanets', house: 4 },
    ] },
    { id: 'family-work-balance', title: '家庭與事業如何平衡', indicators: [
      { type: 'houseRuler', house: 4 }, { type: 'houseRuler', house: 10 }, { type: 'angle', which: 'ic' }, { type: 'angle', which: 'mc' },
    ] },
    { id: 'family-core-lesson', title: '家庭關係中的核心課題', indicators: [
      { type: 'housePlanets', house: 4 }, { type: 'houseRuler', house: 4 }, { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Sun' },
    ] },
  ],
  health: [
    { id: 'health-stress-pattern', title: '我的壓力反應模式', indicators: [
      { type: 'planet', key: 'Mars' }, { type: 'planet', key: 'Saturn' }, { type: 'housePlanets', house: 1 }, { type: 'angle', which: 'asc' },
    ] },
    { id: 'health-lifestyle-fit', title: '哪種生活習慣較適合我', indicators: [
      { type: 'housePlanets', house: 6 }, { type: 'houseRuler', house: 6 }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'health-body-boundary', title: '我容易忽略哪些身體界線', indicators: [
      { type: 'angle', which: 'asc' }, { type: 'housePlanets', house: 1 }, { type: 'planet', key: 'Mars' },
    ] },
    { id: 'health-emotion-body', title: '情緒與身體狀態如何互相影響', indicators: [
      { type: 'planet', key: 'Moon' }, { type: 'housePlanets', house: 6 }, { type: 'houseRuler', house: 6 },
    ] },
    { id: 'health-self-care', title: '我需要建立什麼自我照顧方式', indicators: [
      { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Saturn' }, { type: 'housePlanets', house: 6 },
    ] },
    { id: 'health-rest-rhythm', title: '如何安排休息與恢復節奏', indicators: [
      { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Saturn' }, { type: 'houseRuler', house: 6 },
    ] },
  ],
  wealth: [
    { id: 'wealth-earning-style', title: '我的主要賺錢方式', indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Jupiter' }, { type: 'angle', which: 'mc' },
    ] },
    { id: 'wealth-monetizable', title: '哪些能力較容易變現', indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Jupiter' },
    ] },
    { id: 'wealth-spend-save', title: '我的消費與儲蓄模式', indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'wealth-risk-attitude', title: '我對財務風險的態度', indicators: [
      { type: 'houseRuler', house: 8 }, { type: 'planet', key: 'Jupiter' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'wealth-solo-or-shared', title: '適合個人收入還是合作資源', indicators: [
      { type: 'houseRuler', house: 2 }, { type: 'houseRuler', house: 8 }, { type: 'housePlanets', house: 8 },
    ] },
    { id: 'wealth-blindspot', title: '我的財務盲點', indicators: [
      { type: 'houseRuler', house: 2 }, { type: 'houseRuler', house: 8 }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'wealth-stable-structure', title: '如何建立更穩定的財務結構', indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Saturn' }, { type: 'angle', which: 'mc' },
    ] },
  ],
  social: [
    { id: 'social-first-impression', title: '我給人的第一印象', indicators: [
      { type: 'angle', which: 'asc' }, { type: 'planet', key: 'Mercury' },
    ] },
    { id: 'social-comm-style', title: '我的溝通風格', indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'housePlanets', house: 3 }, { type: 'houseRuler', house: 3 },
    ] },
    { id: 'social-group-role', title: '我在人群中的角色', indicators: [
      { type: 'housePlanets', house: 11 }, { type: 'houseRuler', house: 11 },
    ] },
    { id: 'social-attract-friend', title: '我容易吸引哪類朋友', indicators: [
      { type: 'houseRuler', house: 11 }, { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Moon' },
    ] },
    { id: 'social-strength', title: '我的人際優勢', indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Mercury' }, { type: 'angle', which: 'asc' },
    ] },
    { id: 'social-boundary-conflict', title: '我的界線與衝突模式', indicators: [
      { type: 'houseRuler', house: 7 }, { type: 'planet', key: 'Moon' },
    ] },
    { id: 'social-circle-fit', title: '適合我的社交圈', indicators: [
      { type: 'housePlanets', house: 11 }, { type: 'houseRuler', house: 11 }, { type: 'planet', key: 'Venus' },
    ] },
  ],
  study: [
    { id: 'study-learning-style', title: '適合我的學習方式', indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'housePlanets', house: 3 }, { type: 'houseRuler', house: 3 },
    ] },
    { id: 'study-memory-mode', title: '我的資訊理解與記憶模式', indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'study-procrastination', title: '容易拖延或分心的原因', indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Neptune' }, { type: 'planet', key: 'Uranus' },
    ] },
    { id: 'study-mode-fit', title: '適合語言、理論、實作或研究', indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Jupiter' }, { type: 'houseRuler', house: 9 },
    ] },
    { id: 'study-overseas', title: '海外學習或高等教育傾向', indicators: [
      { type: 'housePlanets', house: 9 }, { type: 'houseRuler', house: 9 }, { type: 'planet', key: 'Jupiter' },
    ] },
    { id: 'study-rhythm', title: '如何建立有效的讀書節奏', indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Mercury' }, { type: 'housePlanets', house: 6 },
    ] },
    { id: 'study-strength-blindspot', title: '我的學習優勢與盲點', indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Jupiter' }, { type: 'planet', key: 'Saturn' }, { type: 'houseRuler', house: 3 },
    ] },
  ],
  general: [
    { id: 'general-top-themes', title: '命盤最重要的三個人生主題', indicators: [
      { type: 'angularPlanets' }, { type: 'elementQualityBalance' }, { type: 'nodeAxis' }, { type: 'stelliumHouse' },
    ] },
    { id: 'general-core-strength', title: '我的核心優勢', indicators: [
      { type: 'planet', key: 'Sun' }, { type: 'chartRuler' }, { type: 'elementQualityBalance' },
    ] },
    { id: 'general-recurring-issue', title: '最容易反覆出現的課題', indicators: [
      { type: 'nodeAxis' }, { type: 'planet', key: 'Saturn' }, { type: 'tightAspectsAmongPersonal' },
    ] },
    { id: 'general-priority-direction', title: '適合優先發展的方向', indicators: [
      { type: 'planet', key: 'Sun' }, { type: 'planet', key: 'Jupiter' }, { type: 'chartRuler' },
    ] },
    { id: 'general-standout-energy', title: '哪些能量在命盤中最突出', indicators: [
      { type: 'elementQualityBalance' }, { type: 'angularPlanets' }, { type: 'stelliumHouse' },
    ] },
    { id: 'general-inner-tension', title: '如何平衡目前的內在矛盾', indicators: [
      { type: 'tightAspectsAmongPersonal' }, { type: 'elementQualityBalance' },
    ] },
  ],
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
