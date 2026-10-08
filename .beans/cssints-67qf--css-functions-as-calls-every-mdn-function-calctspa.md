---
# cssints-67qf
title: 'CSS functions as calls: every mdn function, calc(t.space.md, "*", 2)'
status: completed
type: feature
priority: normal
created_at: 2026-10-08T09:07:45Z
updated_at: 2026-10-08T09:08:14Z
---

Asked by the user (2026-10-08): CSS functions are calls whose arguments can be tokens, in the style css.calc(t.space.md, "*", 2) (operators as string parts), for every CSS function that has a grammar in mdn-data (math: calc, min, max, clamp, round, mod, rem, abs, sign, trig, pow, sqrt, hypot, log, exp; colour: rgb, hsl, hwb, lab, lch, oklab, oklch, color, color-mix (colorMix stays or becomes this), light-dark; image: url, image-set, gradients; others: attr, env, var, counter, steps, cubic-bezier, ...).
- [x] Generated from mdn-data (css-grammar extract or a script like members.ts), not hand-written per function: name camelCased (cubicBezier, lightDark, linearGradient), arguments as parts (tokens, numbers, strings, nested calls), the result a Typed OM value of the function's type, inlined at build time (nothing ships).
- [x] Types: each argument checked where cheap (a token of the wrong kind, a bad operator), the result's kind inferred for math from its arguments (length * number = length; length + time is an error); the whole call checked by the twin at build time with the usual message. Budgets: bench within 1.1x, a new bench of function calls; watch TS2589 and the members.ts size; editor latency on the demo.
- [x] Name clashes with existing members (css.url? css.attr is a condition wrapper today, css.min/max/clamp, colorMix): decide and say which.
- [x] Migrate the strings with var(--...) in apps/demo, apps/sky where a token can go in now; API.md Functions rewritten; docs.mjs green.

## Also: var() through TypeScript (asked 2026-10-08)

Raw `var(--space-sm)` strings in user code (18 in sky/demo today: Skeleton.tsx gradients, Thread.tsx calc, DevPosts.tsx) go: a token is already its var(), and `css.var(t.space.sm, "4px")` (the mdn var() function in the generated set) gives var(--space-sm, 4px) with the fallback checked as the token's type. A string that writes var(--name) of a declared token is a build warning naming the token to use (t.space.sm), and a var() of no declared custom property is a build error (a typo). Inside scope kernels the scope's own --_x stays a string (the scope namespacing), unless a typed way falls out cheaply.
- [x] css.var(token, fallback?) typed; raw var(--token) warns with the token's path; unknown var(--x) errors; every raw var() in apps migrated.

## Summary of Changes

Every function of `mdn-data/css/functions.json` (105, and the 5 more that mdn-data has a `name()` grammar for: url, src, contrast-color, superellipse, dynamic-range-limit-mix) is a call on `css` and a named import, camelCased, generated and not written per function:

- `css-grammar`: `scripts/extract.mjs` writes `src/functions.ts` (separator of the parts, and for the math functions what they give: kind of the arguments, a number, an angle) and adds the grammars no property reaches to `syntaxes` (`env()`, `minmax()`, `layer()`, ...); the recognizer reads `⟨name()⟩`, the sentinel of a call's result, wherever the grammar reaches `<name()>`.
- `cssints`: `src/functions.ts` builds each call (parts joined by the separator, by a space next to a `"+" "-" "*" "/"` string, an array is one part), checks the text with the twin against `<name()>` (math: against the numeric types), tokens as literals of their type, and returns a Typed OM value; `FUNCTIONS` in lib.ts names the members and appends `Fn` on a clash (`attrFn`, `colorFn`, `translateFn`, ...); `scripts/members.ts` writes the types into members.ts; `src/function-types.ts` has the types: math kinds with the precedence of CSS (length * number = length, length + time is an error on the argument), other functions checked as `<name()>` text, `VarCall`.
- `colorMix`, `min`, `max`, `clamp` are generated (`colorMix("in oklab", a, b)`, kinds inferred); the hand-written scope `cssints-fn` and `grammars.ts` are deleted.
- `var()`: `css.var(token, fallback?)` typed, the fallback checked as the token's type; a string with `var(--token)` of a declared token is a build warning naming the token, one of no token an error; `--_x` of scopes exempt. Migrated: sky Skeleton.tsx, Thread.tsx, DevPosts.tsx (a custom property set at run time and a class), demo Showcase.tsx.
- Bench: new `bench/functions.ts` (31 calls), members.ts +17% (144 KB to 169 KB), docs/API.md "Functions" and "var()" rewritten, docs.mjs green.
