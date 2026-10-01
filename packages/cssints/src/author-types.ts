// What TypeScript sees of "cssints/plugin" (the "types" condition of package.json): the helpers of a plugin author with
// the types user code gets, where every member returns a class string. The implementation (author.ts) builds style
// nodes; nothing here runs.
import type { CheckIn, Part, Style } from "./parts.ts";

export type { Part, Style };
/** A declaration a member emits: property and value (a custom property, `--_r`, is allowed). */
export type Decl = readonly [prop: string, value: string];
/** A feature of `@mdn/browser-compat-data`: `css.at-rules.container.style_queries_for_custom_properties`. */
export type BcdKey = `css.${string}`;

/**
 * Global rules, registered once by `key` (`name@version`) in layer `_.k`; `atProperty` (the `@property` rules of its
 * custom properties) goes at the top of the sheet. A target lacking a `requires` feature gets a support warning, never an
 * error. Two members share a kernel by pointing at the same object; the same key with other CSS is a build error, as is
 * a custom property or a marker that two keys share.
 */
export interface Kernel {
  key: string;
  css: string;
  atProperty?: string;
  requires?: BcdKey[];
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
export interface Method<G extends string = string, Sp extends boolean = boolean> {
  readonly grammar: G;
  /** A lone number is a step of the spacing scale (0.25rem), as in `padding`. */
  readonly spacing?: Sp;
  readonly emit: (value: string) => Decl[];
}
/** What `style()`'s `build` returns: declarations, and the fixed classes and kernels they need (markers belong to the first kernel). */
export interface Built {
  decls: Decl[];
  markers?: string[];
  kernels?: Kernel[];
}

// `boolean extends Sp`: a method that says nothing of `spacing` is inferred as `boolean` from the constraint of `context`.
/**
 * The chain a context gives: each method takes parts checked against its grammar (the message calls it `name.method`)
 * and leaves the chain without itself, so a method is used once.
 */
export type Chain<N extends string, M> = Style & {
  readonly [K in keyof M & string]: M[K] extends Method<infer G, infer Sp>
    ? string extends G
      ? (...parts: [`${N}.${K}: the grammar is not a literal type: write it as const`]) => never
      : <const A extends readonly Part[]>(
          ...parts: CheckIn<`${N}.${K}`, G, boolean extends Sp ? false : Sp, A>
        ) => Chain<N, Omit<M, K>>
    : never;
};

/**
 * A method of a context: the grammar its value is checked against, whether a lone number is a spacing step, and the
 * declarations it emits (custom properties allowed; the engine checks the others like any property).
 */
export declare const method: <const G extends string, const Sp extends boolean = false>(def: {
  grammar: G;
  spacing?: Sp;
  emit: (value: string) => Decl[];
}) => Method<G, Sp>;

/**
 * A chaining context like `flex()`: calling it gives the marker and the kernel, each method emits its declarations,
 * checked against its grammar, and is used once. A `runtime` is delivered when a target lacks its features; `conflicts`
 * is a build error when the style also sets a listed property.
 */
// `Method<any, any>`: with `Method` the grammar of `grammar: g` (`const g = "<length>"`) would widen to `string`.
export declare function context<
  const N extends string,
  // oxlint-disable-next-line typescript/no-explicit-any -- see above
  const M extends Record<string, Method<any, any>>,
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
 * A user-defined typed property: `property("-webkit-font-smoothing", "auto | none | antialiased | subpixel-antialiased")`.
 * Its value is checked against `grammar`; `emit` (default: the property itself) gives the declarations. No support
 * warning: the engine knows nothing of it.
 */
export declare function property<const N extends string, const G extends string>(
  name: N,
  grammar: G,
  emit?: (value: string) => Decl[],
): <const A extends readonly Part[]>(...parts: CheckIn<N, G, false, A>) => Style;
