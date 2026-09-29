/* oxlint-disable */
// Type-level half of the plugin contract, over the existing recognizer (packages/css-grammar/src/css.ts).
// Matches<Syntax, S> is already generic in the grammar string, so a plugin's `as const` grammar feeds it directly.
// Only the label of the error message is new (css.ts `Valid` is tied to keyof Props).
import type { Matches } from "../../../../packages/css-grammar/src/css.ts";
import type { CSSStyleValue } from "../../../../packages/css-grammar/src/values.ts";

type Part = string | CSSStyleValue;
type Text<P> = P extends string ? P : P extends CSSStyleValue<infer T> ? `⟨${T}⟩` : never;
type Join<A extends readonly Part[]> = A extends readonly [
  infer H,
  ...infer R extends readonly Part[],
]
  ? R extends readonly []
    ? Text<H>
    : `${Text<H>} ${Join<R>}`
  : "";
type Check<Label extends string, G extends string, A extends readonly Part[]> =
  Matches<G, Join<A>> extends true
    ? A
    : { [K in keyof A]: `${Label}: "${Join<A>}" does not match ${G}` };

export type Decl = readonly [prop: string, value: string];
export interface Style {
  readonly __cssints: readonly Decl[];
  readonly markers: readonly string[];
  readonly kernels: readonly string[];
}

// ---- property(): a grammar-only registration; the declaration passes through as `name: value`
export declare function property<const N extends string, const G extends string>(
  name: N,
  grammar: G,
): <const A extends readonly Part[]>(...parts: Check<N, G, A>) => Style;

// ---- context(): a chaining context like flex() / grid(); each method is one grammar and one emit
export interface MethodDef<G extends string = string> {
  grammar: G;
  emit(value: string): readonly Decl[];
}
export declare function method<const G extends string>(def: MethodDef<G>): MethodDef<G>;
type Chain<M extends Record<string, MethodDef>, Used extends string = never> = Style & {
  [K in Exclude<keyof M & string, Used>]: <const A extends readonly Part[]>(
    ...parts: Check<`${K}()`, M[K]["grammar"], A>
  ) => Chain<M, Used | K>;
};
export declare function context<const M extends Record<string, MethodDef>>(
  name: string,
  methods: M,
): () => Chain<M>;

// ---- style(): a function whose parameters are grammars (icons: one <string>)
export declare function style<const G extends string>(
  name: string,
  grammar: G,
  build: (value: string) => Style,
): <const A extends readonly Part[]>(...parts: Check<`${typeof name}()`, G, A>) => Style;
