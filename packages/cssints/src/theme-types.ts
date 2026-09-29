// What TypeScript sees of createTokens, createGlobalTheme and check (docs/API.md "Themes"): the tokens of a DTCG-shaped
// `const` object, the overrides of a theme typed against them, and the contrast check. Nothing here runs.
import type {
  DTCG_TYPES,
  DtcgType,
  Syntax,
  Token,
  TokenName,
  TokenType,
  ValidSyntax,
} from "@cssints/css-grammar/token";

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

// What is wrong with the value V of a leaf, or V itself. The alias target's existence is checked here; its type at build time.
type Bad<Why extends string> = `cssints: ${Why}`;
type CheckValue<V, Ty, Root> = V extends `{${infer P}}`
  ? [KindAt<Root, P, Root>] extends [never]
    ? Bad<`no token at ${P}`>
    : V
  : Ty extends DtcgType
    ? V extends string
      ? Ty extends "fontWeight"
        ? V extends FontWeightName
          ? V
          : ValidSyntax<"number", V>
        : ValidSyntax<Syntax<Kind<Ty>>, V>
      : V extends DtcgValue<Ty>
        ? V
        : Bad<`not a DTCG ${Ty}`>
    : Bad<`$type ${Ty extends string ? `"${Ty}"` : "missing"} has no token type (color, dimension, number, duration, fontWeight)`>;
type ValidLeaf<L, Ty, Root> = {
  [P in keyof L]: P extends "$value" ? CheckValue<L[P], Ty, Root> : L[P];
};
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
