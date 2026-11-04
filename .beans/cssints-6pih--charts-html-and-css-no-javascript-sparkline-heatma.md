---
# cssints-6pih
title: 'charts: HTML and CSS, no JavaScript (sparkline, heatmap, columns, bars, donut, stat)'
status: todo
type: epic
created_at: 2026-11-04T05:44:59Z
updated_at: 2026-11-04T05:44:59Z
---

The kit has meter and timeline and no chart. Keith Cirkel's html-graphs (https://www.keithcirkel.co.uk/html-graphs/) builds every chart from semantic HTML and CSS: a table, a list or a meter, the numbers in custom properties, bars as sized backgrounds, heat as color-mix(), slices as conic-gradient(), segments as pseudo-elements turned with atan2(). No JavaScript, no SVG, no library.

This epic brings that into the kit as starters, one chart per bean, in the order the article says to learn them. Each is a registry item: a component, a story, and (where there is behaviour to check) a conformance test. The engine already generates the functions these need (atan2, hypot, round, sign, abs, colorMix); the open question is sibling-index()/sibling-count(), whose support is new — a chart may have to take the index and the count as custom properties instead, and the first bean answers that.
