# CSS in TS

### Basic usage

```tsx
import { cx } from "css-variants";
import { display, alignItems, justifyContent, padding } from "cssints" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

<div className={cx(display("flex"), alignItems("center"), justifyContent("center"), prop && padding(4))}>
	Hello, world!
</div>;
// or with shorthands
<div className={cx(css.flex(css.items("center"), css.justify("center")), prop && css.p(4))}>Hello, world!</div>;
```

Output:

```tsx
import { cx } from "css-variants";

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
	padding: 0.5rem;
}
```

### Without runtime

```tsx
import * as css from "cssints" with { type: "cssints" };

<div className={css.cn(css.flex(css.items("center"), css.justify("center")), css.p(4))}>Hello, world!</div>;
```

Output:

```tsx
<div className="_fsdfssdf _jdf78hs _jdfsddfs _swg4thgf">Hello, world!</div>
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
	padding: 0.5rem;
}
```

### Breakpoints

```ts
import { cx } from "css-variants";
import * as css from "cssints" with { type: "cssints" };

const md = media("screen and min-width > 40rem");
// or
const [md, lg, xl] = media(
	"screen and min-width > 40rem",
	"screen and min-width >60rem",
	"screen and min-width > 80rem",
);

const styles = cx(css.p(2), md(css.pl("8ch"), prop && css.pt(css.pxToRem("16px"))));

<div className={styles}>Hello, world!</div>;
```

Output:

```tsx
import { cx } from "css-variants";

<div className={cx("_jdf78hs", "_swg4thgf", prop && "_jdfsddfs")}>Hello, world!</div>;
```

```css
._jdf78hs {
	padding: 0.5rem;
}
@media (screen and min-width > 40rem) {
	._jdf78hs._swg4thgf {
		padding-left: 8ch;
	}
}
@media (screen and min-width > 40rem) {
	._jdf78hs._jdfsddfs {
		padding-top: 1rem;
	}
}
```

### Tokens

With style function:

```tsx
const blue = css.token.color("blue", { var: "color-primary", inherit: true });
// or
const blue = css.token.color("blue", "color-primary");

<div style={css.style(css.color(blue), css.token.set(blue, "red"))}>Hello, world!</div>;
```

Output:

```tsx
<div
	style={{
		"--color-primary": "red",
		color: "var(--color-primary)",
	}}
>
	Hello, world!
</div>
```

```css
@property --color-primary {
	syntax: "<color>";
	inherits: true;
	initial-value: blue;
}
```

With class:

```tsx
const blue = css.token.color("blue", false);

// css.token.set(blue, "red") -> will show ts error

<div className={css.cn(css.color(blue))}>Hello, world!</div>;
```

Output:

```tsx
<div className="_jdf78hs">Hello, world!</div>
```

```css
@property --_sdfhgo8f {
	syntax: "<color>";
	inherits: false;
	initial-value: blue;
}
._jdf78hs {
	color: var(--_sdfhgo8f);
}
```

#### Themes (WIP)

```ts
import { cx } from 'css-variants'
import * as css from "cssints" with { type: "cssints" };

const tokens = css.createTokens({
	colors: {
		$type: "color",
		blue: {
			100: "unset",
			// or
			200: "oklch(4.820% 0.0334 264.05)",
			// ...
		},
		// ...
	},
}, (_, path) => kebabCase(path));

const dark = css.media("(prefers-color-scheme: dark)");

// define with media queries
css.createGlobalTheme(tokens, dark, {
	colors: {
		blue: {
			100: "oklch(4.820% 0.0334 264.05)"
			// ...
		},
		// ...
	},
});

// or with class
css.createGlobalTheme(tokens, '.light', {
	colors: {
		blue: {
			100: "oklch(4.820% 0.0334 264.05)"
			// ...
		},
		// ...
	},
});

const styles = cx(css.bg(tokens("colors.blue.100")));

<div className={styles}>Hello, world!</div>
```

Output:

```tsx
import { cx } from "css-variants";

<div className={cx("_jdf78hs")}>Hello, world!</div>;
```

```css
@property --colors-blue-100 {
	syntax: "<color>";
	inherits: true;
	initial-value: unset;
}
@media (prefers-color-scheme: dark) {
	--colors-blue-100: oklch(4.82% 0.0334 264.05);
}
.light {
	--colors-blue-100: oklch(4.82% 0.0334 264.05);
}
._jdf78hs {
	background-color: var(--colors-blue-100);
}
```

### Functions

#### `cn` — Compile type class Merger

Merges class names from type to string. And resolve class order specificity.

```ts
// branded type for any function
type CSSintsFn = ((...args: any[]) => string) & { __brand: "cssints" };

declare function cn<T extends CSSintsFn>(...args: T[]): string;
```

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
