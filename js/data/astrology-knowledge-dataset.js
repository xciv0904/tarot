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
  Saturn:  { drive: '建立結構、責任與可長期維持的成果', gift: '紀律、規劃與承受長期壓力', need: '清楚的底線、可靠的制度與可預期的進度', risk: '過度保守、自我要求或害怕犯錯', pace: '審慎而穩定', social: '以可靠與負責建立信任' },
  Uranus:  { drive: '打破慣性並創造更自由的新做法', gift: '創新、獨立判斷與系統改革', need: '自主、差異性與不被僵化規則限制', risk: '突然抽離或為反對而反對', pace: '跳躍而非線性', social: '以獨特觀點吸引同好' },
  Neptune: { drive: '先感受氣氛，再用創作或同理回應', gift: '觀察細微情緒，並把感受轉成文字或作品', need: '安靜思考、保留想像空間，也獲得情感回應', risk: '把猜測當成事實，或替別人承擔過多情緒', pace: '先觀察氣氛，再慢慢整理成話', social: '先聽懂對方的感受，再用溫和方式回應' },
  Pluto:   { drive: '深入核心並完成根本性的轉化', gift: '洞察、危機處理與資源整合', need: '深度、真實與足夠的掌控感', risk: '過度控制、猜疑或長期處於高張力', pace: '集中而強烈', social: '以深度與強烈存在感建立連結' },
};

/* V6：主題分析先累積「可比較的語義維度」，再由分數組成正文。
   這些資料不是可直接輸出的完整解讀；planet 只提供它會推高哪些維度，
   dimension 則提供可觀察行為、觸發條件、過度使用與可執行修正。 */
var ASTRO_TOPIC_SEMANTIC_VERSION = '7.0.0';
var ASTRO_PLANET_DIMENSION_WEIGHTS = {
  Sun:     { visibility:1.00, selfDirection:.85 },
  Moon:    { emotionalResponse:1.00, practicalCare:.70 },
  Mercury: { dialogue:.95, novelty:.45 },
  Venus:   { harmony:.95, consistency:.45 },
  Mars:    { selfDirection:1.00, intensity:.55 },
  Jupiter: { novelty:.85, visibility:.45 },
  Saturn:  { structure:1.00, consistency:.90 },
  Uranus:  { freedom:1.00, novelty:.90 },
  Neptune: { emotionalResponse:.80, harmony:.55 },
  Pluto:   { depthTrust:1.00, intensity:.90 },
};
/* 角度沒有 planetKey，必須由實際星座提供語義；否則上升雖是最高權重，
   在第一印象／人際題卻完全無法進入中間判斷。索引 0 = 牡羊…11 = 雙魚。 */
var ASTRO_SIGN_DIMENSION_WEIGHTS = [
  { selfDirection:1.00, intensity:.55 },
  { consistency:1.00, practicalCare:.55 },
  { dialogue:1.00, novelty:.65 },
  { emotionalResponse:1.00, practicalCare:.70 },
  { visibility:1.00, selfDirection:.55 },
  { structure:.75, practicalCare:.70 },
  { harmony:1.00, dialogue:.55 },
  { depthTrust:1.00, intensity:.75 },
  { novelty:1.00, freedom:.60 },
  { structure:1.00, consistency:.75 },
  { freedom:1.00, novelty:.75 },
  { emotionalResponse:.85, harmony:.70 },
];
var ASTRO_TOPIC_DIMENSIONS = {
  visibility: {
    label:'被看見與主動表態',
    behavior:'會先表明立場，也願意在眾人面前承擔結果',
    strength:'把方向說清楚，讓其他人知道現在由誰做決定',
    impact:'其他人更快知道方向，也更清楚該由誰承擔下一步',
    socialEffect:'別人容易覺得你有主見，也願意為決定負責',
    trigger:'成果無人負責或自己的投入沒有被看見時',
    overuse:'把不同意見理解成對能力的否定',
    cost:'容易為了證明自己而接下過多責任',
    action:'先說明這次要負責的範圍，不替整件事全部收尾',
  },
  emotionalResponse: {
    label:'情緒回應與安全感',
    behavior:'會先讀取對方的情緒，再決定自己要靠近還是退開',
    strength:'察覺沒有說出口的感受，並用陪伴或照顧回應',
    impact:'對方比較容易感到被理解，關係也能更快恢復安全感',
    socialEffect:'別人容易覺得你會察言觀色，不會忽略現場情緒',
    trigger:'回覆忽冷忽熱、熟悉節奏突然改變時',
    overuse:'把對方的情緒全部接到自己身上',
    cost:'還沒確認責任，就先忙著安撫或補位',
    action:'先問「你現在要我聽，還是一起想辦法？」再投入',
  },
  dialogue: {
    label:'資訊交換與說清楚',
    behavior:'會用提問、比較資訊和來回討論確認彼此是否理解一致',
    strength:'把複雜資訊拆開，找出真正需要確認的問題',
    impact:'資訊落差更早被發現，討論也比較容易形成下一步',
    socialEffect:'別人容易覺得你反應快、願意把問題談清楚',
    trigger:'資訊不完整、說法前後不一致時',
    overuse:'持續追問和分析，卻延後表明自己的決定',
    cost:'對話變長，但真正要處理的選擇沒有前進',
    action:'把問題縮成一個能直接回答的句子，取得答案後就決定下一步',
  },
  harmony: {
    label:'公平協調與相處品質',
    behavior:'會先找雙方都能接受的做法，並留意互動是否公平、得體',
    strength:'在不同需求之間協調出可合作的方案',
    impact:'分歧轉成可討論的選項，而不是停在彼此不滿',
    socialEffect:'別人容易覺得你好相處，也很在意互動是否公平',
    trigger:'氣氛緊張、有人可能失望或關係失去對等時',
    overuse:'先維持表面順利，把真正不同意的地方留到最後',
    cost:'短期沒有衝突，長期卻累積委屈和模糊期待',
    action:'在仍能平靜討論時，說出一項不同意與一個可接受方案',
  },
  structure: {
    label:'責任分工與可預期性',
    behavior:'會先確認規則、期限和誰負責哪一段，再放心投入',
    strength:'把承諾變成能追蹤的分工與進度',
    impact:'責任與進度變得可追蹤，臨時補救與責任爭議也隨之減少',
    socialEffect:'別人容易覺得你可靠、做事有標準，但不會立刻放鬆',
    trigger:'責任不清、標準反覆改變或他人沒有按約定交付時',
    overuse:'增加規則與檢查，甚至把別人的部分也接過來',
    cost:'事情暫時穩住，自己卻成為所有流程的瓶頸',
    action:'只確認負責人、期限與完成標準，不直接替原負責人補做',
  },
  consistency: {
    label:'持續投入與兌現承諾',
    behavior:'會觀察一個人是否長期說到做到，而不是只看當下熱度',
    strength:'在熱情退去後仍維持可靠的投入',
    impact:'關係或合作不只依靠一時熱度，長期承諾也更可信',
    socialEffect:'別人容易覺得你慢熱，但答應的事通常會持續做到',
    trigger:'承諾與實際行動出現落差時',
    overuse:'因一次失誤就提前判定整段合作不可靠',
    cost:'保護了自己，也可能錯過仍可修正的關係',
    action:'先指出一次具體落差並約定修正期限，再決定是否退出',
  },
  freedom: {
    label:'自主空間與非典型做法',
    behavior:'會保留自己的時間與方法，不喜歡每一步都被規定',
    strength:'看見舊規則卡住人的地方，提出不同做法',
    impact:'原本僵住的流程多出新選項，個人也能保留調整空間',
    socialEffect:'別人容易覺得你有自己的做法，不會盲目跟隨既定規則',
    trigger:'被要求照固定方式行動、沒有調整空間時',
    overuse:'尚未說明需要就突然降低聯絡或抽離',
    cost:'自己得到空間，別人卻只感到關係無預警中斷',
    action:'先說明需要多少空間、何時恢復聯絡，再暫停互動',
  },
  novelty: {
    label:'新鮮感與擴大選項',
    behavior:'會主動接觸新題目、新圈子或不同做法，從變化中找到動力',
    strength:'快速看見原本方案之外的新可能',
    impact:'卡住的事情多出新的切入點，也較不容易困在單一答案',
    socialEffect:'別人容易覺得你好奇、願意嘗試，也能帶來新點子',
    trigger:'流程長期重複、看不到學習或擴展空間時',
    overuse:'同時打開太多選項，尚未驗證就轉向下一個',
    cost:'開始很多，能累積成成果的卻很少',
    action:'新選項先做一次小規模測試，完成後才增加投入',
  },
  depthTrust: {
    label:'深度信任與核心真相',
    behavior:'會追問表面說法背後的動機，重要事情不接受含糊帶過',
    strength:'在複雜或敏感情境中找出真正影響結果的核心',
    impact:'表面爭論回到真正問題，重要風險也較不容易被忽略',
    socialEffect:'別人容易覺得你觀察很深，不會輕易接受含糊說法',
    trigger:'察覺隱瞞、權力不對等或資源分配不透明時',
    overuse:'在證據不足時持續試探、查證或掌控細節',
    cost:'想確認安全，反而讓互信更難建立',
    action:'列出已知事實與仍需確認的一題，只針對那一題要求回答',
  },
  intensity: {
    label:'集中投入與突破阻力',
    behavior:'一旦認定重要，就會迅速集中資源把問題推到底',
    strength:'在壓力高、別人想避開時仍能採取行動',
    impact:'危機不會一直被擱置，最急迫的問題能先得到處理',
    socialEffect:'別人容易覺得你投入度高，遇到壓力也不會立刻退開',
    trigger:'期限逼近、局勢失控或重要成果受到威脅時',
    overuse:'把每件事都提高到必須立刻解決的強度',
    cost:'短期推進很快，長期容易耗盡自己與合作關係',
    action:'先標記只有今天必須處理的一件事，其餘排入明確日期',
  },
  selfDirection: {
    label:'自主決定與立即行動',
    behavior:'看到方向後傾向先動手，不等所有人完全同意',
    strength:'在停滯時率先做出可測試的第一步',
    impact:'事情不再停在討論，其他人很快就能看到實際結果',
    socialEffect:'別人容易覺得你果斷、有推進力，也可能覺得你的速度較快',
    trigger:'討論反覆、沒有人願意做決定時',
    overuse:'用自己的速度推進，沒有確認他人是否跟得上',
    cost:'事情開始了，後續合作卻因資訊落差而返工',
    action:'開始前先確認目標、負責人和下一個回報點',
  },
  practicalCare: {
    label:'日常照顧與生活配合',
    behavior:'會透過安排時間、處理生活細節或穩定陪伴表達在意',
    strength:'把抽象關心轉成對方實際感受得到的支持',
    impact:'需要幫助的人更快得到具體支援，日常混亂也較容易穩定',
    socialEffect:'別人容易覺得你細心可靠，會注意到實際需要',
    trigger:'身邊的人疲累、生病或日常秩序混亂時',
    overuse:'沒有先問就接手別人的生活責任',
    cost:'對方得到照顧，自己卻逐漸沒有休息空間',
    action:'只提供一項明確協助，其他部分先問對方是否需要',
  },
};

/* 同一個心理慣性進入健康或金錢題時，必須翻成該領域可觀察的行為。
   不能只把「感情裡」換成「處理金錢時」，正文卻仍在講關係衝突。 */
var ASTRO_HEALTH_BOUNDARY_DIMENSIONS = {
  visibility:{ risk:'為了維持表現而忽略疲累，直到不舒服變明顯才停下', cost:'身體只能用更強烈的訊號迫使你休息', action:'今天只保留一項必須完成的事，其餘重新排期' },
  emotionalResponse:{ risk:'先處理別人的情緒，延後吃飯、睡眠或自己的休息', cost:'外在氣氛暫時穩住，你的疲憊卻持續累積', action:'先完成一項基本照顧，再回覆別人的需要' },
  dialogue:{ risk:'反覆想問題、查資料或重播對話，讓腦袋一直停不下來', cost:'休息時間被思考占滿，睡眠與專注一起下降', action:'把未解問題寫下來，設定明天再處理的時間' },
  harmony:{ risk:'怕影響別人而不說自己累了，繼續配合原本安排', cost:'別人以為你沒問題，你卻在事後突然耗盡', action:'一感到疲累就說明需要縮短、延期或取消哪項安排' },
  structure:{ risk:'把休息也排成必須達標的任務，沒做到就責怪自己', cost:'表面上停止工作，身體仍維持在緊繃狀態', action:'安排一段不計步數、不計效率也不檢查成果的休息' },
  consistency:{ risk:'即使狀態變差，仍照原計畫硬撐，不願中途調整', cost:'小疲勞被拖成需要更久才能恢復的消耗', action:'先刪除今天最不重要的一項固定安排' },
  freedom:{ risk:'一感到受限就打亂作息、停掉原本有效的照顧方式', cost:'短暫得到自由，身體節奏卻更難穩定', action:'保留一個固定睡眠或用餐底線，其餘再彈性調整' },
  novelty:{ risk:'把行程與新計畫排得太滿，犧牲睡眠和恢復時間', cost:'生活很有變化，注意力與體力卻持續透支', action:'新增活動前，先取消一項同週的非必要安排' },
  depthTrust:{ risk:'長時間保持警戒，反覆檢查身體或問題是否惡化', cost:'真正需要的放鬆被更多監控與擔心取代', action:'記錄一次具體症狀與時間，停止重複查找相同資訊' },
  intensity:{ risk:'用高強度把事情撐完，等全部結束才允許自己休息', cost:'短期完成很多，恢復時間卻被拉得更長', action:'設定明確停止時間，到了就結束而不是再多做一輪' },
  selfDirection:{ risk:'急著把事情處理完，沒有停下確認身體是否已經過度緊繃', cost:'進度向前，疼痛、失眠或煩躁卻被留到最後', action:'開始下一項任務前，先用一分鐘確認呼吸、疲勞與疼痛' },
  practicalCare:{ risk:'先照顧別人的日常，把自己的吃飯、睡眠與就醫往後排', cost:'別人得到支援，你卻沒有留下恢復空間', action:'先完成自己的基本照顧，再決定還能提供哪一項協助' },
};
var ASTRO_WEALTH_BLINDSPOT_DIMENSIONS = {
  visibility:{ risk:'為了證明能力、維持體面或讓成果被看見而超出預算', cost:'支出換來短期認可，後續現金壓力卻由自己承擔', action:'購買前先寫下這筆錢解決的實際需要，不把面子算進理由', saving:'收入進帳時先轉出固定比例，再安排形象或享受支出', riskCheck:'先確認最壞情況是否會影響房租、生活費與緊急預備金' },
  emotionalResponse:{ risk:'情緒不安時用消費安撫自己，或替別人承擔原本不屬於你的花費', cost:'當下比較安心，月底卻很難說清錢花到哪裡', action:'情緒升高時把購買延後二十四小時，再決定是否付款', saving:'設定一筆可自由使用的安慰預算，額度用完就停止', riskCheck:'先分清這是自己的需要，還是在替別人承擔責任' },
  dialogue:{ risk:'比較太多方案、反覆詢問意見，卻遲遲不設定預算上限', cost:'花很多時間研究，真正的財務選擇仍沒有完成', action:'先寫最高金額與三個必要條件，符合就停止比較', saving:'先自動轉入儲蓄，再用剩餘金額比較不同選項', riskCheck:'寫下金額上限、三個必要條件與停止比較的時間' },
  harmony:{ risk:'為了不讓人失望而請客、借錢或接受不合理的共同支出', cost:'表面維持和氣，自己的預算與不滿卻同時累積', action:'共同花費前先說出自己最多願意負擔的金額', saving:'把交際與共同支出獨立成一個有上限的預算類別', riskCheck:'付款前確認每個人負擔多少，以及未付款時由誰處理' },
  structure:{ risk:'把預算訂得過緊，只要一次超支就覺得整份計畫失敗', cost:'控制感短暫增加，之後反而容易放棄記帳或報復性消費', action:'預算保留一筆可自由使用的金額，不把每一元都鎖死', saving:'設定固定日期自動儲蓄，其餘金額再分配到日常支出', riskCheck:'確認一次超支後，是否仍能在下個週期回到原計畫' },
  consistency:{ risk:'因為已經承諾或付過一段時間，就繼續支出不再適合的項目', cost:'避免了立即改變，長期卻持續流失可用資金', action:'檢查一筆固定支出，若連續兩個月沒使用就取消', saving:'每月固定檢查訂閱、會費與自動扣款，把省下的錢轉入儲蓄', riskCheck:'不要只看已經付了多少，先確認未來繼續支付是否值得' },
  freedom:{ risk:'把預算視為限制，臨時想要時就先買再說', cost:'當下保有選擇自由，之後卻必須用未來收入補回缺口', action:'保留固定自由花費額度，超過額度就延到下個月', saving:'只設定最低儲蓄金額，其餘保留彈性使用', riskCheck:'確認這筆支出是否會占用下個月已經承諾的金額' },
  novelty:{ risk:'同時投入太多新興趣、新工具或還沒驗證的計畫', cost:'每筆金額看似不大，加總後卻擠壓真正重要的目標', action:'新支出先小額試用，完成一次成果後再追加', saving:'替新興趣設試用預算，沒有完成一次成果就不追加', riskCheck:'把所有小額新支出加總，再判斷是否仍在可承受範圍' },
  depthTrust:{ risk:'因為擔心被占便宜而反覆查證、控制共同資源或不願揭露真實預算', cost:'風險沒有因此消失，合作中的信任與效率反而下降', action:'只確認金額、權責與退出條件，不追查無法驗證的動機', saving:'先建立緊急預備金，再處理需要共同承擔的支出', riskCheck:'只核對金額、權責、資訊來源與退出條件四件事' },
  intensity:{ risk:'看見機會時一次投入過多，希望快速得到明顯結果', cost:'判斷若有誤，生活需要的資金也會一起被綁住', action:'第一次投入不超過可承受損失的固定比例', saving:'把大額目標拆成分期累積，不一次動用全部可用資金', riskCheck:'先寫出最多能損失多少，超過就不進行' },
  selfDirection:{ risk:'想立刻解決問題或抓住機會，還沒比較總成本就付款', cost:'決定速度很快，後續卻可能出現重複購買或額外費用', action:'付款前確認總價、使用頻率與是否已有替代品', saving:'收入先自動轉入儲蓄，臨時想買的東西隔天再決定', riskCheck:'確認總價、後續費用、使用頻率與現有替代品' },
  practicalCare:{ risk:'習慣替家人或朋友補上生活支出，沒有先確認責任歸屬', cost:'別人的問題暫時解決，你的儲蓄目標卻一再延後', action:'只提供事先說好的固定金額，不臨時追加', saving:'把支援他人的金額獨立設限，不從自己的儲蓄目標挪用', riskCheck:'確認這筆錢是贈與、借款還是共同責任，並寫下金額上限' },
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

/* V5.4：高風險題型的白話語意。這些問題不能只把 need／pace 等抽象欄位
   填進模板；使用者需要的是能辨認的個性、行為、選項與做法。 */
var ASTRO_PARTNER_PLAIN_DATASET = {
  Sun:{ personality:'自信、有主見，也願意明確表達喜歡與重視', interaction:'相處時會主動安排事情，遇到問題傾向直接說明立場', staying:'願意肯定你，也尊重你保有自己的決定' },
  Moon:{ personality:'情緒細膩、重視陪伴，也在意家庭感與日常照顧', interaction:'相處時會先確認彼此感受，並用實際陪伴回應需要', staying:'情緒有回應、說到做到，讓你感到關係是可靠的' },
  Mercury:{ personality:'好奇、健談、反應快，願意交換想法', interaction:'會透過聊天、分享資訊與一起學習拉近距離', staying:'遇到問題願意談清楚，而不是讓彼此猜測' },
  Venus:{ personality:'待人有禮、重視公平，也有自己的美感與生活品味', interaction:'重視相處氣氛，願意協調差異並照顧雙方感受', staying:'既能維持和諧，也敢誠實說出不同意的地方' },
  Mars:{ personality:'行動直接、有衝勁，喜歡清楚的目標與回應', interaction:'會主動推進關係，遇到問題傾向立即處理', staying:'有行動力，但不會把自己的速度強加在你身上' },
  Jupiter:{ personality:'樂觀大方、喜歡分享，也願意帶你接觸新事物', interaction:'常以旅行、學習或共同體驗讓關係保持成長', staying:'給彼此空間，也願意對長期承諾負責' },
  Saturn:{ personality:'成熟謹慎、責任感強，對承諾與時間很認真', interaction:'不一定快速熱絡，但會用穩定投入和實際安排表達在意', staying:'願意長期投入，又不會用規則或責任限制你' },
  Uranus:{ personality:'獨立、有自己的想法，不喜歡被傳統關係規則綁住', interaction:'需要各自保有空間，也喜歡一起嘗試不同生活方式', staying:'尊重差異與自由，同時能保持穩定聯絡' },
  Neptune:{ personality:'溫柔敏感、富有想像力，也容易感受他人情緒', interaction:'重視默契與情感共鳴，常以創作或細膩關心建立連結', staying:'有同理心，也能把承諾、底線與現實安排說清楚' },
  Pluto:{ personality:'感情深、觀察敏銳，不喜歡表面或敷衍的互動', interaction:'傾向深入談核心問題，對信任與忠誠要求較高', staying:'願意坦白真正介意的事，不用控制或試探維持安全感' },
};
var ASTRO_EMPLOYMENT_MODE_DATASET = {
  Sun:{ mode:'較適合有明確權責的受僱工作、管理職，或能主導方向的小型事業', autonomy:'需要能自行決定做法，並對成果有清楚的署名或責任', test:'若工作只要求服從、沒有決策空間，通常較難長期投入' },
  Moon:{ mode:'較適合穩定受僱，或與熟悉團隊長期合作', autonomy:'不必完全單打獨鬥，但需要可預期的同事、流程與支持系統', test:'團隊關係穩定、工作節奏可預測時，表現通常更持久' },
  Mercury:{ mode:'適合專案制、接案，或正職搭配副業的混合模式', autonomy:'需要彈性安排時間，並能接觸不同任務與資訊', test:'只要能保持變化又有明確截止點，就比單一重複工作合適' },
  Venus:{ mode:'適合受僱或合夥；尤其是需要客戶、品牌、設計或協調的工作', autonomy:'重要決定適合共同討論，但職責與分潤要事先說清楚', test:'合作品質良好時能加分，長期單打獨鬥反而容易消耗' },
  Mars:{ mode:'適合高自主的專案、業務、接案或創業型工作', autonomy:'需要能快速決定並立即執行，不適合層層等待批准', test:'若成果可直接反映行動與投入，通常更能保持動力' },
  Jupiter:{ mode:'適合自由工作、顧問、教學或具有擴張空間的事業', autonomy:'需要能選擇題目、拓展市場，並保留學習與移動空間', test:'能持續接觸新機會很好，但仍要有人管理預算與交付範圍' },
  Saturn:{ mode:'較適合制度清楚的穩定受僱、專業職，或經過長期準備後再創業', autonomy:'可以接受規範，但責任、升遷與評估標準必須明確', test:'先累積專業與資源通常比一開始就承擔全部創業風險更穩' },
  Uranus:{ mode:'較適合自由工作、科技新創、顧問或彈性遠距模式', autonomy:'需要高度自主，能改良流程並使用不同於傳統的方法', test:'自由度很重要，但仍需固定交付節點避免計畫突然中斷' },
  Neptune:{ mode:'適合創作、助人或專案型工作，但最好有可靠制度或合作夥伴', autonomy:'需要柔軟時間與靈感空間，同時必須有人確認範圍和期限', test:'完全僵化會消耗你，完全沒有結構也容易失去方向' },
  Pluto:{ mode:'適合專業受僱、顧問、研究或少數可信夥伴共同經營', autonomy:'需要掌握核心資訊並能深入處理問題，不適合過度公開干預', test:'比起同時做很多案子，集中經營少數高信任工作更合適' },
};
var ASTRO_FAMILY_ORIGIN_PLAIN_DATASET = {
  Sun:{ habit:'可能很早就習慣用表現、成就或承擔責任換取肯定', impact:'遇到家人需要時容易先證明自己有能力，再處理自己的感受', correction:'把「我值得被重視」和「我是否做得夠好」分開' },
  Moon:{ habit:'可能很早就習慣察覺家人情緒，並優先維持家的平靜', impact:'容易把照顧別人當成自己的責任，延後說出自己的需要', correction:'先說出自己的感受與需要，不必等所有人都安定才照顧自己' },
  Mercury:{ habit:'家庭可能習慣用講道理、解釋或轉移話題處理情緒', impact:'遇到衝突時容易分析很多，卻沒有直接說出真正介意的事', correction:'少猜測、多確認，把感受、事實與期待分開說明' },
  Venus:{ habit:'可能習慣維持和諧，避免讓家人失望或正面衝突', impact:'容易先配合，再在事後感到委屈或不平衡', correction:'在關係仍平靜時就說出不同意，不用靠忍耐換取和諧' },
  Mars:{ habit:'家庭互動可能較直接、急促，或常需要立刻處理問題', impact:'遇到壓力時容易搶先行動、防衛或提高語氣', correction:'先讓情緒降溫，再談責任與下一步，不必每次都立刻分勝負' },
  Jupiter:{ habit:'家庭可能重視樂觀、成長或更大的目標，較少停留在細節', impact:'容易把問題說得很有希望，卻低估時間、資源或他人感受', correction:'保留願景，但把承諾縮小成真正做得到的範圍' },
  Saturn:{ habit:'可能很早就被期待懂事、守規則或承擔超齡責任', impact:'容易把休息視為不夠努力，也不習慣向家人求助', correction:'重新分配責任，允許自己在做不到時說明限制' },
  Uranus:{ habit:'家庭節奏可能不穩定，或強調每個人自己處理自己的事', impact:'遇到壓力時容易抽離，以保持距離代替說清楚', correction:'保留空間，但約定何時回來談，不讓沉默變成斷線' },
  Neptune:{ habit:'家人之間的分寸可能不太清楚，常靠默契、犧牲或猜測理解彼此', impact:'容易吸收家人的情緒，卻不確定哪些責任真正屬於自己', correction:'用具體事實、時間與責任範圍取代「你應該懂我」' },
  Pluto:{ habit:'家庭中可能有不容易明說的壓力、控制或高度敏感議題', impact:'容易先觀察與防備，確認安全後才願意坦白', correction:'逐步說出真正介意的核心，不用試探、控制或沉默換取安全' },
};
var ASTRO_INNER_SAFETY_PLAIN_DATASET = {
  Sun:{ action:'每天完成一件由自己決定的小目標，重新確認生活有主導權', routine:'固定記錄已完成的事，而不是只檢查還不夠好的地方' },
  Moon:{ action:'在情緒升高時先回到熟悉、安靜且不必照顧別人的空間', routine:'維持規律吃飯與睡眠，並找可信任的人明確說出感受' },
  Mercury:{ action:'把腦中擔心寫成具體問題，逐項確認哪些是事實、哪些是猜測', routine:'每天保留一段無訊息干擾的整理時間，清空未完成事項' },
  Venus:{ action:'整理出舒服的環境，並與願意尊重你底線的人保持穩定聯絡', routine:'練習在小事上說出喜歡與不喜歡，不再一律配合' },
  Mars:{ action:'先用走路、運動或具體行動釋放緊繃，再處理引發壓力的問題', routine:'把焦慮拆成一個可以立刻完成的小步驟' },
  Jupiter:{ action:'暫時離開卡住的情境，透過學習、戶外活動或可信任的人重新取得視野', routine:'縮小承諾數量，避免靠安排更多事情逃開不安' },
  Saturn:{ action:'把責任、期限與可做到的範圍寫清楚，讓事情重新可預測', routine:'建立固定作息，也安排不需要證明效率的休息時間' },
  Uranus:{ action:'先保留短暫獨處與調整空間，再約定明確時間回來處理問題', routine:'固定少數生活底線，其餘保留彈性，避免被過密行程困住' },
  Neptune:{ action:'降低聲音與資訊刺激，用音樂、創作或安靜散步讓注意力沉澱', routine:'休息後做一件具體小事，確認自己已回到現實節奏' },
  Pluto:{ action:'找出真正最在意的一件事，私下寫清楚害怕失去什麼', routine:'選擇可信任的人逐步談核心問題，不必一次全部揭露' },
};
var ASTRO_TENSION_PLAIN_DATASET = {
  Sun:{ side:'被肯定並掌握方向', action:'先確認自己真正要達成的目標' },
  Moon:{ side:'被理解並維持情感安全', action:'再確認情緒與關係是否得到照顧' },
  Mercury:{ side:'保留思考、交流與變動空間', action:'把選項與疑問寫清楚再決定' },
  Venus:{ side:'維持和諧與雙方都能接受的關係', action:'說出偏好，也讓對方表達不同意見' },
  Mars:{ side:'立刻行動並突破阻礙', action:'把衝動縮小成可逆的小步驟先測試' },
  Jupiter:{ side:'擴大可能性並追求更長遠的成長', action:'先保留願景，再核對時間與資源' },
  Saturn:{ side:'確保責任、秩序與結果可控制', action:'設定底線與期限，不要求一次做到完美' },
  Uranus:{ side:'保有自由並嘗試不同做法', action:'保留創新空間，同時約定最低交付標準' },
  Neptune:{ side:'跟隨直覺、理想與情感共鳴', action:'先承認感受，再用事實檢查可行性' },
  Pluto:{ side:'深入核心並掌握真正的風險', action:'處理最關鍵問題，不用控制所有細節' },
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
  career_challenge: { family: 'career', phrase: '職涯較容易因{risk}而停滯', summary: '原本想要{need}，壓力下卻可能限制了{drive}', detail: '卡點常是{risk}；可用{gift}把問題拆成下一個可交付步驟', caution: '寫下下一個交付物、負責人與期限，完成後再評估方向', keys: ['careerBlock', 'correction'] },
  career_strength: { family:'career', phrase:'核心職場競爭力是{gift}', summary:'別人會在需要{drive}時倚賴這項能力', detail:'最拿手的是{gift}；穩定表現需要{need}', caution:'留意{risk}', keys:['workplaceStrength','trustedContribution'] },
  family_role: { family:'family', phrase:'家庭中較常扮演{social}的角色', summary:'你會透過{gift}維持家庭運作', detail:'主要角色是{social}；實際貢獻是{gift}', caution:'', keys:['familyRole','familyContribution'] },
  family_origin: { family:'family', phrase:'原生家庭可能讓你特別在意{need}', summary:'過去經驗會影響你如何{drive}', detail:'留下的影響是重視{need}；可保留的資源是{gift}', caution:'留意不要讓{risk}成為唯一反應', keys:['originInfluence','retainedResource'] },
  family_boundary: { family:'family', phrase:'和家人之間的底線需要保護{need}', summary:'劃出底線不是疏遠，而是讓你能持續{drive}', detail:'需要說清楚的是{need}；可運用{gift}協調', caution:'別讓{risk}取代明確溝通', keys:['boundaryNeed','boundaryAction'] },
  family_living: { family:'family', phrase:'適合能提供{need}的居住氛圍', summary:'環境穩定時較能發揮{gift}', detail:'居住條件是{need}；日常氣氛偏向{pace}', caution:'', keys:['livingCondition','homeAtmosphere'] },
  family_safety: { family:'family', phrase:'內在安全感來自重新取得{need}', summary:'能讓你{drive}的做法比一味壓抑更有效', detail:'安定條件是{need}；可練習{gift}', caution:'', keys:['safetyNeed','selfSupport'] },
  family_balance: { family:'family', phrase:'家庭與事業的平衡需要同時保留{need}與{drive}', summary:'關鍵是讓{gift}在兩個領域都能被合理使用', detail:'共同支點是{need}；分配原則是{pace}', caution:'留意{risk}', keys:['balanceAnchor','allocationRule'] },
  health_stress: { family: 'health', phrase: '壓力多半在無法{drive}時累積', summary: '當{need}長期不足，容易出現{risk}的反應', detail: '壓力來源是缺少{need}；反應節奏偏向{pace}', caution: '這是生活模式提醒，不是醫療診斷', keys: ['stressSource', 'stressResponse'] },
  health_lifestyle: { family: 'health', phrase: '適合能維持{need}、節奏{pace}的生活安排', summary: '保留{drive}的空間有助於維持穩定感', detail: '日常需要{need}；安排方式宜{pace}', caution: '持續不適仍應尋求合格醫療專業協助', keys: ['lifestyleCondition', 'dailyPace'] },
  health_boundary: { family: 'health', phrase: '較容易忽略的底線是{risk}', summary: '你可能為了維持{need}而延後回應自己的負荷', detail: '底線被跨過的警訊是{risk}；可用{gift}重新安排負荷', caution: '不以星盤取代醫療判斷', keys: ['boundarySignal', 'loadManagement'] },
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
  financial_structure: { family:'wealth', phrase:'財務結構應先用{gift}建立可持續的收入，再固定保留儲蓄與預備金', summary:'長期穩定來自每月可重複的分配規則，不是單次省下一筆錢', detail:'收入基礎是{gift}；每月先固定儲蓄，再安排生活與彈性支出', caution:'若{risk}讓預算反覆失守，就縮小單筆支出上限並每週核對一次', keys:['incomeBase','savingRule','reviewCycle'] },
  social_impression: { family: 'social', phrase: '第一印象多半是{social}，整體節奏{pace}', summary: '別人會先感受到你在{drive}上的態度', detail: '外顯印象是{social}；互動速度偏向{pace}', caution: '', keys: ['firstImpression', 'socialPace'] },
  social_communication: { family: 'social', phrase: '溝通時擅長運用{gift}，表達節奏{pace}', summary: '你希望對話能支持{drive}', detail: '表達優勢是{gift}；交流條件是{need}', caution: '壓力下留意{risk}', keys: ['communicationGift', 'dialogueNeed'] },
  social_group: { family: 'social', phrase: '團隊裡容易以{gift}承擔關鍵功能', summary: '你會自然透過{drive}影響群體', detail: '團隊貢獻是{gift}；常呈現{social}', caution: '別讓{risk}破壞分工', keys: ['groupFunction', 'teamContribution'] },
  social_attraction: { family: 'social', phrase: '容易吸引重視{need}、欣賞你{social}的人', summary: '這類朋友會回應你想要{drive}的傾向', detail: '朋友重視{need}；互動特點是{social}', caution: '', keys: ['friendTrait', 'friendshipDynamic'] },
  social_strength: { family: 'social', phrase: '人際優勢是{gift}，能讓人感到{social}', summary: '這項能力有助於你{drive}', detail: '可持續發揮{gift}；他人感受到{social}', caution: '', keys: ['socialGift', 'relationalImpact'] },
  social_boundary: { family: 'social', phrase: '人際衝突較容易由{risk}引發', summary: '通常是{need}沒有被說清楚時出現', detail: '觸發點是缺少{need}；常見反應是{risk}', caution: '先明確說出自己的底線，再處理立場', keys: ['boundaryTrigger', 'conflictResponse'] },
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
  general_theme: { family: 'general', phrase: '你的人生經常要求你{drive}', summary: '遇到重要問題時，你多半會運用{gift}', detail: '反覆出現的行動是{drive}；最常派上用場的能力是{gift}', caution: '', keys: ['lifeTheme', 'coreDrive'] },
  general_strength: { family: 'general', phrase: '最值得持續發揮的核心能力是{gift}', summary: '它能協助你{drive}', detail: '優勢表現在{gift}；成熟方向是{drive}', caution: '', keys: ['coreStrength', 'matureUse'] },
  general_challenge: { family: 'general', phrase: '反覆出現的課題常與{risk}有關', summary: '這通常是追求{need}時產生的失衡版本', detail: '觸發條件是缺少{need}；重複模式是{risk}', caution: '記下當時發生的事、自己的反應與結果，下次在同一觸發點改做一個可逆的小步驟', keys: ['recurringIssue', 'trigger'] },
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
