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
  checkSelector,
  type DeclarationError,
  isDeclarationError,
} from "@cssints/css-grammar/check";
import type { QueryKind } from "@cssints/css-grammar/query";
import { messageOf, type Warning } from "@cssints/css-grammar/support";
import { CSS, CSSColorValue, CSSStyleValue, CSSUnitValue } from "@cssints/css-grammar/values";
import { Cause, Effect, Exit } from "effect";
import { createHash } from "node:crypto";

import { MacroError, MemberError } from "./errors.ts";
import {
  camel,
  carried,
  merged,
  chainDecl,
  CONTEXTS,
  fail,
  hashClass,
  isFallback,
  isNode,
  LAYER,
  MAX_CONDS,
  minWidth,
  node,
  probed,
  PSEUDOS,
  settled,
  toDecls,
  VAR,
  type Cond,
  type CssNode,
  type Decl,
  type Fallback,
} from "./lib.ts";
import { addRuntime } from "./delivery.ts";
import { clamp, colorMix, max, min } from "./functions.ts";
import { addKernel } from "./kernel.ts";
import {
  type At,
  forgetKernels,
  GLOBAL,
  type Kernel,
  registry,
  Registry,
  type RegistryState,
  type Plug,
  type Rule,
} from "./registry.ts";
import { _cv as runtimeCv, type CvRuntimeConfig } from "./runtime.ts";
import { check, createGlobalTheme, createTokens, DONE, isDone, tokensOf } from "./theme.ts";
import { isStyle, style, token, type StyleNode } from "./token.ts";

export { CSS, CSSColorValue, CSSUnitValue };

// A style's chain: flex() and grid() chain the container properties of their context.
const flexChain =
  (ctx: string) =>
  (name: string, args: unknown[], self: CssNode): CssNode =>
    node([...self.__cssints, chainDecl(ctx, name, args)], self, flexChain(ctx));

const member =
  (k: string) =>
  (...args: unknown[]) =>
    CONTEXTS[k] && !args.length
      ? node(toDecls(k, args), {}, flexChain(k))
      : node(toDecls(k, args), { kernels: kernelsOf(args) });

// firstThatWorks(wanted, ...fallbacks): one part of a property that is several values; the build prints them all in one
// class. Typed OM values (tokens) become their text.
export const firstThatWorks = (...values: unknown[]): Fallback => {
  if (values.length < 2)
    throw fail(
      "cssints: firstThatWorks() takes at least two values: the one you want, then what to use where it fails",
    );
  for (const v of values) {
    if (v instanceof CSSAtRuleValue)
      throw fail(
        `cssints: firstThatWorks() cannot hold ${v.name}: a keyframes() or positionTry() name carries its at-rule, which a fallback would drop`,
      );
    if ((typeof v !== "string" || !v.trim()) && !(v instanceof CSSStyleValue))
      throw fail(
        `cssints: firstThatWorks() takes non-empty strings and Typed OM values (tokens), got ${JSON.stringify(v)}`,
      );
  }
  // oxlint-disable-next-line typescript/no-base-to-string -- strings and CSSStyleValues, which override toString
  return { __fallback: values.map((v) => String(v).trim()) };
};

// A local at-rule (keyframes(), positionTry()): the name that goes where the grammar wants one, and the kernel that
// defines it. A style that holds the value carries the kernel (`member`), so the rule is in the sheet of the modules
// that use it and nowhere else.
export class CSSAtRuleValue extends CSSStyleValue {
  readonly kernel: Kernel;
  readonly name: string;
  constructor(name: string, kernel: Kernel) {
    super();
    this.name = name;
    this.kernel = kernel;
  }
  override toString() {
    return this.name;
  }
}

const kernelsOf = (args: unknown[]): CssNode["kernels"] => {
  let out: Kernel[] | undefined;
  for (const a of args) if (a instanceof CSSAtRuleValue) (out ??= []).push(a.kernel);
  return out;
};

// What @position-try accepts (css-anchor-position-1 §6.4): inset, margin and sizing properties, self-alignment,
// position-anchor and position-area.
const POSITION_TRY =
  /^(?:top|right|bottom|left|inset(?:-(?:block|inline)(?:-(?:start|end))?)?|margin(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?|(?:min-|max-)?(?:width|height|block-size|inline-size)|align-self|justify-self|place-self|position-anchor|position-area)$/;
const STEP = /^(?:from|to|\d+(?:\.\d+)?%)$/;

// The declarations of a block, checked like a class's (grammar, prose rules, support), as `prop:value;...`. A block is
// a style of member calls, plain declarations only.
const blockOf = (what: string, style: unknown, allowed?: RegExp): string => {
  if (!isNode(style) || !style.__cssints.length)
    throw fail(
      `cssints: ${what} takes css.* declarations (a member call or cn(...)), got ${JSON.stringify(style)}`,
    );
  if (style.markers || style.kernels || style.plugs)
    throw fail(`cssints: ${what} takes plain declarations: no marker class or kernel of a member`);
  return style.__cssints
    .map((d) => {
      const [prop, value, conds, fallbacks] = d;
      if (conds?.length || fallbacks)
        throw fail(
          `cssints: ${what} takes declarations without conditions or firstThatWorks(...), got ${prop}`,
        );
      if (allowed && !allowed.test(prop))
        throw fail(
          `cssints: ${what}: ${prop} is not allowed in @position-try, which takes inset, margin, sizing and self-alignment properties, position-anchor and position-area`,
        );
      try {
        checkNow(d, true, registry);
      } catch (e) {
        if (isDeclarationError(e))
          throw new MacroError({
            message: `cssints: ${what}: ${e.message}`,
            cause: e,
            ...registry.at,
          });
        throw e;
      }
      return `${prop}:${value}`;
    })
    .join(";");
};

// The name is a short hash of the content, so identical blocks are one name and one kernel. A kernel key that starts
// with `@` is an at-rule of local names: a custom property in its steps is a use, not a declaration (kernel.ts).
const atRule = (rule: string, prefix: string, body: string) => {
  const name = `${prefix}${createHash("sha1").update(body).digest("hex").slice(0, 8)}`;
  return new CSSAtRuleValue(name, {
    key: `@${rule} ${name}`,
    css: `@${rule} ${name}{${body}}`,
    requires: [`css.at-rules.${rule}`],
  });
};

// keyframes({ from: opacity(0), "50%": ..., to: ... }): the name of a `@keyframes` rule, for animation and animationName.
export const keyframes = (steps: unknown): CSSAtRuleValue => {
  const entries = typeof steps === "object" && steps !== null ? Object.entries(steps) : [];
  if (!entries.length)
    throw fail("cssints: keyframes() takes { from: style, to: style }: the steps are css.* styles");
  const body = entries.map(([step, style]) => {
    if (!STEP.test(step) || parseFloat(step) > 100)
      throw fail(
        `cssints: keyframes() step "${step}" is not from, to or a percentage from 0% to 100%`,
      );
    return `${step}{${blockOf(`keyframes() "${step}"`, style)}}`;
  });
  return atRule("keyframes", "kf-", body.join(""));
};

// `position-try` is a property too: value parts are that shorthand, one style is the rule (a style is no value of a property).
const positionTryProp = member("positionTry");
// positionTry(style): the dashed name of a `@position-try` rule, for positionTryFallbacks.
export const positionTry = (...args: unknown[]) =>
  args.length === 1 && isNode(args[0])
    ? atRule("position-try", "--pt-", blockOf("positionTry()", args[0], POSITION_TRY))
    : positionTryProp(...args);

export const cn = (...args: unknown[]) => {
  const decls = toDecls("cn", args);
  return node(decls, carried(args as CssNode[]));
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
        merged(
          styles.flatMap((n) =>
            n.__cssints.map(([p, v, inner = [], fallbacks]): Decl => {
              if (inner.length >= MAX_CONDS)
                throw fail(
                  `cssints: a style takes at most ${MAX_CONDS} conditions (layers ${LAYER[0]} to ${LAYER[MAX_CONDS]}); this one has ${inner.length + 1}: ${[cond, ...inner].map((c) => c.text).join(" > ")}`,
                );
              return [p, v, [cond, ...inner], fallbacks];
            }),
          ),
        ),
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

const NAME = /^-?[A-Za-z_][\w-]*$/;
const OPS = ["=", "~=", "|=", "^=", "$=", "*="];

// attr(name, value?, op?): the attribute of the element. The value is always quoted; no value is presence. It sorts
// after the pseudo-classes, so `attr("aria-current", "page")` beats `hover` in a layer.
const attr = (...args: unknown[]) => {
  const [name, value, given] = args;
  const op = typeof given === "string" ? given : "=";
  if (
    args.length > 3 ||
    typeof name !== "string" ||
    !NAME.test(name) ||
    (value !== undefined && typeof value !== "string") ||
    !OPS.includes(op) ||
    (given !== undefined && (typeof given !== "string" || value === undefined))
  )
    throw fail(
      `cssints: attr(name, value?, op?) takes an attribute name, then a string value and one of ${OPS.join(" ")}, got ${JSON.stringify(args)}`,
    );
  const quoted = value?.replace(/["\\]/g, "\\$&").replace(/\n/g, "\\a ");
  return wrapper({
    text: `[${name}${quoted === undefined ? "" : `${op}"${quoted}"`}]`,
    rank: 1000,
  });
};

// The marker of an ancestor: group() is `_g`, group("row") is `_g-row`. It has no rule of its own.
const markerOf = (what: string, name: unknown) => {
  if (name !== undefined && (typeof name !== "string" || !NAME.test(name)))
    throw fail(`cssints: ${what} takes a name such as "row", got ${JSON.stringify(name)}`);
  return name === undefined ? "_g" : `_g-${name}`;
};
const group = (name?: unknown) => node([], { markers: [[markerOf("group()", name), "group"]] });

// within(hover, "row"): the state of a marked ancestor, `:where(._g-row:hover) ._x`. :where() keeps the specificity of
// one class, so the sheet's order decides, as for every condition; the ancestor's state sorts before the element's own.
const within = (state?: unknown, name?: unknown) => {
  if (!isWrapper(state) || state.cond.ancestor || !/^[:[]/.test(state.cond.text))
    throw fail(
      "cssints: within() takes a pseudo-class wrapper (hover) or attr(...), then the name of the group",
    );
  return wrapper({
    text: `:where(.${markerOf("within()", name)}${state.cond.text})`,
    rank: state.cond.rank - 2000,
    ancestor: true,
  });
};

// global(selector, ...styles): a rule with no class, in the sheet of the module that calls it (layer _.k, after the
// kernels and before the themes). The declarations are merged like cn(), the later of one property wins. Conditions
// that wrap the rule (media, container, supports) are allowed; a state belongs in the selector.
const globalRule = (selector?: unknown, ...styles: unknown[]) => {
  const at = registry.at;
  if (!at || typeof selector !== "string")
    throw fail("cssints: global(selector, ...styles) takes a selector string and css.* styles");
  const exit = Effect.runSyncExit(checkSelector(selector));
  if (Exit.isFailure(exit)) {
    const e = Cause.squash(exit.cause) as Error;
    throw new MacroError({ message: `cssints: global(): ${e.message}`, cause: e, ...at });
  }
  if (!styles.length || !styles.every(isNode))
    throw fail(
      `cssints: global() takes css.* styles after the selector, got ${JSON.stringify(styles.filter((s) => !isNode(s)))}`,
    );
  if (styles.some((s) => s.markers || s.kernels || s.plugs))
    throw fail("cssints: global() takes plain declarations: no marker class or kernel of a member");
  const blocks = new Map<string, { conds: Cond[]; body: string[] }>();
  for (const d of merged(styles.flatMap((s) => s.__cssints))) {
    const [prop, value, conds = [], fallbacks] = d;
    const state = conds.find((c) => !c.text.startsWith("@"));
    if (state)
      throw fail(
        `cssints: global() takes media(), container() and supports() conditions, not ${state.text}: write the state in the selector`,
      );
    try {
      checkNow(d, true, registry);
    } catch (e) {
      throw isDeclarationError(e) ? located(at)(e) : e;
    }
    const key = conds.map((c) => c.text).join("{");
    const block = blocks.get(key) ?? blocks.set(key, { conds, body: [] }).get(key)!;
    for (const v of fallbacks ? [...fallbacks.toReversed(), value] : [value])
      block.body.push(`${prop}:${v}`);
  }
  const css = [...blocks.values()]
    .map(({ conds, body }) =>
      conds
        .toReversed()
        .reduce((r, c) => `${c.text}{${r}}`, `${selector.trim()}{${body.join(";")}}`),
    )
    .join("")
    .replace(/[\t\n\r\f]/g, " "); // an entry of the sheet is one line, split at tabs
  const n = registry.tokens++;
  registry.themed.set(`${at.file}#${at.site}.${n}`, {
    file: at.file,
    key: `${GLOBAL}${at.file}#${String(at.site).padStart(6, "0")}.${n}`,
    css,
    names: [],
  });
  return DONE;
};

const conditions = {
  media: condition("media"),
  container: condition("container"),
  supports: condition("supports"),
  attr,
  within,
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
const located = (at: At) => (e: Invalid | MacroError | MemberError) =>
  "file" in e && e.file !== undefined
    ? e
    : "pluginName" in e
      ? new MemberError({ message: e.message, pluginName: e.pluginName, cause: e, ...at })
      : new MacroError({ message: e.message, cause: e, ...at });

// The rule of one declaration: its layer is the number of its conditions; pseudo-classes join the selector, the
// others wrap the rule; `cond` orders the rules of a layer (min-width, then pseudo-class places).
// A `firstThatWorks` prints its values in CSS order: the last fallback first, the wanted value last.
const ruleOf = (cls: string, [prop, value, conds = [], fallbacks]: Decl): Rule => {
  const wrap: string[] = [];
  const ranks: number[] = [];
  let before = "";
  let pseudo = "";
  let width = 0;
  for (const c of conds)
    if (c.text.startsWith("@")) {
      wrap.push(c.text);
      width = Math.max(width, c.rank);
    } else {
      if (c.ancestor) before += `${c.text} `;
      else pseudo += c.text;
      ranks.push(c.rank);
    }
  const all = fallbacks ? `${value};${fallbacks.join(";")}` : value;
  const tokens = all.includes("var(--") ? [...all.matchAll(VAR)].map((m) => m[1]!) : undefined;
  return {
    layer: LAYER[conds.length]!,
    cond: conds.length ? [width, ...ranks] : [],
    wrap,
    prop,
    css: `${before}.${cls}${pseudo}{${fallbacks ? [...fallbacks.toReversed(), value].map((v) => `${prop}:${v}`).join(";") : `${prop}:${value}`}}`,
    tokens,
  };
};

// One declaration against the grammar, the prose rules and, once per class, browser support. Throws at the bad token (the
// build-time twin of the type-level check) or at a prose rule. Support warnings are recorded once per property and BCD
// feature per build, not once per value. A token in the value is checked as the literals of its type (`probed`).
const checkValue = (
  prop: string,
  value: string,
  fresh: boolean,
  properties: RegistryState["properties"],
) => {
  let out: Warning[] = [];
  for (const v of probed(value, properties)) {
    try {
      const found = checkDeclarationNow(prop, v, fresh);
      out = out.length ? out.concat(found) : found;
    } catch (e) {
      if (v !== value && isDeclarationError(e))
        Object.assign(e, {
          message: `${e.message} ("${value}" is checked as "${v}": a token stands for a value of its type)`,
        });
      throw e;
    }
  }
  return out;
};

// The wanted value warns for the targets that lack it; with fallbacks, only for those that lack every value too, and the
// key of the warning holds them, so a plain declaration of the same feature still warns for all of its targets.
const checkNow = (
  [prop, value, , fallbacks]: Decl,
  fresh: boolean,
  { warnings, warned, properties, userProps }: RegistryState,
) => {
  if (userProps.has(prop)) return; // a property() member checked its value against its own grammar
  let found = checkValue(prop, value, fresh, properties);
  if (fallbacks) {
    const lacking = [value, ...fallbacks].map(
      (v, i) =>
        new Set((i ? checkValue(prop, v, fresh, properties) : found).flatMap((w) => w.lacking)),
    );
    found = found
      .map((w) => ({ ...w, lacking: w.lacking.filter((t) => lacking.every((s) => s.has(t))) }))
      .filter((w) => w.lacking.length);
  }
  for (const w of found) {
    const k = `${prop} ${w.key}${fallbacks ? ` ${w.lacking.join()}` : ""}`;
    if (!warned.has(k)) {
      warned.add(k);
      warnings.push(
        messageOf(prop, value, w) +
          (fallbacks ? ", and no fallback of its firstThatWorks covers them" : ""),
      );
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

// A plugin's conflicts: its marker with one of the listed properties in one style.
const conflictOf = ({ name, conflicts }: Plug, decls: Decl[], at?: At): MemberError | undefined => {
  const hit =
    conflicts &&
    decls.find(([p]) => conflicts.props.some((c) => (typeof c === "string" ? c === p : c.test(p))));
  return hit
    ? new MemberError({
        message: `cssints: ${name}: ${conflicts.message} (this style also sets ${hit[0]})`,
        pluginName: name,
        ...at,
      })
    : undefined;
};

const classesOf = Effect.fnUntraced(function* (
  { __cssints: decls, markers, kernels, plugs }: CssNode,
  at?: At,
): Effect.fn.Return<string, Invalid | MacroError | MemberError> {
  const registry = yield* Registry;
  if (kernels) for (const k of kernels) yield* addKernel(k, markers ?? [], at);
  if (plugs)
    for (const plug of plugs) {
      const conflict = conflictOf(plug, decls, at);
      if (conflict) return yield* conflict;
      if (plug.runtime) yield* addRuntime(plug, at);
    }
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
): Effect.fn.Return<string, Invalid | MacroError | MemberError> {
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
): Effect.fn.Return<string, Invalid | MacroError | MemberError> {
  const variants: Record<string, Record<string, string>> = {};
  const base = config.base === undefined ? "" : yield* styleOf(config.base, "base", at);
  for (const [k, vs] of Object.entries(config.variants ?? {})) {
    const classes: Record<string, string> = {};
    for (const [n, s] of Object.entries(vs))
      classes[n] = yield* styleOf(s, `variant ${k}.${n}`, at);
    variants[k] = classes;
  }
  // every value is a node now (styleOf checked)
  const declsOf = (s: unknown) => (s as CssNode).__cssints;
  const drops = yield* Effect.try({
    try: () =>
      settled(
        config.base === undefined ? [] : declsOf(config.base),
        Object.fromEntries(
          Object.entries(config.variants ?? {}).map(([k, vs]) => [
            k,
            Object.fromEntries(Object.entries(vs).map(([n, s]) => [n, declsOf(s)])),
          ]),
        ),
      ),
    catch: (e) => {
      if (e instanceof MacroError) return e;
      throw e; // a bug, not a user error: a defect
    },
  });
  return JSON.stringify({
    base,
    variants,
    defaultVariants: config.defaultVariants ?? {},
    ...(Object.keys(drops).length && { drops }),
  });
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
  firstThatWorks,
  colorMix,
  min,
  max,
  clamp,
  keyframes,
  positionTry,
  flex,
  grid,
  cv,
  group,
  global: globalRule,
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
  if (isWrapper(v) || isFallback(v)) return "null";
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
): Effect.fn.Return<string | undefined, Invalid | MacroError | MemberError> {
  if (isNode(value)) return JSON.stringify(yield* classesOf(value, at));
  if (isCv(value)) return yield* cvOf(value.__cv, at);
  if (isStyle(value)) return yield* inlineOf(value);
  const tokens = tokensOf(value);
  if (tokens !== undefined) return tokens;
  if (isDone(value)) return "undefined";
  // A Typed OM value (CSS.rem(1), new CSSColorValue(...)) ships as its CSS text; the objects are eval-time only.
  // oxlint-disable-next-line typescript/no-base-to-string -- every CSSStyleValue subclass overrides toString
  if (value instanceof CSSStyleValue) return JSON.stringify(String(value));
  if (typeof value === "string") return JSON.stringify(value); // an fn() that computes text
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
): Effect.fn.Return<unknown, MacroError | MemberError> {
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
  // The first site of a module in this evaluation: what it registered in an earlier one is stale (a helper module that
  // an edit changed would otherwise collide with its own old kernel).
  if (registry.seen.get(file) !== registry.gen) {
    registry.seen.set(file, registry.gen);
    forgetKernels(file);
  }
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
