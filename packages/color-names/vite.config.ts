import { defineConfig } from "vite-plus";

// `vp pack` writes dist/, which `bun run pack:tgz` stages into a tarball (see publishConfig in package.json).
export default defineConfig({
  pack: [
    // The build-time side, run by Node; its declarations are the types of the "types" condition (generated from the code).
    // `nearest` is a second entry: a build-time-only module, so it never shares a chunk with the package's main entry.
    {
      entry: { index: "src/index.ts", nearest: "src/nearest.ts" },
      platform: "node",
      format: "esm",
      target: "node22",
      fixedExtension: true,
      dts: true,
      clean: true,
    },
  ],
});
