var FUSE_SUMMARY_NOHOUSE_TPL = [
  '你的{P}在{S}，較容易透過「{method}」，去{coreNeed}。',
  '{P}進到{S}時，你往往想用「{method}」的方式，{coreNeed}。',
  '{S}的{P}，讓你較常用「{method}」，一步步{coreNeed}。',
];
/* 已知出生時間時，summary 必須同時帶出行星核心需求＋星座運作方法＋宮位的具體
   生活領域（{lifeArea}，已改寫成可直接嵌入句子的乾淨名詞片語，不帶「你的」「能力
   裡」這類模板語法），三者缺一都不算融合，不能因為 lifeExpression/advanced 有
   宮位內容就讓 summary 省略它。刻意不用「當{P}遇上{S}」這個句型，避免十顆行星
   x十二星座都套同一種開頭讀起來很像罐頭文字。 */
var FUSE_SUMMARY_HOUSE_TPL = [
  '你的{P}在{S}，會用「{method}」處理{lifeArea}；核心是在這些情境中{coreNeed}。',
  '{P}進到{S}時，你會在{lifeArea}以「{method}」運作，藉此{coreNeed}。',
  '{S}的{P}把「{method}」帶進{lifeArea}，讓你在這個領域{coreNeed}。',
];
/* lifeExpression 聚焦「宮位何時被啟動＋該行星在現實中做什麼」。星座的運作方式
   已在 summary 顯示，這裡不再重複 method/behavior，避免相同星座的每張卡片都出現
   同一句，也避免手機預設摘要過長。 */
var FUSE_LIFE_HOUSE_TPL = [
  '{activation}，{P}會推動你{planetVerb}。',
  '在{lifeArea}，{P}讓你更常{planetVerb}。',
  '{P}在{lifeArea}被啟動時，你傾向{planetVerb}。',
];
var FUSE_LIFE_NOHOUSE_TPL = [
  '日常裡，你通常會{behavior}。',
  '不特別看情境時，你也傾向{behavior}。',
];
var FUSE_STRENGTH_NOHOUSE_TPL = [
  '你{matureExpression}，並{matureAim}。',
  '較明顯的能力是{matureExpression}，加上{matureAim}。',
];
/* strength 不能只是 PLANET_BEGINNER.strength＋SIGN_BEGINNER.strength 的拼接，改用
   matureAim（行星成熟時的實際能力）＋matureExpression（星座成熟時的具體表現）為主，
   部分句型加一句簡短的宮位情境（{lifeArea}）補充，但禁止用引號完整引用
   coreQuestion——那是一句完整的人生大哉問，不適合塞進「你能做到什麼」的正文。
   matureExpression 多數已經是「能...」開頭，因此永遠只用「你{matureExpression}」
   這種不加動詞的接法，避免出現「你能能」這種重複字；且 matureExpression 內部本身
   多半已經帶了一個「也」（例如「能享受被關注，也能把光分給身邊的人」），因此接
   matureAim 一律用「並」而不是「也」，避免同一句裡出現兩次「也」。 */
var FUSE_STRENGTH_HOUSE_TPL = [
  '在{lifeArea}，你{matureExpression}，並{matureAim}。',
  '面對{lifeArea}，你{matureExpression}，同時{matureAim}。',
  '{lifeArea}中，你{matureExpression}，並逐步做到「{matureAim}」。',
];
var FUSE_CAUTION_NOHOUSE_TPL = [
  '常見的模式是{shadow}；可以練習{pbW}。',
  '失衡時，你可能{imbalance}；提醒自己{sbW}。',
  '失衡時可能{imbalance}；可以練習{pbW}。',
];
/* caution 聚焦「行星失衡模式＋宮位調整方向」。星座的成熟／失衡表現已分別出現在
   strength 與 summary/lifeExpression，這裡不再把三套長句全塞在一起，避免手機卡片
   過長；整張卡片合併後仍完整包含行星、星座與宮位三軸。 */
var FUSE_CAUTION_HOUSE_TPL = [
  '壓力下可能{imbalance}；可以{growthTask}。',
  '{P}失衡時，較容易{imbalance}；不妨{growthTask}。',
  '有時可能{imbalance}；可以慢慢{growthTask}。',
];
var FUSE_FUNCTION_TPL = [
  '{P}負責{function}；它想回答：{question}',
  '{P}的作用是{function}，背後在問：{question}',
];
var FUSE_SIGNMETHOD_TPL = [
  '落在{S}，動機來自「{motivation}」，做法是「{method}」。',
  '{S}的驅動力是{motivation}，具體做法是{method}。',
];
var FUSE_HOUSEACT_TPL = [
  '宮位落在「{lifeArea}」，常在{activation}被啟動，隱含的提問是：{coreQuestion}',
  '這股能量的舞台是{lifeArea}；每當{activation}就會被喚醒，核心提問是「{coreQuestion}」',
];
/* synthesis 要解釋三者「為何形成這種模式」的因果關係，不能用「共同組成這份思考與
   行動模式」這種固定收尾句敷衍帶過。 */
var FUSE_SYNTHESIS_TPL = [
  '因為{P}想要{coreNeed}，所以透過{S}「{motivation}」的方式運作；這股力量最常在「{lifeArea}」裡被看見。',
  '{coreNeed}是核心動機，{motivation}則是它運作的邏輯，兩者最常交會在「{lifeArea}」這個場景裡。',
];
var FUSE_SYNTHESIS_NOHOUSE_TPL = [
  '因為{P}想要{coreNeed}，所以透過{S}「{motivation}」的方式運作；本次因出生時間未知，暫不加入宮位這個變數。',
  '{coreNeed}是核心動機，{motivation}則是它運作的邏輯；宮位資料本次未知，不納入分析。',
];
/* growth 只保留「成熟時的樣子＋接下來可以練習什麼」一層提示，不疊三種說法
   （逐步練習…／成長方向是…／這裡的課題是…）。growthTask 本身已是完整的「練習...」
   建議句，因此用「接下來可以」這種不含「練習／功課／方向」字眼的接法承接它。 */
var FUSE_GROWTH_TPL = [
  '成熟時，你{matureExpression}，並{matureAim}；接下來可以{growthTask}。',
  '往成熟的方向走，你{matureExpression}；接下來可以{growthTask}。',
];
var FUSE_GROWTH_NOHOUSE_TPL = [
  '成熟時，你{matureExpression}，並{matureAim}。',
  '往成熟的方向走，你{matureExpression}，並{matureAim}。',
];
/* 純函式：不讀取 state／全域星盤設定，只依 planetDef 定義與傳入的落點資料
   （placement＝chart.planets[key] 的形狀 {sign,deg,retro,house}）與 unknownTime
   旗標運算，因此同一組輸入永遠得到同一組輸出，方便單獨測試。*/
