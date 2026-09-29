---
# cssints-e2nn
title: Implement the single runtime and typed cv
status: todo
type: task
tags:
    - wayfinder:task
created_at: 2026-09-29T14:25:47Z
updated_at: 2026-09-29T14:25:47Z
parent: cssints-vy0o
---

## Question

Implement `docs/API.md` "Runtime" (decided in cssints-lo9x).

- [ ] Delete `packages/variants`; remove its references (workspace, docs, README)
- [ ] `cx` in `packages/cssints/src/runtime.mjs`: strings, falsy values and nested arrays; a hand-written `.d.ts` next to it (`ClassValue = string | false | null | undefined | 0 | ClassValue[]`)
- [ ] `cn` stays build-time only; check that it never reaches the bundle
- [ ] `cv` takes css.* values (base and variant values are styles; `defaultVariants` as before); the CSS-string form and `parseStyles` are removed; `_cv` is unchanged
- [ ] Migrate the fixtures and `apps/demo` (Card.tsx and the other cv users) to css.* values; the demo CSS keeps the same rules
