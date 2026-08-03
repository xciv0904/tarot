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
