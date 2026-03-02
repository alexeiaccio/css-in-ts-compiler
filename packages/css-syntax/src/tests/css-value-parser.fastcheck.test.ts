import * as fc from "fast-check";
import { describe, it, expect } from "vitest";

import { generateSelector } from "../generator/selector-generator.js";
import { CSSValueParser } from "../parser/css-value-parser.js";
import { SelectorParser } from "../parser/selector-parser.js";

describe("CSS Value Parser - Property Based Tests", () => {
	const parser = new CSSValueParser();

	it("should handle empty input", () => {
		fc.assert(
			fc.property(fc.constant(""), (input: string) => {
				const parsed = parser.parse(input);
				expect(parsed).toBeDefined();
			}),
			{ numRuns: 10 },
		);
	});
});

describe("CSS Value Parser - Round-trip Tests", () => {
	const parser = new CSSValueParser();

	it("should handle negative values", () => {
		const input = "-10px";
		const parsed = parser.parse(input);
		expect(parsed.type).toBe("dimension");
	});

	it("should handle decimal values", () => {
		const input = "1.5em";
		const parsed = parser.parse(input);
		expect(parsed.type).toBe("dimension");
	});

	it("should handle percentage values", () => {
		const input = "50%";
		const parsed = parser.parse(input);
		expect(parsed.type).toBe("percentage");
	});
});

describe("Selector Parser - Property Based Tests", () => {
	it("should parse simple class selectors", () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(s)),
				(name: string) => {
					const input = `.${name}`;
					const parsed = new SelectorParser(input).parse();
					expect(parsed.type).toBe("complex");
				},
			),
			{ numRuns: 30 },
		);
	});

	it("should parse simple ID selectors", () => {
		fc.assert(
			fc.property(
				fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(s)),
				(name: string) => {
					const input = `#${name}`;
					const parsed = new SelectorParser(input).parse();
					expect(parsed.type).toBe("complex");
				},
			),
			{ numRuns: 30 },
		);
	});
});

describe("Selector Parser - Round-trip Tests", () => {
	it("should round-trip class selector", () => {
		const input = ".foo";
		const parsed = new SelectorParser(input).parse();
		const generated = generateSelector(parsed);
		expect(generated).toBe(input);
	});

	it("should round-trip ID selector", () => {
		const input = "#bar";
		const parsed = new SelectorParser(input).parse();
		const generated = generateSelector(parsed);
		expect(generated).toBe(input);
	});

	it("should round-trip type selector", () => {
		const input = "div";
		const parsed = new SelectorParser(input).parse();
		const generated = generateSelector(parsed);
		expect(generated).toBe(input);
	});

	it("should round-trip attribute selector", () => {
		const input = "[data-test]";
		const parsed = new SelectorParser(input).parse();
		const generated = generateSelector(parsed);
		expect(generated).toBe(input);
	});

	it("should round-trip pseudo-class", () => {
		const input = ":hover";
		const parsed = new SelectorParser(input).parse();
		const generated = generateSelector(parsed);
		expect(generated).toBe(input);
	});

	it("should calculate specificity correctly for ID", () => {
		const input = "#myid";
		const parsed = new SelectorParser(input).parse();
		expect(parsed.specificity.a).toBe(1);
		expect(parsed.specificity.b).toBe(0);
		expect(parsed.specificity.c).toBe(0);
	});

	it("should calculate specificity correctly for class", () => {
		const input = ".myclass";
		const parsed = new SelectorParser(input).parse();
		expect(parsed.specificity.a).toBe(0);
		expect(parsed.specificity.b).toBe(1);
		expect(parsed.specificity.c).toBe(0);
	});

	it("should calculate specificity correctly for type", () => {
		const input = "div";
		const parsed = new SelectorParser(input).parse();
		expect(parsed.specificity.a).toBe(0);
		expect(parsed.specificity.b).toBe(0);
		expect(parsed.specificity.c).toBe(1);
	});
});
