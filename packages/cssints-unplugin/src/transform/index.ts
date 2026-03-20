/**
 * Code transformation utilities
 *
 * Transforms cv/scv/sv/ssv calls into optimized runtime code
 * with pre-computed class names
 */

import { Effect, Console } from "effect";

import type { CSSGeneratorOptions } from "../css-generator.js";

import { generateVariantCSS } from "../css-generator.js";

export interface TransformContext {
	/** Source file ID */
	id: string;
	/** Whether in development mode */
	isDev: boolean;
	/** Component name (extracted from file or context) */
	componentName?: string;
}

export interface TransformOptions {
	/** CSS generator options */
	cssOptions: CSSGeneratorOptions;
}

/**
 * Parse variant configuration from code string
 * This is a simplified parser - in production, use proper AST parsing
 */
function parseVariantConfig(code: string): {
	base?: string;
	variants?: Record<string, Record<string, string>>;
	defaultVariants?: Record<string, string>;
} | null {
	// Extract the config object from cv({ ... })
	const match = code.match(/cv\s*\(\s*({[\s\S]*?})\s*\)/);
	if (!match || !match[1]) return null;

	try {
		// Use Function constructor to safely parse the object
		// In production, this should use a proper AST parser
		const configStr = match[1];
		// Replace unquoted keys with quoted keys for JSON parsing
		const jsonStr = configStr
			.replace(/([\w]+):/g, '"$1":')
			.replace(/'/g, '"')
			.replace(/,\s*}/g, "}");
		return JSON.parse(jsonStr);
	} catch {
		return null;
	}
}

/**
 * Transform cv() call to optimized runtime code
 */
export const transformCvCall = Effect.fn("transformCvCall")(function* (
	code: string,
	context: TransformContext,
	options: TransformOptions,
) {
	yield* Console.debug(`Transforming cv() call in ${context.id}`);

	const config = parseVariantConfig(code);
	if (!config) {
		yield* Console.warn(`Could not parse cv() config in ${context.id}`);
		return code;
	}

	const componentName = context.componentName || "Component";

	// Generate CSS and class names
	const result = yield* generateVariantCSS(componentName, config, options.cssOptions);

	// Build runtime config
	const runtimeConfig = {
		classes: result.classNames,
		defaultVariants: config.defaultVariants || {},
	};

	// Replace the cv() call with _cv() runtime call
	const transformed = code.replace(/cv\s*\(\s*{[\s\S]*?}\s*\)/, `_cv(${JSON.stringify(runtimeConfig, null, 2)})`);

	yield* Console.debug(`Transformed cv() call for ${componentName}`);

	return transformed;
});

/**
 * Transform scv() call to optimized runtime code
 */
export const transformScvCall = Effect.fn("transformScvCall")(function* (
	code: string,
	context: TransformContext,
	options: TransformOptions,
) {
	yield* Console.debug(`Transforming scv() call in ${context.id}`);

	// Similar to cv but for slot variants
	// TODO: Implement slot variant parsing
	yield* Console.warn(`scv() transformation not yet implemented`);
	return code;
});

/**
 * Transform all variant calls in a file
 */
export const transformFile = Effect.fn("transformFile")(function* (
	code: string,
	context: TransformContext,
	options: TransformOptions,
) {
	yield* Console.info(`Transforming file: ${context.id}`);

	let transformedCode = code;
	let generatedCss = "";

	// Check for cv() calls
	if (code.includes(".cv(")) {
		transformedCode = yield* transformCvCall(transformedCode, context, options);
	}

	// Check for scv() calls
	if (code.includes(".scv(")) {
		transformedCode = yield* transformScvCall(transformedCode, context, options);
	}

	// Add runtime import if we transformed anything
	if (transformedCode !== code) {
		const runtimeImport = 'import { _cv } from "@cssints/variants/runtime";\n';
		transformedCode = runtimeImport + transformedCode;
	}

	yield* Console.info(`Transformation complete for ${context.id}`);

	return {
		code: transformedCode,
		css: generatedCss,
	};
});

/**
 * Synchronous version of transformFile
 */
export function transformFileSync(
	code: string,
	context: TransformContext,
	options: TransformOptions,
): { code: string; css: string } {
	return Effect.runSync(transformFile(code, context, options));
}
