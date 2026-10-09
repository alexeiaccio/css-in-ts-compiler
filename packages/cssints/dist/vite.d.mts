import { i as GlobalRule } from "./author-types-C1AhsnrT.mjs";
import { i as RegistryState, n as At, r as LayersDecl } from "./node-DUhcO02F.mjs";
import { Effect } from "effect";
import { ImportDeclaration } from "oxc-parser";
import { Plugin } from "vite";
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
//#region src/devtools-server.d.ts
/** A `css.*` call of a client module: where it is (1-based line, 0-based column) and the class names it produced. */
interface DevSite {
  line: number;
  column: number;
  classes: string[];
}
/** What the dev server knows of a class: its rule as the sheet prints it, the tokens it reads, the plugin it belongs to. */
interface ClassRecord {
  kind: "class" | "marker" | "group";
  layer: string;
  /** the at-rule preludes around the rule, outermost first */
  wrap: string[];
  prop: string;
  /** the style rule, `._x:hover{color:red}`; a marker's is its kernel's css */
  css: string;
  tokens: string[];
  /** the scope of a member's class (`frame`), the kernel of a marker (`frame.core`) */
  plugin?: string;
  /** indexes into `DevTable.sites` */
  sites: number[];
}
/** The payload of `cssints:devtools`. */
interface DevTable {
  root: string;
  /** the sheet as `load()` of virtual:cssints.css renders it, before LightningCSS */
  sheet: string;
  /** top-level layers in rank order; the engine's are `_.k` to `_.e` */
  layers: string[];
  classes: Record<string, ClassRecord>;
  sites: (DevSite & {
    file: string;
  })[];
  tokens: Record<string, {
    path: string;
    value: string;
  }>;
}
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
  locals: Set<string>;
}
interface Instrumented {
  code: string;
  sites: Site[];
  imp: CssImports;
}
export declare const instrument: (code: string, id: string, client?: boolean | undefined) => Effect.Effect<Instrumented | null, ImportError, never>;
//#endregion
//#region src/sheet.d.ts
/** Adds a global rule (`*{box-sizing:border-box}`) of a plugin member, by its content, to the sheet of the module at `at`. `layer` names a declared top-level layer to wrap it in, no layer puts it in `_.k`. */
export declare const addGlobal: (g: GlobalRule, at?: At | undefined) => Effect.Effect<void, MacroError, never>;
export declare const globalEntries: ({ globals }: RegistryState, file: string) => string[];
/**
 * Declares top-level layers, in order: the statement `@layer a, b, c;`, printed after the engine's own layers, once
 * whoever declares it, so what is in them beats the engine's `:root` fallbacks; with `before`, printed before them, so
 * the engine's classes beat what is in them (a reset). Another statement may name the same layers in the same order, or
 * hold or be held by this one; layers in another order, shared without one holding the other, or declared both before
 * and after the engine's, are build errors at `at`, since the sheet could not say which comes first.
 */
export declare const addLayers: (args_0: LayersDecl, at?: At | undefined) => Effect.Effect<undefined, MacroError, never>;
export declare const layerEntries: ({ layers }: RegistryState, file: string) => string[];
/** The rules of `entries`: class names, and the text of `@property` rules (once each, whichever module has them). */
export declare const renderSheet: (entries: Iterable<string>) => Effect.Effect<string, never, never>;
//#endregion
//#region src/plugin.d.ts
/** LightningCSS targets (css.lightningcss.targets) from the browserslist query of the support warnings. */
export declare const targets: import("lightningcss").Targets;
/** `build: { cssTarget }`, the browserslist query of the support warnings, so a minified build keeps `firstThatWorks` fallbacks. */
export declare const cssTarget: string[];
export default function cssints({ inner, devtools }?: {
  inner?: boolean;
  /** Dev only: the inspector of @cssints/devtools in every page (Alt+Shift+C), which must be installed. */
  devtools?: boolean;
}): Plugin[];
//#endregion
export type { DevTable };