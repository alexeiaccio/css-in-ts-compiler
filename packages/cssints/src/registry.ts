// The registry: what evaluation leaves behind, process-global (`globalThis.__cssints`) because the plugin (loaded
// by Node) and the library (loaded by the Vite Module Runner) are separate module graphs that share one process.
// `Registry` is the handle Effects ask for. Its default is that global object, so the plugin and the library get
// the same one without a layer; a test can provide another with Effect.provideService.
import type { TokenType } from "@cssints/css-grammar/token";
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

/**
 * Global rules a style needs, registered with the sheet by `key` (`name@version`) on first use, in layer _.k.
 * `atProperty` goes at the top of the sheet next to the tokens' `@property` rules; `requires` (BCD keys) gives a
 * support warning when a target lacks one.
 */
export interface Kernel {
  key: string;
  css: string;
  atProperty?: string;
  requires?: string[];
}
/** One element family of a plugin's runtime: the parent's computed `read` is copied into `write` (see parent-vars.ts). */
export interface ParentVar {
  marker: string;
  read: string;
  write: string;
  watch?: string;
}
/**
 * The runtime half of a plugin member, delivered only when a target lacks a feature: `polyfills` are BCD keys,
 * `parentVars` configure the shared engine (`cssints/parent-vars`), `css` is the fallback appended to the sheet.
 */
export interface Runtime {
  polyfills: string[];
  parentVars?: ParentVar[];
  css?: string;
}
/** A style that holds the marker of a member and a property listed here is a build error with `message`. */
export interface Conflict {
  props: (string | RegExp)[];
  message: string;
}
/** What a plugin member leaves on a style node besides declarations: its name, and the runtime and conflicts it has. */
export interface Plug {
  name: string;
  marker: string;
  conflicts?: Conflict;
  runtime?: Runtime;
}
/** A registered runtime, by plugin name: the files whose styles use it. */
export interface RuntimeEntry {
  runtime: Runtime;
  users: Set<string>;
}

/** A registered kernel: the custom properties it declares, the markers printed for it, the files that use it. */
export interface KernelEntry {
  kernel: Kernel;
  vars: string[];
  markers: Set<string>;
  users: Set<string>;
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

/** What a token is worth, by variable name: its literal (an alias: the flattened one), and the alias it stays live as. */
export interface TokenDef {
  kind: TokenType;
  /** `color.bg` for a token of createTokens, else the variable. */
  path: string;
  value: string;
  /** The variable of the token this one is an alias of. */
  alias?: string;
}

/**
 * A rule of a token set or a theme, in layer _.k after the globals (sheet.ts). `key` orders them: the kind (0 the
 * `:root` declarations of aliases, 1 themes under a condition, 2 themes under a selector), then the place in the source.
 * `names` are the variables it sets or reads: a module that uses one of them has the rule in its sheet too (plugin.ts).
 * `theme` is what a contrast check reads: the values the theme sets, by variable name.
 */
export interface Themed {
  file: string;
  key: string;
  css: string;
  names: string[];
  theme?: { label: string; values: Map<string, string> };
}

/** A `css.check.contrast` call, checked once the module that made it has run, and again at the end of a build. */
export interface Check {
  at: At;
  fg: string;
  bg: string;
  min: number;
  gen: number;
}

export interface RegistryState {
  /** file -> site index -> replacement expression */
  sites: Map<string, Map<number, string>>;
  /** class -> rule; one entry per class across all modules */
  rules: Map<string, Rule>;
  /** key -> CSS text of a global rule; rendered once each, in layer _.k (sheet.ts `addGlobal`) */
  globals: Map<string, string>;
  /** key -> the kernels of the styles evaluated so far (sheet.ts `addKernel`): for collisions; the sheet reads the entries of a module */
  kernels: Map<string, KernelEntry>;
  /** plugin name -> its runtime and the files that use it (delivery.ts) */
  runtimes: Map<string, RuntimeEntry>;
  /** the properties of property(): checked by their own grammar when called, not by the engine */
  userProps: Set<string>;
  /** file -> the evaluation (`gen`) in which its first site ran: its kernels of older ones are forgotten (`__at`) */
  seen: Map<string, number>;
  /** name -> the `@property` rule of every token declared so far (token.ts) */
  properties: Map<string, Property>;
  /** name -> what each token is worth (token.ts, theme.ts): the contrast check and the theme rules read it */
  defs: Map<string, TokenDef>;
  /** `file#site.n` -> the rules of createTokens and createGlobalTheme calls */
  themed: Map<string, Themed>;
  /** `file#site` -> the contrast checks */
  checks: Map<string, Check>;
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
  kernels: new Map(),
  runtimes: new Map(),
  userProps: new Set(),
  seen: new Map(),
  properties: new Map(),
  defs: new Map(),
  themed: new Map(),
  checks: new Map(),
  gen: 0,
  tokens: 0,
  warnings: [],
  warned: new Set(),
});

export const Registry = Context.Reference<RegistryState>("cssints/Registry", {
  defaultValue: () => registry,
});

// What `file` left of its kernels and runtimes: dropped when it is about to run again (it is a dependency of an
// evaluation: `__at`), or when it has no site any more.
export const forgetKernels = (file: string): void => {
  for (const [k, e] of registry.kernels)
    if (e.users.delete(file) && !e.users.size) registry.kernels.delete(k);
  for (const [k, e] of registry.runtimes)
    if (e.users.delete(file) && !e.users.size) registry.runtimes.delete(k);
};

// What `file` left of its kernels, token sets, themes and checks is dropped when it is about to run again, or has no site any more.
export const forget = (file: string): void => {
  forgetKernels(file);
  for (const [k, t] of registry.themed) if (t.file === file) registry.themed.delete(k);
  for (const [k, c] of registry.checks) if (c.at.file === file) registry.checks.delete(k);
};
