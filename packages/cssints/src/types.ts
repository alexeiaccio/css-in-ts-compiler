// What TypeScript sees of "cssints" (the "types" condition of package.json): the build-time members with the
// types they have in user code, where every call is already a class string, because the plugin replaced it.
// The implementation (macro.ts) builds declaration nodes instead; nothing here runs.
import type { Furthest, Hint, Valid } from "@cssints/css-grammar/css";
import type { properties } from "@cssints/css-grammar/mdn";
import type { Condition } from "@cssints/css-grammar/query";
import type { StyleObject, TokenFn, TokenSetFn, TokenType } from "@cssints/css-grammar/token";
import type { CSS, CSSColorValue, CSSStyleValue, CSSUnitValue } from "@cssints/css-grammar/values";

import type { CvRuntimeConfig } from "./runtime.ts";

export * from "./members.ts";
export * from "./theme-types.ts";
export { _cv, cx, type ClassValue, type CvRuntimeConfig } from "./runtime.ts";

/** One value of a `firstThatWorks`: a string or a Typed OM value (a token). */
type Alt = string | CSSStyleValue;
/** What firstThatWorks() gives: its values, the wanted one first. A part of a property, not a Typed OM value. */
export interface Fallback<V extends readonly Alt[] = readonly Alt[]> {
  readonly __fallback: V;
}
/** A value part: a string, a Typed OM value, a `firstThatWorks`, or a lone number (the spacing scale in spacing properties). */
export type Part = string | number | CSSStyleValue | Fallback;
/** What every member returns: a class string. It is a string (`className`, `cx`), but only members make one. */
export type Style = string & { readonly __cssints: "style" };

// A part is text for the recognizer; a Typed OM value is the sentinel `⟨type⟩` (css.ts). A lone number is a spacing
// step (`⟨length⟩`) in the properties lib.ts scales, and a CSS <number> everywhere else. A style is no value.
type Text<P> = P extends Style
  ? "⟨style⟩"
  : P extends string
    ? P extends ""
      ? "⟨empty⟩"
      : P
    : P extends number
      ? `${P}`
      : P extends CSSStyleValue<infer T>
        ? `⟨${T}⟩`
        : P extends Fallback<infer V>
          ? Text<V[0]>
          : never;
type Join<A extends readonly Part[]> = A extends readonly [
  infer H,
  ...infer R extends readonly Part[],
]
  ? R extends readonly []
    ? Text<H>
    : `${Text<H>} ${Join<R>}`
  : "";
type Spacing = "padding" | "margin" | "inset" | "gap" | "row-gap" | "column-gap";
type Value<P, A extends readonly Part[]> = A extends readonly [number]
  ? P extends Spacing | `${Spacing}-${string}`
    ? "⟨length⟩"
    : Join<A>
  : Join<A>;
// On failure the bad part's parameter type becomes the Valid message, so the error lands on that argument: the
// first part whose end is at or past the furthest point the grammar reached (`Furthest`, the start of the bad token).
type Bad<
  A extends readonly Part[],
  Pre extends string,
  Seen extends string = "",
  I extends 0[] = [],
> = A extends readonly [infer H, ...infer R extends readonly Part[]]
  ? (Seen extends "" ? Text<H> : `${Seen} ${Text<H>}`) extends infer J extends string
    ? J extends `${Pre}${string}`
      ? `${I["length"]}`
      : Bad<R, Pre, J, [...I, 0]>
    : never
  : "0";
// A firstThatWorks is checked as the wanted value (its Text), and each other value is checked in the same declaration:
// the text before it, the value, the text after it. A bad one puts the message on that part. One per declaration.
type Others<
  P extends keyof typeof properties,
  Vs extends readonly Part[],
  Pre extends string,
  Suf extends string,
> = Vs extends readonly [infer H, ...infer T extends readonly Part[]]
  ? `${Pre}${Text<H>}${Suf}` extends infer S extends string
    ? Valid<P, S> extends infer V
      ? V extends S
        ? Others<P, T, Pre, Suf>
        : V
      : never
    : never
  : true;
type Alts<
  P extends keyof typeof properties,
  A extends readonly Part[],
  Rest extends readonly Part[] = A,
  Pre extends string = "",
  I extends 0[] = [],
> = Rest extends readonly [infer H, ...infer R extends readonly Part[]]
  ? H extends Fallback<infer Vs extends readonly [Alt, ...Alt[]]>
    ? [Extract<R[number], Fallback>] extends [never]
      ? Vs extends readonly [unknown, ...infer O extends readonly Part[]]
        ? Others<P, O, Pre, R extends readonly [] ? "" : ` ${Join<R>}`> extends infer M
          ? M extends true
            ? A
            : { [K in keyof A]: K extends `${I["length"]}` ? M : A[K] }
          : never
        : A
      : {
          [K in keyof A]: K extends `${I["length"]}` ? "firstThatWorks: one per declaration" : A[K];
        }
    : Alts<P, A, R, `${Pre}${Text<H>} `, [...I, 0]>
  : A;
type Check<P extends keyof typeof properties, A extends readonly Part[]> =
  Valid<P, Value<P, A>> extends infer V
    ? V extends Value<P, A>
      ? A[number] extends string | number | CSSStyleValue
        ? A
        : Alts<P, A>
      : A extends readonly []
        ? [value: V]
        : Locate<P, A, V, Value<P, A>>
    : never;
type Locate<P extends keyof typeof properties, A extends readonly Part[], V, S extends string> =
  Furthest<P, S> extends infer F extends string
    ? S extends `${infer Pre}${F}`
      ? {
          [K in keyof A]: K extends Bad<A, Pre>
            ? V | Hint<P, A[K] extends string ? A[K] : never>
            : A[K];
        }
      : { [K in keyof A]: V }
    : never;

/** One property: parts are checked against its mdn grammar; `R` is what the call gives (a chain method: the chain). */
export type Prop<P extends keyof typeof properties, R = Style> = <const A extends readonly Part[]>(
  ...parts: Check<P, A>
) => R;
/** `flex` and `grid`: no argument is the layout context (`display`, chaining `M`), parts are the property of that name. */
export interface Layout<
  P extends "flex" | "grid",
  M extends Record<string, keyof typeof properties>,
> {
  /** The layout context: sets `display` and chains its container properties. */
  (): Chain<M>;
  /** The shorthand property of this name: parts are checked against its mdn grammar. A plain style, it does not chain. */
  <const A extends readonly Part[]>(...parts: Check<P, A>): Style;
}
/** A style you can chain container properties on (flex() and grid()), and use as a class string. `M`: method -> property. */
export type Chain<M extends Record<string, keyof typeof properties>> = Style & {
  readonly [K in keyof M]: Prop<M[K], Chain<M>>;
};

/** A condition: styles in, the same styles under it out (media(), container(), supports(), hover, ...). */
export type Wrap = (...styles: Style[]) => Style;
/** What media() and container() give: a condition that createGlobalTheme takes (a pseudo-class wrapper is not one). */
export type QueryWrap = Wrap & { readonly __query: true };

export interface CvConfig {
  base?: Style;
  variants?: Record<string, Record<string, Style>>;
  defaultVariants?: Record<string, string>;
}

export declare const cn: (...styles: Style[]) => Style;
/**
 * `minHeight(firstThatWorks("100dvh", "100vh"))`: the value you want, then what to use where it fails. A part of any
 * property; the build emits one class with all the declarations, the wanted one last. Each value is checked for the property.
 */
export declare const firstThatWorks: <const V extends readonly [Alt, Alt, ...Alt[]]>(
  ...values: V
) => Fallback<V>;
/** Query strings are checked against the mdn-data grammar: `media("(width >= 40rem)")`. Several give a tuple, an object an object. */
export declare const media: Condition<"media", QueryWrap>;
export declare const container: Condition<"container", QueryWrap>;
export declare const supports: Condition<"supports", Wrap>;
/** `token.<type>(initial, name?)`: a Typed OM value of the type, `var(--name)`. With a name it can be set. */
export declare const token: { readonly [K in TokenType]: TokenFn<K> } & {
  readonly set: TokenSetFn;
};
/** css values (declarations, no conditions) and `token.set()` results, as an inline `style` object. */
export declare const style: (...styles: (Style | StyleObject)[]) => StyleObject;
/** The plugin replaces the call by the runtime config that `_cv` takes. */
export declare const cv: (config: CvConfig) => CvRuntimeConfig;

export declare const css: typeof import("./members.ts") & {
  cn: typeof cn;
  firstThatWorks: typeof firstThatWorks;
  media: typeof media;
  container: typeof container;
  supports: typeof supports;
  token: typeof token;
  style: typeof style;
  cv: typeof cv;
  CSS: typeof CSS;
  CSSColorValue: typeof CSSColorValue;
  CSSUnitValue: typeof CSSUnitValue;
};
export { CSS, CSSColorValue, CSSUnitValue } from "@cssints/css-grammar/values";
