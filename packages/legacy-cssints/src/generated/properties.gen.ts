// Auto-generated CSS property functions
// Generated from LightningCSS ast.json

import { style } from './style.js';

/** A mathematical expression used within the [`calc()`](https://www.w3.org/TR/css-values-4/#calc-func) function.

This type supports generic value types. Values such as [Length](super::length::Length), [Percentage](super::percentage::Percentage), [Time](super::time::Time), and [Angle](super::angle::Angle) support `calc()` expressions. */
export function calcForDimensionpercentageForLength(value: CalcforDimensionPercentageforLengthValue): string {
  return style({ "calc-for-dimensionpercentage-for-length": value });
}

/** A generic type that allows any kind of dimension and percentage to be used standalone or mixed within a `calc()` expression.

<https://drafts.csswg.org/css-values-4/#mixed-percentages> */
export function dimensionpercentageForLength(value: DimensionPercentageforLengthValue): string {
  return style({ "dimensionpercentage-for-length": value });
}

/** A [gap](https://www.w3.org/TR/css-align-3/#column-row-gap) value, as used in the `column-gap` and `row-gap` properties. */
export function gap(value: GapValue): string {
  return style({ "gap": value });
}

/** Either a color stop or interpolation hint within a gradient.

This type is generic, and items may be either a [LengthPercentage](super::length::LengthPercentage) or [Angle](super::angle::Angle) depending on what type of gradient it is within. */
export function gradientitemForDimensionpercentageForLength(value: GradientItemforDimensionPercentageforLengthValue): string {
  return style({ "gradientitem-for-dimensionpercentage-for-length": value });
}

export function length(value: LengthValue): string {
  return style({ "length": value });
}

/** A CSS [math function](https://www.w3.org/TR/css-values-4/#math-function).

Math functions may be used in most properties and values that accept numeric values, including lengths, percentages, angles, times, etc. */
export function mathfunctionForDimensionpercentageForLength(value: MathFunctionforDimensionPercentageforLengthValue): string {
  return style({ "mathfunction-for-dimensionpercentage-for-length": value });
}

/** [media feature value](https://drafts.csswg.org/mediaqueries/#typedef-mf-value) within a media query.

See [MediaFeature](MediaFeature). */
export function mediafeature(value: MediaFeatureValue): string {
  return style({ "mediafeature": value });
}

/** A generic value that represents a value for four sides of a box, e.g. border-width, margin, padding, etc.

When serialized, as few components as possible are written when there are duplicate values. */
export function rectForDimensionpercentageForLength(value: RectforDimensionPercentageforLengthValue): string {
  return style({ "rect-for-dimensionpercentage-for-length": value });
}

/** A generic value that represents a value with two components, e.g. a border radius.

When serialized, only a single component will be written if both are equal. */
export function size2dForDimensionpercentageForLength(value: Size2DforDimensionPercentageforLengthValue): string {
  return style({ "size2d-for-dimensionpercentage-for-length": value });
}

/** A raw CSS token, or a parsed value. */
export function tokenor(value: TokenOrValue): string {
  return style({ "tokenor": value });
}
