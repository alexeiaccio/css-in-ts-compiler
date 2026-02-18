/**
 * Core Type System
 *
 * Strongly typed CSS values with branded types for type safety.
 */

declare const __brand: unique symbol;

type Brand<T, B> = T & { [__brand]: B };

export type Typed<T, B> = Brand<T, B>;

export function createTyped<T, B>(value: T): Typed<T, B> {
	return value as Typed<T, B>;
}

// ============================================================================
// CSS Global Keywords
// ============================================================================

export type CSSGlobalKeyword = "inherit" | "initial" | "unset" | "revert" | "revert-layer";

// ============================================================================
// Auto & None
// ============================================================================

export type Auto = "auto";
export const auto: Auto = "auto";

export type None = "none";
export const none: None = "none";

export type Normal = "normal";
export const normal: Normal = "normal";

// ============================================================================
// Numeric Types
// ============================================================================

export type CSSNumber = number & { readonly __cssNumber: unique symbol };
export type CSSInteger = number & { readonly __cssInteger: unique symbol };
export type Zero = 0;

// ============================================================================
// Length Units
// ============================================================================

export type Px = `${number}px` & { readonly __px: unique symbol };
export type Rem = `${number}rem` & { readonly __rem: unique symbol };
export type Em = `${number}em` & { readonly __em: unique symbol };
export type Ch = `${number}ch` & { readonly __ch: unique symbol };
export type Ex = `${number}ex` & { readonly __ex: unique symbol };
export type Ic = `${number}ic` & { readonly __ic: unique symbol };
export type Cap = `${number}cap` & { readonly __cap: unique symbol };
export type Lh = `${number}lh` & { readonly __lh: unique symbol };
export type Rcap = `${number}rcap` & { readonly __rcap: unique symbol };
export type Rch = `${number}rch` & { readonly __rch: unique symbol };
export type Rem2 = `${number}rem` & { readonly __rem: unique symbol };
export type Rex = `${number}rex` & { readonly __rex: unique symbol };
export type Rlh = `${number}rlh` & { readonly __rlh: unique symbol };
export type Vw = `${number}vw` & { readonly __vw: unique symbol };
export type Vh = `${number}vh` & { readonly __vh: unique symbol };
export type Vmin = `${number}vmin` & { readonly __vmin: unique symbol };
export type Vmax = `${number}vmax` & { readonly __vmax: unique symbol };
export type Vb = `${number}vb` & { readonly __vb: unique symbol };
export type Vi = `${number}vi` & { readonly __vi: unique symbol };
export type Cqw = `${number}cqw` & { readonly __cqw: unique symbol };
export type Cqh = `${number}cqh` & { readonly __cqh: unique symbol };
export type Cqi = `${number}cqi` & { readonly __cqi: unique symbol };
export type Cqb = `${number}cqb` & { readonly __cqb: unique symbol };
export type Cqmin = `${number}cqmin` & { readonly __cqmin: unique symbol };
export type Cqmax = `${number}cqmax` & { readonly __cqmax: unique symbol };

// Absolute lengths
export type Cm = `${number}cm` & { readonly __cm: unique symbol };
export type Mm = `${number}mm` & { readonly __mm: unique symbol };
export type Q = `${number}Q` & { readonly __q: unique symbol };
export type In = `${number}in` & { readonly __in: unique symbol };
export type Pc = `${number}pc` & { readonly __pc: unique symbol };
export type Pt = `${number}pt` & { readonly __pt: unique symbol };

// ============================================================================
// Angle Units
// ============================================================================

export type Deg = `${number}deg` & { readonly __deg: unique symbol };
export type Rad = `${number}rad` & { readonly __rad: unique symbol };
export type Grad = `${number}grad` & { readonly __grad: unique symbol };
export type Turn = `${number}turn` & { readonly __turn: unique symbol };

// ============================================================================
// Time Units
// ============================================================================

export type Seconds = `${number}s` & { readonly __seconds: unique symbol };
export type Milliseconds = `${number}ms` & { readonly __milliseconds: unique symbol };

// ============================================================================
// Frequency Units
// ============================================================================

export type Hz = `${number}Hz` & { readonly __hz: unique symbol };
export type kHz = `${number}kHz` & { readonly __khz: unique symbol };

// ============================================================================
// Resolution Units
// ============================================================================

export type Dpi = `${number}dpi` & { readonly __dpi: unique symbol };
export type Dpcm = `${number}dpcm` & { readonly __dpcm: unique symbol };
export type Dppx = `${number}dppx` & { readonly __dppx: unique symbol };

// ============================================================================
// Percentage
// ============================================================================

export type Percentage = `${number}%` & { readonly __percentage: unique symbol };

// ============================================================================
// Composite Types
// ============================================================================

export type Length = number | Px | Rem | Em | Ch | Ex | Ic | Cap | Lh | Rcap | Rch | Rex | Rlh | Vw | Vh | Vmin | Vmax | Vb | Vi | Cqw | Cqh | Cqi | Cqb | Cqmin | Cqmax | Cm | Mm | Q | In | Pc | Pt;

export type Angle = number | Deg | Rad | Grad | Turn;

export type Time = Seconds | Milliseconds;

export type Frequency = Hz | kHz;

export type Resolution = Dpi | Dpcm | Dppx;

export type LengthPercentage = Length | Percentage;

export type AnglePercentage = Angle | Percentage;

export type TimePercentage = Time | Percentage;

// ============================================================================
// Color Types
// ============================================================================

export type NamedColor = string & { readonly __namedColor: unique symbol };

export type HexColor = `#${string}` & { readonly __hexColor: unique symbol };

export type RgbColor = `rgb(${string})` & { readonly __rgbColor: unique symbol };
export type RgbaColor = `rgba(${string})` & { readonly __rgbaColor: unique symbol };

export type HslColor = `hsl(${string})` & { readonly __hslColor: unique symbol };
export type HslaColor = `hsla(${string})` & { readonly __hslaColor: unique symbol };

export type OklchColor = `oklch(${string})` & { readonly __oklchColor: unique symbol };
export type OklabColor = `oklab(${string})` & { readonly __oklabColor: unique symbol };

export type ColorFunction = `color(${string})` & { readonly __colorFunction: unique symbol };

export type Color = NamedColor | HexColor | RgbColor | RgbaColor | HslColor | HslaColor | OklchColor | OklabColor | ColorFunction;

// ============================================================================
// Transform Function Types
// ============================================================================

export type Matrix = `matrix(${string})` & { readonly __matrix: unique symbol };
export type Matrix3d = `matrix3d(${string})` & { readonly __matrix3d: unique symbol };

export type Translate = `translate(${string})` & { readonly __translate: unique symbol };
export type TranslateX = `translateX(${string})` & { readonly __translateX: unique symbol };
export type TranslateY = `translateY(${string})` & { readonly __translateY: unique symbol };
export type TranslateZ = `translateZ(${string})` & { readonly __translateZ: unique symbol };
export type Translate3d = `translate3d(${string})` & { readonly __translate3d: unique symbol };

export type Scale = `scale(${string})` & { readonly __scale: unique symbol };
export type ScaleX = `scaleX(${string})` & { readonly __scaleX: unique symbol };
export type ScaleY = `scaleY(${string})` & { readonly __scaleY: unique symbol };
export type ScaleZ = `scaleZ(${string})` & { readonly __scaleZ: unique symbol };
export type Scale3d = `scale3d(${string})` & { readonly __scale3d: unique symbol };

export type Rotate = `rotate(${string})` & { readonly __rotate: unique symbol };
export type RotateX = `rotateX(${string})` & { readonly __rotateX: unique symbol };
export type RotateY = `rotateY(${string})` & { readonly __rotateY: unique symbol };
export type RotateZ = `rotateZ(${string})` & { readonly __rotateZ: unique symbol };
export type Rotate3d = `rotate3d(${string})` & { readonly __rotate3d: unique symbol };

export type Skew = `skew(${string})` & { readonly __skew: unique symbol };
export type SkewX = `skewX(${string})` & { readonly __skewX: unique symbol };
export type SkewY = `skewY(${string})` & { readonly __skewY: unique symbol };

export type Perspective = `perspective(${string})` & { readonly __perspective: unique symbol };

export type TransformFunction = 
	| Matrix | Matrix3d 
	| Translate | TranslateX | TranslateY | TranslateZ | Translate3d
	| Scale | ScaleX | ScaleY | ScaleZ | Scale3d
	| Rotate | RotateX | RotateY | RotateZ | Rotate3d
	| Skew | SkewX | SkewY
	| Perspective;

export type TransformList = string;

// ============================================================================
// Filter Function Types
// ============================================================================

export type Blur = `blur(${string})` & { readonly __blur: unique symbol };
export type Brightness = `brightness(${string})` & { readonly __brightness: unique symbol };
export type Contrast = `contrast(${string})` & { readonly __contrast: unique symbol };
export type DropShadow = `drop-shadow(${string})` & { readonly __dropShadow: unique symbol };
export type Grayscale = `grayscale(${string})` & { readonly __grayscale: unique symbol };
export type HueRotate = `hue-rotate(${string})` & { readonly __hueRotate: unique symbol };
export type Invert = `invert(${string})` & { readonly __invert: unique symbol };
export type Opacity = `opacity(${string})` & { readonly __opacity: unique symbol };
export type Saturate = `saturate(${string})` & { readonly __saturate: unique symbol };
export type Sepia = `sepia(${string})` & { readonly __sepia: unique symbol };

export type FilterFunction = Blur | Brightness | Contrast | DropShadow | Grayscale | HueRotate | Invert | Opacity | Saturate | Sepia;

// ============================================================================
// Position Types
// ============================================================================

export type PositionKeyword = "top" | "right" | "bottom" | "left" | "center";

export type PositionValue = PositionKeyword | LengthPercentage;

export type Position = PositionValue | `${PositionValue} ${PositionValue}`;

// ============================================================================
// Unit Helpers
// ============================================================================

export const px = (value: number): Px => `${value}px` as Px;
export const rem = (value: number): Rem => `${value}rem` as Rem;
export const em = (value: number): Em => `${value}em` as Em;
export const ch = (value: number): Ch => `${value}ch` as Ch;
export const vw = (value: number): Vw => `${value}vw` as Vw;
export const vh = (value: number): Vh => `${value}vh` as Vh;
export const pct = (value: number): Percentage => `${value}%` as Percentage;

export const deg = (value: number): Deg => `${value}deg` as Deg;
export const rad = (value: number): Rad => `${value}rad` as Rad;
export const grad = (value: number): Grad => `${value}grad` as Grad;
export const turn = (value: number): Turn => `${value}turn` as Turn;

export const sec = (value: number): Seconds => `${value}s` as Seconds;
export const ms = (value: number): Milliseconds => `${value}ms` as Milliseconds;
