//#region src/errors.d.ts
declare const ParseError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
  readonly _tag: "ParseError";
} & Readonly<A>;
/** A value grammar (mdn-data syntax) is malformed: `position` is the offset in `grammar`, `expected` what fits there. */
export declare class ParseError extends ParseError_base<{
  readonly message: string;
  readonly grammar: string;
  readonly position: number;
  readonly expected: readonly string[];
}> {}
declare const UnknownPropertyError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
  readonly _tag: "UnknownPropertyError";
} & Readonly<A>;
/** `property` has no grammar in mdn-data. */
export declare class UnknownPropertyError extends UnknownPropertyError_base<{
  readonly message: string;
  readonly property: string;
}> {}
declare const InvalidValueError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
  readonly _tag: "InvalidValueError";
} & Readonly<A>;
/** The value does not match the property's grammar: `position` is the offset in `value` where it went wrong. */
export declare class InvalidValueError extends InvalidValueError_base<{
  readonly message: string;
  readonly property: string;
  readonly value: string;
  readonly position: number;
  readonly expected: readonly string[];
}> {}
declare const RuleError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
  readonly _tag: "RuleError";
} & Readonly<A>;
/** The value is valid by grammar but breaks a rule that the spec states in prose (rules.ts). */
export declare class RuleError extends RuleError_base<{
  readonly message: string;
  readonly property: string;
  readonly value: string;
  readonly reason: string;
}> {}
declare const BrowsersError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
  readonly _tag: "BrowsersError";
} & Readonly<A>;
/** browserslist rejected the query. */
export declare class BrowsersError extends BrowsersError_base<{
  readonly message: string;
  /** undefined: the config found from the working directory */
  readonly query: string | undefined;
}> {}
export type TwinError = ParseError | UnknownPropertyError | InvalidValueError;
export declare const isTwinError: (e: unknown) => e is TwinError;
//#endregion