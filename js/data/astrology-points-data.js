var EXTRA_POINT_DEFS = [
  { key: 'Node', zh: '北交點', sym: '☊', meaning: '這一世要學習發展的方向與課題', kw: '成長方向' },
  { key: 'SNode', zh: '南交點', sym: '☋', meaning: '與生俱來熟悉的慣性、需要放下的舒適圈', kw: '慣性舒適圈' },
  { key: 'Lilith', zh: '莉莉絲', sym: '⚸', meaning: '原始慾望、陰影面與不受馴服的自我', kw: '原始慾望' },
  { key: 'Chiron', zh: '凱龍星', sym: '⚷', meaning: '深層的傷痛議題，以及由傷痛淬煉出的療癒天賦', kw: '傷痛療癒' },
  { key: 'Fortune', zh: '福點', sym: '⊕', meaning: '外在幸福感與資源自然匯聚之處', kw: '幸福資源' },
  { key: 'Vertex', zh: '命定點', sym: 'Vx', meaning: '命定般的相遇、帶來轉折的關係與際遇', kw: '命定相遇' },
];
/* 使用者介面專用名稱對照：EXTRA_POINT_DEFS[].zh 仍保留原字串（astroCopyForAI 直接讀
   這個欄位，改了就會讓複製文字相對 baseline 跑掉，那個全面更新留給 R5 統一處理）。
   這裡只給 renderAstro()／extraPointReading() 這類「畫面與 R2 解讀文案」用的顯示名稱
   蓋掉「命定點」——Vertex 的宿命感字眼與「不可宿命化」的文案安全要求衝突，其餘五個
   點沿用原本的 .zh，不需要對照表。 */
var EXTRA_POINT_DISPLAY_NAMES = { Vertex: '頂點' };
var POINT_BEGINNER = {
  Node:{plain:'這是你還不太熟悉，但人生會一次次邀請你練習的方向。',strength:'願意跨出舒適圈後，會感覺自己持續在成長。',watch:'不必逼自己立刻做到；它本來就是需要時間練習的課題。',
    primaryLabel:'成長方向',coreFunction:'練習還不熟練的能力',motivation:'想突破舒適圈，發展還沒被開發的可能性',expression:'一開始會覺得生疏、不太順手，需要刻意練習才會上手',matureUse:'能逐漸把陌生的能力練成日常可用的技能',imbalance:'因不熟悉而放棄或勉強',growthDirection:'可以從小步驟開始練習，不需要立刻做到完美'},
  SNode:{plain:'這是你很自然就會使用的舊習慣與熟悉能力。',strength:'遇到壓力時，它能讓你快速找到熟悉的處理方式。',watch:'太依賴它可能讓你一直待在安全但沒有新發展的位置。',
    primaryLabel:'熟悉模式',coreFunction:'提供熟練的處理方式',motivation:'想快速回到安全、有把握的做法裡',expression:'遇到狀況時，會不假思索地用這套熟悉的方式回應',matureUse:'能把這份熟練當成後盾，支援自己去嘗試新的方向',imbalance:'只靠老方法，不願調整',growthDirection:'可以練習把熟悉的能力當成基礎，而不是唯一的答案'},
  Lilith:{plain:'這是你不想被規定、控制，或被要求乖乖配合的部分。',strength:'它保護你的真實慾望、界線與不願妥協的力量。',watch:'被壓抑太久時，可能用極端、突然或防衛的方式爆發。',
    primaryLabel:'不願被壓抑的部分',coreFunction:'保護不想被控制的需求',motivation:'想按照自己真實的樣子生活，不想勉強配合外界標準',expression:'被要求乖乖配合或被評判時，會出現抗拒、疏離或反彈的反應',matureUse:'能清楚表達自己的界線與慾望，不需要靠對抗來證明自主權',imbalance:'壓抑太久可能突然激烈爆發',growthDirection:'可以練習在安全的關係裡，直接說出真實的需求，而不是等到忍無可忍'},
  Chiron:{plain:'這是你特別容易覺得不足或受傷，也最可能理解別人痛苦的地方。',strength:'當你學會照顧這個傷口，常會發展出幫助別人的能力。',watch:'它不是缺陷，也不代表一定會受傷；重點是如何與敏感共處。',
    primaryLabel:'敏感與力量來源',coreFunction:'標記容易受傷敏感的位置',motivation:'渴望被理解，也渴望知道自己的敏感不是缺陷',expression:'在這個主題上，容易反覆想起舊傷，或對相關批評特別敏感',matureUse:'能運用對這份傷痛的理解，去陪伴或看懂正在經歷類似處境的人',imbalance:'把敏感當成弱點藏起來',growthDirection:'可以練習溫柔對待這個敏感位置，不必急著把它完全修好'},
  Fortune:{plain:'這是事情比較容易自然順起來、你也較容易感到滿足的生活領域。',strength:'投入這裡時，資源與機會較容易被你注意和接住。',watch:'它不是保證幸運，仍需要你實際參與與選擇。',
    primaryLabel:'容易產生順流感的方式',coreFunction:'指出較易順流滿足的領域',motivation:'想找到不用太費力就能感覺踏實、有成就感的方式',expression:'投入這裡時，事情比較容易順著走，也比較容易感覺到滿足',matureUse:'能有意識地把時間與心力放進這個領域，讓資源與機會更容易被接住',imbalance:'誤以為永遠順利卻不投入',growthDirection:'可以練習實際參與、持續投入，而不是被動等待順流出現'},
  Vertex:{plain:'這是比較容易出現重要相遇、意外邀請或關係轉折的領域。',strength:'它提醒你留意那些改變觀點與人生方向的互動。',watch:'不是每次相遇都注定長久，也不代表完全無法選擇。',
    primaryLabel:'容易被推動的經驗',coreFunction:'標記容易被推動的領域',motivation:'在遇到關鍵的人或機緣時，特別容易被觸動而改變方向',expression:'這個領域裡的相遇或事件，常會帶來意料之外的視角轉變',matureUse:'能把這些轉折經驗，轉化成調整人生方向的具體行動',imbalance:'把相遇都當成命定，忽略選擇',growthDirection:'可以練習把每次轉折當成參考，而不是唯一必須遵循的劇本'}
};
var EXTRA_POINT_KEYS = EXTRA_POINT_DEFS.map(function (p) { return p.key; });

/* ================= 二十八星宿 28 Lunar Mansions ================= */
/* 順序、四象分組、對應動物、七曜均已對照維基百科與多個現行黃曆網站交叉核對；
   每宿的「曜」與星期對應關係固定不變（水曜＝週三、木曜＝週四...），並用
   2026-07-22（週三＝軫水蚓）與 2026-07-23（週四＝角木蛟，正好循環回到起點）
   兩個即時查證到的黃曆真實資料互相驗證過，確認排列與週期連續無誤，
   才把 2026-07-23 定為角宿（第0位）的計算基準日。
   本命／合盤的判定不是用農曆生日對照的密教演禽表（那套系統另需一整套農曆
   換算引擎，且找不到能完全交叉驗證的可靠版本），而是直接用陽曆生日代入
   跟「每日／擇日」相同的連續 28 天循環——好處是同一套邏輯前後一致、每一步
   都能驗證，代價是跟少數命理流派慣用的農曆演禽本命宿可能對不上，這點會在
   介面上跟使用者說清楚。 */
var FUSE_POINT_SUMMARY_HOUSE_TPL = [
  '{P}在{lifeArea}，透過「{method}」{coreFunction}。',
  '{S}的{P}用「{method}」，在{lifeArea}{coreFunction}。',
  '{S}的{P}在{lifeArea}{coreFunction}，做法「{method}」。',
];
var FUSE_POINT_SUMMARY_NOHOUSE_TPL = [
  '{P}在{S}，會用「{method}」去{coreFunction}。',
  '落在{S}的{P}，讓你較常用「{method}」{coreFunction}。',
];
/* primaryText 必須具體回答動態標題本身的問題（要練習什麼／已經熟悉什麼／在哪裡
   守住界線／哪裡敏感／怎麼順流／怎麼被推動），不能只是 expression 換句話說，也
   不能和 summary 重複。summary 已經用掉 {method}，這裡改用 {motivation}（星座驅動
   的「為什麼」），已知時間時再帶入 {lifeArea}，讓標題不只是名詞，而是「哪個領域、
   用什麼星座方式」的具體陳述。六個點的措辭各自獨立，不共用同一套包裝句。 */
var POINT_PRIMARY_TPL = {
  Node: {
    house: [
      '練習{S}式的「{motivation}」，在{lifeArea}。',
      '{S}式的「{motivation}」，見於{lifeArea}。',
    ],
    nohouse: [
      '練習{S}式的「{motivation}」。',
      '{S}式的「{motivation}」是練習方向。',
    ],
  },
  SNode: {
    house: [
      '熟悉{S}式的「{motivation}」，見於{lifeArea}，別忽略細節。',
      '{S}式的「{motivation}」是資源，見於{lifeArea}，別忽略細節。',
    ],
    nohouse: [
      '熟悉{S}式的「{motivation}」，別忽略細節。',
      '{S}式的「{motivation}」是資源，別忽略細節。',
    ],
  },
  Lilith: {
    house: [
      '你以{S}式的「{motivation}」，在{lifeArea}守界線。',
      '在{lifeArea}，你以{S}式的「{motivation}」護界線。',
    ],
    nohouse: [
      '你以{S}式的「{motivation}」，守住界線。',
      '你以{S}式的「{motivation}」，護住界線。',
    ],
  },
  Chiron: {
    house: [
      '{lifeArea}是敏感領域；易以{S}式的「{motivation}」防衛。',
      '你易在{lifeArea}感到敏感；常以{S}式的「{motivation}」防衛。',
    ],
    nohouse: [
      '面對敏感情境，你易用{S}式的「{motivation}」回應或防衛。',
      '你常以{S}式的「{motivation}」防衛。',
    ],
  },
  Fortune: {
    house: [
      '以{S}式的「{motivation}」投入{lifeArea}較順流。',
      '在{lifeArea}，以{S}式的「{motivation}」投入較踏實。',
    ],
    nohouse: [
      '以{S}式的「{motivation}」投入，較易順流滿足。',
      '以{S}式的「{motivation}」投入，較易踏實順手。',
    ],
  },
  Vertex: {
    house: [
      '{lifeArea}的際遇易推動改變；常以{S}式「{motivation}」回應。',
      '{lifeArea}的轉折易推動調整；常以{S}式「{motivation}」回應。',
    ],
    nohouse: [
      '重要際遇易推動改變；常以{S}式「{motivation}」回應。',
      '重要轉折易推動調整；常以{S}式「{motivation}」回應。',
    ],
  },
};
var FUSE_POINT_LIFE_HOUSE_TPL = [
  '在{lifeArea}，{P}常表現為：{pointExpression}。',
  '{P}在{lifeArea}被啟動時，常出現「{pointExpression}」的經驗。',
];
var FUSE_POINT_LIFE_NOHOUSE_TPL = [
  '{P}在生活中常表現為：{pointExpression}。',
  '這個位置常帶來「{pointExpression}」的經驗。',
];
/* 卡片 UI 會在這段文字前面固定加上「需要留意：」標籤，所以模板本身不能再用
   「需要留意」開頭，否則會變成「需要留意：需要留意……」的重複標籤。 */
var FUSE_POINT_CAUTION_HOUSE_TPL = [
  '在{lifeArea}，盲點是「{imbalance}」；提醒自己：{growthDirection}。',
  '{P}在{lifeArea}失衡時，可能{imbalance}；{growthDirection}。',
];
var FUSE_POINT_CAUTION_NOHOUSE_TPL = [
  '較容易{imbalance}；{growthDirection}。',
  '失衡時可能{imbalance}，{growthDirection}。',
];
var FUSE_POINT_FUNCTION_TPL = [
  '{P}的作用是{coreFunction}；背後的驅動力是{motivation}。',
  '{P}負責{coreFunction}，這股驅動來自{motivation}。',
];
var FUSE_POINT_SIGNMETHOD_TPL = [
  '落在{S}，動機來自「{signMotivation}」，做法是「{method}」。',
  '{S}的驅動力是{signMotivation}，具體做法是{method}。',
];
var FUSE_POINT_SYNTHESIS_TPL = [
  '因為這個位置想要{coreFunction}，所以透過{S}「{signMotivation}」的方式運作；這股力量最常在「{lifeArea}」裡被看見。',
  '{coreFunction}是核心，{signMotivation}則是它運作的邏輯，兩者最常交會在「{lifeArea}」這個場景裡。',
];
var FUSE_POINT_SYNTHESIS_NOHOUSE_TPL = [
  '因為這個位置想要{coreFunction}，所以透過{S}「{signMotivation}」的方式運作；本次因出生時間未知，暫不加入宮位這個變數。',
  '{coreFunction}是核心，{signMotivation}則是它運作的邏輯；宮位資料本次未知，不納入分析。',
];
var FUSE_POINT_GROWTH_TPL = [
  '慢慢練習後，你{matureUse}；接下來可以{growthTask}。',
  '往成熟的方向走，你{matureUse}；接下來可以{growthTask}。',
];
var FUSE_POINT_GROWTH_NOHOUSE_TPL = [
  '慢慢練習後，你{matureUse}，也{growthDirection}。',
  '往成熟的方向走，你{matureUse}，也{growthDirection}。',
];
/* Node/SNode 軸線：不能只列「星座＋宮位」標籤，必須帶出兩端實際的運作語意——
   Node 側用「對方（南交點）的 motivation＝已經熟悉的傾向」＋「自己（北交點）的
   behavior＝正在練習的具體行動」；SNode 側則反過來，用「自己的 motivation＝可以
   帶著走的資源」＋「對方（北交點）的 behavior＝被提醒要練習的具體行動」。已知時間
   時兩端都加上各自的 lifeArea，讓「熟悉」與「練習」各自有真實的生活場景；
   unknownTime 時只留星座層級。兩側共用同一組真實資料，讀起來會互相呼應，而不是
   各自獨立的兩份標籤列表。 */
var FUSE_NODE_AXIS_HOUSE_TPL = [
  '熟悉{otherSign}式的「{otherMotivation}」，見於{otherLifeArea}；新練習是「{ownBehavior}」，用在{ownLifeArea}。',
  '{otherSign}式的「{otherMotivation}」是熟悉背景，見於{otherLifeArea}；練習落實成「{ownBehavior}」，用在{ownLifeArea}。',
];
var FUSE_NODE_AXIS_NOHOUSE_TPL = [
  '熟悉{otherSign}式的「{otherMotivation}」；新練習是轉成「{ownBehavior}」。',
  '{otherSign}式的「{otherMotivation}」是熟悉背景；練習落實成「{ownBehavior}」。',
];
var FUSE_SNODE_AXIS_HOUSE_TPL = [
  '{ownSign}式的「{ownMotivation}」是資源，見於{ownLifeArea}；別只停留，可轉成「{otherBehavior}」，用在{otherLifeArea}。',
  '熟悉{ownSign}式的「{ownMotivation}」，見於{ownLifeArea}；別只留在這，可練習「{otherBehavior}」，用在{otherLifeArea}。',
];
var FUSE_SNODE_AXIS_NOHOUSE_TPL = [
  '{ownSign}式的「{ownMotivation}」是資源；別只停留，可轉成「{otherBehavior}」。',
  '熟悉{ownSign}式的「{ownMotivation}」；別只留在這，可練習「{otherBehavior}」。',
];
/* 純函式：不讀 state，只依 pointDef／落點資料／完整 chart（Node/SNode 互相查詢對方
   的 sign/house 需要用到）／unknownTime 運算，因此同一組輸入永遠得到同一組輸出。*/
