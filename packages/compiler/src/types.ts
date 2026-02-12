// Core types for CSS-in-TS compiler

export type CSSValue = string | number;
export type CSSProperties = Record<string, CSSValue | CSSProperties | Record<string, CSSProperties>>;

export type UtilityFunction = (...args: any[]) => CSSProperties;
export type MediaFunction = (props: CSSProperties) => CSSProperties;
export type ClassName = string;

export type MediaQueries = Record<string, string>;
export type MediaFunctions = Record<string, MediaFunction>;

export type SizeScale = (value: number) => CSSProperties;
export type SizeUtilities = Record<string, SizeScale>;

export type CompiledCSS = {
	classes: Map<string, CSSProperties>;
	css: string;
};
