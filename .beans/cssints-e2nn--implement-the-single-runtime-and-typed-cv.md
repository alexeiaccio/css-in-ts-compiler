---
# cssints-e2nn
title: Implement the single runtime and typed cv
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T14:25:47Z
updated_at: 2026-09-29T14:28:24Z
parent: cssints-vy0o
---

## Question

Implement `docs/API.md` "Runtime" (decided in cssints-lo9x).

- [x] Delete `packages/variants`; remove its references (workspace, docs, README)
- [x] `cx` in `packages/cssints/src/runtime.mjs`: strings, falsy values and nested arrays; a hand-written `.d.ts` next to it (`ClassValue = string | false | null | undefined | 0 | ClassValue[]`)
- [x] `cn` stays build-time only; check that it never reaches the bundle
- [x] `cv` takes css.* values (base and variant values are styles; `defaultVariants` as before); the CSS-string form and `parseStyles` are removed; `_cv` is unchanged
- [x] Migrate the fixtures and `apps/demo` (Card.tsx and the other cv users) to css.* values; the demo CSS keeps the same rules

## Summary of Changes

- Deleted `packages/variants` and its references (README, AGENTS.md, bun.lock). `docs/wayfinder.md` is untouched.
- `runtime.mjs`: `cx` flattens nested arrays. New `runtime.d.mts` (ClassValue, `cx`, `_cv`). New `test/runtime.mjs` checks `cx` and `_cv`.
- `cv` (macro.mjs) takes css values (node, `cn(...)`, `flex()` chain or one property) for `base` and every variant value. Anything else, including CSS strings, is a build error that shows the new form. `parseStyles` removed from lib.mjs. `_cv` unchanged.
- Fixtures: `cv.ts` (output) and `cv-string.ts` (error), both wired into `bun run test`. `perf.mjs` generator uses css values.
- Demo `Card.tsx` migrated. Built CSS is byte-identical to before; the JS bundle differs only by the new `cx`. No `cn`, `__site` or `toDecls` in the bundle.
