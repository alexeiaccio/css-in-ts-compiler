/**
 * JSDoc Generator
 *
 * Generates JSDoc comments with browser compatibility info.
 */

import type { CSSFeature } from "./filter-baseline";

export interface JSDocOptions {
	name: string;
	description?: string;
	syntax?: string;
	spec?: string;
	status?: "modern" | "experimental" | "deprecated";
	browserSupport?: CSSFeature["browserSupport"];
	examples?: string[];
	see?: string;
}

function formatBrowserVersion(version?: string): string {
	if (!version || version === "true") return "✓";
	if (version === "false") return "✗";
	return version;
}

function formatCompatTable(support?: CSSFeature["browserSupport"]): string {
	if (!support) return "";

	const rows: string[] = [];
	rows.push(" * | Chrome | Firefox | Safari | Edge |");
	rows.push(" * | :----: | :-----: | :----: | :---: |");

	const chrome = formatBrowserVersion(support.chrome);
	const firefox = formatBrowserVersion(support.firefox);
	const safari = formatBrowserVersion(support.safari);
	const edge = formatBrowserVersion(support.edge);

	rows.push(` * | **${chrome}** | **${firefox}** | **${safari}** | **${edge}** |`);

	return rows.join("\n");
}

/**
 * Generate a JSDoc comment block for a CSS function.
 */
export function generateJSDoc(options: JSDocOptions): string {
	const lines: string[] = ["/**"];

	// Description
	if (options.description) {
		lines.push(` * ${options.description}`);
		lines.push(" *");
	}

	// Syntax
	if (options.syntax) {
		lines.push(` * **Syntax**: \`${options.syntax}\``);
		lines.push(" *");
	}

	// Status badge
	if (options.status) {
		const statusEmoji = {
			modern: "🟢",
			experimental: "🟡",
			deprecated: "🔴",
		}[options.status];
		lines.push(` * **Status**: ${statusEmoji} ${options.status}`);
		lines.push(" *");
	}

	// Browser compatibility table
	if (options.browserSupport) {
		const compatTable = formatCompatTable(options.browserSupport);
		if (compatTable) {
			lines.push(" * **Browser Support**:");
			lines.push(" *");
			lines.push(compatTable);
			lines.push(" *");
		}
	}

	// Spec reference
	if (options.spec) {
		lines.push(` * @spec ${options.spec}`);
	}

	// MDN link
	if (options.see) {
		lines.push(` * @see ${options.see}`);
	}

	// Examples
	if (options.examples && options.examples.length > 0) {
		lines.push(" *");
		lines.push(" * @example");
		for (const example of options.examples) {
			lines.push(` * ${example}`);
		}
	}

	lines.push(" */");

	return lines.join("\n");
}

/**
 * Generate JSDoc for a CSS function with common patterns.
 */
export function generateFunctionJSDoc(
	name: string,
	description: string,
	options?: Partial<JSDocOptions>,
): string {
	return generateJSDoc({
		name,
		description,
		syntax: options?.syntax,
		spec: options?.spec,
		status: options?.status ?? "modern",
		browserSupport: options?.browserSupport,
		see: `https://developer.mozilla.org/docs/Web/CSS/${name}`,
		examples: options?.examples ?? [`css.${name}(...)`],
	});
}

/**
 * Generate JSDoc for a color function.
 */
export function generateColorFunctionJSDoc(
	name: string,
	description: string,
	support?: CSSFeature["browserSupport"],
): string {
	return generateFunctionJSDoc(name, description, {
		syntax: `${name}(...)`,
		status: "modern",
		browserSupport: support,
		examples: [
			`// Basic usage`,
			`css.${name}(/* params */)`,
		],
	});
}
