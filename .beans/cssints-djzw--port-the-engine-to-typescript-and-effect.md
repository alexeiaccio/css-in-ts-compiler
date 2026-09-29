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

- [ ] packages/cssints/src: plugin, macro, lib and runtime as `.ts`; every exported function is `Effect.fn` with `Data.TaggedErrorClass` errors that carry the file and position of the call site (so the Vite overlay points at it). The sync `css.*` node builders are the one exception.
- [x] packages/css-grammar/src: twin, support, rules and browsers behind Effect APIs with tagged errors (`ParseError` with position and expected labels; `InvalidValueError`, `UnknownPropertyError`, `RuleError`, `BrowsersError`); the type-level recognizer is unchanged. `values.ts` (Typed OM `CSS.px()`, `new CSSColorValue()`) stays synchronous: like the css.* builders, users call it in expressions. The recognizer, lexer and rules stay plain code (`twin-core.ts`) behind the Effect.fn boundary; per-declaration functions are `Effect.fnUntraced` because a span costs ~4 µs a call (see Notes)
- [ ] Budget: `packages/cssints/test/perf.mjs` per-module cost within 10% of the cssints-grrd numbers; `bun run bench` unchanged
- [ ] tsconfig per package with the `@effect/language-service` plugin; `typecheck` = `tsgo -p tsconfig.json --noEmit` + `effect-tsgo diagnostics --project tsconfig.json --format pretty`, wired into turbo
- [ ] tsdown config for publishing `cssints` and `@cssints/css-grammar` (build only; publishing itself is fog)
- [ ] `vp lint` and `vp fmt --check` clean for packages/cssints, packages/css-grammar and apps/demo
- [ ] AGENTS.md: the typecheck commands and the one exception

Note from cssints-ny2w: the lint baseline is 1443 errors (1191 rule and 252 type errors, mostly no-unsafe-*) and fmt would change ~60 files. plugin-icon has 3 syntax errors that stop `vp fmt` and `vp check`: fix them, or exclude plugin-icon in `vite.config.ts`, since it is out of scope for 0.1.
