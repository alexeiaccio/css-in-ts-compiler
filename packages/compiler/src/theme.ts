import { CSSProperties, DesignTokenGroup } from "./types.js";

export type ThemeVars = Record<string, string>;

const globalThemeRegistry = new Map<
	string,
	{
		selector: string;
		tokens: DesignTokenGroup;
	}
>();

const globalStyleRegistry = new Map<
	string,
	{
		selector: string;
		properties: CSSProperties;
	}
>();

export function createGlobalTheme(selector: string, tokens: DesignTokenGroup): ThemeVars {
	const vars: ThemeVars = {};
	const hash = generateHash(tokens);
	const scope = selector.replace(/[^a-zA-Z0-9]/g, "_");

	function traverse(obj: DesignTokenGroup, path: string[] = []) {
		for (const [key, value] of Object.entries(obj)) {
			const currentPath = [...path, key];
			const varName = `--${scope}-${currentPath.slice(1).join("-")}`;

			if (typeof value === "object" && value !== null && "$value" in value) {
				vars[currentPath.join(".")] = `var(${varName}__${hash})`;
			} else if (typeof value === "object" && value !== null) {
				traverse(value as DesignTokenGroup, currentPath);
			}
		}
	}

	traverse(tokens);

	globalThemeRegistry.set(selector, { selector, tokens });

	return vars;
}

export function globalStyle(selector: string, properties: CSSProperties): void {
	globalStyleRegistry.set(selector, { selector, properties });
}

export function generateGlobalThemeCSS(): string {
	const css: string[] = [];

	for (const [selector, { tokens }] of globalThemeRegistry) {
		const hash = generateHash(tokens);
		const scope = selector.replace(/[^a-zA-Z0-9]/g, "_");
		const lines: string[] = [`${selector} {`];

		function traverse(obj: DesignTokenGroup, path: string[] = []) {
			for (const [key, value] of Object.entries(obj)) {
				const currentPath = [...path, key];
				const varName = `--${scope}-${currentPath.slice(1).join("-")}__${hash}`;

				if (typeof value === "object" && value !== null && "$value" in value) {
					lines.push(`  ${varName}: ${value.$value};`);
				} else if (typeof value === "object" && value !== null) {
					traverse(value as DesignTokenGroup, currentPath);
				}
			}
		}

		traverse(tokens);
		lines.push("}");
		css.push(lines.join("\n"));
	}

	return css.join("\n\n");
}

export function generateGlobalStylesCSS(): string {
	const css: string[] = [];

	for (const [_, { selector, properties }] of globalStyleRegistry) {
		const propStr = Object.entries(properties)
			.map(([k, v]) => `  ${k}: ${v};`)
			.join("\n");
		css.push(`${selector} {\n${propStr}\n}`);
	}

	return css.join("\n\n");
}

function generateHash(obj: any): string {
	const str = JSON.stringify(obj);
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16).padStart(8, "0");
}

export function getGlobalThemeRegistry(): Map<string, { selector: string; tokens: DesignTokenGroup }> {
	return new Map(globalThemeRegistry);
}

export function getGlobalStyleRegistry(): Map<string, { selector: string; properties: CSSProperties }> {
	return new Map(globalStyleRegistry);
}

export function clearThemeRegistry(): void {
	globalThemeRegistry.clear();
	globalStyleRegistry.clear();
}
