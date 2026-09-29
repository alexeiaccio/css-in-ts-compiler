// Runs inside the Vite Module Runner. css.* builds declaration nodes; __site (injected by the
// plugin) turns a node into its replacement expression and records it per call site.
import { checkRules } from "@cssints/css-grammar/rules";
import { message, support } from "@cssints/css-grammar/support";
import { valid } from "@cssints/css-grammar/twin";
import { CSS, CSSColorValue, CSSStyleValue, CSSUnitValue } from "@cssints/css-grammar/values";
import { chainDecl, classOf, CONTEXTS, parseStyles, toDecls } from "./lib.mjs";

export { CSS, CSSColorValue, CSSUnitValue };

const registry = (globalThis.__cssints ??= { sites: new Map(), rules: new Map(), warnings: [], warned: new Set() });

// A style: its declarations, and the layout context (flex / grid) whose container properties it chains.
const node = (decls, ctx) =>
  new Proxy({ __cssints: decls }, { get: (t, k) => (k in t || typeof k === "symbol" ? t[k] : (...args) => node([...decls, chainDecl(ctx, k, args)], ctx)) });

const member = (k) => (...args) => node(toDecls(k, args), CONTEXTS[k] ? k : undefined);

export const cn = member("cn");
export const flex = member("flex");
export const grid = member("grid");

const classesOf = (decls) => {
  const out = [];
  for (const d of decls) {
    valid(d[0], d[1]); // build-time twin of the type-level check; throws at the bad token
    checkRules(d[0], d[1]); // spec prose rules; throws like valid
    const cls = classOf(d);
    // once per property and BCD feature per build: an unsupported property warns once, not once per value
    if (!registry.rules.has(cls)) for (const w of support(d[0], d[1])) {
      const k = `${d[0]} ${w.key}`;
      if (!registry.warned.has(k)) registry.warned.add(k), registry.warnings.push(message(d[0], d[1], w));
    }
    if (!out.includes(cls)) out.push(cls);
    registry.rules.set(cls, `@layer _.a{.${cls}{${d[0]}:${d[1]}}}`);
  }
  return out.join(" ");
};

// cv(config with css strings) -> CvRuntimeConfig with class strings, consumed by _cv at runtime.
export const cv = (config) => ({
  __cv: {
    base: classesOf(parseStyles(config.base ?? "")),
    variants: Object.fromEntries(Object.entries(config.variants ?? {}).map(([k, vs]) => [k, Object.fromEntries(Object.entries(vs).map(([n, s]) => [n, classesOf(parseStyles(s))]))])),
    defaultVariants: config.defaultVariants ?? {},
  },
});

// Any name besides these (css.p, css.alignItems) is a property. Named imports of build-time members come from
// here too: the plugin rewrites them to destructure `css`, so the property list stays derived from the grammar.
const named = { cn, flex, grid, cv, CSS, CSSColorValue, CSSUnitValue };
export const css = new Proxy(named, { get: (t, k) => (Object.hasOwn(t, k) ? t[k] : member(String(k))) });
named.css = css;

export function __site(file, n, value) {
  // A Typed OM value (CSS.rem(1), new CSSColorValue(...)) ships as its CSS text; the objects are eval-time only.
  const replacement = value?.__cssints ? JSON.stringify(classesOf(value.__cssints)) : value?.__cv ? JSON.stringify(value.__cv) : value instanceof CSSStyleValue ? JSON.stringify(String(value)) : null;
  if (replacement === null) throw new Error(`cssints: site ${n} in ${file} did not produce a css.*, cv() or Typed OM value`);
  if (!registry.sites.has(file)) registry.sites.set(file, new Map());
  registry.sites.get(file).set(n, replacement);
  return value;
}
