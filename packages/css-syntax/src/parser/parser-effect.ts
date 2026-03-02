import { Effect } from "effect";

import { parse as parseValueDef } from "./value-def-parser.js";
import { CSSValueParser } from "./css-value-parser.js";
import { SelectorParser } from "./selector-parser.js";
import { StylesheetParser } from "./stylesheet-parser.js";
import { CssParseError } from "../lexer/errors-effect.js";
import type { TokenValue } from "../lexer/token.js";

/**
 * Parse a CSS value definition syntax string
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 *
 * const result = Effect.runSync(parseValueDefEffect("<length> | <percentage>"));
 * // → { type: "group", terms: [...], multiplier: {...} }
 * ```
 */
export const parseValueDefEffect = (
  source: string,
): Effect.Effect<ReturnType<typeof parseValueDef>, CssParseError> =>
  Effect.try({
    try: () => parseValueDef(source),
    catch: (e) =>
      new CssParseError({
        message: String(e),
        token: { token: "unknown", value: source, pos: 0, end: source.length },
      }),
  });

/**
 * Parse a CSS value string into an AST
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 *
 * const result = Effect.runSync(parseValueEffect("10px solid red"));
 * // → { type: "dimension", number: 10, unit: "px" }
 * ```
 */
export const parseValueEffect = (
  source: string,
): Effect.Effect<ReturnType<CSSValueParser["parse"]>, CssParseError> =>
  Effect.try({
    try: () => new CSSValueParser().parse(source),
    catch: (e) =>
      new CssParseError({
        message: String(e),
        token: { token: "unknown", value: source, pos: 0, end: source.length },
      }),
  });

/**
 * Parse a CSS selector string into an AST
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 *
 * const result = Effect.runSync(parseSelectorEffect(".foo > .bar:hover"));
 * // → { type: "complex", children: [...], specificity: {...} }
 * ```
 */
export const parseSelectorEffect = (
  source: string,
): Effect.Effect<ReturnType<SelectorParser["parse"]>, CssParseError> =>
  Effect.try({
    try: () => new SelectorParser(source).parse(),
    catch: (e) =>
      new CssParseError({
        message: String(e),
        token: { token: "unknown", value: source, pos: 0, end: source.length },
      }),
  });

/**
 * Parse a full CSS stylesheet into an AST
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 *
 * const result = Effect.runSync(parseStylesheetEffect(".foo { color: red; }"));
 * // → { type: "stylesheet", rules: [...] }
 * ```
 */
export const parseStylesheetEffect = (
  source: string,
): Effect.Effect<ReturnType<StylesheetParser["parse"]>, CssParseError> =>
  Effect.try({
    try: () => new StylesheetParser(source).parse(),
    catch: (e) =>
      new CssParseError({
        message: String(e),
        token: { token: "unknown", value: source, pos: 0, end: source.length },
      }),
  });
