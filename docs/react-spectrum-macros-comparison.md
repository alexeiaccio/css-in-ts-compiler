# React Spectrum Macros vs Our CSS-in-TS Compiler: Deep Comparison

This document analyzes how [React Spectrum S2](https://github.com/adobe/react-spectrum/tree/main/packages/%40react-spectrum/s2/style) uses build-time macros (via [unplugin-parcel-macros](https://github.com/devongovett/unplugin-parcel-macros)) for styling, comparing it to our approach.

---

## Overview

React Spectrum S2 uses a macro-based styling system where style functions execute at build time via Parcel's macro implementation (made available across bundlers through `unplugin-parcel-macros`). Styles are transformed into optimized CSS with deterministic class names and optional runtime composition.

Key features:
- Build-time macro execution with `import ... with {type: 'macro'}`
- Dual-mode compilation: static styles return class strings, dynamic styles return functions
- Advanced condition system: CSS conditions (`:hover`), runtime props (`isFocusVisible`), variant conditions
- CSS @layer priority system for specificity control
- Theme-driven type inference
- Asset generation via macro context

---

## The Macro System

### How Macros Work

Macros are JavaScript functions that run at build time, returning values inlined into the bundle:

```typescript
// Import with macro attribute - executes at build time
import { style } from '@react-spectrum/s2/style' with {type: 'macro'};

// This runs at build time, returns a static class string
const buttonStyle = style({
  backgroundColor: 'primary',
  padding: '8px 16px',
});

// Usage at runtime - just a string, zero cost
<div className={buttonStyle}>Button</div>
```

**Build-time transformation:**

```javascript
// Before (source)
const buttonStyle = style({ backgroundColor: 'primary', padding: '8px 16px' });

// After (bundled)
const buttonStyle = " -m1a2b3c4 -p1x5y6z7";

// CSS asset emitted:
@layer _.a {
  .-m1a2b3c4 { background-color: var(--color-primary); }
  .-p1x5y6z7 { padding: 8px 16px; }
}
```

### Static vs Dynamic Mode

The macro detects whether styles are static or dynamic:

**Static mode** - Returns a string (all conditions are CSS-based):

```typescript
const staticStyle = style({
  backgroundColor: {
    default: 'primary',
    ':hover': 'secondary',
  },
});

// Returns: " -m1a2b3c4 -m1hover4d5e6"
```

**Dynamic mode** - Returns a function (runtime conditions present):

```typescript
const dynamicStyle = style({
  backgroundColor: {
    default: 'primary',
    isFocusVisible: 'focus-ring',
  },
});

// Returns: (props) => ` -m1a2b3c4${props.isFocusVisible ? ' -m1focus4d5e6' : ''}`
```

The macro generates JavaScript that conditionally builds the class string at runtime.

---

## Style Compilation

### Class Name Generation

React Spectrum uses deterministic class names based on property, conditions, and value:

```
[propertyPrefix][conditionCodes][valueCode][versionPostfix]
```

Example breakdown:

```typescript
style({
  backgroundColor: {
    default: 'primary',
    ':hover': 'secondary',
  },
});
```

Generates classes:

```
// Class name: -m + (default → empty) + 1a2b3c4 (hash of "primary") + v1.0
-m1a2b3c4

// Class name: -m + (:hover → h) + 1d5e6f7 (hash of "secondary") + v1.0
-mh1d5e6f7
```

**Version postfix** prevents cache issues during development (e.g., `nightly-123` or `v1.2.3`).

### CSS Asset Emission

Macros emit CSS assets via the macro context:

```typescript
export function style(this: MacroContext | void, styleObj) {
  // ... compile styles ...

  if (this && typeof this.addAsset === 'function') {
    this.addAsset({
      type: 'css',
      content: css // Generated CSS string
    });
  }

  return classNameString;
}
```

The bundler plugin collects these assets and writes them to the CSS bundle.

---

## Advanced Features

### Condition System

React Spectrum supports three types of conditions:

#### 1. CSS Conditions (static)

```typescript
style({
  backgroundColor: {
    default: 'primary',
    ':hover': 'secondary',
    '@media (prefers-color-scheme: dark)': 'dark-primary',
    ':focus-visible': 'focus-ring',
  },
});
```

Generated CSS:

```css
@layer _.a {
  .-m1a2b3c4 { background-color: var(--color-primary); }
}

@layer _.b {
  .-m1hover4d5e6:hover { background-color: var(--color-secondary); }
}

@layer _.b._dark {
  @media (prefers-color-scheme: dark) {
    .-m1dark5e6f7 { background-color: var(--color-dark-primary); }
  }
}

@layer _.c {
  .-m1focus4d5e6:focus-visible { background-color: var(--color-focus-ring); }
}
```

#### 2. Runtime Boolean Conditions

```typescript
style({
  outlineStyle: {
    default: 'none',
    isFocusVisible: 'solid',
  },
  outlineColor: {
    default: 'focus-ring',
    forcedColors: 'Highlight',
  },
});

// Returns function: (props) => `...${props.isFocusVisible ? ' -o2solid' : ''}...`
```

#### 3. Variant Conditions

```typescript
style({
  padding: {
    default: 'medium',
    size: {
      small: 'small',
      large: 'large',
    },
  },
});

// Returns function: (props) => `...${props.size === 'small' ? ' -p3small' : ''}...`
```

### CSS @layer Priority System

React Spectrum uses CSS layers to control specificity:

```typescript
// Layers are declared in priority order
@layer _.a, _.b, _.c, _.d, _.e;

// Each condition increments priority:
// - default: _.a (priority 0)
// - :hover: _.b (priority 1)
// - @media: _.c (priority 1)
// - nested conditions: _.d, _.e (higher)
```

This ensures:
- Later conditions always override earlier ones
- No need for `!important`
- Predictable cascade regardless of declaration order

### Shorthands

Shorthands expand to multiple CSS properties:

```typescript
const theme = {
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
    margin: (value) => ({
      marginTop: value,
      marginBottom: value,
      marginStart: value,
      marginEnd: value,
    }),
  },
};

style({
  padding: 'medium',
  // Expands to: paddingTop, paddingBottom, paddingLeft, paddingRight
});
```

### Custom Properties

Custom CSS properties can reference theme types:

```typescript
style({
  '--custom-prop': {
    type: 'color',  // References theme.color
    value: 'primary',
  },
});

// Generates CSS variable with type-safe values
.--custom-prop { color: var(--color-primary); }
```

### Arbitrary Values

Multiple syntaxes for arbitrary values:

```typescript
style({
  // CSS variable reference
  color: '--my-color',

  // Arbitrary value in brackets
  padding: '[20px]',

  // CSS functions
  width: 'calc(100% - 20px)',

  // CSS wide keywords
  color: 'inherit',
});
```

### self() References

Properties can reference other properties:

```typescript
style({
  '--box-shadow': {
    type: 'color',
    value: 'primary',
  },
  boxShadow: 'self(--box-shadow)',
});

// Generates:
.--box-shadow { --box-shadow: var(--color-primary); }
.box-shadow { box-shadow: 0 0 10px var(--box-shadow); }
```

### Keyframes

Dedicated macro for animations:

```typescript
import { keyframes } from '@react-spectrum/s2/style' with {type: 'macro'};

const fadeIn = keyframes(`
  from { opacity: 0; }
  to { opacity: 1; }
`);

// Returns class name referencing the keyframe animation
```

### Raw CSS

Inject arbitrary CSS with custom layers:

```typescript
import { raw } from '@react-spectrum/s2/style' with {type: 'macro'};

const customClass = raw(`
  background: linear-gradient(to right, red, blue);
`, '_.custom');
```

---

## Token System

### Theme Definition

Themes define properties with type mappings and condition sets:

```typescript
const theme = {
  properties: {
    // Simple mapping
    color: {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
    },

    // Array of allowed values
    display: ['block', 'flex', 'grid', 'none'],

    // Custom Property class
    backgroundColor: new MappedProperty('background-color', {
      primary: 'var(--color-primary)',
      // ...
    }),
  },

  conditions: {
    // CSS conditions
    ':hover': ':hover',
    '@media (prefers-color-scheme: dark)': '@media (prefers-color-scheme: dark)',

    // Media query aliases
    'dark': '@media (prefers-color-scheme: dark)',
    'light': '@media (prefers-color-scheme: light)',
  },

  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
  },
};
```

### Type Inference

Theme properties automatically infer TypeScript types:

```typescript
// ThemeProperties<Theme> extracts all property types
type StyleProps = ThemeProperties<SpectrumTheme>;

// Usage is fully type-checked
const buttonStyle = style<StyleProps>({
  backgroundColor: 'primary',      // ✅ Valid
  padding: 'medium',                // ✅ Valid
  display: 'flex',                  // ✅ Valid
  display: 'invalid',               // ❌ TypeScript error
});
```

---

## Detailed Comparison

| Aspect | React Spectrum Macros | Our Approach |
|--------|----------------------|--------------|
| **Build-time execution** | Macros via `import {type: 'macro'}` | Vite plugin (oxc transformer) |
| **Class naming** | Deterministic: `prop + conditions + value + version` | Simple: `name__hash` |
| **CSS output** | Emitted as assets via macro context | Extracted to CSS file |
| **Static vs dynamic** | Auto-detected, returns string or function | Always string (runtime composition) |
| **Conditions** | CSS, runtime bool, variant conditions | Only runtime props |
| **Priority system** | CSS @layer ordering | N/A (cascade-based) |
| **Token format** | Theme object with type inference | W3C DTCG format |
| **Type safety** | Auto-inferred from theme | Manual typing needed |
| **Shorthands** | Built-in expansion support | Manual implementation |
| **Custom properties** | Type-mapped to theme values | Direct CSS vars |
| **Arbitrary values** | `[$value]`, CSS vars, functions | Full CSS support |
| **Asset generation** | `this.addAsset()` in macro context | Plugin collects styles |
| **Build tools** | webpack, Vite, Rollup, esbuild, Next.js | Vite (oxc) |
| **Keyframes** | Dedicated `keyframes()` macro | Standard CSS |
| **Zero runtime** | For static styles | Always zero runtime |

---

## What React Spectrum Does Well

### 1. Dual-Mode Compilation

Automatic optimization based on condition types:

```typescript
// Static - returns string at build time
const staticStyle = style({
  color: {
    default: 'primary',
    ':hover': 'secondary',
  },
});

// Dynamic - returns function for runtime props
const dynamicStyle = style({
  color: {
    default: 'primary',
    isFocusVisible: 'focus-ring',
  },
});
```

### 2. CSS @layer Priority System

Predictable specificity without `!important`:

```typescript
// Later conditions always win, regardless of CSS specificity
@layer _.a { /* default */ }
@layer _.b { /* :hover, @media */ }
@layer _.c { /* nested conditions */ }
```

### 3. Comprehensive Condition System

Support for three condition types in one API:

```typescript
style({
  color: {
    default: 'primary',              // Default
    ':hover': 'secondary',           // CSS pseudo-class
    '@media (prefers-color-scheme: dark)': 'dark',  // CSS media query
    isFocusVisible: 'focus-ring',    // Runtime boolean
    size: {                          // Variant condition
      small: 'small-text',
      large: 'large-text',
    },
  },
});
```

### 4. Theme-Driven Type Inference

Automatic TypeScript types from theme definition:

```typescript
type StyleProps = ThemeProperties<SpectrumTheme>;

// Full autocomplete and type checking
const styleFn = style<StyleProps>({
  backgroundColor: 'primary',  // ✅ Auto-completes
  invalidProp: 'value',       // ❌ TypeScript error
});
```

### 5. Shorthand Expansion

Automatic expansion of shorthands to longhands:

```typescript
const theme = {
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
  },
};

style({ padding: 'medium' });
// Expands to all four padding properties
```

### 6. Self References

Properties can reference other properties:

```typescript
style({
  '--shadow-color': { type: 'color', value: 'primary' },
  boxShadow: 'self(--shadow-color)',
});
```

### 7. Asset Generation Context

Clean API for emitting CSS:

```typescript
function style(this: MacroContext | void, ...) {
  const css = generateCSS();

  if (this?.addAsset) {
    this.addAsset({ type: 'css', content: css });
  }

  return className;
}
```

### 8. Cross-Bundler Support

Works across multiple build tools via unplugin:

```javascript
// Vite
import macros from 'unplugin-parcel-macros';
export default { plugins: [macros.vite()] };

// Rollup
import macros from 'unplugin-parcel-macros';
export default { plugins: [macros.rollup()] };

// Webpack, esbuild, Next.js...
```

---

## Our Strengths vs React Spectrum

### 1. Simpler Class Names

```css
/* React Spectrum */
.-m1a2b3c4 { background-color: var(--color-primary); }

/* Our approach */
.button__a1b2c3d4 { background-color: var(--color-primary); }
```

More readable, component-scoped names.

### 2. W3C DTCG Compliance

```typescript
// Our approach follows Design Tokens Community Group spec
const tokens = {
  color: {
    primary: {
      $value: "#3b82f6",
      $type: "color",
      $description: "Brand primary color",
    },
  },
};
```

Better interoperability with design tools.

### 3. Composition API

```typescript
// Explicit composition
const composed = cx(baseStyles, variantStyles, conditionalStyles);

// React Spectrum relies on style merging
className={styleFn(props)}
```

### 4. Registry Pattern

Runtime registry for:
- SSR hydration
- Style extraction
- Dynamic theming
- Style inspection

### 5. Simpler Build Setup

```typescript
// Our approach - single Vite plugin
export default {
  plugins: [cssInTsCompiler()],
};

// React Spectrum - unplugin + macro system
import macros from 'unplugin-parcel-macros';
export default {
  plugins: [macros.vite()],
  // Plus configure macro system...
};
```

### 6. Deterministic Hashing

Hashes based on style object content:

```typescript
style("button", { color: "red" });
// Always produces: .button__abc123

// React Spectrum hashes include version
style({ color: 'red' });
// Produces: .-mhash_v1.2.3 (changes on version update)
```

---

## Potential Improvements for Our Approach

### 1. Add CSS @layer Priority System

```typescript
// Proposed
style("button", {
  color: "red",
  "@layer higher": {
    color: "blue",  // Always wins via layer ordering
  },
});
```

### 2. Add Dual-Mode Compilation

```typescript
// Proposed - detect static vs dynamic
const staticStyle = style({
  color: "red",  // Static, returns string
});

const dynamicStyle = style({
  color: {
    default: "red",
    isHover: "blue",  // Dynamic, returns function
  },
});
```

### 3. Add Shorthand Support

```typescript
// Proposed
const theme = {
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
  },
};

style("button", { padding: "medium" });
// Automatically expands
```

### 4. Add Condition Types

```typescript
// Proposed
style("button", {
  color: {
    default: "red",
    ":hover": "blue",          // CSS condition
    "@media (min-width: 768px)": "green",  // Media query
    isFocus: "yellow",         // Runtime prop
    size: {                     // Variant
      small: "blue",
      large: "red",
    },
  },
});
```

### 5. Add Self References

```typescript
// Proposed
style("button", {
  "--shadow-color": "primary",
  boxShadow: "self(--shadow-color)",
});
```

### 6. Add Keyframes Macro

```typescript
// Proposed
const fadeIn = keyframes(`
  from { opacity: 0; }
  to { opacity: 1; }
`);
```

### 7. Improve Type Inference

```typescript
// Proposed - auto-infer from tokens
type StyleProps = InferTokenTypes<typeof tokens>;

const buttonStyle = style<StyleProps>("button", {
  color: "primary",  // Auto-completes from tokens
});
```

### 8. Add Arbitrary Value Syntax

```typescript
// Proposed
style("button", {
  width: "[calc(100% - 20px)]",  // Arbitrary value
  color: "--my-var",              // CSS variable
});
```

---

## Conclusion

React Spectrum's macro-based approach excels at:
- **Dual-mode compilation** - Automatic optimization for static/dynamic styles
- **Advanced condition system** - CSS, runtime, and variant conditions in one API
- **Priority control** - CSS @layer system for predictable specificity
- **Type inference** - Automatic types from theme definitions
- **Cross-bundler support** - Works everywhere via unplugin-parcel-macros
- **Shorthands & self references** - Advanced style composition features

Our approach excels at:
- **Simpler class names** - Component-scoped, readable names
- **W3C DTCG compliance** - Industry-standard token format
- **Composition API** - Explicit `cx()` for style merging
- **Registry pattern** - Runtime access to styles for SSR/hydration
- **Simpler build setup** - Single Vite plugin, less complexity
- **Deterministic hashing** - Content-based hashes, no version drift

### When to Use Each

**Choose React Spectrum Macros** if you need:
- Complex condition systems (CSS + runtime + variants)
- Predictable specificity via layers
- Cross-bundler compatibility
- Theme-driven type inference

**Choose Our Approach** if you need:
- W3C DTCG token compliance
- Simpler, more readable class names
- Explicit composition patterns
- Runtime registry capabilities

Both achieve zero-runtime overhead - the main difference is macro-based dual-mode compilation vs simpler plugin-based extraction.

---

## References

- [unplugin-parcel-macros Repository](https://github.com/devongovett/unplugin-parcel-macros)
- [React Spectrum S2 Style Package](https://github.com/adobe/react-spectrum/tree/main/packages/%40react-spectrum/s2/style)
- [Parcel Macros Documentation](https://parceljs.org/features/macros/)
- [TC39 Import Attributes Proposal](https://github.com/tc39/proposal-import-attributes)
- [W3C Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
