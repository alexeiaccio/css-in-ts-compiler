# CSS in TS

### Authoring surface (decided 2026-09-29, cssints-5dbi)

- **Import.** `with { type: "cssints" }` marks code that runs at build time: cssints itself, plugins such as icons, and your own helper modules. The plugin finds call sites by this attribute. Runtime helpers (`cx`, `_cv`) are imported without it. Using a build-time member without the attribute is a build error.
- **Names.** Every mdn property as camelCase (`paddingLeft`, `alignItems`, `justifyContent`), plus a short set: `p pt pr pb pl`, `m mt mr mb ml`, `bg`. Everything is available both as named exports and through the namespace (`css.p`). There is no `items` or `justify`: they were ambiguous (`align-items` or `align-content`, `justify-content` or `justify-items`).
- **Numbers.** A bare number is a spacing step of 0.25rem in `padding*`, `margin*`, `gap*` and `inset*` (`p(4)` is `1rem`). In any other property it is a CSS `<number>`.
- **Values.** A property takes one or more parts joined by a space. Each part is a string or a Typed OM value: `border("1px solid", accent)`, `padding(CSS.rem(1), CSS.rem(2))`, `padding("1rem 2rem")`. Parts are checked against the mdn grammar in types and again at build time.
- **Layout contexts.** `flex()` and `grid()` set `display` and chain only their container properties. Names drop only the context prefix: `flex().direction("column").wrap("wrap").alignItems("center").justifyContent("space-between")`, `grid().templateColumns("1fr 2fr").gap(4)`. Plain styles do not chain; merge them with `cn(...)` or `cx(...)`. Item properties (`flexGrow`, `alignSelf`, `gridColumn`, `order`) are plain functions.

### Basic usage

```tsx
import { cx } from "cssints";
import { alignItems, justifyContent, p } from "cssints" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

<div className={cx(css.display("flex"), alignItems("center"), justifyContent("center"), prop && p(4))}>Hello, world!</div>;
// or with a layout context
<div className={cx(css.flex().alignItems("center").justifyContent("center"), prop && css.p(4))}>Hello, world!</div>;
```

Output:

```tsx
import { cx } from "cssints";

<div className={cx("_fsdfssdf _jdf78hs _jdfsddfs", prop && "_swg4thgf")}>Hello, world!</div>;
```

```css
._fsdfssdf {
	display: flex;
}
._jdf78hs {
	align-items: center;
}
._jdfsddfs {
	justify-content: center;
}
._swg4thgf {
	padding: 1rem;
}
```

The package that ships `cx` to the browser is decided in the "One runtime package" ticket (cssints-lo9x).

### Without runtime

```tsx
import * as css from "cssints" with { type: "cssints" };

<div className={css.cn(css.flex().alignItems("center").justifyContent("center"), css.p(4))}>Hello, world!</div>;
```

Output:

```tsx
<div className="_fsdfssdf _jdf78hs _jdfsddfs _swg4thgf">Hello, world!</div>
```

### Conditions and layers (decided 2026-09-29, cssints-kpq1)

Conditions are wrapper functions. A wrapper takes styles and returns them under its condition. Wrappers nest.

```ts
import { cx } from "cssints";
import * as css from "cssints" with { type: "cssints" };

const md = css.media("(width >= 40rem)");
const [md, lg] = css.media("(width >= 40rem)", "(width >= 60rem)");
const { md, lg } = css.media({ md: "(width >= 40rem)", lg: "(width >= 60rem)" });
const dark = css.media("(prefers-color-scheme: dark)");
const narrow = css.container("sidebar (width < 30rem)");
const grid = css.supports("(display: grid)");

const styles = cx(
	css.p(2),
	md(css.pl("8ch"), css.pt(4)),
	css.hover(css.bg("#eee")),
	md(css.hover(css.bg("#ddd"))),
	prop && lg(css.p(8)),
);
```

- **Pseudo-classes** are ready-made wrappers named after the selector: `hover`, `focus`, `focusVisible`, `active`, `disabled`, and so on. The list comes from mdn-data `selectors.json`.
- **Query strings are checked** against the mdn-data grammar (`<media-query-list>`, `<container-condition>`, `<supports-condition>`), in types and at build time, like property values. A range needs parentheses: `(width > 40rem)`, not `min-width > 40rem`.
- **Layer = number of conditions.** A style with no condition goes to `_.a`, one condition to `_.b`, two to `_.c`, and so on up to `_.e`. A fifth condition is a build error. A media query, a container query, `supports` and a pseudo-class each count as one.
- **Order inside a layer** comes from the sorted stylesheet: min-width ascending, then pseudo-class order. With equal layers, `hover(...)` beats `md(...)` by specificity.
- **Class names** hash the declaration together with its condition chain.
- Pseudo-elements (`::before`, `::placeholder`) and parent states (`group-hover`) are not part of 0.1.

Output:

```css
@layer _.a, _.b, _.c, _.d, _.e;
@layer _.a {
	._a1 { padding: 0.5rem; }
}
@layer _.b {
	._b1:hover { background-color: #eee; }
	@media (width >= 40rem) {
		._b2 { padding-left: 8ch; }
		._b3 { padding-top: 1rem; }
	}
	@media (width >= 60rem) {
		._b4 { padding: 2rem; }
	}
}
@layer _.c {
	@media (width >= 40rem) {
		._c1:hover { background-color: #ddd; }
	}
}
```

### Tokens (decided 2026-09-29, cssints-o00x)

A token is a Typed OM value whose `toString()` is `var(--name)`. It fits anywhere a value of its type fits: `color(blue)`, `border("1px solid", blue)`.

```ts
import * as css from "cssints" with { type: "cssints" };

const blue = css.token.color("blue", "color-primary");                    // --color-primary, can be set
const gap = css.token.length("16px", { var: "gap", inherit: false });
const muted = css.token.color("#6b7280");                                 // --_<hash>, private

<div className={css.cn(css.color(blue), css.gap(gap))} />;
<div style={css.style(css.color(blue), css.token.set(blue, "red"))} />;   // { "--color-primary": "red", color: "var(--color-primary)" }
// css.token.set(muted, "red") is a type error: private tokens cannot be set
```

- **Types:** `token.<type>` exists for the types that `@property` `syntax` allows: `color`, `length`, `percentage`, `lengthPercentage`, `number`, `integer`, `angle`, `time`, `customIdent`, `transformList`. `resolution`, `image` and `url` wait for their grammars. The initial value is checked against that type's grammar, in types and at build time. A browser drops an `@property` rule whose initial value depends on a font size, so `1rem`, `1em` and `1ch` are a build error: write `16px`.
- **Names:** a name (a string, or `{ var, inherit }`) gives `--name`, and the token can be set. Without a name the variable is `--_<hash>` of the file and site, and the token is private. `inherits` defaults to `true`.
- **Output:** one `@property` per token at the top of the global sheet, outside the layers.

```css
@property --color-primary {
	syntax: "<color>";
	inherits: true;
	initial-value: blue;
}
```

- **`style()` and `token.set()`** are build-time and take static values; the result is a style object. A dynamic value is set with a plain `style={{ "--color-primary": value }}`; a typed runtime setter is not part of 0.1.
- Design-token constraints and math (DTCG, Ariakit Tailwind) are researched in cssints-kag5.

#### Themes (decided 2026-09-29, cssints-exof)

Tokens come from an inline DTCG-shaped `const` object. Every leaf is a token (see "Tokens") reached by property access. Values are DTCG values or CSS strings checked by the grammar of their `$type`. Aliases use DTCG `{path}` references.

```ts
import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
	color: {
		$type: "color",
		bg: { $value: "#ffffff" },
		fg: { $value: "#111827" },
		accent: { $value: "oklch(62% 0.19 259)" },
		link: { $value: "{color.accent}" },
	},
	space: { $type: "dimension", md: { $value: "1rem" } },
});

const dark = css.media("(prefers-color-scheme: dark)");
css.createGlobalTheme(t, dark, { color: { bg: "#0b0b0f", fg: "#f3f4f6" } });
css.createGlobalTheme(t, ".light", { color: { bg: "#fff" } });

css.check.contrast(t.color.fg, t.color.bg, { min: 4.5 });

<div className={css.cn(css.bg(t.color.bg), css.color(t.color.fg), css.p(t.space.md))} />;
```

- **Names:** the variable name is the kebab-case path (`--color-bg`). A second argument to `createTokens` can map a path to a name.
- **Themes:** `createGlobalTheme(tokens, condition | selector, overrides)` re-declares the overridden tokens under a media or container condition (on `:root`), or under a selector. Overrides are checked against the token types, and an unknown path is a type error.
- **Aliases:** `@property initial-value` must be computationally independent, so it gets the flattened literal. The alias stays live as a `var()` declaration on `:root`. A theme re-declares the tokens that depend on an overridden one.
- **`css.check.contrast(fg, bg, { min })`** computes the WCAG 2.x contrast ratio for the default values and for every theme at build time. A ratio below `min` is a build error that names the theme and both values. A value the check cannot evaluate (for example `color-mix()`) is a warning that names the token. The colour library is build-only and never ships.

Output:

```css
@property --color-bg { syntax: "<color>"; inherits: true; initial-value: #ffffff; }
@property --color-link { syntax: "<color>"; inherits: true; initial-value: oklch(62% 0.19 259); }
:root { --color-link: var(--color-accent); }
@media (prefers-color-scheme: dark) {
	:root { --color-bg: #0b0b0f; --color-fg: #f3f4f6; }
}
.light { --color-bg: #fff; }
```

Derived tokens (`contrastColor()`, `derive()`), JSON input with generated types and slot variants are not part of 0.1.

### Runtime: `cx`, `cn`, `cv` (decided 2026-09-29, cssints-lo9x)

- **One runtime package: `cssints` itself.** `import { cx, _cv } from "cssints"` has no attribute and is the only code that ships to the browser. `@cssints/variants` is gone.
- **`cx(...)`** joins strings, skips falsy values and flattens nested arrays: `cx(base, on && p(4), [a, b])`. It takes no clsx-style objects; write `cond && style` instead.
- **`cn(...)`** runs at build time only. Under the attribute, `cn(p(4), bg("red"))` becomes one class string, and nothing is left at runtime.
- **`cv(config)`** takes `css.*` values, so types check them:

```ts
import { cn, cv, fontSize, p } from "cssints" with { type: "cssints" };

const button = cv({
	base: cn(p(2), fontSize("1rem")),
	variants: { size: { sm: p(1), lg: cn(p(4), fontSize("1.25rem")) } },
	defaultVariants: { size: "sm" },
});
// runtime: button({ size: "lg" }) -> class string, via _cv
```

The CSS-string form of `cv` is removed. Slot variants (`scv`) are not part of 0.1.

## Browser Compat (JUST IDEA)

Sadly, [`csstype`](https://github.com/frenic/csstype) has not types for functions (`mix-color` for example). So, we need to make our own, to generate types from [mdn/data](https://github.com/mdn/data) and [`@mdn/browser-compat-data`](https://github.com/mdn/browser-compat-data).

```ts
import bcd from "@mdn/browser-compat-data" with { type: "json" };
import atRules from "mdn-data/css/at-rules.json" with { type: "json" };
// ...

// TODO: compiler should generate this
// TS functions for each property etc.

/**
 * Mix two colors with interpolation.
 *
 * **Syntax**: `color-mix( <color-interpolation-method> , [ <color> && <percentage [0,100]>? ]#{2})`
 *
 * | Chrome   | Firefox    | Safari    |  Edge   |
 * | :------: | :--------: | :-------: | :-----: |
 * | **111**  |  **1113**  | **16.2**  | **111** |
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Values/color_value/color-mix
 */
declare function colorMix(color1: Color, color2: Color): string;
declare function colorMix(color1: Color, color2: Color): string;
declare function colorMix(color1: Color, percentage1: Percentage, color2: Color): string;
declare function colorMix(color1: Color, percentage1: Percentage, color2: Color, percentage2: Percentage): string;
declare function colorMix(colorInterpolationMethod: ColorInterpolationMethod, color1: Color, color2: Color): string;
declare function colorMix(
	colorInterpolationMethod: ColorInterpolationMethod,
	color1: Color,
	percentage1: Percentage,
	color2: Color,
): string;
declare function colorMix(
	colorInterpolationMethod: ColorInterpolationMethod,
	color1: Color,
	percentage1: Percentage,
	color2: Color,
	percentage2: Percentage,
): string;

// fns usage variants

css.colorMix("red", "blue"); // → color-mix(in oklch, red, blue)
css.colorMix("srgb", "red", 0.2, "blue"); // → color-mix(in srgb, red 0.2, blue)
css.colorMix("srgb", "red", "20%", "blue", "50%"); // → color-mix(in srgb, red 20%, blue 50%)
css.colorMix("lch increasing hue", "red", "blue"); // → color-mix(in lch increasing hue, red, blue)
```

```ts
declare const __type: unique symbol;
type Type<__Type> = { [__type]: __Type };
type Typed<T, __Type> = T & Type<__Type>;
function createTypeed<T, __Type>(value: T): Typed<T, __Type> {
	return value as Typed<T, __Type>;
}
```

```ts
// types.gen.ts

/**
 * @groups CssTypes
 * @status Standard
 * @see https://developer.mozilla.org/docs/Web/CSS/angle
 */
export type Angle = Typed<number | `${number}deg` | `${number}rad` | `${number}grad` | `${number}turn`, "Angle">;
// ...
export type Zero = Typed<0, "Zero">;

// syntaxes.get.ts

export type HueRotate = Typed<(angle?: Angle | Zero) => string, "HueRotate">;
// ...
```
