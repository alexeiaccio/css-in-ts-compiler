---
# cssints-6jou
title: 'Function calls: the type error on the bad argument, not the first'
status: completed
type: feature
priority: normal
created_at: 2026-10-08T13:39:51Z
updated_at: 2026-10-08T13:57:36Z
---

Follow-up of cssints-67qf (asked 2026-10-08). For non-math function calls (lightDark, linearGradient, oklch, var fallback...) the call is checked as text against <name()> and the type error lands on the first argument, because the recognizer does not say where it stopped. Put it on the argument where the text stops matching.
- [x] Find the argument: e.g. check prefixes (the text of args 1..i) with the recognizer's 'stuck/consume' (css.ts already computes Stuck/Consume for messages) and mark the first i where the prefix cannot continue; or a per-argument CheckIn like properties do (parts.ts). Pick the cheaper; no n-ary union cliffs (TS2589).
- [x] The message stays the twin's style (name(): unexpected "x" in "...", grammar <name()>) and names the argument position.
- [x] Type tests: an error on argument 2 and 3 of a few functions (lightDark, linearGradient, oklch with a bad channel, var fallback); math untouched.
- [x] Budgets: bench functions.ts and users.ts within 1.1x; bench/lsp.mjs demo before/after.

## Summary of Changes

Non-math function calls put the type error on the argument where the text stops matching `<name()>`, with the twin's wording and the position: `light-dark(): unexpected "1px" in "light-dark(white, 1px)", grammar <light-dark()> (argument 2)`. A call that ends too soon says `unexpected end ... (after argument 1)` on its last argument; one argument too many lands on the extra one.

Mechanism (function-types.ts only, css.ts untouched): prefix check with the recognizer's own pending substitution. A `var()` stands for any run of values, so `name(parts 1..i, var(--x))` is a `<name()>` while the parts can still go on (or `name(parts 1..i)` is complete). `Stop` walks the parts and returns the first one after which neither holds. It runs only when the call is already an error: a valid call pays nothing, and there is no per-argument CheckIn, no n-ary union and no alias around CheckIn (no TS2589). A failed sequence reports its start in Stuck/Consume, so Furthest alone could not do it (the old message said `unexpected "light-dark(white"`).

Tests: test/types/functions.ts, each `@ts-expect-error` on the line of the bad argument (lightDark 2, linearGradient 3 and 4, oklch 2, 3 and 5, rgb 3, colorMix 3, cubicBezier 3, nested call, too many, too few, var fallback); math untouched. Budgets: bench functions.ts 388952 tsc / 389281 tsgo (budget 377419 / 377711, within 1.1x, the base measures the same), users.ts unchanged; an error costs about 57k instantiations a call, only on a call that is an error. bench/lsp.mjs before and after within noise. docs/API.md "Other types" updated; dist rebuilt.
