import { i as GlobalRule } from "./author-types-VWp_4djS.mjs";
import { n as At, r as RegistryState } from "./node-7gUwLZVv.mjs";
import { Effect } from "effect";
import { Plugin } from "vite";
import { ImportDeclaration } from "oxc-parser";
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
//#endregion
//#region src/instrument.d.ts
interface CssImports {
  locals: Set<string>;
  decls: ImportDeclaration[];
}
interface Site {
  start: number;
  end: number;
  inFn: boolean;
}
interface Instrumented {
  code: string;
  sites: Site[];
  imp: CssImports;
}
export declare const instrument: (code: string, id: string) => Effect.Effect<Instrumented | null, ImportError, never>;
//#endregion
//#region src/sheet.d.ts
/** Adds a global rule (`*{box-sizing:border-box}`) of a plugin member, by its content, to the sheet of the module at `at`. `layer` names a declared top-level layer to wrap it in, no layer puts it in `_.k`. */
export declare const addGlobal: (g: GlobalRule, at?: At | undefined) => Effect.Effect<void, MacroError, never>;
export declare const globalEntries: ({ globals }: RegistryState, file: string) => string[];
/**
 * Declares top-level layers, in order: the statement `@layer a, b, c;`, printed after the engine's own layers, once
 * whoever declares it, so what is in them beats the engine's `:root` fallbacks. Another statement may name the same layers
 * in the same order, or hold or be held by this one; layers in another order, or shared without one holding the other,
 * are build errors at `at`, since the sheet could not say which comes first.
 */
export declare const addLayers: (names: readonly string[], at?: At | undefined) => Effect.Effect<undefined, MacroError, never>;
export declare const layerEntries: ({ layers }: RegistryState, file: string) => string[];
/** The rules of `entries`: class names, and the text of `@property` rules (once each, whichever module has them). */
export declare const renderSheet: (entries: Iterable<string>) => Effect.Effect<string, never, never>;
//#endregion
//#region src/plugin.d.ts
/** LightningCSS targets (css.lightningcss.targets) from the browserslist query of the support warnings. */
export declare const targets: import("lightningcss").Targets;
/** `build: { cssTarget }`, the browserslist query of the support warnings, so a minified build keeps `firstThatWorks` fallbacks. */
export declare const cssTarget: string[];
export default function cssints({ inner }?: {
  inner?: boolean;
}): Plugin[];
//#endregion