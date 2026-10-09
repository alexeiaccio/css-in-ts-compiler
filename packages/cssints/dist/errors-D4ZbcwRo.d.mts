//#region src/errors.d.ts
declare const MacroError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
  readonly _tag: "MacroError";
} & Readonly<A>;
/** A css.* call, cv(), or a value in it is wrong. `file`, `site` (index) and `offset` name the call site, when known. */
declare class MacroError extends MacroError_base<{
  readonly message: string;
  readonly file?: string;
  readonly site?: number;
  readonly offset?: number;
  readonly cause?: unknown;
}> {}
declare const ImportError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
  readonly _tag: "ImportError";
} & Readonly<A>;
/** `import ... from "cssints"` without the attribute names something that only exists at build time. */
declare class ImportError extends ImportError_base<{
  readonly message: string;
  readonly file: string;
  readonly offset: number;
}> {}
declare const ContrastError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
  readonly _tag: "ContrastError";
} & Readonly<A>;
/** cssints/check `contrast`: a colour that has no contrast (one it cannot read, or a translucent one). */
declare class ContrastError extends ContrastError_base<{
  readonly message: string;
  /** The colour as given. */
  readonly colour: string;
}> {}
//#endregion
export { ImportError as n, MacroError as r, ContrastError as t };