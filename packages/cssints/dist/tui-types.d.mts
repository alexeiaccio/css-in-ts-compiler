import { d as createTokens, om as Part, rm as Check, u as createGlobalTheme } from "./theme-types-BY0mRf3K.mjs";
//#region src/tui-types.d.ts
type Percent = `${number}%`;
/** A number of cells (columns across, rows down) or a percentage of the parent. */
export type Cells = number | Percent;
/** Cells, or `auto`. */
export type Size = Cells | "auto";
export type BorderKind = "single" | "double" | "rounded" | "heavy";
export type Align = "auto" | "flex-start" | "center" | "flex-end" | "stretch" | "baseline" | "space-between" | "space-around" | "space-evenly";
export type Justify = "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
/** The CSS cursor keywords a terminal takes over OSC 22. */
export type Cursor = "auto" | "default" | "none" | "context-menu" | "help" | "pointer" | "progress" | "wait" | "cell" | "crosshair" | "text" | "vertical-text" | "alias" | "copy" | "move" | "no-drop" | "not-allowed" | "grab" | "grabbing" | "all-scroll" | "col-resize" | "row-resize" | "n-resize" | "e-resize" | "s-resize" | "w-resize" | "ne-resize" | "nw-resize" | "se-resize" | "sw-resize" | "ew-resize" | "ns-resize" | "nesw-resize" | "nwse-resize" | "zoom-in" | "zoom-out";
/** The props of a terminal style, renderer-neutral: colours are `#rrggbb` or `#rrggbbaa`, lengths are cells. */
export interface TuiProps {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  caretColor?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  textAlign?: "left" | "center" | "right";
  border?: boolean;
  borderStyle?: BorderKind;
  paddingTop?: Cells;
  paddingRight?: Cells;
  paddingBottom?: Cells;
  paddingLeft?: Cells;
  marginTop?: Size;
  marginRight?: Size;
  marginBottom?: Size;
  marginLeft?: Size;
  gap?: Cells;
  rowGap?: Cells;
  columnGap?: Cells;
  width?: Size;
  height?: Size;
  minWidth?: Size;
  maxWidth?: Size;
  minHeight?: Size;
  maxHeight?: Size;
  flexBasis?: Size;
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  justifyContent?: Justify;
  alignItems?: Align;
  alignSelf?: Align;
  flexGrow?: number;
  flexShrink?: number;
  position?: "relative" | "absolute";
  top?: Size;
  right?: Size;
  bottom?: Size;
  left?: Size;
  overflow?: "visible" | "hidden" | "scroll";
  visible?: boolean;
  opacity?: number;
  zIndex?: number;
  cursor?: Cursor;
  caretShape?: "auto" | "bar" | "block" | "underscore";
  caretAnimation?: "auto" | "manual";
}
/** Props with their state overlays. */
export interface TuiLayer extends TuiProps {
  ":hover"?: TuiProps;
  ":focus"?: TuiProps;
  ":active"?: TuiProps;
}
type ColourKey = "color" | "backgroundColor" | "borderColor" | "caretColor";
/** The token (`color-bg` for `var(--color-bg)`) of each colour prop set to one, per state: what a run-time theme sets. */
export interface TuiVars extends Partial<Record<ColourKey, string>> {
  ":hover"?: Partial<Record<ColourKey, string>>;
  ":focus"?: Partial<Record<ColourKey, string>>;
  ":active"?: Partial<Record<ColourKey, string>>;
}
/** What a terminal style compiles to: its props, state overlays, what each theme (by name) changes, its tokens. */
export interface TuiShape extends TuiLayer {
  themes?: Record<string, TuiLayer>;
  vars?: TuiVars;
}
/** What every member of cssints/tui returns. Only members make one (`cn()` takes no object literal). */
export type TuiStyle = TuiShape & {
  readonly "~tui": true;
};
/** A colour: parts are checked against the web's `color` grammar; a colour token fits. */
export type Colour = <const A extends readonly Part[]>(...parts: Check<"color", A>) => TuiStyle;
type One<V> = (value: V) => TuiStyle;
/** 1 to 4 values: top, right, bottom, left, as in CSS. */
type Sides<V> = (...values: [V] | [V, V] | [V, V, V] | [V, V, V, V]) => TuiStyle;
/** 1 or 2 values: the start and end of the inline or block axis. */
type Pair<V> = (...values: [V] | [V, V]) => TuiStyle;
export declare const color: Colour;
export declare const backgroundColor: Colour;
/** `background-color`. */
export declare const bg: Colour;
export declare const borderColor: Colour;
export declare const caretColor: Colour;
/** `bold`, `normal`, or `lighter`: the terminal's dim. */
export declare const fontWeight: One<"bold" | "normal" | "lighter">;
export declare const fontStyle: One<"italic" | "normal">;
type Decoration = ["none"] | ["underline"] | ["line-through"] | ["underline", "line-through"] | ["line-through", "underline"];
export declare const textDecoration: (...line: Decoration) => TuiStyle;
export declare const textDecorationLine: (...line: Decoration) => TuiStyle;
export declare const textAlign: One<"left" | "center" | "right">;
/** `solid` (a single line), `double`, `rounded`, `heavy`, or `none`. */
type BorderWord = "solid" | "double" | "rounded" | "heavy" | "none";
export declare const borderStyle: One<BorderWord>;
/** A border of that style, and its colour. */
export declare const border: {
  (style: BorderWord): TuiStyle;
  <const A extends readonly Part[]>(style: Exclude<BorderWord, "none">, ...color: Check<"color", A>): TuiStyle;
};
export declare const padding: Sides<Cells>;
export declare const p: Sides<Cells>;
export declare const paddingInline: Pair<Cells>;
export declare const paddingBlock: Pair<Cells>;
export declare const paddingTop: One<Cells>;
export declare const paddingRight: One<Cells>;
export declare const paddingBottom: One<Cells>;
export declare const paddingLeft: One<Cells>;
export declare const pt: One<Cells>;
export declare const pr: One<Cells>;
export declare const pb: One<Cells>;
export declare const pl: One<Cells>;
export declare const margin: Sides<Size>;
export declare const m: Sides<Size>;
export declare const marginInline: Pair<Size>;
export declare const marginBlock: Pair<Size>;
export declare const marginTop: One<Size>;
export declare const marginRight: One<Size>;
export declare const marginBottom: One<Size>;
export declare const marginLeft: One<Size>;
export declare const mt: One<Size>;
export declare const mr: One<Size>;
export declare const mb: One<Size>;
export declare const ml: One<Size>;
export declare const gap: One<Cells>;
export declare const rowGap: One<Cells>;
export declare const columnGap: One<Cells>;
export declare const width: One<Size>;
export declare const height: One<Size>;
export declare const minWidth: One<Size>;
export declare const maxWidth: One<Size>;
export declare const minHeight: One<Size>;
export declare const maxHeight: One<Size>;
export declare const flexBasis: One<Size>;
export declare const flexDirection: One<NonNullable<TuiProps["flexDirection"]>>;
export declare const flexWrap: One<NonNullable<TuiProps["flexWrap"]>>;
export declare const justifyContent: One<Justify>;
export declare const alignItems: One<Align>;
export declare const alignSelf: One<Align>;
export declare const flexGrow: One<number>;
export declare const flexShrink: One<number>;
export declare const position: One<"relative" | "absolute">;
export declare const top: One<Size>;
export declare const right: One<Size>;
export declare const bottom: One<Size>;
export declare const left: One<Size>;
export declare const overflow: One<"visible" | "hidden" | "scroll">;
/** `flex` (shown) or `none` (hidden, out of the layout). */
export declare const display: One<"flex" | "none">;
export declare const opacity: One<number>;
export declare const zIndex: One<number>;
/** The mouse pointer over the element: set on over, back to `default` on out. */
export declare const cursor: One<Cursor>;
/** The caret of a focused editable: `bar`, `block`, `underscore`, or the terminal's `auto`. */
export declare const caretShape: One<"auto" | "bar" | "block" | "underscore">;
/** `auto` blinks, `manual` is steady. */
export declare const caretAnimation: One<"auto" | "manual">;
/** Merges styles in argument order: a later prop wins. */
export declare const cn: (...styles: TuiStyle[]) => TuiStyle;
/** The styles while the pointer is over the element (`onMouseOver` to `onMouseOut`). */
export declare const hover: (...styles: TuiStyle[]) => TuiStyle;
/** The styles while the element has focus. */
export declare const focus: (...styles: TuiStyle[]) => TuiStyle;
/** The styles while a mouse button is down on the element. */
export declare const active: (...styles: TuiStyle[]) => TuiStyle;
//#endregion
export { createGlobalTheme, createTokens };