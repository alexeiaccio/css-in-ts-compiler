import { cssintsPlugin } from "@cssints/compiler";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		react(),
		cssintsPlugin({
			debug: true,
		}),
	],
});
