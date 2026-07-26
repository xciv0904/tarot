# AI Agent Guide — Mystic Deck

Before editing, read:

1. `docs/project-memory.md`
2. `docs/architecture.md`
3. `docs/coding-style.md`
4. `docs/development-rules.md`
5. `README.md`

## Project facts

- Static GitHub Pages site; no build step and no application dependencies.
- Runtime code is classic browser JavaScript, not ES modules.
- `js/app.js` is a large integration file. Treat edits there as high-risk.
- Astrology calculations use vendored Astronomy Engine 2.1.19.
- Birth data and reading history stay in browser `localStorage`.
- Golden regression covers 12 synthetic charts × 54 questions.

## Non-negotiable rules

- Change only the requested feature. No opportunistic cleanup or file moves.
- Do not convert the codebase to modules, TypeScript, a framework, or a bundler
  unless explicitly requested.
- Do not change astronomical calculations, house system, aspect orbs, chart data
  shapes, tarot/Lenormand card IDs, or storage keys as a side effect.
- Knowledge and topic-answer code may interpret chart facts but must not alter
  calculated facts.
- Do not edit `assets/vendor/astronomy-engine-2.1.19.min.js`.
- Do not add API calls, analytics, secrets, or automatic AI submission.
- Do not commit real personal birth data or reading history.
- `npm run test:golden:update` is an approval action, not a routine fix. Never use
  it merely to make a regression test pass.
- When deployed files change, assess whether the service-worker cache version or
  asset list must change; do not bump it for documentation-only edits.

## Required workflow

1. Define goal, allowed files, protected behavior, and acceptance checks.
2. Inspect the owning code and adjacent data/tests.
3. Make the smallest coherent patch.
4. Run `npm test`.
5. If UI/runtime files changed, serve locally and test the affected flow.
6. Review the diff for unrelated formatting and private data.
7. Report behavior changed, behavior intentionally unchanged, and checks run.

## Stop and ask

Stop before changing a public ID/data shape, calculation convention, snapshot,
storage format, vendored library, dependency policy, or repository-wide structure.

