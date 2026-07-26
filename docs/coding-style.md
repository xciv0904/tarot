# Coding Style — Mystic Deck

- Follow the existing classic JavaScript style; do not introduce imports/exports
  into browser files without an approved migration.
- Use `const`/`let` in new code unless a file's global-loading contract requires a
  top-level `var`.
- Prefer small pure helpers and explicit domain names.
- Avoid adding more mutable globals; namespace unavoidable browser globals.
- Keep machine keys separate from Traditional Chinese labels.
- Validate imported profiles and stored data before use.
- Keep numerical facts numeric and document degrees, timezones, and tolerances.
- Use semantic HTML, labelled controls, keyboard access, visible focus, and reduced
  motion support.
- Reuse existing CSS tokens/patterns; avoid unrelated restyling.
- Comments should explain a calculation or interpretation decision, not restate
  code.
- Synthetic fixtures are preferred. Never place real private birth data in tests.

Before committing JavaScript changes, run `npm test`. Do not reformat the large
`index.html` or `js/app.js` outside the edited region.

