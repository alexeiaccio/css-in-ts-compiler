---
# cssints-djzw
title: Port the engine to TypeScript and Effect
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T14:34:21Z
updated_at: 2026-09-29T15:03:01Z
parent: cssints-vy0o
blocked_by:
    - cssints-vzd9
    - cssints-ny2w
---

## Question

Implement the decision of cssints-odi9. Blocked by the global sheet, so the port starts from the final emission code. Conditions and tokens wait for the port, to avoid porting them twice.

- [x] packages/cssints/src: plugin, macro, lib and runtime as `.ts` (with instrument, evaluate, sheet, errors and registry split out of plugin); every exported function is an Effect (`Effect.fn`; `Effect.fnUntraced` on per-declaration and per-site paths, see Notes) with `Data.TaggedError` errors (`Data.TaggedErrorClass` does not exist in effect 4.0.0-beta.107) that carry the file and offset of the call site; the plugin gives Vite `loc`, so the overlay points at the call. The sync `css.*` node builders (and `__at`/`__site`, which run inside user modules) are the exception; `cv()` is lazy now, its config is validated at its site.
- [x] packages/css-grammar/src: twin, support, rules and browsers behind Effect APIs with tagged errors (`ParseError` with position and expected labels; `InvalidValueError`, `UnknownPropertyError`, `RuleError`, `BrowsersError`); the type-level recognizer is unchanged. `values.ts` (Typed OM `CSS.px()`, `new CSSColorValue()`) stays synchronous: like the css.* builders, users call it in expressions. The recognizer, lexer and rules stay plain code (`twin-core.ts`) behind the Effect.fn boundary; per-declaration functions are `Effect.fnUntraced` because a span costs ~4 µs a call (see Notes)
- [ ] Budget: `packages/cssints/test/perf.mjs` per-module cost within 10% of the cssints-grrd numbers; `bun run bench` unchanged
- [x] tsconfig per package with the `@effect/language-service` plugin; `typecheck` = `tsgo -p tsconfig.json --noEmit` + `effect-tsgo diagnostics --project tsconfig.json --format pretty`, wired into `vp run` (`bun run typecheck` = `vp run --filter "./packages/*" --filter "!./packages/plugin-icon" typecheck`, part of `bun run check`; not `-r`, because plugin-icon has a `typecheck` script and syntax errors). `@effect/tsgo` went 0.0.15 -> 0.45.0 (0.0.15 has no `diagnostics`) and needs `@typescript/native` (TypeScript 7) patched by `effect-tsgo patch --typescript` in `prepare`; that alias takes over `node_modules/.bin/tsc`, so css-grammar `test` and `bench/budget.mjs` call TypeScript 5.9 by path.
- [ ] tsdown config for publishing `cssints` and `@cssints/css-grammar` (build only; publishing itself is fog)
- [ ] `vp lint` and `vp fmt --check` clean for packages/cssints, packages/css-grammar and apps/demo
- [ ] AGENTS.md: the typecheck commands and the one exception

Note from cssints-ny2w: the lint baseline is 1443 errors (1191 rule and 252 type errors, mostly no-unsafe-*) and fmt would change ~60 files. plugin-icon has 3 syntax errors that stop `vp fmt` and `vp check`: fix them, or exclude plugin-icon in `vite.config.ts`, since it is out of scope for 0.1.
