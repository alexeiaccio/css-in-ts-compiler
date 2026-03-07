import { describe, it, expect } from "vitest";

import { parse, CombinatorType, MultiplierType } from "../parser/index.js";

describe("Value Definition Syntax Parser", () => {
	it("should parse simple type references", () => {
		const result = parse("<length>");
		expect(result.root).toMatchObject({
			type: "type-reference",
			name: "length",
		});
	});

	it("should parse keyword values", () => {
		const result = parse("auto");
		expect(result.root).toMatchObject({
			type: "keyword",
			value: "auto",
		});
	});

	it("should parse bar combinator", () => {
		const result = parse("<length> | <percentage>");
		expect(result.root).toMatchObject({
			type: "combined",
			combinator: CombinatorType.Bar,
			left: { type: "type-reference", name: "length" },
			right: { type: "type-reference", name: "percentage" },
		});
	});

	it("should parse double bar combinator", () => {
		const result = parse("<length> || <percentage>");
		expect(result.root).toMatchObject({
			type: "combined",
			combinator: CombinatorType.DoubleBar,
			left: { type: "type-reference", name: "length" },
			right: { type: "type-reference", name: "percentage" },
		});
	});

	it("should parse double ampersand combinator", () => {
		const result = parse("<length> && <percentage>");
		expect(result.root).toMatchObject({
			type: "combined",
			combinator: CombinatorType.DoubleAmpersand,
			left: { type: "type-reference", name: "length" },
			right: { type: "type-reference", name: "percentage" },
		});
	});

	it("should parse juxtaposition (sequence)", () => {
		const result = parse("<length> <percentage>");
		expect(result.root).toMatchObject({
			type: "combined",
			combinator: CombinatorType.Juxtapose,
			left: { type: "type-reference", name: "length" },
			right: { type: "type-reference", name: "percentage" },
		});
	});

	it("should parse star multiplier", () => {
		const result = parse("<length>*");
		expect(result.root).toMatchObject({
			type: "multiplied",
			multiplier: { type: MultiplierType.Star },
			node: { type: "type-reference", name: "length" },
		});
	});

	it("should parse plus multiplier", () => {
		const result = parse("<length>+");
		expect(result.root).toMatchObject({
			type: "multiplied",
			multiplier: { type: MultiplierType.Plus },
			node: { type: "type-reference", name: "length" },
		});
	});

	it("should parse question mark multiplier", () => {
		const result = parse("<length>?");
		expect(result.root).toMatchObject({
			type: "multiplied",
			multiplier: { type: MultiplierType.Question },
			node: { type: "type-reference", name: "length" },
		});
	});

	it("should parse hash multiplier", () => {
		const result = parse("<length>#");
		expect(result.root).toMatchObject({
			type: "multiplied",
			multiplier: { type: MultiplierType.Hash },
			node: { type: "type-reference", name: "length" },
		});
	});

	it("should parse exact multiplier", () => {
		const result = parse("<length>{3}");
		expect(result.root).toMatchObject({
			type: "multiplied",
			multiplier: { type: MultiplierType.Exact, min: 3 },
			node: { type: "type-reference", name: "length" },
		});
	});

	it("should parse range multiplier", () => {
		const result = parse("<length>{1,3}");
		expect(result.root).toMatchObject({
			type: "multiplied",
			multiplier: { type: MultiplierType.Range, min: 1, max: 3 },
			node: { type: "type-reference", name: "length" },
		});
	});

	it("should parse min multiplier", () => {
		const result = parse("<length>{2,}");
		expect(result.root).toMatchObject({
			type: "multiplied",
			multiplier: { type: MultiplierType.Min, min: 2 },
			node: { type: "type-reference", name: "length" },
		});
	});

	it("should parse groups", () => {
		const result = parse("[ <length> | <percentage> ]");
		expect(result.root).toMatchObject({
			type: "group",
			nodes: expect.any(Array),
		});
	});

	it("should parse required groups", () => {
		const result = parse("[ <length> | <percentage> ]!");
		expect(result.root).toMatchObject({
			type: "group",
			required: true,
			nodes: expect.any(Array),
		});
	});

	it("should parse function", () => {
		const result = parse("rgb(<red> <green> <blue>)");
		expect(result.root).toMatchObject({
			type: "function",
			name: "rgb",
			args: expect.any(Array),
		});
	});

	it("should parse range notation", () => {
		const result = parse("<number [0,1]>");
		expect(result.root).toMatchObject({
			type: "range",
			base: "number",
			min: 0,
			max: 1,
		});
	});

	it("should parse property reference", () => {
		const result = parse("<'border-width'>");
		expect(result.root).toMatchObject({
			type: "property-reference",
			property: "border-width",
		});
	});

	it("should parse complex expression", () => {
		const result = parse("<length> | <percentage> | auto | inherit");
		expect(result.root.type).toBe("combined");
	});
});
