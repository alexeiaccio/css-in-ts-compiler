/**
 * Tests for createTokens function
 */

import { describe, it, expect, beforeEach } from "vitest";

import {
	createTokens,
	clearTokenRegistry,
	getRegisteredTokens,
	getToken,
	generatePropertyCSS,
	generateTokenCSS,
	generateCSS,
	type TokenTree,
	type TokenFn,
} from "../../lib/tokens/create-tokens";

// Define test token input shape
const testTokensInput = {
	colors: {
		$type: "color" as const,
		primary: { $value: "#007bff" },
		secondary: { $value: "#6c757d" },
		brand: {
			primary: { $value: "#000000" },
		},
	},
	spacing: {
		$type: "dimension" as const,
		sm: { $value: "4px" },
		md: { $value: "8px" },
	},
	transitions: {
		$type: "duration" as const,
		fast: { $value: "100ms" },
	},
	scale: {
		$type: "number" as const,
		base: { $value: 1 },
		large: { $value: 1.5 },
	},
	mixed: {
		$type: "color" as const,
		colorToken: { $value: "#fff" },
		explicitToken: { $type: "dimension" as const, $value: "16px" },
	},
};

describe("createTokens", () => {
	beforeEach(() => {
		clearTokenRegistry();
	});

	describe("function-call API", () => {
		it("should call token as function to get CSS var", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const);

			expect(tokens.colors.primary()).toBe("var(--colors-primary)");
		});

		it("should work with nested tokens", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					brand: {
						primary: { $value: "#007bff" },
					},
				},
			} as const);

			expect(tokens.colors.brand.primary()).toBe("var(--colors-brand-primary)");
		});

		it("should also work as string (backward compatible)", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const);

			// Should work as string for backward compatibility
			expect(String(tokens.colors.primary)).toBe("var(--colors-primary)");
			expect(tokens.colors.primary.valueOf()).toBe("var(--colors-primary)");
			expect(tokens.colors.primary.toString()).toBe("var(--colors-primary)");
		});
	});

	describe("metadata properties", () => {
		it("should expose type property", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const);

			expect(tokens.colors.primary.type).toBe("color");
		});

		it("should expose value property", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const);

			expect(tokens.colors.primary.value).toBe("#007bff");
		});

		it("should expose name property", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const) as unknown as TokenTree<typeof testTokensInput>;

			expect(tokens.colors.primary.name).toBe("colors-primary");
		});

		it("should expose cssName property", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const) as unknown as TokenTree<typeof testTokensInput>;

			expect(tokens.colors.primary.cssName).toBe("--colors-primary");
		});

		it("should expose cssSyntax property", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const) as unknown as TokenTree<typeof testTokensInput>;

			expect(tokens.colors.primary.cssSyntax).toBe("<color>");
		});

		it("should expose description property when provided", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: {
						$value: "#007bff",
						$description: "Primary brand color",
					},
				},
			} as const) as unknown as TokenTree<typeof testTokensInput>;

			expect(tokens.colors.primary.description).toBe("Primary brand color");
		});
	});

	describe("shorthand $ properties", () => {
		it("should expose $type shorthand", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const) as unknown as TokenTree<typeof testTokensInput>;

			expect(tokens.colors.primary.$type).toBe("color");
		});

		it("should expose $value shorthand", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const) as unknown as TokenTree<typeof testTokensInput>;

			expect(tokens.colors.primary.$value).toBe("#007bff");
		});

		it("should expose $name shorthand", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const) as unknown as TokenTree<typeof testTokensInput>;

			expect(tokens.colors.primary.$name).toBe("colors-primary");
		});

		it("should expose $cssName shorthand", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const) as unknown as TokenTree<typeof testTokensInput>;

			expect(tokens.colors.primary.$cssName).toBe("--colors-primary");
		});

		it("should expose $cssSyntax shorthand", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const) as unknown as TokenTree<typeof testTokensInput>;

			expect(tokens.colors.primary.$cssSyntax).toBe("<color>");
		});

		it("should expose $description shorthand when provided", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: {
						$value: "#007bff",
						$description: "Primary brand color",
					},
				},
			} as const) as unknown as TokenTree<typeof testTokensInput>;

			expect(tokens.colors.primary.$description).toBe("Primary brand color");
		});
	});

	describe("basic token creation", () => {
		it("should create tokens with default options", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const);

			expect(String(tokens.colors.primary)).toBe("var(--colors-primary)");
		});

		it("should apply prefix option", () => {
			const tokens = createTokens(
				{
					colors: {
						$type: "color",
						primary: { $value: "#007bff" },
					},
				} as const,
				{ prefix: "app" },
			);

			expect(String(tokens.colors.primary)).toBe("var(--app-colors-primary)");
		});

		it("should apply separator option", () => {
			const tokens = createTokens(
				{
					colors: {
						$type: "color",
						primary: { $value: "#007bff" },
					},
				} as const,
				{ prefix: "app", separator: "_" },
			);

			expect(String(tokens.colors.primary)).toBe("var(--app_colors_primary)");
		});
	});

	describe("$type inheritance", () => {
		it("should inherit $type from parent group", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
					secondary: { $value: "#6c757d" },
					nested: {
						deep: { $value: "#000000" },
					},
				},
			} as const);

			expect(String(tokens.colors.primary)).toBe("var(--colors-primary)");
			expect(String(tokens.colors.nested.deep)).toBe("var(--colors-nested-deep)");
		});

		it("should allow override of $type at token level", () => {
			const tokens = createTokens({
				mixed: {
					$type: "color",
					colorToken: { $value: "#fff" },
					explicitToken: { $type: "dimension", $value: "16px" },
				},
			} as const);

			expect(String(tokens.mixed.colorToken)).toBe("var(--mixed-colorToken)");
			expect(String(tokens.mixed.explicitToken)).toBe("var(--mixed-explicitToken)");
		});
	});

	describe("token metadata", () => {
		it("should include $description in token", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: {
						$value: "#007bff",
						$description: "Primary brand color",
					},
				},
			} as const);

			const token = tokens.colors.primary as unknown as { $description: string };
			expect(token.$description).toBe("Primary brand color");
		});

		it("should include metadata properties on token", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const);

			const token = tokens.colors.primary as unknown as {
				$type: string;
				$value: string;
				$name: string;
				$cssName: string;
				$cssSyntax: string;
			};

			expect(token.$type).toBe("color");
			expect(token.$value).toBe("#007bff");
			expect(token.$name).toBe("colors-primary");
			expect(token.$cssName).toBe("--colors-primary");
			expect(token.$cssSyntax).toBe("<color>");
		});
	});

	describe("token types", () => {
		it("should handle color tokens", () => {
			const tokens = createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const);

			expect(String(tokens.colors.primary)).toBe("var(--colors-primary)");
		});

		it("should handle dimension tokens", () => {
			const tokens = createTokens({
				spacing: {
					$type: "dimension",
					sm: { $value: "4px" },
					md: { $value: "0.5rem" },
				},
			} as const);

			expect(String(tokens.spacing.sm)).toBe("var(--spacing-sm)");
			expect(String(tokens.spacing.md)).toBe("var(--spacing-md)");
		});

		it("should handle duration tokens", () => {
			const tokens = createTokens({
				transitions: {
					$type: "duration",
					fast: { $value: "100ms" },
					slow: { $value: "0.3s" },
				},
			} as const);

			expect(String(tokens.transitions.fast)).toBe("var(--transitions-fast)");
		});

		it("should handle number tokens", () => {
			const tokens = createTokens({
				scale: {
					$type: "number",
					base: { $value: 1 },
					large: { $value: 1.5 },
				},
			} as const);

			expect(String(tokens.scale.base)).toBe("var(--scale-base)");
		});
	});

	describe("registry", () => {
		it("should register tokens in global registry", () => {
			createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const);

			const registered = getRegisteredTokens();
			expect(registered).toHaveLength(1);
			const first = registered[0];
			expect(first).toBeDefined();
			if (first) {
				expect(first.name).toBe("colors-primary");
				expect(first.type).toBe("color");
			}
		});

		it("should support multiple token groups", () => {
			createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
					secondary: { $value: "#6c757d" },
				},
				spacing: {
					$type: "dimension",
					sm: { $value: "4px" },
					md: { $value: "8px" },
				},
			} as const);

			expect(getRegisteredTokens()).toHaveLength(4);
		});

		it("should retrieve individual token by name", () => {
			createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const);

			const token = getToken("colors-primary");
			expect(token).not.toBeUndefined();
			if (token) {
				expect(token.name).toBe("colors-primary");
				expect(token.type).toBe("color");
				expect(token.initialValue).toBe("#007bff");
			}
		});
	});

	describe("CSS generation", () => {
		it("should generate @property CSS", () => {
			createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const);

			const css = generatePropertyCSS();
			expect(css).toContain("@property --colors-primary");
			expect(css).toContain('syntax: "<color>"');
			expect(css).toContain("inherits: true");
			expect(css).toContain("initial-value: #007bff");
		});

		it("should generate :root CSS", () => {
			createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const);

			const css = generateTokenCSS();
			expect(css).toContain(":root {");
			expect(css).toContain("--colors-primary: #007bff");
		});

		it("should generate complete CSS", () => {
			createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const);

			const css = generateCSS();
			expect(css).toContain("@property --colors-primary");
			expect(css).toContain(":root {");
		});

		it("should respect generateProperty option", () => {
			createTokens(
				{
					colors: {
						$type: "color",
						primary: { $value: "#007bff" },
					},
				} as const,
				{ generateProperty: false },
			);

			expect(getRegisteredTokens()).toHaveLength(0);
		});
	});

	describe("transform option", () => {
		it("should support custom transform function", () => {
			const tokens = createTokens(
				{
					colors: {
						$type: "color",
						primary: { $value: "#007bff" },
					},
				} as const,
				{
					transform: (path) => `custom_${path.join("_")}`,
				},
			);

			expect(String(tokens.colors.primary)).toBe("var(--custom_colors_primary)");
		});
	});

	describe("clearTokenRegistry", () => {
		it("should clear all registered tokens", () => {
			createTokens({
				colors: {
					$type: "color",
					primary: { $value: "#007bff" },
				},
			} as const);

			expect(getRegisteredTokens()).toHaveLength(1);

			clearTokenRegistry();

			expect(getRegisteredTokens()).toHaveLength(0);
		});
	});
});
