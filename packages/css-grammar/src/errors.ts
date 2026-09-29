// Tagged errors of the grammar package. Plain code (the twin, rules and support cores) throws them, the Effect.fn
// boundaries in twin.ts, rules.ts and support.ts put them in the error channel. Every `message` is the text a user
// sees, so it names the property and the value.
import { Data } from "effect";

/** A value grammar (mdn-data syntax) is malformed: `position` is the offset in `grammar`, `expected` what fits there. */
export class ParseError extends Data.TaggedError("ParseError")<{
  readonly message: string;
  readonly grammar: string;
  readonly position: number;
  readonly expected: readonly string[];
}> {}

/** `property` has no grammar in mdn-data. */
export class UnknownPropertyError extends Data.TaggedError("UnknownPropertyError")<{
  readonly message: string;
  readonly property: string;
}> {}

/** The value does not match the property's grammar: `position` is the offset in `value` where it went wrong. */
export class InvalidValueError extends Data.TaggedError("InvalidValueError")<{
  readonly message: string;
  readonly property: string;
  readonly value: string;
  readonly position: number;
  readonly expected: readonly string[];
}> {}

/** The value is valid by grammar but breaks a rule that the spec states in prose (rules.ts). */
export class RuleError extends Data.TaggedError("RuleError")<{
  readonly message: string;
  readonly property: string;
  readonly value: string;
  readonly reason: string;
}> {}

/** browserslist rejected the query. */
export class BrowsersError extends Data.TaggedError("BrowsersError")<{
  readonly message: string;
  readonly query: string;
}> {}

export type TwinError = ParseError | UnknownPropertyError | InvalidValueError;

export const isTwinError = (e: unknown): e is TwinError =>
  e instanceof ParseError || e instanceof UnknownPropertyError || e instanceof InvalidValueError;
