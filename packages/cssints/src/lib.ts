// Shared by the runtime (eval time) and the plugin (build time).
//
// The builders here (`toDecls`, `chainDecl`) are the one synchronous part of the engine, with `isNode`: user code
// calls css.* in expressions and stores the results, so they cannot return Effects. They throw a MacroError.
import { createRequire } from "node:module";

import { properties } from "@cssints/css-grammar/mdn";
import { Cause, Effect, Exit } from "effect";

import { MacroError, MemberError } from "./errors.ts";
import { covers, relation } from "./leaves.ts";
import { type GlobalRule, type Kernel, type Plug, type Property, registry } from "./registry.ts";

/**
 * One condition of a style: an at-rule prelude (`@media (width >= 40rem)`), a pseudo-class (`:hover`), an attribute
 * (`[aria-current="page"]`) or, with `ancestor`, a selector of a marked ancestor (`:where(._g:hover)`).
 * `rank` orders the rules of a layer: the min-width of a media or container query in px, the place of a pseudo-class.
 */
export interface Cond {
  text: string;
  rank: number;
  ancestor?: true;
}
/**
 * One declaration: property and value, under the conditions that wrap it (outermost first). `fallbacks` are the other
 * values of a `firstThatWorks(...)`, best first: the rule prints them before `value`, which is the one wanted.
 */
export type Decl = [prop: string, value: string, conds?: Cond[], fallbacks?: string[]];
/** What firstThatWorks() builds: its values as text, the wanted one first. */
export interface Fallback {
  __fallback: string[];
}
export const isFallback = (v: unknown): v is Fallback =>
  !!v && typeof v === "object" && "__fallback" in v;
/**
 * What a css.* builder returns: its declarations, and next to them the fixed classes it prints (`markers`, each with
 * the key of the kernel it belongs to), the kernels it needs, and the plugin members whose runtime and conflicts apply
 * (`plugs`). `cn()` merges all three.
 */
export interface CssNode {
  __cssints: Decl[];
  markers?: [marker: string, kernel: string][];
  kernels?: Kernel[];
  globals?: GlobalRule[];
  plugs?: Plug[];
}
type Carry = Pick<CssNode, "markers" | "kernels" | "globals" | "plugs">;

// A style node. Chaining a method on it calls `chain(name, args, self)`, which makes the next node (flex() and grid(),
// a plugin's context). The target always has the three carried keys (undefined when empty): a missing one would read
// as a chain method.
export const node = (
  decls: Decl[],
  { markers, kernels, globals, plugs }: Carry = {},
  chain: (name: string, args: unknown[], self: CssNode) => CssNode = (name, args) =>
    node([chainDecl(undefined, name, args)]),
): CssNode =>
  new Proxy<CssNode>(
    { __cssints: decls, markers, kernels, globals, plugs },
    {
      get: (t, k) =>
        k in t || typeof k === "symbol"
          ? (t as unknown as Record<string | symbol, unknown>)[k]
          : (...args: unknown[]) => chain(k, args, t),
    },
  );

export const camel = (p: string) => p.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

// A builder error names the call site being evaluated (`__at` set it), when there is one.
export const fail = (message: string) => new MacroError({ message, ...registry.at });
// The same for what a plugin member does wrong.
export const failIn = (plugin: string, message: string) =>
  new MemberError({ message, pluginName: plugin, ...registry.at });

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

const SPACING = /^(padding|margin|inset|gap|row-gap|column-gap)(-|$)/;
export const isNode = (v: unknown): v is CssNode =>
  !!v && typeof v === "object" && Array.isArray((v as CssNode).__cssints);

// parts (strings, Typed OM values) are joined by a space; a lone number is the spacing scale in spacing properties
const decl = (prop: string, name: string, args: unknown[]): Decl => {
  if (!args.length) throw fail(`cssints: ${name}() expects a value`);
  if (args.some(isNode))
    throw fail(`cssints: ${name}() takes values, not styles; merge styles with cn(...) or cx(...)`);
  // A fallback inside several parts repeats the whole declaration with each of its values: one per declaration.
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
        if (!all.some((x) => x.key === g.key)) all.push(g);
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

// What cv() joins at runtime: the base and the values of each variant that are active. Under one condition, a
// variant's declaration that covers a base declaration (the same property, an alias, or a shorthand over it) replaces
// it: the base class is dropped while that value is active, so the variant wins whatever the sheet order. The result is
// the classes to drop, by variant and value. Two properties that overlap without containment, between the base and a
// variant or between variants of different keys (both can be active), are an error as in cn(); so is the same property
// in two keys, where nothing says which one wins. A longhand inside a shorthand is fine: the sheet puts it after.
export function settled(
  base: Decl[],
  variants: Record<string, Record<string, Decl[]>>,
): Record<string, Record<string, string>> {
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
  const out: Record<string, Record<string, string>> = {};
  const keys = Object.entries(variants);
  keys.forEach(([k, vs], i) => {
    for (const [n, decls] of Object.entries(vs)) {
      const gone: string[] = [];
      for (const d of decls) {
        for (const o of base) {
          const cls = hashClass(o);
          if (
            meet(o, d, `base and variant ${k}.${n}:`) !== "apart" &&
            covers(d[0], o[0]) &&
            cls !== hashClass(d) &&
            !gone.includes(cls)
          )
            gone.push(cls);
        }
        for (const [k2, vs2] of keys.slice(i + 1))
          for (const [n2, decls2] of Object.entries(vs2))
            for (const o of decls2)
              if (meet(d, o, `variants ${k}.${n} and ${k2}.${n2}:`) === "same")
                throw fail(
                  `cssints: cv() variants ${k}.${n} and ${k2}.${n2} both set ${o[0]}${under(d)} and can be active together, so nothing says which wins: set it in one of them, or in the base`,
                );
      }
      if (gone.length) (out[k] ??= {})[n] = gone.join(" ");
    }
  });
  return out;
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

// The texts a value is checked as. The recognizer reads text and knows no var(): a token (`var(--name)`, however a
// string came to hold it) is checked as literals of its type, one text per literal a type has (lengthPercentage: a
// length and a percentage). A var() of no token stays as it is.
export const VAR = /var\((--[\w-]+)\)/g;
export function probed(value: string, properties: Map<string, Property>): string[] {
  if (!value.includes("var(--")) return [value];
  const probesOf = (name: string) => properties.get(name)?.probes ?? [];
  let n = 1;
  for (const [, name] of value.matchAll(VAR)) n = Math.max(n, probesOf(name!).length);
  return Array.from({ length: n }, (_, i) =>
    value.replace(VAR, (m, name: string) => probesOf(name)[i] ?? probesOf(name)[0] ?? m),
  );
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
