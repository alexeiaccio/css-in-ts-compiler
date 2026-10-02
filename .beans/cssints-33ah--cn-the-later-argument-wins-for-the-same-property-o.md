---
# cssints-33ah
title: 'cn(): the later argument wins for the same property; overlap without containment is an error'
status: todo
type: task
created_at: 2026-10-02T10:10:20Z
updated_at: 2026-10-02T10:10:20Z
parent: cssints-9js6
---

## Question

`cn(a, b)` puts both styles in one class string, but `cn(a, b)` and `cn(b, a)` give the same sheet, so 'the later argument wins' does not hold (cssints-z03v). Decide with the user: for the same property set twice, drop the earlier declaration at build time; for two properties that overlap without containment (`border` with `border-inline`, `inset` with `inset-block`, `margin` with `margin-left`), raise a build error naming the pair, as frame()/surface() conflicts already work. What about the same property under different conditions (`cn(md(p(6)), p(2))`), and across modules? Then implement.
