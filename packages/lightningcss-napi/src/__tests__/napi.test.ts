import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const binaryName = `lightningcss-napi.${process.platform}-${process.arch}.node`;
const native = require(join(__dirname, "..", "..", binaryName));

describe("parse", () => {
	it("parses a simple stylesheet", () => {
		const ast = native.parse(".foo { color: red; }");
		expect(ast.rules).toHaveLength(1);
		expect(ast.rules[0].type).toBe("style");
		expect(ast.rules[0].value.selectors[0][0]).toEqual({ type: "class", name: "foo" });
	});

	it("parses multiple rules", () => {
		const ast = native.parse(".a { color: red; } .b { display: flex; }");
		expect(ast.rules).toHaveLength(2);
	});

	it("parses @media rules", () => {
		const ast = native.parse("@media (min-width: 768px) { .foo { color: red; } }");
		expect(ast.rules[0].type).toBe("media");
	});

	it("parses @property rules", () => {
		const ast = native.parse('@property --x { syntax: "<length>"; inherits: false; initial-value: 0px; }');
		expect(ast.rules[0].type).toBe("property");
		expect(ast.rules[0].value.name).toBe("--x");
	});

	it("throws on invalid CSS", () => {
		expect(() => native.parse("{ color: } .bad {")).toThrow();
	});
});

describe("toCss", () => {
	it("round-trips a stylesheet", () => {
		const ast = native.parse(".foo { color: red; padding: 16px; }");
		const css = native.toCss(ast);
		expect(css).toContain(".foo");
		expect(css).toContain("color: red");
		expect(css).toContain("padding: 16px");
	});

	it("minifies output", () => {
		const ast = native.parse(".foo { color: red; padding: 16px; }");
		const css = native.toCss(ast, { minify: true });
		expect(css).toBe(".foo{color:red;padding:16px}");
	});

	it("handles @media rules", () => {
		const ast = native.parse("@media (min-width: 768px) { .foo { color: red; } }");
		const css = native.toCss(ast);
		expect(css).toContain("@media");
		expect(css).toContain("768px");
	});
});

describe("toCssLength", () => {
	it("serializes px", () => {
		expect(native.toCssLength({ type: "value", value: { unit: "px", value: 16 } })).toBe("16px");
	});

	it("serializes rem", () => {
		expect(native.toCssLength({ type: "value", value: { unit: "rem", value: 2 } })).toBe("2rem");
	});

	it("serializes em", () => {
		expect(native.toCssLength({ type: "value", value: { unit: "em", value: 1.5 } })).toBe("1.5em");
	});
});

describe("toCssColor", () => {
	it("serializes rgb", () => {
		const css = native.toCssColor({ type: "rgb", r: 255, g: 0, b: 0, alpha: 1 });
		expect(css).toBeTruthy();
		expect(css.length).toBeGreaterThan(0);
	});

	it("serializes rgb with alpha", () => {
		const css = native.toCssColor({ type: "rgb", r: 255, g: 0, b: 0, alpha: 0.5 });
		expect(css).toBeTruthy();
		expect(css.length).toBeGreaterThan(0);
	});
});

describe("toCssLengthPercentage", () => {
	it("serializes dimension", () => {
		expect(native.toCssLengthPercentage({ type: "dimension", value: { unit: "em", value: 1.5 } })).toBe("1.5em");
	});

	it("serializes percentage", () => {
		const css = native.toCssLengthPercentage({ type: "percentage", value: 0.5 });
		expect(css).toBe("50%");
	});
});

describe("toCssString (auto-detect)", () => {
	it("detects and serializes Length", () => {
		const css = native.toCssString({ type: "value", value: { unit: "vw", value: 100 } });
		expect(css).toBe("100vw");
	});

	it("detects and serializes CssColor", () => {
		const css = native.toCssString({ type: "rgb", r: 0, g: 0, b: 255, alpha: 1 });
		expect(css).toBeTruthy();
		expect(css.length).toBeGreaterThan(0);
	});

	it("detects and serializes StyleSheet", () => {
		const ast = native.parse(".x { color: green; }");
		const css = native.toCssString(ast, { minify: true });
		expect(css).toBe(".x{color:green}");
	});
});
