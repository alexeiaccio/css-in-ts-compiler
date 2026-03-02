import type { Token, TokenValue } from "../lexer/token.js";

export enum CombinatorType {
  /** XOR - exactly one of the alternatives */
  Bar = "bar",
  /** OR - one or more, in any order */
  DoubleBar = "double-bar",
  /** AND - all, in any order */
  DoubleAmpersand = "double-ampersand",
  /** All, in given order */
  Juxtapose = "juxtapose",
}

export enum MultiplierType {
  /** Zero or more */
  Star = "*",
  /** One or more */
  Plus = "+",
  /** Zero or one */
  Question = "?",
  /** Exactly n */
  Exact = "{n}",
  /** Between n and m */
  Range = "{n,m}",
  /** N or more */
  Min = "{n,}",
  /** One or more, comma-separated */
  Hash = "#",
}

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

export interface Function {
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
  | Function
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
