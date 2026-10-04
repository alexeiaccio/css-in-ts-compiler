---
# cssints-fuyb
title: Adopt ai-automation (Effect lint rules, diff-check) and turn on every Effect check
status: completed
type: feature
priority: normal
created_at: 2026-10-03T12:51:42Z
updated_at: 2026-10-03T13:29:37Z
---

Asked by the user (2026-10-03): copy /Users/a.tukachev/github/effects-of-atmosphere/tools/ai-automation (custom oxlint JS plugin `automation/*` with effect, core and anti-slop profiles, vendored dmmulroy/anti-slop subset, the added-lines diff-check, vitest rule tests) into this repo as tools/ai-automation, and set up every Effect TS check: the automation effect profile and the Effect tagged-value rules in the root lint, the Effect language service / effect-tsgo diagnostics at full strength, the tool's own tests and typecheck in bun run test / typecheck, the diff-check as a script. Plain code by design stays out (browser runtimes, sync css.* builders, hot paths: AGENTS.md 'The one exception').

## Summary of Changes

- tools/ai-automation copied from effects-of-atmosphere (no node_modules), a bun workspace (`tools/*`): bun instead of pnpm catalogs (`oxlint` 1.85.0 and `@oxlint/plugins` 1.79.0 pinned to what Vite+ 1.0.0 ships), node type stripping instead of tsx (diff-check and its CLI test), tsgo for typecheck, the vitest tests through `vp test run` (imports from `vite-plus/test`, `typescript` 5.9 instead of `typescript-legacy` in the registry test), wired into root `bun run test` and `bun run typecheck`. Dropped: quint-generated-model-fresh (no generated model here), pnpm/tsx/typescript-legacy dev dependencies, vitest.config.ts (now vite.config.ts). MIT notices and vendor/anti-slop/UPSTREAM.md kept; vendor excluded from lint and fmt; `vp fmt` applied once in its own commit.
- Root lint: `lint.jsPlugins` loads the plugin beside eslint-plugin-playwright. Errors: the whole effect profile, the four Effect tagged-value rules, no-array-filter-map and the anti-slop rules and `oxc/no-accumulating-spread` that have no violation. Counts and reasons for the rest: tools/ai-automation/README.md. Plain code by design exempt through the `plainCode` override. Violations in Effect code fixed (`Formatter.formatJson`, `Schema.fromJsonString`, `Result.try`, `Predicate.*`, `Object.hasOwn`, `flatMap`).
- Effect language service: tsconfig.effect.json (extended by cssints, css-grammar, icons) sets all 113 diagnostics to error; three left off with reasons (strictBooleanExpressions, missingPipeableSignature, nodeBuiltinImport). Fixed the async functions and the sync Schema calls it reported; css-grammar's tsc 5.9 test run uses tsconfig.tsc.json (no plugin: anyUnknownInErrorContext trips TS2590 there).
- `bun run diff:check` (base master, config adapted; the rule skips type predicates).
- The five files of the other session: warnings until cssints-6nqy (lint `inFlight` override, tsconfig.effect.json override).
- AGENTS.md (Layout, Commands, Linting, Testing) and README updated.
