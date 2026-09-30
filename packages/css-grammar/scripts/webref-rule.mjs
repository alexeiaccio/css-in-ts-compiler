// The rule that picks the properties taking the @webref/css grammar (docs/research/webref-grammars.md, section 4); it
// rewrites scripts/webref-properties.json, which extract.mjs reads. Run it (`bun run webref`, then `bun run extract`) after a
// Chrome, @webref/css, mdn-data or twin change. It needs an installed Chrome (playwright-core, channel "chrome"): CSS.supports
// is the judge. For every property that both sources have:
//  1. the webref grammar with its closure (webref's types, see extract.mjs) must parse, and every <type> and <'prop'> in it
//     resolve to a syntax or to something the twin reads itself;
//  2. draw N values from each grammar (gen.ts, seed SEED), plus one mutant of each, and let D be the values that exactly one
//     of the two twins accepts; no D, no change. Left out of D: paint() (CSS.supports rejects it without a worklet),
//     var(), env() and if() (Chrome takes any value with one), and the CSS-wide keywords (Chrome takes them everywhere, the
//     grammars do not carry them: the twin rejects `color: inherit`);
//  3. Chrome must agree with webref on all of D: accept what only webref accepts, reject what only mdn-data accepts. One
//     value against it and the property stays on mdn-data, "mixed" ones included;
//  4. fixed point: build the table from the properties that passed and run 2 and 3 again on it, until none drops out.
// Finally the hand overrides of extract.mjs (`PROP`) go through 2 and 3 against the final table and must pass.
// Each table is a scratch copy of src/ and gen.ts under out/webref-rule (the twin reads its table at load), so the twin
// judges mdn-data alone (`WEBREF=none`) and the candidate table side by side.
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import * as fc from "fast-check";
import { chromium } from "playwright-core";

const require = createRequire(import.meta.url);
const pkg = `${import.meta.dirname}/..`;
const LIST = `${import.meta.dirname}/webref-properties.json`;
const scratch = `${pkg}/out/webref-rule`;
const N = Number(process.env.N ?? 300);
const SEED = Number(process.env.SEED ?? 42);
// a var() in a drawn value is for the types (gen.ts); here Chrome would accept it whatever the grammar says
process.env.VAR = "0";

const web = require("@webref/css/css.json");
const CSS_WIDE = new Set(["initial", "inherit", "unset", "revert", "revert-layer", "revert-rule"]);
// named in webref grammars, read by the twin without a grammar (token types, math functions)
const UNGRAMMARED = new Set(["number-token", "url-token", "url-modifier", "math-function"]);
const exempt = (v) =>
  /(?<![-\w])(paint|var|env|if)\(/.test(v) || CSS_WIDE.has(v.trim().toLowerCase());

const extract = (spec, to) =>
  execFileSync(process.execPath, [`${import.meta.dirname}/extract.mjs`], {
    env: { ...process.env, WEBREF: spec, EXTRACT_OUT: to },
    encoding: "utf8",
  });
// a table is a scratch copy of the package with `spec` (a WEBREF value of extract.mjs) as its mdn.ts
const table = async (name, spec) => {
  const dir = `${scratch}/${name}`;
  rmSync(dir, { recursive: true, force: true });
  cpSync(`${pkg}/src`, `${dir}/src`, { recursive: true });
  mkdirSync(`${dir}/test`, { recursive: true });
  for (const f of ["gen.ts", "sync.ts"]) cpSync(`${pkg}/test/${f}`, `${dir}/test/${f}`);
  const out = extract(spec, `${dir}/src/mdn.ts`);
  const load = (f) => import(pathToFileURL(`${dir}/${f}`).href);
  const [mdn, gen, sync, core] = await Promise.all([
    load("src/mdn.ts"),
    load("test/gen.ts"),
    load("test/sync.ts"),
    load("src/twin-core.ts"),
  ]);
  return {
    props: mdn.properties,
    syns: mdn.syntaxes,
    arbFor: gen.arbFor,
    matches: sync.matches,
    parse: sync.parse,
    isNative: core.isNative,
    overrides: out
      .match(/^overrides: (.*)$/m)[1]
      .split(" ")
      .filter(Boolean),
  };
};

// step 1: what in the closure of `p` does not parse or does not resolve
const unresolved = (X, p) => {
  const seen = new Set(),
    bad = new Set();
  const text = (t) => {
    try {
      walk(X.parse(t));
    } catch {
      bad.add(`does not parse: ${t.slice(0, 60)}`);
    }
  };
  const walk = (n) => {
    switch (n[0]) {
      case "type":
        if (seen.has(n[1])) return;
        seen.add(n[1]);
        if (X.syns[n[1]]) text(X.syns[n[1]]);
        else if (!X.isNative(n[1]) && !UNGRAMMARED.has(n[1])) bad.add(`<${n[1]}>`);
        return;
      case "prop":
        if (seen.has(`'${n[1]}`)) return;
        seen.add(`'${n[1]}`);
        if (X.props[n[1]]) text(X.props[n[1]]);
        else bad.add(`<'${n[1]}'>`);
        return;
      case "fn":
        return walk(n[2]);
      case "alt":
      case "or":
      case "and":
      case "seq":
        return n[1].forEach(walk);
      case "opt":
      case "star":
      case "plus":
      case "list":
      case "bang":
      case "rep":
        return walk(n[1]);
    }
  };
  text(X.props[p]);
  return [...bad];
};

// the values of step 2 (the mutants are those of test/diff.ts)
const mutant = (v, i) => {
  const t = v.split(" "),
    j = i % t.length;
  const m = [
    [...t.slice(0, j), ...t.slice(j + 1)],
    [...t.slice(0, j + 1), ...t.slice(j)],
    t.length > 1 ? [...t.slice(1), t[0]] : [...t, t[0]],
  ][i % 3].join(" ");
  return m && m !== v ? m : null;
};
const drawn = new Map();
const draw = (X, p, key) => {
  const k = `${key}\0${p}`;
  if (!drawn.has(k)) {
    let vs = [];
    try {
      const a = X.arbFor(p);
      if (a) vs = fc.sample(a, { seed: SEED, numRuns: N }).flatMap((v, i) => [v, mutant(v, i)]);
    } catch {}
    drawn.set(k, vs.filter(Boolean));
  }
  return drawn.get(k);
};

// steps 1 and 2 for each property of `ps`: { bad } or { D: [{ v, web }] }, `web` being the twin of X accepting v
const prepare = (M, X, key, ps) =>
  new Map(
    ps.map((p) => {
      const bad = unresolved(X, p);
      if (bad.length) return [p, { bad }];
      const D = [];
      for (const v of new Set([...draw(M, p, "m"), ...draw(X, p, key)])) {
        if (exempt(v)) continue;
        let m, x;
        try {
          m = M.matches(M.props[p], v);
          x = X.matches(X.props[p], v);
        } catch (e) {
          return [p, { bad: [`twin: ${e.message}`] }];
        }
        if (m !== x) D.push({ v, web: x });
      }
      return [p, { D }];
    }),
  );

// step 3: one CSS.supports call for every value of D
const chromeOf = async (page, prepared) => {
  const cases = [...prepared].flatMap(([p, r]) => (r.D ?? []).map(({ v }) => [p, v]));
  const res = await page.evaluate((cs) => cs.map(([p, v]) => CSS.supports(p, v)), cases);
  const ok = new Map(cases.map(([p, v], i) => [`${p}\0${v}`, res[i]]));
  return new Map(
    [...prepared].map(([p, r]) => {
      if (r.bad) return [p, { status: "closure", bad: r.bad }];
      if (!r.D.length) return [p, { status: "same" }];
      const against = r.D.filter(({ v, web: w }) => ok.get(`${p}\0${v}`) !== w);
      if (against.length) return [p, { status: "mixed", against }];
      return [
        p,
        {
          status: "webref",
          wider: r.D.filter((d) => d.web).length,
          narrower: r.D.filter((d) => !d.web).length,
        },
      ];
    }),
  );
};

const old = JSON.parse(readFileSync(LIST, "utf8"));
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
console.log(
  `Chrome ${browser.version()}, @webref/css ${require("@webref/css/package.json").version}, N ${N}, seed ${SEED}`,
);
const M = await table("m", "none");
writeFileSync(`${scratch}/empty.json`, "[]");
const overrides = (await table("empty", `@${scratch}/empty.json`)).overrides;
// `declaration` (what style() takes) lists every property of the table, so in a table of all the candidates each one that
// reaches a <color> would inherit the failure of any other: step 1 is made on a table of the property alone
const resolvesAlone = async (p) => {
  const file = `${scratch}/alone/${p}`;
  mkdirSync(`${scratch}/alone`, { recursive: true });
  writeFileSync(`${file}.json`, JSON.stringify([p]));
  extract(`@${file}.json`, `${file}.ts`);
  const t = await import(pathToFileURL(`${file}.ts`).href);
  return !unresolved({ ...M, props: t.properties, syns: t.syntaxes }, p).length;
};
// a webref property that has a grammar, mdn-data has it too (an alias with its own grammar, `word-wrap`, counts)
const named = [
  ...new Set(
    web.properties
      .filter((p) => p.syntax && M.props[p.name] && !overrides.includes(p.name))
      .map((p) => p.name),
  ),
].sort();
const candidates = [];
for (const p of named) if (await resolvesAlone(p)) candidates.push(p);
console.log(`${named.length} candidates, ${candidates.length} with a closure that resolves`);

let L = candidates,
  verdicts,
  ownVerdicts;
for (let round = 0; ; round++) {
  writeFileSync(`${scratch}/list.json`, JSON.stringify(L));
  const X = await table(`r${round}`, `@${scratch}/list.json`);
  verdicts = await chromeOf(page, prepare(M, X, `r${round}`, L));
  const keep = L.filter((p) => verdicts.get(p).status === "webref");
  const count = (s) => L.filter((p) => verdicts.get(p).status === s).length;
  console.log(
    `round ${round}: ${L.length} properties -> ${keep.length} (same ${count("same")}, closure ${count("closure")}, mixed ${count("mixed")})`,
  );
  for (const p of (process.env.DEBUG ?? "").split(",").filter((q) => verdicts.has(q))) {
    const { status, against = [] } = verdicts.get(p);
    console.log(
      `  ${p}: ${status}`,
      against
        .slice(0, 6)
        .map(({ v, web: w }) => `${JSON.stringify(v)} (webref ${w ? "accepts" : "rejects"})`),
    );
  }
  if (keep.length === L.length) {
    // the hand overrides of extract.mjs, against the final table
    ownVerdicts = await chromeOf(page, prepare(M, X, `r${round}`, overrides));
    break;
  }
  L = keep;
}
await browser.close();
if (!process.env.KEEP) rmSync(scratch, { recursive: true, force: true });

const kind = (p) => {
  const { wider, narrower } = verdicts.get(p);
  return wider && narrower ? "both" : wider ? "webref wider" : "webref narrower";
};
const groups = {};
for (const p of L) (groups[kind(p)] ??= []).push(p);
console.log(`\n${L.length} properties take webref:`);
for (const [k, ps] of Object.entries(groups)) console.log(`  ${k} (${ps.length}): ${ps.join(" ")}`);
const added = L.filter((p) => !old.includes(p)),
  removed = old.filter((p) => !L.includes(p));
console.log(
  `against ${LIST.split("/").pop()} (${old.length}): +${added.join(" ") || "none"} -${removed.join(" ") || "none"}`,
);
writeFileSync(LIST, `${JSON.stringify(L, null, 2)}\n`);

let failed = false;
for (const [p, r] of ownVerdicts) {
  const text =
    r.status === "webref"
      ? "confirmed by Chrome"
      : r.status === "same"
        ? "no value differs from mdn-data"
        : `FAILS (${r.status}): ${JSON.stringify((r.against ?? []).slice(0, 3))}`;
  console.log(`override ${p}: ${text}`);
  failed ||= r.status !== "webref";
}
process.exit(failed ? 1 : 0);
