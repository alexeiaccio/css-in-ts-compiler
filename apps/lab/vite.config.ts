import solid from "@solidjs/vite-plugin";
import cssints, { cssTarget, targets } from "cssints/vite";
import { defineConfig } from "vite-plus";

// `devtools: true` injects the @cssints/devtools overlay in dev: the rail's classes, the winner per property and its tokens,
// which is what a styled headless widget is looked at with. Nothing of it reaches a build.
export default defineConfig({
  plugins: [cssints({ devtools: true }), solid()],
  css: { transformer: "lightningcss", lightningcss: { targets } },
  build: { cssMinify: "lightningcss", cssTarget, minify: false },
});
