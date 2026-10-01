// "cssints/plugin": what a plugin module is written with. A plugin is a module that exports members built by these
// helpers; user code imports it `with { type: "cssints" }`, and its calls are sites like those of `css.*`. There is no
// registration: the style a member returns carries its kernel, runtime and conflicts, and the engine learns them there.
// Build time only (Node, the Module Runner): the types say a member returns a class string, as `cssints` does.
import { checkValueNow, isDeclarationError } from "@cssints/css-grammar/check";
import { properties } from "@cssints/css-grammar/mdn";

import { MemberError } from "./errors.ts";
import { failIn, isNode, node, probed, type CssNode } from "./lib.ts";
import type { CheckIn, Part, Style } from "./parts.ts";
import { registry } from "./registry.ts";
import type { Conflict, Kernel, ParentVar } from "./registry.ts";

export type { Part, Style };
/** A declaration a member emits: property and value (a custom property, `--_r`, is allowed). */
export type Decl = readonly [prop: string, value: string];
/** A feature of `@mdn/browser-compat-data`: `css.at-rules.container.style_queries_for_custom_properties`. */
export type BcdKey = `css.${string}`;
/**
 * Global rules, registered once by `key` (`name@version`) in layer `_.k`; `atProperty` goes at the top of the sheet.
 * A target lacking a `requires` feature gets a support warning (never an error).
 */
export interface KernelDef extends Kernel {
  requires?: BcdKey[];
}
/**
 * The runtime half of a member. It is delivered (the client module imports `virtual:cssints/runtime/<name>`) and its
 * `css` is added to the sheet only when a browserslist target lacks a feature in `polyfills`; the target must have
 * `@property`, which the runtime stands on. `parentVars` copies the nearest marked ancestor's computed `read` into `write`.
 */
export interface RuntimeDef {
  polyfills: BcdKey[];
  parentVars?: ParentVar[];
  css?: string;
}
/** A build error when one `cn()` holds the member's marker and a property listed here (a name, or a pattern). */
export type ConflictDef = Conflict;

/** One method of a context: the grammar of its value, and the declarations it emits. */
export interface Method<G extends string = string, Sp extends boolean = boolean> {
  readonly grammar: G;
  /** A lone number is a step of the spacing scale (0.25rem), as in `padding`. */
  readonly spacing?: Sp;
  readonly emit: (value: string) => Decl[];
}
/** What `style()`'s `build` returns: declarations, and the fixed classes and kernels they need. */
export interface Built {
  decls: Decl[];
  markers?: string[];
  kernels?: KernelDef[];
}

/**
 * The chain a context gives: each method takes parts checked against its grammar (the message calls it `name.method`)
 * and leaves the chain without itself, so a method is used once.
 */
export type Chain<N extends string, M> = Style & {
  readonly [K in keyof M & string]: M[K] extends Method<infer G, infer Sp>
    ? <const A extends readonly Part[]>(
        ...parts: CheckIn<`${N}.${K}`, G, Sp, A>
      ) => Chain<N, Omit<M, K>>
    : never;
};

// The text of a call's parts: a lone number is a spacing step where `spacing`; anything else is joined by a space.
const valueOf = (plugin: string, label: string, args: unknown[], spacing = false): string => {
  if (!args.length) throw failIn(plugin, `cssints: ${label}() expects a value`);
  if (args.some(isNode))
    throw failIn(
      plugin,
      `cssints: ${label}() takes values, not styles; merge styles with cn(...) or cx(...)`,
    );
  const [only] = args;
  return spacing && args.length === 1 && typeof only === "number"
    ? `${only * 0.25}rem`
    : args.join(" ");
};

// The value against the grammar, as the twin checks a property (a token in it as the literals of its type); a failure is
// a MemberError at the call site being evaluated.
const check = (plugin: string, label: string, grammar: string, value: string): void => {
  for (const v of probed(value, registry.properties))
    try {
      checkValueNow(label, grammar, v);
    } catch (e) {
      if (isDeclarationError(e)) throw failIn(plugin, e.message);
      throw e;
    }
};

const decls = (emitted: Decl[]) => emitted.map(([p, v]): [string, string] => [p, v]);

/**
 * A method of a context: the grammar its value is checked against, whether a lone number is a spacing step, and the
 * declarations it emits (custom properties allowed; the engine checks the others like any property).
 */
export const method = <const G extends string, const Sp extends boolean = false>(def: {
  grammar: G;
  spacing?: Sp;
  emit: (value: string) => Decl[];
}): Method<G, Sp> => def;

/**
 * A chaining context like `flex()`: calling it gives the marker and the kernel, each method emits its declarations,
 * checked against its grammar, and is used once. A `runtime` is delivered when a target lacks its features; `conflicts`
 * is a build error when the style also sets a listed property.
 */
export function context<const N extends string, const M extends Record<string, Method>>(def: {
  name: N;
  marker: string;
  kernel: KernelDef;
  runtime?: RuntimeDef;
  conflicts?: ConflictDef;
  methods: M;
}): () => Chain<N, M> {
  const { name, marker, kernel, runtime, conflicts, methods } = def;
  const plugs = runtime || conflicts ? [{ name, marker, conflicts, runtime }] : undefined;
  const next =
    (used: ReadonlySet<string>) =>
    (m: string, args: unknown[], self: CssNode): CssNode => {
      const meth = Object.hasOwn(methods, m) ? methods[m] : undefined;
      if (!meth)
        throw failIn(
          name,
          `cssints: ${name}() has no .${m}(); it chains ${Object.keys(methods)
            .filter((k) => !used.has(k))
            .join(", ")}`,
        );
      if (used.has(m)) throw failIn(name, `cssints: ${name}().${m}() is used twice`);
      const value = valueOf(name, `${name}.${m}`, args, meth.spacing);
      check(name, `${name}.${m}`, meth.grammar, value);
      return node(
        [...self.__cssints, ...decls(meth.emit(value))],
        self,
        next(new Set(used).add(m)),
      );
    };
  return () =>
    node(
      [],
      { markers: [[marker, kernel.key]], kernels: [kernel], plugs },
      next(new Set()),
    ) as never;
}

/**
 * A function of grammar-typed parts that returns a style (what icon packages are): `build` gets the parts joined by a
 * space and gives declarations, with the markers (fixed classes, owned by the first kernel) and kernels they need.
 */
export function style<const G extends string>(
  grammar: G,
  build: (value: string) => Built,
): <const A extends readonly Part[]>(...parts: CheckIn<"style", G, false, A>) => Style {
  return ((...args: unknown[]) => {
    const value = valueOf("style", "style", args);
    check("style", "style", grammar, value);
    const { decls: d, markers, kernels } = build(value);
    return node(decls(d), {
      markers: markers?.map((m) => [m, kernels?.[0]?.key ?? ""]),
      kernels,
    });
  }) as never;
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
  if (Object.hasOwn(properties, name))
    throw new MemberError({
      message: `cssints: property(${JSON.stringify(name)}): ${name} is a CSS property already, with its own grammar`,
      plugin: name,
    });
  return ((...args: unknown[]) => {
    const value = valueOf(name, name, args);
    check(name, name, grammar, value);
    registry.userProps.add(name);
    return node(decls(emit ? emit(value) : [[name, value]]));
  }) as never;
}
