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
// a type mdn-data lacks (<autospace>, <attr-unit>) comes from the spec grammar
const addS = (n) => {
  if (S[n] || !(syn[n] || webS[n])) return;
  S[n] = ranged(syn[n]?.syntax ?? webS[n], webS[n]);
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
  declaration: Object.keys(P)
    .map((p) => `${p} : <'${p}'>`)
    .join(" | "),
};
const addC = (n) => {
  const g = COND[n] ?? webS[n] ?? syn[n]?.syntax;
  if (S[n] || !g) return;
  S[n] = g.replace(/ \| <general-enclosed>/g, "").replaceAll("<ident>", "<custom-ident>");
  refs(S[n]).forEach(addC);
};
["media-query-list", "container-condition", "supports-condition"].forEach(addC);
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
