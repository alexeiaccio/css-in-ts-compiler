import { defineConfig } from "vite-plus";

// A library written on cssints, built like a user would: tsdown keeps `with { type: "cssints" }`, `cssints` stays external.
export default defineConfig({
  pack: {
    entry: "src/index.ts",
    format: "esm",
    platform: "neutral",
    dts: true,
    fixedExtension: true,
  },
});
