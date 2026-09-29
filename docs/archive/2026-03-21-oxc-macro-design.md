# OXC Macro System — Design Spec

## Overview

General-purpose build-time macro system. OXC (Rust NAPI) for AST parsing/codegen, Node.js worker threads for evaluation. Macros can use any npm package, be async, and do full I/O.

**Problem:** Parcel macros and comptime.js are too sandboxed.
**Solution:** Rust NAPI does fast AST work. Worker threads run macros in real Node.js. Results inlined via OXC codegen.

## Architecture

```
Vite Plugin (packages/oxc-macro)
  └─ transform() hook
       ├─ oxcMacroNapi.parseExtractMacros() → finds macro imports + calls
       ├─ Content-hash cache check
       ├─ WorkerPool.evaluate() for cache misses
       └─ oxcMacroNapi.replaceMacroCalls() → inlines results

Rust NAPI (packages/oxc-macro-napi)
  ├─ parseExtractMacros(source, filename) → MacroExtractionResult
  │     Parses with OXC, finds `with { type: "macro" }` imports,
  │     detects macro() wrapper calls, extracts call sites with spans
  └─ replaceMacroCalls(source, replacements) → string
        Takes source + [{span, serializedValue}], OXC codegen output

Worker Pool (persistent across Vite restarts)
  ├─ Pooled threads (default: os.cpus().length)
  ├─ Loads macro modules with import()
  ├─ Calls macro functions (sync + async)
  └─ Serializes results via JSON.stringify
```

## User-facing API

```typescript
// macro.ts — exported by "oxc-macro"
export function macro<T>(fn: () => T | Promise<T>): () => T {
  return fn; // no-op at runtime, marker for plugin
}

// tokens/colors.ts
import { macro } from "oxc-macro";
import { readFileSync } from "node:fs";

export const colors = macro(() => {
  return JSON.parse(readFileSync("./tokens/colors.json", "utf-8"));
});

export const endpoints = macro(async () => {
  const spec = await fetch("https://api.example.com/openapi.json").then(r => r.json());
  return Object.keys(spec.paths);
});

// app.ts — consumer
import { colors, endpoints } from "./tokens/colors" with { type: "macro" };

const theme = colors();
// → const theme = {"primary":"#ff0000","secondary":"#00ff00"};
```

## Packages

### `packages/oxc-macro-napi/` (Rust)

| Export | Signature |
|--------|-----------|
| `parseExtractMacros` | `(source: string, filename: string) → MacroExtractionResult` |
| `replaceMacroCalls` | `(source: string, replacements: Replacement[]) → string` |

**Cargo deps:** `napi`, `napi-derive`, `oxc_parser`, `oxc_codegen`, `oxc_ast`, `oxc_span`, `oxc_allocator` (latest versions)

**Detection strategy:**
1. Find imports with `with { type: "macro" }` attribute → mark as macro imports
2. For macro imports, find all call sites of imported names
3. Additionally: detect `macro()` wrapper calls in any file → mark wrapped functions as macros
4. Return all macro call sites with source spans

### `packages/oxc-macro/` (TypeScript + Effect TS v4)

| File | Purpose |
|------|---------|
| `plugin.ts` | unplugin plugin (Vite/Rollup/Webpack/esbuild) |
| `worker-pool.ts` | Effect-based worker thread pool |
| `worker.ts` | Worker thread eval loop |
| `cache.ts` | Content-hash filesystem cache |
| `errors.ts` | `Data.TaggedErrorClass` error types |
| `macro.ts` | `macro()` wrapper export |

**Plugin options:**

```typescript
interface OxcMacroOptions {
  cacheDir?: string;         // default: node_modules/.oxc-macro-cache
  workers?: number;          // default: os.cpus().length
  timeout?: number;          // default: 30000ms per macro eval
  sourceMaps?: boolean;      // default: false — generate source maps for replacements
}
```

## Caching

- **Key:** `hash(absoluteModulePath + exportName + fileContent)`
- **Storage:** `node_modules/.oxc-macro-cache/{hash}.json`
- **Invalidation:** content change → miss. No TTL needed.
- Cache sits between plugin and worker pool. Cache hit = skip worker entirely.

## Worker Persistence

Worker threads persist across Vite restarts via a daemon process:
- Plugin connects to existing worker pool on startup (Unix socket or named pipe)
- If no pool running, spawns one
- Pool auto-terminates after configurable idle timeout (default: 5 minutes)
- Force kill available via `oxc-macro kill` CLI command

## Error Handling (Effect TS)

```
MacroParseError       — OXC parse failure
MacroEvalError        — macro() threw at runtime
MacroTimeoutError     — eval exceeded timeout (default 30s)
MacroSerializationError — return value not JSON-serializable
```

All surface in Vite error overlay with filename + export name + message.

## HMR

- Watch macro source files
- On change → invalidate cache for that file
- Re-transform all files importing that macro module

## cssints Integration (separate migration)

cssints functions would transition to returning `{ className, css }` objects. The plugin extracts CSS for emission, inlines only className in source. This is a follow-up task.

## Implementation Order

1. Rust NAPI crate — `parseExtractMacros` + `replaceMacroCalls`
2. Worker thread — basic eval loop with Effect TS
3. Worker pool — pooled threads + queue + persistence
4. Cache — content-hash filesystem
5. Vite plugin — unplugin + transform hook + options
6. Error handling — full error types + Vite overlay
7. HMR — file watching + invalidation
8. Tests — full suite
9. cssints migration — separate task
