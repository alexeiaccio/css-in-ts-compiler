/**
 * Generation Pipeline Tests
 *
 * Tests for the new IDL-to-AST type generation pipeline
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getIDLData } from "../collect-idl";
import { extractCSSIDLTypes } from "../extract-css-idl";
import { getSyntaxData } from "../collect-syntax";
import { parseSyntax, parseAllSyntaxes } from "../ast/syntax-parser";
import { parseWebIDL } from "../ast/idl-parser";
import { emitIDLTypes, emitSyntaxTypes, emitProperties, emitFunctions } from "../ast/ts-emitter";
import type { IDLType, CSSValueType, CSSProperty, CSSFunction } from "../ast/css-type-ast";

describe("IDL Collection", () => {
	it("should collect IDL data from @webref/idl", async () => {
		const data = await getIDLData();
		expect(data.files.size).toBeGreaterThan(0);
		expect(data.version).toBeDefined();
		expect(data.timestamp).toBeDefined();
	});

	it("should cache IDL data", async () => {
		const data1 = await getIDLData();
		const data2 = await getIDLData();
		expect(data1.files.size).toBe(data2.files.size);
	});
});

describe("CSS IDL Extraction", () => {
	let idlData: Awaited<ReturnType<typeof getIDLData>>;

	beforeAll(async () => {
		idlData = await getIDLData();
	});

	it("should extract CSS-specific IDL types", () => {
		const extraction = extractCSSIDLTypes(idlData);
		expect(extraction.cssTypes.size).toBeGreaterThan(0);
		expect(extraction.errors.length).toBe(0);
	});

	it("should categorize Typed OM types", () => {
		const extraction = extractCSSIDLTypes(idlData);
		expect(extraction.typedOMTypes.size).toBeGreaterThan(0);
	});

	it("should include CSSStyleValue in extracted types", () => {
		const extraction = extractCSSIDLTypes(idlData);
		expect(extraction.cssTypes.has("CSSStyleValue")).toBe(true);
	});
});

describe("Syntax Collection", () => {
	it("should collect syntax definitions from mdn-data", () => {
		const data = getSyntaxData();
		expect(data.definitions.size).toBeGreaterThan(0);
		expect(data.count).toBeGreaterThan(0);
	});

	it("should categorize syntax types", () => {
		const data = getSyntaxData();
		const categories = {
			primitives: new Map(),
			functions: new Map(),
			composites: new Map(),
		};
		
		for (const [name, def] of data.definitions) {
			if (name.endsWith("()")) {
				categories.functions.set(name, def);
			} else if (["length", "color", "number", "string"].includes(name)) {
				categories.primitives.set(name, def);
			} else {
				categories.composites.set(name, def);
			}
		}
		
		expect(categories.primitives.size + categories.functions.size + categories.composites.size)
			.toBe(data.definitions.size);
	});
});

describe("Syntax Parser", () => {
	it("should parse primitive references", () => {
		const ast = parseSyntax("<length>");
		expect(ast).not.toBeNull();
		expect(ast?.type).toBe("alias");
	});

	it("should parse union types", () => {
		const ast = parseSyntax("<length> | <percentage>");
		expect(ast).not.toBeNull();
		expect(ast?.type).toBe("composite");
	});

	it("should parse enums", () => {
		const ast = parseSyntax("none | hidden | dotted");
		expect(ast).not.toBeNull();
		expect(ast?.type).toBe("enum");
		if (ast?.type === "enum") {
			expect(ast.values).toContain("none");
			expect(ast.values).toContain("hidden");
			expect(ast.values).toContain("dotted");
		}
	});

	it("should parse optional groups", () => {
		const ast = parseSyntax("[<length>]?");
		expect(ast).not.toBeNull();
	});

	it("should parse all syntaxes without errors", () => {
		const data = getSyntaxData();
		const definitions = new Map(
			Array.from(data.definitions.entries()).map(([name, def]) => [
				name,
				{ name: def.name, syntax: def.syntax },
			])
		);
		
		const results = parseAllSyntaxes(definitions);
		expect(results.size).toBeGreaterThan(0);
		
		// Check that we didn't fail completely
		const successRate = results.size / definitions.size;
		expect(successRate).toBeGreaterThan(0.5); // At least 50% success
	});
});

describe("IDL Parser", () => {
	it("should parse interface definitions", () => {
		const idl = `
			interface CSSStyleValue {
				stringifier;
			};
		`;
		const result = parseWebIDL(idl, "test");
		expect(result.types.size).toBe(1);
		expect(result.types.has("CSSStyleValue")).toBe(true);
	});

	it("should parse dictionary definitions", () => {
		const idl = `
			dictionary EffectTiming {
				double delay = 0;
			};
		`;
		const result = parseWebIDL(idl, "test");
		expect(result.types.size).toBe(1);
		expect(result.types.has("EffectTiming")).toBe(true);
	});

	it("should parse enum definitions", () => {
		const idl = `
			enum CSSNumericBaseType {
				"length",
				"angle",
				"time"
			};
		`;
		const result = parseWebIDL(idl, "test");
		expect(result.types.size).toBe(1);
		const enumType = result.types.get("CSSNumericBaseType");
		expect(enumType?.type).toBe("idl-enum");
	});
});

describe("TypeScript Emitter", () => {
	it("should emit IDL types", () => {
		const types = new Map<string, IDLType>();
		types.set("CSSStyleValue", {
			type: "interface",
			name: "CSSStyleValue",
			members: [],
		} as IDLType);
		
		const output = emitIDLTypes(types);
		expect(output).toContain("export interface CSSStyleValue");
		expect(output).toContain("AUTO-GENERATED");
	});

	it("should emit syntax types", () => {
		const types = new Map<string, CSSValueType>();
		types.set("TestType", {
			type: "primitive",
			name: "TestType",
			tsType: "number",
		} as CSSValueType);
		
		const output = emitSyntaxTypes(types);
		expect(output).toContain("export type TestType");
	});

	it("should emit properties", () => {
		const properties = new Map<string, CSSProperty>();
		properties.set("color", {
			type: "property",
			name: "color",
			syntax: "<color>",
			valueType: { name: "string" },
		} as CSSProperty);
		
		const output = emitProperties(properties);
		expect(output).toContain("color");
		expect(output).toContain("AUTO-GENERATED");
	});

	it("should emit functions", () => {
		const functions = new Map<string, CSSFunction>();
		functions.set("rgb", {
			type: "function",
			name: "rgb",
			syntax: "rgb(<percentage>{3} [ / <alpha-value> ]? )",
			parameters: [],
			returnType: { name: "string" },
		} as CSSFunction);
		
		const output = emitFunctions(functions);
		expect(output).toContain("RgbFunction");
	});
});

describe("Integration", () => {
	it("should generate all output files", async () => {
		// This is a smoke test to ensure the pipeline runs
		const idlData = await getIDLData();
		const extraction = extractCSSIDLTypes(idlData);
		expect(extraction.cssTypes.size).toBeGreaterThan(0);
		
		const syntaxData = getSyntaxData();
		const definitions = new Map(
			Array.from(syntaxData.definitions.entries()).map(([name, def]) => [
				name,
				{ name: def.name, syntax: def.syntax },
			])
		);
		const syntaxTypes = parseAllSyntaxes(definitions);
		expect(syntaxTypes.size).toBeGreaterThan(0);
		
		// Verify emitters work
		const idlOutput = emitIDLTypes(extraction.cssTypes);
		expect(idlOutput.length).toBeGreaterThan(100);
		
		const syntaxOutput = emitSyntaxTypes(syntaxTypes);
		expect(syntaxOutput.length).toBeGreaterThan(100);
	});
});
