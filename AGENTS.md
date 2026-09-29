# AGENTS.md

This repository is a CSS-in-TypeScript compiler with hash-based class names, following StyleX and vanilla-extract patterns.

## Layout

```
packages/cssints       Vite plugin on the Module Runner (src/plugin.mjs) + the cssints library (src/)
                       test/: fixtures, run.mjs, map-check.mjs, spec/ (Quint model, race, mbt), hmr/ app
packages/css-grammar   type-level recognizer (src/css.ts) + runtime twin (src/twin.ts) over mdn-data grammars,
                       Typed OM values, BCD support warnings, prose rules; test/, bench/ (instantiation budgets)
packages/plugin-icon   icon plugin (not yet ported to the new engine)
apps/demo              React demo on the plugin
docs/wayfinder.md      decisions and findings log (start here); docs/API.md target API
docs/research/         comparisons with other libraries; docs/archive/ outdated plans
```

## Commands

```bash
bun install
bun run test                                  # all packages (turbo)
bun run bench                                 # css-grammar instantiation budgets (tsc + tsgo)

cd packages/cssints && bun run test           # fixtures, source maps, HMR races, hmr app
cd packages/cssints/test && node run.mjs fixtures/risk1.ts   # one fixture: prints code and css
cd packages/css-grammar && bun run test       # twin + type checks, support/prose rules, tsc
cd packages/css-grammar && bun run extract    # regenerate src/mdn.ts from mdn-data + @webref/css
cd packages/css-grammar && node bench/budget.mjs --update    # after a deliberate type-cost change
cd apps/demo && bun run build
```

Plain `.ts` files run with `node` (type stripping), no build step.

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

## Tech stack

Start here:

- [Effect TS 4](https://github.com/Effect-TS/effect-smol/blob/main/LLMS.md)

Other deps:

- [Effect Schema](https://github.com/Effect-TS/effect-smol/blob/main/packages/effect/SCHEMA.md)
- [OXC parser](https://oxc.rs/docs/guide/usage/parser)
- [OXC transformer](https://oxc.rs/docs/guide/usage/transformer)
- [Lighting CSS](https://lightningcss.dev)
- [tsdown](https://tsdown.dev/)
- [Vite 8](https://main.vite.dev/)
- [Vitest](https://main.vitest.dev/)
- [TypeScript Go](https://github.com/microsoft/typescript-go)
- [OXC lint](https://oxc.rs/blog/2025-12-08-type-aware-alpha)
- [OXC fmt](https://oxc.rs/docs/guide/usage/formatter)
- [Turborepo](https://turborepo.dev/)
- [Bun](https://bun.sh)
- [Knip](https://knip.dev/)

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

- **ALWAYS use Effect TypeScript** for operations with side effects
- Use `Data.TaggedErrorClass` for custom error types with schema definitions
- Use `Effect.gen()` for sequencing async operations
- Use `Effect.try()` for wrapping potentially failing operations
- Use `Effect.fn()` for named functions that return Effects
- Use `Console.log/info/warn/error` for structured logging
- Use `Effect.catchTag()` for typed error recovery
- Exit with non-zero code on CLI errors: `process.exit(1)`

Example:

```typescript
export class FileError extends Data.TaggedErrorClass<FileError>()("FileError", {
	path: Schema.String,
	operation: Schema.Literal("read" | "write" | "delete"),
	reason: Schema.String,
}) {}

const program = Effect.gen(function* () {
	return yield* Effect.try({
		try: () => riskyOperation(),
		catch: (error) =>
			new FileError({
				path: "file.txt",
				operation: "write",
				reason: error.message,
			}),
	});
});
```

### Effect TypeScript Usage

**PRINCIPLE: All code with side effects MUST use Effect TypeScript.**

Effect TS provides:

- Type-safe error handling via tagged errors
- Composable async operations via Effect.gen()
- Predictable data flow
- Better testing (effects can be easily mocked)
- Consistent patterns across codebase

#### When to Use Effect TypeScript

Use Effect for ANY operation that:

- Performs I/O (file system, network)
- Has possibility of failure (parsing, validation)
- Needs sequencing of async operations
- Requires error handling with context
- Is used in tests or production code

**File operations**, **parsing**, **validation**, and **data transformation** should all use Effect.

#### Core Pattern: Effect.gen() for Sequencing

Use `Effect.gen()` for imperative-style effect composition with `yield*`:

```typescript
import { Effect, Console, Data } from "effect";

Effect.gen(function* () {
	yield* Console.log("Starting conversion...");
	yield* Console.log("Reading file...");

	const data = yield* readFile("input.json");
	const schema = yield* convertToSchema(data);
	const code = yield* generateCode(schema);

	yield* writeFile("output.ts", code);
	yield* Console.log("✓ Complete");
});
```

**IMPORTANT: Always `return` when raising errors in Effect.gen:**

```typescript
Effect.gen(function* () {
	// Always return to ensure TypeScript knows code won't continue
	return yield* new FileError({
		path: "file.txt",
		reason: "Read failed",
	});
});
```

#### Pattern: Effect.fn() for Named Functions

**Use Effect.fn() for reusable functions**, NOT Effect.gen:

```typescript
import { Effect, Console, Data } from "effect";

// ✅ DO - Named function returning Effect
export const readFile = Effect.fn("readFile")(function* (path: string): Effect.Effect<string, ReadError> {
	yield* Console.log(`Reading: ${path}`);
	return yield* Effect.try({
		try: () => readFileSync(path, "utf-8"),
		catch: (error) => new ReadError({ path, reason: error.message }),
	});
});

// ❌ DON'T - Function that returns Effect.gen
export const readFile = function* (path: string): Effect.Effect<string, ReadError> {
	return Effect.gen(function* () {
		// Less readable, worse stack traces
		// Do NOT do this
	});
};
```

**Benefits of Effect.fn():**

- Improved stack traces (named spans)
- Better debugging experience
- Automatic span annotations
- Don't use `.pipe` with Effect.fn

#### Pattern: Data.TaggedErrorClass for Typed Errors

```typescript
import { Data, Schema } from "effect";

// ✅ DO - Use TaggedErrorClass
export class ReadError extends Data.TaggedErrorClass<ReadError>()("ReadError", {
	path: Schema.String,
	reason: Schema.String,
}) {}

export class ParseError extends Data.TaggedErrorClass<ParseError>()("ParseError", {
	input: Schema.String,
	message: Schema.String,
}) {}

export class WriteError extends Data.TaggedErrorClass<WriteError>()("WriteError", {
	path: Schema.String,
	reason: Schema.String,
}) {}

// ❌ DON'T - Use plain TaggedError factory
export const ReadError = Data.TaggedError("ReadError", {
	path: Schema.String,
	reason: Schema.String,
});
```

#### Pattern: Console Logging

```typescript
import { Console } from "effect";

Effect.gen(function* () {
	yield* Console.log("🔄 Starting process");
	yield* Console.info("ℹ️  Additional context");
	yield* Console.warn("⚠️  Warning: deprecated feature");
	yield* Console.error("❌ Error:", error);
});
```

#### Pattern: Effect.try() for Safe Operations

```typescript
import { Effect, Data } from "effect";

const parseJson = Effect.try({
	try: (content: string) => JSON.parse(content),
	catch: (error) =>
		new ParseError({
			input: content.slice(0, 100),
			reason: error instanceof Error ? error.message : "Parse failed",
		}),
});
```

#### Pattern: Effect.catchTag() for Error Recovery

```typescript
import { Effect, Data } from "effect";

const program = Effect.gen(function* () {
	return yield* riskyOperation();
}).pipe(
	Effect.catchTag("ParseError", (_) => Effect.succeed(defaultValue)),
	Effect.catch((error) => Effect.logError(`Unexpected error: ${error}`)),
);
```

#### Pattern: Services (for complex modules)

For complex modules requiring dependency injection, use `ServiceMap.Service`:

```typescript
import { Effect, Layer, Schema, ServiceMap } from "effect";

export class FileService extends ServiceMap.Service<
	FileService,
	{
		read: (path: string) => Effect.Effect<string, ReadError>;
		write: (path: string, content: string) => Effect.Effect<void, WriteError>;
	}
>()("cssints/file-service") {
	static readonly layer = Layer.effect(
		FileService,
		Effect.gen(function* () {
			const readFile = Effect.fn("readFile")(function* (path: string) {
				return yield* Effect.try({
					try: () => readFileSync(path, "utf-8"),
					catch: (error) => new ReadError({ path, reason: error.message }),
				});
			});

			const writeFile = Effect.fn("writeFile")(function* (path: string, content: string) {
				yield* Effect.try({
					try: () => {
						mkdirSync(dirname(path), { recursive: true });
						writeFileSync(path, content, "utf-8");
					},
					catch: (error) => new WriteError({ path, reason: error.message }),
				});
			});

			return FileService.of({ readFile, writeFile });
		}),
	);
}
```

#### Running Effect Programs

```typescript
// CLI scripts
Effect.runPromiseExit(program).then((exit) => {
	if (exit._tag === "Failure") {
		Console.error("❌ Failed:", exit.cause);
		process.exit(1);
	}
});

// Library functions (let caller handle errors)
export function run(): Effect.Effect<void, Error> {
	return Effect.runPromise(program);
}
```

#### What About Simple Operations?

Even pure functions should return Effects for consistency:

```typescript
// ✅ DO - Return Effect from simple functions
function toUpperCase(str: string): Effect.Effect<string> {
	return Effect.sync(() => str.toUpperCase());
}

// ❌ DON'T - Return plain values
function toUpperCase(str: string): string {
	return str.toUpperCase();
}
```

#### Error Type Inheritance

```typescript
// Base error class with Schema
import { Data, Schema } from "effect";

export class FileError extends Data.TaggedErrorClass<FileError>()("FileError", {
	path: Schema.String,
	operation: Schema.Literal("read" | "write" | "delete"),
	reason: Schema.String,
}) {}

// Specific errors extend base
export class ReadError extends FileError {}
export class WriteError extends FileError {}
```

### Testing (Vitest)

- Use `describe` blocks for grouping related tests
- Use `beforeEach`/`afterEach` for setup/teardown
- Prefer `expect().toBe()` over `===` for assertions
- Use `toMatch()` for regex patterns
- Use `import.meta.vitest` for test-only imports

### File Structure

See "Layout" above. Each package has `src/` and `test/`; generated files are written by a script in the package (`scripts/`).

### OXC Linting Rules

All TypeScript and correctness rules enforced as errors:

- No `any` types
- No unsafe operations
- No duplicate keys/values
- Proper JSDoc on exported functions
- Import organization and no duplicates

## Notes

- This is a monorepo using Turborepo
- Bun is the package manager; tests are plain `node` scripts run through `bun run test`
- Effect TS 4 Beta is used for functional patterns
- OXC parser/transformer for AST manipulation
- One Vite plugin, `cssints/vite`: oxc finds `css.*` sites, the Vite Module Runner evaluates them
- API documentation: `docs/API.md` (primary reference)

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
