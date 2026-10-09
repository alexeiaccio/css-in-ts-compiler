import solid from "@solidjs/vite-plugin";
import cssints, { cssTarget, targets } from "cssints/vite";
import { defineConfig } from "vite-plus";

import docs from "./plugin/docs.ts";

// DOCS_BASE is the path the site is served under: "/css-in-ts-compiler/" on GitHub Pages (.github/workflows/docs.yml), "/" otherwise
export default defineConfig({
  base: process.env.DOCS_BASE || "/",
  plugins: [cssints({ devtools: true }), solid(), docs()],
  css: { transformer: "lightningcss", lightningcss: { targets } },
  build: { cssMinify: "lightningcss", cssTarget, chunkSizeWarningLimit: 1000 },
});
