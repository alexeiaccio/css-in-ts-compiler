import cssints, { targets } from "cssints/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
	plugins: [cssints()],
	css: { transformer: "lightningcss", lightningcss: { targets } },
	// cssMinify takes its targets from cssTarget; false leaves the ones above in charge.
	build: { cssMinify: "lightningcss", cssTarget: false, minify: false },
});
