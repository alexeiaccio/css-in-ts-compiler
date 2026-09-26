import { defineConfig } from "vite";

import cssints from "../plugin.mjs";

export default defineConfig({
  plugins: [cssints()],
  css: { transformer: "lightningcss" },
  build: { cssMinify: "lightningcss", minify: false },
});
