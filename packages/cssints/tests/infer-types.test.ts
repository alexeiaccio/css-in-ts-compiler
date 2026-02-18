import { describe, it, expect } from "vitest";
import { inferType, inferParams } from "../scripts/infer-types";
import { parseSyntax } from "../scripts/parse-value-syntax";

describe("infer-types", () => {
	describe("inferType", () => {
		it("infers type for <length>", () => {
			const parsed = parseSyntax("<length>");
			const result = inferType(parsed);
			expect(result.tsType).toBe("Length");
		});

		it("infers type for <angle>", () => {
			const parsed = parseSyntax("<angle>");
			const result = inferType(parsed);
			expect(result.tsType).toBe("Angle");
		});

		it("infers type for <color>", () => {
			const parsed = parseSyntax("<color>");
			const result = inferType(parsed);
			expect(result.tsType).toBe("Color");
		});

		it("infers union type for OR combinator", () => {
			const parsed = parseSyntax("<length> | <percentage>");
			const result = inferType(parsed);
			expect(result.tsType).toContain("|");
			expect(result.tsType).toContain("Length");
			expect(result.tsType).toContain("Percentage");
		});

		it("marks optional types", () => {
			const parsed = parseSyntax("<length>?");
			const result = inferType(parsed);
			expect(result.isOptional).toBe(true);
		});
	});

	describe("inferParams", () => {
		it("extracts single parameter", () => {
			const parsed = parseSyntax("<length>");
			const params = inferParams(parsed);
			expect(params.length).toBeGreaterThanOrEqual(1);
		});

		it("extracts multiple parameters from juxtaposition", () => {
			const parsed = parseSyntax("<length> <color>");
			const params = inferParams(parsed);
			expect(params.length).toBeGreaterThanOrEqual(2);
		});
	});
});
