import wyw from "@wyw-in-js/vite";
import { defineConfig } from "vite";

// hybrid (wyw default) resolves processor-bound locals to class-name strings, so composition needs execute.
const strategy = (process.env.WYW_STRATEGY ?? "execute") as "execute" | "hybrid" | "static";

export default defineConfig({
  plugins: [wyw({ prefixer: false, eval: { strategy } })],
  css: { transformer: "lightningcss" },
  build: { cssMinify: "lightningcss", minify: false },
});
