# SugarCube vs Our CSS-in-TS Compiler: Deep Comparison

This document analyzes how [SugarCube](https://sugarcube.sh) handles design tokens and CSS generation, comparing it to our approach.

---

## Overview

SugarCube is a toolkit for building frontends using design tokens, generated CSS, and optional components. It follows the W3C Design Tokens Community Group (DTCG) specification.

---

## Token System

Both approaches use W3C DTCG format for design tokens.

### SugarCube Token Format

```json
{
	"color": {
		"primary": {
			"$value": "#3b82f6",
			"$type": "color"
		}
	}
}
```

### Our Implementation

```typescript
// tokens.ts
{
  color: {
    primary: {
      $value: "#3b82f6",
      $type: TokenType.COLOR
    }
  }
}
```

### Key Difference

- **SugarCube**: Token files are JSON, loaded from disk via resolver document
- **Our approach**: Defaults embedded in code + can load from JSON files

---

## CSS Generation: Different Philosophies

### SugarCube: Token-Based Semantic Classes

SugarCube generates semantic class names derived from token paths:

```css
.bg-primary {
	background-color: var(--color-primary);
}
.text-lg {
	font-size: var(--font-size-lg);
}
.p-md {
	padding: var(--space-md);
}
```

**How it works:**

1. Define utility mappings in config:

```typescript
// sugarcube.config.ts
export default defineConfig({
	utilities: {
		"background-color": {
			source: "color.*",
			prefix: "bg",
		},
	},
});
```

2. SugarCube scans codebase for used utilities
3. Generates only used utilities (JIT)

**Resolver document** handles token composition:

```json
{
  "version": "2025.10",
  "resolutionOrder": [
    { "type": "set", "name": "base", "sources": [...] },
    { "type": "modifier", "name": "theme", "default": "light", "contexts": { "dark": [...] } }
  ]
}
```

### Our Approach: Hash-Based Opaque Classes

We generate deterministic hash-based class names (StyleX/vanilla-extract pattern):

```css
.button__a1b2c3d4 {
	color: red;
}
.card__e5f6g7h8 {
	padding: 1rem;
}
```

CSS variables use hash scoping:

```css
:root {
	--scope-primary__a1b2c3d4: #3b82f6;
}
```

**How it works:**

1. Define styles via API:

```typescript
const button = style("button", { color: "red" });
```

2. Hash generated from style content
3. Register in runtime registry
4. Extract CSS at build time

---

## Detailed Comparison

| Aspect               | SugarCube                   | Our Approach                 |
| -------------------- | --------------------------- | ---------------------------- |
| **Class names**      | Semantic (`.bg-primary`)    | Opaque (`.button__a1b2c3d4`) |
| **Source of truth**  | Token files (JSON)          | Runtime registry + code      |
| **Theming**          | Built-in via modifiers      | Manual via theme system      |
| **Organization**     | CUBE CSS methodology        | Custom API                   |
| **Utilities**        | Config-based token mapping  | Pre-built functions          |
| **CSS Output**       | Variables + utilities       | Hash-scoped classes          |
| **Delivery**         | Vite plugin + CLI           | Vite plugin (oxc)            |
| **Token references** | `{color.primary}` syntax    | Manual resolution            |
| **CSS cascade**      | Embraces cascade (CUBE CSS) | Avoids cascade (scoped)      |

---

## What SugarCube Does Well

### 1. Resolver Document

Elegant token composition with sets and modifiers:

```json
{
	"resolutionOrder": [
		{ "type": "set", "name": "foundation", "sources": [{ "$ref": "./foundation.json" }] },
		{ "type": "set", "name": "semantic", "sources": [{ "$ref": "./semantic.json" }] },
		{ "type": "modifier", "name": "theme", "default": "light", "contexts": { "dark": [{ "$ref": "./dark.json" }] } }
	]
}
```

- Base tokens first
- Semantic layer overrides foundation
- Theme modifiers at end

### 2. Utility Generation Config

Declarative mapping from tokens to CSS:

```typescript
utilities: {
  "background-color": { source: "color.*", prefix: "bg" },
  "color": { source: "color.*", prefix: "text" },
  "padding": { source: "space.*", prefix: "p", directions: ["all", "top", "right", "bottom", "left", "x", "y"] }
}
```

Generates directional variants automatically: `.p-sm`, `.pt-sm`, `.pr-sm`, `.pb-sm`, etc.

### 3. Full DTCG Compliance

- Token references: `{color.primary}`
- Type inheritance: `$type` on parent groups
- Metadata: `$description`, `$extensions`

### 4. CUBE CSS Integration

Provides file structure and methodology:

```
styles/
├── blocks/
├── compositions/
├── global/
└── utilities/
```

---

## Our Strengths vs SugarCube

### 1. Hash-Based Scoping

- No class name collisions
- No CSS isolation needed
- Automatic dead code elimination
- Works without runtime registry

### 2. Type-Safe API

```typescript
// Our approach
const button = style("button", { color: "red" });

// SugarCube - string-based
class="bg-primary"  // No compile-time checking
```

### 3. Composition

```typescript
const styles = cx({ color: "red" }, { padding: "1rem" });
```

### 4. Runtime Registry

Can extract/inspect styles at runtime for:

- SSR hydration
- Style debugging
- Dynamic style extraction

### 5. Lighter Output

- Only generates used styles
- No unused token utilities
- Smaller CSS bundle

---

## Potential Improvements for Our Approach

### 1. Add Token File Loading

Implement resolver document for multi-file token organization:

```typescript
// Proposed API
const tokens = loadTokens("./design-tokens/tokens.resolver.json");
```

### 2. Add Theming Support

Built-in light/dark theme via modifier system:

```typescript
// Proposed API
createTheme("light", tokens);
createTheme("dark", darkTokens);
```

### 3. Add Utility Config

Declarative utility generation from tokens:

```typescript
// Proposed API
defineConfig({
	utilities: [
		{ property: "background-color", source: "color.*", prefix: "bg" },
		{ property: "color", source: "color.text.*", prefix: "text" },
	],
});
```

### 4. CSS Variables from Tokens

Generate `--token-*` variables alongside hash-based classes:

```css
:root {
	/* From tokens */
	--color-primary: #3b82f6;
	--space-md: 1rem;

	/* Hash-scoped for component styles */
	--button-color__a1b2c3d4: red;
}
```

### 5. Token References

Support `{path.to.token}` syntax:

```json
{
	"color": {
		"button": {
			"background": { "$value": "{color.primary}" }
		}
	}
}
```

---

## Conclusion

SugarCube excels at:

- Token-driven workflows
- Semantic class naming
- CUBE CSS methodology
- Full DTCG compliance

Our approach excels at:

- Zero-runtime overhead potential
- Type-safe API
- Hash-based isolation
- Composition patterns

Both approaches are valid - SugarCube optimizes for design system maintainability, while ours optimizes for component isolation and type safety.

---

## References

- [SugarCube Documentation](https://sugarcube.sh/docs/)
- [W3C DTCG Specification](https://www.designtokens.org/)
- [CUBE CSS by Andy Bell](https://cube-css.com/)
