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
  return refineTraditionalChineseCopy(text);
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
