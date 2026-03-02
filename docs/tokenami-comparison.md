# Tokenami vs Our CSS-in-TS Compiler: Deep Comparison

This document analyzes how [Tokenami](https://tokenami.com) handles design tokens and CSS generation, comparing it to our approach.

---

## Overview

Tokenami is a utility-first CSS library for type-safe design systems. It uses atomic CSS variables—no runtime injection, no class soup, no bundler required—just predictable styling with atomic CSS variables.

Key characteristics:
- **CSS variable-first**: Converts any CSS property to a variable (`padding` → `--padding`)
- **TypeScript plugin**: Provides autocomplete and type safety
- **CLI-first**: Generate static CSS without bundler integration
- **Framework-agnostic**: Works with React, Preact, Vue, SolidJS, Qwik
- **Small runtime**: ~2.5kb

---

## Token System

### Tokenami Token Format

Tokenami defines tokens in a config file:

```typescript
// .tokenami/tokenami.config.ts
import { createConfig } from '@tokenami/css';

export default createConfig({
  theme: {
    color: {
      'slate-100': '#f1f5f9',
      'slate-700': '#334155',
      'sky-500': '#0ea5e9',
    },
    radii: {
      rounded: '10px',
      circle: '9999px',
    },
    spacing: {
      1: '0.25rem',
      2: '0.5rem',
      4: '1rem',
    },
  },
});
```

This generates CSS variables:

```css
:root {
  --color_slate-100: #f1f5f9;
  --color_slate-700: #334155;
  --radii_rounded: 10px;
  --radii_circle: 9999px;
}
```

### Multiple Themes

```typescript
export default createConfig({
  theme: {
    modes: {
      light: {
        color: { primary: '#f1f5f9' },
      },
      dark: {
        color: { primary: '#0ea5e9' },
      },
    },
    root: {
      radii: { rounded: '10px' },
    },
  },
});
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
    1: { $value: "0.25rem", $type: "dimension" },
    2: { $value: "0.5rem", $type: "dimension" },
  }
};
```

### Key Difference

- **Tokenami**: Tokens in TypeScript config, generates simple variable names (`--color_primary`)
- **Our approach**: W3C DTCG format with `$value`, `$type` metadata

---

## CSS Generation

### Tokenami: CSS Variable Classes

Tokenami uses a `css` utility instead of utility classes:

```typescript
import { css } from '@tokenami/css';

function Button(props) {
  return (
    <button
      {...props}
      style={css({
        '--background': 'var(--color_primary)',
        '--color': 'var(--color_white)',
        '--padding': 4,  // Grid-based: 4 * grid unit
        '--border-radius': 'var(--radii_rounded)',
      })}
    />
  );
}
```

Output HTML:

```html
<button class="tk-abc" style="--background: var(--color_primary); --color: var(--color_white); --padding: var(--spacing_4); --border-radius: var(--radii_rounded);">Click</button>
```

Generated CSS (extracted to stylesheet):

```css
.tk-abc {
  background: var(--color_primary);
  color: var(--color_white);
  padding: var(--spacing_4);
  border-radius: var(--radii_rounded);
}
```

### The css.compose API

Tokenami has a compose API for reusable components:

```typescript
const button = css.compose({
  '--background': 'var(--color_primary)',
  '--color': 'var(--color_white)',
  '--padding': 4,

  variants: {
    variant: {
      primary: { '--background': 'var(--color_blue)' },
      secondary: { '--background': 'var(--color_gray)' },
    },
    size: {
      sm: { '--padding': 2 },
      lg: { '--padding': 6 },
    },
  },
});

function Button({ variant = 'primary', size = 'md', ...props }) {
  const [cn, styles] = button({ variant, size });
  return <button {...props} className={cn(props.className)} style={styles(props.style)} />;
}
```

### Grid Values

Tokenami uses a grid system for numeric values:

```typescript
// Config
export default createConfig({
  grid: '4px', // Default is 0.25rem
});

// Usage
<div style={css({ '--padding': 2 })} /> 
// Output: padding: 8px (2 * 4px grid)
```

### Our Approach: Component-Scoped Hash Classes

```typescript
const button = style("button", {
  backgroundColor: "primary",
  padding: "1rem",
  borderRadius: "rounded",
});
```

---

## Detailed Comparison

| Aspect | Tokenami | Our Approach |
|--------|----------|--------------|
| **Class names** | Short (`.tk-abc`) | Scoped (`.button__hash`) |
| **Token format** | TypeScript config | W3C DTCG JSON |
| **CSS variables** | Atomic (`--color_primary`) | Simple (`--spacing-md`) |
| **Styling model** | CSS variable in style | Class + inline |
| **Theming** | Multiple modes | Theme registry |
| **Build output** | Static CSS + inline | Extract to CSS |
| **Zero-runtime** | Yes (static + inline vars) | Yes (static) |
| **Type safety** | Full TypeScript | Full TypeScript |
| **Framework** | CLI + TS plugin | Vite (oxc) |

---

## What Tokenami Does Well

### 1. CSS Variable-First Approach

Instead of utility classes, Tokenami uses CSS variables:

```css
/* Tokenami approach - single class */
.tk-button {
  --background: var(--color_primary);
  --padding: var(--spacing_4);
}

/* Usage */
<button class="tk-button">Click</button>

/* vs Tailwind - many utility classes */
<button class="bg-blue-500 p-4 text-white rounded-lg">Click</button>
```

Benefits:
- No class soup in HTML
- One class per component
- Consumer overrides via CSS variables

### 2. No Bundler Required

Tokenami works with just a CLI:

```bash
# Generate static CSS
npx tokenami --output ./public/styles.css

# Watch mode
npx tokenami --output ./public/styles.css --watch
```

This makes it work with any setup—static HTML, PHP, Rails, etc.

### 3. TypeScript Plugin

```json
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [{ "name": "tokenami" }]
  }
}
```

Provides:
- Autocomplete for CSS variables
- Type checking for theme values
- IntelliSense for properties

### 4. Cascading Overrides

Tokenami handles composition safely:

```typescript
// Base styles
const base = css({ '--color': 'red' });

// Override
<div style={css(base, { '--color': 'blue' })} />
// 'blue' wins - last override wins
```

### 5. Multiple Themes

```typescript
export default createConfig({
  theme: {
    modes: {
      light: { color: { primary: '#000' } },
      dark: { color: { primary: '#fff' } },
    },
  },
});

// Usage
<body class="theme-light">
  <div style={css({ '--color': 'var(--color_primary)' })}>
    Black on light
  </div>
</body>
```

### 6. Responsive Styles

```typescript
<div style={css({
  '--padding': 2,           // Base
  '--md_padding': 4,        // At md breakpoint
  '--lg_padding': 6,        // At lg breakpoint
})} />
```

---

## Our Strengths vs Tokenami

### 1. W3C DTCG Compliance

Our token format follows the design tokens standard:
- Better interoperability with design tools
- Token references: `{color.primary}`
- Metadata support

### 2. Component Isolation

```typescript
// Our approach - unique hash per component
const button = style("button", { color: "red" });
// Generates: .button__a1b2c3d4

// Tokenami - shared classes
const button = css.compose({ '--color': 'red' });
// Generates: .tk-abc (could collide)
```

### 3. Registry Pattern

Runtime registry for:
- SSR hydration
- Style extraction
- Dynamic theming

### 4. No Runtime Injection

Our approach is fully static—all styles extracted at build time:

```typescript
// Our approach - fully static
const styles = style("button", { color: "red" });
// .button__abc { color: red; }

// Tokenami - some inline styles for variants
const [cn, css] = button({ variant: "primary" });
// <button class="tk-abc" style="--bg: blue;"> - variant inline
```

---

## Potential Improvements for Our Approach

### 1. Add CSS Variable Classes

```typescript
// Proposed - generate variable-based classes
const button = style("button", {
  '--background': 'var(--color-primary)',
  '--padding': 'var(--spacing-md)',
});

// Output CSS
.button__abc {
  background: var(--color-primary);
  padding: var(--spacing-md);
}
```

### 2. Add Compose API

```typescript
// Proposed
const button = compose({
  base: { '--bg': 'blue' },
  variants: {
    size: { sm: { '--p': 2 }, lg: { '--p': 4 } },
  },
});
```

### 3. Add Theme Modes

```typescript
// Proposed
createTheme("light", tokens);
createTheme("dark", darkTokens, { selector: "[data-theme=dark]" });
```

### 4. Add Grid System

```typescript
// Proposed - numeric values auto-multiply
const styles = style("el", { padding: 4 }); // 4 * grid
```

---

## Comparison: All Five Frameworks

| Aspect | SugarCube | StyleX | Vanilla-Extract | Tailwind v4 | Tokenami | Our Approach |
|--------|-----------|--------|-----------------|-------------|----------|--------------|
| **Class names** | Semantic | Atomic | Scoped | Utility | Short | Scoped |
| **Token format** | DTCG | JS | JS | CSS @theme | TS Config | DTCG |
| **CSS output** | Variables | Atomic | Static CSS | Utilities | Var classes | Extract |
| **Runtime** | Zero | Zero | Zero | Zero | ~2.5kb | Zero |
| **Type safety** | Partial | Full | Full | Limited | Full | Full |
| **Theming** | Modifiers | defineVars | createTheme | CSS vars | Modes | Registry |
| **Bundler** | Vite | Babel | Multiple | Vite/PostCSS | CLI (none) | Vite |

---

## Conclusion

Tokenami excels at:
- CSS variable-first approach (no class soup)
- No bundler required (CLI-only)
- TypeScript plugin for autocomplete
- Framework-agnostic
- Cascading overrides
- Small runtime

Our approach excels at:
- W3C DTCG token compliance
- Component isolation via hashing
- Zero runtime overhead
- Registry for dynamic access
- Composition patterns

The key difference: **Tokenami optimizes for clean HTML with CSS variables, we optimize for component isolation with hash-based scoping**.

---

## References

- [Tokenami GitHub](https://github.com/tokenami/tokenami)
- [Tokenami Documentation](https://tokenami.com)
- [Tokenami NPM](https://www.npmjs.com/package/@tokenami/css)
