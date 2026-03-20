/**
 * Layer Visitor
 * Wraps CSS rules in cascade layers for specificity control
 */

import type { Rule, StyleSheet } from "lightningcss";

import { Effect, Console } from "effect";

export interface LayerOptions {
	theme?: string;
	utilities?: string;
	components?: string;
}

const defaultLayers: Required<LayerOptions> = {
	theme: "_.a",
	utilities: "_.b",
	components: "_.c",
};

/**
 * Determine which layer a rule belongs to
 */
const determineLayer = (rule: Rule, options: Required<LayerOptions>): string | null => {
	// @property rules go to theme layer
	if (rule.type === "property") {
		return options.theme;
	}

	// Style rules with atomic classes (starting with _) go to utilities
	if (rule.type === "style" && rule.value.selectors) {
		const selector = rule.value.selectors[0];
		if (selector && selector[0]?.type === "class") {
			const className = selector[0].name;
			// Atomic classes start with underscore
			if (className.startsWith("_")) {
				return options.utilities;
			}
		}
	}

	return null;
};

/**
 * Create layer visitor
 * Wraps rules in CSS cascade layers
 */
export const createLayerVisitor = (options: LayerOptions = {}) => {
	const layers = { ...defaultLayers, ...options };

	return {
		StyleSheet: (stylesheet: StyleSheet): StyleSheet => {
			return Effect.runSync(
				Effect.gen(function* () {
					yield* Console.debug("Processing layers");

					const layeredRules: Rule[] = [];

					for (const rule of stylesheet.rules) {
						const layer = determineLayer(rule, layers);

						if (layer) {
							// Wrap in layer
							layeredRules.push({
								type: "layer",
								value: {
									name: layer,
									rules: [rule],
								},
							} as unknown as Rule);
						} else {
							// Keep as-is
							layeredRules.push(rule);
						}
					}

					// Add layer declaration at the top
					const layerDecl: Rule = {
						type: "layer",
						value: {
							name: [layers.theme, layers.utilities, layers.components],
							rules: [],
						},
					} as unknown as Rule;

					yield* Console.debug(`Wrapped ${layeredRules.length} rules in layers`);

					return {
						...stylesheet,
						rules: [layerDecl, ...layeredRules],
					};
				}),
			);
		},
	};
};
