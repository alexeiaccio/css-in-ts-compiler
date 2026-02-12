/**
 * Oxc-based Vite Plugin for css-in-ts
 *
 * This plugin uses oxc-parser for AST-based extraction of style() calls,
 * providing reliable parsing with full HMR support.
 */

import { parseSync, Visitor } from "oxc-parser";
import type { Plugin } from "vite";
import type { ViteDevServer } from "vite";

import type { CSSProperties } from "./types.js";

export interface HmrOptions {
	/** Enable HMR in development (default: true) */
	enabled?: boolean;
	/** Generate virtual CSS modules per file (default: true) */
	virtualModules?: boolean;
	/** CSS module suffix */
	moduleSuffix?: string;
}

export interface OxcPluginOptions {
	/** File patterns to include */
	include?: string[];
	/** File patterns to exclude */
	exclude?: string[];
	/** Output CSS filename for production build */
	cssFileName?: string;
	/** Inject CSS into HTML */
	inject?: boolean;
	/** Enable source maps for debugging */
	debug?: boolean;
	/** HMR options */
	hmr?: HmrOptions;
}

interface StyleMapping {
	start: number;
	end: number;
	className: string;
	name: string;
	properties: CSSProperties;
}

interface FileStyleInfo {
	fileId: string;
	styles: Map<string, StyleMapping>;
	css: string;
}

const defaultOptions: Required<OxcPluginOptions> = {
	include: ["**/*.{ts,tsx}"],
	exclude: ["**/node_modules/**", "**/dist/**", "**/build/**"],
	cssFileName: "styles.css",
	inject: true,
	debug: false,
	hmr: {
		enabled: true,
		virtualModules: true,
		moduleSuffix: ".css",
	},
};

const defaultHmrOptions: Required<HmrOptions> = {
	enabled: true,
	virtualModules: true,
	moduleSuffix: ".css",
};

export function cssTSOxcPlugin(options: OxcPluginOptions = {}): Plugin {
	const opts = { ...defaultOptions, ...options };
	opts.hmr = { ...defaultHmrOptions, ...options.hmr };

	const fileStyles = new Map<string, FileStyleInfo>();
	const virtualCssModules = new Map<string, string>();
	const serverStyleCache = new Map<string, string>();

	let server: ViteDevServer | null = null;

	function isDevMode(): boolean {
		return server !== null;
	}

	function getVirtualModuleId(fileId: string): string {
		const suffix = opts.hmr?.moduleSuffix || ".css";
		const fileName =
			fileId
				.split("/")
				.pop()
				?.replace(/\.(ts|tsx)$/, "") || "styles";
		return `virtual:css-in-ts/${fileName}${suffix}`;
	}

	function generateDevClassName(fileId: string, styleName: string): string {
		const fileName =
			fileId
				.split("/")
				.pop()
				?.replace(/\.(ts|tsx)$/, "") || "unknown";
		const normalizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, "_");
		return `${normalizedFileName}_${styleName}__dev`;
	}

	function generateProdClassName(fileId: string, styleName: string, properties: CSSProperties): string {
		const hash = generateHash(JSON.stringify(properties));
		const fileName =
			fileId
				.split("/")
				.pop()
				?.replace(/\.(ts|tsx)$/, "") || "unknown";
		return `${fileName}_${styleName}__${hash}`;
	}

	function extractStyles(fileId: string, code: string): FileStyleInfo {
		const lang = fileId.endsWith(".tsx") ? "tsx" : fileId.endsWith(".ts") ? "ts" : undefined;

		const result = parseSync(fileId, code, {
			lang,
			sourceType: "module",
			astType: "ts",
			range: true,
		});

		const extractor = new StyleExtractor(fileId, isDevMode(), opts.debug);
		extractor.visit(result.program);

		const styles = new Map<string, StyleMapping>();
		for (const mapping of extractor.mappings) {
			styles.set(mapping.name, mapping);
		}

		const css = generateCssFromStyles(fileId, styles, isDevMode());

		return {
			fileId,
			styles,
			css,
		};
	}

	function generateCssFromStyles(fileId: string, styles: Map<string, StyleMapping>, devMode: boolean): string {
		const cssParts: string[] = [];

		for (const [name, mapping] of styles) {
			const className = devMode
				? generateDevClassName(fileId, name)
				: generateProdClassName(fileId, name, mapping.properties);

			cssParts.push(generateClassCss(className, mapping.properties));
		}

		return cssParts.join("\n\n");
	}

	function generateClassCss(className: string, properties: CSSProperties): string {
		const cssProps: string[] = [];

		for (const [key, value] of Object.entries(properties)) {
			if (typeof value === "object" && value !== null) {
				cssProps.push(`  ${key} {`);
				const nestedProps = generateCssProperties(value as CSSProperties);
				cssProps.push(nestedProps.map((p) => `    ${p}`).join("\n"));
				cssProps.push("  }");
			} else {
				cssProps.push(`  ${key}: ${value};`);
			}
		}

		return `.${className} {\n${cssProps.join("\n")}\n}`;
	}

	function generateCssProperties(properties: CSSProperties): string[] {
		const props: string[] = [];
		for (const [key, value] of Object.entries(properties)) {
			if (typeof value === "object" && value !== null) {
				props.push(`  ${key} {`);
				const nested = generateCssProperties(value as CSSProperties);
				props.push(nested.map((p) => `    ${p}`).join("\n"));
				props.push("  }");
			} else {
				props.push(`  ${key}: ${value};`);
			}
		}
		return props;
	}

	function injectCssImport(code: string, fileId: string): string {
		const virtualModuleId = getVirtualModuleId(fileId);
		const importStatement = `import "${virtualModuleId}";\n`;

		const importRegex = /^(import\s+.*\s+from\s+['"]|export\s+)/m;
		const match = code.match(importRegex);

		if (match) {
			const pos = match.index!;
			return code.slice(0, pos) + importStatement + code.slice(pos);
		}

		return importStatement + code;
	}

	function notifyHmrUpdate(fileId: string): void {
		if (!server || !opts.hmr?.enabled) return;

		const styleInfo = fileStyles.get(fileId);
		if (!styleInfo) return;

		const virtualModuleId = getVirtualModuleId(fileId);

		server.hotManager.send({
			type: "css-update",
			path: virtualModuleId,
			timestamp: Date.now(),
		});

		server.moduleGraph.getModulesByFile(virtualModuleId)?.forEach((mod) => {
			server?.invalidateModule(mod);
		});
	}

	return {
		name: "css-in-ts-oxc",
		enforce: "pre",

		config() {
			if (opts.inject) {
				return {
					css: {
						postcss: false,
					},
				};
			}
		},

		configResolved(config) {
			if (config.command === "serve") {
				server = config as unknown as ViteDevServer;
			}
		},

		async transform(code, id) {
			const shouldProcess =
				opts.include.some((pattern) => matchesPattern(id, pattern)) &&
				!opts.exclude.some((pattern) => matchesPattern(id, pattern));

			if (!shouldProcess) {
				return null;
			}

			if (id.startsWith("virtual:")) {
				return null;
			}

			const styleInfo = extractStyles(id, code);

			if (styleInfo.styles.size === 0) {
				return null;
			}

			fileStyles.set(id, styleInfo);

			const virtualModuleId = getVirtualModuleId(id);
			virtualCssModules.set(virtualModuleId, styleInfo.css);

			const transformed = replaceStyleCalls(code, Array.from(styleInfo.styles.values()), isDevMode(), id);

			const finalCode = isDevMode() && opts.hmr?.virtualModules ? injectCssImport(transformed, id) : transformed;

			if (opts.debug) {
				console.log(`[css-in-ts-oxc] Processed ${id}: ${styleInfo.styles.size} styles`);
			}

			return {
				code: finalCode,
				map: undefined,
			};
		},

		resolveId(id) {
			if (id.startsWith("virtual:css-in-ts/")) {
				return id;
			}
			return null;
		},

		load(id) {
			if (id.startsWith("virtual:css-in-ts/")) {
				return virtualCssModules.get(id) || "";
			}
			return null;
		},

		async hotUpdate({ file, server: viteServer }) {
			if (!opts.hmr?.enabled) return;

			const shouldProcess =
				opts.include.some((pattern) => matchesPattern(file, pattern)) &&
				!opts.exclude.some((pattern) => matchesPattern(file, pattern));

			if (!shouldProcess) return;

			const fs = await import("fs/promises");
			const code = await fs.readFile(file, "utf-8");

			const newStyleInfo = extractStyles(file, code);

			if (newStyleInfo.styles.size === 0) {
				const oldStyleInfo = fileStyles.get(file);
				if (oldStyleInfo) {
					const virtualModuleId = getVirtualModuleId(file);
					virtualCssModules.delete(virtualModuleId);
					fileStyles.delete(file);

					viteServer.hotManager.send({
						type: "css-update",
						path: virtualModuleId,
						timestamp: Date.now(),
					});
				}
				return;
			}

			const virtualModuleId = getVirtualModuleId(file);
			virtualCssModules.set(virtualModuleId, newStyleInfo.css);
			fileStyles.set(file, newStyleInfo);

			if (opts.debug) {
				console.log(`[css-in-ts-oxc] HMR update: ${file} (${newStyleInfo.styles.size} styles)`);
			}

			viteServer.hotManager.send({
				type: "css-update",
				path: virtualModuleId,
				timestamp: Date.now(),
			});

			const modulesToUpdate = new Set<string>();
			for (const [fileId, styleInfo] of fileStyles) {
				if (fileId !== file) {
					modulesToUpdate.add(fileId);
				}
			}

			return {
				changedModules: [],
				deletedModules: [],
			};
		},

		generateBundle() {
			if (!isDevMode()) {
				const allCssParts: string[] = [];

				for (const [fileId, styleInfo] of fileStyles) {
					allCssParts.push(styleInfo.css);
				}

				const css = allCssParts.join("\n\n");

				if (css) {
					this.emitFile({
						type: "asset",
						fileName: opts.cssFileName,
						source: css,
					});
				}
			}

			fileStyles.clear();
			virtualCssModules.clear();
		},
	};
}

function matchesPattern(id: string, pattern: string): boolean {
	const regexPattern = pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*");
	return new RegExp(regexPattern).test(id);
}

class StyleExtractor extends Visitor {
	readonly mappings: StyleMapping[] = [];
	private readonly devMode: boolean;

	constructor(
		private readonly fileId: string,
		devMode: boolean,
		private readonly debug: boolean,
	) {
		super();
		this.devMode = devMode;
	}

	override visitCallExpression(node: import("oxc-parser").CallExpression): void {
		const callee = node.callee;

		if (callee.type === "Identifier" && callee.name === "style" && node.arguments.length >= 2) {
			const nameArg = node.arguments[0];
			const propsArg = node.arguments[1];

			const name =
				nameArg.type === "StringLiteral"
					? nameArg.value
					: nameArg.type === "Literal" && typeof nameArg.value === "string"
						? nameArg.value
						: null;

			if (name && propsArg.type === "ObjectExpression") {
				const properties = extractObjectProperties(propsArg);
				const className = this.devMode
					? generateDevClassNameStatic(this.fileId, name)
					: generateProdClassNameStatic(this.fileId, name, properties);

				this.mappings.push({
					start: node.span.start,
					end: node.span.end,
					className: `"${className}"`,
					name,
					properties,
				});

				if (this.debug) {
					console.log(`[css-in-ts-oxc] Extracted style("${name}") -> ${className}`);
				}
			}
		}

		super.visitCallExpression(node);
	}
}

function extractObjectProperties(node: import("oxc-parser").ObjectExpression): CSSProperties {
	const properties: CSSProperties = {};

	for (const prop of node.properties) {
		if (prop.type === "ObjectProperty") {
			const key = prop.key.type === "Identifier" ? prop.key.name : prop.key.value;
			const value = extractExpressionValue(prop.value);

			if (key && value !== undefined) {
				if (prop.value.type === "ObjectExpression") {
					if (key.startsWith("@") || key.startsWith("&:") || key.startsWith("&::")) {
						properties[key] = extractObjectProperties(prop.value);
					}
				} else {
					properties[key] = value;
				}
			}
		}
	}

	return properties;
}

function extractExpressionValue(node: import("oxc-parser").Expression): string | number | object | undefined {
	switch (node.type) {
		case "StringLiteral":
			return node.value;
		case "Literal":
			return typeof node.value === "string" || typeof node.value === "number" ? node.value : undefined;
		case "TemplateLiteral":
			if (node.quasis.length === 1 && node.expressions.length === 0) {
				return node.quasis[0].value.raw;
			}
			return undefined;
		case "NumericLiteral":
			return node.value;
		case "BooleanLiteral":
			return node.value;
		case "ObjectExpression":
			return extractObjectProperties(node);
		default:
			return undefined;
	}
}

function generateDevClassNameStatic(fileId: string, styleName: string): string {
	const fileName =
		fileId
			.split("/")
			.pop()
			?.replace(/\.(ts|tsx)$/, "") || "unknown";
	const normalizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, "_");
	return `${normalizedFileName}_${styleName}__dev`;
}

function generateProdClassNameStatic(fileId: string, styleName: string, properties: CSSProperties): string {
	const hash = generateHash(JSON.stringify(properties));
	const fileName =
		fileId
			.split("/")
			.pop()
			?.replace(/\.(ts|tsx)$/, "") || "unknown";
	return `${fileName}_${styleName}__${hash}`;
}

function generateHash(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16).padStart(8, "0");
}

function replaceStyleCalls(code: string, mappings: StyleMapping[], devMode: boolean, fileId: string): string {
	const sorted = [...mappings].sort((a, b) => b.start - a.start);

	let result = code;

	for (const mapping of sorted) {
		const before = result.slice(0, mapping.start);
		const after = result.slice(mapping.end);
		result = before + mapping.className + after;
	}

	return result;
}
