// Tagged errors of the engine. Each carries the file and the offset of the call site it belongs to, so the plugin can
// hand Vite a `loc` and the overlay points at the user's call. `message` is the text the user sees.
//
// These are classes of the library: the runner has its own copy of this module (it evaluates the library), so the
// plugin recognizes errors that come out of `runner.import` by `_tag`, not by `instanceof` (see evaluate.ts).
import { Data } from "effect";

/** A css.* call, cv(), or a value in it is wrong. `file`, `site` (index) and `offset` name the call site, when known. */
export class MacroError extends Data.TaggedError("MacroError")<{
  readonly message: string;
  readonly file?: string;
  readonly site?: number;
  readonly offset?: number;
  readonly cause?: unknown;
}> {}

/** A plugin member was called wrongly, or its styles conflict. `pluginName` is the member's name; the call site as in MacroError. */
export class MemberError extends Data.TaggedError("MemberError")<{
  readonly message: string;
  /** The plugin member's name (`plugin` is taken: Vite sets it to the name of the Vite plugin that threw). */
  readonly pluginName: string;
  readonly file?: string;
  readonly site?: number;
  readonly offset?: number;
  readonly cause?: unknown;
}> {}

/** `import ... from "cssints"` without the attribute names something that only exists at build time. */
export class ImportError extends Data.TaggedError("ImportError")<{
  readonly message: string;
  readonly file: string;
  readonly offset: number;
}> {}

/** Evaluating the module threw something that is not a MacroError, or did not finish in time. */
export class EvalError extends Data.TaggedError("EvalError")<{
  readonly message: string;
  readonly file: string;
  readonly cause?: unknown;
}> {}

/** The module ran, but a site of it did not report a replacement. */
export class SiteMissingError extends Data.TaggedError("SiteMissingError")<{
  readonly message: string;
  readonly file: string;
  readonly site: number;
  readonly offset: number;
}> {}

/** Vite refused something the plugin asked of it: the private server, the CSS pipeline. */
export class HookError extends Data.TaggedError("HookError")<{
  readonly message: string;
  readonly hook: string;
  readonly cause?: unknown;
}> {}

export type PluginError =
  | MacroError
  | MemberError
  | ImportError
  | EvalError
  | SiteMissingError
  | HookError;
