---
# cssints-z03v
title: 'Sublayers vs sort order: find a case the sort gets wrong'
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-10-02T09:06:46Z
updated_at: 2026-10-02T09:06:46Z
parent: cssints-9js6
---

## Question

The sheet orders shorthand before longhand by leaf count inside each condition layer (cssints-euf0). The fog asked whether sublayers (`_.a.a/_.a.b/_.a.c`, depth from mdn-data `computed`) are needed. Search for a real case where the sort order gives the wrong cascade: shorthands that overlap without containing each other (`border` vs `border-inline`, `inset` vs `inset-block`, `grid-area` vs `grid-row`, `font` vs `font-variant`, `mask` vs `mask-border`, `all`), logical vs physical pairs, and `cn()` across modules. Build each as a fixture, check the computed style in Chrome against the author's intent (the later argument of cn() wins). Answer: the cases found, and a recommendation: keep the sort, fix it, or move to sublayers (with the layer count and DevTools cost).
