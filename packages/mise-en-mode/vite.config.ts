import { defineConfig } from "vite-plus";

// `vp pack` writes dist/, which `bun run pack:tgz` stages into a tarball (see publishConfig in package.json).
export default defineConfig({
  pack: [
    // The build-time side, run by Node.
    {
      entry: { index: "src/index.ts" },
      platform: "node",
      format: "esm",
      target: "node22",
      fixedExtension: true,
      dts: false,
      clean: true,
    },
    // What user code sees (the "types" condition): declarations only.
    {
      entry: { types: "src/types.ts" },
      platform: "neutral",
      format: "esm",
      fixedExtension: true,
      dts: { emitDtsOnly: true },
      clean: false,
    },
  ],
});
