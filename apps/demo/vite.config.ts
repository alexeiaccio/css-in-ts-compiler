import { oxcMacro } from "oxc-macro/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		oxcMacro() as any,
		react(),
	],
});
