---
# cssints-6nqy
title: Effect lint violations in macro.ts, lib.ts, registry.ts, author.ts, author-types.ts
status: completed
type: task
priority: normal
created_at: 2026-10-03T13:11:49Z
updated_at: 2026-10-05T07:43:32Z
---

cssints-fuyb turned the automation Effect rules on as errors (root vite.config.ts) and fixed every violation except those in the five files another session was editing (macro.ts, lib.ts, registry.ts, author.ts, author-types.ts). For exactly those files the root vite.config.ts sets the rules to "warn" (the `inFlight` override, comment names this bean). Fix them, then delete the `inFlight` override and its `automationWarn` constant: the rules are errors again.

Replacements used for the rest (see git log of cssints-fuyb):

- `JSON.stringify(x)` becomes `Formatter.formatJson(x)` (effect); a stringify with a replacer becomes `Schema.encodeSync(Schema.fromJsonString(Schema.Unknown, { replacer }))`; `JSON.parse` becomes `Schema.decodeSync(Schema.fromJsonString(...))`.
- `try/catch` becomes `Result.try(...)` (sync) or `Effect.try`.
- `"k" in v` becomes `Predicate.hasProperty(v, "k")` (narrows), `Object.hasOwn(o, k)` (own key of a record) or `Reflect.has` (when the prototype chain counts).
- `typeof v === "object"` guards become `Predicate.isObject` / `Predicate.hasProperty`.
- lib.ts holds the sync css.* builders and the class hash, which are plain code by design (AGENTS.md "The one exception, and the hot paths"): if a violation there sits in `toDecls`, `chainDecl`, `isNode` or `hashClass`, move lib.ts's lines to the `plainCode` override of vite.config.ts instead of changing the code.

## Todo

- [x] author.ts:33 no-try-catch
- [x] author.ts:96 no-try-catch
- [x] author.ts:138 no-global-json
- [x] lib.ts:34 no-typeof-object, no-in-operator (same line)
- [x] lib.ts:61 no-in-operator
- [x] lib.ts:185 no-typeof-object
- [x] lib.ts:311 no-global-json
- [x] macro.ts:94 no-global-json
- [x] macro.ts:134 no-global-json
- [x] macro.ts:149 no-try-catch
- [x] macro.ts:178 no-typeof-object
- [x] macro.ts:213 no-in-operator
- [x] macro.ts:220 no-global-json
- [x] macro.ts:243 no-global-json
- [x] macro.ts:260 no-typeof-object
- [x] macro.ts:282 no-global-json
- [x] macro.ts:294 no-global-json
- [x] macro.ts:327 no-global-json
- [x] macro.ts:339 no-try-catch
- [x] macro.ts:386 no-typeof-object, no-in-operator (same line)
- [x] macro.ts:393 no-in-operator
- [x] macro.ts:395 no-in-operator
- [x] macro.ts:440 no-try-catch
- [x] macro.ts:548 no-global-json
- [x] macro.ts:584 no-global-json
- [x] macro.ts:601 no-global-json (JSON.parse)
- [x] macro.ts:641 no-typeof-object
- [x] macro.ts:644 no-global-json
- [x] macro.ts:658 no-global-json (two on the line)
- [x] macro.ts:671 no-typeof-object
- [x] macro.ts:678 no-global-json
- [x] macro.ts:686 no-global-json
- [x] macro.ts:687 no-global-json
- [x] registry.ts, author-types.ts: no violation today; the Effect language service diagnostics at full strength (tsconfig of packages/cssints) may report some, see below

Line numbers are those of master at 2026-10-03 (fc0dbc2); re-run `npx vp lint` to see the current ones (they are the warnings).

## Effect language service

tsconfig.effect.json (shared by packages/cssints, css-grammar, icons) sets every diagnostic to error. For exactly the five files its `overrides` entry makes `preferSchemaOverJson` a warning: macro.ts:548, 584, 678, 686, 687 (the same JSON.stringify calls as the lint's no-global-json). Fix them with the lint ones, then delete that override entry (and the "cssints-6nqy" comment).

## Summary of Changes

All 36 lint warnings and the 5 `preferSchemaOverJson` language-service warnings of the five files are gone; the `inFlight` override, its `automationWarn` constant, the twin override in tsconfig.effect.json and the AGENTS.md sentence are deleted. `npx vp lint` reports 0 warnings and 0 errors.

- macro.ts: `JSON.stringify` (15 calls) became `Formatter.formatJson`; the `JSON.parse` in `_cv` became `Schema.decodeSync(Schema.fromJsonString(Schema.Unknown))` (`fromJson`, with the same `schemaSync` note as sheet.ts); the four `try/catch` (blockOf, globalRule, checkValue, and the one in author.ts below) became `Result.getOrThrowWith(Result.try({ try, catch }), (e) => e)`; `typeof x === "object"` became `Predicate.isObject` / `isObjectOrArray` / `isObjectKeyword`; `"k" in v` became `Predicate.hasProperty` (`isWrapper`, `isCv`) and `Predicate.isTagged` (`located`, now written without `in`).
- author.ts: two `try/catch` (`check`, `ran`) became `Result.try`; `JSON.stringify` became `Formatter.formatJson`.
- lib.ts: moved to the `plainCode` override of vite.config.ts (sync css.* builders `node`, `toDecls`, `chainDecl`, `isNode`, `isFallback`, and the class hash): no code change.
- registry.ts and author-types.ts had no warning.
- trace-otlp.ts (not one of the five files; its three `unstableApiUsage` warnings were left by the engine's OTLP tracing) is silenced for the file with one `@effect-diagnostics` line, since OTLP and the fetch client are unstable in effect 4.0.0 and the tracing is opt-in.

perf.mjs (200 modules, `seq`, per-module median ms, four to five interleaved runs each): after 4.08 to 4.81, before 4.29 to 4.87; user time per module 1.69 to 2.15 against 1.90 to 2.05. No change beyond noise.
