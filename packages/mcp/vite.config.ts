import { defineConfig } from "vite-plus";

// `vp pack` writes dist/: the server module and the bin of the published package (publishConfig in package.json).
export default defineConfig({
  pack: [
    {
      entry: { server: "src/server.ts", bin: "src/bin.ts" },
      platform: "node",
      format: "esm",
      target: "node22",
      fixedExtension: true,
      dts: true,
      clean: true,
    },
  ],
});
