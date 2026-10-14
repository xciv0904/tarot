/* Named-question planner. Card facts remain unchanged; each question selects
 * a different facet, evidence role and practical check. Editorial extensions
 * are symbolic possibilities, not claims about an absent person or outcome. */
var LEN_QUESTION_FACETS = {
  // jobs | environment | family issue | study process | money mechanism | decision gate | daily check
  1:['外勤業務、配送協調、活動聯絡','需要外出接觸、快速回覆的團隊','消息與拜訪是否由同一人張羅','收集考試資訊、把讀書計畫排進行程','新客戶、訂單或款項消息','消息是否確認，能否按約定時間開始','是否一直趕行程或回訊息，打斷休息'],
  2:['活動企劃、短期專案助理','可小規模試做、快速取得回饋的環境','臨時幫忙是否能變成固定分工','用短測驗或短練習找到有效的方法','一次性、小額或短期收入機會','是否能先小額、短期試做再決定','是否把小段休息當成完整休息'],
  3:['跨境業務、旅遊服務、物流專員','需要跨地點合作、能協調時差的環境','距離、搬遷與探訪安排','異地進修、語言學習與跨領域探索','跨地區交易、運輸或海外服務收入','交通、距離與轉換成本是否可承擔','旅行、通勤或環境變動是否打亂作息'],
  4:['物業行政、居家服務、內勤行政','工作範圍固定、制度與日常清楚的組織','居住安排與家務分配','建立固定讀書地點與日常練習','居家服務、不動產管理或穩定本業收入','固定支出與基本生活能否維持','住處是否安靜，能否固定睡眠時間'],
  5:['園藝照護、長期客戶維護、培訓助理','允許長期累積、不只追求短期成果的團隊','長期照顧責任與延續的家庭習慣','基礎知識需循序累積，反覆複習','長期服務、維護與持續累積的收入','是否願意投入足夠的時間與持續成本','生活習慣是否持續，而非偶爾補救'],
  6:['資訊查核、流程查核助理','資訊來源清楚、能及時澄清責任的環境','家人的說法不同，重要資訊未確認','不懂的概念需回頭找出混淆點','收入、帳目或條件尚有不清楚之處','先取得缺少的資訊，再做難以回頭的承諾','是否因反覆擔心而影響休息'],
  7:['合約查核、談判協調、風險查核','利益與權責透明、能處理複雜流程的組織','未說清楚的關係安排或利益衝突','題目有多重條件，需逐步拆解推理','多方分潤、附帶條件或複雜交易','是否存在未揭露的條件或其他利害關係','是否長期承受人際壓力卻沒有出口'],
  8:['專案結案、檔案整理、流程轉換協調','能處理收尾與交接，不忽略退出條件的環境','某種相處方式已停下，需要重新安排','停止沒有效果的讀法，整理未完成的部分','收入中止、結算或固定支出調整','原方案是否仍可持續，退出後如何銜接','是否已疲累卻仍維持原本的工作量'],
  9:['公關、設計企劃、接待服務','重視呈現、禮貌與客戶體驗的團隊','表達感謝與日常照顧是否得到回應','用作品、展示或口頭說明整理學習成果','設計、接待、活動或客戶轉介收入','欣賞與邀請是否有清楚的實際條件','愉快的活動是否仍留有足夠休息'],
  10:['流程改善、緊急任務協調、品質檢驗','允許迅速處置，也要求先確認風險的環境','突然取消安排或急著做決定','找出失分原因，集中修正一個薄弱點','突然支出、合約中止或急著成交','先確認取消、退出與突發成本','是否突然加大活動量或跳過休息'],
  11:['協商專員、教育訓練、運動活動企劃','可以直接討論分歧、有清楚協商規則的團隊','同一個爭執反覆發生，沒有改變做法','重複練習與訂正，避免只反覆看答案','重複收費、爭議款項或反覆消耗','同一問題是否已有具體解法','反覆爭執、工作或訓練是否讓人難以恢復'],
  12:['客服、媒體訪談、社群協調','溝通頻繁，也能避免傳話與誤解的環境','家人透過傳話溝通，彼此越來越焦慮','用討論與口頭講解測試理解程度','溝通、客服、媒體或合作洽談收入','資訊是否來自本人，而非傳聞','聊天與通知是否讓你難以專心休息'],
  13:['學徒、初階助理、兒童活動企劃','有人帶新人、允許提問和試錯的環境','新的家庭角色尚未熟悉，需要有人協助','回到基礎，先完成較小的練習','小額起步、新服務或初次接案收入','能否先做小規模、可回頭的嘗試','新習慣是否設得太大，難以持續'],
  14:['品質檢驗、合約審查、稽核助理','能核對成果與承諾、權責透明的環境','口頭答應與實際負擔是否一致','核對解題步驟，避免用猜測補缺口','收入條件、費用與宣傳說法需要核對','承諾是否可查證，要求是否合理','是否為了表現而隱藏疲累或減少休息'],
  15:['營運管理、資源協調、團隊主管','資源分配與決策權清楚的組織','照顧與主導混在一起，拒絕變得困難','管理時間與學習資源，避免一次承擔太多','資金管理、大客戶或資源分配','誰有決定權，是否尊重你的選擇','是否扛起太多責任，沒有分擔'],
  16:['數位企劃、研究助理、產品規劃','方向清楚、能把理想變成里程碑的團隊','家人對未來的期待是否一致','先定學習目標，再安排可檢查的進度','數位服務、規劃或專業知識收入','目標能否拆成可完成的階段','是否為追求理想忽略當天的休息需求'],
  17:['轉型專案協調、搬遷服務、流程改善','允許調整工作方式、交接清楚的環境','家庭正在變動，需要重談分工','換讀法前先試一小段，對照效果','服務更新、工作轉換或新客群收入','改變後的責任、成本與配合方式','作息改變後是否仍有穩定的恢復時間'],
  18:['客戶成功專員、團隊支援、社區服務','重視長期合作與互相支援的團隊','需要幫忙時誰能可靠地分擔','找固定讀書夥伴，互相檢查練習','既有客戶、可信任人脈與服務續約收入','支持是否持續，答應的事是否做到','是否能向可信任的人提出實際幫忙'],
  19:['行政專員、法務助理、制度管理','權責分明、保有自主空間的組織','各自的空間與家庭責任需要區分','安排獨立讀書時段，確認制度或報名要求','機構服務、行政或制度內的穩定收入','規則、資格與自主空間是否清楚','是否長時間獨自承擔，缺少可聯絡的支持'],
  20:['活動企劃、公關、社群經營','需要跨團隊與公開活動合作的環境','公開場合的相處與私下需求可能不同','讀書會、講座與團隊討論的學習管道','活動、公開合作或社群客戶收入','公開場合的說法能否落實到私下安排','社交安排是否過多，擠壓恢復時間'],
  21:['流程改善、專案排程、障礙排除協調','限制明確、願意處理瓶頸的環境','時間、距離或意願形成實際阻力','先找卡住的基礎概念，不急著增加題量','款項延遲、資源受限或進度卡住','阻礙能否解決，需要誰與多少時間','是否把工作瓶頸變成持續的身心負荷'],
  22:['方案規劃、採購比較、職涯服務助理','能比較選項、明講取捨條件的環境','彼此對家庭安排沒有選定方向','比較課程與讀法，試做後再選主線','多個收入選項，需要比較成本與穩定度','選項的成本、回頭空間與必要條件','是否因為同時嘗試太多方式而更疲累'],
  23:['成本控制、品質查核、維護助理','願意找出小漏洞並持續改善的團隊','小問題持續累積，總有一人收拾','找出常錯的小步驟，分次修補','零碎支出、損耗或未注意的費用','反覆消耗的時間與費用是否能停止','小壓力是否反覆累積而沒有休息'],
  24:['陪伴服務、客戶關係、創作企劃','重視人的感受，也能明講工作分工的團隊','喜歡與關心是否以家人需要的方式表達','用有興趣的例子理解內容，再確認基礎','喜歡的創作或以人際服務為主的收入','喜歡之外，責任與成本是否可接受','是否忽略自己的需求，只顧別人的感受'],
  25:['合約協調、合作專案管理、會員服務','約定清楚、重視續約與持續合作的組織','家人的約定與分工是否持續遵守','固定練習與檢查進度，確認承諾是否可做到','合約、續約或固定合作收入','雙方責任、期限與退出方式是否明確','是否答應太多事，無法保留固定休息'],
  26:['研究助理、編輯、教育訓練','可以深入研究、能取得必要資訊的環境','有尚未了解的家庭資訊或需求','查資料、補概念，分清懂與不懂的地方','專業知識、研究、教育或出版收入','必要資訊是否取得，哪些仍未知','是否長時間讀資料而沒有安排中斷休息'],
  27:['文書行政、內容編輯、資訊整理','文件與交接清楚，能核對文字與行動的團隊','訊息中的安排需當面確認','整理筆記與書面練習，用輸出檢查理解','寫作、文件、資訊整理或行政收入','是否拿到可核對的書面條件','是否被文字訊息與待辦清單持續打斷'],
  28:['職務資訊不足，需先了解實際工作內容','需要與實際對象確認分工的環境','需要直接了解這位家人的需求','學習線索不足，需確認本人目前的方法','收入線索不足，需查看實際收支','需要本人說明的責任與安排','自己的生活狀態需要本人記錄確認'],
  29:['職務資訊不足，需先了解實際工作內容','需要與實際對象確認分工的環境','需要直接了解這位家人的需求','學習線索不足，需確認本人目前的方法','收入線索不足，需查看實際收支','需要本人說明的責任與安排','自己的生活狀態需要本人記錄確認'],
  30:['資深顧問、調解協調、專業服務','重視經驗、尊重步調與相處分寸的團隊','不同世代的步調與親密程度需協調','用熟悉的方法穩定複習，向有經驗的人求教','成熟專業、顧問或長期服務收入','彼此的步調與可接受範圍是否一致','是否能保留安靜、不被打擾的時間'],
  31:['對外展示、品牌企劃、活動主持','成果看得見、能直接交流的團隊','坦率表達與彼此肯定的機會','展示成果、做模擬題，確認掌握程度','可展示的成果、客戶肯定或公開服務收入','成果是否可驗證，熱情能否持續','忙碌或熱絡時是否仍保留休息'],
  32:['創意設計、品牌內容、藝術活動企劃','重視感受與創意，也有清楚回饋的環境','被重視的感受與情緒回應需要說明','以圖像、故事或作品整理內容，再核對概念','創作、品牌或可被看見的專業收入','感受與現實安排是否相符','情緒起伏是否影響睡眠或日常節奏'],
  33:['問題分析、技術支援、方案顧問','可以直接處理關鍵問題、授權清楚的團隊','找到最需要說清楚的一件事','找出關鍵概念，做一題驗證是否理解','能解決特定問題的專業服務收入','最關鍵的條件是否已經確認','是否能找到最影響作息的一個問題先處理'],
  34:['業務、財會行政、交易服務','金錢往來與資源分配透明的環境','金錢往來與共同負擔需要明講','整理大量資訊，選定主線後再擴充','交易、業務、資源流通或多管道收入','付款、分潤與成本是否清楚','是否同時處理太多事情而沒有停止的時間'],
  35:['固定營運、長期維護、專案管理','工作節奏穩定，也允許改善舊方法的團隊','固定責任是否公平，是否能協調改變','固定讀書節奏，定期確認方法仍有效','穩定本業、維護或固定合作收入','穩定之外，是否仍有必要的調整空間','是否把僵化作息或過勞誤當成自律'],
  36:['責任分工、公益協調、負荷管理','責任可分擔、願意協調負荷的組織','責任與壓力是否總由同一人承受','先減少額外負擔，守住最必要的準備','必要支出、責任負擔與財務壓力','代價是否可承受，能否找到分擔方式','壓力與責任是否已超過目前能承受的程度']
};

var LEN_STUDY_DIRECTIONS = {
 1:'傳播、商務溝通與物流管理',2:'活動實作、短期探索課程',3:'語言、國際事務與跨文化學習',4:'生活管理、建築居住與基礎實務',5:'生命科學、環境與長期技能訓練',6:'資料查證、概念辨識與資訊素養',7:'邏輯推理、法律條件分析與談判',8:'成果整理、專案結案與方法評估',9:'設計、美感表達與展示實作',10:'品質檢查、問題定位與流程改善',11:'辯論、反覆操作與技能訓練',12:'口語表達、訪談與討論課程',13:'入門課程與基礎練習',14:'稽核、研究方法與證據查核',15:'管理、資源分配與時間規劃',16:'數位工具、研究與目標規劃',17:'跨領域試修與方法比較',18:'協作實作、同儕教學與服務學習',19:'行政制度、法規與獨立研究',20:'社會研究、公共活動與團隊實作',21:'基礎補強、瓶頸分析與專案排程',22:'選課比較與跨領域探索',23:'錯誤分析、成本查核與細節練習',24:'共同興趣、藝術創作與人際服務',25:'契約、合作管理與固定技能練習',26:'研究、閱讀理解與知識整理',27:'寫作、文書與資訊整理',28:null,29:null,30:'經典閱讀、文化與專業經驗傳承',31:'簡報、展示與成果驗證',32:'視覺設計、敘事與藝術表達',33:'問題分析、關鍵概念與技術實作',34:'商務、財務與大量資訊整理',35:'持續技能訓練與營運實務',36:'責任管理、服務學習與負荷安排'
};
var LEN_SOCIAL_CHECKS = {
 1:['主動聯絡、帶來消息的對象','收到消息後向來源確認，約定下一步'],
 2:['喜歡輕鬆短暫互動的對象','從一次小活動確認能否持續聯絡'],
 3:['跨地點或不同背景的對象','確認距離、聯絡時間與實際配合方式'],
 4:['熟人圈中重視固定安排的對象','說清楚既有圈子的習慣與個人需求'],
 5:['需要長時間累積熟悉的對象','定期碰面，確認支持是否持續'],
 6:['說法不清楚、資訊需要澄清的對象','直接核對本人的意思與已知資訊'],
 7:['涉及多方利益與複雜安排的對象','列出利害關係，確認未說明的條件'],
 8:['原有互動停止或需要收尾的對象','先確認是否仍願意合作，安排必要交接'],
 9:['以邀請、禮貌與欣賞建立互動的對象','表達感謝，也明講實際需求'],
 10:['容易迅速取消或做決定的對象','先說清取消條件，重要安排不要倉促同意'],
 11:['經常辯論或反覆爭執的對象','針對同一問題約定不同的處理方式'],
 12:['聊天頻繁、容易透過傳話互動的對象','重要資訊向本人確認，減少轉述'],
 13:['初次參與、尚需熟悉規則的對象','用一個小任務說明分工，保留提問空間'],
 14:['承諾與實際成果需查核的對象','核對具體成果與要求，不用親近程度判斷'],
 15:['能提供資源，也可能主導安排的對象','先談授權與拒絕空間，再接受幫忙'],
 16:['喜歡共同目標與計畫的對象','把目標說成各自能完成的里程碑'],
 17:['互動方式正在調整的對象','改變後重新確認分工與聯絡方式'],
 18:['能互相支援、長期合作的對象','用具體約定確認彼此能提供多少支持'],
 19:['需要個人空間或正式規則的對象','區分私人需求、工作責任與可接受的聯絡範圍'],
 20:['公開活動與團體中的對象','確認公開說法能否落實到實際合作'],
 21:['合作受時間或其他條件限制的對象','問清楚瓶頸與能一起解決的部分'],
 22:['對合作方向尚未選定的對象','把選項與各自需求列出再做約定'],
 23:['小問題反覆累積、消耗互動的對象','找出一項反覆消耗，重談處理與分工'],
 24:['以好感、關心或共同興趣靠近的對象','關心之外也說清自己的需求'],
 25:['以固定合作與約定維持互動的對象','說清責任、期限及無法履約時的做法'],
 26:['需要更多了解才能辨識的對象','詢問必要資訊，保留對方不分享的空間'],
 27:['主要透過文字或文件聯絡的對象','確認文字是否被雙方理解成相同安排'],
 28:['單張人物牌不足以指定朋友或同事類型','向本人詢問，搭配其他牌與實際行動確認'],
 29:['單張人物牌不足以指定朋友或同事類型','向本人詢問，搭配其他牌與實際行動確認'],
 30:['重視經驗、步調與分寸的對象','確認舒服的討論方式與各自步調'],
 31:['交流直接、願意展示成果的對象','肯定成果後也核對細節與實際需求'],
 32:['重視被肯定與情緒回應的對象','問清楚希望如何收到回饋，不靠猜測'],
 33:['能一起釐清關鍵問題的對象','直接提出最關鍵的問題，確認答案與下一步'],
 34:['涉及資源、業務與金錢往來的對象','把費用、分潤與個人選擇權說清楚'],
 35:['習慣固定合作與長期投入的對象','確認約定持續，也能在必要時調整'],
 36:['責任與壓力可能較重的對象','談清負荷與支援，不默認誰應全部承擔']
};
var TAROT_QUESTION_JOBS = {
  m0:['新創專案助理、活動企劃','能試做，也有人確認風險的團隊','開始前的成本、準備與回頭空間'],
  m1:['內容企劃、技術支援、業務提案','能整合工具並展示成果的環境','承諾是否有足夠的能力與資源支持'],
  m2:['研究助理、資料分析、專業諮詢助理','可深入查證，資訊權限清楚的組織','哪些資訊仍未確認，誰能提供答案'],
  m3:['設計企劃、品牌內容、照護服務','重視創作與日常支持的團隊','投入是否有持續照顧與維護的空間'],
  m4:['營運管理、行政主管、流程管理','責任、規則與授權清楚的組織','決定權與承擔責任的人是否一致'],
  m5:['教育訓練、制度管理、專業服務','有指導與標準，也能討論改善的環境','資格、規則與指導來源是否可靠'],
  m6:['合作協調、客戶關係、方案規劃','雙方期待與合作條件能說清楚的團隊','選擇是否符合自己的需求與雙方約定'],
  m7:['專案管理、物流協調、外勤業務','目標與進度明確，也能協調不同立場的環境','是否有足夠準備維持現在的推進速度'],
  m8:['衝突協調、團隊支持、陪伴服務','願意耐心處理分歧的團隊','能否溝通而不靠硬撐或控制完成事情'],
  m9:['研究分析、編輯、專業顧問','有獨立工作時間，也有可求助的環境','必要資料與實際經驗是否已經核對'],
  m10:['流程轉換、營運排程、變動專案協調','能應付變動並保留備案的團隊','外在條件改變後，成本與安排是否仍可接受'],
  m11:['法務助理、合約審查、行政稽核','約定與權責透明的組織','證據、契約與雙方責任是否相符'],
  m12:['流程觀察、研究助理、方案評估','允許先觀察與修正方法的環境','等待是否有目的，什麼條件達成後才行動'],
  m13:['專案結案、轉型協調、交接管理','能處理收尾和新舊工作銜接的組織','原方案該停止什麼，下一步如何銜接'],
  m14:['跨團隊協調、資源整合、服務流程改善','能協調不同速度、安排穩定節奏的團隊','投入與恢復、彼此的步調是否可以協調'],
  m15:['風險查核、費用審查、合約核對','利益透明、拒絕與退出條件明確的組織','依賴、金錢與退出代價是否限制了選擇'],
  m16:['危機應變、流程改善、風險查核','承認問題並允許重建流程的組織','脆弱的安排是否有備案與必要的支持'],
  m17:['創意企劃、長期計畫、社群支持','允許長期改善，也定期確認進度的團隊','期待能否拆成實際可完成的步驟'],
  m18:['資訊查核、研究助理、情境分析','資料與假設可查證，不靠傳聞決策的環境','哪些是已知事實，哪些仍只是擔心或想像'],
  m19:['品牌展示、活動主持、教育推廣','成果看得見、交流直接的團隊','成果是否持續，重要細節是否也確認了'],
  m20:['成果審查、專案評估、職涯服務','能回顧成果並討論下一階段的組織','哪些經驗已得到驗證，哪些做法需要調整'],
  m21:['跨地區合作、專案統籌、系統整合','能完成交付並協調完整流程的團隊','成果是否完整，下一階段的責任如何安排']
};
// Majors have their own household, learning, cashflow and daily mechanisms.
// These checks are authored separately from occupational associations.
var TAROT_MAJOR_CHECKS = {
 m0:['新的家庭角色與獨立安排','先試一項基礎任務，再安排完整讀書計畫','新投入的起步成本與預備金','新活動是否打亂固定作息'],
 m1:['提出解法的人是否也完成實際分工','把工具與筆記整合後，實際完成一題或一份作品','可用技能是否真的轉成已收款的服務','計畫很多時是否仍有執行與休息時間'],
 m2:['沒有說出口的需求是否已直接詢問','先補缺少的資訊，分清楚已知與推測','未公開的費用、條件與帳目資訊','安靜觀察時是否仍記錄實際作息'],
 m3:['日常照顧是否被公平分擔','用作品或例子練習，再補足基礎概念','創作與照顧服務的成本及持續收入','照顧別人時是否也照顧自己的日常需求'],
 m4:['家中決定權與負責的人是否一致','把準備拆成進度與明確的檢查標準','固定預算、必要支出與管理責任','固定規律是否過於嚴格，沒有調整空間'],
 m5:['既有家庭規矩是否可以一起討論','確認教材、資格與指導來源，再照標準練習','規則、資格費用與制度內的收入','習慣是否適合自己，而非只照別人的規定'],
 m6:['共同選擇是否尊重各自需求','比較興趣與課程要求，試做後選定主線','共同支出與個人需求的取捨','安排是否符合自己的需要與可配合範圍'],
 m7:['家庭目標是否有人只被要求配合','設定階段目標，核對速度與實際掌握程度','投入速度、執行成本與預期付款進度','趕進度時是否有固定停止與休息時間'],
 m8:['分歧是否能耐心溝通而不要求誰硬撐','把難題拆小，穩定練習而不靠一次硬撐','耐心維持的支出是否仍在可承擔範圍','忍耐壓力時是否能提出支援需求'],
 m9:['各自空間與聯絡方式是否說清楚','獨立查資料後，以題目或請教驗證理解','獨立整理帳目，查證費用與必要支出','獨處是否能恢復精神，是否仍有支持管道'],
 m10:['外在變動後是否重談家中的安排','安排變動時保留備案並調整準備順序','不固定收入與突發費用的緩衝','行程變動後能否恢復固定作息'],
 m11:['約定與實際負擔是否公平','按評分標準檢查答案並記錄失分原因','契約、帳目、應收與應付款是否相符','責任與時間分配是否留有必要休息'],
 m12:['等待與退讓是否有共同同意的期限','換一種解題角度，設定觀察與回顧時間','延後收款與持續支出的時間成本','暫停是否有恢復作用，還是只是被迫等待'],
 m13:['舊分工停止後由誰銜接新的責任','停止沒有效果的讀法，保留仍有用的練習','結算、收入中止與下一份收入的銜接','需要停止的日常安排是否已調整'],
 m14:['不同步調是否能協調成可持續的分工','交替練習與回顧，調整各科的準備比例','各項收支比例與資源調配','投入與休息能否安排成穩定節奏'],
 m15:['依賴與控制是否讓人難以拒絕家中要求','先移除分心與過度依賴答案的習慣','綁約、負債、持續收費與退出代價','無法停止的習慣是否持續占用休息'],
 m16:['原安排失效後是否有支援與備案','找出基礎錯誤，重新建立解題步驟','突發支出與原本預算失效的風險','突然變動後是否先減少額外負擔'],
 m17:['對家庭未來的期待是否有實際分工','把長期目標拆成每週可檢查的進度','長期投入的資源是否足以支持計畫','期待改善時是否也持續做小幅調整'],
 m18:['猜測與未確認的家庭資訊是否分開','把不懂的概念與考前擔心分開處理','未知費用與推測收益是否已查證','擔心時是否能用實際紀錄確認作息'],
 m19:['表達肯定時是否也看見沒說出的需求','展示成果或模擬作答，確認掌握與漏掉的細節','看得見的成果是否已轉成實際收入','熱絡與忙碌時是否仍有中斷休息'],
 m20:['回顧舊安排後是否重談各自責任','依過往失分與成果調整下一階段準備','回顧舊收支，確認下一階段的必要調整','回顧生活紀錄後是否有具體調整'],
 m21:['共同安排完成後如何銜接下一階段','完成整體複習，檢查遺漏並做完整模擬','已完成款項結算與下一階段的資源','完成任務後是否安排恢復時間']
};
var TAROT_SUIT_TASKS = {
  wands:['創意企劃、活動執行、業務開發','有行動空間，也能確認目標與分工的團隊','開始嘗試','比較方向','規劃擴展','確認成果','協調競爭','展示成果','處理不同立場','管理進度','維持投入','分配工作量'],
  cups:['客戶關係、陪伴服務、創作企劃','重視人的感受，也能說清楚工作分工的團隊','表達需求','建立合作','團隊交流','檢查參與意願','處理失望','回顧經驗','比較期待與現實','檢查離開的原因','檢查滿足與代價','協調長期相處'],
  swords:['資訊分析、內容編輯、合約查核','能取得證據、直接討論並澄清責任的環境','釐清問題','比較選擇','處理溝通傷害','安排中斷與整理','處理爭執成本','協調轉換','核對方法是否誠實','釐清限制','區分擔心與事實','處理收尾與銜接'],
  pentacles:['營運行政、財會助理、技術實作','重視流程、品質與可持續成果的團隊','盤點資源','安排多項責任','確認分工與專業','檢查保留與控制','取得必要支持','確認付出與回報','評估投入成果','練習技能','檢查自主與成果','安排長期責任']
};
var QUESTION_SCENES = {
  1:'外出活動、工作拜訪或交通移動',2:'朋友聚會、休閒活動或短期活動',3:'旅行、異地工作或跨文化活動',4:'熟人的家庭聚會或固定生活圈',5:'戶外活動、固定課程或長期參與的社群',6:null,7:null,8:null,9:'展覽、慶祝活動或朋友邀請',10:null,11:'運動課程、訓練或討論活動',12:'講座、討論群或共同朋友的聊天',13:'初階課程、新社群或第一次參與的活動',14:'工作任務、合約合作或需要查核的專案',15:'管理工作、資源協調或團隊活動',16:'數位社群、研究活動或共同計畫',17:'搬遷、工作轉換或新活動',18:'朋友介紹、社區活動或固定合作',19:'機構、課程或正式工作環境',20:'公開活動、社團或社群聚會',21:null,22:'跨圈子的活動或不同課程',23:null,24:'共同興趣、創作或朋友聚會',25:'固定合作、會員活動或共同任務',26:'課程、圖書館活動或研究討論',27:'線上社群、書面合作或資訊交流',28:null,29:null,30:'專業講座、文化活動或有經驗者的介紹',31:'公開活動、展示或慶祝場合',32:'藝術活動、創作社群或表演場合',33:'處理問題的工作合作或諮詢活動',34:'商務活動、交易服務或合作專案',35:'固定工作、常去的課程或長期社團',36:null
};

function questionCardFacets(d, category) {
  var tarot = typeof d.card.arcana !== 'undefined';
  var f = { card:d, tarot:tarot, reversed:!!d.reversed };
  if (!tarot) {
    var row = LEN_QUESTION_FACETS[d.card.n];
    if (!row) return null;
    f.studyDirection=LEN_STUDY_DIRECTIONS[d.card.n];
    f.jobs=row[0]; f.environment=row[1]; f.family=row[2]; f.learning=row[3]; f.money=row[4]; f.gate=row[5]; f.daily=row[6];
    var love=LENORMAND_QUESTION_MEANINGS[d.card.n];
    f.relationship=love.quality; f.observe=love.observe; f.appearance=love.appearance;
    f.scene=QUESTION_SCENES[d.card.n];
    if(category==='social'){f.relationship=LEN_SOCIAL_CHECKS[d.card.n][0];f.observe=LEN_SOCIAL_CHECKS[d.card.n][1];}
    if(category==='family')f.observe='這項家庭安排是否由雙方說清楚：'+f.family;

    f.core=d.card.mZh; f.context=f.core;
    f.support=love.kind==='support'; f.constraint=love.kind==='check';
  } else {
    var rich=d.card.rich;
    var context=rich && rich.ctx && rich.ctx[category];
    f.core=rich ? (d.reversed ? rich.r : rich.u) : (d.reversed ? d.card.revZh : d.card.upZh);
    f.context=context ? context[d.reversed?1:0] : f.core;
    var major=TAROT_QUESTION_JOBS[d.card.id];
    var suit=TAROT_SUIT_TASKS[d.card.suit];
    var rank=d.card.num==='A'?1:parseInt(d.card.num,10);
    var court={Page:'先學習與試做',Knight:'確認行動與持續投入',Queen:'照顧需求與協調資源',King:'承擔責任與說清楚規則'}[d.card.num];
    var task=major?major[2]:(court || (suit && suit[1+(rank||1)]) || '核對準備與後續責任');
    f.jobs=major?major[0]:(suit?suit[0]:'職務資訊不足，先確認實際工作內容');
    f.studyDirection=major?major[0]+'所需的實作課程':({wands:'企劃、活動實作與商務開發',cups:'人際服務、表達與創作',swords:'邏輯、研究、法律與資訊分析',pentacles:'財務、營運、技能與實務操作'}[d.card.suit]||null);
    f.environment=major?major[1]:(suit?suit[1]:'需要說清楚規則與分工的環境');
    f.gate=major?major[2]:task+'的條件是否充分';
    f.learning=task+'，用實際練習檢查理解與成果';
    f.family='家庭安排中需要'+task+'，確認誰提出需求、誰實際承擔';
    f.money='收支與資源安排需要'+task+'，核對紀錄與必要費用';
    f.daily='觀察'+task+'時，是否有足夠的休息與可持續的節奏';
    var checks=TAROT_MAJOR_CHECKS[d.card.id];
    if(checks){f.family=checks[0];f.learning=checks[1];f.money=checks[2];f.daily=checks[3];}
    // Use each actual card's category context as a pattern to verify, rather
    // than declaring that the pattern must describe the user's life.
    if(rich&&rich.ctx){
      ['family','study','wealth','social','career'].forEach(function(cat){
        var line=rich.ctx[cat]&&rich.ctx[cat][d.reversed?1:0];
        if(!line)return;
        var field={family:'family',study:'learning',wealth:'money',social:'observe',career:'environment'}[cat];
        f[field]+='；對照這張牌的情境線索是否符合現況：'+refineReadingCopy(line);
      });
    }
    f.relationship=(rich&&rich.ctx[category==='social'?'social':'love']?rich.ctx[category==='social'?'social':'love'][d.reversed?1:0]:f.core);
    f.observe='從一次實際互動確認：'+f.gate;
    f.appearance=d.card.arcana==='major'?null:({wands:'外在風格可聯想到有活力、偏行動感的穿搭',cups:'外在風格可聯想到柔和、重視情感氛圍的搭配',swords:'外在風格可聯想到俐落、簡潔或帶距離感的搭配',pentacles:'外在風格可聯想到實用、穩重與重視材質的穿搭'}[d.card.suit]||null);
    f.scene=d.card.arcana==='major'?null:({wands:'活動、運動課程或共同任務',cups:'朋友聚會、共同興趣或創作活動',swords:'課程、工作討論或資訊交流',pentacles:'固定工作、技能課程或例行合作'}[d.card.suit]||null);
    // Upright/reversed are actual facts, not a numeric success score. Restrict
    // reversal to a check on this card's own proposed mechanism.
    f.constraint=!!d.reversed || /阻礙|受困|焦慮|衝突|失落|困頓|結束/.test(f.context);
    f.support=!f.constraint && /合作|支持|成果|穩定|信任|成功/.test(f.context);
    if(d.reversed) f.gate+='；先確認原本的做法是否卡住或做得過頭';
  }
  return f;
}

var READING_QUESTION_PLANS = {
  love:{
    'partner-type':['partner_traits','relationship','other','相處時觀察對方如何回應需求、履行約定'],
    'partner-profile':['partner_appearance','appearance','other','只對照外在風格，不從外貌判斷人品'],
    'meet-scene':['meeting_context','scene','other','先選一個可持續參與的活動或管道'],
    'pace-pattern':['relationship_development','relationship','future','把下一次聯絡或見面安排講清楚'],
    crush:['counterpart_attitude','observe','other','用一次具體邀約確認回應，不把猜測當成心意'],
    reunion:['reconciliation_conditions','gate','obstacle','先談分開時的問題是否已有改變，再考慮復合'],
    'marriage-longterm':['longterm_relationship','gate','future','把生活、責任與相處需求說成雙方同意的約定']
  },
  career:{
    'industry-fit':['suitable_roles','jobs','self','先查兩個相關職位的實際工作內容，再做一項小任務'],
    'work-style-fit':['employment_mode','environment','self','比較受雇與接案的分工、收入穩定度與自主程度'],
    'career-timing':['relationship_development','gate','future','先確認職缺、交接與必要準備，再排出可執行的時間'],
    'workplace-strength-weakness':['interaction_style','environment','self','用一次實際工作確認自己的優勢與需要支援的部分']
  },
  family:{
    'family-dynamics':['family_pattern','family','root','回顧最近三次家庭安排，記下誰決定、誰承擔'],
    'family-relations':['family_relationship','observe','other','直接確認這位家人的需求與可配合範圍'],
    'living-responsibility':['living_responsibility','gate','obstacle','把家務、時間與必要費用逐項列出並指定負責人'],
    'family-improve':['relationship_repair','family','advice','挑一項反覆出現的家庭問題，先重談一個可驗證的分工']
  },
  health:{
    'body-lifestyle':['wellbeing_pattern','daily','present','記錄睡眠、活動與壓力，找出實際影響日常的一件事'],
    'daily-balance':['wellbeing_action','gate','advice','先減少一個干擾休息的安排，持續記錄是否改善']
  },
  wealth:{
    'cashflow-risk':['financial_state','money','present','記錄最近的實際收入、必要支出與未付款項'],
    'risk-approach':['financial_advice','gate','obstacle','先確認費用、退出條件與自己能承受的支出上限'],
    'opportunity-source':['money_source','jobs','future','確認相關收入機會的工作內容、報酬與成本']
  },
  social:{
    'attract-type':['social_profile','relationship','other','觀察接觸的人如何表達需求與實際幫忙'],
    'interpersonal-style':['social_interaction','observe','self','在下一次對話直接確認雙方的意思與期待'],
    'ally-conflict':['ally_conflict','gate','obstacle','核對合作約定、責任與對方實際提供的支持']
  },
  study:{
    'major-fit':['learning_fit','jobs','self','先試做一項相關課程任務，記錄興趣與實際難度'],
    'exam-application':['exam_progress','learning','future','用一次模擬練習確認失分點，按剩餘時間重排準備'],
    'focus-execution':['focus_execution','environment','advice','安排一段不被打斷的練習，完成後檢查一個具體成果']
  },
  general:{
    'overall-theme':['overall_theme','context','present','選一件反覆影響日常的事作為這次的整理重點'],
    'priority-focus':['priority_focus','gate','obstacle','先完成一項會影響其他安排的必要確認'],
    'hidden-blindspot':['hidden_blindspot','daily','root','對照實際紀錄，確認哪些負擔或問題被忽略了'],
    'next-direction':['next_direction','learning','advice','選一個能試做與回顧的步驟，完成後再調整方向']
  },
  decision:{
    'dc-ab':['priority_focus','gate','strength','把 A、B 的必要條件、成本與回頭空間逐項比較'],
    'dc-do':['next_direction','gate','advice','先完成最關鍵的條件確認，再做可回頭的小步驟'],
    'dc-timing':['next_direction','learning','future','先完成目前欠缺的準備，達成檢查點後再推進'],
    'dc-stay':['priority_focus','family','obstacle','比較留下能調整什麼，以及離開後如何銜接'],
    'dc-offer':['hidden_blindspot','money','obstacle','核對書面條件、責任與必要費用，再決定是否接受'],
    'dc-unclear':['overall_theme','environment','present','列出最在意的兩個需求，安排一個小規模試做']
  }
};

// Register contracts for the six EXISTING decision IDs; no new public IDs.
READING_QUESTION_SCHEMAS.decision={};
taxonomyPrimaries('decision').forEach(function(q){
  var p=READING_QUESTION_PLANS.decision[q.id];
  READING_QUESTION_SCHEMAS.decision[q.id]=readingQuestionSchema(q.id,q.intent,p[0],p[0],[p[0],'action'],['partner_appearance','meeting_context'],['primaryAnswer','cardEvidence'],[p[0],'action']);
});

function plannedQuestionDefinition(category,key) {
  var original=(SUBTOPICS[category]||[]).filter(function(q){return q.key===key;})[0];
  if(original)return original;
  var q=category==='decision'?taxonomyPrimary(category,key):null;
  return q?{key:q.id,zh:q.label,fields:['conclusion','action','caveat'],modes:['cards']}:null;
}

function questionProjection(d,category,key) {
  var p=(READING_QUESTION_PLANS[category]||{})[key], f=questionCardFacets(d,category);
  if(!p||!f)return null;
  var type=p[0], answer='';
  if(category==='love' && !f.tarot && lenormandQuestionTopic(key)) {
    return {answer:lenormandCardQuestionText(d,lenormandQuestionTopic(key)),action:key==='partner-profile'?'對照實際認識的人的外在風格，不從外貌推斷人品。':LENORMAND_QUESTION_MEANINGS[d.card.n].observe,condition:f.gate,facets:f,type:type};
  }
  switch(type){
    case 'suitable_roles':answer='職務可以優先比較：'+f.jobs+'。這張牌描述的工作條件是：'+f.gate+'。';break;
    case 'suitable_environment':answer='適合優先比較的工作環境：'+f.environment+'。';break;
    case 'employment_mode':answer='工作型態先以分工與自主程度比較：'+f.environment+'。受雇時確認授權，接案或創業時確認自己能否處理「'+f.gate+'」。';break;
    case 'interaction_style':answer='可試著發揮的工作面向：'+f.jobs+'。團隊互動條件是：'+f.environment+'。需要補強或支援的地方，先核對「'+f.gate+'」。';break;
    case 'money_source':answer='收入機會可優先查詢與「'+f.jobs+'」相關的工作或服務。要核對的條件是：'+f.money+'。';break;
    case 'financial_state':answer='收支先核對：'+f.money+'。實際金額與缺口以帳目確認。';break;
    case 'financial_advice':answer='財務上先確認：'+f.gate+'。設定必要支出與可承擔上限後，再決定是否投入。';break;
    case 'partner_appearance':answer=f.appearance?f.appearance+'。這是外在風格聯想，不能確認實際身形或五官。':'這張牌沒有足夠的外在風格線索，不推測長相或實際年齡。';break;
    case 'meeting_context':answer=f.scene?'可優先留意的接觸場合是：'+f.scene+'。':'這張牌沒有足夠的場所、活動或管道線索，無法指定認識場合。';break;
    case 'partner_traits':answer='人物類型以相處反應辨識：'+f.relationship+'。先觀察對方在「'+f.gate+'」這件事上的做法。';break;
    case 'counterpart_attitude':answer='對方態度先從實際回應確認：'+f.observe+'。牌面不能確認未說出口的心意。';break;
    case 'reconciliation_conditions':answer='復合前需要先處理：'+f.gate+'。確認原本分開的原因是否已有不同的做法。';break;
    case 'longterm_relationship':answer='長期相處先確認：'+f.relationship+'。雙方能否一起處理「'+f.gate+'」，比口頭承諾更需要核對。';break;
    case 'relationship_development':answer=category==='career'?'工作進展先看：'+f.gate+'。完成這項確認後再安排轉職、面試或交接。':'關係的發展重點：'+f.relationship+'。推進前確認「'+f.gate+'」。';break;
    case 'family_pattern':answer='反覆出現的家庭模式可從這件事確認：'+f.family+'。回顧是誰決定、誰配合、誰收拾後續。';break;
    case 'family_relationship':answer='這位家人的互動先核對：'+f.family+'。溝通時確認「'+f.observe+'」，不要替對方猜真正想法。';break;
    case 'living_responsibility':answer='家庭責任與居住安排，先把「'+f.gate+'」說清楚。再確認'+f.family+'。';break;
    case 'relationship_repair':answer='改善先從一項可調整的分工開始：'+f.family+'。重談誰負責、何時完成、做不到時誰能支援。';break;
    case 'wellbeing_pattern':answer='日常狀態先記錄：'+f.daily+'。用生活紀錄對照，不從牌面推測疾病。';break;
    case 'wellbeing_action':answer='先調整一個日常安排：'+f.daily+'。把必要責任與休息時間排開，觀察實際變化。';break;
    case 'social_profile':answer='人際對象先以實際互動辨識：'+f.relationship+'。留意對方對「'+f.gate+'」的回應。';break;
    case 'social_interaction':answer='互動方式可以先調整：'+f.observe+'。對話後確認彼此是否理解相同。';break;
    case 'ally_conflict':answer='支持與競爭先核對「'+f.gate+'」。看對方是否尊重約定、分擔工作，而非只看親近程度。';break;
    case 'learning_fit':answer=(f.studyDirection?'學習方向可先試修或試做：'+f.studyDirection+'。':'這張人物牌不足以指定科系，先了解本人的興趣與課程需求。')+'練習重點是：'+f.learning+'。';break;
    case 'exam_progress':answer='考試準備先處理：'+f.learning+'。用模擬練習核對掌握程度，不從牌面保證成績。';break;
    case 'focus_execution':answer='專注與執行先安排能做到這件事的讀書環境：'+f.environment+'。單次練習只檢查「'+f.learning+'」的一項成果。';break;
    case 'overall_theme':answer='目前的生活主軸可對照：'+f.context+'。再確認'+f.gate+'。';break;
    case 'priority_focus':answer='目前優先處理的條件：'+f.gate+'。這項確認會影響接下來的投入與安排。';break;
    case 'hidden_blindspot':answer='可能忽略的地方：'+(category==='decision'?f.money:f.daily)+'。請用實際紀錄核對。';break;
    case 'next_direction':answer='下一步先做可檢查的準備：'+(category==='decision'?f.gate:f.learning)+'。完成後再決定是否加大投入。';break;
  }
  if(category==='decision'){
    var answers={
      'dc-do':'目前先做可回頭的嘗試，推進前確認：'+f.gate+'。',
      'dc-timing':'時間安排先看準備能否完成：'+f.learning+'。達成檢查點後再推進，不用牌面指定日期。',
      'dc-stay':'留下先確認能否調整「'+f.gate+'」；離開先核對「'+f.money+'」這類資源與銜接問題。',
      'dc-offer':'接受機會前先核對：'+f.money+'。把責任、報酬與退出方式寫清楚。',
      'dc-unclear':'先釐清自己需要哪種安排：'+f.environment+'。再核對「'+f.gate+'」，安排小規模試做。'
    };
    if(answers[key])answer=answers[key];
  }
  var condition=category==='health'?f.daily:(category==='wealth'?f.money:f.gate);
  var action=p[3]+'；這張牌特別要確認：'+condition+'。';
  return {answer:answer,action:action,condition:condition,facets:f,type:type};
}

function projectedQuestionCardText(d,category,key,role) {
  var x=questionProjection(d,category,key); if(!x)return '';
  if(role==='obstacle')return '可能的阻力，需要核對：'+x.condition+'。與本題的關係是：'+x.answer;
  if(role==='advice')return '這個位置的建議：'+x.action;
  return x.answer;
}

function buildPlannedQuestionReading(category,key,drawn,roleFor) {
  var schema=(READING_QUESTION_SCHEMAS[category]||{})[key], plan=(READING_QUESTION_PLANS[category]||{})[key];
  if(!schema||!plan||!drawn.length)return null;
  var special=category==='love'&&typeof drawn[0].card.arcana==='undefined'&&lenormandQuestionTopic(key);
  if(special)return buildLenormandQuestionReading(schema,drawn,lenormandQuestionTopic(key));
  var rows=drawn.map(function(d){return questionProjection(d,category,key);});
  if(rows.some(function(x){return !x;}))return null;
  var focus=drawn.findIndex(function(d){return roleFor(d.pos.zh)===plan[2];});
  if(focus<0)focus=drawn.length===9?4:Math.floor(drawn.length/2);
  if((plan[1]==='appearance'||plan[1]==='scene')&&!rows[focus].facets[plan[1]]){
    var usable=rows.findIndex(function(x){return !!x.facets[plan[1]];});
    if(usable>=0)focus=usable;
  }
  var obstacle=drawn.findIndex(function(d){return roleFor(d.pos.zh)==='obstacle';});
  var out={available:true,schema:schema,primaryAnswer:rows[focus].answer,sections:{},cardRelationship:'',evidence:[],action:rows[focus].action,uncertainty:'這是牌面提供的條件與可確認方向，不是對人物、事件或結果的確定預測。',omitted:[]};
  if(obstacle>=0 && obstacle!==focus)out.primaryAnswer+='先核對的限制是：'+rows[obstacle].condition+'。';
  out.evidence=drawn.map(function(d,i){return '「'+d.card.nameZh+'」'+(rows[i].facets.tarot?(d.reversed?'逆位':'正位'):'')+'在'+d.pos.zh+'：'+rows[i].answer;});
  var main=plan[0];
  out.sections[main]={contentType:main,label:READING_CONTENT_LABELS[main],text:out.primaryAnswer,evidence:out.evidence};
  schema.sectionOrder.forEach(function(type){
    if(type===main)return;
    var f=rows[focus].facets, text='';
    if(type==='action'||type==='wellbeing_action')text=out.action;
    else if(type==='suitable_environment')text='適合優先比較的工作環境：'+f.environment+'。';
    else if(type==='interaction_style')text='互動與溝通先確認：'+f.observe+'。';
    else if(type==='meeting_mechanism')text=f.scene?'在這類活動中，交換資訊、共同任務或多次碰面可成為接觸的理由。':'';
    else if(type==='partner_traits')text='相處反應需要實際確認：'+f.relationship+'。';
    else if(type==='financial_state')text='目前收支要核對：'+f.money+'。';
    else if(type==='financial_advice')text='確認必要支出、付款與費用，設定可承擔的上限。';
    else if(type==='wellbeing_pattern')text='日常紀錄重點：'+f.daily+'。';
    else if(type==='relationship_development')text=category==='love'?'關係後續需確認：'+f.gate+'。':'後續進展需確認：'+f.gate+'。';
    if(text && validateReadingContent(type,text).valid)out.sections[type]={contentType:type,label:READING_CONTENT_LABELS[type],text:text,evidence:out.evidence};
  });
  // Decision A/B uses actual labelled groups when present. A line with no A/B
  // labels cannot honestly supply a winner; explain the comparison required.
  if(category==='decision'&&key==='dc-ab'){
    var a=drawn.findIndex(function(d){return /選項A/.test(d.pos.zh);});
    var b=drawn.findIndex(function(d){return /選項B/.test(d.pos.zh);});
    out.primaryAnswer=a>=0&&b>=0?'A 優先核對：'+rows[a].condition+'；B 優先核對：'+rows[b].condition+'。先選必要條件能落實、代價可承擔的一邊。':'目前牌位沒有分開 A、B，不能據此指定勝出選項。先把兩個選項的成本、必要條件與回頭空間列出，再做比較。';
    out.sections[main].text=out.primaryAnswer;
  }
  var peer=obstacle>=0&&obstacle!==focus?obstacle:drawn.findIndex(function(_,i){return i!==focus;});
  if(peer>=0)out.cardRelationship='「'+drawn[focus].card.nameZh+'」提供本題的主要方向：'+rows[focus].answer+'「'+drawn[peer].card.nameZh+'」補充需要核對的條件：'+rows[peer].condition+'。兩項條件要一起成立，不能只憑其中一張判斷結果。';
  if(category==='health')out.uncertainty=HEALTH_DISCLAIMER;
  if(category==='wealth')out.uncertainty=FINANCE_DISCLAIMER;
  return normalizePlannedReading(out);
}

function normalizePlannedReading(out) {
  ['primaryAnswer','action','uncertainty','cardRelationship'].forEach(function(k){out[k]=refineReadingCopy(out[k]);});
  Object.keys(out.sections).forEach(function(k){out.sections[k].text=refineReadingCopy(out.sections[k].text);});
  out.evidence=out.evidence.map(refineReadingCopy);
  return out;
}

function projectedQuestionPair(a,b,category,key) {
  var topic=category==='love'?lenormandQuestionTopic(key):'';
  if(topic && typeof a.card.arcana==='undefined')return lenormandQuestionPairText(a.card,b.card,topic);
  var left=questionProjection(a,category,key),right=questionProjection(b,category,key);
  if(!left||!right)return '';
  return refineReadingCopy('「'+a.card.nameZh+'」提供本題的做法與方向：'+left.answer+'「'+b.card.nameZh+'」要求一起確認：'+right.condition+'。將兩者對照實際條件，再決定是否繼續投入。');
}

function questionDrawPositions(positions,category,key,deck) {
  if(category!=='decision'||key!=='dc-ab'||deck!=='lenormand')return positions;
  if(positions.length!==3 && positions.length!==5 && positions.length!==9)return positions;
  return positions.map(function(p,i){
    var side=positions.length===9?(i%3===0?'A':i%3===2?'B':''):positions.length===5?(i<2?'A':i>2?'B':''):(i===0?'A':i===2?'B':'');
    return {zh:side?'選項'+side+'・需要核對的條件':'兩邊共同的條件',en:side?'Option '+side:'Shared condition'};
  });
}
