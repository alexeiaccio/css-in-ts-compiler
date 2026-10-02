// What TypeScript sees of "cssints" (the "types" condition of package.json): the build-time members with the
// types they have in user code, where every call is already a class string, because the plugin replaced it.
// The implementation (macro.ts) builds declaration nodes instead; nothing here runs.
import type { properties } from "@cssints/css-grammar/mdn";
import type { Condition } from "@cssints/css-grammar/query";
import type { StyleObject, TokenFn, TokenSetFn, TokenType } from "@cssints/css-grammar/token";
import type { CSS, CSSColorValue, CSSUnitValue } from "@cssints/css-grammar/values";

import type { Alt, Check, Fallback, Part, Style } from "./parts.ts";
import type { CvRuntimeConfig } from "./runtime.ts";

export * from "./members.ts";
export * from "./theme-types.ts";
export { _cv, cx, type ClassValue, type CvRuntimeConfig } from "./runtime.ts";
export type { Fallback, Part, Style };

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
