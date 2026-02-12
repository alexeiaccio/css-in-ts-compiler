# CSS in TS

### Basic usage

```tsx
import { p, display } from "cssints" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

<div className={css.cx(display("flex"), p(4))}>
	Hello, world!
</div>
```

### Breakpoints

```ts
import * as css from "cssints" with { type: "cssints" };

const { md } = createMediaQueries({
	md: "screen and min-width > 40rem",
});

const styles = css.cx(
	css.p(2),
	md(css.pl("8ch"), css.pt(css.pxToRem("16px"))),
);
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
import * as css from "cssints" with { type: "cssints" };

const tokens = css.createTokens({
	colors: css.types.color({
		blue: {
			100: "oklch(4.820% 0.0334 264.05)"
			// ...
		},
		// ...
	}),
}, (_, path) => kebabCase(path));

const styles = css.cx(css.bg(tokens("colors.blue.100")));
```

Output:

```css
@property --colors-blue-100 {
	syntax: "<color>";
	inherits: true;
	initial-value: oklch(4.820% 0.0334 264.05);
}

.styles_jdf78hs {
	background-color: var(--colors-blue-100);
}
```

### Theme

```ts
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

const styles = css.cx(css.bg(tokens("colors.blue.100")));

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
	--colors-blue-100: oklch(4.820% 0.0334 264.05);
}

.light {
	--colors-blue-100: oklch(4.820% 0.0334 264.05);
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

<div className={css.cx(css.paadding(4), css.hover(css.bg("red")))}>
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

Sadly, [`csstype`](https://github.com/frenic/csstype) has not types for functions (`mix-color` for example). So, we need to make our own, to generate types from [`@mdn/browser-compat-data`](https://github.com/mdn/browser-compat-data).

## Browser Compat

```ts
import bcd from '@mdn/browser-compat-data' with { type: 'json' };

// TODO: compiler should generate this
// 1. Types as in `csstype` but with fuctions etc.
// 2. TS functions for each property etc.
```