//#region src/twin-core.d.ts
type Tok = {
  t: "type";
  v: string;
  lo?: string;
  hi?: string;
} | {
  t: "prop";
  v: string;
} | {
  t: "kw";
  v: string;
} | {
  t: "fn";
  v: string;
} | {
  t: "range";
  lo: string;
  hi: string;
} | {
  t: "p";
  v: string;
} | {
  t: "lit";
  v: string;
} | {
  t: "eof";
};
export declare function next(s: string): [Tok, string];
export type Node = ["kw", string] | ["type", string, string?, string?] | ["prop", string] | ["fn", string, Node] | ["lit", string] | ["alt", Node[]] | ["or", Node[]] | ["and", Node[]] | ["seq", Node[]] | ["opt", Node] | ["star", Node] | ["plus", Node] | ["list", Node] | ["rep", Node, string, string] | ["bang", Node];
export declare function parseGrammar(s: string): Node;
export declare const spaced: (q: string) => string;
export declare const isNative: (name: string) => boolean;
interface Ctx {
  len: number;
  far: number;
  expected: Set<string>;
  pend?: boolean;
  ch?: readonly string[];
  why?: [at: number, text: string];
  fix?: [at: number, written: string, canonical: string];
}
export declare function consume(n: Node, s: string, ctx: Ctx, label?: string): Set<string>;
export declare const magnitude: (t: string) => number;
export declare const nullable: (n: Node) => boolean;
export declare function matches(syntax: string, s: string, pending?: boolean): boolean;
export declare function valid(p: string, s: string, syntax?: string | undefined): string;
//#endregion