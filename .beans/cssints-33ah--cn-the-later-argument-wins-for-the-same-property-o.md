---
# cssints-33ah
title: 'cn(): the later argument wins for the same property; overlap without containment is an error'
status: completed
type: task
priority: normal
created_at: 2026-10-02T10:10:20Z
updated_at: 2026-10-02T11:50:52Z
parent: cssints-9js6
---

## Question

`cn(a, b)` puts both styles in one class string, but `cn(a, b)` and `cn(b, a)` give the same sheet, so 'the later argument wins' does not hold (cssints-z03v). Decide with the user: for the same property set twice, drop the earlier declaration at build time; for two properties that overlap without containment (`border` with `border-inline`, `inset` with `inset-block`, `margin` with `margin-left`), raise a build error naming the pair, as frame()/surface() conflicts already work. What about the same property under different conditions (`cn(md(p(6)), p(2))`), and across modules? Then implement.

## Decision (with the user, 2026-10-02)

- The same property set twice in one `cn()` (or one class string): the later declaration wins, and the earlier one is dropped at build time. Under different conditions (`cn(md(p(6)), p(2))`) both stay: they are in different layers.
- Two properties that overlap without containment (`border` with `border-inline`, `inset` with `inset-block`, `margin` with `margin-left`, `color` twice under different spellings) are a build error naming the pair, like frame()/surface() conflicts: one order is always wrong, so the author must write one.
- Cross-module: two styles from different modules joined only in `cx()` in the browser cannot be seen; document that.

## Summary of Changes

Done by the coordinator together with the leaf counts (both need the same containment data). `merged()` in lib.ts runs for cn() and every condition wrapper: under one condition the same property again replaces the earlier declaration (also an alias, `word-wrap`/`overflow-wrap`); two properties that overlap without one containing the other throw at the call site. Containment is semantic, not only by longhand sets: a logical and a physical side of one group meet (css-logical-1 §4, the physical side depends on the writing mode), and a property that sets every side of a group covers whatever a sibling sets there. So `border` contains `border-inline` (the research had it as overlap by sets; it is containment, and `borderInline` wins, like `pl` against `p`), while `border-color`/`border-inline`, `border-top`/`border-color`, `margin-left`/`margin-inline` and `width`/`inline-size` are errors. Under different conditions both stay. Tests: fixtures cn-merge.ts, cn-overlap.ts, cn-contain.ts and test/cascade.mjs. API.md "One sheet" corrected and a cn() bullet added. Styles meeting only in cx() are not seen (documented).
