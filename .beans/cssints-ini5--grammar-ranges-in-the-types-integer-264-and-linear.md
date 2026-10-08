---
# cssints-ini5
title: 'Grammar ranges in the types: <integer [2,64]> and linear() with many stops'
status: todo
type: bug
priority: low
created_at: 2026-10-08T09:42:20Z
updated_at: 2026-10-08T09:42:20Z
---

Found by gradient() and tokens (cssints-yb1w, cssints-0gll; repros under "## Engine gaps").

- The types do not check a numeric range such as `<integer [2,64]>`: `stops = 1` is caught only at build time.
- The types reject `linear()` with more than 9 stops while the build accepts it: Open Props' spring and bounce easings are type errors (the tokens type test marks it).

## Todo
- [ ] ranges on integer/number parts in the type-level recognizer, within the budget
- [ ] linear() repetition in the types without a fixed limit
