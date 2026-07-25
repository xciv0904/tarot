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

   ================= V2.1（內容品質與題目差異化）補充說明 =================
   每題除了 intent 之外，還有 questionFocus——同一個 intent 底下可能有好幾題
   在問不一樣的事（例如「適合哪類型工作」跟「適合什麼工作環境」都可能落在同一
   種占星判斷邏輯家族，但答案的重點完全不同）。questionFocus 本身不驅動邏輯，
   是給人看的語意標籤；真正讓同一個 intent 底下的不同題目長出不同內容的，是
   fieldOverride（覆寫要引用 PLANET_BEGINNER/SIGN_BEGINNER/HOUSE_BEGINNER
   的哪些欄位）跟 evidenceBias（覆寫要優先/排除哪些天體或指標類型）。
   cautionFocus 指到 CAUTION_FOCUS_FRAMES 裡的一組欄位＋句型，取代原本所有
   題目的留意段落都套用同一個 challenge intent 的寫法。 */

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
    { id: 'love-partner-type', title: '我容易遇到怎樣的對象', intent: 'partner_profile', questionFocus: 'likely_partner_traits',
      answerTargets: ['對方的個性傾向', '對方的互動風格', '你會重視對方的哪些特質'],
      excludedTargets: ['你自己的個性描述', '你自己的情緒需求本身'],
      detailLabels: ['對象的個性傾向', '互動與相處風格', '你會被什麼特質留住'],
      cautionFocus: 'shadow',
      evidenceBias: { preferPlanets: ['Venus', 'Moon', 'Mars'], preferTypes: ['angle', 'houseRuler', 'housePlanets'], excludePlanets: [] },
      indicators: [
      { type: 'angle', which: 'dsc' }, { type: 'housePlanets', house: 7 }, { type: 'houseRuler', house: 7 },
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Mars' }, { type: 'point', key: 'Juno' },
    ] },
    { id: 'love-attract-type', title: '我容易被哪類人吸引', intent: 'attraction_pattern', questionFocus: 'emotional_attraction',
      answerTargets: ['你會主動被什麼特質吸引', '互動中容易心動的瞬間'],
      excludedTargets: ['對方的完整輪廓（屬於上一題的範圍）', '你自己過去的感情經驗'],
      detailLabels: ['容易被什麼特質吸引', '什麼樣的互動最讓你心動'],
      cautionFocus: 'detachment',
      evidenceBias: { preferPlanets: ['Venus', 'Mars'], preferTypes: ['planet'], excludePlanets: ['Moon'] },
      indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Mars' }, { type: 'houseRuler', house: 7 }, { type: 'housePlanets', house: 7 },
    ] },
    { id: 'love-meet-scene', title: '可能在什麼情境認識', intent: 'context', questionFocus: 'meeting_context',
      answerTargets: ['可能認識的場合或情境', '適合建立連結的方式'],
      excludedTargets: ['對方的外型或個性描述'],
      detailLabels: ['可能出現的場合', '適合的認識情境'],
      cautionFocus: 'growth',
      evidenceBias: { preferPlanets: [], preferTypes: ['houseRuler', 'housePlanets', 'point'], excludePlanets: ['Moon'] },
      indicators: [
      { type: 'houseRuler', house: 7 }, { type: 'planet', key: 'Venus' }, { type: 'houseRuler', house: 5 },
      { type: 'point', key: 'Vertex' }, { type: 'housePlanets', house: 9 }, { type: 'housePlanets', house: 11 },
      { type: 'aspectsInvolvingHouseRuler', house: 7 }, { type: 'aspectsInvolving', keys: ['Venus', 'Vertex'] },
    ] },
    { id: 'love-appearance-vibe', title: '對方可能呈現的外型與氣質', intent: 'appearance_and_vibe', questionFocus: 'partner_visual_impression',
      answerTargets: ['外型風格傾向', '氣場／氛圍給人的感覺'],
      excludedTargets: ['情緒需求或內在性格', '跟外型氣質無關的相處模式'],
      detailLabels: ['外型風格傾向', '氣場給人的感覺'],
      cautionFocus: 'vigilance',
      evidenceBias: { preferPlanets: ['Venus', 'Mars'], preferTypes: ['angle'], excludePlanets: ['Moon', 'Neptune'], angleBonus: true },
      indicators: [
      { type: 'angle', which: 'dsc' }, { type: 'housePlanets', house: 7 }, { type: 'houseRuler', house: 7 },
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Mars' },
    ], appearanceCaveat: true },
    { id: 'love-relationship-style', title: '適合我的關係模式', intent: 'style', questionFocus: 'preferred_relationship_style',
      answerTargets: ['適合的相處模式', '關係中你需要的節奏'],
      excludedTargets: ['對方的外型描述'],
      detailLabels: ['適合的相處模式', '關係中的步調'],
      cautionFocus: 'shadow',
      evidenceBias: { preferPlanets: ['Venus', 'Moon'], preferTypes: ['houseRuler', 'housePlanets'] },
      indicators: [
      { type: 'houseRuler', house: 7 }, { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Moon' }, { type: 'housePlanets', house: 7 },
    ] },
    { id: 'love-strength', title: '我的感情優勢', intent: 'strength', questionFocus: 'relationship_strengths',
      answerTargets: ['你在感情裡的優勢', '別人容易感受到的部分'],
      excludedTargets: ['你的感情盲點（屬於另一題）'],
      detailLabels: ['你在感情裡的優勢', '別人會感受到的部分'],
      cautionFocus: 'vigilance',
      evidenceBias: { preferPlanets: ['Venus', 'Moon'] },
      indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Moon' }, { type: 'houseRuler', house: 7 },
    ] },
    { id: 'love-blindspot', title: '我的感情盲點', intent: 'challenge', questionFocus: 'relationship_blindspot',
      answerTargets: ['容易忽略的相處盲點', '壓力下容易出現的反應'],
      excludedTargets: ['你的感情優勢（屬於另一題）'],
      detailLabels: ['容易忽略的盲點', '壓力下的反應'],
      cautionFocus: 'shadow',
      evidenceBias: { preferPlanets: ['Venus', 'Mars'] },
      indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Mars' }, { type: 'houseRuler', house: 7 },
    ] },
    { id: 'love-longterm-value', title: '長期關係中真正重視什麼', intent: 'value', questionFocus: 'longterm_relationship_values',
      answerTargets: ['長期關係中真正在意的事', '你需要對方理解的需求'],
      excludedTargets: ['短期心動的感覺'],
      detailLabels: ['長期真正在意的事', '你需要被理解的需求'],
      cautionFocus: 'overextension',
      evidenceBias: { preferPlanets: ['Venus', 'Moon'] },
      indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'houseRuler', house: 7 }, { type: 'planet', key: 'Moon' },
    ] },
  ],
  career: [
    { id: 'career-work-type', title: '適合哪類型工作', intent: 'career_direction', questionFocus: 'suitable_roles',
      answerTargets: ['適合的職能或角色', '容易發揮的工作內容'],
      excludedTargets: ['純粹的個性描述', '工作環境條件（屬於下一題）'],
      detailLabels: ['適合的職能角色', '容易發揮的工作內容'],
      cautionFocus: 'imbalance',
      fieldOverride: { p: 'verb', p2: 'function', tplFrom: 'capability' },
      evidenceBias: { preferPlanets: ['Sun'], preferTypes: ['houseRuler', 'housePlanets', 'chartRuler'], excludeTypes: ['angle'], requirePlanet: true },
      indicators: [
      { type: 'angle', which: 'mc' }, { type: 'housePlanets', house: 10 }, { type: 'houseRuler', house: 10 }, { type: 'planet', key: 'Sun' }, { type: 'chartRuler' },
    ] },
    { id: 'career-work-env', title: '適合什麼工作環境', intent: 'career_direction', questionFocus: 'suitable_environment',
      answerTargets: ['適合的工作場域', '舒適的工作節奏與氛圍'],
      excludedTargets: ['具體職稱或職業名稱'],
      detailLabels: ['適合的工作場域', '舒適的步調與氛圍'],
      cautionFocus: 'growth',
      fieldOverride: { h: 'area', s: 'mode', tplFrom: 'environment' },
      evidenceBias: { preferPlanets: ['Saturn'], preferTypes: ['housePlanets', 'houseRuler'] },
      indicators: [
      { type: 'housePlanets', house: 6 }, { type: 'houseRuler', house: 6 }, { type: 'angle', which: 'mc' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'career-core-skill', title: '我的核心職場能力', intent: 'career_strength', questionFocus: 'workplace_advantages',
      answerTargets: ['你最拿手的職場能力', '別人會倚賴你的部分'],
      excludedTargets: ['哪些能力能變現（屬於下一題）'],
      detailLabels: ['最拿手的職場能力', '別人會倚賴你的部分'],
      cautionFocus: 'imbalance',
      evidenceBias: { preferPlanets: ['Sun', 'Mercury', 'Mars'] },
      indicators: [
      { type: 'planet', key: 'Sun' }, { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Mars' }, { type: 'chartRuler' },
    ] },
    { id: 'career-monetize', title: '哪些能力較容易轉化成收入', intent: 'career_strength', questionFocus: 'monetizable_skills',
      answerTargets: ['較容易變現的能力', '市場願意付費的部分'],
      excludedTargets: ['泛泛的性格優點'],
      detailLabels: ['較容易變現的能力', '市場願意付費的部分'],
      cautionFocus: 'overextension',
      fieldOverride: { p2: 'result' },
      evidenceBias: { preferPlanets: ['Mercury', 'Jupiter'], preferTypes: ['housePlanets', 'houseRuler'] },
      indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Jupiter' },
    ] },
    { id: 'career-work-mode', title: '適合穩定就業、自由工作或創業', intent: 'style', questionFocus: 'employment_mode',
      answerTargets: ['適合的就業型態', '你需要的自主程度'],
      excludedTargets: ['具體產業或職稱'],
      detailLabels: ['適合的就業型態', '你需要的自主程度'],
      cautionFocus: 'imbalance',
      evidenceBias: { preferPlanets: ['Saturn', 'Mars'], preferTypes: ['chartRuler', 'houseRuler'] },
      indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Mars' }, { type: 'chartRuler' }, { type: 'houseRuler', house: 10 },
    ] },
    { id: 'career-blindspot', title: '我的職涯盲點', intent: 'challenge', questionFocus: 'career_blindspot',
      answerTargets: ['容易忽略的職涯風險', '壓力下容易出現的反應'],
      excludedTargets: ['你的職場優勢（屬於另一題）'],
      detailLabels: ['容易忽略的職涯風險', '壓力下的反應'],
      cautionFocus: 'shadow',
      evidenceBias: { preferPlanets: ['Saturn', 'Mars'] },
      indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Mars' }, { type: 'houseRuler', house: 10 },
    ] },
    { id: 'career-longterm', title: '如何建立長期職涯方向', intent: 'direction', questionFocus: 'longterm_career_direction',
      answerTargets: ['值得投入的長期方向', '成熟階段的樣子'],
      excludedTargets: ['短期的工作內容細節'],
      detailLabels: ['值得投入的長期方向', '成熟階段的樣子'],
      cautionFocus: 'growth',
      evidenceBias: { preferPlanets: ['Jupiter', 'Saturn'], preferTypes: ['angle', 'houseRuler'] },
      indicators: [
      { type: 'angle', which: 'mc' }, { type: 'houseRuler', house: 10 }, { type: 'planet', key: 'Jupiter' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'career-fulfillment', title: '容易在哪些領域獲得成就感', intent: 'value', questionFocus: 'career_fulfillment_area',
      answerTargets: ['容易獲得成就感的領域', '你真正在意的職場回饋'],
      excludedTargets: ['純粹的薪資考量'],
      detailLabels: ['容易獲得成就感的領域', '你在意的職場回饋'],
      cautionFocus: 'overextension',
      evidenceBias: { preferPlanets: ['Sun', 'Jupiter'], preferTypes: ['angle', 'housePlanets'] },
      indicators: [
      { type: 'planet', key: 'Sun' }, { type: 'planet', key: 'Jupiter' }, { type: 'housePlanets', house: 10 }, { type: 'angle', which: 'mc' },
    ] },
  ],
  family: [
    { id: 'family-role', title: '我在家庭中習慣扮演的角色', intent: 'profile', questionFocus: 'family_role',
      answerTargets: ['你習慣扮演的角色', '家人容易依賴你的部分'],
      excludedTargets: ['原生家庭如何影響你（屬於下一題）'],
      detailLabels: ['你習慣扮演的角色', '家人依賴你的部分'],
      cautionFocus: 'relational',
      evidenceBias: { preferPlanets: ['Moon', 'Saturn'], preferTypes: ['housePlanets', 'houseRuler'] },
      indicators: [
      { type: 'housePlanets', house: 4 }, { type: 'houseRuler', house: 4 }, { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'family-origin-impact', title: '原生家庭如何影響我', intent: 'origin', questionFocus: 'family_origin_impact',
      answerTargets: ['原生家庭留下的慣性', '延續或需要修正的模式'],
      excludedTargets: ['你目前在家庭中的角色（屬於上一題）'],
      detailLabels: ['原生家庭留下的慣性', '值得修正的模式'],
      cautionFocus: 'imbalance',
      evidenceBias: { preferPlanets: ['Moon', 'Saturn'], preferTypes: ['angle'] },
      indicators: [
      { type: 'angle', which: 'ic' }, { type: 'houseRuler', house: 4 }, { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'family-boundary', title: '我需要建立什麼家庭界線', intent: 'challenge', questionFocus: 'family_boundary_setting',
      answerTargets: ['需要練習劃清的界線', '容易被跨越的地方'],
      excludedTargets: ['家庭關係的核心課題（屬於下一題）'],
      detailLabels: ['需要練習的界線', '容易被跨越的地方'],
      cautionFocus: 'growth',
      evidenceBias: { preferPlanets: ['Saturn'], preferTypes: ['housePlanets', 'houseRuler'] },
      indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'housePlanets', house: 4 }, { type: 'houseRuler', house: 4 },
    ] },
    { id: 'family-living-env', title: '我適合怎樣的居住環境', intent: 'environment', questionFocus: 'living_environment',
      answerTargets: ['適合的居住條件', '讓你安心的家庭氛圍'],
      excludedTargets: ['原生家庭的影響（屬於另一題）'],
      detailLabels: ['適合的居住條件', '讓你安心的氛圍'],
      cautionFocus: 'relational',
      evidenceBias: { preferPlanets: ['Moon'], preferTypes: ['angle', 'housePlanets'] },
      indicators: [
      { type: 'angle', which: 'ic' }, { type: 'housePlanets', house: 4 }, { type: 'houseRuler', house: 4 }, { type: 'planet', key: 'Moon' },
    ] },
    { id: 'family-inner-safety', title: '如何建立內在安全感', intent: 'safety', questionFocus: 'inner_safety_practice',
      answerTargets: ['能讓你安定下來的方式', '值得練習的自我照顧'],
      excludedTargets: ['家庭角色描述'],
      detailLabels: ['能讓你安定的方式', '值得練習的照顧方式'],
      cautionFocus: 'pressure',
      evidenceBias: { preferPlanets: ['Moon'], preferTypes: ['angle'] },
      indicators: [
      { type: 'planet', key: 'Moon' }, { type: 'angle', which: 'ic' }, { type: 'housePlanets', house: 4 },
    ] },
    { id: 'family-work-balance', title: '家庭與事業如何平衡', intent: 'direction', questionFocus: 'family_career_balance',
      answerTargets: ['家庭與事業如何互相支援', '容易失衡的方向'],
      excludedTargets: ['單純的職涯規劃（屬於事業主題）'],
      detailLabels: ['家庭與事業的關係', '容易失衡的方向'],
      cautionFocus: 'overextension',
      evidenceBias: { preferPlanets: [], preferTypes: ['angle', 'houseRuler'] },
      indicators: [
      { type: 'houseRuler', house: 4 }, { type: 'houseRuler', house: 10 }, { type: 'angle', which: 'ic' }, { type: 'angle', which: 'mc' },
    ] },
    { id: 'family-core-lesson', title: '家庭關係中的核心課題', intent: 'challenge', questionFocus: 'family_core_lesson',
      answerTargets: ['家庭關係中反覆出現的課題', '需要練習的相處方式'],
      excludedTargets: ['需要建立的具體界線（屬於另一題）'],
      detailLabels: ['反覆出現的課題', '需要練習的相處方式'],
      cautionFocus: 'relational',
      fieldOverride: { s: 'shadow' },
      evidenceBias: { preferPlanets: ['Saturn', 'Sun'], preferTypes: ['housePlanets'] },
      indicators: [
      { type: 'housePlanets', house: 4 }, { type: 'houseRuler', house: 4 }, { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Sun' },
    ] },
  ],
  health: [
    { id: 'health-stress-pattern', title: '我的壓力反應模式', intent: 'pattern', questionFocus: 'stress_reaction_pattern',
      answerTargets: ['壓力來臨時的直覺反應', '容易忽略的身體訊號'],
      excludedTargets: ['情緒與身體如何互相影響（屬於下一題）'],
      detailLabels: ['壓力來臨時的反應', '容易忽略的訊號'],
      cautionFocus: 'imbalance',
      evidenceBias: { preferPlanets: ['Mars', 'Saturn'], preferTypes: ['angle', 'housePlanets'] },
      indicators: [
      { type: 'planet', key: 'Mars' }, { type: 'planet', key: 'Saturn' }, { type: 'housePlanets', house: 1 }, { type: 'angle', which: 'asc' },
    ] },
    { id: 'health-lifestyle-fit', title: '哪種生活習慣較適合我', intent: 'fit', questionFocus: 'lifestyle_fit',
      answerTargets: ['適合的生活步調', '容易維持的作息方式'],
      excludedTargets: ['壓力反應模式（屬於另一題）'],
      detailLabels: ['適合的生活步調', '容易維持的作息'],
      cautionFocus: 'growth',
      evidenceBias: { preferPlanets: ['Saturn'], preferTypes: ['housePlanets', 'houseRuler'] },
      indicators: [
      { type: 'housePlanets', house: 6 }, { type: 'houseRuler', house: 6 }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'health-body-boundary', title: '我容易忽略哪些身體界線', intent: 'challenge', questionFocus: 'body_boundary_blindspot',
      answerTargets: ['容易忽略的身體警訊', '硬撐的習慣'],
      excludedTargets: ['一般壓力反應模式（屬於另一題）'],
      detailLabels: ['容易忽略的警訊', '硬撐的習慣'],
      cautionFocus: 'shadow',
      evidenceBias: { preferPlanets: ['Mars'], preferTypes: ['angle', 'housePlanets'] },
      indicators: [
      { type: 'angle', which: 'asc' }, { type: 'housePlanets', house: 1 }, { type: 'planet', key: 'Mars' },
    ] },
    { id: 'health-emotion-body', title: '情緒與身體狀態如何互相影響', intent: 'pattern', questionFocus: 'emotion_body_link',
      answerTargets: ['情緒累積時身體的反應', '身心連動的模式'],
      excludedTargets: ['純粹的壓力反應模式（屬於另一題）'],
      detailLabels: ['情緒累積的身體反應', '身心連動的模式'],
      cautionFocus: 'pressure',
      fieldOverride: { p: 'result' },
      evidenceBias: { preferPlanets: ['Moon'], preferTypes: ['housePlanets', 'houseRuler'] },
      indicators: [
      { type: 'planet', key: 'Moon' }, { type: 'housePlanets', house: 6 }, { type: 'houseRuler', house: 6 },
    ] },
    { id: 'health-self-care', title: '我需要建立什麼自我照顧方式', intent: 'safety', questionFocus: 'self_care_practice',
      answerTargets: ['能真正照顧到你的方式', '值得刻意安排的習慣'],
      excludedTargets: ['休息節奏的具體安排（屬於下一題）'],
      detailLabels: ['真正能照顧你的方式', '值得安排的習慣'],
      cautionFocus: 'pressure',
      evidenceBias: { preferPlanets: ['Moon', 'Saturn'], preferTypes: ['housePlanets'] },
      indicators: [
      { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Saturn' }, { type: 'housePlanets', house: 6 },
    ] },
    { id: 'health-rest-rhythm', title: '如何安排休息與恢復節奏', intent: 'safety', questionFocus: 'rest_rhythm',
      answerTargets: ['適合的休息節奏', '恢復精力的方式'],
      excludedTargets: ['日常自我照顧方式（屬於上一題）'],
      detailLabels: ['適合的休息節奏', '恢復精力的方式'],
      cautionFocus: 'overextension',
      fieldOverride: { p: 'result', h: 'growthTask' },
      evidenceBias: { preferPlanets: ['Saturn'], preferTypes: ['houseRuler'] },
      indicators: [
      { type: 'planet', key: 'Moon' }, { type: 'planet', key: 'Saturn' }, { type: 'houseRuler', house: 6 },
    ] },
  ],
  wealth: [
    { id: 'wealth-earning-style', title: '我的主要賺錢方式', intent: 'pattern', questionFocus: 'earning_style',
      answerTargets: ['主要的賺錢方式', '容易發揮的財務行動'],
      excludedTargets: ['消費與儲蓄模式（屬於另一題）', '對風險的態度（屬於另一題）'],
      detailLabels: ['主要的賺錢方式', '容易發揮的行動'],
      cautionFocus: 'imbalance',
      evidenceBias: { preferPlanets: ['Jupiter'], preferTypes: ['housePlanets', 'houseRuler', 'angle'] },
      indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Jupiter' }, { type: 'angle', which: 'mc' },
    ] },
    { id: 'wealth-monetizable', title: '哪些能力較容易變現', intent: 'capability', questionFocus: 'wealth_monetizable_skills',
      answerTargets: ['較容易變現的能力', '市場願意付費的部分'],
      excludedTargets: ['泛泛的性格優點'],
      detailLabels: ['較容易變現的能力', '市場願意付費的部分'],
      cautionFocus: 'growth',
      evidenceBias: { preferPlanets: ['Venus', 'Jupiter'], preferTypes: ['housePlanets', 'houseRuler'] },
      indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Jupiter' },
    ] },
    { id: 'wealth-spend-save', title: '我的消費與儲蓄模式', intent: 'pattern', questionFocus: 'spend_save_pattern',
      answerTargets: ['消費與儲蓄的習慣', '面對金錢的直覺反應'],
      excludedTargets: ['賺錢方式（屬於另一題）', '對風險的態度（屬於另一題）'],
      detailLabels: ['消費與儲蓄的習慣', '面對金錢的直覺反應'],
      cautionFocus: 'imbalance',
      fieldOverride: { p: 'result', h: 'area' },
      evidenceBias: { preferPlanets: ['Saturn'], preferTypes: ['housePlanets', 'houseRuler'] },
      indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'wealth-risk-attitude', title: '我對財務風險的態度', intent: 'challenge', questionFocus: 'risk_attitude',
      answerTargets: ['面對財務風險的直覺反應', '容易高估或低估的部分'],
      excludedTargets: ['賺錢方式或消費模式（屬於其他題）'],
      detailLabels: ['面對風險的直覺反應', '容易高估或低估的部分'],
      cautionFocus: 'vigilance',
      evidenceBias: { preferPlanets: ['Jupiter', 'Saturn'], preferTypes: ['houseRuler'] },
      indicators: [
      { type: 'houseRuler', house: 8 }, { type: 'planet', key: 'Jupiter' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'wealth-solo-or-shared', title: '適合個人收入還是合作資源', intent: 'fit', questionFocus: 'solo_or_shared_resource',
      answerTargets: ['適合的資源運用方式', '合作或獨立的傾向'],
      excludedTargets: ['具體賺錢方式'],
      detailLabels: ['適合的資源運用方式', '合作或獨立的傾向'],
      cautionFocus: 'relational',
      evidenceBias: { preferPlanets: [], preferTypes: ['houseRuler', 'housePlanets'] },
      indicators: [
      { type: 'houseRuler', house: 2 }, { type: 'houseRuler', house: 8 }, { type: 'housePlanets', house: 8 },
    ] },
    { id: 'wealth-blindspot', title: '我的財務盲點', intent: 'challenge', questionFocus: 'financial_blindspot',
      answerTargets: ['容易忽略的財務風險', '壓力下容易出現的財務反應'],
      excludedTargets: ['對風險的一般態度（屬於另一題）'],
      detailLabels: ['容易忽略的風險', '壓力下的財務反應'],
      cautionFocus: 'shadow',
      fieldOverride: { s: 'shadow', h: 'growthTask' },
      evidenceBias: { preferPlanets: ['Saturn'], preferTypes: ['houseRuler'] },
      indicators: [
      { type: 'houseRuler', house: 2 }, { type: 'houseRuler', house: 8 }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'wealth-stable-structure', title: '如何建立更穩定的財務結構', intent: 'direction', questionFocus: 'stable_financial_structure',
      answerTargets: ['值得投入的財務方向', '長期穩定的做法'],
      excludedTargets: ['短期消費習慣'],
      detailLabels: ['值得投入的方向', '長期穩定的做法'],
      cautionFocus: 'growth',
      evidenceBias: { preferPlanets: ['Saturn'], preferTypes: ['housePlanets', 'houseRuler', 'angle'] },
      indicators: [
      { type: 'housePlanets', house: 2 }, { type: 'houseRuler', house: 2 }, { type: 'planet', key: 'Saturn' }, { type: 'angle', which: 'mc' },
    ] },
  ],
  social: [
    { id: 'social-first-impression', title: '我給人的第一印象', intent: 'impression', questionFocus: 'first_impression',
      answerTargets: ['別人對你的第一印象', '還沒熟識前會注意到的樣子'],
      excludedTargets: ['熟識後的溝通風格（屬於下一題）'],
      detailLabels: ['別人對你的第一印象', '還沒熟識前會注意到的樣子'],
      cautionFocus: 'detachment',
      evidenceBias: { preferPlanets: ['Mercury'], preferTypes: ['angle'] },
      indicators: [
      { type: 'angle', which: 'asc' }, { type: 'planet', key: 'Mercury' },
    ] },
    { id: 'social-comm-style', title: '我的溝通風格', intent: 'style', questionFocus: 'communication_style',
      answerTargets: ['你習慣的表達方式', '容易讓對方感覺到的溝通特質'],
      excludedTargets: ['第一印象（屬於上一題）'],
      detailLabels: ['你習慣的表達方式', '對方會感覺到的特質'],
      cautionFocus: 'shadow',
      evidenceBias: { preferPlanets: ['Mercury'], preferTypes: ['housePlanets', 'houseRuler'] },
      indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'housePlanets', house: 3 }, { type: 'houseRuler', house: 3 },
    ] },
    { id: 'social-group-role', title: '我在人群中的角色', intent: 'profile', questionFocus: 'group_role',
      answerTargets: ['你在群體中習慣扮演的角色', '別人會找你做的事'],
      excludedTargets: ['一對一的溝通風格'],
      detailLabels: ['你在群體中的角色', '別人會找你做的事'],
      cautionFocus: 'relational',
      evidenceBias: { preferPlanets: [], preferTypes: ['housePlanets', 'houseRuler'] },
      indicators: [
      { type: 'housePlanets', house: 11 }, { type: 'houseRuler', house: 11 },
    ] },
    { id: 'social-attract-friend', title: '我容易吸引哪類朋友', intent: 'attraction', questionFocus: 'friend_attraction',
      answerTargets: ['容易靠近你的朋友類型', '友誼中你在意的特質'],
      excludedTargets: ['戀愛對象的吸引類型'],
      detailLabels: ['容易靠近你的朋友類型', '友誼中你在意的特質'],
      cautionFocus: 'relational',
      evidenceBias: { preferPlanets: ['Venus'], preferTypes: ['houseRuler'], excludePlanets: ['Moon'] },
      indicators: [
      { type: 'houseRuler', house: 11 }, { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Moon' },
    ] },
    { id: 'social-strength', title: '我的人際優勢', intent: 'strength', questionFocus: 'social_strengths',
      answerTargets: ['你在人際中的優勢', '別人容易依賴你的部分'],
      excludedTargets: ['界線與衝突模式（屬於另一題）'],
      detailLabels: ['你在人際中的優勢', '別人依賴你的部分'],
      cautionFocus: 'vigilance',
      evidenceBias: { preferPlanets: ['Venus', 'Mercury'] },
      indicators: [
      { type: 'planet', key: 'Venus' }, { type: 'planet', key: 'Mercury' }, { type: 'angle', which: 'asc' },
    ] },
    { id: 'social-boundary-conflict', title: '我的界線與衝突模式', intent: 'tension', questionFocus: 'boundary_conflict_pattern',
      answerTargets: ['面對衝突時的直覺反應', '容易被跨越的界線'],
      excludedTargets: ['一般人際優勢（屬於另一題）'],
      detailLabels: ['面對衝突的反應', '容易被跨越的界線'],
      cautionFocus: 'shadow',
      evidenceBias: { preferPlanets: ['Moon'], preferTypes: ['houseRuler'] },
      indicators: [
      { type: 'houseRuler', house: 7 }, { type: 'planet', key: 'Moon' },
    ] },
    { id: 'social-circle-fit', title: '適合我的社交圈', intent: 'fit', questionFocus: 'social_circle_fit',
      answerTargets: ['適合你的社交圈類型', '讓你自在的群體氛圍'],
      excludedTargets: ['個別朋友的吸引特質（屬於另一題）'],
      detailLabels: ['適合的社交圈類型', '讓你自在的群體氛圍'],
      cautionFocus: 'growth',
      evidenceBias: { preferPlanets: ['Venus'], preferTypes: ['housePlanets', 'houseRuler'] },
      indicators: [
      { type: 'housePlanets', house: 11 }, { type: 'houseRuler', house: 11 }, { type: 'planet', key: 'Venus' },
    ] },
  ],
  study: [
    { id: 'study-learning-style', title: '適合我的學習方式', intent: 'style', questionFocus: 'learning_style',
      answerTargets: ['適合的學習方式', '容易吸收的教學節奏'],
      excludedTargets: ['資訊理解與記憶模式（屬於下一題）'],
      detailLabels: ['適合的學習方式', '容易吸收的節奏'],
      cautionFocus: 'imbalance',
      evidenceBias: { preferPlanets: ['Mercury'], preferTypes: ['housePlanets', 'houseRuler'] },
      indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'housePlanets', house: 3 }, { type: 'houseRuler', house: 3 },
    ] },
    { id: 'study-memory-mode', title: '我的資訊理解與記憶模式', intent: 'pattern', questionFocus: 'memory_mode',
      answerTargets: ['理解新資訊的方式', '容易記住的資訊類型'],
      excludedTargets: ['學習方式的整體偏好（屬於上一題）'],
      detailLabels: ['理解新資訊的方式', '容易記住的類型'],
      cautionFocus: 'imbalance',
      evidenceBias: { preferPlanets: ['Mercury', 'Saturn'] },
      indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Saturn' },
    ] },
    { id: 'study-procrastination', title: '容易拖延或分心的原因', intent: 'challenge', questionFocus: 'procrastination_root',
      answerTargets: ['容易拖延的根本原因', '分心時常見的觸發點'],
      excludedTargets: ['一般學習優勢（屬於另一題）'],
      detailLabels: ['拖延的根本原因', '分心的常見觸發點'],
      cautionFocus: 'shadow',
      evidenceBias: { preferPlanets: ['Saturn', 'Neptune', 'Uranus'] },
      indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Neptune' }, { type: 'planet', key: 'Uranus' },
    ] },
    { id: 'study-mode-fit', title: '適合語言、理論、實作或研究', intent: 'fit', questionFocus: 'study_mode_fit',
      answerTargets: ['適合的知識類型', '容易發揮實力的學習形式'],
      excludedTargets: ['海外或高等教育傾向（屬於另一題）'],
      detailLabels: ['適合的知識類型', '容易發揮實力的形式'],
      cautionFocus: 'growth',
      evidenceBias: { preferPlanets: ['Mercury', 'Jupiter'], preferTypes: ['houseRuler'] },
      indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Jupiter' }, { type: 'houseRuler', house: 9 },
    ] },
    { id: 'study-overseas', title: '海外學習或高等教育傾向', intent: 'direction', questionFocus: 'overseas_education_direction',
      answerTargets: ['海外或高等教育的傾向', '值得投入的長期學習方向'],
      excludedTargets: ['適合的學習形式（屬於另一題）'],
      detailLabels: ['海外或高等教育傾向', '值得投入的方向'],
      cautionFocus: 'overextension',
      evidenceBias: { preferPlanets: ['Jupiter'], preferTypes: ['housePlanets', 'houseRuler'] },
      indicators: [
      { type: 'housePlanets', house: 9 }, { type: 'houseRuler', house: 9 }, { type: 'planet', key: 'Jupiter' },
    ] },
    { id: 'study-rhythm', title: '如何建立有效的讀書節奏', intent: 'safety', questionFocus: 'study_rhythm',
      answerTargets: ['適合的讀書節奏', '維持專注的方式'],
      excludedTargets: ['拖延分心的根本原因（屬於另一題）'],
      detailLabels: ['適合的讀書節奏', '維持專注的方式'],
      cautionFocus: 'pressure',
      fieldOverride: { p: 'result', s: 'method' },
      evidenceBias: { preferPlanets: ['Saturn'], preferTypes: ['housePlanets'] },
      indicators: [
      { type: 'planet', key: 'Saturn' }, { type: 'planet', key: 'Mercury' }, { type: 'housePlanets', house: 6 },
    ] },
    { id: 'study-strength-blindspot', title: '我的學習優勢與盲點', intent: 'strength', questionFocus: 'study_strength_blindspot',
      answerTargets: ['學習上的明顯優勢', '需要留意的學習盲點'],
      excludedTargets: ['拖延分心的細節原因（屬於另一題）'],
      detailLabels: ['學習上的優勢', '需要留意的盲點'],
      cautionFocus: 'imbalance',
      evidenceBias: { preferPlanets: ['Mercury', 'Jupiter'], preferTypes: ['houseRuler'] },
      indicators: [
      { type: 'planet', key: 'Mercury' }, { type: 'planet', key: 'Jupiter' }, { type: 'planet', key: 'Saturn' }, { type: 'houseRuler', house: 3 },
    ] },
  ],
  general: [
    { id: 'general-top-themes', title: '命盤最重要的三個人生主題', intent: 'overview', questionFocus: 'top_life_themes',
      answerTargets: ['命盤中最突出的主題', '這些主題彼此的關聯'],
      excludedTargets: ['單一配置的細節解讀'],
      detailLabels: ['命盤中最突出的主題', '主題之間的關聯'],
      cautionFocus: 'vigilance',
      evidenceBias: { preferTypes: ['angularPlanets', 'stelliumHouse'] },
      indicators: [
      { type: 'angularPlanets' }, { type: 'elementQualityBalance' }, { type: 'nodeAxis' }, { type: 'stelliumHouse' },
    ] },
    { id: 'general-core-strength', title: '我的核心優勢', intent: 'strength', questionFocus: 'core_strength',
      answerTargets: ['命盤中最核心的優勢', '這股優勢展現的方式'],
      excludedTargets: ['反覆出現的課題（屬於另一題）'],
      detailLabels: ['命盤中最核心的優勢', '這股優勢展現的方式'],
      cautionFocus: 'vigilance',
      evidenceBias: { preferPlanets: ['Sun'], preferTypes: ['chartRuler'] },
      indicators: [
      { type: 'planet', key: 'Sun' }, { type: 'chartRuler' }, { type: 'elementQualityBalance' },
    ] },
    { id: 'general-recurring-issue', title: '最容易反覆出現的課題', intent: 'challenge', questionFocus: 'recurring_life_issue',
      answerTargets: ['反覆出現的核心課題', '這個課題通常出現的情境'],
      excludedTargets: ['命盤核心優勢（屬於另一題）'],
      detailLabels: ['反覆出現的課題', '通常出現的情境'],
      cautionFocus: 'shadow',
      evidenceBias: { preferTypes: ['nodeAxis', 'tightAspectsAmongPersonal'] },
      indicators: [
      { type: 'nodeAxis' }, { type: 'planet', key: 'Saturn' }, { type: 'tightAspectsAmongPersonal' },
    ] },
    { id: 'general-priority-direction', title: '適合優先發展的方向', intent: 'direction', questionFocus: 'priority_direction',
      answerTargets: ['值得優先投入的方向', '這個方向成熟後的樣子'],
      excludedTargets: ['目前最突出的能量（屬於另一題）'],
      detailLabels: ['值得優先投入的方向', '成熟後的樣子'],
      cautionFocus: 'growth',
      evidenceBias: { preferPlanets: ['Sun', 'Jupiter'], preferTypes: ['chartRuler'] },
      indicators: [
      { type: 'planet', key: 'Sun' }, { type: 'planet', key: 'Jupiter' }, { type: 'chartRuler' },
    ] },
    { id: 'general-standout-energy', title: '哪些能量在命盤中最突出', intent: 'overview', questionFocus: 'standout_energy',
      answerTargets: ['命盤中最突出的能量分布', '這股能量具體展現的方式'],
      excludedTargets: ['命盤最重要的人生主題（屬於另一題）'],
      detailLabels: ['最突出的能量分布', '具體展現的方式'],
      cautionFocus: 'imbalance',
      fieldOverride: { s: 'behavior' },
      evidenceBias: { preferTypes: ['elementQualityBalance', 'angularPlanets'] },
      indicators: [
      { type: 'elementQualityBalance' }, { type: 'angularPlanets' }, { type: 'stelliumHouse' },
    ] },
    { id: 'general-inner-tension', title: '如何平衡目前的內在矛盾', intent: 'tension', questionFocus: 'inner_tension_balance',
      answerTargets: ['內在拉扯的兩股力量', '練習整合的方向'],
      excludedTargets: ['單一課題的細節（屬於另一題）'],
      detailLabels: ['內在拉扯的兩股力量', '練習整合的方向'],
      cautionFocus: 'pressure',
      evidenceBias: { preferTypes: ['tightAspectsAmongPersonal', 'elementQualityBalance'] },
      indicators: [
      { type: 'tightAspectsAmongPersonal' }, { type: 'elementQualityBalance' },
    ] },
  ],
};

/* ================= V2：Question Definition 支援欄位 =================
   intent 決定同一組占星配置預設要引用哪些欄位、套用哪一組模板池（見下方
   INTENT_FRAMES）。有些 intent 是規格明確要求的精確名稱（partner_profile／
   attraction_pattern／appearance_and_vibe／career_direction／career_strength），
   透過 INTENT_ALIAS 對應到實際的 frame；同一個 intent 底下如果有兩題以上語意
   不同（例如 career_direction 底下的「適合哪類型工作」跟「適合什麼工作環境」），
   則由題目自己的 fieldOverride 覆寫要引用的欄位，確保「同一 intent、不同
   questionFocus」仍然長出不同內容，而不是只換句型骨架。
   缺 answerTargets／excludedTargets／detailLabels 的題目，會在下方迴圈用
   INTENT_DEFAULT_META 依 intent 自動補上預設值（目前 56 題已全部手動指定，
   這個 fallback 只在未來新增題目忘記填欄位時當安全網）。 */
var INTENT_ALIAS = {
  partner_profile: 'profile', attraction_pattern: 'attraction', appearance_and_vibe: 'appearance',
  career_direction: 'fit', career_strength: 'capability',
};
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
  context: { labels: ['可能出現的場合', '適合的情境'] },
};
/* ================= V2.2（Topic-aware Evidence Projection）：cautionMode 預設值 =================
   不是每題都需要顯示「留意」——依 intent 給預設值，個別題目仍可用 q.cautionMode
   明確覆寫。required：這個 intent 本質上就是在講風險／課題，一定要有留意
   （challenge/tension/origin）。hidden：這個 intent 本質上在講外觀／印象／場合，
   硬塞留意反而答非所問（appearance/impression/context）。其餘 optional：只有在
   caution 內容跟 headline/summary/details 沒有語意重疊、且找得到有意義的
   cautionFocus 對應內容時才顯示，避免每題都硬塞一句留意。 */
var INTENT_CAUTION_MODE_DEFAULT = {
  challenge: 'required', tension: 'required', origin: 'required',
  appearance: 'hidden', impression: 'hidden', context: 'hidden',
};
(function fillNatalQuestionDefaults() {
  Object.keys(NATAL_TOPIC_QUESTIONS).forEach(function (topicKey) {
    NATAL_TOPIC_QUESTIONS[topicKey].forEach(function (q) {
      var baseIntent = INTENT_ALIAS[q.intent] || q.intent || 'overview';
      var meta = INTENT_DEFAULT_META[baseIntent] || INTENT_DEFAULT_META.overview;
      if (!q.questionFocus) q.questionFocus = q.id.replace(/-/g, '_');
      if (!q.detailLabels) q.detailLabels = meta.labels.slice();
      if (!q.answerTargets) q.answerTargets = meta.labels.slice();
      if (!q.excludedTargets) q.excludedTargets = [];
      if (!q.cautionFocus) q.cautionFocus = 'vigilance';
      if (!q.cautionMode) q.cautionMode = INTENT_CAUTION_MODE_DEFAULT[baseIntent] || 'optional';
      if (!q.evidenceBias) q.evidenceBias = {};
      if (!q.evidenceBias.preferPlanets) q.evidenceBias.preferPlanets = q.indicators.filter(function (i) { return i.type === 'planet'; }).map(function (i) { return i.key; });
      if (!q.evidenceBias.preferTypes) q.evidenceBias.preferTypes = [];
      if (!q.evidenceBias.excludePlanets) q.evidenceBias.excludePlanets = [];
      /* 向下相容：舊版程式碼可能還在讀 preferredPlanets／excludedPlanets 這兩個
         扁平欄位（V2.0 的命名），這裡鏡射一份，新舊命名同時可用。 */
      q.preferredPlanets = q.evidenceBias.preferPlanets;
      q.excludedPlanets = q.evidenceBias.excludePlanets;
    });
  });
})();

/* ================= V2.1：情境化解讀（同一組配置，依 intent + questionFocus
   講出不同角度） =================
   欄位對照全部沿用既有的 PLANET_BEGINNER／SIGN_BEGINNER／HOUSE_BEGINNER（見
   astrology-core-data.js），不重寫內容庫本身；只是依照題目的 intent（必要時
   被題目的 fieldOverride 覆寫），挑選「這個角度該引用哪些欄位」。coreNeed0
   代表 PLANET_BEGINNER 的 coreNeed[0]。
   headlineTpl／summaryTpl／detailTpl 是三個獨立的句型池（各自至少 3-4 種
   句法結構，不是同一句換形容詞），避免「你較容易……／你通常會……／對方
   可能……」變成幾乎所有 headline 的固定開頭。實際套用文字的邏輯在 app.js 的
   contextualizeEvidence()。 */
var INTENT_FRAMES = {
  overview: { p: 'function', s: 'mode', h: 'lifeArea',
    headlineTpl: ['{S_}，核心動力來自於{P_}。', '比起表面表現，真正驅動你的是{P_}——具體展現為{S_}。', '這部分的基調可以用一句話概括：{S_}。', '把這股能量攤開來看，關鍵在於{P_}，實際樣子是{S_}。'],
    summaryTpl: ['再往下看一層，{H_}正是這股能量會被放大的場域。', '這股傾向不只停留在想法，也會延伸到{H_}這個生活領域。', '長期而言，{P_}會持續影響你怎麼看待{H_}。', '{S_}——這個習慣多半是圍繞著{H_}在運作。'],
    detailTpl: ['{P_}', '{S_}', '主要落在「{H_}」這個領域'] },
  profile: { p: 'coreNeed0', s: 'behavior', h: 'area',
    headlineTpl: ['較容易遇到{S_}的人或情境。', '你身邊常出現的，通常是{S_}的人或狀況。', '仔細看的話，會發現你在意的其實是對方能不能「{P_}」。', '如果要用一個畫面形容，大概是{S_}的人或場合特別容易靠近你。'],
    summaryTpl: ['這背後其實跟你在意「{P_}」有關，不是巧合。', '你會不自覺被拉向這種狀況，因為這正好呼應了「{P_}」這個需要。', '換句話說，{S_}的人或情境，比較容易讓你放心。', '這種傾向的核心，是你希望有人能理解「{P_}」。'],
    detailTpl: ['{S_}', '重視「{P_}」', '常見場合：{H_}'] },
  attraction: { p: 'verb', s: 'motivation',
    headlineTpl: ['容易被「{S_}」的人吸引。', '會不自覺被{S_}的人打動。', '心動的關鍵往往不是外表，而是對方是不是也想{P_}。', '比起條件清單，真正讓你心動的是{S_}這種特質。'],
    summaryTpl: ['這也跟你自己也想{P_}的傾向互相呼應。', '因為你自己也{P_}，看到同樣特質的人會特別有共鳴。', '這股吸引力的核心，其實是你自己也在{P_}。', '換個角度說，會吸引你的人，多半也理解{P_}這件事。'],
    detailTpl: ['{S_}', '呼應你想{P_}的傾向'] },
  appearance: { vibe: true,
    headlineTpl: ['對方可能帶有{VIBE}的氣質。', '外型與氣場上，容易遇到{VIBE}的人。', '第一眼的印象，通常會落在{VIBE}這個調性上。', '氣質這塊，比較常出現{VIBE}的樣子。'],
    summaryTpl: ['這種氣質不一定明顯外顯，相處後會慢慢感覺出來。', '這是風格傾向的象徵性描述，實際樣貌仍因人而異。', '這股氣場通常在初次見面時就能感覺到。', '外型細節每個人不同，但整體調性容易落在這個方向。'],
    detailTpl: ['{VIBE}'] },
  style: { p: 'function', s: 'method', h: 'coreQuestion',
    headlineTpl: ['適合的模式是{S_}。', '比較合拍的方式是{S_}。', '與其硬套單一做法，你更適合{S_}這種節奏。', '關鍵不在做什麼，而在於怎麼做——你的答案是{S_}。'],
    summaryTpl: ['背後其實是在滿足「{P_}」這個需要。', '這個方式之所以有效，是因為呼應了{P_}。', '換句話說，這其實也在回答「{H_}」這個問題。', '長期來看，{P_}會是判斷這個模式適不適合的關鍵。'],
    detailTpl: ['{S_}', '對應需求：{P_}'] },
  strength: { p: 'strength', s: 'strength',
    headlineTpl: ['{P_}。', '你的優勢在於{S_}。', '如果要挑一項最明顯的長處，會是{S_}。', '別人常常先注意到的，是{P_}這一點。'],
    summaryTpl: ['加上{S_}，兩者放在一起會更完整。', '這股優勢通常在需要的時候才會展現，平常不一定明顯。', '{S_}——這是可以持續累積、不容易被取代的部分。', '這份能力值得被有意識地運用，而不只是順其自然。'],
    detailTpl: ['{P_}', '{S_}'] },
  challenge: { p: 'watch', s: 'watch', h: 'growthTask',
    headlineTpl: ['{P_}。', '需要留意的是{S_}。', '容易卡關的地方，往往是{S_}。', '如果最近覺得卡住，可以先檢查是不是{P_}。'],
    summaryTpl: ['{S_}，這部分值得多留意。', '這個課題不需要急著解決，慢慢練習「{H_}」就好。', '壓力大的時候，這一點通常會特別明顯。', '不是要你完全改掉，而是練習多一點覺察。'],
    detailTpl: ['{P_}', '{S_}'] },
  value: { p: 'coreNeed0', s: 'motivation',
    headlineTpl: ['你真正在意的是「{P_}」。', '長期而言，「{P_}」比表面條件更重要。', '拆到最後，你要的其實不是條件，而是「{P_}」這種感覺。', '如果對方能理解「{P_}」，其他細節反而沒那麼重要。'],
    summaryTpl: ['這也跟你{S_}的傾向有關。', '這份重視背後，其實是你{S_}。', '這不是挑剔，而是你很清楚自己{S_}。', '時間拉長來看，這一點會比一開始的心動更關鍵。'],
    detailTpl: ['重視「{P_}」', '{S_}'] },
  environment: { h: 'area', s: 'mode',
    headlineTpl: ['適合{H_}的環境。', '{H_}——這種場合會讓你比較自在。', '比起氛圍好壞，你更在意環境能不能配合你{S_}的步調。', '換個場景想像：{H_}會是你表現得最自然的地方。'],
    summaryTpl: ['這也比較貼近你習慣{S_}的步調。', '因為你習慣{S_}，太吵雜或太鬆散的環境反而不合適。', '環境條件比職稱本身更影響你的狀態。', '這不只是喜好，而是實際會影響你表現的因素。'],
    detailTpl: ['{H_}', '步調：{S_}'] },
  fit: { s: 'method', p: 'result',
    headlineTpl: ['比較適合{S_}的方式。', '用{S_}的步調進行，會比較順手。', '與其勉強配合別人的節奏，你更適合{S_}。', '判斷合不合適的關鍵，通常在於能不能{S_}。'],
    summaryTpl: ['這樣能讓你{P_}。', '最終目的是{P_}，方式其實可以有彈性。', '走這條路線，比較容易讓你感覺{P_}。', '不用勉強套用別人的做法，找到自己的節奏更重要。'],
    detailTpl: ['{S_}', '目標：{P_}'] },
  capability: { p: 'verb', p2: 'function',
    headlineTpl: ['你擅長{P_}。', '核心能力在於{P2_}。', '如果要挑一項拿手的，會是{P_}這件事。', '別人可能沒注意到，但你其實很會{P_}。'],
    summaryTpl: ['具體展現在你很會{P_}，核心則是{P2_}。', '這項能力累積久了，會變成別人取代不了的部分。', '{P2_}——這是這項能力最根本的來源。', '這不只是天賦，也是可以持續練習變強的方向。'],
    detailTpl: ['{P_}', '{P2_}'] },
  direction: { h: 'lifeArea', p: 'matureAim',
    headlineTpl: ['方向上可以朝{H_}前進。', '{H_}是值得投入的方向。', '與其分散力氣，不如把重心放在{H_}。', '長期目標可以設定為{P_}，路徑則是{H_}。'],
    summaryTpl: ['慢慢做到{P_}，會是這個方向的成熟樣子。', '不用急，這是需要時間累積的方向。', '這個方向不一定馬上看到成果，但值得持續投入。', '{P_}——這是檢查自己是否走在對的路上的指標。'],
    detailTpl: ['{H_}', '目標：{P_}'] },
  pattern: { p: 'verb', s: 'mode',
    headlineTpl: ['你的習慣模式是{S_}。', '遇到狀況時你傾向{S_}。', '仔細觀察會發現，你多半是{S_}這種反應。', '不是每次都這樣，但{S_}是你比較常見的模式。'],
    summaryTpl: ['具體展現在你會想{P_}。', '這個模式背後，其實是你想{P_}。', '這種習慣不一定是壞事，只是值得有意識地覺察。', '換個情境可能會不一樣，但這是你預設的反應方式。'],
    detailTpl: ['{S_}', '想{P_}'] },
  safety: { p: 'result', s: 'behavior',
    headlineTpl: ['能讓你安定下來的方式是{P_}。', '{S_}——這麼做通常能幫你找回穩定的感覺。', '與其硬撐，你更需要透過{S_}來喘口氣。', '真正能安撫你的，往往不是道理，而是{S_}這個動作。'],
    summaryTpl: ['可以透過{S_}來練習。', '這不是逃避，而是你需要的恢復方式。', '{P_}——這是你判斷自己是否真的休息夠的標準。', '值得刻意留時間做這件事，而不是等到撐不住才想起來。'],
    detailTpl: ['{S_}', '{P_}'] },
  impression: { s: 'behavior',
    headlineTpl: ['你給人的第一印象是{S_}。', '初次見面時你通常會{S_}。', '別人對你的第一印象，多半來自於{S_}這種樣子。', '還沒開口之前，{S_}就已經是別人接收到的訊號。'],
    summaryTpl: ['這個印象通常會在互動幾次後有所調整。', '這不代表你的全部，但確實是別人最先看到的一面。', '這種第一印象有時準確，有時只是表面。', '了解這一點，能幫你判斷要不要主動多解釋自己。'],
    detailTpl: ['{S_}'] },
  tension: { p: 'watch', s: 'shadow',
    headlineTpl: ['容易卡住的地方是{S_}。', '需要練習的課題是{S_}。', '衝突往往不是因為別人，而是{S_}這個慣性。', '如果常常覺得卡關，可以檢查是不是{P_}。'],
    summaryTpl: ['同時也提醒自己{P_}。', '這個模式在關係緊張時特別容易出現。', '不需要苛責自己，先看見這個慣性就是第一步。', '練習的重點不是壓抑，而是找到更適合的表達方式。'],
    detailTpl: ['{S_}', '{P_}'] },
  origin: { h: 'growthTask', p: 'imbalance',
    headlineTpl: ['過去的經驗可能讓你{P_}。', '{H_}——這是現在可以練習的地方。', '有些反應其實不是現在的問題，而是延續自過去{P_}的慣性。', '回頭看的話，會發現這個模式其實有跡可循。'],
    summaryTpl: ['現在可以練習的地方是{H_}。', '這不是要否定過去，而是給自己重新選擇的空間。', '這個影響不一定明顯，但確實在背後默默運作。', '看見這一點，本身就是往前走的開始。'],
    detailTpl: ['{P_}', '{H_}'] },
  context: { s: 'mode', h: 'activation',
    headlineTpl: ['比較容易發生在{H_}的時候。', '{H_}——這種情境下更容易自然地展開。', '與其刻意安排，不如留意{H_}這種場合。', '場合不用刻意講究，重點是能讓你{S_}。'],
    summaryTpl: ['因為你在這種情境下比較能自在地{S_}。', '這種場合能讓彼此有空間慢慢認識，而不是急著下結論。', '不用等特別的場合，日常的{H_}就有機會。', '重點不是場地本身，而是那個當下你能不能放鬆地{S_}。'],
    detailTpl: ['{H_}', '{S_}'] },
};
/* appearance 專用：只描述外型／氣場的印象，完全不碰情緒需求或內在性格字眼，
   避免「外型題卻在講情緒管理」這個明確被規格禁止的問題。每則短語都刻意涵蓋
   「氣質調性」＋「給人的觀感」兩層，方便品質檢查用關鍵字判斷是否命中
   visualStyle／firstImpression／presentation 其中至少兩類。 */
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

/* ================= V2.1：留意（caution）專用的欄位對照＋句型池 =================
   取代原本所有題目的「留意」段落都套用同一個 challenge intent 寫法的做法。
   cautionFocus 指到這裡的某一組，欄位對照刻意只用 watch／shadow／imbalance／
   growthTask 這幾個本來就偏「需要留意」語氣的欄位，用不同組合／不同句型
   讓留意段落也能因題而異，而不是每題都長一樣。 */
var CAUTION_FOCUS_FRAMES = {
  vigilance: { p: 'watch', s: 'watch',
    tpl: ['{P_}。{S_}。', '需要留意的是{S_}，也提醒自己{P_}。', '壓力大的時候，{S_}這一點容易特別明顯。', '不用急著改，先練習多留意{P_}就好。'] },
  shadow: { p: 'watch', s: 'shadow',
    tpl: ['{S_}，也提醒自己{P_}。', '容易卡住的地方是{S_}。', '這個慣性在關係緊張時特別容易浮現：{S_}。', '練習的重點是覺察，而不是苛責自己：{P_}。'] },
  imbalance: { p: 'imbalance', s: 'watch',
    tpl: ['{P_}，也留意{S_}。', '容易失衡的地方是{P_}。', '這一點在太累或太投入時最容易出現：{P_}。', '值得練習的是，別讓{S_}變成長期習慣。'] },
  growth: { p: 'watch', h: 'growthTask',
    tpl: ['{P_}，可以練習的方向是{H_}。', '成長課題在於{H_}。', '這不是要馬上解決，慢慢練習「{H_}」就好。', '留意{P_}，同時給自己練習{H_}的空間。'] },
  overextension: { p: 'imbalance', h: 'growthTask',
    tpl: ['容易{P_}，需要練習{H_}。', '過度投入時容易{P_}。', '{H_}——這是避免{P_}的關鍵練習。', '值得提醒自己：不是所有事都要一次扛下來。'] },
  relational: { s: 'shadow', h: 'growthTask',
    tpl: ['{S_}，可以練習{H_}。', '關係緊張時容易出現：{S_}。', '{H_}是這裡值得投入的練習方向。', '不需要一次改變，先從覺察{S_}開始。'] },
  pressure: { p: 'imbalance', s: 'shadow',
    tpl: ['{P_}，也留意{S_}。', '容易對自己太嚴格，具體表現是{P_}。', '{S_}——這是壓力累積時比較容易出現的樣子。', '練習對自己寬容一點，別讓{P_}變成常態。'] },
  detachment: { p: 'watch', s: 'motivation',
    tpl: ['{P_}。這也跟你{S_}的傾向有關。', '有時候會不自覺地保持距離，因為{S_}。', '留意{P_}，尤其是在感覺不被理解的時候。', '這不是不在乎，而是保護自己的一種方式。'] },
};

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

/* ================= V2.2：Topic-aware Evidence Projection ＝================
   解決「HOUSE_BEGINNER 等原始宮位描述直接進入不相關主題正文」的根因：舊版
   contextualizeEvidence 不管題目屬於哪個主題，宮位一律讀 HOUSE_BEGINNER 的
   area/lifeArea 這類「泛用」欄位，導致例如「適合什麼工作環境」這種事業題，
   只要主導證據落在第5宮，就會直接印出「戀愛、創作、玩樂」這種完全跟事業
   無關的原始宮位關鍵字。

   HOUSE_TOPIC_PROJECTION：同一個宮位，依「這題屬於哪一種語意類別
   （category）」給出不同的短語，取代原始 HOUSE_BEGINNER 欄位。8 個類別＋
   一個 general 安全預設（沒有對應到明確類別、或該類別暫時想不出更精準說法
   時使用，內容仍刻意保持主題中性，不含戀愛／玩樂這類特定領域字眼）。
   索引 0 = 第1宮…索引 11 = 第12宮。 */
var HOUSE_TOPIC_PROJECTION = {
  meeting_context: [
    '透過自己主動展現、率先開口的場合', '跟金錢、消費或評估價值有關的場合', '日常的閒聊、鄰里或短途往來之間',
    '家庭聚會、親友介紹或私下熟識的圈子', '興趣活動、娛樂、創作、表演或輕鬆社交場合', '工作場合、日常服務往來或例行事務中',
    '因合作、需要協調而自然配對的場合', '深談、危機互相扶持或共同利益的場合', '旅行、進修、講座或接觸新觀點的場合',
    '工作場域、公開活動或專業社群裡', '朋友圈、社團或共同理想的團體活動中', '安靜獨處後偶然的機緣，或透過共同的內在連結',
  ],
  suitable_roles: [
    '需要自己拿主意、獨當一面的角色', '評估價值、掌管資源或建立個人品牌的角色', '溝通協調、資訊整理或教學傳播的角色',
    '照顧、後勤支援或需要穩定基礎的角色', '創作、企劃、教育、表演、內容或需要個人表現的工作角色', '流程執行、品質把關或服務他人的角色',
    '合作洽談、顧問或需要對接他人的角色', '危機處理、資源整合或深度分析的角色', '教育訓練、國際事務或提出願景的角色',
    '需要承擔公開責任、建立專業聲望的角色', '社群經營、統籌團隊或推動理念的角色', '幕後研究、支援或需要獨立空間的角色',
  ],
  suitable_environment: [
    '能讓你自己拿主意、快速上手的環境', '重視實質產出與具體回報的環境', '步調靈活、需要頻繁溝通交流的環境',
    '穩定、有安全感、像自己人的團隊氛圍', '能自由表達、創造作品、獲得即時回饋與展現個人風格的環境', '流程清楚、能務實把事情做好的環境',
    '需要密切合作、一對一討論的環境', '容許深度投入、處理複雜或敏感事務的環境', '能持續學習、接觸新觀點的開放環境',
    '看得到具體成果與社會肯定的環境', '重視理念、團隊感強的社群式環境', '安靜、彈性、能獨立作業的環境',
  ],
  achievement_source: [
    '靠自己開創、被看見的成果', '累積穩固的資源與自我價值感', '把想法說清楚、影響身邊的人',
    '把一個地方或關係經營得穩固', '透過創造、表現、帶來樂趣或獲得作品回饋產生成就感', '把事情確實做好、幫上別人的忙',
    '跟另一個人或夥伴一起把事情完成', '陪自己或別人走過關鍵的轉折', '拓展視野、傳遞一個更大的信念',
    '在公眾面前被認可的專業成果', '跟一群人一起推動共同的理想', '在安靜中完成有意義的內在工作',
  ],
  monetizable_skills: [
    '個人品牌、率先行動的執行力', '判斷價值、管理資源的能力', '溝通、寫作、教學或資訊整理的能力',
    '照護、後勤或穩定經營的能力', '創意、內容、個人品牌、娛樂或教育型能力', '流程優化、品質把關或專業服務',
    '協調談判、顧問或媒合資源的能力', '資源整合、風險判斷或深度分析', '跨領域知識、教學或國際連結',
    '公開專業形象所帶來的信任與機會', '社群經營、人脈與集體資源整合', '幕後研究、系統化或獨立作業的能力',
  ],
  long_term_direction: [
    '持續活出自己的主見，成為能獨當一面的人', '累積穩固的資源與不可取代的專業價值', '成為能把複雜資訊說清楚、值得信賴的溝通者',
    '打造一個能長期依靠的根基（無論是團隊或家庭事業）', '把創造力或個人風格變成長期作品或事業', '成為把細節與流程做到位、值得信任的專業者',
    '在合作或顧問角色裡建立長期信任關係', '成為能處理複雜局面、值得託付的關鍵角色', '成為某個領域裡值得請教的引路人',
    '長期發展需要把重心放在能持續累積專業聲望與社會影響力的方向', '成為能號召一群人、推動共同願景的角色', '在專業幕後累積深厚、不易被取代的功力',
  ],
  family_context: [
    '在家裡習慣先站出來、主動處理事情的角色', '在家裡負責掌管資源或穩定物質基礎的角色', '在家裡負責溝通協調、傳遞消息的角色',
    '在家裡是情感重心、負責維繫歸屬感的角色', '在家裡帶來歡樂、創意或陪伴玩樂的角色', '在家裡負責打理日常、照顧起居的角色',
    '在家裡負責協調不同成員、維持平衡的角色', '在家裡承擔比較沉重的責任或危機時刻的角色', '在家裡負責帶來新觀點或推動改變的角色',
    '在家裡被期待要有成就、撐起門面的角色', '在家裡比較像朋友、負責串連情感的角色', '在家裡負責默默承擔、不張揚的角色',
  ],
  general: [
    '自我展現與新開始', '資源運用與自我價值', '溝通交流與日常學習', '家庭根基與內在安全感',
    '創造表現與情感投入', '日常事務與自我要求', '合作關係與一對一連結', '深層信任與資源整合',
    '視野拓展與信念方向', '公眾角色與長期成就', '群體歸屬與共同理想', '內在沉澱與獨立空間',
  ],
};
/* questionFocus → HOUSE_TOPIC_PROJECTION 類別對照。沒對到的一律落到 general
   （安全、主題中性的預設，不會出現戀愛/玩樂這類跟主題無關的字眼）。 */
var QUESTIONFOCUS_HOUSE_CATEGORY = {
  likely_partner_traits: 'partner_profile',
  emotional_attraction: 'attraction_pattern',
  meeting_context: 'meeting_context',
  partner_visual_impression: 'appearance_vibe',
  preferred_relationship_style: 'relationship_style',
  relationship_strengths: 'relationship_strength',
  relationship_blindspot: 'relationship_challenge',
  longterm_relationship_values: 'relationship_values',
  suitable_roles: 'suitable_roles',
  workplace_advantages: 'suitable_roles',
  suitable_environment: 'suitable_environment',
  employment_mode: 'employment_mode',
  career_blindspot: 'career_challenge',
  career_fulfillment_area: 'achievement_source',
  monetizable_skills: 'monetizable_skills',
  wealth_monetizable_skills: 'monetizable_skills',
  longterm_career_direction: 'long_term_direction',
  stable_financial_structure: 'long_term_direction',
  earning_style: 'wealth_earning',
  spend_save_pattern: 'wealth_behavior',
  risk_attitude: 'wealth_risk',
  solo_or_shared_resource: 'wealth_resources',
  financial_blindspot: 'wealth_challenge',
  family_role: 'family_context',
  family_origin_impact: 'family_context',
  family_boundary_setting: 'family_context',
  living_environment: 'family_context',
  inner_safety_practice: 'family_context',
  family_career_balance: 'family_context',
  family_core_lesson: 'family_context',
  stress_reaction_pattern: 'health_stress',
  lifestyle_fit: 'health_lifestyle',
  body_boundary_blindspot: 'health_boundary',
  emotion_body_link: 'health_emotion',
  self_care_practice: 'health_selfcare',
  rest_rhythm: 'health_rest',
  first_impression: 'social_impression',
  communication_style: 'social_communication',
  group_role: 'social_group',
  friend_attraction: 'social_attraction',
  social_strengths: 'social_strength',
  boundary_conflict_pattern: 'social_boundary',
  social_circle_fit: 'social_circle',
  learning_style: 'study_learning',
  memory_mode: 'study_memory',
  procrastination_root: 'study_block',
  study_mode_fit: 'study_mode',
  overseas_education_direction: 'study_overseas',
  study_rhythm: 'study_rhythm',
  study_strength_blindspot: 'study_balance',
  top_life_themes: 'general_theme',
  core_strength: 'general_strength',
  recurring_life_issue: 'general_challenge',
  priority_direction: 'general_direction',
  standout_energy: 'general_energy',
  inner_tension_balance: 'general_tension',
};
/* 角宮本身沒有宮位號碼（e.house 是 null），但角宮跟特定宮位在意義上是連動的
   （上升＝第1宮宮頭、天頂＝第10宮宮頭、下降＝第7宮宮頭、天底＝第4宮宮頭）。
   這裡給角宮證據一個「虛擬宮位」，讓它也能走 HOUSE_TOPIC_PROJECTION 這條路，
   不再因為沒有 house 欄位而落到「角宮位置，對這個主題有較高的代表性」這種
   技術性 fallback。 */
var ANGLE_VIRTUAL_HOUSE = { asc: 1, mc: 10, dsc: 7, ic: 4 };
/* 只允許出現在「查看占星依據」摺疊區的技術術語／內部欄位名稱，正文（headline/
   summary/details/caution）一律不得出現，供 app.js 的 leak 檢查與 outMeta.
   forbiddenTerms 使用。 */
var NATAL_FORBIDDEN_TECHNICAL_TERMS = ['角宮位置', '角宮對分', '宮主星', '第幾宮主星', '權重', '代表性較高', '指標角色', 'canonicalKey', 'sourceRoles', 'evidenceBias'];
/* summary 偵測到即將跟 headline 重複表達同一件事時（例如沒有獨立的第二筆
   證據可用），改用「解釋型」句型：不重述結論，而是說明「為什麼」——把
   headline 主要證據本身的兩個面向（{A}／{B}）並列，說明它們如何互相印證。 */
var NATAL_REASON_TPL = [
  '因為你的主要證據同時強調「{A}」與「{B}」，太過僵化或只講求表面配合的做法反而較難讓你長期投入。',
  '這個結論背後的依據同時指向「{A}」與「{B}」，兩者疊加後會讓這個傾向更明顯，而不只是單一巧合。',
  '會這樣判斷，是因為「{A}」與「{B}」這兩個線索指向同一個方向，彼此互相印證，不是各自獨立的巧合。',
  '之所以這麼說，是「{A}」的部分被「{B}」進一步強化，兩者合在一起會比單看一項更有說服力。',
];
/* 徹底找不到任何欄位可用時的最後防線（取代直接印出 e.reason 這種技術性
   原始說明）——語氣中性、不承諾具體內容，且刻意避開品質驗證會抓的空話
   （「對這個主題具有較高代表性」「這個需要」「這件事」等）。 */
var NATAL_NEUTRAL_FALLBACK_TPL = [
  '這項配置的影響比較細微，建議搭配其他線索一起看。',
  '單一配置看不出明顯差異，實際情況會因整體命盤而有所不同。',
  '這部分暫時沒有足夠具體的線索，可以留意其他面向的訊號。',
  '這項指標本身的訊號較弱，不必過度解讀單一項目。',
];
