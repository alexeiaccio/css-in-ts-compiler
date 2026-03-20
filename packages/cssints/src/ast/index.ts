/**
 * LightningCSS AST Types
 * Re-exported from lightningcss for type-safe CSS-in-TS development
 */

// Core value types
export type { Length, LengthValue, LengthUnit, Angle, Time, Resolution, Ratio } from "lightningcss";

// Color types
export type {
	CssColor,
	RGBColor,
	LABColor,
	PredefinedColor,
	FloatColor,
	LightDark,
	SystemColor,
	UnresolvedColor,
} from "lightningcss";

// Declaration and rule types
export type { Declaration, PropertyId, Rule, StyleRule, MediaRule, SupportsRule, PropertyRule } from "lightningcss";

// Token and value types
export type { Token, TokenOrValue, Function, Url, Variable } from "lightningcss";

// Calculation types
export type { CalcFor_Length as Calc, MathFunctionFor_Length as MathFunction, RoundingStrategy } from "lightningcss";

// Selector types
export type { Selector, SelectorComponent } from "lightningcss";

// Media and container query types
export type { MediaCondition, MediaQuery, MediaFeatureValue, MediaFeatureId } from "lightningcss";

// Import visitor type
export type { Visitor } from "lightningcss";
