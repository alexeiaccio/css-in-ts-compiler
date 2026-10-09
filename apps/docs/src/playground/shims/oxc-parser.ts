// oxc-parser for instrument.ts: the wasm build, the same parser as the native one (its own self-contained bundle: the
// published wasi loader pairs emnapi 2 with a runtime that wants emnapi 1).
export { parseSync } from "@oxc-parser/binding-wasm32-wasi/browser-bundle.js";
