// Shared by the runtime (eval time) and the plugin (build time).
import { properties } from "@cssints/css-grammar/mdn";

const camel = (p) => p.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

// member -> property: every grammar property as camelCase, plus the short set.
export const PROPS = {
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
export const CONTEXTS = {
  flex: ["flex-direction", "flex-wrap", "flex-flow", "align-items", "align-content", "justify-content", "place-content", "gap", "row-gap", "column-gap"],
  grid: [
    "grid-template-columns", "grid-template-rows", "grid-template-areas", "grid-template", "grid-auto-flow", "grid-auto-columns", "grid-auto-rows",
    "align-items", "justify-items", "place-items", "align-content", "justify-content", "place-content", "gap", "row-gap", "column-gap",
  ],
};

const SPACING = /^(padding|margin|inset|gap|row-gap|column-gap)(-|$)/;
export const isNode = (v) => !!v && typeof v === "object" && Array.isArray(v.__cssints);

// parts (strings, Typed OM values) are joined by a space; a lone number is the spacing scale in spacing properties
const decl = (prop, name, args) => {
  if (!args.length) throw new Error(`cssints: ${name}() expects a value`);
  if (args.some(isNode)) throw new Error(`cssints: ${name}() takes values, not styles; merge styles with cn(...) or cx(...)`);
  return [prop, args.length === 1 && typeof args[0] === "number" && SPACING.test(prop) ? `${args[0] * 0.25}rem` : args.join(" ")];
};

export function toDecls(member, args) {
  if (member === "cn") {
    if (!args.every(isNode)) throw new Error(`cssints: cn() takes css.* values only, got ${JSON.stringify(args.filter((a) => !isNode(a)))}`);
    return args.flatMap((n) => n.__cssints);
  }
  if (CONTEXTS[member]) {
    if (args.length) throw new Error(`cssints: ${member}() takes no arguments; chain its container properties: ${member}().${chainNames(member)[0]}(...)`);
    return [["display", member]];
  }
  const prop = PROPS[member];
  if (!prop) throw new Error(`cssints: unknown css.${member}`);
  return [decl(prop, member, args)];
}

const chainNames = (ctx) => CONTEXTS[ctx].map((p) => camel(p.startsWith(`${ctx}-`) ? p.slice(ctx.length + 1) : p));

// .method(...) on a style: only container properties of flex() / grid(); plain styles do not chain.
export function chainDecl(ctx, method, args) {
  if (!ctx) throw new Error(`cssints: plain styles do not chain (.${method}); merge them with cn(...) or cx(...)`);
  const i = chainNames(ctx).indexOf(method);
  if (i < 0) throw new Error(`cssints: ${ctx}() has no .${method}(); it chains ${chainNames(ctx).join(", ")}`);
  return decl(CONTEXTS[ctx][i], method, args);
}

// ponytail: djb2, 32-bit; swap for xxhash if collisions ever show up.
export function classOf([p, v]) {
  let h = 5381;
  for (const c of `${p}:${v}`) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return "_" + (h >>> 0).toString(36);
}
