# StyleX vs Our CSS-in-TS Compiler: Deep Comparison

This document analyzes how [StyleX](https://stylexjs.com) (Meta's CSS-at-scale solution) handles design tokens and CSS generation, comparing it to our approach.

---

## Overview

StyleX is Meta's styling system for large-scale applications. It combines the ergonomics of CSS-in-JS with the performance of static CSS, generating collision-free atomic CSS while allowing for expressive, type-safe style authoring.

Used at scale by: Facebook, Instagram, WhatsApp, Messenger, Threads, Figma, Snowflake

---

## Token System

### StyleX Token Format

StyleX uses `defineVars` to create theme variables:

```typescript
import { defineVars, createTheme } from "@stylexjs/themes";

const tokens = defineVars({
	colors: {
		primary: "#3b82f6",
		secondary: "#6366f1",
	},
	spacing: {
		small: "4px",
		medium: "8px",
		large: "16px",
	},
	fontSizes: {
		small: "12px",
		medium: "14px",
		large: "18px",
	},
});
```

Generates CSS variables:

```css
:root {
	--colors-primary: #3b82f6;
	--colors-secondary: #6366f1;
	--spacing-small: 4px;
	--spacing-medium: 8px;
	--spacing-large: 16px;
	--fontSizes-small: 12px;
	--fontSizes-medium: 14px;
	--fontSizes-large: 18px;
}
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

- **StyleX**: Tokens defined in code via `defineVars`, generates simple variable names
- **Our approach**: Follows W3C DTCG format with `$value`, `$type` metadata

---

## CSS Generation: Atomic CSS

### StyleX: Atomic Class Generation

StyleX transforms style objects into atomic CSS classes:

```typescript
import { stylex } from "@stylexjs/stylex";

const styles = stylex.create({
	button: {
		backgroundColor: "primary",
		padding: "8px 16px",
		borderRadius: "4px",
	},
	container: {
		display: "flex",
		flexDirection: "column",
		gap: "8px",
	},
});
```

Generates:

```css
.x1p7d1qz {
	background-color: var(--colors-primary);
}
.x1iumqq1 {
	padding: 8px 16px;
}
.x1avfquk {
	border-radius: 4px;
}
.xs7x2ga {
	display: flex;
}
.x1r1m6x3 {
	flex-direction: column;
}
.x1ipk5nv {
	gap: 8px;
}
```

Each unique CSS declaration becomes its own atomic class. Multiple elements sharing the same style reference the same class.

### Our Approach: Component-Scoped Hash Classes

```typescript
const button = style("button", {
	backgroundColor: "primary",
	padding: "8px 16px",
	borderRadius: "4px",
});
```

Generates:

```css
.button__a1b2c3d4 {
	background-color: var(--colors-primary);
	padding: 8px 16px;
	border-radius: 4px;
}
```

---

## Detailed Comparison

| Aspect                | StyleX                       | Our Approach                 |
| --------------------- | ---------------------------- | ---------------------------- |
| **Class names**       | Atomic (`.x1p7d1qz`)         | Scoped (`.button__a1b2c3d4`) |
| **Token format**      | Simple JS object             | W3C DTCG format              |
| **Theme system**      | `defineVars` + `createTheme` | Manual theme registry        |
| **CSS output**        | Atomic/deduplicated          | Component-scoped             |
| **Build tool**        | Babel plugin                 | Vite plugin (oxc)            |
| **Type safety**       | Full TypeScript              | Full TypeScript              |
| **Runtime cost**      | Zero (when static)           | Zero (when static)           |
| **Style composition** | Via `className` merging      | Via `cx()`                   |

---

## What StyleX Does Well

### 1. Atomic CSS Generation

StyleX breaks every CSS declaration into its own class:

```css
.x1p7d1qz {
	background-color: var(--colors-primary);
}
.x1iumqq1 {
	padding: 8px 16px;
}
.x1avfquk {
	border-radius: 4px;
}
```

This means:

- Deduplication happens automatically
- Bundle size plateaus as app grows
- No unused styles

### 2. Zero-Runtime Overhead

When styles are static (defined and used in same file):

```typescript
// Static usage - ZERO runtime
const styles = stylex.create({
  primary: { color: 'red' }
});

<div className={styles.primary} />
```

The class name is computed at build time.

### 3. Predictable Specificity

StyleX guarantees no specificity conflicts:

- No cascade
- No `!important` needed
- Last style always wins

### 4. Theme Variables

```typescript
const tokens = defineVars({
	colors: { primary: "blue" },
});

// Use in styles
const button = stylex.create({
	backgroundColor: tokens.colors.primary,
});
```

### 5. Multiple Themes

```typescript
const [themeClass, vars] = createTheme(
	{
		colors: { primary: "blue" },
	},
	"themeName",
);

const darkTheme = createTheme(
	{
		colors: { primary: "lightblue" },
	},
	"darkTheme",
);
```

---

## Our Strengths vs StyleX

### 1. Scoped vs Atomic

- **Atomic** (StyleX): Great for bundle size, but less readable class names
- **Scoped** (ours): More readable, easier to debug, still deduplicates

### 2. DTCG Token Format

Our approach follows W3C Design Tokens spec:

- `$value`, `$type`, `$description` metadata
- Token references: `{color.primary}`
- Better interoperability with design tools

### 3. Composition API

```typescript
// Our approach
const composed = cx(baseStyles, variantStyles, conditionalStyles);

// StyleX - merge classNames
className={stylex(styles.base, variant && styles.variant)}
```

### 4. Registry Pattern

Our runtime registry allows:

- SSR hydration
- Style extraction
- Dynamic inspection

---

## Potential Improvements for Our Approach

### 1. Add Atomic CSS Option

Allow generating atomic classes alongside scoped:

```typescript
// Proposed
style("button", { color: "red" }, { atomic: true });

// Output: .x1abc123 { color: red; }
```

### 2. Add defineVars API

```typescript
// Proposed
const tokens = defineVars({
	colors: { primary: "#3b82f6" },
});
```

### 3. Add createTheme Support

```typescript
// Proposed
const [lightTheme, vars] = createTheme({
	colors: { primary: "blue" },
});

const [darkTheme] = createTheme(
	{
		colors: { primary: "lightblue" },
	},
	"dark",
);
```

### 4. Improve Build Performance

StyleX uses Babel with file-level caching. Consider similar optimization for large codebases.

---

## Conclusion

StyleX excels at:

- Atomic CSS generation for minimal bundle size
- Predictable specificity guarantees
- Zero-runtime overhead for static styles
- Scale to thousands of components

Our approach excels at:

- Readable scoped class names
- W3C DTCG token compliance
- Composition patterns
- Runtime registry capabilities

Both achieve zero-runtime overhead - the main difference is atomic vs scoped class generation.

---

## References

- [StyleX Documentation](https://stylexjs.com/)
- [StyleX GitHub](https://github.com/facebook/stylex)
- [Engineering at Meta: StyleX](https://engineering.fb.com/2025/11/11/web/stylex-a-styling-library-for-css-at-scale/)
