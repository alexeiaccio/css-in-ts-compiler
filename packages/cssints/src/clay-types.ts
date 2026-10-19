// What TypeScript sees of "cssints/clay" (clay.ts): the members of a Clay layout, typed by plain unions (pixels for
// lengths, the keywords Clay has) and, for a colour, the web's `color` grammar. A property Clay cannot do has no member.
// In user code every call is already the object literal the plugin put there.
import type { Check, Part } from "./parts.ts";
import type { CheckOverrides, Overrides } from "./theme-types.ts";

export { createTokens } from "./theme-types.ts";

/** A number of pixels, or `"Npx"`. */
export type Px = number | `${number}px`;
/** Pixels, `N%` of the parent, `auto` (Clay's FIT) or `stretch` (Clay's GROW). */
export type Size = Px | `${number}%` | "auto" | "stretch";
export type Align = "flex-start" | "start" | "center" | "flex-end" | "end";

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}
interface Axis {
  type: "FIT" | "GROW" | "PERCENT" | "FIXED";
  min?: number;
  max?: number;
  percent?: number;
}
interface Sides {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
/** The fields of `Clay_ElementDeclaration`, and of `Clay_TextElementConfig` under `text`. */
export interface ClayFields {
  layout?: {
    sizing?: { width?: Axis; height?: Axis };
    padding?: Sides;
    childGap?: number;
    childAlignment?: { x?: "LEFT" | "CENTER" | "RIGHT"; y?: "TOP" | "CENTER" | "BOTTOM" };
    layoutDirection?: "LEFT_TO_RIGHT" | "TOP_TO_BOTTOM";
  };
  backgroundColor?: Rgba;
  cornerRadius?: { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };
  border?: { color?: Rgba; width: Sides };
  clip?: { horizontal: number; vertical: number };
  text?: {
    textColor?: Rgba;
    fontId?: number;
    fontSize?: number;
    letterSpacing?: number;
    lineHeight?: number;
    textAlignment?: "LEFT" | "CENTER" | "RIGHT";
    wrapMode?: "WORDS" | "NEWLINES" | "NONE";
  };
}
type Partly<T> = { [K in keyof T]?: T[K] extends Rgba | Axis ? T[K] : Partly<T[K]> };
/** What a state sets over the base: the fields it touches, at their values there. */
export type ClayOverlay = Partly<ClayFields>;
/** Clay's fields with the overlay of each state. */
export interface ClayLayer extends ClayFields {
  ":hover"?: ClayOverlay;
  ":focus"?: ClayOverlay;
  ":active"?: ClayOverlay;
}
/** What a Clay style compiles to: its fields, its state overlays, and per theme (by name) the colours it changes. */
export interface ClayShape extends ClayLayer {
  themes?: Record<string, Partly<ClayLayer>>;
}
/** What every member of cssints/clay returns. */
export type ClayStyle = ClayShape & { readonly "~clay": true };

type Colour = <const A extends readonly Part[]>(...parts: Check<"color", A>) => ClayStyle;
type One<V> = (value: V) => ClayStyle;
type Four<V> = (...values: [V] | [V, V] | [V, V, V] | [V, V, V, V]) => ClayStyle;
type Pair<V> = (...values: [V] | [V, V]) => ClayStyle;

export declare const backgroundColor: Colour;
/** `background-color`. */
export declare const bg: Colour;
/** The colour of the text in the element (Clay's `textColor`). */
export declare const color: Colour;
export declare const borderColor: Colour;
export declare const width: One<Size>;
export declare const height: One<Size>;
export declare const padding: Four<Px>;
export declare const p: Four<Px>;
export declare const paddingInline: Pair<Px>;
export declare const paddingBlock: Pair<Px>;
export declare const paddingTop: One<Px>;
export declare const paddingRight: One<Px>;
export declare const paddingBottom: One<Px>;
export declare const paddingLeft: One<Px>;
export declare const pt: One<Px>;
export declare const pr: One<Px>;
export declare const pb: One<Px>;
export declare const pl: One<Px>;
/** Clay's `childGap`. */
export declare const gap: One<Px>;
export declare const flexDirection: One<"row" | "column">;
export declare const justifyContent: One<Align>;
export declare const alignItems: One<Align>;
/** 1 to 4 radii: top-left, top-right, bottom-right, bottom-left, as in CSS. */
export declare const borderRadius: Four<Px>;
export declare const borderWidth: Four<Px>;
/** A border of that width and colour on every side. */
export declare const border: <const A extends readonly Part[]>(
  width: Px,
  ...color: Check<"color", A>
) => ClayStyle;
/** `hidden` clips the children (Clay's `clip`). */
export declare const overflow: One<"visible" | "hidden">;
export declare const fontSize: One<Px>;
export declare const letterSpacing: One<Px>;
export declare const lineHeight: One<Px>;
export declare const textAlign: One<"left" | "center" | "right">;
/** `normal` wraps words, `pre-line` only at newlines, `nowrap` never. */
export declare const whiteSpace: One<"normal" | "pre-line" | "nowrap">;

/** Merges styles in argument order: a later prop wins. */
export declare const cn: (...styles: ClayStyle[]) => ClayStyle;
/** Under the pointer: header() prints the style with it as `<name>_hover`. States do not nest. */
export declare const hover: (...styles: ClayStyle[]) => ClayStyle;
/** Focused: `<name>_focus`. */
export declare const focus: (...styles: ClayStyle[]) => ClayStyle;
/** Pressed: `<name>_active`. */
export declare const active: (...styles: ClayStyle[]) => ClayStyle;
/**
 * The app's fonts in the order of its font array: a style per name that sets Clay's `fontId`, and the list, which
 * header() prints as an enum `<export>_<font>`. Each name is a C identifier.
 */
export declare const fonts: <const N extends readonly [string, ...string[]]>(
  ...names: N
) => { readonly [K in N[number]]: ClayStyle } & { readonly fonts: N };
/**
 * A theme of cssints/clay's tokens, by a name that is a C identifier: header() prints every style again, the name
 * appended (`<style>_<name>`, `<style>_hover_<name>`, `<style>_text_<name>`). It applies to the styles evaluated after it.
 */
export declare const createGlobalTheme: <const X extends object, const O extends Overrides<X>>(
  tokens: X,
  name: string,
  overrides: O & CheckOverrides<X, O>,
) => void;
/** The styles of a built module as a C header: `CLAY(id, name)` and `CLAY_TEXT(s, name_text)`. */
export declare const header: (styles: Record<string, unknown>) => string;
