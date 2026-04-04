import { defineConfig } from "tsdown";
import { tsdownMacro } from "tsdown-macro/rolldown";

export default defineConfig({
	entry: "src/index.ts",
	format: "esm",
	clean: true,
	plugins: [
		tsdownMacro({
			cssFile: "styles.css",
		}),
	],
});
