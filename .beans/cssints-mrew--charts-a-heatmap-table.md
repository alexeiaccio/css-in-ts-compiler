---
# cssints-mrew
title: 'charts: a heatmap table'
status: todo
type: feature
priority: normal
created_at: 2026-11-04T05:45:36Z
updated_at: 2026-11-04T05:45:36Z
parent: cssints-6pih
---

A heatmap as a plain table: one <tr> per row, one <td> per hour, every cell coloured with color-mix(in oklab, hot calc(var(--v)/var(--max)*100%), cold). display: contents on thead/tbody/tr lets the cells join one grid so the squares stay square; the label column has a fixed width because it turns bold on hover.

Semantic base: <table> with real headers; hover on a row strengthens its label, hover on a cell reveals the value in place (no reflow: min-height: 0).

Done when: component + STARTERS entry + r/heatmap.json + a story, a test asserting the cell count and that a cell's computed background differs between a low and a high value, and the site page draws it.
