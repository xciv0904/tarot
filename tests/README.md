# Test and Golden Baseline Guide

Run all checks with:

```sh
npm test
```

The Golden suite uses 12 synthetic structural charts and evaluates all 54 Question
Library entries, producing 648 answers. It checks evidence mapping, coverage,
repetition, empty/invalid text, terminology leaks, and question-specific content,
then compares the structured output with the approved snapshot.

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

