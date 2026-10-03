---
# cssints-fuyb
title: Adopt ai-automation (Effect lint rules, diff-check) and turn on every Effect check
status: in-progress
type: feature
created_at: 2026-10-03T12:51:42Z
updated_at: 2026-10-03T12:51:42Z
---

Asked by the user (2026-10-03): copy /Users/a.tukachev/github/effects-of-atmosphere/tools/ai-automation (custom oxlint JS plugin `automation/*` with effect, core and anti-slop profiles, vendored dmmulroy/anti-slop subset, the added-lines diff-check, vitest rule tests) into this repo as tools/ai-automation, and set up every Effect TS check: the automation effect profile and the Effect tagged-value rules in the root lint, the Effect language service / effect-tsgo diagnostics at full strength, the tool's own tests and typecheck in bun run test / typecheck, the diff-check as a script. Plain code by design stays out (browser runtimes, sync css.* builders, hot paths: AGENTS.md 'The one exception').
