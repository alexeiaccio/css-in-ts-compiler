import { a as Kernel } from "./author-types-C1AhsnrT.mjs";
import { n as cx } from "./runtime-CTvuM-Hm.mjs";
import { n as At, t as CssNode } from "./node-CaHk2VU4.mjs";
import { CSS, CSSColorValue, CSSImageValue, CSSStyleValue, CSSUnitValue } from "@cssints/css-grammar/values";
import { Effect } from "effect";
//#region src/lib.d.ts
/** What firstThatWorks() builds: its values as text, the wanted one first. */
interface Fallback {
  __fallback: string[];
}
//#endregion
//#region src/macro.d.ts
export declare const firstThatWorks: (...values: unknown[]) => Fallback;
export declare class CSSAtRuleValue extends CSSStyleValue {
  readonly kernel: Kernel;
  readonly name: string;
  constructor(name: string, kernel: Kernel);
  toString(): string;
}
export declare const keyframes: (steps: unknown) => CSSAtRuleValue;
export declare const positionTry: (...args: unknown[]) => CSSAtRuleValue | CssNode;
export declare const cn: (...args: unknown[]) => CssNode;
export declare const flex: (...args: unknown[]) => CssNode;
export declare const grid: (...args: unknown[]) => CssNode;
type Styles = Record<string, Record<string, unknown>>;
interface CvConfig {
  base?: unknown;
  variants?: Styles;
  defaultVariants?: Record<string, string | boolean>;
  compoundVariants?: Record<string, string | boolean | CssNode>[];
}
export declare const cv: (config: CvConfig) => ((props?: Record<string, string | boolean | undefined>) => string) & {
  __cv: CvConfig;
};
export declare const css: Record<string, unknown>;
export declare function __at(file: string, site: number, offset: number): At;
export declare const __unseen: (file: string, site: number) => boolean;
export declare function __site(at: At, value: unknown): unknown;
//#endregion
export { CSS, CSSColorValue, CSSImageValue, CSSStyleValue, CSSUnitValue, cx };