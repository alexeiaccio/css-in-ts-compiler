// The registry: what evaluation leaves behind, process-global (`globalThis.__cssints`) because the plugin (loaded
// by Node) and the library (loaded by the Vite Module Runner) are separate module graphs that share one process.
// `Registry` is the handle Effects ask for. Its default is that global object, so the plugin and the library get
// the same one without a layer; a test can provide another with Effect.provideService.
import type { Warning } from "@cssints/css-grammar/support";
import type { TokenType } from "@cssints/css-grammar/token";
import { Context } from "effect";

import type { CssNode, Decl } from "./node.ts";
import type { Conflict, GlobalRule, Kernel, Runtime } from "./author-types.ts";

export type {
  Conflict,
  GlobalRule,
  Kernel,
  ParentVar,
  Runtime,
  ThemeRule,
} from "./author-types.ts";

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

/** What a plugin member leaves on a style node besides declarations: its name, and the runtime and conflicts it has. */
export interface Plug {
  name: string;
  /** What errors call it (the scope that owns `name`), when that is not `name`. */
  label?: string;
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

/** A support warning of a declaration in a kernel written as styles, weighed against the runtimes of a style (kernel.ts `addKernel`). */
export interface KernelWarning {
  prop: string;
  /** the value as the sheet prints it: `--_x` is `--<scope>-x` */
  value: string;
  warning: Warning;
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

/** What a token is worth, by variable name: its literal (an alias or a derived token: the flattened one), and what it stays live as. */
export interface TokenDef {
  kind: TokenType;
  /** Whether the custom property inherits: only a token that does can be written on <html> by the runtime of derived tokens. */
  inherit: boolean;
  /** `color.bg` for a token of createTokens, else the variable. */
  path: string;
  value: string;
  /** An alias or a derived token: its value with `var(--target)` for each reference, and the variables it refers to. */
  template?: string;
  refs?: string[];
  /** `value` as LightningCSS lowers it for the targets that lack it: the initial value, and the default of a derived token. */
  fallback?: string;
  /** A derived token the runtime computes (derived-data.ts): its flattened literal, which a browser that parses it needs no runtime for. */
  poly?: string;
}

/**
 * A rule of a token set or a theme, in layer _.k after the globals (sheet.ts). `key` orders them: the kind (0 the
 * `:root` declarations of aliases, 1 themes under a condition, 2 themes under a selector), then the place in the source.
 * `names` are the variables it sets or reads: a module that uses one of them has the rule in its sheet too (plugin.ts).
 * `layer`, when set, sends the rule to a **top-level** declared layer of that name instead of `_.k`: a look must rank
 * above the engine's `:root` fallbacks, and a nested layer ranks below the rules of its parent.
 * `theme` is what a contrast check reads: the values the theme sets, by variable name, for the selector `label` (inside
 * `@scope (scope)`, if it has one); `poly` those of them that the runtime of derived tokens computes, with their flattened literals.
 */
export interface Themed {
  file: string;
  key: string;
  css: string;
  names: string[];
  layer?: string;
  theme?: {
    label: string;
    scope?: string;
    values: Map<string, string>;
    poly?: Map<string, string>;
  };
}

/** A global rule of a plugin member (`addGlobal`), by its content, with the files whose styles carry it. */
export interface GlobalEntry {
  global: GlobalRule;
  users: Set<string>;
}

/** A statement `@layer a, b;` to declare: `before` prints it before the engine's `@layer _.k, …;`, so its layers rank below. */
export interface LayersDecl {
  names: readonly string[];
  before?: boolean;
}

/** A declared statement `@layer a, b;` (`layers()`), by its names joined with `,`, with the files that declared it. */
export interface LayerEntry {
  names: string[];
  before: boolean;
  users: Set<string>;
}

/** The `key` of a Themed entry that is a `css.global()` rule starts with this: it sorts before the aliases and themes. */
export const GLOBAL = "-:";

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
  /** file -> site index -> the declarations of the style it produced: what a cn() with runtime arguments settles (macro.ts `groupOf`) */
  nodes: Map<string, Map<number, Decl[]>>;
  /** class -> rule; one entry per class across all modules */
  rules: Map<string, Rule>;
  /** `layer<TAB>css` -> a global rule: in the sheet of the modules that carry it, in layer _.k unless it names a layer (sheet.ts `addGlobal`) */
  globals: Map<string, GlobalEntry>;
  /** the declared top-level layers (sheet.ts `addLayers`) */
  layers: Map<string, LayerEntry>;
  /** key -> the kernels of the styles evaluated so far (sheet.ts `addKernel`): for collisions; the sheet reads the entries of a module */
  kernels: Map<string, KernelEntry>;
  /** plugin name -> its runtime and the files that use it (delivery.ts) */
  runtimes: Map<string, RuntimeEntry>;
  /** scope name -> the hash of its content (scope.ts `register`): a name is unique per process */
  scopes: Map<string, string>;
  /** what scope.ts needs of the eval-time library, set by macro.ts: `css` for a kernel written as styles (with `nest` and `vars`), `kernelOf` to check and print it under its class */
  lib?: {
    css: object;
    kernelOf: (
      what: string,
      style: CssNode,
      cls: string,
    ) => { css: string; props: string[]; kernels?: Kernel[]; warnings: KernelWarning[] };
  };
  /** the replacement of a site that holds a node of cssints/tui (tui.ts), set when that module loads */
  tui?: (value: { readonly __tui: unknown }) => string | undefined;
  /** the tokens and themes of cssints/tui (tui.ts): a namespace of their own, never in a sheet (cssints-0s1z) */
  terminal?: Pick<RegistryState, "properties" | "defs" | "themed">;
  /** what the front of "cssints/plugin" calls (scope-engine.ts `engine`), set by macro.ts */
  engine?: object;
  /** the typed properties of scopes: checked by their own grammar when called, not by the engine */
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
  /** warnings not yet handed to Vite, each at the site that made it (`warn`) */
  warnings: Warned[];
  /** `file of the site \0 key` of the warnings said in this build; in dev, until that file is edited (`forgetWarnings`) */
  warned: Set<string>;
  /** `property value feature targets` -> what LightningCSS lowers it to, or false (lowered.ts) */
  lowered: Map<string, string | false>;
  /** the files the evaluation in progress read (`dependsOn`): dependencies of the module being evaluated (plugin.ts `depsOf`) */
  files: Set<string>;
  at?: At;
  /** the site `tokens` is counting for: a call in a loop is one site that registers several tokens */
  site?: string;
}

declare global {
  // oxlint-disable-next-line no-var -- an ambient declaration of a property of globalThis, not a variable
  var __cssints: RegistryState | undefined;
}

export const registry: RegistryState = (globalThis.__cssints ??= {
  sites: new Map(),
  nodes: new Map(),
  rules: new Map(),
  globals: new Map(),
  layers: new Map(),
  kernels: new Map(),
  runtimes: new Map(),
  scopes: new Map(),
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
  lowered: new Map(),
  files: new Set(),
});

/** A warning and the site that made it, when there is one. */
export interface Warned {
  message: string;
  at?: At | undefined;
}

// Records a warning once per `key` and file of its site (default: the site being evaluated), at that site: a build says
// it once per file, and a dev server again only after that file is edited (plugin.ts `hotUpdate`).
export const warn = (state: RegistryState, key: string, message: string, at = state.at): void => {
  const k = `${at?.file ?? ""}\0${key}`;
  if (state.warned.has(k)) return;
  state.warned.add(k);
  state.warnings.push({ message, at });
};

// Lets the warnings of the sites in `files` (all, without it) be said again.
export const forgetWarnings = (files?: readonly string[]): void => {
  if (!files) return registry.warned.clear();
  const prefixes = files.map((f) => `${f}\0`);
  for (const k of registry.warned)
    if (prefixes.some((p) => k.startsWith(p))) registry.warned.delete(k);
};

export const Registry = Context.Reference<RegistryState>("cssints/Registry", {
  defaultValue: () => registry,
});

const unuse = (entries: Map<string, { users: Set<string> }>, file: string) => {
  for (const [k, e] of entries) if (e.users.delete(file) && !e.users.size) entries.delete(k);
};

// What `file` left of its kernels, runtimes, global rules and layers: dropped when it is about to run again (it is a
// dependency of an evaluation: `__at`), or when it has no site any more.
export const forgetKernels = (file: string): void => {
  for (const entries of [registry.kernels, registry.runtimes, registry.globals, registry.layers])
    unuse(entries, file);
};

// What `file` left of its kernels, token sets, themes and checks is dropped when it is about to run again, or has no site any more.
export const forget = (file: string): void => {
  forgetKernels(file);
  for (const themed of [registry.themed, registry.terminal?.themed ?? new Map<string, Themed>()])
    for (const [k, t] of themed) if (t.file === file) themed.delete(k);
  for (const [k, c] of registry.checks) if (c.at.file === file) registry.checks.delete(k);
};
