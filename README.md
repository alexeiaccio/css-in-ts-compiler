# CSS-in-TS

A compile-time CSS-in-TypeScript compiler with hash-based class names, following StyleX and vanilla-extract patterns. Built with Effect TypeScript and LightningCSS.

## Overview

CSS-in-TS provides:

- **Type Safety**: Full TypeScript types for CSS values using template literals
- **Compile-Time Processing**: Macros generate CSS at build time (zero runtime overhead)
- **Atomic CSS**: Automatic atomic class generation for minimal bundle size
- **CSS Layers**: Cascade layer support for specificity management
- **LightningCSS**: Built on LightningCSS for optimization and vendor prefixing
- **Effect TypeScript**: Functional programming patterns for reliability

## Tech Stack

- [Effect TypeScript](https://effect.website/) - Functional programming and error handling
- [LightningCSS](https://lightningcss.dev/) - CSS parsing and transformation
- [Parcel Macros](https://parceljs.org/features/macros/) - Compile-time code execution
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Bun](https://bun.sh/) - Fast JavaScript runtime and package manager

## Quick Start

### 1. Install Packages

```bash
bun add cssints
bun add -D @cssints/postprocessor
```

### 2. Use in Your Code

```typescript
// Component.tsx
import * as css from "cssints" with { type: "cssints" };

// Atomic utilities
const padding = css.p(4); // → "_a1b2c3"
const margin = css.m(2); // → "_d4e5f6"
const flex = css.flex(); // → "_g7h8i9"

// Complex calculations
const width = css.calc("100vw", "-", "2rem"); // → "_x1y2z3"

// Combine classes
const className = css.cn(padding, margin, flex);
// Result: "_a1b2c3 _d4e5f6 _g7h8i9"
```

### 3. Generated CSS

```css
@layer _.b {
	._a1b2c3 {
		padding: 1rem;
	}
	._d4e5f6 {
		margin: 0.5rem;
	}
	._g7h8i9 {
		display: flex;
	}
	._x1y2z3 {
		width: calc(100vw - 2rem);
	}
}
```

## Packages

### `cssints` - Macro Package

Type-safe CSS utility functions that generate placeholder CSS at compile time.

```typescript
import { p, m, flex, calc, cn, rgb, hsl, token } from "cssints";

// Spacing
p(4); // padding: 1rem
px(4); // padding-left/right: 1rem
py(2); // padding-top/bottom: 0.5rem
m(4); // margin: 1rem

// Layout
flex(); // display: flex
grid(); // display: grid
block(); // display: block

// Calculations
calc("100vw", "-", "2rem"); // calc(100vw - 2rem)
min("100vw", "100%"); // min(100vw, 100%)
max("50px", "10%"); // max(50px, 10%)

// Colors
rgb(255, 128, 0); // rgb(255, 128, 0)
hsl(30, 100, 50); // hsl(30, 100%, 50%)
oklch(0.7, 0.2, 30); // oklch(0.7 0.2 30)
hex("#3b82f6"); // #3b82f6

// Tokens
token.color("#3b82f6", { var: "color-primary" });
token.length("1rem", { var: "spacing-md" });

// Merge classes
cn(p(4), m(2), flex()); // "_hash1 _hash2 _hash3"
```

### `@cssints/postprocessor` - CSS Processor

Transforms placeholder CSS into optimized, production-ready CSS.

```typescript
import { processCSS } from "@cssints/postprocessor";
import { Effect } from "effect";

const placeholderCSS = `
  @atomic padding 1rem { }
  @atomic margin 0.5rem { }
  @calc _abc123 100vw - 2rem { }
`;

const result = await Effect.runPromise(processCSS(placeholderCSS, { minify: true }));

console.log(result.code);
// @layer _.b{._a1b2c3{padding:1rem}._d4e5f6{margin:.5rem}._abc123{width:calc(100vw - 2rem)}}
```

## Architecture

### 1. Macro Phase (Compile Time)

TypeScript functions generate placeholder CSS:

```typescript
// Source
const className = css.p(4);

// Macro expansion (what Parcel does at build time)
this.addAsset({
	type: "css",
	content: "@atomic padding 1rem { }",
});
return "_a1b2c3";
```

### 2. Post-Processing (Build Time)

The placeholder CSS is transformed by `@cssints/postprocessor`:

```
@atomic padding 1rem { }          →  ._a1b2c3 { padding: 1rem; }
@calc _abc123 100vw - 2rem { }    →  ._abc123 { width: calc(100vw - 2rem); }
```

### 3. CSS Layers

All utility classes are wrapped in `@layer _.b` for specificity control:

```css
@layer _.a, _.b, _.c; /* Declare layer order */

@layer _.b {
	/* Utilities layer */
	._a1b2c3 {
		padding: 1rem;
	}
	._d4e5f6 {
		margin: 0.5rem;
	}
}
```

## Demo

Check out the [demo app](apps/demo/) for a working example:

```bash
cd apps/demo
bun install
bun run dev
```

## Project Structure

```
.
├── packages/
│   ├── cssints/              # Macro functions
│   │   ├── src/
│   │   │   ├── calc.ts       # Calculation functions
│   │   │   ├── color.ts      # Color functions (rgb, hsl, oklch, etc.)
│   │   │   ├── tokens.ts     # CSS token system
│   │   │   ├── property.ts   # @property generator
│   │   │   └── types/        # Type definitions
│   │   └── package.json
│   │
│   └── cssints-postprocessor/  # CSS transformation
│       ├── src/
│       │   ├── index.ts       # Main processCSS function
│       │   └── visitors/      # LightningCSS visitors
│       └── package.json
│
├── apps/
│   └── demo/                  # Vite + React demo app
│
└── examples/
    └── 01-basic/             # Basic usage examples
```

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run postprocessor tests specifically
bun test --run packages/cssints-postprocessor

# Type check
bun run lint:check
```

## Roadmap

- [x] Core macro functions (spacing, layout, calc, colors)
- [x] Postprocessor with LightningCSS
- [x] CSS layers support
- [x] Token system with @property
- [x] Integration tests
- [x] Demo app
- [ ] Vite plugin for seamless integration
- [ ] Parcel integration for macro expansion
- [ ] Plugin API for custom transformations
- [ ] Media query support
- [ ] Theme system
- [ ] CLI tool

## License

MIT
