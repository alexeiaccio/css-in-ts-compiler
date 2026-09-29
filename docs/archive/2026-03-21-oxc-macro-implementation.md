# oxc-macro Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a general-purpose build-time macro system using OXC (Rust NAPI) for AST parsing/codegen and Node.js worker threads for evaluation.

**Architecture:** Rust NAPI handles fast AST work (parse, find macro imports + `macro()` wrapper calls, codegen replacements). Worker threads run macros in real Node.js with full npm/async/fs support. Results are inlined back into source via OXC codegen. Content-hash cache avoids re-evaluation.

**Tech Stack:** Rust (napi-rs, oxc parser + codegen), TypeScript (Effect TS v4, unplugin, worker_threads), Vite

**Repo:** Separate from css-in-ts-compiler monorepo. Located at `~/github/oxc-macro`.

---

## Chunk 1: Rust NAPI crate setup + parseExtractMacros

### Task 1: Initialize Rust crate

**Files:**
- Create: `~/github/oxc-macro/oxc-macro-napi/Cargo.toml`
- Create: `~/github/oxc-macro/oxc-macro-napi/build.rs`
- Create: `~/github/oxc-macro/oxc-macro-napi/src/lib.rs`

- [ ] **Step 1: Create Cargo.toml**

```toml
[package]
name = "oxc-macro-napi"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
napi = { version = "3", features = ["serde-json"] }
napi-derive = "3"
oxc_parser = "0.121"
oxc_codegen = "0.121"
oxc_ast = "0.121"
oxc_span = "0.121"
oxc_allocator = "0.121"
oxc_sourcemap = "6"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[build-dependencies]
napi-build = "2"

[profile.release]
lto = true
codegen-units = 1
```

- [ ] **Step 2: Create build.rs**

```rust
extern crate napi_build;
fn main() {
    napi_build::setup();
}
```

- [ ] **Step 3: Run `cargo check` to verify dependencies resolve**

Run: `cd ~/github/oxc-macro/oxc-macro-napi && cargo check`
Expected: Dependencies download, compiles successfully

### Task 2: Define NAPI types for macro extraction

**Files:**
- Create: `~/github/oxc-macro/oxc-macro-napi/src/types.rs`

- [ ] **Step 1: Write the types module**

```rust
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// A macro import detected via `with { type: "macro" }` attribute
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacroImport {
    /// Module specifier, e.g. "./colors"
    pub module_name: String,
    /// Exported name, e.g. "colors"
    pub export_name: String,
    /// Local binding name in the importing file
    pub local_name: String,
    /// Byte offset range [start, end) in source
    pub span: Vec<u32>,
}

/// A call site of a macro function
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacroCallSite {
    /// Which macro import this calls (local_name from MacroImport)
    pub local_name: String,
    /// Byte offset range [start, end) of the entire call expression
    pub span: Vec<u32>,
    /// Resolved absolute path to the macro module file
    pub module_path: String,
}

/// Result of parsing a file for macro imports and calls
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacroExtractionResult {
    /// All macro imports found (with { type: "macro" })
    pub imports: Vec<MacroImport>,
    /// All macro call sites found
    pub calls: Vec<MacroCallSite>,
}

/// A replacement instruction for codegen
#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Replacement {
    /// Byte offset range [start, end) of the call expression to replace
    pub span: Vec<u32>,
    /// Pre-serialized JSON value to inline
    pub value: String,
}

/// Options for codegen
#[napi(object)]
#[derive(Debug, Clone, Default)]
pub struct CodegenOptions {
    /// Generate source map
    pub source_map: Option<bool>,
}
```

- [ ] **Step 2: Verify types compile**

Run: `cargo check`
Expected: Compiles without errors

### Task 3: Implement parseExtractMacros

**Files:**
- Modify: `~/github/oxc-macro/oxc-macro-napi/src/lib.rs`

- [ ] **Step 1: Write parseExtractMacros function**

The function should:
1. Parse the source with OXC parser
2. Walk the AST to find `ImportDeclaration` nodes with `with { type: "macro" }` attributes
3. For those imports, collect: module_name, export_name, local_name, span
4. Walk the AST to find `CallExpression` nodes where the callee is an identifier from a macro import
5. Return `MacroExtractionResult` with imports and call sites

```rust
use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_parser::Parser;
use oxc_span::SourceType;

mod types;
use types::*;

/// Parse source and extract macro imports + call sites
#[napi]
pub fn parse_extract_macros(
    source: String,
    filename: String,
) -> napi::Result<MacroExtractionResult> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(&filename).unwrap_or(SourceType::mjs());
    let ret = Parser::new(&allocator, &source, source_type).parse();

    if !ret.errors.is_empty() {
        let msgs: Vec<String> = ret.errors.iter().map(|e| e.to_string()).collect();
        return Err(napi::Error::from_reason(
            format!("Parse errors:\n{}", msgs.join("\n"))
        ));
    }

    let program = ret.program;
    let mut imports = Vec::new();

    // Phase 1: Find imports with `with { type: "macro" }`
    for stmt in &program.body {
        if let Statement::ImportDeclaration(import_decl) = stmt {
            if !is_macro_import(import_decl) {
                continue;
            }

            let module_name = import_decl.source.value.to_string();

            if let Some(specifiers) = &import_decl.specifiers {
                for spec in specifiers {
                    if let ImportDeclarationSpecifier::ImportSpecifier(import_spec) = spec {
                        let export_name = match &import_spec.imported {
                            ModuleExportName::Identifier(id) => id.name.to_string(),
                            ModuleExportName::StringLiteral(s) => s.value.to_string(),
                        };
                        let local_name = import_spec.local.name.to_string();
                        imports.push(MacroImport {
                            module_name: module_name.clone(),
                            export_name,
                            local_name,
                            span: vec![import_spec.span.start, import_spec.span.end],
                        });
                    }
                }
            }
        }
    }

    // Build lookup: local_name -> module_name
    let macro_names: std::collections::HashMap<String, String> = imports
        .iter()
        .map(|i| (i.local_name.clone(), i.module_name.clone()))
        .collect();

    // Phase 2: Find call expressions using macro imports
    let mut calls = Vec::new();
    for stmt in &program.body {
        find_macro_calls(stmt, &macro_names, &mut calls);
    }

    Ok(MacroExtractionResult { imports, calls })
}

fn is_macro_import(import_decl: &ImportDeclaration) -> bool {
    if let Some(with_clause) = &import_decl.with_clause {
        for entry in &with_clause.with_entries {
            if let PropertyKey::StaticExpression(key) = &entry.key {
                if key.value == "type" {
                    if let Expression::StringLiteral(val) = &entry.value {
                        return val.value == "macro";
                    }
                }
            }
        }
    }
    false
}

fn find_macro_calls(
    stmt: &Statement,
    macro_names: &std::collections::HashMap<String, String>,
    calls: &mut Vec<MacroCallSite>,
) {
    use oxc_ast::visit::walk;
    use oxc_ast::Visit;

    struct MacroCallFinder<'a> {
        macro_names: &'a std::collections::HashMap<String, String>,
        calls: &'a mut Vec<MacroCallSite>,
    }

    impl<'a> Visit<'a> for MacroCallFinder<'a> {
        fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
            if let Expression::Identifier(ident) = &call.callee {
                if let Some(module_path) = self.macro_names.get(ident.name.as_str()) {
                    self.calls.push(MacroCallSite {
                        local_name: ident.name.to_string(),
                        span: vec![call.span.start, call.span.end],
                        module_path: module_path.clone(),
                    });
                }
            }
            walk::walk_call_expression(self, call);
        }
    }

    let mut finder = MacroCallFinder { macro_names, calls };
    finder.visit_statement(stmt);
}
```

- [ ] **Step 2: Verify compilation**

Run: `cargo check`
Expected: Compiles without errors

- [ ] **Step 3: Build the NAPI binary**

Run: `npx napi build --platform`
Expected: Produces `oxc-macro-napi.darwin-arm64.node`

- [ ] **Step 4: Verify the binding loads**

```bash
cd ~/github/oxc-macro/oxc-macro-napi
node -e "
const binding = require('./oxc-macro-napi.darwin-arm64.node');
console.log(typeof binding.parseExtractMacros);
console.log(typeof binding.replaceMacroCalls);
"
```

Expected: prints `function` twice

- [ ] **Step 5: Test parseExtractMacros with sample input**

```bash
node -e "
const { parseExtractMacros } = require('./oxc-macro-napi.darwin-arm64.node');
const result = parseExtractMacros(
  'import { colors } from \"./tokens\" with { type: \"macro\" };\nconst c = colors();\n',
  'test.ts'
);
console.log(JSON.stringify(result, null, 2));
"
```

Expected: JSON with one import `{ moduleName: './tokens', exportName: 'colors', localName: 'colors' }` and one call `{ localName: 'colors', ... }`

- [ ] **Step 6: Commit**

```bash
cd ~/github/oxc-macro
git init
git add oxc-macro-napi/
git commit -m "feat: initial Rust NAPI crate with parseExtractMacros"
```

---

## Chunk 2: Rust NAPI replaceMacroCalls + codegen

### Task 4: Implement replaceMacroCalls

**Files:**
- Modify: `~/github/oxc-macro/oxc-macro-napi/src/lib.rs`

- [ ] **Step 1: Write replaceMacroCalls function**

The function should:
1. Take original source + list of `Replacement { span, value }`
2. Sort replacements by span start (descending) to apply in reverse order
3. For each replacement, replace the byte range in source with the value
4. Use OXC codegen to produce clean output (re-parse the modified source, then codegen)

```rust
/// Replace macro call sites with inlined values
#[napi]
pub fn replace_macro_calls(
    source: String,
    replacements: Vec<Replacement>,
    options: Option<CodegenOptions>,
) -> napi::Result<String> {
    if replacements.is_empty() {
        return Ok(source);
    }

    let mut sorted = replacements;
    sorted.sort_by(|a, b| b.span[0].cmp(&a.span[0]));

    let mut bytes = source.into_bytes();

    for rep in &sorted {
        let start = rep.span[0] as usize;
        let end = rep.span[1] as usize;
        if start > bytes.len() || end > bytes.len() || start > end {
            return Err(napi::Error::from_reason(
                format!("Invalid span [{}, {}] for source length {}", start, end, bytes.len())
            ));
        }
        bytes.splice(start..end, rep.value.bytes());
    }

    let modified = String::from_utf8(bytes)
        .map_err(|e| napi::Error::from_reason(format!("Invalid UTF-8 after replacement: {e}")))?;

    // Re-parse and codegen for clean output
    let allocator = Allocator::default();
    let source_type = SourceType::mjs();
    let ret = Parser::new(&allocator, &modified, source_type).parse();

    if !ret.errors.is_empty() {
        // If re-parse fails, return the raw modified source
        return Ok(modified);
    }

    let codegen_result = oxc_codegen::Codegen::new()
        .with_options(oxc_codegen::CodegenOptions {
            minify: false,
            ..Default::default()
        })
        .build(&ret.program);

    Ok(codegen_result.code)
}
```

- [ ] **Step 2: Verify compilation and test**

```bash
cd ~/github/oxc-macro/oxc-macro-napi
npx napi build --platform
node -e "
const { parseExtractMacros, replaceMacroCalls } = require('./oxc-macro-napi.darwin-arm64.node');
const src = 'import { colors } from \"./tokens\" with { type: \"macro\" };\nconst c = colors();\n';
const extracted = parseExtractMacros(src, 'test.ts');
console.log('Extracted:', JSON.stringify(extracted, null, 2));

const calls = extracted.calls;
if (calls.length > 0) {
  const result = replaceMacroCalls(src, [{
    span: calls[0].span,
    value: '{\"primary\":\"#f00\"}'
  }]);
  console.log('Result:', result);
}
"
```

Expected: Output shows `const c = {"primary":"#f00"}` instead of `colors()`

- [ ] **Step 3: Commit**

```bash
git add oxc-macro-napi/
git commit -m "feat: add replaceMacroCalls with OXC codegen"
```

---

## Chunk 3: TypeScript package setup + macro() export

### Task 5: Initialize TypeScript package

**Files:**
- Create: `~/github/oxc-macro/package.json`
- Create: `~/github/oxc-macro/tsconfig.json`
- Create: `~/github/oxc-macro/oxc-macro/package.json`
- Create: `~/github/oxc-macro/oxc-macro/tsconfig.json`
- Create: `~/github/oxc-macro/oxc-macro/src/macro.ts`
- Create: `~/github/oxc-macro/oxc-macro/src/index.ts`
- Create: `~/github/oxc-macro/oxc-macro/src/types.ts`
- Create: `~/github/oxc-macro/oxc-macro/src/errors.ts`

- [ ] **Step 1: Create root package.json (workspace)**

```json
{
  "name": "oxc-macro-root",
  "private": true,
  "workspaces": [
    "oxc-macro-napi",
    "oxc-macro"
  ],
  "scripts": {
    "build:native": "cd oxc-macro-napi && npx napi build --platform --release",
    "build:native:debug": "cd oxc-macro-napi && npx napi build --platform",
    "build": "bun run build:native:debug && bun run --filter oxc-macro build",
    "test": "bun test"
  },
  "devDependencies": {
    "@napi-rs/cli": "^3.5.1",
    "typescript": "^5.7.0",
    "vitest": "^4.1.0"
  }
}
```

- [ ] **Step 2: Create oxc-macro/package.json**

```json
{
  "name": "oxc-macro",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./vite": {
      "types": "./dist/vite.d.ts",
      "import": "./dist/vite.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "effect": "^4.0.0-beta.30",
    "oxc-macro-napi": "workspace:*",
    "unplugin": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "vite": "^7.3.1",
    "vitest": "^4.1.0"
  },
  "peerDependencies": {
    "vite": "^5.0.0 || ^6.0.0 || ^7.0.0"
  }
}
```

- [ ] **Step 3: Create oxc-macro/tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Write oxc-macro/src/macro.ts**

```typescript
/**
 * Mark a function as a build-time macro.
 *
 * At runtime, this is a no-op — the function is returned as-is.
 * The oxc-macro Vite plugin detects these and evaluates them at build time.
 *
 * @example
 * ```ts
 * import { macro } from "oxc-macro";
 * import { readFileSync } from "node:fs";
 *
 * export const colors = macro(() => {
 *   return JSON.parse(readFileSync("./colors.json", "utf-8"));
 * });
 * ```
 */
export function macro<T>(fn: () => T): () => T {
  return fn;
}
```

- [ ] **Step 5: Write oxc-macro/src/types.ts**

```typescript
export interface MacroImport {
  moduleName: string;
  exportName: string;
  localName: string;
  span: [number, number];
}

export interface MacroCallSite {
  localName: string;
  span: [number, number];
  modulePath: string;
}

export interface MacroExtractionResult {
  imports: MacroImport[];
  calls: MacroCallSite[];
}

export interface Replacement {
  span: [number, number];
  value: string;
}

export interface OxcMacroOptions {
  /** Directory for cache files. Default: node_modules/.oxc-macro-cache */
  cacheDir?: string;
  /** Number of worker threads. Default: os.cpus().length */
  workers?: number;
  /** Timeout per macro evaluation in ms. Default: 30000 */
  timeout?: number;
  /** Generate source maps for replacements. Default: false */
  sourceMaps?: boolean;
}
```

- [ ] **Step 6: Write oxc-macro/src/errors.ts**

```typescript
import { Data, Schema } from "effect";

export class MacroParseError extends Data.TaggedErrorClass<MacroParseError>()("MacroParseError", {
  filename: Schema.String,
  message: Schema.String,
}) {}

export class MacroEvalError extends Data.TaggedErrorClass<MacroEvalError>()("MacroEvalError", {
  moduleName: Schema.String,
  exportName: Schema.String,
  message: Schema.String,
}) {}

export class MacroTimeoutError extends Data.TaggedErrorClass<MacroTimeoutError>()("MacroTimeoutError", {
  moduleName: Schema.String,
  exportName: Schema.String,
  timeoutMs: Schema.Number,
}) {}

export class MacroSerializationError extends Data.TaggedErrorClass<MacroSerializationError>()("MacroSerializationError", {
  moduleName: Schema.String,
  exportName: Schema.String,
  message: Schema.String,
}) {}
```

- [ ] **Step 7: Write oxc-macro/src/index.ts**

```typescript
export { macro } from "./macro.js";
export type {
  MacroImport,
  MacroCallSite,
  MacroExtractionResult,
  Replacement,
  OxcMacroOptions,
} from "./types.js";
export {
  MacroParseError,
  MacroEvalError,
  MacroTimeoutError,
  MacroSerializationError,
} from "./errors.js";
```

- [ ] **Step 8: Verify TypeScript compiles**

Run: `cd ~/github/oxc-macro && bun install && cd oxc-macro && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: TypeScript package setup with macro() export and types"
```

---

## Chunk 4: Worker thread + Effect TS evaluation

### Task 6: Implement the worker thread script

**Files:**
- Create: `~/github/oxc-macro/oxc-macro/src/worker.ts`

- [ ] **Step 1: Write worker.ts**

The worker:
- Receives `EvalTask { id, modulePath, exportName }` via `parentPort`
- Dynamically imports the module
- Calls the exported function
- Serializes result via `JSON.stringify`
- Posts back `EvalResult { id, value?, error? }`

```typescript
import { parentPort } from "node:worker_threads";
import { pathToFileURL } from "node:url";
import { Effect } from "effect";
import { MacroEvalError, MacroSerializationError } from "./errors.js";

interface EvalTask {
  id: string;
  modulePath: string;
  exportName: string;
}

interface EvalResult {
  id: string;
  value?: string;
  error?: string;
}

const evaluateMacro = Effect.fn("evaluateMacro")(function* (task: EvalTask) {
  const mod = yield* Effect.tryPromise({
    try: () => import(pathToFileURL(task.modulePath).href),
    catch: (err) =>
      new MacroEvalError({
        moduleName: task.modulePath,
        exportName: task.exportName,
        message: `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      }),
  });

  const fn = mod[task.exportName];
  if (typeof fn !== "function") {
    return yield* Effect.fail(
      new MacroEvalError({
        moduleName: task.modulePath,
        exportName: task.exportName,
        message: `"${task.exportName}" is not a function, got ${typeof fn}`,
      }),
    );
  }

  const result = yield* Effect.tryPromise({
    try: () => Promise.resolve(fn()),
    catch: (err) =>
      new MacroEvalError({
        moduleName: task.modulePath,
        exportName: task.exportName,
        message: `Macro threw: ${err instanceof Error ? err.message : String(err)}`,
      }),
  });

  const serialized = yield* Effect.try({
    try: () => JSON.stringify(result),
    catch: (err) =>
      new MacroSerializationError({
        moduleName: task.modulePath,
        exportName: task.exportName,
        message: `Cannot serialize result: ${err instanceof Error ? err.message : String(err)}`,
      }),
  });

  return serialized;
});

parentPort?.on("message", async (task: EvalTask) => {
  const exit = await Effect.runPromiseExit(evaluateMacro(task));

  const result: EvalResult =
    exit._tag === "Success"
      ? { id: task.id, value: exit.value }
      : {
          id: task.id,
          error:
            exit.cause._tag === "Fail"
              ? String(exit.cause.error)
              : "Unknown error",
        };

  parentPort?.postMessage(result);
});
```

- [ ] **Step 2: Verify the worker compiles**

Run: `cd ~/github/oxc-macro/oxc-macro && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: worker thread with Effect TS macro evaluation"
```

---

## Chunk 5: Worker pool + persistence

### Task 7: Implement the worker pool

**Files:**
- Create: `~/github/oxc-macro/oxc-macro/src/worker-pool.ts`

- [ ] **Step 1: Write worker-pool.ts**

The pool:
- Manages N worker threads (configurable, default: `os.cpus().length`)
- Uses `Effect.Queue` for task scheduling
- Tracks idle/busy workers
- Auto-restarts crashed workers
- Supports `evaluate(modulePath, exportName) → Effect<string, Error>`

```typescript
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { Effect, Queue, Deferred, Ref } from "effect";

interface EvalTask {
  id: string;
  modulePath: string;
  exportName: string;
  deferred: Deferred.Deferred<string, Error>;
}

interface WorkerState {
  worker: Worker;
  busy: boolean;
}

export interface PoolConfig {
  size: number;
  timeout: number;
}

const WORKER_SCRIPT = fileURLToPath(new URL("./worker.js", import.meta.url));

export class WorkerPool {
  private workers: WorkerState[] = [];
  private taskQueue: Queue.Queue<EvalTask> | null = null;
  private counter = 0;

  constructor(private config: PoolConfig) {}

  start(): Effect.Effect<void> {
    return Effect.gen(
      function* (this: WorkerPool) {
        this.taskQueue = yield* Queue.unbounded<EvalTask>();

        for (let i = 0; i < this.config.size; i++) {
          this.spawnWorker();
        }

        yield* Effect.forkDaemon(this.processLoop());
      }.bind(this),
    );
  }

  private spawnWorker(): void {
    const worker = new Worker(WORKER_SCRIPT);
    const state: WorkerState = { worker, busy: false };

    worker.on("message", (result: { id: string; value?: string; error?: string }) => {
      state.busy = false;
      this.resolveTask(result);
      this.dispatchNext();
    });

    worker.on("error", (_err) => {
      state.busy = false;
      // Replace crashed worker
      const idx = this.workers.indexOf(state);
      if (idx !== -1) {
        this.workers.splice(idx, 1);
        this.spawnWorker();
      }
    });

    this.workers.push(state);
  }

  private processLoop(): Effect.Effect<void> {
    return Effect.forever(
      Effect.gen(
        function* (this: WorkerPool) {
          const task = yield* Queue.take(this.taskQueue!);
          yield* Effect.sync(() => this.sendToWorker(task));
        }.bind(this),
      ),
    );
  }

  private sendToWorker(task: EvalTask): void {
    const worker = this.workers.find((w) => !w.busy);
    if (!worker) {
      // All busy, re-enqueue
      Effect.runSync(Queue.offer(this.taskQueue!, task));
      return;
    }
    worker.busy = true;
    worker.worker.postMessage({
      id: task.id,
      modulePath: task.modulePath,
      exportName: task.exportName,
    });
  }

  private dispatchNext(): void {
    if (!this.taskQueue) return;
    // Try to dispatch next queued task
    Effect.runFork(
      Effect.gen(
        function* (this: WorkerPool) {
          const maybeTask = yield* Queue.poll(this.taskQueue!);
          if (maybeTask._tag === "Some") {
            yield* Effect.sync(() => this.sendToWorker(maybeTask.value));
          }
        }.bind(this),
      ),
    );
  }

  private resolveTask(result: { id: string; value?: string; error?: string }): void {
    // Deferred resolution happens via the stored reference
    // This is handled by the evaluate method
  }

  evaluate(modulePath: string, exportName: string): Effect.Effect<string, Error> {
    return Effect.gen(
      function* (this: WorkerPool) {
        const id = `task-${this.counter++}`;
        const deferred = yield* Deferred.make<string, Error>();
        const task: EvalTask = { id, modulePath, exportName, deferred };

        // Store deferred for resolution
        this.pendingTasks.set(id, deferred);

        yield* Queue.offer(this.taskQueue!, task);

        const timeoutEffect = Effect.fail(
          new Error(`Macro ${exportName} in ${modulePath} timed out after ${this.config.timeout}ms`),
        ).pipe(Effect.delay(`${this.config.timeout} millis` as any));

        return yield* Deferred.await(deferred).pipe(Effect.race(timeoutEffect));
      }.bind(this),
    );
  }

  private pendingTasks = new Map<string, Deferred.Deferred<string, Error>>();

  shutdown(): Effect.Effect<void> {
    return Effect.sync(() => {
      for (const w of this.workers) {
        w.worker.terminate();
      }
      this.workers = [];
    });
  }
}
```

- [ ] **Step 2: Refine worker-pool.ts — wire up pending task resolution**

The `resolveTask` method needs to look up the pending deferred and complete it:

```typescript
private resolveTask(result: { id: string; value?: string; error?: string }): void {
  const deferred = this.pendingTasks.get(result.id);
  if (!deferred) return;
  this.pendingTasks.delete(result.id);

  if (result.error) {
    Effect.runSync(Deferred.fail(deferred, new Error(result.error)));
  } else {
    Effect.runSync(Deferred.succeed(deferred, result.value!));
  }
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd ~/github/oxc-macro/oxc-macro && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: worker pool with Effect TS queue and deferred resolution"
```

---

## Chunk 6: Content-hash cache

### Task 8: Implement cache

**Files:**
- Create: `~/github/oxc-macro/oxc-macro/src/cache.ts`

- [ ] **Step 1: Write cache.ts**

```typescript
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Effect } from "effect";

interface CacheEntry {
  result: string;
  timestamp: number;
}

export class MacroCache {
  private memoryCache = new Map<string, string>();
  private cacheDir: string;

  constructor(cacheDir: string = "node_modules/.oxc-macro-cache") {
    this.cacheDir = cacheDir;
  }

  private computeKey(modulePath: string, exportName: string, fileContent: string): string {
    const hash = createHash("sha256");
    hash.update(modulePath);
    hash.update(exportName);
    hash.update(fileContent);
    return hash.digest("hex").slice(0, 16);
  }

  get(modulePath: string, exportName: string, fileContent: string): string | null {
    const key = this.computeKey(modulePath, exportName, fileContent);

    // Memory cache first
    const memHit = this.memoryCache.get(key);
    if (memHit !== undefined) return memHit;

    // Disk cache
    try {
      const cacheFile = join(this.cacheDir, `${key}.json`);
      if (existsSync(cacheFile)) {
        const entry: CacheEntry = JSON.parse(readFileSync(cacheFile, "utf-8"));
        this.memoryCache.set(key, entry.result);
        return entry.result;
      }
    } catch {
      // Cache miss or corrupt
    }

    return null;
  }

  set(modulePath: string, exportName: string, fileContent: string, result: string): void {
    const key = this.computeKey(modulePath, exportName, fileContent);
    this.memoryCache.set(key, result);

    try {
      if (!existsSync(this.cacheDir)) {
        mkdirSync(this.cacheDir, { recursive: true });
      }
      const entry: CacheEntry = { result, timestamp: Date.now() };
      writeFileSync(join(this.cacheDir, `${key}.json`), JSON.stringify(entry), "utf-8");
    } catch {
      // Best effort disk cache
    }
  }

  invalidate(modulePath: string): Effect.Effect<void> {
    return Effect.sync(() => {
      // Invalidate all entries from this module by clearing memory cache
      // Disk entries will naturally miss on content change
      this.memoryCache.clear();
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: content-hash cache with memory + disk tiers"
```

---

## Chunk 7: Vite plugin + transform hook

### Task 9: Implement the Vite plugin

**Files:**
- Create: `~/github/oxc-macro/oxc-macro/src/plugin.ts`
- Create: `~/github/oxc-macro/oxc-macro/src/vite.ts`
- Create: `~/github/oxc-macro/oxc-macro/src/native.ts`

- [ ] **Step 1: Write native.ts — NAPI binding loader**

```typescript
import { createRequire } from "node:module";

export interface NativeBinding {
  parseExtractMacros(source: string, filename: string): {
    imports: Array<{ moduleName: string; exportName: string; localName: string; span: number[] }>;
    calls: Array<{ localName: string; span: number[]; modulePath: string }>;
  };
  replaceMacroCalls(source: string, replacements: Array<{ span: number[]; value: string }>): string;
}

let cached: NativeBinding | null = null;

export function loadNative(): NativeBinding {
  if (cached) return cached;

  const require = createRequire(import.meta.url);
  cached = require("oxc-macro-napi") as NativeBinding;
  return cached;
}
```

- [ ] **Step 2: Write plugin.ts — core unplugin implementation**

```typescript
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import type { UnpluginFactory, UnpluginOptions } from "unplugin";
import { loadNative } from "./native.js";
import { WorkerPool } from "./worker-pool.js";
import { MacroCache } from "./cache.js";
import type { OxcMacroOptions, Replacement } from "./types.js";

const PLUGIN_NAME = "oxc-macro";
const MACRO_TYPE_PATTERN = /with\s*\{\s*type:\s*["']macro["']\s*\}/;

export const createUnplugin: UnpluginFactory<OxcMacroOptions | undefined> = (options = {}) => {
  const opts = {
    cacheDir: options.cacheDir ?? "node_modules/.oxc-macro-cache",
    workers: options.workers ?? Math.max(1, (globalThis as any).navigator?.hardwareConcurrency ?? 4),
    timeout: options.timeout ?? 30_000,
    sourceMaps: options.sourceMaps ?? false,
  };

  const native = loadNative();
  const cache = new MacroCache(opts.cacheDir);
  let pool: WorkerPool | null = null;

  function getPool(): WorkerPool {
    if (!pool) {
      pool = new WorkerPool({ size: opts.workers, timeout: opts.timeout });
      Effect.runSync(pool.start());
    }
    return pool;
  }

  async function processFile(source: string, id: string): Promise<string | null> {
    // Quick check before parsing
    if (!MACRO_TYPE_PATTERN.test(source)) return null;

    const extracted = native.parseExtractMacros(source, id);
    if (extracted.calls.length === 0) return null;

    const replacements: Replacement[] = [];

    for (const call of extracted.calls) {
      const resolvedPath = resolve(dirname(id), call.modulePath);
      let fileContent: string;
      try {
        // Try with common extensions
        fileContent = tryReadModule(resolvedPath);
      } catch {
        continue;
      }

      // Check cache
      const cached = cache.get(resolvedPath, call.exportName, fileContent);
      if (cached !== null) {
        replacements.push({ span: [call.span[0], call.span[1]] as [number, number], value: cached });
        continue;
      }

      // Evaluate in worker
      const result = await Effect.runPromise(
        getPool().evaluate(tryResolveModule(resolvedPath), call.exportName),
      );

      cache.set(resolvedPath, call.exportName, fileContent, result);
      replacements.push({ span: [call.span[0], call.span[1]] as [number, number], value: result });
    }

    if (replacements.length === 0) return null;

    return native.replaceMacroCalls(source, replacements);
  }

  return {
    name: PLUGIN_NAME,
    enforce: "pre",

    vite: {
      config() {
        return {
          optimizeDeps: {
            exclude: ["oxc-macro"],
          },
        };
      },

      async transform(code: string, id: string) {
        if (!/\.(ts|tsx|js|jsx|mjs|mts)$/.test(id)) return null;
        if (id.includes("node_modules")) return null;

        const result = await processFile(code, id);
        if (result === null) return null;

        return {
          code: result,
          map: opts.sourceMaps ? null : null, // TODO: source map generation
        };
      },

      async closeBundle() {
        if (pool) {
          await Effect.runPromise(pool.shutdown());
          pool = null;
        }
      },
    },
  } satisfies UnpluginOptions;
};

function tryReadModule(resolvedPath: string): string {
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts"];
  for (const ext of extensions) {
    try {
      return readFileSync(resolvedPath + ext, "utf-8");
    } catch {
      continue;
    }
  }
  throw new Error(`Cannot read module at ${resolvedPath}`);
}

function tryResolveModule(resolvedPath: string): string {
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts"];
  for (const ext of extensions) {
    try {
      readFileSync(resolvedPath + ext, "utf-8");
      return resolvedPath + ext;
    } catch {
      continue;
    }
  }
  throw new Error(`Cannot resolve module at ${resolvedPath}`);
}

import { Effect } from "effect";
```

- [ ] **Step 3: Write vite.ts — Vite-specific export**

```typescript
import { createUnplugin } from "./plugin.js";
import type { OxcMacroOptions } from "./types.js";
import type { Plugin } from "vite";

export function oxcMacro(options?: OxcMacroOptions): Plugin {
  return createUnplugin(options).vite as Plugin;
}
```

- [ ] **Step 4: Update oxc-macro/src/index.ts to export plugin**

Add to index.ts:
```typescript
export { oxcMacro } from "./vite.js";
```

- [ ] **Step 5: Verify compilation**

Run: `cd ~/github/oxc-macro/oxc-macro && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: Vite plugin with OXC AST extraction + worker evaluation"
```

---

## Chunk 8: Error handling + source maps

### Task 10: Wire up error types in plugin

**Files:**
- Modify: `~/github/oxc-macro/oxc-macro/src/plugin.ts`

- [ ] **Step 1: Replace raw `Error` throws with typed errors in plugin.ts**

Update `processFile` to use `MacroParseError` when `parseExtractMacros` fails, `MacroEvalError` when worker returns error, etc.

- [ ] **Step 2: Add source map generation to replaceMacroCalls**

In the Rust NAPI crate, enable `oxc_sourcemap` feature and generate source maps when `CodegenOptions.source_map` is true.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: typed error handling and source map support"
```

---

## Chunk 9: HMR + file watching

### Task 11: Add HMR support

**Files:**
- Modify: `~/github/oxc-macro/oxc-macro/src/plugin.ts`

- [ ] **Step 1: Track which source files import which macro modules**

Maintain a `Map<consumerFile, Set<macroModulePath>>` in the plugin. Update it during `processFile`.

- [ ] **Step 2: Add `watchChange` hook**

```typescript
watchChange(id: string, change: { event: string }) {
  if (change.event === "update") {
    // Invalidate cache for changed macro module
    cache.invalidate(id);
    // Trigger re-transform of all consumers
    const consumers = this.importGraph.getConsumers(id);
    for (const consumer of consumers) {
      this.environment?.moduleGraph.invalidateModule(/* ... */);
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: HMR support with macro invalidation"
```

---

## Chunk 10: Tests

### Task 12: Write tests

**Files:**
- Create: `~/github/oxc-macro/oxc-macro/src/__tests__/macro.test.ts`
- Create: `~/github/oxc-macro/oxc-macro/src/__tests__/cache.test.ts`
- Create: `~/github/oxc-macro/oxc-macro/src/__tests__/integration.test.ts`

- [ ] **Step 1: Unit test — macro() wrapper is identity**

```typescript
import { describe, it, expect } from "vitest";
import { macro } from "../macro.js";

describe("macro()", () => {
  it("returns the function as-is at runtime", () => {
    const fn = () => 42;
    expect(macro(fn)).toBe(fn);
  });

  it("preserves function behavior", () => {
    const fn = () => ({ color: "red" });
    const wrapped = macro(fn);
    expect(wrapped()).toEqual({ color: "red" });
  });
});
```

- [ ] **Step 2: Unit test — cache**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { MacroCache } from "../cache.js";

describe("MacroCache", () => {
  let cache: MacroCache;

  beforeEach(() => {
    cache = new MacroCache("/tmp/test-oxc-macro-cache");
  });

  it("returns null on miss", () => {
    expect(cache.get("/path", "fn", "content")).toBeNull();
  });

  it("returns cached value on hit", () => {
    cache.set("/path", "fn", "content", '{"result":42}');
    expect(cache.get("/path", "fn", "content")).toBe('{"result":42}');
  });

  it("invalidates on content change", () => {
    cache.set("/path", "fn", "content", '{"v":1}');
    expect(cache.get("/path", "fn", "different")).toBeNull();
  });
});
```

- [ ] **Step 3: Unit test — Rust NAPI parseExtractMacros**

```typescript
import { describe, it, expect } from "vitest";
import { loadNative } from "../native.js";

describe("parseExtractMacros", () => {
  const native = loadNative();

  it("finds macro imports", () => {
    const src = 'import { colors } from "./tokens" with { type: "macro" };';
    const result = native.parseExtractMacros(src, "test.ts");
    expect(result.imports).toHaveLength(1);
    expect(result.imports[0]?.exportName).toBe("colors");
    expect(result.imports[0]?.moduleName).toBe("./tokens");
  });

  it("finds macro call sites", () => {
    const src = `import { colors } from "./tokens" with { type: "macro" };
const c = colors();`;
    const result = native.parseExtractMacros(src, "test.ts");
    expect(result.calls).toHaveLength(1);
    expect(result.calls[0]?.localName).toBe("colors");
  });

  it("returns empty for non-macro imports", () => {
    const src = 'import { colors } from "./tokens";';
    const result = native.parseExtractMacros(src, "test.ts");
    expect(result.imports).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Unit test — Rust NAPI replaceMacroCalls**

```typescript
describe("replaceMacroCalls", () => {
  const native = loadNative();

  it("replaces macro call with inlined value", () => {
    const src = `import { colors } from "./t" with { type: "macro" };
const c = colors();`;
    const extracted = native.parseExtractMacros(src, "test.ts");
    const call = extracted.calls[0]!;
    const result = native.replaceMacroCalls(src, [{
      span: call.span,
      value: '{"primary":"#f00"}',
    }]);
    expect(result).toContain('{"primary":"#f00"}');
    expect(result).not.toContain("colors()");
  });
});
```

- [ ] **Step 5: Run all tests**

Run: `cd ~/github/oxc-macro && bun test`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "test: add unit tests for macro, cache, and NAPI bindings"
```

---

## Verification

After all chunks:

```bash
# Type check
cd ~/github/oxc-macro/oxc-macro && npx tsc --noEmit

# Run tests
cd ~/github/oxc-macro && bun test

# Build native
cd ~/github/oxc-macro && bun run build:native:debug

# Build TS
cd ~/github/oxc-macro && bun run --filter oxc-macro build
```
