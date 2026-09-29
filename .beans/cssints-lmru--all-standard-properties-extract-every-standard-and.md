---
# cssints-lmru
title: 'All standard properties: extract every standard and experimental property, fix the blockers'
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T15:02:52Z
updated_at: 2026-09-29T16:27:52Z
parent: cssints-vy0o
blocked_by:
    - cssints-djzw
---

## Question

Act on cssints-unkt (docs/research/grammar-coverage.md). Blocked by the TS + Effect port, which rewrites the twin.

- [x] `extract.mjs` with no arguments takes every standard and experimental mdn property (529). The 107 nonstandard ones stay out of the core; LightningCSS covers them: 16 are prefixed forms of standard properties and 9 are the legacy flexbox `box-*`, both emitted by LightningCSS from the browserslist targets when the user writes the standard property. About 65 are dead IE/old-Firefox properties and 3 are the replaced masonry draft. Only ~5 live WebKit-only properties (`-webkit-tap-highlight-color`, `-webkit-touch-callout`, `-webkit-box-reflect`, `-webkit-user-modify`, `-webkit-overflow-scrolling`) are ever written by hand: a small built-in list or the first plugin (cssints-rq2r decides). Engine names come from this list (`lib.mjs`).
- [x] Twin and gen.ts: range bounds with units (`<time [0s,∞]>`, `<angle [-90deg,90deg]>`), since today every value of animation-duration, transition-duration and font-style fails
- [x] Open repetition `{A,}` / `#{A,}` in both twins and gen.ts
- [x] The missing primitives: `url`, `zero`, `resolution`, `flex`, `hash-token`, `ident`, `declaration-value`, `intrinsic-size-keyword` (in both twins and the generator). `number-token` is left out: it is only reached through mdn-data's `<integer>` (`<number-token>`), which the `integer` primitive shadows; no property reaches it. Added instead: `x` and `y` (cursor hotspot numbers), `ident-token` (`attr()`), and `<string>` is now scanned as a whole (it failed on any string with a space, comma or parenthesis). extract.mjs takes a type that mdn-data lacks from the spec grammar (`<autospace>`, `<attr-unit>`, `<syntax>`); `attr(data-x px)` and `text-autospace` values now pass, `type(<length>)` inside `attr()` still does not (a grammar for grammars).
- [x] css.ts: the `[S] extends [never]` short-circuit in `AnyOrder`; `font-variant: "none"` drops from 4.3 M instantiations to about 51 k; no TS2589 on any property
- [x] diff-support over all properties: classify the unexplained standard rows (820 in the research) by cause, fix ours, and extend KNOWN and the prose rules; types vs twin agree on every row Done: 826 unexplained rows (after the primitives) → 0, of 529 properties. Fixed ours: `<string>` scanning, prose rules with citations (grid-template-areas cells, span in grid lines, counter names, container-name, view-transition-class, color-scheme, four-character font tags, negative radii and stroke lengths, negative filter amounts, SVG path data, animation names), support lookup for `f` without `_function` and for strings. Rest is KNOWN with the upstream cause (mdn-data stale or wider than the spec, BCD gaps, Chrome bugs). The types differ from the twin only by ranges, which diff.ts now skips by design.
- [x] Budgets updated and recorded (per-call cost ~4.2 k; the unused table costs 0). Measured: the unused table costs 0 (empty.ts 15485 and b100.ts 204355 instantiations, tsc, with the 57 or the 529 properties); `bench/wide.ts`, 107 different standard properties with values that twin, types and Chrome accept: 863597 tsc / 867005 tsgo net, 8.1 k a call on average (median of a call alone 6.5 k, p90 98 k = the first `<color>`; the research's 4.2 k is the median over all 634 properties, mine is 107 of the common, heavy ones).

## Summary of Changes

- extract.mjs: no arguments = every standard and experimental mdn-data property (529; `--*` and the six `-webkit-*` among them, `--*` is not a member); a type mdn-data lacks comes from the spec grammar. cssints: `PROPS` skips `--*`, `members.ts` regenerated (537 members). The demo CSS is byte-identical.
- Twin (`twin-core.ts`), generator and types: range bounds with units (a range is compared in the canonical unit: `oblique 1.5rad` passes `[-90deg,90deg]`, `100grad` does not), open repetition `{A,}`, and the primitives `url`, `zero`, `resolution`, `flex`, `ident`, `ident-token`, `hash-token`, `declaration-value`, `intrinsic-size-keyword`, `x`, `y`; `<string>` is scanned as a whole. `number-token` is not needed (only reached through the shadowed mdn `<integer>`). `<custom-ident>` is stricter in the types (no `]`, `/`, `image(rtl`), like the twin.
- css.ts `AnyOrder` stops on a failed part (`font-variant: "none"` 4.3 M → 50 k).
- diff-support over all properties: 826 unexplained rows → 0. Ours, fixed: 128 rows by prose rules (each cites the spec text), 17 by the support lookup (functions without `_function`, strings). Upstream, in KNOWN with a reason: 324 mdn-data stale/wider/range missing, 206 BCD gaps, 73 spec grammar as written, 71 Chrome differs, 7 the linear() gap.
- diff.ts (SEED 42, N 20): twin vs generator 529/529; twin vs Chrome 154: 16731/18215 agree (91.8 %; research: 84.1 % on 636 properties, 96.6 % on the old 57); types vs twin 4232/4232 (ranges skipped by design; was 27 rows).
- Budgets: wide.ts (107 properties) added, `budget.json` updated; the unused table costs 0.
- Not done: the reverse direction (twin rejects, Chrome accepts, 38 mutants: unclosed functions that Chrome closes at EOF, `image-orientation: none` and `tab-size: 3.5` from stale mdn-data grammars, `timeline-trigger: "--a view()"`); attr()'s `type(<length>)`; the ~5 live `-webkit-*` properties outside the standard list (cssints-rq2r).
