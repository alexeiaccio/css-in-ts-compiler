import { defineConfig } from "vite-plus";

// Build only (publishing is not decided yet): `vp pack` writes dist/, one module per src file so that the
// `./*` subpath exports of the package keep their shape. The package still runs from src/ in the repo.
export default defineConfig({
  pack: {
    entry: ["src/*.ts", "!src/mdn.ts"],
    unbundle: true,
    platform: "node",
    format: "esm",
    target: "node22",
    dts: true,
    clean: true,
  },
});
