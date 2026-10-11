import { A as Wrap, C as Keyframes, D as QueryWrap, F as cv, H as style, I as firstThatWorks, J as cx, K as within, L as global, M as cn, O as StateWrap, R as group, S as CvValue, T as PositionTry, W as token, _ as CSSStyleValue, a as DtcgUnit, am as Fallback, b as CvConfig, c as Tokens, d as createTokens, f as layers, g as CSSImageValue, h as CSSColorValue, i as DtcgShadow, j as attr, k as Steps, l as check, m as CSS, n as DtcgColor, o as DtcgValue, om as Part, p as AttrOp, q as ClassValue, r as DtcgCubicBezier, s as Overrides, sm as Style, t as CheckOverrides, u as createGlobalTheme, v as CSSUnitValue, x as CvProps } from "../theme-types-DDT3Y9_E.mjs";
import { a as GProp, n as GFn } from "../group-types-BFUA45A7.mjs";
import "../group-common-CgsvgmDD.mjs";
import { properties } from "@cssints/css-grammar/mdn";
//#region src/groups/css-transforms-1.d.ts
type B = {
  id: "css-transforms-1";
  kw: Record<never, never>;
  fn: "matrix3d" | "perspective" | "rotate3d" | "rotateX" | "rotateY" | "rotateZ" | "scale3d" | "scaleZ" | "translate3d" | "translateZ";
  unit: never;
  media: never;
  container: never;
  supports: never;
};
type P<K extends keyof typeof properties> = GProp<B, K>;
export declare const transform: P<"transform">;
export declare const transformBox: P<"transform-box">;
export declare const transformOrigin: P<"transform-origin">;
export declare const matrix: GFn<B, "matrix", ", ">;
export declare const rotateFn: GFn<B, "rotate", " ">;
export declare const scaleFn: GFn<B, "scale", ", ">;
export declare const scaleX: GFn<B, "scaleX", " ">;
export declare const scaleY: GFn<B, "scaleY", " ">;
export declare const skew: GFn<B, "skew", ", ">;
export declare const skewX: GFn<B, "skewX", " ">;
export declare const skewY: GFn<B, "skewY", " ">;
export declare const translateFn: GFn<B, "translate", ", ">;
export declare const translateX: GFn<B, "translateX", " ">;
export declare const translateY: GFn<B, "translateY", " ">;
//#endregion
export { type AttrOp, type CSS, type CSSColorValue, type CSSImageValue, type CSSStyleValue, type CSSUnitValue, CheckOverrides, type ClassValue, type CvConfig, type CvProps, type CvValue, DtcgColor, DtcgCubicBezier, DtcgShadow, DtcgUnit, DtcgValue, type Fallback, type Keyframes, Overrides, type Part, type PositionTry, type QueryWrap, type StateWrap, type Steps, type Style, Tokens, type Wrap, attr, check, cn, createGlobalTheme, createTokens, cv, cx, firstThatWorks, global, group, layers, style, token, within };