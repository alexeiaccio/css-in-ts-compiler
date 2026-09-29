# Grammar coverage: every non-obsolete mdn property (cssints-unkt)

Question: what happens when `src/mdn.ts` holds every non-obsolete mdn-data property, not only the 57 in
`packages/cssints/src/lib.mjs` PROPS? Measured on 2026-09-29 with mdn-data 2.27.1, @webref/css 8.7.5, BCD 8.1.3,
Chrome 154.0.8037.57, tsc 5.9.3, tsgo 7.0.0-dev.20260707.2 and Node 24. The committed `mdn.ts` was not changed.
All runs used a copy of the package (see "How to reproduce").

## 1. Extract

mdn-data 2.27.1 has 651 properties: 490 standard, 107 nonstandard, 39 experimental and 15 obsolete. The run used
the 636 non-obsolete ones.

| | committed (PROPS) | all non-obsolete |
|---|---|---|
| properties | 57 | 636 |
| syntaxes (closure) | 143 | 256 |
| `mdn.ts` size | 18.6 KB (5.0 KB gzip) | 66.5 KB (15.5 KB gzip), 897 lines |
| properties with a webref range | | 125 |
| referenced `<type>`s that have no mdn-data syntax and no primitive | 10 | 15, reached by 88 properties |

The 15 unresolved types, with how many properties reach each one: `number-token` 40, `url` 28, `zero` 18,
`declaration-value` 16, `resolution` 16, `hash-token` 15, `ident` 15, `intrinsic-size-keyword` 14, `flex` 8,
`attr-name`, `attr-unit`, `syntax`, `x`, `y`, `autospace` (1 each). The twin and the types reject any alternative
that uses one of these types. So `url(a.png)` fails on `background-image`, and `1fr` fails on
`grid-template-columns`, which reaches `<flex>` only through the unresolved type.

## 2. Twin

**Grammar parsing: all 892 grammars (636 properties and 256 syntaxes) parse.** None throws, none leaves input
unread, and no keyword token contains an odd character.

The recognizer and the generator have these failures:

| cause | where | effect |
|---|---|---|
| a range with a unit, `<time [0s,∞]>` or `<angle [-90deg,90deg]>`: `Number("0s")` is NaN, so every value fails the range check | `animation-duration`, `transition-duration`, `font-style` (and through them `animation` and `font`) | the twin rejects **every** value: `valid("animation-duration", "1s")` throws. 37 generated values are rejected where Chrome accepts. `test/gen.ts` crashes on the same bound (`fc.integer` gets NaN) |
| an open repetition `#{2,}` | `dynamic-range-limit-mix()` | the twin works by accident (hi becomes `"-1"`, which is never reached). The types reject (`Dec[""]` is never). gen.ts crashes (max < min) |
| unresolved primitives (section 1) | 88 properties | valid values are rejected: `url()`, `1fr`, `<resolution>`, `<zero>`, … |

To make diff.ts run over all properties, the copy's gen.ts got two one-line patches: `parseFloat` for the range
bounds, and an unbounded hi when hi < lo. Only `--*` cannot be generated.

## 3. diff.ts and diff-support.ts (SEED 42, N 20)

| | 57 properties | 636 properties |
|---|---|---|
| twin vs generator (200 values each) | 57/57 pass | 630/635 pass. The 5 failures are the unit-range bug |
| twin vs Chrome | 1890/1957 agree (96.6 %) | 18404/21872 agree (84.1 %) |
| types vs twin (tsgo) | 456/456 | 5053/5080 (27 disagree) |
| twin accepts, Chrome rejects | 62 | 3385 |
|  … known upstream issue | 11 | 11 |
|  … prose rule | 24 | 38 |
|  … support warning (BCD) | 27 | 820 (540 std+exp, 280 nonstandard) |
|  … **unexplained** | **0** | **2516 (820 std+exp, 1696 nonstandard)** |
| wall time, diff.ts / diff-support.ts | 5.7 s / 1.4 s | 14.1 s / 3.0 s |

### Types vs twin: 27 disagreements

| cause | rows | examples |
|---|---|---|
| the twin's unit-range bug (types strip ranges, so they accept) | 9 | `animation-duration: "0.1s"`, `transition-duration: "302.4s"`, `font-style: "oblique -89.5deg"` |
| `<custom-ident>` is looser in the types: `]`, `/` and `image(rtl` pass as idents | 13 | `container: "/ normal"`, `grid-template-rows: "subgrid [ [ ] [ x ]"`, `-ms-grid-rows: "[ ] ] …"`, `list-style: "outside image(rtl image(rtl \"x\")"` |
| TS2589 "excessively deep" on wide `\|\|` groups | 3 | `font-variant: "none"`, `font-variant: "character-variant(x-c1)"`, `animation: "auto, 573.1ms"` |
| `#{2,}` is not in `Dec` | 1 | `dynamic-range-limit: "dynamic-range-limit-mix(…)"` |
| a range the types strip by design | 1 | `columns: "0 0"` |

### New unexplained "twin accepts, Chrome rejects" rows, by cause

**A. The property is unknown to Chrome and has no BCD entry, so support.ts cannot warn: 86 properties, 1865
rows.** 74 of them are nonstandard (1565 rows): every `-ms-*`, most `-moz-*`, and `-webkit-mask-repeat-x`, for
example. 12 are standard or experimental (300 rows): `caret`, `mask-border-mode`, `image-resolution`,
`initial-letter-align`, `line-height-step`, `ruby-merge`, and the six `timeline-trigger-*range*` longhands.

**B. The property is known to Chrome: 96 properties, 651 rows** (520 std+exp, 131 nonstandard `-webkit-*`):

| cause | rows / props | examples (Chrome rejects all of these) |
|---|---|---|
| Chrome lacks a value, and support.ts cannot see it (no BCD sub-feature, or one it cannot map, like `text-overflow.two_value_syntax`; `image()` is looked up as `css.types.image`) | 206 / 26 | `background-image: image("a.png")`, `list-style: symbols(cyclic "*")`, `text-overflow: clip clip`, `stroke-linejoin: arcs`, `outline-color: auto`, `vector-effect: non-rotation`, `break-inside: avoid-region`, `text-combine-upright: digits 2`, `image-orientation: 90deg`, `clip-path: ellipse(closest-side)` |
| the mdn-data grammar is wider than the spec | 160 / 8 | `column-rule-width: thin thick` (mdn `<'border-width'>`, spec `<line-width>`), `column-rule-style: none ridge double`, `-webkit-border-before-width: medium thick thin`, `zoom: 1 50%` (mdn `\|\|`, spec `\|`), `transform-origin: bottom 10px` |
| `<custom-ident>` exclusions that exist only in prose (`none`, `span`, `only`, generic families) | 77 / 15 | `counter-reset: none none`, `container-name: none none`, `view-transition-class: none none`, `grid-row: span`, `grid-column: 992 span span / -21 x`, `color-scheme: light only foo`, `position-try-fallbacks: none, --x`, `font: italic smaller emoji, fantasy, fantasy lighter` |
| a shorthand reuses a longhand that is itself a list (`<'scroll-timeline-axis'>` = `[…]#`), so commas nest | 48 / 4 | `scroll-timeline: none block, y`, `view-timeline: none auto auto, 0 auto, auto`, `position-try: normal none, none, flip-block flip-inline`, `timeline-trigger: --x scroll() normal, 19.2% / 135.7ex, …` |
| a numeric range that exists only in prose (negative values) | 43 / 14 | `r: -1px`, `stroke-width: -0.3`, `stroke-miterlimit: -0.3`, `stroke-dasharray: 199.6 -80ex`, `filter: saturate(-1)`, `tab-size: -3`, `interest-delay: -99.6s`, `-webkit-text-stroke-width: -0.2cqmax` |
| other prose rules and grammars newer in Chrome | 38 / 8 | `grid-template-rows: subgrid repeat(auto-fill, …) repeat(auto-fill, …)` (one auto repeat only), `animation-trigger: --a reset play-backwards play-forwards --b reset`, `animation-timeline: view(auto auto, 496.4% y)`, `overflow-clip-margin: 0` (Chrome needs `0px`), `font-palette: palette-mix(…)`, `dynamic-range-limit-mix(…)` |
| the grammar as written differs from its intent (`&&` binds looser than `,`) | 29 / 11 | `top: anchor(inside, 10% --a)` (Chrome accepts `anchor(--a inside, 10%)`), `inset: anchor(left, 57.5% --x) anchor-size(--y block, 74.2%) 0` |
| Chrome checks the contents of a string | 26 / 5 | `d: path("x")` (path data), `offset-path: path(evenodd, "x")`, `font-feature-settings: "ligatures"` (the tag must be 4 letters), `font-variation-settings: "x-w-" 1.1`, `font-language-override: "x-et--o"` |
| a KNOWN rule that covers only its original property | 24 / 5 | linear() with one stop: `animation-timing-function: linear(117.8 602.9%)`, `animation: … linear(-80 422.9%)`. anchor-center: `place-items: anchor-center`, `justify-items: anchor-center` |

The reverse direction (twin rejects, Chrome accepts; 46 mutants): 8 come from the unit-range bug. About 22 are
unclosed functions that Chrome closes at EOF (`image-set("x"`). 7 are `timeline-trigger: none none` (Chrome's
grammar is newer). The rest are `calc-size()` expressions, `font-variant` duplicates and `contain-intrinsic-size`.

## 4. Type-level cost

The benches import `src/api.ts` (10 `PropertyFn`s) or `src/api-all.ts` (one `PropertyFn` for each of the 635
properties). `wide.ts` has 100 calls on 100 different standard properties, with values that the twin, the types
and Chrome all accept. The numbers are medians of 3 sequential runs.

| bench | table | tsc inst | tsc wall | tsgo inst | tsgo wall | tsc / tsgo memory |
|---|---|---|---|---|---|---|
| empty.ts | 57 | 15055 | 0.73 s | 15228 | 0.11 s | 183 / 31 MB |
| empty.ts | 636 | 15055 | 0.61 s | 15228 | 0.10 s | 165 / 36 MB |
| emptyall.ts (635 fns declared, none called) | 636 | 15680 | 0.82 s | 15853 | 0.11 s | 180 / 38 MB |
| b100.ts (10 props × 10) | 57 | 204435 | 1.09 s | 206785 | 0.25 s | 244 / 83 MB |
| b100.ts | 636 | 204435 | 1.08 s | 206785 | 0.23 s | 277 / 89 MB |
| wide.ts (100 props × 1) | 636 | 430860 | 1.18 s | 434066 | 0.49 s | 327 / 132 MB |

- **An unused big table costs nothing in instantiations.** empty.ts and b100.ts are identical with 57 or 636
  properties. Only the type count grows (tsc 4.2 k → 6.8 k, tsgo 5.3 k → 10.2 k), and wall time stays within
  noise. Declaring all 635 functions adds 625 instantiations (≈1 per function) and 0.2 s in tsc at most.
- **The cost of a call depends only on the grammar it reaches.** wide.ts costs ≈4.2 k instantiations per call
  (100 different grammars). b100.ts costs 1.9 k per call, because its 10 grammars are cached.
- One call per property (634 properties, tsgo, net of emptyall): median 4.2 k, p90 98 k (the first use of
  `<color>`), p99 126 k. 498 properties cost < 10 k, 62 cost 10–50 k, 71 cost 50–150 k and 3 cost more.
  **Outliers: `font-variant: "none"` costs 4.3 M instantiations and ends in TS2589. In tsc that is 9.1 s and
  1.5 GB; in tsgo it is 2.4 s.** `animation` costs 213 k and also ends in TS2589.
- Cause: `AnyOrder` has no short-circuit for `S = never`. A failed part still recurses through every
  permutation of the remaining parts (`font-variant` has 20 `||` parts, `animation` 9). The experiment was a
  one-line change, `[S] extends [never] ? never : …` in `AnyOrder`. With it, `font-variant` costs 51 k (tsc
  0.64 s, tsgo 0.14 s) and `animation` 54 k. The per-property max is then `background` at 249 k, and no
  property errors. wide.ts drops to 391 k (tsc) and 394 k (tsgo), and empty.ts grows by 147 instantiations. The
  TS2589 rows leave types-vs-twin; two animation mutants take their place, and those come from the twin's
  unit-range bug.

## Recommendation

**Ship every standard and experimental property at once (529), without a curated set. Keep the 107 nonstandard
properties out, or behind an opt-in.**

- The type level does not justify curation. The table costs nothing when unused, 635 declared functions cost
  ≈600 instantiations, and each call costs the same as today. First fix `AnyOrder` (one line; without it,
  `font-variant` blocks the whole check). Also add the open `{A,}` to `Dec` and `Digits`.
- Most of the Chrome noise comes from the nonstandard properties: 1696 of 2516 unexplained rows. 74 of them are
  `-ms-*` or `-moz-*` properties that no engine the project targets knows, and BCD has no entry for them. An
  opt-in list (e.g. `-webkit-line-clamp`, `-webkit-text-stroke`, `-webkit-appearance`) can come later if anyone
  asks for it.
- Before or with the switch, the twin needs: unit-aware range bounds (`parseFloat`, which also fixes gen.ts),
  primitives for `flex` (`fr`), `url`, `resolution` and `zero`, and the KNOWN rules extended to the new
  properties (linear() on `animation*` and `*-timing-function`, anchor-center on `place-items` and
  `justify-items`).
- The remaining 820 unexplained std+exp rows fall into the causes in table B. Prose `<custom-ident>` exclusions,
  prose ranges and Chrome-missing values that support.ts cannot map are rules.ts and support.ts work. The
  mdn-data grammar bugs (`column-rule-*`, `zoom`, `transform-origin`, list-valued longhands in shorthands) are
  upstream reports and KNOWN entries. None of them blocks shipping the table: each makes the twin too
  permissive, never too strict.

## How to reproduce

```sh
cp -R packages/css-grammar scratch/css-grammar && cd scratch/css-grammar   # same depth: node_modules links resolve
node -e 'const p=require("mdn-data/css/properties.json");console.log(Object.keys(p).filter(k=>p[k].status!=="obsolete").join(" "))' > all.txt
node scripts/extract.mjs $(cat all.txt)
# in test/gen.ts: bound() uses parseFloat, and rep hi is used only when Number(hi) >= lo
node test/diff.ts; node test/diff-support.ts
# benches: one `export declare const x: PropertyFn<"p">` per property in src/api-all.ts, then
# tsc/tsgo --strict --noEmit --skipLibCheck --extendedDiagnostics bench/<file>.ts
```
