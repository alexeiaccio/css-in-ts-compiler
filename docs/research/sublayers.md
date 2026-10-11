# Sublayers or the sort: where the sheet's order gives the wrong cascade

Ticket cssints-z03v. Checked on 2026-10-02 in Chrome 154.0.8037.93 (macOS), against `packages/cssints/src/sheet.ts` at master `10dd3fd`. The question: the sheet sorts by layer, condition, shorthand before longhand (by leaf count), class (cssints-euf0, cssints-vzd9). Is there a case where that gives the wrong cascade, and would sublayers (`_.a.d2`, `_.a.d1`, `_.a.d0`, depth taken from mdn-data) be better?

The engine was not changed. Everything is in `docs/research/sublayers-proto/` and can be rerun (last section).

## Answer

1. **Yes, the sort is wrong, but the sort is not what is broken: its data is.** The comparator needs "a shorthand has more leaves than anything it contains". mdn-data's `computed` does not give that. Of 823 pairs where one property contains the other (Chrome's own expansion), the sheet puts the contained property first in **79** pairs, and leaves **454** to the class hash (a coin flip). 424 of the 454, and 76 of the 79, are `all`. The rest are `border-inline`/`border-block` with their sides, `font-variant` with `font-variant-caps`, `white-space`, `marker`, `text-box` and a few more.
2. **Counting the leaves of Chrome's expansion fixes every one of them** (37 of 37 containment cases pass in both argument orders, against 25 of 37 today). The comparator stays as it is.
3. **"The later argument of `cn()` wins" is not implemented, and no sort or sublayer scheme can implement it.** `cn(a, b)` becomes a set of independent classes, and the sheet is the same for `cn(a, b)` and `cn(b, a)`. For two properties that overlap without containing each other (and for the same property twice), exactly one of the two orders is right. This is a `cn()` question (build time, where the order is known), not a sheet question.
4. **Sublayers by depth are worse than the sort.** They need hierarchy data that mdn-data gets wrong in the same places, they tie where leaf count does not (`grid-area`/`grid-row`), they invert the breakpoint ladder if depth sits outside the condition, and they cost 21 declared layers instead of 6.
5. **Recommendation: keep the sort, fix the leaf counts.** Details and the other findings below.

## What was measured

`cases.mjs` holds 66 cases. Each goes through the real plugin (`createServer`, the `cssints` Vite plugin, `api.sheet`), so the classes and the CSS are what a user gets. The CSS is loaded into Chrome and `getComputedStyle` of every longhand of the case is compared with a **reference element**. The reference gets the same declarations as inline style, in the order the author means, so Chrome's own cascade does the resolving:

- the items in the order written (`cn(a, b)`, and reversed: `cn(b, a)`), but a shorthand before the properties Chrome says it contains (a longhand always beats its shorthand);
- conditions (`hover`, `md`): one layer at a time, a conditional rule after an unconditional one (the layer is the number of conditions). For two different conditions in one layer there are two readings, see "Conditions".

Hover and focus are real (`el.hover()`, `el.focus()`), the viewport is 1280 px so `md` and `lg` match. The sheet is also run through LightningCSS's minifier as the build does (`min` column: always the same result), and with the module order of the sheet reversed (same text).

Six sheets are tried on every case:

| column      | what                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine`    | `sheet.ts` as it is                                                                                                                                     |
| `min`       | the same through LightningCSS (`minify`)                                                                                                                |
| `mdn`       | the same comparator rebuilt in `lib.mjs` (it must agree with `engine`: it does, on all 66 cases)                                                        |
| `truth`     | the same comparator, but the width is the number of longhands Chrome expands the property to (`all`: every longhand but `direction` and `unicode-bidi`) |
| `where`     | `truth`, and pseudo-classes inside `:where()` so a rule has the specificity of one class                                                                |
| `sublayers` | each layer `L` splits into `L.d<depth>` (deepest shorthand first); depth from mdn-data `computed`, `all` above all                                      |

The reading of a result: `abba` means both orders gave the intended style, `ab--` only the order as written, `----` neither.

Cases by kind, `engine` against the other sheets (a case = one pair or group, both orders):

| kind                                                       | cases | engine: both / one / none | truth      | where      | sublayers  |
| ---------------------------------------------------------- | ----- | ------------------------- | ---------- | ---------- | ---------- |
| `contain`: a longhand and the shorthand around it          | 37    | 25 / 0 / **12**           | 37 / 0 / 0 | 37 / 0 / 0 | 31 / 0 / 6 |
| `later`: overlap without containment, or the same property | 19    | 1 / **17** / 1            | 1 / 18 / 0 | 1 / 18 / 0 | 1 / 18 / 0 |
| `layer`: a condition against none                          | 3     | 3 / 0 / 0                 | 3 / 0 / 0  | 3 / 0 / 0  | 3 / 0 / 0  |
| `cond`: two conditions in one layer                        | 7     | see "Conditions"          |            |            |            |

(`later` / `both` is `mask` against `mask-border`, which proves nothing: Chrome has no `mask-border`.)

## Where the cascade is wrong

### 1. A shorthand wins over the longhand it contains (12 cases, both orders)

The longhand loses in both argument orders, so the author cannot work around it.

| case                                                                        | expected                    | got                                                                                                    | why                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| b5 `borderInline("1px solid red")` + `borderInlineStart("3px dashed blue")` | start side 3px dashed blue  | 1px solid red                                                                                          | mdn-data lists `border-inline-start` as `[border-width, border-style, border-inline-start-color]`: the physical shorthands leak in, 9 leaves against 3 for `border-inline`. The sheet puts `border-inline-start` first, so `border-inline` wins                                                                    |
| b9 `borderBlock` + `borderBlockStart`                                       | block start 3px dashed blue | 1px solid red                                                                                          | the same (`border-block-start` 9 leaves, `border-block` 3)                                                                                                                                                                                                                                                         |
| b6 `borderInlineColor("green")` + `borderInlineStartColor("orange")`        | orange                      | green (the container), by class hash: for these values the hash puts `border-inline-start-color` first | mdn-data has no leaves for `border-inline-color` (`computedColor`): width 1, like its longhand. A tie, and the class decides                                                                                                                                                                                       |
| f2 `fontVariant("small-caps")` + `fontVariantCaps("all-small-caps")`        | `all-small-caps`            | `small-caps`                                                                                           | `font-variant` has `asSpecified` in mdn-data: width 1, a tie. The class hash happens to put it last for these values; other values flip it                                                                                                                                                                         |
| f4 `font` + `fontVariant` + `fontVariantCaps`                               | `all-small-caps`            | `small-caps`                                                                                           | the same tie                                                                                                                                                                                                                                                                                                       |
| a1 `all("initial")` + `p("1rem")`                                           | padding 1rem                | 0                                                                                                      | `all` has width 1 (mdn-data's `computed` for `all` is a string, and `leaves()` special-cases it), so it sorts **after** every shorthand and wins over 76 properties in both orders (`padding`, `border`, `font`, `background`, …: every property that has more than one leaf), and ties with the 424 that have one |
| a2 `all` + `color("red")`                                                   | red                         | initial                                                                                                | `all` and `color` tie at 1, the class hash decides                                                                                                                                                                                                                                                                 |
| a3, a4, a5 `all` + `border`, `border-top-width`, `font-size`                | the property                | `all`                                                                                                  | as a1 and a2                                                                                                                                                                                                                                                                                                       |
| x2 `borderInline` in one module + `borderInlineStart` in another            | as b5                       | as b5                                                                                                  | modules change nothing: the sheet is global                                                                                                                                                                                                                                                                        |
| x3 `all` in one module + `color` in another                                 | as a2                       | as a2                                                                                                  | the same                                                                                                                                                                                                                                                                                                           |

`docs/API.md` says "A longhand wins whatever the order of the arguments". It does for `padding`/`padding-left`, `border`/`border-color`, `margin`, `inset`, `grid-area`/`grid-row`/`grid-row-start`, `font`/`font-variant`, `mask`, `text-decoration`, `place-items`, `overflow`, `grid`/`grid-template` (cases m3, b7, i2, g1 to g5, f1, f3, k2, t1, t2, p1, p2, o1, o2 all pass in both orders) and does not for the rows above.

The tied ones are the risky kind: `tieOutcomeRightShare` in `audit.json` is **0.493**. Draw 200 values for each tied pair (not `all`), and the contained property comes after its container in 49% of them. The class name hashes the value, so the result changes when a value changes.

### 2. Overlap without containment: the later argument does not win (`later` cases)

Every one of these passes in exactly one of the two orders, in every sheet we tried (`engine`, `truth`, `where`, `sublayers`). The sheet does not know the order of the arguments, so it cannot pass both:

| case                                                                                  | what overlaps                                                                                                                                                                     |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| s1 `color("red")`, `color("blue")`                                                    | the same property: the class hash decides which wins                                                                                                                              |
| s2, s3                                                                                | the same with `hover`, and across two modules                                                                                                                                     |
| b1 `border` / `border-inline`                                                         | `border-inline` is logical, `border` physical                                                                                                                                     |
| b2 `border-color` / `border-inline`                                                   | the four colours and the inline sides share the left and right colours                                                                                                            |
| b3, b8 `border-color` or `border` / `border-inline-start-color`                       | physical against logical                                                                                                                                                          |
| b12 `border-top` / `border-color`                                                     | both set `border-top-color`                                                                                                                                                       |
| b11 `border` + `border-inline` + `border-color` + `border-inline-start-color`         | both orders wrong: no static order of these four fits any argument order                                                                                                          |
| i1, i3, i5 `inset` / `inset-block` / `top`                                            | logical against physical                                                                                                                                                          |
| m1, m2, m4, m6, m7 `margin` / `margin-inline` / `margin-left` / `margin-inline-start` | the same                                                                                                                                                                          |
| w1 `white-space` / `text-wrap`                                                        | both reset `text-wrap-mode`                                                                                                                                                       |
| k1 `mask` / `mask-border`                                                             | the spec says `mask` resets `mask-border` (webref `resetLonghands`); Chrome has no `mask-border`, so Chrome cannot show it. The sort puts `mask` (8 leaves) first, which is right |

Chrome's expansion finds 34 pairs of properties that share leaves and do not contain each other (`audit.json`, `partialList`): the `border-*` families, the `corner-*-shape` family, `overflow-wrap`/`word-wrap`, `text-wrap`/`white-space`. Logical and physical pairs (`margin-left` and `margin-inline-start`) are not in that list at all: they share no leaf name, they meet only through the writing mode.

**This is not a defect of the sort.** For these pairs the sort's answer is "the wider shorthand first, so the narrower one wins", a fine default, and the right answer for `later` depends on the call site. Neither sort changes nor sublayers can give it: the information is in `cn(...)`'s argument list and is lost when it becomes a class string (and in a runtime `cn(a, b)` it is known only for the styles written in its arguments: a string carries no order). What would give it, and is not a sheet change:

- `cn()` knows the order at build time. For the **same property** twice (s1, s3) it can drop the earlier declaration (exact, no data needed). Across opaque runtime strings and modules it cannot, and that stays as the docs say for plugin conflicts (an opaque runtime string in `cn()` is only appended). A style in a runtime argument of `cn()` is settled at build time since cssints-4e9f.
- For **overlap without containment** it can know with the same leaf data (a shared leaf, and neither contains the other) and report a build error naming the pair and telling the author to write longhands. Replacing the earlier shorthand by the longhands that remain is possible (`borderColor` before `borderInline` is `border-top-color`, `border-bottom-color`, and nothing for the sides the later one sets), and it needs the logical to physical mapping too. That is a feature, not a research result: a follow-up ticket if wanted.

### 3. Conditions

| case                                                                     | engine                                                    | note                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| h1 `hover(p)` + `pl`, h2 `hover(pl)` + `p`, h6 `md(hover(p))` + `md(pl)` | the condition wins in both orders                         | the layer is the number of conditions, so a conditional rule outranks an unconditional one even when the longhand is the unconditional one. This is the usual convention and nothing here changes it                                                                   |
| h3 `hover(p)` + `hover(pl)`, h7 `md(p)` + `md(pl)`                       | the longhand wins in both orders                          | same condition: the sort works                                                                                                                                                                                                                                         |
| h11 `md(pl)` + `lg(p)`                                                   | `lg(p)` wins: the longhand loses to the larger breakpoint | the ladder: a wider breakpoint overrides a narrower one, shorthand or not. The sort puts the condition before the width, which is what gives this                                                                                                                      |
| h12 `lg(pl)` + `md(p)`                                                   | `lg(pl)` wins                                             | the same                                                                                                                                                                                                                                                               |
| h5 `hover(p)` + `md(pl)`                                                 | **`hover(p)` wins over `md(pl)` in both orders**          | the sort puts `md` after `hover` (min-width, then pseudo-class rank), but `.x:hover` has the specificity of two classes and `.y` one, and specificity is compared before order inside a layer. The order of `hover` against `md` that the sort works out has no effect |
| h4 `md(p)` + `hover(pl)`, h10 `md(color)` + `hover(color)`               | `hover` wins                                              | the same: it matches the usual "hover over breakpoint", not the order the sheet states                                                                                                                                                                                 |
| h8 `focus(p)` + `hover(pl)`, h9 `hover(p)` + `focus(pl)`                 | `focus` wins, by rank                                     | equal specificity, so the sort's rank order works. `focus(p)` beats `hover(pl)` because condition rank comes before shorthand/longhand: by design                                                                                                                      |

So in one layer the real order is: specificity (a pseudo-class beats a media query), then the sort's condition order, then width. The first step makes the sort's condition order for `hover` against `md` dead. Whether that is wrong is a decision (the convention agrees with what happens), not a bug. If it is wanted the other way, `:where(:hover)` is a one-line change to `ruleOf` that makes every class rule one specificity: the `where` column shows h4, h5 and h10 then follow the condition order of the sheet. It is not recommended without that decision, because `md(color)` would then beat `hover(color)`.

## The audit over all properties

`audit.mjs` takes the 532 properties of the grammar, asks Chrome what each expands to (`el.style.setProperty(p, "initial")` lists the longhands, reset-only ones too; Chrome keeps `all` as one entry, so it is every longhand but `direction` and `unicode-bidi`), and checks each of the 823 pairs where A's leaves strictly contain B's against the order of the real `renderSheet`. It renders twice with the class names in opposite order: a pair that flips is a tie.

| comparator                                   | wrong | tie (class decides)                                                |
| -------------------------------------------- | ----- | ------------------------------------------------------------------ |
| mdn-data `computed` (today)                  | 79    | 454                                                                |
| `@webref/css` `longhands` + `resetLonghands` | 0     | 2 (`text-box` has no longhands in webref yet)                      |
| Chrome's expansion                           | 0     | 0 (by construction: a strict superset has a strictly larger count) |
| depth, as sublayers would use it             | n/a   | 41 pairs do not have a strictly larger depth                       |

Wrong, outside `all`: `border-block` > `border-block-start`, `border-inline` > `border-inline-start` and `-end`. Ties, outside `all`: `border-block-color/-style/-width` and `border-inline-color/-style/-width` over their `-start`/`-end` forms, `border-block` > `border-block-end`, `font-synthesis`, `font-variant` (7 longhands), `marker`, `text-box`, `white-space`. Full lists: `audit.txt`.

mdn-data's `computed` is a field about computed values. It was not written to say what a shorthand contains: it lists physical shorthands in the logical ones, has strings for `border-*-color`, `font-variant`, `white-space` and `all`, and omits reset-only longhands. The comment in `sheet.ts` already notes that "the direct lists miss border > border-top".

## Sublayers: the prototype and the cost

`sheetOf(rules, "sublayers")` in `lib.mjs`: every layer `_.a` to `_.e` splits into `.d3` (`all`), `.d2`, `.d1`, `.d0` (longhands), the statement lists them deepest first, and inside a sublayer only the condition and the class order remain.

- **It does not fix what is wrong.** Six `contain` cases still fail in both orders (b5, b6, b9, f2, f4, x2): they are the same bad mdn-data entries, now as depth (`border-inline-start` is depth 2, `border-inline` depth 1; `border-inline-color` and `border-inline-start-color` are both depth 0). `all` is fixed because it gets its own depth.
- **It breaks something that works.** With depth outside the condition, `md(pl)` beats `lg(p)` (h11): the breakpoint ladder inverts. To keep the ladder the condition would have to be the outer key, which is option C of `css-output.md` (a sublayer per condition): depth times conditions, a layer per breakpoint.
- **It ties where the count does not.** `grid-area` and `grid-row` are both depth 1 in mdn-data (computed lists the four longhands directly), as are `grid`/`grid-template`, `animation`/`animation-range`, `corner-shape` and its sides, 41 pairs in all. The leaf count has 4 and 2, so g1 passes with the sort and would be a class-hash tie as a sublayer. Depth needs a hierarchy; Chrome's expansion gives only the flat set, so the cheap right data does not exist for it.
- **It fixes one thing the sort cannot:** a layer outranks specificity, so h5 (`hover(p)` against `md(pl)`) comes out as the longhand wins. `:where()` does the same for the pseudo-class case at no layer cost.
- **Cost on the demo** (`measure.mjs`, 138 rules): 6 layers declared today, 21 with sublayers (`_.k` and 5 × 4 depths, plus the 6 parents `_` and `_.a` to `_.e` in DevTools' Layers panel, 27 nodes); 6 of the 20 sublayers have rules. Minified bytes 4 889 against 5 110 (+4.5%), 3 `@layer` blocks against 6. Every new condition depth adds 4 more declared layers.

The cost is small in bytes and large in noise, and it buys nothing the data fix does not.

## Recommendation: keep the sort, fix the leaf counts

1. **Replace `leaves()` in `sheet.ts` (mdn-data `computed`) by a table of leaf counts built from Chrome's expansion.** `packages/css-grammar/scripts/webref-rule.mjs` already runs Chrome as the judge, and `bun run webref` is the place: for each shorthand, set it to `initial`, record the number of longhands, write it next to `webref-properties.json`. About 100 shorthands; a longhand is 1. `all`: the count of every longhand but `direction` and `unicode-bidi`. `width()` becomes a table lookup, and the sort key does not change. It is rerun with the Chrome bump that the AGENTS.md already asks for.
   - Cheaper variant: `@webref/css` `longhands` and `resetLonghands` (no browser), plus a check against Chrome in the same script; its only gap today is `text-box`.
   - Not needed: comparing leaf-set inclusion. Inclusion is a partial order, not a comparator; the count over correct leaves is a linear extension of it, and it already is what the sheet does.
2. **Add the 12 failing cases as a test.** `test/sheet.mjs` checks the order with fake rules; the pairs of `audit.json` (`wrong`, `tie`) can be one more check there, and `node run.mjs` here is the Chrome check (it needs Chrome, so it stays out of `bun run test`, as `test:browsers`).
3. **Do not move to sublayers.** See above.
4. **Ticket for `cn()` (not the sheet):** same property twice, the later wins at build time; overlap without containment, a build error with the pair (or an expansion to longhands). Fix the sentence in `docs/API.md` accordingly ("A longhand wins whatever the order of the arguments" is true for containment only) and say that `cx()` strings carry no order.
5. **Decision to take, not a fix:** whether a pseudo-class should beat a media query by specificity (today) or by the sort's order (`:where()`). Today's behaviour matches the convention, so the default is to leave it and note it in the docs.

## Limits

- Chrome 154 only. The sort is the same everywhere, the cascade is too, but a property that Chrome does not support (`mask-border`, `font-synthesis-position`, `hanging-punctuation`, 29 of 532) is not tested, and its leaf count would come from `@webref/css`.
- Left to right, `horizontal-tb`: logical and physical properties meet through the writing mode, so the `later` cases for them are what the cascade does in that mode.
- `container` (the shorthand) is not reachable: `css.container` is the wrapper (`container("sidebar (width < 30rem)")`), and `css.container("inline-size / side")` is a query error (`run.mjs` checks it). `containerType` and `containerName` are properties and have no shorthand to lose to, so c1 passes. Nothing to fix until a property form of `container` is wanted.
- Class hashes include the value, so which side of a tie wins in the table above is a fact about these values. `audit.mjs` measures the share over many values (0.493).
- Same-property rules in `@media` blocks that LightningCSS merges: the `min` column checks the minified sheet against the plain one on all 66 cases and finds no difference.

## Rerun

```bash
cd docs/research/sublayers-proto
node run.mjs            # the 66 cases through the plugin and Chrome: results.txt, results.json (generates fixtures/)
node run.mjs b5 f2      # some of them
node audit.mjs          # every pair of properties against the sheet: audit.txt, audit.json
node measure.mjs        # the demo: layers and bytes with and without sublayers
```

Needs Chrome (`playwright-core` from `node_modules/.bun`, channel `chrome`) and the worktree's `node_modules`. `cases.mjs` is the table of cases; `lib.mjs` holds the sort variants (`sheetOf`) and Chrome's leaf sets (`truthOf`).
