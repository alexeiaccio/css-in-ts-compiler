import { describe, it, expect } from "vitest";
import { inferType, inferParams } from "../scripts/infer-types";
import { parseSyntaxSync } from "../src/core/value-syntax";

describe("infer-types", () => {
	describe("inferType", () => {
		it("infers type for <length>", () => {
			const parsed = parseSyntaxSync("<length>");
			const result = inferType(parsed);
			expect(result.tsType).toBe("Length");
		});

		it("infers type for <angle>", () => {
			const parsed = parseSyntaxSync("<angle>");
			const result = inferType(parsed);
			expect(result.tsType).toBe("Angle");
		});

		it("infers type for <color>", () => {
			const parsed = parseSyntaxSync("<color>");
			const result = inferType(parsed);
			expect(result.tsType).toBe("Color");
		});

		it("infers union type for OR combinator", () => {
			const parsed = parseSyntaxSync("<length> | <percentage>");
			const result = inferType(parsed);
			expect(result.tsType).toContain("|");
			expect(result.tsType).toContain("Length");
			expect(result.tsType).toContain("Percentage");
		});

		it("marks optional types", () => {
			const parsed = parseSyntaxSync("<length>?");
			const result = inferType(parsed);
			expect(result.isOptional).toBe(true);
		});
	});

	describe("inferParams", () => {
		it("extracts single parameter", () => {
			const parsed = parseSyntaxSync("<length>");
			const params = inferParams(parsed);
			expect(params.length).toBeGreaterThanOrEqual(1);
		});

		it("extracts multiple parameters from juxtaposition", () => {
			const parsed = parseSyntaxSync("<length> <color>");
			const params = inferParams(parsed);
			expect(params.length).toBeGreaterThanOrEqual(2);
		});
	});
});
