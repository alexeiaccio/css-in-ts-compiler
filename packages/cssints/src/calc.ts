/**
 * Calc Implementation with Explicit Operators
 * Effect TypeScript patterns throughout
 */

import { Effect, Data, Console } from "effect";
import type { LengthValue } from "./types/values.js";

// ============================================================================
// Error Types
// ============================================================================

export class CalcError extends Data.TaggedError("CalcError")<{
  message: string;
  expression?: string;
}> {}

// ============================================================================
// Types
// ============================================================================

export type CalcOperator = "+" | "-" | "*" | "/" | "(" | ")";
export type CalcValue = LengthValue | CalcOperator;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate hash for calc expressions
 */
const generateHash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return "_" + Math.abs(hash).toString(16).padStart(6, "0").slice(0, 6);
};

/**
 * Convert value to CSS string representation
 */
const toCSSValue = (value: LengthValue | number): string => {
  if (typeof value === "number") {
    return `${value * 0.25}rem`;
  }
  return String(value);
};

/**
 * Build calc expression string from parts
 */
const buildExpression = (parts: CalcValue[]): string => {
  return parts
    .map((part) => {
      if (typeof part === "number") {
        return toCSSValue(part);
      }
      return String(part);
    })
    .join(" ");
};

// ============================================================================
// Core Calc Function
// ============================================================================

/**
 * CSS calc() function with explicit operators
 *
 * @example
 * ```typescript
 * calc('100vw', '-', '16px')           // calc(100vw - 16px)
 * calc('(', '100%', '-', '2rem', ')')  // calc((100% - 2rem))
 * calc('100%', '/', 3)                 // calc(100% / 3)
 * calc('min', '100vw', '100px')        // min(100vw, 100px)
 * ```
 */
export const calc = Effect.fn("calc")(
  function* (this: { addAsset?: (asset: { type: string; content: string }) => void } | void, ...parts: CalcValue[]) {
    yield* Console.debug(`Building calc expression from ${parts.length} parts`);

    const expression = buildExpression(parts);
    yield* Console.debug(`Expression: ${expression}`);

    const key = `calc:${expression}`;
    const hash = generateHash(key);
    const className = `_${hash}`;

    yield* Console.debug(`Generated class name: ${className}`);

    // Generate @calc placeholder CSS
    const css = `@calc ${className} ${expression} { }`;

    // Add as asset via Parcel macro context
    if (this?.addAsset) {
      yield* Effect.sync(() => {
        this.addAsset!({ type: "css", content: css });
      });
      yield* Console.debug(`Added calc asset for ${className}`);
    }

    return className;
  }
);

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * CSS min() function
 */
export const min = Effect.fn("min")(
  function* (this: { addAsset?: (asset: { type: string; content: string }) => void } | void, ...values: LengthValue[]) {
    yield* Console.debug(`Building min() with ${values.length} values`);

    const cssValues = values.map(toCSSValue);
    const expression = `min(${cssValues.join(", ")})`;

    const key = `calc:${expression}`;
    const hash = generateHash(key);
    const className = `_${hash}`;

    const css = `@calc ${className} ${expression} { }`;

    if (this?.addAsset) {
      yield* Effect.sync(() => {
        this.addAsset!({ type: "css", content: css });
      });
    }

    return className;
  }
);

/**
 * CSS max() function
 */
export const max = Effect.fn("max")(
  function* (this: { addAsset?: (asset: { type: string; content: string }) => void } | void, ...values: LengthValue[]) {
    yield* Console.debug(`Building max() with ${values.length} values`);

    const cssValues = values.map(toCSSValue);
    const expression = `max(${cssValues.join(", ")})`;

    const key = `calc:${expression}`;
    const hash = generateHash(key);
    const className = `_${hash}`;

    const css = `@calc ${className} ${expression} { }`;

    if (this?.addAsset) {
      yield* Effect.sync(() => {
        this.addAsset!({ type: "css", content: css });
      });
    }

    return className;
  }
);

/**
 * CSS clamp() function
 */
export const clamp = Effect.fn("clamp")(
  function* (
    this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
    min: LengthValue,
    preferred: LengthValue,
    max: LengthValue
  ) {
    yield* Console.debug(`Building clamp(${toCSSValue(min)}, ${toCSSValue(preferred)}, ${toCSSValue(max)})`);

    const expression = `clamp(${toCSSValue(min)}, ${toCSSValue(preferred)}, ${toCSSValue(max)})`;

    const key = `calc:${expression}`;
    const hash = generateHash(key);
    const className = `_${hash}`;

    const css = `@calc ${className} ${expression} { }`;

    if (this?.addAsset) {
      yield* Effect.sync(() => {
        this.addAsset!({ type: "css", content: css });
      });
    }

    return className;
  }
);
