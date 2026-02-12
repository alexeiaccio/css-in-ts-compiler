// CSS compiler - generates hash-based class names (StyleX/vanilla-extract pattern)

import { CSSProperties } from "./types";

// Global class registry for deduplication
const classRegistry = new Map<
	string,
	{
		properties: CSSProperties;
		className: string;
		fileScope: string;
	}
>();

// File scope tracking
let currentFileScope = "";

export function setFileScope(filePath: string): void {
	currentFileScope = filePath;
}

// Generate a stable hash from properties (StyleX pattern)
function generateHash(props: CSSProperties): string {
	const normalized = normalizeProperties(props);
	const str = JSON.stringify(normalized);
	let hash = 0;

	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	return Math.abs(hash).toString(16).padStart(8, "0");
}

// Normalize properties for consistent hashing
function normalizeProperties(props: CSSProperties): any {
	const result: any = {};

	for (const [key, value] of Object.entries(props).sort(([a], [b]) => a.localeCompare(b))) {
		if (typeof value === "object" && value !== null) {
			result[key] = normalizeProperties(value as CSSProperties);
		} else {
			result[key] = value;
		}
	}

	return result;
}

// Generate atomic class names (StyleX pattern)
function generateAtomicClassName(prop: string, value: any): string {
	const hash = generateHash({ [prop]: value });
	return `x${hash}`; // StyleX uses 'x' prefix
}

// Generate component class name (vanilla-extract pattern)
function generateComponentClassName(name: string, props: CSSProperties): string {
	const hash = generateHash(props);
	const fileName =
		currentFileScope
			.split("/")
			.pop()
			?.replace(/\.(ts|tsx|js|jsx)$/, "") || "unknown";
	return `${fileName}_${name}__${hash}`;
}

// Create a style definition (vanilla-extract style() pattern)
export function style(name: string, props: CSSProperties): string {
	const className = generateComponentClassName(name, props);
	const key = `${currentFileScope}:${name}`;

	if (!classRegistry.has(key)) {
		classRegistry.set(key, {
			properties: props,
			className,
			fileScope: currentFileScope,
		});
	}

	return className;
}

// Create atomic utility classes (StyleX pattern)
export function createStyle(props: CSSProperties): string {
	const classNames: string[] = [];

	for (const [prop, value] of Object.entries(props)) {
		if (typeof value === "object" && value !== null) {
			// Handle nested properties (media queries, pseudo-classes)
			const nestedClass = createStyle(value as CSSProperties);
			classNames.push(nestedClass);
		} else {
			// Create atomic class for each property
			const atomicClass = generateAtomicClassName(prop, value);
			const key = `atomic:${prop}:${value}`;

			if (!classRegistry.has(key)) {
				classRegistry.set(key, {
					properties: { [prop]: value },
					className: atomicClass,
					fileScope: "atomic",
				});
			}

			classNames.push(atomicClass);
		}
	}

	return classNames.join(" ");
}

// Compose styles (StyleX stylex.props() pattern)
export function cx(...styles: (string | CSSProperties)[]): string {
	const classNames: string[] = [];

	for (const s of styles) {
		if (typeof s === "string") {
			classNames.push(s);
		} else {
			classNames.push(createStyle(s));
		}
	}

	return classNames.join(" ");
}

import { generateGlobalThemeCSS, generateGlobalStylesCSS } from "./theme.js";

// Generate CSS from all registered classes
export function generateCSS(): string {
	const css: string[] = [];

	// Generate global themes first
	const globalThemeCSS = generateGlobalThemeCSS();
	if (globalThemeCSS) {
		css.push(globalThemeCSS);
	}

	// Generate global styles
	const globalStylesCSS = generateGlobalStylesCSS();
	if (globalStylesCSS) {
		css.push(globalStylesCSS);
	}

	// Generate atomic classes first
	const atomicClasses = Array.from(classRegistry.entries()).filter(([key]) => key.startsWith("atomic:"));

	for (const [key, data] of atomicClasses) {
		css.push(generateClassCSS(data.className, data.properties));
	}

	// Generate component classes
	const componentClasses = Array.from(classRegistry.entries()).filter(([key]) => !key.startsWith("atomic:"));

	for (const [key, data] of componentClasses) {
		css.push(generateClassCSS(data.className, data.properties));
	}

	return css.join("\n\n");
}

// Generate CSS for a single class
function generateClassCSS(className: string, props: CSSProperties): string {
	const lines: string[] = [];

	// Separate base properties from nested properties
	const baseProps: CSSProperties = {};
	const nestedProps: Record<string, CSSProperties> = {};

	for (const [key, value] of Object.entries(props)) {
		if (typeof value === "object" && value !== null) {
			nestedProps[key] = value as CSSProperties;
		} else {
			baseProps[key] = value;
		}
	}

	// Generate base class
	if (Object.keys(baseProps).length > 0) {
		const propStr = Object.entries(baseProps)
			.map(([k, v]) => `  ${k}: ${v};`)
			.join("\n");
		lines.push(`.${className} {\n${propStr}\n}`);
	}

	// Generate nested properties (media queries, pseudo-classes)
	for (const [key, value] of Object.entries(nestedProps)) {
		if (key.startsWith("@media")) {
			// Media query
			const mediaQuery = key.replace("@media", "").trim();
			lines.push(`@media ${mediaQuery} {`);
			lines.push(generateClassCSS(className, value));
			lines.push("}");
		} else if (key.startsWith("&:")) {
			// Pseudo-class
			const pseudoClass = key.slice(1);
			const propStr = Object.entries(value)
				.map(([k, v]) => `  ${k}: ${v};`)
				.join("\n");
			lines.push(`.${className}${pseudoClass} {\n${propStr}\n}`);
		} else if (key.startsWith("&::")) {
			// Pseudo-element
			const pseudoElement = key.slice(1);
			const propStr = Object.entries(value)
				.map(([k, v]) => `  ${k}: ${v};`)
				.join("\n");
			lines.push(`.${className}${pseudoElement} {\n${propStr}\n}`);
		} else if (key.startsWith(".group")) {
			// Group state
			const selector = key.replace(".group", `.${className}`);
			const propStr = Object.entries(value)
				.map(([k, v]) => `  ${k}: ${v};`)
				.join("\n");
			lines.push(`${selector} {\n${propStr}\n}`);
		}
	}

	return lines.join("\n");
}

// Get all registered classes
export function getRegisteredClasses(): Map<
	string,
	{
		properties: CSSProperties;
		className: string;
		fileScope: string;
	}
> {
	return new Map(classRegistry);
}

import { clearThemeRegistry } from "./theme.js";

// Clear the class registry
export function clearRegistry(): void {
	classRegistry.clear();
	clearThemeRegistry();
}
