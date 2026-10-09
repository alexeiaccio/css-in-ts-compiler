// The Node globals the engine reads: process.cwd() and process.getBuiltinModule("node:module") (css-grammar's support.ts
// and browsers.ts, token.ts), Buffer (lowered.ts, and LightningCSS's wasm glue). Import this module first: the engine reads them when it loads.
import { createRequire } from "./module.ts";

const builtins: Record<string, unknown> = { "node:module": { createRequire } };

Object.assign(globalThis, {
  process: {
    cwd: () => "/",
    env: {},
    getBuiltinModule: (name: string) => builtins[name],
  },
  // from(text) for lowered.ts; from(memory, offset, length) and isBuffer for napi-wasm (LightningCSS), which hands out views of its
  // memory as Buffers when there is a global one and as Uint8Arrays otherwise: here a Buffer is a Uint8Array.
  Buffer: {
    from: (v: string | ArrayBuffer, offset?: number, length?: number) =>
      typeof v === "string" ? new TextEncoder().encode(v) : new Uint8Array(v, offset, length),
    isBuffer: (v: unknown) => v instanceof Uint8Array,
  },
});
