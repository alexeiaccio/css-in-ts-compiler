---
# cssints-vzd9
title: Implement the global sorted stylesheet
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T14:20:21Z
updated_at: 2026-09-29T15:07:02Z
parent: cssints-vy0o
---

## Question

Implement the output pipeline decided in cssints-euf0.

- [x] One virtual CSS module (for example `virtual:cssints.css`), imported once from the entry, instead of per-module `cssints.css?file=` and `layers.css`. It starts with `@layer _.a, _.b, _.c, _.d, _.e;`.
- [x] Dev: rules collected per source module and deduplicated across modules. Invalidating the virtual module on change updates it without a reload. The HMR invariants of cssints-hdui still hold: `race.mjs` and mbt pass, and the model is updated if the flow changes.
- [x] Build (Vite 8 / Rolldown only): a placeholder in the CSS, filled in `renderChunk` once all modules are transformed.
- [x] Sort: layer, then condition (min-width ascending, then pseudo order; only layer `_.a` exists until conditions land), then shorthand before longhand (`padding` before `padding-left`), then class name.
- [x] LightningCSS targets from the same browserslist query as `support.ts`; the demo config uses them.
- [x] Fixtures and a test: `cx(pl(2), p(4))` and `cx(p(4), pl(2))` both give padding-left from pl; two modules with the same rule give one rule; the demo build has one CSS file.

## Summary of Changes

- `packages/cssints/src/plugin.mjs`: one sheet, `import "virtual:cssints.css"` in the entry (resolved to `\0virtual:cssints.css`). `usedBy` maps each client module to its classes; the sheet is the sorted union, so each rule appears once. `renderSheet` sorts by layer, then `cond` (an array of numbers compared in order, `[]` until conditions land), then leaf count from mdn-data `computed` (more leaves first, `all` excluded; this is a linear extension of leaf-set inclusion, so `border` comes before `border-top`), then class. The plugin now returns `[main, version]`, and `renderSheet` and `targets` are exported.
- Dev: `record()` runs inside `evalLock`, after the evaluation. When a module's class set changes, the sheet module is soft-invalidated (so an in-flight sheet transform is not cached) and `reloadModule` sends an HMR update (a CSS module that accepts itself, so no reload). A post transform appends `import.meta.hot.send("cssints:sheet", hash)`, and the server reloads the sheet if that version is stale. Without this, a cold page load showed 0 of 70 rules: the browser drops updates for a module that has not run yet.
- Build: `load` returns the layer statement as a placeholder. In `renderChunk` (before vite:css-post's), the sorted sheet goes through vite:css (LightningCSS with `css.lightningcss`) and then vite:css-post's transform, which replaces the placeholder in its `styles` map. cssMinify then runs on the joined chunk CSS. The placeholder never reaches minify.
- `macro.mjs`: rules are `{ layer, cond, prop, css }` instead of pre-wrapped text.
- Targets: `packages/css-grammar/src/browsers.ts` holds the one browserslist query (`BROWSERSLIST ?? "defaults"`), used by `support.ts` and by `cssints/vite`'s `targets` (lightningcss `browserslistToTargets`). The demo config sets `css.lightningcss.targets` and `build.cssTarget: false`, so cssMinify does not replace the targets with the esbuild default.
- Removed `src/layers.css`, the `./layers.css` export, and the per-module CSS modules. `lightningcss` and `mdn-data` are now dependencies of cssints.
- Tests: `test/run.mjs` prints each fixture's rules (`api.sheet([id])`). New fixtures: `order.ts`, `dedupe-a.ts`, `dedupe-b.ts`. New `test/sheet.mjs` checks the order (including `border` before `border-top`), dedupe across two modules, dev invalidation, and that the real demo build has exactly one CSS file with layer order `_.a.._.e` first.
- Model: `runner.qnt` gains `rules` (written at `read`, inside the lock), the sheet's cache, and a sheet request that can be in flight. New invariant `sheetFresh` and witness `sheetServed`. mbt also compares the plugin's sheet with the model's `rules` at every step.
- Item 1 note: the sheet source starts with `@layer _.a, _.b, _.c, _.d, _.e;`. After LightningCSS minify, this is folded into `@layer _.a{…}@layer _.b,_.c,_.d,_.e;`, which gives the same order (it was the same before this change).
- Known limits: rules of modules deleted during dev stay in the sheet until restart. There is no warning when a build forgets `import "virtual:cssints.css"`. There is no debounce (one sheet update per transform whose rule set changed).

Follow-up from cssints-1xqr: the sheet builder should accept a global rule by key, emitted once, in a cascade layer `_.k` declared below `_.a` (a seam for future kernels such as frame/surface). Tracked in the port or the conditions work, whichever touches the sheet next.
