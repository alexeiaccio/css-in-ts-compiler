// The registry: what evaluation leaves behind, process-global (`globalThis.__cssints`) because the plugin (loaded
// by Node) and the library (loaded by the Vite Module Runner) are separate module graphs that share one process.
// `Registry` is the handle Effects ask for. Its default is that global object, so the plugin and the library get
// the same one without a layer; a test can provide another with Effect.provideService.
import { Context } from "effect";

export interface Rule {
  layer: string;
  /** The condition's sort key (min-width, pseudo-class order); [] until conditions land. */
  cond: number[];
  prop: string;
  css: string;
}

/** The call site being evaluated, set by `__at` before its expression runs. */
export interface At {
  file: string;
  site: number;
  offset: number;
}

export interface RegistryState {
  /** file -> site index -> replacement expression */
  sites: Map<string, Map<number, string>>;
  /** class -> rule; one entry per class across all modules */
  rules: Map<string, Rule>;
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
  warnings: [],
  warned: new Set(),
});

export const Registry = Context.Reference<RegistryState>("cssints/Registry", { defaultValue: () => registry });
