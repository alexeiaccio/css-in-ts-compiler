import { defineConfig } from "vite-plus";

// `vp pack` writes dist/, which `bun run pack:tgz` stages into a tarball (see publishConfig in package.json).
// In the repo the package runs from src/; dist/ is what a published install resolves.
export default defineConfig({
  pack: [
    // The build-time side: the macro library (index), the Vite plugin (vite) and the helpers of plugin authors (plugin),
    // run by Node; and frame(), a plugin written on those helpers.
    {
      entry: {
        index: "src/index.ts",
        vite: "src/plugin.ts",
        plugin: "src/author.ts",
        frame: "src/frame.ts",
      },
      platform: "node",
      format: "esm",
      target: "node22",
      fixedExtension: true,
      dts: true,
      clean: true,
    },
    // The parts that ship to browsers: cx and _cv (runtime), and the engine that plugin runtimes configure
    // (parent-vars, only ever imported by `virtual:cssints/runtime/<name>`). No imports.
    {
      entry: { runtime: "src/runtime.ts", "parent-vars": "src/parent-vars.ts" },
      platform: "browser",
      format: "esm",
      target: "es2022",
      fixedExtension: true,
      dts: true,
      clean: false,
    },
    // What user code sees (the "types" condition): members, theme types, and the css-grammar types they reach.
    // Declarations only: types.ts and author-types.ts (cssints/plugin) have no code of their own.
    {
      entry: { types: "src/types.ts", "plugin-types": "src/author-types.ts" },
      platform: "neutral",
      format: "esm",
      fixedExtension: true,
      dts: { emitDtsOnly: true },
      clean: false,
    },
  ],
});
