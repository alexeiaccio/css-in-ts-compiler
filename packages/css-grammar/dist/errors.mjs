import { Data } from "effect";
//#region src/errors.ts
/** A value grammar (mdn-data syntax) is malformed: `position` is the offset in `grammar`, `expected` what fits there. */
var ParseError = class extends Data.TaggedError("ParseError") {};
/** `property` has no grammar in mdn-data. */
var UnknownPropertyError = class extends Data.TaggedError("UnknownPropertyError") {};
/** The value does not match the property's grammar: `position` is the offset in `value` where it went wrong. */
var InvalidValueError = class extends Data.TaggedError("InvalidValueError") {};
/** The value is valid by grammar but breaks a rule that the spec states in prose (rules.ts). */
var RuleError = class extends Data.TaggedError("RuleError") {};
/** browserslist rejected the query. */
var BrowsersError = class extends Data.TaggedError("BrowsersError") {};
const isTwinError = (e) => e instanceof ParseError || e instanceof UnknownPropertyError || e instanceof InvalidValueError;
//#endregion
export { BrowsersError, InvalidValueError, ParseError, RuleError, UnknownPropertyError, isTwinError };
