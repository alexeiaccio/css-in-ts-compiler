// "cssints/plugin": what a plugin module is written with. A plugin is a module that exports members built by these
// helpers; user code imports it `with { type: "cssints" }`, and its calls are sites like those of `css.*`. There is no
// registration: the style a member returns carries its kernel, runtime and conflicts, and the engine learns them there.
// Build time only (Node, the Module Runner): the types say a member returns a class string, as `cssints` does.
import { checkValueNow, isDeclarationError } from "@cssints/css-grammar/check";
import { properties } from "@cssints/css-grammar/mdn";

import { MemberError } from "./errors.ts";
import { failIn, isNode, node, probed, type CssNode } from "./lib.ts";
import type * as Types from "./author-types.ts";
import type { Built, Decl, Kernel, Method, Runtime, Conflict } from "./author-types.ts";
import { registry } from "./registry.ts";

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

// See author-types.ts.
export const method: typeof Types.method = (def) => def;

// See author-types.ts.
export const context: typeof Types.context = <
  N extends string,
  M extends Record<string, Method>,
>(def: {
  name: N;
  marker: string;
  kernel: Kernel;
  runtime?: Runtime;
  conflicts?: Conflict;
  methods: M;
}) => {
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
};

// See author-types.ts.
export const style: typeof Types.style = (grammar: string, build: (value: string) => Built) =>
  ((...args: unknown[]) => {
    const value = valueOf("style", "style", args);
    check("style", "style", grammar, value);
    // Whatever `build` throws is a failure at the call site, as a grammar error is.
    const {
      decls: d,
      markers,
      kernels,
    } = (() => {
      try {
        return build(value);
      } catch (e) {
        throw e instanceof MemberError
          ? e
          : failIn("style", e instanceof Error ? e.message : String(e));
      }
    })();
    return node(decls(d), {
      markers: markers?.map((m) => [m, kernels?.[0]?.key ?? ""]),
      kernels,
    });
  }) as never;

// See author-types.ts.
export const property: typeof Types.property = (
  name: string,
  grammar: string,
  emit?: (value: string) => Decl[],
) => {
  if (Object.hasOwn(properties, name))
    throw new MemberError({
      message: `cssints: property(${JSON.stringify(name)}): ${name} is a CSS property already, with its own grammar`,
      pluginName: name,
    });
  return ((...args: unknown[]) => {
    const value = valueOf(name, name, args);
    check(name, name, grammar, value);
    registry.userProps.add(name);
    return node(decls(emit ? emit(value) : [[name, value]]));
  }) as never;
};
