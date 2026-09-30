// What TypeScript sees of "cssints" (the "types" condition of package.json): the build-time members with the
// types they have in user code, where every call is already a class string, because the plugin replaced it.
// The implementation (macro.ts) builds declaration nodes instead; nothing here runs.
import type { Valid } from "@cssints/css-grammar/css";
import type { properties } from "@cssints/css-grammar/mdn";
import type { Condition } from "@cssints/css-grammar/query";
import type { StyleObject, TokenFn, TokenSetFn, TokenType } from "@cssints/css-grammar/token";
import type { CSS, CSSColorValue, CSSStyleValue, CSSUnitValue } from "@cssints/css-grammar/values";

import type { CvRuntimeConfig } from "./runtime.ts";

export * from "./members.ts";
export * from "./theme-types.ts";
export { _cv, cx, type ClassValue, type CvRuntimeConfig } from "./runtime.ts";

/** A value part: a string, a Typed OM value, or a lone number (the spacing scale in spacing properties). */
export type Part = string | number | CSSStyleValue;
/** What every member returns: a class string. It is a string (`className`, `cx`), but only members make one. */
export type Style = string & { readonly __cssints: "style" };

// A part is text for the recognizer; a Typed OM value is the sentinel `⟨type⟩` (css.ts). A lone number is a spacing
// step (`⟨length⟩`) in the properties lib.ts scales, and a CSS <number> everywhere else. A style is no value.
type Text<P> = P extends Style
  ? "⟨style⟩"
  : P extends string
    ? P
    : P extends number
      ? `${P}`
      : P extends CSSStyleValue<infer T>
        ? `⟨${T}⟩`
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
// On failure every part's parameter type becomes the Valid message, so the error lands on the first argument.
type Check<P extends keyof typeof properties, A extends readonly Part[]> =
  Valid<P, Value<P, A>> extends infer V
    ? V extends Value<P, A>
      ? A
      : A extends readonly []
        ? [value: V]
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
