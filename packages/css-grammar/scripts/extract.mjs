// Emit the mdn-data syntax strings (verbatim) for a set of properties plus the closure of <refs> they use.
// The one exception: numeric ranges mdn-data leaves out are copied from @webref/css (the spec grammars).
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
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
// node scripts/extract.mjs [prop...]  (default: every standard and experimental property; the nonstandard ones are
// prefixed or dead forms that LightningCSS emits from the browserslist targets, and the obsolete ones are gone)
const want =
  process.argv.length > 2
    ? process.argv.slice(2)
    : Object.keys(props).filter((p) => ["standard", "experimental"].includes(props[p].status));
const P = {},
  S = {};
const refs = (s) => [...s.matchAll(/<([^'>\s[]+)(?:\s*\[[^\]]*\])?>/g)].map((m) => m[1]);
const prefs = (s) => [...s.matchAll(/<'([^']+)'>/g)].map((m) => m[1]);
const addP = (n) => {
  if (P[n] || !props[n]) return;
  P[n] = ranged(props[n].syntax, webP[n]);
  refs(P[n]).forEach(addS);
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
const COLOR = {
  color: `${syn.color.syntax} | <contrast-color()> | <if()> | <var()>`,
  "contrast-color()": "contrast-color( <color> )",
  "custom-property-name": "<dashed-ident>",
  "if-condition": webS["if-condition"].replace("<boolean-expr[ <if-test> ]>", "<if-boolean-expr>"),
  "if-boolean-expr": webS["boolean-expr"].replaceAll("boolean-expr-group", "if-group"),
  "if-group": "<if-test> | ( <if-boolean-expr> )",
};
// the if() family goes through addC below: its conditions are the ones of @media, @container and @supports
const IF = /^if(-|\(\))/;
// a type mdn-data lacks (<autospace>, <attr-unit>) comes from the spec grammar
const addS = (n) => {
  if (S[n] || IF.test(n) || !(COLOR[n] || syn[n] || webS[n])) return;
  S[n] = COLOR[n] ?? ranged(WEBREF.includes(n) ? webS[n] : (syn[n]?.syntax ?? webS[n]), webS[n]);
  refs(S[n]).forEach(addS);
  prefs(S[n]).forEach(addP);
};
want.forEach(addP);
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
writeFileSync(
  `${import.meta.dirname}/../src/mdn.ts`,
  `// verbatim from mdn-data ${v("mdn-data")}, plus the numeric ranges it omits, from @webref/css ${v("@webref/css")} (extract.mjs)\nexport const properties = ${lit(P)} as const;\nexport const syntaxes = ${lit(S)} as const;\n`,
);
console.log(
  "properties",
  Object.keys(P).length,
  "syntaxes",
  Object.keys(S).length,
  Object.keys(S).join(" "),
);
