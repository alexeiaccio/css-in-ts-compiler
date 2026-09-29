// Runs inside the Vite Module Runner. css.* builds declaration nodes; __site (injected by the
// plugin) turns a node into its replacement expression and records it per call site.
//
// The css.* builders are synchronous, since user code composes them in expressions and stores them in variables.
// Everything behind them is Effect: validation, class generation and the recording of a site (`recordSite`).
// `__at` and `__site` are the two calls the plugin puts around every site; they run inside user modules, so they
// are the synchronous edge where an Effect is run (`runSite`).
import { checkDeclaration, type DeclarationError } from "@cssints/css-grammar/check";
import { message } from "@cssints/css-grammar/support";
import { CSS, CSSColorValue, CSSStyleValue, CSSUnitValue } from "@cssints/css-grammar/values";
import { Cause, Effect, Exit } from "effect";

import { MacroError } from "./errors.ts";
import { chainDecl, CONTEXTS, hashClass, isNode, toDecls, type CssNode, type Decl } from "./lib.ts";
import { type At, registry, Registry } from "./registry.ts";

export { CSS, CSSColorValue, CSSUnitValue };

// A style: its declarations, and the layout context (flex / grid) whose container properties it chains.
const node = (decls: Decl[], ctx: string | undefined): CssNode =>
  new Proxy<CssNode>(
    { __cssints: decls },
    {
      get: (t, k) =>
        k in t || typeof k === "symbol"
          ? (t as unknown as Record<string | symbol, unknown>)[k]
          : (...args: unknown[]) => node([...decls, chainDecl(ctx, k, args)], ctx),
    },
  );

const member =
  (k: string) =>
  (...args: unknown[]) =>
    node(toDecls(k, args), CONTEXTS[k] ? k : undefined);

export const cn = member("cn");
export const flex = member("flex");
export const grid = member("grid");

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

const classesOf = Effect.fnUntraced(function* (decls: Decl[]): Effect.fn.Return<string, Invalid> {
  const { rules, warnings, warned } = yield* Registry;
  const out: string[] = [];
  for (const d of decls) {
    const cls = hashClass(d);
    // Fails at the bad token (the build-time twin of the type-level check) or at a prose rule. Support warnings
    // only for a class not seen yet: once per property and BCD feature per build, not once per value.
    const found = yield* checkDeclaration(d[0], d[1], !rules.has(cls));
    for (const w of found) {
      const k = `${d[0]} ${w.key}`;
      if (!warned.has(k)) {
        warned.add(k);
        warnings.push(yield* message(d[0], d[1], w));
      }
    }
    if (!out.includes(cls)) out.push(cls);
    // cond: the condition's sort key (min-width, pseudo-class order), [] until conditions land. plugin sorts.
    rules.set(cls, { layer: "_.a", cond: [], prop: d[0], css: `.${cls}{${d[0]}:${d[1]}}` });
  }
  return out.join(" ");
});

const styleOf = Effect.fnUntraced(function* (
  s: unknown,
  where: string,
): Effect.fn.Return<string, Invalid | MacroError> {
  if (!isNode(s))
    return yield* new MacroError({
      message: `cssints: cv() ${where} must be a css.* value (cn(...), a flex() chain or one property), got ${JSON.stringify(s)}. CSS strings are gone: write cn(p(4), fontSize("1rem"))`,
    });
  return yield* classesOf(s.__cssints);
});

// cv(config with css.* values) -> CvRuntimeConfig with class strings, consumed by _cv at runtime.
const cvOf = Effect.fnUntraced(function* (
  config: CvConfig,
): Effect.fn.Return<string, Invalid | MacroError> {
  const variants: Record<string, Record<string, string>> = {};
  const base = config.base === undefined ? "" : yield* styleOf(config.base, "base");
  for (const [k, vs] of Object.entries(config.variants ?? {})) {
    const classes: Record<string, string> = {};
    for (const [n, s] of Object.entries(vs)) classes[n] = yield* styleOf(s, `variant ${k}.${n}`);
    variants[k] = classes;
  }
  return JSON.stringify({ base, variants, defaultVariants: config.defaultVariants ?? {} });
});

export const cv = (config: CvConfig): CvNode => ({ __cv: config });

// Any name besides these (css.p, css.alignItems) is a property. Named imports of build-time members come from
// here too: the plugin rewrites them to destructure `css`, so the property list stays derived from the grammar.
const named: Record<string, unknown> = { cn, flex, grid, cv, CSS, CSSColorValue, CSSUnitValue };
export const css = new Proxy(named, {
  get: (t, k) => (Object.hasOwn(t, k) ? t[k as string] : member(String(k))),
});
named.css = css;

// The replacement expression of a site: class strings, the cv() config, or a Typed OM value's CSS text.
const replacementOf = Effect.fnUntraced(function* (
  at: At,
  value: unknown,
): Effect.fn.Return<string, Invalid | MacroError> {
  if (isNode(value)) return JSON.stringify(yield* classesOf(value.__cssints));
  if (isCv(value)) return yield* cvOf(value.__cv);
  // A Typed OM value (CSS.rem(1), new CSSColorValue(...)) ships as its CSS text; the objects are eval-time only.
  // oxlint-disable-next-line typescript/no-base-to-string -- every CSSStyleValue subclass overrides toString
  if (value instanceof CSSStyleValue) return JSON.stringify(String(value));
  return yield* new MacroError({
    message: `cssints: site ${at.site} in ${at.file} did not produce a css.*, cv() or Typed OM value`,
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
  if (!sites.has(at.file)) sites.set(at.file, new Map());
  sites.get(at.file)!.set(at.site, replacement);
  return value;
});

// The call site the plugin is about to evaluate: builders that fail name it.
export function __at(file: string, site: number, offset: number): At {
  return (registry.at = { file, site, offset });
}

// Ends a site: its value is recorded, or the failure is thrown into the module that is being evaluated.
export function __site(at: At, value: unknown): unknown {
  registry.at = undefined;
  const exit = Effect.runSyncExit(recordSite(at, value));
  if (Exit.isFailure(exit)) throw Cause.squash(exit.cause);
  return exit.value;
}
