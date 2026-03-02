export type SelectorNode =
  | ComplexSelector
  | CompoundSelector
  | TypeSelector
  | ClassSelector
  | IdSelector
  | AttributeSelector
  | PseudoClassSelector
  | PseudoElementSelector
  | Combinator;

export interface ComplexSelector {
  type: "complex";
  children: Array<CompoundSelector | Combinator>;
  specificity: Specificity;
}

export interface CompoundSelector {
  type: "compound";
  children: Array<SelectorNode>;
}

export interface TypeSelector {
  type: "type";
  name: string;
  namespace?: string;
}

export interface ClassSelector {
  type: "class";
  name: string;
}

export interface IdSelector {
  type: "id";
  name: string;
}

export interface AttributeSelector {
  type: "attribute";
  name: string;
  namespace?: string;
  operator?: "=" | "~=" | "|=" | "^=" | "$=" | "*=";
  value?: string;
  flags?: string;
}

export interface PseudoClassSelector {
  type: "pseudo-class";
  name: string;
  args?: SelectorNode[];
}

export interface PseudoElementSelector {
  type: "pseudo-element";
  name: string;
  args?: SelectorNode[];
}

export interface Combinator {
  type: "combinator";
  kind: " " | ">" | "+" | "~" | "||";
}

export interface Specificity {
  a: number;
  b: number;
  c: number;
}

export function compareSpecificity(a: Specificity, b: Specificity): number {
  if (a.a !== b.a) return b.a - a.a;
  if (a.b !== b.b) return b.b - a.b;
  return b.c - a.c;
}

export function specificityToNumber(s: Specificity): number {
  return s.a * 65536 + s.b * 256 + s.c;
}
