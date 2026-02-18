import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { cssintsPlugin } from "@cssints/compiler";

export default defineConfig({
	plugins: [
		react(),
		cssintsPlugin({
			debug: true,
		}),
	],
});
