import cssints from "cssints/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
	plugins: [cssints()],
	css: { transformer: "lightningcss" },
	build: { cssMinify: "lightningcss", minify: false },
});
