# webref property grammars against mdn-data (cssints-h6qk)

Question: where does `@webref/css` differ from mdn-data for the 529 properties (and the syntaxes they reach), and should
`extract.mjs` take the webref grammar where Chrome confirms it? Measured on 2026-09-30 with mdn-data 2.27.1,
@webref/css 8.7.5, Chrome 154.0.8037.58 (installed, through `playwright-core`), Node 24.21, tsc 5.9.3 and tsgo
7.0.0-dev.20260707.2. The shipped `mdn.ts` was not changed. Every variant is an alternative `mdn.ts` in a scratch copy of
the package. The only code in the branch is a default-off switch in `scripts/extract.mjs` (see "How to reproduce").

**Answer.** Switch per property, with a Chrome-judged rule. It moves 47 properties to webref. On one common sample
Chrome agrees with the twin on 90.0% of values, up from 88.6%, and no property gets worse. The budgets move by 0.5% at
most and the package tests stay green (45 properties once CSS-wide keywords are exempted from the rule; section 4). A full switch is worse than staying: 84.6% agreement, 171 properties that accept
draft syntax, nine curated test cases broken, and type budgets 11–14% over.

## 1. Where webref differs

### Properties (529)

Text comparison of the shipped property grammar (with its ranges) against webref's: 337 identical, 3 cosmetic, 1 range
only, 181 different, 7 not in webref. Text is a poor guide, because webref often writes the same thing with other
references (`<line-width>` for `<'border-top-width'>`) and because what a property accepts depends on the types it
reaches. So each property was also compared by behaviour: 150 values drawn from each grammar, plus one mutant per value,
judged by the twin under both tables and by Chrome (91 767 distinct cases, all properties, both grammars).

| class                                                                        | properties | notes                                                                                                                                            |
| ---------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| same behaviour, identical text                                               | 259        |                                                                                                                                                  |
| same behaviour, cosmetic text (same parse tree)                              | 3          | `steps()`-style spacing, redundant brackets                                                                                                      |
| same behaviour, restructured text (**naming**)                               | 33         | `<'border-top-width'>` vs `<line-width>`, `<border-radius>` vs `<length-percentage [0,∞]>{1,2}`                                                  |
| not in webref (**naming**)                                                   | 7          | `--*`, and six `timeline-trigger-*range*` longhands that webref renamed `-activation-range` and `-active-range`                                  |
| **range only** (negative numbers), webref right                              | 8          | `overflow-clip-margin`, `grid-column-start`, `mask-border-width`, …                                                                              |
| webref **narrower**, Chrome confirms webref (mdn-data wider)                 | 9          | `contain`, `grid-row`, `grid-column`, `grid-area`, `mix-blend-mode`, `text-box`, `text-emphasis-position`, `transform-origin`                    |
| webref **wider**, Chrome confirms webref (mdn-data stale)                    | 26         | `tab-size`, `letter-spacing`, `word-spacing`, `overscroll-behavior*`, `flex-wrap`, `background-clip`, `z-index`, `cx`/`cy`/`r`/`x`/`y`/`rx`/`ry` |
| both directions, Chrome confirms webref                                      | 5          | `column-rule-style`, `position-area`, `position-try`, `position-try-fallbacks`, `tab-size`                                                       |
| both directions, Chrome confirms mdn-data                                    | 3          | `baseline-shift`, `fill`, `stroke`                                                                                                               |
| webref wider, Chrome rejects everything extra (**webref newer than Chrome**) | 86         | see the causes below                                                                                                                             |
| mixed: webref right on some values, draft syntax on others                   | 90         | `image-orientation`, `column-rule-width`, `zoom`, `outline-color`, `border-*-color`, `color`                                                     |
|                                                                              | 529        |                                                                                                                                                  |

The 8 "range only" rows are the ones where every distinguishing value has a negative number, so one source carried a
range the other lacks (7 webref narrower, 1 wider). The 14 properties that only webref has and that its grammars reach
(the two `animation-delay-*` longhands, four `box-shadow-*`, `block-ellipsis`, `white-space-trim` and the six renamed
`timeline-trigger-*` ones) are not counted above.

**Why webref is newer than Chrome for 171 properties** (properties with at least one value webref accepts, mdn-data
rejects and Chrome rejects; a property can be in several rows):

| cause                                                                                                                                                                           | properties |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| colour: `light-dark()` with images, `contrast-color()` forms, `device-cmyk()`, HDR functions                                                                                    | 44         |
| `hairline` in `<line-width>` (css-borders-4)                                                                                                                                    | 34         |
| draft keywords: `balance-all`, `force-hidden`, `manual`, `discard`, `avoid-short-last-line`, `match-parent`, `oblique-only`, `high-quality`, `running()`, `fade()`, `generic()` | 25         |
| `contain` as a sizing keyword (css-sizing-4 `<box-size>`)                                                                                                                       | 16         |
| `stripes()` and `<image-1D>` in border colours                                                                                                                                  | 12         |
| block and inline position keywords in `<position>`                                                                                                                              | 12         |
| `baseline first` / `last baseline`                                                                                                                                              | 9          |
| `<border-radius>` with `/` in the corner longhands                                                                                                                              | 8          |
| `repeat-block`, `repeat-inline`                                                                                                                                                 | 4          |
| `shape()`, `polygon(… round …)`, two-value `animation-delay`                                                                                                                    | 3          |
| other (`palette-mix()` with `xyz-d50`, `display: grid-lanes`, `appearance: base`, …)                                                                                            | 35         |

### Syntaxes (319 in the shipped table)

| text against webref         | syntaxes |
| --------------------------- | -------- |
| identical                   | 223      |
| cosmetic                    | 16       |
| different                   | 59       |
| no webref type of that name | 21       |

By behaviour (100 values per type from each grammar, judged by both twins, no Chrome): 227 same, 54 webref wider, 18
narrower, 19 both. 41 of them have identical text and differ only through the types they reach.

- **Different text, 59:** 16 are our own overrides in `extract.mjs` (`color`, `contrast-color()`, `calc-value`, the
  `if()` and condition types, `<mf-name>`, `<media-type>`, …). Most of the rest is webref newer than Chrome
  (`color-function` with `ictcp()`, `jzazbz()`, `predefined-rgb` with `rec2100-*`, `light-dark()` with images,
  `line-width` with `hairline`, `repeat-style`, `bg-clip`, `shape-box`, `basic-shape`, `try-tactic`, `outline-line-style`).
  A few are webref narrower: `image` leaves out `<paint()>`, `display-legacy` leaves out `inline-list-item`,
  `feature-tag-value` wants a four-letter tag.
- **Naming, 21:** eight mdn-data names have webref twins with the same tree: `deprecated-system-color` /
  `deprecated-color`, `calc-constant` / `calc-keyword`, `system-family-name` / `system-font-family-name`, `family-name` /
  `font-family-name`, `generic-complete` / `generic-font-complete`, `generic-incomplete` / `generic-font-incomplete`,
  `number-percentage` / `opacity-value`, `size-feature` / `media-feature`. `position-area` keywords are spelled
  differently (`span-y-self-start` in mdn-data, `span-self-y-start` in webref), and Chrome takes webref's. The other 13 are
  ours or mdn-data only (`declaration`, `if-group`, `timeline-range-name`, `animation-action`, `generic-family`, …); two
  of them (`custom-property-name`, `feature-value-name`) only match a webref type by coincidence of shape.
- **Prose-only webref types.** webref names `<size-keyword>` (in `calc-size-basis`), `<url-set>` (in `cursor`), and a few
  others without giving a grammar. Under mdn-data the same place is `<intrinsic-size-keyword>`. `<size-keyword>` is
  "whatever sizing keywords the property allows", so it is context dependent.
- **Parameterised types:** exactly one grammar in webref, `<boolean-expr[ <if-test> ]>` in `<if-condition>`, which
  `extract.mjs` already overrides. None in mdn-data. None in any property grammar.
- **webref defines four names that the twin treats as primitives:** `length-percentage` (`[ <length> | <percentage> ]`),
  `integer` (`<number-token>`), `url` (`<url()> | <src()>`) and `calc-sum`. Taking them from webref breaks ranges
  (`width: -0.1%` is generated but rejected), so the variants leave them native.

### Does the twin parse webref?

Of the 1403 webref grammars that have a syntax, 1401 parse (1384 of 1396 in the earlier count; quoted delimiters now
work). The two failures are webref's own: `path-length` is written `none | <length> [0,∞]` (the range is outside the angle
brackets) and `<general-enclosed>` has an unbalanced `)`. Every grammar of every variant below parses: 930 of 930 for the
full switch, 859 of 859 for the 47-property variant.

## 2. The variants

All four share the twin, `css.ts` and the generator; only `mdn.ts` differs. A type that a webref property reaches is
webref's, and is emitted as `<name~w>` when its text differs from mdn-data's (the twin reads `<name~w>` without
change). `<name()>` types cannot be renamed, because the twin tests for `name(`, so in a list they keep mdn-data's text.

- **mdn-data:** today.
- **47 properties:** the rule in section 4.
- **67 properties:** a looser rule, webref wherever it agrees with Chrome on more of the common sample than mdn-data.
- **all webref:** every property that webref has (529, plus 14 webref-only longhands that its grammars refer to) and
  its types.

|                                                           | mdn-data (today)         | **47 properties**        | 67 properties            | all webref               |
| --------------------------------------------------------- | ------------------------ | ------------------------ | ------------------------ | ------------------------ |
| properties from webref                                    | 0                        | 47                       | 67                       | 529 (+14)                |
| syntaxes / `mdn.ts` bytes (gzip)                          | 319 / 82 508 (18 122)    | 330 / 83 765 (18 355)    | 367 / 87 515 (19 104)    | 386 / 91 453 (19 934)    |
| **common sample** (91 767 cases): agree with Chrome       | 88.60%                   | **90.02%**               | 90.44%                   | 84.60%                   |
| … twin accepts, Chrome rejects                            | 8164                     | 7656                     | 7443                     | 12 620                   |
| … **twin rejects, Chrome accepts** (reverse)              | 2300                     | **1499**                 | 1326                     | 1508                     |
| properties worse than mdn-data on it                      |                          | **0**                    | 2 (`clip-path`, `mask`)  | 154                      |
| diff.ts seed 42 (own samples): agree                      | 16 734 / 18 272 (91.58%) | 16 815 / 18 287 (91.95%) | 16 817 / 18 290 (91.95%) | 16 320 / 18 837 (86.64%) |
| diff.ts seed 7                                            | 17 366 / 19 050 (91.16%) | 17 443 / 19 052 (91.56%) |                          |                          |
| types vs twin (tsgo, seed 42)                             | 4232 / 4232              | 4232 / 4232              | 4232 / 4232              | 4344 / 4344              |
| twin accepts, Chrome rejects, in diff-support             | 1391                     | 1319                     | 1322                     | 2395                     |
| … KNOWN, mdn-data stale or wider (incl. range gaps)       | 309                      | 274                      | 251                      | 224                      |
| … KNOWN, other causes                                     | 356                      | 356                      | 345                      | 342                      |
| … unexplained                                             | 26                       | 25                       | 72                       | **1024**                 |
| css-grammar tests (`check`, typed, queries, support, tsc) | pass                     | **pass**                 | not run                  | **fail** (section 3)     |

The "common sample" is the union of the values drawn from the mdn-data grammars and from the all-webref grammars, with
one mutant per value, so both sides see values the other rejects. diff.ts draws from the grammar under test, so its
numbers are not a like-for-like comparison, and its reverse rows (147 today, 153 with 47 properties) are dominated by
unclosed functions that Chrome closes at the end of the value, which no grammar change touches. The 26 unexplained rows
today are math-function typing gaps (`linear(sign(…))`, `anchor(inside, min(…) --x)`, `clamp(none, …)`); they come from
cssints-91im, not from this ticket.

**KNOWN.** Of the 309 rows that are "mdn-data stale or wider" today, the 47 properties clear 35 (11%) and all webref 85
(27%). The biggest entries do not move at all: 163 rows are the renamed `timeline-trigger-*range*` longhands (Chrome
knows neither name), 27 are `anchor()` precedence, 22 are `outline-color: auto`, 16 are `image-orientation`. Taking webref
everywhere turns the renamed longhands into "unexplained" rows instead of fixing them. After the 47, these KNOWN entries
are obsolete and should go: `tab-size`, `transform-origin`, `<'position-area'>`, `column-rule-style`. The
`column-rule-style` note ("Chrome 154 has no lists") is wrong: Chrome accepts `column-rule-style: solid, repeat(2,
dashed)`, and 23 rows flip to "Chrome accepts, but known". The same holds for `column-rule-width`.

**The named reverse rows** (Chrome accepts, twin rejects). ✓ is what the twin says, Chrome's answer first:

| Chrome | value                                                                                    | mdn-data | 47 properties | all webref |
| ------ | ---------------------------------------------------------------------------------------- | -------- | ------------- | ---------- |
| ✓      | `tab-size: 3.5`                                                                          | ✗        | ✓             | ✓          |
| ✗      | `tab-size: -3`                                                                           | ✓        | ✗             | ✗          |
| ✓      | `letter-spacing: 10%`, `word-spacing: 10%`                                               | ✗        | ✓             | ✓          |
| ✓      | `overscroll-behavior: chain`, `flex-wrap: balance`                                       | ✗        | ✓             | ✓          |
| ✓      | `z-index: inherit` (an artefact, see the rule)                                           | ✗        | ✓             | ✓          |
| ✓      | `background-clip: text border-area`                                                      | ✗        | ✓             | ✓          |
| ✓      | `column-rule-style: solid, repeat(2, dashed)`                                            | ✗        | ✓             | ✓          |
| ✓      | `cx: mod(3%, 1px)`                                                                       | ✗        | ✓             | ✓          |
| ✓      | `image-orientation: none`                                                                | ✗        | **✗**         | ✓          |
| ✗      | `image-orientation: 90deg`                                                               | ✓        | ✓             | ✓          |
| ✓      | `column-rule-width: thin, repeat(2, thick)`                                              | ✗        | ✗             | ✓          |
| ✗      | `transform-origin: bottom 10px`, `text-box-edge: cap`, `contain: size inline-size paint` | ✓        | ✗             | ✗          |
| ✗      | `display: grid-lanes`, `border-width: hairline`, `border-top-color: stripes(…)`          | ✗        | ✗             | ✓ (wrong)  |

`image-orientation` shows the limit of taking a grammar whole: webref is `from-image | none | [ <angle> || flip ]`, which
adds the `none` that Chrome takes and keeps the `<angle> || flip` that Chrome never shipped, so it is a "mixed"
property and stays on mdn-data under the rule.

**Budgets** (instantiations net of `empty.ts`; budget.json holds today's numbers, tolerance 10%):

| bench                 | today, tsc | 47 properties    | 67 properties   | all webref                 |
| --------------------- | ---------- | ---------------- | --------------- | -------------------------- |
| css-grammar `wide.ts` | 872 577    | 877 178 (+0.5%)  | 882 461 (+1.1%) | 988 947 (**+13.3%, OVER**) |
| `b100.ts`             | 191 076    | 191 076          | 193 563 (+1.3%) | 203 153 (+6.3%)            |
| `math.ts`             | 18 482     | 18 482           | 18 482          | 21 052 (**+13.9%, OVER**)  |
| `nocolor.ts`          | 62 706     | 62 706           | 65 193 (+4.0%)  | 71 166 (**+13.5%, OVER**)  |
| `typed.ts`            | 145 063    | 145 063          | 145 063         | 153 927 (+6.1%)            |
| `tokens.ts`           | 142 517    | 142 517          | 142 517         | 148 900 (+4.5%)            |
| cssints `users.ts`    | 723 626    | 724 772 (+0.16%) | 727 041 (+0.5%) | 804 789 (**+11.2%, OVER**) |
| cssints `unused.ts`   | 26 790     | 26 790           | 26 790          | 26 790                     |

The other css-grammar benches (`empty`, `err`, `onlycolor`, `onlypadding`, `queries`, `supports`, `relative`, `b200`)
are within 0.1% for the 47 properties. tsgo numbers move by the same amounts.

## 3. What the full switch breaks

- **Seven curated cases in `test/cases.ts`:** `width: calc-size(min-content, 50%)` and `calc-size(stretch, 50%)`
  (webref's `<calc-size-basis>` uses the prose-only `<size-keyword>`, so `calc-size()` matches nothing; 16 properties
  reach it: `width`, `height`, `min-*`, `max-*`, `flex-basis`, `flex`, `column-width`, `columns`),
  `background-image: conic-gradient(red calc(10deg + 5%))` (webref spells `<angle-percentage>` with brackets, so it is no
  longer the name the twin gives special handling; the rename to `~w` loses it), and four draft values that the table
  says are invalid: `align-items: baseline first`, `color-mix(in srgb, red)`, `color-mix(in srgb, red, red, blue)`,
  `dynamic-range-limit-mix(standard 50%)`.
- **Two prose-rule cases in `check-support.ts`:** `font-family: system-ui foo` and `Arial serif` (webref renamed
  `<family-name>` and `<generic-family>`, which `rules.ts` keys on), and one type-level probe line in `probe.ts`.
- **Unresolved names:** `<size-keyword>` (above) and `<url-set>` (`cursor`). `number-token`, `url-token`, `url-modifier`
  and `math-function` are also unresolved, as they are today, and harmless: the twin reads `integer`, `url` and math
  functions natively.
- **Draft syntax:** 171 properties accept values that Chrome 154 rejects (section 1), and the "unexplained" rows go from
  26 to 1024.
- **Parameterised types:** nothing new. The one webref grammar that has one is already overridden.
- **Renamed types and properties** are a silent risk: anything keyed on an mdn-data name (`support.ts` and `rules.ts`
  lookups, `twin-core.ts` reading `predefined-rgb` and `xyz-space` when it loads) misses the webref twin. The switch keeps
  those two names alive by emitting both.

## 4. The rule

Switch per property. For every property `p` of the 529 (and every `<'p'>` that a grammar reaches):

1. **Candidate.** webref has `p` with a `syntax` and no `legacyAliasOf`, and mdn-data has `p`. Properties that only one
   source has stay as they are (the 14 webref-only longhands, the 6 renamed `timeline-trigger-*` ones, `--*`).
2. **Closure resolves.** Build webref's grammar with its closure the way `extract.mjs` does with `WEBREF=@list.json`
   (webref's types; `<name()>` types, `length-percentage`, `integer`, `url` and `calc-sum` stay mdn-data's or native).
   The twin parses every grammar in it, and every `<type>` and `<'prop'>` resolves to a syntax, a twin primitive or a
   twin scan. Reaching `<size-keyword>` or `<url-set>` fails the test. `number-token`, `url-token`, `url-modifier` and
   `math-function` do not count.
3. **They differ.** Draw 300 values from each grammar (the `gen.ts` arbitraries, seed 42) plus one mutant each. Let D be
   the values that exactly one twin accepts. If D is empty, keep mdn-data (no change).
4. **Chrome agrees with webref on all of D.** Every value that only mdn-data accepts is rejected by
   `CSS.supports(p, v)`, and every value that only webref accepts is accepted. Values that contain `paint(` are left out
   of D: `CSS.supports` rejects `paint()` when no worklet is registered, which is what made `border-image`,
   `border-image-source` and `list-style-image` look confirmed (webref's `<image>` leaves `<paint()>` out). If
   Chrome disagrees on even one value, keep mdn-data. That includes "mixed" properties. **CSS-wide keywords should be left
   out of D as well**, which the measured list did not do: Chrome accepts them on every property, the grammars do not
   carry them (the twin rejects `color: inherit`), and webref's `z-index` happens to spell `inherit` (and `all` adds
   `revert-rule`). With that exemption `z-index` and `all` have an empty D and stay on mdn-data, so the list would be 45.
   The 47 were measured, the 45 were not; those two contribute a handful of rows.
5. **Fixed point.** Assemble the table from the accepted properties and run step 4 again on it. One change from the
   first round: `offset-path` depended on webref's `<basic-shape>` function types, which a list does not take, and fell
   out; the three `paint()` properties were dropped by the exemption above.

Output of the rule today, **47 properties**:

- webref wider, mdn-data stale (26): `all`, `background-clip`, `column-rule-color`, `cx`, `cy`, `flex-flow`, `flex-wrap`,
  `initial-letter`, `letter-spacing`, `line-height`, `overflow-clip-margin`, `overscroll-behavior` and its `-block`,
  `-inline`, `-x`, `-y` longhands, `r`, `rx`, `ry`, `text-underline-offset`, `text-underline-position`, `word-spacing`,
  `word-wrap`, `x`, `y`, `z-index`.
- webref narrower, mdn-data wider (15): `contain`, `grid-area`, `grid-column`, `grid-column-start`, `grid-column-end`,
  `grid-row`, `grid-row-start`, `grid-row-end`, `mask-border-outset`, `mask-border-width`, `mix-blend-mode`, `text-box`,
  `text-box-edge`, `text-emphasis-position`, `transform-origin`.
- both directions (6): `column-rule-style`, `flex`, `position-area`, `position-try`, `position-try-fallbacks`, `tab-size`.

They bring six renamed types with them (`bg-clip~w`, `blend-mode~w`, `grid-line~w`, `position-area~w`, `try-tactic~w`,
`text-edge~w`).

**How stable is it?** Re-drawing 1000 values per grammar for the 48 properties of the first round (65 356 cases): 46 stay
"Chrome confirms webref", 2 found no difference in that draw, and none flipped to "mixed" or to "confirms mdn-data". Switching all 529 in list mode (each
property on its own webref closure, 300 values each, 170 908 cases) gave 50 confirmed properties: the 47, plus the
three `paint()` ones and minus `offset-path`. The 67-property rule (step 4 replaced by "webref agrees with Chrome on
more of the sample") adds 19 properties and pays for it in draft syntax: 72 unexplained rows instead of 25.

**What the rule cannot see.** `CSS.supports` is the only judge, and it has blind spots (`paint()`; custom colour spaces).
It is Chrome 154 alone: the BCD lookup in `support.ts` still carries the other engines, unchanged. A webref alternative
that no sampled value reaches would pass step 4 unseen. Nothing in the 47 needs this, but it is why the list is
regenerated at each bump rather than trusted.

## 5. Recommendation

**Switch per property with the rule above. Do not switch everything, and do not stay.**

- Stay costs about 1.4 points of agreement on the common sample and 800 reverse rows there (35%), and leaves real false
  rejections in user code: `tab-size: 3.5`, `letter-spacing: 10%`, `position-area` keywords in the webref spelling,
  `overscroll-behavior: chain`, `flex-wrap: balance`, `column-rule-style` lists, `background-clip: border-area`.
- Everything costs 4 points of agreement, 171 properties that accept draft syntax, 9 broken curated cases and +11–14% on
  three budgets, to fix what the 47 fix.
- The 47 cost +1.5% of `mdn.ts` (+233 B gzip), ≤ +0.5% on the budgets, and are never worse than mdn-data on any property
  in 91 767 + 65 356 cases (the second draw is for the first-round list of 48). The gain is modest (+0.4 points on diff.ts, +1.4 on the common sample; the KNOWN rows that
  go are 35 of 309).
- The 90 "mixed" properties and the 86 newer-than-Chrome ones are not reachable by any rule that picks one source
  whole. The ones with a real gain (`image-orientation` `none`, `column-rule-width` lists, `zoom`, `outline-color`
  without `auto`) are small hand overrides in the style of the `COLOR` table in `extract.mjs`, a separate ticket.

Implementation for `extract.mjs`: the switch already exists behind `WEBREF=@list.json` (and `EXTRACT_OUT`), default off,
and with neither set it regenerates today's `mdn.ts` byte for byte. To ship it:

1. Commit the 47 names as `scripts/webref-props.json` and make `extract.mjs` read it by default.
2. Add a dev script, not part of `extract`, that runs the rule (steps 2–5: the twin, `gen.ts` and `playwright-core` are
   all devDependencies already) and rewrites the list. Re-run it when the Chrome, `@webref/css` or `mdn-data` pin
   changes; it needs an installed Chrome.
3. Remove the obsolete KNOWN entries (`tab-size`, `transform-origin`, `<'position-area'>`, `column-rule-style`), and
   exempt `paint(` and the CSS-wide keywords from D in the rule.
4. Regenerate `budget.json` (`wide.ts` and `users.ts` move by about 0.5% and 0.2%).

## How to reproduce

The default-off switch is in `packages/css-grammar/scripts/extract.mjs`:

```sh
cd packages/css-grammar
node scripts/extract.mjs                                                   # as before, writes src/mdn.ts
WEBREF=all        EXTRACT_OUT=/path/mdn.ts node scripts/extract.mjs         # every property from webref
WEBREF=@list.json EXTRACT_OUT=/path/mdn.ts node scripts/extract.mjs         # the properties in a JSON array
```

The measurements used scratch copies of the package under `out/` (gitignored, same depth as `packages/css-grammar` so the
`node_modules` links resolve): `cp -R packages/css-grammar out/v-x`, regenerate its `src/mdn.ts` as above, and in the
copy's `test/diff-support.ts` read `syns["single-animation~w"] ?? syns["single-animation"]`. Then, per copy:

- `node test/diff.ts`, `node test/diff-support.ts`, `node bench/budget.mjs` (and the same in a copy of `packages/cssints`
  whose `node_modules/@cssints/css-grammar` link points at the copy), `node test/check*.ts`, and `tsc -p tsconfig.json`.
- The common sample: generate values from each copy with `arbFor` (150 per property, seed 42, plus one mutant each, as in
  `diff.ts`), merge and dedupe, judge every case with each copy's `matches(properties[p], v)` and with
  `CSS.supports(p, v)` in Chrome, and compare per property.
- The text and type comparison: parse both grammars with `parseGrammar`, flatten groups, strip ranges, compare trees.
- `@webref/css` parse test: `parseGrammar` over every `syntax` in `css.json` (properties, types, functions).
