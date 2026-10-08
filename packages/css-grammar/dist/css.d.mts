import { Keywords } from "./keywords.mjs";
import { properties, syntaxes } from "./mdn.mjs";
//#region src/css.d.ts
type Props = typeof properties;
type Syns = typeof syntaxes;
type Ws = " " | "\n" | "\t";
type Trim<S extends string> = S extends `${Ws}${infer R}` ? Trim<R> : S;
type Special = "(" | ")" | "[" | "]" | "|" | "&" | "?" | "*" | "+" | "#" | "!" | "," | "/" | "{" | "}" | "<" | ">" | "'" | Ws;
type WordChar = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z" | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z" | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "-" | "_";
type TypeTok<T extends string> = T extends `${infer N} [${infer Lo},${infer Hi}]` ? ([Lo, Hi] extends [`${bigint}` | "-∞", `${bigint}` | "∞"] ? (`${Lo}${Hi}` extends `${string}-${Digit}${string}` ? {
  t: "type";
  v: N;
} : {
  t: "type";
  v: N;
  lo: Lo;
  hi: Hi;
}) : {
  t: "type";
  v: N;
}) : {
  t: "type";
  v: T;
};
type IsWord<W extends string> = W extends "" ? false : W extends `${string}${Special}${string}` ? false : true;
type Word<S extends string, Acc extends string = ""> = S extends `${infer C}${infer R}` ? (C extends WordChar ? Word<R, `${Acc}${C}`> : [Acc, S]) : [Acc, ""];
type Tok = {
  t: "type";
  v: string;
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
  t: "type";
  v: string;
  lo: string;
  hi: string;
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
type Next<S extends string> = S extends "" ? [{
  t: "eof";
}, ""] : S extends `${Ws}${infer R}` ? Next<R> : S extends `<'${infer P}'>${infer R}` ? [{
  t: "prop";
  v: P;
}, R] : S extends `<${infer T}>${infer R}` ? [TypeTok<T>, R] : S extends `||${infer R}` ? [{
  t: "p";
  v: "||";
}, R] : S extends `&&${infer R}` ? [{
  t: "p";
  v: "&&";
}, R] : S extends `{${infer B}}${infer R}` ? (B extends `${infer Lo},${infer Hi}` ? [{
  t: "range";
  lo: Lo;
  hi: Hi extends "" ? "∞" : Hi;
}, R] : [{
  t: "range";
  lo: B;
  hi: B;
}, R]) : S extends `${infer C extends "[" | "]" | ")" | "|" | "?" | "*" | "+" | "#" | "!" | "," | "/"}${infer R}` ? [{
  t: "p";
  v: C;
}, R] : S extends `${infer W} ${infer R}` ? (IsWord<W> extends true ? [{
  t: "kw";
  v: W;
}, R] : NextWord<S>) : IsWord<S> extends true ? [{
  t: "kw";
  v: S;
}, ""] : NextWord<S>;
type NextWord<S extends string> = Word<S> extends [infer W extends string, infer R extends string] ? W extends "" ? (S extends `(${infer R2}` ? [{
  t: "p";
  v: "(";
}, R2] : S extends `'${infer Q}'${infer R2}` ? [{
  t: "lit";
  v: Q;
}, R2] : [{
  t: "eof";
}, ""]) : R extends `(${infer R2}` ? [{
  t: "fn";
  v: W;
}, R2] : [{
  t: "kw";
  v: W;
}, R] : never;
type Node = ["kw", string] | ["type", string] | ["type", string, string, string] | ["prop", string] | ["fn", string, Node] | ["lit", string] | ["alt", Node, Node | null] | ["or", Node[]] | ["and", Node[]] | ["seq", Node[]] | ["opt", Node] | ["star", Node] | ["plus", Node] | ["list", Node] | ["rep", Node, string, string] | ["bang", Node];
export type Parse<S extends string> = ParseAlt<S> extends [infer N, any] ? N : never;
type ParseAlt<S extends string> = ParseOr<S> extends [infer N extends Node, infer R extends string] ? AltRest<R, ["alt", N, null]> : never;
type AltRest<S extends string, Acc extends Node> = Next<S> extends [{
  t: "p";
  v: "|";
}, infer R extends string] ? (ParseOr<R> extends [infer N extends Node, infer R2 extends string] ? AltRest<R2, ["alt", N, Acc]> : never) : [Acc extends ["alt", infer Only, null] ? Only : Acc, S];
type ParseOr<S extends string> = ParseAnd<S> extends [infer N extends Node, infer R extends string] ? OrRest<R, [N]> : never;
type OrRest<S extends string, Acc extends Node[]> = Next<S> extends [{
  t: "p";
  v: "||";
}, infer R extends string] ? (ParseAnd<R> extends [infer N extends Node, infer R2 extends string] ? OrRest<R2, [...Acc, N]> : never) : [Acc extends [infer Only] ? Only : ["or", Acc], S];
type ParseAnd<S extends string> = ParseSeq<S> extends [infer N extends Node, infer R extends string] ? AndRest<R, [N]> : never;
type AndRest<S extends string, Acc extends Node[]> = Next<S> extends [{
  t: "p";
  v: "&&";
}, infer R extends string] ? (ParseSeq<R> extends [infer N extends Node, infer R2 extends string] ? AndRest<R2, [...Acc, N]> : never) : [Acc extends [infer Only] ? Only : ["and", Acc], S];
type ParseSeq<S extends string, Acc extends Node[] = []> = Next<S> extends [{
  t: "eof";
} | {
  t: "p";
  v: "|" | "||" | "&&" | "]" | ")";
}, any] ? [Acc extends [infer Only] ? Only : ["seq", Acc], S] : ParseTerm<S> extends [infer N extends Node, infer R extends string] ? ParseSeq<R, [...Acc, N]> : never;
type ParseTerm<S extends string> = Next<S> extends [infer T extends Tok, infer R extends string] ? T extends {
  t: "p";
  v: "[";
} ? (ParseAlt<R> extends [infer N extends Node, infer R2 extends string] ? (Next<R2> extends [{
  t: "p";
  v: "]";
}, infer R3 extends string] ? Mult<N, R3> : never) : never) : T extends {
  t: "fn";
  v: infer V extends string;
} ? FnArgs<V, R> : T extends {
  t: "p";
  v: "(";
} ? FnArgs<"", R> : T extends {
  t: "type";
  v: infer V extends string;
  lo: infer Lo extends string;
  hi: infer Hi extends string;
} ? Mult<["type", V, Lo, Hi], R> : T extends {
  t: "type";
  v: infer V extends string;
} ? Mult<["type", V], R> : T extends {
  t: "prop";
  v: infer V extends string;
} ? Mult<["prop", V], R> : T extends {
  t: "kw";
  v: infer V extends string;
} ? Mult<["kw", V], R> : T extends {
  t: "p";
  v: infer V extends "," | "/";
} ? Mult<["lit", V], R> : T extends {
  t: "lit";
  v: infer V extends string;
} ? Mult<["lit", V], R> : never : never;
type FnArgs<V extends string, S extends string> = ParseAlt<S> extends [infer N extends Node, infer R extends string] ? (Next<R> extends [{
  t: "p";
  v: ")";
}, infer R2 extends string] ? Mult<["fn", V, N], R2> : never) : never;
type Dec = {
  "1": "0";
  "2": "1";
  "3": "2";
  "4": "3";
  "6": "5";
  "16": "15";
  "∞": "∞";
};
type Mult<N, S extends string> = Next<S> extends [infer T extends Tok, infer R extends string] ? T extends {
  t: "p";
  v: "?";
} ? Mult<["opt", N], R> : T extends {
  t: "p";
  v: "*";
} ? Mult<["star", N], R> : T extends {
  t: "p";
  v: "+";
} ? Mult<["plus", N], R> : T extends {
  t: "p";
  v: "#";
} ? Mult<["list", N], R> : T extends {
  t: "p";
  v: "!";
} ? Mult<["bang", N], R> : T extends {
  t: "range";
  lo: infer Lo extends string;
  hi: infer Hi extends string;
} ? Mult<N extends ["list", infer X extends Node] ? ["seq", [X, ["rep", ["seq", [["lit", ","], X]], Dec[Lo & keyof Dec], Dec[Hi & keyof Dec]]]] : ["rep", N, Lo, Hi], R> : [N, S] : never;
type Tok1<S extends string> = S extends `${infer T} ${infer R}` ? Split<T, ` ${R}`> : Split<S, "">;
type Split<T extends string, R extends string> = T extends `${string}${"," | ")"}${string}` ? SplitComma<T, R> : [T, R];
type SplitComma<T extends string, R extends string> = T extends `${infer A},${infer B}` ? SplitParen<A, `,${B}${R}`> : SplitParen<T, R>;
type SplitParen<T extends string, R extends string> = T extends `${infer A})${infer B}` ? [A, `)${B}${R}`] : [T, R];
export type LengthUnit = "px" | "em" | "rem" | "vw" | "vh" | "vmin" | "vmax" | "ch" | "ex" | "lh" | "rlh" | "cm" | "mm" | "in" | "pt" | "pc" | "q" | "svw" | "svh" | "lvw" | "lvh" | "dvw" | "dvh" | "cqw" | "cqh" | "cqi" | "cqb" | "cqmin" | "cqmax" | "ic" | "cap" | "rex" | "rch" | "ric" | "rcap";
export type Wild = "⟨*⟩";
export type Sentinels = "color" | "length" | "percentage" | "number" | "integer" | "angle" | "time" | "custom-ident" | "resolution" | "url" | "image" | "transform-list" | "easing-function" | "shadow";
/** What the recognizer sees of a typed value of type `T`: `⟨T⟩`, or `⟨*⟩` for one of every type (a token of a JSON import). */
export type Sentinel<T extends string> = [Sentinels] extends [T] ? Wild : `⟨${T}⟩`;
type WildNamed = "color" | "image" | "transform-list" | "easing-function" | "shadow";
type PrimitiveMap = {
  length: `${number}${LengthUnit}` | "0" | "⟨length⟩" | Wild;
  percentage: `${number}%` | "⟨percentage⟩" | Wild;
  "length-percentage": `${number}${LengthUnit}` | "0" | `${number}%` | "⟨length⟩" | "⟨percentage⟩" | Wild;
  number: `${number}` | "⟨number⟩" | "⟨integer⟩" | Wild;
  integer: `${bigint}` | "⟨integer⟩" | Wild;
  "hex-color": `#${string}`;
  "custom-ident": string;
  ident: string;
  "ident-token": string;
  "dashed-ident": `--${string}` | "⟨dashed-ident⟩";
  angle: `${number}${"deg" | "rad" | "grad" | "turn"}` | "⟨angle⟩" | Wild;
  time: `${number}${"s" | "ms"}` | "⟨time⟩" | Wild;
  resolution: `${number}${"dpi" | "dpcm" | "dppx" | "x"}` | "⟨resolution⟩" | Wild;
  flex: `${number}fr`;
  zero: "0" | "+0" | "-0";
  "hash-token": `#${string}`;
  "intrinsic-size-keyword": "min-content" | "max-content" | "fit-content" | "stretch";
  x: `${number}`;
  y: `${number}`;
  dimension: `${number}${LengthUnit | "deg" | "rad" | "grad" | "turn" | "s" | "ms" | "hz" | "khz" | "dpi" | "dpcm" | "dppx" | "x" | "fr"}`;
};
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type NotIdentChar = "'" | '"' | "#" | "." | "+" | "(" | "!" | "$" | "%" | "&" | "*" | "/" | ":" | ";" | "<" | "=" | ">" | "?" | "@" | "[" | "\\" | "]" | "^" | "`" | "{" | "|" | "}" | "~";
type NotIdentStart = `${string}${NotIdentChar}${string}` | `${Digit | `-${Digit}`}${string}` | "-" | `⟨${string}`;
type NotIdent = NotIdentStart | "initial" | "inherit" | "unset" | "revert" | "revert-layer" | "default";
export type Consume<N, S extends string, P extends boolean = false> = S extends string ? N extends ["kw", infer V extends string] ? (Tok1<S> extends [V, infer R extends string] ? Trim<R> : P extends true ? Pend<N, S> : never) : N extends ["lit", infer V extends string] ? (S extends `${V}${infer R}` ? Trim<R> : P extends true ? Pend<N, S> : never) : N extends ["type", infer V extends string, ...infer G] ? V extends keyof PrimitiveMap ? (Tok1<S> extends [infer T extends string, infer R extends string] ? (T extends "" ? never : T extends PrimitiveMap[V] ? (V extends "custom-ident" ? (T extends "⟨custom-ident⟩" | Wild ? Trim<R> : Lowercase<T> extends NotIdent ? P extends true ? Pend<N, S> : never : Trim<R>) : V extends "ident" | "ident-token" ? (T extends NotIdentStart ? P extends true ? Pend<N, S> : never : Trim<R>) : G extends [infer Lo extends string, infer Hi extends string] ? (true extends Out<T, Lo, Hi> ? never : Trim<R>) : Trim<R>) : V extends Numeric ? (T extends `${string}(${string}` ? MathCall<S> | (P extends true ? Pend<N, S> : never) : P extends true ? Pend<N, S> : never) : P extends true ? Pend<N, S> : never) : never) : V extends "string" | "url" ? Scanned<V, S> | (P extends true ? Pend<N, S> : never) : V extends "declaration-value" ? Scanned<V, S> : V extends "math-function" ? MathCall<S> : V extends "declaration" ? Scanned<"declaration-value", S> : V extends "if()" ? (S extends `if(${infer R}` ? Close<Declaration<Trim<R>, Trim<R>, [], true>> : never) : V extends keyof Syns ? (V extends `${infer F}()` ? (S extends `${F}(${string}` ? Consume<Parse<Syns[V]>, S, P> : S extends `⟨${V}⟩${infer R}` ? Trim<R> : P extends true ? Pend<N, S> : never) : S extends `⟨${V | (V extends WildNamed ? "*" : never)}⟩${infer R}` ? Trim<R> : Consume<Parse<Syns[V]>, S, P>) : never : N extends ["prop", infer V extends string] ? (V extends keyof Props ? Consume<Parse<Props[V]>, S, P> : never) : N extends ["fn", infer F extends string, infer A] ? (S extends `${F}(${infer R}` ? (F extends RelativeFn ? (Trim<R> extends `from ${string}` ? Close<Declaration<Trim<R>, Trim<R>, []>> : Close<Consume<A, Trim<R>, P>>) : Close<Consume<A, Trim<R>, P>>) : P extends true ? Pend<N, S> : never) : N extends ["alt", any, any] ? ConsumeAlt<N, S, P> : N extends ["seq", infer Xs extends Node[]] ? SeqRest<Xs, S, never, never, never, P> : N extends ["opt", infer X] ? S | Consume<X, S, P> : N extends ["star", infer X] ? Star<X, S, P> : N extends ["plus", infer X] ? Star<X, Consume<X, S, P>, P> : N extends ["list", infer X] ? ListRest<X, Consume<X, S, P>, P> : N extends ["rep", infer X, infer Lo extends string, infer Hi extends string] ? Rep<X, S, Lo, Hi, P> : N extends ["or", infer Xs extends Node[]] ? AnyOrder<Xs, S, false, P> : N extends ["and", infer Xs extends Node[]] ? AnyOrder<Xs, S, true, P> : N extends ["bang", infer X] ? Exclude<Consume<X, S, P>, S> : never : never;
type Numeric = "length" | "percentage" | "length-percentage" | "number" | "integer" | "angle" | "time" | "resolution" | "x" | "y";
type MathFn = "calc" | "min" | "max" | "clamp" | "round" | "mod" | "rem" | "sin" | "cos" | "tan" | "asin" | "acos" | "atan" | "atan2" | "pow" | "sqrt" | "hypot" | "log" | "exp" | "abs" | "sign";
type MathCall<S extends string> = S extends `${MathFn}(${infer R}` ? Close<Declaration<Trim<R>, Trim<R>, []>> : never;
type RelativeFn = "rgb" | "rgba" | "hsl" | "hsla" | "hwb" | "lab" | "lch" | "oklab" | "oklch" | "color";
type HasPending<S extends string> = S extends `${string}${"var(--" | "env(" | "if("}${string}` ? true : false;
type Pend<N, S extends string> = S extends `var(--${string}` | `env(${string}` | `if(${string}` ? (S extends `${string}(${infer X}` ? (Close<Declaration<Trim<X>, Trim<X>, [], true>> extends (infer Q extends string) ? S | Q | Consume<N, Q, true> : never) : never) : never;
type PendDone<R extends string> = R extends `var(--${string}` | `env(${string}` | `if(${string}` ? (R extends `${string}(${infer X}` ? (Close<Declaration<Trim<X>, Trim<X>, [], true>> extends (infer Q extends string) ? (Q extends "" ? true : PendDone<Q>) : never) : never) : never;
type Close<R> = R extends `)${infer Q}` ? Trim<Q> : R extends `var(--${string}` | `env(${string}` | `if(${string}` ? (R extends `${string}(${infer X}` ? (Close<Declaration<Trim<X>, Trim<X>, [], true>> extends (infer Q) ? Close<Q> : never) : never) : never;
type Scanned<V extends string, S extends string> = V extends "string" ? Quoted<S> : V extends "url" ? UrlRest<S> : Declaration<S, S, []>;
type Quoted<S extends string> = S extends `"${string}"${infer R}` ? Trim<R> : S extends `'${string}'${infer R}` ? Trim<R> : never;
type UrlRest<S extends string> = S extends `⟨${"url" | "*"}⟩${infer R}` ? Trim<R> : S extends `url(${infer B})${infer R}` ? (UrlBody<TrimEnd<Trim<B>>> extends true ? Trim<R> : never) : never;
type UrlBody<B extends string> = B extends `"${infer Q}"` ? (Q extends `${string}"${string}` ? false : true) : B extends `'${infer Q}'` ? (Q extends `${string}'${string}` ? false : true) : B extends `${string}${Ws | '"' | "'" | "(" | "\\"}${string}` ? false : true;
type TrimEnd<S extends string> = S extends `${infer R}${Ws}` ? TrimEnd<R> : S;
type Declaration<S extends string, Rest extends string, D extends 0[], Semi extends boolean = false> = Rest extends `${infer C}${infer R}` ? C extends '"' | "'" ? (R extends `${string}${C}${infer R2}` ? Declaration<S, R2, D, Semi> : never) : C extends "(" | "[" | "{" ? Declaration<S, R, [...D, 0], Semi> : C extends ")" | "]" | "}" ? (D extends [0, ...infer D2 extends 0[]] ? Declaration<S, R, D2, Semi> : C extends ")" ? (Rest extends S ? never : Rest) : never) : C extends ";" | "!" ? (D extends [] ? ([C, Semi] extends [";", true] ? Declaration<S, R, D, Semi> : never) : Declaration<S, R, D, Semi>) : Declaration<S, R, D, Semi> : D extends [] ? (Rest extends S ? never : "") : never;
type ConsumeAlt<N, S extends string, P extends boolean, Acc = never> = N extends ["alt", infer H, infer T] ? ConsumeAlt<T, S, P, Acc | Consume<H, S, P>> : Acc;
type Nullable = ["opt", any] | ["star", any] | ["rep", any, "0", string];
type SeqRest<Xs extends Node[], S extends string, Start extends string, Moved extends string, Done extends string, P extends boolean> = Xs extends [infer H, ...infer R extends Node[]] ? H extends ["lit", ","] ? (AfterComma<Exclude<S, Start>, P> extends (infer After extends string) ? R extends [Nullable, ...Nullable[]] ? SeqRest<R, Extract<S, Start> | After, Extract<S, Start> | After, After, Done | Exclude<S, Start>, P> : SeqRest<R, Extract<S, Start> | After, Extract<S, Start> | After, Moved, Done, P> : never) : SeqRest<R, Consume<H, S, P>, [Start] extends [never] ? S : Start, Moved, Done, P> : Exclude<S, Moved> | Done;
type AfterComma<S extends string, P extends boolean> = S extends `,${infer Q}` ? Trim<Q> : P extends true ? Pend<["lit", ","], S> : never;
type Full = [0, 0, 0, 0, 0, 0, 0, 0, ...0[]];
type Star<X, S extends string, P extends boolean, D extends any[] = []> = {
  done: S;
  next: S | Star<X, Consume<X, S, P>, P, [...D, 0]>;
}[D extends Full ? "done" : "next"];
type ListRest<X, R, P extends boolean, Acc = never> = (R extends string ? AfterComma<R, P> : never) extends (infer Q extends string) ? ([Q] extends [never] ? Acc | R : ListRest<X, Exclude<Consume<X, Q, P>, Acc | R>, P, Acc | R>) : never;
type Digits = {
  "0": [];
  "1": [0];
  "2": [0, 0];
  "3": [0, 0, 0];
  "4": [0, 0, 0, 0];
  "5": [0, 0, 0, 0, 0];
  "6": [0, 0, 0, 0, 0, 0];
  "15": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  "∞": [0, 0, 0, 0, 0, 0, 0, 0];
};
type Rep<X, S extends string, Lo extends string, Hi extends string, P extends boolean> = RepN<X, S, Digits[Lo & keyof Digits], Digits[Hi & keyof Digits], [], P>;
type RepN<X, S extends string, Lo extends any[], Hi extends any[], I extends any[], P extends boolean> = {
  done: S;
  next: (I extends [...Lo, ...any] ? S : never) | RepN<X, Consume<X, S, P>, Lo, Hi, [...I, 0], P>;
}[I["length"] extends Hi["length"] ? "done" : "next"];
type AnyOrder<Xs extends Node[], S extends string, All extends boolean, P extends boolean> = [S] extends [never] ? never : Xs extends [] ? S : [P] extends [true] ? AnyOrderPend<Xs, S, All> : TryEach<Xs, Xs, S, All, [], P>;
type AnyOrderPend<Xs extends Node[], S extends string, All extends boolean> = PendHead<S> extends (infer Q extends string) ? ([Q] extends [never] ? TryEach<Xs, Xs, S, All, [], true> : S | Q | AnyOrder<Xs, Q, false, true> | TryHead<Xs, Xs, [], S | Q, S>) : never;
type PendHead<S extends string> = S extends `var(--${string}` | `env(${string}` | `if(${string}` ? (S extends `${string}(${infer X}` ? Close<Declaration<Trim<X>, Trim<X>, [], true>> : never) : never;
type TryHead<Parts extends Node[], Todo extends Node[], I extends any[], Skip extends string, S extends string> = Todo extends [infer H, ...infer R extends Node[]] ? (Exclude<Consume<H, S, true>, Skip> extends (infer R1 extends string) ? R1 | AnyOrder<RemoveAt<Parts, `${I["length"]}`>, R1, false, true> : never) | TryHead<Parts, R, [...I, 0], Skip, S> : never;
type TryEach<Parts extends Node[], Todo extends Node[], S extends string, All extends boolean, I extends any[], P extends boolean> = Todo extends [infer H, ...infer R extends Node[]] ? (Consume<H, S, P> extends (infer R1 extends string) ? (All extends true ? never : R1) | AnyOrder<RemoveAt<Parts, `${I["length"]}`>, R1, All, P> : never) | TryEach<Parts, R, S, All, [...I, 0], P> : never;
type RemoveAt<T extends any[], K extends string, I extends any[] = [], Acc extends any[] = []> = T extends [infer H, ...infer R] ? (`${I["length"]}` extends K ? [...Acc, ...R] : RemoveAt<R, K, [...I, 0], [...Acc, H]>) : Acc;
type Out<T extends string, Lo extends string, Hi extends string> = T extends `-${infer M}` ? (Lo extends "-∞" ? false : M extends `${string}${"e" | "E"}-${string}` ? false : Lo extends "0" ? NonZero<M> : true) : [Lo, Hi] extends ["0" | "-∞", "∞"] ? false : Decimal<T extends `+${infer M}` ? M : T> extends [infer I extends string, infer F extends boolean] ? (Lo extends "-∞" | "0" ? false : Cmp<I, Lo> extends "lt" ? true : false) | (Hi extends "∞" ? false : Cmp<I, Hi> extends "gt" ? true : Cmp<I, Hi> extends "eq" ? F : false) : false;
type NonZero<M extends string> = M extends `${"0" | "."}${infer R}` ? NonZero<R> : M extends `${Exclude<Digit, "0">}${string}` ? true : false;
type Decimal<M extends string> = M extends `${Digit | "."}${string}` ? DecInt<M, ""> : false;
type DecInt<M extends string, I extends string> = M extends `${infer C extends Digit}${infer R}` ? DecInt<R, I extends "" ? (C extends "0" ? "" : C) : `${I}${C}`> : M extends `.${infer R}` ? DecFrac<R, I extends "" ? "0" : I, false> : DecEnd<M, I extends "" ? "0" : I, false>;
type DecFrac<M extends string, I extends string, F extends boolean> = M extends `${infer C extends Digit}${infer R}` ? DecFrac<R, I, C extends "0" ? F : true> : DecEnd<M, I, F>;
type DecEnd<M extends string, I extends string, F extends boolean> = M extends `${"e" | "E"}${"+" | "-" | ""}${Digit}${string}` ? false : [I, F];
type Cmp<A extends string, B extends string, V extends string = "eq"> = A extends `${infer X}${infer RA}` ? (B extends `${infer Y}${infer RB}` ? Cmp<RA, RB, V extends "eq" ? (X extends Y ? "eq" : "0123456789" extends `${string}${X}${string}${Y}${string}` ? "lt" : "gt") : V> : "gt") : B extends "" ? V : "lt";
export type Matches<Syntax extends string, S extends string> = "" extends Consume<Parse<Syntax>, Trim<S>> ? true : false;
export type MatchesValue<Syntax extends string, S extends string> = Consume<Parse<Syntax>, Trim<S>, HasPending<S>> extends (infer R extends string) ? ("" extends R ? true : true extends PendDone<R> ? true : false) : never;
export type Stuck<U extends string, All extends string = U> = U extends string ? ([All] extends [`${string}${U}`] ? U : never) : never;
export type Unexpected<S extends string> = S extends "" ? "unexpected end" : `unexpected "${Tok1<S>[0]}"`;
export type Valid<P extends keyof Props, S extends string> = ValidIn<P, Props[P], S>;
export type ValidIn<Label extends string, G extends string, S extends string> = MatchesValue<G, S> extends true ? S : S extends CssWide ? S : S extends string ? Message<Label, G, S> : never;
type CssWide = "inherit" | "initial" | "unset" | "revert" | "revert-layer";
export type Hint<P extends string, T extends string> = Offer<P, LastWord<T>>;
type LastWord<T extends string, Head extends string = ""> = T extends `${infer W} ${infer R}` ? LastWord<R, `${Head}${W} `> : [Head, T];
type Offer<P extends string, L> = L extends [infer H extends string, infer W extends string] ? (Keywords extends { [K in P]: infer O; } ? OfferWord<Bucket<O, Lowercase<W>>, H, W> : never) : never;
type Bucket<O, W extends string> = O extends unknown ? (W extends `${infer C}${string}` ? (C extends keyof O ? O[C] : never) : O[keyof O]) : never;
type OfferWord<K, H extends string, W extends string> = K extends string ? (Lowercase<K> extends `${Lowercase<W>}${string}` ? (K extends W ? never : `${H}${K}`) : never) : never;
export type Furthest<P extends keyof Props, S extends string> = FurthestIn<Props[P], S>;
export type FurthestIn<G extends string, S extends string> = Stuck<Trim<S> | Consume<Parse<G>, Trim<S>, HasPending<S>>>;
type Message<Label extends string, G extends string, S extends string> = FurthestIn<G, S> extends (infer F extends string) ? `${Label}: ${Unexpected<F>} in "${S}"${CaseFix<Label, F>}, grammar ${G}` : never;
type CaseFix<Label extends string, F extends string> = Tok1<F>[0] extends (infer W extends string) ? ([W] extends [""] ? "" : Keywords extends { [K in Label]: infer O; } ? FixWord<Bucket<O, Lowercase<W>>, W> extends (infer K extends string) ? ([K] extends [never] ? "" : ` ("${W}" is ${K} in CSS; write "${K}")`) : "" : "") : "";
type FixWord<K, W extends string> = K extends string ? (Lowercase<K> extends Lowercase<W> ? (K extends W ? never : K) : never) : never;
export type PropertyFn<P extends keyof Props> = <const S extends string>(value: Valid<P, S>) => string;
//#endregion