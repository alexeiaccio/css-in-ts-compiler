# Surfaces and frames: parent-relative colour and concentric geometry

Ticket cssints-1xqr, researched 2026-09-29. Builds on [design-tokens.md](design-tokens.md), which already covered Ariakit's colour and contrast side; this file does not repeat it. Facts come from primary sources: Ariakit `e6a3d4a` (`packages/ariakit-tailwind`: `readme.md`, `src/input.ts`, `src/lib.ts`, `src/output.css`), CSS Values 5 on drafts.csswg.org, `@mdn/browser-compat-data` 8.1.3 (BCD), blink-dev, WebKit and Mozilla trackers. Things I ran myself are marked **(verified)**: Chrome 154.0.8037.57 (the installed stable channel) through playwright-core, Tailwind 4.3.3 for the Ariakit output. I have no Firefox or Safari here, so their numbers come from BCD only. Scratch files (kernels, test pages) live in the opencode temp dir `surfaces-exp/` and are not committed; every kernel is inline below.

## Key findings

1. **Both Ariakit features reduce to two small ideas.** A frame passes one number down the tree: `inner = max(radius − padding − border, 0)`, and the child's radius is the parent's `inner` minus its own margin. A surface passes one colour down: `child = oklch(from parent (l + step) c h)`. Most of the rest of Ariakit (`input.ts` is 2 753 lines) is policy: clamps, chroma and hue control, text and edge colours, rings, join and cover.
2. **The nesting trick is the only part a compiler cannot do.** A property cannot reference itself, so Ariakit alternates two names (`-odd`, `-even`) and picks one with `@container style(--ctx: odd)`. `lib.ts` says so in its own comment: "Emulates an `inherit()` function". The compiler can emit the kernel once, and per-site classes only set custom properties.
3. **Minimal kernels are small (verified).** Frame: 24 lines / 547 B (447 B minified) with px/rem lengths, 40 lines / 823 B (667 B min) with correct `em` handling. Surface: 19 lines / 396 B (314 B min). Ariakit emits 42 lines / 2 796 B for `.ak-frame` alone, and 52 lines / 5 124 B for `.ak-layer`, plus 18 and 76 `@property` blocks. The frame kernel gives the same radii as Ariakit on the same tree (24, 11, 4, 0, and 24, 16, 10).
4. **`inherit()` removes the trick, but no browser ships it.** With `inherit()` the frame kernel is 12 lines / 284 B and the surface kernel 6 lines / 144 B, both measured correct. Chrome 154 does not support it by default (`CSS.supports("left", "inherit(--x)")` is `false`, both kernels fail: radii 0px, backgrounds transparent). It works with `--enable-blink-features=CSSInheritFunction`. chromestatus says "Proposed", Firefox "No signal", WebKit has an open PR behind a runtime setting. BCD has no entry. The spec is still moving (csswg-drafts #13426 asks to rename it). It cannot be the emitted form for years, but the API can be written so that it becomes one.
5. **Browser floor of the shipped kernels.** Frame (odd/even): Chrome 111, Firefox 151, Safari 18. Surface (odd/even): Chrome 122, Firefox 151, Safari 18. Firefox is the binding one, through style queries on custom properties. Tokens alone (`@property`) need only Chrome 85, Firefox 128, Safari 16.4.
6. **Contrast is not guaranteed by the kernel (verified).** An OKLCH lightness threshold at 0.5636 (the WCAG crossover for greys) gave a worst case of 4.61:1 for 3 000 random greys, but 3.71:1 for 3 000 random chromatic colours (chroma up to 0.25; out-of-gamut colours are clipped to sRGB by the canvas read-back). The kernel does tonal steps, not accessibility. Only a build-time check can claim a ratio (design-tokens.md, `css.check.contrast`).
7. **Cost at runtime (verified, one machine, indicative).** Re-styling 19 530 nested elements after a class toggle: plain static CSS 19 ms, frame odd/even 29 ms, surface odd/even 28 ms, `inherit()` versions 20–21 ms. Odd/even costs about +50% of style recalc for the affected elements; `inherit()` is almost free.
8. **Recommendation: later, not 0.1.** Ship frames first, then surfaces, as an opt-in module with odd/even emission; switch emission to `inherit()` when Chrome, Firefox and Safari all ship it. For 0.1 the explicit token ladder (`surface-0 … surface-3`) already covers surfaces and is checkable. Details in the last section.

## 1. What Ariakit does

Source: [`readme.md`](https://github.com/ariakit/ariakit/blob/main/packages/ariakit-tailwind/readme.md), `src/input.ts` (`frameContext`, `utility("frame", …)`, lines 2208–2530), `src/lib.ts` (`createContext`, line 268), `src/output.css` (`@utility ak-frame` line 1055, `ak-layer` line 118).

**Frame.** `ak-frame` sets `padding`, `margin`, `border-radius`, `scroll-padding` from four inputs (`--_ak-frame-radius|padding|margin|border`). A nested frame computes `radius = max(min(0.125rem, own), parentRadius − (parentPadding + parentBorder + ownMargin), 0)`. Two clamps: a floor of 0.125rem, and if the parent's padding plus margin is at least 1rem (`FRAME_PADDING_CAP`) the declared radius wins instead (an "inflated excess" of 1e9 × the excess turns `max`/`min` into a switch). `ak-frame-force` skips the whole thing. Names pair radius and padding by token: `ak-frame-card/card` reads `--radius-card` and `--spacing-card` (readme line 94, 378).

**Surface.** `ak-layer` sets `--ak-layer` (background), `--ak-text`, `--ak-edge`, each a chain of relative colours; the parent is read through `--ak-layer-parent`. `lighten-N` and `darken-N` set `--_ak-layer-idle-relative-lightness = ±N/100`; a numeric `ak-layer-N` picks the direction by theme; `ak-layer-contrast` looks up the parent's rounded lightness in a 9-row style-query table.

**The trick.** Each feature owns a context name (`--_context-0` for layer, `-2` for frame). One element matches exactly one of two container rules, flips the context, writes `-odd` or `-even`, and reads the other:

```css
@container (style(--_context-2: even)) or (not style(--_context-2)) { --_context-2: odd;  --_ak-fprc-odd:  var(--ak-frame-radius); … reads --_ak-fprc-even }
@container style(--_context-2: odd)                                 { --_context-2: even; --_ak-fprc-even: var(--ak-frame-radius); … reads --_ak-fprc-odd  }
```

## 2. Minimal kernels

Design rules, all verified below: per-site classes only set custom properties (`--_r`, `--_p`, …); the kernel is one marker class plus two container rules; each feature has its own context name (`--_cf`, `--_cs`), because a shared name breaks parity when a frame-only element sits between surfaces; the kernel goes in a cascade layer *below* the site classes, so its defaults lose.

### 2.1 Frame: radius, padding, border, margin (odd/even)

```css
@property --_r { syntax: "<length>"; inherits: false; initial-value: 0px; } /* radius; same for --_p padding, --_b border, --_m margin */
.f {
  padding: var(--_p);
  margin: var(--_m);
  border: var(--_b) solid;
  border-radius: var(--_R);
}
@container (style(--_cf: e)) or (not style(--_cf)) {
  .f {
    --_cf: o;
    --_R: max(var(--_e, calc(var(--_r) + var(--_m))) - var(--_m), 0px);
    --_o: max(var(--_R) - var(--_p) - var(--_b), 0px);
  }
}
@container style(--_cf: o) {
  .f {
    --_cf: e;
    --_R: max(var(--_o, calc(var(--_r) + var(--_m))) - var(--_m), 0px);
    --_e: max(var(--_R) - var(--_p) - var(--_b), 0px);
  }
}
```

(The four `@property` blocks are written out in the measured file; the shown one stands for all.) The fallback `var(--_r) + var(--_m)` makes a root frame (no `--_e`) use its declared radius after the margin is taken off again. Padding, border and margin are fully concentric; the declared radius of a nested frame is ignored on purpose (Ariakit ignores it too, except with `force` or when the parent's padding plus margin is at least 1rem).

**Why `@property` matters (verified).** Without registration the inherited `--_e` is a token stream, so an `em` padding is re-evaluated in the child's font size. Test: parent `font-size: 20px; --_p: 1em`, child `font-size: 10px`. Unregistered radius is 14px (wrong), registered is 4px (right). The registered variant also gives the defaults for free, so it needs no layer. Without registration, the build must reject relative units.

### 2.2 Surface: lighten, darken, contrast (odd/even)

```css
@property --_e { syntax: "<color>"; inherits: true; initial-value: canvas; }  /* and --_o */
.s {
  --_k: initial;                       /* base colour; "initial" = guaranteed-invalid, so var(--_k, …) falls through */
  --_d: 0;                             /* signed lightness step; unregistered on purpose, it may contain `l` */
  background-color: var(--_S);
}
@container (style(--_cs: e)) or (not style(--_cs)) {
  .s { --_cs: o; --_S: oklch(from var(--_k, var(--_e)) calc(l + var(--_d)) c h); --_o: var(--_S); }
}
@container style(--_cs: o) {
  .s { --_cs: e; --_S: oklch(from var(--_k, var(--_o)) calc(l + var(--_d)) c h); --_e: var(--_S); }
}
```

The three operations are site classes, not kernel code, because custom properties are substituted as tokens and `l` resolves inside `oklch(from …)`:

```css
._lighten { --_d: 0.06 }
._darken  { --_d: -0.06 }
._contrast { --_d: calc(0.15 * clamp(-1, (0.5636 - l) * 1e6, 1)) }   /* push away from the parent: light parent darkens, dark lightens */
```

`clamp(-1, x * 1e6, 1)` is `sign()` without Chrome 138. Optional text colour, one line in the kernel: `color: oklch(from var(--_S) clamp(0, (0.5636 - l) * 1e6, 1) 0 0)` (black or white; see finding 6 for its limits). The registration is optional: without it the nested `--_S` text grows about 30 characters per level (35 → 365 chars at depth 12, verified) and is re-parsed at every level; with it the size is flat.

### 2.3 With `inherit()` (Chrome flag only)

```css
.f {   /* 4 × @property as above, then: */
  padding: var(--_p); margin: var(--_m); border: var(--_b) solid; border-radius: var(--_R);
  --_R: max(inherit(--_i, calc(var(--_r) + var(--_m))) - var(--_m), 0px);
  --_i: max(var(--_R) - var(--_p) - var(--_b), 0px);
}
@property --_S { syntax: "<color>"; inherits: true; initial-value: canvas; }
.s {
  --_k: initial; --_d: 0;
  --_S: oklch(from var(--_k, inherit(--_S)) calc(l + var(--_d)) c h);
  background-color: var(--_S);
}
```

`inherit(--x, fallback)` substitutes the parent's computed value of `--x` (CSS Values 5 §8.6), so a property can be defined from its own value one level up. No context name, no parity, no `@container`.

### 2.4 Sizes (verified; "min" = LightningCSS minify)

Ariakit numbers are real Tailwind 4.3.3 output for a page with `ak-frame ak-frame-rounded-[24px] ak-frame-p-[8px] ak-frame-border-2 ak-frame-m-[3px]`, and `ak-layer` with `lighten-6`, `darken-6`, `contrast`. Tailwind always emits all 139 `@property` blocks (10.7 KB min); the rows count only the blocks the used rules reference.

| Kernel | Lines | Bytes | Min |
| --- | ---: | ---: | ---: |
| Ariakit `.ak-frame` rule | 42 | 2 796 | ~2 578 |
| + 18 referenced `@property` (90 lines) | 132 | | ~4 004 |
| **Ours: frame, odd/even, registered** | **40** | **823** | **667** |
| Ours: frame, odd/even, px/rem only | 24 | 547 | 447 |
| Ours: frame, `inherit()`, registered | 28 | 560 | 460 |
| Ours: frame, `inherit()`, px/rem only | 12 | 284 | 240 |
| Ariakit `.ak-layer` + `-contrast` + lighten + darken | 100 | 6 221 | ~5 779 |
| + 76 referenced `@property` | | | ~11 980 |
| **Ours: surface, odd/even, registered** | **29** | **546** | **434** |
| Ours: surface, odd/even, unregistered | 19 | 396 | 314 |
| Ours: surface, `inherit()`, registered | 11 | 219 | 182 |
| Ours: surface, `inherit()`, unregistered | 6 | 144 | 123 |

A site class is about 30 bytes (`._x{--_r:var(--radius-lg)}`).

### 2.5 What can be dropped

| Ariakit feature | In the kernel? | Why |
| --- | --- | --- |
| `frame-force` | no | a site class can set `--_r` without the kernel by not using `frame()` |
| 1rem cap (declared radius wins when padding is large) | no | one `max/min` pair and an inflated constant; users who want it call `borderRadius` |
| 0.125rem floor | no | `max(…, 0px)` is enough; add `--_min` if design wants it |
| ring, `bordering`, join, cover, start/end/row/col | no | corner flags and border/ring accumulation are Ariakit's answer to segmented controls and toolbars |
| Lightness clamps around the forbidden mid-range, chroma and hue steps, `mix` | no | policy; each is a site class if wanted |
| Text and edge colours, state (`hover`), `--contrast` knob | no | separate features; `ink` is one optional line |
| Appearance-aware numeric `ak-layer-N` | no | needs theme direction (`ak-light`/`ak-dark`); a theme can set `--_d` signs itself |
| **Margin** | **yes** | one `var(--_m)` term |

## 3. Verification (Chrome 154.0.8037.57, nested elements at three or more depths)

Frames, computed `border-top-left-radius`. Tree: `f1` (radius 24, padding 8, border 2) → `f2` (padding 6, border 1, margin 3) → plain `div` → `f3` (padding 4, declared radius 40) → `f4`.

| Element | Expected | Ours odd/even | Ours `inherit()` (flag) | Ariakit (Tailwind output) |
| --- | ---: | ---: | ---: | ---: |
| `f1` | 24 | 24px | 24px | 24px |
| `f2` = 24 − (8+2) − 3 | 11 | 11px | 11px | 11px |
| `f3` = 11 − (6+1) | 4 | 4px | 4px | 4px |
| `f4` = 4 − 4 | 0 | 0px | 0px | 0px |
| Isolated frame, radius 24 | 24 | 24px | 24px | 24px |
| Chain radius 24 / padding 8 → 6 → none | 24, 16, 10 | 24, 16, 10 | 24, 16, 10 | 24, 16, 10 |
| Container (`container-type: inline-size`) between frames | 14, 8 | 14, 8 | 14, 8 | not tested |

A nested frame that sets no padding has `padding: 0` (no leak). Default Chrome 154 without the flag: the `inherit()` kernel gives 0px everywhere.

Surfaces, computed `background-color` (`oklch`), base `#2b3a67`. Same values in all four variants (odd/even and `inherit()`, registered or not):

| Element | Site | Computed lightness | Check |
| --- | --- | ---: | --- |
| `s0` | base | 0.3592 | |
| `s1` | lighten 0.06 | 0.4192 | +0.06 |
| `s2` (a plain `div` between) | lighten 0.06 | 0.4792 | +0.06 |
| `s3` | darken 0.10 | 0.3792 | −0.10 |
| `s4` | contrast 0.15, dark parent | 0.5292 | +0.15 |
| `t0` → `t1` → `t2` | base `#dde6f5`, contrast twice | 0.9226 → 0.7726 → 0.6226 | light parent darkens, still light so darkens again |

Default Chrome 154 without the flag: the `inherit()` surface kernel gives transparent (unregistered) or the initial `canvas` (registered). Hue and chroma stay put; at depth 12 lightness clamps at 1 as expected.

## 4. `inherit()`: status and browser floor

| | State | Source |
| --- | --- | --- |
| Spec | CSS Values 5 §8.6, `<inherit()> = inherit( <custom-property-name>, <declaration-value>? )`, custom properties only; "Future levels may allow standard properties" | [css-values-5](https://drafts.csswg.org/css-values-5/#inherit-notation), issue [#2864](https://github.com/w3c/csswg-drafts/issues/2864) (adopted 2021, defined 2024-10) |
| Chrome | Intent to Prototype 2025-10 (Anders Hartvoll Ruud); chromestatus "Proposed", no milestone; **off in 154.0.8037.57 (verified)**, on with `--enable-blink-features=CSSInheritFunction` or experimental features (verified: `--depth`-style counters, fallbacks and `calc(inherit(--x) * 2)` all work) | [blink-dev](https://www.mail-archive.com/blink-dev@chromium.org/msg14805.html), [chromestatus 5996914579472384](https://chromestatus.com/feature/5996914579472384) |
| Firefox | only the WPT sync landed in 146 (the tests are there and fail in Firefox); chromestatus "No signal" | [Bug 1994658](https://bugzilla.mozilla.org/show_bug.cgi?id=1994658) |
| Safari | open PR "Implement inherit() substitution function", 2026-08, behind `CSSInheritFunctionEnabled`, off by default | [WebKit#70959](https://github.com/WebKit/WebKit/pull/70959) |
| BCD 8.1.3 | no entry (`css.types.inherit` does not exist) | checked |
| Open issues | rename to `parental()` (#13426); behaviour inside `@function` (#12987, resolved: passes through) | csswg-drafts |

**Floor: none.** No stable browser has it, so the emitted form cannot use it. `@supports (left: inherit(--x))` would work as a feature test (false in Chrome 154 default, true with the flag), so a later build could emit the 12-line kernel under `@supports` and keep odd/even as fallback.

**Other shipped mechanisms that could replace the trick** (none does):

- *Plain `var()` with the same name:* a cycle, invalid at computed-value time. Registered or not.
- *CSS-wide `inherit` keyword:* copies a property under the same name only, so the child cannot read the parent's `--_S` while defining its own.
- *`if(style(--x: …))` (Chrome 137):* queries the element's own values, not the parent's (per spec; not tested).
- *`@function` (Chrome 139):* runs against the calling element; it cannot see the parent (`inherit()` inside a function refers to the call site too, per #12987).
- *Semi-transparent overlays* for lighten/darken (`background: oklch(1 0 0 / .06)`): no kernel at all and works in every browser, because the parent shows through. Not measured. It is not a colour token (no contrast maths, translucent over images), and it cannot flip direction (contrast).
- *A static ladder* (`surface-0 … surface-3` tokens, selectors like `.s .s`): zero runtime cost, checkable at build time, but depth is chosen by the author. This is the recommendation of design-tokens.md §6 and stays the 0.1 answer.

## 5. Browser floor from BCD (8.1.3)

First stable version (— = not supported). "Kernel" columns show which variant needs what.

| Feature | BCD path | Chrome | Firefox | Safari | Frame | Surface |
| --- | --- | ---: | ---: | ---: | :-: | :-: |
| `@container style(--x: v)` (with `not`, `or`) | `css.at-rules.container.style_queries_for_custom_properties` | 111 | **151** | 18 | ✓ | ✓ |
| `@property` | `css.at-rules.property` | 85 | 128 | 16.4 | ✓ (registered) | ✓ (registered) |
| Relative colour `oklch(from …)` | `css.types.color.oklch.relative_syntax` | 122 | 128 | 18 | | ✓ |
| `max()`, `min()`, `clamp()` | `css.types.max`, `clamp` | 79 | 75 | 13.1 | ✓ | ✓ (`clamp`) |
| `@layer` | `css.at-rules.layer` | 99 | 97 | 15.4 | ✓ | ✓ |
| `sign()`, `abs()` | `css.types.sign` | 138 | 118 | 15.4 | | only if used instead of `clamp` |
| `round()`, `mod()` | `css.types.round` | 125 | 118 | 15.4 | | Ariakit's `ak-layer-contrast` needs it |
| `if()` | `css.types.if` | 137 | — | — | | Ariakit optimisation only |
| Style query range syntax | `….range_syntax` | 142 | 151 | — | | Ariakit does not use it |
| CSS nesting | `css.selectors.nesting` | 120 | 117 | 17.2 | | LightningCSS flattens it; not needed |
| `inherit()` | no BCD entry | flag | — | flag | | |

**Floors.** Frame, odd/even: Chrome 111, Firefox 151, Safari 18. Surface, odd/even: Chrome 122, Firefox 151, Safari 18 (Chrome 138 if `sign()` replaces the `clamp` trick). Either with `inherit()`: not available; when shipped, the surface floor is the larger of that and the relative-colour floor (122 / 128 / 18). Ariakit's own `.ak-frame` + `.ak-layer` output uses `round()`, so Chrome 125, Firefox 151, Safari 18; its full package reaches Chrome 138 through `ak-text` (design-tokens.md §4.4).

## 6. Mapping onto cssints

`frame()` and `surface()` are chaining contexts like `flex()` (docs/API.md "Authoring surface"): they return a css value and chain only their own properties.

```ts
import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({ /* … see "Themes" */ });

const card = css.cn(
	css.surface().color(t.color.canvas).lighten(0.06),      // --_k, --_d
	css.frame().radius(t.radius.lg).padding(t.space.md).border(t.space.hair),
);
const field = css.cn(css.surface().darken(0.03), css.frame().radius(t.radius.md).padding(2).border("1px"));
const cta = css.cn(css.surface().color(t.color.accent).contrast(0.15).ink());

<section className={card}>
	<input className={field} />        {/* radius becomes concentric with card, no wiring */}
</section>;

const md = css.media("(width >= 40rem)");
css.cn(css.frame().padding(2), md(css.frame().padding(6)), css.hover(css.surface().lighten(0.04)));   // conditions just set the custom property
```

```ts
type Len = Token<"length"> | CSSUnitValue | LengthString;          // <length>, no %; grammar-checked
interface FrameChain {                                              // each method emits one site class
	radius(v: Len): Omit<FrameChain, "radius">;                     // --_r
	padding(v: Len | SpacingStep): Omit<FrameChain, "padding">;     // --_p (bare number = 0.25rem, as in API.md)
	border(v: Len): Omit<FrameChain, "border">;                     // --_b
	margin(v: Len | SpacingStep): Omit<FrameChain, "margin">;       // --_m
}
interface SurfaceChain {
	color(v: Token<"color"> | ColorString): Omit<SurfaceChain, "color">;               // --_k, absolute base; default is the parent surface
	lighten(step: Number01): Omit<SurfaceChain, "lighten" | "darken" | "contrast">;    // --_d: +step
	darken(step: Number01): Omit<SurfaceChain, "lighten" | "darken" | "contrast">;     // --_d: -step
	contrast(step: Number01): Omit<SurfaceChain, "lighten" | "darken" | "contrast">;   // --_d: step * away-from-parent
	ink(): Omit<SurfaceChain, "ink">;                                                   // optional text colour, black or white
}
declare function frame(): FrameChain;
declare function surface(): SurfaceChain;
```

- **Emission.** The first `frame()` or `surface()` call registers a kernel by key with the sheet builder, the same seam that de-duplicates `@property` for tokens. The kernel appears once, and only when used. It is not per-site: a site class holds only `--_x: value`. The class string gets a fixed marker class (`_f`, `_s`) plus the site classes.
- **Layers.** Kernel in a layer *before* `_.a`: declare `@layer _.k, _.a, _.b, _.c, _.d, _.e;` and put `.f`/`.s` and the two container rules in `_.k`. It must be below all site classes, otherwise the kernel defaults (`--_d: 0`, `--_k: initial`) beat them; an unlayered kernel would beat every layer. The `@property` blocks go at the top of the sheet, outside layers, next to token `@property`.
- **Conditions work for free.** `md(frame().padding(6))` sets `--_p` in `_.b` inside a media query, and the whole subtree's concentric radii follow. `hover(surface().lighten(.04))` moves every descendant surface.
- **Where the values come from.** Token types feed the chain: `radius/padding/border/margin` accept `token.length` (and spacing numbers for padding/margin), `color` accepts `token.color`, and steps are `<number [0,1]>`. Because tokens are registered `@property`, `var(--space-md)` reaches the kernel as a computed length. A theme that changes `--radius-lg` (e.g. Ariakit's square-shape override) changes every concentric child.
- **Radius and padding pairs.** Ariakit pairs them by token name (`card/card`). With TypeScript values a pair is just a constant (`const cardShape = css.frame().radius(t.radius.lg).padding(t.space.md)`), so no naming convention is needed; a `createTokens` group `{ radius, padding }` can be added later if teams want it.

**What the types and build can check, and what only the browser can.**

| Check | Types | Build | Browser only |
| --- | :-: | :-: | :-: |
| Argument is a length / colour / number in [0,1] (no `%` in a length) | ✓ | ✓ (grammar) | |
| One of `lighten` / `darken` / `contrast`, each option once | ✓ (`Omit` chain) | | |
| `frame()` together with `padding()`, `margin()`, `borderRadius()`, `border*` in one `cn()` call (the kernel would use `--_p` while the real padding differs; Ariakit warns in prose only) | | ✓ error | |
| `surface()` together with `bg()` / `backgroundColor()` in one `cn()` | | ✓ error | |
| Static values: negative radius or padding | | ✓ | |
| Static base colours: contrast of `ink` on a *declared* chain (`css.check.contrast` per theme) | | ✓ (later) | |
| The real nesting, parity, gaps from plain wrappers, `display: contents`, surface clamped at L=1 | | | ✓ |
| Final radius and colour | | | ✓ (Chrome/Firefox/Safari, tests via `getComputedStyle`) |

The compiler never sees the parent, so it can check a chain only if the author declares one. That is why `contrast(step)` is presented as "tonal step away from the parent", never as accessibility.

## 7. Prior art (one line each)

- **Ariakit Tailwind**, [`ak-frame`, `ak-layer`](https://github.com/ariakit/ariakit/tree/main/packages/ariakit-tailwind): the source of both kernels; odd/even context, 139 registered properties, no browser-support statement.
- **CSSWG [#7707](https://github.com/w3c/csswg-drafts/issues/7707)** (css-borders-4, open, updated 2026-04): a native `border-radius` value for perfectly matching nested radii; no spec text yet, so it does not replace the kernel.
- **CSSWG [#2864](https://github.com/w3c/csswg-drafts/issues/2864)** lists "Matching nested radii" and "ancestor background colour" as `inherit()` use cases, which is exactly the two kernels here.
- **SwiftUI `ConcentricRectangle` / `ContainerRelativeShape`** (iOS 26): the platform computes concentric corner radii from the container shape; `concentric(minimum:)` is Ariakit's 0.125rem floor. [docs](https://developer.apple.com/documentation/swiftui/concentricrectangle/init(corners:isuniform:))
- **Radix Colors** ([scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)): parent-relative contrast by a precomputed 12-step ladder, no runtime maths; the static alternative to `surface()`.
- **Kizu, [Play With Inherit Function](https://blog.kizu.dev/play-with-inherit-function/)**: nested-depth colour and radius with `inherit()` in Chrome Canary; same pattern as §2.3.

## 8. Recommendation

**Later (after 0.1), frames first, then surfaces, as an opt-in module; do not block 0.1.**

- *Why not 0.1.* The 0.1 destination is docs/API.md working end to end; derived tokens and colour helpers are already out of scope there (design-tokens.md §5). The floor (Firefox 151, Safari 18, Chrome 111/122) is stricter than tokens (`@property`: 128 / 16.4 / 85). Surfaces also need the `<color>` grammar gap fixed first (relative colour is rejected today, design-tokens.md §4.2), and `contrast()` can be mistaken for an accessibility guarantee (finding 6).
- *Why not never.* Frames are exact geometry, the kernel is 40 lines, it matches Ariakit on the same tree, and conditions and tokens compose with it for free. Surfaces are 29 lines and show the same mechanism. The API (`frame()`, `surface()`) does not depend on how the parent is read, so switching emission to `inherit()` later (12 and 6 lines, about 1.1× the cost of static CSS instead of 1.5×) changes no user code.
- *For 0.1 only.* Keep a seam: the sheet builder must be able to add a global rule by key, once, in a layer below `_.a` (same mechanism as token `@property`); reserve the layer name `_.k`. Users who need surfaces now use an explicit token ladder.
- *Emission rule.* Odd/even, registered inputs, as in §2.1–2.2. Emit `inherit()` under `@supports (left: inherit(--x))` only when at least two engines ship it.
- *Ship with.* Build errors for the conflicts in §6, docs saying "tonal steps, not contrast", and a Chrome/Firefox/Safari `getComputedStyle` test on a three-deep tree (the verification of §3 as a fixture).

## Sources

- Ariakit: [`packages/ariakit-tailwind`](https://github.com/ariakit/ariakit/tree/main/packages/ariakit-tailwind) (`readme.md`, `src/input.ts`, `src/lib.ts`, `src/output.css`), commit `e6a3d4a`.
- CSS: [css-values-5 §8.6 inherit()](https://drafts.csswg.org/css-values-5/#inherit-notation), [csswg #2864](https://github.com/w3c/csswg-drafts/issues/2864), [#7707](https://github.com/w3c/csswg-drafts/issues/7707), [#12987](https://github.com/w3c/csswg-drafts/issues/12987), [#13426](https://lists.w3.org/Archives/Public/public-css-archive/2026Feb/0011.html), [BCD](https://github.com/mdn/browser-compat-data) 8.1.3.
- Implementation status: [blink-dev intent](https://www.mail-archive.com/blink-dev@chromium.org/msg14805.html), [chromestatus](https://chromestatus.com/feature/5996914579472384), [WPT #55474](https://github.com/web-platform-tests/wpt/pull/55474), [Firefox bug 1994658](https://bugzilla.mozilla.org/show_bug.cgi?id=1994658), [WebKit PR 70959](https://github.com/WebKit/WebKit/pull/70959).
- Prior art: [SwiftUI ConcentricRectangle](https://developer.apple.com/documentation/swiftui/concentricrectangle/init(corners:isuniform:)), [Radix Colors](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale), [Kizu](https://blog.kizu.dev/play-with-inherit-function/).
