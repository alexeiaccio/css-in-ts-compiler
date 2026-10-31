import { defineConfig } from "vite-plus";

// `vp pack` writes dist/, which `bun run pack:tgz` stages into a tarball (see publishConfig in package.json).
export default defineConfig({
  pack: [
    // The build-time side, run by Node; its declarations are the types of the "types" condition (generated from the code).
    {
      entry: { index: "src/index.ts" },
      platform: "node",
      format: "esm",
      target: "node22",
      fixedExtension: true,
      dts: true,
      clean: true,
    },
    // The DOM runtime, imported by virtual:cssints/runtime/reactive.run: minified, no imports.
    {
      entry: { runtime: "src/runtime.ts" },
      platform: "browser",
      format: "esm",
      target: "es2020",
      fixedExtension: true,
      dts: true,
      clean: false,
      minify: true,
    },
  ],
});
