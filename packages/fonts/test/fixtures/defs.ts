import { font } from "../../src/index.ts" with { type: "cssints" };

// Definition sites: build-time modules that hold what `font()` read.
export const body = font("Atkinson Hyperlegible", { provider: "fontsource", weights: [400, 700] });
export const brand = font("Brand", {
  provider: "fs",
  files: [
    "node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-italic.woff",
  ],
  fallback: "serif",
});
