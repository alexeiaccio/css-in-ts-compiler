import { Lexer } from "../lexer/index.js";
import type { TokenValue } from "../lexer/token.js";
import { Token } from "../lexer/token.js";
import { LexContext } from "../lexer/contexts.js";

export interface CSSValueOptions {
  onError?: (error: CSSValueError) => void;
}

export interface CSSValueError {
  message: string;
  token: TokenValue;
}

export type CSSValueNode =
  | KeywordNode
  | IdentNode
  | NumberNode
  | DimensionNode
  | PercentageNode
  | StringNode
  | UrlNode
  | FunctionNode
  | CompositeNode;

export interface KeywordNode {
  type: "keyword";
  value: string;
}

export interface IdentNode {
  type: "ident";
  value: string;
}

export interface NumberNode {
  type: "number";
  value: string;
  number: number;
}

export interface DimensionNode {
  type: "dimension";
  value: string;
  number: number;
  unit: string;
}

export interface PercentageNode {
  type: "percentage";
  value: string;
  number: number;
}

export interface StringNode {
  type: "string";
  value: string;
}

export interface UrlNode {
  type: "url";
  value: string;
}

export interface FunctionNode {
  type: "function";
  name: string;
  args: CSSValueNode[];
}

export interface CompositeNode {
  type: "composite";
  nodes: CSSValueNode[];
  combinator: " " | "|" | "||" | "&&";
}

export class CSSValueParser {
  private tokens: TokenValue[] = [];
  private pos = 0;
  private options: CSSValueOptions;

  constructor(options: CSSValueOptions = {}) {
    this.options = options;
  }

  parse(source: string, tokens?: readonly TokenValue[]): CSSValueNode {
    if (tokens) {
      this.tokens = tokens as TokenValue[];
    } else {
      this.tokenize(source);
    }
    this.pos = 0;

    if (this.tokens.length === 0) {
      return { type: "keyword", value: "" };
    }

    return this.parseComponentValue();
  }

  private tokenize(source: string): void {
    const lexer = new Lexer(source);

    this.tokens = [];
    let token: TokenValue;
    while ((token = lexer.next(LexContext.Normal)).token !== Token.EOF) {
      if (token.token !== Token.Whitespace && token.token !== Token.Comment) {
        this.tokens.push(token);
      }
    }
  }

  private peek(): TokenValue {
    return this.tokens[this.pos] ?? { token: Token.EOF, value: "", pos: 0, end: 0 };
  }

  private consume(): TokenValue {
    return this.tokens[this.pos++] ?? { token: Token.EOF, value: "", pos: 0, end: 0 };
  }

  private error(message: string): void {
    const error: CSSValueError = { message, token: this.peek() };
    this.options.onError?.(error);
  }

  private parseComponentValue(): CSSValueNode {
    const token = this.peek();

    switch (token.token) {
      case Token.Number:
        return this.parseNumber();
      case Token.Dimension:
        return this.parseDimension();
      case Token.Percentage:
        return this.parsePercentage();
      case Token.String:
        return this.parseString();
      case Token.Url:
        return this.parseUrl();
      case Token.Function:
        return this.parseFunction();
      case Token.Ident:
        return this.parseIdent();
      case Token.Hash:
        return this.parseHash();
      case Token.Delim:
        return this.parseDelim();
      default:
        this.consume();
        return { type: "keyword", value: token.value };
    }
  }

  private parseNumber(): NumberNode {
    const token = this.consume();
    return {
      type: "number",
      value: token.value,
      number: Number.parseFloat(token.value),
    };
  }

  private parseDimension(): DimensionNode {
    const token = this.consume();
    const match = token.value.match(/^(-?\d+\.?\d*)(.*)$/);
    return {
      type: "dimension",
      value: token.value,
      number: Number.parseFloat(match?.[1] ?? "0"),
      unit: match?.[2] ?? "",
    };
  }

  private parsePercentage(): PercentageNode {
    const token = this.consume();
    return {
      type: "percentage",
      value: token.value,
      number: Number.parseFloat(token.value),
    };
  }

  private parseString(): StringNode {
    const token = this.consume();
    return {
      type: "string",
      value: token.value,
    };
  }

  private parseUrl(): UrlNode {
    const token = this.consume();
    return {
      type: "url",
      value: token.value,
    };
  }

  private parseHash(): IdentNode {
    const token = this.consume();
    return {
      type: "ident",
      value: token.value,
    };
  }

  private parseDelim(): CSSValueNode {
    const token = this.consume();
    return {
      type: "keyword",
      value: token.value,
    };
  }

  private parseIdent(): CSSValueNode {
    const token = this.consume();

    if (this.peek().token === Token.LeftParen) {
      return this.parseFunctionWithName(token.value);
    }

    if (
      token.value === "inherit" ||
      token.value === "initial" ||
      token.value === "unset" ||
      token.value === "revert" ||
      token.value === "revert-layer" ||
      token.value === "auto" ||
      token.value === "none" ||
      token.value === "normal" ||
      token.value === "solid" ||
      token.value === "dashed" ||
      token.value === "dotted" ||
      token.value === "hidden" ||
      token.value === "visible" ||
      token.value === "absolute" ||
      token.value === "relative" ||
      token.value === "fixed" ||
      token.value === "static"
    ) {
      return { type: "keyword", value: token.value };
    }

    return { type: "ident", value: token.value };
  }

  private parseFunctionWithName(name: string): FunctionNode {
    this.consume();

    const args: CSSValueNode[] = [];
    while (this.peek().token !== Token.RightParen && this.peek().token !== Token.EOF) {
      args.push(this.parseComponentValue());
    }

    if (this.peek().token === Token.RightParen) {
      this.consume();
    }

    return { type: "function", name, args };
  }

  private parseFunction(): FunctionNode {
    const token = this.consume();
    return this.parseFunctionWithName(token.value);
  }
}

export function parseValue(source: string, options?: CSSValueOptions): CSSValueNode {
  const parser = new CSSValueParser(options);
  return parser.parse(source);
}
