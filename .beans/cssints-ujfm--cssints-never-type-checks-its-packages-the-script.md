---
# cssints-ujfm
title: 'cssints never type-checks its packages: the script runs the Effect rules without --type-check'
status: todo
type: bug
priority: high
created_at: 2026-11-15T14:11:20Z
updated_at: 2026-11-15T14:11:20Z
---

`scripts/typecheck.mjs` spawns `effect-tsrs diagnostics --project tsconfig.json` and forwards only `process.argv.slice(2)`. Every one of the 32 packages calls it as `"typecheck": "node ../../scripts/typecheck.mjs"` with **no arguments**, and `grep` finds **zero** packages passing `--type-check`. So the workspace's typecheck runs **Effect diagnostics only** — the ordinary TypeScript diagnostics are never checked in this repo. Compare EOA (`effect-tsrs diagnostics --project tsconfig.json --type-check`), where a clean run actually means 'no TS errors'.

What that costs, measured: with the flag, `packages/headless` reports **1 pre-existing diagnostic** (`test/dialog-native.browser.test.tsx(28,37)`) that no CI step has ever seen. The count across 32 packages is unknown and is the first thing to measure.

**Fix**: pass `--type-check` in `scripts/typecheck.mjs` (or in each package's script, but one place is the point). Then deal with the fallout in one sweep — a diagnostic in a *test* file is not a licence to keep the flag off.

Depends on: nothing. Blocks the credibility of every 'typecheck: 0 diagnostics' line in this repo's reports.
