---
# cssints-0a3p
title: 'Tooling: atomic-css-devtools for cssints classes'
status: completed
type: task
priority: low
created_at: 2026-10-08T08:55:58Z
updated_at: 2026-10-09T07:45:54Z
parent: cssints-dk1q
---

## What
Evaluate astahmer/atomic-css-devtools (a devtools panel that shows atomic rules as if they were not atomic) for cssints' hashed classes; if the panel reads any stylesheet, document it; else a source-map or class->site map export it can use.

## Sources
- https://github.com/astahmer/atomic-css-devtools
- https://github.com/filipsobol/sonda (bundle/CSS visualizer)
- https://www.projectwallace.com/blog/how-to-calculate-css-code-coverage-with-playwright
- https://github.com/schalkneethling/css-benchpress
- https://github.com/schalkneethling/css-console

## Todo

- [x] Read atomic-css-devtools' source: how it reads rules (CSSOM, layers, class format)
- [x] Run its inspect code against apps/demo's dev server in Chrome, checked against CDP
- [x] Find what breaks (@container, @supports, @scope, specificity, unlayered order)
- [x] Dev source map of the sheet (class rule -> first css.* call), with test/sheet-map.mjs
- [x] Sonda on the demo build; Playwright CSS coverage on the demo; css-benchpress and css-console read
- [x] docs/research/devtools.md, docs/API.md section, wayfinder entry
- [x] Follow-up beans (cssints-vxfr, cssints-oj0c, cssints-9xxs)

## Summary of Changes

- docs/research/devtools.md: atomic-css-devtools reads any sheet via the CSSOM and gets cssints' layer order right; it misses @container/@supports/@scope rules, ignores specificity (hover over a query in one layer) and ranks unlayered rules below layers (2 of 85 demo elements show a wrong winner). Sonda sees the sheet as 0 bytes; CSS coverage works (79% of the demo sheet used); css-benchpress is a one-off measurement tool; css-console does not apply (generated sheet, no comments).
- packages/cssints/src/plugin.ts: in dev, load() of the sheet returns a source map mapping each class rule to the first site that produced it (Chrome's Styles pane shows file:line with css.devSourcemap); test/sheet-map.mjs in `test`.
- docs/API.md "Debugging: from a class to its call"; wayfinder entry.
- Follow-ups: cssints-vxfr (build sheet map), cssints-oj0c (coverage per route on sky), cssints-9xxs (upstream reports).
