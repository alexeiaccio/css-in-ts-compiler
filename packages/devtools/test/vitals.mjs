// The console report's parts that need no browser: the text charts, and the sheet reader over a happy-dom document (the
// browser's own copy, test/vitals-browser.mjs, holds what only a real CSSOM has: layers, @property, cross-origin sheets).
import assert from "node:assert/strict";
import { Window } from "happy-dom";

import { bars, heatmap, sparkline } from "../src/vitals/charts.ts";
import { costs, isTable } from "../src/vitals/cost.ts";
import { cssStats } from "../src/vitals/css.ts";
import { clear, history, record } from "../src/vitals/history.ts";

// ---------- the charts

assert.equal(sparkline([]), "", "an empty series is an empty line");
assert.equal(sparkline([1, 2, 3, 4, 5, 6, 7, 8]), "▁▂▃▄▅▆▇█", "the eight levels in order");
assert.equal(sparkline([3, 3, 3]), "▅▅▅", "a flat series keeps the middle");
assert.equal(
  sparkline(
    Array.from({ length: 100 }, (_, i) => i),
    10,
  ).length,
  10,
  "the last width values",
);
assert.equal(sparkline([0, 100], 1), "▅", "one sample has no range");

const heat = heatmap([10, 20, 40, 60]);
assert.equal(heat.cells, "%c  %c  %c  %c  ", "a cell is one %c");
assert.deepEqual(
  heat.styles.map((s) => s.slice(11, 18)),
  ["#2da44e", "#bf8700", "#bc4c00", "#cf222e"],
);
assert.equal(heatmap([], 10).cells, "", "no samples, no cells");
assert.equal(
  heatmap(
    Array.from({ length: 100 }, () => 10),
    8,
  ).styles.length,
  8,
  "one cell a bucket",
);

const chart = bars([
  { label: "a", value: 10, text: "10 B" },
  { label: "b", value: 5 },
  { label: "c", value: 0 },
]);
assert.equal(chart.length, 3);
assert.match(chart[0], /^a {9}█{20} 10 B$/, chart[0]);
assert.match(chart[1], /^b {9}█{10}\s* 5$/, chart[1]);
assert.match(chart[2], /^c\s+█\s+0$/, "a zero still gets a hair");

// ---------- the sheet reader

const window = new Window();
window.document.body.innerHTML = `<div class="used"></div><style>
  .used { color: #2563eb }
  .dead { color: red !important }
  div.used { font-family: Inter, sans-serif; margin: var(--space) }
  :root { --space: 4px; --orphan: 1px }
  @keyframes spin { to { transform: rotate(360deg) } }
  .spin { animation: spin 1s linear infinite }
</style>`;
const stats = cssStats(window.document);

assert.equal(stats.sheets, 1);
assert.equal(stats.blocked, 0);
assert.equal(stats.rules, 5);
assert.equal(stats.important, 1, "one !important");
assert.ok(stats.bytes > 0);
assert.deepEqual(stats.classes, ["dead", "spin", "used"], "every class of a selector, once");
assert.deepEqual(stats.unused, ["dead", "spin"], "no element carries these");
assert.ok(stats.colours.includes("#2563eb"), stats.colours.join());
assert.ok(stats.fonts.includes("inter, sans-serif"), stats.fonts.join());
assert.deepEqual(stats.custom.declared, ["--orphan", "--space"]);
assert.deepEqual(stats.custom.used, ["--space"]);
assert.deepEqual(stats.custom.orphaned, ["--orphan"]);
assert.deepEqual(stats.custom.missing, []);
assert.deepEqual(stats.keyframes.declared, ["spin"]);
assert.deepEqual(stats.keyframes.unused, []);
assert.deepEqual(stats.specificity, [0, 1, 1], "div.used is the worst");
assert.equal(stats.worst, "div.used");
assert.deepEqual(
  stats.layerBytes.map((x) => x.layer),
  ["unlayered"],
  "no layer in this sheet",
);

// ---------- the history across loads

const rows = new Map();
const vault = {
  getItem: (key) => rows.get(key) ?? null,
  setItem: (key, value) => void rows.set(key, value),
  removeItem: (key) => void rows.delete(key),
};
const load = (over) => ({
  at: 1_700_000_000_000,
  path: "/button",
  fcp: 400,
  lcp: 800,
  cls: 0,
  ttfb: 30,
  bytes: 64_000,
  ...over,
});
assert.deepEqual(history(vault), [], "an empty store is an empty series");
record(load({ lcp: 900 }), vault);
record(load({ lcp: 800 }), vault);
assert.deepEqual(
  history(vault).map((x) => x.lcp),
  [900, 800],
  "oldest first, the current last",
);
assert.equal(history(vault).length, 2);
for (let i = 0; i < 30; i++) record(load({ at: i }), vault);
assert.equal(history(vault).length, 20, "the series is capped");
assert.equal(history(vault).at(-1).at, 29, "the newest is kept");
rows.set("cssints-vitals", "not json");
assert.deepEqual(history(vault), [], "a broken store is an empty series");
rows.set("cssints-vitals", JSON.stringify([{ path: "/x" }, load({})]));
assert.equal(history(vault).length, 1, "a row that is not a load is dropped");
clear(vault);
assert.deepEqual(history(vault), [], "reset clears");

// ---------- the cost by call site

const table = {
  classes: {
    _a: { css: "._a{color:red}", sites: [0] },
    _b: { css: "._b{padding:4px}", sites: [0, 1] },
    _c: { css: "._c{display:grid}", sites: [1] },
    _orphan: { css: "._orphan{}" },
  },
  sites: [
    { file: "src/registry/button/button.tsx", line: 40 },
    { file: "src/registry/card/card.tsx", line: 12 },
  ],
};
assert.ok(isTable(table) && !isTable({ classes: {} }) && !isTable(null));
const cost = costs(table, new Set(["_a", "_c"]));
assert.equal(cost.calls, 2);
assert.equal(
  cost.total,
  "._a{color:red}".length + "._b{padding:4px}".length + "._c{display:grid}".length,
);
assert.deepEqual(
  cost.rows.map((x) => [x.file, x.line, x.classes, x.used]),
  [
    ["src/registry/button/button.tsx", 40, 2, 1],
    ["src/registry/card/card.tsx", 12, 1, 1],
  ],
  "a shared class counts once, at its first site; a class without a site is left out",
);
assert.equal(costs(table, new Set()).rows[0].used, 0);

console.log("vitals ok");
