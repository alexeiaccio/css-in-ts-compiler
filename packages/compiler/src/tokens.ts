// Design Tokens implementation following W3C Design Tokens Community Group format

import { CSSProperties } from "./types";

// Design Token types (following W3C DTCG spec)
export type DesignToken = {
	$value: any;
	$type?: string;
	$description?: string;
	$extensions?: Record<string, any>;
};

export type DesignTokenGroup = {
	[key: string]: DesignToken | DesignTokenGroup;
};

export type Theme = {
	tokens: DesignTokenGroup;
	name: string;
};

// Token type definitions
export const TokenType = {
	COLOR: "color",
	DIMENSION: "dimension",
	FONT_FAMILY: "fontFamily",
	FONT_WEIGHT: "fontWeight",
	DURATION: "duration",
	CUBIC_BEZIER: "cubicBezier",
	NUMBER: "number",
	STRING: "string",
} as const;

// Default design tokens
export const defaultTokens: DesignTokenGroup = {
	color: {
		primary: {
			$value: "#3b82f6",
			$type: TokenType.COLOR,
			$description: "Primary brand color",
		},
		secondary: {
			$value: "#6366f1",
			$type: TokenType.COLOR,
			$description: "Secondary brand color",
		},
		success: {
			$value: "#10b981",
			$type: TokenType.COLOR,
			$description: "Success color",
		},
		warning: {
			$value: "#f59e0b",
			$type: TokenType.COLOR,
			$description: "Warning color",
		},
		error: {
			$value: "#ef4444",
			$type: TokenType.COLOR,
			$description: "Error color",
		},
		neutral: {
			50: { $value: "#f9fafb", $type: TokenType.COLOR },
			100: { $value: "#f3f4f6", $type: TokenType.COLOR },
			200: { $value: "#e5e7eb", $type: TokenType.COLOR },
			300: { $value: "#d1d5db", $type: TokenType.COLOR },
			400: { $value: "#9ca3af", $type: TokenType.COLOR },
			500: { $value: "#6b7280", $type: TokenType.COLOR },
			600: { $value: "#4b5563", $type: TokenType.COLOR },
			700: { $value: "#374151", $type: TokenType.COLOR },
			800: { $value: "#1f2937", $type: TokenType.COLOR },
			900: { $value: "#111827", $type: TokenType.COLOR },
		},
	},
	spacing: {
		0: { $value: "0", $type: TokenType.DIMENSION },
		1: { $value: "0.25rem", $type: TokenType.DIMENSION },
		2: { $value: "0.5rem", $type: TokenType.DIMENSION },
		3: { $value: "0.75rem", $type: TokenType.DIMENSION },
		4: { $value: "1rem", $type: TokenType.DIMENSION },
		5: { $value: "1.25rem", $type: TokenType.DIMENSION },
		6: { $value: "1.5rem", $type: TokenType.DIMENSION },
		8: { $value: "2rem", $type: TokenType.DIMENSION },
		10: { $value: "2.5rem", $type: TokenType.DIMENSION },
		12: { $value: "3rem", $type: TokenType.DIMENSION },
		16: { $value: "4rem", $type: TokenType.DIMENSION },
		20: { $value: "5rem", $type: TokenType.DIMENSION },
		24: { $value: "6rem", $type: TokenType.DIMENSION },
		32: { $value: "8rem", $type: TokenType.DIMENSION },
	},
	typography: {
		fontFamily: {
			sans: {
				$value: "system-ui, -apple-system, sans-serif",
				$type: TokenType.FONT_FAMILY,
			},
			mono: {
				$value: "ui-monospace, monospace",
				$type: TokenType.FONT_FAMILY,
			},
		},
		fontSize: {
			xs: { $value: "0.75rem", $type: TokenType.DIMENSION },
			sm: { $value: "0.875rem", $type: TokenType.DIMENSION },
			base: { $value: "1rem", $type: TokenType.DIMENSION },
			lg: { $value: "1.125rem", $type: TokenType.DIMENSION },
			xl: { $value: "1.25rem", $type: TokenType.DIMENSION },
			"2xl": { $value: "1.5rem", $type: TokenType.DIMENSION },
			"3xl": { $value: "1.875rem", $type: TokenType.DIMENSION },
			"4xl": { $value: "2.25rem", $type: TokenType.DIMENSION },
		},
		fontWeight: {
			normal: { $value: "400", $type: TokenType.FONT_WEIGHT },
			medium: { $value: "500", $type: TokenType.FONT_WEIGHT },
			semibold: { $value: "600", $type: TokenType.FONT_WEIGHT },
			bold: { $value: "700", $type: TokenType.FONT_WEIGHT },
		},
		lineHeight: {
			tight: { $value: "1.25", $type: TokenType.NUMBER },
			normal: { $value: "1.5", $type: TokenType.NUMBER },
			relaxed: { $value: "1.75", $type: TokenType.NUMBER },
		},
	},
	borderRadius: {
		none: { $value: "0", $type: TokenType.DIMENSION },
		sm: { $value: "0.125rem", $type: TokenType.DIMENSION },
		DEFAULT: { $value: "0.25rem", $type: TokenType.DIMENSION },
		md: { $value: "0.375rem", $type: TokenType.DIMENSION },
		lg: { $value: "0.5rem", $type: TokenType.DIMENSION },
		xl: { $value: "0.75rem", $type: TokenType.DIMENSION },
		"2xl": { $value: "1rem", $type: TokenType.DIMENSION },
		full: { $value: "9999px", $type: TokenType.DIMENSION },
	},
	shadow: {
		sm: {
			$value: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
			$type: TokenType.STRING,
		},
		DEFAULT: {
			$value: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
			$type: TokenType.STRING,
		},
		md: {
			$value: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
			$type: TokenType.STRING,
		},
		lg: {
			$value: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
			$type: TokenType.STRING,
		},
		xl: {
			$value: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
			$type: TokenType.STRING,
		},
	},
	transition: {
		duration: {
			75: { $value: "75", $type: TokenType.DURATION },
			100: { $value: "100", $type: TokenType.DURATION },
			150: { $value: "150", $type: TokenType.DURATION },
			200: { $value: "200", $type: TokenType.DURATION },
			300: { $value: "300", $type: TokenType.DURATION },
			500: { $value: "500", $type: TokenType.DURATION },
			700: { $value: "700", $type: TokenType.DURATION },
			1000: { $value: "1000", $type: TokenType.DURATION },
		},
		timingFunction: {
			DEFAULT: {
				$value: "cubic-bezier(0.4, 0, 0.2, 1)",
				$type: TokenType.CUBIC_BEZIER,
			},
			in: {
				$value: "cubic-bezier(0.4, 0, 1, 1)",
				$type: TokenType.CUBIC_BEZIER,
			},
			out: {
				$value: "cubic-bezier(0, 0, 0.2, 1)",
				$type: TokenType.CUBIC_BEZIER,
			},
			"in-out": {
				$value: "cubic-bezier(0.4, 0, 0.2, 1)",
				$type: TokenType.CUBIC_BEZIER,
			},
		},
	},
};

// Token resolver
export function resolveToken(path: string, tokens: DesignTokenGroup = defaultTokens): any {
	const parts = path.split(".");
	let current: any = tokens;

	for (const part of parts) {
		if (current[part] === undefined) {
			throw new Error(`Token not found: ${path}`);
		}
		current = current[part];
	}

	// If it's a design token, return its value
	if (current && typeof current === "object" && "$value" in current) {
		return current.$value;
	}

	return current;
}

// Create a theme from tokens
export function createTheme(name: string, tokens: DesignTokenGroup): Theme {
	return {
		name,
		tokens,
	};
}

// Get CSS variables from tokens
export function getCSSVariables(tokens: DesignTokenGroup = defaultTokens, prefix: string = "css"): CSSProperties {
	const variables: CSSProperties = {};

	function traverse(obj: DesignTokenGroup, path: string[] = []) {
		for (const [key, value] of Object.entries(obj)) {
			const currentPath = [...path, key];
			const variableName = `--${prefix}-${currentPath.join("-")}`;

			if (typeof value === "object" && value !== null && "$value" in value) {
				// It's a design token
				variables[variableName] = value.$value;
			} else if (typeof value === "object" && value !== null) {
				// It's a group, traverse deeper
				traverse(value as DesignTokenGroup, currentPath);
			}
		}
	}

	traverse(tokens);
	return variables;
}

// Utility to get a token value as CSS variable
export function token(path: string, prefix: string = "css"): string {
	const variableName = `--${prefix}-${path.replace(/\./g, "-")}`;
	return `var(${variableName})`;
}

// Load tokens from JSON file (W3C DTCG format)
export async function loadTokensFromFile(filePath: string): Promise<DesignTokenGroup> {
	try {
		const content = await Bun.file(filePath).text();
		return JSON.parse(content);
	} catch (error) {
		throw new Error(`Failed to load tokens from ${filePath}: ${error}`);
	}
}

// Save tokens to JSON file (W3C DTCG format)
export async function saveTokensToFile(tokens: DesignTokenGroup, filePath: string): Promise<void> {
	try {
		const content = JSON.stringify(tokens, null, 2);
		await Bun.write(filePath, content);
	} catch (error) {
		throw new Error(`Failed to save tokens to ${filePath}: ${error}`);
	}
}
