import { A as Wrap, C as Keyframes, D as QueryWrap, F as cv, H as style, I as firstThatWorks, K as within, L as global, M as cn, O as StateWrap, R as group, S as CvValue, T as PositionTry, W as token, Y as GridMethods, _ as CSSStyleValue, a as DtcgUnit, am as Fallback, b as CvConfig, c as Tokens, d as createTokens, f as layers, g as CSSImageValue, h as CSSColorValue, i as DtcgShadow, j as attr, k as Steps, l as check, m as CSS, n as DtcgColor, o as DtcgValue, om as Part, p as AttrOp, q as ClassValue, r as DtcgCubicBezier, s as Overrides, sm as Style, t as CheckOverrides, u as createGlobalTheme, v as CSSUnitValue, x as CvProps } from "../theme-types-BY0mRf3K.mjs";
import { a as GProp, n as GFn, r as GLayout } from "../group-types-Dn9CIR8J.mjs";
import "../group-common-3PAVTxpd.mjs";
import { properties } from "@cssints/css-grammar/mdn";
//#region src/groups/css-grid-2.d.ts
type B = {
  id: "css-grid-2";
  kw: Record<never, never>;
  fn: never;
  unit: never;
  media: never;
  container: never;
  supports: never;
};
type P<K extends keyof typeof properties> = GProp<B, K>;
export declare const gridArea: P<"grid-area">;
export declare const gridAutoColumns: P<"grid-auto-columns">;
export declare const gridAutoFlow: P<"grid-auto-flow">;
export declare const gridAutoRows: P<"grid-auto-rows">;
export declare const gridColumn: P<"grid-column">;
export declare const gridColumnEnd: P<"grid-column-end">;
export declare const gridColumnStart: P<"grid-column-start">;
export declare const gridRow: P<"grid-row">;
export declare const gridRowEnd: P<"grid-row-end">;
export declare const gridRowStart: P<"grid-row-start">;
export declare const gridTemplate: P<"grid-template">;
export declare const gridTemplateAreas: P<"grid-template-areas">;
export declare const gridTemplateColumns: P<"grid-template-columns">;
export declare const gridTemplateRows: P<"grid-template-rows">;
export declare const fitContent: GFn<B, "fit-content", " ">;
export declare const minmax: GFn<B, "minmax", ", ">;
export declare const grid: GLayout<B, "grid", Pick<GridMethods, "templateColumns" | "templateRows" | "templateAreas" | "template" | "autoFlow" | "autoColumns" | "autoRows">>;
//#endregion
export { type AttrOp, type CSS, type CSSColorValue, type CSSImageValue, type CSSStyleValue, type CSSUnitValue, CheckOverrides, type ClassValue, type CvConfig, type CvProps, type CvValue, DtcgColor, DtcgCubicBezier, DtcgShadow, DtcgUnit, DtcgValue, type Fallback, type Keyframes, Overrides, type Part, type PositionTry, type QueryWrap, type StateWrap, type Steps, type Style, Tokens, type Wrap, attr, check, cn, createGlobalTheme, createTokens, cv, firstThatWorks, global, group, layers, style, token, within };