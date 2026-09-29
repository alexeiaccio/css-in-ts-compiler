---
# cssints-v63t
title: 'Typed public surface: property functions for users'
status: todo
type: task
priority: normal
tags:
    - wayfinder:prototype
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T16:34:28Z
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
