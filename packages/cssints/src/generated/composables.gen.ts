// ==============================================================================
// Composable CSS Utilities - AUTO-GENERATED
// Do not edit manually.
// ==============================================================================

import { Style, createStyle } from "../core/style.js";

/**
 * Create a flex container with composable utilities
 */
export function flex(): Style {
	return createStyle({
		property: "display",
		value: "flex",
		description: "Create a flex container with composable utilities",
	});
}

/**
 * Create a grid container with composable utilities
 */
export function grid(): Style {
	return createStyle({
		property: "display",
		value: "grid",
		description: "Create a grid container with composable utilities",
	});
}

/**
 * Set align-items
 */
export function items(value: string): Style {
	return createStyle({
		property: "align-items",
		value: String(value),
		description: "Set align-items",
	});
}

/**
 * Set justify-content
 */
export function justify(value: string): Style {
	return createStyle({
		property: "justify-content",
		value: String(value),
		description: "Set justify-content",
	});
}
