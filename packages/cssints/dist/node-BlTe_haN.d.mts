import { a as Kernel, i as GlobalRule, n as Conflict, o as Runtime, s as ThemeRule } from "./author-types-DXdNP23z.mjs";
import { Context } from "effect";
import { TokenType } from "@cssints/css-grammar/token";
//#region src/registry.d.ts
interface Rule {
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
interface Plug {
  name: string;
  /** What errors call it (the scope that owns `name`), when that is not `name`. */
  label?: string;
  marker: string;
  conflicts?: Conflict;
  runtime?: Runtime;
}
/** A registered runtime, by plugin name: the files whose styles use it. */
interface RuntimeEntry {
  runtime: Runtime;
  users: Set<string>;
}
/** A registered kernel: the custom properties it declares, the markers printed for it, the files that use it. */
interface KernelEntry {
  kernel: Kernel;
  vars: string[];
  markers: Set<string>;
  users: Set<string>;
}
/** The call site being evaluated, set by `__at` before its expression runs. */
interface At {
  file: string;
  site: number;
  offset: number;
}
/** A token's `@property` rule, by variable name (`--color-primary`). One entry per name across all modules. */
interface Property {
  css: string;
  /** Literals of its type, put in place of `var(--name)` when a value that uses it is checked (TOKEN_TYPES). */
  probes: readonly string[];
  /** Where it was declared: `file#site.n`, `file`, and the evaluation (`gen`) that declared it. */
  by: string;
  file: string;
  gen: number;
}
/** What a token is worth, by variable name: its literal (an alias or a derived token: the flattened one), and what it stays live as. */
interface TokenDef {
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
interface Themed {
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
interface GlobalEntry {
  global: GlobalRule;
  users: Set<string>;
}
/** A statement `@layer a, b;` to declare: `before` prints it before the engine's `@layer _.k, …;`, so its layers rank below. */
interface LayersDecl {
  names: readonly string[];
  before?: boolean;
}
/** A declared statement `@layer a, b;` (`layers()`), by its names joined with `,`, with the files that declared it. */
interface LayerEntry {
  names: string[];
  before: boolean;
  users: Set<string>;
}
/** A `css.check.contrast` call, checked once the module that made it has run, and again at the end of a build. */
interface Check {
  at: At;
  fg: string;
  bg: string;
  min: number;
  gen: number;
}
interface RegistryState {
  /** file -> site index -> replacement expression */
  sites: Map<string, Map<number, string>>;
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
    kernelOf: (what: string, style: CssNode, cls: string) => {
      css: string;
      props: string[];
      kernels?: Kernel[];
    };
  };
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
  /** support warnings not yet handed to Vite */
  warnings: string[];
  /** `property feature` keys already warned about in this build */
  warned: Set<string>;
  /** `property value feature targets` -> what LightningCSS lowers it to, or false (lowered.ts) */
  lowered: Map<string, string | false>;
  at?: At;
  /** the site `tokens` is counting for: a call in a loop is one site that registers several tokens */
  site?: string;
}
declare global {
  var __cssints: RegistryState | undefined;
}
//#endregion
//#region src/node.d.ts
/**
 * One condition of a style: an at-rule prelude (`@media (width >= 40rem)`), a pseudo-class (`:hover`), an attribute
 * (`[aria-current="page"]`) or, with `ancestor`, a selector of a marked ancestor (`:where(._g:hover)`), or, with
 * `nest` (kernels only), other elements relative to the class (`& > *`: `&` is the class, the rest follows it).
 * `rank` orders the rules of a layer: the min-width of a media or container query in px, the place of a pseudo-class.
 */
interface Cond {
  text: string;
  rank: number;
  ancestor?: true;
  nest?: true;
}
/**
 * One declaration: property and value, under the conditions that wrap it (outermost first). `fallbacks` are the other
 * values of a `firstThatWorks(...)`, best first: the rule prints them before `value`, which is the one wanted.
 */
type Decl = [prop: string, value: string, conds?: Cond[], fallbacks?: string[]];
/**
 * What a css.* builder returns: its declarations, and next to them the fixed classes it prints (`markers`, each with
 * the key of the kernel it belongs to), the kernels it needs, and the plugin members whose runtime and conflicts apply
 * (`plugs`). `cn()` merges all three.
 */
interface CssNode {
  __cssints: Decl[];
  markers?: [marker: string, kernel: string][];
  kernels?: Kernel[];
  globals?: GlobalRule[];
  themes?: ThemeRule[];
  layers?: LayersDecl[];
  plugs?: Plug[];
}
//#endregion
export { RegistryState as i, At as n, LayersDecl as r, CssNode as t };