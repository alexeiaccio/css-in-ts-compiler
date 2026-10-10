import { defineConfig } from "vite-plus";

// `vp pack` writes dist/, which `bun run pack:tgz` stages into a tarball (see publishConfig in package.json).
export default defineConfig({
  pack: [
    // The runtime of a terminal app (Bun): the neutral core and the OpenTUI adapter, which leaves @opentui/core to the app.
    {
      entry: { index: "src/index.ts", opentui: "src/opentui.ts" },
      platform: "node",
      format: "esm",
      target: "node22",
      fixedExtension: true,
      dts: true,
      clean: true,
      external: [/^@opentui\//, /^cssints/],
    },
  ],
});
