// What TypeScript sees of "cssints" (the "types" condition of package.json): the build-time members with the
// types they have in user code, where every call is already a class string, because the plugin replaced it.
// The implementation (macro.ts) builds declaration nodes instead; nothing here runs.
import type { properties } from "@cssints/css-grammar/mdn";
import type { Condition, ValidSelector } from "@cssints/css-grammar/query";
import type { StyleObject, TokenFn, TokenSetFn, TokenType } from "@cssints/css-grammar/token";
import type {
  CSS,
  CSSColorValue,
  CSSImageValue,
  CSSStyleValue,
  CSSUnitValue,
} from "@cssints/css-grammar/values";

import type { Alt, Check, Fallback, Part, Style } from "./parts.ts";
import type { ChainMembers } from "./chain-members.ts";
import type { ClassValue } from "./runtime.ts";
import type { layers } from "./theme-types.ts";

export * from "./members.ts";
export * from "./theme-types.ts";
export type { ClassValue } from "./runtime.ts";
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
/**
 * What `sx()` is: a style whose every property is a method, so one style needs no `cn()`. Each method marks the
 * property it set, so setting one twice in a chain is a type error (the later-wins rewrite of `cn()` is `cn()`'s);
 * a shorthand and a longhand of it (`p` then `paddingLeft`) are different properties and stay legal, ordered by the
 * sheet. `bg` and `backgroundColor` are one property, as are `p` and `padding`.
 */
export type ChainStyle = Style & ChainMembers;
/**
 * `sx().flex().bg("red").p(4)`: one style, one class string, no `cn()`. Every property is a method; `.flex()` and
 * `.grid()` with no argument set `display`, with parts they are the property. A chain sets each property once: a second
 * `bg` makes the method `never`, a type error. Merge two chains with `cn()`, which is still the tool for runtime values
 * and variants.
 */
export declare function sx(): ChainStyle;

/** A condition: styles in, the same styles under it out (media(), container(), supports(), hover, ...). */
export type Wrap = (...styles: Style[]) => Style;
/** A condition on the element's own state: the pseudo-class wrappers (`hover`) and `attr(...)`; `within()` takes one. */
export type StateWrap = Wrap & { readonly __state: true };
/** What media() and container() give: a condition that createGlobalTheme takes (a pseudo-class wrapper is not one). */
export type QueryWrap = Wrap & { readonly __query: true };

/** The value a variant takes: its keys, or a boolean when they are only `true` and `false`. */
export type CvValue<V> = [keyof V] extends ["true" | "false"]
  ? boolean
  : `${keyof V & (string | number)}`;
/** The props of a `cv()` function: one optional value per variant. */
export type CvProps<V> = { [K in keyof V]?: CvValue<V[K]> | undefined };
export interface CvConfig<V extends Record<string, Record<string, Style>>> {
  base?: Style;
  variants?: V;
  defaultVariants?: CvProps<NoInfer<V>>;
  /** Styles added when every value named here is active, and that win over the variants they combine. */
  compoundVariants?: (CvProps<NoInfer<V>> & { class: Style })[];
}
/** The value of one variant of an `scv()`: a style for the `base` slot, or a style for each slot it names. */
export type ScvValue<S extends Record<string, Style>> = Style | Partial<Record<keyof S, Style>>;
export interface ScvConfig<
  S extends Record<string, Style>,
  V extends Record<string, Record<string, ScvValue<S>>> = Record<never, never>,
> {
  /** The slots it styles, `base` and the others: a variant value that is a style styles `base`. */
  slots: S;
  variants?: V;
  defaultVariants?: CvProps<NoInfer<V>>;
  /** Styles added when every value named here is active: `class` is the `base` slot, a slot's name styles that slot. */
  compoundVariants?: (CvProps<NoInfer<V>> & { class: Style } & Partial<Record<keyof S, Style>>)[];
}

/**
 * Merges styles into one class string. What is known at build time merges (the later property wins); a runtime value
 * (`on && p(4)`, `props.class`, a state call) is joined when the code runs, and a style in it replaces the classes it
 * overrides while it is active.
 */
export declare function cn(...styles: Style[]): Style;
export declare function cn(...parts: ClassValue[]): string;
/** The name of a `keyframes()` rule: a `<custom-ident>` for `animation` and `animationName`. */
export interface Keyframes extends CSSStyleValue<"custom-ident"> {
  readonly "~keyframes": true;
}
/** The name of a `positionTry()` rule: a `<dashed-ident>` for `positionTryFallbacks`. */
export interface PositionTry extends CSSStyleValue<"dashed-ident"> {
  readonly "~positionTry": true;
}
/** The steps of a `@keyframes` rule: `from`, `to` and percentages, each a style of declarations. */
export interface Steps {
  from?: Style;
  to?: Style;
  [percent: `${number}%`]: Style;
}
/**
 * `keyframes({ from: opacity(0), to: opacity(1) })`: a `@keyframes` rule named by a hash of its content, in the sheet of
 * the modules that use the name. Each step is checked like a class; no conditions.
 */
export declare const keyframes: (steps: Steps) => Keyframes;
/**
 * `positionTry(cn(top("anchor(bottom)"), margin(2)))`: a `@position-try` rule, in the sheet of the modules that use its
 * name. Only inset, margin, sizing, self-alignment, `position-anchor` and `position-area` are allowed (a build error).
 * `position-try` is also a property: with value parts (`positionTry("flip-block")`) it is that shorthand, as before.
 */
export declare const positionTry: ((style: Style) => PositionTry) & Prop<"position-try">;
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
/** An attribute or a group name: no space, brackets, quotes, `=`, `.` or `#` (the build checks the rest). */
type Name<N extends string> = N extends
  | ""
  | `${string}${" " | "[" | "]" | "=" | '"' | "'" | "." | "#"}${string}`
  ? `"${N}" is not a name`
  : N;
export type AttrOp = "=" | "~=" | "|=" | "^=" | "$=" | "*=";
/**
 * `attr("aria-current", "page")(color(...))` is `._x[aria-current="page"]`; no value is `[disabled]`. The value is
 * quoted for you. `op` is how the value is compared: `=` (default), `~=` (a word), `|=`, `^=`, `$=`, `*=`. One condition.
 */
export declare const attr: {
  <const N extends string>(name: Name<N>): StateWrap;
  <const N extends string>(name: Name<N>, value: string, op?: AttrOp): StateWrap;
};
/**
 * `group()` is the marker class `_g` for the element whose state `within()` reads; `group("row")` is `_g-row`, for a
 * nested group. It has no CSS of its own.
 */
export declare const group: <const N extends string = never>(name?: Name<N>) => Style;
/**
 * `within(hover)(color("red"))` is the style while a marked ancestor is hovered: `:where(._g:hover) ._x`, one class of
 * specificity, one condition. `within(hover, "row")` reads the `group("row")` ancestor.
 */
export declare const within: <const N extends string = never>(
  state: StateWrap,
  name?: Name<N>,
) => Wrap;
/**
 * `global(":root", media(dark)(colorScheme("dark")))`: a rule with no class, in layer `_.k`, in the sheet of the module
 * that calls it. The selector is a `<complex-selector-list>` (the build reads it, the types check the brackets and
 * quotes); the styles are plain declarations, under media(), container() or supports() if you like.
 */
export declare const global: <const S extends string>(
  selector: ValidSelector<S>,
  ...styles: Style[]
) => void;
/** `token.<type>(initial, name?)`: a Typed OM value of the type, `var(--name)`. With a name it can be set. */
export declare const token: { readonly [K in TokenType]: TokenFn<K> } & {
  readonly set: TokenSetFn;
};
/** css values (declarations, no conditions) and `token.set()` results, as an inline `style` object. */
export declare const style: (...styles: (Style | StyleObject)[]) => StyleObject;
/** The plugin replaces the call by a runtime function of class strings: `button({ size: "lg" })` gives the class names. */
export declare const cv: <V extends Record<string, Record<string, Style>> = Record<never, never>>(
  config: CvConfig<V>,
) => (props?: CvProps<V>) => string;

/** The plugin replaces the call by one runtime function per slot: `button({ size: "lg" })` gives each slot's classes. */
export declare const scv: <
  S extends Record<string, Style>,
  V extends Record<string, Record<string, ScvValue<S>>> = Record<never, never>,
>(
  config: ScvConfig<S, V>,
) => (props?: CvProps<V>) => { [K in keyof S]: string };

export declare const css: typeof import("./members.ts") & {
  cn: typeof cn;
  firstThatWorks: typeof firstThatWorks;
  keyframes: typeof keyframes;
  positionTry: typeof positionTry;
  media: typeof media;
  container: typeof container;
  supports: typeof supports;
  attr: typeof attr;
  group: typeof group;
  within: typeof within;
  global: typeof global;
  layers: typeof layers;
  token: typeof token;
  style: typeof style;
  cv: typeof cv;
  scv: typeof scv;
  CSS: typeof CSS;
  CSSColorValue: typeof CSSColorValue;
  CSSImageValue: typeof CSSImageValue;
  CSSStyleValue: typeof CSSStyleValue;
  CSSUnitValue: typeof CSSUnitValue;
};
export {
  CSS,
  CSSColorValue,
  CSSImageValue,
  CSSStyleValue,
  CSSUnitValue,
} from "@cssints/css-grammar/values";
