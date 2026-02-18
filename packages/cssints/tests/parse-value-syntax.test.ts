import { describe, it, expect } from "vitest";
import { parseSyntax, isTypeNode, isKeywordNode, isOrNode } from "../scripts/parse-value-syntax";

describe("parse-value-syntax", () => {
	describe("basic types", () => {
		it("parses <length>", () => {
			const result = parseSyntax("<length>");
			expect(isTypeNode(result)).toBe(true);
			if (isTypeNode(result)) {
				expect(result.name).toBe("length");
			}
		});

		it("parses <color>", () => {
			const result = parseSyntax("<color>");
			expect(isTypeNode(result)).toBe(true);
			if (isTypeNode(result)) {
				expect(result.name).toBe("color");
			}
		});

		it("parses <angle>", () => {
			const result = parseSyntax("<angle>");
			expect(isTypeNode(result)).toBe(true);
			if (isTypeNode(result)) {
				expect(result.name).toBe("angle");
			}
		});
	});

	describe("keywords", () => {
		it("parses bare keywords", () => {
			const result = parseSyntax("auto");
			expect(isKeywordNode(result)).toBe(true);
			if (isKeywordNode(result)) {
				expect(result.value).toBe("auto");
			}
		});

		it("parses quoted keywords", () => {
			const result = parseSyntax("'none'");
			expect(isKeywordNode(result)).toBe(true);
			if (isKeywordNode(result)) {
				expect(result.value).toBe("none");
			}
		});
	});

	describe("combinators", () => {
		it("parses OR combinator", () => {
			const result = parseSyntax("<length> | <percentage>");
			expect(isOrNode(result)).toBe(true);
		});

		it("parses multiple OR options", () => {
			const result = parseSyntax("<length> | <percentage> | auto");
			expect(isOrNode(result)).toBe(true);
		});
	});

	describe("multipliers", () => {
		it("parses optional (?)", () => {
			const result = parseSyntax("<length>?");
			expect(result.type).toBe("optional");
		});

		it("parses one or more (+)", () => {
			const result = parseSyntax("<length>+");
			expect(result.type).toBe("repeat");
		});

		it("parses zero or more (*)", () => {
			const result = parseSyntax("<length>*");
			expect(result.type).toBe("repeat");
		});
	});
});
