/**
 * Tree walker for DTCG token structure
 */

import type { DTCGToken, DTCGGroup, DTCGTokenType } from "./dtcg-types";
import { detectTokenType, normalizeTokenValue } from "./type-mapping";

// ============================================================================
// Walk Result
// ============================================================================

/** Result of walking a token tree */
export interface TokenWalkResult {
	name: string;
	path: string[];
	type: DTCGTokenType;
	value: string;
	description?: string;
	initialValue: string;
}

// ============================================================================
// Walker Options
// ============================================================================

interface WalkerOptions {
	separator: string;
	transform: (path: string[], value: string) => string;
	prefix?: string;
}

// ============================================================================
// Token Walker
// ============================================================================

/**
 * Walk DTCG token tree and extract all tokens
 */
export function walkTokens(
	group: DTCGGroup,
	options: WalkerOptions,
	parentPath: string[] = [],
	inheritedType?: DTCGTokenType,
): TokenWalkResult[] {
	const results: TokenWalkResult[] = [];
	
	// Extract group-level $type if present
	const groupType = group.$type ?? inheritedType;
	
	// Process each property
	for (const [key, value] of Object.entries(group)) {
		// Skip metadata properties
		if (key.startsWith("$") && key !== "$value") continue;
		
		const currentPath = [...parentPath, key];
		
		if (isToken(value)) {
			// It's a token
			const tokenType = value.$type ?? groupType ?? detectTokenType(value.$value) ?? "string";
			const tokenValue = normalizeTokenValue(value.$value);
			const name = options.transform(currentPath, tokenValue);
			
			results.push({
				name,
				path: currentPath,
				type: tokenType,
				value: tokenValue,
				description: value.$description,
				initialValue: tokenValue,
			});
		} else if (isGroup(value)) {
			// It's a nested group - recurse
			results.push(...walkTokens(value, options, currentPath, groupType));
		}
	}
	
	return results;
}

// ============================================================================
// Type Guards
// ============================================================================

function isToken(value: unknown): value is DTCGToken {
	return typeof value === "object" && value !== null && "$value" in value;
}

function isGroup(value: unknown): value is DTCGGroup {
	return typeof value === "object" && value !== null && !("$value" in value);
}

// ============================================================================
// Name Transformers
// ============================================================================

/**
 * Default name transformer: joins path with separator
 */
export function defaultTransform(
	path: string[],
	_separator: string,
	prefix?: string,
): string {
	const parts = prefix ? [prefix, ...path] : path;
	return parts.join("-");
}

/**
 * Kebab case transformer
 */
export function kebabCase(str: string): string {
	return str
		.replace(/([a-z])([A-Z])/g, "$1-$2")
		.replace(/[\s_]+/g, "-")
		.toLowerCase();
}

/**
 * Camel case transformer for path segments
 */
export function camelCase(str: string): string {
	return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
}
