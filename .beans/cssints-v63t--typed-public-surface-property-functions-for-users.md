---
# cssints-v63t
title: 'Typed public surface: property functions for users'
status: completed
type: task
priority: normal
tags:
    - wayfinder:prototype
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T17:00:36Z
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
- [x] 4. apps/demo type-checks with tsgo and tsc 5.9 (in `bun run typecheck`); demo errors fixed and reported
- [x] 5. Cost: demo check numbers, bench importing "cssints", editor latency (tsgo LSP), unused import cost
- [x] 6. Type tests in packages/cssints/test/types/ under `bun run typecheck`

## Summary of Changes

- `src/types.ts`: `Style` (a branded class string), `Prop<P, R>` (variadic `Valid` check over strings, Typed OM values and a lone number: `⟨length⟩` in padding*/margin*/gap*/inset*, a `<number>` elsewhere; a `Style` as a part is `⟨style⟩`, so it fails), `Chain<M>` with `method -> property`, `Wrap`, `cn`, `style` and `CvConfig` over `Style`. `scripts/members.ts` writes `Prop<"padding-left">` per member (short names map to their property) and the method maps of `FlexMethods`/`GridMethods`.
- The error still lands on the first argument (per-part blame needs a prefix check, and a prefix of a valid value can be invalid). An empty call is an arity error.
- Type tests in `test/types/` (members, chain, conditions, tokens); the lint rule `no-unsafe-call` is off there.
- `apps/demo` type-checks with tsgo and tsc 5.9 (`bun run typecheck`). No real errors: every demo value is valid.
- `budget.mjs` takes a directory; `packages/cssints/bench/` has `users.ts` (~100 calls, chains, cv, conditions, tokens), `unused.ts` and `lsp.mjs`.
- Cost (before -> after): demo tsc 171k -> 554k instantiations, 1.9 s -> 2.1 s total; demo tsgo 188k -> 894k, 0.22 s -> 0.36 s. users.ts tsc 173k -> 710k (check 0.45 s -> 1.1 s), tsgo 179k -> 717k (0.12 s -> 0.44 s). Import-only file: +1.1k instantiations, +3 ms tsgo, +17 MB tsc. LSP on Button.tsx: 180-235 ms per edit (4-8 ms before).
- Known gap, not from this ticket: `calc()`/`min()` are not in the recognizer, so `width("calc(100% - 2rem)")` is a type error and a build error.
