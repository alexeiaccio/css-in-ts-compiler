// node diff-support.ts — the "twin accepts, Chrome rejects" rows of diff.ts (same samples, seed and N), split by
// what explains them now: a support warning that names the Chrome version under test, a prose rule, or nothing.
// Also lists the reverse: warnings or rule errors on values Chrome accepts.
import fc from "fast-check";
import { chromium } from "playwright-core";

import { arbFor } from "./gen.ts";
import { properties } from "./mdn.ts";
import { checkRules } from "./rules.ts";
import { support } from "./support.ts";
import { matches } from "./twin.ts";

const SEED = Number(process.env.SEED ?? 42);
const N = Number(process.env.N ?? 20);
const props: Record<string, string> = properties;

// same cases as diff.ts step 2
const cases: { p: string; v: string; kind: string }[] = [];
for (const p of Object.keys(props)) {
  const a = arbFor(p);
  if (!a) continue;
  fc.sample(a, { seed: SEED, numRuns: N }).forEach((v, i) => {
    cases.push({ p, v, kind: "gen" });
    const t = v.split(" ");
    const j = i % t.length;
    const mut = [[...t.slice(0, j), ...t.slice(j + 1)], [...t.slice(0, j + 1), ...t.slice(j)], t.length > 1 ? [...t.slice(1), t[0]] : [...t, t[0]]][i % 3]!.join(" ");
    if (mut && mut !== v) cases.push({ p, v: mut, kind: "mut" });
  });
}

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
const chrome: boolean[] = await page.evaluate((cs) => cs.map(([p, v]) => CSS.supports(p, v)), cases.map((c) => [c.p, c.v] as [string, string]));
const major = browser.version().split(".")[0];
await browser.close();

const why = (p: string, v: string) => {
  try {
    checkRules(p, v);
  } catch {
    return "prose rule";
  }
  return support(p, v).some((w) => w.lacking.includes(`chrome ${major}`)) ? "support warning" : "unexplained";
};

const groups = new Map<string, string[]>();
cases.forEach((c, i) => {
  if (!matches(props[c.p]!, c.v)) return;
  const w = why(c.p, c.v);
  const key = chrome[i] ? (w === "unexplained" ? null : `chrome accepts, but ${w}`) : `twin accepts, chrome rejects: ${w}`;
  if (key) groups.set(key, [...(groups.get(key) ?? []), `${c.kind} ${c.p}: ${JSON.stringify(c.v)}`]);
});
const rejected = [...groups].filter(([k]) => k.startsWith("twin")).reduce((n, [, xs]) => n + xs.length, 0);
console.log(`# twin accepts, Chrome ${major} rejects: ${rejected} rows`);
for (const [k, xs] of [...groups].sort()) {
  console.log(`\n## ${k}: ${xs.length}`);
  xs.forEach((x) => console.log(`  ${x}`));
}
