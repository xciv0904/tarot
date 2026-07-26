# Project Memory — Mystic Deck

Last verified against repository: 2026-07-27

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
| `js/app.js` | UI orchestration, chart/readings logic, rendering, persistence |
| `js/data/reading-data.js` | Tarot and Lenormand reading content |
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

`npm test` runs syntax checks plus Golden regression. Snapshot regeneration uses
`npm run test:golden:update` and requires explicit review. Reports live under
`tests/reports/`; the baseline lives at
`tests/snapshots/natal-topic-baseline.json`.

## Privacy and safety

Birth profiles, readings, and learning progress remain on device. Copy-to-AI is
user initiated. Do not add automatic transmission or commit exported user data.

## Durable decisions

| Date | Decision | Reason |
|---|---|---|
| 2026-07-27 | Keep the current classic-script, no-build architecture | Preserve direct GitHub Pages deployment |
| 2026-07-27 | Treat Golden snapshot updates as reviewed changes | Prevent accidental content drift |

