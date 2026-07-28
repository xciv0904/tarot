// Traditional tarot & Lenormand card meanings (public-domain divinatory tradition), bilingual zh/en.
const TAROT = [
  // Major Arcana
  {id:'m0', arcana:'major', num:'0', nameZh:'愚人', nameEn:'The Fool', upZh:'新的開始、冒險、天真', upEn:'Fresh starts, adventure, innocence', revZh:'魯莽、缺乏規劃', revEn:'Recklessness, poor judgment'},
  {id:'m1', arcana:'major', num:'I', nameZh:'魔術師', nameEn:'The Magician', upZh:'創造力、行動力、資源', upEn:'Willpower, creation, resourcefulness', revZh:'操縱、才能未發揮', revEn:'Manipulation, untapped talents'},
  {id:'m2', arcana:'major', num:'II', nameZh:'女祭司', nameEn:'The High Priestess', upZh:'直覺、潛意識、神秘', upEn:'Intuition, mystery, inner voice', revZh:'秘密、失去連結', revEn:'Secrets, disconnection from intuition'},
  {id:'m3', arcana:'major', num:'III', nameZh:'皇后', nameEn:'The Empress', upZh:'豐盛、母性、自然', upEn:'Abundance, nurturing, nature', revZh:'依賴、創造力受阻', revEn:'Dependence, creative block'},
  {id:'m4', arcana:'major', num:'IV', nameZh:'皇帝', nameEn:'The Emperor', upZh:'權威、結構、掌控', upEn:'Authority, structure, control', revZh:'專制、僵化', revEn:'Domination, rigidity'},
  {id:'m5', arcana:'major', num:'V', nameZh:'教皇', nameEn:'The Hierophant', upZh:'傳統、信仰、指導', upEn:'Tradition, belief, guidance', revZh:'反傳統、教條', revEn:'Rebellion, dogma'},
  {id:'m6', arcana:'major', num:'VI', nameZh:'戀人', nameEn:'The Lovers', upZh:'愛情、和諧、選擇', upEn:'Love, harmony, choice', revZh:'失衡、猶豫不決', revEn:'Imbalance, indecision'},
  {id:'m7', arcana:'major', num:'VII', nameZh:'戰車', nameEn:'The Chariot', upZh:'意志力、勝利、決心', upEn:'Willpower, victory, determination', revZh:'缺乏方向、失控', revEn:'Lack of direction, loss of control'},
  {id:'m8', arcana:'major', num:'VIII', nameZh:'力量', nameEn:'Strength', upZh:'勇氣、耐心、內在力量', upEn:'Courage, patience, inner strength', revZh:'自我懷疑、軟弱', revEn:'Self-doubt, weakness'},
  {id:'m9', arcana:'major', num:'IX', nameZh:'隱士', nameEn:'The Hermit', upZh:'內省、獨處、尋求真理', upEn:'Introspection, solitude, seeking truth', revZh:'孤立、迷失方向', revEn:'Isolation, loneliness'},
  {id:'m10', arcana:'major', num:'X', nameZh:'命運之輪', nameEn:'Wheel of Fortune', upZh:'轉機、命運、循環', upEn:'Change, destiny, cycles', revZh:'厄運、抗拒改變', revEn:'Bad luck, resistance to change'},
  {id:'m11', arcana:'major', num:'XI', nameZh:'正義', nameEn:'Justice', upZh:'公平、真相、因果', upEn:'Fairness, truth, cause and effect', revZh:'不公、逃避責任', revEn:'Unfairness, avoiding accountability'},
  {id:'m12', arcana:'major', num:'XII', nameZh:'倒吊人', nameEn:'The Hanged Man', upZh:'放下、犧牲、新視角', upEn:'Surrender, sacrifice, new perspective', revZh:'拖延、抗拒改變', revEn:'Stalling, resistance'},
  {id:'m13', arcana:'major', num:'XIII', nameZh:'死神', nameEn:'Death', upZh:'結束、轉變、重生', upEn:'Endings, transformation, rebirth', revZh:'抗拒改變、停滯', revEn:'Resistance to change, stagnation'},
  {id:'m14', arcana:'major', num:'XIV', nameZh:'節制', nameEn:'Temperance', upZh:'平衡、耐心、調和', upEn:'Balance, patience, moderation', revZh:'失衡、過度', revEn:'Imbalance, excess'},
  {id:'m15', arcana:'major', num:'XV', nameZh:'惡魔', nameEn:'The Devil', upZh:'束縛、慾望、物質', upEn:'Bondage, addiction, materialism', revZh:'掙脫束縛、覺醒', revEn:'Breaking free, awareness'},
  {id:'m16', arcana:'major', num:'XVI', nameZh:'塔', nameEn:'The Tower', upZh:'劇變、崩塌、覺醒', upEn:'Sudden upheaval, revelation', revZh:'恐懼改變、延遲的崩塌', revEn:'Avoiding disaster, delayed change'},
  {id:'m17', arcana:'major', num:'XVII', nameZh:'星星', nameEn:'The Star', upZh:'希望、療癒、信任', upEn:'Hope, healing, faith', revZh:'絕望、失去信心', revEn:'Despair, disconnection'},
  {id:'m18', arcana:'major', num:'XVIII', nameZh:'月亮', nameEn:'The Moon', upZh:'幻覺、恐懼、潛意識', upEn:'Illusion, fear, subconscious', revZh:'困惑消散、釋放恐懼', revEn:'Releasing fear, clarity returning'},
  {id:'m19', arcana:'major', num:'XIX', nameZh:'太陽', nameEn:'The Sun', upZh:'喜悅、成功、活力', upEn:'Joy, success, vitality', revZh:'過度樂觀、暫時的陰霾', revEn:'Temporary sadness, over-optimism'},
  {id:'m20', arcana:'major', num:'XX', nameZh:'審判', nameEn:'Judgement', upZh:'覺醒、重生、反省', upEn:'Reflection, reckoning, awakening', revZh:'自我懷疑、逃避召喚', revEn:'Self-doubt, ignoring the call'},
  {id:'m21', arcana:'major', num:'XXI', nameZh:'世界', nameEn:'The World', upZh:'完成、圓滿、成就', upEn:'Completion, fulfillment', revZh:'未完成、停滯不前', revEn:'Incompletion, lack of closure'},
];

const RANKS = [
  {r:'A', zh:'王牌'}, {r:'2', zh:'二'}, {r:'3', zh:'三'}, {r:'4', zh:'四'}, {r:'5', zh:'五'},
  {r:'6', zh:'六'}, {r:'7', zh:'七'}, {r:'8', zh:'八'}, {r:'9', zh:'九'}, {r:'10', zh:'十'},
  {r:'Page', zh:'侍者'}, {r:'Knight', zh:'騎士'}, {r:'Queen', zh:'皇后'}, {r:'King', zh:'國王'},
];

const SUITS = [
  {key:'wands', zh:'權杖', en:'Wands',
    meanings:[
      ['靈感、新機會、創造力','Inspiration, new opportunity','延遲、缺乏動力','Delays, lack of motivation'],
      ['規劃、遠見、抉擇','Planning, foresight, decisions','恐懼未知、缺乏計畫','Fear of unknown, poor planning'],
      ['擴展、遠見實現、合作','Expansion, foresight realized','挫折、延遲的進展','Delays, obstacles'],
      ['慶祝、和諧、家庭','Celebration, harmony, homecoming','衝突、不穩定','Conflict, instability'],
      ['競爭、衝突、挑戰','Competition, conflict, tension','避免衝突、內部紛爭','Avoiding conflict, inner tension'],
      ['勝利、認可、自信','Victory, recognition, confidence','私下的挫敗、驕傲','Private doubt, fall from grace'],
      ['防衛、堅持、挑戰','Perseverance, defending position','疲於應付、放棄','Overwhelmed, giving up'],
      ['快速行動、進展、消息','Swift action, movement, news','延遲、挫折','Delays, frustration'],
      ['堅韌、警惕、最後一搏','Resilience, persistence, last stand','筋疲力盡、放棄','Exhaustion, giving up'],
      ['負擔、責任、壓力','Burden, responsibility, hard work','釋放重擔、委派','Releasing burdens, delegation'],
      ['熱情探索、新想法','Enthusiasm, exploration, new ideas','缺乏方向、拖延','Lack of direction, delays'],
      ['衝動、冒險、熱情行動','Impulsiveness, adventure, energy','魯莽、挫折','Recklessness, frustration'],
      ['自信、獨立、溫暖','Confidence, independence, warmth','嫉妒、不安全感','Jealousy, insecurity'],
      ['領導力、願景、大膽','Leadership, vision, boldness','專橫、衝動','Impulsiveness, tyranny'],
    ]},
  {key:'cups', zh:'聖杯', en:'Cups',
    meanings:[
      ['新的情感、愛、直覺','New feelings, love, intuition','情感壓抑、失落','Emotional suppression, emptiness'],
      ['連結、夥伴關係、吸引力','Connection, partnership, attraction','失衡的關係、分離','Imbalance, break-up'],
      ['友誼、慶祝、社群','Friendship, celebration, community','過度放縱、八卦','Overindulgence, gossip'],
      ['冷漠、沉思、錯失機會','Apathy, contemplation, missed chance','覺醒、新的興趣','Sudden awareness, motivation'],
      ['失落、悲傷、後悔','Loss, grief, regret','接受、向前邁進','Acceptance, moving on'],
      ['懷舊、童年、純真','Nostalgia, childhood, innocence','困於過去、不切實際','Stuck in the past'],
      ['幻想、選擇、白日夢','Illusion, choices, wishful thinking','清晰、做出決定','Clarity, decisive action'],
      ['放手、追尋更深意義','Walking away, seeking deeper meaning','恐懼改變、停滯','Fear of change, stagnation'],
      ['滿足、情感滿足、願望成真','Satisfaction, emotional fulfillment','過度、不滿足','Overindulgence, dissatisfaction'],
      ['幸福、和諧家庭、圓滿','Happiness, harmony, family bliss','破碎的家庭、失衡','Broken family, disharmony'],
      ['情感訊息、直覺、創意','Emotional messages, creativity','情緒不成熟、逃避','Emotional immaturity'],
      ['浪漫、魅力、追求理想','Romance, charm, following the heart','不切實際、情緒化','Moodiness, unrealistic'],
      ['同理心、直覺、關懷','Compassion, intuition, care','情緒不穩、過度犧牲','Emotional insecurity'],
      ['情緒成熟、寬容、智慧','Emotional maturity, calm, wisdom','情緒操控、冷漠','Emotional manipulation'],
    ]},
  {key:'swords', zh:'寶劍', en:'Swords',
    meanings:[
      ['清晰、真相、突破','Clarity, truth, breakthrough','混亂、誤解','Confusion, miscommunication'],
      ['抉擇、僵局、平衡','Difficult decisions, stalemate','猶豫不決、資訊過載','Indecision, information overload'],
      ['心碎、悲傷、背叛','Heartbreak, sorrow, betrayal','療癒、原諒','Healing, forgiveness'],
      ['休息、恢復、暫停','Rest, recovery, contemplation','疲憊、停滯不前','Exhaustion, burnout'],
      ['衝突、爭鬥、代價','Conflict, tension, win at all costs','和解、放下爭執','Reconciliation, moving on'],
      ['過渡、離開困境、前行','Transition, moving on','抗拒改變、未解決的問題','Resistance to change'],
      ['欺騙、策略、單獨行動','Deception, strategy, acting alone','良心發現、坦白','Coming clean, self-deceit revealed'],
      ['受限、無助、自我設限','Restriction, feeling trapped','找到出路、重獲自由','Finding a way out'],
      ['焦慮、恐懼、失眠','Anxiety, worry, nightmares','絕望、內心煎熬','Deep despair, hopelessness'],
      ['結束、背叛、觸底','Painful ending, betrayal','復原、緩慢恢復','Recovery, gradual healing'],
      ['好奇心、警覺、新想法','Curiosity, vigilance, new ideas','衝動言語、缺乏計畫','Impulsive words, lack of planning'],
      ['果斷、迅速行動、直率','Decisiveness, swift action','魯莽、缺乏耐心','Recklessness, impatience'],
      ['獨立、直言不諱、清晰思維','Independence, clear thinking','尖酸、冷漠','Bitterness, coldness'],
      ['理性、權威、真理','Rationality, authority, truth','濫用權力、操控','Abuse of power, manipulation'],
    ]},
  {key:'pentacles', zh:'錢幣', en:'Pentacles',
    meanings:[
      ['新機會、豐盛、物質起點','New opportunity, abundance','錯失機會、財務不穩','Missed opportunity, instability'],
      ['平衡、優先順序、適應','Balance, prioritization','失衡、財務壓力','Overwhelm, disorganization'],
      ['合作、技能、團隊合作','Teamwork, collaboration, skill','缺乏團隊合作、平庸','Lack of teamwork, mediocrity'],
      ['安全感、掌控、儲蓄','Security, control, saving','貪婪、過度執著','Greed, materialism'],
      ['困境、匱乏、孤立','Hardship, financial loss, isolation','復原、找到支持','Recovery, finding support'],
      ['慷慨、分享、慈善','Generosity, giving and receiving','自私、不平等的交換','Selfishness, unequal exchange'],
      ['耐心、長期投資、評估','Patience, long-term view','缺乏耐心、投資無果','Impatience, lack of reward'],
      ['精進、努力、專注技藝','Diligence, mastery, dedication','缺乏動力、平庸的工作','Lack of focus, mediocre work'],
      ['獨立、富足、自我價值','Independence, luxury, self-sufficiency','過度工作、財務焦慮','Overwork, financial anxiety'],
      ['財富、傳承、家族','Wealth, legacy, family','財務失敗、家庭糾紛','Financial failure, family disputes'],
      ['學習、新機會、務實','Learning, new opportunity, ambition','缺乏計畫、拖延','Lack of progress, procrastination'],
      ['勤奮、可靠、務實','Efficiency, reliability, routine','停滯、過度謹慎','Stagnation, boredom'],
      ['務實、養育、豐盛','Practicality, nurturing, abundance','財務不安、過度犧牲','Financial insecurity, self-neglect'],
      ['財富、成功、穩定','Wealth, success, security','貪婪、財務短視','Greed, poor financial decisions'],
    ]},
];

SUITS.forEach(suit => {
  RANKS.forEach((rank, i) => {
    const m = suit.meanings[i];
    TAROT.push({
      id:`${suit.key}-${rank.r}`, arcana:'minor', suit:suit.key, suitZh:suit.zh, suitEn:suit.en,
      num: rank.r,
      nameZh:`${suit.zh}${rank.zh}`, nameEn:`${rank.r} of ${suit.en}`,
      upZh:m[0], upEn:m[1], revZh:m[2], revEn:m[3],
    });
  });
});

// Rider-Waite-Smith (Pam-A, 1909 — public domain) scan filenames, mapped onto
// each card's id so card fronts can show the real illustration.
const RWS_BASE = 'RWSa-';
const RWS_SUIT_LETTER = {wands:'W', cups:'C', swords:'S', pentacles:'P'};
const RWS_RANK_CODE = {
  A:'0A', '2':'02', '3':'03', '4':'04', '5':'05', '6':'06', '7':'07', '8':'08', '9':'09', '10':'10',
  Page:'J1', Knight:'J2', Queen:'QU', King:'KI',
};
TAROT.forEach(c => {
  if (c.arcana === 'major') {
    const n = parseInt(c.id.slice(1), 10);
    c.img = IMG[`${RWS_BASE}T-${String(n).padStart(2, '0')}`] || null;
  } else {
    const letter = RWS_SUIT_LETTER[c.suit];
    const code = RWS_RANK_CODE[c.num];
    c.img = letter && code ? (IMG[`${RWS_BASE}${letter}-${code}`] || null) : null;
  }
});

const LENORMAND_BASE = 'LEN-';
const lenImg = (n) => IMG[`${LENORMAND_BASE}${String(n).padStart(2, '0')}`] || null;

const LENORMAND = [
  {n:1, nameZh:'騎士', nameEn:'Rider', mZh:'消息、新聞、快速進展', mEn:'News, message, quick movement'},
  {n:2, nameZh:'幸運草', nameEn:'Clover', mZh:'幸運、小確幸、機會', mEn:'Luck, small opportunity'},
  {n:3, nameZh:'船', nameEn:'Ship', mZh:'旅行、遠方、貿易', mEn:'Travel, journey, trade'},
  {n:4, nameZh:'房子', nameEn:'House', mZh:'家庭、穩定、住所', mEn:'Home, family, stability'},
  {n:5, nameZh:'樹', nameEn:'Tree', mZh:'健康、成長、根基', mEn:'Health, growth, roots'},
  {n:6, nameZh:'雲', nameEn:'Clouds', mZh:'困惑、不確定、變化', mEn:'Confusion, uncertainty'},
  {n:7, nameZh:'蛇', nameEn:'Snake', mZh:'誘惑、複雜、第三者', mEn:'Complication, deception'},
  {n:8, nameZh:'棺材', nameEn:'Coffin', mZh:'結束、轉變、疾病', mEn:'Ending, transformation'},
  {n:9, nameZh:'花束', nameEn:'Bouquet', mZh:'美好、邀請、禮物', mEn:'Beauty, invitation, gift'},
  {n:10, nameZh:'鐮刀', nameEn:'Scythe', mZh:'突然、決斷、切割', mEn:'Sudden decision, cutting ties'},
  {n:11, nameZh:'鞭子', nameEn:'Whip', mZh:'爭執、重複、衝突', mEn:'Conflict, repetition'},
  {n:12, nameZh:'鳥', nameEn:'Birds', mZh:'交談、焦慮、社交', mEn:'Conversation, anxiety'},
  {n:13, nameZh:'小孩', nameEn:'Child', mZh:'新開始、天真、小型計畫', mEn:'New beginning, innocence'},
  {n:14, nameZh:'狐狸', nameEn:'Fox', mZh:'狡猾、職場、警惕', mEn:'Cunning, career, caution'},
  {n:15, nameZh:'熊', nameEn:'Bear', mZh:'力量、保護、權威', mEn:'Strength, protection'},
  {n:16, nameZh:'星星', nameEn:'Stars', mZh:'希望、指引、靈感', mEn:'Hope, guidance, inspiration'},
  {n:17, nameZh:'鸛鳥', nameEn:'Stork', mZh:'改變、搬遷、進步', mEn:'Change, relocation, progress'},
  {n:18, nameZh:'狗', nameEn:'Dog', mZh:'忠誠、友誼、信任', mEn:'Loyalty, friendship, trust'},
  {n:19, nameZh:'塔', nameEn:'Tower', mZh:'孤立、機構、野心', mEn:'Isolation, institution, ambition'},
  {n:20, nameZh:'花園', nameEn:'Garden', mZh:'社交、公眾場合、人脈', mEn:'Socializing, public events'},
  {n:21, nameZh:'山', nameEn:'Mountain', mZh:'阻礙、延遲、挑戰', mEn:'Obstacle, delay, challenge'},
  {n:22, nameZh:'岔路', nameEn:'Crossroads', mZh:'選擇、決定、機會', mEn:'Choices, decisions, options'},
  {n:23, nameZh:'老鼠', nameEn:'Mice', mZh:'損失、耗損、壓力', mEn:'Loss, stress, erosion'},
  {n:24, nameZh:'心', nameEn:'Heart', mZh:'愛、熱情、情感', mEn:'Love, passion, emotion'},
  {n:25, nameZh:'戒指', nameEn:'Ring', mZh:'承諾、合約、婚姻', mEn:'Commitment, contract, union'},
  {n:26, nameZh:'書', nameEn:'Book', mZh:'秘密、知識、學習', mEn:'Secrets, knowledge, learning'},
  {n:27, nameZh:'信', nameEn:'Letter', mZh:'訊息、文件、通知', mEn:'Message, document, news'},
  {n:28, nameZh:'男士', nameEn:'Man', mZh:'男性、伴侶、對象', mEn:'A man, male figure'},
  {n:29, nameZh:'女士', nameEn:'Woman', mZh:'女性、伴侶、對象', mEn:'A woman, female figure'},
  {n:30, nameZh:'百合', nameEn:'Lily', mZh:'和平、成熟、家庭和諧', mEn:'Peace, maturity, harmony'},
  {n:31, nameZh:'太陽', nameEn:'Sun', mZh:'成功、活力、正能量', mEn:'Success, vitality, positivity'},
  {n:32, nameZh:'月亮', nameEn:'Moon', mZh:'名望、情感、直覺', mEn:'Recognition, emotion, intuition'},
  {n:33, nameZh:'鑰匙', nameEn:'Key', mZh:'解答、重要時刻、必然', mEn:'Solution, key moment, certainty'},
  {n:34, nameZh:'魚', nameEn:'Fish', mZh:'財富、豐盛、事業', mEn:'Wealth, abundance, business'},
  {n:35, nameZh:'錨', nameEn:'Anchor', mZh:'穩定、堅持、長久', mEn:'Stability, security, persistence'},
  {n:36, nameZh:'十字', nameEn:'Cross', mZh:'考驗、負擔、命運', mEn:'Burden, trial, fate'},
];
LENORMAND.forEach(c => { c.img = lenImg(c.n); });

const TAROT_SPREADS = {
  single: {zh:'單張牌', en:'One Card', positions:[{zh:'指引',en:'Guidance'}]},
  'three-time': {zh:'三張牌・時間流', en:'Three Card', positions:[{zh:'過去',en:'Past'},{zh:'現在',en:'Present'},{zh:'未來',en:'Future'}]},
  'three-issue': {zh:'三張牌・解析', en:'Three Card', positions:[{zh:'現況',en:'Situation'},{zh:'阻礙',en:'Obstacle'},{zh:'建議',en:'Advice'}]},
  'three-mbs': {zh:'三張牌・身心靈', en:'Three Card', positions:[{zh:'身',en:'Body'},{zh:'心',en:'Mind'},{zh:'靈',en:'Spirit'}]},
  relationship: {zh:'關係牌陣', en:'Relationship', positions:[
    {zh:'你的感受',en:'Your Feelings'},{zh:'對方的感受',en:'Their Feelings'},{zh:'彼此的連結',en:'The Connection'},
    {zh:'關係中的挑戰',en:'The Challenge'},{zh:'關係的走向',en:'Where It Leads'},
  ]},
  crosslove: {zh:'兩人關係十字', en:'Two-Person Cross', positions:[
    {zh:'彼此的連結',en:'The Bond'},{zh:'你的立場',en:'Your Position'},{zh:'你的需求',en:'Your Needs'},{zh:'你的恐懼',en:'Your Fears'},
    {zh:'對方的立場',en:'Their Position'},{zh:'對方的需求',en:'Their Needs'},{zh:'對方的恐懼',en:'Their Fears'},
  ]},
  celtic: {zh:'凱爾特十字', en:'Celtic Cross', positions:[
    {zh:'現況',en:'Present'},{zh:'阻礙／助力',en:'Challenge'},{zh:'顯意識目標',en:'Conscious'},{zh:'潛意識根源',en:'Subconscious'},
    {zh:'過去影響',en:'Past'},{zh:'近期未來',en:'Near Future'},{zh:'自身態度',en:'Yourself'},{zh:'外在環境',en:'Environment'},
    {zh:'希望與恐懼',en:'Hopes / Fears'},{zh:'最終結果',en:'Outcome'},
  ]},
  horseshoe: {zh:'馬蹄鐵牌陣', en:'Horseshoe', positions:[
    {zh:'過去',en:'Past'},{zh:'現在',en:'Present'},{zh:'未來',en:'Future'},{zh:'自身態度',en:'Attitude'},
    {zh:'外在影響',en:'Influences'},{zh:'建議',en:'Advice'},{zh:'結果',en:'Outcome'},
  ]},
  fork: {zh:'二選一牌陣', en:'Fork in the Road', positions:[
    {zh:'現況',en:'Situation'},{zh:'選項A・優勢',en:'A: Strength'},{zh:'選項A・挑戰',en:'A: Challenge'},{zh:'選項A・結果',en:'A: Outcome'},
    {zh:'選項B・優勢',en:'B: Strength'},{zh:'選項B・挑戰',en:'B: Challenge'},{zh:'選項B・結果',en:'B: Outcome'},
  ]},
  timeline: {zh:'時間軸牌陣', en:'Timeline', positions:[
    {zh:'未來一個月',en:'1 Month'},{zh:'未來三個月',en:'3 Months'},{zh:'未來六個月',en:'6 Months'},
  ]},
};

const LENORMAND_SPREADS = {
  single: {zh:'單張牌', en:'One Card', positions:[{zh:'指引',en:'Guidance'}]},
  'three-time': {zh:'三張牌・時間流', en:'Three Card', positions:[{zh:'過去',en:'Past'},{zh:'現在',en:'Present'},{zh:'未來',en:'Future'}]},
  'three-issue': {zh:'三張牌・解析', en:'Three Card', positions:[{zh:'現況',en:'Situation'},{zh:'阻礙',en:'Obstacle'},{zh:'建議',en:'Advice'}]},
  'three-mbs': {zh:'三張牌・身心靈', en:'Three Card', positions:[{zh:'身',en:'Body'},{zh:'心',en:'Mind'},{zh:'靈',en:'Spirit'}]},
};


/* RICH（78 張牌的完整牌義）已移到 js/data/reading-rich-data.js 按需載入。
   取用方式不變，仍然是 card.rich，由 app.js 的 attachRichMeanings() 掛上去；
   資料還沒載入時所有取用點都有短牌義可以降級，不會出現空白或 undefined。 */
/* ================= App logic ================= */

var CATEGORIES = [
  { key: 'love', zh: '愛情', en: 'Love', icon: '♥', desc: '戀愛關係、曖昧、復合、伴侶相處' },
  { key: 'career', zh: '事業', en: 'Career', icon: '♦', desc: '工作、面試、轉職、職場發展' },
  { key: 'family', zh: '家庭', en: 'Family', icon: '⌂', desc: '親子、手足、家族相處' },
  { key: 'health', zh: '健康', en: 'Health', icon: '✚', desc: '壓力、休息、生活節奏與自我照顧' },
  { key: 'wealth', zh: '財運', en: 'Wealth', icon: '◆', desc: '投資、理財、財務規劃' },
  { key: 'social', zh: '人際', en: 'Social', icon: '☍', desc: '朋友、同事、社交與人脈互動' },
  { key: 'study', zh: '學業', en: 'Study', icon: '✎', desc: '考試、選課、升學、研究進度' },
  { key: 'general', zh: '綜合', en: 'General', icon: '✦', desc: '不特定方向，想看整體運勢' },
];

/* per-category spread recommendations (question_flow) */
var RECOMMENDATIONS = {
  love: ['relationship', 'crush', 'peach', 'crosslove', 'three-time', 'single'],
  career: ['three-issue', 'celtic', 'horseshoe', 'timeline', 'single'],
  family: ['three-issue', 'relationship', 'three-time', 'single'],
  health: ['three-mbs', 'three-issue', 'timeline', 'single'],
  wealth: ['three-issue', 'fork', 'timeline', 'single'],
  social: ['relationship', 'crosslove', 'three-issue', 'single'],
  study: ['three-issue', 'three-time', 'timeline', 'single'],
  general: ['three-time', 'celtic', 'horseshoe', 'single'],
};

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

var SPREAD_DESC = {
  single: '快速回應單一問題，適合每日指引。',
  'three-time': '看事情的發展脈絡與趨勢。',
  'three-issue': '聚焦當下該怎麼做。',
  'three-mbs': '從生理、心理、價值觀三層面檢視。',
  relationship: '深入剖析雙方感受與關係走向。',
  crosslove: '對照雙方立場、需求與恐懼。',
  celtic: '最完整的深度剖析，適合複雜問題。',
  horseshoe: '介於三張牌與凱爾特十字之間的完整度。',
  fork: '比較兩個選項的優劣與可能結果。',
  timeline: '依 1 / 3 / 6 個月看發展時程。',
};

var QUESTION_TEMPLATES = {
  love: { placeholder: '例如：我和交往中的對象，這段關係接下來三個月會如何發展？', chips: ['我和對方的關係現在適合更進一步嗎？', '這段感情該繼續投入還是放手？', '我暗戀的人對我是什麼感覺？', '我的下一段緣分什麼時候出現？'] },
  career: { placeholder: '例如：這次面試（公司名稱）的結果傾向如何？', chips: ['這次面試結果會如何？', '我該接受這個工作機會嗎？', '現在的工作是否該考慮轉職？'] },
  family: { placeholder: '例如：最近和家人在某件事上意見不合，該如何相處？', chips: ['我該如何和家人溝通這件事？', '這段家庭關係接下來會如何發展？', '和家人相處，我該怎麼拿捏分寸？'] },
  health: { placeholder: '例如：最近身體／心理狀況不佳，調養方向該注意什麼？', chips: ['我目前的身心狀態該注意什麼？', '這個調養方式適合我嗎？', '接下來一段時間健康狀況的趨勢如何？'] },
  wealth: { placeholder: '例如：這筆投資／這個財務決定現在適合進行嗎？', chips: ['這個投資決定現在適合嗎？', '我近期的財運趨勢如何？', '該如何規劃接下來的財務方向？'] },
  social: { placeholder: '例如：我和某位朋友之間最近有些疏遠，該如何維繫這段關係？', chips: ['我和這位朋友的關係接下來會如何？', '這段友誼／人脈該如何經營？', '對方對我的真實態度是什麼？'] },
  study: { placeholder: '例如：這次期末考／申請學校的結果傾向如何？', chips: ['這次考試結果會如何？', '我該選這個科系／學校嗎？', '我該如何調整讀書方式？', '這份論文／專題能順利完成嗎？'] },
  general: { placeholder: '例如：我想了解自己接下來這段時間整體的運勢與提醒。', chips: ['我接下來這段時間整體運勢如何？', '現在的我最需要注意什麼？', '有沒有什麼是我目前沒留意到的？'] },
};

/* Step 3 問題必須同時符合「主題」與「已選牌陣」。
   每個主題提供 default；具有明確使用情境的牌陣再覆寫，避免單身桃花出現交往／復合問題，
   或二選一牌陣出現無法比較選項的問題。subtopics 同時限制「你最想知道什麼」選單。 */
var SPREAD_QUESTION_PRESETS = {
  love: {
    default: {
      subtopics: ['pace-pattern', 'crush', 'reunion'],
      examples: ['這段感情目前最需要我看清什麼？', '這段關係接下來可能如何發展？', '我現在適合採取什麼行動？']
    },
    peach: {
      subtopics: ['partner-type', 'partner-profile', 'meet-scene'],
      placeholder: '例如：目前單身，想知道新的感情機會可能從哪裡出現。',
      examples: ['我近期容易遇到什麼類型的新對象？', '新的感情機會可能在哪種情境出現？', '目前阻礙我開始新關係的原因是什麼？']
    },
    crush: {
      subtopics: ['crush', 'pace-pattern'],
      placeholder: '例如：我對某人有好感，想知道彼此是否有進一步發展的可能。',
      examples: ['對方目前如何看待我？', '我們之間有進一步發展的可能嗎？', '我現在適合主動表達心意嗎？']
    },
    relationship: {
      subtopics: ['pace-pattern', 'marriage-longterm'],
      examples: ['我和交往中的對象目前處在什麼狀態？', '這段關係接下來三個月可能如何發展？', '我們要讓關係更穩定，需要一起面對什麼？']
    },
    crosslove: {
      subtopics: ['pace-pattern', 'crush', 'reunion'],
      examples: ['我和對方目前各自怎麼看待這段關係？', '我們彼此的需求與顧慮有什麼差異？', '這段關係目前最大的阻礙是什麼？']
    },
    'three-time': {
      subtopics: ['pace-pattern', 'crush', 'reunion'],
      examples: ['這段感情如何走到現在，接下來可能怎麼發展？', '我們目前的互動會帶來什麼後續變化？', '未來三個月這段關係的發展趨勢如何？']
    },
    single: {
      subtopics: ['partner-type', 'crush', 'pace-pattern', 'reunion'],
      examples: ['我現在最需要看清的感情問題是什麼？', '面對目前的感情狀況，我可以怎麼做？', '今天這段感情最需要給我的提醒是什麼？']
    }
  },
  career: {
    default: {
      subtopics: ['industry-fit', 'work-style-fit', 'career-timing', 'workplace-strength-weakness'],
      examples: ['目前的職涯問題，真正的阻礙是什麼？', '我可以採取什麼行動改善工作現況？', '這個職涯方向接下來可能如何發展？']
    },
    timeline: {
      subtopics: ['career-timing'],
      examples: ['未來一到六個月的職涯發展趨勢如何？', '這次轉職在不同時間階段可能如何發展？', '我目前的工作狀況何時較可能出現轉機？']
    },
    'three-issue': {
      subtopics: ['career-timing', 'workplace-strength-weakness'],
      examples: ['目前工作問題的核心阻礙是什麼？', '面對這次職涯選擇，我可以採取什麼行動？', '這次求職或轉職，我最需要注意什麼？']
    }
  },
  family: {
    default: {
      subtopics: ['family-dynamics', 'family-relations', 'living-responsibility', 'family-improve'],
      examples: ['目前家庭關係中最需要處理的是什麼？', '我可以如何改善和家人的互動？', '這項家庭責任接下來可能如何發展？']
    },
    relationship: {
      subtopics: ['family-relations', 'family-improve'],
      examples: ['我和這位家人目前各自的感受是什麼？', '我們的互動為什麼容易卡住？', '我要如何和這位家人建立更健康的相處方式？']
    }
  },
  health: {
    default: {
      subtopics: ['body-lifestyle', 'daily-balance'],
      examples: ['目前的壓力主要來自哪裡？', '我最需要調整哪一項生活習慣？', '接下來我可以如何安排休息與自我照顧？']
    },
    'three-mbs': {
      subtopics: ['body-lifestyle', 'daily-balance'],
      examples: ['我的身體、情緒與內在需求目前各需要什麼？', '哪個層面的失衡最影響我現在的狀態？', '我可以如何同時照顧身體與心理壓力？']
    },
    timeline: {
      subtopics: ['body-lifestyle', 'daily-balance'],
      examples: ['未來一到六個月，我的生活狀態可能如何變化？', '目前的調整方式持續下去，身心狀態可能如何發展？', '我應在哪個階段特別留意休息與壓力？']
    }
  },
  wealth: {
    default: {
      subtopics: ['cashflow-risk', 'risk-approach', 'opportunity-source'],
      examples: ['目前財務上最需要優先處理的是什麼？', '我可以如何改善收入與支出的平衡？', '近期值得留意的財務風險是什麼？']
    },
    fork: {
      subtopics: ['risk-approach', 'opportunity-source'],
      placeholder: '例如：比較繼續現有方案與改採新方案，哪一個較符合目前條件？',
      examples: ['選項 A 和選項 B 各自的優勢與風險是什麼？', '兩個財務方案中，哪一個較符合我目前的承受能力？', '做這項選擇前，我最容易忽略什麼成本？']
    },
    timeline: {
      subtopics: ['cashflow-risk', 'opportunity-source'],
      examples: ['未來一到六個月的收支趨勢如何？', '目前的財務安排持續下去，可能出現什麼變化？', '近期財務狀況何時較可能出現轉機？']
    }
  },
  social: {
    default: {
      subtopics: ['attract-type', 'interpersonal-style', 'ally-conflict'],
      examples: ['目前這段人際關係的核心問題是什麼？', '對方如何看待我們的互動？', '我可以如何改善這段關係？']
    },
    relationship: {
      subtopics: ['interpersonal-style', 'ally-conflict'],
      examples: ['我和這位朋友目前各自如何看待這段關係？', '我們之間的連結與主要摩擦是什麼？', '這段友誼接下來可能如何發展？']
    },
    crosslove: {
      subtopics: ['interpersonal-style', 'ally-conflict'],
      examples: ['我和對方的立場與需求有什麼差異？', '這段合作或友誼中，彼此各自顧慮什麼？', '我們要化解誤會，最需要先處理什麼？']
    }
  },
  study: {
    default: {
      subtopics: ['major-fit', 'exam-application', 'focus-execution'],
      examples: ['目前學習上的主要阻礙是什麼？', '我可以如何調整讀書方式與時間安排？', '這次考試或申請最需要準備什麼？']
    },
    'three-time': {
      subtopics: ['exam-application', 'focus-execution'],
      examples: ['我的準備如何走到現在，接下來可能如何發展？', '目前的讀書方式持續下去，成果趨勢如何？', '這次考試或申請未來三個階段的發展如何？']
    },
    timeline: {
      subtopics: ['exam-application', 'focus-execution'],
      examples: ['未來一到六個月的學習進度可能如何變化？', '我應如何安排不同階段的準備重點？', '這項學習計畫何時較可能看到成果？']
    }
  },
  general: {
    default: {
      subtopics: ['overall-theme', 'priority-focus', 'hidden-blindspot', 'next-direction'],
      examples: ['我目前人生階段最重要的主題是什麼？', '現在最需要優先處理的是什麼？', '下一步最適合採取什麼行動？']
    },
    grand: {
      subtopics: ['overall-theme', 'priority-focus', 'hidden-blindspot', 'next-direction'],
      placeholder: '例如：想盤點未來半年生活各面向的主軸、機會與需要留意的事。',
      examples: ['未來半年各生活面向的主要趨勢是什麼？', '目前最值得投入與最需要留意的領域各是什麼？', '這個人生階段的整體主軸與下一步是什麼？']
    },
    'three-time': {
      subtopics: ['overall-theme', 'next-direction'],
      examples: ['過去如何影響現在，接下來可能如何發展？', '目前的生活狀態正走向什麼方向？', '未來三個階段最值得留意的變化是什麼？']
    }
  }
};

/* 下拉選單負責選「解讀角度」；這裡只放可直接套用的具體情境，兩者不可只是陳述句／問句互換。
   特殊牌陣可覆寫 default，未覆寫時使用同主題的通用情境。每組至少 5 題。 */
var CONCRETE_QUESTION_EXAMPLES = {
  love: {
    default: [
      '我們最近聯絡變少，我應該主動詢問還是先給彼此空間？',
      '對方說需要時間考慮，我該如何理解目前的關係狀態？',
      '我們常為同一件事爭執，問題真正卡在哪裡？',
      '這段關係讓我感到不安，我現在適合繼續投入嗎？',
      '我想把關係說清楚，現在是不是適合談彼此的期待？'
    ],
    peach: [
      '我目前生活圈很固定，可以從哪類活動增加認識新對象的機會？',
      '最近有人主動接近我，我該觀察哪些訊號再決定是否認識？',
      '我已經單身一段時間，真正阻礙我開始新關係的是什麼？',
      '未來三個月，我在哪種社交情境較容易出現新的緣分？',
      '我想遇到穩定對象，現在最值得調整的是生活圈還是互動方式？'
    ],
    crush: [
      '我們偶爾聊天但不確定對方的意思，我適合再主動一點嗎？',
      '對方對我很友善，這是一般好感還是有進一步發展的可能？',
      '我想約對方單獨見面，現在是不是合適的時機？',
      '我們的互動忽冷忽熱，對方目前可能在顧慮什麼？',
      '如果我表達好感，這段關係最可能出現什麼變化？'
    ],
    relationship: [
      '我們交往後對未來規劃不同，接下來應該先談清楚什麼？',
      '最近相處變得平淡，這是穩定期還是關係正在疏遠？',
      '我們因為信任問題反覆爭吵，修復關係的關鍵是什麼？',
      '對方想更進一步，但我仍有疑慮，我該如何做決定？',
      '未來三個月，這段交往關係最需要共同面對什麼？'
    ],
    crosslove: [
      '我們對承諾的期待不同，彼此真正的需求差在哪裡？',
      '我覺得對方在退縮，但對方可能如何理解我的態度？',
      '這段關係中，我們各自最害怕面對的是什麼？',
      '我們都想改善關係，卻一直談不攏，阻礙共識的是什麼？',
      '如果繼續發展，彼此需要各自調整什麼？'
    ],
    'three-time': [
      '我們從熱絡變得疏遠，這段關係接下來三個月會怎麼變化？',
      '過去的爭執仍影響現在，我們是否有機會重新建立信任？',
      '目前互動穩定但沒有進展，下一階段可能出現什麼轉折？',
      '這段感情反覆分合，未來是否仍會重演同樣的模式？',
      '我們最近才開始約會，接下來關係可能以什麼速度發展？'
    ]
  },
  career: {
    default: [
      '主管最近增加我的工作量，我該爭取資源還是重新協調範圍？',
      '我收到一個新工作邀請，但擔心文化不合，該先評估什麼？',
      '目前工作穩定卻沒有成長感，我是否適合開始找新機會？',
      '這次面試結束後，我還能做什麼提高錄取機會？',
      '專案一直延誤，我應該調整方法、溝通分工還是更換方向？'
    ],
    timeline: [
      '我打算三個月內轉職，哪個階段最需要積極行動？',
      '目前的專案預計半年完成，期間可能遇到哪些轉折？',
      '我剛進入新公司，未來一到六個月的適應過程可能如何？',
      '升遷結果尚未公布，接下來幾個月職場狀況會如何變化？',
      '我正在準備轉換跑道，何時較適合開始投遞與面試？'
    ]
  },
  family: {
    default: [
      '家人常替我做決定，我可以怎麼說出自己的底線？',
      '我們因照顧長輩的分工不均產生衝突，該先談清楚什麼？',
      '搬回家後彼此摩擦增加，我要如何調整相處距離？',
      '家人不支持我的選擇，我該如何溝通又不失去自己？',
      '某位家人最近很少說話，我適合主動關心還是先給空間？'
    ]
  },
  health: {
    default: [
      '最近工作後總是很疲憊，我應該先調整睡眠、活動量還是工作節奏？',
      '我常在壓力大時熬夜，哪個替代習慣比較容易長期維持？',
      '休假後仍無法放鬆，我可以如何安排真正有效的休息？',
      '最近情緒起伏影響作息，我應先從哪個生活環節開始調整？',
      '我想建立規律運動習慣，怎樣的開始方式較不容易半途而廢？'
    ],
    'three-mbs': [
      '最近明明睡得夠卻仍疲憊，身體、情緒與內在需求各在提醒什麼？',
      '工作壓力讓我容易焦躁，我應先照顧哪一個層面的失衡？',
      '我總在休息時感到罪惡，身心之間真正的拉扯是什麼？',
      '近期難以專心又睡不好，生活中哪個環節最需要先調整？',
      '我想恢復穩定狀態，身體、心理與生活意義各需要什麼支持？'
    ]
  },
  wealth: {
    default: [
      '最近固定支出增加，我應先縮減開銷還是尋找額外收入？',
      '我想開始副業，但擔心影響本業，該先評估哪些現實條件？',
      '收入不穩定時，我應如何安排緊急預備金與日常支出？',
      '家人提出共同出資的計畫，我需要先確認哪些責任與風險？',
      '我常因壓力衝動消費，怎樣的管理方式較容易持續？'
    ],
    fork: [
      '我該選固定薪資較低的工作，還是收入浮動但成長空間大的機會？',
      '這筆資金應保留現金，還是投入目前的進修計畫？',
      '副業方案 A 與方案 B，哪一個較符合我的時間與承受能力？',
      '我應繼續現有合作，還是改為自己獨立接案？',
      '面對兩個財務方案，我最容易忽略哪一項隱性成本？'
    ]
  },
  social: {
    default: [
      '朋友最近回覆變少，我適合直接詢問還是先觀察？',
      '同事常把工作推給我，我可以怎麼拒絕又不傷和氣？',
      '新加入的團體讓我很拘謹，我要如何找到自然的互動方式？',
      '我和朋友因價值觀不同起衝突，這段關係還能如何修復？',
      '某位合作夥伴態度反覆，我需要留意哪些訊號？'
    ]
  },
  study: {
    default: [
      '考試剩一個月但進度落後，我應該如何重新安排準備順序？',
      '我在兩個科系之間猶豫，除了興趣還需要評估什麼？',
      '讀書時容易分心，我該先改環境、時間安排還是學習方法？',
      '申請結果不確定，我目前最值得補強哪一部分資料？',
      '小組專題進度停滯，我要如何調整分工與溝通？'
    ],
    timeline: [
      '距離考試還有半年，我應如何分配各階段的準備重點？',
      '我剛開始準備申請，未來一到六個月可能遇到哪些關卡？',
      '目前成績起伏很大，接下來幾個月是否可能逐步穩定？',
      '論文預計半年完成，哪個階段最容易遇到進度瓶頸？',
      '我正在學一項新技能，何時較可能看見明顯成果？'
    ]
  },
  general: {
    default: [
      '最近工作與家庭同時出現壓力，我應該先處理哪一邊？',
      '我對未來方向很迷惘，接下來一個月適合把重心放在哪裡？',
      '幾個計畫都反覆延後，背後真正卡住我的原因是什麼？',
      '我正在考慮搬家與轉職，哪一件事更應該優先評估？',
      '生活看似沒有大問題卻一直不安，我可能忽略了什麼？'
    ],
    grand: [
      '我想盤點未來半年工作、感情與家庭各自的主要變化。',
      '目前哪些生活領域正在成長，哪些領域需要先穩住？',
      '未來半年最重要的機會可能從哪個生活面向出現？',
      '我現在的時間與精力分配，哪個部分最需要重新安排？',
      '這個人生階段，我應保留什麼、結束什麼並開始什麼？'
    ]
  }
};

var TARGET_FIELD_CONFIG = {
  love: { label: '對象暱稱（選填）', placeholder: '例如：男友、曖昧對象、前任' },
  family: { label: '對象稱謂（選填）', placeholder: '例如：媽媽、哥哥、爸爸' },
  career: { label: '對象／公司（選填）', placeholder: '例如：面試公司名稱、主管' },
  social: { label: '對象暱稱（選填）', placeholder: '例如：朋友小華、同事' },
  study: { label: '科目／考試名稱（選填）', placeholder: '例如：微積分期末考、申請研究所' },
};

/* ================= Phase 0：具體問題題庫骨架（資料結構，尚未接入畫面／解讀邏輯）=================
   SUBTOPICS：分類 → 具體問題清單。每個子問題只定義 key／中文名稱／需要哪些輸出欄位，
   實際文案留待後續階段再撰寫並接入 renderReading()。不取代、不刪除既有 QUESTION_TEMPLATES
  （自由文字範例 chip 仍照舊使用）。
   fields 可能值：
     conclusion 核心結論／traits 具體人物或環境特徵／trend 發展趨勢／
     favor 有利因素／risk 風險或阻礙／timing 時間傾向／action 可執行建議／caveat 不確定性提醒 */
/* modes：這個子問題允許在哪些「解讀來源」模式下使用（尚未接入 UI，僅先定義規則）。
     cards    純牌卡／雷諾曼解讀也能回答
     astro    需要星盤資料才能回答
     combined 牌卡＋星盤綜合解讀
   一般問題預設 ['cards','astro','combined']；凡是以「星盤中的……」命名、或明確需要
   星盤結構才能回答的子問題（例如健康的 self-care-symbolic），只允許 ['astro','combined']。 */
var SUBTOPICS = {
  love: [
    { key: 'partner-type', zh: '未來可能遇到什麼類型的人', fields: ['conclusion', 'traits', 'trend', 'favor', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'partner-profile', zh: '對方可能的年齡差距、外貌氣質、個性、職業類型、經濟狀況與家庭背景', fields: ['conclusion', 'traits', 'favor', 'risk', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'meet-scene', zh: '可能在哪種場合認識', fields: ['conclusion', 'traits', 'trend', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'pace-pattern', zh: '關係發展速度、相處模式與阻礙', fields: ['conclusion', 'trend', 'favor', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'crush', zh: '曖昧對象的態度及未來發展', fields: ['conclusion', 'trend', 'favor', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'reunion', zh: '復合可能性與需要改善的問題', fields: ['conclusion', 'trend', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'marriage-longterm', zh: '適婚傾向及長期關係', fields: ['conclusion', 'trend', 'timing', 'favor', 'risk', 'caveat'], modes: ['cards', 'astro', 'combined'] },
  ],
  career: [
    { key: 'industry-fit', zh: '適合的產業、職務、工作內容與工作環境', fields: ['conclusion', 'traits', 'favor', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'work-style-fit', zh: '適合受雇、接案、創業、管理、創意或技術型工作', fields: ['conclusion', 'traits', 'favor', 'risk', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'career-timing', zh: '升遷、轉職、離職與求職趨勢', fields: ['conclusion', 'trend', 'timing', 'favor', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'workplace-strength-weakness', zh: '職場優勢、弱點、主管及團隊類型', fields: ['conclusion', 'traits', 'favor', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'career-talent', zh: '星盤中的職業傾向、天賦與發展方式', fields: ['conclusion', 'traits', 'favor', 'action', 'caveat'], modes: ['astro', 'combined'] },
  ],
  family: [
    { key: 'family-dynamics', zh: '原生家庭與家庭互動模式', fields: ['conclusion', 'traits', 'favor', 'risk', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'family-relations', zh: '與父母、手足、伴侶的關係', fields: ['conclusion', 'trend', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'living-responsibility', zh: '居住、搬家、家庭責任與情緒壓力', fields: ['conclusion', 'trend', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'family-improve', zh: '家庭關係的改善方向', fields: ['conclusion', 'favor', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
  ],
  health: [
    { key: 'body-lifestyle', zh: '近期較需要留意的身體系統、壓力來源與生活習慣', fields: ['conclusion', 'trend', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'daily-balance', zh: '睡眠、飲食、情緒、運動及身心平衡', fields: ['conclusion', 'trend', 'favor', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'self-care-symbolic', zh: '可參考星盤象徵提供日常保養提醒', fields: ['conclusion', 'action', 'caveat'], modes: ['astro', 'combined'] },
  ],
  wealth: [
    { key: 'cashflow-risk', zh: '收入、支出、現金流與破財風險', fields: ['conclusion', 'trend', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'risk-approach', zh: '適合保守管理、觀望，或在可承受風險內積極行動', fields: ['conclusion', 'trend', 'favor', 'risk', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'opportunity-source', zh: '財務機會可能來自工作、副業、人脈、合作或創意', fields: ['conclusion', 'traits', 'favor', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'money-pattern', zh: '星盤中的金錢態度、資源模式與近期財務趨勢', fields: ['conclusion', 'traits', 'trend', 'caveat'], modes: ['astro', 'combined'] },
  ],
  social: [
    { key: 'attract-type', zh: '容易吸引或遇到的人', fields: ['conclusion', 'traits', 'favor', 'risk', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'interpersonal-style', zh: '人際優勢、盲點、相處分寸與溝通方式', fields: ['conclusion', 'traits', 'favor', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'ally-conflict', zh: '貴人、合作關係、競爭及誤解', fields: ['conclusion', 'traits', 'favor', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'social-need-pattern', zh: '星盤中的社交需求與群體互動模式', fields: ['conclusion', 'traits', 'caveat'], modes: ['astro', 'combined'] },
  ],
  study: [
    { key: 'major-fit', zh: '適合的科系、技能與學習方式', fields: ['conclusion', 'traits', 'favor', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'exam-application', zh: '考試、申請、留學與證照準備', fields: ['conclusion', 'trend', 'timing', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'focus-execution', zh: '專注力、時間安排、理解及表達模式', fields: ['conclusion', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'learning-trait', zh: '星盤中的學習特質與適合發展的能力', fields: ['conclusion', 'traits', 'favor', 'caveat'], modes: ['astro', 'combined'] },
  ],
  general: [
    { key: 'overall-theme', zh: '近期整體運勢與生活主軸', fields: ['conclusion', 'trend', 'favor', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'priority-focus', zh: '目前最需要優先處理的事情', fields: ['conclusion', 'traits', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'hidden-blindspot', zh: '目前可能沒有注意到的盲點', fields: ['conclusion', 'risk', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
    { key: 'next-direction', zh: '下一階段的方向與行動建議', fields: ['conclusion', 'trend', 'favor', 'action', 'caveat'], modes: ['cards', 'astro', 'combined'] },
  ],
};

/* 健康／財運為合規敏感分類，輸出時一律附加固定免責句（非動態生成、不可省略） */
var HEALTH_DISCLAIMER = '健康相關的解讀僅供自我觀察與生活提醒參考，不能用來診斷疾病、預測病情，也不能取代醫師的專業判斷；如有實際症狀或不適，請務必尋求合格醫療人員協助。';
var FINANCE_DISCLAIMER = '財運相關的解讀僅為象徵性參考，不構成投資建議，也不提供任何個別證券、加密貨幣或金融商品的買賣指示；實際財務決策請自行評估風險或諮詢專業人士。';

/* ================= Step 3「想深入了解的面向」設定物件 =================
   topicQuestionConfig：CATEGORIES 八個分類 → Step 3 用的「深入了解面向」（可複選，最多 3 項，
   依 focusGroups 分組）與「具體問題範例」（點擊只會填入 textarea，不會送出）。
   key 沿用站內既有的 CATEGORIES/SUBTOPICS 命名（wealth 對應「財運」），跟舊的、單選、
   已經接上牌卡＋星盤深度解讀引擎的 SUBTOPICS 是兩套獨立資料，互不影響、互不覆蓋：
   SUBTOPICS 繼續驅動 renderSubtopicPicker() 的單選深度解讀；topicQuestionConfig 只驅動
   新增的多選「面向」標籤與範例，兩者的選取結果最後會一起併入「複製給 AI 解讀」的文字。
   riskNotice：只有 health／wealth 有值，Step 3 會在這個分類的說明文字下方顯示醒目提示，
   同一段文字也會併入複製給 AI 的文字。 */
/* ================= 牌陣 → 適用的面向分組 =================
   有些牌陣本身就限定了它能回答什麼，把不適用的面向也列出來只會讓人白選一場：
   「三張牌・身心靈」看的是你自己的生理／心理／價值觀，列出「對方是否仍然留戀」
   毫無意義；「關係牌陣」要有兩個人才成立，對單身的人列出交往中的面向也一樣。

   只在牌陣確實比較窄的時候才設限，沒有列在這裡的牌陣（單張、三張時間流、
   凱爾特十字等通用牌陣）維持顯示全部分組。值是 focusGroups 的 key。 */
var SPREAD_FOCUS_GROUPS = {
  love: {
    relationship: ['together', 'self'],            // 關係牌陣：需要已經有對象
    crosslove: ['together', 'breakup', 'self'],    // 兩人關係十字：對照雙方立場
    'three-mbs': ['self'],                         // 身心靈：只看自己
  },
  career: {
    fork: ['switch'],                              // 二選一：就是在比較兩個選項
    'three-mbs': ['longterm'],
  },
  family: { 'three-mbs': ['origin'] },
  health: { 'three-mbs': ['state', 'emotion'] },
  wealth: { fork: ['invest', 'spending'] },
  social: {
    crosslove: ['conflict', 'friends', 'workplace'],
    'three-mbs': ['ownpattern'],
  },
  study: { 'three-mbs': ['pressure'] },
  general: { 'three-mbs': ['inner'] },
};

/* ================= 子問題 → 適用的面向分組 =================
   使用者在「你最想知道什麼？」選了具體子問題之後，其實已經表明了自己的處境：
   選「未來可能遇到什麼類型的人」的人是單身，再列出「這段關係能否走向承諾」
   完全沒有意義。這份對應表比牌陣更精準，所以有選子問題時優先用它。 */
var SUBTOPIC_FOCUS_GROUPS = {
  love: {
    'partner-type': ['single', 'self'],
    'partner-profile': ['single', 'self'],
    'meet-scene': ['single', 'self'],
    crush: ['single', 'self'],
    reunion: ['breakup', 'self'],
    'pace-pattern': ['together', 'self'],
    'marriage-longterm': ['together', 'self'],
  },
  career: {
    'industry-fit': ['switch', 'longterm'],
    'work-style-fit': ['switch', 'longterm'],
    'career-timing': ['current', 'jobhunt', 'switch'],
    'workplace-strength-weakness': ['current', 'longterm'],
  },
  family: {
    'family-dynamics': ['origin', 'relations'],
    'family-relations': ['relations', 'parents'],
    'living-responsibility': ['living', 'relations'],
    'family-improve': ['relations', 'parents'],
  },
  health: {
    'body-lifestyle': ['state', 'habits'],
    'daily-balance': ['habits', 'emotion', 'recovery'],
  },
  wealth: {
    'cashflow-risk': ['income', 'spending'],
    'risk-approach': ['invest'],
    'opportunity-source': ['income', 'shared'],
  },
  social: {
    'attract-type': ['friends', 'ownpattern'],
    'interpersonal-style': ['ownpattern', 'conflict'],
    'ally-conflict': ['workplace', 'conflict', 'friends'],
  },
  study: {
    'major-fit': ['method', 'path'],
    'exam-application': ['exam', 'path'],
    'focus-execution': ['method', 'pressure'],
  },
  general: {
    'overall-theme': ['now'],
    'priority-focus': ['choice', 'now'],
    'hidden-blindspot': ['inner'],
    'next-direction': ['action', 'choice'],
  },
};

var topicQuestionConfig = {
  love: {
    label: '你想深入了解這段感情的哪些面向？',
    hint: '感情關係、曖昧、復合、伴侶互動與個人感情模式。',
    placeholder: '例如：我和交往中的對象，這段關係接下來三個月會如何發展？',
    focusGroups: [
      { key: 'together', title: '已經在一起（交往中）', options: ['對方目前對我的真實感受', '對方是否有進一步發展的意願', '關係接下來三個月的發展', '這段關係目前最大的阻礙', '我們之間的付出是否平衡', '這段關係是否值得繼續投入', '這段關係能否走向承諾'] },
      { key: 'single', title: '單身、曖昧中或還沒在一起', options: ['對方只是友善還是有好感', '曖昧關係是否會明朗化', '對方遲遲不表態的原因', '新對象何時較容易出現', '是否存在其他競爭者或干擾'] },
      { key: 'breakup', title: '已經分開、想復合', options: ['分開後對方的真實想法', '造成分手的核心原因', '復合後是否會重複舊問題', '我是否適合主動聯絡', '這段關係是否已經真正結束'] },
      { key: 'self', title: '自我成長（任何狀態都適用）', options: ['我在感情中的慣性模式', '我在這段關係中的盲點', '我該怎麼守住自己的底線', '我目前最需要療癒的情緒', '我如何提升自己的關係選擇力'] },
    ],
    examples: ['我和交往中的對象，未來三個月會如何發展？', '曖昧對象目前對我有真實好感嗎？', '我和前任是否還有復合的可能？', '我現在適合主動聯絡對方嗎？', '這段關係目前最大的問題是什麼？', '我的下一段感情容易在什麼情境出現？'],
  },
  career: {
    label: '你想深入了解目前職涯的哪些面向？',
    hint: '工作現況、求職、轉職、升遷、職場關係與長期職涯方向。',
    placeholder: '例如：這次面試（公司名稱）的結果傾向如何？',
    focusGroups: [
      { key: 'current', title: '目前工作', options: ['現在的工作是否適合我', '工作中最大的壓力來源', '我目前最容易被忽略的能力', '現職接下來三個月的發展', '我與主管或同事的互動狀況', '目前是否有升遷或加薪機會'] },
      { key: 'jobhunt', title: '求職與面試', options: ['這次求職成功的可能性', '面試中最需要加強的部分', '對方公司目前如何看待我', '這個職缺是否真的適合我', '我適合主動爭取還是等待', '求職過程目前最大的阻礙', '下一個工作機會可能從哪裡出現'] },
      { key: 'switch', title: '轉職與選擇', options: ['我現在是否適合轉職', '兩個工作機會該如何選擇', '離開目前工作後的發展', '新環境可能帶來什麼挑戰', '我適合穩定累積還是冒險改變', '哪一種工作方向更適合我', '目前最需要培養的職場能力'] },
      { key: 'longterm', title: '長期發展', options: ['我的職涯核心優勢', '我真正重視的工作價值', '未來一年的職涯發展重點', '我是否適合創業或接案', '我目前職涯中的盲點', '如何建立更穩定的職涯方向'] },
    ],
    examples: ['我這次面試錄取的可能性如何？', '我現在適合離開目前的工作嗎？', '這兩個工作機會哪一個更適合我？', '我未來半年在職場上最需要注意什麼？', '我現在的工作還值得繼續投入嗎？', '我適合往哪一種職涯方向發展？'],
  },
  family: {
    label: '你想深入了解家庭中的哪些問題？',
    hint: '家人互動、居住安排、家庭責任、親子關係與家庭中的情緒課題。',
    placeholder: '例如：最近和家人在某件事上意見不合，該如何相處？',
    focusGroups: [
      { key: 'relations', title: '家庭關係', options: ['我和家人的關係目前卡在哪裡', '家人真正擔心的是什麼', '家庭中的溝通是否存在誤解', '我在家庭中承擔了什麼角色', '哪段家庭關係最需要修復', '如何改善目前的家庭氣氛'] },
      { key: 'parents', title: '父母與長輩', options: ['我和父母之間的核心課題', '長輩對我的真實期待', '我該怎麼把自己的底線說出口', '家人的反對是否有合理之處', '我適合順從、協調還是堅持', '如何減少與長輩的衝突'] },
      { key: 'living', title: '居住與家庭決定', options: ['我現在適合搬家嗎', '和家人同住是否適合目前的我', '居住環境目前帶來什麼影響', '家庭中的重大決定應注意什麼', '是否適合共同購屋或搬遷', '目前最需要優先處理的家庭問題'] },
      { key: 'origin', title: '從小到大受到的影響', options: ['原生家庭如何影響我的選擇', '我是否重複了家人的關係模式', '我在家中最容易壓抑什麼', '哪一種家庭信念正在限制我', '和家人之間，我需要重新拿捏哪些分寸'] },
    ],
    examples: ['我和家人最近一直爭吵，問題核心是什麼？', '我現在適合搬出去住嗎？', '家人反對我的決定，我應該如何處理？', '我和父母的關係未來三個月會如何發展？', '我是否承擔了不屬於自己的家庭責任？', '目前最需要改善的是哪一段家庭關係？'],
  },
  health: {
    label: '你想從哪些生活面向整理目前的身心狀態？',
    hint: '壓力、休息、生活節奏與自我照顧；不提供醫療診斷或治療建議。',
    placeholder: '例如：我最近一直感到疲憊，生活中最需要先調整什麼？',
    riskNotice: '牌卡解讀僅用於自我反思與生活方向整理，不能取代醫師診斷、檢查、治療或用藥建議。若有持續不適、急性症狀或心理危機，請尋求合格專業人員協助。',
    focusGroups: [
      { key: 'state', title: '身心狀態', options: ['我目前的壓力主要來自哪裡', '我的身體可能在提醒我什麼', '我目前是否過度消耗自己', '哪一種生活模式正在影響狀態', '我現在最需要休息還是調整節奏'] },
      { key: 'habits', title: '生活習慣', options: ['我最需要改善的生活習慣', '睡眠與作息目前有什麼問題', '我如何建立更穩定的運動習慣', '哪種自我照顧方式更適合我', '我是不是常忽略身體發出的警訊', '如何減少長期累積的疲憊'] },
      { key: 'emotion', title: '情緒與心理照顧', options: ['我目前最需要處理的情緒', '哪一種擔憂正在反覆消耗我', '我如何恢復內在安全感', '我是否把太多情緒壓在心裡', '哪種支持最適合現在的我', '我應該如何安排休息與求助'] },
      { key: 'recovery', title: '恢復與調整', options: ['我目前恢復狀態的阻礙', '哪一種調整最值得優先開始', '我需要放慢還是重新建立動力', '如何讓生活回到較穩定的節奏', '哪些責任可以暫時放下', '為了健康，我最需要開始拒絕的是什麼'] },
    ],
    examples: ['我最近感到很疲憊，生活中最需要調整的是什麼？', '我目前的壓力主要來自哪一方面？', '我應該如何建立比較穩定的作息？', '哪一種自我照顧方式最適合現在的我？', '我最近情緒起伏很大，最需要先處理什麼？', '我現在需要休息、求助，還是改變生活安排？'],
  },
  wealth: {
    label: '你想深入了解目前財務的哪些面向？',
    hint: '收入、支出、工作報酬、理財態度、合作金錢與財務決策。',
    placeholder: '例如：這筆投資／這個財務決定現在適合進行嗎？',
    riskNotice: '牌卡可協助整理財務心態與決策盲點，不構成投資、稅務、保險或借貸建議。',
    focusGroups: [
      { key: 'income', title: '收入與工作報酬', options: ['目前收入成長的主要阻礙', '是否有增加收入的機會', '我目前的能力是否被低估', '哪一種收入來源較值得發展', '我適合爭取加薪或調整報價嗎', '未來三個月的收入趨勢', '我應該先穩定本業還是開拓副業'] },
      { key: 'spending', title: '支出與金錢習慣', options: ['我目前最大的財務漏洞', '哪種消費習慣需要調整', '我對金錢的焦慮來自哪裡', '我是否為了情緒而花錢', '如何建立更穩定的儲蓄習慣'] },
      { key: 'invest', title: '投資與財務選擇', options: ['我目前的決策是否過度冒險', '我在財務判斷中的盲點', '這項支出是否符合長期目標', '哪些資訊需要再確認', '我是否受到他人意見過度影響'] },
      { key: 'shared', title: '合作與共同財務', options: ['合作中的金錢分配是否公平', '我是否適合與對方共同投資', '借貸或共同支出應注意什麼', '這段合作中是否有資訊不透明', '在金錢上，我最需要守住哪一條底線', '金錢問題是否正在影響關係'] },
    ],
    examples: ['我未來三個月的收入狀況可能如何發展？', '我目前最需要調整的金錢習慣是什麼？', '我現在適合發展副業嗎？', '這筆大額支出是否符合我的長期方向？', '我和對方的金錢合作需要注意什麼？', '我現在應該優先存錢、增加收入，還是減少支出？'],
  },
  social: {
    label: '你想深入了解這段人際互動的哪些部分？',
    hint: '朋友、同事、社群互動、相處分寸、誤會與合作關係。',
    placeholder: '例如：我和某位朋友之間最近有些疏遠，該如何維繫這段關係？',
    focusGroups: [
      { key: 'friends', title: '朋友與社交', options: ['對方是否真心把我當朋友', '這段友誼目前的真實狀況', '我們之間是否存在未說出口的問題', '這段友誼是否值得繼續', '對方為什麼最近變得疏遠', '我是否在這段關係中付出過多', '如何改善目前的互動'] },
      { key: 'workplace', title: '職場人際', options: ['同事目前如何看待我', '我與主管之間的互動問題', '團隊合作最大的阻礙', '是否有人對我存在誤解', '我該如何處理職場衝突', '我是否需要更明確地表達立場', '目前適合低調還是主動溝通'] },
      { key: 'conflict', title: '分寸與衝突', options: ['我是否過度迎合他人', '我最需要守住的是哪一種底線', '這場衝突的真正原因', '我適合主動和解嗎', '對方是否願意溝通', '我應該解釋、等待還是離開', '如何避免再次陷入相同問題'] },
      { key: 'ownpattern', title: '我自己的人際慣性', options: ['我在人際關係中的慣性模式', '我為什麼容易感到被排斥', '我是否過度解讀別人的反應', '我在人際中的優勢與盲點', '我如何建立更自在的人際關係'] },
    ],
    examples: ['朋友最近對我變得冷淡，真正原因是什麼？', '我和同事之間的誤會該如何處理？', '這段友誼是否值得我繼續投入？', '在人際上，我最需要守住的底線是什麼？', '對方是否願意和我修復關係？', '我在人際互動中最容易忽略什麼？'],
  },
  study: {
    label: '你想深入了解目前學習或升學的哪些面向？',
    hint: '考試、升學、研究、學習方法、進度規劃與學習壓力。',
    placeholder: '例如：這次期末考／申請學校的結果傾向如何？',
    focusGroups: [
      { key: 'exam', title: '考試與成果', options: ['目前準備方向是否正確', '這次考試最大的阻礙', '我最需要加強的部分', '成績未達預期的主要原因', '我是否適合調整讀書策略', '考前最需要注意的狀態', '目前努力是否能逐漸看見成果'] },
      { key: 'method', title: '學習方法', options: ['哪一種學習方式最適合我', '我為什麼容易拖延', '我應該先補基礎還是衝進度', '如何提高專注與記憶效率', '我是否安排了過多目標', '如何建立可持續的讀書節奏'] },
      { key: 'path', title: '升學與選擇', options: ['我是否適合申請這個學校或科系', '兩個學習方向該如何選擇', '我現在適合繼續升學嗎', '海外學習是否適合目前的我', '這個研究方向是否值得投入', '我選擇這條路的真正動機', '哪個方向更符合長期發展'] },
      { key: 'pressure', title: '壓力與動力', options: ['我的學習壓力主要來自哪裡', '我為什麼失去動力', '我是否過度要求自己', '如何減少考試焦慮', '我需要休息還是重新安排計畫', '哪一種鼓勵方式對我最有效'] },
    ],
    examples: ['我這次考試最需要加強的是哪一部分？', '我目前的讀書方式是否適合我？', '我該選擇升學、工作，還是先累積經驗？', '我最近一直拖延，真正原因是什麼？', '我申請這個學校或科系的發展如何？', '未來三個月我該如何安排學習進度？'],
  },
  general: {
    label: '你目前最想釐清哪些人生方向？',
    hint: '尚未確定單一主題，或想從整體狀態、近期趨勢與優先順序開始探索。',
    placeholder: '例如：我想了解自己接下來這段時間整體的運勢與提醒。',
    focusGroups: [
      { key: 'now', title: '近期整體狀態', options: ['我目前正處於什麼人生階段', '接下來三個月的整體趨勢', '哪一件事正在消耗我最多能量', '現在最值得投入的是什麼', '近期可能出現的重要轉折'] },
      { key: 'choice', title: '選擇與優先順序', options: ['兩個選擇之間應如何判斷', '我現在適合前進還是等待', '哪件事可以暫時放下', '我是否忽略了更重要的問題', '我目前的決定受到什麼影響'] },
      { key: 'inner', title: '心情與內在感受', options: ['我真正想要的是什麼', '我目前最大的內在矛盾', '我為什麼一直停在原地', '我最需要放下的是什麼', '哪一種恐懼正在限制我', '我目前最需要相信自己的地方'] },
      { key: 'action', title: '行動方向', options: ['哪一項改變最能帶來進展', '我需要主動爭取還是先觀察', '如何讓生活重新有方向', '我現在可以從哪個小步驟開始', '哪一種資源可以幫助我'] },
    ],
    examples: ['我目前人生中最需要優先處理的是什麼？', '接下來三個月的整體發展重點是什麼？', '我現在適合主動改變，還是先等待？', '哪一件事正在阻礙我前進？', '我目前最需要放下的是什麼？', '我的下一步應該從哪裡開始？'],
  },
};
