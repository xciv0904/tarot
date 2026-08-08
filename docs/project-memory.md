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
