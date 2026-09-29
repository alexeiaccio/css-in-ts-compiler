// What TypeScript sees of "cssints" (the "types" condition of package.json): the build-time members with the
// types they have in user code, where every call is already a class string, because the plugin replaced it.
// The implementation (macro.ts) builds declaration nodes instead; nothing here runs.
import type { CSS, CSSColorValue, CSSStyleValue, CSSUnitValue } from "@cssints/css-grammar/values";

import type { FlexMethods, GridMethods } from "./members.ts";
import type { CvRuntimeConfig } from "./runtime.ts";

export * from "./members.ts";
export { _cv, cx, type ClassValue, type CvRuntimeConfig } from "./runtime.ts";

/** A value part: a string, a Typed OM value, or a lone number (the spacing scale in spacing properties). */
export type Part = string | number | CSSStyleValue;
/** One property. */
export type Member = (...parts: Part[]) => string;
/** A style you can chain container properties on (flex() and grid()), and use as a class string. */
export type Chain<Methods extends string> = string & { readonly [K in Methods]: (...parts: Part[]) => Chain<Methods> };

export interface CvConfig {
  base?: string;
  variants?: Record<string, Record<string, string>>;
  defaultVariants?: Record<string, string>;
}

export declare const cn: (...styles: string[]) => string;
export declare const flex: () => Chain<FlexMethods>;
export declare const grid: () => Chain<GridMethods>;
/** The plugin replaces the call by the runtime config that `_cv` takes. */
export declare const cv: (config: CvConfig) => CvRuntimeConfig;

export declare const css: typeof import("./members.ts") & {
  cn: typeof cn;
  flex: typeof flex;
  grid: typeof grid;
  cv: typeof cv;
  CSS: typeof CSS;
  CSSColorValue: typeof CSSColorValue;
  CSSUnitValue: typeof CSSUnitValue;
};
export { CSS, CSSColorValue, CSSUnitValue } from "@cssints/css-grammar/values";
