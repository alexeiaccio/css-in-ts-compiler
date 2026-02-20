# AGENTS.md

This repository is a CSS-in-TypeScript compiler with hash-based class names, following StyleX and vanilla-extract patterns.

## Commands

### Build & Development
```bash
# Build all packages
bun run build

# Development mode
bun run dev
```

### Testing
```bash
# Run all tests
bun test

# Run single test file
bun test --run packages/compiler/src/__tests__/compiler.test.ts
# or with vitest directly
vitest run packages/compiler/src/__tests__/compiler.test.ts

# Run specific test pattern
bun test --run -t "should generate hash-based class names"
```

### Linting & Formatting
```bash
# Type-aware linting
bun run lint

# Auto-fix linting issues
bun run lint:fix

# Type-check only
bun run lint:check

# Format code
bun run fmt

# Check formatting
bun run fmt:check
```

## Code Style Guidelines

### Formatting (oxfmt)
- **Indentation**: 2 spaces (configured as tabs in config)
- **Line width**: 120 characters
- **Quotes**: Double quotes
- **Semicolons**: Required
- **Trailing commas**: Always
- **Arrow function parens**: Always required
- **Import sorting**: Enabled with newlines between groups

### TypeScript Configuration
- **Strict mode**: Enabled
- **Target**: ESNext
- **Module**: Preserve (for bundlers)
- **No unchecked indexed access**: Enabled
- **No implicit override**: Enabled
- **Verbatim module syntax**: Enabled (no `import type`)

### Import Style
- Use ES module imports (no CommonJS)
- Keep imports at the top of files
- Use explicit type imports where appropriate: `import type { … }`
- Avoid namespace imports when named imports available

### Type Definitions
- Use `interface` for object shapes that can be extended
- Use `type` for unions, primitives, and utility types
- Prefer explicit type annotations over inference where intent matters
- Use branded types for runtime type guards: `type Brand = { __brand: "brand" }`

### Naming Conventions
- **Functions/Variables**: camelCase (`generateHash`, `classRegistry`)
- **Types/Interfaces**: PascalCase (`CSSProperties`, `MediaFunction`)
- **Constants**: UPPER_SNAKE_CASE for true constants, PascalCase for enums
- **Private members**: Prefix with underscore (`_internalMethod`)
- **Classes**: PascalCase with descriptive names

### Error Handling
- Use try-catch for async operations with proper error logging
- Provide meaningful error messages with context
- Use Effect TS for functional error handling and composability
- Exit with non-zero code on CLI errors: `process.exit(1)`

### Testing (Vitest)
- Use `describe` blocks for grouping related tests
- Use `beforeEach`/`afterEach` for setup/teardown
- Prefer `expect().toBe()` over `===` for assertions
- Use `toMatch()` for regex patterns
- Use `import.meta.vitest` for test-only imports

### File Structure
- Core compiler code in `packages/compiler/src/`
- CSS-in-TS utilities in `packages/cssints/src/`
- Tests co-located in `src/__tests__/` or test files alongside source
- Generated types in separate `.gen.ts` files

### OXC Linting Rules
All TypeScript and correctness rules enforced as errors:
- No `any` types
- No unsafe operations
- No duplicate keys/values
- Proper JSDoc on exported functions
- Import organization and no duplicates

## Notes

- This is a monorepo using Turborepo
- Bun is the package manager and test runner
- Effect TS 4 Beta is used for functional patterns
- OXC parser/transformer for AST manipulation
- Vite plugins: Both AST-based (oxc) and regex-based (legacy)
- API documentation: `docs/API.md` (primary reference)

## Common Patterns

### Style Definition
```typescript
const button = style("button", {
  color: "red",
  "&:hover": { color: "blue" },
});
```

### Utility Composition
```typescript
const styles = cx({ color: "red" }, { padding: "1rem" });
```

### Registry Pattern
```typescript
const classRegistry = new Map<string, RegisteredClass>();
export function getRegisteredClasses() {
  return new Map(classRegistry);
}
export function clearRegistry() {
  classRegistry.clear();
}
```

### Hash Generation
```typescript
function generateHash(props: CSSProperties): string {
  const str = JSON.stringify(normalizeProperties(props));
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}
```
