// Runs inside the Vite Module Runner. css.* builds declaration nodes; __site (injected by the
// plugin) turns a node into its replacement expression and records it per call site.
//
// The css.* builders are synchronous, since user code composes them in expressions and stores them in variables.
// Everything behind them is Effect: validation, class generation and the recording of a site (`recordSite`).
// `__at` and `__site` are the two calls the plugin puts around every site; they run inside user modules, so they
// are the synchronous edge where an Effect is run (`runSite`).
import {
  checkDeclarationNow,
  checkQuery,
  type DeclarationError,
  isDeclarationError,
} from "@cssints/css-grammar/check";
import type { QueryKind } from "@cssints/css-grammar/query";
import { messageOf } from "@cssints/css-grammar/support";
import { CSS, CSSColorValue, CSSStyleValue, CSSUnitValue } from "@cssints/css-grammar/values";
import { Cause, Effect, Exit } from "effect";

import { MacroError } from "./errors.ts";
import {
  camel,
  carried,
  chainDecl,
  CONTEXTS,
  fail,
  hashClass,
  isNode,
  LAYER,
  MAX_CONDS,
  minWidth,
  probed,
  PSEUDOS,
  toDecls,
  VAR,
  type Cond,
  type CssNode,
  type Decl,
} from "./lib.ts";
import { addKernel } from "./kernel.ts";
import { type At, registry, Registry, type RegistryState, type Rule } from "./registry.ts";
import { _cv as runtimeCv, type CvRuntimeConfig } from "./runtime.ts";
import { check, createGlobalTheme, createTokens, isDone, tokensOf } from "./theme.ts";
import { isStyle, style, token, type StyleNode } from "./token.ts";

export { CSS, CSSColorValue, CSSUnitValue };

// A style: its declarations, the layout context (flex / grid) whose container properties it chains, and its markers
// and kernels. The target always has the two keys (undefined when empty): a missing one would read as a chain method.
const node = (
  decls: Decl[],
  ctx: string | undefined,
  { markers, kernels }: Pick<CssNode, "markers" | "kernels"> = {},
): CssNode =>
  new Proxy<CssNode>(
    { __cssints: decls, markers, kernels },
    {
      get: (t, k) =>
        k in t || typeof k === "symbol"
          ? (t as unknown as Record<string | symbol, unknown>)[k]
          : (...args: unknown[]) => node([...decls, chainDecl(ctx, k, args)], ctx, t),
    },
  );

const member =
  (k: string) =>
  (...args: unknown[]) =>
    node(toDecls(k, args), CONTEXTS[k] && !args.length ? k : undefined);

export const cn = (...args: unknown[]) => {
  const decls = toDecls("cn", args);
  return node(decls, undefined, carried(args as CssNode[]));
};
export const flex = member("flex");
export const grid = member("grid");

// A condition: styles in, the same styles under it out. Made by media(), container(), supports() and the pseudo-class
// wrappers; `__cond` marks it, so a site that holds one records nothing but a placeholder (`inertOf`).
interface Wrapper {
  (...styles: unknown[]): CssNode;
  __cond: true;
  cond: Cond;
}
const isWrapper = (v: unknown): v is Wrapper => typeof v === "function" && "__cond" in v;

const wrapper = (cond: Cond): Wrapper =>
  Object.assign(
    (...styles: unknown[]) => {
      if (!styles.length || !styles.every(isNode))
        throw fail(
          `cssints: ${cond.text} wraps css.* styles, got ${JSON.stringify(styles.filter((s) => !isNode(s)))}`,
        );
      return node(
        styles.flatMap((n) =>
          n.__cssints.map(([p, v, inner = []]): Decl => {
            if (inner.length >= MAX_CONDS)
              throw fail(
                `cssints: a style takes at most ${MAX_CONDS} conditions (layers ${LAYER[0]} to ${LAYER[MAX_CONDS]}); this one has ${inner.length + 1}: ${[cond, ...inner].map((c) => c.text).join(" > ")}`,
              );
            return [p, v, [cond, ...inner]];
          }),
        ),
        undefined,
        carried(styles),
      );
    },
    { __cond: true as const, cond },
  );

// media("(width >= 40rem)"): the query is checked against its grammar, like a property value.
const query = (kind: QueryKind, q: unknown): Wrapper => {
  if (typeof q !== "string")
    throw fail(`cssints: ${kind}() takes a query string, got ${JSON.stringify(q)}`);
  const exit = Effect.runSyncExit(checkQuery(kind, q));
  if (Exit.isFailure(exit)) {
    const e = Cause.squash(exit.cause) as Error;
    throw new MacroError({ message: e.message, cause: e, ...registry.at });
  }
  const text = q.trim();
  return wrapper({ text: `@${kind} ${text}`, rank: kind === "supports" ? 0 : minWidth(text) });
};

// One query gives a wrapper, several a tuple of them, an object of queries an object of them.
const condition =
  (kind: QueryKind) =>
  (...args: unknown[]) => {
    const [only] = args;
    if (!args.length) throw fail(`cssints: ${kind}() expects a query string`);
    if (args.length > 1) return args.map((q) => query(kind, q));
    if (typeof only === "object" && only !== null && !Array.isArray(only))
      return Object.fromEntries(Object.entries(only).map(([k, q]) => [k, query(kind, q)]));
    return query(kind, only);
  };

const conditions = {
  media: condition("media"),
  container: condition("container"),
  supports: condition("supports"),
  ...Object.fromEntries(Object.entries(PSEUDOS).map(([n, c]) => [n, wrapper(c)])),
};

type Styles = Record<string, Record<string, unknown>>;
interface CvConfig {
  base?: unknown;
  variants?: Styles;
  defaultVariants?: Record<string, string>;
}
/** cv(config): the config as written; `recordSite` turns it into class strings. */
interface CvNode {
  __cv: CvConfig;
}
const isCv = (v: unknown): v is CvNode => !!v && typeof v === "object" && "__cv" in v;

// What the grammar package rejects, per declaration.
type Invalid = DeclarationError;

// A failure names the call site it happened in, so the plugin can point Vite at it.
const located = (at: At) => (e: Invalid | MacroError) =>
  e instanceof MacroError && e.file !== undefined
    ? e
    : new MacroError({ message: e.message, cause: e, ...at });

// The rule of one declaration: its layer is the number of its conditions; pseudo-classes join the selector, the
// others wrap the rule; `cond` orders the rules of a layer (min-width, then pseudo-class places).
const ruleOf = (cls: string, [prop, value, conds = []]: Decl): Rule => {
  const wrap: string[] = [];
  const ranks: number[] = [];
  let pseudo = "";
  let width = 0;
  for (const c of conds)
    if (c.text.startsWith(":")) {
      pseudo += c.text;
      ranks.push(c.rank);
    } else {
      wrap.push(c.text);
      width = Math.max(width, c.rank);
    }
  const tokens = value.includes("var(--") ? [...value.matchAll(VAR)].map((m) => m[1]!) : undefined;
  return {
    layer: LAYER[conds.length]!,
    cond: conds.length ? [width, ...ranks] : [],
    wrap,
    prop,
    css: `.${cls}${pseudo}{${prop}:${value}}`,
    tokens,
  };
};

// One declaration against the grammar, the prose rules and, once per class, browser support. Throws at the bad token (the
// build-time twin of the type-level check) or at a prose rule. Support warnings are recorded once per property and BCD
// feature per build, not once per value. A token in the value is checked as the literals of its type (`probed`).
const checkNow = (
  [prop, value]: Decl,
  fresh: boolean,
  { warnings, warned, properties }: RegistryState,
) => {
  for (const v of probed(value, properties)) {
    let found;
    try {
      found = checkDeclarationNow(prop, v, fresh);
    } catch (e) {
      if (v !== value && isDeclarationError(e))
        Object.assign(e, {
          message: `${e.message} ("${value}" is checked as "${v}": a token stands for a value of its type)`,
        });
      throw e;
    }
    for (const w of found) {
      const k = `${prop} ${w.key}`;
      if (!warned.has(k)) {
        warned.add(k);
        warnings.push(messageOf(prop, value, w));
      }
    }
  }
};

// The classes of a style: its markers, then its declarations, registered in the sheet. A plain loop over the declarations (hash, twin,
// prose rules, support), inside the one Effect boundary of `classesOf`: an Effect step per declaration was over
// the perf budget.
const classesNow = (
  decls: Decl[],
  registry: RegistryState,
  markers: CssNode["markers"],
): string => {
  const { rules } = registry;
  const out: string[] = markers ? [...new Set(markers.map((m) => m[0]))] : [];
  for (const d of decls) {
    const cls = hashClass(d);
    const fresh = !rules.has(cls);
    checkNow(d, fresh, registry);
    if (!out.includes(cls)) out.push(cls);
    if (fresh) rules.set(cls, ruleOf(cls, d));
  }
  return out.join(" ");
};

const classesOf = Effect.fnUntraced(function* (
  { __cssints: decls, markers, kernels }: CssNode,
  at?: At,
): Effect.fn.Return<string, Invalid | MacroError> {
  const registry = yield* Registry;
  if (kernels) for (const k of kernels) yield* addKernel(k, markers ?? [], at);
  return yield* Effect.try({
    try: () => classesNow(decls, registry, markers),
    catch: (e) => {
      if (isDeclarationError(e)) return e;
      throw e; // a bug, not a user error: a defect
    },
  });
});

const styleOf = Effect.fnUntraced(function* (
  s: unknown,
  where: string,
  at?: At,
): Effect.fn.Return<string, Invalid | MacroError> {
  if (!isNode(s))
    return yield* new MacroError({
      message: `cssints: cv() ${where} must be a css.* value (cn(...), a flex() chain or one property), got ${JSON.stringify(s)}. CSS strings are gone: write cn(p(4), fontSize("1rem"))`,
    });
  return yield* classesOf(s, at);
});

// cv(config with css.* values) -> CvRuntimeConfig with class strings, consumed by _cv at runtime.
const cvOf = Effect.fnUntraced(function* (
  config: CvConfig,
  at?: At,
): Effect.fn.Return<string, Invalid | MacroError> {
  const variants: Record<string, Record<string, string>> = {};
  const base = config.base === undefined ? "" : yield* styleOf(config.base, "base", at);
  for (const [k, vs] of Object.entries(config.variants ?? {})) {
    const classes: Record<string, string> = {};
    for (const [n, s] of Object.entries(vs))
      classes[n] = yield* styleOf(s, `variant ${k}.${n}`, at);
    variants[k] = classes;
  }
  return JSON.stringify({ base, variants, defaultVariants: config.defaultVariants ?? {} });
});

export const cv = (config: CvConfig): CvNode => ({ __cv: config });

// `_cv` during evaluation (index.ts exports this one, the browser gets runtime.ts): cv() is a node here, not the
// config of class strings the plugin puts in its place, so a module that calls `_cv(cv(...))` at its top level
// gets the same function it will have in the browser.
export const _cv = (config: CvNode | CvRuntimeConfig) => {
  if (!isCv(config)) return runtimeCv(config);
  const exit = Effect.runSyncExit(cvOf(config.__cv));
  if (Exit.isFailure(exit)) throw Cause.squash(exit.cause);
  return runtimeCv(JSON.parse(exit.value) as CvRuntimeConfig);
};

// Any name besides these (css.p, css.alignItems) is a property. Named imports of build-time members come from
// here too: the plugin rewrites them to destructure `css`, so the property list stays derived from the grammar.
const named: Record<string, unknown> = {
  cn,
  flex,
  grid,
  cv,
  ...conditions,
  token,
  style,
  createTokens,
  createGlobalTheme,
  check,
  CSS,
  CSSColorValue,
  CSSUnitValue,
};
export const css = new Proxy(named, {
  get: (t, k) => (Object.hasOwn(t, k) ? t[k as string] : member(String(k))),
});
named.css = css;

// A condition, or a tuple or an object of them, held in a variable (`const [md, lg] = css.media(a, b)`): nothing of it
// ships. Every call of it is a site of its own (instrument.ts), so the client keeps a placeholder of the same shape.
const inertOf = (v: unknown): string | undefined => {
  if (isWrapper(v)) return "null";
  if (Array.isArray(v) && v.length && v.every(isWrapper))
    return `[${v.map(() => "null").join(",")}]`;
  if (typeof v !== "object" || v === null) return undefined;
  const entries = Object.entries(v);
  return entries.length && entries.every(([, w]) => isWrapper(w))
    ? `{${entries.map(([k]) => `${JSON.stringify(k)}:null`).join(",")}}`
    : undefined;
};

// style(...): `{ "--color-primary": "red", color: "var(--color-primary)" }`, the custom properties first, then the
// declarations, whose values are checked like a class's.
const inlineOf = Effect.fnUntraced(function* ({
  __style: { sets, decls },
}: StyleNode): Effect.fn.Return<string, Invalid> {
  const registry = yield* Registry;
  return yield* Effect.try({
    try: () => {
      for (const d of decls) checkNow(d, true, registry);
      const entries = new Map([...sets, ...decls.map(([p, v]): [string, string] => [camel(p), v])]);
      return `{ ${[...entries].map(([k, v]) => `${k.startsWith("--") ? JSON.stringify(k) : k}: ${JSON.stringify(v)}`).join(", ")} }`;
    },
    catch: (e) => {
      if (isDeclarationError(e)) return e;
      throw e; // a bug, not a user error: a defect
    },
  });
});

// A definition site: `export const mdi = icons({...})` in a build-time module holds a plugin value, a function or a
// configured object. It has no replacement (nothing of it ships: its module is not in the client graph), and a client
// module that calls it (`mdi("home")`) has a site of its own.
const isPluginValue = (v: unknown): boolean =>
  typeof v === "function" || (typeof v === "object" && v !== null);

// The replacement expression of a site, undefined for a definition site: class strings, the cv() config, an inline style, or a Typed OM value's CSS text.
const replacementOf = Effect.fnUntraced(function* (
  at: At,
  value: unknown,
): Effect.fn.Return<string | undefined, Invalid | MacroError> {
  if (isNode(value)) return JSON.stringify(yield* classesOf(value, at));
  if (isCv(value)) return yield* cvOf(value.__cv, at);
  if (isStyle(value)) return yield* inlineOf(value);
  const tokens = tokensOf(value);
  if (tokens !== undefined) return tokens;
  if (isDone(value)) return "undefined";
  // A Typed OM value (CSS.rem(1), new CSSColorValue(...)) ships as its CSS text; the objects are eval-time only.
  // oxlint-disable-next-line typescript/no-base-to-string -- every CSSStyleValue subclass overrides toString
  if (value instanceof CSSStyleValue) return JSON.stringify(String(value));
  const inert = inertOf(value);
  if (inert !== undefined) return inert;
  if (isPluginValue(value)) return undefined;
  return yield* new MacroError({
    message: `cssints: site ${at.site} in ${at.file} did not produce a css.*, cv(), style(), condition or Typed OM value`,
  });
});

// Once per site: untraced, since a span here is ~4 µs a site (over the perf budget). The evaluation of the whole
// module, in evaluate.ts, is the traced boundary.
const recordSite = Effect.fnUntraced(function* (
  at: At,
  value: unknown,
): Effect.fn.Return<unknown, MacroError> {
  const { sites } = yield* Registry;
  const replacement = yield* replacementOf(at, value).pipe(Effect.mapError(located(at)));
  if (replacement === undefined) return value;
  if (!sites.has(at.file)) sites.set(at.file, new Map());
  sites.get(at.file)!.set(at.site, replacement);
  return value;
});

// The call site the plugin is about to evaluate: builders that fail name it.
export function __at(file: string, site: number, offset: number): At {
  registry.tokens = 0;
  return (registry.at = { file, site, offset });
}

// True while the load has not recorded the site: the hoisted pass evaluates it then.
export const __unseen = (file: string, site: number): boolean =>
  !registry.sites.get(file)?.has(site);

// Ends a site: its value is recorded, or the failure is thrown into the module that is being evaluated.
export function __site(at: At, value: unknown): unknown {
  registry.at = undefined;
  const exit = Effect.runSyncExit(recordSite(at, value));
  if (Exit.isFailure(exit)) throw Cause.squash(exit.cause);
  return exit.value;
}
