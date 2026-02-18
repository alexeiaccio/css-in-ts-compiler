/**
 * Class Name Merger
 *
 * Merges CSS class names from cssints functions with specificity resolution.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Branded type for cssints functions that generate CSS class names.
 * All property and utility functions in cssints return this type.
 */
export type CSSintsFn = ((...args: any[]) => string) & { __brand: "cssints" };

/**
 * Represents a CSS class entry with specificity information.
 */
interface ClassEntry {
	/** The CSS class name */
	name: string;
	/** Specificity score [a, b, c] where a > b > c */
	specificity: [number, number, number];
	/** Source function for debugging */
	source?: string;
}

// ============================================================================
// Specificity Calculation
// ============================================================================

/**
 * Calculate CSS specificity from a selector string.
 * Returns [a, b, c] where:
 * - a = number of ID selectors
 * - b = number of class selectors, attribute selectors, and pseudo-classes
 * - c = number of type selectors and pseudo-elements
 */
function calculateSpecificity(selector: string): [number, number, number] {
	let a = 0; // IDs
	let b = 0; // Classes, attributes, pseudo-classes
	let c = 0; // Types, pseudo-elements

	// Remove pseudo-elements (::before, ::after) and count them
	const withoutPseudoElements = selector.replace(/::[a-z-]+/gi, () => {
		c++;
		return "";
	});

	// Count IDs
	const withoutIds = withoutPseudoElements.replace(/#[a-zA-Z_][a-zA-Z0-9_-]*/g, () => {
		a++;
		return "";
	});

	// Count classes
	const withoutClasses = withoutIds.replace(/\.[a-zA-Z_][a-zA-Z0-9_-]*/g, () => {
		b++;
		return "";
	});

	// Count attributes
	const withoutAttributes = withoutClasses.replace(/\[[^\]]+\]/g, () => {
		b++;
		return "";
	});

	// Count pseudo-classes (but not :not(), :is(), :where(), :has())
	withoutAttributes.replace(/:([a-z-]+)(?:\([^)]*\))?/gi, (match, name) => {
		if (!["not", "is", "where", "has"].includes(name.toLowerCase())) {
			b++;
		}
		return "";
	});

	return [a, b, c];
}

/**
 * Compare two specificity arrays.
 * Returns positive if a > b, negative if a < b, 0 if equal.
 */
function compareSpecificity(a: [number, number, number], b: [number, number, number]): number {
	for (let i = 0; i < 3; i++) {
		const av = a[i] ?? 0;
		const bv = b[i] ?? 0;
		if (av !== bv) {
			return av - bv;
		}
	}
	return 0;
}

// ============================================================================
// Class Name Processing
// ============================================================================

/**
 * Extract class names from a function result.
 * Handles both single classes and space-separated class lists.
 */
function extractClasses(result: string, source?: string): ClassEntry[] {
	return result
		.split(/\s+/)
		.filter(Boolean)
		.map((name) => ({
			name,
			specificity: calculateSpecificity(name),
			source,
		}));
}

/**
 * Merge class entries, keeping the most specific for each property.
 * Later entries with same specificity override earlier ones (cascade).
 */
function mergeBySpecificity(entries: ClassEntry[]): ClassEntry[] {
	// Group by property (for CSS properties, we'd need to parse the CSS)
	// For now, we just deduplicate and keep last occurrence
	const seen = new Map<string, ClassEntry>();

	for (const entry of entries) {
		seen.set(entry.name, entry);
	}

	return Array.from(seen.values());
}

/**
 * Sort classes by specificity (highest first) then by source order.
 */
function sortClasses(entries: ClassEntry[]): ClassEntry[] {
	return [...entries].sort((a, b) => {
		const specDiff = compareSpecificity(b.specificity, a.specificity);
		if (specDiff !== 0) return specDiff;
		return 0;
	});
}

// ============================================================================
// Main cn Function
// ============================================================================

/**
 * Merge CSS class names from cssints functions.
 *
 * @param args - cssints functions or their results (strings)
 * @returns Space-separated class names
 *
 * @example
 * ```ts
 * import { cn } from "cssints";
 * import { display, items, justify } from "cssints";
 *
 * const classes = cn(
 *   display("flex"),
 *   items("center"),
 *   justify("center")
 * );
 * // => "_display-flex _items-center _justify-center"
 * ```
 */
export function cn(...args: (CSSintsFn | string | false | null | undefined)[]): string {
	const entries: ClassEntry[] = [];

	for (const arg of args) {
		if (!arg) continue;

		if (typeof arg === "string") {
			entries.push(...extractClasses(arg));
		} else if (typeof arg === "function" && "__brand" in arg && arg.__brand === "cssints") {
			const result = arg();
			if (typeof result === "string") {
				entries.push(...extractClasses(result, arg.name));
			}
		}
	}

	const merged = mergeBySpecificity(entries);
	const sorted = sortClasses(merged);

	return sorted.map((e) => e.name).join(" ");
}

/**
 * Conditional class merging with object syntax.
 *
 * @param classes - Object where keys are class names and values are conditions
 * @returns Space-separated class names for truthy conditions
 *
 * @example
 * ```ts
 * import { cx } from "cssints";
 *
 * const classes = cx({
 *   "_display-flex": true,
 *   "_hidden": false,
 *   "_visible": condition
 * });
 * // => "_display-flex _visible" (if condition is true)
 * ```
 */
export function cx(classes: Record<string, boolean | undefined | null>): string {
	return Object.entries(classes)
		.filter(([, condition]) => Boolean(condition))
		.map(([className]) => className)
		.join(" ");
}

/**
 * Template literal class merging.
 *
 * @param strings - Template strings
 * @param values - Interpolated values (can be cssints functions or strings)
 * @returns Space-separated class names
 *
 * @example
 * ```ts
 * import { cva } from "cssints";
 * import { padding } from "cssints";
 *
 * const classes = cva`_container ${padding(4)} _rounded`;
 * // => "_container _padding-4 _rounded"
 * ```
 */
export function cva(
	strings: TemplateStringsArray,
	...values: (CSSintsFn | string | false | null | undefined)[]
): string {
	const parts: string[] = [];

	for (let i = 0; i < strings.length; i++) {
		const str = strings[i];
		if (str) parts.push(str);

		if (i < values.length) {
			const value = values[i];
			if (typeof value === "string") {
				parts.push(value);
			} else if (typeof value === "function") {
				const result = value();
				if (typeof result === "string") {
					parts.push(result);
				}
			}
		}
	}

	const combined = parts.join("").trim();
	return cn(combined);
}

// ============================================================================
// Re-export for convenience
// ============================================================================

export { cn as classNames };
export { cn as clsx };
