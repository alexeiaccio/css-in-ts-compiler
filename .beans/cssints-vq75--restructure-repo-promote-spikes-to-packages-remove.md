---
# cssints-vq75
title: 'Restructure repo: promote spikes to packages, remove dead approaches'
status: completed
type: task
priority: normal
created_at: 2026-09-29T11:10:13Z
updated_at: 2026-09-29T12:36:13Z
parent: cssints-tmv8
---

Simplify repo layout.

- [x] Remove root junk (macrodata json, method.md) and ignored leftovers
- [x] Remove lightningcss-napi, old cssints (Parcel), apps/demo, apps/tsdown-demo; keep plugin-icon
- [x] spikes/typelevel -> packages/css-grammar
- [x] spikes/runner -> packages/cssints (plugin + lib) and apps/demo, apps/playground
- [x] cssints-variants -> packages/variants
- [x] Single bun workspace, drop spike lockfiles
- [x] docs/ -> research/ + archive/, fix paths in wayfinder
- [x] Update README, AGENTS.md, root package.json
- [x] Verify: runner tests, typelevel budget, app-react build

## Summary of Changes

- Deleted: macrodata json files, method.md, packages/lightningcss-napi, old packages/cssints (Parcel), apps/demo (oxc-macro), apps/tsdown-demo, spikes/typegen, spike package-locks, ignored leftovers (packages/compiler, css-syntax, apps/oxc-macro-test).
- spikes/typelevel -> packages/css-grammar (src/, test/, bench/, scripts/extract.mjs); exports `@cssints/css-grammar/*` -> src/*.ts.
- spikes/runner -> packages/cssints (src/ incl. plugin.mjs as `cssints/vite`; test/ with fixtures, spec, hmr app); app-react -> apps/demo.
- packages/cssints-variants -> packages/variants (dropped empty vitest script).
- One bun workspace; root deps trimmed; oxlint pinned to 1.56.0 (1.86 panics with tsgolint 0.12.2); turbo test/bench tasks.
- docs: research/ and archive/; wayfinder paths updated plus a layout section.
- README and AGENTS.md rewritten for the new layout.
- Verified: bun run test (both packages), bun run bench (budgets unchanged), extract.mjs regenerates identical mdn.ts, apps/demo builds with the same CSS hash.
- Known: spec/mbt.mjs broken under bun isolated linker (follow-up bean); lint/fmt errors in moved spike code and plugin-icon are pre-existing.
