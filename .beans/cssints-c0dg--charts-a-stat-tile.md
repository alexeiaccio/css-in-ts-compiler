---
# cssints-c0dg
title: 'charts: a stat tile'
status: completed
type: feature
priority: low
created_at: 2026-11-04T05:45:36Z
updated_at: 2026-11-04T08:21:10Z
parent: cssints-6pih
---

A headline number, its change against the previous value, and whether up is good: the sign, the percentage and the colour are computed in CSS from --value, --previous and --better, printed through counters (@counter-style sign maps -1/0/1 to −/±/+), and colour-mixed between --ok and --danger by color-mix() clamped from sign().

Semantic base: an <article> with an <h3>, a <data value> and a sentence; with CSS off it reads as a heading, a number and a comparison.

Done when: component + STARTERS entry + r/stat.json + a story, a test asserting the counter text and the colour for a good and a bad change, and the site page draws.
