import { A as Wrap, C as Keyframes, D as QueryWrap, F as cv, H as style, I as firstThatWorks, K as within, L as global, M as cn, O as StateWrap, R as group, S as CvValue, T as PositionTry, W as token, _ as CSSStyleValue, a as DtcgUnit, am as Fallback, b as CvConfig, c as Tokens, d as createTokens, f as layers, g as CSSImageValue, h as CSSColorValue, i as DtcgShadow, j as attr, k as Steps, l as check, m as CSS, n as DtcgColor, o as DtcgValue, om as Part, p as AttrOp, q as ClassValue, r as DtcgCubicBezier, s as Overrides, sm as Style, t as CheckOverrides, u as createGlobalTheme, v as CSSUnitValue, x as CvProps } from "../theme-types-Bqv0Ggz_.mjs";
import { a as GProp, n as GFn } from "../group-types-9ttphdku.mjs";
import "../group-common-9zpBxfUF.mjs";
import { properties } from "@cssints/css-grammar/mdn";
//#region src/groups/css-color-6.d.ts
type B = {
  id: "css-color-6";
  kw: Record<never, never>;
  fn: never;
  unit: never;
  media: never;
  container: never;
  supports: never;
};
type P<K extends keyof typeof properties> = GProp<B, K>;
export declare const color: P<"color">;
export declare const opacity: P<"opacity">;
export declare const colorFn: GFn<B, "color", " ">;
export declare const colorMix: GFn<B, "color-mix", ", ">;
export declare const contrastColor: GFn<B, "contrast-color", " ">;
export declare const hsl: GFn<B, "hsl", ", ">;
export declare const hsla: GFn<B, "hsla", ", ">;
export declare const hwb: GFn<B, "hwb", " ">;
export declare const lab: GFn<B, "lab", " ">;
export declare const lch: GFn<B, "lch", " ">;
export declare const lightDark: GFn<B, "light-dark", ", ">;
export declare const oklab: GFn<B, "oklab", " ">;
export declare const oklch: GFn<B, "oklch", " ">;
export declare const rgb: GFn<B, "rgb", ", ">;
export declare const rgba: GFn<B, "rgba", ", ">;
//#endregion
export { type AttrOp, type CSS, type CSSColorValue, type CSSImageValue, type CSSStyleValue, type CSSUnitValue, CheckOverrides, type ClassValue, type CvConfig, type CvProps, type CvValue, DtcgColor, DtcgCubicBezier, DtcgShadow, DtcgUnit, DtcgValue, type Fallback, type Keyframes, Overrides, type Part, type PositionTry, type QueryWrap, type StateWrap, type Steps, type Style, Tokens, type Wrap, attr, check, cn, createGlobalTheme, createTokens, cv, firstThatWorks, global, group, layers, style, token, within };