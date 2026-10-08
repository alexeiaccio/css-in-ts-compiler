import { defineConfig } from "vite-plus";

// `vp pack` writes dist/, which `bun run pack:tgz` stages into a tarball (see publishConfig in package.json).
export default defineConfig({
  pack: [
    // Data only: one entry per token set, each a subpath export.
    {
      entry: {
        "open-props": "src/open-props.ts",
        radix: "src/radix.ts",
        flexoki: "src/flexoki.ts",
        "reasonable-colors": "src/reasonable-colors.ts",
      },
      platform: "neutral",
      format: "esm",
      target: "node22",
      fixedExtension: true,
      dts: true,
      clean: true,
    },
  ],
});
