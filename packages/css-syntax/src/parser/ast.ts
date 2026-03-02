import type { TokenValue } from "../lexer/token.js";

export const CombinatorType = {
  Bar: "bar",
  DoubleBar: "double-bar",
  DoubleAmpersand: "double-ampersand",
  Juxtapose: "juxtapose",
} as const;

export type CombinatorType = (typeof CombinatorType)[keyof typeof CombinatorType];

export const MultiplierType = {
  Star: "*",
  Plus: "+",
  Question: "?",
  Exact: "{n}",
  Range: "{n,m}",
  Min: "{n,}",
  Hash: "#",
} as const;

export type MultiplierType = (typeof MultiplierType)[keyof typeof MultiplierType];

export interface Multiplier {
  type: MultiplierType;
  min?: number;
  max?: number | "infinity";
}

export interface TypeReference {
  type: "type-reference";
  name: string;
}

export interface Keyword {
  type: "keyword";
  value: string;
}

export interface PropertyReference {
  type: "property-reference";
  property: string;
}

export interface Range {
  type: "range";
  base: string;
  min: number;
  max: number;
}

export interface FunctionNode {
  type: "function";
  name: string;
  args: SyntaxNode[];
}

export interface Group {
  type: "group";
  nodes: SyntaxNode[];
  combinator?: CombinatorType;
  required?: boolean;
  multiplier?: Multiplier;
}

export interface MultipliedNode {
  type: "multiplied";
  node: SyntaxNode;
  multiplier: Multiplier;
}

export interface CombinedNode {
  type: "combined";
  left: SyntaxNode;
  combinator: CombinatorType;
  right: SyntaxNode;
}

export type SyntaxNode =
  | TypeReference
  | Keyword
  | PropertyReference
  | Range
  | FunctionNode
  | Group
  | MultipliedNode
  | CombinedNode;

export interface SyntaxTree {
  root: SyntaxNode;
}

export interface ParserOptions {
  /** Custom error handler */
  onError?: (error: ParseError) => void;
}

export class ParseError extends Error {
  override name = "ParseError";
  override message: string;
  token: TokenValue;
  expected?: string[];

  constructor(message: string, token: TokenValue, expected?: string[]) {
    super(message);
    this.message = message;
    this.token = token;
    this.expected = expected;
  }

  override toString(): string {
    let msg = `ParseError at position ${this.token.pos}: ${this.message}`;
    if (this.expected?.length) {
      msg += `\nExpected one of: ${this.expected.join(", ")}`;
    }
    return msg;
  }
}
