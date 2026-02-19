import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		includeSource: ["scripts/**/*.ts", "src/**/*.ts"],
	},
});
