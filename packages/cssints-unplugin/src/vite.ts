/**
 * Vite plugin for cssints
 *
 * Transforms cv() and scv() calls to generate atomic CSS
 * and replaces them with optimized runtime calls
 */

import type { Targets } from "lightningcss";
import type { Plugin, ResolvedConfig } from "vite";

import type { CssintsOptions } from "./types.js";

import { generateVariantCSSSync, generateSlotVariantCSSSync } from "./css-generator.js";
import { getAllCss, storeCss } from "./virtual-css.js";
import { postprocessCSSSync, type PostProcessOptions } from "./visitors/index.js";

const PLUGIN_NAME = "cssints";

interface CssintsResolvedOptions {
	css: {
		minify: boolean;
		output: string;
		targets?: Targets;
	};
	naming: {
		devPrefix: boolean;
		hashLength: number;
	};
}

/**
 * Extract component name from file path
 */
function getComponentName(id: string): string {
	const basename =
		id
			.split("/")
			.pop()
			?.replace(/\.(ts|tsx|js|jsx)$/, "") || "Component";
	// Capitalize first letter
	return basename.charAt(0).toUpperCase() + basename.slice(1);
}

/**
 * Create the cssints Vite plugin
 */
export function cssints(options: CssintsOptions = {}): Plugin {
	const resolvedOptions: CssintsResolvedOptions = {
		css: {
			minify: options.css?.minify ?? true,
			output: options.css?.output ?? "styles.css",
			targets: options.css?.targets,
		},
		naming: {
			devPrefix: options.naming?.devPrefix ?? true,
			hashLength: options.naming?.hashLength ?? 7,
		},
	};

	let config: ResolvedConfig;
	let isDev = false;

	return {
		name: PLUGIN_NAME,
		enforce: "pre",

		configResolved(resolvedConfig) {
			config = resolvedConfig;
			isDev = config.command === "serve";
		},

		// Resolve virtual CSS modules in dev mode
		resolveId(id) {
			if (isDev && id === "virtual:cssints.css") {
				return "\0virtual:cssints.css";
			}
			return null;
		},

		// Load virtual CSS content in dev mode
		load(id) {
			if (isDev && id === "\0virtual:cssints.css") {
				const allCss = getAllCss();
				if (allCss) {
					return {
						code: allCss,
						map: null,
					};
				}
			}
			return null;
		},

		// Transform code
		transform(code, id) {
			// Only process TypeScript/JavaScript files
			if (!/\.(ts|tsx|js|jsx)$/.test(id)) {
				return null;
			}

			// Skip node_modules and cssints package itself
			if (id.includes("node_modules") || id.includes("cssints")) {
				return null;
			}

			// Check if file uses cssints
			const hasCv = code.includes("cv(") && (code.includes("from 'cssints'") || code.includes('from "cssints"'));
			const hasScv = code.includes("scv(") && (code.includes("from 'cssints'") || code.includes('from "cssints"'));

			if (!hasCv && !hasScv) {
				return null;
			}

			// For now, just inject CSS import
			// Full transformation with AST parsing would be added here
			const importStatement = 'import "virtual:cssints.css";\n';

			return {
				code: importStatement + code,
				map: null,
			};
		},

		// Generate CSS bundle in production
		generateBundle() {
			if (!isDev) {
				const allCss = getAllCss();

				if (allCss) {
					const postOptions: PostProcessOptions = {
						minify: resolvedOptions.css.minify,
						targets: resolvedOptions.css.targets,
					};
					const result = postprocessCSSSync(allCss, postOptions);

					this.emitFile({
						type: "asset",
						fileName: resolvedOptions.css.output,
						source: result.code,
					});
				}
			}
		},
	};
}

export type { CssintsOptions };
