---
# cssints-v63t
title: 'Typed public surface: property functions for users'
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:prototype
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T16:53:33Z
parent: cssints-vy0o
blocked_by:
    - cssints-5dbi
    - cssints-unkt
    - cssints-lmru
    - cssints-79xr
---

## Question

`cssints` ships `.mjs` with no types. Typed functions exist only in `css-grammar/src/api*.ts`, for about 10 properties, and `apps/demo` has no tsconfig, so nothing checks it.

Prototype the `.d.ts` users get: generated from the property list by a script in `packages/cssints/scripts/`, one `TypedPropertyFn` per exported name (per the API shape decision), exported both as the namespace and as named exports. Add a tsconfig to `apps/demo` and make it type-check with tsc and tsgo. Measure editor latency on a demo file (tsgo LSP) and the budget.

## Checklist

- [x] 1. Members generated as Prop<"property">, short names mapped; Prop is variadic over Valid, numbers for spacing / <number>
- [x] 2. flex()/grid() chain methods typed with their properties; cv config values typed as styles
- [x] 3. Tokens and conditions compose with typed members
- [ ] 4. apps/demo type-checks with tsgo and tsc 5.9 (in `bun run typecheck`); demo errors fixed and reported
- [ ] 5. Cost: demo check numbers, bench importing "cssints", editor latency (tsgo LSP), unused import cost
- [ ] 6. Type tests in packages/cssints/test/types/ under `bun run typecheck`
