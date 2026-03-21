import { oxcMacro } from "oxc-macro/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		oxcMacro(),
	],
	build: {
		outDir: "dist",
	},
});
