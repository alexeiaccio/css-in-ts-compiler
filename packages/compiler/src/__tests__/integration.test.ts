import { describe, it, expect, beforeEach } from "bun:test";
import {
	clearCSSRegistry,
	getCSSRegistry,
	registerClass,
	registerMultiPropertyClass,
	registerCSSProperty,
	registerToken,
	transformPropertyCall,
	transformFunctionCall,
	generateCSS as generateCSSintsCSS,
	generateHash,
	generateClassName,
	getStats,
} from "../integration";

describe("Integration Module", () => {
	beforeEach(() => {
		clearCSSRegistry();
	});

	describe("Hash Generation", () => {
		it("generates consistent hashes", () => {
			const hash1 = generateHash("display:flex");
			const hash2 = generateHash("display:flex");
			expect(hash1).toBe(hash2);
		});

		it("generates different hashes for different content", () => {
			const hash1 = generateHash("display:flex");
			const hash2 = generateHash("display:block");
			expect(hash1).not.toBe(hash2);
		});

		it("generates class names", () => {
			const className = generateClassName("display", "flex");
			expect(className).toMatch(/^\_css_display_/);
		});
	});

	describe("Class Registration", () => {
		it("registers a CSS class", () => {
			const className = registerClass("display", "flex");
			const registry = getCSSRegistry();
			
			expect(registry.classes.has(className)).toBe(true);
			expect(registry.classes.get(className)?.properties).toEqual({ display: "flex" });
		});

		it("deduplicates identical registrations", () => {
			const className1 = registerClass("display", "flex");
			const className2 = registerClass("display", "flex");
			
			expect(className1).toBe(className2);
			expect(getStats().classes).toBe(1);
		});

		it("registers multi-property classes", () => {
			const props = { display: "flex", "align-items": "center" };
			const className = registerMultiPropertyClass(props);
			
			const registry = getCSSRegistry();
			expect(registry.classes.get(className)?.properties).toEqual(props);
		});
	});

	describe("CSS Property Registration", () => {
		it("registers @property rules", () => {
			registerCSSProperty("--color-primary", "<color>", true, "blue");
			const registry = getCSSRegistry();
			
			expect(registry.properties.has("--color-primary")).toBe(true);
			expect(registry.properties.get("--color-primary")?.syntax).toBe("<color>");
		});
	});

	describe("Transform Helpers", () => {
		it("transforms property calls", () => {
			const result = transformPropertyCall("display", "flex");
			
			expect(result.className).toMatch(/^\_css_display_/);
			expect(result.css).toContain("display: flex");
		});

		it("transforms function calls", () => {
			const result = transformFunctionCall("rgb", ["255", "0", "0"], "color");
			
			expect(result.className).toBeTruthy();
			expect(result.css).toContain("color: rgb(255, 0, 0)");
		});
	});

	describe("CSS Generation", () => {
		it("generates @property CSS", () => {
			registerCSSProperty("--color-primary", "<color>", true, "blue");
			const css = generateCSSintsCSS();
			
			expect(css).toContain("@property --color-primary");
			expect(css).toContain('syntax: "<color>"');
		});

		it("generates class CSS", () => {
			registerClass("display", "flex");
			const css = generateCSSintsCSS();
			
			expect(css).toContain("display: flex");
		});

		it("generates complete CSS output", () => {
			registerCSSProperty("--color-primary", "<color>", true, "blue");
			registerClass("display", "flex");
			
			const css = generateCSSintsCSS();
			
			expect(css).toContain("@property --color-primary");
			expect(css).toContain("display: flex");
		});
	});

	describe("Stats", () => {
		it("reports registry stats", () => {
			registerClass("display", "flex");
			registerCSSProperty("--color", "<color>", true, "blue");
			
			const stats = getStats();
			expect(stats.classes).toBe(1);
			expect(stats.properties).toBe(1);
		});
	});
});
