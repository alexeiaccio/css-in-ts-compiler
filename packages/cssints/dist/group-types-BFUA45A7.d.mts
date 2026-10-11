import { $p as Fn, Qp as CheckMath, Xp as Arg, Zp as CheckFn, am as Fallback, cm as Text, em as Result, om as Part, rm as Check, sm as Style, tm as Text$1 } from "./theme-types-DDT3Y9_E.mjs";
import { properties } from "@cssints/css-grammar/mdn";
import { CSSStyleValue } from "@cssints/css-grammar/values";
import { QueryKind, ValidQuery } from "@cssints/css-grammar/query";
//#region src/group-types.d.ts
/**
 * What a group bans. `kw`: by property, its keywords, and `name(` for a function only that property has; `fn`: functions
 * (anywhere); `unit`; `media`, `container`, `supports`: the words of a query (`scroll-state(`).
 */
interface Ban {
  id: string;
  kw: Record<string, string>;
  fn: string;
  unit: string;
  media: string;
  container: string;
  supports: string;
}
type Sep = " " | "," | ")" | "/" | ":" | ";" | '"' | "'" | "<" | ">" | "=" | "+" | "*" | "[" | "]" | "{" | "}" | "!" | "#" | "%" | "." | "⟨" | "⟩" | "&" | "|" | "\n" | "\t";
type Words<S extends string, W extends string = "", Acc extends string = never> = S extends `${infer C}${infer R}` ? C extends "(" ? Words<R, "", Acc | (W extends "" ? never : `${W}(`)> : C extends Sep ? Words<R, "", Acc | W> : Words<R, `${W}${C}`, Acc> : Acc | W;
type Banned<B extends Ban, K extends string> = K | `${B["fn"]}(` | `${number}${B["unit"]}`;
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Seen<B extends Ban, K extends string> = K | `${B["fn"]}(` | `${Digit}${B["unit"]}`;
type Hit<B extends Ban, K extends string, S extends string> = S extends `${string}${Seen<B, K>}${string}` ? Extract<Words<S>, Banned<B, K>> : never;
type Said<T extends string> = T extends `${infer N}(` ? `${N}()` : T;
type Msg<B extends Ban, L extends string, T extends string> = `${L}: "${Said<T>}" is not in cssints/${B["id"]}`;
type KwOf<B extends Ban, P extends string> = P extends keyof B["kw"] ? B["kw"][P] : never;
type Same<A, C> = [A] extends [C] ? ([C] extends [A] ? true : false) : false;
type PartText<P> = P extends Fallback<infer V> ? Text<V[number]> : Text<P>;
type Scan<B extends Ban, K extends string, L extends string, A extends readonly Part[]> = { [I in keyof A]: Hit<B, K, PartText<A[I]>> extends (infer T extends string) ? [T] extends [never] ? A[I] : Msg<B, L, T> : never; };
type Narrow<B extends Ban, P extends string, A extends readonly Part[], C> = Same<A, C> extends true ? Scan<B, KwOf<B, P>, P, A> : C;
/** A property of a group: `Prop` of types.ts, with the group's banned words refused. */
type GProp<B extends Ban, P extends keyof typeof properties, R = Style> = <const A extends readonly Part[]>(...parts: Narrow<B, P, A, Check<P, A>>) => R;
/** `flex` and `grid` of a group: `M` holds the chain methods whose property the group has. */
interface GLayout<B extends Ban, P extends "flex" | "grid", M extends Record<string, keyof typeof properties>> {
  (): GChain<B, M>;
  <const A extends readonly Part[]>(...parts: Narrow<B, P, A, Check<P, A>>): Style;
}
type GChain<B extends Ban, M extends Record<string, keyof typeof properties>> = Style & { readonly [K in keyof M]: GProp<B, M[K], GChain<B, M>>; };
type ScanArgs<B extends Ban, L extends string, A extends readonly Arg[]> = { [I in keyof A]: Hit<B, never, Text$1<A[I]>> extends (infer T extends string) ? [T] extends [never] ? A[I] : Msg<B, L, T> : never; };
type NarrowFn<B extends Ban, L extends string, A extends readonly Arg[], C> = Same<A, C> extends true ? ScanArgs<B, L, A> : C;
/** A css function of a group (`oklch`, `linearGradient`): `Fn` of function-types.ts, its arguments read for banned words. */
type GFn<B extends Ban, N extends string, Sep extends string> = <const A extends readonly Arg[]>(...parts: NarrowFn<B, `${N}()`, A, CheckFn<N, Sep, A>>) => ReturnType<Fn<N, Sep>>;
/** A math function of a group (`calc`, `min`). */
type GMath<B extends Ban, C extends "same" | "number" | "angle"> = <const A extends readonly Arg[]>(...parts: NarrowFn<B, "calc()", A, CheckMath<A>>) => CSSStyleValue<Result<C, A>>;
type Query<B extends Ban, K extends QueryKind> = K extends "media" ? B["media"] : K extends "container" ? B["container"] : B["supports"];
type GQ<B extends Ban, K extends QueryKind, Q extends string> = ValidQuery<K, Q> extends (infer V) ? [V] extends [Q] ? Hit<B, Query<B, K>, Q> extends (infer T extends string) ? [T] extends [never] ? Q : Msg<B, `@${K}`, T> : never : V : never;
/** `media`, `container` and `supports` of a group: `Condition` of css-grammar's query.ts, the media features it bans refused. */
interface GCondition<B extends Ban, K extends QueryKind, R> {
  <const O extends Record<string, string>>(queries: { [P in keyof O]: GQ<B, K, O[P]>; }): { [P in keyof O]: R; };
  <const Q extends readonly [string, string, ...string[]]>(...queries: { [I in keyof Q]: GQ<B, K, Q[I]>; }): { [I in keyof Q]: R; };
  <const Q extends string>(query: GQ<B, K, Q>): R;
}
//#endregion
export { GProp as a, GMath as i, GFn as n, GLayout as r, GCondition as t };