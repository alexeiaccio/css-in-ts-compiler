---
# cssints-gcuz
title: 'Extend <color> grammar: relative colour, contrast-color(), if()'
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T14:46:45Z
updated_at: 2026-09-29T16:56:21Z
parent: cssints-vy0o
blocked_by:
    - cssints-djzw
    - cssints-lmru
---

## Question

The mdn-data `<color>` grammar accepts `color-mix()` and `light-dark()` but rejects relative colour syntax (`oklch(from var(--x) l c h)`), `contrast-color()` and `if()` (cssints-kag5). Find the spec grammars (mdn-data, or @webref/css through extract.mjs), add them without hand rewriting, and check them in both twins, the generator and against Chrome; keep the budget.

## Summary of Changes

`<color>` now accepts relative colour, `contrast-color()`, `if()` and `var()`; both twins, the generator and Chrome 154 agree on the new forms (packages/css-grammar only).

- **Grammars (extract.mjs).** The colour functions `rgb() rgba() hsl() hsla() hwb() lab() lch() oklab() oklch() color()` and `<xyz-params>` are now @webref/css's (css-color-5, with `[from <color>]?`); mdn-data has no `from`, and its `<xyz-params>` names an undefined `<xyz>`. `<color>` is mdn-data's plus `<contrast-color()> | <if()> | <var()>`. `<if()>`, `<if-branch>`, `<if-test>` are webref's (css-values-5); the parameterized `<boolean-expr[ <if-test> ]>` is written out as `<if-boolean-expr>` from webref's own `<boolean-expr>`. `<declaration>` gains custom properties (`style(--x: 1)`). Documented deviations: `contrast-color( <color> )` is css-color-5 §8 (webref only has the css-color-6 draft with `tbd-fg`), `<custom-property-name>` is `<dashed-ident>`, no `<general-enclosed>` in `if()` conditions (as in the other conditions).
- **Twin.** Channel keywords (`r g b`, `h s l`, `h w b`, `l a b`, `l c h`, `alpha`, and `x y z` or `r g b` after the space of `color()`) are valid only inside the function that has a `from`, and only there does `calc()` (typed: number, percentage or angle for the position) or `var()` stand for a number. `if()` is a scanned primitive: branches split at top-level `;` and `:`, conditions matched against `<if-condition>`. `calcType` moved from rules.ts to twin-core.ts (shared with calc-size()). The lexer reads `;` as a literal.
- **Types.** Balanced tokens after `from` (cost: relative colour is opaque at the type level) and inside `if()`; `contrast-color()` and `var()` are checked by grammar. onlycolor +1.4 %, wide +0.6 %, b100 +1.0 %; a relative colour call costs 1 to 11 k instantiations, like `rgb(1 2 3)`. bench/relative.ts added.
- **Tests.** cases.ts: 16 valid rows, 6 invalid rows (types and twin) and 15 runtime-only rows (types accept, twin rejects). gen.ts generates relative colours (keywords, `none`, calc over keywords) and lets four `<declaration>`s stand for all properties. support.ts: `from` looks up `css.types.color.<fn>.relative_syntax`, and `reach()` skips `<declaration>` (else every property "reached" every other through `if()`).
- **Chrome 154.** `diff.ts` 16703/18271 agree (was 16731/18215): the new disagreements are mutants with `var()` or `if()`, which Chrome accepts whatever the grammar says. No generated value the twin rejects, none new that Chrome rejects; `diff-support.ts` has 0 unexplained rows. `contrast-color(<color>)` and `if()` are supported by Chrome 154; BCD warns for older targets (`css.types.color.contrast-color` 147, `css.types.if` 137, `relative_syntax` 119 to 125).
- **Not done.** `if()` is only in `<color>` (Chrome takes it in any property; that is the same pending-substitution mechanism as `var()` and belongs to a value-level rule). `min()`, `max()`, `clamp()` and nested `calc()` in channel positions are rejected (Chrome accepts them). `alpha()` and the HDR functions are left out.
