import cssints, { cssTarget, targets } from "cssints/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [cssints({ devtools: true })],
  css: { transformer: "lightningcss", lightningcss: { targets } },
  // The minify takes its targets from cssTarget, not from the ones above: without them it merges the declarations
  // of a firstThatWorks into the last one.
  build: { cssMinify: "lightningcss", cssTarget, minify: false },
});
