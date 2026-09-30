# CSS in TS

The 0.1 API. Setup (the Vite plugin, the stylesheet import) is in the [README](../README.md). Decisions and findings are in [wayfinder.md](wayfinder.md).

Every `ts` block here is type-checked against the workspace `cssints` types by `packages/cssints/test/docs.mjs` (`bun run test`). A line that ends in `// error` must fail to type-check. Blocks fenced `ts skip` (output) are not checked. A few blocks show a build-time error that the types cannot see; their comments give the message.

### Authoring surface (decided 2026-09-29, cssints-5dbi)

- **Import.** `with { type: "cssints" }` marks code that runs at build time: cssints itself, plugins such as icons, and your own helper modules. The plugin finds call sites by this attribute. Runtime helpers (`cx`, `_cv`) are imported without it. Using a build-time member without the attribute is a build error.
- **Names.** Every mdn property as camelCase (`paddingLeft`, `alignItems`, `justifyContent`), plus a short set: `p pt pr pb pl`, `m mt mr mb ml`, `bg`. Everything is available both as named exports and through the namespace (`css.p`). There is no `items` or `justify`: they were ambiguous (`align-items` or `align-content`, `justify-content` or `justify-items`).
- **Numbers.** A bare number is a spacing step of 0.25rem in `padding*`, `margin*`, `gap*` and `inset*` (`p(4)` is `1rem`). In any other property it is a CSS `<number>`: `opacity(0.5)`, `zIndex(3)`.
- **Values.** A property takes one or more parts joined by a space. Each part is a string or a Typed OM value: `border("1px solid", accent)`, `padding(CSS.rem(1), CSS.rem(2))`, `padding("1rem 2rem")`. Parts are checked against the mdn grammar in types and again at build time. `CSS.px`, `rem`, `em`, `percent`, `number`, `CSSUnitValue` and `CSSColorValue` come from `cssints`, imported with the attribute.
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
- **One sheet.** All rules are in `virtual:cssints.css`, each once, sorted by layer, then condition, then shorthand before longhand (`border` before `border-top`), then class name. A longhand wins whatever the order of the arguments.
- **A layout context** gives one string: `flex().alignItems("center")` is `"_1s47490 _1ob5z5m"`.
- **Also exported:** `css` (the namespace as a value) and `cn`, `cv`, `media`, `container`, `supports`, `token`, `style`, `createTokens`, `createGlobalTheme`, `check`. `cx` and `_cv` are the only runtime exports.

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
- **The sheet:** token sets and themes are rules of layer `_.k`, after the global rules and before the class layers. They set custom properties only, and no class does, so the layer order never decides between them; `_.k` is the lowest layer, so your own unlayered `--color-bg` rule wins over a theme. The `:root` rules of aliases come first, then themes under a condition, then themes under a selector, each in source order, so a selector theme beats a condition theme on the same element. A module has the rules of the tokens it uses, from wherever they were made, and its own; import a theme module (`import "./theme.ts"`) to have all of it.
- **`css.check.contrast(fg, bg, { min })`** computes the WCAG 2.x contrast ratio (`min` from 1 to 21) for the default values and for every theme that sets either token or one they are aliases of. It reads themes one at a time, not their combinations. A ratio below `min` is a build error that names the theme and both resolved values (the ratio is cut, not rounded: 4.499 is 4.49). A value the check cannot evaluate (`color-mix()`, a relative colour, `light-dark()`, `currentColor`, a system colour) or a translucent one is a warning that names the token. The colour library (culori, `culori/fn`: 27 kB minified, 9 kB gzipped) is build-only and never ships. The check runs when its module has run, and again at the end of a build over the themes of every module.

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

### Browser support and what 0.1 does not have

- **Types and checks for every property** are generated from [mdn-data](https://github.com/mdn/data) and @webref/css by `packages/css-grammar` (`bun run extract`), not written by hand, so a new property or function needs no change here. 536 members: 525 properties (every standard and experimental one, except the three shorthands above) and the 11 short names.
- **Browser support** comes from [`@mdn/browser-compat-data`](https://github.com/mdn/browser-compat-data) against browserslist, as build warnings (see above). There is no per-property table in the types.
- **Not in 0.1:** pseudo-elements and parent states, derived tokens, slot variants, a typed runtime token setter, a public plugin API (icons, `frame()`, `surface()`), polyfills for missing browser features. The map and the reasons are in [wayfinder.md](wayfinder.md).
