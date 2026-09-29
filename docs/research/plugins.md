# Plugins: registered properties, kernels and runtime polyfills

Ticket cssints-rq2r, researched 2026-09-29. Three use cases drive it: `frame()`/`surface()` as the first plugin (cssints-1xqr), icons (`packages/plugin-icon`), and the ~5 live WebKit-only properties. Facts come from primary sources: the CSS Parser Extensions explainer, the `../macros` draft (section 6), the engine on `master` (`packages/cssints/src/plugin.mjs`, `macro.mjs`, `lib.mjs`), `css-grammar` (`css.ts`, `support.ts`), `@mdn/browser-compat-data` 8.1.3 (BCD), `mdn-data` 2.27.1, LightningCSS 1.33.0. Things I ran myself are marked **(verified)**: Chrome 154.0.8037.57 (installed), Firefox 155.0 and WebKit 26.6 (Playwright builds, downloaded for this ticket), through playwright-core 1.63. The prototype is in [plugins-proto/](plugins-proto/) (numbers in `results.txt`, rerun with `BROWSER=chrome|firefox|webkit node test.mjs`). Product code was not touched; the engine is being ported on branch `port`, so everything below is stated as behaviour.

## Key findings

1. **The compiler is already the "parser extension".** CSS Parser Extensions exists to spare polyfills from gathering and re-parsing stylesheets (its explainer says about 65% of the container-query polyfill is CSS parsing). cssints owns the parse: it knows every class it emits, so the runtime half needs no CSS parser, no stylesheet walk, no cascade. The prototype runtime is **730 B gzip** (1 361 B min), against 9.8 kB gzip for the container-query polyfill.
2. **The runtime polyfill for `@container style()` works, and matches the style-query version exactly (verified).** Radii and colours at three depths (with plain wrappers between), plus class toggles, inserts, wrapping, inline style changes, `:hover`, and a media query: 2 088 compared values in each of Chrome 154, Firefox 155 and WebKit 26.6, **0 mismatches, worst numeric delta 0**. Negative controls fail as they should (no script: nested radii 0px; no transition sentinel: stale after `:hover`).
3. **It costs about 10 times the style-query CSS on a first pass and about 15 times when the whole tree changes, and it scales with the changed subtree, not the page.** 5 461 nested frame+surface elements: first pass 117 ms in Chrome (12 ms with style queries), 90 ms in Firefox, 283 ms in WebKit. A class toggle on a small subtree is 2 ms. A change that touches the whole tree is 220 ms in Chrome. A page with a few hundred frames pays single-digit milliseconds (Chrome, about 10 µs per element per feature). Deep chains are the reverse: at depth 300 the style-query kernel takes 146 ms in Chrome and the runtime 14 ms.
4. **Watching CSS-driven changes is the expensive part, so it is opt-in per element.** The only signal a script gets for `:hover`, media and container conditions is a transition on a registered sentinel property (`transitionrun`). It works in all three engines, but costs about 3 times the base run (375 ms vs 117 ms for 5 461 elements). The build knows which sites have a condition or a token input, so it marks only those with `_w`.
5. **The runtime lifts the floor for frames, less for surfaces.** Frame: from Chrome 111 / Firefox 151 / Safari 18 to Chrome 99 / Firefox 128 / Safari 16.4 (`@layer` and `@property`, which the sheet needs anyway). Surface needs relative colour too (Chrome 122, Firefox 128, Safari 18), so the runtime only helps Firefox 128 to 150, not Safari 16.4 to 17.
6. **Two kernels must not share custom-property names (verified).** My first combined page had frame and surface both using `--_e`/`--_o`, surface registered them as `<color>`: every frame radius became 0px. The contract must reject two kernels declaring the same custom property, and plugins prefix theirs.
7. **Type-level: a plugin's `as const` grammar feeds the existing recognizer unchanged (verified).** `Matches<Syntax, S>` in `css.ts` is already generic in the grammar string; only the error label (`Valid` is tied to `keyof Props`) needs generalising. `property()`, `context()` chains and `style()` type-check with tsgo and tsc, wrong calls fail with the expected errors (`plugins-proto/types/`). Plugin grammars can use built-in types and properties (`<length>`, `<'padding'>`); plugin-local names need string composition in 0.1.
8. **The five WebKit-only properties are a built-in list, not a plugin (verified).** LightningCSS passes all five through unchanged, with and without targets. They have no lowering and no runtime, so a plugin would be a data file behind a contract. The same registration primitive (`property()`) is how users add more.
9. **Icons fit the contract with a kernel, and need one engine change.** Iconify's mask CSS is one shared rule plus one `--svg` value per icon, which is "kernel by key + one custom property per site". The engine change: a call rooted at an attributed import may return a plugin value (a function), not only a style.
10. **Recommendation:** no public plugin API in 0.1; build the internal seams it needs (kernel by key in `_.k`, marker classes on the style node, one BCD-lacking helper) and ship the five properties as a built-in list. Public contract in 0.2 with `frame()` as the first consumer, icons second.

## 1. Prior art

| What | State (2026-09-29) | How it registers syntax | How it decides to run | Lesson for us |
| --- | --- | --- | --- | --- |
| [CSS Parser Extensions](https://github.com/bramus/css-parser-extensions) (Bramus) | An explainer, "Inception, Active", 22 commits, last push 2026-01-19; no spec draft, no browser implementation; expected venue CSSWG. Pitched at [BlinkOn, April 2025](https://www.bram.us/2025/05/04/css-parser-extensions-pitch/) | `CSS.parser.registerProperty/Function/Keyword/Syntax(name, { syntax, initialValue, inherits, invalidation, caching_mode })`, then `.computeTo()`, `.onMatch()`, `.onElementMatch()`, `.onElementUnmatch()` | The registration overrides the UA's own (so a shipping browser cannot break a polyfilled site); detection is `CSS.parser.supports*` | The vocabulary the draft borrowed. The API cannot be used (nothing ships), but its split is right: computed value, replacement declarations, per-element lifecycle |
| [csswg-drafts #13186](https://github.com/w3c/csswg-drafts/issues/13186) (Lea Verou, 2025-12) | Open. Asks for parsed-but-invalid rules and declarations to stay reachable in the CSSOM (`rawStyle`, `rawCSSRules`) as a cheap first step | none | none | Even the minimal step is not agreed. Plan on nothing native |
| [WICG CSS Parser API](https://github.com/WICG/CSS-Parser-API) / Houdini [Custom Functions](https://www.xanthir.com/talks/2019-05-15/) | Draft with no activity since 2021-07 (parse to Typed OM objects, register `--fn()` in JS) | `CSS.registerFunction({ name, inputArguments }, fn)` | none | Same idea as `computeTo`; never shipped in this form (`@function` shipped in CSS instead) |
| [Properties and Values](https://www.w3.org/TR/css-properties-values-api/) (`@property`, `registerProperty`) | Shipped everywhere our targets go (Chrome 85, Firefox 128, Safari 16.4) | `syntax` strings, initial value must be computationally independent | native | The one Houdini piece we rely on, and the reason the runtime can read exact computed lengths and colours |
| [postcss-preset-env](https://github.com/csstools/postcss-plugins/tree/main/plugin-packs/postcss-preset-env) | Maintained (pushed today) | A list of features from cssdb, each a PostCSS plugin | browserslist against BCD/Can I Use data: unneeded plugins are skipped. Features that need a browser library are off unless `enableClientSidePolyfills`, and the library is not bundled for you | The model for "runtime only when a target needs it". We can do better: we also bundle it |
| [css-anchor-positioning](https://github.com/oddbird/css-anchor-positioning) (OddBird) | Maintained (2026-09) | Parses all CSS with `css-tree` (79% of a 221 kB bundle, per the explainer) | `if (!("anchorName" in document.documentElement.style)) import(...)`, i.e. runtime feature test, loaded lazily | Runtime probe plus lazy load is the accepted pattern. Its README documents what a JS polyfill cannot do: React drops unknown inline styles, dynamically added anchors, shadow roots |
| [container-query-polyfill](https://github.com/GoogleChromeLabs/container-query-polyfill) (Google Chrome Labs) | Not archived, last push 2026-06 | Rewrites `<style>` and same-origin `<link>` text | always loaded | 29.6 kB min, 9.8 kB gzip; limited to stylesheets it can fetch and parse. [The dark side of polyfilling CSS](https://philipwalton.com/articles/the-dark-side-of-polyfilling-css/) is the reason to avoid parsing at runtime |
| [Ariakit Tailwind](https://github.com/ariakit/ariakit/tree/main/packages/ariakit-tailwind) | Shipping | n/a, CSS only | never: needs style queries | The source of the kernels (surfaces-frames.md) |

## 2. The `../macros` draft against the engine

| | Carries over | Tied to the old engine (drop or replace) | Missing from the draft |
| --- | --- | --- | --- |
| Registration | `registerProperty/Function/Keyword` with an mdn value-definition grammar; `computeTo` at build time; the two phases (build lowering, runtime behaviour); `css-polyfill-*` npm naming; error table (duplicate registration, bad syntax) | `polyfill` global imported `with { type: "macro" }` (now `type: "cssints"`); the registry as `polyfill-registry.json` in the VFS | Types: how a grammar string becomes a typed function |
| Build time | Callbacks run in the same evaluator as `css.*` calls | The Rust pipeline visiting every CSS AST node and calling into a VM per match (slow by the draft's own note); `{ type: "css", ast }` as the return contract; atomic classes generated inside a processor plugin | Kernel by key with de-duplication; the `_.k` layer; `@property` at the sheet top; conflict checks between a plugin's markers and plain properties |
| Runtime | `onElementMatch`/`onElementUnmatch` as a lifecycle | Extracting `fn.toString()` bodies into `vfs/js/runtime/*.js` (closures, imports and transpilation break it); three unplugins (macros, processor, polyfills); injection "into HTML or JS" | The target decision (the draft never says how a polyfill is chosen for a target; the polyfills plugin has only `output.mode` and `position`); a runtime feature probe; tree-shaking; dev/HMR behaviour; how CSS-driven changes (`:hover`, media) reach the script |
| Example quality | `size` (a property lowered to `width`/`height`) is a good `emit` | `light-dark()` `computeTo` reading `context.colorScheme` at build time: the scheme is a runtime fact, so it can only be CSS (`light-dark()` itself, or a `@media (prefers-color-scheme)` variant) | Value functions (`css.colorMix`) are "not yet specified" in API.md |

The shape that survives is small: **a plugin is a build-time module of members (property, style, context, fn), kernels by key, and an optional declarative runtime.** The draft's per-node CSS AST visiting is not needed, because sites are evaluated as ordinary calls in the Module Runner and return declarations.

## 3. Runtime polyfill prototype

Files: `plugins-proto/engine.js` (the runtime), `kernels/*.css` (the style-query kernels from surfaces-frames.md, plus fallback CSS), `test.mjs` (equivalence), `controls.mjs` (negative controls), `bench.mjs`, `size.mjs`, `probe.mjs`, `types/` (plugin types).

### 3.1 Design

The style-query kernel cannot be run without `@container style()`, and only one thing in it needs the parent: the parent's inner radius (frame) or colour (surface). The fallback keeps the formula in CSS and moves the parent lookup to a script:

```css
/* fallback, scoped so that browsers with style queries ignore it; @property blocks as in the kernel */
:root[data-cssints-poly] .f {
  --_fu: calc(var(--_r) + var(--_m));                                        /* default: a root frame; the script overrides it inline */
  --_fi: max(max(var(--_fu) - var(--_m), 0px) - var(--_p) - var(--_b), 0px);  /* inner radius, read by the script */
  --_ft: var(--_fi);                                                          /* sentinel, see below */
  border-radius: max(var(--_fu) - var(--_m), 0px);
}
```

```js
// engine.js (abridged): for each marked element, copy the nearest marked ancestor's computed --read into --write
update(roots): for each feature { marker, read, write }
  group elements by frame-depth; per level: read all parents (one style recalc), then write all (setProperty / removeProperty)
MutationObserver(subtree, childList, class, style) -> update(top-most changed nodes); mo.takeRecords() after our own writes
document.addEventListener("transitionrun", e => sentinel.includes(e.propertyName) && update([e.target]))
```

Decisions, each one measured or forced by a failure:

- **Registered, non-inherited properties everywhere the script writes or reads.** An unregistered custom property inherits, so every write would restyle the whole subtree (quadratic). Registered (`inherits: false`) they restyle one element. Registration also gives exact computed lengths (the `em` case in surfaces-frames.md §2.1).
- **Levels, not elements.** Reading `getComputedStyle(parent)` after every write forces a style recalc each time. Processing one nesting level at a time makes it one recalc per level (7 for the 5 461-element tree). Reading each parent once (a `Map`) cut reads 4 times more.
- **Own writes are dropped from the observer** with `takeRecords()`; `style` is observed so that `el.style.setProperty("--_p", …)` updates descendants.
- **The probe decides at run time** whether to do anything: it inserts `@container style(--_q:1){i{--_h:1}}` and reads whether it applied (0.1 ms Chrome). In a browser without style queries the rule parses (general-enclosed) but never matches; an unknown query function behaves the same and returns `""` in all three engines **(verified)**. I have no browser older than Firefox 151 or Safari 18, so the negative probe is checked by that stand-in, and the polyfill itself by forcing it on (`force`) with the `@container` rules removed from the CSS.
- **The sentinel.** `:hover`, media and container conditions change a computed value with no DOM event. A registered property with `transition: --_ft 1ms` fires `transitionrun` when its computed value changes; the script then re-runs on that element's subtree. The sentinel is a separate property because the transitioning property reads as its old value at the event. Only elements with the `_w` marker have the transition, because it is expensive (§3.3).
- **Where the script's writes live:** inline custom properties through CSSOM (`el.style.setProperty`), not `style` attribute text. A strict `style-src` CSP blocks markup `style` attributes but not CSSOM writes. A framework that resets a whole `style` attribute drops our values, but the observer sees the `style` mutation and writes them again. Not tested with React or hydration.

### 3.2 Equivalence (verified)

Each step is applied to two pages in the same browser, one with the style-query kernels only and one with the fallback and the script forced on, and every element's computed `border-top-left-radius`, `padding-top` and `background-color` are compared (22 elements, 2 088 values per browser).

| Element (Chrome 154) | Style queries | Runtime |
| --- | ---: | ---: |
| frames `f1` → `f2` → plain `div` → `f3` → `f4`, radius 24, padding 8/6/4 | 24, 11, 4, 0 px | 24, 11, 4, 0 px |
| frame + surface `c0` → `c1` → wrapper → `c2` (radius 24, padding 8/4/2, margin 3 on `c2`) | 24, 14, 7 px | 24, 14, 7 px |
| surface `s0` … `s4` (base, +0.06, +0.06, −0.10, contrast) oklch lightness | .359249, .419249, .479249, .379249, .529249 | identical strings |
| surface `t0` → `t1` → `t2` (light base, contrast twice) | same | same |

| Step | Chrome 154 | Firefox 155 | WebKit 26.6 |
| --- | :-: | :-: | :-: |
| initial, 3+ depths | ✓ | ✓ | ✓ |
| class toggle (`p8`→`p12`, base colour) | ✓ | ✓ | ✓ |
| insert a wrapper and new nested frame/surface | ✓ | ✓ | ✓ |
| wrap an existing subtree in a new frame | ✓ | ✓ | ✓ |
| inline style `--_p` on a middle frame | ✓ | ✓ | ✓ |
| `:hover` changing padding and surface step (element has `_w`) | ✓ | ✓ | ✓ |
| viewport below 500 px (media query) | ✓ | ✓ | ✓ |
| remove a middle frame | ✓ | ✓ | ✓ |
| both kernels + fallback with the script **not** run, and with the probe (no forcing) | equal to reference; attribute stays off | same | same |

Colours are not merely close: the serialised strings are identical, because `--_sc` is a registered `<color>` and `getPropertyValue` returns the same computed colour that a style query would inherit.

### 3.3 Cost (verified, one machine, indicative)

Trees where every element is frame + surface. Median of 9 (5 for the first pass). Style query = the kernels as they are; runtime = fallback + script; `+ w` = a transition sentinel on every element (the worst case).

| 5 461 nested (fan-out 4, depth 6) | Style query | Runtime | Runtime + w |
| --- | ---: | ---: | ---: |
| first pass, parse + style + layout (Chrome) | 12 ms | 117 ms | 375 ms |
| … Firefox / WebKit | 11 / 21 ms | 90 / 283 ms | 240 / 564 ms |
| class toggle on the root (whole tree changes) (Chrome) | 14 ms | 220 ms | 475 ms |
| class toggle on a depth-3 node (Chrome / Firefox / WebKit) | 0.4 / 1 / 1 ms | 2 / 1 / 7 ms | 2 / 1 / 3 ms |
| insert 1 000 elements (Chrome / Firefox / WebKit) | 1.5 / 2 / 1 ms | 9 / 12 / 22 ms | 15 / 15 / 20 ms |

| 19 531 nested (fan-out 5, depth 6), Chrome | Style query | Runtime |
| --- | ---: | ---: |
| first pass | 40 ms | 438 ms (WebKit 1 081) |
| class toggle on the root | 38 ms | 736 ms |
| class toggle on a depth-3 node | 0.4 ms | 6 ms |

| chain, depth 300 | Style query | Runtime |
| --- | ---: | ---: |
| first pass (Chrome / Firefox / WebKit) | 146 / 55 / 199 ms | 14 / 24 / 31 ms |

Reading: about 10 µs per element per feature in Chrome on first pass, about 40 µs when the whole tree changes. A local change costs what the changed subtree costs, not the page. Where the fallback is slow, the build can help: fewer `_w` markers, and frames only (surface + frame doubles the work). What would cut it further and was not tried: skipping descendants whose parent value is unchanged (an early cut), and reading with `computedStyleMap()`.

### 3.4 Size (min + gzip + brotli, rolldown minify and LightningCSS minify)

| Piece | min B | gzip | brotli |
| --- | ---: | ---: | ---: |
| engine + probe + sentinel, frame + surface config | 1 361 | **730** | 634 |
| … frame config only | 1 322 | 717 | 624 |
| … without the probe (always on) | 1 067 | 613 | 535 |
| … without the sentinel listener | 1 275 | 684 | 600 |
| frame kernel (style queries) | 671 | 239 | 193 |
| frame fallback CSS | 394 | 189 | 168 |
| surface kernel / fallback CSS | 440 / 343 | 215 / 179 | 177 / 158 |
| `_w` transition rule | 59 | 75 | 59 |

So the polyfill costs about 0.7 kB of JS gzip plus about 0.4 kB of CSS per feature, once, and only for targets that need it.

### 3.5 Limits to document

- Shadow DOM: `querySelectorAll` and `closest` do not cross shadow roots; components inside shadow trees are not polyfilled (same limit as css-anchor-positioning).
- A user `transition` on a `_w` element overrides the sentinel (declared later, same specificity); the plugin's CSS can use a higher-specificity rule.
- First paint happens before the script runs unless it is loaded in the head, so old browsers may show declared radii and unadjusted colours for a frame. The observer handles later insertions (also streaming).
- The runtime keeps the cascade in the browser (it reads computed values), so `@layer`, media and tokens behave; it does not update on changes it cannot observe: only `_w` elements watch CSS-driven changes.
- Not verified: Firefox < 151, Safari < 18 (none installed); hydration with React; `display: contents` and `<html>` as a frame (BCD notes Safari cannot make the document element a container).

## 4. The plugin contract

### 4.1 Shape

A plugin is a package with a build-time entry (imported with `with { type: "cssints" }`) and, if it has one, a runtime entry that never imports build code. `definePlugin` returns the members that appear as `css.<name>` and as named imports (the engine already derives `css.*` from a table).

```ts
// @cssints/plugin (types and identity helpers; build time only)
export type Decl = readonly [prop: string, value: string];
export type BcdKey = `css.${string}`; // "css.at-rules.container.style_queries_for_custom_properties"

/** What every plugin member returns. Merged by cn(). The css.* node today is `{ __cssints: Decl[] }`. */
export interface Style {
	decls: Decl[]; // one atomic class each, layer by condition count, as today
	markers?: string[]; // fixed classes added once ("_f")
	kernels?: string[]; // keys registered with the sheet builder
}

/** Global rules, emitted once, by key. */
export interface Kernel {
	css: string; // goes to layer _.k, below _.a, so site classes always win
	atProperty?: string; // @property blocks: top of the sheet, outside the layers, next to token @property
	requires?: BcdKey[]; // a target lacking one gets a support warning naming plugin and feature (never an error)
	supports?: string; // optional @supports condition, e.g. "(left: inherit(--x))" for a later inherit() variant
}

/** Declarative runtime half. Included only when some browserslist target lacks a feature in `polyfills`. */
export interface Runtime {
	polyfills: BcdKey[];
	parentVars?: { marker: string; read: `--${string}`; write: `--${string}`; watch?: `--${string}` }[]; // core owns the engine
	module?: string; // escape hatch: "pkg/runtime", default export init(config); never imports build code
	config?: unknown; // JSON, serialised next to the call
	css?: string; // fallback rules; emitted (layer _.k) only when the runtime is included
}

export interface MethodDef<G extends string> {
	grammar: G; // mdn value-definition syntax, `as const`
	spacing?: boolean; // a bare number is 0.25rem, as in padding/margin/gap
	emit(value: string): Decl[];
}

type Member = PropertyMember | StyleMember | ContextMember | FnMember;
export declare function property<const N extends string, const G extends string>(name: N, grammar: G, emit?: (v: string) => Decl[]): Member; // grammar-only property: passthrough by default
export declare function style<const G extends string>(grammar: G, build: (value: string) => Style): Member; // a function returning a style (icons)
export declare function context<const M extends Record<string, MethodDef<string>>>(o: { marker: string; kernel: string; methods: M }): Member; // chaining, like flex()/grid()
export declare function fn<const G extends string>(grammar: G, computeTo: (args: string[]) => string | CSSStyleValue): Member; // a value function; build-time only

export interface PluginSpec {
	name: string;
	members: Record<string, Member>;
	kernels?: Record<string, Kernel>; // key is "name@version"
	runtime?: Runtime;
	conflicts?: { marker: string; props: (string | RegExp)[]; message: string }[]; // build error when a style holds both
}
export declare function definePlugin<const P extends PluginSpec>(spec: P): Plugin<P>;
```

`frame()` on it (the kernels are the CSS of surfaces-frames.md §2.1, the fallback is `kernels/frame.fallback.css`; custom properties are prefixed and collisions across kernels are a registration error):

```ts
import { context, definePlugin, method } from "@cssints/plugin";
import { FRAME, FRAME_PROPS, FRAME_FALLBACK } from "./kernel.ts";

const len = "<length [0,∞]>" as const;
export default definePlugin({
	name: "frame",
	kernels: {
		"frame@1": {
			css: FRAME,
			atProperty: FRAME_PROPS,
			requires: ["css.at-rules.property", "css.at-rules.layer", "css.types.max"],
		},
	},
	runtime: {
		polyfills: ["css.at-rules.container.style_queries_for_custom_properties"],
		parentVars: [{ marker: ".f", read: "--_fi", write: "--_fu", watch: "--_ft" }],
		css: FRAME_FALLBACK,
	},
	conflicts: [{ marker: "_f", props: ["padding", "margin", "border-radius", /^border(-|$)/], message: "frame() sets these" }],
	members: {
		frame: context({
			marker: "_f",
			kernel: "frame@1",
			methods: {
				radius: method({ grammar: len, emit: (v) => [["--_r", v]] }),
				padding: method({ grammar: len, spacing: true, emit: (v) => [["--_p", v]] }),
				border: method({ grammar: len, emit: (v) => [["--_b", v]] }),
				margin: method({ grammar: len, spacing: true, emit: (v) => [["--_m", v]] }),
			},
		}),
	},
});
```

`css.frame().radius(t.radius.lg).padding(4)` then becomes `className="_f _x1 _x2"`: the marker plus two atomic custom-property classes (`._x1{--_r:var(--radius-lg)}`), in `_.a`, or `_.b` inside `md(...)`. The kernel `frame@1` is registered with the sheet builder on first use and printed once in `_.k`. Sites that carry a condition or a token input also get `_w`.

### 4.2 How the pieces map onto the engine (behaviour, not files)

| Contract piece | What the engine does | Exists today |
| --- | --- | --- |
| Grammar string `as const` | Types: `Matches<G, Join<parts>>` as `PropertyFn` does. Build: the twin's `matches(G, value)` and `checkRules` | Recogniser and twin are generic in the grammar; the error label needs generalising (`Valid<Label, G, S>`), then `bun run bench` |
| `emit` | Decls become atomic classes exactly like `css.*` decls; `classOf`, layer by condition count, `registry.rules` | yes |
| `markers`, `kernels` on the node | `cn()` merges them; `__site` prints markers into the class string; `registry.kernels` (key → css, atProperty) | new: two fields on the node, one map |
| Kernel by key | `renderSheet`: `@property` blocks, then `@layer _.k, _.a, …;` and `@layer _.k { … }` before the site layers. **Only when a kernel is used**, so sheets without plugins stay byte-identical | seam decided in cssints-1xqr; `LAYERS` gets a `_.k` prefix when needed |
| Same key, different css | build error (duplicate registration); same for two kernels declaring the same custom property | new, a few lines |
| `requires` and `polyfills` | one helper over `support.ts`: `lacking(bcdKey, targets) → Target[]` (the `lacks()` inner function today, with the same rules: no prefix, no flags, `partial` counts) | inner function exists |
| Build-time module | `with { type: "cssints" }`; members are called in the Module Runner | yes, with one change below |
| Definition sites | `const mdi = icons({...})` in a helper module is a call rooted at an attributed import, so it is a site; today `__site` throws when the value is not a style. Allow plugin values (functions, plugin objects) in build-time modules; they are never replaced, because that module is not in the client graph | **engine change** |

Effect scope follows cssints-odi9: the sync builders in user code stay plain; plugin errors are `Data.TaggedError` values carrying plugin name and call site, like `MacroEvalError`.

### 4.3 Other plugin kinds, briefly

| Kind | Contract | Example | 0.2? |
| --- | --- | --- | --- |
| `property(name, grammar)` | typed passthrough | `-webkit-font-smoothing: auto \| none \| antialiased \| subpixel-antialiased` (widely used, absent from mdn-data) | yes |
| `context` | chain + marker + kernel | `frame()`, `surface()` | yes |
| `style` | function of grammar-typed parts returning a style | `icon("home")` | yes |
| `fn` | value function, `computeTo(args) → value` at build time | a Typed OM helper; `light-dark()` cannot be one (see §2) | later (API.md "Functions" is unspecified) |
| `keyword` | (CPE has it) | `random` | no, no use case |
| local syntax names | (CPE `registerSyntax`) | `<position-arg>` | compose strings in TS (`${arg}`); threading a local table through `Consume` costs instantiations, measure before doing it |

## 5. How runtime chunks reach the app

Options considered:

| Option | Works when | Problem |
| --- | --- | --- |
| A. User imports `virtual:cssints.runtime` beside `virtual:cssints.css` | any Vite app | one more line to forget; ships whether or not a plugin is used, unless gated late |
| B. Inject `<script>` through `transformIndexHtml` | apps with an `index.html` | not SSR frameworks; several entries; an inline script is not tree-shaken |
| C. The transform of a client module that uses a plugin **adds `import "virtual:cssints/runtime/<plugin>"`** | any Vite app, dev and build | none found; it is what the engine already does with imports (it removes the attributed ones) |

**Recommend C.** The import exists exactly in the modules that use the plugin, so the runtime tree-shakes by construction: an app that never calls `frame()` has no import. The virtual module's content is decided in `load` from things known at config time, not from what was used: the plugin's `runtime`, the browserslist targets and BCD.

```
load("virtual:cssints/runtime/frame"):
  lacking = polyfills.flatMap(k => lacking(k, targets));   // same rules as the warnings
  if (!lacking.length) return "export {};";                // modules with no side effects vanish from the bundle
  return `import parentVars from "cssints/parent-vars"; import css from "…"; parentVars(${JSON.stringify(parentVars)});`
```

- One engine instance: `parentVars(feats)` appends to a shared module-level list and one `MutationObserver`, so frame and surface together cost one observer (not prototyped; about 60 B).
- The fallback CSS goes into the sheet (layer `_.k`) only when the runtime is included, so an app that does not need it carries neither the CSS nor the JS. A dev server includes it under the same rule; a sheet reload is not needed because the decision does not depend on use.
- SSR: the engine starts with `if (typeof document === "undefined") return`.
- The runtime is never bundled in the `cssints` package itself: `cssints/parent-vars` is a subpath that is only imported through the virtual module. `@cssints/plugin-*` packages export `./runtime` only if they use `module`.
- An `export const runtime = false` style switch (or a plugin option) covers apps that load the polyfill themselves.

## 6. Icons on the contract

`packages/plugin-icon` today: three providers (`iconify` API, `fs`, `inline`), `detectRenderMethod` (mask for one-colour SVGs, background for coloured) via `@iconify/tools`, `getIconCSS` via `@iconify/utils`, a mutable config singleton with log levels, name-transform caches, a `.d.ts` generator, and a hand-prefixed `icon()` returning `webkitMask*` keys. It does not load: three syntax errors (wayfinder, cssints-ny2w) and its README examples are not valid code.

On the contract an icon is a `style` member with a kernel:

```ts
// icons.ts, a build-time helper module in the app
import { icons } from "@cssints/plugin-icon" with { type: "cssints" };
export const mdi = icons({ provider: "iconify-json", collection: "mdi" }); // reads @iconify-json/mdi from node_modules, synchronously
export const brand = icons({ provider: "fs", dir: "./src/icons" });

// a component
import { mdi } from "./icons" with { type: "cssints" };
<span className={css.cn(mdi("home"), css.color(t.color.fg), css.width("1.5em"))} />;
// -> class="_i _x1 _x2 _x3"
```

```css
/* kernel icon-mask@1, layer _.k; LightningCSS adds -webkit-mask from the targets */
._i { display: inline-block; width: 1em; height: 1em; background-color: currentColor; mask: var(--_svg) no-repeat center / 100% 100%; }
/* kernel icon-image@1 for coloured icons: background: var(--_svg) no-repeat center / 100% 100% */
._x1 { --_svg: url("data:image/svg+xml,…"); }   /* the only per-icon declaration */
```

| Old | New |
| --- | --- |
| `createIconCollection({ provider, … })` returning an Effect | `icons({ provider, … })` returning a `style` member; sync, so it runs at site evaluation |
| Per icon a full `getIconCSS` rule | one shared kernel, one `--_svg` class per icon; identical icons dedupe by class hash |
| `detectRenderMethod` (mask vs background) | kept: picks `_i` or `_ic` and its kernel |
| iconify **API** at build time | `@iconify-json/*` packages (offline, reproducible); the API later with a lockfile (`.cssints/icons.lock.json`) |
| `.d.ts` generator, `.cssints/generated` | for `iconify-json`: names typed as `keyof (typeof import("@iconify-json/mdi/icons.json"))["icons"]`; for `fs`: unchecked `string` and a build error with a suggestion ("did you mean home?"), generated types later |
| Config singleton, log levels, name-transform caches | dropped (Effect logging in the engine); a `name` transform stays as an option |
| Hand-written `webkitMask*` | dropped: LightningCSS prefixes `mask` for the targets |
| Runtime | none. `requires: ["css.properties.mask-image"]` for the warning |

Survives: the three loaders (about 300 lines of 700), `detectRenderMethod`, the iconify JSON handling. Needs from the engine: the definition-site change (§4.2). Not needed: any runtime chunk.

## 7. The five WebKit-only properties

| Property | mdn-data grammar | BCD (Chrome / Chrome Android / Firefox / Safari / iOS Safari) | mdn page |
| --- | --- | --- | --- |
| `-webkit-tap-highlight-color` | `<color>` | 16 / 18 / no / no / 4 | yes |
| `-webkit-touch-callout` | `default \| none` | no / no / no / no / 2 | yes |
| `-webkit-box-reflect` | `[ above \| below \| right \| left ]? <length>? <image>?` | 4 / 18 / no / 4 / 3.2 | yes |
| `-webkit-user-modify` | `read-only \| read-write \| read-write-plaintext-only` | no entry | no |
| `-webkit-overflow-scrolling` | `auto \| touch` | no entry | no |

**LightningCSS passes all five through untouched (verified, 1.33.0):** `.a{-webkit-tap-highlight-color:transparent;…}` comes out unchanged with no targets and with `safari: 14`, while `user-select` and `mask-image` in the same rule gain `-webkit-user-select` and `-webkit-mask-image`. So the prefixed variants of standard properties (`-webkit-appearance`, `-webkit-user-select`, the `-webkit-mask-*` family) need nothing: the standard property is typed and LightningCSS prefixes it. These five have no standard form to prefix from.

Decision: **a built-in list.**

| | Built-in list | Plugin |
| --- | --- | --- |
| Behaviour to add | none: grammar + passthrough | none |
| Cost | five names in `extract.mjs` next to the mdn-data extraction (a `LIVE_NONSTANDARD` list, same generated table, JSDoc marks them nonstandard) | a package, an import line, and a plugin registered before the property exists in the types |
| Types | in the same table as everything else, one `PropertyFn` each | grammar strings `as const` merged per plugin (§4) |
| Warnings | the BCD lookup already covers three (they will warn on Firefox and desktop Safari targets, which is noise for mobile-only properties: allow-list entries could carry `quiet: true`; decide in the implementation ticket); two have no entry and stay silent | same |
| Users who need others (`-webkit-font-smoothing`, `-moz-osx-font-smoothing`, which mdn-data does not have) | `property(name, grammar)` from the plugin API, later | the same |

A plugin is the right tool when a member has a kernel, an emit or a runtime. These five have none, so they are data. `property()` remains the way to add more.

Keep-or-drop for `-webkit-overflow-scrolling` (no BCD, no mdn page) is a data call for the implementation ticket; nothing here depends on it.

## 8. Recommendation and scope

**Contract:** as in §4: `definePlugin({ name, members, kernels, runtime, conflicts })`, members `property | style | context | fn`, kernels by key into `_.k`, a declarative `runtime` (`polyfills` as BCD keys, `parentVars` for the shared engine, `module` as an escape hatch), delivered by an import that the client transform adds (§5).

| | 0.1 | 0.2 | later |
| --- | --- | --- | --- |
| Sheet builder seam | **yes**: kernel by key, `_.k` only when used, `@property` at the top (one test kernel proves it) | | |
| Style node | **yes**: `markers` and `kernels` next to `decls`; `cn()` merges them | | |
| `lacking(bcdKey, targets)` next to `support()` | **yes** (used by warnings first) | | |
| Five WebKit-only properties | **yes**, built-in list | | |
| Public `definePlugin`, `property()`, `context()`, `style()` | no | **yes**, with the generalised `Valid<Label, G, S>` and a `bench` budget | `fn()` after API.md "Functions" |
| `frame()` | no (decided in cssints-1xqr) | **yes**, first consumer; runtime included when a target lacks style queries | `surface()` after the `<color>` grammar takes relative colour |
| Runtime engine, `virtual:cssints/runtime/<plugin>` | no | **yes**, together with `frame()` | early cut, `computedStyleMap` |
| Icons | no; fix or drop `plugin-icon` for `vp check` (cssints-djzw) | **yes**, on `style` + kernel, after the definition-site change | iconify API with lockfile, generated `fs` types |
| `inherit()` variant | | | a plugin update behind `@supports (left: inherit(--x))` when two engines ship it |

Why not a public API in 0.1: `docs/wayfinder.md` lists "polyfill plugin system" under what we do not build until a user asks, 0.1 has no consumer, and a contract frozen before two consumers (`frame()` and icons) use it is a guess. The internal seams cost tens of lines and keep 0.2 from touching the sheet builder or the node shape.

Risks to keep in view: the runtime is 10 times the style-query cost, so its default must stay off unless a target needs it; a Firefox < 151 / Safari < 18 build of this prototype was not available, so the first task of the `frame()` ticket is to run `test.mjs` on real old browsers; the definition-site change touches the instrument/`__site` path that the `port` branch is rewriting.

## Reproduce

```sh
cd docs/research/plugins-proto
node test.mjs; BROWSER=firefox node test.mjs; BROWSER=webkit node test.mjs   # equivalence, exits 1 on a mismatch
node controls.mjs                                                          # negative controls
node bench.mjs                                                             # cost; BROWSER as above
node size.mjs                                                              # min + gzip + brotli
node probe.mjs                                                             # probe on/off shapes
tsgo -p types/tsconfig.json --extendedDiagnostics; tsc -p types/tsconfig.json   # plugin types; both must print nothing but stats
```

The scripts import playwright-core, rolldown and lightningcss from the main checkout's `node_modules/.bun/node_modules` by absolute path (worktrees have no `node_modules`). Firefox and WebKit come from `node cli.js install firefox webkit` in playwright-core (about 160 MB in `~/Library/Caches/ms-playwright`).

## Sources

- CSS Parser Extensions: [explainer](https://github.com/bramus/css-parser-extensions), [pitch, 2025-05-04](https://www.bram.us/2025/05/04/css-parser-extensions-pitch/), [csswg-drafts #13186](https://github.com/w3c/csswg-drafts/issues/13186), [WICG CSS-Parser-API](https://github.com/WICG/CSS-Parser-API), [Houdini talk, Tab Atkins 2019](https://www.xanthir.com/talks/2019-05-15/).
- Platform: [CSS Properties and Values API Level 1](https://www.w3.org/TR/css-properties-values-api/), [css-values-5 `inherit()`](https://drafts.csswg.org/css-values-5/#inherit-notation) (see surfaces-frames.md §4), [BCD](https://github.com/mdn/browser-compat-data) 8.1.3 (`css.at-rules.container.style_queries_for_custom_properties`: Chrome 111, Firefox 151, Safari 18).
- Polyfills and tooling: [postcss-preset-env](https://github.com/csstools/postcss-plugins/tree/main/plugin-packs/postcss-preset-env), [css-anchor-positioning](https://github.com/oddbird/css-anchor-positioning), [container-query-polyfill](https://github.com/GoogleChromeLabs/container-query-polyfill), [The dark side of polyfilling CSS](https://philipwalton.com/articles/the-dark-side-of-polyfilling-css/), [css-typed-om polyfill](wayfinder.md) (reference section).
- In the repo: [API.md](../API.md), [surfaces-frames.md](surfaces-frames.md), [design-tokens.md](design-tokens.md), `../macros/docs/2026-04-27-oxc-macro-css-in-ts-design.md` §6, `packages/cssints/src/{plugin,macro,lib}.mjs`, `packages/css-grammar/src/{css,support,mdn}.ts`, `packages/plugin-icon`.
