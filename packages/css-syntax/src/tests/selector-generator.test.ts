import { describe, it, expect } from "vitest";

import { generateSelector } from "../generator/selector-generator.js";
import { parseSelector } from "../parser/selector-parser.js";

describe("Selector Generator", () => {
	it("should generate simple type selector", () => {
		const ast = parseSelector("div");
		const result = generateSelector(ast);
		expect(result).toBe("div");
	});

	it("should generate class selector", () => {
		const ast = parseSelector(".foo");
		const result = generateSelector(ast);
		expect(result).toBe(".foo");
	});

	it("should generate id selector", () => {
		const ast = parseSelector("#bar");
		const result = generateSelector(ast);
		expect(result).toBe("#bar");
	});

	it("should generate descendant selector", () => {
		const ast = parseSelector("div span");
		const result = generateSelector(ast);
		expect(result).toBe("div span");
	});

	it("should generate child selector", () => {
		const ast = parseSelector("div > span");
		const result = generateSelector(ast);
		expect(result).toBe("div > span");
	});

	it("should generate adjacent sibling selector", () => {
		const ast = parseSelector("div + span");
		const result = generateSelector(ast);
		expect(result).toBe("div + span");
	});

	it("should generate general sibling selector", () => {
		const ast = parseSelector("div ~ span");
		const result = generateSelector(ast);
		expect(result).toBe("div ~ span");
	});

	it("should generate attribute selector", () => {
		const ast = parseSelector("[data-foo]");
		const result = generateSelector(ast);
		expect(result).toBe("[data-foo]");
	});

	it("should generate attribute selector with value", () => {
		const ast = parseSelector('[data-foo="bar"]');
		const result = generateSelector(ast);
		expect(result).toBe('[data-foo="bar"]');
	});

	it("should generate pseudo-class selector", () => {
		const ast = parseSelector(":hover");
		const result = generateSelector(ast);
		expect(result).toBe(":hover");
	});

	it("should generate pseudo-element selector", () => {
		const ast = parseSelector("::before");
		const result = generateSelector(ast);
		expect(result).toBe("::before");
	});

	it("should generate complex selector", () => {
		const ast = parseSelector(".container > .item[data-foo]:hover::before");
		const result = generateSelector(ast);
		expect(result).toBe(".container > .item[data-foo]:hover::before");
	});
});
