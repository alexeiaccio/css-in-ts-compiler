import { describe, it, expect } from "vitest";
import { parseStylesheet } from "../parser/stylesheet-parser.js";
import type { CSSStyleSheet, CSSRule } from "../parser/stylesheet-ast.js";

describe("Stylesheet Parser", () => {
  it("should parse simple style rule", () => {
    const result = parseStylesheet(".foo { color: red; }") as CSSStyleSheet;
    expect(result.type).toBe("stylesheet");
    expect(result.children).toHaveLength(1);
    expect(result.children[0]!.type).toBe("style");
    expect((result.children[0] as any).selector).toBe(".foo");
    expect((result.children[0] as any).declarations).toHaveLength(1);
    expect((result.children[0] as any).declarations[0]!.property).toBe("color");
    expect((result.children[0] as any).declarations[0]!.value).toBe("red");
  });

  it("should parse multiple declarations", () => {
    const result = parseStylesheet(".foo { color: red; font-size: 14px; }") as CSSStyleSheet;
    expect(result.children).toHaveLength(1);
    const rule = result.children[0] as any;
    expect(rule.declarations).toHaveLength(2);
  });

  it("should parse multiple style rules", () => {
    const result = parseStylesheet(".foo { color: red; } .bar { color: blue; }") as CSSStyleSheet;
    expect(result.children).toHaveLength(2);
  });

  it("should parse @media rule", () => {
    const result = parseStylesheet("@media (min-width: 768px) { .foo { color: red; } }") as CSSStyleSheet;
    expect(result.children).toHaveLength(1);
    expect(result.children[0]!.type).toBe("media");
    expect((result.children[0] as any).media).toBe("(min-width: 768px)");
    expect((result.children[0] as any).children).toHaveLength(1);
  });

  it("should parse @import rule", () => {
    const result = parseStylesheet('@import "styles.css";') as CSSStyleSheet;
    expect(result.children).toHaveLength(1);
    expect(result.children[0]!.type).toBe("import");
    expect((result.children[0] as any).url).toBe("styles.css");
  });

  it("should parse @import rule with media", () => {
    const result = parseStylesheet('@import "styles.css" screen;') as CSSStyleSheet;
    expect(result.children).toHaveLength(1);
    expect(result.children[0]!.type).toBe("import");
    expect((result.children[0] as any).url).toBe("styles.css");
    expect((result.children[0] as any).media).toBe("screen");
  });

  it("should parse @keyframes rule", () => {
    const result = parseStylesheet("@keyframes fade { from { opacity: 0; } to { opacity: 1; } }") as CSSStyleSheet;
    expect(result.children).toHaveLength(1);
    expect(result.children[0]!.type).toBe("keyframes");
    expect((result.children[0] as any).name).toBe("fade");
    expect((result.children[0] as any).children).toHaveLength(2);
  });

  it("should parse @layer rule", () => {
    const result = parseStylesheet("@layer utilities { .foo { color: red; } }") as CSSStyleSheet;
    expect(result.children).toHaveLength(1);
    expect(result.children[0]!.type).toBe("layer");
    expect((result.children[0] as any).name).toBe("utilities");
  });

  it("should parse @supports rule", () => {
    const result = parseStylesheet("@supports (display: grid) { .foo { display: grid; } }") as CSSStyleSheet;
    expect(result.children).toHaveLength(1);
    expect(result.children[0]!.type).toBe("supports");
    expect((result.children[0] as any).condition).toBe("(display: grid)");
  });

  it("should parse @container rule", () => {
    const result = parseStylesheet("@container (min-width: 768px) { .foo { color: red; } }") as CSSStyleSheet;
    expect(result.children).toHaveLength(1);
    expect(result.children[0]!.type).toBe("container");
    expect((result.children[0] as any).prelude).toBe("(min-width: 768px)");
  });

  it("should parse nested rules", () => {
    const result = parseStylesheet(".foo { .bar { color: red; } }") as CSSStyleSheet;
    expect(result.children).toHaveLength(1);
  });

  it("should parse important declarations", () => {
    const result = parseStylesheet(".foo { color: red !important; }") as CSSStyleSheet;
    const rule = result.children[0] as any;
    expect(rule.declarations[0]!.important).toBe(true);
  });

  it("should parse complex selectors", () => {
    const result = parseStylesheet(".container > .item[data-foo]:hover { color: red; }") as CSSStyleSheet;
    expect(result.children).toHaveLength(1);
    const rule = result.children[0] as any;
    expect(rule.selector).toBe(".container > .item[data-foo]:hover");
  });

  it("should handle empty stylesheet", () => {
    const result = parseStylesheet("") as CSSStyleSheet;
    expect(result.type).toBe("stylesheet");
    expect(result.children).toHaveLength(0);
  });
});
