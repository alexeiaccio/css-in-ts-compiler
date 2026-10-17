# Unshipped CSS: what cssints could provide (2026-10-17)

Question: which CSS features from specs that no browser ships yet, or ships only behind a flag, could become a cssints
plugin or a spec export, like the planned `mesh-gradient()` and `freeform-gradient()` (CSS Images 5)?

Answer in short: few. Counted from the data cssints already reads, 22 features are unshipped in all four engines (Chrome,
Edge, Firefox, Safari), out of 1,268 features that MDN's browser-compat data (BCD) has a key for. Most of the rest are either
shipped somewhere or missing from BCD altogether, so the 22 is a lower bound. Of the 22, five or six have a build-time
fallback worth writing (see the ranking). Several examples in the brief now ship: `sibling-index()`, `sibling-count()`,
`random()` and `contrast-color()`. `if()` and `corner-shape` are partial.

## Method

Throwaway scripts live outside the repo, in `/private/var/folders/nr/v79_zy4n1y501j69qzmh8xzm0000gp/T/opencode/unshipped-spike`
(not committed). They import `get` and `tokenKey` from `packages/css-grammar/src/support.ts`, so the BCD keys follow the same
rules as the support warnings and `bun run groups`.

- **Names.** `@webref/css` 6.23.14 (pinned in cssints as `webref-specs`, one file per spec level; see `docs/research/groups.md`).
  Kept the 105 files whose spec URL is on `drafts.csswg.org` or `drafts.fxtf.org`, the same filter as `scripts/groups.ts`.
  The names are properties, at-rules, functions (`values` of type `function`) and the keywords in each property grammar
  (identifiers outside `<…>`, not followed by `(`).
- **BCD.** `@mdn/browser-compat-data` 8.1.3 (pinned in css-grammar) and 8.1.6 (latest on npm on 2026-10-17). The strict
  set is the same on both. The table below uses 8.1.6, packed with `npm pack` into the spike directory.
- **Rule per engine.** Chrome, Edge, Firefox and Safari only (iOS and Android skipped). A statement counts as shipped when
  `version_added` is a version, with no flag, no prefix and no alternative name. Negative states: `false`, `preview`,
  flag-only, prefix-only, `removed`. A feature is _unshipped in every engine_ when all four are negative.
- **Not counted.** A feature with no BCD key. BCD has no key for `shape-inside`, `word-wrap` or `caret`, which ship, so
  "no key" is not "unshipped". Also excluded: the two rows that BCD marks `removed` in Chrome, Edge and Safari
  (`background-repeat-x`, `background-repeat-y`). They are legacy longhands, and I did not check the removal.

| Kind      |     Names |   BCD key | Ships in some engine | Unshipped in every engine | No BCD key |
| --------- | --------: | --------: | -------------------: | ------------------------: | ---------: |
| property  |       676 |       505 |                  496 |           9 (2 `removed`) |        171 |
| at-rule   |        43 |        19 |                   18 |                         1 |         24 |
| function  |       115 |        81 |                   79 |                         2 |         34 |
| keyword   |     1,052 |       663 |                  651 |                        12 |        389 |
| **total** | **1,886** | **1,268** |            **1,244** |               **24 (22)** |    **618** |

**Limits.** BCD lags, and a third of the names have no key. `@when`, `@mixin` and `pointer-timeline` have none. The script
does not scan media features (so `prefers-reduced-data` is missing) or functions that only a grammar uses (so `fit-content()`
is missing). I added those two from a second source. The keyword rows are an approximation of the grammar text.

**Cross-check.** web-features 3.42.0 (pinned) lists 137 CSS features that are not Baseline and have a `css.` key. By BCD
8.1.3, 132 of them ship somewhere. Five ship nowhere: `custom-media-queries`, `element()`, `fit-content()`, `link-parameters`
and `prefers-reduced-data`. Three of those five are in the table below; the other two are in the paragraph after it.
web-features is at 3.43.0 on npm now; not re-run.

## The 22 features unshipped in every engine (BCD 8.1.6)

Each row is what BCD says per engine: `false` (no), `preview` (Technology Preview or Canary only), `flag`, `prefix` (only
the `-webkit-` or `-moz-` form), or `removed`.

| Spec                                                             | Feature                                      | Chrome | Edge   | Firefox | Safari          |
| ---------------------------------------------------------------- | -------------------------------------------- | ------ | ------ | ------- | --------------- |
| [css-overflow-4](https://drafts.csswg.org/css-overflow-4/)       | `line-clamp` (and `none`)                    | prefix | prefix | prefix  | prefix          |
| css-overflow-4                                                   | `block-ellipsis` (and `auto`, `no-ellipsis`) | false  | false  | false   | preview         |
| css-overflow-4                                                   | `max-lines` (and `none`)                     | false  | false  | false   | preview         |
| [css-overflow-5](https://drafts.csswg.org/css-overflow-5/)       | `continue` (and `auto`, `discard`)           | false  | false  | false   | preview         |
| [css-text-4](https://drafts.csswg.org/css-text-4/)               | `white-space-trim` (4 keywords)              | false  | false  | false   | preview         |
| css-text-4                                                       | `wrap-inside` (`auto`, `avoid`)              | false  | false  | false   | preview         |
| [css-link-params-1](https://drafts.csswg.org/css-link-params-1/) | `link-parameters` (and `none`), `param()`    | false  | false  | preview | preview / false |
| [css-images-4](https://drafts.csswg.org/css-images-4/)           | `element()`                                  | false  | false  | prefix  | false           |
| [mediaqueries-5](https://drafts.csswg.org/mediaqueries-5/)       | `@custom-media`                              | false  | false  | flag    | false           |

Not in the scan, from web-features and BCD 8.1.6 (so they add to the list): `prefers-reduced-data` (media feature): Chrome
and Edge `flag`, Firefox and Safari `false`. `fit-content()` as a function on the size properties (CSS Sizing 3): Firefox
`flag` (91), the rest `false`.

## No gap any more (the brief's examples, and two more)

| Feature                              | BCD 8.1.6                                                       | What it means here                                  |
| ------------------------------------ | --------------------------------------------------------------- | --------------------------------------------------- |
| `sibling-index()`, `sibling-count()` | Chrome 138, Edge 138, Firefox 154, Safari 26.2                  | shipped everywhere; no plugin needed                |
| `random()`                           | Chrome 156, Edge 156, Safari 26.2; Firefox `preview`            | shipped in three engines; not a gap                 |
| `contrast-color()`                   | Chrome 147, Edge 147, Firefox 146, Safari 26                    | shipped; core already parses it                     |
| `field-sizing`                       | Chrome 123, Edge 123, Firefox 152, Safari 26.2                  | shipped                                             |
| `if()`                               | Chrome 137, Edge 137; Firefox `false`, Safari `false`           | partial: two engines (see candidate 4)              |
| `@function`                          | Chrome 139, Edge 139; Firefox `false`; Safari `preview` (8.1.3) | partial; TypeScript functions already cover the use |
| `corner-shape`                       | Chrome 139; Safari `preview` (8.1.3)                            | covered by `@cssints/squircle`                      |
| `text-box-trim`                      | Chrome 133, Safari 18.2 (8.1.3)                                 | covered by `@cssints/fonts` `trim()` (metrics)      |

## Where BCD is silent

These have no BCD key in 8.1.6, so their status is **not verified** here. The list is the set the scan could not judge.

- `css-mixins-1`: `@mixin`, `@apply`, `@contents`, `@env`. web-features has `@mixin` as limited.
- `css-conditional-5`: `@when`, `@else`. Not in web-features; MDN path `/Reference/At-rules/@when` gave 404.
- `css-extensions`: `@custom-selector`.
- `css-color-5`: `@color-profile`.
- `pointer-animations-1`: `pointer-timeline`, `pointer-timeline-name`, `pointer-timeline-axis`. MDN path gave 404.
- `css-borders-4`: `box-shadow-color`, `-offset`, `-blur`, `-spread`, `-position`; `border-top-radius` and the `corner-*` longhands.
- `css-text-decor-4`: `text-decoration-trim`, `-skip-self`, `-skip-box`, `text-emphasis-skip`.
- `css-inline-3`, `css-line-grid-1`, `css-rhythm-1`, `css-page-floats-3`, `css-gcpm-*`, `css-speech-1`, `css-nav-1`, `fill-stroke-3`, and the rest of the 171 property names in the no-key list. Most are print, speech or layout work; I did not check which engines have started any of it.

## Already covered by an existing package

Checked against the README of each package in `packages/` on 2026-10-17. None of these is proposed again below.

| Feature                           | Where it is                          | How                                                                                    |
| --------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| `text-wrap: balance`, `pretty`    | `@cssints/balance`                   | runtime fallback with ResizeObserver                                                   |
| `corner-shape` (squircle)         | `@cssints/squircle`                  | native where it ships, a mask elsewhere                                                |
| `text-box-trim` (the effect)      | `@cssints/fonts` `trim()`            | font metrics at build time                                                             |
| scroll-driven animation, `view()` | `@cssints/reveal`, `@cssints/motion` | presets on `animation-timeline`                                                        |
| scroll-state, `sticky`            | `@cssints/stuck`                     | `@container scroll-state` with a fallback                                              |
| grid lanes (masonry)              | `@cssints/masonry`                   | grid-lanes where present, columns otherwise                                            |
| eased gradient stops              | `@cssints/gradient`                  | build-time colour stops                                                                |
| image placeholders                | `@cssints/placeholder`               | build-time gradient or ThumbHash                                                       |
| OKLCH ramps, RYB colours          | `@cssints/ramp`, `@cssints/rybitten` | build-time colour maths                                                                |
| `clamp()` fluid sizes             | `@cssints/fluid`                     | build-time `clamp()`                                                                   |
| line clamp                        | none as a package                    | core `lineClamp` warns; the WebKit-box recipe is in `docs/wayfinder.md` (cssints-l54z) |
| `if()` in colours and values      | core                                 | pending substitution (cssints-gcuz, cssints-xrzv)                                      |

## Classes

- **A.** Build time only. A pure function that the engine turns into plain CSS that works in every browser today.
- **B.** Needs a small runtime script in the browser (ResizeObserver, Web Animations, pointer events).
- **C.** Cannot be polyfilled. The engine has to do it.

## Candidates by class

| #   | Feature                                     | Spec                 | Unshipped where (BCD 8.1.6)  | Class             | Demand     | Effort |
| --- | ------------------------------------------- | -------------------- | ---------------------------- | ----------------- | ---------- | ------ |
| 1   | `line-clamp` (unprefixed)                   | css-overflow-4       | all four: prefix only        | A                 | high       | low    |
| 2   | `@custom-media`                             | mediaqueries-5       | Firefox flag; three `false`  | A                 | medium     | low    |
| 3   | `mesh-gradient()`, `freeform-gradient()`    | CSS Images 5         | not found in any source here | A (approximation) | high       | medium |
| 4   | `if()`, static `supports()` only            | css-values-5         | Firefox and Safari `false`   | A (partly B or C) | high       | medium |
| 5   | `fit-content(L)`                            | css-sizing-3         | Firefox flag; three `false`  | A (approximation) | medium     | low    |
| 6   | `@when` / `@else`, static `supports()` only | css-conditional-5    | no key                       | A (partly)        | medium     | medium |
| 7   | `pointer-timeline`                          | pointer-animations-1 | no key                       | B                 | low-medium | medium |
| 8   | `@custom-selector`                          | css-extensions       | no key                       | A                 | low        | low    |

Class C, not recommended: `element()` (live rendering, Firefox prefix only), `prefers-reduced-data` (a user preference;
nothing in JS reads it), the Safari-only `continue`, `max-lines`, `white-space-trim` and `wrap-inside` (fragmentation and line
layout), `param()`, and `text-decoration-trim` (paint).

## Ranking

Ranked by value over effort. Each entry gives what it is, the spec, the status and its date, the class, a sketch of the
cssints code, and the main risk. The API names are sketches; none is decided.

**1. `line-clamp` (css-overflow-4), class A.** Limits text to N lines and ends it with an ellipsis. Authors need it for
cards and previews, so it is the most common of these. Status: BCD 8.1.6 (2026-10-17) has Chrome, Edge and Firefox on
prefix only, and Safari 18.2 to 18.4 with the unprefixed form, which BCD now says was removed. MDN's page says "Limited
availability" (last modified 2026-09-14, read 2026-10-17). The repo's own note (cssints-l54z) says Chrome 154 rejects the
unprefixed form. The `-webkit-` form works in all four engines, so a build-time clamp is exact today:

```ts
import { cn } from "cssints" with { type: "cssints" };
import { truncate } from "@cssints/truncate" with { type: "cssints" };
export const title = cn(truncate(2)); // -webkit-box, -webkit-box-orient: vertical, -webkit-line-clamp: 2, overflow: hidden
```

Risk: the `-webkit-box` display changes the box, so children that expect `block` break. The plugin must document it and
emit the standard property once every target has it. Core's `lineClamp` already warns, so the plugin's job is the recipe.

**2. `@custom-media` (mediaqueries-5), class A.** Names a media query once and uses the name in `@media`. Status: Firefox
148 flag; Chrome, Edge and Safari `false` (BCD 8.1.6). MDN's page says "Limited availability" (last modified 2026-08-19)
and that the override rule is "still under discussion". The build can rewrite the name into the query, so the output is
plain `@media` that works everywhere:

```ts
import * as css from "cssints" with { type: "cssints" };
import { customMedia } from "@cssints/custom-media" with { type: "cssints" };
customMedia({ narrow: "(width < 600px)" }); // build time, no output of its own
const narrow = css.media("(--narrow)"); // written as (width < 600px) before the engine sees it
```

Risk: the spec may change the override and nesting rules. The plugin should refuse a name it does not know, and a name
whose query refers back to itself, since MDN says a circular chain invalidates every rule in it.

**3. `mesh-gradient()` and `freeform-gradient()` (CSS Images 5), class A (approximation).** The planned plugins. The deep
dive is written by another agent; this entry only places them. Status: neither name is in `@webref/css` 6.23.14 or 8.7.5,
in web-features 3.42.0, or as a BCD key in 8.1.6 (checked 2026-10-17). So the status is unverified, and the sources here
say nothing either way. Class A is the plan: the build writes layered radial gradients that look like the mesh. The name
and the shape of the call are not decided, so the sketch is a guess:

```ts
import { backgroundImage } from "cssints" with { type: "cssints" };
import { meshGradient } from "@cssints/gradient" with { type: "cssints" }; // name not decided
export const hero = backgroundImage(
  meshGradient(
    [
      ["#f0c", 0, 0],
      ["#0cf", 1, 0],
    ],
    { steps: 4 },
  ),
);
```

Risk: an approximation, not the same picture; and the spec may still move.

**4. `if()` for static conditions (css-values-5), class A (partly B or C).** A conditional value. Status: Chrome and Edge 137
ship it; Firefox and Safari `false` (BCD 8.1.6). MDN says "Limited availability" (last modified 2026-09-04), and says `if()`
"does not gracefully degrade", so every author writes a fallback declaration. cssints knows the targets at build time, so it
can answer a `supports()` test itself: the branch that holds is written, the others are dropped. `style()` and `media()`
tests stay runtime, and then the plugin has nothing to do (class B would be a script that sets the attribute).

```ts
import { paddingBlock } from "cssints" with { type: "cssints" };
import { ifSupports } from "@cssints/if" with { type: "cssints" }; // name not decided
export const pad = paddingBlock(ifSupports("color: lch(75% 0 0)", "1em", "0.5em"));
```

Risk: the value is exact only where the target list is known. Also `if()` is shipped in Chromium, so the plugin is for
Firefox and Safari only, and the native form must stay for the browsers that have it.

**5. `fit-content(L)` (css-sizing-3), class A (approximation).** Sizes a box to its content, clamped to `L`. Status: Firefox
behind a flag since 91; Chrome, Edge and Safari `false` (BCD 8.1.6, the function on `width`, `height`, and the min and max
properties). The keyword `fit-content` ships everywhere (BCD 8.1.6), so the fallback can use it:

```ts
import { cn, width } from "cssints" with { type: "cssints" };
import { fitContent } from "@cssints/fit" with { type: "cssints" }; // name not decided
export const card = cn(width(fitContent("200px"))); // width: fit-content; max-width: 200px
```

Risk: not exact. The spec gives `min(max-content, max(min-content, L))`, and the fallback caps the box at `L` where the spec
keeps the min-content width. The two differ only when the content is wider than `L`.

**6. `@when` and `@else` (css-conditional-5), class A (partly).** A conditional block, like `@supports` with an `else`. Status:
no BCD key in 8.1.6, no web-features feature, and the MDN path gave 404 on 2026-10-17. So the status is unverified; the
spec is a working draft. A build can resolve a `supports()` test against the targets, as in candidate 4. Runtime `media()`
tests cannot be resolved and stay as `@media`.

```ts
import { when } from "@cssints/when" with { type: "cssints" }; // name not decided
export const card = when("supports(display: grid)", cn(display("grid")), cn(display("block")));
```

Risk: the name and the grammar may change, and it overlaps with `if()`. Build one shape of conditional, not two.

**7. `pointer-timeline` (pointer-animations-1), class B.** An animation driven by the pointer's position. Status: no BCD key
in 8.1.6; the MDN path gave 404 on 2026-10-17; no engine is known to ship it, but that is not verified. A runtime script
(pointer events and the Web Animations API, setting `Animation.currentTime`) can run the same animation. It is a real
script, so it is class B.

```ts
import { cn } from "cssints" with { type: "cssints" };
import { pointerTimeline } from "@cssints/pointer" with { type: "cssints" }; // name not decided
export const tilt = cn(pointerTimeline("x"));
```

Risk: the timeline's semantics (range, axis, the element it reads) are not the same as the script's, and a script on every
pointer move costs time. Low demand: say so before starting.

**8. `@custom-selector` (css-extensions), class A.** A named selector list, expanded at build time. Status: no BCD key; no
web-features feature found; unverified. The build rewrites `:--name` into the selector list before the engine sees it,
which is exact. Demand is low, and the spec is an early draft. It is cheap, so it is last rather than dropped.

```ts
import {
  customSelector,
  global,
  fontWeight,
} from "@cssints/custom-selector" with { type: "cssints" }; // name not decided
customSelector(":--heading", "h1, h2, h3");
export const headings = global(":--heading", fontWeight("700"));
```

Risk: only worth it if someone asks; no-one has in this repo.

## What I did not build, and why

- `@mixin` and `@apply` (class A). cssints already has plain TypeScript functions that return style objects, so a second mixin
  system adds nothing.
- `element()` and `param()` (class C). Live rendering of another element is not something a script can reproduce.
- `prefers-reduced-data` (class C). It reads a user preference that no JavaScript API exposes.
- box-shadow and border-radius longhands (class A). They need a merge of several declarations into one shorthand, and the
  order of multiple shadows makes the rule fragile. No BCD status either.

## What I could not verify

- **Chromestatus.** I did not query it: its feature pages are JavaScript apps, and I did not try its API. Engine status
  comes from BCD 8.1.6 and MDN, not from chromestatus.
- **Compatibility tables on MDN.** The pages I fetched (`line-clamp`, `@custom-media`, `if()`) render their tables with
  JavaScript, so the per-engine rows are BCD's, not MDN's.
- **Every no-key feature.** Their status is unknown. A third of the names in webref are in this state.
- **Current status of the Safari 18.2 to 18.4 `line-clamp`.** BCD says it shipped and was removed; I did not check Apple's
  release notes.
- **`mesh-gradient()` and `freeform-gradient()`.** No source here has them. The other agent's deep dive must check the spec
  and the implementation status directly.
- **Edge and iOS.** Edge follows Chromium in BCD, but I did not check it separately. iOS and Android were skipped.
- **Dates of BCD 8.1.6 and web-features 3.43.0.** The npm registry gave their latest versions on 2026-10-17. I did not look up the
  release dates.

## Correction (2026-10-17)

Candidate 1, `line-clamp`, is not a gap. cssints-l54z already added the WebKit box as members (`display("-webkit-box")`, `WebkitBoxOrient`, `WebkitLineClamp`) and docs/API.md shows the clamp; the standard `lineClamp` is a member that warns, as no engine ships it unprefixed. The overlap check above read the packages only, not the engine. Drop it from the ranking; the rest stands. Check the engine's own members (docs/API.md, `packages/cssints/src/members.ts`) before building any of the others.

### The rest of the ranking, checked against the engine (2026-10-17)

Chrome 155.0.8059.80, `CSS.supports` and `CSSStyleSheet.replaceSync`, plus the engine's members and docs/API.md. Only `pointer-timeline` survives.

| Candidate                | Result                                                                                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@custom-media`          | Covered. `css.media({ sm, lg })` names a query once and imports reuse it. Chrome parses the at-rule to 0 rules. cssints has no CSS authoring.                                                 |
| `if()` with `supports()` | Covered by `css.supports()` and `firstThatWorks()`. A raw `if()` in a string part is accepted. Chrome 155 takes `if()` natively.                                                              |
| `fit-content(L)`         | Grammar and the support warning exist (`css.properties.width.fit-content_function`). No fallback: `min(max-content, …)` is rejected in Chrome, and `calc-size()` is Chromium and Safari only. |
| `@when` and `@else`      | Covered. Conditions nest up to four deep, and `@else` is a negated query string (`@supports not (…)`). Chrome parses `@when` to 0 rules.                                                      |
| `@custom-selector`       | Covered. A selector is a checked string, so a named list is a `const`. Chrome parses the at-rule to 0 rules.                                                                                  |
| `pointer-timeline`       | Open. Not in the engine; in webref 8.7.5; Chrome 155 rejects it; no BCD key. Needs the own-key table of cssints-6ctt and a runtime.                                                           |

So the unshipped-spec list gives no new plugin by itself. The lesson for the next research brief: give the agent the engine's member list and docs/API.md to check against, not only the package READMEs.
