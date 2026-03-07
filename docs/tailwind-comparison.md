# Tailwind CSS v4 vs Our CSS-in-TS Compiler: Deep Comparison

This document analyzes how [Tailwind CSS v4](https://tailwindcss.com) handles design tokens and CSS generation, comparing it to our approach.

---

## Overview

Tailwind CSS v4 is a ground-up rewrite of the popular utility-first CSS framework. It features a new high-performance engine, CSS-first configuration, and native CSS variable support.

Key changes in v4:

- New high-performance engine (5x faster builds, 100x faster incremental)
- CSS-first configuration (`@theme` directive)
- All design tokens exposed as CSS variables
- Simplified installation (single line)
- Modern CSS features (cascade layers, `@property`, `color-mix()`)

---

## Token System

### Tailwind v4: CSS-First Tokens

Tailwind v4 defines tokens directly in CSS using `@theme`:

```css
@import "tailwindcss";

@theme {
	--font-display: "Satoshi", "sans-serif";

	--color-primary: #3b82f6;
	--color-secondary: #6366f1;

	--spacing-xs: 0.25rem;
	--spacing-sm: 0.5rem;
	--spacing-md: 1rem;
	--spacing-lg: 1.5rem;
	--spacing-xl: 2rem;

	--radius-sm: 0.125rem;
	--radius-md: 0.375rem;
	--radius-lg: 0.5rem;
}
```

This generates:

1. CSS variables in `:root`
2. Utility classes automatically

### Generated CSS Variables

```css
:root {
	--font-display: "Satoshi", "sans-serif";
	--color-primary: #3b82f6;
	--color-secondary: #6366f1;
	--spacing-xs: 0.25rem;
	--spacing-sm: 0.5rem;
	--spacing-md: 1rem;
	--spacing-lg: 1.5rem;
	--spacing-xl: 2rem;
	--radius-sm: 0.125rem;
	--radius-md: 0.375rem;
	--radius-lg: 0.5rem;
}
```

### Utility Classes Generated

```css
.bg-primary {
	background-color: var(--color-primary);
}
.text-primary {
	color: var(--color-primary);
}
.p-md {
	padding: var(--spacing-md);
}
.rounded-md {
	border-radius: var(--radius-md);
}
.font-display {
	font-family: var(--font-display);
}
```

### Our Implementation

```typescript
// tokens.ts - W3C DTCG format
const defaultTokens = {
	color: {
		primary: { $value: "#3b82f6", $type: "color" },
		secondary: { $value: "#6366f1", $type: "color" },
	},
	spacing: {
		xs: { $value: "0.25rem", $type: "dimension" },
		sm: { $value: "0.5rem", $type: "dimension" },
		md: { $value: "1rem", $type: "dimension" },
	},
};
```

### Key Difference

- **Tailwind**: Tokens in CSS via `@theme`, auto-generates utilities
- **Our approach**: Tokens in TypeScript (DTCG format), explicit style definitions

---

## CSS Generation

### Tailwind: Utility Classes

```html
<!-- Tailwind usage -->
<div class="flex flex-col gap-4 p-6 bg-primary rounded-lg">
	<button class="px-4 py-2 bg-secondary text-white rounded-md">Click me</button>
</div>
```

Generates:

```css
.flex {
	display: flex;
}
.flex-col {
	flex-direction: column;
}
.gap-4 {
	gap: var(--spacing-4);
}
.p-6 {
	padding: var(--spacing-6);
}
.bg-primary {
	background-color: var(--color-primary);
}
.rounded-lg {
	border-radius: var(--radius-lg);
}
.px-4 {
	padding-inline: var(--spacing-4);
}
.py-2 {
	padding-block: var(--spacing-2);
}
.bg-secondary {
	background-color: var(--color-secondary);
}
.text-white {
	color: white;
}
.rounded-md {
	border-radius: var(--radius-md);
}
```

### Our Approach: Component Styles

```typescript
const container = style("container", {
	display: "flex",
	flexDirection: "column",
	gap: "1rem",
	padding: "1.5rem",
	backgroundColor: "primary",
	borderRadius: "0.5rem",
});

const button = style("button", {
	paddingInline: "1rem",
	paddingBlock: "0.5rem",
	backgroundColor: "secondary",
	color: "white",
	borderRadius: "0.375rem",
});
```

Usage:

```tsx
<div class={container}>
	<button class={button}>Click me</button>
</div>
```

---

## Detailed Comparison

| Aspect            | Tailwind v4               | Our Approach             |
| ----------------- | ------------------------- | ------------------------ |
| **Class names**   | Utility (`.flex`, `.p-4`) | Scoped (`.button__hash`) |
| **Token format**  | CSS `@theme`              | W3C DTCG JSON            |
| **Styling model** | Utility-first             | Component-scoped         |
| **CSS variables** | Auto-generated            | Manual extraction        |
| **Build output**  | Atomic utilities          | Component CSS            |
| **Theming**       | CSS variables + dark:     | Theme registry           |
| **Zero-runtime**  | Yes (static)              | Yes (static)             |
| **Type safety**   | Limited                   | Full TypeScript          |
| **Configuration** | CSS-first                 | TypeScript API           |

---

## What Tailwind v4 Does Well

### 1. CSS-First Configuration

All tokens defined in CSS:

```css
@theme {
	--color-brand: #3b82f6;
	--spacing-4: 1rem;
}

/* Variables available as: var(--color-brand) */
/* Utilities available as: .bg-brand, .p-4 */
```

### 2. Dynamic Utilities

Tailwind generates utilities dynamically - no configuration needed for arbitrary values:

```html
<div class="grid grid-cols-[1fr_2fr_1fr]">
	<div class="p-[calc(1rem+2px)]">
		<div data-active class="opacity-75 data-active:opacity-100"></div>
	</div>
</div>
```

### 3. Modern CSS Features

v4 leverages:

- Cascade layers (`@layer theme, base, components, utilities`)
- `@property` for animating CSS variables
- `color-mix()` for opacity
- Logical properties (RTL support)

### 4. Performance

- 5x faster full builds
- 100x faster incremental builds (microseconds)
- JIT by default

### 5. Container Queries

```html
<div class="@container">
	<div class="grid grid-cols-1 @sm:grid-cols-3 @lg:grid-cols-4">Content</div>
</div>
```

### 6. Dark Mode

```html
<div class="dark:bg-gray-900 dark:text-white"></div>
```

### 7. Arbitrary Values

```html
<div class="top-[calc(100%-1rem)]">
	<div class="grid-cols-[repeat(3,minmax(0,1fr))]"></div>
</div>
```

---

## Our Strengths vs Tailwind

### 1. Type Safety

```typescript
// Our approach - full TypeScript
const button = style("button", {
	backgroundColor: "primary", // TypeScript knows valid colors
});

// Tailwind - string-based
className = "bg-primary"; // No compile-time checking
```

### 2. Component Isolation

```typescript
// Our approach - scoped styles
const button = style("button", { color: "red" });
// .button__a1b2c3d4 - won't conflict with anything

// Tailwind - global utilities
className = "text-red-500"; // Could conflict
```

### 3. Composition

```typescript
// Our approach - explicit composition
const styles = cx(baseStyles, variantStyles, conditional && extraStyles);

// Tailwind - class string merging
className={`base ${variant} ${conditional && 'extra'}`}
```

### 4. Design Tokens

Our approach follows W3C DTCG:

- Better interoperability
- Token references
- Metadata support

### 5. No Class Soup

```tsx
// Our approach - clean JSX
<div className={styles.card}>
  <button className={styles.button}>Click</button>
</div>

// Tailwind - long class strings
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
  <button className="px-4 py-2 bg-blue-500 text-white rounded">
    Click
  </button>
</div>
```

---

## Potential Improvements for Our Approach

### 1. Add Utility Generation

```typescript
// Proposed
defineConfig({
	utilities: [
		{ property: "display", values: ["flex", "grid", "block"] },
		{ property: "gap", values: ["sm", "md", "lg"] },
	],
});
```

### 2. Add Dark Mode Support

```typescript
// Proposed
createTheme("light", { colors: { primary: "#000" } });
createTheme("dark", { colors: { primary: "#fff" } });
// Generates .dark .primary { color: #fff }
```

### 3. Add Responsive Variants

```typescript
// Proposed
const responsive = style("container", {
	"@sm": { display: "flex" },
	"@lg": { display: "grid" },
});
```

### 4. Add Container Queries

```typescript
// Proposed
const responsive = style("container", {
	"@container": true,
	"@sm:grid-cols-3": true,
});
```

### 5. Add Arbitrary Value Support

Allow dynamic values without pre-configuration:

```typescript
// Proposed
style("el", {
	padding: "{1rem + 2px}", // Arbitrary value
	gridColumns: "{repeat(3, minmax(0, 1fr))}",
});
```

---

## Comparison: All Four Frameworks

| Aspect            | SugarCube | StyleX     | Vanilla-Extract | Tailwind v4 | Our Approach |
| ----------------- | --------- | ---------- | --------------- | ----------- | ------------ |
| **Class names**   | Semantic  | Atomic     | Scoped          | Utility     | Scoped       |
| **Token format**  | DTCG      | JS         | JS              | CSS @theme  | DTCG         |
| **Build output**  | Variables | Atomic     | Static CSS      | Utilities   | Extract      |
| **Runtime**       | Zero      | Zero       | Zero            | Zero        | Zero         |
| **Type safety**   | Partial   | Full       | Full            | Limited     | Full         |
| **Theming**       | Modifiers | defineVars | createTheme     | CSS vars    | Registry     |
| **Atomic**        | Optional  | Yes        | No              | Yes         | Optional     |
| **Configuration** | JSON/TS   | TS         | TS              | CSS         | TS           |

---

## Conclusion

Tailwind v4 excels at:

- Utility-first workflow
- CSS-first configuration
- Dynamic/arbitrary values
- Performance at scale
- No class name management

Our approach excels at:

- Type-safe component styles
- W3C DTCG token compliance
- Scoped isolation
- Composition patterns
- Clean JSX

The fundamental difference: **Tailwind is utility-first, we are component-scoped**. Both are valid approaches - Tailwind optimizes for quick iteration, we optimize for maintainability and type safety.

---

## References

- [Tailwind CSS v4 Announcement](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs/)
- [Tailwind v4 Theme Variables](https://tailwindcss.com/docs/configuration/)
- [Mavik Labs: Design Tokens in 2026](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026)
