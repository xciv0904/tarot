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

