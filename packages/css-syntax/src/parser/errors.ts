/**
 * CSS parse error
 * 
 * Standardized error handling for CSS parser
 * @spec CSS Syntax Module Level 3, §2.2 - Error handling
 */
import { Schema } from "effect";

export const CssParseErrorSchema = Schema.TaggedClass<
  "CssParseError",
  {
    message: Schema.String,
    position: Schema.Number,
    line: Schema.optional(Schema.Number),
    column: Schema.optional(Schema.Number),
    token: Schema.Struct({
      type: Schema.String,
      value: Schema.String,
      pos: Schema.Number,
      end: Schema.Number,
    }),
    context: Schema.String,
    specReference: Schema.optional(Schema.String),
    recovery: Schema.optional(
      Schema.Struct({
        action: Schema.String,
        discardedContent: Schema.String,
        newPosition: Schema.Number,
      })
    ),
  }
>();

export type CssParseErrorFields = {
  message: string;
  position: number;
  line?: number;
  column?: number;
  token: {
    type: string;
    value: string;
    pos: number;
    end: number;
  };
  context: string;
  specReference?: string;
  recovery?: {
    action: string;
    discardedContent: string;
    newPosition: number;
  };
};

export type CssParseError = Schema.Schema.Type<typeof CssParseErrorSchema>;

/**
 * CSS parse error
 * 
 * @spec CSS Syntax Module Level 3, §2.2 - Error handling
 */
export class CssParseError extends CssParseErrorSchema {
  /**
   * Create a CSS parse error
   * 
   * @param message - Error message
   * @param position - Error position
   * @param line - Optional line number
   * @param column - Optional column number
   * @param context - Parsing context
   * @param specReference - Optional spec reference link
   * @param recovery - Optional recovery information
   * @returns CssParseError instance
   */
  static make(
    message: string,
    position: number,
    context: string,
    options?: {
      line?: number;
      column?: number;
      specReference?: string;
      recovery?: {
        action: string;
        discardedContent: string;
        newPosition: number;
      };
    }
  ): CssParseError {
    return new CssParseError({
      message,
      position,
      line: options?.line,
      column: options?.column,
      token: {
        type: "unknown",
        value: "",
        pos: position,
        end: position,
      },
      context,
      specReference: options?.specReference,
      recovery: options?.recovery,
    });
  }

  /**
   * Get formatted error message
   * 
   * @returns Formatted error string with context
   * 
   * @spec CSS Syntax Module Level 3, §2.2 - Error handling
   */
  toString(): string {
    let result = `${this.message} at position ${this.position}`;
    
    if (this.line !== undefined && this.column !== undefined) {
      result += ` (line ${this.line}, column ${this.column})`;
    }
    
    if (this.recovery) {
      result += ` - Recovered: ${this.recovery.action}`;
      if (this.recovery.discardedContent) {
        result += ` (discarded: "${this.recovery.discardedContent}")`;
      }
    }
    
    return result;
  }

  /**
   * Create error with spec reference
   * 
   * @param message - Error message
   * @param position - Error position
   * @param context - Parsing context
   * @param specReference - Link to relevant spec section
   * @returns CssParseError instance
   * 
   * @spec CSS Syntax Module Level 3
   */
  static withSpecReference(
    message: string,
    position: number,
    context: string,
    specReference: string
  ): CssParseError {
    return CssParseError.make(message, position, context, { specReference });
  }
}
