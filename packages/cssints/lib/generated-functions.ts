/**
 * CSS Functions - AUTO-GENERATED
 * Do not edit manually. Run: bun run scripts/generate-all.ts
 * 
 * Generated from @webref/css with browser compatibility from @mdn/browser-compat-data
 */

import type { Length, Angle, Color, Percentage, CSSNumber, Time, CSSInteger, LengthPercentage, AnglePercentage, TimePercentage, Image, Position } from "./generated-types";


/**
 * The `abs()` CSS function.
 *
 * **Syntax**: `abs( <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnAbs: (_calcSum: string) => string = (_calcSum) => `abs(_calcSum)`;

/**
 * The `acos()` CSS function.
 *
 * **Syntax**: `acos( <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnAcos: (_calcSum: string) => string = (_calcSum) => `acos(_calcSum)`;

/**
 * The `alpha()` CSS function.
 *
 * **Syntax**: `alpha([from <color>] [ / [<alpha-value> | none] ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-5
 */
export const fnAlpha: () => string = () => `alpha()`;

/**
 * The `anchor()` CSS function.
 *
 * **Syntax**: `anchor( <anchor-name>? && <anchor-side>, <length-percentage>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-anchor-position-1
 */
export const fnAnchor: (_anchorName: string, _anchorSide?: string, _lengthPercentage?: LengthPercentage) => string = (_anchorName, _anchorSide, _lengthPercentage) => `anchor(${_anchorName}, ${_anchorSide !== undefined ? `, ${_anchorSide}` : ""}, ${_lengthPercentage !== undefined ? `, ${_lengthPercentage}` : ""})`;

/**
 * The `anchor-size()` CSS function.
 *
 * **Syntax**: `anchor-size( [ <anchor-name> || <anchor-size> ]? , <length-percentage>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-anchor-position-1
 */
export const fnAnchorSize: () => string = () => `anchor-size()`;

/**
 * The `asin()` CSS function.
 *
 * **Syntax**: `asin( <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnAsin: (_calcSum: string) => string = (_calcSum) => `asin(_calcSum)`;

/**
 * The `atan()` CSS function.
 *
 * **Syntax**: `atan( <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnAtan: (_calcSum: string) => string = (_calcSum) => `atan(_calcSum)`;

/**
 * The `atan2()` CSS function.
 *
 * **Syntax**: `atan2( <calc-sum>, <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnAtan2: (keyword0: 'atan2', _calcSum: string, _calcSum3: string) => string = (keyword0, _calcSum, _calcSum3) => `atan2(keyword0, _calcSum, _calcSum3)`;

/**
 * The `attr()` CSS function.
 *
 * **Syntax**: `attr( <attr-name> <attr-type>? , <declaration-value>?)`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnAttr: (_attrName: string, _attrType?: string, _declarationValue?: string) => string = (_attrName, _attrType, _declarationValue) => `attr(${_attrName}, ${_attrType !== undefined ? `, ${_attrType}` : ""}, ${_declarationValue !== undefined ? `, ${_declarationValue}` : ""})`;

/**
 * The `blur()` CSS function.
 *
 * **Syntax**: `blur( <length>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec filter-effects-1
 */
export const fnBlur: (_length?: Length) => string = (_length) => `blur(${_length !== undefined ? `, ${_length}` : ""})`;

/**
 * The `brightness()` CSS function.
 *
 * **Syntax**: `brightness( [ <number> | <percentage> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec filter-effects-1
 */
export const fnBrightness: (_number: CSSNumber, _percentage?: Percentage) => string = (_number, _percentage) => `brightness(${_number}, ${_percentage !== undefined ? `, ${_percentage}` : ""})`;

/**
 * The `calc()` CSS function.
 *
 * **Syntax**: `calc( <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnCalc: (_calcSum: string) => string = (_calcSum) => `calc(_calcSum)`;

/**
 * The `calc-interpolate()` CSS function.
 *
 * **Syntax**: `calc-interpolate( [ <progress-source> && [ by <easing-function> ]? && <easing-function>? ] , <input-position>{1,2} : <calc-sum> , [ <easing-function>? , <input-position>{1,2} : <calc-sum> ]#? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnCalcInterpolate: (_progressSource: string, _easingFunction?: string, _easingFunction3?: string, _inputPosition?: string, _calcSum?: string, _easingFunction6?: string, _inputPosition7?: string, _calcSum8?: string) => string = (_progressSource, _easingFunction, _easingFunction3, _inputPosition, _calcSum, _easingFunction6, _inputPosition7, _calcSum8) => `calc-interpolate(${_progressSource}, ${_easingFunction !== undefined ? `, ${_easingFunction}` : ""}, ${_easingFunction3 !== undefined ? `, ${_easingFunction3}` : ""}, ${_inputPosition !== undefined ? `, ${_inputPosition}` : ""}, ${_calcSum !== undefined ? `, ${_calcSum}` : ""}, ${_easingFunction6 !== undefined ? `, ${_easingFunction6}` : ""}, ${_inputPosition7 !== undefined ? `, ${_inputPosition7}` : ""}, ${_calcSum8 !== undefined ? `, ${_calcSum8}` : ""})`;

/**
 * The `calc-mix()` CSS function.
 *
 * **Syntax**: `calc-mix( [ <calc-sum> <percentage [0,100]>? ]# )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnCalcMix: (_calcSum: string, _percentage0100?: Percentage) => string = (_calcSum, _percentage0100) => `calc-mix(${_calcSum}, ${_percentage0100 !== undefined ? `, ${_percentage0100}` : ""})`;

/**
 * The `calc-size()` CSS function.
 *
 * **Syntax**: `calc-size( <calc-size-basis>, <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnCalcSize: (_calcSizeBasis: string, _calcSum: string) => string = (_calcSizeBasis, _calcSum) => `calc-size(_calcSizeBasis, _calcSum)`;

/**
 * The `circle()` CSS function.
 *
 * **Syntax**: `circle( <radial-size>? [ at <position> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-shapes-1
 */
export const fnCircle: (_radialSize: string, _position?: Position) => string = (_radialSize, _position) => `circle(${_radialSize}, ${_position !== undefined ? `, ${_position}` : ""})`;

/**
 * The `clamp()` CSS function.
 *
 * **Syntax**: `clamp( [ <calc-sum> | none ], <calc-sum>, [ <calc-sum> | none ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnClamp: () => string = () => `clamp()`;

/**
 * The `color()` CSS function.
 *
 * **Syntax**: `color( [from <color>]? <colorspace-params> [ / [ <alpha-value> | none ] ]? )`
 *
 * **Status**: 🟢 modern
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **1** | **1** | **1** | **12** |
 *
 * @spec css-color-5
 */
export const fnColor: () => string = () => `color()`;

/**
 * The `color-interpolate()` CSS function.
 *
 * **Syntax**: `color-interpolate( [ <progress-source> && [ by <easing-function> ]? && <easing-function>? && <color-interpolation-method>? ] , <input-position>{1,2} : <color>, [ [ <easing-function> || <color-interpolation-method> ]?, <input-position>{1,2} : <color> ]#? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnColorInterpolate: () => string = () => `color-interpolate()`;

/**
 * The `color-layers()` CSS function.
 *
 * **Syntax**: `color-layers([ <blend-mode>, ]? <color># )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-6
 */
export const fnColorLayers: (_blendMode?: string, _color?: Color) => string = (_blendMode, _color) => `color-layers(${_blendMode !== undefined ? `, ${_blendMode}` : ""}, ${_color !== undefined ? `, ${_color}` : ""})`;

/**
 * The `color-mix()` CSS function.
 *
 * **Syntax**: `color-mix( <color-interpolation-method>? , [ <color> && <percentage [0,100]>? ]#)`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-5
 */
export const fnColorMix: (_colorInterpolationMethod?: string, _color?: Color, _percentage0100?: Percentage) => string = (_colorInterpolationMethod, _color, _percentage0100) => `color-mix(${_colorInterpolationMethod !== undefined ? `, ${_colorInterpolationMethod}` : ""}, ${_color !== undefined ? `, ${_color}` : ""}, ${_percentage0100 !== undefined ? `, ${_percentage0100}` : ""})`;

/**
 * The `conic-gradient()` CSS function.
 *
 * **Syntax**: `conic-gradient( [ <conic-gradient-syntax> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-images-4
 */
export const fnConicGradient: (_conicGradientSyntax: string) => string = (_conicGradientSyntax) => `conic-gradient(_conicGradientSyntax)`;

/**
 * The `content()` CSS function.
 *
 * **Syntax**: `content( [ text | before | after | first-letter | marker ]? )`
 *
 * **Status**: 🟢 modern
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **1** | **1** | **1** | **12** |
 *
 * @spec css-content-3
 */
export const fnContent: (keyword0: 'text', keyword1: 'before', keyword2: 'after', keyword3: 'first-letter', keyword4?: 'marker') => string = (keyword0, keyword1, keyword2, keyword3, keyword4) => `content(${keyword0}, ${keyword1}, ${keyword2}, ${keyword3}, ${keyword4 !== undefined ? `, ${keyword4}` : ""})`;

/**
 * The `contrast()` CSS function.
 *
 * **Syntax**: `contrast( [ <number> | <percentage> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec filter-effects-1
 */
export const fnContrast: (_number: CSSNumber, _percentage?: Percentage) => string = (_number, _percentage) => `contrast(${_number}, ${_percentage !== undefined ? `, ${_percentage}` : ""})`;

/**
 * The `contrast-color()` CSS function.
 *
 * **Syntax**: `contrast-color( [ [ <color> && [ tbd-fg | tbd-bg ] && <target-contrast>? ] | [ <color> && [ tbd-fg | tbd-bg ] && <target-contrast>, <color># ] ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-6
 */
export const fnContrastColor: (_color: Color, keyword0: 'tbd-fg', keyword1: 'tbd-bg', _targetContrast: string, _color5: Color, keyword2: 'tbd-fg', keyword3: 'tbd-bg', _targetContrast8: string, _color9?: Color) => string = (_color, keyword0, keyword1, _targetContrast, _color5, keyword2, keyword3, _targetContrast8, _color9) => `contrast-color(${_color}, ${keyword0}, ${keyword1}, ${_targetContrast}, ${_color5}, ${keyword2}, ${keyword3}, ${_targetContrast8}, ${_color9 !== undefined ? `, ${_color9}` : ""})`;

/**
 * The `control-value()` CSS function.
 *
 * **Syntax**: `control-value( <type>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-forms-1
 */
export const fnControlValue: (_cssType?: string) => string = (_cssType) => `control-value(${_cssType !== undefined ? `, ${_cssType}` : ""})`;

/**
 * The `cos()` CSS function.
 *
 * **Syntax**: `cos( <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnCos: (_calcSum: string) => string = (_calcSum) => `cos(_calcSum)`;

/**
 * The `counter()` CSS function.
 *
 * **Syntax**: `counter( <counter-name>, <counter-style>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-lists-3
 */
export const fnCounter: (_counterName: string, _counterStyle?: string) => string = (_counterName, _counterStyle) => `counter(${_counterName}, ${_counterStyle !== undefined ? `, ${_counterStyle}` : ""})`;

/**
 * The `counters()` CSS function.
 *
 * **Syntax**: `counters( <counter-name>, <string>, <counter-style>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-lists-3
 */
export const fnCounters: (_counterName: string, _string: string, _counterStyle?: string) => string = (_counterName, _string, _counterStyle) => `counters(${_counterName}, ${_string}, ${_counterStyle !== undefined ? `, ${_counterStyle}` : ""})`;

/**
 * The `cross-fade()` CSS function.
 *
 * **Syntax**: `cross-fade( <cf-image># )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-images-4
 */
export const fnCrossFade: (_cfImage: string) => string = (_cfImage) => `cross-fade(_cfImage)`;

/**
 * The `cubic-bezier()` CSS function.
 *
 * **Syntax**: `cubic-bezier( [ <number [0,1]>, <number> ]#{2} )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-easing-2
 */
export const fnCubicBezier: (_number01: CSSNumber, _number: CSSNumber) => string = (_number01, _number) => `cubic-bezier(_number01, _number)`;

/**
 * The `device-cmyk()` CSS function.
 *
 * **Syntax**: `<legacy-device-cmyk-syntax> | <modern-device-cmyk-syntax>`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-5
 */
export const fnDeviceCmyk: (value0: string) => string = (value0) => `device-cmyk(value0)`;

/**
 * The `drop-shadow()` CSS function.
 *
 * **Syntax**: `drop-shadow( [ <color>? && <length>{2,3} ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec filter-effects-1
 */
export const fnDropShadow: (_color: Color, _length?: Length) => string = (_color, _length) => `drop-shadow(${_color}, ${_length !== undefined ? `, ${_length}` : ""})`;

/**
 * The `dynamic-range-limit-mix()` CSS function.
 *
 * **Syntax**: `dynamic-range-limit-mix( [ <'dynamic-range-limit'> && <percentage [0,100]> ]#{2,} )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-hdr-1
 */
export const fnDynamicRangeLimitMix: (_dynamicRangeLimit: string, _percentage0100: Percentage) => string = (_dynamicRangeLimit, _percentage0100) => `dynamic-range-limit-mix(_dynamicRangeLimit, _percentage0100)`;

/**
 * The `element()` CSS function.
 *
 * **Syntax**: `element( <id-selector> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-images-4
 */
export const fnElement: (_idSelector: string) => string = (_idSelector) => `element(_idSelector)`;

/**
 * The `ellipse()` CSS function.
 *
 * **Syntax**: `ellipse( <radial-size>? [ at <position> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-shapes-1
 */
export const fnEllipse: (_radialSize: string, _position?: Position) => string = (_radialSize, _position) => `ellipse(${_radialSize}, ${_position !== undefined ? `, ${_position}` : ""})`;

/**
 * The `env()` CSS function.
 *
 * **Syntax**: `env( <custom-ident> <integer [0,∞]>*, <declaration-value>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-env-1
 */
export const fnEnv: (_customIdent: string, _integer0: CSSInteger, _declarationValue?: string) => string = (_customIdent, _integer0, _declarationValue) => `env(${_customIdent}, ${_integer0}, ${_declarationValue !== undefined ? `, ${_declarationValue}` : ""})`;

/**
 * The `exp()` CSS function.
 *
 * **Syntax**: `exp( <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnExp: (_calcSum: string) => string = (_calcSum) => `exp(_calcSum)`;

/**
 * The `fade()` CSS function.
 *
 * **Syntax**: `fade( [ <length-percentage> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-overflow-4
 */
export const fnFade: (_lengthPercentage: LengthPercentage) => string = (_lengthPercentage) => `fade(_lengthPercentage)`;

/**
 * The `filter()` CSS function.
 *
 * **Syntax**: `filter( [ <image> | <string> ], <filter-value-list> )`
 *
 * **Status**: 🟢 modern
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **53** | **35** | **9.1** | **12** |
 *
 * @spec filter-effects-1
 */
export const fnFilter: () => string = () => `filter()`;

/**
 * The `first-valid()` CSS function.
 *
 * **Syntax**: `first-valid( <declaration-value># )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnFirstValid: (_declarationValue: string) => string = (_declarationValue) => `first-valid(_declarationValue)`;

/**
 * The `fit-content()` CSS function.
 *
 * **Syntax**: `fit-content( <length-percentage> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-grid-2
 */
export const fnFitContent: (_lengthPercentage: LengthPercentage) => string = (_lengthPercentage) => `fit-content(_lengthPercentage)`;

/**
 * The `fit-content()` CSS function.
 *
 * **Syntax**: `fit-content(<length-percentage [0,∞]>)`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-sizing-3
 */
export const fnFitContent2: (_lengthPercentage0: LengthPercentage) => string = (_lengthPercentage0) => `fit-content(_lengthPercentage0)`;

/**
 * The `grayscale()` CSS function.
 *
 * **Syntax**: `grayscale( [ <number> | <percentage> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec filter-effects-1
 */
export const fnGrayscale: (_number: CSSNumber, _percentage?: Percentage) => string = (_number, _percentage) => `grayscale(${_number}, ${_percentage !== undefined ? `, ${_percentage}` : ""})`;

/**
 * The `hdr-color()` CSS function.
 *
 * **Syntax**: `color-hdr([ <color> && <number [0,∞]>? ]#{2})`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-hdr-1
 */
export const fnHdrColor: (_color: Color, _number0?: CSSNumber) => string = (_color, _number0) => `hdr-color(${_color}, ${_number0 !== undefined ? `, ${_number0}` : ""})`;

/**
 * The `hsl()` CSS function.
 *
 * **Syntax**: `[ <legacy-hsl-syntax> | <modern-hsl-syntax> ]`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-4
 */
export const fnHsl: (_legacyHslSyntax: string, _modernHslSyntax: string) => string = (_legacyHslSyntax, _modernHslSyntax) => `hsl(_legacyHslSyntax, _modernHslSyntax)`;

/**
 * The `hsla()` CSS function.
 *
 * **Syntax**: `[ <legacy-hsla-syntax> | <modern-hsla-syntax> ]`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-4
 */
export const fnHsla: (_legacyHslaSyntax: string, _modernHslaSyntax: string) => string = (_legacyHslaSyntax, _modernHslaSyntax) => `hsla(_legacyHslaSyntax, _modernHslaSyntax)`;

/**
 * The `hue-rotate()` CSS function.
 *
 * **Syntax**: `hue-rotate( [ <angle> | <zero> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec filter-effects-1
 */
export const fnHueRotate: (_angle: Angle, _zero?: string) => string = (_angle, _zero) => `hue-rotate(${_angle}, ${_zero !== undefined ? `, ${_zero}` : ""})`;

/**
 * The `hwb()` CSS function.
 *
 * **Syntax**: `hwb([from <color>]? [<hue> | none] [<percentage> | <number> | none] [<percentage> | <number> | none] [ / [<alpha-value> | none] ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-5
 */
export const fnHwb: () => string = () => `hwb()`;

/**
 * The `hypot()` CSS function.
 *
 * **Syntax**: `hypot( <calc-sum># )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnHypot: (_calcSum: string) => string = (_calcSum) => `hypot(_calcSum)`;

/**
 * The `ictcp()` CSS function.
 *
 * **Syntax**: `ictcp([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<percentage> | <number> | none] [ / [<alpha-value> | none] ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-hdr-1
 */
export const fnIctcp: () => string = () => `ictcp()`;

/**
 * The `ident()` CSS function.
 *
 * **Syntax**: `ident( <ident-arg>+ )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnIdent: (_identArg: string) => string = (_identArg) => `ident(_identArg)`;

/**
 * The `if()` CSS function.
 *
 * **Syntax**: `if( [ <if-branch> ; ]* <if-branch> ;? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnIf: (_ifBranch: string, _ifBranch2?: string) => string = (_ifBranch, _ifBranch2) => `if(${_ifBranch}, ${_ifBranch2 !== undefined ? `, ${_ifBranch2}` : ""})`;

/**
 * The `image()` CSS function.
 *
 * **Syntax**: `image( <image-tags>? [ <image-src>? , <color>? ]! )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-images-4
 */
export const fnImage: (_imageTags?: string) => string = (_imageTags) => `image(${_imageTags !== undefined ? `, ${_imageTags}` : ""})`;

/**
 * The `image-set()` CSS function.
 *
 * **Syntax**: `image-set( <image-set-option># )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-images-4
 */
export const fnImageSet: (_imageSetOption: string) => string = (_imageSetOption) => `image-set(_imageSetOption)`;

/**
 * The `inherit()` CSS function.
 *
 * **Syntax**: `inherit( <custom-property-name>, <declaration-value>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnInherit: (_customPropertyName: string, _declarationValue?: string) => string = (_customPropertyName, _declarationValue) => `inherit(${_customPropertyName}, ${_declarationValue !== undefined ? `, ${_declarationValue}` : ""})`;

/**
 * The `inset()` CSS function.
 *
 * **Syntax**: `inset( <length-percentage>{1,4} [ round <'border-radius'> ]? )`
 *
 * **Status**: 🟢 modern
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **87** | **66** | **14.1** | **87** |
 *
 * @spec css-shapes-1
 */
export const fnInset: (_lengthPercentage: LengthPercentage, keyword0: 'round', _borderRadius?: string) => string = (_lengthPercentage, keyword0, _borderRadius) => `inset(${_lengthPercentage}, ${keyword0}, ${_borderRadius !== undefined ? `, ${_borderRadius}` : ""})`;

/**
 * The `interpolate()` CSS function.
 *
 * **Syntax**: `interpolate( [ <progress-source> && [ by <easing-function> ]? && <easing-function>? ] , <input-position>{1,2} : <whole-value>, [ <easing-function>?, <input-position>{1,2} : <whole-value> ]#? ) | interpolate( <progress-source> && [ by <easing-function> ]? && <easing-function>? of <keyframes-name> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnInterpolate: (_progressSource: string, _easingFunction?: string, _easingFunction3?: string, _inputPosition?: string, _wholeValue?: string, _easingFunction6?: string, _inputPosition7?: string, _wholeValue8?: string, keyword0?: 'interpolate', _progressSource10?: string, _easingFunction11?: string, _easingFunction12?: string, keyword1?: 'of') => string = (_progressSource, _easingFunction, _easingFunction3, _inputPosition, _wholeValue, _easingFunction6, _inputPosition7, _wholeValue8, keyword0, _progressSource10, _easingFunction11, _easingFunction12, keyword1) => `interpolate(${_progressSource}, ${_easingFunction !== undefined ? `, ${_easingFunction}` : ""}, ${_easingFunction3 !== undefined ? `, ${_easingFunction3}` : ""}, ${_inputPosition !== undefined ? `, ${_inputPosition}` : ""}, ${_wholeValue !== undefined ? `, ${_wholeValue}` : ""}, ${_easingFunction6 !== undefined ? `, ${_easingFunction6}` : ""}, ${_inputPosition7 !== undefined ? `, ${_inputPosition7}` : ""}, ${_wholeValue8 !== undefined ? `, ${_wholeValue8}` : ""}, ${keyword0 !== undefined ? `, ${keyword0}` : ""}, ${_progressSource10 !== undefined ? `, ${_progressSource10}` : ""}, ${_easingFunction11 !== undefined ? `, ${_easingFunction11}` : ""}, ${_easingFunction12 !== undefined ? `, ${_easingFunction12}` : ""}, ${keyword1 !== undefined ? `, ${keyword1}` : ""})`;

/**
 * The `invert()` CSS function.
 *
 * **Syntax**: `invert( [ <number> | <percentage> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec filter-effects-1
 */
export const fnInvert: (_number: CSSNumber, _percentage?: Percentage) => string = (_number, _percentage) => `invert(${_number}, ${_percentage !== undefined ? `, ${_percentage}` : ""})`;

/**
 * The `jzazbz()` CSS function.
 *
 * **Syntax**: `jzazbz([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<percentage> | <number> | none] [ / [<alpha-value> | none] ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-hdr-1
 */
export const fnJzazbz: () => string = () => `jzazbz()`;

/**
 * The `jzczhz()` CSS function.
 *
 * **Syntax**: `jzczhz([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<hue> | none] [ / [<alpha-value> | none] ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-hdr-1
 */
export const fnJzczhz: () => string = () => `jzczhz()`;

/**
 * The `lab()` CSS function.
 *
 * **Syntax**: `lab([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<percentage> | <number> | none] [ / [<alpha-value> | none] ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-5
 */
export const fnLab: () => string = () => `lab()`;

/**
 * The `lch()` CSS function.
 *
 * **Syntax**: `lch([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<hue> | none] [ / [<alpha-value> | none] ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-5
 */
export const fnLch: () => string = () => `lch()`;

/**
 * The `leader()` CSS function.
 *
 * **Syntax**: `leader( <leader-type> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-content-3
 */
export const fnLeader: (_leaderType: string) => string = (_leaderType) => `leader(_leaderType)`;

/**
 * The `light-dark()` CSS function.
 *
 * **Syntax**: `light-dark( <color>, <color> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-5
 */
export const fnLightDark: (_color: Color, _color2: Color) => string = (_color, _color2) => `light-dark(_color, _color2)`;

/**
 * The `linear()` CSS function.
 *
 * **Syntax**: `linear( [ <number> && <percentage>{0,2} ]# )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-easing-2
 */
export const fnLinear: (_number: CSSNumber, _percentage: Percentage) => string = (_number, _percentage) => `linear(_number, _percentage)`;

/**
 * The `linear-gradient()` CSS function.
 *
 * **Syntax**: `linear-gradient( [ <linear-gradient-syntax> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-images-3
 */
export const fnLinearGradient: (_linearGradientSyntax: string) => string = (_linearGradientSyntax) => `linear-gradient(_linearGradientSyntax)`;

/**
 * The `log()` CSS function.
 *
 * **Syntax**: `log( <calc-sum>, <calc-sum>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnLog: (_calcSum: string, _calcSum2?: string) => string = (_calcSum, _calcSum2) => `log(${_calcSum}, ${_calcSum2 !== undefined ? `, ${_calcSum2}` : ""})`;

/**
 * The `matrix()` CSS function.
 *
 * **Syntax**: `matrix( <number>#{6} )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-1
 */
export const fnMatrix: (_number: CSSNumber) => string = (_number) => `matrix(_number)`;

/**
 * The `matrix3d()` CSS function.
 *
 * **Syntax**: `matrix3d( <number>#{16} )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-2
 */
export const fnMatrix3D: (keyword0: 'matrix3d', _number: CSSNumber) => string = (keyword0, _number) => `matrix3d(keyword0, _number)`;

/**
 * The `max()` CSS function.
 *
 * **Syntax**: `max( <calc-sum># )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnMax: (_calcSum: string) => string = (_calcSum) => `max(_calcSum)`;

/**
 * The `media()` CSS function.
 *
 * **Syntax**: `media( [ <mf-plain> | <mf-boolean> | <mf-range> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-conditional-5
 */
export const fnMedia: (_mfPlain: string, _mfBoolean: string, _mfRange: string) => string = (_mfPlain, _mfBoolean, _mfRange) => `media(_mfPlain, _mfBoolean, _mfRange)`;

/**
 * The `min()` CSS function.
 *
 * **Syntax**: `min( <calc-sum># )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnMin: (_calcSum: string) => string = (_calcSum) => `min(_calcSum)`;

/**
 * The `minmax()` CSS function.
 *
 * **Syntax**: `minmax(min, max)`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-grid-2
 */
export const fnMinmax: (keyword0: 'min', keyword1: 'max') => string = (keyword0, keyword1) => `minmax(keyword0, keyword1)`;

/**
 * The `mod()` CSS function.
 *
 * **Syntax**: `mod( <calc-sum>, <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnMod: (_calcSum: string, _calcSum2: string) => string = (_calcSum, _calcSum2) => `mod(_calcSum, _calcSum2)`;

/**
 * The `oklab()` CSS function.
 *
 * **Syntax**: `oklab([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<percentage> | <number> | none] [ / [<alpha-value> | none] ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-5
 */
export const fnOklab: () => string = () => `oklab()`;

/**
 * The `oklch()` CSS function.
 *
 * **Syntax**: `oklch([from <color>]? [<percentage> | <number> | none] [<percentage> | <number> | none] [<hue> | none] [ / [<alpha-value> | none] ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-5
 */
export const fnOklch: () => string = () => `oklch()`;

/**
 * The `opacity()` CSS function.
 *
 * **Syntax**: `opacity( [ <number> | <percentage> ]? )`
 *
 * **Status**: 🟢 modern
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **1** | **1** | **2** | **12** |
 *
 * @spec filter-effects-1
 */
export const fnOpacity: (_number: CSSNumber, _percentage?: Percentage) => string = (_number, _percentage) => `opacity(${_number}, ${_percentage !== undefined ? `, ${_percentage}` : ""})`;

/**
 * The `paint()` CSS function.
 *
 * **Syntax**: `paint( <ident>, <declaration-value>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec unknown
 */
export const fnPaint: (_ident: string, _declarationValue?: string) => string = (_ident, _declarationValue) => `paint(${_ident}, ${_declarationValue !== undefined ? `, ${_declarationValue}` : ""})`;

/**
 * The `palette-mix()` CSS function.
 *
 * **Syntax**: `palette-mix(<color-interpolation-method> , [ [normal | light | dark | <palette-identifier> | <palette-mix()> ] && <percentage [0,100]>? ]#{2})`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-fonts-4
 */
export const fnPaletteMix: (_colorInterpolationMethod: string, keyword0: 'normal', keyword1: 'light', keyword2: 'dark', _paletteIdentifier: string, _paletteMix: string, _percentage0100?: Percentage) => string = (_colorInterpolationMethod, keyword0, keyword1, keyword2, _paletteIdentifier, _paletteMix, _percentage0100) => `palette-mix(${_colorInterpolationMethod}, ${keyword0}, ${keyword1}, ${keyword2}, ${_paletteIdentifier}, ${_paletteMix}, ${_percentage0100 !== undefined ? `, ${_percentage0100}` : ""})`;

/**
 * The `param()` CSS function.
 *
 * **Syntax**: `param( <dashed-ident> , <declaration-value>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-link-params-1
 */
export const fnParam: (_dashedIdent: string, _declarationValue?: string) => string = (_dashedIdent, _declarationValue) => `param(${_dashedIdent}, ${_declarationValue !== undefined ? `, ${_declarationValue}` : ""})`;

/**
 * The `path()` CSS function.
 *
 * **Syntax**: `path( <'fill-rule'>? , <string> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-shapes-1
 */
export const fnPath: (_fillRule?: string, _string?: string) => string = (_fillRule, _string) => `path(${_fillRule !== undefined ? `, ${_fillRule}` : ""}, ${_string !== undefined ? `, ${_string}` : ""})`;

/**
 * The `perspective()` CSS function.
 *
 * **Syntax**: `perspective( [ <length [0,∞]> | none ] )`
 *
 * **Status**: 🟢 modern
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **36** | **16** | **9** | **12** |
 *
 * @spec css-transforms-2
 */
export const fnPerspective: (_length0: Length, keyword0: 'none') => string = (_length0, keyword0) => `perspective(_length0, keyword0)`;

/**
 * The `pointer()` CSS function.
 *
 * **Syntax**: `pointer( [ <pointer-source> || <pointer-axis> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec pointer-animations-1
 */
export const fnPointer: (_pointerSource: string, _pointerAxis?: string) => string = (_pointerSource, _pointerAxis) => `pointer(${_pointerSource}, ${_pointerAxis !== undefined ? `, ${_pointerAxis}` : ""})`;

/**
 * The `polygon()` CSS function.
 *
 * **Syntax**: `polygon( <'fill-rule'>? [ round <length> ]? , [<length-percentage> <length-percentage>]# )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-shapes-1
 */
export const fnPolygon: (_fillRule: string, keyword0: 'round', _length?: Length, _lengthPercentage?: LengthPercentage, _lengthPercentage5?: LengthPercentage) => string = (_fillRule, keyword0, _length, _lengthPercentage, _lengthPercentage5) => `polygon(${_fillRule}, ${keyword0}, ${_length !== undefined ? `, ${_length}` : ""}, ${_lengthPercentage !== undefined ? `, ${_lengthPercentage}` : ""}, ${_lengthPercentage5 !== undefined ? `, ${_lengthPercentage5}` : ""})`;

/**
 * The `pow()` CSS function.
 *
 * **Syntax**: `pow( <calc-sum>, <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnPow: (_calcSum: string, _calcSum2: string) => string = (_calcSum, _calcSum2) => `pow(_calcSum, _calcSum2)`;

/**
 * The `progress()` CSS function.
 *
 * **Syntax**: `progress(<calc-sum>, <calc-sum>, <calc-sum>)`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnProgress: (_calcSum: string, _calcSum2: string, _calcSum3: string) => string = (_calcSum, _calcSum2, _calcSum3) => `progress(_calcSum, _calcSum2, _calcSum3)`;

/**
 * The `radial-gradient()` CSS function.
 *
 * **Syntax**: `radial-gradient( [ <radial-gradient-syntax> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-images-3
 */
export const fnRadialGradient: (_radialGradientSyntax: string) => string = (_radialGradientSyntax) => `radial-gradient(_radialGradientSyntax)`;

/**
 * The `random()` CSS function.
 *
 * **Syntax**: `random( <random-value-sharing>? , <calc-sum>, <calc-sum>, <calc-sum>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnRandom: (_randomValueSharing?: string, _calcSum?: string, _calcSum3?: string, _calcSum4?: string) => string = (_randomValueSharing, _calcSum, _calcSum3, _calcSum4) => `random(${_randomValueSharing !== undefined ? `, ${_randomValueSharing}` : ""}, ${_calcSum !== undefined ? `, ${_calcSum}` : ""}, ${_calcSum3 !== undefined ? `, ${_calcSum3}` : ""}, ${_calcSum4 !== undefined ? `, ${_calcSum4}` : ""})`;

/**
 * The `random-item()` CSS function.
 *
 * **Syntax**: `random-item( <random-value-sharing> , [ <declaration-value>? ]# )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnRandomItem: (_randomValueSharing: string, _declarationValue?: string) => string = (_randomValueSharing, _declarationValue) => `random-item(${_randomValueSharing}, ${_declarationValue !== undefined ? `, ${_declarationValue}` : ""})`;

/**
 * The `ray()` CSS function.
 *
 * **Syntax**: `ray( <angle> && <ray-size>? && contain? && [at <position>]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec motion-1
 */
export const fnRay: (_angle: Angle, _raySize: string, keyword0: 'contain', _position?: Position) => string = (_angle, _raySize, keyword0, _position) => `ray(${_angle}, ${_raySize}, ${keyword0}, ${_position !== undefined ? `, ${_position}` : ""})`;

/**
 * The `rect()` CSS function.
 *
 * **Syntax**: `rect( [ <length-percentage> | auto ]{4} [ round <'border-radius'> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-shapes-1
 */
export const fnRect: () => string = () => `rect()`;

/**
 * The `rect()` CSS function.
 *
 * **Syntax**: `rect( <top>, <right>, <bottom>, <left> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-masking-1
 */
export const fnRect2: (_top: string, _right: string, _bottom: string, _left: string) => string = (_top, _right, _bottom, _left) => `rect(_top, _right, _bottom, _left)`;

/**
 * The `rem()` CSS function.
 *
 * **Syntax**: `rem( <calc-sum>, <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnRem: (_calcSum: string, _calcSum2: string) => string = (_calcSum, _calcSum2) => `rem(_calcSum, _calcSum2)`;

/**
 * The `repeating-conic-gradient()` CSS function.
 *
 * **Syntax**: `repeating-conic-gradient( [ <conic-gradient-syntax> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-images-4
 */
export const fnRepeatingConicGradient: (_conicGradientSyntax: string) => string = (_conicGradientSyntax) => `repeating-conic-gradient(_conicGradientSyntax)`;

/**
 * The `repeating-linear-gradient()` CSS function.
 *
 * **Syntax**: `repeating-linear-gradient( [ <linear-gradient-syntax> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-images-4
 */
export const fnRepeatingLinearGradient: (_linearGradientSyntax: string) => string = (_linearGradientSyntax) => `repeating-linear-gradient(_linearGradientSyntax)`;

/**
 * The `repeating-radial-gradient()` CSS function.
 *
 * **Syntax**: `repeating-radial-gradient( [ <radial-gradient-syntax> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-images-4
 */
export const fnRepeatingRadialGradient: (_radialGradientSyntax: string) => string = (_radialGradientSyntax) => `repeating-radial-gradient(_radialGradientSyntax)`;

/**
 * The `rgb()` CSS function.
 *
 * **Syntax**: `[ <legacy-rgb-syntax> | <modern-rgb-syntax> ]`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-4
 */
export const fnRgb: (_legacyRgbSyntax: string, _modernRgbSyntax: string) => string = (_legacyRgbSyntax, _modernRgbSyntax) => `rgb(_legacyRgbSyntax, _modernRgbSyntax)`;

/**
 * The `rgba()` CSS function.
 *
 * **Syntax**: `[ <legacy-rgba-syntax> | <modern-rgba-syntax> ]`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-color-4
 */
export const fnRgba: (_legacyRgbaSyntax: string, _modernRgbaSyntax: string) => string = (_legacyRgbaSyntax, _modernRgbaSyntax) => `rgba(_legacyRgbaSyntax, _modernRgbaSyntax)`;

/**
 * The `rotate()` CSS function.
 *
 * **Syntax**: `rotate( [ <angle> | <zero> ] )`
 *
 * **Status**: 🟢 modern
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **104** | **72** | **14.1** | **104** |
 *
 * @spec css-transforms-1
 */
export const fnRotate: (_angle: Angle, _zero: string) => string = (_angle, _zero) => `rotate(_angle, _zero)`;

/**
 * The `rotate3d()` CSS function.
 *
 * **Syntax**: `rotate3d( <number> , <number> , <number> , [ <angle> | <zero> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-2
 */
export const fnRotate3D: (value0: 'rotate3d') => string = (value0) => `rotate3d(value0)`;

/**
 * The `rotateX()` CSS function.
 *
 * **Syntax**: `rotateX( [ <angle> | <zero> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-2
 */
export const fnRotateX: (_angle: Angle, _zero: string) => string = (_angle, _zero) => `rotateX(_angle, _zero)`;

/**
 * The `rotateY()` CSS function.
 *
 * **Syntax**: `rotateY( [ <angle> | <zero> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-2
 */
export const fnRotateY: (_angle: Angle, _zero: string) => string = (_angle, _zero) => `rotateY(_angle, _zero)`;

/**
 * The `rotateZ()` CSS function.
 *
 * **Syntax**: `rotateZ( [ <angle> | <zero> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-2
 */
export const fnRotateZ: (_angle: Angle, _zero: string) => string = (_angle, _zero) => `rotateZ(_angle, _zero)`;

/**
 * The `round()` CSS function.
 *
 * **Syntax**: `round( <rounding-strategy>?, <calc-sum>, <calc-sum>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnRound: (_roundingStrategy?: string, _calcSum?: string, _calcSum3?: string) => string = (_roundingStrategy, _calcSum, _calcSum3) => `round(${_roundingStrategy !== undefined ? `, ${_roundingStrategy}` : ""}, ${_calcSum !== undefined ? `, ${_calcSum}` : ""}, ${_calcSum3 !== undefined ? `, ${_calcSum3}` : ""})`;

/**
 * The `running()` CSS function.
 *
 * **Syntax**: `running( <custom-ident> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-gcpm-3
 */
export const fnRunning: (_customIdent: string) => string = (_customIdent) => `running(_customIdent)`;

/**
 * The `saturate()` CSS function.
 *
 * **Syntax**: `saturate( [ <number> | <percentage> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec filter-effects-1
 */
export const fnSaturate: (_number: CSSNumber, _percentage?: Percentage) => string = (_number, _percentage) => `saturate(${_number}, ${_percentage !== undefined ? `, ${_percentage}` : ""})`;

/**
 * The `scale()` CSS function.
 *
 * **Syntax**: `scale( [ <number> | <percentage> ]#{1,2} )`
 *
 * **Status**: 🟢 modern
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **104** | **72** | **14.1** | **104** |
 *
 * @spec css-transforms-2
 */
export const fnScale: (_number: CSSNumber, _percentage: Percentage) => string = (_number, _percentage) => `scale(_number, _percentage)`;

/**
 * The `scale()` CSS function.
 *
 * **Syntax**: `scale( <number> , <number>? )`
 *
 * **Status**: 🟢 modern
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **104** | **72** | **14.1** | **104** |
 *
 * @spec css-transforms-1
 */
export const fnScale2: (_number: CSSNumber, _number2?: CSSNumber) => string = (_number, _number2) => `scale(${_number}, ${_number2 !== undefined ? `, ${_number2}` : ""})`;

/**
 * The `scale3d()` CSS function.
 *
 * **Syntax**: `scale3d( [ <number> | <percentage> ]#{3} )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-2
 */
export const fnScale3D: (value0: 'scale3d') => string = (value0) => `scale3d(value0)`;

/**
 * The `scaleX()` CSS function.
 *
 * **Syntax**: `scaleX( [ <number> | <percentage> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-2
 */
export const fnScaleX: (_number: CSSNumber, _percentage: Percentage) => string = (_number, _percentage) => `scaleX(_number, _percentage)`;

/**
 * The `scaleX()` CSS function.
 *
 * **Syntax**: `scaleX( <number> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-1
 */
export const fnScaleX2: (_number: CSSNumber) => string = (_number) => `scaleX(_number)`;

/**
 * The `scaleY()` CSS function.
 *
 * **Syntax**: `scaleY( [ <number> | <percentage> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-2
 */
export const fnScaleY: (_number: CSSNumber, _percentage: Percentage) => string = (_number, _percentage) => `scaleY(_number, _percentage)`;

/**
 * The `scaleY()` CSS function.
 *
 * **Syntax**: `scaleY( <number> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-1
 */
export const fnScaleY2: (_number: CSSNumber) => string = (_number) => `scaleY(_number)`;

/**
 * The `scaleZ()` CSS function.
 *
 * **Syntax**: `scaleZ( [ <number> | <percentage> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-2
 */
export const fnScaleZ: (_number: CSSNumber, _percentage: Percentage) => string = (_number, _percentage) => `scaleZ(_number, _percentage)`;

/**
 * The `scroll()` CSS function.
 *
 * **Syntax**: `scroll( [ <scroller> || <axis> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec scroll-animations-1
 */
export const fnScroll: (_scroller: string, _axis?: string) => string = (_scroller, _axis) => `scroll(${_scroller}, ${_axis !== undefined ? `, ${_axis}` : ""})`;

/**
 * The `sepia()` CSS function.
 *
 * **Syntax**: `sepia( [ <number> | <percentage> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec filter-effects-1
 */
export const fnSepia: (_number: CSSNumber, _percentage?: Percentage) => string = (_number, _percentage) => `sepia(${_number}, ${_percentage !== undefined ? `, ${_percentage}` : ""})`;

/**
 * The `shape()` CSS function.
 *
 * **Syntax**: `shape( <'fill-rule'>? from <position> , <shape-command># )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-shapes-1
 */
export const fnShape: (_fillRule?: string, _position?: Position, _shapeCommand?: string) => string = (_fillRule, _position, _shapeCommand) => `shape(${_fillRule !== undefined ? `, ${_fillRule}` : ""}, ${_position !== undefined ? `, ${_position}` : ""}, ${_shapeCommand !== undefined ? `, ${_shapeCommand}` : ""})`;

/**
 * The `sign()` CSS function.
 *
 * **Syntax**: `sign( <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnSign: (_calcSum: string) => string = (_calcSum) => `sign(_calcSum)`;

/**
 * The `sin()` CSS function.
 *
 * **Syntax**: `sin( <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnSin: (_calcSum: string) => string = (_calcSum) => `sin(_calcSum)`;

/**
 * The `skew()` CSS function.
 *
 * **Syntax**: `skew( [ <angle> | <zero> ] , [ <angle> | <zero> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-1
 */
export const fnSkew: () => string = () => `skew()`;

/**
 * The `skewX()` CSS function.
 *
 * **Syntax**: `skewX( [ <angle> | <zero> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-1
 */
export const fnSkewX: (_angle: Angle, _zero: string) => string = (_angle, _zero) => `skewX(_angle, _zero)`;

/**
 * The `skewY()` CSS function.
 *
 * **Syntax**: `skewY( [ <angle> | <zero> ] )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-1
 */
export const fnSkewY: (_angle: Angle, _zero: string) => string = (_angle, _zero) => `skewY(_angle, _zero)`;

/**
 * The `snap-block()` CSS function.
 *
 * **Syntax**: `snap-block( <length> , [ start | end | near ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-page-floats-3
 */
export const fnSnapBlock: (value0: Length) => string = (value0) => `snap-block(value0)`;

/**
 * The `snap-inline()` CSS function.
 *
 * **Syntax**: `snap-inline( <length> , [ left | right | near ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-page-floats-3
 */
export const fnSnapInline: (value0: Length) => string = (value0) => `snap-inline(value0)`;

/**
 * The `sqrt()` CSS function.
 *
 * **Syntax**: `sqrt( <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnSqrt: (_calcSum: string) => string = (_calcSum) => `sqrt(_calcSum)`;

/**
 * The `src()` CSS function.
 *
 * **Syntax**: `src( <string> <url-modifier>* )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnSrc: (_string: string, _urlModifier: string) => string = (_string, _urlModifier) => `src(_string, _urlModifier)`;

/**
 * The `steps()` CSS function.
 *
 * **Syntax**: `steps( <integer>, <step-position>?)`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-easing-2
 */
export const fnSteps: (_integer: CSSInteger, _stepPosition?: string) => string = (_integer, _stepPosition) => `steps(${_integer}, ${_stepPosition !== undefined ? `, ${_stepPosition}` : ""})`;

/**
 * The `string()` CSS function.
 *
 * **Syntax**: `string( <custom-ident> , [ first | start | last | first-except ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-content-3
 */
export const fnString: (value0: string) => string = (value0) => `string(value0)`;

/**
 * The `stripes()` CSS function.
 *
 * **Syntax**: `stripes( <color-stripe># )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-images-4
 */
export const fnStripes: (_colorStripe: string) => string = (_colorStripe) => `stripes(_colorStripe)`;

/**
 * The `superellipse()` CSS function.
 *
 * **Syntax**: `superellipse(<number> | infinity | -infinity)`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-borders-4
 */
export const fnSuperellipse: (value0: CSSNumber) => string = (value0) => `superellipse(value0)`;

/**
 * The `supports()` CSS function.
 *
 * **Syntax**: `supports( <declaration> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-conditional-5
 */
export const fnSupports: (_declaration: string) => string = (_declaration) => `supports(_declaration)`;

/**
 * The `symbols()` CSS function.
 *
 * **Syntax**: `symbols( <symbols-type>? [ <string> | <image> ]+ )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-counter-styles-3
 */
export const fnSymbols: (value0: string) => string = (value0) => `symbols(value0)`;

/**
 * The `tan()` CSS function.
 *
 * **Syntax**: `tan( <calc-sum> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnTan: (_calcSum: string) => string = (_calcSum) => `tan(_calcSum)`;

/**
 * The `target-counter()` CSS function.
 *
 * **Syntax**: `target-counter( [ <string> | <url> ] , <custom-ident> , <counter-style>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-content-3
 */
export const fnTargetCounter: () => string = () => `target-counter()`;

/**
 * The `target-counters()` CSS function.
 *
 * **Syntax**: `target-counters( [ <string> | <url> ] , <custom-ident> , <string> , <counter-style>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-content-3
 */
export const fnTargetCounters: () => string = () => `target-counters()`;

/**
 * The `target-text()` CSS function.
 *
 * **Syntax**: `target-text( [ <string> | <url> ] , [ content | before | after | first-letter ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-content-3
 */
export const fnTargetText: () => string = () => `target-text()`;

/**
 * The `toggle()` CSS function.
 *
 * **Syntax**: `toggle( <whole-value># )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnToggle: (_wholeValue: string) => string = (_wholeValue) => `toggle(_wholeValue)`;

/**
 * The `transform-interpolate()` CSS function.
 *
 * **Syntax**: `transform-interpolate( [ <progress-source> && [ by <easing-function> ]? && <easing-function>? ], <input-position>{1,2} : <transform-list>, [ <easing-function>?, <input-position>{1,2} : <transform-list> ]#? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnTransformInterpolate: (_progressSource: string, _easingFunction?: string, _easingFunction3?: string, _inputPosition?: string, _transformList?: string, _easingFunction6?: string, _inputPosition7?: string, _transformList8?: string) => string = (_progressSource, _easingFunction, _easingFunction3, _inputPosition, _transformList, _easingFunction6, _inputPosition7, _transformList8) => `transform-interpolate(${_progressSource}, ${_easingFunction !== undefined ? `, ${_easingFunction}` : ""}, ${_easingFunction3 !== undefined ? `, ${_easingFunction3}` : ""}, ${_inputPosition !== undefined ? `, ${_inputPosition}` : ""}, ${_transformList !== undefined ? `, ${_transformList}` : ""}, ${_easingFunction6 !== undefined ? `, ${_easingFunction6}` : ""}, ${_inputPosition7 !== undefined ? `, ${_inputPosition7}` : ""}, ${_transformList8 !== undefined ? `, ${_transformList8}` : ""})`;

/**
 * The `transform-mix()` CSS function.
 *
 * **Syntax**: `transform-mix( [ <transform-list> && <percentage [0,100]> ]# )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnTransformMix: (_transformList: string, _percentage0100: Percentage) => string = (_transformList, _percentage0100) => `transform-mix(_transformList, _percentage0100)`;

/**
 * The `translate()` CSS function.
 *
 * **Syntax**: `translate( <length-percentage> , <length-percentage>? )`
 *
 * **Status**: 🟢 modern
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **104** | **72** | **14.1** | **104** |
 *
 * @spec css-transforms-1
 */
export const fnTranslate: (_lengthPercentage: LengthPercentage, _lengthPercentage2?: LengthPercentage) => string = (_lengthPercentage, _lengthPercentage2) => `translate(${_lengthPercentage}, ${_lengthPercentage2 !== undefined ? `, ${_lengthPercentage2}` : ""})`;

/**
 * The `translate3d()` CSS function.
 *
 * **Syntax**: `translate3d( <length-percentage> , <length-percentage> , <length> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-2
 */
export const fnTranslate3D: (keyword0: 'translate3d', _lengthPercentage: LengthPercentage, _lengthPercentage3: LengthPercentage, _length: Length) => string = (keyword0, _lengthPercentage, _lengthPercentage3, _length) => `translate3d(keyword0, _lengthPercentage, _lengthPercentage3, _length)`;

/**
 * The `translateX()` CSS function.
 *
 * **Syntax**: `translateX( <length-percentage> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-1
 */
export const fnTranslateX: (_lengthPercentage: LengthPercentage) => string = (_lengthPercentage) => `translateX(_lengthPercentage)`;

/**
 * The `translateY()` CSS function.
 *
 * **Syntax**: `translateY( <length-percentage> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-1
 */
export const fnTranslateY: (_lengthPercentage: LengthPercentage) => string = (_lengthPercentage) => `translateY(_lengthPercentage)`;

/**
 * The `translateZ()` CSS function.
 *
 * **Syntax**: `translateZ( <length> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-transforms-2
 */
export const fnTranslateZ: (_length: Length) => string = (_length) => `translateZ(_length)`;

/**
 * The `type()` CSS function.
 *
 * **Syntax**: `type( <syntax> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-mixins-1
 */
export const fnType: (_syntax: string) => string = (_syntax) => `type(_syntax)`;

/**
 * The `type()` CSS function.
 *
 * **Syntax**: `type( <syntax> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-5
 */
export const fnType2: (_syntax: string) => string = (_syntax) => `type(_syntax)`;

/**
 * The `type()` CSS function.
 *
 * **Syntax**: `type( <string> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-images-4
 */
export const fnType3: (_string: string) => string = (_string) => `type(_string)`;

/**
 * The `url()` CSS function.
 *
 * **Syntax**: `url( <string> <url-modifier>* ) | <url-token>`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-values-4
 */
export const fnUrl: (value0: 'url') => string = (value0) => `url(value0)`;

/**
 * The `url-pattern()` CSS function.
 *
 * **Syntax**: `url-pattern( <string> )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-navigation-1
 */
export const fnUrlPattern: (_string: string) => string = (_string) => `url-pattern(_string)`;

/**
 * The `var()` CSS function.
 *
 * **Syntax**: `var( <custom-property-name> , <declaration-value>? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-variables-2
 */
export const fnVar: (_customPropertyName: string, _declarationValue?: string) => string = (_customPropertyName, _declarationValue) => `var(${_customPropertyName}, ${_declarationValue !== undefined ? `, ${_declarationValue}` : ""})`;

/**
 * The `view()` CSS function.
 *
 * **Syntax**: `view( [ <axis> || <'view-timeline-inset'> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec scroll-animations-1
 */
export const fnView: (_axis: string, _viewTimelineInset?: string) => string = (_axis, _viewTimelineInset) => `view(${_axis}, ${_viewTimelineInset !== undefined ? `, ${_viewTimelineInset}` : ""})`;

/**
 * The `xywh()` CSS function.
 *
 * **Syntax**: `xywh( <length-percentage>{2} <length-percentage [0,∞]>{2} [ round <'border-radius'> ]? )`
 *
 * **Status**: 🟡 experimental
 *
 * **Browser Support**:
 *
 * | Chrome | Firefox | Safari | Edge |
 * | :----: | :-----: | :----: | :---: |
 * | **✓** | **✓** | **✓** | **✓** |
 *
 * @spec css-shapes-1
 */
export const fnXywh: (_lengthPercentage: LengthPercentage, _lengthPercentage0: LengthPercentage, keyword0: 'round', _borderRadius?: string) => string = (_lengthPercentage, _lengthPercentage0, keyword0, _borderRadius) => `xywh(${_lengthPercentage}, ${_lengthPercentage0}, ${keyword0}, ${_borderRadius !== undefined ? `, ${_borderRadius}` : ""})`;
