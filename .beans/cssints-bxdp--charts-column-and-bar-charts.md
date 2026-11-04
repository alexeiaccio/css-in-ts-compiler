---
# cssints-bxdp
title: 'charts: column and bar charts'
status: todo
type: feature
priority: normal
created_at: 2026-11-04T05:45:36Z
updated_at: 2026-11-04T05:45:36Z
parent: cssints-6pih
---

Two forms of one family: a column chart (one row per category, the bar a background sized from --v, the axis labels counters separated by tab-size) and a bar chart (one row per category, one cell per series, the header row doubling as the legend with a checkbox per series).

Semantic base: a <table> either way; with CSS off every chart is the table of numbers it is.

No JavaScript: the legend's checkboxes hide a series through :has() (one fixed block of :nth-child selectors, as the article says), hover dims the other rows.

Done when: two starters (columns, bars) or one component with two modes — decide in the bean — each with its STARTERS entry, story, a test asserting a bar's computed width grows with its value, and the site pages draw.
