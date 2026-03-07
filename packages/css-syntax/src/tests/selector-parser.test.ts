import { describe, it, expect } from "vitest";

import { parseSelector, specificityToNumber } from "../parser/index.js";

describe("Selector Parser", () => {
	it("should parse type selector", () => {
		const result = parseSelector("div");
		expect(result.type).toBe("complex");
		expect(result.children[0]).toMatchObject({ type: "compound" });
	});

	it("should parse class selector", () => {
		const result = parseSelector(".foo");
		expect(result.children[0]).toMatchObject({
			type: "compound",
			children: [{ type: "class", name: "foo" }],
		});
	});

	it("should parse id selector", () => {
		const result = parseSelector("#bar");
		expect(result.children[0]).toMatchObject({
			type: "compound",
			children: [{ type: "id", name: "bar" }],
		});
	});

	it("should parse universal selector", () => {
		const result = parseSelector("*");
		expect(result.children[0]).toMatchObject({
			type: "compound",
			children: [{ type: "type", name: "*" }],
		});
	});

	it("should parse descendant selector", () => {
		const result = parseSelector("div span");
		expect(result.children).toHaveLength(3);
		expect(result.children[1]).toMatchObject({ type: "combinator", kind: " " });
	});

	it("should parse child selector", () => {
		const result = parseSelector("div > span");
		expect(result.children[1]).toMatchObject({ type: "combinator", kind: ">" });
	});

	it("should parse adjacent sibling", () => {
		const result = parseSelector("div + span");
		expect(result.children[1]).toMatchObject({ type: "combinator", kind: "+" });
	});

	it("should parse general sibling", () => {
		const result = parseSelector("div ~ span");
		expect(result.children[1]).toMatchObject({ type: "combinator", kind: "~" });
	});

	it("should parse attribute selector", () => {
		const result = parseSelector("[data-foo]");
		expect(result.children[0]).toMatchObject({
			type: "compound",
			children: [{ type: "attribute", name: "data-foo" }],
		});
	});

	it("should parse attribute with value", () => {
		const result = parseSelector('[data-foo="bar"]');
		expect(result.children[0]).toMatchObject({
			type: "compound",
			children: [{ type: "attribute", name: "data-foo", operator: "=", value: "bar" }],
		});
	});

	it("should parse pseudo-class", () => {
		const result = parseSelector(":hover");
		expect(result.children[0]).toMatchObject({
			type: "compound",
			children: [{ type: "pseudo-class", name: "hover" }],
		});
	});

	it("should parse pseudo-element", () => {
		const result = parseSelector("::before");
		expect(result.children[0]).toMatchObject({
			type: "compound",
			children: [{ type: "pseudo-element", name: "before" }],
		});
	});

	it("should parse complex selector", () => {
		const result = parseSelector(".container > .item[data-foo]:hover::before");
		expect(result.type).toBe("complex");
		expect(result.children.length).toBeGreaterThan(0);
	});

	it("should calculate specificity for id", () => {
		const result = parseSelector("#foo");
		expect(result.specificity).toEqual({ a: 1, b: 0, c: 0 });
	});

	it("should calculate specificity for class", () => {
		const result = parseSelector(".foo");
		expect(result.specificity).toEqual({ a: 0, b: 1, c: 0 });
	});

	it("should calculate specificity for type", () => {
		const result = parseSelector("div");
		expect(result.specificity).toEqual({ a: 0, b: 0, c: 1 });
	});

	it("should calculate specificity for combined", () => {
		const result = parseSelector("#id .class div");
		expect(result.specificity).toEqual({ a: 1, b: 1, c: 1 });
	});

	it("should calculate specificity for specificityToNumber", () => {
		const result = parseSelector("#id");
		expect(specificityToNumber(result.specificity)).toBe(65536);
	});

	it("should parse namespace", () => {
		const result = parseSelector("ns|element");
		expect(result.children[0]).toMatchObject({
			type: "compound",
			children: [{ type: "type", name: "element", namespace: "ns" }],
		});
	});
});
