---
# cssints-91im
title: 'Math functions everywhere: calc(), min(), max(), clamp() in numeric positions'
status: todo
type: feature
priority: high
tags:
    - wayfinder:task
created_at: 2026-09-29T17:02:00Z
updated_at: 2026-09-29T17:02:00Z
parent: cssints-vy0o
---

## Question

Found in cssints-v63t: `width("calc(100% - 2rem)")` fails in types and at build time. CSS Values 4 math functions (`calc()`, `min()`, `max()`, `clamp()`, and the rest of the family: `round()`, `mod()`, `rem()`, `abs()`, `sign()`, trigonometric functions) are valid wherever a `<number>`, `<length>`, `<percentage>`, `<angle>`, `<time>` and so on are, typed by the result of the expression. mdn-data has `<calc-sum>`/`<calc-product>`/`<calc-value>`, and the twin has a `calcType` checker (from calc-size() and relative colour).

- [ ] Twin: accept a math function wherever a numeric primitive is expected, and check the calc type of the expression against that primitive (`calc(100% - 2rem)` is a length-percentage; `calc(1px + 2s)` is an error); nested math functions; channel positions of relative colour included
- [ ] Types: accept math functions in those positions. Opaque balanced tokens with only the function name checked is fine if full typing is too expensive; measure (onlycolor, wide, users.ts)
- [ ] Generator: generate math functions in numeric positions; diff.ts against Chrome
- [ ] Rows in cases.ts; demo uses one calc()
