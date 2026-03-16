// Design Tokens tests

import { describe, it, expect } from "bun:test";
import { writeFileSync, unlinkSync, existsSync } from "fs";

import {
	resolveToken,
	createTheme,
	getCSSVariables,
	token,
	defaultTokens,
	TokenType,
	loadTokensFromFile,
	saveTokensToFile,
} from "../tokens";

describe("Design Tokens", () => {
	describe("resolveToken()", () => {
		it("should resolve simple token", () => {
			const value = resolveToken("color.primary");
			expect(value).toBe("#3b82f6");
		});

		it("should resolve nested token", () => {
			const value = resolveToken("color.neutral.500");
			expect(value).toBe("#6b7280");
		});

		it("should resolve spacing token", () => {
			const value = resolveToken("spacing.4");
			expect(value).toBe("1rem");
		});

		it("should resolve typography token", () => {
			const value = resolveToken("typography.fontSize.base");
			expect(value).toBe("1rem");
		});

		it("should throw error for non-existent token", () => {
			expect(() => resolveToken("nonexistent.token")).toThrow();
		});
	});

	describe("createTheme()", () => {
		it("should create a theme object", () => {
			const theme = createTheme("dark", {
				color: {
					primary: { $value: "#60a5fa", $type: TokenType.COLOR },
				},
			});

			expect(theme.name).toBe("dark");
			expect(theme.tokens.color.primary.$value).toBe("#60a5fa");
		});
	});

	describe("getCSSVariables()", () => {
		it("should generate CSS variables from tokens", () => {
			const variables = getCSSVariables();

			expect(variables).toHaveProperty("--css-color-primary");
			expect(variables["--css-color-primary"]).toBe("#3b82f6");
		});

		it("should handle nested tokens", () => {
			const variables = getCSSVariables();

			expect(variables).toHaveProperty("--css-color-neutral-500");
			expect(variables["--css-color-neutral-500"]).toBe("#6b7280");
		});

		it("should handle custom prefix", () => {
			const variables = getCSSVariables(defaultTokens, "custom");

			expect(variables).toHaveProperty("--custom-color-primary");
			expect(variables["--custom-color-primary"]).toBe("#3b82f6");
		});
	});

	describe("token()", () => {
		it("should generate CSS variable reference", () => {
			const varRef = token("color.primary");
			expect(varRef).toBe("var(--css-color-primary)");
		});

		it("should handle nested paths", () => {
			const varRef = token("color.neutral.500");
			expect(varRef).toBe("var(--css-color-neutral-500)");
		});

		it("should handle custom prefix", () => {
			const varRef = token("color.primary", "custom");
			expect(varRef).toBe("var(--custom-color-primary)");
		});
	});

	describe("TokenType", () => {
		it("should have all required types", () => {
			expect(TokenType.COLOR).toBe("color");
			expect(TokenType.DIMENSION).toBe("dimension");
			expect(TokenType.FONT_FAMILY).toBe("fontFamily");
			expect(TokenType.FONT_WEIGHT).toBe("fontWeight");
			expect(TokenType.DURATION).toBe("duration");
			expect(TokenType.CUBIC_BEZIER).toBe("cubicBezier");
			expect(TokenType.NUMBER).toBe("number");
			expect(TokenType.STRING).toBe("string");
		});
	});

	describe("File I/O", () => {
		const testFilePath = "/tmp/test-tokens.json";
		const testTokens = {
			color: {
				primary: { $value: "#ff0000", $type: TokenType.COLOR },
			},
		};

		it("should save tokens to file", async () => {
			await saveTokensToFile(testTokens, testFilePath);
			expect(existsSync(testFilePath)).toBe(true);

			const content = await Bun.file(testFilePath).text();
			const parsed = JSON.parse(content);
			expect(parsed.color.primary.$value).toBe("#ff0000");

			// Cleanup
			if (existsSync(testFilePath)) {
				unlinkSync(testFilePath);
			}
		});

		it("should load tokens from file", async () => {
			await saveTokensToFile(testTokens, testFilePath);
			const loaded = await loadTokensFromFile(testFilePath);
			expect(loaded.color.primary.$value).toBe("#ff0000");
			expect(loaded.color.primary.$type).toBe(TokenType.COLOR);

			// Cleanup
			if (existsSync(testFilePath)) {
				unlinkSync(testFilePath);
			}
		});
	});

	describe("Default Tokens", () => {
		it("should have color tokens", () => {
			expect(defaultTokens.color.primary).toBeDefined();
			expect(defaultTokens.color.secondary).toBeDefined();
			expect(defaultTokens.color.neutral).toBeDefined();
		});

		it("should have spacing tokens", () => {
			expect(defaultTokens.spacing).toBeDefined();
			expect(defaultTokens.spacing[0]).toBeDefined();
			expect(defaultTokens.spacing[4]).toBeDefined();
		});

		it("should have typography tokens", () => {
			expect(defaultTokens.typography).toBeDefined();
			expect(defaultTokens.typography.fontFamily).toBeDefined();
			expect(defaultTokens.typography.fontSize).toBeDefined();
			expect(defaultTokens.typography.fontWeight).toBeDefined();
		});

		it("should have border radius tokens", () => {
			expect(defaultTokens.borderRadius).toBeDefined();
			expect(defaultTokens.borderRadius.DEFAULT).toBeDefined();
		});

		it("should have shadow tokens", () => {
			expect(defaultTokens.shadow).toBeDefined();
			expect(defaultTokens.shadow.DEFAULT).toBeDefined();
		});

		it("should have transition tokens", () => {
			expect(defaultTokens.transition).toBeDefined();
			expect(defaultTokens.transition.duration).toBeDefined();
			expect(defaultTokens.transition.timingFunction).toBeDefined();
		});
	});
});
