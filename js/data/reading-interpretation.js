/* Mystic Deck reading interpretation contracts.
 *
 * Writing checks are adapted for this product from allenloves/de-ai-tone
 * (CC BY-SA 4.0): https://github.com/allenloves/de-ai-tone
 * We retain the site's card, position and bullet hierarchy; only prose habits
 * that obscure meaning are removed. See docs/de-ai-tone-attribution.md.
 */

var READING_STYLE_VERSION = 'de-ai-tone-zh-tw-v1';

var READING_CONTENT_LABELS = {
  primary_answer: '直接回答',
  meeting_context: '最可能的認識場合',
  meeting_mechanism: '你們怎麼開始接觸',
  interaction_style: '互動方式',
  relationship_development: '關係怎麼發展',
  partner_traits: '個性與相處反應',
  partner_appearance: '外在氣質與第一印象',
  suitable_roles: '適合的職位與工作內容',
  suitable_environment: '適合的工作環境',
  employment_mode: '適合的工作型態',
  money_source: '收入機會可能來自哪裡',
  financial_state: '目前的財務狀態',
  financial_advice: '財務上可以怎麼做',
  counterpart_attitude: '對方目前的態度',
  reconciliation_conditions: '復合需要哪些條件',
  longterm_relationship: '長期發展條件',
  family_pattern: '家庭互動模式',
  family_relationship: '關係中的主要問題',
  living_responsibility: '居住與責任分配',
  relationship_repair: '改善關係的做法',
  wellbeing_pattern: '近期生活與壓力訊號',
  wellbeing_action: '可調整的生活做法',
  social_profile: '容易遇到的人際類型',
  social_interaction: '人際互動方式',
  ally_conflict: '支持、競爭與誤解',
  learning_fit: '適合的學習內容與方法',
  exam_progress: '準備與結果趨勢',
  focus_execution: '專注與執行方式',
  overall_theme: '目前生活主軸',
  priority_focus: '最該優先處理的事',
  hidden_blindspot: '容易忽略的地方',
  next_direction: '下一步方向',
  card_evidence: '牌面依據',
  action: '下一步可以做什麼',
  uncertainty: '牌面無法確定的部分'
};

function readingQuestionSchema(questionId, intent, questionFocus, answerTarget, allowed, excluded, required, sectionOrder) {
  return {
    questionId: questionId,
    intent: intent,
    questionFocus: questionFocus,
    answerTarget: answerTarget,
    allowedContentTypes: allowed,
    excludedContentTypes: excluded,
    requiredFields: required,
    sectionOrder: sectionOrder
  };
}

var READING_QUESTION_SCHEMAS = {
  love: {
    'partner-type': readingQuestionSchema('love-partner-type', 'partner_profile', 'partner_traits', 'partner_traits', ['partner_traits','interaction_style','relationship_development'], ['meeting_context','suitable_roles','financial_advice'], ['primaryAnswer','cardEvidence'], ['partner_traits','interaction_style']),
    'partner-profile': readingQuestionSchema('love-partner-profile', 'partner_profile', 'partner_profile', 'partner_profile', ['partner_appearance','partner_traits','interaction_style'], ['meeting_context','suitable_environment','financial_advice'], ['primaryAnswer','cardEvidence'], ['partner_appearance','partner_traits']),
    'meet-scene': readingQuestionSchema('love-meet-scene', 'relationship_context', 'meeting_context', 'place_activity_channel', ['meeting_context','meeting_mechanism','relationship_development'], ['partner_traits','partner_appearance','interaction_style','relationship_advice'], ['primaryAnswer','scene','cardEvidence'], ['meeting_context','meeting_mechanism','relationship_development']),
    'pace-pattern': readingQuestionSchema('love-pace-pattern', 'relationship_development', 'relationship_pace', 'relationship_development', ['relationship_development','interaction_style','action'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['relationship_development','interaction_style']),
    crush: readingQuestionSchema('love-crush', 'counterpart_attitude', 'counterpart_attitude', 'counterpart_attitude', ['counterpart_attitude','relationship_development','action'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['counterpart_attitude','relationship_development']),
    reunion: readingQuestionSchema('love-reunion', 'reconciliation', 'reconciliation_conditions', 'reconciliation_conditions', ['reconciliation_conditions','relationship_development','action'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['reconciliation_conditions','action']),
    'marriage-longterm': readingQuestionSchema('love-marriage-longterm', 'longterm_relationship', 'longterm_relationship', 'longterm_relationship', ['longterm_relationship','relationship_development','interaction_style'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['longterm_relationship','relationship_development'])
  },
  career: {
    'industry-fit': readingQuestionSchema('career-industry-fit', 'career_direction', 'suitable_roles', 'searchable_roles', ['suitable_roles','suitable_environment'], ['work_attitude','financial_advice'], ['primaryAnswer','cardEvidence'], ['suitable_roles','suitable_environment']),
    'work-style-fit': readingQuestionSchema('career-work-style-fit', 'employment_mode', 'employment_mode', 'employment_mode', ['employment_mode','suitable_environment'], ['suitable_roles','financial_advice'], ['primaryAnswer','cardEvidence'], ['employment_mode','suitable_environment']),
    'career-timing': readingQuestionSchema('career-timing', 'career_timing', 'career_timing', 'development_timing', ['relationship_development','action'], ['partner_traits','meeting_context'], ['primaryAnswer','cardEvidence'], ['relationship_development','action']),
    'workplace-strength-weakness': readingQuestionSchema('career-workplace-strength', 'career_strength', 'workplace_strengths', 'workplace_strengths', ['interaction_style','suitable_environment','action'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['interaction_style','suitable_environment']),
    'career-talent': readingQuestionSchema('career-talent', 'career_talent', 'career_talent', 'career_talent', ['suitable_roles','employment_mode'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['suitable_roles','employment_mode'])
  },
  family: {
    'family-dynamics': readingQuestionSchema('family-dynamics', 'family_pattern', 'family_pattern', 'family_pattern', ['family_pattern','interaction_style'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['family_pattern','interaction_style']),
    'family-relations': readingQuestionSchema('family-relations', 'family_relationship', 'family_relationship', 'family_relationship', ['family_relationship','interaction_style','relationship_development'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['family_relationship','interaction_style']),
    'living-responsibility': readingQuestionSchema('family-living-responsibility', 'living_responsibility', 'living_responsibility', 'living_responsibility', ['living_responsibility','action'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['living_responsibility','action']),
    'family-improve': readingQuestionSchema('family-improve', 'relationship_repair', 'relationship_repair', 'relationship_repair', ['relationship_repair','action'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['relationship_repair','action'])
  },
  health: {
    'body-lifestyle': readingQuestionSchema('health-body-lifestyle', 'wellbeing_observation', 'wellbeing_pattern', 'wellbeing_pattern', ['wellbeing_pattern','wellbeing_action'], ['diagnosis','body_prediction'], ['primaryAnswer','cardEvidence'], ['wellbeing_pattern','wellbeing_action']),
    'daily-balance': readingQuestionSchema('health-daily-balance', 'wellbeing_action', 'wellbeing_action', 'wellbeing_action', ['wellbeing_pattern','wellbeing_action'], ['diagnosis','body_prediction'], ['primaryAnswer','cardEvidence'], ['wellbeing_action','wellbeing_pattern']),
    'self-care-symbolic': readingQuestionSchema('health-self-care-symbolic', 'wellbeing_action', 'wellbeing_action', 'wellbeing_action', ['wellbeing_action'], ['diagnosis','body_prediction'], ['primaryAnswer','cardEvidence'], ['wellbeing_action'])
  },
  wealth: {
    'cashflow-risk': readingQuestionSchema('wealth-cashflow-risk', 'financial_state', 'financial_state', 'cashflow_risk', ['financial_state','financial_advice'], ['money_source','investment_guarantee'], ['primaryAnswer','cardEvidence'], ['financial_state','financial_advice']),
    'risk-approach': readingQuestionSchema('wealth-risk-approach', 'financial_advice', 'financial_advice', 'risk_approach', ['financial_advice','financial_state'], ['money_source','investment_guarantee'], ['primaryAnswer','cardEvidence'], ['financial_advice','financial_state']),
    'opportunity-source': readingQuestionSchema('wealth-opportunity-source', 'money_source', 'money_source', 'money_source', ['money_source','financial_state'], ['financial_advice','investment_guarantee'], ['primaryAnswer','cardEvidence'], ['money_source','financial_state']),
    'money-pattern': readingQuestionSchema('wealth-money-pattern', 'financial_state', 'financial_state', 'financial_pattern', ['financial_state'], ['money_source','investment_guarantee'], ['primaryAnswer','cardEvidence'], ['financial_state'])
  },
  social: {
    'attract-type': readingQuestionSchema('social-attract-type', 'social_profile', 'social_profile', 'social_profile', ['social_profile','interaction_style'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['social_profile','interaction_style']),
    'interpersonal-style': readingQuestionSchema('social-interpersonal-style', 'social_interaction', 'social_interaction', 'social_interaction', ['social_interaction','action'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['social_interaction','action']),
    'ally-conflict': readingQuestionSchema('social-ally-conflict', 'ally_conflict', 'ally_conflict', 'ally_conflict', ['ally_conflict','interaction_style','action'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['ally_conflict','action']),
    'social-need-pattern': readingQuestionSchema('social-need-pattern', 'social_interaction', 'social_interaction', 'social_interaction', ['social_interaction'], ['meeting_context','partner_appearance'], ['primaryAnswer','cardEvidence'], ['social_interaction'])
  },
  study: {
    'major-fit': readingQuestionSchema('study-major-fit', 'learning_fit', 'learning_fit', 'learning_fit', ['learning_fit','action'], ['suitable_environment','financial_advice'], ['primaryAnswer','cardEvidence'], ['learning_fit','action']),
    'exam-application': readingQuestionSchema('study-exam-application', 'exam_progress', 'exam_progress', 'exam_progress', ['exam_progress','action'], ['suitable_roles','meeting_context'], ['primaryAnswer','cardEvidence'], ['exam_progress','action']),
    'focus-execution': readingQuestionSchema('study-focus-execution', 'focus_execution', 'focus_execution', 'focus_execution', ['focus_execution','action'], ['suitable_roles','meeting_context'], ['primaryAnswer','cardEvidence'], ['focus_execution','action']),
    'learning-trait': readingQuestionSchema('study-learning-trait', 'learning_fit', 'learning_fit', 'learning_fit', ['learning_fit'], ['suitable_roles','meeting_context'], ['primaryAnswer','cardEvidence'], ['learning_fit'])
  },
  general: {
    'overall-theme': readingQuestionSchema('general-overall-theme', 'overall_theme', 'overall_theme', 'overall_theme', ['overall_theme','action'], ['partner_appearance','suitable_roles'], ['primaryAnswer','cardEvidence'], ['overall_theme','action']),
    'priority-focus': readingQuestionSchema('general-priority-focus', 'priority_focus', 'priority_focus', 'priority_focus', ['priority_focus','action'], ['partner_appearance','meeting_context'], ['primaryAnswer','cardEvidence'], ['priority_focus','action']),
    'hidden-blindspot': readingQuestionSchema('general-hidden-blindspot', 'hidden_blindspot', 'hidden_blindspot', 'hidden_blindspot', ['hidden_blindspot','action'], ['partner_appearance','meeting_context'], ['primaryAnswer','cardEvidence'], ['hidden_blindspot','action']),
    'next-direction': readingQuestionSchema('general-next-direction', 'next_direction', 'next_direction', 'next_direction', ['next_direction','action'], ['partner_appearance','meeting_context'], ['primaryAnswer','cardEvidence'], ['next_direction','action'])
  }
};

/* Attach the additive contract to the existing public question objects. Existing
 * keys, modes and fields remain unchanged for history/import compatibility. */
Object.keys(READING_QUESTION_SCHEMAS).forEach(function (category) {
  (SUBTOPICS[category] || []).forEach(function (question) {
    var schema = READING_QUESTION_SCHEMAS[category][question.key];
    if (!schema) return;
    question.questionId = schema.questionId;
    question.intent = schema.intent;
    question.questionFocus = schema.questionFocus;
    question.answerTarget = schema.answerTarget;
    question.allowedContentTypes = schema.allowedContentTypes.slice();
    question.excludedContentTypes = schema.excludedContentTypes.slice();
    question.requiredFields = schema.requiredFields.slice();
  });
});

var READING_SEMANTIC_RULES = {
  meeting_context: { require: /課程|訓練|工作|職場|學習|專案|聚會|朋友介紹|旅行|異地|社團|展覽|講座|志工|社群|平台|論壇|討論|辯論|活動|環境|場所|場合|生活圈/, rejectOnly: /公平|成熟|承諾|理性溝通|先觀察|相處方式/ },
  meeting_mechanism: { require: /共同任務|合作|朋友介紹|交換資訊|開始聊天|主動協助|多次碰面|線上聊天|接觸|說話/ },
  interaction_style: { require: /互動|溝通|分歧|協調|回應|表達|相處|對話|傾聽|分寸|尊重/ },
  partner_appearance: { require: /氣質|穿著|打扮|表情|姿態|外在|第一印象|眼神|俐落|低調|張揚|明亮|耐看/, rejectOnly: /承諾|負責|溝通|體貼|成熟可靠/ },
  suitable_roles: { require: /專員|企劃|編輯|協調|訓練|顧問|分析|法務|公關|客服|人資|教學|工程|財會|行政|研究|設計|專案|業務|職務|角色/ },
  suitable_environment: { require: /團隊|組織|制度|自主|工作場所|步調|文化|分工|規模|人際互動|固定|變動/ },
  money_source: { require: /收入|工作|副業|合作|人脈|專業|服務|創作|客戶|佣金|專案|資源|機會/, rejectOnly: /理性消費|衝動投資|規劃財務/ },
  financial_advice: { require: /記錄|設定|確認|停止|暫緩|分配|盤點|諮詢|上限|預備金|支出|現金流/ }
};

function validateReadingContent(contentType, text) {
  var value = String(text || '').trim();
  if (!value) return { valid: false, reason: 'empty' };
  var rule = READING_SEMANTIC_RULES[contentType];
  if (!rule) return { valid: true, reason: '' };
  if (!rule.require.test(value)) return { valid: false, reason: 'missing-required-semantics' };
  if (rule.rejectOnly && rule.rejectOnly.test(value) && !rule.require.test(value.replace(rule.rejectOnly, ''))) {
    return { valid: false, reason: 'excluded-content-only' };
  }
  return { valid: true, reason: '' };
}

var READING_TAIWAN_REPLACEMENTS = [
  [/視頻/g, '影片'], [/音頻/g, '音訊'], [/軟件/g, '軟體'], [/硬件/g, '硬體'],
  [/網絡/g, '網路'], [/用戶/g, '使用者'], [/默認/g, '預設'], [/加載/g, '載入'],
  [/運行/g, '執行'], [/保存/g, '儲存'], [/粘貼/g, '貼上'], [/鏈接/g, '連結'],
  [/概率/g, '機率'], [/信號/g, '訊號'], [/渠道/g, '管道'], [/領導(?=風格|方式|者)/g, '主管'],
  [/落地/g, '實作'], [/復盤/g, '回顧'], [/閉環/g, '完整流程'], [/賦能/g, '協助']
];
var READING_EMPTY_MARKERS = /值得注意的是|需要注意的是|值得一提的是|更重要的是|事實上|毫無疑問|不得不說|可以說|從某種意義上來說|簡單來說|總的來說|總體而言|綜上所述|深入探討/g;
var READING_FORBIDDEN_ENDINGS = /相信宇宙的安排|相信自己的直覺|一切都會在最好的時機發生|你值得被愛|保持正向的心態|勇敢迎接新的可能|這是宇宙給你的考驗|放下執著，一切就會好轉|找到屬於自己的平衡|接納真正的自己/g;

function refineTraditionalChineseCopy(text) {
  var value = String(text == null ? '' : text).trim();
  if (!value) return '';
  READING_TAIWAN_REPLACEMENTS.forEach(function (pair) { value = value.replace(pair[0], pair[1]); });
  value = value.replace(READING_EMPTY_MARKERS, '').replace(READING_FORBIDDEN_ENDINGS, '');
  value = value.replace(/當下的能量偏向/g, '目前較明顯的是').replace(/牌面能量/g, '牌面方向').replace(/能量卡住/g, '進度受阻').replace(/能量/g, '狀態');
  value = value.replace(/需要留意的課題/g, '需要處理的問題').replace(/眼前的課題/g, '眼前的問題');
  value = value.replace(/大阿爾克那/g, '大牌').replace(/小阿爾克那/g, '小牌');
  value = value.replace(/內在拉扯/g, '心裡反覆猶豫').replace(/內在阻力較大/g, '心裡的猶豫與防備較多');
  value = value.replace(/深層課題/g, '反覆出現的問題').replace(/命運性的/g, '難以靠小調整解決的').replace(/顯化/g, '實際出現');
  value = value.replace(/內耗/g, '反覆消耗').replace(/瀐漫著/g, '出現').replace(/牽制/g, '影響');
  value = value.replace(/——/g, '：').replace(/\s*：\s*：/g, '：').replace(/，，+/g, '，');
  value = value.replace(/不是([^。；，]{1,24})，而是/g, '重點不在$1，真正要看的是');
  value = value.replace(/不僅([^。；，]{1,24})，更/g, '$1，也');
  value = value.replace(/在([^，。]{1,18})的過程中/g, '$1時');
  value = value.replace(/進行(分析|整理|確認|溝通|調整)/g, '$1');
  value = value.replace(/。{2,}/g, '。').replace(/；。/g, '。').replace(/^\s*[，；：]/, '');
  return value.trim();
}

/* Keep the older card-reading name as a compatibility alias.  Astrology topic
 * analysis uses the generic name so its prose rules are not coupled to cards. */
function refineReadingCopy(text) {
  // Card prose has its own vocabulary; keep these changes out of natal answers.
  let value = String(text == null ? '' : text);
  const phrases = [
    ['種子遲遲沒有發芽——拖延、分心，把潛力放到過期', '原本有機會開始，但拖延或分心讓事情一直沒有進展'],
    ['一顆種子已經種下，耐心澆灌', '事情已經開始，接下來需要持續投入時間與行動'],
    ['潛力不會自己長大，動起來', '想法需要實際行動，先完成一件能開始的小事'],
    ['彼此心意相通，是關係中重要的連結時刻', '互動可能較有來有往，雙方都願意回應、傾聽或主動聯絡'],
    ['對關係重新打開心房，開始願意迎接新的可能', '原本較冷淡或退縮的一方，可能開始願意聊天、回應或接受邀約'],
    ['關係穩定發展，可以期待更長遠的未來', '關係可能逐步穩定，可以觀察雙方是否開始討論下一次見面或共同安排'],
    ['關係中的付出與接受失衡，或給予帶著條件', '兩人的付出可能不對等，或一方幫忙後期待對方照自己的意思做'],
    ['關係中的付出與接受趨於平衡', '兩人都願意付出，也能接受對方的關心與幫忙'],
    ['家庭中的給予與接受失衡，或帶著條件', '家人之間可能有人付出較多，或幫忙後要求對方配合自己的安排'],
    ['家庭成員間給予與接受趨於平衡', '家人願意互相分擔，也能接受彼此的幫忙'],
    ['人際互動中的給予與接受失衡，或帶著條件', '朋友之間可能總由同一方幫忙，或幫忙後要求回報'],
    ['人際互動中給予與接受趨於平衡', '朋友之間願意互相幫忙，不會總由同一方付出'],
    ['財務上的給予與接受失衡，或帶著條件', '金錢往來可能有一方負擔較多，或資助附帶要求'],
    ['財務上的給予與接受趨於平衡', '金錢往來中，雙方的負擔與回報較合理'],
    ['施與受失衡，或帶著條件的給予', '有人付出較多，或幫忙後要求回報'],
    ['給予與接受間的平衡，慷慨互助', '雙方願意互相幫忙，付出與回報較合理'],
    ['獲得的資源挹注可能帶著隱性條件', '得到的幫忙可能附帶未說清楚的要求'],
    ['獲得他人資源挹注，有助於調養', '有人提供時間、金錢或實際幫忙，讓你較能休息與照顧自己'],
    ['長期投入的成果尚在醞釀，需要耐心', '已投入時間與努力，但還沒看到明顯成果'],
    ['資源來源仍在醞釀', '收入或幫忙的來源還沒確定'],
    ['大多順勢支持這股流動', '大多支持前面提到的發展方向'],
    ['內在阻力較大', '心裡的猶豫與防備較多'],
    ['內在的卡關', '自己的猶豫或遲遲沒處理的問題'],
    ['深層根源', '反覆出現這種情況的原因'],
    ['關係資源豐沛', '相處中較能得到陪伴或實際支持'],
    ['資源流動相對順暢', '金錢與實際幫忙較容易到位'],
    ['近期資源流動較有支持', '近期較有機會得到收入或實際幫忙'],
    ['資源流動順的時候', '收入與支出較穩定時'],
    ['宜先穩住腳步、做足準備', '適合先處理眼前的問題，確認準備是否足夠'],
    ['耐心醞釀', '確認還缺哪些準備'],
    ['時機到了再進一步行動', '等必要條件具備後，再決定是否行動']
  ];
  phrases.forEach(function (pair) { value = value.split(pair[0]).join(pair[1]); });
  return refineTraditionalChineseCopy(value);
}

function traditionalChineseStyleFlags(text) {
  var value = String(text || '');
  var flags = [];
  if (READING_EMPTY_MARKERS.test(value)) flags.push('empty-marker');
  READING_EMPTY_MARKERS.lastIndex = 0;
  if (READING_FORBIDDEN_ENDINGS.test(value)) flags.push('fixed-healing-ending');
  READING_FORBIDDEN_ENDINGS.lastIndex = 0;
  if ((value.match(/——/g) || []).length > Math.max(1, Math.ceil(value.length / 1000))) flags.push('dash-overuse');
  if ((value.match(/不是[^。]+而是/g) || []).length > Math.max(1, Math.ceil(value.length / 1000))) flags.push('false-contrast');
  if (/視頻|軟件|硬件|網絡|用戶|默認|加載|保存|粘貼|鏈接|概率|渠道|落地|復盤|閉環/.test(value)) flags.push('non-taiwan-usage');
  if (/大阿爾克那|小阿爾克那|能量卡住|命運性的/.test(value)) flags.push('difficult-or-mystical-language');
  return flags;
}

function readingStyleFlags(text) {
  return traditionalChineseStyleFlags(text);
}

function traditionalChineseStyleInstruction() {
  return [
    '【繁體中文與文風規則】',
    '1. 使用臺灣繁體中文。直接回答問題，不寫禮貌性開場，也不復述題目。',
    '2. 以完全沒有占星或牌卡背景的一般讀者為準。每段先寫具體情境、行為或可觀察訊號，再解釋原因；用短句，不用專業名詞代替生活說明。',
    '3. 保留必要的小標題，但標題、第一句與相鄰區塊不可重複同一結論。',
    '4. 限制「不是……而是……」「不僅……更……」與破折號。刪除「值得注意的是」「總體而言」「深入探討」等空話。',
    '5. 不用宇宙安排、命中注定、相信自己、保持正向等固定療癒結尾。建議要寫明何時做、做什麼及如何確認完成。'
  ].join('\n');
}

/* Question-specific Lenormand editorial layer. Core symbols were checked
 * against Tina Gong's card guides; visual associations are our explicitly
 * labelled symbolic extensions, not verified physical predictions.
 * See docs/lenormand-question-reading.md for scope and sources. */
var LENORMAND_QUESTION_MEANINGS = {
  1: { appearance:'外在較有活力，穿搭可能偏運動或方便活動', quality:'聯絡與邀約是否有實際進展', observe:'看對方會不會主動聯絡，並把邀約落實', kind:'neutral' },
  2: { appearance:'外在風格輕鬆、俏皮，給人容易接近的第一印象', quality:'相處輕鬆，但機會可能短暫', observe:'確認開心的互動之後，是否還有持續聯絡', kind:'neutral' },
  3: { appearance:'穿搭可能帶旅行感、異地風格或較自由的搭配', quality:'距離與生活安排需要協調', observe:'問清楚彼此能多久見一次面，以及誰能配合交通', kind:'neutral' },
  4: { appearance:'穿搭可能偏日常、保守與舒適，外在較有安定感', quality:'日常生活與安全感有建立的空間', observe:'看對方是否願意把你納入日常安排', kind:'support' },
  5: { appearance:'外在可聯想到自然耐看、較修長或舒展的輪廓', quality:'熟悉與信任需要長時間累積', observe:'看相處能否持續穩定，而非只在熱絡時出現', kind:'support' },
  6: { appearance:null, quality:'關係的說法或安排可能不夠清楚', observe:'直接確認關係狀態、見面安排與雙方期待', kind:'check' },
  7: { appearance:'外在可聯想到較修長、曲線感或有吸引力的風格', quality:'吸引力與複雜的關係安排可能同時存在', observe:'確認雙方是否已有其他關係，以及未說清楚的安排', kind:'check' },
  8: { appearance:null, quality:'某種相處方式可能已經停止或需要結束', observe:'確認目前是否仍有聯絡，雙方是否願意繼續', kind:'check' },
  9: { appearance:'可能重視打扮、色彩或飾品，外在較精緻親切', quality:'禮貌、邀請與欣賞是靠近的機會', observe:'看客氣或送禮之外，是否也願意了解你的需求', kind:'support' },
  10: { appearance:'外在可聯想到俐落、銳利的線條或簡潔剪裁', quality:'互動可能有突然中斷或急著決定的情況', observe:'重要決定先談清楚，確認是否經常突然取消或失聯', kind:'check' },
  11: { appearance:'外在可聯想到運動感、緊實線條或較有力的姿態', quality:'同一個爭執可能反覆發生', observe:'看爭執後有沒有改變做法，而非只是暫時和好', kind:'check' },
  12: { appearance:null, quality:'聊天頻繁，但可能伴隨焦慮或傳話誤會', observe:'有疑問就向本人確認，避免靠朋友傳話判斷', kind:'neutral' },
  13: { appearance:'外在可聯想到娃娃臉、年輕感或清爽俏皮的穿搭', quality:'彼此仍在認識的初期，經驗與熟悉度有限', observe:'先用小邀約慢慢認識，確認雙方是否願意持續投入', kind:'neutral' },
  14: { appearance:'外在可聯想到俐落、靈巧，眼神或穿搭較有個人風格', quality:'言語、利益與實際行動需要核對', observe:'看說過的事是否做到，金錢或幫忙的要求是否合理', kind:'check' },
  15: { appearance:'外在可聯想到較高大、厚實或肩背有份量的輪廓', quality:'照顧與主導之間的分寸需要確認', observe:'看對方幫忙時，是否也尊重你的選擇與拒絕', kind:'neutral' },
  16: { appearance:'外在可能有清透、明亮或帶亮點的風格', quality:'共同期待與未來計畫能讓彼此靠近', observe:'把期待講成具體安排，確認雙方都願意配合', kind:'support' },
  17: { appearance:'外在可聯想到修長、輕盈或經常調整穿搭的風格', quality:'相處方式或生活安排正在改變', observe:'確認改變之後，雙方對關係的期待是否仍一致', kind:'neutral' },
  18: { appearance:'外在較親切自然，可能偏實用、容易親近的穿搭', quality:'陪伴與可靠的行動有建立信任的空間', observe:'看對方是否守約，在你需要時能否提供合理支持', kind:'support' },
  19: { appearance:'外在可聯想到較挺拔、正式或帶距離感的風格', quality:'個人空間與關係距離需要協調', observe:'問清楚聯絡與見面的頻率，確認彼此需要的空間', kind:'neutral' },
  20: { appearance:'穿搭可能重視社交場合，外在較整齊、容易被注意', quality:'共同活動與生活圈能增加認識機會', observe:'看公開活動之外，是否也願意單獨相處', kind:'neutral' },
  21: { appearance:'外在可聯想到厚實、硬朗或沉穩的輪廓', quality:'見面或推進關係可能有實際阻力', observe:'問清楚阻力是時間、距離或意願，能否一起解決', kind:'check' },
  22: { appearance:null, quality:'彼此可能尚未選定關係方向', observe:'確認想繼續認識、穩定交往或保持朋友，避免默認', kind:'check' },
  23: { appearance:null, quality:'小問題與反覆擔心可能正在消耗相處', observe:'列出反覆讓你不安的事，確認對方是否願意處理', kind:'check' },
  24: { appearance:'外在可能帶柔和、溫暖或浪漫的風格', quality:'喜歡與情感表達是靠近的線索', observe:'看表達喜歡之外，是否也尊重需求並持續陪伴', kind:'support' },
  25: { appearance:'外在可聯想到經典、整齊的搭配，或重視飾品與細節', quality:'承諾與雙方約定是關係重點', observe:'把承諾講成具體約定，確認雙方是否遵守', kind:'support' },
  26: { appearance:'外在可聯想到書卷感、低調或不急著展現自己的風格', quality:'還有尚未了解或未說清楚的資訊', observe:'先確認對方願意分享哪些生活資訊，別靠猜測補空白', kind:'neutral' },
  27: { appearance:null, quality:'訊息中的說法需要確認與落實', observe:'重要的關係期待直接談，確認文字與行動是否一致', kind:'neutral' },
  28: { appearance:null, quality:'這張人物牌指出需要了解的對象，單獨不足以評估相處', observe:'從周圍牌與對方實際行動確認相處方式', kind:'neutral' },
  29: { appearance:null, quality:'這張人物牌指出需要了解的對象，單獨不足以評估相處', observe:'從周圍牌與對方實際行動確認相處方式', kind:'neutral' },
  30: { appearance:'外在可聯想到成熟、簡潔或優雅的穿搭風格', quality:'親密需求、步調與相處分寸需要協調', observe:'談清楚彼此舒服的親密程度與相處節奏', kind:'neutral' },
  31: { appearance:'外在可聯想到明亮、有精神或較醒目的風格', quality:'互動較有熱情與坦率表達的空間', observe:'看熱絡之外，是否願意把重要問題說清楚', kind:'support' },
  32: { appearance:'外在可聯想到柔和、帶藝術感或重視氛圍的風格', quality:'被重視的感受與情緒回應是相處重點', observe:'說清楚希望怎麼被關心，確認對方是否願意回應', kind:'neutral' },
  33: { appearance:null, quality:'談清楚關鍵問題有助於決定下一步', observe:'直接問目前最在意的一件事，看回答是否明確', kind:'support' },
  34: { appearance:'穿搭可聯想到較自由、流動感或寬鬆的搭配', quality:'金錢、付出與自由度需要說清楚', observe:'確認消費、借貸與分攤安排，是否由雙方自願同意', kind:'neutral' },
  35: { appearance:'外在可聯想到穩重、實用，偏好固定的穿搭風格', quality:'固定陪伴與持續投入是穩定的線索', observe:'看對方是否持續守約，也能在需要時調整安排', kind:'support' },
  36: { appearance:null, quality:'責任或壓力可能讓相處變得沉重', observe:'確認哪些責任可以分擔，是否總由同一方承受', kind:'check' }
};

var LENORMAND_QUESTION_PAIR_MEANINGS = {
  '5-13': { appearance:'年輕感的外在風格，可以和自然、較修長的輪廓一起出現。' },
  '13-15': { appearance:'可能是年輕感的臉或穿搭，搭配較厚實、有份量的輪廓；兩張牌描述不同面向。' },
  '7-14': { appearance:'外在可能偏修長、俐落，眼神或搭配有自己的風格；這組外貌聯想不能用來判斷誠信。', quality:'吸引力之外，先確認關係安排與言行是否一致，遇到金錢要求時把條件說清楚。' },
  '15-25': { appearance:'較有份量的輪廓，可以搭配經典、整齊或重視飾品的外在風格。' },
  '18-25': { quality:'陪伴與承諾要一起看：是否持續守約，答應的事有沒有實際做到。' },
  '4-5': { quality:'日常與長期累積要一起看：是否願意固定相處，把你納入生活安排。' },
  '24-25': { quality:'喜歡需要落實成雙方都同意的約定，不能只靠告白或甜言蜜語判斷。' },
  '25-35': { quality:'約定與持續陪伴是穩定線索，仍要確認是否雙方自願、也能協調改變。' },
  '14-25': { quality:'先核對承諾與行動是否一致；這組牌提示需要確認約定，不能直接判定對方欺騙。' },
  '7-25': { quality:'先確認承諾是否清楚，雙方有沒有其他未說明的關係或安排。' },
  '14-18': { quality:'親近感與需要核對的訊號同時出現，先以守約與實際支持確認信任。' },
  '15-24': { quality:'關心與主導要分開確認：對方照顧你時，是否仍尊重你的拒絕與選擇。' }
};

function lenormandQuestionTopic(subtopicKey) {
  return subtopicKey === 'partner-profile' ? 'appearance' : (subtopicKey === 'marriage-longterm' ? 'quality' : '');
}

function lenormandQuestionLabel(subtopicKey, fallback) {
  var topic = lenormandQuestionTopic(subtopicKey);
  return topic === 'appearance' ? '未來對象的外貌與風格' : (topic === 'quality' ? '這段桃花的相處品質與穩定性' : fallback);
}

function lenormandCardQuestionText(drawnCard, topic) {
  var row = LENORMAND_QUESTION_MEANINGS[drawnCard.card.n];
  if (!row) return '';
  if (topic === 'appearance') {
    return row.appearance ? '問外貌與風格時：' + row.appearance + '。'
      : '這張牌沒有足夠的外在風格線索，不推測長相、身形或穿搭。';
  }
  return '問相處品質時，重點是：' + row.quality + '。可以觀察：' + row.observe + '。';
}

function lenormandQuestionPairText(a, b, topic) {
  var key = [a.n, b.n].sort(function (x, y) { return x - y; }).join('-');
  var rule = LENORMAND_QUESTION_PAIR_MEANINGS[key];
  if (rule && rule[topic]) return rule[topic];
  var left = LENORMAND_QUESTION_MEANINGS[a.n], right = LENORMAND_QUESTION_MEANINGS[b.n];
  if (!left || !right) return '';
  if (topic === 'appearance') {
    var parts = [];
    if (left.appearance) parts.push('「' + a.nameZh + '」描述' + left.appearance);
    if (right.appearance) parts.push('「' + b.nameZh + '」補充' + right.appearance);
    return parts.length ? parts.join('；') + '。這些是可並存的外在風格聯想。' : '這兩張牌沒有足夠的外在風格線索，不硬推測長相。';
  }
  return '「' + a.nameZh + '」提醒' + left.quality + '；「' + b.nameZh + '」提醒' + right.quality + '。';
}

function lenormandQuestionPairIndices(count) {
  if (count === 9) return [[3,4],[4,5],[1,4],[4,7],[0,1],[1,2],[6,7],[7,8]];
  var pairs = [];
  if (count === 36) {
    for (var i = 0; i < count; i++) {
      if (i % 9 < 8) pairs.push([i,i + 1]);
      if (i + 9 < count) pairs.push([i,i + 9]);
    }
    return pairs;
  }
  var middle = Math.floor(count / 2);
  if (middle > 0) pairs.push([middle - 1,middle]);
  if (middle < count - 1) pairs.push([middle,middle + 1]);
  for (var j = 0; j < count - 1; j++) {
    if (!pairs.some(function (p) { return p[0] === j && p[1] === j + 1; })) pairs.push([j,j + 1]);
  }
  return pairs;
}

function buildLenormandQuestionReading(schema, drawnCards, topic) {
  var out = { available:false, schema:schema, primaryAnswer:'', sections:{}, cardRelationship:'', evidence:[], action:'', uncertainty:'', omitted:[] };
  if (!drawnCards.length) return out;
  var middle = Math.floor(drawnCards.length / 2);
  var order = [middle];
  // A nine-box uses its centre and orthogonal neighbours. A line uses its
  // middle and neighbours. Every remaining card stays available as evidence.
  var near = drawnCards.length === 9 ? [3,5,1,7] : [middle - 1,middle + 1];
  near.concat(drawnCards.map(function (_, i) { return i; })).forEach(function (i) {
    if (i >= 0 && i < drawnCards.length && order.indexOf(i) === -1) order.push(i);
  });
  var ranked = order.map(function (i) { return drawnCards[i]; });
  var usable = ranked.filter(function (d) { return !!LENORMAND_QUESTION_MEANINGS[d.card.n]; });
  out.evidence = drawnCards.map(function (d) {
    return '「' + d.card.nameZh + '」在' + d.pos.zh + '：' + lenormandCardQuestionText(d, topic);
  });
  var type = topic === 'appearance' ? 'partner_appearance' : 'longterm_relationship';
  if (topic === 'appearance') {
    var looks = usable.filter(function (d) { return !!LENORMAND_QUESTION_MEANINGS[d.card.n].appearance; }).slice(0,3);
    out.primaryAnswer = looks.length ? '這組牌的外在風格聯想：' + looks.map(function (d) {
      return '「' + d.card.nameZh + '」：' + LENORMAND_QUESTION_MEANINGS[d.card.n].appearance.replace(/^外在可聯想到|^外在可能|^外在較|^外在/, '');
    }).join('；') + '。' : '這組牌沒有足夠的外在風格線索，先不推測長相、身形或穿搭。';
    out.uncertainty = '外貌與穿搭是牌面象徵的聯想，無法確認實際年齡、身高、體重或五官；也不能用來判斷人品。';
  } else {
    var checks = usable.filter(function (d) { return LENORMAND_QUESTION_MEANINGS[d.card.n].kind === 'check'; }).slice(0,2);
    var support = usable.filter(function (d) { return LENORMAND_QUESTION_MEANINGS[d.card.n].kind === 'support'; })[0];
    var focus = checks[0] || support || usable[0];
    if (!focus) return out;
    var focusRow = LENORMAND_QUESTION_MEANINGS[focus.card.n];
    if (checks.length) {
      out.primaryAnswer = '先放慢投入，優先確認：' + checks.map(function (d) {
        return '「' + d.card.nameZh + '」指向' + LENORMAND_QUESTION_MEANINGS[d.card.n].quality;
      }).join('；') + '。';
      if (support) out.primaryAnswer += '「' + support.card.nameZh + '」也提供' + LENORMAND_QUESTION_MEANINGS[support.card.n].quality + '的線索，仍要以實際行動確認。';
    } else {
      out.primaryAnswer = (support ? '可以繼續認識，先確認' : '加深投入前，先談清楚') + '「' + focus.card.nameZh + '」指向的問題：' + focusRow.quality + '。';
    }
    out.action = (checks.length ? checks : [focus]).map(function (d) { return LENORMAND_QUESTION_MEANINGS[d.card.n].observe; }).join('；') + '。';
    out.uncertainty = '這些牌提供相處中需要確認的線索，不能替對方的人品評分，也不能保證忠誠或長期結果。';
  }
  out.sections[type] = { contentType:type, label:topic === 'appearance' ? '外貌與穿搭風格' : '相處品質與穩定性', text:out.primaryAnswer, evidence:out.evidence };
  var pairIndices = lenormandQuestionPairIndices(drawnCards.length);
  // Prefer explicit combined interpretations, but only for actual neighbours.
  var special = pairIndices.filter(function (p) {
    var key = [drawnCards[p[0]].card.n,drawnCards[p[1]].card.n].sort(function (a,b) { return a - b; }).join('-');
    return LENORMAND_QUESTION_PAIR_MEANINGS[key] && LENORMAND_QUESTION_PAIR_MEANINGS[key][topic];
  });
  out.cardRelationship = (special.length ? special : pairIndices).slice(0,2).map(function (p) {
    var a = drawnCards[p[0]].card, b = drawnCards[p[1]].card;
    return '「' + a.nameZh + ' ＋ ' + b.nameZh + '」：' + lenormandQuestionPairText(a,b,topic);
  }).join(' ');
  out.available = !!out.primaryAnswer;
  return out;
}
