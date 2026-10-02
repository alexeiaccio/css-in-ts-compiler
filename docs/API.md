# CSS in TS

The 0.1 API. Setup (the Vite plugin, the stylesheet import) is in the [README](../README.md). Decisions and findings are in [wayfinder.md](wayfinder.md).

Every `ts` block here is type-checked against the workspace `cssints` types by `packages/cssints/test/docs.mjs` (`bun run test`). A line that ends in `// error` must fail to type-check. Blocks fenced `ts skip` (output) are not checked. A few blocks show a build-time error that the types cannot see; their comments give the message.

### Authoring surface (decided 2026-09-29, cssints-5dbi)

- **Import.** `with { type: "cssints" }` marks code that runs at build time: cssints itself, plugins such as icons, and your own helper modules. The plugin finds call sites by this attribute. Runtime helpers (`cx`, `_cv`) are imported without it. Using a build-time member without the attribute is a build error.
- **Names.** Every mdn property as camelCase (`paddingLeft`, `alignItems`, `justifyContent`), plus a short set: `p pt pr pb pl`, `m mt mr mb ml`, `bg`. Everything is available both as named exports and through the namespace (`css.p`). There is no `items` or `justify`: they were ambiguous (`align-items` or `align-content`, `justify-content` or `justify-items`).
- **Numbers.** A bare number is a spacing step of 0.25rem in `padding*`, `margin*`, `gap*` and `inset*` (`p(4)` is `1rem`). In any other property it is a CSS `<number>`: `opacity(0.5)`, `zIndex(3)`.
- **Values.** A property takes one or more parts joined by a space. Each part is a string or a Typed OM value: `border("1px solid", accent)`, `padding(CSS.rem(1), CSS.rem(2))`, `padding("1rem 2rem")`. Parts are checked against the mdn grammar in types and again at build time. `CSS.px`, `rem`, `em`, `percent`, `number`, `CSSUnitValue` and `CSSColorValue` come from `cssints`, imported with the attribute.
- **Editor.** A bad part is marked on that part: `padding("2px", "red")` puts the error on `"red"`, with the message of the whole value. While a string is not a value yet, the editor offers the keywords of the property that the word under the cursor begins (`display("fl…")` gives `flex`, `flow`, `flow-root`; `border("1px", "so…")` gives `solid`), and all of them in an empty part (`border("1px", "")`; an empty part is an error). The offer is the keywords of the whole grammar, not only those that fit at that point, it stops once the string is valid, and functions such as `rgb(` are not offered.
- **Math.** `calc()`, `min()`, `max()`, `clamp()` and the other CSS Values 4 math functions are accepted wherever their type is: `width("calc(100% - 2rem)")`. The types check only the function name and the parentheses; the build checks the units (`calc(1px + 2s)` is an error).
- **Layout contexts.** `flex()` and `grid()` without arguments set `display` and chain only their container properties. Names drop only the context prefix: `flex().direction("column").wrap("wrap").alignItems("center").justifyContent("space-between")`, `grid().templateColumns("1fr 2fr").gap(4)`. Plain styles do not chain; merge them with `cn(...)` or `cx(...)`. Item properties (`flexGrow`, `alignSelf`, `gridColumn`, `order`) are plain functions.
- **`flex(...parts)` and `grid(...parts)` are the shorthand properties.** With at least one argument the call is the `flex` (or `grid`) property, checked by its grammar like any member: `flex("1")`, `flex(1)` and `flex("1 1 0")` are `flex: 1`, `flex: 1` and `flex: 1 1 0`, `grid("auto / 1fr 1fr")` is `grid: auto / 1fr 1fr`. A bare number is a `<number>` here, not a spacing step. The result is a plain style: it sets no `display` and does not chain. The types tell the two forms apart by overload.
- **`container` is the condition.** `container("sidebar (width < 30rem)")` is a query; the `container` shorthand property is written with its longhands `containerName` and `containerType`.
- **Arguments are build-time values.** The plugin runs your module at build time and replaces each call with a class string. A literal, a `const`, a token or a value from another attributed module works. A value that exists only at runtime (a prop, state) does not: `p(n)` with `n` a parameter is a build error (`css arguments must be known at build time: n is not defined where the call is evaluated`) that points at the call. The types do not catch it: a helper module may take parameters (below), so a `string` or `number` is a fine argument there. Choose between styles with `cx(on && p(4))`, a `cv` variant, or a token set in a `style` prop. A helper module imported with the attribute may take parameters, because each call of it is a site with its own arguments: `stack(4)` below is a build-time call in the file that makes it.
- **Top-level code runs at build time.** A call the run does not reach (`false && p(4)`, a branch not taken, a ternary arm) still gets its class string: it is evaluated after the module has loaded, like a call inside a function, so its arguments may use the bindings of the module but not the locals of the branch. A `_cv(cv(...))` at the top of a module works too: during the build `_cv` turns the `cv()` into the same function the browser gets.

```ts
// stack.ts
import * as css from "cssints" with { type: "cssints" };

export const stack = (gap: number) => css.flex().direction("column").gap(gap);

// elsewhere: import { stack } from "./stack.ts" with { type: "cssints" }; ... className={stack(4)}
```

### Basic usage

```tsx
import { cx } from "cssints";
import { alignItems, justifyContent, p } from "cssints" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

export const A = () => (
	<div className={cx(css.display("flex"), alignItems("center"), justifyContent("center"), prop && p(4))}>Hello, world!</div>
);
// or with a layout context
export const B = () => (
	<div className={cx(css.flex().alignItems("center").justifyContent("center"), prop && css.p(4))}>Hello, world!</div>
);
```

Output for `A`:

```tsx skip
import { cx } from "cssints";

export const A = () => <div className={cx("_1s47490", "_1ob5z5m", "_cn8dee", prop && "_lwugp7")}>Hello, world!</div>;
```

```css
@layer _.k, _.a, _.b, _.c, _.d, _.e;
@layer _.a {
	._lwugp7 { padding: 1rem; }
	._1ob5z5m { align-items: center; }
	._1s47490 { display: flex; }
	._cn8dee { justify-content: center; }
}
```

- **The class names** are a hash of the declaration (and its conditions), so the same declaration gives the same class in every file.
- **One sheet.** All rules are in `virtual:cssints.css`, each once, sorted by layer, then condition, then shorthand before longhand (`border` before `border-top`, counted from Chrome's own expansion of each shorthand), then class name. So a longhand wins over a shorthand that contains it, whatever the order of the arguments: `cn(pl(2), p(4))` keeps `padding-left: 0.5rem`.
- **`cn()` keeps the later of the same property.** `cn(p(4), p(2))` is `p(2)`: the earlier declaration is dropped at build time (also for an alias: `wordWrap` is `overflowWrap`). Under different conditions both stay, because they are in different layers: `cn(md(p(6)), p(2))`. Two properties that overlap without one containing the other are a build error, because the sheet cannot order them by the arguments: `cn(borderTop("1px solid red"), borderColor("blue"))` both set `border-top-color`; so do a physical and a logical side (`marginLeft` and `marginInline`, `width` and `inlineSize`), since which physical side a logical one is depends on the writing mode. A logical property inside a physical shorthand that sets every side is contained, not overlapping: `cn(border(...), borderInline(...))` is fine, and `borderInline` wins. Styles that only meet in `cx()` in the browser are not seen at build time.
- **A layout context** gives one string: `flex().alignItems("center")` is `"_1s47490 _1ob5z5m"`.
- **Also exported:** `css` (the namespace as a value) and `cn`, `cv`, `firstThatWorks`, `media`, `container`, `supports`, `token`, `style`, `createTokens`, `createGlobalTheme`, `check`. `cx` and `_cv` are the only runtime exports.

### Without runtime

```tsx
import * as css from "cssints" with { type: "cssints" };

export const C = () => <div className={css.cn(css.flex().alignItems("center").justifyContent("center"), css.p(4))}>Hello, world!</div>;
```

Output:

```tsx skip
export const C = () => <div className="_1s47490 _1ob5z5m _cn8dee _lwugp7">Hello, world!</div>;
```

- **`cn(...)`** merges styles at build time into one class string. Its arguments are fixed, so nothing is left at runtime and no `cx` is imported.

### Conditions and layers (decided 2026-09-29, cssints-kpq1)

Conditions are wrapper functions. A wrapper takes styles and returns them under its condition. Wrappers nest.

```ts
import { cx } from "cssints";
import * as css from "cssints" with { type: "cssints" };

const md = css.media("(width >= 40rem)");
const [tablet, wide] = css.media("(width >= 40rem)", "(width >= 60rem)");
const { sm, lg } = css.media({ sm: "(width >= 30rem)", lg: "(width >= 60rem)" });
const dark = css.media("(prefers-color-scheme: dark)");
const narrow = css.container("sidebar (width < 30rem)");
const grid = css.supports("(display: grid)");

export const styles = cx(
	css.p(2),
	md(css.pl("8ch"), css.pt(4)),
	css.hover(css.bg("#eee")),
	md(css.hover(css.bg("#ddd"))),
	prop && lg(css.p(8)),
);
export const forms = cx(dark(css.bg("#111")), narrow(css.m(0)), grid(css.display("grid")), tablet(css.m(1)), wide(css.m(2)), sm(css.m(3)));
```

- **Pseudo-classes** are ready-made wrappers named after the selector: `hover`, `focus`, `focusVisible`, `active`, `disabled`, and so on: 49 of them, from mdn-data `selectors.json` (standard pseudo-classes without arguments). Functional ones (`:nth-child()`) are not wrappers.
- **Query strings are checked** against the mdn-data grammar (`<media-query-list>`, `<container-condition>`, `<supports-condition>`), in types and at build time, like property values. A range needs parentheses: `(width > 40rem)`, not `min-width > 40rem`. `supports()` takes property declarations; a typo in the property (`(display: grdi)`) is a build error, not a type error.
- **Layer = number of conditions.** A style with no condition goes to `_.a`, one condition to `_.b`, two to `_.c`, and so on up to `_.e`. A fifth condition is a build error. A media query, a container query, `supports` and a pseudo-class each count as one. `_.k` comes first and holds token and theme rules.
- **Order inside a layer** comes from the sorted stylesheet. Each condition has a rank: a pseudo-class by its place in the list (`link`, `visited`, `any-link`, `focus-within`, `hover`, `focus`, `focus-visible`, `active` first), a media or container query by its min-width in px (`(min-width: X)` or `(width >= X)` in px, rem or em; 0 when none can be read). Rules sort by the ranks of their chain. With equal layers, `hover(...)` beats `md(...)` by specificity.
- **Class names** hash the declaration together with its condition chain.
- **Bindings.** `const md = media(...)`, and its tuple and object forms, are build-time only: the client has `null` in their place, so keep them in the module that uses them or import them from a module with the attribute.
- Pseudo-elements (`::before`, `::placeholder`) and parent states (`group-hover`) are not part of 0.1.

Output of `styles`; each form in `forms` gives one more rule in `_.b` (`dark`, `narrow` and `grid` in a block of their own before `:hover`):

```css
@layer _.a {
	._1t8gqy5 { padding: 0.5rem; }
}
@layer _.b {
	._16f8jrr:hover { background-color: #eee; }
	@media (width >= 40rem) {
		._1q848uz { padding-top: 1rem; }
		._t70zhd { padding-left: 8ch; }
	}
	@media (width >= 60rem) {
		._1khcbr2 { padding: 2rem; }
	}
}
@layer _.c {
	@media (width >= 40rem) {
		._ronnd2:hover { background-color: #ddd; }
	}
}
```

### Tokens (decided 2026-09-29, cssints-o00x)

A token is a Typed OM value whose `toString()` is `var(--name)`. It fits anywhere a value of its type fits: `color(blue)`, `border("1px solid", blue)`.

```tsx
import * as css from "cssints" with { type: "cssints" };

const blue = css.token.color("blue", "color-primary"); // --color-primary, can be set
const gap = css.token.length("16px", { var: "gap", inherit: false });
const muted = css.token.color("#6b7280"); // --_<hash>, private

export const A = () => <div className={css.cn(css.color(blue), css.gap(gap), css.color(muted))} />;
export const B = () => <div style={css.style(css.color(blue), css.token.set(blue, "red"))} />; // { "--color-primary": "red", color: "var(--color-primary)" }
css.token.set(muted, "red"); // error: private tokens cannot be set
```

- **Types:** `token.<type>` exists for the types that `@property` `syntax` allows: `color`, `length`, `percentage`, `lengthPercentage`, `number`, `integer`, `angle`, `time`, `customIdent`, `resolution`, `url`, `image`, `transformList`. A token fits only the typed parts of its type, with two exceptions: an `integer` also fits `<number>`, and a `url` also fits `<image>` (a `url()` is an image). A `url` token in a `<url>`-only position (`markerStart`) is fine, an `image` token there is an error. A relative `url()` in a `<url>` token resolves against the page, not the stylesheet. The initial value is checked against that type's grammar, in types and at build time. A browser drops an `@property` rule whose initial value depends on a font size, so `1rem`, `1em` and `1ch` are a build error: write `16px`.
- **Names:** a name (a string, or `{ var, inherit }`) gives `--name`, and the token can be set. Without a name the variable is `--_<hash>` of the file and site, and the token is private. `inherits` defaults to `true`.
- **Output:** one `@property` per token at the top of the global sheet, after the layer statement and outside the layers, once however many modules use it. Two tokens with one name are a build error at the second.

```css
@property --color-primary {
	syntax: "<color>";
	inherits: true;
	initial-value: blue;
}
```

- **`style()` and `token.set()`** are build-time and take static values; the result is a style object, custom properties first. A dynamic value is set with a plain `style={{ "--color-primary": value }}`; a typed runtime setter is not part of 0.1.
- **A token of the wrong type** is an error that names the token: `color: unexpected "1px" in "1px", expected <color> ("var(--gap)" is checked as "1px": a token stands for a value of its type)`.
- **A raw `var()`, `env()` or `if()`** in a string part (`padding("var(--a)", "2px")`, `margin("env(safe-area-inset-top)")`) stands for any run of values, commas included, in any property, and the rest of the value is still checked: `padding("var(--a)", "red")` is an error, unlike in Chrome. Only the call's shape is checked (`var(--name)`, the conditions of an `if()`).
- Design-token constraints and math (DTCG, Ariakit Tailwind) are researched in `docs/research/design-tokens.md`.

#### Themes (decided 2026-09-29, cssints-exof)

Tokens come from an inline DTCG-shaped `const` object. Every leaf is a token (see "Tokens") reached by property access. Values are DTCG values or CSS strings checked by the grammar of their `$type`. Aliases use DTCG `{path}` references.

```tsx
import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
	color: {
		$type: "color",
		bg: { $value: "#ffffff" },
		fg: { $value: "#111827" },
		accent: { $value: "oklch(62% 0.19 259)" },
		link: { $value: "{color.accent}" },
	},
	space: { $type: "dimension", md: { $value: "16px" } },
});

const dark = css.media("(prefers-color-scheme: dark)");
css.createGlobalTheme(t, dark, { color: { bg: "#0b0b0f", fg: "#f3f4f6" } });
css.createGlobalTheme(t, ".light", { color: { bg: "#fff" } });
css.createGlobalTheme(t.color, css.container("(width < 30rem)"), { bg: "#eee" });

css.check.contrast(t.color.fg, t.color.bg, { min: 4.5 });

export const A = () => <div className={css.cn(css.bg(t.color.bg), css.color(t.color.fg), css.p(t.space.md))} />;
css.createGlobalTheme(t, dark, { color: { nope: "red" } }); // error: no token at this path
css.createGlobalTheme(t, css.hover, { color: { bg: "red" } }); // error: a pseudo-class is not a theme condition
```

- **Types:** `$type` is inherited through groups, and a token needs one (it is not guessed from the value). It maps to a token type: `color` to `color`, `dimension` to `length`, `number` to `number`, `duration` to `time`, `fontWeight` to `number` (keywords such as `bold` become 700). `fontFamily`, `cubicBezier`, `strokeStyle` and the composite types have no `@property` syntax and are an error. A value is a CSS string of the type's grammar, or the DTCG form: `{ colorSpace, components, alpha? }`, `{ value, unit }` (`px` or `rem`, `ms` or `s`), a number. The initial value follows the rule of "Tokens": `{ value: 1, unit: "rem" }` is a build error, write `16px`.
- **Names:** the variable name is the kebab-case path (`--color-bg`). A second argument to `createTokens` maps a path (an array of names) to a name, or to `{ var, inherit }`.
- **Themes:** `createGlobalTheme(tokens, condition | selector, overrides)` re-declares the overridden tokens under a `media()` condition on `:root`, or under a selector. Under `container()` it declares them on `:where(*)`, since `:root` has no container above it and would never match. Overrides are checked against the token types, and an unknown path is a type error; they take the same values as tokens, and `tokens` may be a group (`t.color`). `supports()` and pseudo-classes are not themes: `createGlobalTheme(t, hover, …)` is a type error, and a build error when the types are bypassed.
- **Aliases:** `@property initial-value` must be computationally independent, so it gets the flattened literal. The alias stays live as a `var()` declaration on `:root`. A theme re-declares the aliases that depend on an overridden token (all of them, through chains), since `var()` is substituted where it is declared. A `{path}` must name a token of the same `$type`; a cycle is an error.
- **Derived tokens** (cssints-5y5a): a `$value` may refer to other tokens inside a CSS value, `"color-mix(in oklab, {color.accent}, black 15%)"` or `"calc({space.md} * 2)"`. It stays live CSS: the `@property` initial value takes the targets' literals, the `:root` declaration keeps `var(--color-accent)`, and a theme that sets `color.accent` declares every token derived from it again (through chains), so a hover colour follows the brand colour. A derived token needs its `$type` (or its group's); in the editor its value is checked as the type's grammar with each `{path}` in place as a value of that token's type, so a missing path or a value that is not of the type is a type error.

```ts
import * as css from "cssints" with { type: "cssints" };

export const t = css.createTokens({
	color: {
		$type: "color",
		accent: { $value: "#2563eb" },
		hover: { $value: "color-mix(in oklab, {color.accent}, black 15%)" },
	},
});
css.createGlobalTheme(t, ".brand", { color: { accent: "#db2777" } }); // hover follows
```

- **References in overrides** (cssints-q6l0): an override takes `{path}` too, as the whole value (`"{radius.sm}"`) or inside a CSS value (`"oklch(0.7 0.1 {hue.accent})"`). The theme declares `var(--target)`, so the value is live; tokens derived from the overridden token are declared again as above. Order does not matter: the declarations of one rule belong to one element, and a `var()` reads that element's own value of the target, so a theme that sets `hue.accent` and a colour made of it needs no particular order. A reference to no token, a whole-value reference to a token of another type, a value that is not of the token's type with each reference replaced by its target's value (a literal at build time, a value of the target's type in the editor), and a cycle through the base tokens and the theme are errors. Paths are from the root of the tokens, so give the root (`t`) to a theme that refers to another group; the editor rejects a reference outside the group it is given.

```ts
import * as css from "cssints" with { type: "cssints" };

export const t = css.createTokens({
	hue: { $type: "number", accent: { $value: 345 } },
	radius: { $type: "dimension", sm: { $value: "4px" }, md: { $value: "8px" } },
	color: { $type: "color", accent: { $value: "oklch(0.6 0.2 {hue.accent})" } },
});
css.createGlobalTheme(t, ".square", { radius: { md: "{radius.sm}" } });
css.createGlobalTheme(t, ".dim", { hue: { accent: 12 }, color: { accent: "oklch(0.7 0.1 {hue.accent})" } });
css.createGlobalTheme(t, ".x", { radius: { md: "{hue.accent}" } }); // error: a number, not a length
```

- **JSON input:** `createTokens` takes a DTCG file imported as JSON, `import tokens from "./tokens.json" with { type: "json" }`. The editor knows the tree (`t.color.bg`, and a wrong path is a type error) but not the types, since a JSON import widens `$type` to `string`: each token is a token of any type there, and its values, references and use in a property are checked at build time.
- **The sheet:** token sets and themes are rules of layer `_.k`, after the global rules and before the class layers. They set custom properties only, and no class does, so the layer order never decides between them; `_.k` is the lowest layer, so your own unlayered `--color-bg` rule wins over a theme. The `:root` rules of aliases come first, then themes under a condition, then themes under a selector, each in source order, so a selector theme beats a condition theme on the same element. A module has the rules of the tokens it uses, from wherever they were made, and its own; import a theme module (`import "./theme.ts"`) to have all of it.
- **`css.check.contrast(fg, bg, { min })`** computes the WCAG 2.x contrast ratio (`min` from 1 to 21) for the default values and for every theme that sets either token or one they are aliases of. It reads themes one at a time, not their combinations. A ratio below `min` is a build error that names the theme and both resolved values (the ratio is cut, not rounded: 4.499 is 4.49). A value the check cannot evaluate (`color-mix()`, a relative colour, `light-dark()`, `currentColor`, a system colour) or a translucent one is a warning that names the token; a build says it once, and a dev server says it again after each edit. A derived token is read as its default value with the references replaced by their literals: a warning when that is not a colour (`color-mix()` over another token), a ratio when it is (`oklch(0.6 0.2 {hue.accent})`), and a theme that sets a token it refers to is not seen (cssints-l90l). The colour library (culori, `culori/fn`: 27 kB minified, 9 kB gzipped) is build-only and never ships. The check runs when its module has run, and again at the end of a build over the themes of every module.

Output (the `@property` rules of `space-md` and `color-fg` are not shown):

```css
@layer _.k, _.a, _.b, _.c, _.d, _.e;
@property --color-accent { syntax: "<color>"; inherits: true; initial-value: oklch(62% 0.19 259); }
@property --color-bg { syntax: "<color>"; inherits: true; initial-value: #ffffff; }
@property --color-link { syntax: "<color>"; inherits: true; initial-value: oklch(62% 0.19 259); }
@layer _.k {
	:root { --color-link: var(--color-accent); }
	@media (prefers-color-scheme: dark) {
		:root { --color-bg: #0b0b0f; --color-fg: #f3f4f6; }
	}
	@container (width < 30rem) {
		:where(*) { --color-bg: #eee; }
	}
	.light { --color-bg: #fff; }
}
```

Derived tokens (`contrastColor()`, `derive()`), JSON input with generated types and slot variants are not part of 0.1.

### Fallbacks: `firstThatWorks` (decided 2026-10-01, cssints-bogz)

`firstThatWorks(wanted, ...fallbacks)` is a part of any property: the value you want comes first, then what to use where it fails.

```ts
import { border, color, firstThatWorks, minHeight, token } from "cssints" with { type: "cssints" };

const brand = token.color("#0057b8", "brand");

export const a = minHeight(firstThatWorks("100dvh", "100vh"));
export const b = color(firstThatWorks("oklch(55% 0.18 250)", brand));
export const c = border("1px", firstThatWorks("solid", "dashed"), "red");
export const d = minHeight(firstThatWorks("100dvh", "100vhh")); // error: the fallback is not a min-height
```

- **One class.** `a` is one class, `.x { min-height: 100vh; min-height: 100dvh }`: the declarations in CSS order, the wanted value last, so `cn()` and the sheet treat it as one rule. With three values the last is printed first.
- **Checked per value.** Every value is checked for the property, in types and at build time, as the whole declaration with that value in its place. The type error is on the `firstThatWorks(...)` part and the message names the bad value.
- **Values** are strings and Typed OM values (tokens); `var()` is fine. A number is not (`p(4)` has no fallback), nor is a style.
- **In several parts** the whole declaration is repeated with each value (`c`: `border: 1px dashed red; border: 1px solid red`). One `firstThatWorks` per declaration; two are an error.
- **Support warnings.** A target that lacks the wanted value gets no warning if it supports a fallback. The warning stays, for the targets that lack every value, and says so: `color: "oklch()" in "oklch(55% 0.18 250)" is not supported by chrome 100 (css.types.color.oklch), and no fallback of its firstThatWorks covers them`.
- **Minify.** Vite's CSS minify decides which of the declarations LightningCSS may drop, from `build.cssTarget` (set it to `cssTarget` of `cssints/vite`, see the README), not from `css.lightningcss.targets`. With the targets it keeps `min-height: 100vh; min-height: 100dvh` where a target lacks `dvh` and merges them where none does; with `cssTarget: false` it always merges.
- **Limits.** It is not a Typed OM value: a typed position (`token.length(firstThatWorks(...))`) rejects it, and so does `style()` (an inline style holds one value per property). `const f = firstThatWorks(...)` is build-time only, like a condition: the client has `null`. The fallback is for values a browser drops; `@supports` is for styles that are not one declaration.

### Local at-rules: `keyframes` and `positionTry` (decided 2026-10-02, cssints-lirm)

`keyframes()` and `positionTry()` define an at-rule next to the styles that use it and return its name, a typed value that fits where the grammar wants a name.

```ts
import { animation, cn, hover, keyframes, margin, opacity, positionTry, positionTryFallbacks, top, transform } from "cssints" with { type: "cssints" };

export const fade = keyframes({ from: opacity(0), to: opacity(1) });
export const wiggle = keyframes({ from: transform("rotate(0deg)"), "50%": cn(transform("rotate(8deg)"), opacity(0.5)), to: transform("rotate(0deg)") });
export const above = positionTry(cn(top("anchor(bottom)"), margin(2)));

export const a = animation(fade, "200ms", "ease-out");
export const b = hover(animation(wiggle, "1s", "infinite"));
export const c = positionTryFallbacks(above, "flip-inline");
export const d = keyframes({ from: opacity("lots") }); // error: opacity: unexpected "lots"
export const e = keyframes({ halfway: opacity(0) }); // error: a step is from, to or a percentage
export const f = positionTryFallbacks(fade); // error: a keyframes name is not a dashed ident
```

- **Steps are styles.** A step of `keyframes()` and the argument of `positionTry()` are made of member calls (`opacity(0)`, `cn(...)`), as `cn()` and `cv()` take them: they are checked by the grammar of each property, at the member call in the types and at the call of `keyframes()` at build time, with the support warnings of a class. A step is `from`, `to` or one percentage (`"50%"`, 0 to 100); a list (`"0%, 100%"`) is not supported. A condition, a `firstThatWorks()` or a member with a marker class (a plugin's) inside a step is a build error, since an at-rule step has none.
- **`positionTry()` takes what `@position-try` takes:** inset, margin and sizing properties, `align-self`, `justify-self`, `place-self`, `position-anchor` and `position-area` (CSS Anchor Positioning §6.4). Any other property (`positionTry(cn(padding(2)))`) is a build error at the call; the types cannot see which property a style holds. `position-try` is a property as well, so with value parts `positionTry("flip-block")` is still that shorthand; one style is the rule.
- **The name** is a hash of the rule's content: `kf-1a2b3c4d` for keyframes, `--pt-1a2b3c4d` for `@position-try`, so two blocks with the same steps are one name and one rule, from any module. It is a Typed OM value: `CSSStyleValue<"custom-ident">` for keyframes (`animation`, `animationName`), `<dashed-ident>` for `positionTry()` (`positionTryFallbacks`); it fits nowhere else. A `keyframes()` in a client module ships as its name string.
- **Where the rule goes.** The name carries its rule; a style that holds the name (`animation(fade, ...)`, inside `cn()`, a condition or a `cv()`) puts the rule in the sheet of its module, once however many use it. A rule that nothing uses is in no sheet, so there is nothing to shake: a module that imports a helper but does not use a name has no rule. It is a kernel (see "Plugins"), keyed by the content, in layer `_.k`, with `requires` set to `css.at-rules.keyframes` or `css.at-rules.position-try`: a target that lacks it gets a support warning, never an error.
- **The layer.** A name is global and a rule of a layer wins over another of the same name by layer order (css-cascade-5, css-anchor-position-1 §6.4: the same cascade as `@keyframes`). Names are hashes of the content, so no two rules of different content share one and the order never decides; the rules go in `_.k`, below every class layer, and the layer statement stays as it is.
- **In a helper module.** `export const fade = keyframes(...)` in a module imported with the attribute (like a token) is a definition site: it ships nothing, and the components that import it and use it carry the rule.
- **Limits.** The name is not a part of `firstThatWorks()` or `style()` (an inline style has no sheet): both reject it with a message. A value of `custom-ident` kind is accepted by the grammar as a keyframes name whichever way it was made, so a typo in a hand-written `animationName("fadee")` is not caught.

```css
@layer _.k {
	@keyframes kf-0e6af964{from{opacity:0}to{opacity:1}}
	@position-try --pt-23965b44{top:anchor(bottom);margin:0.5rem}
}
@layer _.a {
	._44ecsn{animation:kf-0e6af964 200ms ease-out}
}
```

### Runtime: `cx`, `cn`, `cv` (decided 2026-09-29, cssints-lo9x)

- **One runtime package: `cssints` itself.** `import { cx, _cv } from "cssints"` has no attribute and is the only code that ships to the browser. `@cssints/variants` is gone.
- **`cx(...)`** joins strings, skips falsy values and flattens nested arrays: `cx(base, on && p(4), [a, b])`. It takes no clsx-style objects; write `cond && style` instead.
- **`cn(...)`** runs at build time only. Under the attribute, `cn(p(4), bg("red"))` becomes one class string, and nothing is left at runtime.
- **`cv(config)`** takes `css.*` values, so types check them. The plugin replaces it with a config of class strings, and `_cv` (runtime) turns that into the function you call:

```ts
import { _cv } from "cssints";
import { cn, cv, fontSize, p } from "cssints" with { type: "cssints" };

const button = _cv(
	cv({
		base: cn(p(2), fontSize("1rem")),
		variants: { size: { sm: p(1), lg: cn(p(4), fontSize("1.25rem")) } },
		defaultVariants: { size: "sm" },
	}),
);

export const classes = () => button({ size: "lg" }); // "_1t8gqy5 _6tpir7 _lwugp7 _z6yj9k"
export const bad = cv({ base: "padding: 1rem" }); // error: a base is a css value, not a CSS string
```

- **What ships** for `button` is `_cv({ base: "_1t8gqy5 _6tpir7", variants: { size: { sm: "_lqk467", lg: "_lwugp7 _z6yj9k" } }, defaultVariants: { size: "sm" } })`: class strings only.
- **Values** of `base` and of each variant are one property, `cn(...)`, or a `flex()`/`grid()` chain. A CSS string is a build error that shows the new form: `cv() base must be a css.* value (cn(...), a flex() chain or one property), got "padding: 1rem". CSS strings are gone: write cn(p(4), fontSize("1rem"))`.

Slot variants (`scv`) are not part of 0.1.

### Errors

A bad value fails in the types, where the call is, and again at build time with the file and the place of the call, so the Vite overlay points at it. The types catch most of it.

```ts
import * as css from "cssints" with { type: "cssints" };
css.padding("1rem", "solid"); // error: not a padding value
css.width(4); // error: a bare number is a length only in spacing properties
css.flex().padding(4); // error: flex() does not chain padding
css.flex("1").gap(2); // error: flex("1") is a plain style, it does not chain
css.flex("sideways"); // error: not a flex value
css.padding(css.p(1)); // error: a style is not a value
css.items("center"); // error: there is no items
css.media("min-width > 40rem"); // error: a range needs parentheses
```

The build checks more than the types see:

```ts
import * as css from "cssints" with { type: "cssints" };

css.p(-1); // padding: unexpected "-0.25rem" in "-0.25rem", expected <length-percentage [0,∞]>
css.width("calc(1px + 2s)"); // width: unexpected "calc(1px" ... (cannot add length and time)
css.supports("(display: grdi)"); // @supports: unexpected "grdi" in "(display: grdi)", expected <supports-in-parens>
css.token.length("1rem"); // token.length() initial value "1rem" depends on the font size ... use px or a viewport unit
```

- A value that a browser in your browserslist (`BROWSERSLIST`, default `defaults`) does not support is a warning, not an error: `cursor: pointer` warns for iOS Safari.
- Validity rules written only in prose are errors too (`transition: none, opacity 1s`, an unquoted `font-family` with a generic keyword inside a name).
- Keywords and function names are written in their canonical case, on purpose: `color("RED")` and `rgb(` as `RGB(` are errors, so each value has one spelling (completions and class names stay the same). The message says the spelling: `color: unexpected "RED" in "RED" ("RED" is red in CSS; write "red"), expected <color>`. The types say it for keywords (`color("RED")`); the build says it for function names too.

### Plugins (decided 2026-09-30, cssints-zho2)

A plugin is a module that exports members built with five helpers from `cssints/plugin`. User code imports it with the attribute, like `cssints` itself: `import { ring } from "./ring.ts" with { type: "cssints" }`. There is no registration in `vite.config` and no type augmentation; the engine finds the sites by the attribute, and learns kernels, runtimes and conflicts from the style each member returns. In user code a member returns a class string, so it goes into `cn()`, `cx()` and the conditions like any `css.*` value.

```ts
import { cn, p } from "cssints" with { type: "cssints" };
import { context, method, property, style } from "cssints/plugin";

// A property of your own, typed by its grammar (it is not in mdn-data). No support warning: the engine knows nothing of it.
export const smoothing = property("-webkit-font-smoothing", "auto | none | antialiased | subpixel-antialiased");

// A chaining context like flex(): the call gives the marker class and the kernel, each method emits custom properties.
const length = "<length [0,∞]>";
export const ring = context({
	name: "ring",
	marker: "_rg",
	kernel: { key: "ring@1", css: "._rg { outline: var(--rg-w) solid var(--rg-c); }" },
	conflicts: { props: ["outline", /^outline-/], message: "ring() sets the outline" },
	methods: {
		width: method({ grammar: length, emit: (v) => [["--rg-w", v]] }),
		color: method({ grammar: "<color>", emit: (v) => [["--rg-c", v]] }),
	},
});

// A function of grammar-typed parts that returns a style: `build` gets the parts joined by a space.
export const dot = style("small | large", (size) => ({
	decls: [["--dot-size", size === "small" ? "4px" : "8px"]],
}));

export const card = cn(p(2), ring().width("2px").color("red"), smoothing("antialiased"), dot("small"));
export const twice = ring().width("1px").width("2px"); // error: a method is used once
export const wrong = ring().width("red"); // error: not a length
export const bad = smoothing("bold"); // error: not in the grammar
```

- **`context({ name, marker, kernel, runtime?, conflicts?, methods })`** gives `() => chain`. The call is the marker and the kernel; `method({ grammar, spacing?, emit })` makes each method: its parts are checked against `grammar` in the types (the error is on the bad argument and says `ring.width: unexpected "red" ...`) and again at build time. `spacing` makes a lone number a step of the spacing scale, as in `padding`. `emit` returns declarations; a custom property (`--*`) is allowed and its value is not checked, any other property is checked like a `css.*` one. A method is used once: the chain leaves it out. `excludes: ["darken"]` leaves other methods out after this one too (`surface().lighten(…)` has no `.darken()`; the build says `cannot go with .lighten()` in plain JS), and `grammar: ""` makes a method that takes no value (`ink()`). A grammar must be a literal type (a `const` variable is fine; if TypeScript has widened it to `string`, the method says so and takes no value: write `as const`).
- **`style(grammar, build)`** is a function of grammar-typed parts. `build(value)` returns `{ decls, markers?, kernels? }`: `markers` are fixed classes printed once (they belong to the first kernel), `kernels` are the kernels they need. Icons are this shape.
- **`property(name, grammar, emit?)`** is a typed passthrough: the value is checked against `grammar` and emitted as `name: value`; `emit(value)` can return other declarations. A name that is a CSS property already is an error (use `css.<name>`).
- **Kernels** are global CSS, registered by `key` (`name@version`) on first use: the CSS goes once into layer `_.k`, below every class layer, and `atProperty` (the `@property` rules of its custom properties) goes at the top of the sheet. Two members share a kernel by pointing at the same object. Build errors, at the call site: the same key with other CSS (a kernel that changes needs a new key), two keys that declare one custom property, two keys that print one marker. Pick short custom-property names and markers (`--rg-w`, `_rg`). A kernel's `requires` (BCD keys) is a build warning for a target that lacks one, never an error. As in every support warning, a BCD `partial_implementation` counts as support, because most partial entries are edge cases (`accent-color` without a minimum contrast, `content-visibility: auto` not found by find-in-page); an entry `{ key, exact: true }` counts it as lacking, for a feature whose partial form gives other results (`surface()` asks for `{ key: "css.types.color.oklch.relative_syntax", exact: true }`), and the warning says so: `(a partial implementation counts as lacking)`. `polyfills` has no such form: a runtime is chosen by what a polyfill can repair, and it cannot repair a partial relative colour.
- **`conflicts: { props, message }`**: one `cn()` that holds the marker and one of the listed properties (a name, or a RegExp) is a build error with the plugin's message and the call site: `cssints: ring: ring() sets the outline (this style also sets outline)`. Conditions count: `hover(outline("none"))` is the same conflict.
- **`runtime: { polyfills, parentVars?, css? }`** is the part for browsers that lack a feature. `polyfills` are BCD keys. A client module that holds a site with the member imports `virtual:cssints/runtime/<name>`, and the module is empty (`export {};`, nothing ships) unless a browserslist target lacks one of the keys and has `@property`, which the runtime stands on; a target without it gets nothing from a polyfill. When it is needed, `parentVars` (`{ marker, read, write, watch? }`, a family of elements that read the nearest marked ancestor's computed custom property) configure `cssints/parent-vars`, one shared script and one `MutationObserver` for all plugins, which does nothing without a `document`; and `css` (the fallback rules) is added to the sheet in layer `_.k`, only then. There is no switch to turn a runtime off.
- **Errors** are `MemberError` values (`Data.TaggedError`) with `pluginName` and the file, site and offset of the call, so the Vite overlay points at it.
- **`fn(grammar, computeTo, name?)`** is a function of grammar-typed parts that returns a value, not a style (see "Functions").
- **Not in 0.2:** `keyword` members, completions of keywords inside plugin grammar strings (the message still names the grammar), local syntax names in grammars, and a plugin that is a package of members you install (`@cssints/icons` is the first, see Icons; `cssints/frame` and `cssints/surface` are written on these helpers).

### Functions: `colorMix`, `min`, `max`, `clamp` and `fn()` (decided 2026-10-02, cssints-obd3)

A value function is a part of any property that is computed at build time and inlined where it is called: nothing of it ships. It exists because a token cannot go into a template string (`` `color-mix(in oklab, ${accent}, black)` `` is a `${string}` to the types, and the types reject it), and a call can take one.

```ts
import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
	color: { $type: "color", accent: { $value: "oklch(62% 0.19 259)" } },
	space: { $type: "dimension", md: { $value: "16px" } },
});

export const a = css.color(css.colorMix("oklab", t.color.accent, "black 15%")); // color: color-mix(in oklab, var(--color-accent), black 15%)
export const b = css.padding(css.clamp(t.space.md, "2vw", "2rem")); // padding: clamp(var(--space-md), 2vw, 2rem)
export const c = css.maxWidth(css.min("48rem", "100%"));
export const d = css.opacity(css.clamp<"number">(0, 0.5, 1));
export const e = css.color(css.colorMix("rgb", "red", "blue")); // error: not a colour space
export const f = css.color(css.colorMix("oklab", t.space.md, "red")); // error: a length is not a colour
export const g = css.width(css.colorMix("oklab", "red", "blue")); // error: a colour is not a length
```

- **`colorMix(space, a, b)`** is a `<color>`: the colour space (`"oklch longer hue"` for a polar one), then two colours, each a token or a string with an optional share (`"black 15%"`). It is checked in the types and at build time (a share over 100% is the build's), and takes exactly three arguments. A bare `css.color("color-mix(in oklab, red, blue)")` is valid already; the helper is for the token argument.
- **`min`, `max` and `clamp(low, value, high)`** take tokens, strings and numbers, and give a Typed OM value of type `T`: a length, unless the first typed argument is of another type (`clamp(t.fraction, ...)` is a number) or you say so, `clamp<"number">(0, x, 1)`. The arguments are not checked one by one: the declaration that takes the result is, at build time, with the usual message (`width: unexpected "min(1rem" in "min(1rem, 2s)" ... (min() cannot take length and time)`).
- **Only these four.** `calc()` stays a string (`"calc(100% - 2rem)"` is checked as before), like every other CSS function; a token argument in one is `fn()` or a raw `var(--name)`.

`fn(grammar, computeTo, name?)` from `cssints/plugin` makes the same kind of function:

```ts
import { CSSColorValue } from "cssints";
import { fn } from "cssints/plugin";

// The parts are checked against the grammar, joined by a space: `computeTo` gets each one as text, a token as its var(--name).
export const tint = fn("<color> <percentage>", ([color, share]) => new CSSColorValue(`color-mix(in oklab, ${color}, white ${share})`), "tint");
export const step = fn("<number>", ([n]) => `${Number(n) * 4}px`, "step");

tint("red", "20%");
tint("red", "solid"); // error: not a percentage
step(2);
```

- **Typed or opaque.** What `computeTo` returns is what the call returns. A Typed OM value (`CSSColorValue`, `CSS.rem(1)`) keeps its type: `tint(...)` is a `<color>` in the types and goes only where a colour goes. A string is opaque to the types, which accept it anywhere, and it is checked at build time in the declaration it lands in, as any value is. Return a Typed OM value when you know the type.
- **Build time only.** `computeTo` runs in the Module Runner, once per call, and the call is replaced by its CSS text (`"_1hjzi3b"` for a class, `"color-mix(...)"` for a call of its own); the function and its module do not reach the client. `name` (default `fn`) is the label of its errors, as the property name is for `property()`.
- **Errors** are `MemberError` values with the file, site and offset of the call, and `pluginName` is the `name`: `tint: unexpected "solid" in "red solid", expected <percentage>` for the parts; a `computeTo` that throws (`cssints: boom: no luck`, any `Error`) or returns something else than a string or a Typed OM value (`cssints: tint() computeTo must return a string or a Typed OM value`). A result that does not fit the property is that property's error, at the same site (`width: unexpected "color-mix(in" in "color-mix(in oklab, red, blue)"`): the engine cannot know the property a function is used for.
- **Limits.** The parts are joined with a space, so a grammar cannot tell the arguments apart (`<color> <color>` takes `"red", "blue"` and `"red blue"`; check `args.length` in `computeTo` as `colorMix` does). A token is checked as the values of its type, so a wrong one is named by its value: `unexpected "1px" in "oklab 1px red"`. `light-dark()` cannot be a function: its result is a browser's choice at the element, not a value.

### `frame()`: concentric radius (`cssints/frame`, cssints-q2vh)

The first plugin, written only on the helpers above. A frame passes its inner radius down the tree; a nested frame's radius is the parent's inner radius less its own margin, so a rounded field in a rounded card stays concentric with no wiring, however many plain wrappers sit between them.

```ts
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };

const radius = css.token.length("12px", "radius-lg");

// radius 24px, padding 16px, border 1px: the field inside gets 24 - 16 - 1 = 7px
export const card = css.cn(frame().radius("1.5rem").padding(4).border("1px"), css.bg("white"), css.borderColor("#9ca3af"));
export const field = css.cn(frame().padding(2).border("1px"), css.borderColor("#9ca3af"));
// a token is a length; a condition just sets the custom property, and the whole subtree follows
export const panel = css.cn(frame().radius(radius).padding(2), css.media("(width >= 40rem)")(frame().padding(6)));

export const noNumber = frame().radius(4); // error: a bare number is a spacing step in padding and margin only
export const noPercent = frame().padding("5%"); // error: a length, not a percentage
export const once = frame().radius("1px").radius("2px"); // error: a method is used once
export const own = frame().color("red"); // error: a frame chains its own methods only
```

- **Methods**, each once and in any order: `radius(<length>)`, `padding(<length> | step)`, `border(<length>)` (a width; the style is `solid`), `margin(<length> | step)`. `radius` is the radius of the outermost frame; inside a frame it is ignored (the radius is computed). A lone number in `padding` and `margin` is a step of the spacing scale (0.25rem). Tokens go anywhere a length does.
- **Build errors** (at the call site): a negative radius, padding or border, a percentage, and a `cn()` that holds `frame()` and a property it sets: `padding*`, `margin*`, `border-radius` and its corners, `border`, `border-width`, `border-style` and the border sides (`cssints: frame: frame() sets padding, margin, border-radius and the border: use its methods (this style also sets padding)`). Border colours (`borderColor`, `borderTopColor`) are plain styles and do not conflict. Conflicts across `cx()` are not seen, as for any plugin.
- **What it emits:** the class `_f` and one class per method (`._x{--fr-p:0.5rem}`, in `_.a`, or `_.b` inside a condition). The kernel `frame@1` (about 1.2 kB minified with its registrations and fallback, once, in `_.k`) is two `@container style(--fr-c: ...)` rules that alternate two names, because a property cannot read itself; the `@property` rules of its custom properties (`--fr-*`) are at the top of the sheet. The inputs are registered lengths, so `em`, `calc()` and tokens reach the child as exact lengths (an `em` padding is the parent's `em`, not the child's). The 24-line kernel for px and rem only was not chosen: `@property` is the floor of the runtime anyway, and the registered one costs about 0.2 kB more.
- **Browsers.** The kernel needs `@container style()` on custom properties (Chrome 111, Safari 18, Firefox 151) and `@property` (Chrome 85, Safari 16.4, Firefox 128). For a target that has `@property` and lacks style queries the build ships the fallback instead: `polyfills: ["css.at-rules.container.style_queries_for_custom_properties"]` and `cssints/parent-vars` (about 1 kB gzip, shared with other plugins), which copies each frame's inner radius to its frame children, and the fallback CSS. The script probes the browser and stays off where style queries work. Below `@property` (Firefox 127, Safari 16.3) the kernel is a build warning and nothing is shipped: a frame keeps no concentric radius there.
- **Limits of the runtime.** It costs about two or three times the style-query kernel on a first pass (190 ms for 5 500 nested frames in Firefox 128); a `transition` of your own on a frame replaces the sentinel that lets `:hover`, media and container conditions reach the script (the script still follows class and style changes); shadow roots are not crossed; a first paint before the script runs shows declared radii.

### `surface()`: parent-relative colour (`cssints/surface`, cssints-vsc9)

The second plugin on the same helpers and the same runtime. A surface passes its colour down the tree; a nested surface is that colour with its OKLCH lightness moved, through any number of plain wrappers. **These are tonal steps, not a contrast guarantee**: `contrast()` and `ink()` pick a direction by lightness and never compute a ratio.

```ts
import * as css from "cssints" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

const canvas = css.token.color("#2b3a67", "canvas");

// a base, then a lighter card on it (a token or a colour), a field a step darker, a button pushed away from its parent
export const page = surface().color(canvas);
export const card = css.cn(surface().lighten(0.06), css.hover(surface().lighten(0.1)));
export const field = surface().darken(0.03);
export const cta = surface().color("oklch(from #e11d48 l c h)").contrast(0.15).ink();

export const both = surface().lighten(0.1).darken(0.1); // error: lighten, darken and contrast do not go together
export const wide = surface().color("wide"); // error: not a colour
export const noValue = surface().ink("black"); // error: ink() takes no value
export const own = surface().radius("4px"); // error: a surface chains its own methods only
```

- **Methods**, each once and in any order: `color(<color> | token)` is an absolute base (without it the base is the nearest surface around, or `Canvas` for the outermost); `lighten(step)`, `darken(step)` and `contrast(step)` move the lightness of the base by a `<number [0,1]>`, and only one of the three goes in a chain; `ink()` sets the text colour to black or white by the lightness of the surface (above 0.5636 black, else white). `contrast` moves *away* from the parent: a light parent is darkened, a dark one lightened. The base may be a relative colour (`oklch(from var(--brand) l c h)`).
- **Build errors** (at the call site): a step outside 0 to 1, a bad colour, a method used twice or with another step, and a `cn()` that holds `surface()` and `background` or `background-color`, `bg()` included (`cssints: surface: surface() sets the background colour: use its methods (this style also sets background-color)`). `backgroundImage`, `color` and the border colours do not conflict. Conflicts across `cx()` are not seen, as for any plugin.
- **What it emits:** the class `_s` and one class per method (`._x{--sf-d:0.06}`, in `_.a`, or `_.b` inside a condition: a `hover()` or a media query moves every surface below). The kernel `surface@1` (about 1 kB minified with its registrations and fallback, once, in `_.k`) is two `@container style(--sf-p: ...)` rules that alternate two registered `<color>` properties, `--sf-e` and `--sf-o`, because a property cannot read itself; the step `--sf-d` is not registered, since it may contain `l`, which only means something inside `oklch(from …)`. Its names are `--sf-*`; frame's are `--fr-*`, so a frame and a surface can be one element, or nest in each other, with no collision.
- **Not a contrast guarantee.** A lightness threshold of 0.5636 gives 4.6:1 at the worst on greys, but 3.7:1 on 3 000 random chromatic colours (research, Chrome). `ink()` on a saturated surface can fall short of WCAG AA. For a ratio, declare the colours as tokens and use `css.check.contrast` (see Themes): it checks the declared pair at build time, which the kernel cannot do because it never sees the parent.
- **Browsers.** The kernel needs `@container style()` on custom properties (Chrome 111, Safari 18, Firefox 151), `@property` (Chrome 85, Safari 16.4, Firefox 128) and relative colour (Chrome 122, Safari 18, Firefox 128). Chrome 119 to 121 and Safari 16.4 to 17.6 have an early relative colour with other channel scales: the steps come out wrong (in Chrome `l` is a number from 0 to 100), so the kernel's `requires` asks for the whole feature (`exact`, see Plugins) and a target set that holds one of them gets the warning. Safari 17 has no style queries, so it gets the runtime as well, which does not change the steps; Chrome 120 has style queries and gets no runtime, only the warning. For a target that has `@property` and relative colour but lacks style queries (Firefox 128 to 150) the build ships the same fallback as `frame()`: the shared `cssints/parent-vars` script (one observer however many plugins use it) copies each surface's colour to its surface children. A surface that is also a frame needs both transition sentinels, so the fallback has a rule for `._s._f`. Below `@property` or relative colour the kernel is a build warning: a surface keeps no tonal step there.
- **Limits of the runtime** are frame's: about two or three times the style-query kernel on a first pass, shadow roots are not crossed, a first paint before the script runs shows the `canvas`-based colours, and a `transition` of your own on a surface replaces the sentinel that lets `:hover` and media conditions reach the script.

### Icons: `@cssints/icons` (decided 2026-10-02, cssints-1x1o)

An icon is a style written on `style()`: a marker class, a mask kernel and one atomic class per icon that holds the SVG as a data URL. There is no runtime. Install `@cssints/icons` and a collection (`@iconify-json/mdi`), or point it at a folder of `.svg` files.

```ts
import { cn, color, width } from "cssints" with { type: "cssints" };
import { icons } from "@cssints/icons" with { type: "cssints" };

// icons.ts: a build-time module (it runs while the build runs, and never reaches the browser)
export const mdi = icons<typeof import("@iconify-json/mdi/icons.json")>({
	provider: "iconify-json",
	collection: "mdi",
});
export const brand = icons({ provider: "fs", dir: "src/icons" });

// a component imports them from there: import { mdi, brand } from "./icons.ts" with { type: "cssints" }
export const close = cn(mdi("close"), color("crimson"), width("1.5em"));
export const logo = brand("logo");
export const typo = mdi("clos"); // error: not an icon of mdi
```

```css
/* kernel icon-mask@1, layer _.k; LightningCSS adds -webkit-mask for your targets */
._i { display: inline-block; width: 1em; height: 1em; background-color: currentColor; mask: var(--_svg) no-repeat center / 100% 100%; }
/* the only per-icon rule */
._x1 { --_svg: url("data:image/svg+xml,%3Csvg …"); }
```

- **`icons({ provider: "iconify-json", collection })`** reads `@iconify-json/<collection>/icons.json` from the `node_modules` of the working directory, while the module runs. **`icons({ provider: "fs", dir })`** reads `<dir>/<name>.svg` (`dir` is relative to the working directory; the SVG needs a `viewBox`). The result is a function of the icon name: `mdi("home")` is a style that goes into `cn()`, `cx()` and the conditions like any member. Call `icons()` in a module of its own, imported with the attribute, as above.
- **Names.** TypeScript cannot read a module type from a string, so the names of a collection come from the type argument: `icons<typeof import("@iconify-json/mdi/icons.json")>(…)` types `mdi(name)` as the icons and aliases of that collection, and a typo is an error in the editor. Without the type argument, and for `fs`, a name is any string. In every case a name that does not exist is a build error at the call, with the nearest name when it is close: `cssints: icons: no icon "hom" in iconify-json mdi, did you mean home?`.
- **Mask or image.** An icon that paints with `currentColor` (every one-colour icon of a collection) gets the marker `_i` and takes the text `color`. Any other (a logo with its own colours) gets `_ic`, a background image. This is iconify's own rule. A non-square icon is centred on a square view box, so `width` and `height` set its size (`1em` by default).
- **Cost.** The kernel is printed once. Each icon adds one class, and the same icon is the same class everywhere. The kernel has no `requires`: LightningCSS adds `-webkit-mask` for targets that have only the prefixed form.
- **Not yet:** the iconify HTTP API (it would need a lockfile), names generated for `fs`, a name transform, and watching the SVG files in dev (a changed file needs a restart).

### Publishing a library (decided 2026-10-02, cssints-0l3f)

A package written on cssints ships JavaScript that still has the attribute, and its `.d.ts`. The app that installs it evaluates the package with its own engine: one sheet, the app's browserslist and themes, and a token, a kernel or an `@property` of the package is made once however many modules use it. Nothing is declared: the engine recognises a file by `with { type: "cssints" }`, the same marker as in app code.

```ts skip
// src/index.ts of the library
import { _cv } from "cssints";
import { bg, cn, cv, hover, p } from "cssints" with { type: "cssints" };

import { t } from "./tokens.ts" with { type: "cssints" };

export { t };
export const card = cn(p(4), bg(t.color.brand));
export const button = _cv(cv({ base: cn(p(2), hover(bg("#1d4ed8"))) }));
```

```ts skip
// in the app: the style is a class string, the token is imported with the attribute to be used or themed
import { createGlobalTheme } from "cssints" with { type: "cssints" };
import { button, card } from "my-ui";
import { t } from "my-ui" with { type: "cssints" };

createGlobalTheme(t, ".dark", { color: { brand: "#ef4444" } });
```

- **Build with tsdown** (`vp pack`), with `cssints` external and `dts: true`. tsdown keeps the import attributes, so there is no option to set. It also merges `import { _cv } from "cssints"` into the attributed import of the same module; the engine reads `cx` and `_cv` as runtime wherever they are written, so that is fine. Do not minify, bundle or transform the JS further with a tool that drops import attributes, and do not bundle `cssints` into it.
- **Keep in the package:** `cssints` in `peerDependencies` (the app needs it to build; a library that imports it must list it), the JS with the attributes, the `.d.ts` (it types `cssints` members as class strings and tokens as tokens, so the app is checked across the boundary), and no `.css` file: the library has no sheet of its own.
- **The app needs cssints and its plugin.** The package has no classes until the app's `cssints()` plugin has evaluated it, so an app without cssints cannot use it. Pre-compiled output (class strings plus a sheet fragment for apps without cssints) is not supported yet; it waits for a first user.
- **The package must be a direct dependency of the app.** `cssints/vite` reads the `package.json` of the app and of each of its dependencies, and for a dependency that lists `cssints` it adds the package to `optimizeDeps.exclude` (the dev optimizer would pre-bundle it with esbuild and drop the attributes) and to `ssr.noExternal` (the engine's runner would otherwise load it as native Node, which does not know the attribute). This is a few file reads at startup, one per dependency, and nothing else. A package that is only a dependency of another package is not found; add it to the app's own dependencies (or to those two options).
- **Dev and HMR.** The package's files go through the engine like app files, one evaluation per module, and are served as `/node_modules/…/index.js` with the classes replaced. They are never watched, so a package does not change during `vite dev`: restart the server after reinstalling it.
- A file of a package that does not carry the attribute is never parsed by the engine.

### Browser support and what 0.1 does not have

- **Types and checks for every property** are generated from [mdn-data](https://github.com/mdn/data) and @webref/css by `packages/css-grammar` (`bun run extract`), not written by hand, so a new property or function needs no change here. 536 members: 525 properties (every standard and experimental one, except the three shorthands above) and the 11 short names.
- **Browser support** comes from [`@mdn/browser-compat-data`](https://github.com/mdn/browser-compat-data) against browserslist, as build warnings (see above). There is no per-property table in the types.
- **Not in 0.1:** pseudo-elements and parent states, derived tokens, slot variants, a typed runtime token setter, icons (the plugin API they are written on is above; `frame()` is in `cssints/frame`, `surface()` in `cssints/surface`), polyfills of its own for missing browser features. The map and the reasons are in [wayfinder.md](wayfinder.md).
