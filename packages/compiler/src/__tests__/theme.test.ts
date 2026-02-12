// Theme tests

import { describe, it, expect, beforeEach } from "bun:test";

import { generateCSS, clearRegistry } from "../compiler";
import { createGlobalTheme, globalStyle, clearThemeRegistry } from "../theme";
import { DesignTokenGroup, TokenType } from "../tokens";

describe("Theme", () => {
	beforeEach(() => {
		clearRegistry();
		clearThemeRegistry();
	});

	describe("createGlobalTheme()", () => {
		it("should create theme vars with CSS variable references", () => {
			const tokens: DesignTokenGroup = {
				color: {
					primary: { $value: "#3b82f6", $type: TokenType.COLOR },
				},
			};

			const vars = createGlobalTheme(":root", tokens);

			expect(vars["color.primary"]).toContain("var(--");
			expect(vars["color.primary"]).toContain(")");
		});

		it("should handle nested token structure", () => {
			const tokens: DesignTokenGroup = {
				color: {
					neutral: {
						100: { $value: "#f3f4f6", $type: TokenType.COLOR },
						200: { $value: "#e5e7eb", $type: TokenType.COLOR },
					},
				},
			};

			const vars = createGlobalTheme(":root", tokens);

			expect(vars["color.neutral.100"]).toBeDefined();
			expect(vars["color.neutral.200"]).toBeDefined();
		});

		it("should use selector in variable names", () => {
			const tokens: DesignTokenGroup = {
				color: {
					primary: { $value: "#3b82f6", $type: TokenType.COLOR },
				},
			};

			const vars = createGlobalTheme(".theme-dark", tokens);

			expect(vars["color.primary"]).toContain("theme_dark");
		});

		it("should generate CSS with variables", () => {
			const tokens: DesignTokenGroup = {
				color: {
					primary: { $value: "#3b82f6", $type: TokenType.COLOR },
				},
			};

			createGlobalTheme(":root", tokens);
			const css = generateCSS();

			expect(css).toContain(":root");
			expect(css).toContain("--");
			expect(css).toContain("#3b82f6");
		});

		it("should generate unique hashes for different tokens", () => {
			const tokens1: DesignTokenGroup = {
				color: { primary: { $value: "#3b82f6", $type: TokenType.COLOR } },
			};
			const tokens2: DesignTokenGroup = {
				color: { primary: { $value: "#ff0000", $type: TokenType.COLOR } },
			};

			const vars1 = createGlobalTheme(":root", tokens1);
			clearThemeRegistry();

			const vars2 = createGlobalTheme(":root", tokens2);

			expect(vars1["color.primary"]).not.toBe(vars2["color.primary"]);
		});

		it("should handle complex nested structures", () => {
			const tokens: DesignTokenGroup = {
				color: {
					primary: { $value: "#3b82f6", $type: TokenType.COLOR },
					secondary: { $value: "#6366f1", $type: TokenType.COLOR },
				},
				spacing: {
					sm: { $value: "0.5rem", $type: TokenType.DIMENSION },
					md: { $value: "1rem", $type: TokenType.DIMENSION },
				},
			};

			const vars = createGlobalTheme(":root", tokens);

			expect(vars["color.primary"]).toBeDefined();
			expect(vars["color.secondary"]).toBeDefined();
			expect(vars["spacing.sm"]).toBeDefined();
			expect(vars["spacing.md"]).toBeDefined();
		});

		it("should handle multiple themes", () => {
			const lightTokens: DesignTokenGroup = {
				color: { bg: { $value: "#ffffff", $type: TokenType.COLOR } },
			};
			const darkTokens: DesignTokenGroup = {
				color: { bg: { $value: "#000000", $type: TokenType.COLOR } },
			};

			createGlobalTheme(":root", lightTokens);
			createGlobalTheme('[data-theme="dark"]', darkTokens);

			const css = generateCSS();

			expect(css).toContain(":root");
			expect(css).toContain('[data-theme="dark"]');
		});
	});

	describe("globalStyle()", () => {
		it("should register global styles", () => {
			globalStyle("body", {
				margin: "0",
				padding: "0",
				fontFamily: "system-ui",
			});

			const css = generateCSS();

			expect(css).toContain("body");
			expect(css).toContain("margin: 0");
			expect(css).toContain("padding: 0");
			expect(css).toContain("fontFamily: system-ui");
		});

		it("should handle multiple global styles", () => {
			globalStyle("*", {
				boxSizing: "border-box",
			});

			globalStyle("html, body", {
				height: "100%",
			});

			const css = generateCSS();

			expect(css).toContain("*");
			expect(css).toContain("html, body");
		});

		it("should work with theme variables", () => {
			const tokens: DesignTokenGroup = {
				color: { background: { $value: "#ffffff", $type: TokenType.COLOR } },
			};
			const vars = createGlobalTheme(":root", tokens);

			globalStyle("body", {
				backgroundColor: vars["color.background"],
			});

			const css = generateCSS();

			expect(css).toContain("backgroundColor");
		});

		it("should handle complex selectors", () => {
			globalStyle('html[data-theme="dark"]', {
				backgroundColor: "#000000",
				color: "#ffffff",
			});

			const css = generateCSS();

			expect(css).toContain('html[data-theme="dark"]');
		});
	});

	describe("generateCSS() integration", () => {
		it("should output global themes before component styles", () => {
			const tokens: DesignTokenGroup = {
				color: { primary: { $value: "#3b82f6", $type: TokenType.COLOR } },
			};
			createGlobalTheme(":root", tokens);

			globalStyle("body", {
				backgroundColor: "#ffffff",
			});

			const css = generateCSS();

			const rootIndex = css.indexOf(":root");
			const bodyIndex = css.indexOf("body");

			expect(rootIndex).toBeLessThan(bodyIndex);
		});

		it("should clear theme registry with clearRegistry", () => {
			const tokens: DesignTokenGroup = {
				color: { primary: { $value: "#3b82f6", $type: TokenType.COLOR } },
			};
			createGlobalTheme(":root", tokens);

			clearRegistry();

			const css = generateCSS();

			expect(css).not.toContain(":root");
		});
	});

	describe("ThemeVars type", () => {
		it("should return object with string values", () => {
			const tokens: DesignTokenGroup = {
				color: { primary: { $value: "#3b82f6", $type: TokenType.COLOR } },
			};

			const vars = createGlobalTheme(":root", tokens);

			expect(typeof vars["color.primary"]).toBe("string");
		});
	});
});
