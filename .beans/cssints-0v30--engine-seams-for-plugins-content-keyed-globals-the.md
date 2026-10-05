---
# cssints-0v30
title: 'Engine seams for plugins: content-keyed globals, theme layer/scope, declared layers, layered contrast, themes from members'
status: in-progress
type: feature
created_at: 2026-10-05T09:25:14Z
updated_at: 2026-10-05T09:25:14Z
parent: cssints-easl
---

Step 1 of docs/research/plugin-api.md "Decision". No new plugin API.
- [x] Globals keyed by content (not by a caller's key) and forgotten with the files that use them (HMR: editing a look's values must update the sheet; a global no file uses leaves the sheet); decide per-module vs every sheet (today every sheet) and say why.
- [x] createGlobalTheme(tokens, condition, overrides, { layer?, scope? }): the runtime takes layer today but the type (theme-types.ts) does not; add scope (wraps the theme rule in @scope (<scope>) { ... }, selector checked by the selector recogniser); fixtures type-checked.
- [x] Declared top-level layers: css.layers(...names) (or the smallest equivalent) prints @layer a, b, c; after the engine's layers once; a theme/global layer must be declared (build error otherwise); replaces GlobalRule.layer: null (verbatim). Same names again: fine; another order: build error.
- [x] check.contrast sees themes in layers: themes with the same selector (label) merged in layer order before checking (a viewer look setting only fg is checked against the app look's bg).
- [x] A member can emit a theme: Built.themes [{ tokens, overrides, selector, layer?, scope? }] through style() (and the node merge in cn()), going through the same path as createGlobalTheme (aliases re-derived, overrides checked at build time).
- [ ] mise-en-mode keeps working (move it onto Built.themes if trivial; step 2 rewrites it), API.md, tests, budgets.
