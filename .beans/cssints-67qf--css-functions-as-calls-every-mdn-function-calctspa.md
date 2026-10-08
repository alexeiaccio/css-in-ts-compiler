---
# cssints-67qf
title: 'CSS functions as calls: every mdn function, calc(t.space.md, "*", 2)'
status: in-progress
type: feature
created_at: 2026-10-08T09:07:45Z
updated_at: 2026-10-08T09:07:45Z
---

Asked by the user (2026-10-08): CSS functions are calls whose arguments can be tokens, in the style css.calc(t.space.md, "*", 2) (operators as string parts), for every CSS function that has a grammar in mdn-data (math: calc, min, max, clamp, round, mod, rem, abs, sign, trig, pow, sqrt, hypot, log, exp; colour: rgb, hsl, hwb, lab, lch, oklab, oklch, color, color-mix (colorMix stays or becomes this), light-dark; image: url, image-set, gradients; others: attr, env, var, counter, steps, cubic-bezier, ...).
- [ ] Generated from mdn-data (css-grammar extract or a script like members.ts), not hand-written per function: name camelCased (cubicBezier, lightDark, linearGradient), arguments as parts (tokens, numbers, strings, nested calls), the result a Typed OM value of the function's type, inlined at build time (nothing ships).
- [ ] Types: each argument checked where cheap (a token of the wrong kind, a bad operator), the result's kind inferred for math from its arguments (length * number = length; length + time is an error); the whole call checked by the twin at build time with the usual message. Budgets: bench within 1.1x, a new bench of function calls; watch TS2589 and the members.ts size; editor latency on the demo.
- [ ] Name clashes with existing members (css.url? css.attr is a condition wrapper today, css.min/max/clamp, colorMix): decide and say which.
- [ ] Migrate the strings with var(--...) in apps/demo, apps/sky where a token can go in now; API.md Functions rewritten; docs.mjs green.
