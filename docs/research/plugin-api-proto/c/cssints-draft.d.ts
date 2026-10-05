// DRAFT of what "cssints" (types.ts) gains. Everything else is the repo's types.ts, re-exported untouched.
//   1. layers(...names): declare top-level named layers, in order; the handles are what `{ layer }` takes.
//   2. createGlobalTheme(..., { layer?, scope? }): the runtime already takes `layer`; the type did not. `scope` is new.
// The checks of the overrides (CheckOverrides and what it needs) are copied from theme-types.ts, where they are not
// exported: the real change exports `ThemeArgs` from there instead of copying.
import type { Syntax, TOKEN_TYPES, TokenType, ValidSyntax } from "@cssints/css-grammar/token";
import type { QueryWrap } from "cssints/internal/types";
import type { Overrides } from "cssints/internal/theme-types";

export * from "cssints/internal/types";

/** A top-level layer declared by `layers()`: it ranks above the engine's own layers, in the order it was declared. */
export interface LayerName<N extends string = string> {
  readonly "~layer": N;
}
/**
 * `const L = layers("app", "author", "viewer")`: `@layer app, author, viewer;` after the engine's layers. Calling it
 * again with the same names is fine; another order is a build error. `L.app` goes in `{ layer }` of a theme.
 */
export declare const layers: <const N extends readonly [string, ...string[]]>(
  ...names: N
) => { readonly [K in N[number]]: LayerName<K> };

export interface ThemeOptions {
  /** A declared layer for the rule (`@layer app { … }`). Without it the rule is in `_.k`. */
  layer?: LayerName;
  /** A subtree: the rule is wrapped in `@scope (<scope>) { … }`, so a look cannot repaint what is outside it. */
  scope?: string;
}

type FontWeightName = "normal" | "bold" | "light";
type Bad<Why extends string> = { readonly $error: `cssints: ${Why}` };
type Fits<V, R> = [R] extends [V] ? true : Bad<R extends string ? R : "not a value of this type">;
type Sentinel<K> = K extends TokenType ? `⟨${(typeof TOKEN_TYPES)[K]["sentinels"][0]}⟩` : never;
type KindIn<X, P extends string> = P extends `${infer H}.${infer R}`
  ? H extends keyof X
    ? KindIn<X[H], R>
    : never
  : P extends keyof X
    ? X[P] extends { readonly "~token": infer Kd extends TokenType }
      ? Kd
      : never
    : never;
type SubstIn<V extends string, X> = V extends `${infer A}{${infer P}}${infer B}`
  ? [KindIn<X, P>] extends [never]
    ? never
    : `${A}${Sentinel<KindIn<X, P>>}${SubstIn<B, X>}`
  : V;
type CheckRefs<V extends string, Kd extends TokenType, X> = V extends `{${infer P}}`
  ? [KindIn<X, P>] extends [never]
    ? Bad<`a reference {${P}} has no token`>
    : [KindIn<X, P>] extends [Kd]
      ? V
      : Bad<`{${P}} is a ${KindIn<X, P>}, not a ${Kd}`>
  : [SubstIn<V, X>] extends [never]
    ? Bad<"a reference {…} has no token">
    : Fits<SubstIn<V, X>, ValidSyntax<Syntax<Kd>, SubstIn<V, X>>> extends infer R
      ? [R] extends [true]
        ? V
        : R
      : never;
type CheckOverrides<X, O, Root = X> = {
  [K in keyof O]: K extends keyof X
    ? X[K] extends { readonly "~token": infer Kd extends TokenType }
      ? O[K] extends string
        ? O[K] extends FontWeightName
          ? O[K]
          : O[K] extends `${string}{${string}}${string}`
            ? CheckRefs<O[K], Kd, Root>
            : Fits<O[K], ValidSyntax<Syntax<Kd>, O[K]>> extends infer R
              ? [R] extends [true]
                ? O[K]
                : R
              : never
        : O[K]
      : CheckOverrides<X[K], O[K], Root>
    : Bad<"no token at this path">;
};
/** What `overrides` is in `createGlobalTheme(tokens, cond, overrides)`: a plugin that forwards it says `Themed<X, O>`. */
export type Themed<X, O> = O & CheckOverrides<X, O>;

export declare const createGlobalTheme: <const X extends object, const O extends Overrides<X>>(
  tokens: X,
  condition: QueryWrap | string,
  overrides: Themed<X, O>,
  options?: ThemeOptions,
) => void;
