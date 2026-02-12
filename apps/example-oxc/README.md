# css-in-ts oxc Example

This example demonstrates the new **oxc-based** Vite plugin for css-in-ts.

## Differences from the original plugin

| Feature     | Original (vite-plugin.ts) | New (oxc-plugin.ts)       |
| ----------- | ------------------------- | ------------------------- |
| Parsing     | Regex-based               | AST-based (oxc-parser)    |
| Reliability | Limited                   | Full TypeScript support   |
| Performance | Good                      | 3-5x faster               |
| Source maps | Limited                   | Full support (debug mode) |
| Status      | Deprecated                | Recommended               |

## Usage

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build
```

## Vite Configuration

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cssTSOxcPlugin } from "css-in-ts/oxc";

export default defineConfig({
	plugins: [
		react(),
		cssTSOxcPlugin({
			include: ["**/*.tsx", "**/*.ts"],
			exclude: ["**/node_modules/**"],
			cssFileName: "styles.css",
			inject: true,
			debug: false, // Enable for source maps
		}),
	],
});
```

## API

The oxc-plugin uses the same API as the original plugin:

```typescript
import { style, cx } from "css-in-ts";

// Component styles
const button = style("button", {
	color: "red",
	"&:hover": {
		color: "blue",
	},
});

// Composed utilities
const className = cx(button, { backgroundColor: "blue" });
```
