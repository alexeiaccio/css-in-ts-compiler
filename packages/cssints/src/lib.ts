// Shared by the runtime (eval time) and the plugin (build time).
//
// The builders here (`toDecls`, `chainDecl`) are the one synchronous part of the engine, with `isNode`: user code
// calls css.* in expressions and stores the results, so they cannot return Effects. They throw a MacroError.
import { properties } from "@cssints/css-grammar/mdn";
import { MacroError } from "./errors.ts";
import { registry } from "./registry.ts";

/** One declaration: property and value. */
export type Decl = [prop: string, value: string];
/** What a css.* builder returns: its declarations. */
export interface CssNode {
  __cssints: Decl[];
}

const camel = (p: string) => p.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

// A builder error names the call site being evaluated (`__at` set it), when there is one.
const fail = (message: string) => new MacroError({ message, ...registry.at });

// member -> property: every grammar property as camelCase, plus the short set.
export const PROPS: Record<string, string> = {
  ...Object.fromEntries(Object.keys(properties).map((p) => [camel(p), p])),
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
  flex: ["flex-direction", "flex-wrap", "flex-flow", "align-items", "align-content", "justify-content", "place-content", "gap", "row-gap", "column-gap"],
  grid: [
    "grid-template-columns", "grid-template-rows", "grid-template-areas", "grid-template", "grid-auto-flow", "grid-auto-columns", "grid-auto-rows",
    "align-items", "justify-items", "place-items", "align-content", "justify-content", "place-content", "gap", "row-gap", "column-gap",
  ],
};

const SPACING = /^(padding|margin|inset|gap|row-gap|column-gap)(-|$)/;
export const isNode = (v: unknown): v is CssNode => !!v && typeof v === "object" && Array.isArray((v as CssNode).__cssints);

// parts (strings, Typed OM values) are joined by a space; a lone number is the spacing scale in spacing properties
const decl = (prop: string, name: string, args: unknown[]): Decl => {
  if (!args.length) throw fail(`cssints: ${name}() expects a value`);
  if (args.some(isNode)) throw fail(`cssints: ${name}() takes values, not styles; merge styles with cn(...) or cx(...)`);
  const [only] = args;
  return [prop, args.length === 1 && typeof only === "number" && SPACING.test(prop) ? `${only * 0.25}rem` : args.join(" ")];
};

export function toDecls(member: string, args: unknown[]): Decl[] {
  if (member === "cn") {
    if (!args.every(isNode)) throw fail(`cssints: cn() takes css.* values only, got ${JSON.stringify(args.filter((a) => !isNode(a)))}`);
    return args.flatMap((n) => n.__cssints);
  }
  if (CONTEXTS[member]) {
    if (args.length) throw fail(`cssints: ${member}() takes no arguments; chain its container properties: ${member}().${chainNames(member)[0]}(...)`);
    return [["display", member]];
  }
  const prop = PROPS[member];
  if (!prop) throw fail(`cssints: unknown css.${member}`);
  return [decl(prop, member, args)];
}

export const chainNames = (ctx: string) => CONTEXTS[ctx]!.map((p) => camel(p.startsWith(`${ctx}-`) ? p.slice(ctx.length + 1) : p));

// .method(...) on a style: only container properties of flex() / grid(); plain styles do not chain.
export function chainDecl(ctx: string | undefined, method: string, args: unknown[]): Decl {
  if (!ctx) throw fail(`cssints: plain styles do not chain (.${method}); merge them with cn(...) or cx(...)`);
  const i = chainNames(ctx).indexOf(method);
  if (i < 0) throw fail(`cssints: ${ctx}() has no .${method}(); it chains ${chainNames(ctx).join(", ")}`);
  return decl(CONTEXTS[ctx]![i]!, method, args);
}

// The class name of a declaration. Plain code: a tight loop over the characters of every declaration, called
// inside the `classesOf` boundary (macro.ts).
// ponytail: djb2, 32-bit; swap for xxhash if collisions ever show up.
export function hashClass([p, v]: Decl): string {
  let h = 5381;
  for (const c of `${p}:${v}`) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return "_" + (h >>> 0).toString(36);
}
