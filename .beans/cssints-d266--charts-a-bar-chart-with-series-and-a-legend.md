---
# cssints-d266
title: 'charts: a bar chart with series and a legend'
status: todo
type: feature
priority: normal
created_at: 2026-11-04T07:08:06Z
updated_at: 2026-11-04T07:08:06Z
parent: cssints-6pih
---

The other half of cssints-bxdp, split off when the column chart shipped: several series side by side, one row per category, the header row doubling as the legend, and a checkbox per series that hides it without JavaScript.

What the source does and we can: series colours come from each column's position (one fixed block of :nth-child selectors, since :has() is not offered by the engine — the column chart's hover and the legend's toggle have to be written as the article writes them); hover on a row shows its values; the axis labels are counters with tab-size.

Accessibility, as the epic's checklist asks: the table is the data (a row per category, a cell per series with its number), the legend's checkboxes are real inputs with names, hiding a series hides its cells rather than recolouring them, no value is hover-only, and colour is never the only channel (each cell carries its number and its series' column header).

Done when: the item, its story with two series, a conformance test that asserts the cells, the numbers, the legend hiding a column and the table remaining the data, r/bars.json, and the site page.
