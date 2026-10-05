//#region src/derived.d.ts
type Space = "srgb" | "srgb-linear" | "oklab" | "oklch" | "lab";
export interface Color {
  s: Space;
  c: number[];
  a: number;
}
/** The custom property of :root that carries the data (derived-data.ts writes it). */
export declare const KEY = "--_derived";
export declare const evaluate: (text: string, get?: (name: string) => string | Color) => Color;
export declare const css: (c: Color) => string;
declare const _default: () => void;
//#endregion
export { _default as default };