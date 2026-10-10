import { i as GlobalRule } from "./author-types-C1AhsnrT.mjs";
import { n as ImportError, r as MacroError } from "./errors-D4ZbcwRo.mjs";
import { i as RegistryState, n as At, r as LayersDecl } from "./node-CyDM31HZ.mjs";
import { Effect } from "effect";
import { ImportDeclaration } from "oxc-parser";
import { Plugin } from "vite";
//#region src/devtools-server.d.ts
/** A `css.*` call of a client module: where it is (1-based line, 0-based column) and the class names it produced. */
interface DevSite {
  line: number;
  column: number;
  classes: string[];
  /** the source of the call, as written */
  text: string;
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
/** `cssints({ devtools: true, opencode })`: the OpenCode session the overlay's prompt box starts. */
interface OpenCodeOptions {
  /** the agent of the session (OpenCode's default for a new session otherwise) */
  agent?: string;
  /** the ids of OpenCode skills the prompt loads */
  skills?: string[];
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
/**
 * LightningCSS targets (css.lightningcss.targets) from the browserslist config of process.cwd(), read when vite.config.ts
 * imports this module: the support warnings read the one of the Vite root, the same unless the root is elsewhere.
 */
export declare const targets: import("lightningcss").Targets;
/** `build: { cssTarget }`, the browserslist query of `targets`, so a minified build keeps `firstThatWorks` fallbacks. */
export declare const cssTarget: string[];
export default function cssints({ inner, exclude, devtools, opencode }?: {
  inner?: boolean;
  /**
   * Files the plugin leaves alone, in Vite's filter style (`createFilter`: a picomatch glob, a RegExp or an array of them;
   * a relative glob is read from the working directory). Today's rule stays: a file outside node_modules that mentions "cssints" is
   * a site module, so a package of plugins or the engine's own sources that a project bundles as code is excluded here.
   */
  exclude?: string | RegExp | ReadonlyArray<string | RegExp>;
  /**
   * The inspector of @cssints/devtools in every page (Alt+Shift+C), which must be installed. `true`: dev only; `"build"`:
   * a build too, with the table as a static asset and the overlay in a chunk that loads on the first open.
   */
  devtools?: boolean | "build";
  /**
   * Dev only, with `devtools`: the overlay gets a prompt box for the picked element. The dev server (never the page) starts a
   * session on the running OpenCode service, in the app's repository, with a prompt made of the element's call sites, cascade
   * and tokens plus the instruction. Needs `@opencode/client` installed. Off by default; a build has none of it.
   */
  opencode?: boolean | OpenCodeOptions;
}): Plugin[];
//#endregion
export type { DevTable, OpenCodeOptions };