import { Consume, Matches, Parse, Stuck, Unexpected } from "./css.mjs";
//#region src/query.d.ts
export declare const ENTRY: {
  readonly media: "media-query-list";
  readonly container: "container-condition";
  readonly supports: "supports-condition";
};
export type QueryKind = keyof typeof ENTRY;
type Sp<S extends string> = Colon<S> extends (infer C extends string) ? Slash<C> : never;
type Colon<S extends string> = S extends `${infer A}:${infer B}` ? `${A} : ${Colon<B>}` : S;
type Slash<S extends string> = S extends `${infer A}/${infer B}` ? `${A} / ${Slash<B>}` : S;
type Trim<S extends string> = S extends ` ${infer R}` ? Trim<R> : S;
/** The query, or a message naming the bad token and the grammar (as `Valid` does for a property). */
export type ValidQuery<K extends QueryKind, S extends string> = Matches<`<${(typeof ENTRY)[K]}>`, Sp<S>> extends true ? S : S extends string ? Message<K, (typeof ENTRY)[K], S> : never;
type Message<K extends string, E extends string, S extends string> = `@${K}: ${Unexpected<Stuck<Trim<Sp<S>> | Consume<Parse<`<${E}>`>, Trim<Sp<S>>>>>} in "${S}", grammar <${E}>`;
type Check<K extends QueryKind, Q extends readonly string[]> = { [I in keyof Q]: ValidQuery<K, Q[I]>; };
/**
 * A condition constructor: an object of queries gives an object of `R`, several queries a tuple of `R`, one query `R`.
 * The one-query overload comes last: when nothing fits, TypeScript shows the message of the last overload, and the
 * bad query of a single string is the common case. A bad query of an object is marked in place.
 */
export interface Condition<K extends QueryKind, R> {
  <const O extends Record<string, string>>(queries: { [P in keyof O]: ValidQuery<K, O[P]>; }): { [P in keyof O]: R; };
  <const Q extends readonly [string, string, ...string[]]>(...queries: Check<K, Q>): { [I in keyof Q]: R; };
  <const Q extends string>(query: ValidQuery<K, Q>): R;
}
type Open = {
  ")": "(";
  "]": "[";
};
type Balanced<S extends string, Stack extends string = ""> = S extends `${infer C}${infer R}` ? C extends "(" | "[" ? Balanced<R, `${C}${Stack}`> : C extends ")" | "]" ? Stack extends `${Open[C]}${infer Rest}` ? Balanced<R, Rest> : false : C extends '"' | "'" ? R extends `${string}${C}${infer After}` ? Balanced<After, Stack> : false : Balanced<R, Stack> : Stack extends "" ? true : false;
/** The selector of `global()`, or a message: not empty, brackets and quotes balanced. */
export type ValidSelector<S extends string> = Trim<S> extends "" ? "global(): the selector is empty" : Balanced<S> extends true ? S : `global(): unbalanced brackets or quotes in "${S}"`;
//#endregion