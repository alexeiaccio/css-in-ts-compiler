import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { cssTSOxcPlugin } from "../src/oxc-plugin";

export default defineConfig({
	plugins: [
		react(),
		cssTSOxcPlugin({
			include: ["**/*.tsx", "**/*.ts"],
			exclude: ["**/node_modules/**"],
			cssFileName: "styles.css",
			inject: true,
			debug: false,
		}),
	],
});
