/**
 * Branded Color Functions
 * Type-safe color construction with LightningCSS AST integration
 */

import { Effect, Data, Console } from "effect";
import type { CssColor } from "lightningcss";

// ============================================================================
// Error Types
// ============================================================================

export class ColorError extends Data.TaggedError("ColorError")<{
  message: string;
  channel?: string;
  value?: number;
}> {}

// ============================================================================
// Branded Types
// ============================================================================

declare const __color: unique symbol;

export type BrandedColor = string & {
  readonly [__color]: true;
  readonly toAST: () => CssColor;
};

// ============================================================================
// Validation Helpers
// ============================================================================

const validateChannel = (
  value: number,
  min: number,
  max: number,
  name: string
): Effect.Effect<number, ColorError> => {
  if (value < min || value > max) {
    return Effect.fail(
      new ColorError({
        message: `${name} must be between ${min} and ${max}`,
        channel: name,
        value,
      })
    );
  }
  return Effect.succeed(value);
};

// ============================================================================
// RGB / RGBA
// ============================================================================

/**
 * Create RGB color
 * @example
 * rgb(255, 128, 0)        // orange
 * rgb(255, 128, 0, 0.5)   // semi-transparent orange
 */
export const rgb = Effect.fn("rgb")(
  function* (
    this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
    r: number,
    g: number,
    b: number,
    alpha?: number
  ) {
    yield* Console.debug(`Creating RGB color: ${r}, ${g}, ${b}${alpha !== undefined ? `, ${alpha}` : ""}`);

    // Validate channels
    const validR = yield* validateChannel(r, 0, 255, "red");
    const validG = yield* validateChannel(g, 0, 255, "green");
    const validB = yield* validateChannel(b, 0, 255, "blue");
    const validAlpha = alpha !== undefined 
      ? yield* validateChannel(alpha, 0, 1, "alpha")
      : 1;

    const cssString = alpha !== undefined
      ? `rgba(${validR}, ${validG}, ${validB}, ${validAlpha})`
      : `rgb(${validR}, ${validG}, ${validB})`;

    const toAST = (): CssColor => ({
      type: "rgb",
      r: validR / 255,
      g: validG / 255,
      b: validB / 255,
      alpha: validAlpha,
    }) as unknown as CssColor;

    const result = cssString as BrandedColor;
    Object.defineProperty(result, "toAST", { value: toAST });

    yield* Console.debug(`Created color: ${cssString}`);
    return result;
  }
);

// ============================================================================
// HSL
// ============================================================================

/**
 * Create HSL color
 * @example
 * hsl(30, 100, 50)        // orange
 * hsl(30, 100, 50, 0.5)   // semi-transparent orange
 */
export const hsl = Effect.fn("hsl")(
  function* (
    this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
    h: number,
    s: number,
    l: number,
    alpha?: number
  ) {
    yield* Console.debug(`Creating HSL color: ${h}, ${s}%, ${l}%${alpha !== undefined ? `, ${alpha}` : ""}`);

    // Normalize hue to 0-360
    const normalizedH = ((h % 360) + 360) % 360;
    
    const validS = yield* validateChannel(s, 0, 100, "saturation");
    const validL = yield* validateChannel(l, 0, 100, "lightness");
    const validAlpha = alpha !== undefined 
      ? yield* validateChannel(alpha, 0, 1, "alpha")
      : 1;

    const cssString = alpha !== undefined
      ? `hsla(${normalizedH}, ${validS}%, ${validL}%, ${validAlpha})`
      : `hsl(${normalizedH}, ${validS}%, ${validL}%)`;

    const toAST = (): CssColor => {
      // Convert HSL to RGB for AST
      const s = validS / 100;
      const l = validL / 100;
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs(((normalizedH / 60) % 2) - 1));
      const m = l - c / 2;
      
      let r: number, g: number, b: number;
      if (normalizedH < 60) { r = c; g = x; b = 0; }
      else if (normalizedH < 120) { r = x; g = c; b = 0; }
      else if (normalizedH < 180) { r = 0; g = c; b = x; }
      else if (normalizedH < 240) { r = 0; g = x; b = c; }
      else if (normalizedH < 300) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }
      
      return {
        type: "rgb",
        r: r + m,
        g: g + m,
        b: b + m,
        alpha: validAlpha,
      } as unknown as CssColor;
    };

    const result = cssString as BrandedColor;
    Object.defineProperty(result, "toAST", { value: toAST });

    yield* Console.debug(`Created color: ${cssString}`);
    return result;
  }
);

// ============================================================================
// OKLCH (Perceptually uniform)
// ============================================================================

/**
 * Create OKLCH color (perceptually uniform)
 * @example
 * oklch(0.7, 0.2, 30)     // orange
 * oklch(0.7, 0.2, 30, 0.5) // semi-transparent
 */
export const oklch = Effect.fn("oklch")(
  function* (
    this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
    l: number,
    c: number,
    h: number,
    alpha?: number
  ) {
    yield* Console.debug(`Creating OKLCH color: ${l}, ${c}, ${h}${alpha !== undefined ? `, ${alpha}` : ""}`);

    const validL = yield* validateChannel(l, 0, 1, "lightness");
    const validC = yield* validateChannel(c, 0, 0.4, "chroma");
    const normalizedH = ((h % 360) + 360) % 360;
    const validAlpha = alpha !== undefined 
      ? yield* validateChannel(alpha, 0, 1, "alpha")
      : 1;

    const cssString = alpha !== undefined
      ? `oklch(${validL} ${validC} ${normalizedH} / ${validAlpha})`
      : `oklch(${validL} ${validC} ${normalizedH})`;

    const toAST = (): CssColor => {
      // Simplified OKLCH to RGB conversion for AST
      // In production, you'd use a proper color conversion library
      return {
        type: "oklch",
        l: validL,
        c: validC,
        h: normalizedH,
        alpha: validAlpha,
      } as unknown as CssColor;
    };

    const result = cssString as BrandedColor;
    Object.defineProperty(result, "toAST", { value: toAST });

    yield* Console.debug(`Created color: ${cssString}`);
    return result;
  }
);

// ============================================================================
// OKLAB (Perceptually uniform)
// ============================================================================

/**
 * Create OKLAB color (perceptually uniform)
 * @example
 * oklab(0.7, 0.1, 0.1)
 */
export const oklab = Effect.fn("oklab")(
  function* (
    this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
    l: number,
    a: number,
    b: number,
    alpha?: number
  ) {
    yield* Console.debug(`Creating OKLAB color: ${l}, ${a}, ${b}${alpha !== undefined ? `, ${alpha}` : ""}`);

    const validL = yield* validateChannel(l, 0, 1, "lightness");
    const validA = yield* validateChannel(a, -0.4, 0.4, "a");
    const validB = yield* validateChannel(b, -0.4, 0.4, "b");
    const validAlpha = alpha !== undefined 
      ? yield* validateChannel(alpha, 0, 1, "alpha")
      : 1;

    const cssString = alpha !== undefined
      ? `oklab(${validL} ${validA} ${validB} / ${validAlpha})`
      : `oklab(${validL} ${validA} ${validB})`;

    const toAST = (): CssColor => {
      return {
        type: "oklab",
        l: validL,
        a: validA,
        b: validB,
        alpha: validAlpha,
      } as unknown as CssColor;
    };

    const result = cssString as BrandedColor;
    Object.defineProperty(result, "toAST", { value: toAST });

    yield* Console.debug(`Created color: ${cssString}`);
    return result;
  }
);

// ============================================================================
// Hex Color
// ============================================================================

/**
 * Create color from hex string
 * @example
 * hex("#ff8000")
 * hex("#ff8000ff") // with alpha
 */
export const hex = Effect.fn("hex")(
  function* (
    this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
    value: string
  ) {
    yield* Console.debug(`Creating hex color: ${value}`);

    // Validate hex format
    const hexRegex = /^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
    if (!hexRegex.test(value)) {
      return yield* Effect.fail(
        new ColorError({
          message: `Invalid hex color: ${value}. Expected format: #RGB, #RGBA, #RRGGBB, or #RRGGBBAA`,
          value: 0,
        })
      );
    }

    const toAST = (): CssColor => {
      const hex = value.slice(1);
      let r: number, g: number, b: number, alpha = 1;
      
      if (hex.length === 3 || hex.length === 4) {
        // Short form
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
        if (hex.length === 4) {
          alpha = parseInt(hex[3] + hex[3], 16) / 255;
        }
      } else {
        // Long form
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
        if (hex.length === 8) {
          alpha = parseInt(hex.slice(6, 8), 16) / 255;
        }
      }
      
      return {
        type: "rgb",
        r: r / 255,
        g: g / 255,
        b: b / 255,
        alpha,
      } as unknown as CssColor;
    };

    const result = value.toLowerCase() as BrandedColor;
    Object.defineProperty(result, "toAST", { value: toAST });

    yield* Console.debug(`Created color: ${value}`);
    return result;
  }
);

// ============================================================================
// Color Mix
// ============================================================================

/**
 * Mix two colors
 * @example
 * colorMix(rgb(255, 0, 0), rgb(0, 0, 255), 0.5) // 50% red, 50% blue
 */
export const colorMix = Effect.fn("colorMix")(
  function* (
    this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
    color1: BrandedColor,
    color2: BrandedColor,
    percentage: number
  ) {
    yield* Console.debug(`Mixing colors: ${percentage}%`);

    const validPercentage = yield* validateChannel(percentage, 0, 1, "percentage");

    const cssString = `color-mix(in oklch, ${color1}, ${color2} ${validPercentage * 100}%)`;

    const toAST = (): CssColor => {
      // Simplified - in production, compute actual mixed color
      return {
        type: "color-mix",
        // This would need proper implementation
      } as unknown as CssColor;
    };

    const result = cssString as BrandedColor;
    Object.defineProperty(result, "toAST", { value: toAST });

    yield* Console.debug(`Created mixed color: ${cssString}`);
    return result;
  }
);

// ============================================================================
// Light/Dark Mode
// ============================================================================

/**
 * Create light/dark adaptive color
 * @example
 * lightDark(rgb(255, 255, 255), rgb(0, 0, 0))
 */
export const lightDark = Effect.fn("lightDark")(
  function* (
    this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
    lightColor: BrandedColor,
    darkColor: BrandedColor
  ) {
    yield* Console.debug(`Creating light/dark color`);

    const cssString = `light-dark(${lightColor}, ${darkColor})`;

    const toAST = (): CssColor => {
      return {
        type: "light-dark",
        light: lightColor,
        dark: darkColor,
      } as unknown as CssColor;
    };

    const result = cssString as BrandedColor;
    Object.defineProperty(result, "toAST", { value: toAST });

    yield* Console.debug(`Created adaptive color: ${cssString}`);
    return result;
  }
);
