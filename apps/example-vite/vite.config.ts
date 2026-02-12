import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { cssTSPlugin } from "../src/vite-plugin";

export default defineConfig({
	plugins: [
		react(),
		cssTSPlugin({
			include: ["**/*.{ts,tsx}"],
			exclude: ["**/node_modules/**", "**/dist/**"],
			cssFileName: "styles.css",
			inject: true,
		}),
	],
	server: {
		port: 3000,
	},
});
