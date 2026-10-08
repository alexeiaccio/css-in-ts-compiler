---
# cssints-ini5
title: 'Grammar ranges in the types: <integer [2,64]> and linear() with many stops'
status: completed
type: bug
priority: low
created_at: 2026-10-08T09:42:20Z
updated_at: 2026-10-08T11:10:49Z
---

Found by gradient() and tokens (cssints-yb1w, cssints-0gll; repros under "## Engine gaps").

- The types do not check a numeric range such as `<integer [2,64]>`: `stops = 1` is caught only at build time.
- The types reject `linear()` with more than 9 stops while the build accepts it: Open Props' spring and bounce easings are type errors (the tokens type test marks it).

## Todo
- [x] ranges on integer/number parts in the type-level recognizer, within the budget
- [x] linear() repetition in the types without a fixed limit

## Summary of Changes

- Lists: `ListRest` (css.ts) has no depth cap: tail-recursive, it goes on only with remainders not seen yet, so `linear()` with 44 stops (Open Props' springs and bounces) type-checks. `*`/`+` keep the cap of 8. Floor (empty.ts) 28.5k -> 26.4k tsc, 28.7k -> 26.7k tsgo.
- Ranges: a `[lo,hi]` whose bounds are integers from 0 up, -inf or inf is kept on the type node; a plain decimal (TS number or string, any unit) out of it fails on a numeric primitive (sign, integer part, fraction zero or not, digit-wise). Exponents, sentinels, math functions and var() pass. Not covered: unit bounds ([0s,inf], [-90deg,90deg]) and negative bounds ([-inf,-1]); the twin checks them.
- Tests: css-grammar cases (range rows moved from runtimeOnly), gradient `stops: 1` and `"65"` type errors, tokens' easeSpring3/easeBounce5 pass (README limit removed), cssints frame/surface range rows now @ts-expect-error.
- Budgets updated (+1-5% net, onlypadding +7%); wayfinder entry. cssints' bench red as on master (errors.ts 13 vs 12).
