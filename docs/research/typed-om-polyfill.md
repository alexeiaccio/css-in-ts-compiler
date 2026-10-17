# css-typed-om (Bramus) and our Typed OM values

Question: should cssints adopt, or learn from, the [`css-typed-om`](https://npmx.dev/package/css-typed-om) polyfill?

Answer: learn from it. Do not depend on it. Our value classes already use the spec's names for what we emit (`CSSUnitValue`, `CSSColorValue`, `CSSImageValue`, `CSS.px`). The polyfill adds math, transform and colour-subclass classes. Nothing in cssints needs them today. In Node the polyfill cannot validate one real CSS property. Its `calc()` text also differs from Chrome's.

Checked 2026-10-17 with css-typed-om 1.0.0, happy-dom 20.14.6, playwright-core 1.x, Chrome 155.0.8059.80 and Node 24.22.0. The scratch dir is `/private/var/folders/nr/v79_zy4n1y501j69qzmh8xzm0000gp/T/opencode/typed-om-spike`, outside the repo.

Sources: [Bram's post](https://www.bram.us/2026/10/13/introducing-css-typed-om-a-complete-and-wpt-tested-polyfill-for-css-typed-om/), [the repo](https://github.com/bramus/css-typed-om-polyfill), [the spec](https://drafts.css-houdini.org/css-typed-om-1/), [wayfinder entry](../wayfinder.md) (section "Reference: css-typed-om polyfill (bramus)").

---

## Facts about the package

- The post is dated 2026-10-13. The package is older. `npm view css-typed-om time` shows 1.0.0 published 2026-08-19. Nothing newer.
- The README says 12479 of 13134 WPT subtests pass (WPT commit `785dad555`, 2026-10-12). The wayfinder cites 12476 for August.
- MIT. No runtime `dependencies`. The npm tarball ships only `build/`: `index.js`, `css-typed-om.iife.js`, the `.d.ts` files and maps.
- The source is on GitHub: 50 files in `src/` (`parser/`, one folder per class family, `style-property-map.ts`). By the blob sizes in the tree listing, about 263 KB of TypeScript. I did not count lines, so the wayfinder's "7.5 k lines" is unchecked.
- The repo had 9 stars and 0 forks when I fetched it. The README says it is "mostly AI-generated using Google Antigravity".

## Q1. Our classes against the spec

Ours is `packages/css-grammar/src/values.ts` (54 lines), plus `CSSTokenValue` (`cssints/src/token.ts`), `CSSFunctionValue` (`cssints/src/functions.ts`) and `CSSAtRuleValue` (`cssints/src/macro.ts`). Polyfill names come from its `build/index.d.ts` and the GitHub `src/` tree.

| Class                                                                                | Ours                                                             | Polyfill                               | Who in cssints would use it                                                  |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| `CSSStyleValue` (base), `parse`, `parseAll`                                          | base with phantom `~type`, no `toString`, no `parse`             | yes; `parse` checks via the host DOM   | fluid and plugins subclass the base; test judge (see Q4b)                    |
| `CSSUnitValue`                                                                       | yes: `(value, unit)`, `toString`; `CSS.px/rem/em/percent/number` | yes; the spec's `CSS.*` factories      | every length in the API                                                      |
| `CSSKeywordValue`                                                                    | no                                                               | yes                                    | nobody: `"block"` stays a string                                             |
| `CSSUnparsedValue`, `CSSVariableReferenceValue`                                      | partial: `CSSTokenValue` holds `var(--x)` text                   | yes                                    | `css.token`, typed fallbacks in `firstThatWorks`                             |
| `CSSMathSum/Product/Negate/Invert/Min/Max/Clamp`, `CSSNumericValue`                  | no. `css.calc` and fluid's `Clamp` hold text                     | yes, with simplification               | fluid (`clamp`), the `css.calc`/`min`/`max`/`clamp` builders, plugin authors |
| `CSSColorValue`                                                                      | yes: any `<color>` text, concrete                                | yes; abstract base of the family       | gradient, placeholder, plugin values that return a colour                    |
| `CSSRGB`, `CSSHSL`, `CSSHWB`, `CSSLab`, `CSSLCH`, `CSSOKLab`, `CSSOKLCH`, `CSSColor` | no                                                               | yes (constructor, getters, `toString`) | gradient, if it wanted OKLCH objects (see Q4a)                               |
| `CSSImageValue`                                                                      | yes: text                                                        | yes                                    | gradient, placeholder                                                        |
| `CSSTransformValue` and the `CSSTranslate`… family                                   | no                                                               | yes                                    | nobody: no transform API                                                     |
| `StylePropertyMap`, `computedStyleMap()`, `attributeStyleMap`                        | no                                                               | yes                                    | devtools (strings only today); balance (see Q4c)                             |

Chrome 155 does not ship the colour family. I checked each name with `typeof` in the page:

```
"CSSColorValue":"undefined","CSSRGB":"undefined","CSSHSL":"undefined","CSSHWB":"undefined",
"CSSLab":"undefined","CSSLCH":"undefined","CSSOKLab":"undefined","CSSOKLCH":"undefined"
```

Chrome 155 does have `CSSMathSum`, `CSSKeywordValue`, `CSSUnparsedValue`, `CSSTransformValue` and `CSSStyleValue.parse`. So the polyfill is the only way to get the colour names in Chrome 155.

## Q2. Does it run in Node, with no browser?

Import works. Nothing throws on import. Constructors work. The parts that need a DOM do not.

`plain.mjs` in plain Node 24.22:

```
exports: CSSColor,CSSColorValue,...,StylePropertyMapReadOnly     (37 names, no CSS object)
window: undefined document: undefined CSS: undefined
CSS.px(4)                 -> no CSS export
new CSSOKLCH(0.5, 0.1, 200) => oklch(50% 10% 200deg / 100%)
new CSSUnitValue(100,"px")  => 100px
CSSStyleValue.parse("width","10px") THREW TypeError: Unsupported property: width
CSSStyleValue.parse("--x","10px")   => 10px
```

The factories exist only on `window.CSS`. The bundle installs them only when `typeof window !== "undefined"` (build/index.js:5633). So `CSS.px(4)` does not run in Node.

The article says validation is delegated to the host's CSS parser. In Node the host is a stub. `getDummyStyle()` returns an object with `cssText`, `setProperty` and similar, and no property names (build/index.js:2007–2018). `isSupportedProperty` tests `camel in dummy`, so every real property fails. Only `--custom` names pass. Our wayfinder says "in Node the dummy is a stub and every value passes". That sentence is wrong. Every real property throws.

happy-dom 20.14.6 (the version cssints and devtools use in their tests):

- Plain `import` throws at build/index.js:5791: `TypeError: Cannot set property CSS of #<Window> which has only a getter`. The bundle wants to replace `window.CSS`, and happy-dom makes it read-only.
- With `window.CSS` made writable (a test shim, not a fix): `CSS.px(4).add(CSS.em(2))` gives `calc(2em + 4px)`. `parse("width","10px")` gives `10px`. `parse("width","10foo")` throws `Invalid value for property width: 10foo`. That error comes from happy-dom's own parser. `computedStyleMap().get("width").value` gives `100`.

Chrome 155, same calls, native:

```
CSS.px(4).add(CSS.em(2))   => calc(4px + 2em)        (polyfill in happy-dom: calc(2em + 4px))
parse("width","10foo")     THREW TypeError: ... could not be parsed as a 'width'.
```

The two serialize `calc()` in a different order. The spec may allow either. I did not check the spec text, and I did not compare more values. The point: emitted text can differ from Chrome's.

## Q3. Size

| Artifact                                            | Raw      | gzip -9 |
| --------------------------------------------------- | -------- | ------- |
| `css-typed-om` `build/index.js` (ESM)               | 182.8 KB | 29.7 KB |
| `css-typed-om` `css-typed-om.iife.js`               | 193.7 KB | 29.9 KB |
| `css-typed-om` npm unpacked (with maps, `.d.ts`)    | 866.8 KB | n/a     |
| cssints `dist/runtime.mjs` (what ships to browsers) | 906 B    | 480 B   |

Our runtime has no Typed OM. `runtime.ts` holds `_cx` and `_cv` only. Values become CSS text at build time, so the browser never sees a value class. A polyfill in the browser path would be about 60 times the size of the whole runtime.

## Q4. Where it could help

**(a) Plugin authors in `fn()` and `scope()`.**

- _calc as `CSSMathSum`, in fluid._ Fluid computes numbers in JS and writes `clamp(...)` text (fluid's own `Clamp` says so, `fluid/src/index.ts:11`). A polyfill `CSSMathClamp` would only hold the same text. Benefit: none in the output. Cost: a build-time dependency, about 30 KB of eval per evaluation, and the engine cost is evaluation (`docs/research/engine-cost.md`). Risk: a different `calc()` order changes emitted CSS. Verdict: no.
- _Colours as `CSSOKLCH`, in gradient._ The constructor and `toString` are all the d.ts gives: no conversion or mixing. The maths stays in culori (`interpolateWithPremultipliedAlpha`, `formatHex8`, `gradient/src/index.ts:7`). `CSSOKLCH` would replace one template string. Verdict: no.

**(b) Diff-test the twin against Chrome's `CSSStyleValue.parse`.**

- `css-grammar/test/diff.ts` already asks Chrome for each case with `CSS.supports(p, v)` (line 63). `CSSStyleValue.parse` gives the same accept or reject. Its one gain is the normalized text, so a test could compare canonical output (the `calc()` case above is that kind of gap).
- Cost: a test step. Chrome is already needed for `diff.ts`.
- Risk: Chrome only. Firefox has no native Typed OM by default (the post links [Firefox bug 1278697](https://bugzil.la/1278697)). Node cannot judge: the polyfill's `parse` throws on every real property. So Chrome is the judge, not the polyfill.
- Note: our twin has no `parse(property, text)`. The wayfinder plans one (line 326). The code has `parse(grammar)`, `matches` and `valid` (`css-grammar/src/twin.ts:25, 38, 50`). The plan is not implemented.
- Verdict: possible, test only, later, if a normalized-text gap bites.

**(c) devtools and computed values.**

- devtools reads computed values as strings: `getComputedStyle` in `devtools/src/core/dom.ts:34, 142, 178`, and `getPropertyValue` in `inject.ts:35`. It compares strings and sheet text, so it does not need numbers.
- `balance/src/runtime.ts:21` does `parseFloat(getComputedStyle(el).width)`. A typed read would be `computedStyleMap().get("width").value`. That is native in Chrome and Safari. Firefox needs the polyfill.
- Cost: 30 KB in the balance runtime that users download, or in the overlay. Risk: the post says `currentcolor` is lost on the polyfill's `computedStyleMap()`, because `getComputedStyle` returns the resolved colour.
- Verdict: no. The gain is small and it is native where it matters.

**(d) The user-facing API.**

- The names already match: `CSS.px`, `CSSUnitValue`, `CSSColorValue`, `CSSImageValue`. Users who know Typed OM can read our code.
- The risk is identity. Our code tests `instanceof CSSStyleValue` in `macro.ts:114, 405`, `scope-engine.ts:429, 488` and `functions.ts:40`. A polyfill object is not an instance of ours. By reading the code (not run), the build would treat it as a non-value and reject it.
- Re-exporting the polyfill from `cssints` (option c below) would make two classes with one name. Guess: users would hit this the first time they import both.
- Verdict: no.

## Q5. Options and recommendation

| Option                                     | What it means                                                                                | Verdict                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| (a) Keep ours; add classes by hand         | Add a class only when a plugin needs it, in `values.ts`, with `toString` and the spec's name | **Recommended**                                                                                                                          |
| (b) Depend on `css-typed-om` at build time | Plugins build values with it; output as text                                                 | No. 30 KB of eval per build; a different `calc()` order; Node cannot validate; one maintainer, 9 stars, AI-written by its own disclaimer |
| (c) Re-export its classes from `cssints`   | `import { CSSUnitValue } from "cssints"` gives the polyfill's class                          | No. `instanceof` checks break; two classes with one name                                                                                 |
| (d) Use it only in tests                   | Chrome judges; the polyfill is what we test, if anything                                     | Maybe later, for the normalized-text gap (Q4b). Judge: Chrome, not the polyfill                                                          |
| (e) Nothing                                | Do not mention the package                                                                   | Close to (a). Still fix the wayfinder sentence (below)                                                                                   |

**Recommendation: (a).** Keep our classes. Add none now. Do not add the package. Our names already match the spec. Nothing in cssints needs math, transforms or the colour family yet. If one plugin needs typed `calc()`, write that one class by hand, with the spec's name and `toString`.

**What would change our mind:**

1. Firefox ships Typed OM unflagged. Then the polyfill covers only old browsers, and it is still not a build dependency.
2. A plugin needs typed math that we must simplify or compare. Then write `CSSMathSum` ourselves (or test the polyfill against Chrome first), and only at build time.
3. The polyfill ships a build-only entry without the DOM patch, and its classes tree-shake to a few KB. We would measure that first.
4. Our Chrome diff shows our `toString()` differs from Chrome's for values we emit, and the polyfill matches Chrome. Then the polyfill becomes a reference in tests (option d).
5. Users bring Houdini or polyfill objects into our API. Then accept them by shape (`toString`, a type marker), not `instanceof`.

## What the wayfinder section says now

For whoever edits `docs/wayfinder.md` (not done here):

- Line 320: the version date is 2026-08-19. WPT is 12479 of 13134 now (README).
- Line 320: "7.5 k lines" is unchecked. The source is about 263 KB in 50 files.
- Line 324: "in Node the dummy is a stub and every value passes" is wrong. Every real property throws; only `--custom` names pass.
- Line 326: `CSSRGB` and the colour family are in the polyfill, not in Chrome 155.
- Line 326: the planned `twin.parse(property, text)` is not in the code.
- Still holds: the polyfill has no property grammars. It delegates validation to the host. The layering table (lines 330–336) still holds.

## Not verified

- The WPT run (needs Firefox and Python). I took 12479 from the README.
- Whether the polyfill's `calc()` order is wrong per the spec. I saw a difference with Chrome, not a verdict.
- Other values beyond the one `calc()` case, in Chrome or the polyfill.
- Firefox and Safari with native Typed OM.
- The bundle with the polyfill inside cssints (no build was made).
- The `instanceof` failure in (d): read from the code, not run.
- The "7.5 k lines" in the wayfinder: not counted.
