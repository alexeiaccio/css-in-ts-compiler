import { A as Wrap, C as Keyframes, D as QueryWrap, F as cv, H as style, I as firstThatWorks, K as within, L as global, M as cn, O as StateWrap, R as group, S as CvValue, T as PositionTry, W as token, _ as CSSStyleValue, a as DtcgUnit, am as Fallback, b as CvConfig, c as Tokens, d as createTokens, f as layers, g as CSSImageValue, h as CSSColorValue, i as DtcgShadow, j as attr, k as Steps, l as check, m as CSS, n as DtcgColor, o as DtcgValue, om as Part, p as AttrOp, q as ClassValue, r as DtcgCubicBezier, s as Overrides, sm as Style, t as CheckOverrides, u as createGlobalTheme, v as CSSUnitValue, x as CvProps } from "../theme-types-BY0mRf3K.mjs";
import { a as GProp } from "../group-types-Dn9CIR8J.mjs";
import "../group-common-3PAVTxpd.mjs";
import { properties } from "@cssints/css-grammar/mdn";
//#region src/groups/css-text-3.d.ts
type B = {
  id: "css-text-3";
  kw: {
    "text-justify": "no-compress" | "ruby";
    "text-transform": "math-auto";
    "word-break": "auto-phrase" | "manual";
  };
  fn: never;
  unit: never;
  media: never;
  container: never;
  supports: never;
};
type P<K extends keyof typeof properties> = GProp<B, K>;
export declare const hangingPunctuation: P<"hanging-punctuation">;
export declare const hyphens: P<"hyphens">;
export declare const letterSpacing: P<"letter-spacing">;
export declare const lineBreak: P<"line-break">;
export declare const overflowWrap: P<"overflow-wrap">;
export declare const tabSize: P<"tab-size">;
export declare const textAlign: P<"text-align">;
export declare const textAlignLast: P<"text-align-last">;
export declare const textIndent: P<"text-indent">;
export declare const textJustify: P<"text-justify">;
export declare const textTransform: P<"text-transform">;
export declare const whiteSpace: P<"white-space">;
export declare const wordBreak: P<"word-break">;
export declare const wordSpacing: P<"word-spacing">;
export declare const wordWrap: P<"word-wrap">;
//#endregion
export { type AttrOp, type CSS, type CSSColorValue, type CSSImageValue, type CSSStyleValue, type CSSUnitValue, CheckOverrides, type ClassValue, type CvConfig, type CvProps, type CvValue, DtcgColor, DtcgCubicBezier, DtcgShadow, DtcgUnit, DtcgValue, type Fallback, type Keyframes, Overrides, type Part, type PositionTry, type QueryWrap, type StateWrap, type Steps, type Style, Tokens, type Wrap, attr, check, cn, createGlobalTheme, createTokens, cv, firstThatWorks, global, group, layers, style, token, within };