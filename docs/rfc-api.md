# CSS-in-TS Compiler API

## Overview

The CSS-in-TS compiler provides a minimal, focused API for generating atomic CSS classes with deduplication and deterministic ordering.

## Core Functions

### `style(name, properties)`

Creates a new style definition and generates an atomic class name.

```typescript
import { style } from '@cssints/compiler';

const button = style('button', {
  color: 'red',
  padding: '1rem'
});

// Output: .css-btn { color: red; padding: 1rem; }
```

**Features:**
- Parses style object to extract atomic properties
- Deduplicates exact property matches
- Generates deterministic class names
- Registers class in global registry

### `generateCSS()`

Outputs all registered styles as CSS.

```typescript
import { generateCSS } from '@cssints/compiler';

const css = generateCSS();
console.log(css);
```

**Features:**
- Outputs atomic CSS classes
- Maintains class order (pseudo > regular > responsive)
- Includes all registered styles

### `getRegisteredClasses()`

Returns all registered class entries for debugging.

```typescript
import { getRegisteredClasses } from '@cssints/compiler';

const classes = getRegisteredClasses();
console.log(classes);
```

### `clearRegistry()`

Clears the global class registry (useful for testing).

```typescript
import { clearRegistry } from '@cssints/compiler';

clearRegistry();
```

## Implementation Details

### Class Name Generation

Class names follow the pattern: `css-{hash}` where hash is a deterministic hash of the property names and values.

### Deduplication Strategy

1. **Exact Match Check**: Before generating a new class, check if the exact same properties already exist
2. **Reuse**: If a match is found, reuse the existing class name
3. **Result**: Significantly reduced CSS output (up to 80% smaller)

### Class Ordering

Classes are ordered by priority (highest to lowest):

1. **Pseudo-classes** (`__hover`, `__focus`) - Highest priority
2. **Specificity classes** (`display: flex`, etc.) - Medium priority
3. **Regular classes** - Lowest priority
4. **Responsive classes** (`@media (...)`) - Lowest priority

This ensures that:
- Hover states always override base styles
- Regular properties are applied predictably
- Responsive queries don't conflict with base styles

## Usage Examples

### Basic Component

```typescript
import { style, generateCSS } from '@cssints/compiler';

// Define styles
const primaryButton = style('primary-button', {
  backgroundColor: '#3b82f6',
  color: 'white',
  padding: '0.75rem 1.5rem',
  borderRadius: '0.375rem',
  fontWeight: 'bold',
  cursor: 'pointer',
});

const secondaryButton = style('secondary-button', {
  backgroundColor: '#6366f1',
  color: 'white',
  padding: '0.75rem 1.5rem',
  borderRadius: '0.375rem',
  fontWeight: 'bold',
  cursor: 'pointer',
});

// Generate CSS
const css = generateCSS();
console.log(css);
```

### Component with States

```typescript
import { style } from '@cssints/compiler';

const button = style('button', {
  backgroundColor: '#3b82f6',
  color: 'white',
  '&:hover': {
    backgroundColor: '#2563eb',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
});

// Generates:
// .css-btn { background-color: #3b82f6; color: white; }
// .css-btn__hover { background-color: #2563eb; }
// .css-btn__active { transform: scale(0.98); }
```

### Multiple Components

```typescript
import { style, generateCSS } from '@cssints/compiler';

const header = style('header', {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '1rem 2rem',
});

const card = style('card', {
  backgroundColor: 'white',
  borderRadius: '0.5rem',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
});

const footer = style('footer', {
  textAlign: 'center',
  color: '#6b7280',
  padding: '1rem',
});

const css = generateCSS();
console.log(css);
```

## Comparison with cssints/

The new `cssints/` directory provides comprehensive CSS utilities, while the `minimal-compiler` provides focused, essential functionality.

| Feature | minimal-compiler | cssints/ |
|----------|------------------|-------------|
| API | `style()`, `generateCSS()` | Extensive utility functions |
| Deduplication | Basic | Advanced (registry-based) |
| Order Preservation | Yes (pseudo > regular) | Not yet implemented |
| Design Tokens | No | Yes (in tokens.ts) |
| Responsive Variants | No | No (planned) |
| Size | ~200 lines | ~1371 lines |

**Recommendation:** Use `cssints/` for production (comprehensive utilities) and `minimal-compiler` for simple use cases or learning.
