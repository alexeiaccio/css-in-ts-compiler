/**
 * Branded TypeScript Types for CSS-in-TS
 * Template literal types for compile-time validation
 */

declare const __cssint: unique symbol;

// ============================================================================
// Length Units
// ============================================================================

/** Pixel values: `${number}px` */
export type Pixels = `${number}px`;

/** em units: `${number}em` */
export type Ems = `${number}em`;

/** rem units: `${number}rem` */
export type Rems = `${number}rem`;

/** Percentage: `${number}%` */
export type Percent = `${number}%`;

// Viewport Width units
export type ViewportWidth = 
  | `${number}vw` 
  | `${number}svw` 
  | `${number}lvw` 
  | `${number}dvw`;

// Viewport Height units
export type ViewportHeight = 
  | `${number}vh` 
  | `${number}svh` 
  | `${number}lvh` 
  | `${number}dvh`;

// Viewport Min/Max units
export type ViewportMin = 
  | `${number}vmin` 
  | `${number}svmin` 
  | `${number}lvmin` 
  | `${number}dvmin`;

export type ViewportMax = 
  | `${number}vmax` 
  | `${number}svmax` 
  | `${number}lvmax` 
  | `${number}dvmax`;

// Viewport Inline/Block (logical)
export type ViewportInline = 
  | `${number}vi` 
  | `${number}svi` 
  | `${number}lvi` 
  | `${number}dvi`;

export type ViewportBlock = 
  | `${number}vb` 
  | `${number}svb` 
  | `${number}lvb` 
  | `${number}dvb`;

// Container Query units
export type ContainerWidth = `${number}cqw`;
export type ContainerHeight = `${number}cqh`;
export type ContainerInline = `${number}cqi`;
export type ContainerBlock = `${number}cqb`;
export type ContainerMin = `${number}cqmin`;
export type ContainerMax = `${number}cqmax`;

// Font-relative units
export type FontUnits = 
  | `${number}em`
  | `${number}rem`
  | `${number}ex`
  | `${number}rex`
  | `${number}ch`
  | `${number}rch`
  | `${number}cap`
  | `${number}rcap`
  | `${number}ic`
  | `${number}ric`
  | `${number}lh`
  | `${number}rlh`;

// Absolute units
export type AbsoluteUnits =
  | `${number}px`
  | `${number}pt`
  | `${number}pc`
  | `${number}in`
  | `${number}cm`
  | `${number}mm`
  | `${number}q`;

// Number as string (for template literal compatibility)
export type NumberString = `${number}`;

// Complete length type
export type LengthValue = 
  | number  // Converts to px by default (CSS spec default)
  | NumberString
  | Pixels
  | Ems
  | Rems
  | Percent
  | ViewportWidth
  | ViewportHeight
  | ViewportMin
  | ViewportMax
  | ViewportInline
  | ViewportBlock
  | ContainerWidth
  | ContainerHeight
  | ContainerInline
  | ContainerBlock
  | ContainerMin
  | ContainerMax
  | FontUnits
  | AbsoluteUnits;

// ============================================================================
// Angle Units
// ============================================================================

export type Degrees = `${number}deg`;
export type Radians = `${number}rad`;
export type Gradians = `${number}grad`;
export type Turns = `${number}turn`;

export type AngleValue = number | Degrees | Radians | Gradians | Turns;

// ============================================================================
// Time Units
// ============================================================================

export type Seconds = `${number}s`;
export type Milliseconds = `${number}ms`;

export type TimeValue = number | Seconds | Milliseconds;

// ============================================================================
// Resolution Units
// ============================================================================

export type Dpi = `${number}dpi`;
export type Dpcm = `${number}dpcm`;
export type Dppx = `${number}dppx` | `${number}x`;

export type ResolutionValue = Dpi | Dpcm | Dppx;

// ============================================================================
// Color Types
// ============================================================================

/** Hex color: `#${string}` */
export type HexColor = `#${string}`;

/** CSS named colors */
export type NamedColor = 
  | 'transparent'
  | 'currentColor'
  | 'black' | 'white'
  | 'red' | 'green' | 'blue'
  | 'yellow' | 'cyan' | 'magenta'
  | 'orange' | 'purple' | 'pink'
  | 'gray' | 'grey'
  | 'silver' | 'gold'
  | 'navy' | 'teal' | 'lime' | 'aqua'
  | 'maroon' | 'olive' | 'fuchsia'
  | string;  // Allow any other named colors

/** CSS function types - type-safe */
export type RgbFunction = `rgb(${number}, ${number}, ${number})` | `rgb(${number} ${number} ${number})` | `rgba(${number}, ${number}, ${number}, ${number})`;
export type HslFunction = `hsl(${number}, ${number}%, ${number}%)` | `hsl(${number} ${number}% ${number}%)` | `hsla(${number}, ${number}%, ${number}%, ${number})`;
export type LabFunction = `lab(${number}% ${number} ${number})` | `lab(${number}% ${number} ${number} / ${number})`;
export type LchFunction = `lch(${number}% ${number} ${number}deg)` | `lch(${number}% ${number} ${number}deg / ${number})`;
export type OklabFunction = `oklab(${number}% ${number} ${number})` | `oklab(${number}% ${number} ${number} / ${number})`;
export type OklchFunction = `oklch(${number}% ${number} ${number}deg)` | `oklch(${number}% ${number} ${number}deg / ${number})`;
export type ColorMix = `color-mix(in ${string}, ${string}, ${string})` | `color-mix(in ${string}, ${string} ${number}%, ${string})`;
export type LightDark = `light-dark(${string}, ${string})`;
export type SystemColor = `SystemColor.${string}`;

export type ColorValue = 
  | HexColor
  | NamedColor
  | RgbFunction
  | HslFunction
  | LabFunction
  | LchFunction
  | OklabFunction
  | OklchFunction
  | ColorMix
  | LightDark
  | SystemColor;

// ============================================================================
// Branded Types (Internal)
// ============================================================================

/** Internal branded type for type-safe CSS values */
export type Branded<T, B> = T & { readonly [__cssint]: B };

/** Branded length for type-safe calc operations */
export type BrandedLength<U extends string = string> = Branded<string, { unit: U }>;

/** Branded color for type-safe color operations */
export type BrandedColor = Branded<string, 'color'>;

/** Branded angle for type-safe angle operations */
export type BrandedAngle = Branded<string, 'angle'>;

/** Branded time for type-safe time operations */
export type BrandedTime = Branded<string, 'time'>;

/** Branded calc expression */
export type CalcExpression = Branded<string, 'calc'>;
