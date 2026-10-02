// What TypeScript sees of createTokens, createGlobalTheme and check (docs/API.md "Themes"): the tokens of a DTCG-shaped
// `const` object, the overrides of a theme typed against them, and the contrast check. Nothing here runs.
import type {
  DTCG_TYPES,
  DtcgType,
  TOKEN_TYPES,
  Syntax,
  Token,
  TokenName,
  TokenType,
  ValidSyntax,
} from "@cssints/css-grammar/token";

import type { QueryWrap } from "./types.ts";

type Component = number | "none";
type FontWeightName =
  | "thin"
  | "hairline"
  | "extra-light"
  | "ultra-light"
  | "light"
  | "normal"
  | "regular"
  | "book"
  | "medium"
  | "semi-bold"
  | "demi-bold"
  | "bold"
  | "extra-bold"
  | "ultra-bold"
  | "black"
  | "heavy"
  | "extra-black"
  | "ultra-black";

/** A DTCG colour: components in the ranges of docs/research/design-tokens.md; `hex` is a fallback and is ignored. */
export interface DtcgColor {
  readonly colorSpace:
    | "srgb"
    | "srgb-linear"
    | "hsl"
    | "hwb"
    | "lab"
    | "lch"
    | "oklab"
    | "oklch"
    | "display-p3"
    | "a98-rgb"
    | "prophoto-rgb"
    | "rec2020"
    | "xyz-d65"
    | "xyz-d50";
  readonly components: readonly [Component, Component, Component];
  readonly alpha?: number;
  readonly hex?: string;
}
export interface DtcgUnit<U extends string> {
  readonly value: number;
  readonly unit: U;
}
/** The object forms of a DTCG `$value` (a CSS string is always allowed, a number for `number` and `fontWeight`). */
export type DtcgValue<D extends DtcgType> = D extends "color"
  ? DtcgColor
  : D extends "dimension"
    ? DtcgUnit<"px" | "rem">
    : D extends "duration"
      ? DtcgUnit<"ms" | "s">
      : D extends "fontWeight"
        ? number | FontWeightName
        : number;

type Kind<D> = D extends DtcgType ? (typeof DTCG_TYPES)[D] : never;
type TypeOf<N, Inherited> = N extends { readonly $type: infer Y } ? Y : Inherited;
// ---------- createTokens

// The token type of the value V of a leaf whose `$type` is Ty (given or inherited); an alias without one takes its target's.
type KindOf<V, Ty, Root> = Ty extends DtcgType
  ? Kind<Ty>
  : V extends `{${infer P}}`
    ? KindAt<Root, P, Root>
    : TokenType;
type KindAt<N, P extends string, Root, Inherited = undefined> = P extends `${infer H}.${infer R}`
  ? H extends keyof N
    ? KindAt<N[H], R, Root, TypeOf<N[H], Inherited>>
    : never
  : P extends keyof N
    ? N[P] extends { readonly $value: infer V }
      ? KindOf<V, TypeOf<N[P], Inherited>, Root>
      : never
    : never;

/** The tokens of a `const` DTCG object: every leaf `{ $value }` is a named token of the type its `$type` maps to. */
export type Tokens<G, Inherited = undefined, Root = G> = {
  readonly [K in keyof G as K extends `$${string}` ? never : K]: G[K] extends {
    readonly $value: infer V;
  }
    ? Token<KindOf<V, TypeOf<G[K], Inherited>, Root>, true>
    : Tokens<G[K], TypeOf<G[K], Inherited>, Root>;
};

// What is wrong with the value V of a leaf, or `true`. The alias target's existence is checked here; its type at build time.
// A message is the type `{ $error: "..." }` that a leaf is intersected with, so it is the text of the error.
type Bad<Why extends string> = { readonly $error: `cssints: ${Why}` };
type Fits<V, R> = [R] extends [V] ? true : Bad<R extends string ? R : "not a value of this type">;
// A derived value is checked as the type's grammar with each reference in place as a value of the target's type.
type Sentinel<K> = K extends TokenType ? `⟨${(typeof TOKEN_TYPES)[K]["sentinels"][0]}⟩` : never;
type Subst<V extends string, Root> = V extends `${infer A}{${infer P}}${infer B}`
  ? [KindAt<Root, P, Root>] extends [never]
    ? never
    : `${A}${Sentinel<KindAt<Root, P, Root>>}${Subst<B, Root>}`
  : V;
type CheckString<
  V extends string,
  Ty extends DtcgType,
  Root,
> = V extends `${string}{${string}}${string}`
  ? [Subst<V, Root>] extends [never]
    ? Bad<"a reference {…} has no token">
    : Fits<Subst<V, Root>, ValidSyntax<Syntax<Kind<Ty>>, Subst<V, Root>>>
  : Ty extends "fontWeight"
    ? V extends FontWeightName
      ? true
      : Fits<V, ValidSyntax<"number", V>>
    : Fits<V, ValidSyntax<Syntax<Kind<Ty>>, V>>;
// A JSON import (`with { type: "json" }`) widens $type to string: its tree is typed, its values are checked at build time.
type CheckValue<V, Ty, Root> = string extends Ty
  ? true
  : V extends `{${infer P}}`
    ? [KindAt<Root, P, Root>] extends [never]
      ? Bad<`no token at ${P}`>
      : true
    : Ty extends DtcgType
      ? V extends string
        ? CheckString<V, Ty, Root>
        : V extends DtcgValue<Ty>
          ? true
          : Bad<`not a DTCG ${Ty}`>
      : Bad<`$type ${Ty extends string ? `"${Ty}"` : "missing"} has no token type (color, dimension, number, duration, fontWeight)`>;
type ValidLeaf<L, Ty, Root> = L extends { readonly $value: infer V }
  ? CheckValue<V, Ty, Root> extends infer R
    ? [R] extends [true]
      ? L
      : R
    : never
  : never;
type ValidGroup<G, Inherited, Root> = {
  [K in keyof G]: K extends `$${string}`
    ? G[K]
    : G[K] extends { readonly $value: unknown }
      ? ValidLeaf<G[K], TypeOf<G[K], Inherited>, Root>
      : ValidGroup<G[K], TypeOf<G[K], Inherited>, Root>;
};

/**
 * Tokens from an inline DTCG-shaped `const` object: `$type` is inherited through groups, a leaf is `{ $value }`, a value is
 * a DTCG value or a CSS string of the type's grammar, an alias is `"{group.token}"`. The variable is the kebab-case path
 * (`--color-bg`), or what the mapper returns for the path.
 */
export declare const createTokens: <const T extends { readonly [name: string]: unknown }>(
  tokens: T & ValidGroup<T, undefined, T>,
  name?: (path: readonly string[]) => string | TokenName,
) => Tokens<T>;
type Kinds = { readonly [K in DtcgType]: (typeof DTCG_TYPES)[K] };
type ObjectValue<K extends TokenType> = K extends Kinds["color"]
  ? DtcgColor
  : K extends Kinds["dimension"]
    ? DtcgUnit<"px" | "rem">
    : K extends Kinds["duration"]
      ? DtcgUnit<"ms" | "s">
      : number;

// ---------- createGlobalTheme

/** The values a theme may set: the paths of the tokens, each a value of the token's type. */
export type Overrides<X> = {
  readonly [K in keyof X]?: X[K] extends { readonly "~token": infer Kd extends TokenType }
    ? string | number | ObjectValue<Kd>
    : Overrides<X[K]>;
};
type CheckOverrides<X, O> = {
  [K in keyof O]: K extends keyof X
    ? X[K] extends { readonly "~token": infer Kd extends TokenType }
      ? O[K] extends string
        ? O[K] extends FontWeightName
          ? O[K]
          : Fits<O[K], ValidSyntax<Syntax<Kd>, O[K]>> extends infer R
            ? [R] extends [true]
              ? O[K]
              : R
            : never
        : O[K]
      : CheckOverrides<X[K], O[K]>
    : Bad<"no token at this path">;
};

/**
 * Re-declares the overridden tokens under a media or container condition (on `:root`), or under a selector, and the
 * aliases that depend on them. An unknown path and a value that is not of the token's type are type errors.
 */
export declare const createGlobalTheme: <const X extends object, const O extends Overrides<X>>(
  tokens: X,
  condition: QueryWrap | string,
  overrides: O & CheckOverrides<X, O>,
) => void;

// ---------- check

/** Build-time checks over tokens. */
export declare const check: {
  /** WCAG 2.x contrast of `fg` on `bg`, for the defaults and every theme that affects either; below `min` is a build error. */
  readonly contrast: (
    fg: Token<"color", boolean>,
    bg: Token<"color", boolean>,
    options: { readonly min: number },
  ) => void;
};
