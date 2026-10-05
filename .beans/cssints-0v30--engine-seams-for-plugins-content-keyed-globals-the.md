---
# cssints-0v30
title: 'Engine seams for plugins: content-keyed globals, theme layer/scope, declared layers, layered contrast, themes from members'
status: completed
type: feature
priority: normal
created_at: 2026-10-05T09:25:14Z
updated_at: 2026-10-05T09:55:15Z
parent: cssints-easl
---

Step 1 of docs/research/plugin-api.md "Decision". No new plugin API.
- [x] Globals keyed by content (not by a caller's key) and forgotten with the files that use them (HMR: editing a look's values must update the sheet; a global no file uses leaves the sheet); decide per-module vs every sheet (today every sheet) and say why.
- [x] createGlobalTheme(tokens, condition, overrides, { layer?, scope? }): the runtime takes layer today but the type (theme-types.ts) does not; add scope (wraps the theme rule in @scope (<scope>) { ... }, selector checked by the selector recogniser); fixtures type-checked.
- [x] Declared top-level layers: css.layers(...names) (or the smallest equivalent) prints @layer a, b, c; after the engine's layers once; a theme/global layer must be declared (build error otherwise); replaces GlobalRule.layer: null (verbatim). Same names again: fine; another order: build error.
- [x] check.contrast sees themes in layers: themes with the same selector (label) merged in layer order before checking (a viewer look setting only fg is checked against the app look's bg).
- [x] A member can emit a theme: Built.themes [{ tokens, overrides, selector, layer?, scope? }] through style() (and the node merge in cn()), going through the same path as createGlobalTheme (aliases re-derived, overrides checked at build time).
- [x] mise-en-mode keeps working (move it onto Built.themes if trivial; step 2 rewrites it), API.md, tests, budgets.


## Summary of Changes

Engine seams of step 1 of docs/research/plugin-api.md; no new plugin API besides what the checklist names.

- **Globals** (`GlobalRule { css, layer? }`, no `key`, no `layer: null`) are identified by content, kept per module like kernels (`registry.globals`, with `users`) and recorded in the module's sheet entries (`@global`), so `forgetKernels(file)` drops them when the file runs again: an edit of a look's values reaches the sheet, a look no file uses leaves it. Per module, not every sheet: a rule that no client module carries must not print, and one rule for kernels, themes and globals keeps HMR the same for all three.
- **`createGlobalTheme(..., { layer?, scope? })`**: the type has both (`scope` is a balanced selector, the build checks it with the selector recogniser, `@scope (<scope>){...}` around the rule; an error with a condition). Types in test/types/themes.ts.
- **`layers(...names)`** (and `Built.layers`) declares top-level layers: `@layer a, b, c;` once after the engine's. A theme or global `layer` must be declared by a `layers()` that has run (error located at the call). Same names again fine; another order, or sharing layers without one statement holding the other, is an error at the second call.
- **`check.contrast`** reads themes with the same selector and scope together, laid over each other in cascade order (no layer, declared layers in order, source order).
- **`Built.themes`** `[{ tokens, overrides, selector, layer?, scope? }]` through `style()` and the node merge, via the same function as `createGlobalTheme` (`theme()` in theme.ts, now taking the call site explicitly).
- mise-en-mode is not moved onto `Built.themes`: `look()` takes raw custom-property declarations with no token set, so that waits for step 2. It uses `Built.layers` and content-keyed globals.
- Tests: test/plugin-seams.mjs (HMR of a look, layers, theme layer and scope, member themes, layered contrast), sheet.mjs, type tests; API.md entries checked by docs.mjs. Budgets: instantiation budgets unchanged (all ok); perf.mjs 300 modules median per evaluation 4.4 ms vs 4.3 ms before (order-swapped runs on a loaded machine).
