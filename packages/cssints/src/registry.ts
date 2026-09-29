// The registry: what evaluation leaves behind, process-global (`globalThis.__cssints`) because the plugin (loaded
// by Node) and the library (loaded by the Vite Module Runner) are separate module graphs that share one process.
// `Registry` is the handle Effects ask for. Its default is that global object, so the plugin and the library get
// the same one without a layer; a test can provide another with Effect.provideService.
import { Context } from "effect";

export interface Rule {
  layer: string;
  /** Sort key within the layer: the min-width of its conditions, then the places of its pseudo-classes. */
  cond: number[];
  /** The at-rule preludes around `css`, outermost first (`@media (width >= 40rem)`). */
  wrap: string[];
  prop: string;
  /** The style rule: `.cls:hover{color:red}`. */
  css: string;
  /** The tokens (`--name`) its value reads. */
  tokens?: string[];
}

/** The call site being evaluated, set by `__at` before its expression runs. */
export interface At {
  file: string;
  site: number;
  offset: number;
}

/** A token's `@property` rule, by variable name (`--color-primary`). One entry per name across all modules. */
export interface Property {
  css: string;
  /** Literals of its type, put in place of `var(--name)` when a value that uses it is checked (TOKEN_TYPES). */
  probes: readonly string[];
  /** Where it was declared: `file#site.n`, `file`, and the evaluation (`gen`) that declared it. */
  by: string;
  file: string;
  gen: number;
}

export interface RegistryState {
  /** file -> site index -> replacement expression */
  sites: Map<string, Map<number, string>>;
  /** class -> rule; one entry per class across all modules */
  rules: Map<string, Rule>;
  /** key -> CSS text of a global rule; rendered once each, in layer _.k (sheet.ts `addGlobal`) */
  globals: Map<string, string>;
  /** name -> the `@property` rule of every token declared so far (token.ts) */
  properties: Map<string, Property>;
  /** the evaluation in progress; tokens of an older one that its file no longer declares are stale */
  gen: number;
  /** tokens created at the site being evaluated: two in one site get different private names */
  tokens: number;
  /** support warnings not yet handed to Vite */
  warnings: string[];
  /** `property feature` keys already warned about in this build */
  warned: Set<string>;
  at?: At;
}

declare global {
  // oxlint-disable-next-line no-var -- an ambient declaration of a property of globalThis, not a variable
  var __cssints: RegistryState | undefined;
}

export const registry: RegistryState = (globalThis.__cssints ??= {
  sites: new Map(),
  rules: new Map(),
  globals: new Map(),
  properties: new Map(),
  gen: 0,
  tokens: 0,
  warnings: [],
  warned: new Set(),
});

export const Registry = Context.Reference<RegistryState>("cssints/Registry", {
  defaultValue: () => registry,
});
