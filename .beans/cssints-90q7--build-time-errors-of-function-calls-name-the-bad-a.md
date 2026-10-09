---
# cssints-90q7
title: Build-time errors of function calls name the bad argument
status: completed
type: feature
priority: normal
created_at: 2026-10-09T08:56:15Z
updated_at: 2026-10-09T09:09:14Z
---

Follow-up of cssints-6jou (asked 2026-10-09): the type error of a non-math call names the argument ("(argument 2)"), the build-time twin message does not. Make the build error name it too and point at it.
- [x] Find the argument at build time like Stop does in the types (prefix + var() pending substitution with the twin), only on the failure path (valid calls cost nothing).
- [x] Message: the twin's wording plus "(argument N)" / "(after argument N)"; the error location (loc) is the bad argument's offset, not the call's, if the site has argument offsets (else the call).
- [x] Tests: build errors for lightDark arg 2, linearGradient arg 3, oklch arg 5, too few/many; perf.mjs not affected (failure path only).

## Summary of Changes

A bad argument of a non-math function call is named at build time as in the types: `light-dark(): unexpected "1px" in "light-dark(white, 1px)", expected <light-dark()> (argument 2)`; too few: `(after argument 1)`; too many: `(argument 3)`.

Mechanism (packages/cssints/src/functions.ts, `argumentOf`): on the failure path only, the parts are cut into prefixes and each is checked with the twin as `name(prefix, var(--x))` (a var() stands for the rest, the twin's pending substitution) or `name(prefix)`; the first prefix where neither fits is the bad argument, none means the call ends too soon. Tokens in a prefix are probed as literals of their type. A valid call pays nothing, math functions are untouched, perf.mjs not needed.

Location: sites know only their own offset (`__at(file, n, start)`), a nested call is part of its site, so the error stays at the site (the `css.*` call holding the function call), not the argument. Argument offsets would need instrument.ts to record the start of every nested call's arguments and the evaluator to match them to calls: not done.

Tests: fixtures fn-arg-{light-dark,gradient,oklch,few,many}.ts checked in plugins.mjs (message and line). docs/API.md Errors and Functions updated; dist rebuilt.
