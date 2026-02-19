/**
 * createTokens - Create typed design tokens from DTCG format
 * 
 * Based on W3C DTCG specification 2025.10
 * https://www.designtokens.org/TR/2025.10/format/
 */

import type { DTCGGroup, DTCGTokenType } from "./dtcg-types";
import type { TokenWalkResult } from "./walker";
import { walkTokens } from "./walker";
import { tokenTypeToPropertySyntax, type DTCGToCSSTypeMap } from "./type-mapping";

// ============================================================================
// Token Type
// ============================================================================

/** Branded token type */
export type Token<CSSValue, Name extends string> = `var(--${Name})` & {
	readonly __token: CSSValue;
	readonly __name: Name;
};

/** Token definition with metadata */
export interface TokenDefinition<T extends DTCGTokenType, Name extends string> {
	$type: T;
	$value: string;
	$name: Name;
	$cssName: `--${Name}`;
	$cssSyntax: string;
	$description?: string;
}

// ============================================================================
// Options
// ============================================================================

export interface CreateTokensOptions {
	/** Prefix for CSS variable names */
	prefix?: string;
	/** Separator between path segments */
	separator?: string;
	/** Custom name transform function */
	transform?: (path: string[], value: string) => string;
	/** Generate @property rules */
	generateProperty?: boolean;
	/** Default inheritance for tokens */
	inherits?: boolean;
}

// ============================================================================
// Token Registry
// ============================================================================

interface TokenRegistryEntry {
	name: string;
	type: DTCGTokenType;
	syntax: string;
	initialValue: string;
	inherits: boolean;
}

const tokenRegistry = new Map<string, TokenRegistryEntry>();

export function clearTokenRegistry(): void {
	tokenRegistry.clear();
}

export function getRegisteredTokens(): TokenRegistryEntry[] {
	return Array.from(tokenRegistry.values());
}

export function getToken(name: string): TokenRegistryEntry | undefined {
	return tokenRegistry.get(name);
}

// ============================================================================
// createTokens Implementation
// ============================================================================

/**
 * Create typed tokens from DTCG format JSON
 * 
 * @example
 * ```ts
 * const tokens = createTokens({
 *   colors: {
 *     $type: "color",
 *     primary: { $value: "#007bff" }
 *   }
 * } as const, { prefix: "app" });
 * 
 * // tokens.colors.primary → "var(--app-colors-primary)"
 * ```
 */
export function createTokens<T extends DTCGGroup>(
	group: T,
	options: CreateTokensOptions = {},
): TokenTree<T> {
	const {
		prefix = "",
		separator = "-",
		transform = defaultTransform,
		generateProperty = true,
		inherits = true,
	} = options;

	// Walk the token tree
	const walkerOptions = {
		separator,
		transform: (path: string[], value: string) => transform(path, value, prefix, separator),
		prefix,
	};

	const results = walkTokens(group, walkerOptions);

	// Build token tree
	const tree = buildTokenTree(results, generateProperty, inherits);

	return tree as TokenTree<T>;
}

// ============================================================================
// Helper Functions
// ============================================================================

function defaultTransform(
	path: string[],
	_value: string,
	prefix?: string,
	separator = "-",
): string {
	const parts = prefix ? [prefix, ...path] : [...path];
	return parts.join(separator);
}

/**
 * Build nested token tree from flat results
 */
function buildTokenTree(
	results: TokenWalkResult[],
	generateProperty: boolean,
	inherits: boolean,
): Record<string, unknown> {
	const tree: Record<string, unknown> = {};

	for (const result of results) {
		// Register in token registry
		if (generateProperty) {
			tokenRegistry.set(result.name, {
				name: result.name,
				type: result.type,
				syntax: tokenTypeToPropertySyntax[result.type],
				initialValue: result.initialValue,
				inherits,
			});
		}

		// Build nested structure
		let current: Record<string, unknown> = tree;
		for (let i = 0; i < result.path.length - 1; i++) {
			const key = result.path[i];
			if (key === undefined) continue;
			if (!(key in current)) {
				current[key] = {};
			}
			current = current[key] as Record<string, unknown>;
		}

		// Add token at leaf
		const leafKey = result.path[result.path.length - 1];
		if (leafKey === undefined) continue;
		
		const tokenStr = `var(--${result.name})`;
		
		// Create token object that behaves like a string but has metadata properties
		const token = Object.create(String.prototype, {
			[Symbol.toPrimitive]: {
				value: () => tokenStr,
				enumerable: false,
			},
		});
		token.valueOf = () => tokenStr;
		token.toString = () => tokenStr;
		Object.assign(token, {
			$type: result.type,
			$value: result.value,
			$name: result.name,
			$cssName: `--${result.name}`,
			$cssSyntax: tokenTypeToPropertySyntax[result.type],
			...(result.description ? { $description: result.description } : {}),
		});
		
		current[leafKey] = token as Token<unknown, string>;
	}

	return tree;
}

// ============================================================================
// CSS Generation
// ============================================================================

/**
 * Generate @property CSS rules for all registered tokens
 */
export function generatePropertyCSS(): string {
	const tokens = getRegisteredTokens();
	if (tokens.length === 0) return "";

	return tokens
		.map((token) => {
			return `@property --${token.name} {
	syntax: "${token.syntax}";
	inherits: ${token.inherits};
	initial-value: ${token.initialValue};
}`;
		})
		.join("\n\n");
}

/**
 * Generate :root CSS with token values
 */
export function generateTokenCSS(): string {
	const tokens = getRegisteredTokens();
	if (tokens.length === 0) return "";

	const vars = tokens.map((t) => `  --${t.name}: ${t.initialValue};`).join("\n");

	return `:root {\n${vars}\n}`;
}

/**
 * Generate complete CSS output
 */
export function generateCSS(): string {
	const parts: string[] = [];

	const propertyCSS = generatePropertyCSS();
	if (propertyCSS) parts.push(propertyCSS);

	const tokenCSS = generateTokenCSS();
	if (tokenCSS) parts.push(tokenCSS);

	return parts.join("\n\n");
}

// ============================================================================
// Type Inference
// ============================================================================

/**
 * Map DTCG tree structure to typed Token tree
 * 
 * This is a type-level helper that recurses through the DTCG structure
 * and produces the equivalent typed Token structure.
 */
export type TokenTree<T, Prefix extends string = ""> = T extends DTCGGroup
	? {
			[K in keyof T as K extends `$${string}` ? never : K]: T[K] extends DTCGGroup
				? TokenTree<T[K], `${Prefix}${K & string}-`>
				: T[K] extends { $value: infer V; $type?: infer Type }
					? Token<
							Type extends keyof DTCGToCSSTypeMap ? DTCGToCSSTypeMap[Type] : unknown,
							`${Prefix}${K & string}`
						>
					: unknown;
		}
	: never;

// Re-export types
export type { DTCGGroup, DTCGTokenType, TokenWalkResult };
