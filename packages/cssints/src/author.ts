// "cssints/plugin": what a plugin module is written with. A plugin is a module that exports members of a `scope()`
// (scope.ts); user code imports it `with { type: "cssints" }`, and its calls are sites like those of `css.*`. There is no
// registration: the style a member returns carries its kernel, runtime and conflicts, and the engine learns them there.
// Build time only (Node, the Module Runner): the types say a member returns a class string, as `cssints` does.
//
// Below the re-exports are the helpers that `scope()` replaces, kept as they were for what still uses them (`style()` is
// @cssints/mise-en-mode's, `fn()` builds colorMix() and min(); `context()` and `property()` only the tests). This file and
// scope.ts are what the "types" condition of package.json points at: signatures and one-line bodies, the engine is
// scope-engine.ts.
import type { CSSStyleValue } from "@cssints/css-grammar/values";

import type { Built, Conflict, Decl, Kernel, Method, Runtime } from "./author-types.ts";
import type { CheckIn, Part, Style } from "./parts.ts";
import { engine } from "./scope.ts";

export { arg, scope } from "./scope.ts";
export type {
  ArgsDef,
  Chain as ScopeChain,
  Css,
  Entry,
  Impl,
  KernelDef,
  Made,
  Members,
  Pending,
  Scope,
  Table,
  Typed,
} from "./scope.ts";
export type {
  Built,
  Conflict,
  Decl,
  GlobalRule,
  Kernel,
  Method,
  Runtime,
  ThemeRule,
} from "./author-types.ts";
export type { Part, Style };

/**
 * A method of a context: the grammar its value is checked against, whether a lone number is a spacing step, and the
 * declarations it emits (custom properties allowed; the engine checks the others like any property).
 */
export const method = <
  const G extends string,
  const Sp extends boolean = false,
  const X extends string = never,
>(def: {
  grammar: G;
  spacing?: Sp;
  excludes?: readonly X[];
  emit: (value: string) => Decl[];
}): Method<G, Sp, X> => def;

// A method that says nothing of `excludes` is inferred with `any` from the constraint of `context`, as `Sp` is.
type Excluded<X extends string> = string extends X ? never : X;
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
 * A chaining context like `flex()`: calling it gives the marker and the kernel, each method emits its declarations,
 * checked against its grammar, and is used once. A `runtime` is delivered when a target lacks its features; `conflicts`
 * is a build error when the style also sets a listed property.
 */
// `Method<any, any, any>`: with `Method` the grammar of `grammar: g` (`const g = "<length>"`) would widen to `string`.
export function context<
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
}): () => Chain<N, M> {
  return engine().context(def) as never;
}

/**
 * A function of grammar-typed parts that returns a style (what icon packages were): `build` gets the parts joined by a
 * space and gives declarations, with the markers (fixed classes, owned by the first kernel) and kernels they need.
 */
export function style<const G extends string>(
  grammar: G,
  build: (value: string) => Built,
): <const A extends readonly Part[]>(...parts: CheckIn<"style", G, false, A>) => Style {
  return engine().style(grammar, build) as never;
}

/**
 * A value function, a part of any property: `fn("<color-space> <color>", ([space, c]) => new CSSColorValue(...))`. The
 * parts are checked against `grammar` (joined by a space; a token is a part), `computeTo` gets each as text and runs at
 * build time only, and what it returns is inlined where the call is. A Typed OM result keeps its type (a
 * `CSSColorValue` is checked as a `<color>` in the types); a string is opaque to the types and checked in the
 * declaration it lands in at build time. `name` (default `fn`) labels the errors.
 */
export function fn<
  const G extends string,
  R extends string | CSSStyleValue,
  const N extends string = "fn",
>(
  grammar: G,
  computeTo: (args: string[]) => R,
  name?: N,
): <const A extends readonly Part[]>(...parts: CheckIn<N, G, false, A>) => R {
  return engine().fn(grammar, computeTo, name) as never;
}

/**
 * A user-defined typed property: `property("-webkit-font-smoothing", "auto | none | antialiased | subpixel-antialiased")`.
 * Its value is checked against `grammar`; `emit` (default: the property itself) gives the declarations. No support
 * warning: the engine knows nothing of it.
 */
export function property<const N extends string, const G extends string>(
  name: N,
  grammar: G,
  emit?: (value: string) => Decl[],
): <const A extends readonly Part[]>(...parts: CheckIn<N, G, false, A>) => Style {
  return engine().property(name, grammar, emit) as never;
}
