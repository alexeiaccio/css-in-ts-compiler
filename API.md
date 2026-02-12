# CSS in TS

### Basic usage

```tsx
import { cx } from "css-variants";
import { p, display } from "cssints" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

<div className={cx(display("flex"), p(4))}>Hello, world!</div>;
```

### Breakpoints

```ts
import { cx } from "css-variants";
import * as css from "cssints" with { type: "cssints" };

const { md } = createMediaQueries({
	md: "screen and min-width > 40rem",
});

const styles = cx(css.p(2), md(css.pl("8ch"), css.pt(css.pxToRem("16px"))));
```

Output:

```css
.styles_jdf78hs {
	padding: 0.5rem;
}

@media (screen and min-width > 40rem) {
	.styles_jdf78hs {
		padding-left: 8ch;
		padding-top: 1rem;
	}
}
```

### Tokens

```ts
import { cx } from "css-variants";
import * as css from "cssints" with { type: "cssints" };

const tokens = css.createTokens(
	{
		colors: css.types.color({
			blue: {
				100: "oklch(4.820% 0.0334 264.05)",
				// ...
			},
			// ...
		}),
	},
	(_, path) => kebabCase(path),
);

const styles = cx(css.bg(tokens("colors.blue.100")));
```

Output:

```css
@property --colors-blue-100 {
	syntax: "<color>";
	inherits: true;
	initial-value: oklch(4.82% 0.0334 264.05);
}

.styles_jdf78hs {
	background-color: var(--colors-blue-100);
}
```

### Theme

```ts
import { cx } from 'css-variants'
import * as css from "cssints" with { type: "cssints" };

const tokens = css.createTokens({
	colors: css.types.color({
		blue: {
			100: "unset"
			// ...
		},
		// ...
	}),
}, (_, path) => kebabCase(path));

const { dark } = css.createMediaQueries({
	dark: "(prefers-color-scheme: dark)",
});

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

.styles_jdf78hs {
	background-color: var(--colors-blue-100);
}
```

## Implemetation details

Export all types from `csstype` as CSS.Properties. All methods are just a type mapping to CSS properties.

```tsx
// cssints.ts
import type * as CSS from 'csstype';

interface Properties extends CSS.Properties, MapPseudos<CSS.SimplePseudos>, MapPseudos<CSS.AdvancedPseudos> {
	// Shorthands
	p: CSS.Properties["padding"];
	bg: CSS.Properties["backgroundColor"];
	// ...
}

export {} as Properties;
//

// example.tsx
import * as css from "cssints" with { type: "cssints" };

<div className={cx(css.paadding(4), css.hover(css.bg("red")))}>
	Hello, world!
</div>
```

In compile time convert methods to CSS properties.

```css
.styles_jdf78hs {
	padding: 0.5rem;
}

.styles_jdf78hs:hover {
	background-color: red;
}
```

## Browser Compat

Sadly, [`csstype`](https://github.com/frenic/csstype) has not types for functions (`mix-color` for example). So, we need to make our own, to generate types from [mdn/data](https://github.com/mdn/data) and [`@mdn/browser-compat-data`](https://github.com/mdn/browser-compat-data).

```ts
import bcd from "@mdn/browser-compat-data" with { type: "json" };
import atRules from 'mdn-data/css/at-rules.json' with { type: 'json' };
// ...

// TODO: compiler should generate this

// 1. Types as in `csstype` but with fuctions etc. ??

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
type ColorMix = 
	| `color-mix(in ${ColorInterpolationMethod}, ${Color}, ${Color})`;
	| `color-mix(in ${ColorInterpolationMethod}, ${Color} ${Percentage}, ${Color}`;
	| `color-mix(in ${ColorInterpolationMethod}, ${Color} ${Percentage}, ${Color} ${Percentage})`;

// 2. TS functions for each property etc.

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
declare function colorMix(color1: Color, color2: Color): string
declare function colorMix(color1: Color, color2: Color): string
declare function colorMix(color1: Color, percentage1: Percentage, color2: Color): string
declare function colorMix(color1: Color, percentage1: Percentage, color2: Color, percentage2: Percentage): string
declare function colorMix(colorInterpolationMethod: ColorInterpolationMethod, color1: Color, color2: Color): string
declare function colorMix(colorInterpolationMethod: ColorInterpolationMethod, color1: Color, percentage1: Percentage, color2: Color): string
declare function colorMix(colorInterpolationMethod: ColorInterpolationMethod, color1: Color, percentage1: Percentage, color2: Color, percentage2: Percentage): string

// fns usage variants

css.colorMix('red', 'blue') // → color-mix(in oklch, red, blue)
css.colorMix('srgb', 'red', 0.2, 'blue') // → color-mix(in srgb, red 0.2, blue)
css.colorMix('srgb', 'red', '20%', 'blue', '50%') // → color-mix(in srgb, red 20%, blue 50%)
css.colorMix('lch increasing hue', 'red', 'blue') // → color-mix(in lch increasing hue, red, blue)
```

## References

[Haz's post](https://bsky.app/profile/haz.dev/post/3mebm2mx6jk27)

```
Haz @haz.dev
My dream CSS framework:

⋅ CSS-in-TS
⋅ Composable utilities as fns `md(size(2))`
⋅ Plugins are just fns `custom(flex())`
⋅ Compiled to static CSS by default
⋅ Dynamic when needed `hover(prop)`
⋅ Class order matters

Maybe not possible?

5:13 PM · Feb 7, 2026
```
```
CSS is evolving quickly, but JS/TS are hard to beat for expressiveness, tooling, and type safety.

AI is also better at writing TS and may get even better with TSGO.

Thoughts?
```

```
🤔
I can't stop thinking about this.
Do we really want another CSS framework?

3:26 PM · Feb 10, 2026
```

### 5.5 Setting Variables (the set Mixin)

Variables are set via the set mixin, which is a plugin (part of the preset). It supports two forms:
Namespace form - for config-defined variables:

```ts
// Setting a namespaced variable
css.set.color.$primary("#000");
// → --color-primary: #000

// Setting a top-level variable
css.set.$spacing("0.1em");
// → --spacing: 0.1em

// Setting mid-chain
css.flex.col.set.color.$primary("#000");
// → display: flex; flex-direction: column; --color-primary: #000

// Setting inside a wrapping mixin (e.g., dark mode)
css.dark(css.set.color.$primary("#93c5fd").set.color.$white("#f0f0f0"));
// → @media (prefers-color-scheme: dark) { --color-primary: #93c5fd; --color-white: #f0f0f0 }
```

Callable form - for any variable, including defineVar() variables:

```ts
const custom = css.defineVar();

// Setting a custom variable mid-chain
css.flex.col.set(custom, "value");
// → display: flex; flex-direction: column; --dyn-a7Bk3: value

// Setting a config variable (equivalent to the namespace form)
css.set(css.vars.color.$primary, "#000");
// → --color-primary: #000
```

### 7.2 Custom Helper Functions

Percentage parameters accept both string percentages ("20%") and floating-point numbers between 0 and 1 (0.2) .Both forms are equivalent:

```ts
// color-mix) wrapper all equivalent
css.bg.mix.$primary.$white;
css.bg.mix.$primary.$white (0.5);
css.bg(css.mix.$primary.$white(0.5));
css.bg(css.mix(css.vars.color.$primary, css.vars.color $white, 0.5));
css.bg(css.mix(css.vars.color.$primary, css.vars.color.$white, "50%")) ;
// → background-color: color-mixin srgb, var (--color-primary), var(--color-white) 50%)

// Relative color syntax wrapper for lightening
css.bg.ligthen.$primary; 
css.bg.ligthen $primary (0.1);
css.bg(css.lighten(css.vars.color.$primary, 0.1)); 
css.bg(css.lighten(css.vars.color.$primary, "10%"));
// → background-color: oklch(from var(--color-primary) calc (l + 0.1) c h)

// Relative color syntax wrapper for darkening
css.bg.darken.$primary; 
css.bg.darken.$primary (0.1); 
css.bg(css.darken(css.vars.color.$primary, 0.1));
css.bg(css.darken(css.vars.color.$primary, "10%"));
// → background-color: oklch(from var (--color-primary) calc(l - 0.1) c h)

// Opacity modifier
css.bg.alpha $primary(0.5);
css.bg(css.alpha(css.vars.color-$primary, 0.5));
css.bg (css.alpha(css.vars.color-$primary, "50%"));
// → background-color: oklch(from var(--color-primary) l ch / 50%)
```