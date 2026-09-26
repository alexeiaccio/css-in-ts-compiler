---
# cssints-aj2u
title: Check function arguments in both twins (rgb, color-mix, calc)
status: completed
type: feature
priority: high
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T10:35:54Z
parent: cssints-tmv8
blocked_by:
    - cssints-2qiv
    - cssints-n7hd
    - cssints-j24s
---

Today `fn` and opaque types accept `name(...)` up to the first `)` without checking the inside.

- [x] Bracket-aware split in both twins. Not a depth-counting split: function arguments are now parsed as a grammar node, `name( args )`, and consumed recursively, so nesting falls out of recursion. The value token (`Tok1`/`tok1`) now also ends at `)`.
- [x] Quoted literals (`'+'`, `'*'`) in both lexers; `calc-sum` and `calc-product` currently fail to parse at runtime
- [x] Check `rgb()`, `color-mix()`, `fit-content()` args against their grammar
- [x] `calc()`: mdn.ts has no `calc()` syntax; the calc grammar that properties can reach is `<calc-sum>` inside `calc-size()`. It is checked in both twins (no type-level opaque fallback needed): the cost is paid only when a value starts with `calc-size(`. The grammar is checked, not the units: `calc-size(any, 1px - 2)` passes, Chrome rejects it.
- [x] Add rows to `cases.ts`; instantiation budget holds (raised with `--update`, see summary)

Note from `diff.ts`: the opaque rule stops at the first `)`, so `border-color: light-dark(red, light-dark(red, blue) currentColor` is accepted. Needs the comma rule first (cssints-j24s): argument grammars rely on it, for example `rgb( <percentage>#{3} , <alpha-value>? )`.

## Summary of Changes

- Both lexers: a bare `(` group and quoted literals (`'+'`, `'*'`). css.ts tries them only in `NextWord`, off the hot path of `Next`.
- Both parsers: `name( args )` becomes `["fn", name, args]`; a bare `( args )` is a function with an empty name. `X#{A,B}` becomes `X [ , X ]{A-1,B-1}`. Before, it was a repetition of lists, so `rgb(1%, 2%, 3%)` was rejected.
- Both recognizers: a function consumes `name(`, then its argument grammar, then `)`. All opaque rules are gone (`calc-sum`, `calc-size()`, `anchor-size()`, `color-function`, `light-dark()`). A `<name()>` type checks that the value starts with `name(` before it parses the grammar, so `<color>` on `red` does not parse the ten color-function grammars. Added a `<dimension>` primitive for `calc-value`.
- gen.ts: `CALLS` is removed. Function calls are generated from their argument grammar (every function in mdn.ts; `<url>` has no syntax, so it cannot be generated).
- cases.ts: 9 valid rows (legacy and modern `rgb`/`rgba`, `hsl`, `color-mix`, nested `light-dark(color-mix(...))`, `calc-size` with parentheses) and 14 invalid rows (mixed legacy rgb, too few or too many arguments, a trailing comma, an unclosed `(`, the nested unclosed `light-dark`, `fit-content(red)`, `calc-size(any, 1px +)`, `red, url(a.png)`).
- diff.ts: types vs twin 456/456. Chrome agreement 1867/1950 -> 1857/1957. The number dropped because the generator now reaches real arguments. The opaque garbage that the twin used to accept is gone: `light-dark(red, light-dark(red, blue) currentColor`, `color-mix(in srgb, red, red, blue)`, `... blue) light-dark(...)`. The new rows are: `calc-size` with mixed units (the grammar has no unit check); `fit-content(<lp>)` and `image()` (Chrome does not support them); 5 mutants with an unclosed `(` that Chrome accepts because CSS closes blocks at EOF. The twin rejects the unclosed ones on purpose.
- Budget, raised with `node budget.mjs --update` (tsc, before -> after): b200 195949 -> 203668 (+3.9%), b100 181289 -> 188708, onlycolor 91220 -> 96358 (+5.6%), err 122677 -> 129207, empty 13600 -> 13944. tsgo is about the same. The cost comes from descending into `<color-function>` (~4.4 k on a single `color()` call) and from the `)` split in `Tok1` (~1.3 k on b200, after a fast path for tokens with no `,` or `)`). Unconstrained `Mult<N>` and `Close<R>` avoid ~1.5 k of declaration-time cost.

Left open: the `!` multiplier is still a no-op (`image()` is accepted); calc unit/type checking; unclosed functions at the end of a value (Chrome accepts them, we reject); `<url>` is missing from mdn.ts.
