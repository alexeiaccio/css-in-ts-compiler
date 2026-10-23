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
      ],
      platform: "neutral",
      format: "esm",
      target: "es2022",
      fixedExtension: true,
      dts: true,
      clean: true,
      copy: ["apg", "canvas"].map((service) => ({
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
    testTimeout: 120_000,
  },
});
