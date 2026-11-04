---
# cssints-6pih
title: 'charts: HTML and CSS, no JavaScript (sparkline, heatmap, columns, bars, donut, stat)'
status: completed
type: epic
priority: normal
created_at: 2026-11-04T05:44:59Z
updated_at: 2026-11-04T08:21:10Z
---

The kit has meter and timeline and no chart. Keith Cirkel's html-graphs (https://www.keithcirkel.co.uk/html-graphs/) builds every chart from semantic HTML and CSS: a table, a list or a meter, the numbers in custom properties, bars as sized backgrounds, heat as color-mix(), slices as conic-gradient(), segments as pseudo-elements turned with atan2(). No JavaScript, no SVG, no library.

This epic brings that into the kit as starters, one chart per bean, in the order the article says to learn them. Each is a registry item: a component, a story, and (where there is behaviour to check) a conformance test. The engine already generates the functions these need (atan2, hypot, round, sign, abs, colorMix); the open question is sibling-index()/sibling-count(), whose support is new — a chart may have to take the index and the count as custom properties instead, and the first bean answers that.


## Outcome (2026-11-04)

Six charts, all on semantic HTML and CSS, all with stories and conformance tests: sparkline (`cssints-1wx2`), heatmap (`cssints-mrew`), columns (`cssints-bxdp`), bars (`cssints-d266`), donut (`cssints-udc5`), stat (`cssints-c0dg`), and the accessibility pass (`cssints-xww8`) with the bar written down in apps/ui/README.md. Two engine/agent findings are recorded in wayfinder: pseudo-elements had to become wrappers (they are now), and a `@counter-style` at-rule cannot be written by `css.global()`.
