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

