/**
 * Variant macro functions for CSS-in-TS
 *
 * These functions run at build time when imported with { type: "macro" }
 * to generate atomic CSS and return optimized runtime code.
 *
 * @example
 * ```ts
 * import * as css from "cssints" with { type: "macro" };
 *
 * const button = css.cv({
 *   base: "padding: 1rem; background: blue",
 *   variants: {
 *     size: { sm: "padding: 0.5rem", lg: "padding: 2rem" }
 *   }
 * });
 * ```
 */

/**
 * Variant configuration for cv() macro
 */
export interface VariantConfig {
	/** Base styles applied to all variants */
	base?: string;
	/** Variant definitions */
	variants?: Record<string, Record<string, string>>;
	/** Compound variants for complex conditions */
	compoundVariants?: Array<
		Record<string, string | string[]> & {
			className?: string;
			style?: string;
		}
	>;
	/** Default variant values */
	defaultVariants?: Record<string, string>;
}

/**
 * Slot variant configuration for scv() macro
 */
export interface SlotVariantConfig {
	/** Slot names (e.g., ['root', 'header', 'content']) */
	slots: string[];
	/** Base styles per slot */
	base?: Record<string, string>;
	/** Variant definitions per slot */
	variants?: Record<string, Record<string, Record<string, string>>>;
	/** Default variant values */
	defaultVariants?: Record<string, string>;
}

/**
 * Style variant configuration for sv() macro
 */
export interface StyleVariantConfig {
	/** Base inline styles */
	base?: Record<string, string>;
	/** Variant style definitions */
	variants?: Record<string, Record<string, Record<string, string>>>;
	/** Default variant values */
	defaultVariants?: Record<string, string>;
}

/**
 * Class value types for cx() utility
 */
export type ClassValue = string | number | boolean | undefined | null | ClassArray | ClassDictionary | MacroResultValue;

export interface ClassDictionary {
	[id: string]: boolean | undefined | null;
}

/** Matches oxc-macro's MacroResult shape */
export interface MacroResultValue {
	value: string | number | boolean | undefined | null;
}

export interface ClassArray extends Array<ClassValue> {}

/**
 * Generate a consistent hash from content
 */
function generateHash(content: string, length: number = 7): string {
	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content.charCodeAt(i);
		hash = ((hash << 5) - hash + char) | 0;
	}
	return Math.abs(hash).toString(36).substring(0, length);
}

/**
 * Parse CSS properties from style string
 * e.g., "padding: 1rem; background: blue" → [{prop: "padding", value: "1rem"}, ...]
 */
function parseStyles(styleStr: string): Array<{ property: string; value: string }> {
	const styles: Array<{ property: string; value: string }> = [];
	const declarations = styleStr.split(";").filter((s) => s.trim());

	for (const decl of declarations) {
		const [prop, ...valueParts] = decl.split(":");
		if (prop && valueParts.length > 0) {
			styles.push({
				property: prop.trim(),
				value: valueParts.join(":").trim(),
			});
		}
	}

	return styles;
}

/**
 * Generate atomic CSS from styles
 */
function generateAtomicCSS(
	componentName: string,
	styles: Array<{ property: string; value: string }>,
	options: { devPrefix: boolean; hashLength: number },
): { className: string; css: string } {
	const content = styles.map((s) => `${s.property}:${s.value}`).join(";");
	const hash = generateHash(content, options.hashLength);
	const className = options.devPrefix ? `${componentName}_${hash}` : `_${hash}`;

	const cssRules = styles.map((style) => `.${className} { ${style.property}: ${style.value}; }`).join("\n");

	return { className, css: cssRules };
}

/**
 * Runtime config returned by cv() macro
 */
export interface CvRuntimeConfig {
	base: string;
	variants: Record<string, Record<string, string>>;
	defaultVariants: Record<string, string>;
}

/**
 * Runtime function that composes class names from cv() config
 *
 * This function is used at runtime. The cv() macro generates this config
 * at build time and returns it as a MacroResult.
 */
export function _cv(config: CvRuntimeConfig): (props?: Record<string, string>) => string {
	return (props = {}) => {
		const classes: string[] = [config.base];

		// Add variant classes
		for (const [variantName, variantValue] of Object.entries(props)) {
			const value = variantValue || config.defaultVariants?.[variantName];
			if (value && config.variants[variantName]?.[value]) {
				classes.push(config.variants[variantName][value]);
			}
		}

		// Add default variants for unspecified props
		if (config.defaultVariants) {
			for (const [variantName, defaultValue] of Object.entries(config.defaultVariants)) {
				if (!props[variantName] && config.variants[variantName]?.[defaultValue]) {
					classes.push(config.variants[variantName][defaultValue]);
				}
			}
		}

		return classes.filter(Boolean).join(" ");
	};
}

/**
 * Class Variants - Define component variants with atomic CSS
 *
 * This macro runs at build time when imported with { type: "macro" }.
 * It generates atomic CSS and returns a MacroResult with:
 * - value: CvRuntimeConfig for _cv() runtime function
 * - assets: CSS files to emit
 *
 * @example
 * ```ts
 * import { cv } from "cssints" with { type: "macro" };
 *
 * const button = cv({
 *   base: "padding: 1rem 2rem; background: #3b82f6; color: white",
 *   variants: {
 *     size: {
 *       sm: "padding: 0.5rem 1rem",
 *       lg: "padding: 1rem 2rem"
 *     }
 *   },
 *   defaultVariants: { size: "md" }
 * });
 *
 * // button({ size: "lg" }) // returns class names
 * ```
 */
export function cv(config: VariantConfig): CvRuntimeConfig {
	const options = { devPrefix: true, hashLength: 7 };
	const componentName = "Component";

	// Collect all CSS
	const cssParts: string[] = [];

	// Generate base class
	const baseStyles = config.base ? parseStyles(config.base) : [];
	const { className: baseClass, css: baseCss } = generateAtomicCSS(componentName, baseStyles, options);
	if (baseCss) cssParts.push(baseCss);

	// Generate variant classes
	const variantClasses: Record<string, Record<string, string>> = {};
	if (config.variants) {
		for (const [variantName, variantValues] of Object.entries(config.variants)) {
			variantClasses[variantName] = {};
			for (const [valueName, styleStr] of Object.entries(variantValues)) {
				const styles = parseStyles(styleStr);
				const { className, css } = generateAtomicCSS(componentName, styles, options);
				variantClasses[variantName][valueName] = className;
				if (css) cssParts.push(css);
			}
		}
	}

	// Return the runtime config — oxc-macro will detect this as the `value`
	// The CSS will be returned as an `assets` array
	return {
		base: baseClass,
		variants: variantClasses,
		defaultVariants: config.defaultVariants || {},
		// @ts-expect-error — oxc-macro detects the `assets` field on the return value
		_assets: cssParts.map((content) => ({ type: "css", content })),
	};
}

/**
 * Slot Class Variants - Define multi-element component variants
 *
 * @example
 * ```ts
 * const card = css.scv({
 *   slots: ['root', 'header', 'title', 'content'],
 *   base: {
 *     root: "rounded-lg border shadow-sm",
 *     header: "border-b p-6",
 *     title: "text-lg font-semibold"
 *   },
 *   variants: {
 *     variant: {
 *       default: { root: "border-gray-200" },
 *       primary: { root: "border-blue-200", title: "text-blue-900" }
 *     }
 *   }
 * });
 * ```
 */
export function scv(config: SlotVariantConfig): (props?: Record<string, string>) => Record<string, string> {
	const options = { devPrefix: true, hashLength: 7 };
	const componentName = "Component";

	// Generate classes for each slot
	const slotClasses: Record<string, string> = {};
	const cssParts: string[] = [];

	for (const slot of config.slots) {
		const baseStyle = config.base?.[slot] || "";
		const styles = parseStyles(baseStyle);
		const { className, css } = generateAtomicCSS(componentName, styles, options);
		slotClasses[slot] = className;
		if (css) cssParts.push(css);
	}

	// @ts-expect-error — oxc-macro detects the _assets field
	slotClasses._assets = cssParts.map((content) => ({ type: "css", content }));
	return (props = {}) => slotClasses;
}

/**
 * Style Variants - Define inline style variants
 *
 * @example
 * ```ts
 * const box = css.sv({
 *   base: { display: "flex", borderRadius: "8px" },
 *   variants: {
 *     size: {
 *       sm: { padding: "8px" },
 *       lg: { padding: "24px" }
 *     }
 *   }
 * });
 * ```
 */
export function sv(config: StyleVariantConfig): (props?: Record<string, string>) => Record<string, string> {
	return (props = {}) => {
		const styles: Record<string, string> = { ...config.base };

		if (config.variants && props) {
			for (const [variantName, variantValue] of Object.entries(props)) {
				const value = variantValue || config.defaultVariants?.[variantName];
				if (value && config.variants[variantName]?.[value]) {
					Object.assign(styles, config.variants[variantName][value]);
				}
			}
		}

		return styles;
	};
}

/**
 * Slot Style Variants - Define multi-element inline style variants
 */
export function ssv(
	config: SlotVariantConfig,
): (props?: Record<string, string>) => Record<string, Record<string, string>> {
	return (props = {}) => {
		const result: Record<string, Record<string, string>> = {};

		for (const slot of config.slots) {
			const styles: Record<string, string> = {};

			if (config.base?.[slot]) {
				Object.assign(
					styles,
					parseStyles(config.base[slot]).reduce(
						(acc, s) => {
							acc[s.property] = s.value;
							return acc;
						},
						{} as Record<string, string>,
					),
				);
			}

			result[slot] = styles;
		}

		return result;
	};
}

/**
 * Class name merger - Merge multiple class values into a single string
 *
 * Runtime utility (no CSS generation)
 *
 * @example
 * ```ts
 * css.cx("btn", "btn-primary") // "btn btn-primary"
 * css.cx("btn", isActive && "active") // "btn active" or "btn"
 * css.cx("btn", { disabled: true }) // "btn disabled"
 * ```
 */
export function cx(...inputs: ClassValue[]): string {
	const classes: string[] = [];

	for (const input of inputs) {
		if (!input) continue;

		if (typeof input === "string" || typeof input === "number") {
			classes.push(String(input));
		} else if (Array.isArray(input)) {
			const flattened = cx(...input);
			if (flattened) classes.push(flattened);
		} else if (typeof input === "object") {
			// Handle MacroResult { value, assets } — extract the value
			if ("value" in input && typeof input.value === "string") {
				classes.push(input.value);
			} else {
				// Handle ClassDictionary { className: boolean }
				for (const [key, value] of Object.entries(input)) {
					if (value) classes.push(key);
				}
			}
		}
	}

	return classes.join(" ");
}

/**
 * Compile-time class name merger (alias for cx)
 *
 * Merges class names at build time when all values are known
 */
export const cn = cx;
