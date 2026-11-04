---
# cssints-bxdp
title: 'charts: column and bar charts'
status: completed
type: feature
priority: normal
created_at: 2026-11-04T05:45:36Z
updated_at: 2026-11-04T07:08:06Z
parent: cssints-6pih
---

Two forms of one family: a column chart (one row per category, the bar a background sized from --v, the axis labels counters separated by tab-size) and a bar chart (one row per category, one cell per series, the header row doubling as the legend with a checkbox per series).

Semantic base: a <table> either way; with CSS off every chart is the table of numbers it is.

No JavaScript: the legend's checkboxes hide a series through :has() (one fixed block of :nth-child selectors, as the article says), hover dims the other rows.

Done when: two starters (columns, bars) or one component with two modes — decide in the bean — each with its STARTERS entry, story, a test asserting a bar's computed width grows with its value, and the site pages draw.


## Outcome (2026-11-04)

**The column chart shipped; the bar chart was split off as its own bean** (the multi-series table, the legend with checkboxes, the :nth-child column block) because it is a different table and a different test, and the two would have shared nothing but a name.

`apps/ui/src/registry/columns/columns.tsx`: an ordered list of categories; each item is the name, then the plot (the value as text above a bar whose height is `calc(var(--v) / var(--max) * (var(--columns-height) - 1.5em))`). The 1.5em is the headroom: the tallest bar still leaves room for its own number. `--max` is the data's or the page's; a flat chart gets 1 instead of dividing by nothing.

Built to the accessibility checklist from the start: the chart is a `figure` with a `figcaption`; the list is the data, read as "name, value" (the name is first in the DOM and `order: 1` puts it under the bar for the eye); every value is text, never a tooltip; a long name wraps instead of being clipped; the bar is `aria-hidden` and carries nothing a reader needs.

Four conformance tests, a story (the article's latency distribution, a small chart with formatted values, a flat one), r/columns.json, the site page, and a screenshot of the distribution.
