import type {
  CSSStyleSheet,
  CSSRule,
  CSSStyleRule,
  CSSAtRule,
  CSSDeclaration,
  CSSMediaRule,
  CSSSupportsRule,
  CSSKeyframesRule,
  CSSKeyframeRule,
  CSSImportRule,
  CSSLayerRule,
  CSSNestedStyleRule,
  CSSContainerRule,
} from "./stylesheet-ast-effect.js";

export class StylesheetParser {
  private source: string;
  private pos = 0;

  constructor(source: string) {
    this.source = source;
  }

  parse(): CSSStyleSheet {
    const children: CSSRule[] = [];

    while (this.pos < this.source.length) {
      this.skipWhitespace();
      if (this.pos >= this.source.length) break;

      const rule = this.parseRule();
      if (rule) {
        children.push(rule);
      }
    }

    return {
      type: "stylesheet",
      children,
    };
  }

  private parseRule(): CSSRule | null {
    this.skipWhitespace();

    if (this.pos >= this.source.length) return null;

    const code = this.source.charCodeAt(this.pos);

    if (code === 64) {
      return this.parseAtRule();
    }

    if (this.isSelectorStart(code)) {
      return this.parseStyleRule();
    }

    this.pos++;
    return null;
  }

  private isSelectorStart(code: number): boolean {
    return (
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122) ||
      code === 35 ||
      code === 46 ||
      code === 91 ||
      code === 58 ||
      code === 42 ||
      code === 124
    );
  }

  private parseAtRule(): CSSAtRule | CSSMediaRule | CSSSupportsRule | CSSKeyframesRule | CSSImportRule | CSSLayerRule | CSSContainerRule {
    this.consumeChar(64);
    const name = this.readName();

    this.skipWhitespace();

    if (name === "import") {
      return this.parseImportRule(name);
    }

    if (name === "media" || name === "supports" || name === "container") {
      return this.parseBlockAtRule(name);
    }

    if (name === "keyframes") {
      return this.parseKeyframesRule(name);
    }

    if (name === "layer") {
      return this.parseLayerRule(name);
    }

    const prelude = this.readUntil("{");

    if (this.consumeChar(123)) {
      this.skipUntil(125);
      this.consumeChar(125);
    } else {
      this.consumeChar(59);
    }

    return {
      type: "at-rule",
      name,
      prelude: prelude.trim() || undefined,
    };
  }

  private parseImportRule(_name: string): CSSImportRule {
    this.skipWhitespace();

    let url = "";
    const code = this.source.charCodeAt(this.pos);

    if (code === 34 || code === 39) {
      url = this.readString();
    } else if (code === 117 && this.source.slice(this.pos, this.pos + 4) === "url(") {
      this.pos += 4;
      this.skipWhitespace();
      url = this.readUntil(")");
      this.consumeChar(41);
    }

    this.skipWhitespace();

    const mediaTokens: string[] = [];
    while (this.pos < this.source.length) {
      const code = this.source.charCodeAt(this.pos);
      if (code === 59 || code === 123 || code === 125) break;
      const char = this.source[this.pos];
      if (char) mediaTokens.push(char);
      this.pos++;
    }

    this.consumeChar(59);

    return {
      type: "import",
      url,
      media: mediaTokens.join("").trim() || undefined,
    };
  }

  private parseBlockAtRule(name: string): CSSMediaRule | CSSSupportsRule | CSSContainerRule | CSSAtRule {
    const prelude = this.readUntil("{").trim();
    this.consumeChar(123);

    const children: CSSRule[] = [];

    while (this.pos < this.source.length && this.source.charCodeAt(this.pos) !== 125) {
      const rule = this.parseRule();
      if (rule) {
        children.push(rule);
      }
    }

    this.consumeChar(125);

    if (name === "media") {
      return {
        type: "media",
        media: prelude,
        children,
      };
    }

    if (name === "supports") {
      return {
        type: "supports",
        condition: prelude,
        children,
      };
    }

    if (name === "container") {
      return {
        type: "container",
        prelude,
        children,
      };
    }

    return {
      type: "at-rule",
      name,
    } as CSSAtRule;
  }

  private parseKeyframesRule(_name: string): CSSKeyframesRule {
    this.skipWhitespace();
    let nameValue = "";
    const code = this.source.charCodeAt(this.pos);
    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 45) {
      nameValue = this.readName();
    }

    this.skipWhitespace();
    this.consumeChar(123);

    const children: CSSKeyframeRule[] = [];

    while (this.pos < this.source.length && this.source.charCodeAt(this.pos) !== 125) {
      this.skipWhitespace();

      const selectors: string[] = [];

      while (this.pos < this.source.length) {
        const code = this.source.charCodeAt(this.pos);
        if (code === 37 || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
          selectors.push(this.readName());
        } else if (code === 44) {
          this.consumeChar(44);
          this.skipWhitespace();
        } else {
          break;
        }
      }

      if (selectors.length === 0) {
        this.skipUntil(123);
        this.consumeChar(123);
        this.skipUntil(125);
        this.consumeChar(125);
        continue;
      }

      this.skipWhitespace();
      this.consumeChar(123);

      const declarations: CSSDeclaration[] = [];
      while (this.pos < this.source.length && this.source.charCodeAt(this.pos) !== 125) {
        const decl = this.parseDeclaration();
        if (decl) {
          declarations.push(decl);
        }
      }

      this.consumeChar(125);

      if (selectors.length > 0 && declarations.length > 0) {
        children.push({
          type: "keyframe",
          selectors,
          declarations,
        });
      }
    }

    this.consumeChar(125);

    return {
      type: "keyframes",
      name: nameValue,
      children,
    };
  }

  private parseLayerRule(_name: string): CSSLayerRule {
    this.skipWhitespace();
    let layerName: string | undefined;

    const code = this.source.charCodeAt(this.pos);
    if (code >= 65 && code <= 90 || code >= 97 && code <= 122 || code === 45) {
      layerName = this.readName();
      this.skipWhitespace();
    }

    if (this.source.charCodeAt(this.pos) === 123) {
      this.consumeChar(123);
      const children: CSSRule[] = [];

      while (this.pos < this.source.length && this.source.charCodeAt(this.pos) !== 125) {
        const rule = this.parseRule();
        if (rule) {
          children.push(rule);
        }
      }

      this.consumeChar(125);

      return {
        type: "layer",
        name: layerName,
        children,
      };
    }

    this.consumeChar(59);

    return {
      type: "layer",
      name: layerName,
      children: [],
    };
  }

  private parseStyleRule(): CSSStyleRule {
    const selector = this.readUntil("{").trim();
    this.consumeChar(123);

    const declarations: CSSDeclaration[] = [];
    const nestedRules: CSSNestedStyleRule[] = [];

    while (this.pos < this.source.length && this.source.charCodeAt(this.pos) !== 125) {
      const decl = this.parseDeclarationOrNestedRule();
      if (decl) {
        if ("selector" in decl && "declarations" in decl) {
          nestedRules.push(decl);
        } else {
          declarations.push(decl);
        }
      }
    }

    this.consumeChar(125);

    return {
      type: "style",
      selector,
      selectors: selector.split(",").map((s) => s.trim()),
      declarations,
      children: nestedRules.length > 0 ? nestedRules : undefined,
    };
  }

  private parseDeclarationOrNestedRule(): CSSDeclaration | CSSNestedStyleRule | null {
    this.skipWhitespace();

    if (this.pos >= this.source.length) return null;

    const code = this.source.charCodeAt(this.pos);

    if (code === 125) {
      return null;
    }

    if (code === 64) {
      const atRule = this.parseAtRule();
      const ruleName = "name" in atRule ? (atRule as CSSAtRule).name : "";
      return {
        type: "nested-style",
        selector: `@${ruleName}`,
        declarations: [],
        children: "children" in atRule ? atRule.children : undefined,
      } as CSSNestedStyleRule;
    }

    const isNestedSelector = this.isNestedSelector();
    if (isNestedSelector) {
      const nestedSelector = this.readUntil("{").trim();
      this.consumeChar(123);

      const nestedDecls: CSSDeclaration[] = [];
      const nestedNested: CSSNestedStyleRule[] = [];

      while (this.pos < this.source.length && this.source.charCodeAt(this.pos) !== 125) {
        const decl = this.parseDeclarationOrNestedRule();
        if (decl) {
          if ("selector" in decl && "declarations" in decl) {
            nestedNested.push(decl);
          } else {
            nestedDecls.push(decl);
          }
        }
      }

      this.consumeChar(125);

      return {
        type: "nested-style",
        selector: nestedSelector,
        declarations: nestedDecls,
        children: nestedNested.length > 0 ? nestedNested : undefined,
      } as CSSNestedStyleRule;
    }

    return this.parseDeclaration();
  }

  private isNestedSelector(): boolean {
    const start = this.pos;
    let depth = 0;
    let hasNestedBrace = false;

    while (this.pos < this.source.length) {
      const code = this.source.charCodeAt(this.pos);
      if (code === 123) {
        if (depth === 0) {
          hasNestedBrace = true;
        }
        depth++;
        this.pos++;
      } else if (code === 125) {
        depth--;
        this.pos++;
        if (depth === 0) break;
      } else if (depth === 0 && code === 59) {
        break;
      } else if (depth === 0 && code === 58) {
        // Could be property:value or pseudo-class. Continue to find { or ;
        // Don't break immediately, just skip to next char
        this.pos++;
      } else {
        this.pos++;
      }
    }

    this.pos = start;
    return hasNestedBrace;
  }

  private parseDeclaration(): CSSDeclaration | null {
    this.skipWhitespace();

    if (this.pos >= this.source.length) return null;

    const code = this.source.charCodeAt(this.pos);

    if (code === 64 || code === 125) {
      return null;
    }

    const property = this.readName();
    if (!property) {
      this.skipUntil(59);
      this.consumeChar(59);
      return null;
    }

    this.skipWhitespace();

    if (!this.consumeChar(58)) {
      this.skipUntil(59);
      this.consumeChar(59);
      return null;
    }

    this.skipWhitespace();

    let value = "";
    while (this.pos < this.source.length) {
      const code = this.source.charCodeAt(this.pos);
      if (code === 59 || code === 125) break;
      value += this.source[this.pos];
      this.pos++;
    }

    let important = false;
    if (value.toLowerCase().includes("!important")) {
      important = true;
      value = value.replace(/!important$/i, "").trim();
    }

    this.consumeChar(59);

    return {
      type: "declaration",
      property,
      value: value.trim(),
      important,
    };
  }

  private consumeChar(code: number): boolean {
    if (this.pos < this.source.length && this.source.charCodeAt(this.pos) === code) {
      this.pos++;
      return true;
    }
    return false;
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length) {
      const code = this.source.charCodeAt(this.pos);
      if (code !== 32 && code !== 9 && code !== 10 && code !== 13) break;
      this.pos++;
    }
  }

  private skipUntil(code: number): void {
    while (this.pos < this.source.length) {
      if (this.source.charCodeAt(this.pos) === code) break;
      this.pos++;
    }
  }

  private readUntil(terminator: string): string {
    const start = this.pos;
    while (this.pos < this.source.length) {
      if (this.source.startsWith(terminator, this.pos)) break;
      this.pos++;
    }
    return this.source.slice(start, this.pos);
  }

  private readName(): string {
    const start = this.pos;
    while (this.pos < this.source.length) {
      const code = this.source.charCodeAt(this.pos);
      if (this.isIdent(code)) {
        this.pos++;
      } else if (code === 45 && this.isIdentStart(this.peekCharCodeAt(1))) {
        this.pos++;
      } else {
        break;
      }
    }
    return this.source.slice(start, this.pos);
  }

  private readString(): string {
    const quote = this.source.charCodeAt(this.pos);
    this.pos++;
    let value = "";
    while (this.pos < this.source.length) {
      const code = this.source.charCodeAt(this.pos);
      if (code === quote) {
        this.pos++;
        return value;
      }
      value += this.source[this.pos];
      this.pos++;
    }
    return value;
  }

  private peekCharCodeAt(offset: number): number {
    return this.source.charCodeAt(this.pos + offset);
  }

  private isIdentStart(code: number): boolean {
    if (code >= 65 && code <= 90) return true;
    if (code >= 97 && code <= 122) return true;
    if (code === 95 || code === 45) return true;
    return false;
  }

  private isIdent(code: number): boolean {
    return this.isIdentStart(code) || (code >= 48 && code <= 57);
  }
}

export function parseStylesheet(source: string): CSSStyleSheet {
  const parser = new StylesheetParser(source);
  return parser.parse();
}
