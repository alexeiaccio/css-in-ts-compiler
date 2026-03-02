import type {
  SelectorNode,
  ComplexSelector,
  CompoundSelector,
  ClassSelector,
  IdSelector,
  AttributeSelector,
  PseudoClassSelector,
  PseudoElementSelector,
  Combinator,
  Specificity,
} from "./selector-ast.js";

const PSEUDO_ELEMENTS = new Set([
  "before",
  "after",
  "first-line",
  "first-letter",
  "selection",
  "placeholder",
  "marker",
  "backdrop",
  "cue",
  "cue-region",
  "part",
  "slotted",
  "view-transition",
  "view-transition-old",
  "view-transition-new",
]);

const IS_PUNCTUATOR = 1;
const IS_WHITESPACE = 2;
const IS_IDENT = 3;

function charType(code: number): number {
  if (code >= 65 && code <= 90) return IS_IDENT;
  if (code >= 97 && code <= 122) return IS_IDENT;
  if (code === 45 || code === 95) return IS_IDENT;
  if (code === 32 || code === 9 || code === 10 || code === 13) return IS_WHITESPACE;
  return IS_PUNCTUATOR;
}

export class SelectorParser {
  private source: string;
  private pos = 0;

  constructor(source: string) {
    this.source = source;
  }

  parse(): ComplexSelector {
    const children: Array<CompoundSelector | Combinator> = [];

    children.push(this.parseCompoundSelector());

    while (this.pos < this.source.length) {
      const combinator = this.parseCombinator();
      if (combinator) {
        children.push(combinator);
        if (combinator.kind !== " ") {
          this.skipWhitespace();
        }
        const compound = this.parseCompoundSelector();
        if (compound.children.length > 0) {
          children.push(compound);
        }
      } else {
        break;
      }
    }

    return {
      type: "complex",
      children,
      specificity: this.calculateSpecificity(children),
    };
  }

  private parseCompoundSelector(): CompoundSelector {
    const children: SelectorNode[] = [];

    while (this.pos < this.source.length) {
      const code = this.source.charCodeAt(this.pos);
      const type = charType(code);

      if (type === IS_WHITESPACE) {
        break;
      }

      if (type === IS_IDENT) {
        children.push(this.parseSimpleSelector());
      } else if (code === 46) {
        children.push(this.parseClassSelector());
      } else if (code === 35) {
        children.push(this.parseIdSelector());
      } else if (code === 91) {
        children.push(this.parseAttributeSelector());
      } else if (code === 58) {
        children.push(this.parsePseudoSelector());
      } else if (code === 42) {
        this.pos++;
        children.push({ type: "type", name: "*" });
      } else {
        break;
      }
    }

    return { type: "compound", children };
  }

  private parseSimpleSelector(): SelectorNode {
    const start = this.pos;

    if (this.source.charCodeAt(this.pos) === 124) {
      this.pos++;
      if (this.source.charCodeAt(this.pos) === 124) {
        this.pos++;
        return { type: "type", name: "*", namespace: "" };
      }
      const name = this.readName();
      return { type: "type", name, namespace: "" };
    }

    if (this.source.charCodeAt(this.pos) === 58) {
      const isDoubleColon = this.source.charCodeAt(this.pos + 1) === 58;
      if (isDoubleColon) {
        this.pos += 2;
        const pseudoName = this.readName();
        return { type: "pseudo-element", name: pseudoName };
      }
      this.pos++;
      const pseudoName = this.readName();
      if (pseudoName && !this.isIdentStart(this.peekCharCode())) {
        if (PSEUDO_ELEMENTS.has(pseudoName)) {
          return { type: "pseudo-element", name: pseudoName };
        }
        return { type: "pseudo-class", name: pseudoName };
      }
      this.pos = start;
    }

    const name = this.readName();

    if (this.source.charCodeAt(this.pos) === 124) {
      this.pos++;
      const namespace = name;
      const elementName = this.readName();
      return { type: "type", name: elementName || "*", namespace };
    }

    if (this.source.charCodeAt(this.pos) === 58) {
      const isDoubleColon = this.source.charCodeAt(this.pos + 1) === 58;
      if (isDoubleColon) {
        this.pos += 2;
        const pseudoName = this.readName();
        return { type: "pseudo-element", name: pseudoName };
      }
      this.pos++;
      const pseudoName = this.readName();
      if (pseudoName && !this.isIdentStart(this.peekCharCode())) {
        if (PSEUDO_ELEMENTS.has(pseudoName)) {
          return { type: "pseudo-element", name: pseudoName };
        }
        return { type: "pseudo-class", name: pseudoName };
      }
      this.pos = start;
    }

    return { type: "type", name };
  }

  private parseClassSelector(): ClassSelector {
    this.pos++;
    const name = this.readName();
    return { type: "class", name };
  }

  private parseIdSelector(): IdSelector {
    this.pos++;
    const name = this.readName();
    return { type: "id", name };
  }

  private parseAttributeSelector(): AttributeSelector {
    this.pos++;

    let namespace: string | undefined;
    let name: string;

    name = this.readName();

    if (this.source.charCodeAt(this.pos) === 124) {
      this.pos++;
      namespace = name;
      name = this.readName();
    }

    let operator: AttributeSelector["operator"] | undefined;
    let value: string | undefined;
    let flags: string | undefined;

    const code = this.peekCharCode();
    if (code === 61) {
      this.pos++;
      operator = "=";
      if (this.peekCharCode() === 94 || this.peekCharCode() === 36 || this.peekCharCode() === 42 || this.peekCharCode() === 126) {
        const modifier = String.fromCharCode(this.pos++);
        operator = (modifier + "=") as AttributeSelector["operator"];
      }
      value = this.readAttributeValue();
    } else if (code === 94 || code === 36 || code === 126 || code === 42) {
      const modifier = String.fromCharCode(this.pos++);
      if (this.consumeChar(61)) {
        operator = (modifier + "=") as AttributeSelector["operator"];
        value = this.readAttributeValue();
      }
    } else if (code === 124 && this.peekCharCodeAt(1) === 61) {
      this.pos += 2;
      operator = "|=";
      value = this.readAttributeValue();
    }

    if (this.peekCharCode() === 105 && this.source.slice(this.pos, this.pos + 2) === "i") {
      flags = "i";
      this.pos += 2;
    } else if (this.peekCharCode() === 115 && this.source.slice(this.pos, this.pos + 2) === "as") {
      flags = "as";
      this.pos += 2;
    }

    this.consumeChar(93);

    return { type: "attribute", name, namespace, operator, value, flags };
  }

  private parsePseudoSelector(): PseudoClassSelector | PseudoElementSelector {
    this.pos++;
    let isElement = false;

    if (this.peekCharCode() === 58) {
      isElement = true;
      this.pos++;
    }

    const firstName = this.readName();

    if (this.peekCharCode() === 40) {
      this.pos++;
      return {
        type: isElement ? "pseudo-element" : "pseudo-class",
        name: firstName,
        args: undefined,
      };
    }

    return {
      type: isElement ? "pseudo-element" : "pseudo-class",
      name: firstName,
    };
  }

  private parseCombinator(): Combinator | null {
    const start = this.skipWhitespace();

    if (start === this.pos) return null;

    if (this.pos >= this.source.length) return null;

    const code = this.peekCharCode();
    if (code === 62) {
      this.pos++;
      return { type: "combinator", kind: ">" };
    }
    if (code === 43) {
      this.pos++;
      return { type: "combinator", kind: "+" };
    }
    if (code === 126) {
      this.pos++;
      return { type: "combinator", kind: "~" };
    }
    if (code === 124 && this.peekCharCodeAt(1) === 124) {
      this.pos += 2;
      return { type: "combinator", kind: "||" };
    }

    return { type: "combinator", kind: " " };
  }

  private calculateSpecificity(children: Array<CompoundSelector | Combinator>): Specificity {
    let a = 0;
    let b = 0;
    let c = 0;

    for (const child of children) {
      if (child.type === "compound") {
        for (const selector of child.children) {
          if (selector.type === "id") {
            a++;
          } else if (selector.type === "class" || selector.type === "attribute") {
            b++;
          } else if (selector.type === "type") {
            c++;
          } else if (selector.type === "pseudo-class") {
            b++;
          } else if (selector.type === "pseudo-element") {
            c++;
          }
        }
      }
    }

    return { a, b, c };
  }

  private skipWhitespace(): number {
    const start = this.pos;
    while (this.pos < this.source.length) {
      const code = this.source.charCodeAt(this.pos);
      if (code !== 32 && code !== 9 && code !== 10 && code !== 13) break;
      this.pos++;
    }
    return start;
  }

  private peekCharCode(): number {
    return this.source.charCodeAt(this.pos);
  }

  private peekCharCodeAt(offset: number): number {
    return this.source.charCodeAt(this.pos + offset);
  }

  private consumeChar(code: number): boolean {
    if (this.source.charCodeAt(this.pos) === code) {
      this.pos++;
      return true;
    }
    return false;
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

  private readAttributeValue(): string {
    const start = this.pos;
    const quote = this.source.charCodeAt(this.pos);
    if (quote === 34 || quote === 39) {
      this.pos++;
      while (this.pos < this.source.length && this.source.charCodeAt(this.pos) !== quote) {
        this.pos++;
      }
      this.pos++;
      return this.source.slice(start + 1, this.pos - 1);
    }
    while (this.pos < this.source.length) {
      const code = this.source.charCodeAt(this.pos);
      if (code === 93 || code === 32) break;
      this.pos++;
    }
    return this.source.slice(start, this.pos);
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

export function parseSelector(source: string): ComplexSelector {
  const parser = new SelectorParser(source.trim());
  return parser.parse();
}
