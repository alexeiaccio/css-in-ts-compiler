import { describe, it, expect } from "vitest";
import { parseValue } from "../parser/index.js";

describe("CSS Value Parser", () => {
  it("should parse keywords", () => {
    const result = parseValue("auto");
    expect(result).toMatchObject({ type: "keyword", value: "auto" });
  });

  it("should parse inherit", () => {
    const result = parseValue("inherit");
    expect(result).toMatchObject({ type: "keyword", value: "inherit" });
  });

  it("should parse numbers", () => {
    const result = parseValue("42");
    expect(result).toMatchObject({ type: "number", value: "42", number: 42 });
  });

  it("should parse dimensions", () => {
    const result = parseValue("10px");
    expect(result).toMatchObject({ type: "dimension", value: "10px", number: 10, unit: "px" });
  });

  it("should parse negative dimensions", () => {
    const result = parseValue("-20px");
    expect(result).toMatchObject({ type: "dimension", number: -20, unit: "px" });
  });

  it("should parse em dimensions", () => {
    const result = parseValue("1.5em");
    expect(result).toMatchObject({ type: "dimension", number: 1.5, unit: "em" });
  });

  it("should parse percentages", () => {
    const result = parseValue("50%");
    expect(result).toMatchObject({ type: "percentage", value: "50%", number: 50 });
  });

  it("should parse strings", () => {
    const result = parseValue('"hello"');
    expect(result).toMatchObject({ type: "string", value: "hello" });
  });

  it("should parse rgb function", () => {
    const result = parseValue("rgb(255, 0, 0)");
    expect(result).toMatchObject({
      type: "function",
      name: "rgb",
      args: expect.any(Array),
    });
  });

  it("should parse calc function", () => {
    const result = parseValue("calc(100% - 20px)");
    expect(result).toMatchObject({ type: "function", name: "calc" });
  });

  it("should parse var function", () => {
    const result = parseValue("var(--color)");
    expect(result).toMatchObject({ type: "function", name: "var" });
  });

  it("should parse multiple values", () => {
    const result = parseValue("10px solid red");
    expect(result).toMatchObject({ type: "dimension" });
  });

  it("should parse border shorthand", () => {
    const result = parseValue("1px solid #fff");
    expect(result.type).toBe("dimension");
  });

  it("should parse color values", () => {
    const result = parseValue("#fff");
    expect(result.type).toBe("keyword");
  });

  it("should parse ident values", () => {
    const result = parseValue("myValue");
    expect(result).toMatchObject({ type: "ident", value: "myValue" });
  });
});
