---
# cssints-djzw
title: Port the engine to TypeScript and Effect
status: todo
type: task
tags:
    - wayfinder:task
created_at: 2026-09-29T14:34:21Z
updated_at: 2026-09-29T14:34:21Z
parent: cssints-vy0o
blocked_by:
    - cssints-vzd9
---

## Question

Implement the decision of cssints-odi9. Blocked by the global sheet, so the port starts from the final emission code. Conditions and tokens wait for the port, to avoid porting them twice.

- [ ] packages/cssints/src: plugin, macro, lib and runtime as `.ts`; every exported function is `Effect.fn` with `Data.TaggedErrorClass` errors that carry the file and position of the call site (so the Vite overlay points at it). The sync `css.*` node builders are the one exception.
- [ ] packages/css-grammar/src: twin, support, rules and values behind Effect APIs with tagged errors (`ParseError` with position and expected labels); the type-level recognizer is unchanged
- [ ] Budget: `packages/cssints/test/perf.mjs` per-module cost within 10% of the cssints-grrd numbers; `bun run bench` unchanged
- [ ] tsconfig per package with the `@effect/language-service` plugin; `typecheck` = `tsgo -p tsconfig.json --noEmit` + `effect-tsgo diagnostics --project tsconfig.json --format pretty`, wired into turbo
- [ ] tsdown config for publishing `cssints` and `@cssints/css-grammar` (build only; publishing itself is fog)
- [ ] oxlint and oxfmt clean for packages/cssints, packages/css-grammar and apps/demo
- [ ] AGENTS.md: the typecheck commands and the one exception
