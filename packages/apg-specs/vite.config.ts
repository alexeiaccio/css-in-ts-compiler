import { defineConfig } from "vite-plus";

// `vp pack` writes dist/ (see publishConfig in package.json): the scenario runner and the bridges as ESM with .d.mts, and the
// generated models as plain JSON (`<name>.model.generated.json` is published as `<name>.model.json`). The generated
// scaffolding is not published: nothing in the runner or the bridges imports it.
export default defineConfig({
  pack: [
    {
      entry: [
        "src/scenario.ts",
        "src/apg/*.bridge.ts",
        "src/apg/listbox-shared.ts",
        "src/canvas/*.bridge.ts",
        "src/patterns/*.bridge.ts",
      ],
      platform: "neutral",
      format: "esm",
      target: "es2022",
      fixedExtension: true,
      dts: true,
      clean: true,
      copy: ["apg", "canvas", "patterns"].map((service) => ({
        from: `src/${service}/*.model.generated.json`,
        to: `dist/${service}`,
        rename: (name: string, extension: string) =>
          `${name.replace(/\.generated$/, "")}.${extension}`,
      })),
    },
  ],
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // A bounded exploration is a CPU-bound walk of the model and runs beside the eight other tasks of `vp run -r test`
    // (cssints, css-grammar, the apps' Chromium suites): at 120 s the same file measured 32 s alone and timed out in the
    // full run, so the ceiling is generous and the quiet-machine cost is unchanged.
    testTimeout: 300_000,
  },
});
