import { defineConfig } from "vite-plus";

// `vp pack` writes dist/, which `bun run pack:tgz` stages into a tarball (see publishConfig in package.json).
export default defineConfig({
  pack: [
    // The runtime of a terminal app: the neutral core and the OpenTUI and bomb.sh adapters (the app brings
    // @opentui/core or @bomb.sh/tty).
    {
      entry: { index: "src/index.ts", opentui: "src/opentui.ts", bomb: "src/bomb.ts" },
      platform: "node",
      format: "esm",
      target: "node22",
      fixedExtension: true,
      dts: true,
      clean: true,
      external: [/^@opentui\//, /^@bomb\.sh\//, /^cssints/],
    },
  ],
});
