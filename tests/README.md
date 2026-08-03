# Test and Golden Baseline Guide

Run all checks with:

```sh
npm test
```

The Golden suite uses 12 synthetic structural charts and evaluates all 54 Question
Library entries, producing 648 answers. It checks evidence mapping, coverage,
repetition, empty/invalid text, terminology leaks, and question-specific content,
then compares the structured output with the approved snapshot.

## Reading copy quality

`reading-copy-quality.js` renders every category x subtopic x eight card draws and
checks the *shape* of the resulting text, not its wording: no half-width commas in
Chinese sentences, every output ends with punctuation, no malformed punctuation
pairs, a budget for filler phrases such as "還在醞釀" / "保持彈性", no single
sentence occupying more than 30% of a field, and no unreplaced `{kw}` templates.

Rewriting copy will not trip it. Reintroducing the defects it was written for will.

## Astro copy quality

`astro-copy-quality.js` runs the natal topic pipeline over the Golden charts and
checks the same kind of surface defects on the astrology side: detail text that
merely restates its own label, missing sentence-ending punctuation, detail text
already fully contained in the headline still being rendered, unexplained jargon
outside a `<details>` fold, and half-width commas.

Terminology inside `<details>` folds and the "進階解讀" sections is deliberate and
is not counted.

## UX structure regression

`ux-structure-regression.js` asserts the structural fixes from the 2026-08 site-wide
UX pass so they cannot be silently reverted: `<main>`/`<nav>`/skip-link landmarks,
an `h2` on every screen, zero `alert()` calls in the astrology flow, the chart
identity bar and its fields, the four-part freshness key for topic results
(`topicId` + `chartFingerprint` + `promptVersion` + `knowledgeVersion`), scroll
preservation and expanded-state persistence when switching reading depth, the
design-token block, and the absence of body text below the AA contrast threshold.

It also boots the runtime in a VM to check that `renderChartIdentityBar()` and
`renderAstroNotice()` degrade to empty strings, that development diagnostics stay
out of production output, and that `chartFingerprint` actually differs across
charts and across the unknown-birth-time flag.

## UI render smoke

`ui-render-smoke.js` renders 13 screens and states (including empty, error and
"chart was changed" states) and checks structural invariants the string-built UI
has no other guard for: HTML tag balance, `<details>`/`<summary>` pairing, heading
order without skipped levels, buttons with an accessible name, and hard-coded
widths above 320px.

It additionally asserts that professional mode *adds to* rather than replaces the
general-mode conclusions, that weights never leak into general mode, and that the
copy-for-AI payload is byte-identical in both modes — simplifying the screen must
never simplify the export.

## Protected files

- `golden-charts.js`: synthetic chart structures
- `snapshots/natal-topic-baseline.json`: approved output baseline
- `reports/natal-topic-quality.*`: machine/human review material

`npm run test:golden:update` rewrites the approved baseline and reports. Use it only
for an intentional, reviewed interpretation change—never as the first response to
a failing test.

## Future calculation Golden Charts

The existing fixtures test interpretation structures, not astronomical accuracy.
Add a separate calculation suite before changing chart math. It should use
privacy-safe inputs, record timezone/location, library version, house/orb
conventions, and compare key chart facts with an independent trusted reference.

