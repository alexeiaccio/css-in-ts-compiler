// DRAFT B: the whole of "cssints/plugin" is one function, `member`, and its types. Nothing here runs (as author-types.ts).
// In the repo the two imports below are "./parts.ts" and "./theme-types.ts" (CheckOverrides exported).
import type { CSSStyleValue } from "@cssints/css-grammar/values";

import type { CheckIn, Part, Style } from "/Users/a.tukachev/github/css-in-ts-compiler/packages/cssints/src/parts.ts";
import type { CheckOverrides } from "./theme-types.ts";

export type { Part, Style };

/** A feature of `@mdn/browser-compat-data`: `css.at-rules.container.style_queries_for_custom_properties`. */
export type BcdKey = `css.${string}`;

/** One element family of a runtime: the nearest marker ancestor's computed `read` is copied into `write`. */
export interface ParentVar {
  marker: "&";
  read: `--${string}`;
  write: `--${string}`;
  watch?: `--${string}`;
}
/** What a browser that lacks `polyfills` gets (delivered by targets, never by use). */
export interface Runtime {
  polyfills: BcdKey[];
  parentVars?: ParentVar[];
  css?: string;
}
/** A build error when one `cn()` holds the kernel's marker and a property listed here. */
export interface Conflict {
  props: (string | RegExp)[];
  message: string;
}
/**
 * Global CSS bound to a class. `&` is the marker class (the engine derives it from the member's id and this CSS) and
 * `--_x` a custom property private to the member (the engine prefixes it); the rule is registered by content, once
 * per build, and the marker is printed wherever the member is used.
 */
export interface Kernel {
  css: string;
  atProperty?: string;
  requires?: (BcdKey | { key: BcdKey; exact: true })[];
  runtime?: Runtime;
  conflicts?: Conflict;
}
/** A rule that is not a class: `layer` a top-level layer, `null` verbatim at the top, omitted `_.k`. Registered by content. */
export interface Global {
  css: string;
  layer?: string | null;
}
/** What a call contributes to the style it becomes. */
export interface Emit {
  /** Declarations: custom properties (`--_x` is the member's own), or properties checked as `css.*` are. */
  decls?: { readonly [property: string]: string };
  kernel?: Kernel;
  globals?: readonly Global[];
}

// ---------- the argument language: one value describes both the build-time check and the types
/**
 * What a call takes. (CSS leaves of an object are checked at build time and are `string` in the types, keyword leaves
 * are their union; leaves of a tuple are checked in the types too.) A string is a CSS value (mdn syntax; `x | <step>` also takes a lone number as a spacing step):
 * written as parts, joined by a space. A tuple is positional arguments, an object one structured argument (`"key?"`
 * is optional; a trailing object with no required key may be left out). Two leaves are not CSS: `"@tokens"` is a
 * token set (`createTokens`), `"@overrides"` values for the tokens of the nearest `"@tokens"` before it, by path.
 */
export type Spec = string | readonly Spec[] | { readonly [key: string]: Spec };

type Bare<G extends string> = G extends `${infer A} | <step>` ? A : G;
type Step<G extends string> = G extends `${string} | <step>` ? true : false;
type Kw<G extends string> = G extends `${string}<${string}` | `${string}(${string}` | `${string}[${string}`
  ? string
  : G extends `${infer A} | ${infer B}`
    ? A | Kw<B>
    : G;
type Req<S> = { [K in keyof S as K extends `${string}?` ? never : K]: Val<S[K]> };
type Opt<S> = { [K in keyof S as K extends `${infer N}?` ? N : never]?: Val<S[K]> };
type Flat<T> = { [K in keyof T]: T[K] } & {};
/** What `emit` gets for a spec: the checked values as text, a token as `var(--name)`, `"@overrides"` as `--name: value`. */
export type Val<S> = [Spec] extends [S]
  ? unknown
  : S extends "@tokens"
  ? object
  : S extends "@overrides"
    ? Record<`--${string}`, string>
    : S extends string
      ? Kw<Bare<S>>
      : S extends readonly unknown[]
        ? { -readonly [K in keyof S]: Val<S[K]> }
        : Flat<Req<S> & Opt<S>>;
type Params<S> = (
  undefined extends S
    ? []
    : S extends string
      ? [value: Val<S>]
      : S extends readonly unknown[]
        ? Val<S>
        : [value: Val<S>]
) extends infer P extends unknown[]
  ? P
  : never;

// ---------- the call a spec makes (what user code sees)
type Tail<A extends readonly unknown[]> = A extends readonly [unknown, ...infer R] ? R : [];
type TokensIn<S extends readonly unknown[], A extends readonly unknown[]> = S extends readonly [
  infer H,
  ...infer R,
]
  ? H extends "@tokens"
    ? A[0]
    : TokensIn<R, Tail<A>>
  : never;
type Arity<S extends readonly unknown[]> = S extends readonly [...infer R, infer L]
  ? {} extends Val<L>
    ? [...{ [K in keyof R]: unknown }, unknown?]
    : { [K in keyof S]: unknown }
  : [];
type One<L extends string, S, X, T> = S extends "@tokens"
  ? X extends object
    ? X
    : "expected a token set (createTokens)"
  : S extends "@overrides"
    ? [T] extends [never]
      ? "@overrides needs a @tokens before it"
      : X & CheckOverrides<T, X>
    : S extends string
      ? X extends Part
        ? CheckIn<L, Bare<S>, Step<S>, [X]>[0]
        : "expected a value"
      : S extends readonly unknown[]
        ? never
        : Val<S>;
type All<L extends string, S extends readonly unknown[], A extends readonly unknown[], T> = {
  [K in keyof A]: K extends keyof S ? One<L, S[K], A[K], T> : A[K];
};
/** The call of a member (or of a method of one) with arguments `S`, giving `R`. */
export type Call<L extends string, S, R> = undefined extends S
  ? () => R
  : S extends string
    ? <const A extends readonly Part[]>(...parts: CheckIn<L, Bare<S>, Step<S>, A>) => R
    : S extends readonly unknown[]
      ? <const A extends Arity<S>>(...args: All<L, S, A, TokensIn<S, A>>) => R
      : (arg: Val<S>) => R;

// ---------- methods and results
/** A method of a chain: CSS arguments (a string, or positional strings), what it emits, and the methods that cannot follow it. */
export interface StepIn {
  args?: string | readonly string[];
  emit: (...values: string[]) => Emit;
  excludes?: readonly string[];
}
type ArgsOf<X> = X extends { args: infer A } ? A : undefined;
type ExclOf<X> = X extends { excludes: readonly (infer E)[] } ? (string extends E ? never : E) : never;
/** The chain a member gives: each method once, and the ones it excludes leave with it. */
export type Chain<N extends string, M> = Style & {
  readonly [K in keyof M & string]: Call<`${N}.${K}`, ArgsOf<M[K]>, Chain<N, Omit<M, K | ExclOf<M[K]>>>>;
};
type Callable = (...args: never) => unknown;
type Gives<R, N extends string, M> = R extends Callable
  ? R
  : R extends string | CSSStyleValue
    ? R
    : string extends keyof M
      ? Style
      : Chain<N, M>;
type Returned<E> = E extends Callable ? ReturnType<E> : E;

/**
 * A member of a plugin: one call that covers a chained context (`frame()`), a typed function that makes a style
 * (`icons()`), a value function (`tint()`), a typed property, a call with structured arguments (`look()`).
 *
 * - `name`: the label of its errors and of the type-level messages; the engine qualifies it with the package it is written
 *   in, and derives every global name (marker, private custom properties, keys, runtime) from that.
 * - `args`: see `Spec`. Absent: the call takes nothing.
 * - `emit`: runs at build time with the checked values. It returns an `Emit` (the call is a style), a string or a Typed
 *   OM value (the call is a value part, as `fn()` was), or another member (the call is a factory, as `icons()` is).
 *   An `Emit` object stands for a function that returns it.
 * - `then`: chain methods, each `{ args?, emit, excludes? }`, used once each.
 */
export declare function member<
  const N extends string,
  const M extends { readonly [method: string]: StepIn },
  const S extends Spec | undefined,
  const E extends
    | Emit
    | ((...values: Params<S>) => Emit | string | CSSStyleValue | Callable),
>(def: {
  name: N;
  args?: S;
  emit: E;
  then?: M;
}): Call<N, S, Gives<Returned<E>, N, M>>;
