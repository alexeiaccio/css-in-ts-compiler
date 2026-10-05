// "cssints/plugin": what a plugin module is written with. A plugin is a module that exports members built by these
// helpers; user code imports it `with { type: "cssints" }`, and its calls are sites like those of `css.*`. There is no
// registration: the style a member returns carries its kernel, runtime and conflicts, and the engine learns them there.
// Build time only (Node, the Module Runner): the types say a member returns a class string, as `cssints` does.
import { checkValueNow, isDeclarationError } from "@cssints/css-grammar/check";
import { properties } from "@cssints/css-grammar/mdn";
import { CSSStyleValue } from "@cssints/css-grammar/values";
import { Formatter, Result } from "effect";

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
    Result.getOrThrowWith(
      Result.try({
        try: () => checkValueNow(label, grammar, v),
        catch: (e) => (isDeclarationError(e) ? failIn(plugin, e.message) : e),
      }),
      (e) => e,
    );
};

const decls = (emitted: Decl[]) => emitted.map(([p, v]): [string, string] => [p, v]);

// See author-types.ts.
export const method: typeof Types.method = (def) => def as never;

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
  // `used`: the methods taken out of the chain, each with the one that took it out (itself, or what excludes it)
  const next =
    (used: ReadonlyMap<string, string>) =>
    (m: string, args: unknown[], self: CssNode): CssNode => {
      const meth = Object.hasOwn(methods, m) ? methods[m] : undefined;
      if (!meth)
        throw failIn(
          name,
          `cssints: ${name}() has no .${m}(); it chains ${Object.keys(methods)
            .filter((k) => !used.has(k))
            .join(", ")}`,
        );
      const by = used.get(m);
      if (by === m) throw failIn(name, `cssints: ${name}().${m}() is used twice`);
      if (by) throw failIn(name, `cssints: ${name}().${m}() cannot go with .${by}()`);
      let value = "";
      if (meth.grammar === "") {
        if (args.length) throw failIn(name, `cssints: ${name}().${m}() takes no value`);
      } else {
        value = valueOf(name, `${name}.${m}`, args, meth.spacing);
        check(name, `${name}.${m}`, meth.grammar, value);
      }
      const taken = new Map(used).set(m, m);
      for (const x of meth.excludes ?? []) taken.set(x, m);
      return node([...self.__cssints, ...decls(meth.emit(value))], self, next(taken));
    };
  return () =>
    node(
      [],
      { markers: [[marker, kernel.key]], kernels: [kernel], plugs },
      next(new Map()),
    ) as never;
};

// What a plugin's callback (`build`, `computeTo`) throws is a failure at the call site, as a grammar error is.
const ran = <T>(plugin: string, run: () => T) =>
  Result.getOrThrowWith(
    Result.try({
      try: run,
      catch: (e) =>
        e instanceof MemberError ? e : failIn(plugin, e instanceof Error ? e.message : String(e)),
    }),
    (e) => e,
  );

// See author-types.ts.
export const style: typeof Types.style = (grammar: string, build: (value: string) => Built) =>
  ((...args: unknown[]) => {
    const value = valueOf("style", "style", args);
    check("style", "style", grammar, value);
    const {
      decls: d,
      markers,
      kernels,
      globals,
      themes,
      layers,
    } = ran("style", () => build(value));
    return node(decls(d), {
      markers: markers?.map((m) => [m, kernels?.[0]?.key ?? ""]),
      kernels,
      globals,
      themes,
      layers: layers && [layers],
    });
  }) as never;

// See author-types.ts. The parts are checked against the grammar, `computeTo` gets each one as text (a token as its
// `var(--name)`), and what it returns is the value: a part of any property, where the declaration is checked as usual.
export const fn: typeof Types.fn = (
  grammar: string,
  computeTo: (args: string[]) => string | CSSStyleValue,
  name: string = "fn",
) =>
  ((...args: unknown[]) => {
    check(name, name, grammar, valueOf(name, name, args));
    const out = ran(name, () => computeTo(args.map(String)));
    if (typeof out !== "string" && !(out instanceof CSSStyleValue))
      throw failIn(name, `cssints: ${name}() computeTo must return a string or a Typed OM value`);
    return out;
  }) as never;

// See author-types.ts.
export const property: typeof Types.property = (
  name: string,
  grammar: string,
  emit?: (value: string) => Decl[],
) => {
  if (Object.hasOwn(properties, name))
    throw new MemberError({
      message: `cssints: property(${Formatter.formatJson(name)}): ${name} is a CSS property already, with its own grammar`,
      pluginName: name,
    });
  return ((...args: unknown[]) => {
    const value = valueOf(name, name, args);
    check(name, name, grammar, value);
    registry.userProps.add(name);
    return node(decls(emit ? emit(value) : [[name, value]]));
  }) as never;
};
