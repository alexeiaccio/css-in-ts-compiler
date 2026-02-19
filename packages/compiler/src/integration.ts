/**
 * CSSints Integration for Compiler
 *
 * Bridges the cssints package (packages/cssints) with the compiler.
 * Handles:
 * - Hash generation for cssints function calls
 * - CSS extraction from cssints properties/functions
 * - @property injection for design tokens
 */

// Token definition interface (matches cssints package)
interface TokenDefinition<T, N extends string> {
  type: string;
  name: N;
  cssName: `--${N}`;
  syntax: string;
  inherits: boolean;
  initialValue: string;
  token: `var(--${N})` & { __token: T };
}

// ============================================================================
// CSS Registry
// ============================================================================

interface CSSRule {
	selector: string;
	properties: Record<string, string>;
	atRules?: string[]; // @media, @supports, etc.
}

interface CSSPropertyRule {
	name: string;
	syntax: string;
	inherits: boolean;
	initialValue: string;
}

const cssRegistry = {
	classes: new Map<string, CSSRule>(),
	properties: new Map<string, CSSPropertyRule>(),
	tokens: new Map<string, TokenDefinition<unknown, string>>(),
};

export function clearCSSRegistry(): void {
	cssRegistry.classes.clear();
	cssRegistry.properties.clear();
	cssRegistry.tokens.clear();
}

export function getCSSRegistry() {
	return {
		classes: new Map(cssRegistry.classes),
		properties: new Map(cssRegistry.properties),
		tokens: new Map(cssRegistry.tokens),
	};
}

// ============================================================================
// Hash Generation
// ============================================================================

/**
 * Generate a stable hash from CSS content
 */
export function generateHash(content: string): string {
	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(36).substring(0, 8);
}

/**
 * Generate a class name from CSS property/value pair
 */
export function generateClassName(property: string, value: string): string {
	const normalizedProp = property.replace(/[^a-zA-Z0-9]/g, "_");
	const hash = generateHash(`${property}:${value}`);
	return `_css_${normalizedProp}_${hash}`;
}

// ============================================================================
// CSS Rule Registration
// ============================================================================

/**
 * Register a CSS class from a cssints property call
 */
export function registerClass(
	property: string,
	value: string,
	className?: string,
): string {
	const selector = className ?? generateClassName(property, value);
	
	if (!cssRegistry.classes.has(selector)) {
		cssRegistry.classes.set(selector, {
			selector,
			properties: { [property]: value },
		});
	}
	
	return selector;
}

/**
 * Register multiple CSS properties as a single class
 */
export function registerMultiPropertyClass(
	properties: Record<string, string>,
	className?: string,
): string {
	const content = Object.entries(properties)
		.map(([k, v]) => `${k}:${v}`)
		.sort()
		.join(";");
	const selector = className ?? `_css_${generateHash(content)}`;
	
	if (!cssRegistry.classes.has(selector)) {
		cssRegistry.classes.set(selector, {
			selector,
			properties,
		});
	}
	
	return selector;
}

/**
 * Register a CSS @property rule for typed custom properties
 */
export function registerCSSProperty(
	name: string,
	syntax: string,
	inherits: boolean,
	initialValue: string,
): void {
	if (!cssRegistry.properties.has(name)) {
		cssRegistry.properties.set(name, {
			name,
			syntax,
			inherits,
			initialValue,
		});
	}
}

/**
 * Register a design token
 */
export function registerToken(
	token: TokenDefinition<unknown, string>,
): void {
	cssRegistry.tokens.set(token.name, token);
	
	// Also register as CSS @property
	registerCSSProperty(
		token.cssName,
		token.syntax,
		token.inherits,
		token.initialValue,
	);
}

// ============================================================================
// CSS Generation
// ============================================================================

/**
 * Generate @property CSS rules
 */
function generatePropertyCSS(): string {
	const rules: string[] = [];
	
	for (const prop of cssRegistry.properties.values()) {
		rules.push(`@property ${prop.name} {
  syntax: "${prop.syntax}";
  inherits: ${prop.inherits};
  initial-value: ${prop.initialValue};
}`);
	}
	
	return rules.join("\n\n");
}

/**
 * Generate CSS variable definitions for tokens
 */
function generateTokenCSS(): string {
	const vars: string[] = [];
	
	for (const token of cssRegistry.tokens.values()) {
		vars.push(`  ${token.cssName}: ${token.initialValue};`);
	}
	
	if (vars.length === 0) return "";
	
	return `:root {
${vars.join("\n")}
}`;
}

/**
 * Generate class CSS rules
 */
function generateClassCSS(): string {
	const rules: string[] = [];
	
	for (const rule of cssRegistry.classes.values()) {
		const props = Object.entries(rule.properties)
			.map(([k, v]) => `  ${k}: ${v};`)
			.join("\n");
		
		rules.push(`.${rule.selector} {
${props}
}`);
	}
	
	return rules.join("\n\n");
}

/**
 * Generate complete CSS output
 */
export function generateCSS(): string {
	const parts: string[] = [];
	
	// @property rules first
	const propertyCSS = generatePropertyCSS();
	if (propertyCSS) parts.push(propertyCSS);
	
	// Token CSS variables
	const tokenCSS = generateTokenCSS();
	if (tokenCSS) parts.push(tokenCSS);
	
	// Class rules
	const classCSS = generateClassCSS();
	if (classCSS) parts.push(classCSS);
	
	return parts.join("\n\n");
}

// ============================================================================
// Transform Helpers
// ============================================================================

/**
 * Transform a cssints property call to a class name
 * 
 * @example
 * transformPropertyCall("display", "flex")
 * // => { className: "_css_display_abc123", css: "._css_display_abc123 { display: flex; }" }
 */
export function transformPropertyCall(
	property: string,
	value: string,
): { className: string; css: string } {
	const className = registerClass(property, value);
	const css = `.${className} {
  ${property}: ${value};
}`;
	
	return { className, css };
}

/**
 * Transform a cssints function call to a class name
 * 
 * @example
 * transformFunctionCall("rgb", ["255", "0", "0"])
 * // => { className: "_css_rgb_abc123", css: "._css_rgb_abc123 { color: rgb(255, 0, 0); }" }
 */
export function transformFunctionCall(
	functionName: string,
	args: string[],
	property?: string,
): { className: string; css: string } {
	const value = `${functionName}(${args.join(", ")})`;
	const targetProperty = property ?? "color";
	const className = generateClassName(targetProperty, value);
	
	registerClass(targetProperty, value, className);
	
	const css = `.${className} {
  ${targetProperty}: ${value};
}`;
	
	return { className, css };
}

/**
 * Transform a composable utility call
 */
export function transformComposableCall(
	utilityName: string,
	args: string[],
): { className: string; css: string } {
	// Composables return style objects, so we need to handle them differently
	// This is a placeholder - actual implementation would call the utility
	const className = `_css_${utilityName}_${generateHash(args.join("_"))}`;
	
	// The actual CSS would be generated by the utility function
	// For now, register an empty class that will be filled later
	if (!cssRegistry.classes.has(className)) {
		cssRegistry.classes.set(className, {
			selector: className,
			properties: {},
		});
	}
	
	return { className, css: "" };
}

// ============================================================================
// Stats
// ============================================================================

export function getStats(): {
	classes: number;
	properties: number;
	tokens: number;
} {
	return {
		classes: cssRegistry.classes.size,
		properties: cssRegistry.properties.size,
	tokens: cssRegistry.tokens.size,
	};
}
