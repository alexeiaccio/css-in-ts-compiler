import { defineConfig } from "vite-plus";

// Build only (publishing is not decided yet): `vp pack` writes dist/. The package still runs from src/ in the repo.
export default defineConfig({
  pack: [
    // The build-time side: the macro library (index) and the Vite plugin (vite), run by Node.
    {
      entry: { index: "src/index.ts", vite: "src/plugin.ts" },
      platform: "node",
      format: "esm",
      target: "node22",
      fixedExtension: true,
      dts: true,
      clean: true,
    },
    // The part that ships to browsers: cx and _cv, nothing else, no imports.
    {
      entry: { runtime: "src/runtime.ts" },
      platform: "browser",
      format: "esm",
      target: "es2022",
      fixedExtension: true,
      dts: true,
      clean: false,
    },
  ],
});
