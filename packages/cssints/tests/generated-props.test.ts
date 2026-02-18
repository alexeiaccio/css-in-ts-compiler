import { describe, it, expect } from "vitest";
import { scaleShorthand } from "../lib/scale";

describe("generated properties (multi-param)", () => {
	it("scaleShorthand handles 1-4 params", () => {
		// Single value
		expect(scaleShorthand(1)).toBe("0.25rem");
		
		// Two values (vertical horizontal)
		expect(scaleShorthand(1, 2)).toBe("0.25rem 0.5rem");
		
		// Three values (top horizontal bottom)
		expect(scaleShorthand(1, 2, 3)).toBe("0.25rem 0.5rem 0.75rem");
		
		// Four values (top right bottom left)
		expect(scaleShorthand(1, 2, 3, 4)).toBe("0.25rem 0.5rem 0.75rem 1rem");
	});

	it("scaleShorthand handles strings", () => {
		expect(scaleShorthand("1rem")).toBe("1rem");
		expect(scaleShorthand("1rem", "2rem")).toBe("1rem 2rem");
	});

	it("scaleShorthand handles mixed types", () => {
		expect(scaleShorthand(1, "2rem")).toBe("0.25rem 2rem");
		expect(scaleShorthand(1, "auto", 2)).toBe("0.25rem auto 0.5rem");
	});
});

describe("property type safety", () => {
	it("accepts number values", () => {
		const value = scaleShorthand(4);
		expect(value).toBeTypeOf("string");
	});

	it("accepts string values", () => {
		const value = scaleShorthand("1rem", "2rem", "1rem", "2rem");
		expect(value).toBe("1rem 2rem 1rem 2rem");
	});

	it("scales to rem by default", () => {
		// 4 * 0.25 = 1
		expect(scaleShorthand(4)).toBe("1rem");
		// 8 * 0.25 = 2
		expect(scaleShorthand(8)).toBe("2rem");
		// 2 * 0.25 = 0.5
		expect(scaleShorthand(2)).toBe("0.5rem");
	});
});
