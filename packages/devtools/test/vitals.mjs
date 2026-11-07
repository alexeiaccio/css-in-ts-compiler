// The console report's parts that need no browser: the text charts, and the sheet reader over a happy-dom document (the
// browser's own copy, test/vitals-browser.mjs, holds what only a real CSSOM has: layers, @property, cross-origin sheets).
import assert from "node:assert/strict";
import { Window } from "happy-dom";

import { bars, heatmap, sparkline } from "../src/vitals/charts.ts";
import { cssStats } from "../src/vitals/css.ts";

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

console.log("vitals ok");
