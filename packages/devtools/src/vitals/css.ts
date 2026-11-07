// The page's stylesheets as numbers: bytes, rules, declarations, layers, the worst specificity, `!important`, unique
// colours and fonts, custom properties declared and read, keyframes declared and used, and the classes no element carries
// right now (coverage). The browser has parsed the CSS already, so this walks the CSSOM — no parser and no Effect, which
// keeps the vitals a console import any page can afford. Cross-origin sheets are counted as blocked: their rules throw.
import { cmpSpec, type Spec, specificity, splitTop } from "../core/selector.ts";

export interface CssStats {
  sheets: number;
  blocked: number;
  bytes: number;
  rules: number;
  declarations: number;
  layers: string[];
  /** the bytes of each layer's style rules, the top level `""` as unlayered */
  layerBytes: { layer: string; bytes: number }[];
  specificity: Spec;
  /** the selector with that specificity */
  worst: string;
  important: number;
  classes: string[];
  /** the classes of the sheet with no element carrying them now */
  unused: string[];
  colours: string[];
  fonts: string[];
  custom: { declared: string[]; used: string[]; orphaned: string[]; missing: string[] };
  keyframes: { declared: string[]; used: string[]; unused: string[] };
}

const COLOURS = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)/gi;
const CLASSES = /\.(-?[A-Za-z_][\w-]*)/g;
const USED_CUSTOM = /var\(\s*(--[\w-]+)/g;

const normal = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

export const cssStats = (doc: Document = document): CssStats => {
  const out: CssStats = {
    sheets: 0,
    blocked: 0,
    bytes: 0,
    rules: 0,
    declarations: 0,
    layers: [],
    layerBytes: [],
    specificity: [0, 0, 0],
    worst: "",
    important: 0,
    classes: [],
    unused: [],
    colours: [],
    fonts: [],
    custom: { declared: [], used: [], orphaned: [], missing: [] },
    keyframes: { declared: [], used: [], unused: [] },
  };
  const layers = new Set<string>();
  const layerBytes = new Map<string, number>();
  const classes = new Set<string>();
  const colours = new Set<string>();
  const fonts = new Set<string>();
  const declared = new Set<string>();
  const used = new Set<string>();
  const frames = new Set<string>();
  const animations = new Set<string>();

  const values = (rule: CSSStyleRule) => {
    const declarations = rule.style;
    out.declarations += declarations.length;
    for (let i = 0; i < declarations.length; i++) {
      const prop = declarations.item(i);
      const value = declarations.getPropertyValue(prop);
      if (declarations.getPropertyPriority(prop) === "important") out.important++;
      if (prop.startsWith("--")) declared.add(prop);
      for (const match of value.matchAll(USED_CUSTOM)) used.add(match[1]!);
      for (const match of value.matchAll(COLOURS)) colours.add(normal(match[0]));
      if (prop === "font-family") fonts.add(normal(value));
      if (prop === "animation" || prop === "animation-name") {
        for (const name of splitTop(value, ",")) animations.add(name.trim().split(/\s+/)[0]!);
      }
    }
  };

  const style = (rule: CSSStyleRule, layer: string) => {
    out.rules++;
    const bytes = rule.cssText.length;
    layerBytes.set(layer, (layerBytes.get(layer) ?? 0) + bytes);
    for (const selector of splitTop(rule.selectorText, ",")) {
      for (const match of selector.matchAll(CLASSES)) classes.add(match[1]!);
      const spec = specificity(selector);
      if (cmpSpec(spec, out.specificity) > 0) {
        out.specificity = spec;
        out.worst = selector;
      }
    }
    values(rule);
  };

  const walk = (rules: CSSRuleList, layer: string): void => {
    for (const rule of rules) {
      // Structural checks, not `instanceof`: the constructors are absent outside a browser (even the sheet's classes),
      // and this reader is also run on a happy-dom sheet in the node test.
      if ("selectorText" in rule && "style" in rule) {
        style(rule as CSSStyleRule, layer);
        // nesting: a style rule's own nested rules are rules too (cssints prints flat selectors, a raw sheet may nest)
        if ("cssRules" in rule)
          walk((rule as CSSStyleRule & { cssRules: CSSRuleList }).cssRules, layer);
      } else if ("appendRule" in rule) {
        // CSSKeyframesRule: appendRule/deleteRule/findRule, and `name`
        frames.add((rule as CSSKeyframesRule).name);
      } else if ("nameList" in rule) {
        // CSSLayerStatementRule: `@layer a, b;`
        for (const name of (rule as CSSLayerStatementRule).nameList)
          layers.add(layer ? `${layer}.${name}` : name);
      } else if ("syntax" in rule) {
        // CSSPropertyRule: `@property --x`
        declared.add((rule as CSSPropertyRule).name);
      } else if ("name" in rule && "cssRules" in rule) {
        // CSSLayerBlockRule: `@layer name { … }` (a media, supports or container rule has no `name`)
        const name = (rule as CSSLayerBlockRule).name;
        const next = name ? (layer ? `${layer}.${name}` : name) : layer;
        layers.add(next);
        walk((rule as CSSLayerBlockRule).cssRules, next);
      } else if ("cssRules" in rule) {
        walk((rule as CSSGroupingRule).cssRules, layer);
      }
    }
  };

  for (const sheet of doc.styleSheets) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      out.blocked++;
      continue;
    }
    out.sheets++;
    out.bytes += Array.from(rules).reduce((sum, rule) => sum + rule.cssText.length, 0);
    walk(rules, "");
  }

  const carried = new Set(
    Array.from(doc.querySelectorAll("[class]")).flatMap((element) => Array.from(element.classList)),
  );

  out.layers = [...layers].filter(Boolean).sort();
  out.layerBytes = [...layerBytes.entries()]
    .map(([layer, bytes]) => ({ layer: layer || "unlayered", bytes }))
    .sort((a, b) => b.bytes - a.bytes);
  out.classes = [...classes].sort();
  out.unused = out.classes.filter((name) => !carried.has(name));
  out.colours = [...colours].sort();
  out.fonts = [...fonts].sort();
  out.custom = {
    declared: [...declared].sort(),
    used: [...used].sort(),
    orphaned: [...declared].filter((name) => !used.has(name)).sort(),
    missing: [...used].filter((name) => !declared.has(name)).sort(),
  };
  out.keyframes = {
    declared: [...frames].sort(),
    used: [...animations].filter((name) => frames.has(name)).sort(),
    unused: [...frames].filter((name) => !animations.has(name)).sort(),
  };
  return out;
};
