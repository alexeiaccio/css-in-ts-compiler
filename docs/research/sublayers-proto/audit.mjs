// Every pair of properties where one contains the other, against the order sheet.ts gives them.
//   node audit.mjs            prints the summary and writes audit.json
// Truth is Chrome's: a property set to `initial` expands to its longhands (reset-only ones too). A contains B when Chrome's
// leaves of A are a strict superset of B's. The engine is right for the pair when A sorts before B whatever the class names
// are, so the sheet is rendered twice with the class names in opposite order: a pair that flips between the two is a tie
// that the class hash decides.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { ALL_DEPTH, depth, here, launch, pkg, truthOf, webrefLeaves } from "./lib.mjs";

const { hashClass, PROPS } = await import(pathToFileURL(join(pkg, "src/lib.ts")).href);
const { renderSheet } = await import(pathToFileURL(join(pkg, "src/plugin.ts")).href);
const { Effect } = await import(
  pathToFileURL(
    (await import("node:module")).createRequire(join(pkg, "package.json")).resolve("effect"),
  ).href
);

const props = [...new Set(Object.values(PROPS))].sort();

const browser = await launch();
const page = await browser.newPage();
const truth = await truthOf(page, props);
const version = browser.version();
await browser.close();

const known = props.filter((p) => truth[p]);
const unsupported = props.filter((p) => !truth[p]);

// The real renderSheet over fake rules, twice.
const order = (names) => {
  const rules = globalThis.__cssints.rules;
  const cls = names.map((_, i) => `_${String(i).padStart(4, "0")}`);
  const index = new Map();
  names.forEach((p, i) => {
    rules.set(cls[i], { layer: "_.a", cond: [], wrap: [], prop: p, css: `.${cls[i]}{${p}:x}` });
    index.set(cls[i], p);
  });
  const css = Effect.runSync(renderSheet(cls));
  for (const c of cls) rules.delete(c);
  return new Map([...css.matchAll(/\.(_\d{4})\{/g)].map((m, i) => [index.get(m[1]), i]));
};
const asc = order(known);
const desc = order([...known].reverse());

const contains = (a, b) => {
  const B = new Set(truth[a]);
  return truth[b].length < truth[a].length && truth[b].every((l) => B.has(l));
};
const wrong = [];
const tie = [];
const depthTie = [];
const webrefBad = [];
// the comparator on the leaves of the spec data instead of mdn-data's `computed`
const webrefWidth = (p) => (p === "all" ? truth.all.length : new Set(webrefLeaves(p)).size);
let pairs = 0;
let partial = 0;
const partialList = [];
for (const a of known)
  for (const b of known) {
    if (a === b) continue;
    if (contains(a, b)) {
      pairs++;
      const ok1 = asc.get(a) < asc.get(b);
      const ok2 = desc.get(a) < desc.get(b);
      if (!ok1 && !ok2) wrong.push([a, b]);
      else if (ok1 !== ok2) tie.push([a, b]);
      if (webrefWidth(a) <= webrefWidth(b)) webrefBad.push([a, b]);
      const da = a === "all" ? ALL_DEPTH : depth(a);
      const db = b === "all" ? ALL_DEPTH : depth(b);
      if (da <= db) depthTie.push([a, b, da, db]);
    } else if (a < b) {
      const A = new Set(truth[a]);
      if (truth[b].some((l) => A.has(l)) && !contains(b, a)) {
        partial++;
        partialList.push([a, b]);
      }
    }
  }

// A tie is decided by the class name, which hashes the value too: of 200 value pairs per tied pair, how many put the
// contained property after its container (the right order), and how many before it.
// `all` is left out: one value of it meets 424 properties, so its pairs are not independent draws.
let tiedRight = 0;
let tiedTotal = 0;
for (const [a, b] of tie.filter(([a]) => a !== "all"))
  for (let k = 0; k < 200; k++) {
    tiedTotal++;
    if (hashClass([a, `v${k}`]) < hashClass([b, `w${k}`])) tiedRight++;
  }

const group = (list) => {
  const by = new Map();
  for (const [a, b] of list) (by.get(a) ?? by.set(a, []).get(a)).push(b);
  return [...by].map(
    ([a, bs]) =>
      `${a} > ${bs.length > 6 ? `${bs.slice(0, 6).join(", ")}, … (${bs.length})` : bs.join(", ")}`,
  );
};
const summary = {
  chrome: version,
  properties: props.length,
  unsupportedInChrome: unsupported.length,
  containingPairs: pairs,
  sortWrong: wrong.length,
  sortTieHashDecides: tie.length,
  tieOutcomeRightShare: tiedTotal ? +(tiedRight / tiedTotal).toFixed(3) : null,
  webrefCountWrongOrTie: webrefBad.length,
  depthSublayersWrongOrTie: depthTie.length,
  partialOverlapPairs: partial,
};
console.log(summary);
console.log(
  "\nsort puts the contained property after the container's... wrong in both class orders:",
);
console.log(group(wrong).join("\n") || "(none)");
console.log("\nTies decided by the class hash:");
console.log(group(tie).join("\n") || "(none)");
console.log("\nCount of the spec leaves (@webref/css) would still get wrong or tie:");
console.log(group(webrefBad).join("\n") || "(none)");
console.log("\nDepth sublayers: container not strictly above the contained (depth tie):");
console.log(group(depthTie.map(([a, b]) => [a, b])).join("\n") || "(none)");
writeFileSync(
  join(here, "audit.json"),
  `${JSON.stringify({ summary, wrong, tie, webrefBad, depthTie, partialList, unsupported }, null, 1)}\n`,
);
process.exit(0);
