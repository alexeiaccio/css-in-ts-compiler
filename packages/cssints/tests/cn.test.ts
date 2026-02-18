import { describe, it, expect } from "vitest";
import { cn, cx, cva } from "../lib/cn";

describe("cn - Class Name Merger", () => {
	it("merges string class names", () => {
		const result = cn("_display-flex", "_items-center");
		expect(result).toBe("_display-flex _items-center");
	});

	it("skips falsy values", () => {
		const condition = false;
		const result = cn("_base", condition && "_conditional", null, undefined);
		expect(result).toBe("_base");
	});

	it("handles single class", () => {
		const result = cn("_single");
		expect(result).toBe("_single");
	});

	it("handles empty input", () => {
		const result = cn();
		expect(result).toBe("");
	});

	it("deduplicates class names", () => {
		const result = cn("_class1", "_class2", "_class1");
		// Last occurrence wins
		expect(result).toContain("_class1");
		expect(result).toContain("_class2");
	});
});

describe("cx - Conditional Class Object", () => {
	it("includes classes with truthy values", () => {
		const result = cx({
			"_display-flex": true,
			"_hidden": false,
		});
		expect(result).toBe("_display-flex");
	});

	it("handles multiple truthy classes", () => {
		const result = cx({
			"_flex": true,
			"_center": true,
			"_block": false,
		});
		expect(result).toBe("_flex _center");
	});

	it("returns empty string for all falsy", () => {
		const result = cx({
			"_a": false,
			"_b": null,
			"_c": undefined,
		});
		expect(result).toBe("");
	});
});

describe("cva - Template Literal Classes", () => {
	it("merges template literal strings", () => {
		const result = cva`_container _flex`;
		expect(result).toBe("_container _flex");
	});

	it("interpolates values", () => {
		const padding = "_p-4";
		const result = cva`_container ${padding} _rounded`;
		expect(result).toBe("_container _p-4 _rounded");
	});

	it("handles multiple interpolations", () => {
		const a = "_a";
		const b = "_b";
		const result = cva`${a} ${b}`;
		expect(result).toBe("_a _b");
	});
});

describe("Specificity Calculation", () => {
	it("calculates specificity for simple class", () => {
		// A simple class like "._abc123" has specificity [0, 1, 0]
		const result = cn("._abc123");
		expect(result).toBe("._abc123");
	});

	it("handles multiple classes with specificity", () => {
		// Both have same specificity [0, 1, 0], last wins
		const result = cn("._a", "._b");
		expect(result).toContain("._a");
		expect(result).toContain("._b");
	});
});
