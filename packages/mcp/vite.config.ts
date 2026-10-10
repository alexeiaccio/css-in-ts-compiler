import { defineConfig } from "vite-plus";

// `vp pack` writes dist/: the server module and the bin of the published package (publishConfig in package.json).
// @cssints/devtools/model is TypeScript in the published devtools (Node does not strip types in node_modules): bundled here.
export default defineConfig({
  pack: [
    {
      entry: { server: "src/server.ts", bin: "src/bin.ts" },
      deps: { alwaysBundle: ["@cssints/devtools/model"] },
      platform: "node",
      format: "esm",
      target: "node22",
      fixedExtension: true,
      dts: true,
      clean: true,
    },
  ],
});
