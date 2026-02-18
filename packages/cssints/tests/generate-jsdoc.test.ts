import { describe, it, expect } from "vitest";
import { generateJSDoc, generateFunctionJSDoc } from "../scripts/generate-jsdoc";

describe("generate-jsdoc", () => {
	describe("generateJSDoc", () => {
		it("generates basic JSDoc", () => {
			const result = generateJSDoc({
				name: "test",
				description: "Test function",
			});

			expect(result).toContain("/**");
			expect(result).toContain("Test function");
			expect(result).toContain("*/");
		});

		it("includes syntax", () => {
			const result = generateJSDoc({
				name: "test",
				syntax: "<length>",
			});

			expect(result).toContain("**Syntax**");
			expect(result).toContain("<length>");
		});

		it("includes browser compatibility table", () => {
			const result = generateJSDoc({
				name: "test",
				browserSupport: {
					chrome: "111",
					firefox: "113",
					safari: "15.4",
				},
			});

			expect(result).toContain("Chrome");
			expect(result).toContain("Firefox");
			expect(result).toContain("Safari");
			expect(result).toContain("111");
			expect(result).toContain("113");
		});

		it("includes status badge", () => {
			const result = generateJSDoc({
				name: "test",
				status: "modern",
			});

			expect(result).toContain("🟢");
			expect(result).toContain("modern");
		});
	});

	describe("generateFunctionJSDoc", () => {
		it("generates function JSDoc with MDN link", () => {
			const result = generateFunctionJSDoc("colorMix", "Mixes two colors.");

			expect(result).toContain("colorMix");
			expect(result).toContain("Mixes two colors");
			expect(result).toContain("developer.mozilla.org");
		});
	});
});
