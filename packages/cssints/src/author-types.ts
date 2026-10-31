// The shapes the engine and the helpers of "cssints/plugin" share: kernels, global rules, themes, runtimes, conflicts and
// the themes of a call member. Interfaces only; the helpers and their types are in author.ts and scope.ts.
import type { Cond } from "./node.ts";

/** A declaration a member emits: property and value (a custom property, `--_r`, is allowed); `append()` makes a list. */
export type Decl = readonly [
  prop: string,
  value: string,
  conds?: readonly Cond[],
  fallbacks?: readonly string[],
  join?: ",",
];
/** A feature of `@mdn/browser-compat-data`: `css.at-rules.container.style_queries_for_custom_properties`. */
export type BcdKey = `css.${string}`;

/**
 * Global rules, registered once by `key` (`name@version`) in layer `_.k`; `atProperty` (the `@property` rules of its
 * custom properties) goes at the top of the sheet. A target lacking a `requires` feature gets a support warning, never an
 * error; `{ key, exact: true }` also counts a partial implementation as lacking (relative colour, whose channel scales
 * differ in Chrome 119-121 and Safari 16.4-17.6). Two members share a kernel by pointing at the same object; the same key with other CSS is a build error, as is
 * a custom property or a marker that two keys share.
 */
export interface Kernel {
  key: string;
  css: string;
  atProperty?: string;
  requires?: (BcdKey | { key: BcdKey; exact: true })[];
}
/**
 * A global rule a member contributes. It is identified by its content (`layer` and `css`): the same rule from two
 * styles is one, an edit of it replaces the old one, and it is in the sheet of the modules whose styles carry it, until
 * they stop. It goes to layer `_.k` with the kernels. Unlike a kernel, two globals **may** declare the same custom
 * property: a look sets the same `--color-*` in several source layers, which is the point of fill-through. Use it for a
 * rule that is not a class.
 */
export interface GlobalRule {
  css: string;
  /**
   * A top-level `@layer` of this name to put the rule in (a rule that must beat the engine's `:root` fallbacks). The
   * layer must be declared: by `layers` of the same `Made`, or by `layers()` in a module this one imports. Omitted:
   * layer `_.k`.
   */
  layer?: string;
}
/**
 * A theme a member contributes, as `createGlobalTheme(tokens, selector, overrides, { layer, scope })` makes one: the
 * same checks (the paths and values of `overrides` against the types of `tokens`, a layer that is declared), the
 * aliases that depend on an override declared again, and `check.contrast` reads it. `tokens` is a token set of
 * `createTokens()` that the member got from its caller (a closure: the arguments of a member are joined into one string).
 */
export interface ThemeRule {
  tokens: object;
  overrides: object;
  selector: string;
  layer?: string;
  /** A selector: the rule goes inside `@scope (<scope>) { ... }`. */
  scope?: string;
}
/** One element family of a runtime: the nearest `marker` ancestor's computed `read` is copied into `write`. */
export interface ParentVar {
  marker: string;
  read: `--${string}`;
  write: `--${string}`;
  /** A property that changes when a CSS condition (`:hover`, a media query) changes `read`: its transition re-runs the copy. */
  watch?: `--${string}`;
}
/**
 * The runtime half of a member. The client module that holds a site with the member imports
 * `virtual:cssints/runtime/<name>`, which is empty unless a browserslist target lacks a feature in `polyfills` (and, with
 * `parentVars`, has `@property`, which the script stands on); then it imports `script`, configures `cssints/parent-vars`,
 * and `css` (the fallback rules) is added to the sheet in layer `_.k`. A `requires` of the member's kernel that is in
 * `polyfills` warns only for the targets the runtime does not reach.
 */
export interface Runtime {
  polyfills: BcdKey[];
  parentVars?: ParentVar[];
  css?: string;
  /** The plugin's browser script, a module specifier the app resolves (`"@cssints/balance/runtime"`): imported, never evaluated at build time. */
  script?: string;
}
/**
 * A value a site ships as a JavaScript object of its own: `ship({ owner, open })` (`@cssints/reactive`'s `state()`, whose
 * owner is a style and whose sources are data). Each `Style` becomes its class string, an array or an object keeps its
 * shape, and anything else is its JSON.
 */
export interface Ship {
  readonly "~ship": { readonly [key: string]: unknown };
}
/** A build error when one `cn()` holds the member's marker and a property listed here (a name, or a pattern). */
export interface Conflict {
  props: (string | RegExp)[];
  message: string;
}
