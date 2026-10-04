// What TypeScript sees of "cssints/plugin" (the "types" condition of package.json): the helpers of a plugin author with
// the types user code gets, where every member returns a class string. The implementation (author.ts) builds style
// nodes; nothing here runs.
import type { CSSStyleValue } from "@cssints/css-grammar/values";

import type { CheckIn, Part, Style } from "./parts.ts";

export type { Part, Style };
/** A declaration a member emits: property and value (a custom property, `--_r`, is allowed). */
export type Decl = readonly [prop: string, value: string];
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
 * A global rule a member contributes: `key` registers it once (like a kernel's), and it goes to layer `_.k` with the
 * globals. Unlike a kernel, two globals **may** declare the same custom property — a look sets the same `--color-*` in
 * several source layers, which is the point of fill-through. Use it for a rule that is not a class: a theme under
 * `[data-mode]`, an `@layer` order statement.
 */
export interface GlobalRule {
  key: string;
  css: string;
  /**
   * Where the rule goes: a top-level `@layer` of this name (a look belongs in `@layer app`), `null` for a verbatim
   * top-level rule (an `@layer a, b;` order statement), and omitted for layer `_.k` (the engine's own layer).
   */
  layer?: string | null;
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
 * `virtual:cssints/runtime/<name>`, which is empty unless a browserslist target lacks a feature in `polyfills` (and has
 * `@property`, which the runtime stands on); then it configures `cssints/parent-vars`, and `css` (the fallback rules) is
 * added to the sheet in layer `_.k`.
 */
export interface Runtime {
  polyfills: BcdKey[];
  parentVars?: ParentVar[];
  css?: string;
}
/** A build error when one `cn()` holds the member's marker and a property listed here (a name, or a pattern). */
export interface Conflict {
  props: (string | RegExp)[];
  message: string;
}

/** One method of a context: the grammar of its value (mdn syntax), and the declarations it emits. */
export interface Method<
  G extends string = string,
  Sp extends boolean = boolean,
  X extends string = string,
> {
  /** An empty grammar is a method that takes no value: `ink()`. */
  readonly grammar: G;
  /** A lone number is a step of the spacing scale (0.25rem), as in `padding`. */
  readonly spacing?: Sp;
  /** Methods that cannot be chained with this one: the chain leaves them out after it. */
  readonly excludes?: readonly X[];
  readonly emit: (value: string) => Decl[];
}
/** What `style()`'s `build` returns: declarations, and the fixed classes and kernels they need (markers belong to the first kernel). */
export interface Built {
  decls: Decl[];
  markers?: string[];
  kernels?: Kernel[];
  globals?: GlobalRule[];
}

// A method that says nothing of `excludes` is inferred with `any` from the constraint of `context`, as `Sp` is.
type Excluded<X extends string> = string extends X ? never : X;
// `boolean extends Sp`: a method that says nothing of `spacing` is inferred as `boolean` from the constraint of `context`.
/**
 * The chain a context gives: each method takes parts checked against its grammar (the message calls it `name.method`)
 * and leaves the chain without itself, so a method is used once.
 */
export type Chain<N extends string, M> = Style & {
  readonly [K in keyof M & string]: M[K] extends Method<infer G, infer Sp, infer X>
    ? string extends G
      ? (...parts: [`${N}.${K}: the grammar is not a literal type: write it as const`]) => never
      : G extends ""
        ? () => Chain<N, Omit<M, K | Excluded<X>>>
        : <const A extends readonly Part[]>(
            ...parts: CheckIn<`${N}.${K}`, G, boolean extends Sp ? false : Sp, A>
          ) => Chain<N, Omit<M, K | Excluded<X>>>
    : never;
};

/**
 * A method of a context: the grammar its value is checked against, whether a lone number is a spacing step, and the
 * declarations it emits (custom properties allowed; the engine checks the others like any property).
 */
export declare const method: <
  const G extends string,
  const Sp extends boolean = false,
  const X extends string = never,
>(def: {
  grammar: G;
  spacing?: Sp;
  excludes?: readonly X[];
  emit: (value: string) => Decl[];
}) => Method<G, Sp, X>;

/**
 * A chaining context like `flex()`: calling it gives the marker and the kernel, each method emits its declarations,
 * checked against its grammar, and is used once. A `runtime` is delivered when a target lacks its features; `conflicts`
 * is a build error when the style also sets a listed property.
 */
// `Method<any, any, any>`: with `Method` the grammar of `grammar: g` (`const g = "<length>"`) would widen to `string`.
export declare function context<
  const N extends string,
  // oxlint-disable-next-line typescript/no-explicit-any -- see above
  const M extends Record<string, Method<any, any, any>>,
>(def: {
  name: N;
  marker: string;
  kernel: Kernel;
  runtime?: Runtime;
  conflicts?: Conflict;
  methods: M;
}): () => Chain<N, M>;

/**
 * A function of grammar-typed parts that returns a style (what icon packages are): `build` gets the parts joined by a
 * space and gives declarations, with the markers (fixed classes, owned by the first kernel) and kernels they need.
 */
export declare function style<const G extends string>(
  grammar: G,
  build: (value: string) => Built,
): <const A extends readonly Part[]>(...parts: CheckIn<"style", G, false, A>) => Style;

/**
 * A value function, a part of any property: `fn("<color-space> <color>", ([space, c]) => new CSSColorValue(...))`. The
 * parts are checked against `grammar` (joined by a space; a token is a part), `computeTo` gets each as text and runs at
 * build time only, and what it returns is inlined where the call is. A Typed OM result keeps its type (a
 * `CSSColorValue` is checked as a `<color>` in the types); a string is opaque to the types and checked in the
 * declaration it lands in at build time. `name` (default `fn`) labels the errors.
 */
export declare function fn<
  const G extends string,
  R extends string | CSSStyleValue,
  const N extends string = "fn",
>(
  grammar: G,
  computeTo: (args: string[]) => R,
  name?: N,
): <const A extends readonly Part[]>(...parts: CheckIn<N, G, false, A>) => R;

/**
 * A user-defined typed property: `property("-webkit-font-smoothing", "auto | none | antialiased | subpixel-antialiased")`.
 * Its value is checked against `grammar`; `emit` (default: the property itself) gives the declarations. No support
 * warning: the engine knows nothing of it.
 */
export declare function property<const N extends string, const G extends string>(
  name: N,
  grammar: G,
  emit?: (value: string) => Decl[],
): <const A extends readonly Part[]>(...parts: CheckIn<N, G, false, A>) => Style;
