// Emit the mdn-data syntax strings (verbatim) for a set of properties plus the closure of <refs> they use.
// The one exception: numeric ranges mdn-data leaves out are copied from @webref/css (the spec grammars).
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const props = require("mdn-data/css/properties.json"),
  syn = require("mdn-data/css/syntaxes.json");
const web = require("@webref/css/css.json");
const webP = {},
  webS = {};
for (const p of web.properties) if (p.syntax) webP[p.name] = p.syntax;
for (const t of [...web.types, ...web.functions]) if (t.syntax) webS[t.name] ??= t.syntax;
// <T> becomes <T [lo,hi]> when the spec grammar of the same name only uses T with that one range.
// A range on T also covers the members of T (<length-percentage [0,∞]> = <length [0,∞]> | <percentage [0,∞]>).
const ranged = (mine, spec) => {
  if (!spec) return mine;
  const r = new Map();
  for (const [, t, range] of spec.matchAll(/<([^'>\s[]+)(?: (\[[^\]]*\]))?>/g))
    r.set(t, r.has(t) && r.get(t) !== range ? undefined : range);
  for (const [t, range] of r)
    if (range && /^<[^>]+>( \| <[^>]+>)*$/.test(syn[t]?.syntax ?? ""))
      for (const [, u] of syn[t].syntax.matchAll(/<([^>]+)>/g)) if (!r.has(u)) r.set(u, range);
  return mine.replace(/<([^'>\s[]+)>/g, (m, t) => (r.get(t) ? `<${t} ${r.get(t)}>` : m));
};
// node scripts/extract.mjs [prop...]  (default: every standard and experimental property, plus LIVE_NONSTANDARD; the other
// nonstandard ones are prefixed or dead forms that LightningCSS emits from the browserslist targets, and the obsolete
// ones are gone)
// WebKit-only properties with no standard form to prefix from, which LightningCSS passes through. Live per BCD: no removal in
// Chrome or Safari (user-modify is listed as `user-modify` with a -webkit- prefix; touch-callout is iOS Safari only). Left out:
// -webkit-overflow-scrolling (no BCD entry; Chrome 154, WebKit 26.6 and Firefox 155 all reject it in CSS.supports).
const LIVE_NONSTANDARD = [
  "-webkit-tap-highlight-color",
  "-webkit-touch-callout",
  "-webkit-box-reflect",
  "-webkit-user-modify",
];
const want =
  process.argv.length > 2
    ? process.argv.slice(2)
    : Object.keys(props).filter(
        (p) =>
          ["standard", "experimental"].includes(props[p].status) || LIVE_NONSTANDARD.includes(p),
      );
const P = {},
  S = {};
const refs = (s) => [...s.matchAll(/<([^'>\s[]+)(?:\s*\[[^\]]*\])?>/g)].map((m) => m[1]);
const prefs = (s) => [...s.matchAll(/<'([^']+)'>/g)].map((m) => m[1]);
// Where a property's grammar comes from (cssints-h6qk, cssints-pctg). mdn-data is stale for some properties (`tab-size:
// 3.5`, `letter-spacing: 10%`) and @webref/css is newer than Chrome for others, so the choice is per property:
// `webref-properties.json` lists the properties that take webref's grammar, and `bun run webref` (scripts/webref-rule.mjs)
// rewrites it with Chrome as the judge (docs/research/webref-grammars.md, section 4). A type that such a grammar reaches
// is webref's too, under the name `<type~w>` when it differs from mdn-data's (so the mdn-data properties keep theirs).
// WEBREF=none is mdn-data alone (the baseline of the rule), WEBREF=all every property that has a webref grammar,
// WEBREF=@file.json the properties of another list. EXTRACT_OUT redirects the output.
const SPEC = process.env.WEBREF ?? `@${import.meta.dirname}/webref-properties.json`;
const MODE = SPEC === "none" ? "" : SPEC === "all" ? "all" : "list";
const OUT = process.env.EXTRACT_OUT ?? `${import.meta.dirname}/../src/mdn.ts`;
const webList = MODE === "list" ? new Set(JSON.parse(readFileSync(SPEC.slice(1), "utf8"))) : null;
const useWeb = (n) => !!webP[n] && (MODE === "all" || !!webList?.has(n));
// Hand overrides for properties where neither source is right, each confirmed against Chrome 154 (`CSS.supports`):
// webref-rule.mjs re-runs the check on every bump and fails when Chrome disagrees. Only in list mode, and these
// properties never go in the list. Each is a grammar over mdn-data's types.
const LW = "[ <line-width> | repeat( <integer [1,∞]> , [ <line-width> ]# ) ]";
const PROP = {
  // webref: `from-image | none | [ <angle> || flip ]`, mdn-data: the css-images-3 `from-image | <angle> | [ <angle>? flip ]`.
  // Chrome takes `none` (css-images-4) and rejects every angle and `flip`.
  "image-orientation": "from-image | none",
  // css-gap-decorations lists of <line-width>, with repeat() and repeat(auto, …). webref's <line-width> has the `hairline` of
  // css-borders-4, which Chrome rejects; mdn-data's `<'border-width'>` takes one to four values, Chrome a comma list.
  "column-rule-width": `${LW}# | ${LW}#? , repeat( auto , [ <line-width> ]# ) , ${LW}#?`,
  // mdn-data: `<number> || <percentage>`, webref: `<number [0,∞]> | <percentage [0,∞]>`. Chrome takes `normal`, rejects
  // `reset` (mdn-data) and `2 50%`.
  zoom: "normal | <number [0,∞]> | <percentage [0,∞]>",
  // mdn-data still lists `auto` (css-ui-4 removed it), webref is <'border-top-color'> with `stripes()`: Chrome rejects all
  // three and takes `<color>`. `outline` reaches it by name.
  "outline-color": "<color>",
};
const addP = (n) => {
  const web = useWeb(n) || (!!MODE && !props[n]);
  if (P[n] || !(props[n] || (web && webP[n]))) return;
  const own = webList && PROP[n];
  P[n] = own ?? (web ? renamed(webP[n], true) : ranged(props[n].syntax, webP[n]));
  refs(own ?? (web ? webP[n] : P[n])).forEach((t) => addS(t, web && !own));
  prefs(P[n]).forEach(addP);
};
// Colour (cssints-gcuz). mdn-data 2.27.1 has no relative colour syntax and no contrast-color(), if() or var() in
// <color>; @webref/css has the first, in css-color-5. So:
//  - the colour functions are webref's (`[from <color>]?`, mdn-data's forms plus the origin colour); the rest of
//    <color-function> stays mdn-data's, which leaves out the HDR-only ictcp(), jzazbz(), jzczhz(), alpha() and color-hdr();
//  - <color> is mdn-data's plus <contrast-color()>, <if()> and <var()>, the functions that stand for a colour;
//  - contrast-color( <color> ) is css-color-5 §8; webref only has the css-color-6 draft, with `tbd-fg` and `tbd-bg`
//    in it (Chrome 154 takes the one-argument form);
//  - <custom-property-name> has no grammar in either source: it is a <dashed-ident> (css-variables-2);
//  - <if()>, <if-branch> and <if-test> are webref's. Its <boolean-expr[ <if-test> ]> is a parameterized type: it is
//    written out with the formal equivalent of css-values-5 §3.6 (the same as the <media-condition> family), without
//    <general-enclosed> as in the conditions below. <declaration> takes custom properties too (`style(--x: 1)`).
// The twin checks the channel keywords of a relative colour (`r g b`, `l c h`, `alpha`, ...) and the calc() around
// them, which the grammar does not carry (css-color-5 §4); types take everything after `from` as balanced tokens.
// (mdn-data's <xyz-params> also names a <xyz> that it does not define: webref's is <xyz-space>.)
const WEBREF = [
  ...["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color"].map(
    (f) => `${f}()`,
  ),
  "xyz-params",
];
// Math functions (cssints-91im): a <calc-value> is also a nested math function. The type level reads `<math-function>` as
// balanced tokens (css.ts `MathCall`); the twin scans a whole <calc-sum> with its own typed parser (twin-core.ts
// `mathScan`) and never reads this grammar.
const COLOR = {
  "calc-value": `${syn["calc-value"].syntax} | <math-function>`,
  color: `${syn.color.syntax} | <contrast-color()> | <if()> | <var()>`,
  "contrast-color()": "contrast-color( <color> )",
  "custom-property-name": "<dashed-ident>",
  "if-condition": webS["if-condition"].replace("<boolean-expr[ <if-test> ]>", "<if-boolean-expr>"),
  "if-boolean-expr": webS["boolean-expr"].replaceAll("boolean-expr-group", "if-group"),
  "if-group": "<if-test> | ( <if-boolean-expr> )",
};
// the if() family goes through addC below: its conditions are the ones of @media, @container and @supports
const IF = /^if(-|\(\))/;
// names the twin reads as primitives or scans, which webref also defines (as `<number-token>`, `<url()> | <src()>`, ...)
const NATIVE = new Set(["length-percentage", "integer", "url", "calc-sum"]);
// a type mdn-data lacks (<autospace>, <attr-unit>) comes from the spec grammar
const typeText = (n, web) =>
  COLOR[n] ??
  (web && webS[n] && !NATIVE.has(n) && (MODE === "all" || !(n.endsWith("()") && syn[n]))
    ? webS[n]
    : ranged(WEBREF.includes(n) ? webS[n] : (syn[n]?.syntax ?? webS[n]), webS[n]));
// a `<name()>` type cannot be renamed (the twin tests for `name(`): in a list, mdn-data's stays
const tkey = (n, web) =>
  web && syn[n] && !n.endsWith("()") && typeText(n, true) !== typeText(n, false) ? `${n}~w` : n;
const renamed = (text, web) =>
  web ? text.replace(/<([^'>\s[]+)(?=[\s\]>])/g, (m, t) => `<${tkey(t, true)}`) : text;
const addS = (n, web = false) => {
  const k = tkey(n, web);
  if (S[k] || IF.test(n) || !(COLOR[n] || syn[n] || webS[n])) return;
  S[k] = renamed(typeText(n, web), web);
  refs(typeText(n, web)).forEach((t) => addS(t, web));
  prefs(typeText(n, web)).forEach(addP);
};
want.forEach(addP);
// twin-core.ts reads these two by name, for the channel keywords of color()
if (MODE) ["predefined-rgb", "xyz-space"].forEach((n) => addS(n));
// Conditions (cssints-mjgx): <media-query-list>, <container-condition>, <supports-condition> with their closures, in
// `syntaxes`. @webref/css first (its <media-condition> is linear, mdn-data's retries every alternative), mdn-data where
// webref has none. Deviations: no <general-enclosed> (an unknown feature is an error, not "false"), <ident> is
// <custom-ident>, the spec's <size-feature> (mdn-data says <media-query-list>), and supports() takes declarations of
// the properties above, without selector(), font-tech() and friends.
const COND = {
  "size-feature": "<mf-plain> | <mf-boolean> | <mf-range>",
  "scroll-state-feature": "<mf-plain> | <mf-boolean>",
  "style-feature": "<declaration>",
  "supports-feature": "<supports-decl>",
  "supports-decl": "( <declaration> )",
  declaration: [
    ...Object.keys(P).map((p) => `${p} : <'${p}'>`),
    "<dashed-ident> : <declaration-value>",
  ].join(" | "),
};
const addC = (n) => {
  const g = COND[n] ?? COLOR[n] ?? webS[n] ?? syn[n]?.syntax;
  if (S[n] || !g) return;
  S[n] = g.replace(/ \| <general-enclosed>/g, "").replaceAll("<ident>", "<custom-ident>");
  refs(S[n]).forEach(addC);
};
["media-query-list", "container-condition", "supports-condition", "if()"].forEach(addC);
const lit = (o) =>
  JSON.stringify(o, null, 2).replace(/"([^"]+)":/g, (m, k) =>
    /^[a-zA-Z_$][\w$]*$/.test(k) ? `${k}:` : m,
  );
const v = (p) => require(`${p}/package.json`).version;
const ownGrammar = Object.keys(P).filter((p) => PROP[p]).length;
const fromWebref = webList
  ? `; ${Object.keys(P).filter((p) => useWeb(p) && !PROP[p]).length} properties take the @webref/css grammar (webref-properties.json), ${ownGrammar} a hand override`
  : "";
writeFileSync(
  OUT,
  `// verbatim from mdn-data ${v("mdn-data")}, plus the numeric ranges it omits, from @webref/css ${v("@webref/css")}${fromWebref} (extract.mjs)\nexport const properties = ${lit(P)} as const;\nexport const syntaxes = ${lit(S)} as const;\n`,
);
console.log("overrides:", webList ? Object.keys(PROP).join(" ") : "");
console.log(
  "properties",
  Object.keys(P).length,
  "syntaxes",
  Object.keys(S).length,
  Object.keys(S).join(" "),
);
