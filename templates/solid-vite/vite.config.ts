import solid from "@solidjs/vite-plugin";
import cssints, { cssTarget, targets } from "cssints/vite";
import { defineConfig } from "vite-plus";
import { fileURLToPath } from "node:url";

// `~` is the alias `components.json` names for the registry: a copied component keeps the
// relative imports it was authored with, and the page reaches it through `~/components/ui`.
export default defineConfig({
  plugins: [cssints(), solid()],
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  css: { transformer: "lightningcss", lightningcss: { targets } },
  build: { cssMinify: "lightningcss", cssTarget },
});
