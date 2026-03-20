# CSS-in-TS Demo App

This is a demonstration Vite + React app showing how the CSS-in-TS system works.

## What's This?

This demo shows a **simplified version** of what the CSS-in-TS system produces. In a full implementation:

1. **Macro Phase**: TypeScript functions like `css.p(4)` would generate placeholder CSS at build time
2. **Post-Processing**: The placeholder CSS gets transformed into actual CSS with hashed class names
3. **Result**: Optimized, minified CSS with CSS layers for specificity control

## Current Demo Structure

```
src/
├── App.tsx      # React components using standard CSS classes
├── App.css      # CSS that the postprocessor would generate
└── main.tsx     # Entry point
```

## How It Works

### 1. Write TypeScript with Macros (Future)

```typescript
// In a real implementation with Parcel macros:
import * as css from "cssints" with { type: "cssints" };

const padding = css.p(4); // Generates: @atomic padding 1rem { }
const margin = css.m(2); // Generates: @atomic margin 0.5rem { }
const responsive = css.calc("100vw", "-", "2rem"); // @calc _hash 100vw - 2rem { }

// Use in component
const className = css.cn(padding, margin);
// Result: "_a1b2c3 _d4e5f6"
```

### 2. Build Process (Future)

```
TypeScript Source
       ↓
Parcel Macro Expansion
       ↓
Placeholder CSS
       ↓
@cssints/postprocessor
       ↓
Final CSS (hashed, minified, layered)
```

### 3. Output CSS (What You See in App.css)

```css
@layer _.b {
	._a1b2c3 {
		padding: 1rem;
	}
	._d4e5f6 {
		margin: 0.5rem;
	}
}
```

## Running the Demo

```bash
cd apps/demo

# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build
```

## Key Features Demonstrated

### CSS Layers

The CSS uses `@layer _.b` to wrap utility classes. This provides:

- **Specificity control**: Utilities have predictable precedence
- **Cascade management**: Easy to override when needed
- **Organization**: Different concerns in different layers

### Atomic CSS

Each utility is a single declaration:

- `._a1b2c3 { padding: 1rem; }`
- `._d4e5f6 { margin: 0.5rem; }`

Benefits:

- **Minimal CSS**: Only includes what you use
- **Cache friendly**: Reusable across components
- **Fast runtime**: No CSS-in-JS overhead

### Type Safety

In a full implementation:

- `css.p(4)` validates that `4` is a valid spacing value
- `css.calc("100vw", "-", "2rem")` ensures proper calc syntax
- No typos in CSS property names (compile-time errors)

## Next Steps

To integrate this into a real Vite app:

1. **Add Parcel**: Configure Parcel to process TypeScript macros
2. **Create Vite Plugin**: A Vite plugin that:
   - Processes `*.cssints.ts` files
   - Extracts placeholder CSS
   - Runs `@cssints/postprocessor`
   - Injects the final CSS

3. **Use Macros**: Import from `cssints` with `{ type: "cssints" }`

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   TypeScript    │────▶│  Parcel Macros   │────▶│  Placeholder    │
│   Source Code   │     │  (compile-time)  │     │  CSS            │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React App     │◀────│  Vite Dev Server │◀────│  Postprocessor  │
│   (runtime)     │     │                  │     │  (LightningCSS) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Learn More

- [Main README](../../README.md)
- [cssints package](../../packages/cssints/)
- [@cssints/postprocessor](../../packages/cssints-postprocessor/)

---

**Note**: This demo uses standard CSS. The macro system is not yet integrated with Vite in this example.
