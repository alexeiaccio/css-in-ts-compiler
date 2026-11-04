---
# cssints-mrew
title: 'charts: a heatmap table'
status: completed
type: feature
priority: normal
created_at: 2026-11-04T05:45:36Z
updated_at: 2026-11-04T06:59:17Z
parent: cssints-6pih
---

A heatmap as a plain table: one <tr> per row, one <td> per hour, every cell coloured with color-mix(in oklab, hot calc(var(--v)/var(--max)*100%), cold). display: contents on thead/tbody/tr lets the cells join one grid so the squares stay square; the label column has a fixed width because it turns bold on hover.

Semantic base: <table> with real headers; hover on a row strengthens its label, hover on a cell reveals the value in place (no reflow: min-height: 0).

Done when: component + STARTERS entry + r/heatmap.json + a story, a test asserting the cell count and that a cell's computed background differs between a low and a high value, and the site page draws it.


## Outcome (2026-11-04)

`apps/ui/src/registry/heatmap/heatmap.tsx`: a table whose `thead`/`tbody`/`tr` are `display: contents`, so the cells are one grid; every cell carries `--v` and `color-mix(in oklab, hot <share>, cold)`; the caption and a scale line say what the numbers are, and the value is the cell text (hidden until hovered, but always read).

Two findings: Solid drops a camelCase (`gridTemplateColumns`) key from the style object while writing the `--x` keys beside it — the kebab key is written; and a token in a run-time style getter is build-time text, so the colours are `var(--color-highlight)` / `var(--color-button-background)`.

Four conformance tests, a story (the week, a wider max, a small map, gaps), r/heatmap.json, the site page.
