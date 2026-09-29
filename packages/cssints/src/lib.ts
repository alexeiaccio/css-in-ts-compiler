// Shared by the runtime (eval time) and the plugin (build time).
//
// The builders here (`toDecls`, `chainDecl`) are the one synchronous part of the engine, with `isNode`: user code
// calls css.* in expressions and stores the results, so they cannot return Effects. They throw a MacroError.
import { createRequire } from "node:module";

import { properties } from "@cssints/css-grammar/mdn";
import { Cause, Effect, Exit } from "effect";

import { MacroError } from "./errors.ts";
import { type Property, registry } from "./registry.ts";

/**
 * One condition of a style: an at-rule prelude (`@media (width >= 40rem)`) or a pseudo-class (`:hover`).
 * `rank` orders the rules of a layer: the min-width of a media or container query in px, the place of a pseudo-class.
 */
export interface Cond {
  text: string;
  rank: number;
}
/** One declaration: property and value, under the conditions that wrap it (outermost first). */
export type Decl = [prop: string, value: string, conds?: Cond[]];
/** What a css.* builder returns: its declarations. */
export interface CssNode {
  __cssints: Decl[];
}

export const camel = (p: string) => p.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

// A builder error names the call site being evaluated (`__at` set it), when there is one.
export const fail = (message: string) => new MacroError({ message, ...registry.at });

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
  const [only] = args;
  return [
    prop,
    args.length === 1 && typeof only === "number" && SPACING.test(prop)
      ? `${only * 0.25}rem`
      : args.join(" "),
  ];
};

export function toDecls(member: string, args: unknown[]): Decl[] {
  if (member === "cn") {
    if (!args.every(isNode))
      throw fail(
        `cssints: cn() takes css.* values only, got ${JSON.stringify(args.filter((a) => !isNode(a)))}`,
      );
    return args.flatMap((n) => n.__cssints);
  }
  if (CONTEXTS[member]) {
    if (args.length)
      throw fail(
        `cssints: ${member}() takes no arguments; chain its container properties: ${member}().${chainNames(member)[0]}(...)`,
      );
    return [["display", member]];
  }
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
export function hashClass([p, v, conds]: Decl): string {
  let h = 5381;
  const text = conds ? `${conds.map((c) => c.text).join(">")}|${p}:${v}` : `${p}:${v}`;
  for (const c of text) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return "_" + (h >>> 0).toString(36);
}
