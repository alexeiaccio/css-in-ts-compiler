---
# cssints-djzw
title: Port the engine to TypeScript and Effect
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T14:34:21Z
updated_at: 2026-09-29T15:50:13Z
parent: cssints-vy0o
blocked_by:
    - cssints-vzd9
    - cssints-ny2w
---

## Question

Implement the decision of cssints-odi9. Blocked by the global sheet, so the port starts from the final emission code. Conditions and tokens wait for the port, to avoid porting them twice.

- [x] packages/cssints/src: plugin, macro, lib and runtime as `.ts` (with instrument, evaluate, sheet, errors and registry split out of plugin); every exported function is an Effect (`Effect.fn`; `Effect.fnUntraced` on per-declaration and per-site paths, see Notes) with `Data.TaggedError` errors (`Data.TaggedErrorClass` does not exist in effect 4.0.0-beta.107) that carry the file and offset of the call site; the plugin gives Vite `loc`, so the overlay points at the call. The sync `css.*` node builders (and `__at`/`__site`, which run inside user modules) are the exception; `cv()` is lazy now, its config is validated at its site.
- [x] packages/css-grammar/src: twin, support, rules and browsers behind Effect APIs with tagged errors (`ParseError` with position and expected labels; `InvalidValueError`, `UnknownPropertyError`, `RuleError`, `BrowsersError`); the type-level recognizer is unchanged. `values.ts` (Typed OM `CSS.px()`, `new CSSColorValue()`) stays synchronous: like the css.* builders, users call it in expressions. The recognizer, lexer and rules stay plain code (`twin-core.ts`) behind the Effect.fn boundary; per-declaration functions are `Effect.fnUntraced` because a span costs ~4 µs a call (see Notes)
- [x] Budget: `packages/cssints/test/perf.mjs` per-module cost within 10% (same machine, before and after interleaved, 6 runs, 200 modules: eval median 4.3-5.1 -> 4.65-5.0 ms, +4..8%; wall +2..9%; user self +5..11%; first evaluation +7..13%; instrument 0.16 -> 0.165 ms); `bun run bench` unchanged (same table). `perf.mjs` itself was broken on HEAD (`timed(cssints())` got the plugin array since the sheet-version plugin) and is fixed
- [x] tsconfig per package with the `@effect/language-service` plugin; `typecheck` = `tsgo -p tsconfig.json --noEmit` + `effect-tsgo diagnostics --project tsconfig.json --format pretty`, wired into `vp run` (`bun run typecheck` = `vp run --filter "./packages/*" --filter "!./packages/plugin-icon" typecheck`, part of `bun run check`; not `-r`, because plugin-icon has a `typecheck` script and syntax errors). `@effect/tsgo` went 0.0.15 -> 0.45.0 (0.0.15 has no `diagnostics`) and needs `@typescript/native` (TypeScript 7) patched by `effect-tsgo patch --typescript` in `prepare`; that alias takes over `node_modules/.bin/tsc`, so css-grammar `test` and `bench/budget.mjs` call TypeScript 5.9 by path.
- [x] `vp pack` (tsdown) configs for publishing `cssints` and `@cssints/css-grammar` (build only; publishing itself is fog): a `pack` block in each package's `vite.config.ts` (Vite+ advises against tsdown.config.ts), `bun run build` = `vp pack`, output in `dist/` with `.d.mts`
- [x] `vp lint` and `vp fmt --check packages/cssints packages/css-grammar apps/demo` clean (root-wide `vp fmt --check` still lists docs, .beans and root files: not in scope). Config changes in `vite.config.ts` with a reason each: plugin-icon and docs/archive ignored; fixtures and bench/err.ts not linted; no-unsafe-* off for `.mjs`; no-explicit-any off for css.ts and probe-typed.ts; import/no-duplicates off in demo and cssints tests. Formatter ignores live in `.prettierignore` (`fmt.ignorePatterns` is not applied by `vp fmt`)
- [x] AGENTS.md: the typecheck commands, the one exception, the hot-path note, and the Effect API names that differ in beta.107

Note from cssints-ny2w: the lint baseline is 1443 errors (1191 rule and 252 type errors, mostly no-unsafe-*) and fmt would change ~60 files. plugin-icon has 3 syntax errors that stop `vp fmt` and `vp check`: fix them, or exclude plugin-icon in `vite.config.ts`, since it is out of scope for 0.1.

## Notes

- Effect 4.0.0-beta.107 differs from AGENTS.md: no `Data.TaggedErrorClass` (`Data.TaggedError("Tag")<{...}>`), no `ServiceMap` (`Context.Service`, `Context.Reference`).
- A traced `Effect.fn` costs ~4 us a call (a span and a stack capture). First port: +40% user self time per module. Now: `Effect.fn` at the boundaries that run a few times per module (transform, instrument, evaluate, renderSheet, hotUpdate); `Effect.fnUntraced` on what runs per site; one Effect boundary per site (`classesOf`) around a plain loop over its declarations (hash, twin, prose rules, support).
- Quint: the async structure is the same. Lock, `sites.delete`, `clearApp`, `runner.import`, `record` inside the permit, `depsOf` after it. The only difference: `record` and `depsOf` now run in the same fiber (no promise hop between them). runner.qnt is unchanged (comments only); `quint run` (4 invariants, 100000 samples) and `mbt.mjs` (10x8 and 40x12) pass.
- Error location: `MacroError` (file, site, offset), `ImportError`, `EvalError`, `SiteMissingError`, `HookError`. `__at(file, site, offset)` marks the call before its expression runs, so a builder that throws before `__site` still names the call. The plugin sets `loc` (line, column) and `id` on the error and Vite builds the frame. The runner has its own copy of errors.ts, so the plugin recognizes its errors by `_tag`.
- `cv()` is lazy: it returns its config, and the site validates it and builds the class strings.
- User-facing types: `src/types.ts` (the `types` condition) plus generated `src/members.ts`; builders are `string` there, since the plugin replaces every call by its class string.

## Summary of Changes

- css-grammar: `twin-core.ts` (plain recognizer) and `twin.ts`, `rules.ts`, `support.ts`, `browsers.ts`, `check.ts` as Effect APIs with `errors.ts` (ParseError with position and expected labels, InvalidValueError, UnknownPropertyError, RuleError, BrowsersError). `values.ts` and the type-level `css.ts` are unchanged.
- cssints: all `.ts` (plugin, instrument, evaluate, sheet, macro, lib, registry, errors, runtime, index, types, members), erasable syntax, exports updated (`types`, `browser`, `default`). Errors surface to Vite with the call site.
- typecheck per package (tsgo + effect-tsgo), `vp pack` configs, lint and fmt clean, AGENTS.md.
