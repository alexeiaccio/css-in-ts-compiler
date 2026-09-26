// Runs inside the Vite Module Runner. css.* builds declaration nodes; __site (injected by the
// plugin) turns a node into its replacement expression and records it per call site.
import { valid } from "../../typelevel/twin.ts";
import { classOf, parseStyles, toDecls } from "./lib.mjs";

const registry = (globalThis.__cssints ??= { sites: new Map(), rules: new Map() });

const node = (decls) =>
  new Proxy(
    { __cssints: decls },
    { get: (t, k) => (k in t ? t[k] : (...args) => node([...decls, ...toDecls(String(k), args)])) },
  );

// css.p(4) | css.flex(...).items(...) | css.flex.items(...) (bare member = call with no args)
const member = (k) =>
  new Proxy((...args) => node(toDecls(k, args)), { get: (_, k2) => (k2 in Function.prototype ? undefined : node(toDecls(k, []))[k2]) });

export const css = new Proxy({}, { get: (_, k) => member(String(k)) });
export const display = /* @__PURE__ */ member("display");
export const position = /* @__PURE__ */ member("position");
export const flex = /* @__PURE__ */ member("flex");
export const flexDirection = /* @__PURE__ */ member("flexDirection");
export const flexGrow = /* @__PURE__ */ member("flexGrow");
export const flexShrink = /* @__PURE__ */ member("flexShrink");
export const items = /* @__PURE__ */ member("items");
export const justify = /* @__PURE__ */ member("justify");
export const gap = /* @__PURE__ */ member("gap");
export const flexWrap = /* @__PURE__ */ member("flexWrap");
export const width = /* @__PURE__ */ member("width");
export const height = /* @__PURE__ */ member("height");
export const maxWidth = /* @__PURE__ */ member("maxWidth");
export const maxHeight = /* @__PURE__ */ member("maxHeight");
export const overflow = /* @__PURE__ */ member("overflow");
export const padding = /* @__PURE__ */ member("padding");
export const paddingTop = /* @__PURE__ */ member("paddingTop");
export const paddingRight = /* @__PURE__ */ member("paddingRight");
export const paddingBottom = /* @__PURE__ */ member("paddingBottom");
export const paddingLeft = /* @__PURE__ */ member("paddingLeft");
export const margin = /* @__PURE__ */ member("margin");
export const marginTop = /* @__PURE__ */ member("marginTop");
export const marginRight = /* @__PURE__ */ member("marginRight");
export const marginBottom = /* @__PURE__ */ member("marginBottom");
export const marginLeft = /* @__PURE__ */ member("marginLeft");
export const fontSize = /* @__PURE__ */ member("fontSize");
export const fontWeight = /* @__PURE__ */ member("fontWeight");
export const fontFamily = /* @__PURE__ */ member("fontFamily");
export const lineHeight = /* @__PURE__ */ member("lineHeight");
export const letterSpacing = /* @__PURE__ */ member("letterSpacing");
export const textAlign = /* @__PURE__ */ member("textAlign");
export const textDecoration = /* @__PURE__ */ member("textDecoration");
export const textTransform = /* @__PURE__ */ member("textTransform");
export const whiteSpace = /* @__PURE__ */ member("whiteSpace");
export const color = /* @__PURE__ */ member("color");
export const bg = /* @__PURE__ */ member("bg");
export const background = /* @__PURE__ */ member("background");
export const border = /* @__PURE__ */ member("border");
export const borderColor = /* @__PURE__ */ member("borderColor");
export const borderWidth = /* @__PURE__ */ member("borderWidth");
export const borderStyle = /* @__PURE__ */ member("borderStyle");
export const borderRadius = /* @__PURE__ */ member("borderRadius");
export const boxShadow = /* @__PURE__ */ member("boxShadow");
export const opacity = /* @__PURE__ */ member("opacity");
export const transition = /* @__PURE__ */ member("transition");
export const transform = /* @__PURE__ */ member("transform");
export const cursor = /* @__PURE__ */ member("cursor");
export const zIndex = /* @__PURE__ */ member("zIndex");
export const p = /* @__PURE__ */ member("p");
export const pt = /* @__PURE__ */ member("pt");
export const pr = /* @__PURE__ */ member("pr");
export const pb = /* @__PURE__ */ member("pb");
export const pl = /* @__PURE__ */ member("pl");
export const m = /* @__PURE__ */ member("m");
export const mt = /* @__PURE__ */ member("mt");
export const mr = /* @__PURE__ */ member("mr");
export const mb = /* @__PURE__ */ member("mb");
export const ml = /* @__PURE__ */ member("ml");

export const cn = member("cn");

const classesOf = (decls) => {
  const out = [];
  for (const d of decls) {
    valid(d[0], d[1]); // build-time twin of the type-level check; throws at the bad token
    const cls = classOf(d);
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



export function __site(file, n, value) {
  const replacement = value?.__cssints ? JSON.stringify(classesOf(value.__cssints)) : value?.__cv ? JSON.stringify(value.__cv) : null;
  if (replacement === null) throw new Error(`cssints: site ${n} in ${file} did not produce a css.* or cv() value`);
  if (!registry.sites.has(file)) registry.sites.set(file, new Map());
  registry.sites.get(file).set(n, replacement);
  return value;
}
