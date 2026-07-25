/* ================= V5：Composable Astrology Knowledge Dataset =================
   只存語意資料，不負責畫面或占星計算。這份資料補齊 V4 尚未覆蓋的
   love / health / wealth / social / study / general questionFocus，並在載入時
   組合成 projectKnowledge() 已經認得的 PLANET_TOPIC_KNOWLEDGE 介面。 */
var ASTRO_KNOWLEDGE_SCHEMA_VERSION = 1;

var ASTRO_PLANET_SEMANTIC_DATASET = {
  Sun:     { drive: '建立清楚的自我定位並主動承擔', gift: '主導、決策與凝聚注意力', need: '被看見、被肯定並保有主體性', risk: '過度把成敗綁在自我價值上', pace: '主動而明確', social: '自然成為焦點或代表人物' },
  Moon:    { drive: '回應情緒並建立可依靠的安全感', gift: '同理、照顧與察覺氣氛', need: '熟悉感、歸屬感與穩定回應', risk: '過度承接他人的情緒', pace: '依感受調整', social: '讓人感到被理解與接住' },
  Mercury: { drive: '理解資訊並建立清楚的連結', gift: '學習、表達與整理複雜資訊', need: '交流、變化與足夠的思考空間', risk: '想得太多或注意力分散', pace: '靈活而快速', social: '透過談話與好奇心拉近距離' },
  Venus:   { drive: '創造價值、和諧與彼此欣賞', gift: '美感、協調與關係經營', need: '公平、舒適與有品質的互動', risk: '為維持和諧而壓下真實立場', pace: '講究平衡與感受', social: '自然營造好感與合作氣氛' },
  Mars:    { drive: '採取行動、突破阻力並爭取目標', gift: '執行、競爭與快速反應', need: '挑戰、自主與可立即投入的目標', risk: '求快、急躁或忽略他人節奏', pace: '直接而迅速', social: '用行動與鮮明態度帶動互動' },
  Jupiter: { drive: '擴大視野、可能性與成長空間', gift: '整合、教導與看見長期機會', need: '自由探索、意義感與更大的格局', risk: '承諾過多或高估可用資源', pace: '開放而擴張', social: '以樂觀與分享帶動群體' },
  Saturn:  { drive: '建立結構、責任與可長期維持的成果', gift: '紀律、規劃與承受長期壓力', need: '清楚界線、可靠制度與可預期進度', risk: '過度保守、自我要求或害怕犯錯', pace: '審慎而穩定', social: '以可靠與負責建立信任' },
  Uranus:  { drive: '打破慣性並創造更自由的新做法', gift: '創新、獨立判斷與系統改革', need: '自主、差異性與不被僵化規則限制', risk: '突然抽離或為反對而反對', pace: '跳躍而非線性', social: '以獨特觀點吸引同好' },
  Neptune: { drive: '連結想像、同理與超越個人的意義', gift: '直覺、創作與感受細微氛圍', need: '靈感、柔軟空間與情感共鳴', risk: '界線模糊、理想化或逃避現實', pace: '流動而憑直覺', social: '以溫柔、想像與共感建立連結' },
  Pluto:   { drive: '深入核心並完成根本性的轉化', gift: '洞察、危機處理與資源整合', need: '深度、真實與足夠的掌控感', risk: '過度控制、猜疑或長期處於高張力', pace: '集中而強烈', social: '以深度與強烈存在感建立連結' },
};

/* 生活習慣題需要的是可以實際判斷「合不合適」的日常條件，不能只把行星
   的思考／人格語意換句話說。每顆行星提供步調、作息與可觀察的適配訊號。 */
var ASTRO_LIFESTYLE_HABIT_DATASET = {
  Sun: { pace:'每天保留一段能自主安排、完成明確目標的時間', routine:'用固定的起床時間與每日一項主要任務建立節奏', fit:'做完一天的安排後，會感到有進度而不是只剩被催促感' },
  Moon: { pace:'規律吃飯、睡眠時間穩定，並在忙碌之間保留安靜緩衝', routine:'把休息與居家整理排進日程，不等情緒耗盡才停下來', fit:'作息穩定後，情緒起伏與疲憊感會比較容易恢復' },
  Mercury: { pace:'採用短時間專注、穿插走動或切換任務的彈性節奏', routine:'用清單、筆記與固定收尾時間清空腦中待辦', fit:'能把事情說清楚、記下來，而且晚上不再反覆想未完成事項' },
  Venus: { pace:'在舒服整潔的環境中維持不過度緊繃的固定節奏', routine:'把用餐、散步或與喜歡的人交流安排成穩定的小儀式', fit:'這套作息不需靠勉強忍耐，也能讓生活維持愉快與秩序' },
  Mars: { pace:'動靜交替，白天安排能消耗體力或快速完成的任務', routine:'固定運動或快走，並把大任務拆成可以立即開始的短衝刺', fit:'身體有適度活動後，煩躁感下降、入睡與專注都更順' },
  Jupiter: { pace:'保留變化與戶外活動，但用少數固定時段維持基本規律', routine:'每週安排學習、旅行或接觸新事物，同時守住睡眠與用餐底線', fit:'生活有新鮮感，但不會因行程塞太滿而持續透支' },
  Saturn: { pace:'採用可預期、循序漸進，而且每天差異不大的生活節奏', routine:'固定睡眠、用餐與工作區段，用簡單紀錄追蹤是否做到', fit:'不需要每天重新決定怎麼安排，也能穩定完成重要事情' },
  Uranus: { pace:'用彈性區塊取代逐分鐘行程，固定目標但允許更換做法', routine:'保留獨處與嘗試新活動的時間，避免整週都被同一套流程綁住', fit:'有足夠自由調整，又不會因臨時改變而漏掉必要休息' },
  Neptune: { pace:'減少過度刺激，在行程之間留白，讓注意力有時間沉澱', routine:'固定安排音樂、創作、冥想或安靜散步，睡前降低資訊輸入', fit:'休息後能回到現實任務，而不是越休息越失去時間感' },
  Pluto: { pace:'集中完成重要事情，再安排明確的離線與放鬆時段', routine:'限制長時間過度投入，設定停止時間並固定做深度放鬆', fit:'能專注處理困難任務，也能在結束後真正把注意力放下' },
};
var ASTRO_FAMILY_PRACTICE_DATASET = {
  Sun:'輪流表達立場，也讓每個人都有參與決定的空間',
  Moon:'先確認彼此感受，再討論實際需要與安排',
  Mercury:'把含糊期待說清楚，確認每個人理解的是同一件事',
  Venus:'在維持和諧的同時，也誠實說出不同意的地方',
  Mars:'直接談問題，但為彼此保留冷靜與回應的時間',
  Jupiter:'先縮小問題範圍，避免一次承諾太多或把話題拉得太遠',
  Saturn:'把責任、期限與可以做到的範圍明確分配',
  Uranus:'尊重每個人的差異與空間，不用疏離代替溝通',
  Neptune:'把感受與事實分開說明，避免靠猜測理解彼此',
  Pluto:'把真正介意的核心說出來，不用控制或沉默維持安全感',
};

/* 每個 lens 僅回答一個維度；semanticKeys 供回歸測試與未來知識編輯器使用。 */
var ASTRO_TOPIC_SEMANTIC_DATASET = {
  /* V4 已有完整行星文案的七個類別也登記在 semantic planner。install 時不會
     覆寫既有內容；這裡只讓 Content Planner 知道可直接使用其 headline /
     summary / details，而不必再塞回舊 intent 模板。 */
  meeting_context: { family:'love', phrase:'在能自然互動的場合建立連結', summary:'共同活動讓關係有機會逐步形成', detail:'具體場合；形成連結的方式', caution:'', keys:['meetingVenue','connectionPath'] },
  suitable_roles: { family:'career', phrase:'適合發揮{gift}的工作角色', summary:'這類角色能支持你{drive}', detail:'核心職能是{gift}；工作推進方式偏向{pace}', caution:'留意{risk}', keys:['roleFunction','workContent'] },
  suitable_environment: { family:'career', phrase:'適合能提供{need}的工作環境', summary:'這種條件有助於穩定發揮{gift}', detail:'環境條件是{need}；工作節奏偏向{pace}', caution:'留意{risk}', keys:['environmentCondition','workPace'] },
  achievement_source: { family:'career', phrase:'成就感主要來自{drive}', summary:'完成時會確認{gift}確實產生價值', detail:'滿足來源是{drive}；可見成果是{gift}', caution:'', keys:['achievementSource','meaningfulResult'] },
  monetizable_skills: { family:'wealth', phrase:'較容易變現的能力是{gift}', summary:'市場價值來自穩定運用這項能力', detail:'可變現能力是{gift}；累積方式偏向{pace}', caution:'留意{risk}', keys:['monetizableSkill','marketValue'] },
  long_term_direction: { family:'career', phrase:'長期方向適合圍繞{drive}持續累積', summary:'核心資產是{gift}', detail:'長期資產是{gift}；發展節奏偏向{pace}', caution:'留意{risk}', keys:['longTermAsset','developmentSequence'] },
  family_context: { family:'family', phrase:'家庭中的功能與{drive}有關', summary:'你常透過{gift}回應家人需要', detail:'家庭角色是{social}；主要貢獻是{gift}', caution:'留意{risk}', keys:['familyFunction','familyContribution'] },
  partner_profile: { family: 'love', phrase: '重視{need}、並以{social}的方式進入關係', summary: '這類對象會呼應你對{need}的重視', detail: '{social}；關係態度偏向{pace}', caution: '需要分辨{risk}是否會影響長期相處', keys: ['partnerTrait', 'relationshipAttitude'] },
  attraction_pattern: { family: 'love', phrase: '容易被能展現{gift}、互動節奏{pace}的人打動', summary: '吸引力來自對方讓你感受到{need}', detail: '心動特質是{gift}；互動上偏好{pace}', caution: '別讓一時吸引掩蓋{risk}', keys: ['attractionTrait', 'interactionSpark'] },
  appearance_vibe: { family: 'love', phrase: '呈現{pace}、並帶有「{social}」印象的外在氣質', summary: '整體辨識度來自{gift}所形成的風格', detail: '第一印象偏向{pace}；打扮或姿態帶有{gift}的調性', caution: '', keys: ['visualStyle', 'firstImpression', 'presentation'] },
  relationship_style: { family: 'love', phrase: '適合能保有{need}、互動方式{pace}的關係', summary: '穩定投入的前提是關係允許你{drive}', detail: '相處需要{need}；溝通節奏宜保持{pace}', caution: '衝突時留意{risk}', keys: ['interactionMode', 'conflictStyle'] },
  relationship_strength: { family: 'love', phrase: '關係中的優勢是{gift}，也能讓對方感到{social}', summary: '你會透過{drive}維持關係品質', detail: '可發揮{gift}；別人容易感受到{social}', caution: '', keys: ['relationshipGift', 'feltByPartner'] },
  relationship_challenge: { family: 'love', phrase: '感情裡較容易卡在{risk}', summary: '壓力升高時，原本想要{need}的需求可能走向失衡', detail: '觸發點是缺少{need}；常見反應是{risk}', caution: '先辨認需求，再決定如何回應', keys: ['relationshipTrigger', 'stressResponse'] },
  relationship_values: { family: 'love', phrase: '長期關係真正需要的是{need}', summary: '關係能支持你{drive}時，投入才容易持續', detail: '核心需求是{need}；長期價值在於{drive}', caution: '', keys: ['coreNeed', 'longTermValue'] },
  relationship_repair: { family: 'love', phrase: '衝突後先恢復{need}，再運用{gift}把問題說清楚', summary: '修復的重點不是立刻和好，而是讓彼此重新有條件{drive}', detail: '第一步是恢復{need}；修復方式是運用{gift}確認感受、責任與下一步', caution: '避免讓{risk}取代真正的對話', keys: ['repairFirstStep', 'trustRepair'] },
  employment_mode: { family: 'career', phrase: '工作模式需要保有{need}，並採取{pace}的推進方式', summary: '這能讓你持續發揮{gift}', detail: '自主程度需符合{need}；合作節奏偏向{pace}', caution: '把{risk}納入制度設計', keys: ['workMode', 'autonomyLevel'] },
  career_challenge: { family: 'career', phrase: '職涯較容易因{risk}而停滯', summary: '原本想要{need}，壓力下卻可能限制了{drive}', detail: '卡點常是{risk}；需要重新運用{gift}', caution: '用可檢查的行動節點取代反覆自我懷疑', keys: ['careerBlock', 'correction'] },
  career_strength: { family:'career', phrase:'核心職場競爭力是{gift}', summary:'別人會在需要{drive}時倚賴這項能力', detail:'最拿手的是{gift}；穩定表現需要{need}', caution:'留意{risk}', keys:['workplaceStrength','trustedContribution'] },
  family_role: { family:'family', phrase:'家庭中較常扮演{social}的角色', summary:'你會透過{gift}維持家庭運作', detail:'主要角色是{social}；實際貢獻是{gift}', caution:'', keys:['familyRole','familyContribution'] },
  family_origin: { family:'family', phrase:'原生家庭可能讓你特別在意{need}', summary:'過去經驗會影響你如何{drive}', detail:'留下的影響是重視{need}；可保留的資源是{gift}', caution:'留意不要讓{risk}成為唯一反應', keys:['originInfluence','retainedResource'] },
  family_boundary: { family:'family', phrase:'家庭界線需要保護{need}', summary:'界線不是疏遠，而是讓你能持續{drive}', detail:'需要說清楚的是{need}；可運用{gift}協調', caution:'別讓{risk}取代明確溝通', keys:['boundaryNeed','boundaryAction'] },
  family_living: { family:'family', phrase:'適合能提供{need}的居住氛圍', summary:'環境穩定時較能發揮{gift}', detail:'居住條件是{need}；日常氣氛偏向{pace}', caution:'', keys:['livingCondition','homeAtmosphere'] },
  family_safety: { family:'family', phrase:'內在安全感來自重新取得{need}', summary:'能讓你{drive}的做法比一味壓抑更有效', detail:'安定條件是{need}；可練習{gift}', caution:'', keys:['safetyNeed','selfSupport'] },
  family_balance: { family:'family', phrase:'家庭與事業的平衡需要同時保留{need}與{drive}', summary:'關鍵是讓{gift}在兩個領域都能被合理使用', detail:'共同支點是{need}；分配原則是{pace}', caution:'留意{risk}', keys:['balanceAnchor','allocationRule'] },
  health_stress: { family: 'health', phrase: '壓力多半在無法{drive}時累積', summary: '當{need}長期不足，容易出現{risk}的反應', detail: '壓力來源是缺少{need}；反應節奏偏向{pace}', caution: '這是生活模式提醒，不是醫療診斷', keys: ['stressSource', 'stressResponse'] },
  health_lifestyle: { family: 'health', phrase: '適合能維持{need}、節奏{pace}的生活安排', summary: '保留{drive}的空間有助於維持穩定感', detail: '日常需要{need}；安排方式宜{pace}', caution: '持續不適仍應尋求合格醫療專業協助', keys: ['lifestyleCondition', 'dailyPace'] },
  health_boundary: { family: 'health', phrase: '較容易忽略的界線是{risk}', summary: '你可能為了維持{need}而延後回應自己的負荷', detail: '界線警訊是{risk}；可用{gift}重新安排負荷', caution: '不以星盤取代醫療判斷', keys: ['boundarySignal', 'loadManagement'] },
  health_emotion: { family: 'health', phrase: '情緒在缺少{need}時較容易累積', summary: '若長期不能{drive}，壓力可能透過日常狀態被感覺到', detail: '情緒需求是{need}；失衡模式是{risk}', caution: '不推論疾病或特定身體部位', keys: ['emotionNeed', 'accumulationPattern'] },
  health_selfcare: { family: 'health', phrase: '恢復能量的關鍵是重新取得{need}', summary: '能讓你{drive}的活動較有恢復效果', detail: '可運用{gift}照顧自己；恢復節奏宜{pace}', caution: '', keys: ['recoveryMethod', 'selfCareResource'] },
  health_rest: { family: 'health', phrase: '休息需要保留{need}，並順著{pace}的節奏切換', summary: '真正的休息是暫時卸下{risk}帶來的耗損', detail: '有效休息條件是{need}；切換方式宜{pace}', caution: '', keys: ['restCondition', 'recoveryRhythm'] },
  health_recovery: { family: 'health', phrase: '最有恢復效果的方式，是重新取得{need}並採用{pace}的節奏', summary: '能讓你重新{drive}、而不是繼續承受刺激的活動，才算真正休息', detail: '有效恢復方式是運用{gift}；休息節奏宜{pace}', caution: '', keys: ['recoveryActivity', 'recoveryRhythm'] },
  health_energy_drain: { family: 'health', phrase: '當日常長期缺少{need}，又必須面對{risk}時最容易耗能', summary: '消耗來源通常不是單一事件，而是環境持續阻礙你{drive}', detail: '高耗能情境是長期缺少{need}；需要降低的負荷是{risk}', caution: '若疲憊或不適持續，仍應尋求合格醫療專業協助', keys: ['drainContext', 'loadToReduce'] },
  wealth_earning: { family: 'wealth', phrase: '收入較適合建立在{gift}與{drive}之上', summary: '市場價值來自你能穩定提供{gift}', detail: '核心收入能力是{gift}；累積方式偏向{pace}', caution: '避免因{risk}讓收入結構失去穩定', keys: ['earningMechanism', 'valueCreation'] },
  wealth_behavior: { family: 'wealth', phrase: '金錢決策傾向以{need}為優先', summary: '消費與儲蓄會反映你如何追求{need}', detail: '花費動機常圍繞{need}；決策節奏偏向{pace}', caution: '預算需特別防範{risk}', keys: ['spendingMotive', 'savingPattern'] },
  wealth_risk: { family: 'wealth', phrase: '面對財務風險時，傾向以{pace}的方式判斷', summary: '是否感到{need}會影響承擔風險的意願', detail: '風險判斷重視{need}；優勢是{gift}', caution: '重大決策仍需依現實資料與專業意見', keys: ['riskStyle', 'decisionCondition'] },
  wealth_resources: { family: 'wealth', phrase: '資源運用適合以{gift}為核心，再建立支持{need}的合作方式', summary: '個人與合作的比例要能讓你持續{drive}', detail: '個人籌碼是{gift}；合作條件是{need}', caution: '合作前需用明確權責降低{risk}', keys: ['personalLeverage', 'sharedResource'] },
  wealth_challenge: { family: 'wealth', phrase: '財務上較容易因{risk}而偏離計畫', summary: '這通常發生在急著取得{need}時', detail: '常見盲點是{risk}；修正資源是{gift}', caution: '先寫清楚預算與退出條件', keys: ['financialBlindspot', 'guardrail'] },
  social_impression: { family: 'social', phrase: '第一印象多半是{social}，整體節奏{pace}', summary: '別人會先感受到你在{drive}上的態度', detail: '外顯印象是{social}；互動速度偏向{pace}', caution: '', keys: ['firstImpression', 'socialPace'] },
  social_communication: { family: 'social', phrase: '溝通時擅長運用{gift}，表達節奏{pace}', summary: '你希望對話能支持{drive}', detail: '表達優勢是{gift}；交流條件是{need}', caution: '壓力下留意{risk}', keys: ['communicationGift', 'dialogueNeed'] },
  social_group: { family: 'social', phrase: '團隊裡容易以{gift}承擔關鍵功能', summary: '你會自然透過{drive}影響群體', detail: '團隊貢獻是{gift}；常呈現{social}', caution: '別讓{risk}破壞分工', keys: ['groupFunction', 'teamContribution'] },
  social_attraction: { family: 'social', phrase: '容易吸引重視{need}、欣賞你{social}的人', summary: '這類朋友會回應你想要{drive}的傾向', detail: '朋友重視{need}；互動特點是{social}', caution: '', keys: ['friendTrait', 'friendshipDynamic'] },
  social_strength: { family: 'social', phrase: '人際優勢是{gift}，能讓人感到{social}', summary: '這項能力有助於你{drive}', detail: '可持續發揮{gift}；他人感受到{social}', caution: '', keys: ['socialGift', 'relationalImpact'] },
  social_boundary: { family: 'social', phrase: '人際衝突較容易由{risk}引發', summary: '通常是{need}沒有被說清楚時出現', detail: '觸發點是缺少{need}；常見反應是{risk}', caution: '先明確說出界線，再處理立場', keys: ['boundaryTrigger', 'conflictResponse'] },
  social_circle: { family: 'social', phrase: '適合重視{need}、並容許你{drive}的人際圈', summary: '這種圈子能讓{gift}成為穩定貢獻', detail: '圈層價值是{need}；你能提供{gift}', caution: '', keys: ['circleValue', 'belongingCondition'] },
  study_learning: { family: 'study', phrase: '學習時適合運用{gift}，並採取{pace}的節奏', summary: '能讓你{drive}的方式最容易維持投入', detail: '有效方法是{gift}；學習節奏偏向{pace}', caution: '', keys: ['learningMethod', 'learningPace'] },
  study_memory: { family: 'study', phrase: '較容易透過{gift}建立理解與記憶', summary: '內容能連回{need}時，知識較容易留下', detail: '記憶線索是{gift}；理解條件是{need}', caution: '', keys: ['memoryCue', 'understandingCondition'] },
  study_block: { family: 'study', phrase: '學習卡住時常與{risk}有關', summary: '表面是拖延，底層可能是{need}沒有被滿足', detail: '觸發點是{risk}；可借助{gift}重新啟動', caution: '把任務縮小成能立即開始的下一步', keys: ['procrastinationTrigger', 'restartMethod'] },
  study_mode: { family: 'study', phrase: '適合能保有{need}、並發揮{gift}的學習模式', summary: '環境能支持你{drive}時，效率較穩定', detail: '需要的模式是{need}；可運用{gift}', caution: '', keys: ['studyFormat', 'environmentNeed'] },
  study_overseas: { family: 'study', phrase: '跨域或海外學習需要能支持{drive}與{need}', summary: '真正價值在於擴大{gift}的使用範圍', detail: '適合拓展{gift}；選擇條件是{need}', caution: '仍需評估語言、預算、資格與生活安排', keys: ['expansionValue', 'selectionCondition'] },
  study_rhythm: { family: 'study', phrase: '讀書節奏適合{pace}，並固定保留{need}', summary: '這能降低{risk}造成的中斷', detail: '有效節奏是{pace}；維持條件是{need}', caution: '', keys: ['studyRhythm', 'consistencyCondition'] },
  study_balance: { family: 'study', phrase: '思考優勢是{gift}，但也要留意{risk}', summary: '同一項能力失衡時可能從優勢變成阻力', detail: '可發揮{gift}；盲點是{risk}', caution: '用回饋與可驗證成果校正判斷', keys: ['thinkingStrength', 'learningBlindspot'] },
  study_mastery: { family: 'study', phrase: '最適合用能展現{gift}的成果證明自己學會了', summary: '真正掌握的標準，是能獨立運用知識去{drive}', detail: '成果形式可展現{gift}；判斷標準是能獨立{drive}', caution: '不要只用閱讀時間或熟悉感代替實際驗證', keys: ['masteryOutput', 'masteryCriterion'] },
  study_application: { family: 'study', phrase: '把知識用出來，需要把{gift}轉成能實際{drive}的行動或作品', summary: '適合的練習不是重複輸入，而是用{pace}的方式產出並接受回饋', detail: '應用方式是運用{gift}解決實際問題；輸出形式宜{pace}', caution: '避免因{risk}而一直準備、卻沒有實際產出', keys: ['applicationMethod', 'outputFormat'] },
  general_theme: { family: 'general', phrase: '人生主題圍繞著{drive}', summary: '你會反覆透過{gift}回應對{need}的追求', detail: '核心動力是{drive}；主要資源是{gift}', caution: '', keys: ['lifeTheme', 'coreDrive'] },
  general_strength: { family: 'general', phrase: '最值得持續發揮的核心能力是{gift}', summary: '它能協助你{drive}', detail: '優勢表現在{gift}；成熟方向是{drive}', caution: '', keys: ['coreStrength', 'matureUse'] },
  general_challenge: { family: 'general', phrase: '反覆出現的課題常與{risk}有關', summary: '這通常是追求{need}時產生的失衡版本', detail: '觸發條件是缺少{need}；重複模式是{risk}', caution: '先辨認模式，再選擇不同回應', keys: ['recurringIssue', 'trigger'] },
  general_direction: { family: 'general', phrase: '現階段值得優先累積{gift}，用來支持你{drive}', summary: '方向是否合適，可看它能否穩定提供{need}', detail: '優先資產是{gift}；判斷條件是{need}', caution: '不要只因短期焦慮頻繁更換主軸', keys: ['priorityAsset', 'directionTest'] },
  general_energy: { family: 'general', phrase: '命盤中較突出的能量是{drive}，外在呈現為{social}', summary: '它會讓{gift}成為容易被看見的特點', detail: '突出動力是{drive}；外顯特徵是{social}', caution: '', keys: ['standoutDrive', 'visibleTrait'] },
  general_tension: { family: 'general', phrase: '內在拉扯常發生在{need}與{risk}之間', summary: '一邊想要{drive}，一邊又擔心失去平衡', detail: '需要整合{need}；失衡反應是{risk}', caution: '重點是建立可切換的使用情境', keys: ['innerNeed', 'tensionPattern'] },
  general_decision: { family: 'general', phrase: '重大選擇時，最可靠的原則是確認它能否長期支持{need}', summary: '適合的方向不只讓你短暫興奮，也會讓你有空間持續{drive}', detail: '判斷原則是是否支持{need}；適合的訊號是能穩定運用{gift}', caution: '別讓{risk}成為唯一的決策理由', keys: ['decisionPrinciple', 'fitSignal'] },
};

function astroKnowledgeFillSemantic(template, planet) {
  return String(template || '').replace(/\{(drive|gift|need|risk|pace|social)\}/g, function (_, key) { return planet[key] || ''; });
}
function buildComposableKnowledgeEntry(planetKey, topicKey) {
  var p = ASTRO_PLANET_SEMANTIC_DATASET[planetKey], t = ASTRO_TOPIC_SEMANTIC_DATASET[topicKey];
  if (!p || !t) return null;
  var caution = astroKnowledgeFillSemantic(t.caution, p);
  return {
    meanings: {
      headline: [astroKnowledgeFillSemantic(t.phrase, p) + '。'],
      summary: [astroKnowledgeFillSemantic(t.summary, p) + '。'],
      details: astroKnowledgeFillSemantic(t.detail, p).split('；').filter(Boolean),
      caution: caution ? [caution + '。'] : [],
    },
    keywords: t.keys.concat([p.gift, p.need]), strengths: [p.gift], risks: [p.risk],
    semantic: { schemaVersion: ASTRO_KNOWLEDGE_SCHEMA_VERSION, planet: planetKey, topic: topicKey, family: t.family, conceptKeys: t.keys.slice() },
  };
}
(function installComposableAstrologyDataset() {
  if (typeof PLANET_TOPIC_KNOWLEDGE === 'undefined') return;
  Object.keys(ASTRO_PLANET_SEMANTIC_DATASET).forEach(function (planetKey) {
    if (!PLANET_TOPIC_KNOWLEDGE[planetKey]) PLANET_TOPIC_KNOWLEDGE[planetKey] = {};
    Object.keys(ASTRO_TOPIC_SEMANTIC_DATASET).forEach(function (topicKey) {
      if (!PLANET_TOPIC_KNOWLEDGE[planetKey][topicKey]) PLANET_TOPIC_KNOWLEDGE[planetKey][topicKey] = buildComposableKnowledgeEntry(planetKey, topicKey);
    });
  });
})();
