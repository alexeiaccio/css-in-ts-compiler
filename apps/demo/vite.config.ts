import { defineConfig } from "vite";

import cssints from "cssints/vite";

export default defineConfig({
  plugins: [cssints()],
  css: { transformer: "lightningcss" },
  build: { cssMinify: "lightningcss", minify: false },
});
