import { A as Wrap, C as Keyframes, D as QueryWrap, F as cv, H as style, I as firstThatWorks, J as cx, K as within, L as global, M as cn, O as StateWrap, R as group, S as CvValue, T as PositionTry, W as token, _ as CSSStyleValue, a as DtcgUnit, am as Fallback, b as CvConfig, c as Tokens, d as createTokens, f as layers, g as CSSImageValue, h as CSSColorValue, i as DtcgShadow, j as attr, k as Steps, l as check, m as CSS, n as DtcgColor, o as DtcgValue, om as Part, p as AttrOp, q as ClassValue, r as DtcgCubicBezier, s as Overrides, sm as Style, t as CheckOverrides, u as createGlobalTheme, v as CSSUnitValue, x as CvProps } from "../theme-types-DDT3Y9_E.mjs";
import { a as GProp, n as GFn } from "../group-types-BFUA45A7.mjs";
import "../group-common-CgsvgmDD.mjs";
import { properties } from "@cssints/css-grammar/mdn";
//#region src/groups/css-images-3.d.ts
type B = {
  id: "css-images-3";
  kw: Record<never, never>;
  fn: "conic-gradient" | "cross-fade" | "element" | "image" | "image-set" | "repeating-conic-gradient";
  unit: never;
  media: never;
  container: never;
  supports: never;
};
type P<K extends keyof typeof properties> = GProp<B, K>;
export declare const imageOrientation: P<"image-orientation">;
export declare const imageRendering: P<"image-rendering">;
export declare const objectFit: P<"object-fit">;
export declare const objectPosition: P<"object-position">;
export declare const linearGradient: GFn<B, "linear-gradient", ", ">;
export declare const radialGradient: GFn<B, "radial-gradient", ", ">;
export declare const repeatingLinearGradient: GFn<B, "repeating-linear-gradient", ", ">;
export declare const repeatingRadialGradient: GFn<B, "repeating-radial-gradient", ", ">;
//#endregion
export { type AttrOp, type CSS, type CSSColorValue, type CSSImageValue, type CSSStyleValue, type CSSUnitValue, CheckOverrides, type ClassValue, type CvConfig, type CvProps, type CvValue, DtcgColor, DtcgCubicBezier, DtcgShadow, DtcgUnit, DtcgValue, type Fallback, type Keyframes, Overrides, type Part, type PositionTry, type QueryWrap, type StateWrap, type Steps, type Style, Tokens, type Wrap, attr, check, cn, createGlobalTheme, createTokens, cv, cx, firstThatWorks, global, group, layers, style, token, within };