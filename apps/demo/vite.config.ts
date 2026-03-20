import { cssints } from "@cssints/unplugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		cssints({
			css: {
				minify: true,
				output: "styles.css",
			},
			naming: {
				devPrefix: true,
				hashLength: 7,
			},
		}) as any,
		react() as any,
	],
});
