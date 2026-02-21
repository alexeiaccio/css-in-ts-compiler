/**
 * Branded Types for CSS Values
 *
 * Provides type-safe CSS value types using branding pattern.
 */

declare const __brand: unique symbol;

export type Brand<T, B extends string> = T & { [__brand]: B };

export type Typed<T, B extends string> = Brand<T, B>;

export function createTyped<T, B extends string>(value: T): Typed<T, B> {
	return value as Typed<T, B>;
}

// ============================================================================
// CSS Global Keywords
// ============================================================================

export type CSSGlobalKeyword = "inherit" | "initial" | "unset" | "revert" | "revert-layer";

// ============================================================================
// Common Values
// ============================================================================

export type Auto = "auto";
export type None = "none";
export type Normal = "normal";

// ============================================================================
// Unit Types (from csstree data)
// ============================================================================

// Length units
export type Px = Brand<`${number}px`, "Px">;
export type Rem = Brand<`${number}rem`, "Rem">;
export type Em = Brand<`${number}em`, "Em">;
export type Ch = Brand<`${number}ch`, "Ch">;
export type Ex = Brand<`${number}ex`, "Ex">;
export type Vw = Brand<`${number}vw`, "Vw">;
export type Vh = Brand<`${number}vh`, "Vh">;
export type Vmin = Brand<`${number}vmin`, "Vmin">;
export type Vmax = Brand<`${number}vmax`, "Vmax">;
export type Cqw = Brand<`${number}cqw`, "Cqw">;
export type Cqh = Brand<`${number}cqh`, "Cqh">;
export type Cqi = Brand<`${number}cqi`, "Cqi">;
export type Cqb = Brand<`${number}cqb`, "Cqb">;

// Absolute length units
export type Cm = Brand<`${number}cm`, "Cm">;
export type Mm = Brand<`${number}mm`, "Mm">;
export type In = Brand<`${number}in`, "In">;
export type Pt = Brand<`${number}pt`, "Pt">;
export type Pc = Brand<`${number}pc`, "Pc">;

// Angle units
export type Deg = Brand<`${number}deg`, "Deg">;
export type Rad = Brand<`${number}rad`, "Rad">;
export type Grad = Brand<`${number}grad`, "Grad">;
export type Turn = Brand<`${number}turn`, "Turn">;

// Time units
export type Sec = Brand<`${number}s`, "Sec">;
export type Ms = Brand<`${number}ms`, "Ms">;

// Percentage
export type Percentage = Brand<`${number}%`, "Percentage">;

// ============================================================================
// Composite Types
// ============================================================================

export type LengthUnit = Px | Rem | Em | Ch | Ex | Vw | Vh | Vmin | Vmax | Cqw | Cqh | Cqi | Cqb | Cm | Mm | In | Pt | Pc;

export type AngleUnit = Deg | Rad | Grad | Turn;

export type TimeUnit = Sec | Ms;

export type Length = LengthUnit | number;

export type Angle = AngleUnit | number;

export type Time = TimeUnit;

export type LengthPercentage = Length | Percentage;

export type AnglePercentage = Angle | Percentage;

// ============================================================================
// Color Types
// ============================================================================

export type NamedColor = Brand<string, "NamedColor">;
export type HexColor = Brand<`#${string}`, "HexColor">;
export type RgbColor = Brand<`rgb(${string})`, "RgbColor">;
export type RgbaColor = Brand<`rgba(${string})`, "RgbaColor">;
export type HslColor = Brand<`hsl(${string})`, "HslColor">;
export type HslaColor = Brand<`hsla(${string})`, "HslaColor">;
export type OklchColor = Brand<`oklch(${string})`, "OklchColor">;
export type OklabColor = Brand<`oklab(${string})`, "OklabColor">;
export type ColorFunction = Brand<`color(${string})`, "ColorFunction">;

export type Color =
	| NamedColor
	| HexColor
	| RgbColor
	| RgbaColor
	| HslColor
	| HslaColor
	| OklchColor
	| OklabColor
	| ColorFunction;

// ============================================================================
// Unit Constructors
// ============================================================================

export const px = (value: number): Px => `${value}px` as Px;
export const rem = (value: number): Rem => `${value}rem` as Rem;
export const em = (value: number): Em => `${value}em` as Em;
export const ch = (value: number): Ch => `${value}ch` as Ch;
export const vw = (value: number): Vw => `${value}vw` as Vw;
export const vh = (value: number): Vh => `${value}vh` as Vh;
export const pct = (value: number): Percentage => `${value}%` as Percentage;
export const deg = (value: number): Deg => `${value}deg` as Deg;
export const turn = (value: number): Turn => `${value}turn` as Turn;
export const sec = (value: number): Sec => `${value}s` as Sec;
export const ms = (value: number): Ms => `${value}ms` as Ms;
