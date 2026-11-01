import { defineConfig } from "vite-plus";

// `vp pack` writes dist/, which `bun run pack:tgz` stages into a tarball (see publishConfig in package.json).
export default defineConfig({
  pack: [
    // The core has no dependencies; ./solid is a peer of solid-js, which the app brings.
    {
      entry: { index: "src/index.ts", solid: "src/solid.ts" },
      platform: "neutral",
      format: "esm",
      target: "es2022",
      fixedExtension: true,
      dts: true,
      clean: true,
      external: [/^solid-js/],
    },
  ],
});
