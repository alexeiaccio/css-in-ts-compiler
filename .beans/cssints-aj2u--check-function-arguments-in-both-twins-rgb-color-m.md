---
# cssints-aj2u
title: Check function arguments in both twins (rgb, color-mix, calc)
status: todo
type: feature
priority: high
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
blocked_by:
    - cssints-2qiv
---

Today `fn` and opaque types accept `name(...)` up to the first `)` without checking the inside.

- [ ] Bracket-aware token split in both twins (nested parens, commas inside functions)
- [ ] Quoted literals (`'+'`, `'*'`) in both lexers; `calc-sum` and `calc-product` currently fail to parse at runtime
- [ ] Check `rgb()`, `color-mix()`, `fit-content()` args against their grammar
- [ ] `calc()`: check it in the twin; keep it opaque at type level if the cost is too high
- [ ] Add rows to `cases.ts`; instantiation budget holds
