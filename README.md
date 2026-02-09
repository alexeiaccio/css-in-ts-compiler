# CSS-in-TS Compiler ⏎

A compile-time CSS-in-TypeScript compiler with hash-based class names, following StyleX and vanilla-extract patterns, with full W3C Design Tokens support.

> **Note:** This project is looking for a better name! See [Potential Names](#potential-names) below.

## Features

✅ **Hash-based class names** - Collision-free atomic classes (like StyleX, vanilla-extract)  
✅ **Compile-time deduplication** - Global registry for atomic classes  
✅ **Design Tokens support** - Follows W3C Design Tokens Community Group standard  
✅ **Responsive utilities** - Media query functions via `createMedia()`  
✅ **Composable API** - Functional utilities like `p(2)`, `md(p(4))`  
✅ **Type-safe** - Full TypeScript support  
✅ **Zero runtime** - All styles compiled at build time  
✅ **Vite plugins** - Both regex-based and oxc-based AST plugins available  
✅ **Theming** - Global themes with CSS variables  
✅ **CLI** - Command-line interface for building styles

## Potential Names

This project is seeking a better name. Inspired by vanilla-extract's clever naming (extracting the "vanilla" essence), here are some options:

### Brewing/Food Metaphors
| Name | Vibe |
|------|------|
| **wort** | Malt extract for beer brewing - the essence before fermentation |
| **malt** | The sweet foundation of beer |
| **hops** | The bitter accent that defines flavor |
| **infuse** | Steeping flavors into something |
| **steep** | Tea/coffee extraction |
| **tincture** | Dissolved essence |

### Nature Metaphors
| Name | Vibe |
|------|------|
| **resin** | Tree essence |
| **sap** | Tree essence |
| **nectar** | Flower essence |
| **bloom** | Flowers extracting essence |

### Craft/Alchemy Metaphors
| Name | Vibe |
|------|------|
| **forge** | Metal working - refining through heat |
| **temper** | Refinement through heat and cooling |
| **quench** | Cooling process after forging |
| **flux** | Purifying agent |

### Short & Punchy
| Name | Vibe |
|------|------|
| **brisk** | Quick, lively |
| **snap** | Sharp, quick |
| **zest** | Energy, flavor |
| **pith** | Essential part |

### Current Favorites
| Rank | Name | Rationale |
|------|------|-----------|
| 1 | **wort** | Obscure, memorable, only beer brewers get it. Exclusive. |
| 2 | **zest** | Energetic, flavorful, easy to say |
| 3 | **tincture** | Apothecary vibe, extracted essence |

### Our Recommendation

**`wort`** - It's unexpected, memorable, has "worth" sound-alike, and fits the "extract" theme perfectly. The name is a nod to vanilla-extract's brewing metaphor while being its own thing.

---

*Have a suggestion? Open an issue!*

## Quick Start

```bash
bun add css-in-ts
```

## Vite Setup

### Option 1: Oxc Plugin (Recommended - AST-based)
New, faster, more reliable plugin using oxc-parser for proper AST traversal:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cssTSOxcPlugin } from 'css-in-ts/oxc';

export default defineConfig({
  plugins: [
    react(),
    cssTSOxcPlugin({
      include: ['**/*.tsx', '**/*.ts'],
      debug: false, // Enable for source maps
    }),
  ],
});
```

### Option 2: Legacy Plugin (Regex-based)
Original plugin, marked as deprecated but still functional:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cssTSPlugin } from 'css-in-ts/vite';

export default defineConfig({
  plugins: [
    react(),
    cssTSPlugin(),
  ],
});
```

## Usage

```typescript
import { style, cx } from 'css-in-ts';
import { createSizes, createMedia } from 'css-in-ts';
import { flex, itemsCenter, bg, textCol } from 'css-in-ts';

const { p } = createSizes();

const { sm, md, lg } = createMedia({
  sm: 'screen and (min-width: 640px)',
  md: 'screen and (min-width: 768px)',
  lg: 'screen and (min-width: 1024px)',
});

// Define a component style
const button = style('button', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.75rem 1.5rem',
  backgroundColor: 'var(--css-color-primary)',
  color: 'white',
  borderRadius: '0.25rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'var(--css-color-secondary)',
    transform: 'scale(1.05)',
  },
});

// Compose utilities
const responsivePadding = cx(
  p(2),
  sm(p(4)),
  md(p(6)),
  lg(p(8))
);

// Use in React
function Button({ children }) {
  return <button className={button}>{children}</button>;
}
```

## CLI

```bash
# Build styles from a file
css-in-ts build src/styles.ts -o dist/[hash].css

# Watch mode for development
css-in-ts watch src/styles.ts -o dist/styles.css
```

## Theming

```typescript
import { createGlobalTheme, globalStyle } from 'css-in-ts';

// Create a global theme with CSS variables
export const vars = createGlobalTheme(':root', {
  color: {
    primary: '#3b82f6',
    secondary: '#6366f1',
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
  },
});

// Use in styles
const button = style('button', {
  padding: vars.spacing.md,
  backgroundColor: vars.color.primary,
});

// Global styles
globalStyle('body', {
  margin: 0,
  fontFamily: 'system-ui',
});
```

## API Reference

### `style(name, properties)`

Create a component style with a hash-based class name.

```typescript
const card = style('card', {
  display: 'flex',
  flexDirection: 'column',
  padding: '1rem',
  backgroundColor: 'white',
  borderRadius: '0.5rem',
  '@media (min-width: 768px)': {
    padding: '1.5rem',
  },
  '&:hover': {
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
});
```

### `cx(...styles)`

Compose multiple styles and utilities.

```typescript
const heading = cx(
  text(6),
  fontBold(),
  textCol('var(--css-color-neutral-900)'),
  md(text(8))
);
```

### `createSizes()`

Create size-based utility functions.

```typescript
const { p, m, w, h, gap, rounded } = createSizes();

const className = cx(
  p(4),      // padding: 1rem
  m(2),      // margin: 0.5rem
  w(64),     // width: 16rem
  h(32),     // height: 8rem
  gap(4),    // gap: 1rem
  rounded(2) // borderRadius: 0.5rem
);
```

### `createMedia(queries)`

Create responsive breakpoint functions.

```typescript
const { sm, md, lg, xl } = createMedia({
  sm: 'screen and (min-width: 640px)',
  md: 'screen and (min-width: 768px)',
  lg: 'screen and (min-width: 1024px)',
  xl: 'screen and (min-width: 1280px)',
});

const className = cx(
  p(2),
  sm(p(4)),
  md(p(6)),
  lg(p(8))
);
```

### Design Tokens

Use design tokens following the W3C Design Tokens standard.

```typescript
import { token, resolveToken, getCSSVariables } from 'css-in-ts';

const primaryColor = resolveToken('color.primary'); // #3b82f6

const button = style('button', {
  backgroundColor: token('color.primary'),
  color: token('color.neutral.50'),
});

const variables = getCSSVariables();
```

## Examples

See the `example-vite` directory for the legacy plugin example and `example-oxc` for the new oxc-based plugin.

## Running Tests

```bash
bun test
```

## Building

```bash
bun run build
```

## References

- [StyleX](https://stylexjs.com/docs/learn/) - Inspiration for atomic CSS and hash-based class names
- [vanilla-extract](https://vanilla-extract.style/documentation/getting-started) - Inspiration for file-scoped class names
- [Oxc Parser](https://oxc.rs/docs/guide/usage/parser.html) - AST parser powering the new Vite plugin
- [W3C Design Tokens](https://www.designtokens.org/tr/drafts/format/) - Design tokens standard

## License

MIT
