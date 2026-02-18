/**
 * Type Inference Engine
 *
 * Converts parsed CSS value syntax AST to TypeScript type expressions.
 */

import type { SyntaxNode } from "./parse-value-syntax";
import { isTypeNode, isKeywordNode, isOrNode, isOptionalNode, isRepeatNode, isAndNode } from "./parse-value-syntax";
import { CSS_TYPE_MAP } from "../lib/value-types";

export interface TypeInfo {
	tsType: string;
	isOptional: boolean;
	description?: string;
}

/**
 * Convert a parsed syntax node to a TypeScript type string.
 */
export function inferType(node: SyntaxNode): TypeInfo {
	// Type reference: <length> -> Length
	if (isTypeNode(node)) {
		const tsType = CSS_TYPE_MAP[`<${node.name}>`] ?? "string";
		return { tsType, isOptional: false };
	}

	// Keyword: 'auto' -> 'auto'
	if (isKeywordNode(node)) {
		return { tsType: `'${node.value}'`, isOptional: false };
	}

	// Or (|): <length> | <percentage> -> Length | Percentage
	if (isOrNode(node)) {
		const types = node.items.map(inferType);
		const uniqueTypes = [...new Set(types.map((t) => t.tsType))];
		return {
			tsType: uniqueTypes.join(" | "),
			isOptional: types.some((t) => t.isOptional),
		};
	}

	// And (&&): All required, any order
	if (isAndNode(node)) {
		const types = node.items.map(inferType);
		return {
			tsType: types.map((t) => t.tsType).join(" & "),
			isOptional: false,
		};
	}

	// Optional (?): <length>? -> Length | undefined
	if (isOptionalNode(node)) {
		const inner = inferType(node.item);
		return {
			tsType: inner.tsType,
			isOptional: true,
		};
	}

	// Repeat (*, +, {n,m})
	if (isRepeatNode(node)) {
		const inner = inferType(node.item);
		if (node.min === 0) {
			// * (zero or more)
			return {
				tsType: `(${inner.tsType})[]`,
				isOptional: true,
			};
		}
		if (node.min === 1 && node.max === null) {
			// + (one or more)
			return {
				tsType: `[${inner.tsType}, ...${inner.tsType}[]]`,
				isOptional: false,
			};
		}
		// {n,m} - specific count
		if (node.max !== null && node.min === node.max) {
			return {
				tsType: `[${Array(node.min).fill(inner.tsType).join(", ")}]`,
				isOptional: node.min === 0,
			};
		}
		// {n,m} - range
		return {
			tsType: `(${inner.tsType})[]`,
			isOptional: node.min === 0,
		};
	}

	// Group: [ ... ]
	if (node.type === "group") {
		return inferType(node.item as SyntaxNode);
	}

	// Juxtaposition (implicit space): items in sequence
	if (node.type === "juxtaposition") {
		const items = (node.items as SyntaxNode[]).map(inferType);
		// For function parameters, we return multiple types
		return {
			tsType: items.map((t) => t.tsType).join(", "),
			isOptional: items.every((t) => t.isOptional),
		};
	}

	// Required: [ ... ]!
	if (node.type === "required") {
		const inner = inferType(node.item as SyntaxNode);
		return { ...inner, isOptional: false };
	}

	// Fallback
	return { tsType: "string", isOptional: false };
}

/**
 * Generate function parameter types from a syntax node.
 */
export interface ParamInfo {
	name: string;
	type: string;
	optional: boolean;
	description?: string;
}

export function inferParams(node: SyntaxNode, hints?: Record<string, string>): ParamInfo[] {
	const params: ParamInfo[] = [];

	function extractParams(n: SyntaxNode, prefix = ""): void {
		if (isTypeNode(n)) {
			const tsType = CSS_TYPE_MAP[`<${n.name}>`] ?? "string";
			const name = hints?.[n.name] ?? n.name.replace(/-/g, "_").toLowerCase();
			params.push({
				name: prefix + name,
				type: tsType,
				optional: false,
			});
		} else if (isKeywordNode(n)) {
			// Keywords are usually literals in the function signature
			// Skip for now - they're part of the implementation
		} else if (isOrNode(n)) {
			// Take the first non-keyword type as the param
			const firstType = n.items.find((item) => isTypeNode(item));
			if (firstType) {
				extractParams(firstType, prefix);
			} else {
				// All keywords - this might be a property that takes specific values
				const keywords = n.items.filter(isKeywordNode);
				if (keywords.length > 0) {
					params.push({
						name: prefix + "value",
						type: keywords.map((k) => `'${k.value}'`).join(" | "),
						optional: false,
					});
				}
			}
		} else if (isOptionalNode(n)) {
			extractParams(n.item, prefix);
			const lastParam = params[params.length - 1];
			if (lastParam) {
				lastParam.optional = true;
			}
		} else if (n.type === "juxtaposition") {
			const items = n.items as SyntaxNode[];
			items.forEach((item, index) => {
				extractParams(item, prefix + (index > 0 ? "_" : ""));
			});
		} else if (n.type === "group") {
			extractParams(n.item as SyntaxNode, prefix);
		}
	}

	extractParams(node);
	return params;
}

/**
 * Generate a TypeScript function signature string.
 */
export function generateFunctionSignature(
	name: string,
	params: ParamInfo[],
	returnType: string,
): string {
	const paramList = params.map((p) => {
		const optional = p.optional ? "?" : "";
		return `${p.name}${optional}: ${p.type}`;
	});

	return `(${paramList.join(", ")}) => ${returnType}`;
}

/**
 * Generate the runtime implementation for a CSS function.
 */
export function generateImplementation(name: string, params: ParamInfo[]): string {
	const paramNames = params.map((p) => p.name);
	return `\`${name}(${paramNames.join(", ")})\``;
}
