# Vanilla-Extract vs Our CSS-in-TS Compiler: Deep Comparison

This document analyzes how [vanilla-extract](https://vanilla-extract.style) handles design tokens and CSS generation, comparing it to our approach.

---

## Overview

Vanilla-extract is a zero-runtime CSS-in-TypeScript library that generates static CSS files at build time. It provides type-safe styling with full CSS feature support while maintaining zero runtime overhead.

Key features:

- Zero-runtime stylesheets in TypeScript
- Type-safe theme contracts
- Framework agnostic (webpack, esbuild, Vite, Next.js)
- Generates atomic CSS with hash suffixes

---

## Token System

### Vanilla-Extract Theme System

Vanilla-extract uses `createTheme` to define tokens:

```typescript
import { createTheme,vanilla-extract style } from '@/css';

export const [themeClass, vars] = createTheme({
  color: {
    brand: '#3b82f6',
    white: '#ffffff',
  },
  space: {
    small: '4px',
    medium: '8px',
    large: '16px',
  },
});
```

Generates:

```css
:root {
	--color-brand__ya5b7b0: #3b82f6;
	--color-white__ya5b7b1: #ffffff;
	--space-small__ya5b7b2: 4px;
	--space-medium__ya5b7b3: 8px;
	--space-large__ya5b7b4: 16px;
}

.themeClass {
	background-color: var(--color-brand__ya5b7b0);
}
```

### Theme Contracts (Type-Safe)

For stricter typing, use `createThemeContract`:

```typescript
import { createThemeContract, style } from "@vanilla-extract/css";

export const vars = createThemeContract({
	color: {
		brand: null,
		text: null,
	},
	space: {
		small: null,
		medium: null,
		large: null,
	},
});

export const [themeClass, vars] = createTheme(vars, {
	color: {
		brand: "#3b82f6",
		text: "#1a1a1a",
	},
	space: {
		small: "4px",
		medium: "8px",
		large: "16px",
	},
});
```

### Our Implementation

```typescript
// tokens.ts
const defaultTokens = {
	color: {
		primary: { $value: "#3b82f6", $type: "color" },
		secondary: { $value: "#6366f1", $type: "color" },
	},
	spacing: {
		small: { $value: "4px", $type: "dimension" },
		medium: { $value: "8px", $type: "dimension" },
	},
};
```

### Key Difference

- **Vanilla-extract**: Tokens defined in code, variables get hash suffixes (`--space-md__ya5b7b2`)
- **Our approach**: W3C DTCG format, simpler variable names, hash on class not variable

---

## CSS Generation

### Vanilla-Extract: Static CSS Files

```typescript
import { style } from "@vanilla-extract/css";

export const button = style({
	padding: "12px 24px",
	backgroundColor: "#3b82f6",
	borderRadius: "4px",
	color: "#ffffff",
	fontSize: "16px",
	fontWeight: 600,
});

export const container = style({
	display: "flex",
	flexDirection: "column",
	gap: "16px",
});
```

Generates:

```css
.Button_button__1ldw6lo0 {
	padding: 12px 24px;
	background-color: #3b82f6;
	borderradius: 4px;
	color: #ffffff;
	fontsize: 16px;
	fontweight: 600;
}

.Button_container__1ldw6lo1 {
	display: flex;
	flex-direction: column;
	gap: 16px;
}
```

### Style Variants

```typescript
import { styleVariants } from "@vanilla-extract/css";

export const button = style({
	padding: "12px 24px",
	borderRadius: "4px",
});

export const buttonVariant = styleVariants({
	primary: {
		backgroundColor: "#3b82f6",
		color: "#ffffff",
	},
	secondary: {
		backgroundColor: "#e5e7eb",
		color: "#1f2937",
	},
	danger: {
		backgroundColor: "#ef4444",
		color: "#ffffff",
	},
});
```

### Our Approach: Hash-Based Classes

```typescript
const button = style("button", {
	padding: "12px 24px",
	backgroundColor: "#3b82f6",
	borderRadius: "4px",
	color: "#ffffff",
});

const container = style("container", {
	display: "flex",
	flexDirection: "column",
	gap: "16px",
});
```

Generates:

```css
.button__a1b2c3d4 {
	padding: 12px 24px;
	background-color: #3b82f6;
	border-radius: 4px;
	color: #ffffff;
}

.container__e5f6g7h8 {
	display: flex;
	flex-direction: column;
	gap: 16px;
}
```

---

## Detailed Comparison

| Aspect              | Vanilla-Extract        | Our Approach    |
| ------------------- | ---------------------- | --------------- |
| **Token format**    | JS object              | W3C DTCG        |
| **Variable naming** | `--prop__hash`         | `--prefix-prop` |
| **Class naming**    | `File_classname__hash` | `name__hash`    |
| **Type safety**     | Theme contracts        | Manual typing   |
| **Build output**    | Static .css files      | Extract to CSS  |
| **Framework**       | Multiple bundlers      | Vite (oxc)      |
| **Atomic CSS**      | No (by default)        | No (by default) |
| **CSS variables**   | Hash-suffixed          | Simple names    |

---

## What Vanilla-Extract Does Well

### 1. Theme Contracts

Type-safe theme variables with compile-time checking:

```typescript
const vars = createThemeContract({
	color: {
		brand: null, // Required
		text: null,
	},
});

// TypeScript errors if you forget a value
const [themeClass, vars] = createTheme(vars, {
	color: {
		brand: "#3b82f6",
		text: "#1a1a1a",
	},
});
```

### 2. Static CSS Output

Generates actual `.css` files - no runtime needed:

```css
/* styles.css */
.Button_button__1ldw6lo0 {
	padding: 12px 24px;
}
```

### 3. Style Variants

```typescript
export const size = styleVariants({
	small: { padding: "8px 16px" },
	medium: { padding: "12px 24px" },
	large: { padding: "16px 32px" },
});

// Usage: size.small, size.medium, size.large
```

### 4. Global Styles

```typescript
import { globalStyle } from "@vanilla-extract/css";

globalStyle("body", {
	margin: 0,
	fontFamily: "system-ui",
});

globalStyle("a:hover", {
	textDecoration: "underline",
});
```

### 5. Variables Without Abstraction

```typescript
import { createVar } from "@vanilla-extract/css";

const shadowColor = createVar();

export const card = style({
	boxShadow: `0 0 10px ${shadowColor}`,
	selectors: {
		".light &": { vars: { [shadowColor]: "black" } },
		".dark &": { vars: { [shadowColor]: "white" } },
	},
});
```

### 6. Sprinkles (Atomic Utilities)

Vanilla-extract has `Sprinkles` for atomic CSS:

```typescript
import { defineProperties } from '@vanilla-extract/sprinkles';

const props = defineProperties({
  properties: {
    display: ['block', 'flex', 'grid', 'inline-flex'],
    flexDirection: ['row', 'column', 'row-reverse', 'column-reverse'],
    padding: { short: '4px', medium: '8px', long: '16px' },
    margin: { short: '4px', medium: '8px', long: '16px' },
  },
});

// Usage
<div className={props.flex}>
  <div className={props.padding.medium}>Content</div>
</div>
```

---

## Our Strengths vs Vanilla-Extract

### 1. W3C DTCG Compliance

Our token format follows the design tokens standard:

- Better interoperability with design tools
- Export/import from Figma tokens
- Industry standard format

### 2. Simpler Variable Names

```css
/* Vanilla-extract */
--space-medium__ya5b7b3: 8px;

/* Our approach */
--spacing-medium: 8px;
```

### 3. Composition API

```typescript
// Our approach - explicit composition
const combined = cx(baseStyles, variantStyles);

// Vanilla-extract - merge in component
className={stylex(styles.base, styles.variant)}
```

### 4. Registry Pattern

Runtime registry for:

- SSR hydration
- Style extraction
- Dynamic theming

---

## Potential Improvements for Our Approach

### 1. Add Theme Contracts

```typescript
// Proposed
const vars = createThemeContract({
	color: { brand: null, text: null },
	space: { sm: null, md: null, lg: null },
});
```

### 2. Add Style Variants

```typescript
// Proposed
const buttonSize = styleVariants({
	sm: { padding: "8px 16px" },
	md: { padding: "12px 24px" },
	lg: { padding: "16px 32px" },
});
```

### 3. Add Global Styles API

```typescript
// Proposed
globalStyle("body", {
	margin: 0,
	fontFamily: "system-ui",
});
```

### 4. Add Sprinkles (Atomic Utilities)

```typescript
// Proposed
const atomic = defineProperties({
	properties: {
		display: ["block", "flex", "grid"],
		padding: { sm: "4px", md: "8px", lg: "16px" },
	},
});
```

---

## Conclusion

Vanilla-extract excels at:

- Type-safe theme contracts
- Static CSS file generation
- Style variants API
- Framework-agnostic bundler support
- Sprinkles for atomic utilities

Our approach excels at:

- W3C DTCG token compliance
- Simpler variable naming
- Composition patterns
- Registry for dynamic access

Both achieve zero-runtime overhead - the main difference is vanilla-extract generates separate CSS files while we extract to a single CSS output.

---

## References

- [Vanilla-Extract Documentation](https://vanilla-extract.style/)
- [Vanilla-Extract GitHub](https://github.com/vanilla-extract-css/vanilla-extract)
- [CSS-Tricks: CSS in TypeScript with vanilla-extract](https://css-tricks.com/css-in-typescript-with-vanilla-extract/)
