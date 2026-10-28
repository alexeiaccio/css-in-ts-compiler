// What TypeScript sees of createTokens, createGlobalTheme and check (docs/API.md "Themes"): the tokens of a DTCG-shaped
// `const` object, the overrides of a theme typed against them, and the contrast check. Nothing here runs.
import type {
  DTCG_TYPES,
  DtcgType,
  TOKEN_TYPES,
  Token,
  TokenName,
  TokenType,
  ValidSyntax,
  ValidToken,
} from "@cssints/css-grammar/token";

import type { ValidSelector } from "@cssints/css-grammar/query";

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
export type DtcgCubicBezier = readonly [number, number, number, number];
/** A DTCG shadow: a colour and four dimensions, each a DTCG value or a CSS string. */
export interface DtcgShadow {
  readonly color: DtcgColor | string;
  readonly offsetX: DtcgUnit<"px" | "rem"> | string;
  readonly offsetY: DtcgUnit<"px" | "rem"> | string;
  readonly blur: DtcgUnit<"px" | "rem"> | string;
  readonly spread: DtcgUnit<"px" | "rem"> | string;
  readonly inset?: boolean;
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
        : D extends "cubicBezier"
          ? DtcgCubicBezier
          : D extends "shadow"
            ? DtcgShadow | readonly DtcgShadow[]
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
      : N[P] extends string | number
        ? KindOf<N[P], Inherited, Root>
        : never
    : never;

// The definition's value as text: a string as written (an alias keeps its `{path}`), a number or a { value, unit } as its CSS
// text, a colour object (or a JSON import's widened value) as `string`.
type Text<V> = V extends string
  ? V
  : V extends number
    ? `${V}`
    : V extends { readonly value: infer N extends number; readonly unit: infer U extends string }
      ? `${N}${U}`
      : string;
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

/**
 * The tokens of a `const` DTCG object: every leaf is a named token of the type its `$type` maps to, carrying the definition's
 * value as text. A leaf is `{ $value }`, or the value itself (a string or a number) when the group's `$type` is in scope. A
 * key that starts with a digit is read as `_<key>` (`t.space._2xs`).
 */
export type Tokens<G, Inherited = undefined, Root = G> = {
  readonly [K in keyof G as K extends `$${string}`
    ? never
    : K extends `${Digit}${string}`
      ? `_${K}`
      : K]: G[K] extends {
    readonly $value: infer V;
  }
    ? Token<KindOf<V, TypeOf<G[K], TypeOf<G, Inherited>>, Root>, true, Text<V>>
    : G[K] extends string | number
      ? Token<KindOf<G[K], TypeOf<G, Inherited>, Root>, true, Text<G[K]>>
      : Tokens<G[K], TypeOf<G, Inherited>, Root>;
};

// What is wrong with the value V of a leaf, or `true`. The alias target's existence is checked here; its type at build time.
// A message is the type `{ $error: "..." }` that a leaf is intersected with, so it is the text of the error.
type Bad<Why extends string> = { readonly $error: `cssints: ${Why}` };
type Fits<V, R> = [R] extends [V] ? true : Bad<R extends string ? R : "not a value of this type">;
// A value of a token type. A hex colour, one word after `#`, is a `<color>` without the walk of every colour syntax:
// ~7k instantiations a value, which a palette of hundreds pays per token (TS2589 at ~5M); the build checks the digits.
type Valid<Kd extends TokenType, V extends string> = Kd extends "color"
  ? V extends `#${string}${" " | "," | "(" | ")" | "/"}${string}`
    ? ValidToken<Kd, V>
    : V extends `#${string}`
      ? V
      : ValidToken<Kd, V>
  : ValidToken<Kd, V>;
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
    : Fits<Subst<V, Root>, Valid<Kind<Ty>, Subst<V, Root>>>
  : Ty extends "fontWeight"
    ? V extends FontWeightName
      ? true
      : Fits<V, ValidSyntax<"number", V>>
    : Fits<V, Valid<Kind<Ty>, V>>;
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
      : Bad<`$type ${Ty extends string ? `"${Ty}"` : "missing"} has no token type (color, dimension, number, duration, fontWeight, cubicBezier, shadow)`>;
type ValidLeaf<L, Ty, Root> = L extends { readonly $value: infer V }
  ? CheckValue<V, Ty, Root> extends infer R
    ? [R] extends [true]
      ? L
      : R
    : never
  : never;
// A leaf written as its value: a string or a number under a `$type`, checked like the `$value` of a `{ $value }` leaf. With
// no `$type` in scope there is nothing to check it as (DTCG never guesses), so it is the error; a JSON import widens `$type`
// to `string`, and there the build checks it.
type ValidBare<V extends string | number, Ty, Root> = [Ty] extends [DtcgType]
  ? CheckValue<V, Ty, Root> extends infer R
    ? [R] extends [true]
      ? V
      : R
    : never
  : [Ty] extends [string]
    ? V
    : Bad<"a value needs a $type in its group">;
type ValidGroup<G, Inherited, Root> = {
  [K in keyof G]: K extends `$${string}`
    ? G[K]
    : G[K] extends { readonly $value: unknown }
      ? ValidLeaf<G[K], TypeOf<G[K], TypeOf<G, Inherited>>, Root>
      : G[K] extends string | number
        ? ValidBare<G[K], TypeOf<G, Inherited>, Root>
        : ValidGroup<G[K], TypeOf<G, Inherited>, Root>;
};

/**
 * Tokens from an inline DTCG-shaped `const` object: `$type` is inherited through groups, a leaf is `{ $value }` or, when a
 * `$type` is in scope, the value itself (`bg: "#ffffff"`), a value is a DTCG value or a CSS string of the type's grammar, an
 * alias is `"{group.token}"`. The variable is the kebab-case path (`--color-bg`), or what the mapper returns for the path.
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
      : K extends Kinds["cubicBezier"]
        ? DtcgCubicBezier
        : K extends Kinds["shadow"]
          ? DtcgShadow | readonly DtcgShadow[]
          : number;

// ---------- createGlobalTheme

/**
 * The values a theme may set: the paths of the tokens, each a value of the token's type, or a DTCG leaf `{ $value }` (the
 * file of another mode, whose `$type` and `$extensions` are skipped). A token `_500` is also `500`, as in the data.
 */
export type Overrides<X> = {
  readonly [K in keyof X as
    | K
    | (K extends `_${infer D extends `${Digit}${string}`}` ? D : never)]?: X[K] extends {
    readonly "~token": infer Kd extends TokenType;
  }
    ? string | number | ObjectValue<Kd> | { readonly $value: unknown }
    : Overrides<X[K]>;
};
// The token type at the dotted path P of the tokens X, or never.
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
// A value with references: a whole-value one is a token of the same type, else the value is the type's grammar with each
// reference in place as a value of its target's type (as Subst does for createTokens). References are paths of `tokens`.
type CheckRefs<V extends string, Kd extends TokenType, X> = V extends `{${infer P}}`
  ? [KindIn<X, P>] extends [never]
    ? Bad<`a reference {${P}} has no token`>
    : [KindIn<X, P>] extends [Kd]
      ? V
      : Bad<`{${P}} is a ${KindIn<X, P>}, not a ${Kd}`>
  : [SubstIn<V, X>] extends [never]
    ? Bad<"a reference {…} has no token">
    : Fits<SubstIn<V, X>, Valid<Kd, SubstIn<V, X>>> extends infer R
      ? [R] extends [true]
        ? V
        : R
      : never;
type CheckOverride<T, V, Root> = T extends { readonly "~token": infer Kd extends TokenType }
  ? V extends string
    ? V extends FontWeightName
      ? V
      : V extends `${string}{${string}}${string}`
        ? CheckRefs<V, Kd, Root>
        : Fits<V, Valid<Kd, V>> extends infer R
          ? [R] extends [true]
            ? V
            : R
          : never
    : V
  : CheckOverrides<T, V, Root>;
export type CheckOverrides<X, O, Root = X> = {
  [K in keyof O]: K extends `$${string}`
    ? O[K]
    : K extends keyof X
      ? CheckOverride<X[K], O[K], Root>
      : K extends `${Digit}${string}`
        ? `_${K}` extends keyof X
          ? CheckOverride<X[`_${K}`], O[K], Root>
          : Bad<"no token at this path">
        : Bad<"no token at this path">;
};

/**
 * Re-declares the overridden tokens under a media or container condition (on `:root`), or under a selector, and the
 * aliases that depend on them. An unknown path and a value that is not of the token's type are type errors.
 * `layer` puts the rule in a top-level layer that `layers()` declares (the build checks that it does); `scope` (with a
 * selector) confines it to a subtree: `@scope (<scope>) { ... }`.
 */
export declare const createGlobalTheme: <
  const X extends object,
  const O extends Overrides<X>,
  const S extends string,
>(
  tokens: X,
  condition: QueryWrap | string,
  overrides: O & CheckOverrides<X, O>,
  options?: { readonly layer?: string; readonly scope?: ValidSelector<S> },
) => void;

/**
 * Declares top-level layers in order, printed once after the engine's own (`@layer app, author, viewer;`), so what is in
 * them beats the engine's `:root` fallbacks; `{ before: true }` at the end prints them before the engine's, below every
 * class (`layers("reset", { before: true })`). A theme's `layer` and a plugin's rules must name a declared layer. The
 * same names again are fine; the same names in another order, or both before and after, are a build error.
 */
export declare const layers: (
  ...names:
    | readonly [string, ...string[]]
    | readonly [string, ...string[], { readonly before: boolean }]
) => void;

// ---------- check

/** Build-time checks over tokens. */
export declare const check: {
  /**
   * WCAG 2.x contrast of `fg` on `bg`, for the defaults and every theme that affects either; below `min` is a build error.
   * A token from a JSON import has every type to the editor, so it fits; the build checks it is a colour.
   */
  readonly contrast: <F extends TokenType, B extends TokenType>(
    fg: Token<F, boolean> & ColourOrAny<F>,
    bg: Token<B, boolean> & ColourOrAny<B>,
    options: { readonly min: number },
  ) => void;
};
type ColourOrAny<K extends TokenType> = "color" extends K ? unknown : never;
