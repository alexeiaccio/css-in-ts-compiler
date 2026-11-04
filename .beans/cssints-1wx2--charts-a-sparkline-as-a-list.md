---
# cssints-1wx2
title: 'charts: a sparkline as a list'
status: completed
type: feature
priority: high
created_at: 2026-11-04T05:45:24Z
updated_at: 2026-11-04T05:53:55Z
parent: cssints-6pih
---

A sparkline as an ordered list: one <li> per sample with its value in <data> and the previous one beside it; the segment is the item's ::before, a 2px bar as long as hypot(step, dy) turned by atan2(). Hover reveals the value without moving layout.

Semantic base: <ol> with <data value>, named; with CSS off it reads as a list of numbers.

This bean answers the epic's open question first: sibling-count()/sibling-index() are new, so the count and the index arrive as --n and --i unless the targets allow the CSS ones; note what engine warnings the file produces.

Done when: component + STARTERS entry + r/sparkline.json + a story, a conformance test that asserts the samples and that a segment's computed rotate is an angle, and the site page draws it.


## Outcome (2026-11-04)

`apps/ui/src/registry/sparkline/sparkline.tsx`: an `<ol>` of `<data value>` samples, the line drawn by each item's segment span (`hypot` + `atan2` in `calc`), the dot on the head and on hover, the value on hover. The count is `--n` and the index need is avoided, so `sibling-index()`/`sibling-count()` are not used; the scale is `min`/`max` or the samples' own. Pseudo-elements are not part of the API, so the segment and the dot are spans and the hover is `within(hover)` over the item's `group()`.

Five conformance tests, a story with three variants, `r/sparkline.json` from the STARTERS entry, the site page. The same run regenerated `r/*.json`, which had been stale since the carousel and table fixes.
