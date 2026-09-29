# Design tokens: DTCG 2025.10, Ariakit constraints, and our token model

Ticket cssints-kag5, researched 2026-09-29. Facts come from primary sources: the DTCG repo (`main` at `882ebd6`), the published 2025.10 reports, Ariakit (`e6a3d4a`, package `@ariakit/tailwind` 0.2.8), specs on drafts.csswg.org, and `@mdn/browser-compat-data` 8.1.3 (the version pinned in `packages/css-grammar`). Things I ran myself are marked **(verified)**.

## Key findings

1. **DTCG 2025.10 has no constraints and no math.** It is a static value format: types, aliases, groups, and a resolver for modes. The only "constraint" it has is type validity (a value must match its `$type`, an alias must match the target type, no cycles). Contrast rules, `calc`, colour functions and conditional values are all open issues (#88, #224, #268), not spec. The legal place for our own extras is `$extensions`.
2. **Ariakit does not use `contrast-color()`.** It has zero uses in the generated CSS. It builds contrast from relative colour syntax (`oklch(from …)`), `calc/clamp/min/max/round/mod/sign`, and `@container style()` lookups. The WCAG maths runs in JavaScript when the plugin is built, and CSS only picks a row from a 32-row table. Only `ak-ink` claims AA; `ak-layer-contrast` says it does not guarantee a ratio.
3. **Build-time and CSS checks are complementary.** A compiler can fail the build for a bad contrast, a wrong type, a missing theme value or a cycle. CSS cannot. CSS must keep everything that depends on the DOM (nesting, the parent layer) or on runtime values.
4. **Our compiler can only check static values.** Values built with `color-mix()`, relative colour, `contrast-color()` or `if()` cannot be evaluated by culori 4.0.2 or Color.js 0.7.1 from strings **(verified)**, and our own `<color>` grammar rejects relative colour, `contrast-color()` and `if()` **(verified)**. `color-mix()` and `light-dark()` pass.
5. **`@property` limits derived tokens.** `initial-value` must be computationally independent, so a token defined by `var(--other)` or `oklch(from var(--x) …)` cannot put that expression in `@property`. Ariakit avoids this with `syntax: "*"` for most of its properties.
6. **Recommendation:** Option 2 below. It is typed tokens and themes from DTCG-shaped data (Option 1) plus one build-time check, `css.check.contrast`, over each theme. Derived tokens and colour helper functions stay out of 0.1.

## 1. DTCG 2025.10

**Status.** Published 2025-10-28 as a *Final Community Group Report*; it "is not a W3C Standard nor on the Standards Track" ([announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/), [format](https://www.designtokens.org/TR/2025.10/format/)). Later commits to `technical-reports/` are errata only (links, examples, MAY/MUST wording in #442), no new features (`gh api commits?path=technical-reports&since=2025-10-29`). Source text: [format](https://github.com/design-tokens/community-group/tree/main/technical-reports/format), [color](https://github.com/design-tokens/community-group/tree/main/technical-reports/color), [resolver](https://github.com/design-tokens/community-group/tree/main/technical-reports/resolver), [JSON schemas](https://github.com/design-tokens/community-group/tree/main/schemas/src/2025.10).

### Normative in 2025.10

| Feature | Rule | Source |
| --- | --- | --- |
| Token, group | Object with `$value` is a token; names may not start with `$` or contain `{ } .` | [design-token](https://github.com/design-tokens/community-group/blob/main/technical-reports/format/design-token.md) |
| `$type` | Required, on the token or inherited from a group or alias target. Tools MUST NOT guess it from the value | same |
| Simple types | `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number` | [types](https://github.com/design-tokens/community-group/blob/main/technical-reports/format/types.md) |
| Composite types | `strokeStyle`, `border`, `transition`, `shadow`, `gradient`, `typography`; sub-values may be aliases | [composite-types](https://github.com/design-tokens/community-group/blob/main/technical-reports/format/composite-types.md) |
| Color value | Object `{ colorSpace, components, alpha?, hex? }`, 14 colour spaces (srgb, srgb-linear, hsl, hwb, lab, lch, oklab, oklch, display-p3, a98-rgb, prophoto-rgb, rec2020, xyz-d65, xyz-d50); components have ranges, `none` allowed | [color-type](https://github.com/design-tokens/community-group/blob/main/technical-reports/color/color-type.md) |
| Dimension | `{ value, unit }`, unit only `px` or `rem` | types |
| Duration | `{ value, unit }`, unit `ms` or `s` | types |
| Other ranges | `fontWeight` [1, 1000] or a keyword; `cubicBezier` x in [0, 1]; HSL hue [0, 360) | types, color-type |
| Aliases | `{group.token}` refers to a whole token; chained aliases allowed; must match the target `$type`; cycles are an error | [aliases](https://github.com/design-tokens/community-group/blob/main/technical-reports/format/aliases.md) |
| `$ref` JSON Pointer | Tools MUST support it; it reaches inside a value, e.g. `#/base/blue/$value/components/0` | aliases |
| Groups | `$type` inheritance, `$root` token, `$extends` (deep merge, "syntactic sugar for JSON Schema `$ref`") | [groups](https://github.com/design-tokens/community-group/blob/main/technical-reports/format/groups.md) |
| `$extensions`, `$deprecated`, `$description` | Vendor data MUST be preserved; SHOULD be optional metadata "not crucial to understanding that token's value" | design-token |
| Resolver | Separate module, same version. `sets`, `modifiers` with `contexts`, `resolutionOrder`, an *input* that selects one context per modifier. Later entries win. **Aliases are resolved only after ordering**, so an alias follows the theme that is applied | [resolution-logic](https://github.com/design-tokens/community-group/blob/main/technical-reports/resolver/resolution-logic.md), [syntax](https://github.com/design-tokens/community-group/blob/main/technical-reports/resolver/syntax.md) |

The word "constraint" appears in the format spec only in the JSON Schema sense (`groups.md`, "Type inheritance": local `$type` and inherited constraints "must both be satisfied"). The spec text also has small inconsistencies, for example the resolver examples use both `context` and `contexts`.

### Not in the spec (proposals and open issues)

| Idea | Where | State |
| --- | --- | --- |
| Computed values, basic arithmetic | [#81](https://github.com/design-tokens/community-group/issues/81), [#153](https://github.com/design-tokens/community-group/issues/153) | Closed 2022 and folded into #88; "feel free to post use-cases" |
| Colour modifications (alpha, mix, lighten) | [#88](https://github.com/design-tokens/community-group/issues/88) | Open, active as of 2026-09. Debate: a short fixed menu of named adjustments vs a full expression system; "careful where DTCG starts reinventing programming syntax" |
| Token operations (`$operations`) | [#224](https://github.com/design-tokens/community-group/issues/224) | Open since 2023; Tokens Studio uses generators and resolvers instead |
| Relative colours and blending (CSS Color 5) | [#268](https://github.com/design-tokens/community-group/issues/268) | Open. An editor says they are "very interested", but wants a JSON syntax proposal first |
| Do transforms live in the file or before it | [#238](https://github.com/design-tokens/community-group/issues/238) | Closed without a decision; the format stays "static, compiled result" first |
| Conditional and contextual values, native modes | [#169](https://github.com/design-tokens/community-group/issues/169), [#204](https://github.com/design-tokens/community-group/issues/204), [#210](https://github.com/design-tokens/community-group/issues/210), [#348](https://github.com/design-tokens/community-group/issues/348) | Mostly open; #348 (`$modes`) closed as "core Resolver functionality" |
| Fluid dimensions, `em`, `%` | [#188](https://github.com/design-tokens/community-group/issues/188), [#218](https://github.com/design-tokens/community-group/issues/218), [#390](https://github.com/design-tokens/community-group/issues/390) | Open |
| System colours (high contrast) | [#91](https://github.com/design-tokens/community-group/issues/91) | Open |

If the request came from "tokens can express constraints and math" as seen in tools, that is Tokens Studio, Style Dictionary transforms, or Figma variables, not the DTCG format.

### What this means for us

- **Values differ from CSS text.** DTCG colours are objects, dimensions are `{ value, unit }` with only `px`/`rem`. The `docs/API.md` draft uses CSS strings (`"oklch(4.820% …)"`) under `$type: "color"`. A strict DTCG file from Figma or Tokens Studio will have objects, so the input must accept both. CSS strings are a superset (they need `vw`, `%`, `clamp()`, which DTCG cannot say) but do not round-trip to DTCG.
- **JSON imports lose their literal types (verified, tsc 5.9.3).** `import t from "./tokens.json"` types `$type` as `string` and `components` as `number[]`. An inline object with a `const` type parameter keeps them (`createTokens<const T>(…)`). Typed token paths from a `.json` file need codegen (a `.d.ts` written by the plugin).
- **Composite types have no `@property` syntax.** `shadow`, `border`, `typography`, `fontFamily`, `cubicBezier` and keyword `fontWeight` cannot be registered with a `<type>` syntax. Either decompose them into typed sub-tokens (`--shadow-1-color`, `--shadow-1-blur`, …, which matches DTCG's own sub-value aliases) or use `syntax: "*"` and check the value where it is used.
- **Themes map to the resolver.** `createTokens` is a set; `createGlobalTheme(tokens, condition, values)` is one modifier context; the mapping from context name to a CSS condition (media query or class) is ours. A resolver document could later feed the same calls.

## 2. Ariakit Tailwind

Source: [`packages/ariakit-tailwind`](https://github.com/ariakit/ariakit/tree/main/packages/ariakit-tailwind), docs at ariakit.com/styles. The README says it is experimental and "does not follow semantic versioning". It publishes no browser-support statement.

**How it is built.** `src/input.ts` (2753 lines) and `src/lib.ts` are a TypeScript DSL (`fn.calc`, `set`, `at.container`, `createVar`, `createVariant`). `node src/build.ts` renders `src/output.css`, the only export, as Tailwind v4 CSS (`@utility`, `@custom-variant`, `@property`). Theme input is plain Tailwind `@theme` custom properties (`--color-canvas`, `--color-primary`); the plugin reads them with `--value(--color-*, [color])`.

**The utilities** (from the README and `output.css`):

| Utility | Meaning | Guarantee stated |
| --- | --- | --- |
| `ak-layer` | A surface. Sets `--ak-layer` (background), `--ak-text`, `--ak-edge` from the parent layer | none |
| `ak-layer-lighten-6`, `-darken-*`, numeric `ak-layer-6` | Move the layer's OKLCH lightness away from the parent (numeric ones pick the direction for the theme) | "does not imply a fixed depth"; clamps around a forbidden mid-range |
| `ak-layer-contrast` | Push lightness away from the parent to a preset target | README: "does not guarantee a contrast ratio" |
| `ak-ink-70` | Text alpha, at least the value that meets **WCAG AA** against the layer | README claims AA; implemented as a polynomial in `calc()`, which I did not verify |
| `ak-text`, `ak-text-primary` | Coloured text with contrast against the layer, from a table | the JS table targets a ratio of 5.263 (`LCH_WCAG_CONTRAST_RATIO`, no comment explains it) |
| `--contrast` (0–100) | One global knob, set to 100 under `prefers-contrast: more` | n/a |

**The CSS it emits.** I compiled a small page with Tailwind 4.3.3 (`@tailwindcss/cli`) against the package's `output.css`, with `@theme { --color-canvas: #f5f8f7; --color-primary: #2563eb }`. Excerpts, abridged with `…`:

```css
/* .ak-layer: a chain of relative colours; each stage reads the previous one */
.ak-layer {
	color: var(--ak-text);
	background-color: var(--ak-layer);
	--ak-layer: oklch(from var(--_ak-lo) calc(var(--_ak-lpl) + …clamp(0, (min(…) * 1000000), 1)…) clamp(var(--_ak-layer-chroma-min), c, var(--_ak-layer-chroma-max, var(--chroma-p3-max, 0.368))) h);
	--_ak-lib: oklch(from var(--_ak-layer-color, var(--ak-layer-parent, canvas)) calc(l + var(--_ak-layer-idle-relative-lightness) + …) …);   /* base */
	--_ak-lio: oklch(from var(--_ak-layer-mix, var(--_ak-lib)) … c h);                                                                          /* idle offset */
	--_ak-li:  oklch(from var(--_ak-lio) calc(… var(--_ak-lcd) … var(--_ak-lcpl) …) c h);                                                       /* contrast */
	--_ak-lb:  oklch(from oklch(from var(--_ak-li) …) …);                                                                                       /* state */
	--_ak-lo:  oklch(from var(--_ak-lb) var(--_ak-layer-lightness-offset-resolved, …) c h);                                                     /* final */
	--_ak-ll:  oklch(from var(--ak-layer) round(l, 0.125) 0 0);                    /* lightness rounded to 1/8 */
	--_ak-ltl: lch(from var(--ak-layer) round(down, var(--_ak-ltlv), 3.125) 0 0);  /* LCH lightness in 32 buckets */
	/* the parent layer is read by alternating two names, so a property never references itself */
	@container (style(--_context-0: even)) or (not style(--_context-0)) { --_context-0: odd;  --_ak-lpc-odd: var(--ak-layer);  --ak-layer-parent: var(--_ak-lpc-even); }
	@container style(--_context-0: odd)                                 { --_context-0: even; --_ak-lpc-even: var(--ak-layer); --ak-layer-parent: var(--_ak-lpc-odd); }
}
.ak-layer-canvas   { --_ak-layer-color: var(--color-canvas); --_ak-lm: 1; }
.ak-layer-lighten-6 { --_ak-layer-idle-relative-lightness: calc(6 / 100); --_ak-lm: 1; }

/* ak-layer-contrast: lookup by style query on the rounded parent colour */
.ak-layer-contrast {
	@container style(--_ak-ll: oklch(0.625 0 0)) { --_ak-lcd: 1;  --_ak-lcpl: 0.625; }
	@container style(--_ak-ll: oklch(0.75 0 0))  { --_ak-lcd: -1; --_ak-lcpl: 0.75; }
	/* … 9 rows */
}

/* ak-text: the accessible lightness comes from a table computed in JS */
@container style(--_ak-ltl: lch(75 0 0)) { --_ak-tcd: -1; --_ak-tpl: 75; --_ak-tal: 27.0828; --_ak-tcc: 40; }  /* 32 rows */
@supports (color: if(else: red)) { … --_ak-tal: if(style(--_ak-ltlc-even: lch(0 0 0)): 55.2119; style(--_ak-ltlc-even: lch(3.125 0 0)): 57.033; …; }
.ak-text { color: lch(from oklch(from var(--_ak-text-color, var(--ak-layer)) clamp(…) clamp(…) …) calc(l + (var(--_ak-tcd) * max(0, ((clamp(0, ((var(--_ak-tpl) + ((var(--_ak-tal) - var(--_ak-tpl)) * var(--_ak-text-contrast-scale)))…), 100) - l) * var(--_ak-tcd))))) min(c, var(--_ak-tcc)) h); }

/* registered constants: most use syntax "*", so any token stream is allowed as the initial value */
@property --_ak-tmal { syntax: "*"; inherits: false; initial-value: calc(1.386 - (l * 0.85)); }
@property --ak-layer { syntax: "<color>"; inherits: true; initial-value: canvas; }
@property --_ak-ct   { syntax: "<number>"; inherits: true; initial-value: 0; }
```

Lines in `output.css` that contain each token: 139 `@property`, 93 `@container`, 20 `oklch(from`, 22 `lch(from`, 60 `clamp(`, 49 `max(`, 10 `if(`, 4 `color-mix(`, 2 `@supports`, **0 `contrast-color(`**. `color-mix()` appears only in `ak-layer-mix`.

**What is worth learning from it.**

- **Contrast is a table, not a formula.** `getWcagLightnessTarget` (in `input.ts`, from `getTextLightnessSteps`) inverts the WCAG luminance ratio for each of 32 parent-lightness buckets in JS. CSS only rounds the parent colour (`round(down, …, 3.125)`) and matches the bucket with a style query (or one `if()` chain in Chrome). The check happens at plugin build time, over a quantised domain. This is the same idea as a build-time constraint, moved into the library.
- **CSS cannot compare numbers in a query cheaply**, so Ariakit tests equality on rounded colours. Range syntax for style queries is Chrome 142 and Firefox 151 only (BCD).
- **Nesting is handled with an odd/even pair** of custom properties, because a property cannot reference itself (a cycle makes it invalid at computed-value time). A static compiler cannot see the DOM, so this stays in CSS.
- **Most `@property` registrations use `*`.** They act as typed-less constants and defaults, which our `token.<type>` list cannot express.
- **Cost:** thousands of characters per rule, style-query matching per element (the changelog moved `ak-text` to `if()` to cut selector matching), and no guarantee for the parts users choose (`ak-layer-*`). It also reads the DOM, so only real browsers can verify the result (Ariakit tests snapshots in light, dark and high contrast).

## 3. Other prior art (one line each)

| Library | What it offers for this question | Source |
| --- | --- | --- |
| StyleX | `stylex.types.color/length/angle/…` in `defineVars` emit `@property` with that `syntax`. Same list as our `token.<type>`. No constraints or math | [types](https://stylexjs.com/docs/api/javascript/types/) |
| vanilla-extract | `createThemeContract` plus `createTheme` fails the build when a theme misses a key (`validateContract`: "Tokens don't match contract"). `createVar({ syntax, inherits, initialValue })` emits `@property`. `@vanilla-extract/css-utils` `calc.add/multiply` only concatenates strings | [contract](https://vanilla-extract.style/documentation/api/create-theme-contract/), source `packages/css/src/vars.ts`, `packages/utils/src/index.ts` |
| Panda | `semanticTokens` with `{ base, _dark }` conditions and `{colors.red}` references; "influenced by the W3C Token Format". No checks | [tokens](https://panda-css.com/docs/theming/tokens) |
| Radix Colors | Contrast is baked into a 12-step scale: steps 11 and 12 are "guaranteed to Lc 60 and Lc 90 APCA" on step 2 of the same scale. Precomputed, no runtime maths | [scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) |
| Open Props | Static custom-property scales; one input, `--color-hue`, re-hues a fixed ladder (`oklch(95% .06 var(--color-hue, 0))`), declared on `:where(*)` so `var()` resolves per element. Its repo ships `open-props.resolver.json` (`"version": "2025.10"`), so DTCG is an export format there | `src/props.colors-oklch.css`, `open-props.resolver.json` |

## 4. Mapping onto our model

Our model: a token is a Typed OM value whose `toString()` is `var(--name)`; `token.<type>` per `@property` syntax; the initial value is checked by the mdn grammar; one `@property` per token at the top of the sheet; `style()`/`token.set()` are static at build time.

### 4.1 Which constraints go where

| Constraint | Build time (compiler) | Stays in CSS | Notes |
| --- | --- | --- | --- |
| Value matches its type (initial values, each theme value) | Yes, grammar (already decided) | `@property` makes a bad computed value fall back to `initial-value` | Also DTCG ranges (fontWeight, cubicBezier, hue) |
| Alias target exists, same type, no cycle | Yes, graph check | `var()` cycle = invalid at computed-value time | DTCG normative, cheap |
| Theme completeness (every theme covers every token that must be themed) | Yes | no | vanilla-extract's contract check |
| **Contrast ratio of a token pair per theme** | Yes, when both values are static (literal colours or alias chains to literals). WCAG 2.x ratio via a colour library; APCA optional | Cannot fail a build | The main compile-time-only feature. Unverifiable pairs get a warning, not an error |
| Ordered scale (`space-2 > space-1`), range of a number | Yes, same-unit lengths exact; mixed `rem`/`px` assume 16px and are approximate | no | `rem` follows the user's font size |
| Unit-correct `calc()` | Yes, dimension analysis (Typed OM numeric typing) | The browser drops an invalid `calc()` | Grammar does not check units in `calc` yet (wayfinder, "Still open") |
| `calc()`, `min/max/clamp`, `round/mod` on tokens | Only constant folding of literals (LightningCSS may already do it) | Yes, because operands can be set at runtime | |
| `color-mix()`, relative colour (`oklch(from …)`), `contrast-color()`, `if()` | Only if we implement Color 5 ourselves (see 4.2) | Yes | Reactive to runtime overrides |
| Anything that depends on nesting (parent layer), DOM, or an inline `style={{ "--x": v }}` | No | Yes | Ariakit's odd/even trick |
| `prefers-*` and `@media` themes | Yes: each condition is a known theme, so it can be checked | Applied by the browser | Combinations (dark × contrast-more) are only checked if declared, like resolver permutations |

`contrast-color()` does not replace a build check: in CSS Color 5 it takes one colour and returns black or white with a UA-defined algorithm, and the result "should still meet" only AA for *large* text ([css-color-5 §8](https://drafts.csswg.org/css-color-5/#contrast-color)). The Color 6 *editor's draft* adds a target (`wcag2(4.5)`) and a candidate list, with the fg/bg keywords still "TBD" ([css-color-6](https://drafts.csswg.org/css-color-6/#contrast-color)); BCD has no sub-feature for it.

### 4.2 Hard limits found

- **`@property` initial values.** `initial-value` must parse against the syntax and be *computationally independent*: `5px` and `1in` are, `3em` and anything with `var()` are not ([css-properties-values-api](https://drafts.css-houdini.org/css-properties-values-api/#initial-value-descriptor)). So an alias or derived token needs a literal `initial-value` (the alias flattened at build time) plus a normal declaration for the live value: `:root { --color-link: var(--color-accent) }`. Ariakit escapes this with `syntax: "*"`.
- **Aliases and theme scope.** `var()` is substituted where the property is declared, and descendants inherit the computed result. If a theme is a class on a wrapper and only `--color-accent` is set there, `--color-link` (declared on `:root`) keeps the old value. The compiler knows the graph, so each theme block should also re-declare the tokens that depend on what it overrides. Open Props solves the same problem by declaring on `:where(*)`. (Standard computed-value-time substitution; [css-variables](https://drafts.csswg.org/css-variables/#substitute-a-var).)
- **Grammar gap (verified with `valid("color", …)` in `packages/css-grammar/src/twin.ts`).** Accepted: `color-mix(in oklab, red, blue 30%)`, `light-dark(red, blue)`. Rejected: `oklch(from red calc(l + 0.1) c h)`, `contrast-color(red)`, `if(style(--x: 1): red; else: blue)`. mdn-data 2.27.1 `<color>` is `<color-base> | currentColor | <system-color> | <light-dark()> | <deprecated-system-color>`; `@webref/css` 8.7.5 lists `contrast-color()` only as the Color 6 draft form. Ariakit-style CSS cannot be typed through `color()` until this is extended.
- **Colour libraries parse literals, not Color 5 strings (verified).** culori 4.0.2 and Color.js 0.7.1 parse `#hex`, `oklch()`, `color(display-p3 …)`, `hsl()`, named colours; both fail on `color-mix()`, relative colour, `contrast-color()`, `light-dark()`, `canvas`, `currentcolor`. Both have programmatic mixing (`Color.mix`, `culori.interpolate`) and WCAG 2.1 and APCA contrast (Color.js: `#2563eb` on white is 5.17, APCA −80.2; culori `wcagContrast` gives 5.17). So a build check works on literal colours and on DTCG colour objects, and anything else is "unverifiable".
- **Alpha.** A translucent colour has no contrast without a backdrop. The check must take opaque colours, or a declared backdrop.
- **Typed OM has the math types.** The `css-typed-om` polyfill noted in `docs/wayfinder.md` has `CSSMathSum` etc. A typed `calc` would build those objects; it is the natural way to type math, if we ever add helpers.

### 4.3 DTCG type to token type

| DTCG `$type` | Our token | `@property` syntax | Conversion |
| --- | --- | --- | --- |
| `color` | `token.color` | `<color>` | object to `color(<space> …)` / `oklch()` / `hsl()`; the `hex` field is a fallback, ignore it |
| `dimension` | `token.length` | `<length>` | `{ value: 1, unit: "rem" }` to `1rem` |
| `number` | `token.number` | `<number>` | as is |
| `duration` | `token.time` | `<time>` | `{ value: 200, unit: "ms" }` to `200ms` |
| `fontWeight` | `token.number` (numeric) | `<number>` | keywords map to numbers (`bold` = 700) |
| `fontFamily`, `cubicBezier` | none | `*` or unregistered | `cubic-bezier()` and a comma list are checked at the point of use |
| `shadow`, `border`, `transition`, `gradient`, `typography`, `strokeStyle` | decompose into sub-tokens | one per part | or `*` and check where used |

### 4.4 Browser support of the CSS features involved

First stable version, from `@mdn/browser-compat-data` 8.1.3 (`—` = not supported):

| Feature | BCD path | Chrome | Firefox | Safari |
| --- | --- | --- | --- | --- |
| `@property` | `css.at-rules.property` | 85 | 128 | 16.4 |
| `color-mix()` | `css.types.color.color-mix` | 111 | 113 | 16.2 |
| Relative colour (`oklch(from …)`) | `css.types.color.oklch.relative_syntax` (`lch` 119, `rgb` 122, `hsl` 125, `color()` 119) | 122 | 128 | 18 |
| `contrast-color()` (one-argument form) | `css.types.color.contrast-color` | 147 | 146 | 26 |
| `if()` (experimental) | `css.types.if` | 137 | — | — |
| `@container style(--x: v)` | `css.at-rules.container.style_queries_for_custom_properties` | 111 | 151 | 18 |
| Style query range syntax | `….range_syntax` | 142 | 151 | — |
| `@function` (experimental) | `css.at-rules.function` | 139 | — | preview |
| `light-dark()` | `css.types.color.light-dark` | 123 | 120 | 17.5 |
| `round()`, `mod()`, `rem()` | `css.types.round` etc. | 125 | 118 | 15.4 |
| `sign()`, `abs()` | `css.types.sign` | 138 | 118 | 15.4 |
| `clamp()`, `min()`, `max()` | `css.types.clamp` | 79 | 75 | 13.1 (`min`/`max` 11.1) |
| `prefers-contrast` | `css.at-rules.media.prefers-contrast` | 96 | 101 | 14.1 |

Derived floor for Ariakit's output (my reading of the table, since it publishes none): relative colour + style queries + `round/mod` + `sign` need **Chrome 138, Firefox 151, Safari 18**; `if()` is only an optimisation behind `@supports`. Anything we emit with `@property` alone needs Chrome 85, Firefox 128, Safari 16.4.

## 5. Options for 0.1

All three take DTCG-shaped input (inline object with `const` generics; values are DTCG objects or CSS strings checked by the grammar) and emit as in section 4.2 (flattened `initial-value`, live aliases, dependents re-declared per theme).

### Option 1: typed tokens and themes, no checks

```ts
const t = css.createTokens({
	color: {
		$type: "color",
		bg: { $value: "#fff" },
		accent: { $value: { colorSpace: "oklch", components: [0.62, 0.19, 264] } }, // DTCG form
		link: { $value: "{color.accent}" },                                          // alias
	},
	space: { $type: "dimension", md: { $value: { value: 1, unit: "rem" } } },
});
css.createGlobalTheme(t, css.media("(prefers-color-scheme: dark)"), { color: { bg: "#111" } });
css.cn(css.bg(t.color.bg), css.p(t.space.md));  // t.color.bg is a Typed OM value: var(--color-bg)
```

CSS functions stay strings: `css.color("color-mix(in oklab, var(--color-accent), black 15%)")`.

### Option 2: Option 1 plus a build-time contrast check

```ts
css.check.contrast(t.color.fg, t.color.bg, { min: 4.5 });   // WCAG 2.x; every theme, build time
// build error: contrast 3.1 < 4.5: color.fg on color.bg, theme (prefers-color-scheme: dark), theme.ts:12
```

For each theme the compiler applies the theme's values over the base, resolves aliases, and computes the ratio from literal colours (culori or Color.js at build time only; nothing ships to the browser). Values it cannot evaluate give a warning that names the token. The same rule could live in `$extensions["dev.cssints"]` for portability; the spec requires tools to preserve unknown extensions.

### Option 3: Option 2 plus derived tokens

```ts
const hover = css.token.color(css.colorMix("oklab", t.color.accent, "black 15%"));  // CSS, reactive
const onAccent = css.token.color(css.contrastColor(t.color.accent));                // Chrome 147 / Firefox 146 / Safari 26
const solid = css.derive(t.color.accent, (c) => c.darken(0.15));                    // JS at build time, per theme, literal
```

### Trade-offs

| | Option 1 | Option 2 (recommended) | Option 3 |
| --- | --- | --- | --- |
| Added code | none beyond tokens and themes | one function plus a colour library (build only) | helpers, a derive runtime, grammar extension for Color 5, `if()` |
| Catches bad contrast | no | yes, for static pairs | yes, plus derived values if `derive()` is used |
| Reactive to runtime overrides | n/a | n/a | `colorMix`/`contrastColor` yes; `derive()` no (baked per theme) |
| Two ways to derive a value | no | no | yes (CSS and JS), so users must choose |
| Browser floor | `@property` (Chrome 85, Firefox 128, Safari 16.4) | same | Chrome 147 / Firefox 146 / Safari 26 if `contrast-color()` is used |
| Risk | users do not learn about contrast problems until a browser or an audit | false confidence if the check silently skips unverifiable pairs (mitigated by the warning) | becomes a colour-management library; `contrast-color()` is black/white only |

## 6. Recommendation

**Ship Option 2, in two steps.** First Option 1 (it is the whole token and theme model and is needed anyway), then `css.check.contrast` as a small separate module, so it can be dropped without touching the tokens.

- Take only the normative part of DTCG: types, aliases, groups, `$extensions`, and the resolver idea (sets, modifier contexts, inputs) as our theme shape. Do not invent constraint or math syntax in the JSON; the spec has none and the open issues have not settled one.
- Keep math and colour derivation as CSS strings validated by the grammar. That already works for `color-mix()` and `calc()`. Fix the grammar gap (relative colour, `contrast-color()`, `if()`) instead of adding helper functions; this is also the answer to the map's open question about `css.colorMix(...)` helpers, for now.
- Do not copy Ariakit's approach of computing contrast in CSS. It needs Chrome 138 / Firefox 151 / Safari 18, produces very large rules, cannot fail a build, and only `ak-ink` claims a ratio. Keep its idea instead: a checked contrast rule per theme, run when the theme is built.
- Prefer an explicit ladder (`surface-0 … surface-3`, each a token) over implicit nesting. A ladder is static, so the compiler can check it; nesting needs the odd/even trick and only CSS can resolve it.

## 7. Follow-ups

- Implementation of the token model (cssints-79xr) should flatten alias `initial-value`s and re-declare dependents per theme, and fix the `docs/API.md` Themes draft: its `@media { --x: … }` output is invalid without a `:root` rule, and `initial-value: unset` is not a `<color>`.
- Grammar: add relative colour, `contrast-color()`, `if()` to `<color>` (from `@webref/css` css-color-5 and css-color-6 where possible), and check units in `calc()`.
- Decide token names for `fontFamily`, `cubicBezier` and composite tokens (decompose or `*`), and DTCG JSON typing (codegen `.d.ts` or inline `const` objects).
- Later: accept a resolver document as theme input; APCA as a second contrast algorithm; a `$extensions["dev.cssints"]` form of the checks.

## Sources

- DTCG: [format 2025.10](https://www.designtokens.org/TR/2025.10/format/), [announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/), [repo](https://github.com/design-tokens/community-group), issues #81, #88, #91, #153, #169, #188, #204, #218, #224, #238, #268, #348, #383, #390, PR #442.
- Ariakit: [`packages/ariakit-tailwind`](https://github.com/ariakit/ariakit/tree/main/packages/ariakit-tailwind) (`readme.md`, `src/input.ts`, `src/lib.ts`, `src/output.css`, `src/build.ts`).
- CSS: [css-color-5](https://drafts.csswg.org/css-color-5/), [css-color-6](https://drafts.csswg.org/css-color-6/), [css-properties-values-api](https://drafts.css-houdini.org/css-properties-values-api/), [css-variables](https://drafts.csswg.org/css-variables/), [BCD](https://github.com/mdn/browser-compat-data).
- Prior art: [StyleX types](https://stylexjs.com/docs/api/javascript/types/), [vanilla-extract createThemeContract](https://vanilla-extract.style/documentation/api/create-theme-contract/), [Panda tokens](https://panda-css.com/docs/theming/tokens), [Radix Colors scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale), [Open Props](https://github.com/argyleink/open-props).
