declare module "virtual:docs" {
  export const pages: import("./docs.ts").Docs["pages"];
  export const html: import("./docs.ts").Docs["html"];
}
declare module "virtual:playground/data" {
  export const selectors: Record<string, unknown>;
  export const bcd: unknown;
  export const targets: string[];
}
declare module "virtual:playground/packages" {
  export const entries: Record<string, string>;
  export const sources: Record<string, () => Promise<string>>;
  export const externals: Record<string, () => Promise<unknown>>;
}
declare module "virtual:playground/types" {
  export const files: Record<string, string>;
  export const paths: Record<string, string[]>;
}
declare module "@oxc-parser/binding-wasm32-wasi/browser-bundle.js" {
  export { parseSync } from "@oxc-parser/binding-wasm32-wasi";
}
declare module "*.txt?raw" {
  const text: string;
  export default text;
}
