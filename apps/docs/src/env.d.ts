declare module "virtual:docs" {
  export const pages: import("./docs.ts").Docs["pages"];
  export const html: import("./docs.ts").Docs["html"];
}
declare module "virtual:playground/data" {
  export const selectors: Record<string, unknown>;
  export const bcd: unknown;
  export const targets: string[];
}
declare module "@oxc-parser/binding-wasm32-wasi/browser-bundle.js" {
  export { parseSync } from "@oxc-parser/binding-wasm32-wasi";
}
declare module "*.txt?raw" {
  const text: string;
  export default text;
}
