---
# cssints-7zhh
title: 'vitals: a real home in apps/demo and the native browser page'
status: todo
type: task
priority: normal
created_at: 2026-11-07T11:08:55Z
updated_at: 2026-11-07T11:08:55Z
parent: cssints-7rmb
---

The console report has no consumer yet: prove it on the two pages that matter, and make the canvas case the point.

Build:
- apps/demo: `observe()` in the dev entry (behind `import.meta.env.DEV`), so `window.vitals()` works on the demo's dev server, and the sheet's numbers are visible on a page that is entirely cssints.
- native/browser: `@cssints/devtools` as a devDependency of the private native workspace; the shell (browser/solid/shell.ts) prints `vitals()` on `v` and when `?vitals` is set, after the first frames. This is the case the DOM overlay cannot serve: a Clay canvas has no elements, so the console is the only devtools it can have.
- A check: apps/demo's site test (or a small dev check) asserts the group appears and the class count is non-zero; native/browser gets a `vitals-check.mjs` (or an addition to console-check.mjs) asserting the printed group and that `css.sheets` is 0 on the canvas page without a sheet (the honest empty case).

Check: both pages, the console text, no build output carrying the report (dev only).
