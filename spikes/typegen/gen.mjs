// Generate TS value types for CSS properties from mdn-data value-definition syntax, and report coverage.
// Policy: a property is fully typed when its grammar reduces to a union of atoms (keywords,
// primitive value types, or constructor brands). Sequences/multipliers/combinators are not typed.
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const properties = require("mdn-data/css/properties.json");
const syntaxes = require("mdn-data/css/syntaxes.json");

// ---------- tokenizer + parser for value definition syntax

function tokenize(src) {
  const re = /\s*(?:(<'[^']+'>)|(<[^>]+>)|(\[|\]|\)|\|\||\||&&|\?|\*|\+|#|!|,|\/)|(\{\d+(?:,\d*)?\})|([a-zA-Z_][\w-]*\()|([^\s\[\]|&?*+#!,/{}()<>]+))/gy;
  const out = [];
  let m;
  let pos = 0;
  while (pos < src.length) {
    re.lastIndex = pos;
    m = re.exec(src);
    if (!m) throw new Error(`tokenize: stuck at ${JSON.stringify(src.slice(pos, pos + 30))}`);
    pos = re.lastIndex;
    if (m[0].trim() === "") continue;
    if (m[1]) out.push({ t: "propref", v: m[1].slice(2, -2) });
    else if (m[2]) { const mm = /^<([^\s\[]+)(?:\s*\[[^\]]*\])?>$/.exec(m[2]); out.push({ t: "type", v: mm ? mm[1] : m[2].slice(1, -1) }); }
    else if (m[3]) out.push({ t: m[3] });
    else if (m[4]) out.push({ t: "range", v: m[4] });
    else if (m[5]) out.push({ t: "fn", v: m[5].slice(0, -1) });
    else out.push({ t: "kw", v: m[6] });
  }
  return out;
}

function parse(src) {
  const toks = tokenize(src);
  let i = 0;
  const peek = () => toks[i], next = () => toks[i++];
  const alt = () => { const xs = [seq2()]; while (peek()?.t === "|") { next(); xs.push(seq2()); } return xs.length === 1 ? xs[0] : { k: "alt", xs }; };
  const seq2 = () => { const xs = [seq3()]; while (peek()?.t === "||") { next(); xs.push(seq3()); } return xs.length === 1 ? xs[0] : { k: "oneormore", xs }; };
  const seq3 = () => { const xs = [juxt()]; while (peek()?.t === "&&") { next(); xs.push(juxt()); } return xs.length === 1 ? xs[0] : { k: "all", xs }; };
  const juxt = () => { const xs = []; while (peek() && !["|", "||", "&&", "]", ")"].includes(peek().t)) xs.push(term()); return xs.length === 1 ? xs[0] : { k: "seq", xs }; };
  const term = () => {
    const t = next();
    let n;
    if (t.t === "[") { n = alt(); if (next()?.t !== "]") throw new Error("expected ]"); }
    else if (t.t === "fn") { const inner = peek()?.t === ")" ? null : alt(); if (next()?.t !== ")") throw new Error("expected )"); n = { k: "fn", v: t.v, inner }; }
    else if (t.t === "type") n = { k: "type", v: t.v };
    else if (t.t === "propref") n = { k: "propref", v: t.v };
    else if (t.t === "kw") n = { k: "kw", v: t.v };
    else if (t.t === "," || t.t === "/") n = { k: "lit", v: t.t };
    else throw new Error(`unexpected ${t.t}`);
    for (;;) {
      const p = peek();
      if (!p) break;
      if (["?", "*", "+", "#", "!"].includes(p.t)) { next(); n = { k: "mult", m: p.t, x: n }; }
      else if (p.t === "range") { next(); n = { k: "mult", m: p.v, x: n }; }
      else break;
    }
    return n;
  };
  const ast = alt();
  if (i < toks.length) throw new Error(`trailing tokens at ${i}: ${JSON.stringify(toks.slice(i, i + 3))}`);
  return ast;
}

// ---------- classification
// shape = { tuples: Slot[][] , rest?: Slot } | { reason }.  Slot = Set<atom>.  A property is typed when its
// grammar reduces to a bounded set of argument tuples: `p("1rem")`, `p("1rem", "2rem")`, `transition(...T[])`.

const PRIMITIVES = {
  length: "LengthValue", percentage: "Percent", "length-percentage": "LengthValue | Percent",
  number: "number | `${number}`", integer: "number | `${number}`", time: "TimeValue", angle: "AngleValue",
  resolution: "ResolutionValue", flex: "`${number}fr`", string: "string",
  color: "ColorValue", image: "ImageValue", url: "UrlValue", position: "PositionValue",
  "custom-ident": "CustomIdent", "dashed-ident": "`--${string}`", ident: "CustomIdent",
};
const MAX_TUPLES = 24;
const fnAtom = (name) => `Fn<"${name}">`;
const one = (atom) => ({ tuples: [[new Set([atom])]] });
const union = (slots) => new Set(slots.flatMap((x) => [...x]));

const cache = new Map();
function shape(node, stack = []) {
  switch (node.k) {
    case "kw": return one(JSON.stringify(node.v));
    case "lit": return one(JSON.stringify(node.v));
    case "type":
      if (PRIMITIVES[node.v]) return one(PRIMITIVES[node.v]);
      if (node.v.endsWith("()")) return one(fnAtom(node.v.slice(0, -2)));
      return ref(node.v, syntaxes[node.v]?.syntax, stack);
    case "propref": return ref(`'${node.v}'`, properties[node.v]?.syntax, stack);
    case "fn": return one(fnAtom(node.v));
    case "alt": {
      const xs = node.xs.map((x) => shape(x, stack));
      const bad = xs.find((x) => !x.tuples); if (bad) return bad;
      // merge single-slot alternatives into one union slot, keep longer tuples as they are
      const singles = xs.filter((x) => x.tuples.length === 1 && x.tuples[0].length === 1 && !x.rest);
      const others = xs.filter((x) => !singles.includes(x));
      const tuples = [...(singles.length ? [[union(singles.map((x) => x.tuples[0][0]))]] : []), ...others.flatMap((x) => x.tuples)];
      const rest = others.find((x) => x.rest)?.rest;
      return bound({ tuples, rest });
    }
    case "mult": {
      const inner = shape(node.x, stack);
      if (!inner.tuples) return inner;
      if (node.m === "!") return inner;
      if (node.m === "?") return bound({ tuples: [[], ...inner.tuples] });
      if (node.m === "#" || node.m === "*" || node.m === "+") {
        // unbounded list of one slot -> rest parameter
        if (inner.tuples.length === 1 && inner.tuples[0].length === 1 && !inner.rest) return { tuples: [[]], rest: inner.tuples[0][0] };
        return { reason: `multiplier ${node.m} over multi-slot` };
      }
      const [, lo, hi] = /\{(\d+),?(\d*)\}/.exec(node.m);
      const max = hi === "" ? Number(lo) : Number(hi);
      return bound(repeat(inner, Number(lo), max));
    }
    case "seq": case "all": case "oneormore": {
      const xs = node.xs.map((x) => shape(x, stack));
      const bad = xs.find((x) => !x.tuples); if (bad) return bad;
      if (xs.some((x) => x.rest)) return { reason: `list inside ${node.k}` };
      if (node.k === "seq") return bound(xs.reduce((acc, x) => concat(acc, x), { tuples: [[]] }));
      // || and &&: any order. Approximate as 1..n (or exactly n) slots drawn from the union of all parts.
      // parts may be optional (tuples [] and [slot]); anything wider is a real multi-slot part
      const u = union(xs.flatMap((x) => x.tuples.flat()));
      if (xs.some((x) => x.tuples.some((t) => t.length > 1))) return { reason: `combinator ${node.k === "all" ? "&&" : "||"} over multi-slot` };
      const required = xs.filter((x) => !x.tuples.some((t) => t.length === 0)).length;
      const lo = node.k === "all" ? required : Math.max(1, required);
      return bound({ tuples: Array.from({ length: xs.length - lo + 1 }, (_, i) => Array(lo + i).fill(u)) });
    }
  }
  throw new Error(`unknown node ${node.k}`);
}
const concat = (a, b) => ({ tuples: a.tuples.flatMap((t) => b.tuples.map((u) => [...t, ...u])), rest: b.rest });
function repeat(x, lo, hi) {
  let acc = { tuples: [[]] }, out = [];
  for (let i = 1; i <= hi; i++) { acc = concat(acc, x); if (i >= lo) out.push(...acc.tuples); }
  return { tuples: out };
}
const bound = (s) => (s.tuples.length > MAX_TUPLES ? { reason: `too many shapes (${s.tuples.length})` } : s);
function ref(name, syntax, stack) {
  if (!syntax) return { reason: `unknown <${name}>` };
  if (stack.includes(name)) return { reason: `recursive <${name}>` };
  if (cache.has(name)) return cache.get(name);
  let s;
  try { s = shape(parse(syntax), [...stack, name]); } catch (e) { s = { reason: `parse error in <${name}>: ${e.message}` }; }
  if (!s.tuples && !/^(unknown|parse|recursive)/.test(s.reason)) s = { reason: `<${name}>: ${s.reason}` };
  cache.set(name, s);
  return s;
}
const tupleType = (s) => {
  const parts = s.tuples.map((t) => {
    const slots = t.map((slot) => [...slot].join(" | "));
    if (s.rest) slots.push(`...(${[...s.rest].join(" | ")})[]`);
    return `[${slots.join(", ")}]`;
  });
  return [...new Set(parts)].join(" | ");
};

// ---------- run

const camel = (p) => p.replace(/^-+/, "").replace(/-(\w)/g, (_, c) => c.toUpperCase());
const rows = [];
for (const [name, def] of Object.entries(properties)) {
  if (name.startsWith("--") || def.status === "obsolete") continue;
  let s;
  try { s = shape(parse(def.syntax)); } catch (e) { s = { reason: `parse error: ${e.message}` }; }
  rows.push({ name, syntax: def.syntax, status: def.status, ...s });
}
const typed = rows.filter((r) => r.tuples);
const untyped = rows.filter((r) => !r.tuples);
const reasonGroups = {};
for (const r of untyped) (reasonGroups[r.reason] ??= []).push(r.name);
const escape = typed.filter((r) => r.tuples.flat().some((slot) => slot.has("CustomIdent") || slot.has("string")));
const single = typed.filter((r) => r.tuples.length === 1 && r.tuples[0].length === 1 && !r.rest);

let out = `// Generated from mdn-data ${require("mdn-data/package.json").version}. Do not edit.\n`;
out += `import type { AngleValue, ColorValue, CustomIdent, Fn, ImageValue, LengthValue, Percent, PositionValue, ResolutionValue, TimeValue, UrlValue } from "./values";\n\n`;
for (const r of typed) out += `/** \`${r.syntax}\` */\nexport type ${camel(r.name)} = ${tupleType(r)};\n`;
out += `\n// Not typed yet (${untyped.length}):\n` + untyped.map((r) => `// ${r.name}: ${r.reason}`).join("\n") + "\n";
writeFileSync("out/properties.ts", out);
writeFileSync("out/values.ts", `declare const brand: unique symbol;
export type Brand<T extends string> = { readonly [brand]: T };
export type LengthValue = \`\${number}px\` | \`\${number}rem\` | \`\${number}em\` | \`\${number}vw\` | \`\${number}vh\` | \`\${number}ch\` | \`\${number}lh\` | \`\${number}dvh\` | \`\${number}dvw\` | \`\${number}cqw\` | \`\${number}cqh\` | 0 | "0" | Brand<"length">;
export type Percent = \`\${number}%\`;
export type TimeValue = \`\${number}s\` | \`\${number}ms\`;
export type AngleValue = \`\${number}deg\` | \`\${number}rad\` | \`\${number}turn\` | \`\${number}grad\`;
export type ResolutionValue = \`\${number}dpi\` | \`\${number}dpcm\` | \`\${number}dppx\` | \`\${number}x\`;
export type ColorValue = Brand<"color">;
export type ImageValue = Brand<"image">;
export type UrlValue = Brand<"url">;
export type PositionValue = Brand<"position">;
export type CustomIdent = string & {};
export type Fn<Name extends string> = Brand<\`fn:\${Name}\`>;
`);

console.log(`properties: ${rows.length} (non-obsolete, no custom)`);
console.log(`typed (bounded argument tuples): ${typed.length}  ${(100 * typed.length / rows.length).toFixed(1)}%`);
console.log(`  single value (plain union): ${single.length}`);
console.log(`  of which contain string/ident escape: ${escape.length}`);
console.log(`untyped: ${untyped.length}`);
const top = Object.entries(reasonGroups).sort((a, b) => b[1].length - a[1].length);
for (const [reason, names] of top.slice(0, 25)) console.log(`  ${String(names.length).padStart(3)}  ${reason}   e.g. ${names.slice(0, 4).join(", ")}`);
const ourList = ["display","position","flex","flex-direction","flex-grow","flex-shrink","align-items","justify-content","gap","flex-wrap","width","height","max-width","max-height","overflow","padding","padding-top","margin","margin-top","font-size","font-weight","font-family","line-height","letter-spacing","text-align","text-decoration","text-transform","white-space","color","background-color","background","border","border-color","border-width","border-style","border-radius","box-shadow","opacity","transition","transform","cursor","z-index"];
const ours = ourList.map((n) => rows.find((r) => r.name === n)).filter(Boolean);
console.log(`\ncssints current members (${ours.length}): typed ${ours.filter((r) => r.tuples).length}`);
for (const r of ours.filter((r) => !r.tuples)) console.log(`  ${r.name.padEnd(18)} ${r.reason}    ${r.syntax}`);
