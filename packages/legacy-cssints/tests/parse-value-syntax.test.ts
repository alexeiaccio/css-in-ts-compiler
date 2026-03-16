import syntaxesJson from "mdn-data/css/syntaxes.json" with { type: "json" };
import { describe, it, expect } from "vitest";

import {
	parseSyntaxSync,
	isTypeNode,
	isKeywordNode,
	isOrNode,
	isRepeatNode,
	syntaxToSchema,
} from "../src/core/value-syntax";

describe("parse-value-syntax", () => {
	describe("basic types", () => {
		it("parses <length>", () => {
			const result = parseSyntaxSync("<length>");
			expect(isTypeNode(result)).toBe(true);
			if (isTypeNode(result)) {
				expect(result.name).toBe("length");
			}
		});

		it("parses <color>", () => {
			const result = parseSyntaxSync("<color>");
			expect(isTypeNode(result)).toBe(true);
			if (isTypeNode(result)) {
				expect(result.name).toBe("color");
			}
		});

		it("parses <angle>", () => {
			const result = parseSyntaxSync("<angle>");
			expect(isTypeNode(result)).toBe(true);
			if (isTypeNode(result)) {
				expect(result.name).toBe("angle");
			}
		});
	});

	describe("keywords", () => {
		it("parses bare keywords", () => {
			const result = parseSyntaxSync("auto");
			expect(isKeywordNode(result)).toBe(true);
			if (isKeywordNode(result)) {
				expect(result.value).toBe("auto");
			}
		});

		it("parses quoted keywords", () => {
			const result = parseSyntaxSync("'none'");
			expect(isKeywordNode(result)).toBe(true);
			if (isKeywordNode(result)) {
				expect(result.value).toBe("none");
			}
		});

		it("parses numeric keywords", () => {
			const result = parseSyntaxSync("100%");
			expect(isKeywordNode(result)).toBe(true);
		});
	});

	describe("combinators", () => {
		it("parses OR combinator", () => {
			const result = parseSyntaxSync("<length> | <percentage>");
			expect(isOrNode(result)).toBe(true);
		});

		it("parses multiple OR options", () => {
			const result = parseSyntaxSync("<length> | <percentage> | auto");
			expect(isOrNode(result)).toBe(true);
		});

		it("parses AND combinator", () => {
			const result = parseSyntaxSync("<length> && <percentage>");
			expect(result._tag).toBe("And");
		});
	});

	describe("multipliers", () => {
		it("parses optional (?)", () => {
			const result = parseSyntaxSync("<length>?");
			expect(result._tag).toBe("Optional");
		});

		it("parses one or more (+)", () => {
			const result = parseSyntaxSync("<length>+");
			expect(isRepeatNode(result)).toBe(true);
		});

		it("parses zero or more (*)", () => {
			const result = parseSyntaxSync("<length>*");
			expect(isRepeatNode(result)).toBe(true);
		});

		it("parses exact count {n}", () => {
			const result = parseSyntaxSync("<length>{2}");
			expect(isRepeatNode(result)).toBe(true);
		});

		it("parses range {n,m}", () => {
			const result = parseSyntaxSync("<length>{2,4}");
			expect(isRepeatNode(result)).toBe(true);
		});

		it("parses range with infinity {n,∞}", () => {
			const result = parseSyntaxSync("<length>{1,∞}");
			expect(isRepeatNode(result)).toBe(true);
			if (result._tag === "Repeat") {
				expect(result.min).toBe(1);
				expect(result.max).toBe(null);
			}
		});

		it("parses type with range notation", () => {
			const result = parseSyntaxSync("<number [0,∞]>");
			expect(result._tag).toBe("Type");
			if (result._tag === "Type") {
				expect(result.name).toBe("number [0,∞]");
			}
		});
	});

	describe("groups", () => {
		it("parses group with brackets", () => {
			const result = parseSyntaxSync("[ <length> | auto ]");
			expect(result._tag).toBe("Group");
		});

		it("parses optional group", () => {
			const result = parseSyntaxSync("[ <length> | auto ]?");
			expect(result._tag).toBe("Optional");
		});

		it("parses required group", () => {
			const result = parseSyntaxSync("[ <length> | auto ]!");
			expect(result._tag).toBe("Required");
		});
	});

	describe("functions", () => {
		it("parses function with type args", () => {
			const result = parseSyntaxSync("rgb(<percentage> , <percentage> , <percentage>)");
			expect(result._tag).toBe("Function");
			if (result._tag === "Function") {
				expect(result.name).toBe("rgb");
				expect(result.args._tag).toBe("Juxtaposition");
			}
		});

		it("parses function with single arg", () => {
			const result = parseSyntaxSync("calc(<length>)");
			expect(result._tag).toBe("Function");
			if (result._tag === "Function") {
				expect(result.name).toBe("calc");
			}
		});

		it("parses function with numeric keyword", () => {
			const result = parseSyntaxSync("calc(100% - <length>)");
			expect(result._tag).toBe("Function");
		});

		it("parses function with OR in args", () => {
			const result = parseSyntaxSync("rgba(<number> , <number> , <number> , <alpha-value>)");
			expect(result._tag).toBe("Function");
		});
	});

	describe("juxtaposition", () => {
		it("parses space-separated values", () => {
			const result = parseSyntaxSync("<length> <percentage>");
			expect(result._tag).toBe("Juxtaposition");
		});

		it("parses multiple space-separated values", () => {
			const result = parseSyntaxSync("<length> <percentage> <color>");
			expect(result._tag).toBe("Juxtaposition");
			if (result._tag === "Juxtaposition") {
				expect(result.items).toHaveLength(3);
			}
		});
	});

	describe("complex syntaxes", () => {
		it("parses font shorthand", () => {
			const result = parseSyntaxSync(
				"<font-style> || <font-variant-css21> || <font-weight> || <font-stretch> ? <font-size> [ / <line-height> ]? <font-family>",
			);
			expect(result._tag).toBe("Or");
		});

		it("parses border shorthand", () => {
			const result = parseSyntaxSync("<line-width> || <line-style> || <color>");
			expect(result._tag).toBe("Or");
		});

		it("parses box-shadow", () => {
			const result = parseSyntaxSync("<shadow-t>#");
			expect(result._tag).toBe("Repeat");
			if (result._tag === "Repeat") {
				expect(result.min).toBe(1);
			}
		});
	});

	describe("real CSS syntaxes from mdn-data", () => {
		it("parses absolute-size", () => {
			const result = parseSyntaxSync("xx-small | x-small | small | medium | large | x-large | xx-large | xxx-large");
			expect(result._tag).toBe("Or");
		});

		it("parses alpha-value", () => {
			const result = parseSyntaxSync("<number> | <percentage>");
			expect(result._tag).toBe("Or");
		});

		it("parses angle-percentage", () => {
			const result = parseSyntaxSync("<angle> | <percentage>");
			expect(result._tag).toBe("Or");
		});

		it("parses anchor-size", () => {
			const result = parseSyntaxSync("width | height | block | inline | self-block | self-inline");
			expect(result._tag).toBe("Or");
		});

		it("parses attachment", () => {
			const result = parseSyntaxSync("scroll | fixed | local");
			expect(result._tag).toBe("Or");
		});

		it("parses axis", () => {
			const result = parseSyntaxSync("block | inline | x | y");
			expect(result._tag).toBe("Or");
		});

		it("parses baseline-position", () => {
			const result = parseSyntaxSync("[ first | last ]? baseline");
			expect(result._tag).toBe("Or");
		});

		it("parses bg-image", () => {
			const result = parseSyntaxSync("<image> | none");
			expect(result._tag).toBe("Or");
		});

		it("parses calc function", () => {
			const result = parseSyntaxSync("abs( <calc-sum> )");
			expect(result._tag).toBe("Function");
		});

		it("parses acos function", () => {
			const result = parseSyntaxSync("acos( <calc-sum> )");
			expect(result._tag).toBe("Function");
		});

		it("parses atan2 function", () => {
			const result = parseSyntaxSync("atan2( <calc-sum>, <calc-sum> )");
			expect(result._tag).toBe("Function");
		});

		it("parses attr function", () => {
			const result = parseSyntaxSync("attr( <attr-name> <attr-type>? , <declaration-value>? )");
			expect(result._tag).toBe("Optional");
		});

		it("parses anchor function", () => {
			const result = parseSyntaxSync("anchor( <anchor-name>? && <anchor-side>, <length-percentage>? )");
			expect(result._tag).toBe("Optional");
		});

		it("parses anchor-size function", () => {
			const result = parseSyntaxSync("anchor-size( [ <anchor-name> || <anchor-size> ]? , <length-percentage>? )");
			expect(result._tag).toBe("Or");
		});

		it("parses angular-color-stop-list", () => {
			const result = parseSyntaxSync("<angular-color-stop> , [ <angular-color-hint>? , <angular-color-stop> ]#?");
			expect(result._tag).toBe("Juxtaposition");
		});

		it("parses bg-layer with ||", () => {
			const result = parseSyntaxSync(
				"<bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || <attachment> || <visual-box> || <visual-box>",
			);
			expect(result._tag).toBe("Or");
		});

		it("parses basic-shape", () => {
			const result = parseSyntaxSync(
				"<inset()> | <xywh()> | <rect()> | <circle()> | <ellipse()> | <polygon()> | <path()>",
			);
			expect(result._tag).toBe("Or");
		});
	});

	describe("errors", () => {
		it("throws on unclosed type reference", () => {
			expect(() => parseSyntaxSync("<length")).toThrow();
		});

		it("throws on unclosed multiplier", () => {
			expect(() => parseSyntaxSync("{2")).toThrow();
		});

		it("throws on unexpected character", () => {
			expect(() => parseSyntaxSync("`")).toThrow();
		});
	});

	describe("all mdn-data syntaxes", () => {
		it("parses all syntaxes from mdn-data", () => {
			const entries = Object.entries(syntaxesJson);
			let parsed = 0;
			let failed: string[] = [];

			for (const [name, data] of entries) {
				const syntax = (data as { syntax: string }).syntax;
				try {
					const result = parseSyntaxSync(syntax);
					const schema = syntaxToSchema(result);
					parsed++;
				} catch (e) {
					failed.push(`${name}: ${syntax} - ${e}`);
				}
			}

			expect(failed).toHaveLength(0);
			expect(parsed).toBeGreaterThan(100);
		});
	});

	describe("schema validation", () => {
		it("validates <number> schema", () => {
			const result = parseSyntaxSync("<number>");
			const schema = syntaxToSchema(result);
			const { Schema, Effect } = require("effect");

			const decoded = Effect.runPromise(Schema.decode(schema)(42));
			expect(decoded).toBe(42);
		});

		it("validates <length> schema", () => {
			const result = parseSyntaxSync("<length>");
			const schema = syntaxToSchema(result);
			const { Schema, Effect } = require("effect");

			const decoded = Effect.runPromise(Schema.decode(schema)(100));
			expect(decoded).toBe(100);
		});

		it("validates <string> schema", () => {
			const result = parseSyntaxSync("<string>");
			const schema = syntaxToSchema(result);
			const { Schema, Effect } = require("effect");

			const decoded = Effect.runPromise(Schema.decode(schema)("hello"));
			expect(decoded).toBe("hello");
		});

		it("validates <color> schema", () => {
			const result = parseSyntaxSync("<color>");
			const schema = syntaxToSchema(result);
			const { Schema, Effect } = require("effect");

			const decoded = Effect.runPromise(Schema.decode(schema)("red"));
			expect(decoded).toBe("red");
		});

		it("validates OR schema", () => {
			const result = parseSyntaxSync("auto | none");
			const schema = syntaxToSchema(result);
			const { Schema, Effect } = require("effect");

			const decoded1 = Effect.runPromise(Schema.decode(schema)("auto"));
			expect(decoded1).toBe("auto");

			const decoded2 = Effect.runPromise(Schema.decode(schema)("none"));
			expect(decoded2).toBe("none");
		});

		it("validates Optional schema", () => {
			const result = parseSyntaxSync("<length>?");
			const schema = syntaxToSchema(result);
			const { Schema, Effect } = require("effect");

			const decoded1 = Effect.runPromise(Schema.decode(schema)(100));
			expect(decoded1).toBe(100);

			const decoded2 = Effect.runPromise(Schema.decode(schema)(undefined));
			expect(decoded2).toBe(undefined);
		});

		it("validates Repeat schema", () => {
			const result = parseSyntaxSync("<length>#");
			const schema = syntaxToSchema(result);
			const { Schema, Effect } = require("effect");

			const decoded = Effect.runPromise(Schema.decode(schema)([100, 200, 300]));
			expect(decoded).toEqual([100, 200, 300]);
		});

		it("validates Juxtaposition/Tuple schema", () => {
			const result = parseSyntaxSync("<length> <percentage>");
			const schema = syntaxToSchema(result);
			const { Schema, Effect } = require("effect");

			const decoded = Effect.runPromise(Schema.decode(schema)([100, 50]));
			expect(decoded).toEqual([100, 50]);
		});

		it("validates keywords", () => {
			const result = parseSyntaxSync("auto");
			const schema = syntaxToSchema(result);
			const { Schema, Effect } = require("effect");

			const decoded = Effect.runPromise(Schema.decode(schema)("auto"));
			expect(decoded).toBe("auto");
		});

		it("validates numeric keywords", () => {
			const result = parseSyntaxSync("100");
			const schema = syntaxToSchema(result);
			const { Schema, Effect } = require("effect");

			const decoded = Effect.runPromise(Schema.decode(schema)(100));
			expect(decoded).toBe(100);
		});
	});
});
