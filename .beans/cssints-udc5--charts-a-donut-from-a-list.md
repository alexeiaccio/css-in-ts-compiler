---
# cssints-udc5
title: 'charts: a donut from a list'
status: completed
type: feature
priority: normal
created_at: 2026-11-04T05:45:36Z
updated_at: 2026-11-04T08:21:09Z
parent: cssints-6pih
---

Parts of a whole as a list: one <li> per slice carrying --from/--to percentages, each slice a full-size circle behind the legend painted by conic-gradient() and clipped to its own arc with clip-path (transparent pixels still catch the pointer, so the polygon is what makes the hover honest). The hole is a radial-gradient mask.

Semantic base: an <ol> of <li> with <data value> and the percentage as text; the legend is the list.

Done when: component + STARTERS entry + r/donut.json + a story, a test asserting one slice per item and that hover on a row highlights only its slice (a class or an attribute the test can read), and the site page draws.
