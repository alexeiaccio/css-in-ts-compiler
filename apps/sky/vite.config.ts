import solid from "@solidjs/vite-plugin";
import cssints, { cssTarget, targets } from "cssints/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [cssints({ devtools: true }), solid()],
  css: { transformer: "lightningcss", lightningcss: { targets } },
  build: { cssMinify: "lightningcss", cssTarget, minify: false },
});
