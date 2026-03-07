import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  format: "esm",
  dts: true,
  minify: false,
  clean: true,
  target: "es2022",
  external: ["@iconify/utils", "@iconify/tools", "effect"],
});
