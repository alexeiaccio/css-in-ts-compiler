/**
 * @cssints/types-generator
 *
 * Script to generate CSS type definitions from MDN Browser Compatibility Data.
 * Run this script periodically to update types from the latest BCD.
 *
 * Usage:
 *   bun run scripts/generate-types.ts
 */

import bcd from "@mdn/browser-compat-data" with { type: "json" };

const OUTPUT_FILE = "./src/value-types.ts";
const BANNER = `/**
 * CSS Value Types for cssints compiler
 * Generated from MDN Browser Compatibility Data
 * Run: bun run scripts/generate-types.ts
 * Last updated: ${new Date().toISOString()}
 */

// =============================================================================
// Base Types
// =============================================================================

`;

// =============================================================================
// Extract Named Colors
// =============================================================================

function extractNamedColors(): string {
	const colors = Object.keys(bcd.css.types.color?.values || {});

	// Filter to only valid named colors (remove functions, keywords, etc.)
	const namedColors = colors.filter(
		(c) => /^[a-z]+$/.test(c) && c !== "transparent" && c !== "currentcolor" && !c.includes("-"),
	);

	return `/** Named CSS colors */
export type NamedColor =\n\t| ${namedColors.map((c) => `'${c}'`).join(" | ")};\n`;
}

// =============================================================================
// Extract Color Keywords
// =============================================================================

function extractColorKeywords(): string {
	return `/** CSS color keywords */
export type ColorKeyword = 'transparent' | 'currentColor';\n`;
}

// =============================================================================
// Extract CSS Functions
// =============================================================================

function extractColorFunctions(): string {
	const colorTypes = bcd.css.types;

	const functions: string[] = [];

	// Check for color functions in BCD
	if (colorTypes.color?.values) {
		Object.keys(colorTypes.color.values).forEach((key) => {
			if (key.startsWith("color(")) {
				functions.push(`\t| '${key}'`);
			}
		});
	}

	// color-mix function
	functions.push("\t| 'color-mix(in \\${string}, \\${string}, \\${string})'");

	// Light-dark function (CSS Color Level 4)
	functions.push("\t| 'light-dark(\\${string}, \\${string})'");

	return `/** CSS color functions */
export type ColorFunction =\n${functions.join("\n")};\n`;
}

// =============================================================================
// Extract CSS Value Types
// =============================================================================

function extractValueTypes(): string {
	const types = bcd.css.types;
	const lines: string[] = [];

	// Angle type
	if (types.angle?.values) {
		const units = Object.keys(types.angle.values).join(" | ");
		lines.push(`export type Angle = ${units};\n`);
	}

	// Length type
	if (types.length?.values) {
		const units = Object.keys(types.length.values).join(" | ");
		lines.push(`export type Length = ${units};\n`);
	}

	// Percentage
	if (types.percentage) {
		lines.push(`export type Percentage = \`\${number}%\`;\n`);
	}

	// Number
	if (types.integer || types.number) {
		lines.push(`export type Number = number;\n`);
	}

	// Time
	if (types.time?.values) {
		const units = Object.keys(types.time.values).join(" | ");
		lines.push(`export type Time = ${units};\n`);
	}

	// Frequency
	if (types.frequency?.values) {
		const units = Object.keys(types.frequency.values).join(" | ");
		lines.push(`export type Frequency = ${units};\n`);
	}

	// Resolution
	if (types.resolution?.values) {
		const units = Object.keys(types.resolution.values).join(" | ");
		lines.push(`export type Resolution = ${units};\n`);
	}

	// Flex
	if (types.flex?.values) {
		const units = Object.keys(types.flex.values).join(" | ");
		lines.push(`export type Flex = ${units};\n`);
	}

	return `/** CSS value types from BCD */
${lines.join("\n")}`;
}

// =============================================================================
// Extract CSS Property Types
// =============================================================================

function extractPropertyTypes(): string {
	const properties = bcd.css.properties;

	// Common property value types
	const commonTypes: Record<string, string> = {
		display:
			'| "block" | "inline" | "inline-block" | "flex" | "inline-flex" | "grid" | "inline-grid" | "none" | "contents"',
		position: '| "static" | "relative" | "absolute" | "fixed" | "sticky"',
		overflow: '| "visible" | "hidden" | "clip" | "scroll" | "auto"',
		visibility: '| "visible" | "hidden" | "collapse"',
		"z-index": '| "auto" | \`\${number}\`',
	};

	let output = `/** CSS property value types */
export type CSSPropertyValues = {\n`;

	Object.entries(properties).forEach(([name, data]) => {
		// Skip if it's a shorthand with __compat
		if (name.startsWith("__")) return;

		// Extract keyword values from __compat
		const compat = (data as Record<string, unknown>).__compat;
		if (compat && typeof compat === "object") {
			const compatData = compat as { values?: Record<string, unknown> };
			if (compatData.values) {
				const values = Object.keys(compatData.values).join(" | ");
				commonTypes[name] = `| ${values}`;
			}
		}
	});

	Object.entries(commonTypes).forEach(([name, type]) => {
		output += `\t${name}: ${type};\n`;
	});

	output += `};\n`;

	return output;
}

// =============================================================================
// Extract Math Functions
// =============================================================================

function extractMathFunctions(): string {
	const mathFunctions = [
		"calc()",
		"min()",
		"max()",
		"clamp()",
		"round()",
		"abs()",
		"sign()",
		"hypot()",
		"pow()",
		"sqrt()",
		"log()",
		"exp()",
		"mod()",
		"rem()",
	];

	return `/** CSS math functions */
export type MathFunction =
${mathFunctions.map((f) => `\t| '${f}'`).join("\n")};
`;
}

// =============================================================================
// Extract Image Functions
// =============================================================================

function extractImageFunctions(): string {
	const imageFunctions = [
		"url()",
		"image()",
		"image-set()",
		"linear-gradient()",
		"radial-gradient()",
		"conic-gradient()",
		"repeating-linear-gradient()",
		"repeating-radial-gradient()",
		"element()",
		"paint()",
	];

	return `/** CSS image functions */
export type ImageFunction =
${imageFunctions.map((f) => `\t| '${f}'`).join("\n")};
`;
}

// =============================================================================
// Extract Filter Functions
// =============================================================================

function extractFilterFunctions(): string {
	const filterFunctions = [
		"blur()",
		"brightness()",
		"contrast()",
		"drop-shadow()",
		"grayscale()",
		"hue-rotate()",
		"invert()",
		"opacity()",
		"saturate()",
		"sepia()",
	];

	return `/** CSS filter functions */
export type FilterFunction =
${filterFunctions.map((f) => `\t| '${f}'`).join("\n")};
`;
}

// =============================================================================
// Extract Transform Functions
// =============================================================================

function extractTransformFunctions(): string {
	const transformFunctions = [
		"matrix()",
		"matrix3d()",
		"translate()",
		"translate3d()",
		"translateX()",
		"translateY()",
		"translateZ()",
		"scale()",
		"scale3d()",
		"scaleX()",
		"scaleY()",
		"scaleZ()",
		"rotate()",
		"rotate3d()",
		"rotateX()",
		"rotateY()",
		"rotateZ()",
		"skew()",
		"skewX()",
		"skewY()",
		"perspective()",
	];

	return `/** CSS transform functions */
export type TransformFunction =
${transformFunctions.map((f) => `\t| '${f}'`).join("\n")};
`;
}

// =============================================================================
// Extract Easing Functions
// =============================================================================

function extractEasingFunctions(): string {
	return `/** CSS easing functions */
export type EasingFunction =
\t| 'linear'
\t| 'ease'
\t| 'ease-in'
\t| 'ease-out'
\t| 'ease-in-out'
\t| 'cubic-bezier()'
\t| 'steps()'
\t| 'linear()';
`;
}

// =============================================================================
// Extract Global Keywords
// =============================================================================

function extractGlobalKeywords(): string {
	return `/** CSS global keywords */
export type GlobalKeyword = 'inherit' | 'initial' | 'revert' | 'revert-layer' | 'unset';
`;
}

// =============================================================================
// Main Generator
// =============================================================================

function generate() {
	const content = [
		BANNER,
		extractNamedColors(),
		extractColorKeywords(),
		extractColorFunctions(),
		extractMathFunctions(),
		extractImageFunctions(),
		extractFilterFunctions(),
		extractTransformFunctions(),
		extractEasingFunctions(),
		extractGlobalKeywords(),
		extractValueTypes(),
		extractPropertyTypes(),
	].join("\n");

	Bun.write(OUTPUT_FILE, content);
	console.log(`Generated ${OUTPUT_FILE}`);
	console.log('Run "bun run format" to format the output.');
}

// =============================================================================
// Run Generator
// =============================================================================

generate();
