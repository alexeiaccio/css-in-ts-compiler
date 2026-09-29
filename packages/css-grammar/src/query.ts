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

// On failure every part becomes the first message, so the error lands on the first argument (as api-typed.ts).
type First<K extends QueryKind, Q extends readonly string[]> = Q extends readonly [
  infer H extends string,
  ...infer R extends readonly string[],
]
  ? ValidQuery<K, H> extends H
    ? First<K, R>
    : ValidQuery<K, H>
  : never;
type Check<K extends QueryKind, Q extends readonly string[]> = [First<K, Q>] extends [never]
  ? Q
  : { [I in keyof Q]: First<K, Q> };
// One query, or an object of them (a bad one is marked in place).
type One<K extends QueryKind, A> = A extends string
  ? ValidQuery<K, A>
  : A extends Record<string, string>
    ? { [P in keyof A]: ValidQuery<K, A[P]> }
    : never;

/** A condition constructor: one query gives `R`, several give a tuple of `R`, an object of queries an object of `R`. */
export interface Condition<K extends QueryKind, R> {
  <const A extends string | Record<string, string>>(
    query: One<K, A>,
  ): A extends string ? R : { [P in keyof A]: R };
  <const Q extends readonly [string, string, ...string[]]>(
    ...queries: Check<K, Q>
  ): { [I in keyof Q]: R };
}
