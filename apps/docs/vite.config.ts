import solid from "@solidjs/vite-plugin";
import cssints, { cssTarget, targets } from "cssints/vite";
import { defineConfig } from "vite-plus";

import docs from "./plugin/docs.ts";

export default defineConfig({
  plugins: [cssints(), solid(), docs()],
  css: { transformer: "lightningcss", lightningcss: { targets } },
  build: { cssMinify: "lightningcss", cssTarget, chunkSizeWarningLimit: 1000 },
});
