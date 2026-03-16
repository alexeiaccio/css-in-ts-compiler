/**
 * Token System with LightningCSS Integration
 * Effect TypeScript patterns
 */

import { Effect, Data, Console } from "effect";
import type { CssColor, Length } from "lightningcss";
import type { LengthValue } from "./types/values.js";

// ============================================================================
// Error Types
// ============================================================================

export class TokenError extends Data.TaggedError("TokenError")<{
  message: string;
  tokenType?: string;
  value?: unknown;
}> {}

// ============================================================================
// Token Options
// ============================================================================

export interface TokenOptions {
  var?: string;
  inherit?: boolean;
  syntax?: string;
}

// ============================================================================
// Token Reference Types
// ============================================================================

export interface TokenRef<T = unknown> {
  readonly __token: true;
  readonly type: string;
  readonly varName: string;
  readonly value: T;
  readonly syntax: string;
  readonly inherit: boolean;
  readonly toAST: () => T;
  readonly toString: () => string;
}

// ============================================================================
// Utility Functions
// ============================================================================

const generateHash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).slice(0, 8);
};

const parseColorToAST = (value: string): CssColor => {
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return {
      type: "rgb",
      r,
      g,
      b,
      alpha,
    } as unknown as CssColor;
  }
  // For named colors and other formats, return as RGB color with type assertion
  return {
    type: "rgb",
    r: 0,
    g: 0,
    b: 0,
    alpha: 1,
  } as unknown as CssColor;
};

const parseLengthToAST = (value: LengthValue): Length => {
  if (typeof value === "number") {
    return {
      type: "value",
      value: { unit: "rem", value: value * 0.25 },
    };
  }
  const match = String(value).match(/^([\d.]+)([a-z]+)$/);
  if (match) {
    return {
      type: "value",
      value: {
        unit: match[2] as any,
        value: parseFloat(match[1]),
      },
    };
  }
  throw new Error(`Invalid length: ${value}`);
};

// ============================================================================
// Token Namespace
// ============================================================================

export const token = {
  /**
   * Create a typed color token with @property generation
   * @example
   * const primary = token.color('#3b82f6', { var: 'color-primary', inherit: true })
   */
  color: Effect.fn("token.color")(
    function* (
      this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
      value: string,
      options: string | TokenOptions | false = {}
    ) {
      yield* Console.debug(`Creating color token: ${value}`);

      const opts =
        typeof options === "string"
          ? { var: options, inherit: false }
          : options === false
          ? { inherit: false }
          : options;

      const type = "color";
      const syntax = opts.syntax || "<color>";
      const inherit = opts.inherit ?? false;

      const varName = opts.var
        ? `${opts.var}__${generateHash(opts.var + value)}`
        : `--_${generateHash(value)}`;

      const tokenRef: TokenRef<CssColor> = {
        __token: true,
        type,
        varName,
        value: parseColorToAST(value),
        syntax,
        inherit,
        toAST: () => parseColorToAST(value),
        toString: () => `var(${varName})`,
      };

      const propertyRule = `@property ${varName} {
  syntax: "${syntax}";
  inherits: ${inherit};
  initial-value: ${value};
}`;

      if (this?.addAsset) {
        yield* Effect.sync(() => {
          this.addAsset!({ type: "css", content: propertyRule });
        });
        yield* Console.debug(`Added @property rule for ${varName}`);
      }

      return tokenRef;
    }
  ),

  /**
   * Create a typed length token with @property generation
   * @example
   * const spacing = token.length('1rem', { var: 'spacing-md' })
   */
  length: Effect.fn("token.length")(
    function* (
      this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
      value: LengthValue,
      options: TokenOptions = {}
    ) {
      yield* Console.debug(`Creating length token: ${value}`);

      const syntax = options.syntax || "<length>";
      const inherit = options.inherit ?? false;

      const varName = options.var
        ? `${options.var}__${generateHash(String(value))}`
        : `--_${generateHash(String(value))}`;

      const tokenRef: TokenRef<Length> = {
        __token: true,
        type: "length",
        varName,
        value: parseLengthToAST(value),
        syntax,
        inherit,
        toAST: () => parseLengthToAST(value),
        toString: () => `var(${varName})`,
      };

      const propertyRule = `@property ${varName} {
  syntax: "${syntax}";
  inherits: ${inherit};
  initial-value: ${value};
}`;

      if (this?.addAsset) {
        yield* Effect.sync(() => {
          this.addAsset!({ type: "css", content: propertyRule });
        });
        yield* Console.debug(`Added @property rule for ${varName}`);
      }

      return tokenRef;
    }
  ),

  /**
   * Set token value (runtime override)
   */
  set: <T>(token: TokenRef<T>, value: string): string => {
    return `var(${token.varName}, ${value})`;
  },
};
