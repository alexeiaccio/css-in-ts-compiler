// Emit the mdn-data syntax strings (verbatim) for a set of properties plus the closure of <refs> they use.
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const props = require("mdn-data/css/properties.json"), syn = require("mdn-data/css/syntaxes.json");
const want = process.argv.slice(2);
const P = {}, S = {};
const refs = (s) => [...s.matchAll(/<([^'>\s\[]+)(?:\s*\[[^\]]*\])?>/g)].map((m) => m[1]);
const prefs = (s) => [...s.matchAll(/<'([^']+)'>/g)].map((m) => m[1]);
const addP = (n) => { if (P[n] || !props[n]) return; P[n] = props[n].syntax; refs(P[n]).forEach(addS); prefs(P[n]).forEach(addP); };
const addS = (n) => { if (S[n] || !syn[n]) return; S[n] = syn[n].syntax; refs(S[n]).forEach(addS); prefs(S[n]).forEach(addP); };
want.forEach(addP);
const lit = (o) => JSON.stringify(o, null, 2).replace(/"([^"]+)":/g, (m, k) => /^[a-zA-Z_$][\w$]*$/.test(k) ? `${k}:` : m);
writeFileSync("mdn.ts", `// verbatim from mdn-data ${require("mdn-data/package.json").version}\nexport const properties = ${lit(P)} as const;\nexport const syntaxes = ${lit(S)} as const;\n`);
console.log("properties", Object.keys(P).length, "syntaxes", Object.keys(S).length, Object.keys(S).join(" "));
