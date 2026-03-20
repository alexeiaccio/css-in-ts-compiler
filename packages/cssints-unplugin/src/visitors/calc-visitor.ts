/**
 * Calc Visitor
 * Transforms @calc placeholder rules into actual CSS calc() expressions
 */

import type { Rule, Length } from "lightningcss";

import { Effect, Console } from "effect";

import { VisitorError } from "../errors.js";

// Track processed calcs to avoid duplicates
const processedCalcs = new Map<string, string>();

/**
 * Parse calc expression and build LightningCSS Length AST
 */
const parseCalcExpression = (expression: string): Length => {
	// Check if it's a math function (min, max, clamp)
	if (expression.startsWith("min(") || expression.startsWith("max(") || expression.startsWith("clamp(")) {
		const funcName = expression.split("(")[0]!;
		const args = expression.slice(funcName.length + 1, -1);

		return {
			type: "calc",
			value: {
				type: "function",
				name: funcName,
				arguments: args.split(", ").map(parseCalcValue),
			},
		} as unknown as Length;
	}

	// Standard calc expression
	return {
		type: "calc",
		value: parseCalcValue(expression),
	} as unknown as Length;
};

/**
 * Parse individual calc value
 */
const parseCalcValue = (value: string): any => {
	// Handle parentheses
	if (value.startsWith("(") && value.endsWith(")")) {
		return {
			type: "calc",
			value: parseCalcValue(value.slice(1, -1)),
		};
	}

	// Handle operators
	if (value === "+" || value === "-" || value === "*" || value === "/") {
		return { type: "operator", value };
	}

	// Handle length values
	const lengthMatch = value.match(/^(\d[\d.]*)?([a-z]+)$/);
	if (lengthMatch && lengthMatch[1] && lengthMatch[2]) {
		return {
			type: "value",
			value: {
				unit: lengthMatch[2],
				value: parseFloat(lengthMatch[1]) || 0,
			},
		};
	}

	// Handle plain numbers
	if (!Number.isNaN(parseFloat(value))) {
		return {
			type: "value",
			value: parseFloat(value),
		};
	}

	// Fallback: return as identifier
	return {
		type: "ident",
		value,
	};
};

/**
 * Create calc visitor
 * Transforms @calc rules into style rules with calc() or math functions
 */
export const createCalcVisitor = () => {
	return {
		Rule: {
			custom: {
				calc: (rule: any): Rule | Rule[] => {
					return Effect.runSync(
						Effect.gen(function* () {
							yield* Console.debug(`Processing @calc rule`);

							const prelude = rule.prelude?.value || "";
							const parts = prelude.split(" ");
							const className = parts[0];
							const expression = parts.slice(1).join(" ");

							if (!className || !expression) {
								return yield* Effect.fail(
									new VisitorError({
										message: "Invalid @calc rule: missing class name or expression",
										visitorName: "calc",
										rule: prelude,
									}),
								);
							}

							// Check for duplicates
							if (processedCalcs.has(className)) {
								yield* Console.debug(`Skipping duplicate calc: ${className}`);
								return [];
							}

							processedCalcs.set(className, expression);

							yield* Console.debug(`Generated calc: .${className} { width: ${expression} }`);

							// Parse calc expression
							const calcValue = parseCalcExpression(expression);

							// Return style rule with calc
							return {
								type: "style",
								value: {
									selectors: [[{ type: "class", name: className }]],
									declarations: {
										declarations: [
											{
												property: "width" as const,
												value: calcValue,
											},
										],
									},
									loc: { source_index: 0, line: 0, column: 0 },
								},
							} as unknown as Rule;
						}),
					);
				},
			},
		},
	};
};

/**
 * Reset the calc registry (useful for testing)
 */
export const resetCalcRegistry = (): void => {
	processedCalcs.clear();
};
