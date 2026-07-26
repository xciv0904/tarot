# Scoped Development Rules

Start every task with:

```text
Goal:
Allowed files:
Protected behavior:
Acceptance checks:
Out of scope:
```

## Forbidden without explicit approval

- Repository-wide formatting, renaming, moving, or cleanup
- Framework, bundler, dependency, or ES-module migration
- Changes to card IDs/images, storage keys, exports, or chart schemas
- Changes to house/orb/time conventions hidden inside a UI task
- Direct edits to vendored minified code
- Snapshot regeneration to silence a failure
- New network calls, analytics, storage, or automatic AI requests
- Mixing tarot, Lenormand, and astrology edits when only one is requested

## Default scope

| Task | Allowed by default | Protected |
|---|---|---|
| Card meaning | Relevant reading data/test | Astrology and UI structure |
| Astrology fact | Calculation path + focused tests | Interpretations and cards |
| Topic answer | Knowledge/question data + Golden tests | Chart calculations |
| UI | Named DOM/CSS/renderer region | Facts, IDs, snapshot |
| Offline cache | `sw.js` + affected asset checks | Feature behavior |

## Golden change policy

On snapshot mismatch, inspect the changed cases and cause first. Regenerate only
after the intended wording/logic change is accepted, quality reports pass, and the
diff contains no unrelated answer drift.

