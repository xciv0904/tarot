# Architecture — Mystic Deck

## Current shape

This is a no-build static single-page site. Scripts share the browser global
context and `tests/natal-golden-regression.js` recreates enough browser state in a
Node `vm` to test the natal topic pipeline.

```text
index.html
  └─ js/app.js
       ├─ tarot/Lenormand data
       ├─ astrology data and Astronomy Engine
       ├─ knowledge layer + Question Library
       ├─ renderers and interaction
       └─ localStorage / copy / import-export
```

This coupling is a known constraint, not permission for a wholesale rewrite.

## Responsibility boundaries

- Astronomy calculation produces chart facts.
- Knowledge files interpret facts for a topic.
- Question definitions describe answer intent and evidence needs.
- Content planning assembles readable answers.
- UI code renders the result and handles interaction.
- Copy-to-AI formats existing facts; it must not recalculate or invent them.

## Change direction

For new work, prefer adding pure, named functions to the relevant data/knowledge
file and exposing only the minimum global API needed by `app.js`. Extracting old
code from `app.js` should be a separate, tested task.

## Offline and deployment

All runtime URLs must work below the `/tarot/` GitHub Pages base. When runtime
assets change, verify `sw.js` caching. Documentation and Node-only test changes do
not require a cache bump.

## Versioned contracts

Add schema versions to future exported user data and durable snapshots. Prefer
additive data changes. If an ID or storage shape must change, include migration and
backward-compatibility tests.

