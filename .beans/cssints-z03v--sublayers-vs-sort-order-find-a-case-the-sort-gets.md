---
# cssints-z03v
title: 'Sublayers vs sort order: find a case the sort gets wrong'
status: completed
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-10-02T09:06:46Z
updated_at: 2026-10-02T09:32:53Z
parent: cssints-9js6
---

## Question

The sheet orders shorthand before longhand by leaf count inside each condition layer (cssints-euf0). The fog asked whether sublayers (`_.a.a/_.a.b/_.a.c`, depth from mdn-data `computed`) are needed. Search for a real case where the sort order gives the wrong cascade: shorthands that overlap without containing each other (`border` vs `border-inline`, `inset` vs `inset-block`, `grid-area` vs `grid-row`, `font` vs `font-variant`, `mask` vs `mask-border`, `all`), logical vs physical pairs, and `cn()` across modules. Build each as a fixture, check the computed style in Chrome against the author's intent (the later argument of cn() wins). Answer: the cases found, and a recommendation: keep the sort, fix it, or move to sublayers (with the layer count and DevTools cost).

## Resolution

Keep the sort, fix its data. Report: `docs/research/sublayers.md`; prototype and rerunnable Chrome check: `docs/research/sublayers-proto/` (`node run.mjs`, `node audit.mjs`, `node measure.mjs`).

- The sort is wrong where mdn-data's `computed` gives a wrong leaf count. Of 823 pairs where one property contains the other (Chrome's expansion), the sheet puts the contained one first in 79 and leaves 454 to the class hash (49% right). 76 and 424 of those are `all` (width 1, so `all` beats `padding`, `border`, `font` in both orders and ties with longhands). The rest: `border-block` > `border-block-start`, `border-inline` > `border-inline-start`/`-end` (wrong in both orders), the `-color/-style/-width` forms, `font-variant` > `font-variant-caps`, `white-space`, `marker`, `text-box`, `font-synthesis`. In the 37 containment cases the engine fails 12 in both argument orders.
- Counting the leaves of Chrome's expansion fixes all of them (37 of 37 pass in both orders). The `@webref/css` lists leave 2 ties (`text-box`). No inclusion comparator is needed: the count over correct leaves is a linear extension of inclusion.
- "The later argument of `cn()` wins" is not implemented and no sort or sublayer scheme can do it: the sheet is the same for `cn(a, b)` and `cn(b, a)`, so any pair that overlaps without containment (and the same property twice) is right in exactly one order (17 of 19 such cases pass one order only). It is a build-time `cn()` question.
- Conditions: a conditional rule beats an unconditional one (layers), and a wider breakpoint beats a narrower one even against a longhand. Inside one layer a pseudo-class beats a media query by specificity, which makes the sort's hover-before-md order dead (`hover(p)` beats `md(pl)`). `:where()` would change that; left as a decision.
- Sublayers by depth are worse: the same bad mdn-data entries give 6 failing containment cases, 41 pairs tie on depth (`grid-area`/`grid-row`), depth outside the condition inverts the breakpoint ladder, and the demo goes from 6 declared layers to 21 (27 DevTools nodes, 6 populated, +4.5% bytes).
- Recommendation: leaf counts from Chrome's expansion in `bun run webref`; the 12 cases as a test; a follow-up ticket for `cn()` (same property: later wins at build time; overlap without containment: build error); correct the "a longhand wins whatever the order" sentence in docs/API.md.
