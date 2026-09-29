---
# cssints-91im
title: 'Math functions everywhere: calc(), min(), max(), clamp() in numeric positions'
status: completed
type: feature
priority: high
tags:
    - wayfinder:task
created_at: 2026-09-29T17:02:00Z
updated_at: 2026-09-29T17:24:01Z
parent: cssints-vy0o
---

## Question

Found in cssints-v63t: `width("calc(100% - 2rem)")` fails in types and at build time. CSS Values 4 math functions (`calc()`, `min()`, `max()`, `clamp()`, and the rest of the family: `round()`, `mod()`, `rem()`, `abs()`, `sign()`, trigonometric functions) are valid wherever a `<number>`, `<length>`, `<percentage>`, `<angle>`, `<time>` and so on are, typed by the result of the expression. mdn-data has `<calc-sum>`/`<calc-product>`/`<calc-value>`, and the twin has a `calcType` checker (from calc-size() and relative colour).

- [x] Twin: a numeric primitive (`<number>`, `<integer>`, `<length>`, `<percentage>`, `<length-percentage>`, `<angle>`, `<angle-percentage>`, `<time>`, `<resolution>`, `<x>`, `<y>`) accepts a math function whose calc type (css-values-4 §10.7: exponents of the base types, percent hint) is the primitive's; `calc(100% - 2rem)` is a length-percentage, `calc(1px + 2s)` is an error; all 21 functions, nested, typed division, constants, var() and env(); relative-colour channel positions use the same scanner (`min(r, 255)`, `round(r, 1)`)
- [x] `<flex>` is not in that list: replaced with an explanation. Chrome rejects `calc(1fr)` and `minmax(0, calc(1fr))`, and calc() has no `fr` unit, so the twin keeps rejecting it
- [x] Numeric ranges (`[0,∞]`) are not checked on a math function: accepted, as browsers clamp (noted in twin-core.ts). Chrome does check what it can resolve at parse time (cubic-bezier x, a grid line that rounds to 0)
- [x] Types: opaque balanced tokens with the function name checked (`MathCall` in css.ts, only after a numeric primitive failed on a token with a `(`); the twin does the calc type. onlycolor +0.04%, wide +0.24%, b100 +0.10%, users.ts +0.24% (+1.8% with three math calls added)
- [x] Generator: typed math expressions (depth 2) in every numeric primitive and a typed `<calc-sum>`; diff.ts against Chrome; 10500 typed samples agree 100%
- [x] Rows in cases.ts (valid, invalid, runtime-only), support rows, fixtures math.ts and math-bad.ts, the demo's container has `width("calc(100% - 2rem)")` and sheet.mjs checks it in the built CSS
- [x] Support warnings: BCD `css.types.<fn>` lookups warn for round, mod, rem, trig, pow, sqrt, hypot, log, exp, abs, sign; calc, min, max and clamp do not warn for the defaults

## Summary of Changes

- twin-core.ts: `mathScan`, a typed recursive-descent parser for the 21 math functions (arity per function, `+ -` need spaces, typed `* /`, constants, var() and env() as `any`); `mathValue` runs only where a numeric primitive did not match a token that has a `(`; `calc-sum` (calc-size()) is scanned by the same code; `calcType`, `relative()` and the calc-size prose rule in rules.ts are gone. Errors say why: `(cannot add length and time)`, `(min(1px, 2%) is length-percentage, not <length>)`.
- css.ts: `MathCall` for numeric primitives (balanced tokens, name checked); extract.mjs adds `<math-function>` to `<calc-value>` so calc-size() takes nested functions at type level too.
- gen.ts, diff.ts, cases.ts, check-support.ts, bench/math.ts, cssints fixtures, types test, demo.
- Not done: BCD `css.types.calc-keyword.*` for the constants (`pi`, `e`), typed division and nesting subfeatures of `css.types.calc`, the `size` keyword of calc-size(), attr() and env() arguments.
