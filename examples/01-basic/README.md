# Basic CSS-in-TS Example

This example demonstrates the basic CSS-in-TS workflow:
1. Import macro functions
2. Generate placeholder CSS
3. Process with postprocessor

## Usage

```typescript
// styles.ts
import * as css from "cssints" with { type: "cssints" };

// Atomic utilities
const padding = css.p(4);        // Generates: @atomic padding 1rem { }
const margin = css.m(2);         // Generates: @atomic margin 0.5rem { }
const flex = css.flex();         // Generates: @atomic display flex { }

// Responsive calc
const container = css.calc("100vw", "-", "2rem");  // @calc _hash 100vw - 2rem { }

// Usage in component
const className = css.cn(padding, margin, flex);
// Output: "_a1b2c3 _d4e5f6 _g7h8i9"
```

## Post-Processing

```typescript
// build.ts
import { processCSS } from "@cssints/postprocessor";
import { Effect } from "effect";

const placeholderCSS = `
  @atomic padding 1rem { }
  @atomic margin 0.5rem { }
  @atomic display flex { }
  @calc _abc123 100vw - 2rem { }
`;

const result = await Effect.runPromise(
  processCSS(placeholderCSS, { minify: true })
);

console.log(result.code);
// Output:
// @layer _.b{._a1b2c3{padding:1rem}._d4e5f6{margin:.5rem}._g7h8i9{display:flex}._abc123{width:calc(100vw - 2rem)}}
```

## Build Command

```bash
# Generate CSS from placeholder
bun run build.ts

# Or use the CLI (if we create one)
cssints-process styles.css -o output.css
```
