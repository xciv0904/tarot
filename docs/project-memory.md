# Project Memory — Mystic Deck

Last verified against repository: 2026-07-28

## Product

Mystic Deck is a Traditional Chinese static web app combining tarot, Lenormand,
and Western astrology. It includes natal, transit, synastry, progression, learning,
history, and AI-copy tools. It does not call an AI service.

## Technical baseline

- Hosting: GitHub Pages from repository root
- Runtime: HTML, CSS embedded in `index.html`, classic JavaScript
- Build: none
- Tests: Node.js, with no installed package required
- Offline: `manifest.json`, root `sw.js`
- Astronomy: vendored Astronomy Engine 2.1.19
- Persistence: browser `localStorage`

## Actual module map

| Path | Responsibility |
|---|---|
| `index.html` | App shell, styles, major DOM structure |
| `js/app.js` | Shell, navigation, tarot/Lenormand reading UI, learning system, persistence |
| `js/data/astro-advanced.js` | All astrology UI/engines, lazy-loaded with the astrology bundle |
| `js/data/reading-data.js` | Card lists, spreads, categories, question presets |
| `js/data/reading-rich-data.js` | 78-card full meanings (`RICH`), lazy-loaded after first paint |
| `js/data/card-images.js` | Stable card-to-asset mapping |
| `js/data/astrology-core-data.js` | Core astrology labels/content |
| `js/data/astrology-points-data.js` | Point definitions/content |
| `js/data/astrology-placement-templates.js` | Placement copy templates |
| `js/data/astrology-aspect-data.js` | Aspect interpretation data |
| `js/data/astrology-knowledge-layer.js` | Evidence normalization/knowledge logic |
| `js/data/astrology-knowledge-dataset.js` | Topic-aware knowledge dataset |
| `js/data/astrology-natal-topics-data.js` | 8 topics and 54-question library |
| `tests/golden-charts.js` | 12 synthetic structural charts |
| `tests/natal-golden-regression.js` | 648-answer quality/snapshot regression |

## Stable interpretation pipeline

`chart facts → evidence → canonical evidence → question definition → knowledge
dataset → topic/question projection → content planner → quality checks → UI`

Do not bypass this pipeline by adding question-specific prose directly in a
renderer.

## Protected contracts

- Card IDs and asset filenames
- Existing `localStorage` keys and export/import shape
- Chart object fields consumed by natal analysis
- Question IDs, `questionFocus`, and `answerTargets`
- Golden snapshot semantics
- Static-hosting and offline behavior

## Confirmed conventions

| Decision | Value |
|---|---|
| Astronomy library | Astronomy Engine 2.1.19 |
| Golden fixture house system | Whole sign (`houseSystem: "whole"`) |
| Golden chart privacy | Synthetic structural charts |
| Topic selection limit | At most 3 questions per UI analysis |
| Question Library | 8 topics, 54 questions |

Production natal house/orb/timezone conventions should be documented here after
they are traced and independently verified. AI agents must not guess them.

## Testing baseline

`npm test` runs syntax checks, reading-question alignment, reading copy quality
(`tests/reading-copy-quality.js`), and the Golden regression. Snapshot regeneration uses
`npm run test:golden:update` and requires explicit review. Reports live under
`tests/reports/`; the baseline lives at
`tests/snapshots/natal-topic-baseline.json`.

Baseline hash `8cf6ecf29baa0c51` (2026-07-28). It was regenerated twice on that day,
both times with explicit approval and a verified diff:

| From | To | Change | How the diff was verified |
|---|---|---|---|
| `9b2247a368651a61` | `cbddeea76e602c91` | 「界線」 rewritten as 「底線」／「分寸」 | All 220 changed lines contained 「界線」; 0 changed lines did not |
| `cbddeea76e602c91` | `8cf6ecf29baa0c51` | Detail text: strip label echo, add sentence-ending punctuation | Only the `details` field changed; all 1308 new values matched `old.endsWith(new_without_period)` |
| `65fc2e7938526355` | `924d9e3d6bc28e41` | `general-inner-tension`: repair quote-broken headlines, stop the detail restating the headline | 20 of 7204 snapshot leaves changed, all on that one question (12 cases, fields `headline` and `details/0/text`); the other 53 questions are byte-identical. Unbalanced 「」 in the snapshot went 8 → 0 |
| `924d9e3d6bc28e41` | `e477f4c642430fa5` | `general-inner-tension`: pick the two poles from the chart's actual hard aspects instead of two planets of the same element | 24 of 7204 snapshot leaves changed, all on that one question, fields `headline` and `details/1/text`; same-flavour pole pairs went 12/12 → 0/12, and the 12 charts now produce 4 distinct pairings instead of 4 fixed element presets |

## Privacy and safety

Birth profiles, readings, and learning progress remain on device. Copy-to-AI is
user initiated. Do not add automatic transmission or commit exported user data.

## Durable decisions

| Date | Decision | Reason |
|---|---|---|
| 2026-07-27 | Keep the current classic-script, no-build architecture | Preserve direct GitHub Pages deployment |
| 2026-07-27 | Treat Golden snapshot updates as reviewed changes | Prevent accidental content drift |
| 2026-07-28 | Split `RICH` and all astrology code out of `app.js` into lazy-loaded files | First-load JS was 962KB for a page that only shows one card |
| 2026-07-28 | Add `tests/reading-copy-quality.js` as a required check | Card-side copy had no regression coverage at all |
| 2026-07-28 | Replace 「界線」 with 「底線」／「分寸」／plain paraphrase across all 83 sites | Self-help jargon; unclear to a first-time reader |
| 2026-07-28 | Strip label-echoing prefixes from natal detail text; suppress details already contained in the headline at render time | 60% of answers repeated themselves; validator forbids dropping details from the data |
| 2026-07-28 | Add `tests/astro-copy-quality.js` as a required check | Golden checks whether answers changed, not whether they read well |
| 2026-07-29 | Natal copy-to-AI defaults to a data-only pack (`buildAstroDataPackText`); the prose version is opt-in | Measured on one chart: only 7.8% of the 31,024-character export was actual chart data. Given nine parts pre-written interpretation, an external model rewrites our text instead of reading the chart itself, which is the one thing it does better than our templates |
| 2026-08-03 | 建立 `:root` 設計 token 並要求新程式碼一律使用 `var(--…)` | `#c9a96e` 硬寫 184 次、`#f0e9d8` 134 次；先收斂成同值的變數，視覺零變動，之後可逐步替換 |
| 2026-08-03 | 全站正文灰字最低透明度提高到 `.62`（原本有 131 處低於 `.5`） | `.45` 在 `#14111a` 上約 4.0:1，未達 WCAG AA 的 4.5:1 |
| 2026-08-03 | 星盤流程移除所有 `alert()`，改用 `state.astroNotice` 頁內訊息 | `alert()` 阻塞畫面、無法被輔助技術當作頁面內容讀取、訊息關閉後不留痕跡；改版後錯誤訊息會說明「發生什麼／哪些資料還在／下一步」 |
| 2026-08-03 | 結果頁固定顯示「目前命盤」身分列（日期・時間・地點・時區・宮位制・黃道） | 使用者可以反覆改資料重算，先前畫面上完全沒有辦法確認眼前結果來自哪一組出生資料 |
| 2026-08-03 | 主題卡片的「為什麼這樣說？」展開狀態綁進 `state.natalTopicExpanded` | `state.natalTopicExpanded` 原本宣告後從未被讀取；未受控的 `<details>` 在每次 `render()` 都會塌回收合 |
| 2026-08-03 | 新增 `tests/ux-structure-regression.js` 與 `tests/ui-render-smoke.js` 為必跑檢查 | 既有測試只驗證文字內容，完全不碰渲染函式；標籤不平衡、標題階層、無名稱按鈕、快取鍵、AI 複製完整性都沒有守門 |
| 2026-08-03 | `inner_tension_balance` 的大標題上限從 30 字放寬到 42 字 | 這一題的結論本體是「拉扯在 A 和 B 之間」，兩個需求名稱各約 15 字，30 字內放不下兩極；只留一極的話「拉扯」語意不成立。上限同時放寬於 `compactNatalHeadline()`、`tests/natal-topic-audit.js`、`tests/natal-golden-regression.js` 三處，新增例外必須說明為什麼該題答案無法壓進 30 字 |
| 2026-08-03 | 標題裁切一律不得切斷「」配對 | `compactNatalHeadline()` 只認 `，、；` 當切點，會切在引號內的頓號上，產生「主要拉扯在「保留思考。」這種未閉合殘句（648 份答案中 8 份） |
| 2026-08-03 | `tests/astro-copy-quality.js` 的引號成對與條件句誤斷檢查掃全部 648 份，不沿用 288 份取樣 | 該檔其他檢查只取每主題前 3 題；出問題的 `general-inner-tension` 不在取樣內，沿用同一份樣本會讓測試對已知會壞的輸入也「通過」 |
| 2026-08-03 | `inner_tension_balance` 的兩極改由本命盤實際的四分／對分相位決定，並禁止同調性配對 | 原本依主導元素挑「同一元素的兩顆行星」，而同元素本來就同調性：風象挑出 Mercury（保留思考、交流與變動空間）與 Uranus（保有自由並嘗試不同做法），使用者回報「兩個東西看起來是一樣意思」。四組元素預設裡有三組（火／風／水）根本不構成對立。張力相位才是占星學上「拉扯」的字面來源，而且每張盤不同，答案會真的因人而異 |
| 2026-08-03 | 每日的幸運色／數字／時段改由命主星（上升星座的傳統守護星）推導，行星日退居敘述句背景 | 這三項原本全部掛在「行星日」上，而行星日只看星期幾——同一天全世界完全相同，換命盤不會變。使用者回報「不管哪張星盤都一模一樣」。命主星在傳統占星裡代表本人，不同上升就不同行星，個人化才站得住腳。出生時間未知時退回太陽星座守護星，並在畫面上據實說明 |
| 2026-08-03 | 行星時採用傳統守護星（`SIGN_RULER_TRADITIONAL`）而非 `SIGN_RULER_MODERN` | 現代守護星會給出天王／海王／冥王，但行星日與迦勒底次序只有七顆古典行星，顏色與數字對應也只有這七顆。行星時本來就是傳統技法，配傳統守護星才一致 |
| 2026-08-03 | 星盤儲存格式從單筆 `tl_astro_profile` 改為 `tl_astro_charts`（最多 10 張＋activeId） | 最常見的使用情境是幫家人朋友看盤，先前換一個人就得覆蓋自己的。遷移在 `astroChartsLoad()` 一次完成：有新 key 就用新 key，否則把舊 profile 包成單筆「我的星盤」。**舊 key 刻意不刪**——它只佔幾百 bytes，留著等於保有回退能力，而且 `astroSaveProfile()` 仍同步寫回目前啟用的那一組，退回舊版本也讀得到 |
| 2026-08-03 | 相同出生資料不建立第二張盤；修改既有盤是就地更新 | 否則每按一次「生成星盤」就多一張重複的盤，10 張上限很快用完 |
| 2026-08-03 | 分享圖不得包含出生日期、時間與城市 | 使用者要公開的是解讀，不是自己的出生資料；貼到社群後收不回來。已寫成回歸測試 |
| 2026-08-03 | 歷史紀錄以 `kind` 區分占卜與星盤，缺欄位一律視為 `reading` | 舊使用者本機最多有 30 筆沒有 `kind`／`outcome` 的紀錄，所有讀取端必須走 `historyEntryKind()`／`historyEntryOutcome()` |
| 2026-08-03 | 不做出生時間校正，改列出當天所有可能的上升區間 | 校正需要逐一比對行運與推運，而且結果高度依賴事件選擇——同一組事件常能對應到好幾個不同的上升。用幾個年份就宣稱推出上升是假精確。改成把當天實際會經過的上升與時間區間列出來（全部是排盤結果），判斷交給使用者，並在畫面上明講「那是你的判斷，不是本站的結論」 |
| 2026-08-03 | 上升區間預設收合並加快取 | 要跑 73 次完整排盤，實測 900ms；`render()` 每次都呼叫的話畫面每次重畫都會凍住將近一秒 |
| 2026-08-03 | 今日一牌整塊從首頁移除，主入口改為「抽一張牌」 | 今日一牌是系統依日期指定的、被動的一張牌，而「直接抽一張」原本埋在折疊的「其他功能」裡。抽牌是使用者自己的動作，參與感不同，而且抽完就是一次完整占卜流程，可以存進紀錄、可以回填後來發生的事。首頁從約 8200 字元降到 4900。**上一版曾把今日一牌改成裝置專屬種子並依牌面比例放大卡框（170×357），實測整張卡佔掉半個螢幕反而難看，兩者都已隨區塊移除一併回退** |
| 2026-08-03 | `CARD_ART_RATIO = 0.6` 保留為常數 | 牌面圖一律 420×700（縮圖 300×500）。需要讓圖片填滿容器的版面請從這個比例推導高度，不要各自寫死；但「填滿」不等於好看——卡框留白看起來就像牌邊，不一定要消除 |
| 2026-08-03 | 「複製給 AI」的測試改以 onclick 函式名比對，不用按鈕文字 | 占卜結果那顆按鈕的標籤是動態組出來的（`state.copied ? … : …`），用字面比對會漏掉它——實際上就漏了 3 顆（占卜結果、二次推運、運勢） |
| 2026-08-10 | 合盤從「一個相位一張卡」改為「關係模式聚合」 | 原本 `renderSynastry()` 取前 10 組相位，每組輸出四段完整解讀，而 `crossAspectEveryday()` 的文案只由相位「類型」決定（5 套模板），兩個名詞代入後所有合相讀起來一樣；標題直接用內部語義串接（「你的情緒反應與安全感 × 對方的想像、同理與理想化傾向」）。現在 `buildSynastryPatterns()` 把支持同一主題的相位聚合成 9 個關係模式，預設只展開前 3 個。**聚合只改變呈現，不改變計算**——每個 pattern 保留 `aspects`／`supporting`／`conflicting` 原始參照 |
| 2026-08-10 | 合盤的相反訊號必須整合成一張卡，不得各寫一篇 | 順向與張力權重比 ≥0.45 時走 `mixed` 文案，明講「平常哪一面較強、什麼情境會切換」。只有合相、兩側皆 0 時標為 `intense`（放大）而非 `mixed`——mixed 的文案在講「同時有靠近與拉開的訊號」，沒有張力相位時那是不實描述 |
| 2026-08-10 | 移除合盤首屏的單一「相性指數」大分數 | 合盤不該被壓成一個數字。分數仍計算（敘述與 AI 複製會用），但不再是頁面的第一個結論；改為 30 秒摘要（相處核心＋容易靠近／最容易卡住／相處關鍵） |
| 2026-08-10 | 牌典數字公式從「速查關鍵字」改為「發展階段原型」 | 原本的數字定義是從單張牌義倒推的：3＝合作（錢幣三）、5＝損失（錢幣五）、8＝行動（權杖八）、9＝焦慮（寶劍九）。最明顯的證據是 3 那一列自己標了「例外：寶劍三＝心碎」——需要標例外就代表定義不成立。現在數字＝事情發展到哪個階段，花色＝發生在哪個領域，兩者相乘才得到單張牌；每個階段的四花色說明都寫成「因為…所以…」，讓推導邏輯看得見 |
| 2026-08-10 | 牌典採 Progressive Disclosure，列表只給名稱＋一句核心＋關鍵字 | 深入內容（核心概念、為什麼走到這裡、正向／陰影、四花色變化、先問自己、常見誤區）點開才出現。回歸測試斷言收合狀態不得輸出深入內容，且展開後內容要明顯增加 |
| 2026-08-10 | 牌典的「自己試著解牌」不做計分或積分 | 目的是建立推導能力；一旦有分數，使用者會開始猜答案而不是想推導過程。題目由數字 × 花色即時組出，答案來自同一份知識資料，不另寫一份 |
| 2026-08-10 | 大阿爾克那用「三階段旅程＋七組直行對應」當推導骨架 | 大牌沒有數字×花色可推導。把 1–21 排成三列七行後，同一行的三張在講同一課題的三種層次（1魔術師／8力量／15惡魔＝怎麼駕馭力量；2女祭司／9隱士／16塔＝隱藏的東西怎麼被看見）。這是牌陣結構本身、不是自創，讓使用者能從已經懂的牌推到還不懂的。愚人 0 在整條路之外，不屬於任何一行 |
| 2026-08-10 | 大牌的數字呼應只寫 1–10，11–21 不寫 | 1魔術師↔A開始、9隱士↔9獨自承受這類對應站得住腳；硬替 11–21 套數字會製造看起來精確、實際牽強的關聯。回歸測試斷言 `numberEcho` 恰好 10 筆 |
| 2026-08-10 | 占卜精靈 Step 3 改為「一個必要決策＋兩個收合的選填」 | 原本連續攤開主問題、面向多選、自由輸入三個大型區塊。實際上只有 `state.subtopic` 是必要的——它驅動 `cardSubtopicReading()` 與 `readingSchemaFor()` 的 questionId/intent/questionFocus/answerTarget；`wizFocusSel` 與 `question` 只進 `copyForAI()` 的提示詞。所以主問題留在主層級、CTA 直接是「開始解讀」，另外兩個收合並標示選填 |
| 2026-08-10 | 面向選擇攤平成單一清單，分組標題不再外露 | 「單身、曖昧中或還沒在一起」「自我成長（任何狀態都適用）」是網站內部的 taxonomy，使用者沒有義務理解。初始只顯示 5 個，其餘在「更多面向」 |
| 2026-08-10 | 自我成長類面向移到結果頁的延伸探索（題目不刪除） | 抽「未來可能遇到什麼類型的人」卻先要你選「我在感情中的慣性模式」是時機不對。`FOCUS_FOLLOWUP_GROUPS` 標記哪些分組屬於看完解讀之後才適合探索；`focusFollowUpOptions()` 另外補上這次沒選到的面向。點延伸探索會清掉上一次的牌並明講需要重新抽 |
| 2026-08-10 | 建立階層式 `QUESTION_TAXONOMY` 與 `FOCUS_AREA_REGISTRY`，取代靠分組粗篩的假連動 | 舊的 `SUBTOPIC_FOCUS_GROUPS` 對應的是「分組」而不是「題目」，只能把 4 個分組篩掉幾組。實測 35 個 primary 中有 18 個（51%）與同類其他 primary 拿到完全相同的初始面向，family 更是 4 個 primary 只產生 1 種清單；placeholder 與 examples 掛在 category 上同類共用。新結構讓 category → primary → allowedFocus → examples → placeholder → payload 每一層都真的控制下一層 |
| 2026-08-10 | Assumption Guard：面向宣告 `requires`，primary 宣告 `assumptions`，不滿足就不出現 | 這是「未來對象不會出現『對方目前對我的感受』」的實作——該面向 `requires.specificPerson`，而未來對象的 assumptions 沒有這一項。不再靠 question text 或 substring 判斷 |
| 2026-08-10 | `buildReadingPayload()` 保留語意角色，且 Tarot only 不得夾帶命盤資料 | payload 分開保存 category／spread／readingMode／primaryQuestion(含 intent)／focusAreas(含 semanticFocus)／customContext／tarotCards／astrologyContext，不拼成單一字串。`readingMode !== 'combined'` 時 `astrologyContext` 強制為 null |
| 2026-08-10 | 遷移採分階段：love／career／family 先行，其餘六類沿用舊行為 | 一次做完九類必然要用規則自動生成 mapping，那正是現在這套失敗的原因。未遷移的分類在稽核報告標 WARNING，`taxonomyHasCategory()` 決定走新舊哪一套 |
| 2026-08-10 | Taxonomy 接上 UI 時，主問題的選項與 key 維持不變 | 舊的 `SUBTOPICS` key 直接驅動 `cardSubtopicReading()` 與 `readingSchemaFor()`，換成 taxonomy id 會讓整個解讀引擎失效。改成每個 taxonomy primary 帶 `legacyKey` 掛在舊題目旁邊，由 taxonomy 控制面向、範例、placeholder 與牌陣推薦——使用者回報的「前面選的問題沒有作用」正是這一段 |
| 2026-08-10 | 面向清單來源由 `focusOptionsForCurrent()` 決定 | 已遷移的分類走 taxonomy（依主問題），未遷移的走舊分組篩選。畫面上顯示「已依你選的『X』整理相關面向」只在真的重算過時才出現 |
| 2026-08-10 | 九個分類全部遷移到 taxonomy，決策類從零建立題庫 | 決策原本在 Step 1 有入口但 `SUBTOPICS.decision` 與 `topicQuestionConfig.decision` 都不存在，等於整個題庫是空的。新增 6 個 intent：A/B 選擇、要不要做、現在或等待、留下或離開、接受或拒絕、方向未明。它沒有舊 key，`taxonomyPrimaryForSubtopic()` 因此同時支援 legacyKey 與 taxonomy id 兩種對應 |
| 2026-08-10 | health 與 wealth 帶 `safetyRules`，並由測試守住用詞 | 健康面向不得出現疾病／診斷／罹患／用藥等診斷式用語；財運面向不得出現保證／必賺／報酬率／漲跌。免責只在分類層級講一次，不塞進每張卡片 |
| 2026-08-10 | 結果頁延伸區塊拆成「不需重新抽牌」與「需要重新抽牌」兩區 | 原本所有延伸題都是一排大卡片、右側只有「›」，點一下就清空牌面跳回問題設定。affordance 完全像展開看內容，實際卻是離開解讀。現在 A 區（這組牌最重要的訊息、每張牌在牌位的作用等）用現有牌面即時回答、直接展開；B 區才是新問題 |
| 2026-08-10 | 需要重新抽牌的操作一律兩階段：選題 → inline 確認 | 第一次點擊只選取，展開後才出現「用這題開始新占卜」與「取消」。不用 modal、不用 `confirm()`。測試斷言未確認前畫面上不存在任何 `confirmFollowUpQuestion` 入口 |
| 2026-08-10 | 開新占卜前先把目前解讀完整快照到 `state.previousReading` | 新流程未完成前都能用「← 回到上一個解讀」原樣返回。新問題不會沿用舊牌、不會自動選好面向、不會沿用舊的主問題——舊牌不能當成新問題的證據 |
| 2026-08-11 | 合盤的五面向分數移到雙人連線圖之前 | 使用者回報「合盤裡面的分數怎麼不見了」。分數沒有被刪，是被連線圖推出第一屏——連線圖在手機上很高，夾在結論敘述與數字之間，滑到一半只看得到一張圖。順序調換不影響任何計算，兩者用同一份 aspects。單一「相性指數」大分數維持移除 |
| 2026-08-12 | 語義槽位值一律是單一片語，不得寫成含逗號的完整句 | 使用者看到「壓力多半在無法感受氣氛。」。Neptune 六個槽位當初被寫成完整句（need=「安靜思考、保留想像空間，也獲得情感回應」），嵌進「壓力來源是缺少{need}」變成「缺少 A、B，也 C」——否定沒有分配到第三項，語意剛好相反。槽位是給框架填的零件，不是句子 |
| 2026-08-12 | 縮短標題不得切開成對框架，也不得切在前置狀語結尾 | 「在⋯時」「因⋯而」「為了⋯而」被切掉後半，剩下的字全在、句子卻沒有謂語，字尾檢查看不出來。新增 natalCutKeepsFrame() 與 natalCutIsFrontedAdverbial()，四個切點路徑統一走 natalCutUsable() |
| 2026-08-12 | 沒有可用切點時保留完整句子，不硬切到 30 字 | 30 字是顯示軟上限，句子完整是硬要求。硬切產生的「⋯或讓成果。」「⋯選擇中，容。」比一行超出幾個字糟得多。回退只在標點邊界進行 |
| 2026-08-12 | 單字元的「懸空字尾」黑名單不可靠 | 一度把「會／要／能／被／讓」加進字尾檢查，結果「機會」「需要」「才能」「退讓」這些名詞收尾全被誤判，把「思考優勢是整合、教導與看見長期機會」砍成「思考優勢是整合、教導」。已回退為原本的保守集合 |
| 2026-08-12 | Golden e477f4c642430fa5 → 7f35b9a867161134 | 104 個欄位變動，23 個 headline。逐條比對過：13 條是修好的斷句（「財務上較容易因把猜測當成事實。」→「⋯或過度承接他人情緒而偏離計畫。」），其餘為 Neptune 改寫後的等義敘述，沒有一條變差 |
