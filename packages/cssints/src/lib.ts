// Shared by the runtime (eval time) and the plugin (build time).
export { camel, fail, failIn, isNode, node, probed, VAR } from "./node.ts";
export type { Carry, Cond, CssNode, Decl } from "./node.ts";
//
// The builders here (`toDecls`, `chainDecl`) are the one synchronous part of the engine, with `isNode`: user code
// calls css.* in expressions and stores the results, so they cannot return Effects. They throw a MacroError.
import { createRequire } from "node:module";

import { functions } from "@cssints/css-grammar/functions";
import { properties } from "@cssints/css-grammar/mdn";
import { Cause, Effect, Exit } from "effect";

import { MacroError } from "./errors.ts";
import { covers, relation } from "./leaves.ts";
import { camel, type Carry, type Cond, type CssNode, type Decl, fail, isNode } from "./node.ts";
import { registry } from "./registry.ts";

/** What firstThatWorks() builds: its values as text, the wanted one first. */
export interface Fallback {
  __fallback: string[];
}
export const isFallback = (v: unknown): v is Fallback =>
  !!v && typeof v === "object" && "__fallback" in v;
// Runs an Effect at a synchronous edge, a builder that user code calls in an expression: a failure is thrown as the error itself.
export const edge = <A>(program: Effect.Effect<A, MacroError>): A => {
  const exit = Effect.runSyncExit(program);
  if (Exit.isFailure(exit)) throw Cause.squash(exit.cause);
  return exit.value;
};

// member -> property: every grammar property as camelCase (`--*` is the custom property grammar, not a member),
// plus the short set.
export const PROPS: Record<string, string> = {
  ...Object.fromEntries(
    Object.keys(properties)
      .filter((p) => p !== "--*")
      .map((p) => [camel(p), p]),
  ),
  p: "padding",
  pt: "padding-top",
  pr: "padding-right",
  pb: "padding-bottom",
  pl: "padding-left",
  m: "margin",
  mt: "margin-top",
  mr: "margin-right",
  mb: "margin-bottom",
  ml: "margin-left",
  bg: "background-color",
};

// Layout contexts: flex() / grid() set display and chain only these container properties; the method name
// drops the context prefix (flex-direction -> direction). test/contexts.mjs checks them against mdn-data.
export const CONTEXTS: Record<string, string[]> = {
  flex: [
    "flex-direction",
    "flex-wrap",
    "flex-flow",
    "align-items",
    "align-content",
    "justify-content",
    "place-content",
    "gap",
    "row-gap",
    "column-gap",
  ],
  grid: [
    "grid-template-columns",
    "grid-template-rows",
    "grid-template-areas",
    "grid-template",
    "grid-auto-flow",
    "grid-auto-columns",
    "grid-auto-rows",
    "align-items",
    "justify-items",
    "place-items",
    "align-content",
    "justify-content",
    "place-content",
    "gap",
    "row-gap",
    "column-gap",
  ],
};

// Pseudo-class wrappers: every standard pseudo-class of the Selectors module without arguments, camelCased
// (`focus-visible` -> `focusVisible`); `default` is a reserved word. Pseudo-elements and functional pseudo-classes
// (`:nth-child()`) are not wrappers. The order of the rules in a layer is this list: the classic link, visited, hover,
// focus, active first (a later one wins at equal specificity), the rest as mdn-data lists them.
const SELECTORS = createRequire(import.meta.url)("mdn-data/css/selectors.json") as Record<
  string,
  { status: string; groups: string[] } | undefined
>;
const FIRST = [
  "link",
  "visited",
  "any-link",
  "focus-within",
  "hover",
  "focus",
  "focus-visible",
  "active",
];
const pseudoNames = Object.entries(SELECTORS)
  .filter(
    ([k, v]) => /^:[a-z-]+$/.test(k) && v?.status === "standard" && v.groups.includes("Selectors"),
  )
  .map(([k]) => k.slice(1))
  .filter((n) => n !== "default");
export const PSEUDOS: Record<string, Cond> = Object.fromEntries(
  [...FIRST, ...pseudoNames.filter((n) => !FIRST.includes(n))].map((n, i) => [
    camel(n),
    { text: `:${n}`, rank: i },
  ]),
);

// Not properties of `css`: the builders macro.ts defines itself.
export const BUILDERS = new Set([
  "cn",
  "firstThatWorks",
  "keyframes",
  "flex",
  "grid",
  "cv",
  "media",
  "container",
  "supports",
  "attr",
  "group",
  "within",
  "global",
  "layers",
  "token",
  "style",
  "createTokens",
  "createGlobalTheme",
  "check",
]);
// Every css function is a member, camelCased (`color-mix` is colorMix); one named like a property, a pseudo-class or a
// builder gets `Fn` after it (`colorFn`, `attrFn`, `translateFn`): the property or the condition keeps its name.
export const FUNCTIONS: Record<string, string> = Object.fromEntries(
  Object.keys(functions).map((f) => {
    const n = camel(f);
    return [n in PROPS || n in PSEUDOS || BUILDERS.has(n) ? `${n}Fn` : n, f];
  }),
);

// A style has at most this many conditions: layers _.a (none) to _.e.
export const MAX_CONDS = 4;
export const LAYER = ["_.a", "_.b", "_.c", "_.d", "_.e"];

// The width a media or container query starts at, in px, for ordering its rules (narrow first, so the wider one wins).
// 0 when we cannot read one (a list, `or`, `not`, other units): those keep the order of their text.
export function minWidth(q: string): number {
  if (/,|\b(or|not)\b/.test(q)) return 0;
  let w = 0;
  for (const [, n, u] of q.matchAll(/\(\s*(?:min-)?width\s*(?::|>=?)\s*([\d.]+)(px|rem|em)\s*\)/g))
    w = Math.max(w, Number(n) * (u === "px" ? 1 : 16));
  return w;
}

// A `var(--name)` written as text (the token itself is what a part should be). One of a declared token is a build warning
// that names the token to pass; one of no token (a typo), an error. `--_x` is a scope's own custom property.
const RAW_VAR = /var\(\s*(--[\w-]+)/g;
export function checkVars(where: string, text: string): void {
  if (!text.includes("var(")) return;
  const { properties, defs, warned, warnings } = registry;
  for (const [, name] of text.matchAll(RAW_VAR)) {
    if (name!.startsWith("--_")) continue;
    if (!properties.has(name!))
      throw fail(
        `cssints: ${where}: var(${name}) is no declared token (a typo?): declare it with createTokens() or token.<type>(initial, "${name!.slice(2)}") and pass the token`,
      );
    const path = defs.get(name!)?.path;
    const key = `var ${where} ${name}`;
    if (warned.has(key)) continue;
    warned.add(key);
    warnings.push(
      `${where}: "var(${name})" is the token ${path === name ? `declared as ${name}` : path}: pass the token itself, and css.var(token, fallback) for a fallback`,
    );
  }
}

const SPACING = /^(padding|margin|inset|gap|row-gap|column-gap)(-|$)/;
// parts (strings, Typed OM values) are joined by a space; a lone number is the spacing scale in spacing properties
const decl = (prop: string, name: string, args: unknown[]): Decl => {
  if (!args.length) throw fail(`cssints: ${name}() expects a value`);
  if (args.some(isNode))
    throw fail(`cssints: ${name}() takes values, not styles; merge styles with cn(...) or cx(...)`);
  // A fallback inside several parts repeats the whole declaration with each of its values: one per declaration.
  for (const a of args) if (typeof a === "string") checkVars(name, a);
  const [fb, extra] = args.filter(isFallback);
  if (extra) throw fail(`cssints: ${name}() takes one firstThatWorks(...) per declaration`);
  if (fb) {
    const text = (v: string) => args.map((a) => (a === fb ? v : a)).join(" ");
    const [wanted, ...rest] = fb.__fallback;
    return [prop, text(wanted!), undefined, rest.map(text)];
  }
  const [only] = args;
  return [
    prop,
    args.length === 1 && typeof only === "number" && SPACING.test(prop)
      ? `${only * 0.25}rem`
      : args.join(" "),
  ];
};

// The markers and kernels of several nodes, each once (a kernel by identity: members share one by pointing at it; the
// same key with another css is caught when the sheet registers it). Plain code: cn() and every condition call it.
export function carried(nodes: CssNode[]): Carry {
  const out: Carry = {};
  for (const n of nodes) {
    if (n.markers)
      for (const m of n.markers) {
        const all = (out.markers ??= []);
        if (!all.some((x) => x[0] === m[0] && x[1] === m[1])) all.push(m);
      }
    if (n.kernels)
      for (const k of n.kernels) {
        const all = (out.kernels ??= []);
        if (!all.includes(k)) all.push(k);
      }
    if (n.globals)
      for (const g of n.globals) {
        const all = (out.globals ??= []);
        if (!all.includes(g)) all.push(g);
      }
    if (n.themes)
      for (const t of n.themes) {
        const all = (out.themes ??= []);
        if (!all.includes(t)) all.push(t);
      }
    if (n.layers)
      for (const l of n.layers) {
        const all = (out.layers ??= []);
        if (!all.some((x) => x.join() === l.join())) all.push(l);
      }
    if (n.plugs)
      for (const p of n.plugs) {
        const all = (out.plugs ??= []);
        if (!all.includes(p)) all.push(p);
      }
  }
  return out;
}

// The declarations of one class string, as the author meant them: under one condition, a property set again replaces the
// earlier one (cn(p(4), p(2)) is p(2)), and two properties that overlap without one containing the other are an error,
// since the sheet cannot order them by the arguments. A longhand inside a shorthand is fine: the sheet puts it after.
export function merged(decls: Decl[]): Decl[] {
  const out: Decl[] = [];
  const at = (d: Decl) => (d[2] ?? []).map((c) => c.text).join(" > ");
  for (const d of decls) {
    const where = at(d);
    for (let i = out.length - 1; i >= 0; i--) {
      const o = out[i]!;
      if (at(o) !== where) continue;
      const r = relation(o[0], d[0]);
      if (r === "same") out.splice(i, 1);
      else if (r === "overlap")
        throw fail(
          `cssints: ${o[0]} and ${d[0]} overlap without one containing the other${where ? ` (under ${where})` : ""}, so the sheet cannot order them by the arguments: set one of them, or the longhands`,
        );
    }
    out.push(d);
  }
  return out;
}

// What cv() joins at runtime: the base, the values of each variant that are active, and the compound variants whose
// values are all active. Under one condition, a declaration that covers another (the same property, an alias, or a
// shorthand over it) replaces it when it is active: a variant replaces the base, a compound replaces the base and the
// variants it combines. The replaced class is dropped, so the winner wins whatever the sheet order. The result is the
// classes to drop, by variant and value, and per compound. Two properties that overlap without containment, between
// the base and a variant or between things that can be active together (variants of different keys, a compound and a
// variant of another key, two compounds that share no key with different values), are an error as in cn(); so is the
// same property in two of them, where nothing says which one wins. A longhand inside a shorthand is fine: the sheet puts
// it after.
export function settled(
  base: Decl[],
  variants: Record<string, Record<string, Decl[]>>,
  compounds: { when: Record<string, string>; decls: Decl[] }[] = [],
) {
  const at = (d: Decl) => (d[2] ?? []).map((c) => c.text).join(" > ");
  const under = (d: Decl) => (at(d) ? ` (under ${at(d)})` : "");
  const meet = (o: Decl, d: Decl, who: string) => {
    if (at(o) !== at(d)) return "apart";
    const r = relation(o[0], d[0]);
    if (r === "overlap")
      throw fail(
        `cssints: cv() ${who} ${o[0]} and ${d[0]} overlap without one containing the other${under(d)}, so the sheet cannot order them: set one of them, or the longhands`,
      );
    return r;
  };
  // the classes of `olds` that `d` replaces, added to `gone`
  const replace = (olds: Decl[], d: Decl, who: string, gone: string[]) => {
    for (const o of olds) {
      const cls = hashClass(o);
      if (
        meet(o, d, who) !== "apart" &&
        covers(d[0], o[0]) &&
        cls !== hashClass(d) &&
        !gone.includes(cls)
      )
        gone.push(cls);
    }
  };
  // two things that can be active together must not set the same property
  const together = (o: Decl[], d: Decl, a: string, b: string) => {
    for (const x of o)
      if (meet(d, x, `${a} and ${b}:`) === "same")
        throw fail(
          `cssints: cv() ${a} and ${b} both set ${x[0]}${under(d)} and can be active together, so nothing says which wins: set it in one of them, or in the base`,
        );
  };
  const out: Record<string, Record<string, string>> = {};
  const keys = Object.entries(variants);
  keys.forEach(([k, vs], i) => {
    for (const [n, decls] of Object.entries(vs)) {
      const gone: string[] = [];
      for (const d of decls) {
        replace(base, d, `base and variant ${k}.${n}:`, gone);
        for (const [k2, vs2] of keys.slice(i + 1))
          for (const [n2, decls2] of Object.entries(vs2))
            together(decls2, d, `variants ${k}.${n}`, `${k2}.${n2}`);
      }
      if (gone.length) (out[k] ??= {})[n] = gone.join(" ");
    }
  });
  const compound = compounds.map(({ when, decls }, j) => {
    const gone: string[] = [];
    const me = `compoundVariants[${j}]`;
    for (const d of decls) {
      replace(base, d, `base and ${me}:`, gone);
      for (const [k, vs] of keys)
        for (const [n, vdecls] of Object.entries(vs)) {
          if (!(k in when)) together(vdecls, d, me, `variant ${k}.${n}`);
          else if (when[k] === n) replace(vdecls, d, `variant ${k}.${n} and ${me}:`, gone);
        }
      compounds.slice(j + 1).forEach((c, i) => {
        if (Object.keys(when).every((k) => !(k in c.when) || c.when[k] === when[k]))
          together(c.decls, d, me, `compoundVariants[${j + 1 + i}]`);
      });
    }
    return gone.join(" ");
  });
  return { drops: out, compound };
}

export function toDecls(member: string, args: unknown[]): Decl[] {
  if (member === "cn") {
    if (!args.every(isNode))
      throw fail(
        `cssints: cn() takes css.* values only, got ${JSON.stringify(args.filter((a) => !isNode(a)))}`,
      );
    return merged(args.flatMap((n) => n.__cssints));
  }
  // flex(...parts) is the `flex` property, flex() the context. SPACING does not match `flex` or `grid`: a number is a <number>.
  if (CONTEXTS[member]) return [args.length ? decl(member, member, args) : ["display", member]];
  const prop = PROPS[member];
  if (!prop) throw fail(`cssints: unknown css.${member}`);
  return [decl(prop, member, args)];
}

export const chainNames = (ctx: string) =>
  CONTEXTS[ctx]!.map((p) => camel(p.startsWith(`${ctx}-`) ? p.slice(ctx.length + 1) : p));

// .method(...) on a style: only container properties of flex() / grid(); plain styles do not chain.
export function chainDecl(ctx: string | undefined, method: string, args: unknown[]): Decl {
  if (!ctx)
    throw fail(
      `cssints: plain styles do not chain (.${method}); merge them with cn(...) or cx(...)`,
    );
  const i = chainNames(ctx).indexOf(method);
  if (i < 0)
    throw fail(`cssints: ${ctx}() has no .${method}(); it chains ${chainNames(ctx).join(", ")}`);
  return decl(CONTEXTS[ctx]![i]!, method, args);
}

// The class name of a declaration. Plain code: a tight loop over the characters of every declaration, called
// inside the `classesOf` boundary (macro.ts).
// ponytail: djb2, 32-bit; swap for xxhash if collisions ever show up.
export function hashClass([p, v, conds, fallbacks]: Decl): string {
  let h = 5381;
  let text = conds ? `${conds.map((c) => c.text).join(">")}|${p}:${v}` : `${p}:${v}`;
  if (fallbacks) text += `|${fallbacks.join("|")}`;
  for (const c of text) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return "_" + (h >>> 0).toString(36);
}
