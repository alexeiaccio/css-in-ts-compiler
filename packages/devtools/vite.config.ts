import solid from "@solidjs/vite-plugin";
import cssints, { cssTarget, targets } from "cssints/vite";
import type { Plugin } from "vite";
import { defineConfig } from "vite-plus";

// The overlay is built ahead into one file, dist/overlay.js: Solid, Effect and the core bundled, and its cssints sheet put
// in as a string (the overlay attaches it to its shadow root), so an app needs neither Solid nor a second CSS request.
const PLACEHOLDER = '"__CSSINTS_DEVTOOLS_SHEET__"';
const inlineSheet: Plugin = {
  name: "devtools:inline-sheet",
  enforce: "post",
  generateBundle(_, bundle) {
    const css = Object.values(bundle).find(
      (f) => f.type === "asset" && f.fileName.endsWith(".css"),
    );
    const js = Object.values(bundle).find((f) => f.type === "chunk" && f.fileName === "overlay.js");
    if (
      !css ||
      css.type !== "asset" ||
      !js ||
      js.type !== "chunk" ||
      !js.code.includes(PLACEHOLDER)
    )
      throw new Error("devtools: the overlay's sheet or its placeholder is missing");
    js.code = js.code.replace(PLACEHOLDER, JSON.stringify(String(css.source)));
    delete bundle[css.fileName];
  },
};

export default defineConfig({
  plugins: [cssints(), solid(), inlineSheet],
  css: { transformer: "lightningcss", lightningcss: { targets } },
  define: { "process.env.NODE_ENV": '"production"' },
  build: {
    lib: { entry: "src/ui/overlay.tsx", formats: ["es"], fileName: () => "overlay.js" },
    cssMinify: "lightningcss",
    cssTarget,
    outDir: "dist",
    emptyOutDir: true,
  },
});
