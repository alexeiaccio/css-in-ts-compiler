// Type-level recognizer: does the string literal S belong to the language of an mdn-data value
// definition syntax? Grammar strings are taken verbatim from mdn-data (see mdn.ts).
//
// Two rules keep tsc happy: (1) no token arrays and no `[...Acc, x]` spreads over long lists, the parser
// reads the grammar string directly and builds cons lists; (2) every recursive alias is either
// tail-recursive or guarded by the indexed-object trick so TS defers it.
import type { properties, syntaxes } from "./mdn";

type Props = typeof properties;
type Syns = typeof syntaxes;

// ---------------------------------------------------------------- lexer: one token at a time

type Ws = " " | "\n" | "\t";
type Trim<S extends string> = S extends `${Ws}${infer R}` ? Trim<R> : S;
type Special = "(" | ")" | "[" | "]" | "|" | "&" | "?" | "*" | "+" | "#" | "!" | "," | "/" | "{" | "}" | "<" | ">" | "'" | Ws;
type WordChar =
  | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "-" | "_";
type StripRange<T extends string> = T extends `${infer N} [${string}` ? N : T;
type IsWord<W extends string> = W extends "" ? false : W extends `${string}${Special}${string}` ? false : true;
type Word<S extends string, Acc extends string = ""> =
  S extends `${infer C}${infer R}` ? (C extends WordChar ? Word<R, `${Acc}${C}`> : [Acc, S]) : [Acc, ""];

type Tok =
  | { t: "type"; v: string } | { t: "prop"; v: string } | { t: "kw"; v: string } | { t: "fn"; v: string }
  | { t: "range"; lo: string; hi: string } | { t: "p"; v: string } | { t: "lit"; v: string } | { t: "eof" };

// Next<S> = [token, rest]
type Next<S extends string> =
  S extends "" ? [{ t: "eof" }, ""]
  : S extends `${Ws}${infer R}` ? Next<R>
  : S extends `<'${infer P}'>${infer R}` ? [{ t: "prop"; v: P }, R]
  : S extends `<${infer T}>${infer R}` ? [{ t: "type"; v: StripRange<T> }, R]
  : S extends `||${infer R}` ? [{ t: "p"; v: "||" }, R]
  : S extends `&&${infer R}` ? [{ t: "p"; v: "&&" }, R]
  : S extends `{${infer B}}${infer R}` ? (B extends `${infer Lo},${infer Hi}` ? [{ t: "range"; lo: Lo; hi: Hi extends "" ? "∞" : Hi }, R] : [{ t: "range"; lo: B; hi: B }, R])
  : S extends `${infer C extends "[" | "]" | ")" | "|" | "?" | "*" | "+" | "#" | "!" | "," | "/"}${infer R}` ? [{ t: "p"; v: C }, R]
  : S extends `${infer W} ${infer R}` ? (IsWord<W> extends true ? [{ t: "kw"; v: W }, R] : NextWord<S>)
  : IsWord<S> extends true ? [{ t: "kw"; v: S }, ""]
  : NextWord<S>;
// A bare "(" and quoted literals like '+' are rare, so they are tried only here, off the hot path of Next.
type NextWord<S extends string> =
  Word<S> extends [infer W extends string, infer R extends string]
    ? W extends "" ? (S extends `(${infer R2}` ? [{ t: "p"; v: "(" }, R2] : S extends `'${infer Q}'${infer R2}` ? [{ t: "lit"; v: Q }, R2] : [{ t: "eof" }, ""]) : R extends `(${infer R2}` ? [{ t: "fn"; v: W }, R2] : [{ t: "kw"; v: W }, R]
    : never;

// ---------------------------------------------------------------- parser  (alt < or(||) < and(&&) < seq < term+mult)
// Alternatives are cons lists ["alt", head, tail | null] built tail-recursively (order is irrelevant).

type Node =
  | ["kw", string] | ["type", string] | ["prop", string] | ["fn", string, Node] | ["lit", string]
  | ["alt", Node, Node | null] | ["or", Node[]] | ["and", Node[]] | ["seq", Node[]]
  | ["opt", Node] | ["star", Node] | ["plus", Node] | ["list", Node] | ["rep", Node, string, string] | ["bang", Node];

export type Parse<S extends string> = ParseAlt<S> extends [infer N, any] ? N : never;

type ParseAlt<S extends string> = ParseOr<S> extends [infer N extends Node, infer R extends string] ? AltRest<R, ["alt", N, null]> : never;
type AltRest<S extends string, Acc extends Node> =
  Next<S> extends [{ t: "p"; v: "|" }, infer R extends string]
    ? (ParseOr<R> extends [infer N extends Node, infer R2 extends string] ? AltRest<R2, ["alt", N, Acc]> : never)
    : [Acc extends ["alt", infer Only, null] ? Only : Acc, S];

type ParseOr<S extends string> = ParseAnd<S> extends [infer N extends Node, infer R extends string] ? OrRest<R, [N]> : never;
type OrRest<S extends string, Acc extends Node[]> =
  Next<S> extends [{ t: "p"; v: "||" }, infer R extends string]
    ? (ParseAnd<R> extends [infer N extends Node, infer R2 extends string] ? OrRest<R2, [...Acc, N]> : never)
    : [Acc extends [infer Only] ? Only : ["or", Acc], S];

type ParseAnd<S extends string> = ParseSeq<S> extends [infer N extends Node, infer R extends string] ? AndRest<R, [N]> : never;
type AndRest<S extends string, Acc extends Node[]> =
  Next<S> extends [{ t: "p"; v: "&&" }, infer R extends string]
    ? (ParseSeq<R> extends [infer N extends Node, infer R2 extends string] ? AndRest<R2, [...Acc, N]> : never)
    : [Acc extends [infer Only] ? Only : ["and", Acc], S];

type ParseSeq<S extends string, Acc extends Node[] = []> =
  Next<S> extends [{ t: "eof" } | { t: "p"; v: "|" | "||" | "&&" | "]" | ")" }, any]
    ? [Acc extends [infer Only] ? Only : ["seq", Acc], S]
    : ParseTerm<S> extends [infer N extends Node, infer R extends string] ? ParseSeq<R, [...Acc, N]> : never;

type ParseTerm<S extends string> =
  Next<S> extends [infer T extends Tok, infer R extends string]
    ? T extends { t: "p"; v: "[" } ? (ParseAlt<R> extends [infer N extends Node, infer R2 extends string] ? (Next<R2> extends [{ t: "p"; v: "]" }, infer R3 extends string] ? Mult<N, R3> : never) : never)
    : T extends { t: "fn"; v: infer V extends string } ? FnArgs<V, R>
    : T extends { t: "p"; v: "(" } ? FnArgs<"", R>
    : T extends { t: "type"; v: infer V extends string } ? Mult<["type", V], R>
    : T extends { t: "prop"; v: infer V extends string } ? Mult<["prop", V], R>
    : T extends { t: "kw"; v: infer V extends string } ? Mult<["kw", V], R>
    : T extends { t: "p"; v: infer V extends "," | "/" } ? Mult<["lit", V], R>
    : T extends { t: "lit"; v: infer V extends string } ? Mult<["lit", V], R>
    : never
  : never;

// `name( args )`; a bare `( args )` group is a function with an empty name.
type FnArgs<V extends string, S extends string> =
  ParseAlt<S> extends [infer N extends Node, infer R extends string] ? (Next<R> extends [{ t: "p"; v: ")" }, infer R2 extends string] ? Mult<["fn", V, N], R2> : never) : never;
// `X#{A,B}` is `X [ , X ]{A-1,B-1}`
type Dec = { "1": "0"; "2": "1"; "3": "2"; "4": "3"; "6": "5"; "16": "15"; "∞": "∞" };

type Mult<N, S extends string> =
  Next<S> extends [infer T extends Tok, infer R extends string]
    ? T extends { t: "p"; v: "?" } ? Mult<["opt", N], R>
    : T extends { t: "p"; v: "*" } ? Mult<["star", N], R>
    : T extends { t: "p"; v: "+" } ? Mult<["plus", N], R>
    : T extends { t: "p"; v: "#" } ? Mult<["list", N], R>
    : T extends { t: "p"; v: "!" } ? Mult<["bang", N], R>
    : T extends { t: "range"; lo: infer Lo extends string; hi: infer Hi extends string }
      ? Mult<N extends ["list", infer X extends Node] ? ["seq", [X, ["rep", ["seq", [["lit", ","], X]], Dec[Lo & keyof Dec], Dec[Hi & keyof Dec]]]] : ["rep", N, Lo, Hi], R>
    : [N, S]
  : never;

// ---------------------------------------------------------------- value recognizer
// Consume<N, S> = union of possible remainders after N matched a prefix of S. S is left-trimmed.

// A value token ends at a space, a comma or a ")"; the rest keeps the separator.
type Tok1<S extends string> = S extends `${infer T} ${infer R}` ? Split<T, ` ${R}`> : Split<S, "">;
type Split<T extends string, R extends string> = T extends `${string}${"," | ")"}${string}` ? SplitComma<T, R> : [T, R];
type SplitComma<T extends string, R extends string> = T extends `${infer A},${infer B}` ? SplitParen<A, `,${B}${R}`> : SplitParen<T, R>;
type SplitParen<T extends string, R extends string> = T extends `${infer A})${infer B}` ? [A, `)${B}${R}`] : [T, R];

type LengthUnit = "px" | "em" | "rem" | "vw" | "vh" | "vmin" | "vmax" | "ch" | "ex" | "lh" | "rlh" | "cm" | "mm" | "in" | "pt" | "pc" | "q"
  | "svw" | "svh" | "lvw" | "lvh" | "dvw" | "dvh" | "cqw" | "cqh" | "cqi" | "cqb" | "cqmin" | "cqmax" | "ic" | "cap" | "rex" | "rch" | "ric" | "rcap";
type PrimitiveMap = {
  length: `${number}${LengthUnit}` | "0" | "⟨length⟩";
  percentage: `${number}%` | "⟨percentage⟩";
  "length-percentage": `${number}${LengthUnit}` | "0" | `${number}%` | "⟨length⟩" | "⟨percentage⟩";
  number: `${number}` | "⟨number⟩";
  integer: `${bigint}`;
  "hex-color": `#${string}`;
  "custom-ident": string; // minus NotIdent, see Consume
  ident: string; // minus NotIdentStart
  "ident-token": string; // minus NotIdentStart
  "dashed-ident": `--${string}`;
  angle: `${number}${"deg" | "rad" | "grad" | "turn"}`;
  time: `${number}${"s" | "ms"}`;
  resolution: `${number}${"dpi" | "dpcm" | "dppx" | "x"}`;
  flex: `${number}fr`;
  zero: "0" | "+0" | "-0"; // the twin also takes 0.0 and 0e5
  "hash-token": `#${string}`;
  "intrinsic-size-keyword": "min-content" | "max-content" | "fit-content" | "stretch";
  x: `${number}`;
  y: `${number}`;
  dimension: `${number}${LengthUnit | "deg" | "rad" | "grad" | "turn" | "s" | "ms" | "hz" | "khz" | "dpi" | "dpcm" | "dppx" | "x" | "fr"}`;
};
// What an ident cannot be: an ASCII character that is not a letter, digit, `_` or `-` anywhere in it (the twin
// takes every non-ASCII one), a digit or `-digit` first, or `-` alone. A <custom-ident> is also not a CSS-wide keyword
// or `default`. The twin checks the same with one regexp.
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type NotIdentChar = "'" | '"' | "#" | "." | "+" | "(" | "!" | "$" | "%" | "&" | "*" | "/" | ":" | ";" | "<" | "=" | ">" | "?" | "@" | "[" | "\\" | "]" | "^" | "`" | "{" | "|" | "}" | "~";
type NotIdentStart = `${string}${NotIdentChar}${string}` | `${Digit | `-${Digit}`}${string}` | "-";
type NotIdent = NotIdentStart | "initial" | "inherit" | "unset" | "revert" | "revert-layer" | "default";

export type Consume<N, S extends string> =
  S extends string
    ? N extends ["kw", infer V extends string] ? (Tok1<S> extends [V, infer R extends string] ? Trim<R> : never)
    : N extends ["lit", infer V extends string] ? (S extends `${V}${infer R}` ? Trim<R> : never)
    : N extends ["type", infer V extends string]
      ? V extends keyof PrimitiveMap ? (Tok1<S> extends [infer T extends string, infer R extends string] ? (T extends "" ? never : T extends PrimitiveMap[V] ? (V extends "custom-ident" ? (Lowercase<T> extends NotIdent ? never : Trim<R>) : V extends "ident" | "ident-token" ? (T extends NotIdentStart ? never : Trim<R>) : Trim<R>) : never) : never)
      : V extends "string" | "url" | "declaration-value" ? Scanned<V, S>
      // <declaration> alternates over every property: types take it as balanced tokens, the twin checks it at build time
      : V extends "declaration" ? Scanned<"declaration-value", S>
      // `<name()>`: the name must be next before its grammar is even parsed (keeps <color> cheap)
      : V extends keyof Syns ? (V extends `${infer F}()` ? (S extends `${F}(${string}` ? Consume<Parse<Syns[V]>, S> : never) : S extends `⟨${V}⟩${infer R}` ? Trim<R> : Consume<Parse<Syns[V]>, S>) // typed value sentinel (api-typed.ts)
      : never
    : N extends ["prop", infer V extends string] ? (V extends keyof Props ? Consume<Parse<Props[V]>, S> : never)
    : N extends ["fn", infer F extends string, infer A] ? (S extends `${F}(${infer R}` ? Close<Consume<A, Trim<R>>> : never)
    : N extends ["alt", any, any] ? ConsumeAlt<N, S>
    : N extends ["seq", infer Xs extends Node[]] ? SeqRest<Xs, S, never, never, never>
    : N extends ["opt", infer X] ? S | Consume<X, S>
    : N extends ["star", infer X] ? Star<X, S>
    : N extends ["plus", infer X] ? Star<X, Consume<X, S>>
    : N extends ["list", infer X] ? ListRest<X, Consume<X, S>>
    : N extends ["rep", infer X, infer Lo extends string, infer Hi extends string] ? Rep<X, S, Lo, Hi>
    : N extends ["or", infer Xs extends Node[]] ? AnyOrder<Xs, S, false>
    : N extends ["and", infer Xs extends Node[]] ? AnyOrder<Xs, S, true>
    : N extends ["bang", infer X] ? Exclude<Consume<X, S>, S> // `[ ... ]!`: the group must not be empty
    : never
  : never;

// Unconstrained on purpose, like Mult's N: a constraint makes tsc expand the argument when it checks the
// declaration (~1 k instantiations each, paid by every program).
type Close<R> = R extends `)${infer Q}` ? Trim<Q> : never;

// The primitives that are not one token, like `Scan` in twin-core.ts (escapes ignored). A url is `url(`, a quoted
// string or an unquoted run without spaces, quotes and parentheses, `)`.
type Scanned<V extends string, S extends string> = V extends "string" ? Quoted<S> : V extends "url" ? UrlRest<S> : Declaration<S, S, []>;
type Quoted<S extends string> =
  S extends `"${string}"${infer R}` ? Trim<R> : S extends `'${string}'${infer R}` ? Trim<R> : never;
type UrlRest<S extends string> =
  S extends `url(${infer B})${infer R}` ? (UrlBody<TrimEnd<Trim<B>>> extends true ? Trim<R> : never) : never;
type UrlBody<B extends string> =
  B extends `"${infer Q}"` ? (Q extends `${string}"${string}` ? false : true)
  : B extends `'${infer Q}'` ? (Q extends `${string}'${string}` ? false : true)
  : B extends `${string}${Ws | '"' | "'" | "(" | "\\"}${string}` ? false : true;
type TrimEnd<S extends string> = S extends `${infer R}${Ws}` ? TrimEnd<R> : S;
// <declaration-value>: characters up to the unmatched `)` (returned with it) or the end, brackets balanced by depth
// D, strings skipped, no top-level `;` or `!`, not empty. S left-trimmed, so Rest = S means nothing was consumed.
type Declaration<S extends string, Rest extends string, D extends 0[]> =
  Rest extends `${infer C}${infer R}`
    ? C extends '"' | "'" ? (R extends `${string}${C}${infer R2}` ? Declaration<S, R2, D> : never)
    : C extends "(" | "[" | "{" ? Declaration<S, R, [...D, 0]>
    : C extends ")" | "]" | "}" ? (D extends [0, ...infer D2 extends 0[]] ? Declaration<S, R, D2> : C extends ")" ? (Rest extends S ? never : Rest) : never)
    : C extends ";" | "!" ? (D extends [] ? never : Declaration<S, R, D>)
    : Declaration<S, R, D>
    : D extends [] ? (Rest extends S ? never : "") : never;

// tail-recursive walk of the alt cons list
type ConsumeAlt<N, S extends string, Acc = never> =
  N extends ["alt", infer H, infer T] ? ConsumeAlt<T, S, Acc | Consume<H, S>> : Acc;
// Seq with comma omission (CSS Values 4 §2.6.1), same as twin.ts `seq`: a `,` is skipped for the remainders in
// Start (nothing consumed since the seq start or the previous comma; never before the first term). When every
// later term is nullable it may also end the seq (Done), and a consumed comma then needs something after it
// (Moved is banned). One Consume reference only: each generic one costs ~1.3 k instantiations at declaration.
type Nullable = ["opt", any] | ["star", any] | ["rep", any, "0", string];
type SeqRest<Xs extends Node[], S extends string, Start extends string, Moved extends string, Done extends string> =
  Xs extends [infer H, ...infer R extends Node[]]
    ? H extends ["lit", ","]
      ? (AfterComma<Exclude<S, Start>> extends infer After extends string
          ? R extends [Nullable, ...Nullable[]]
            ? SeqRest<R, Extract<S, Start> | After, Extract<S, Start> | After, After, Done | Exclude<S, Start>>
            : SeqRest<R, Extract<S, Start> | After, Extract<S, Start> | After, Moved, Done>
          : never)
      : SeqRest<R, Consume<H, S>, [Start] extends [never] ? S : Start, Moved, Done>
    : Exclude<S, Moved> | Done;
type AfterComma<S extends string> = S extends `,${infer Q}` ? Trim<Q> : never;

// Recursive helpers use the indexed-object trick, and compare the depth tuple by pattern (`D extends Full`),
// never `D["length"] extends 8`: that one resolves eagerly to the recursive arm because its constraint is number.
type Full = [0, 0, 0, 0, 0, 0, 0, 0, ...0[]];
type Star<X, S extends string, D extends any[] = []> = {
  done: S;
  next: S | Star<X, Consume<X, S>, [...D, 0]>;
}[D extends Full ? "done" : "next"];

type ListRest<X, R extends string, D extends any[] = []> = {
  done: R;
  next: R | (R extends `,${infer Q}` ? ListRest<X, Consume<X, Trim<Q>>, [...D, 0]> : never);
}[D extends Full ? "done" : "next"];

type Digits = { "0": []; "1": [0]; "2": [0, 0]; "3": [0, 0, 0]; "4": [0, 0, 0, 0]; "5": [0, 0, 0, 0, 0]; "6": [0, 0, 0, 0, 0, 0]; "15": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; "∞": [0, 0, 0, 0, 0, 0, 0, 0] };
type Rep<X, S extends string, Lo extends string, Hi extends string> = RepN<X, S, Digits[Lo & keyof Digits], Digits[Hi & keyof Digits], []>;
type RepN<X, S extends string, Lo extends any[], Hi extends any[], I extends any[]> = {
  done: S;
  next: (I extends [...Lo, ...any] ? S : never) | RepN<X, Consume<X, S>, Lo, Hi, [...I, 0]>;
}[I["length"] extends Hi["length"] ? "done" : "next"];

// || (All=false: at least one part) and && (All=true: every part), any order, each part at most once.
// `[S] extends [never]`: a part that failed left nothing to continue from. Without this stop, a failed part still
// recursed through every permutation of the others (font-variant "none": 4.3 M instantiations and TS2589).
type AnyOrder<Xs extends Node[], S extends string, All extends boolean> = [S] extends [never] ? never : Xs extends [] ? S : TryEach<Xs, Xs, S, All, []>;
type TryEach<Parts extends Node[], Todo extends Node[], S extends string, All extends boolean, I extends any[]> =
  Todo extends [infer H, ...infer R extends Node[]]
    ? (Consume<H, S> extends infer R1 extends string
        ? (All extends true ? never : R1) | AnyOrder<RemoveAt<Parts, `${I["length"]}`>, R1, All>
        : never) | TryEach<Parts, R, S, All, [...I, 0]>
    : never;
type RemoveAt<T extends any[], K extends string, I extends any[] = [], Acc extends any[] = []> =
  T extends [infer H, ...infer R] ? (`${I["length"]}` extends K ? [...Acc, ...R] : RemoveAt<R, K, [...I, 0], [...Acc, H]>) : Acc;

// ---------------------------------------------------------------- public

export type Matches<Syntax extends string, S extends string> = "" extends Consume<Parse<Syntax>, Trim<S>> ? true : false;

// Furthest point the value reached: every remainder is a suffix of S, the shortest one is a suffix of all.
export type Stuck<U extends string, All extends string = U> = U extends string ? ([All] extends [`${string}${U}`] ? U : never) : never;
export type Unexpected<S extends string> = S extends "" ? "unexpected end" : `unexpected "${Tok1<S>[0]}"`;
// On failure the parameter type becomes a message literal naming the bad token, the property and its grammar
// (twin.ts `valid` says the same and adds what was expected at that point).
// `S extends string ?` defers the message while S is still generic; without it tsc runs Consume over the
// generic S once per property (+21 k instantiations each, measured; with it +5 k, and nothing per call).
export type Valid<P extends keyof Props, S extends string> = Matches<Props[P], S> extends true ? S : S extends string ? Message<P, S> : never;
type Message<P extends keyof Props, S extends string> =
  `${P}: ${Unexpected<Stuck<Trim<S> | Consume<Parse<Props[P]>, Trim<S>>>>} in "${S}", grammar ${Props[P]}`;
export type PropertyFn<P extends keyof Props> = <const S extends string>(value: Valid<P, S>) => string;
