/**
 * LightningCSS AST Types
 * Re-exported from lightningcss for type-safe CSS-in-TS development
 */

// Core value types
export type {
  Length,
  LengthValue,
  LengthUnit,
  Percentage,
  LengthPercentage,
  Angle,
  AngleValue,
  Time,
  TimeValue,
  Resolution,
  Ratio,
} from "lightningcss";

// Color types
export type {
  CssColor,
  RGBColor,
  LABColor,
  HSLColor,
  PredefinedColor,
  FloatColor,
  LightDark,
  SystemColor,
  UnresolvedColor,
} from "lightningcss";

// Declaration and rule types
export type {
  Declaration,
  PropertyId,
  Rule,
  StyleRule,
  MediaRule,
  SupportsRule,
  PropertyRule,
  DeclarationBlock,
} from "lightningcss";

// Token and value types
export type {
  Token,
  TokenOrValue,
  Function,
  Url,
  Variable,
} from "lightningcss";

// Calculation types
export type {
  Calc,
  MathFunction,
  RoundingStrategy,
} from "lightningcss";

// Selector types
export type {
  Selector,
  SelectorComponent,
  PseudoClass,
  PseudoElement,
} from "lightningcss";

// Media and container query types
export type {
  MediaCondition,
  MediaQuery,
  QueryFeature,
  MediaFeatureValue,
  MediaFeatureId,
} from "lightningcss";

// Import visitor type
export type {
  Visitor,
} from "lightningcss";
