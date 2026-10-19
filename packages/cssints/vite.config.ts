import { readdirSync } from "node:fs";

import { defineConfig } from "vite-plus";

// the export groups (scripts/groups.ts): one declaration module per subpath `cssints/<id>`
const groups = Object.fromEntries(
  readdirSync("src/groups", { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".ts"))
    .map((f) => [`groups/${f.replace(/\.ts$/, "")}`, `src/groups/${f}`]),
);

// `vp pack` writes dist/, which `bun run pack:tgz` stages into a tarball (see publishConfig in package.json).
// In the repo the package runs from src/; dist/ is what a published install resolves.
export default defineConfig({
  pack: [
    // The build-time side: the macro library (index), the Vite plugin (vite), the helpers of plugin authors (plugin) and
    // the engine's checks for tools (check), run by Node; frame() and surface(), plugins written on those helpers; and the
    // members of a terminal (tui), in one config so that they share the engine's modules (theme.ts's token sets).
    {
      entry: {
        index: "src/index.ts",
        vite: "src/plugin.ts",
        plugin: "src/author.ts",
        check: "src/check.ts",
        frame: "src/frame.ts",
        surface: "src/surface.ts",
        tui: "src/tui.ts",
        clay: "src/clay.ts",
        "devtools-link": "src/devtools-link.ts",
      },
      platform: "node",
      format: "esm",
      target: "node22",
      fixedExtension: true,
      dts: true,
      clean: true,
    },
    // The parts that ship to browsers: _cx and _cv (runtime), and the engine that plugin runtimes configure
    // (parent-vars) and derived tokens (derived), only ever imported by `virtual:cssints/runtime/<name>`. No imports.
    {
      entry: {
        runtime: "src/runtime.ts",
        "parent-vars": "src/parent-vars.ts",
        derived: "src/derived.ts",
      },
      platform: "browser",
      format: "esm",
      target: "es2022",
      fixedExtension: true,
      dts: true,
      clean: false,
    },
    // What user code sees (the "types" condition): members, theme types, and the css-grammar types they reach.
    // Declarations only: the types of types.ts, of author.ts (cssints/plugin) and of the export groups (cssints/<id>).
    {
      entry: {
        types: "src/types.ts",
        "plugin-types": "src/author.ts",
        "tui-types": "src/tui-types.ts",
        "clay-types": "src/clay-types.ts",
        ...groups,
      },
      platform: "neutral",
      format: "esm",
      fixedExtension: true,
      dts: { emitDtsOnly: true },
      clean: false,
    },
  ],
});
