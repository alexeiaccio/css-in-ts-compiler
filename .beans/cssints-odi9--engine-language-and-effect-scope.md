---
# cssints-odi9
title: Engine language and Effect scope
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T14:34:21Z
parent: cssints-vy0o
---

## Question

The engine is `.mjs`. AGENTS.md asks for TypeScript and Effect on every side effect, and lint reports errors in the moved code.

- Port `plugin.mjs`, `macro.mjs` and `lib.mjs` to `.ts` run by type stripping, with no build step?
- Where does Effect pay off (evaluate, file IO, errors with call-site locations), and where is it noise (the Proxy in `macro.mjs`, hot paths in the twin)?
- Is lint clean a gate for 0.1?

## Resolution
- **Effect everywhere**, as AGENTS.md says: typed errors, lazy functions, observability through `Effect.fn` spans. Every exported function of the plugin, the macro library (validation, class generation, `__site`), the twin, support and rules returns an Effect with tagged errors. The single exception is forced by user code: `css.*` calls inside user modules build nodes synchronously, because users compose them and store them in variables. Tight inner loops (the lexer) stay plain code inside an `Effect.fn` boundary; the perf budget from cssints-grrd is the check.
- **Language:** `.ts` sources. bun and Node run them in the repo, tsdown builds them for publishing, and Vite builds the apps.
- **Checks:** `tsgo -p` plus `effect-tsgo diagnostics --project tsconfig.json --format pretty` (from `@effect/tsgo`, as in ~/github/effects-of-atmosphere). tsc 5.9 stays green where it already runs (css-grammar types).
- **Lint and format** (oxlint and oxfmt) are clean for packages/cssints, packages/css-grammar and apps/demo, as a gate for 0.1. plugin-icon is excluded.
