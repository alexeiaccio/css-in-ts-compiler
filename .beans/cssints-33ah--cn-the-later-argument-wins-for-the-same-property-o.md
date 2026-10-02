---
# cssints-33ah
title: 'cn(): the later argument wins for the same property; overlap without containment is an error'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T10:10:20Z
updated_at: 2026-10-02T10:14:48Z
parent: cssints-9js6
---

## Question

`cn(a, b)` puts both styles in one class string, but `cn(a, b)` and `cn(b, a)` give the same sheet, so 'the later argument wins' does not hold (cssints-z03v). Decide with the user: for the same property set twice, drop the earlier declaration at build time; for two properties that overlap without containment (`border` with `border-inline`, `inset` with `inset-block`, `margin` with `margin-left`), raise a build error naming the pair, as frame()/surface() conflicts already work. What about the same property under different conditions (`cn(md(p(6)), p(2))`), and across modules? Then implement.

## Decision (with the user, 2026-10-02)

- The same property set twice in one `cn()` (or one class string): the later declaration wins, and the earlier one is dropped at build time. Under different conditions (`cn(md(p(6)), p(2))`) both stay: they are in different layers.
- Two properties that overlap without containment (`border` with `border-inline`, `inset` with `inset-block`, `margin` with `margin-left`, `color` twice under different spellings) are a build error naming the pair, like frame()/surface() conflicts: one order is always wrong, so the author must write one.
- Cross-module: two styles from different modules joined only in `cx()` in the browser cannot be seen; document that.
