// Query strings of media(), container() and supports(), against the condition grammars in mdn.ts: the type-level
// check (`ValidQuery`, `Condition`). Its runtime twin is `checkQueryNow` in check.ts. Types only, apart from ENTRY.
//
// The grammars want `:` and `/` as tokens of their own (`<mf-plain>` is `<mf-name> : <mf-value>`), while a query writes
// `(width:40rem)` and `16/9`. Both sides space them out first; the lexer and the recognizer stay as they are.
import type { Consume, Matches, Parse, Stuck, Unexpected } from "./css";

export const ENTRY = {
  media: "media-query-list",
  container: "container-condition",
  supports: "supports-condition",
} as const;
export type QueryKind = keyof typeof ENTRY;

type Sp<S extends string> = Colon<S> extends infer C extends string ? Slash<C> : never;
type Colon<S extends string> = S extends `${infer A}:${infer B}` ? `${A} : ${Colon<B>}` : S;
type Slash<S extends string> = S extends `${infer A}/${infer B}` ? `${A} / ${Slash<B>}` : S;
type Trim<S extends string> = S extends ` ${infer R}` ? Trim<R> : S;

/** The query, or a message naming the bad token and the grammar (as `Valid` does for a property). */
export type ValidQuery<K extends QueryKind, S extends string> =
  Matches<`<${(typeof ENTRY)[K]}>`, Sp<S>> extends true
    ? S
    : S extends string
      ? Message<K, (typeof ENTRY)[K], S>
      : never;
type Message<
  K extends string,
  E extends string,
  S extends string,
> = `@${K}: ${Unexpected<Stuck<Trim<Sp<S>> | Consume<Parse<`<${E}>`>, Trim<Sp<S>>>>>} in "${S}", grammar <${E}>`;

// Each query is checked alone, so the error lands on the bad one.
type Check<K extends QueryKind, Q extends readonly string[]> = {
  [I in keyof Q]: ValidQuery<K, Q[I]>;
};
/**
 * A condition constructor: an object of queries gives an object of `R`, several queries a tuple of `R`, one query `R`.
 * The one-query overload comes last: when nothing fits, TypeScript shows the message of the last overload, and the
 * bad query of a single string is the common case. A bad query of an object is marked in place.
 */
export interface Condition<K extends QueryKind, R> {
  <const O extends Record<string, string>>(queries: { [P in keyof O]: ValidQuery<K, O[P]> }): {
    [P in keyof O]: R;
  };
  <const Q extends readonly [string, string, ...string[]]>(
    ...queries: Check<K, Q>
  ): {
    [I in keyof Q]: R;
  };
  <const Q extends string>(query: ValidQuery<K, Q>): R;
}
